import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mqttService from '../api/mqttService';
import { MASTER_CONFIG } from '../setup';
import { processMqttMessage } from '../engines/sensorController';
import { INITIAL_SENSOR_DATA } from '../types/sensorModel';
import { processDeviceState, calculateSystemOverview } from '../api/deviceService';
import { db } from '../api/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { calculateNodeHealth, calculateOverallHealth, getAIv2Recommendations } from '../logic/healthEngine';

const TelemetryContext = createContext();

export const TelemetryProvider = ({ children, user, farmInfo, nodePower }) => {
  const [sensorData, setSensorData] = useState(INITIAL_SENSOR_DATA);
  const [sensorHistory, setSensorHistory] = useState([]);

  const [devices, setDevices] = useState({
    'soil_node': processDeviceState('soil_node', 'soil', null),
    'weather_node': processDeviceState('weather_node', 'weather', null),
    'vision_node': processDeviceState('vision_node', 'vision', null)
  });
  const [systemOverview, setSystemOverview] = useState({
    total_nodes: 3, active_nodes: 0, partial_nodes: 0, offline_nodes: 3,
    overall_status: 'OFFLINE', health_percent: 0, nodes: []
  });
  const [mqttStatus, setMqttStatus] = useState('disconnected');
  const [cloudSyncStatus] = useState('Active');
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState(null);
  
  // 🛰️ Ref used by MQTT callback closure to always access latest parsed data
  // without causing stale closure issues. setSensorData is called directly for
  // immediate React re-renders — no throttle needed for real hardware (2-5s intervals).
  const sensorDataRef = useRef(sensorData);
  const connectionRef = useRef(null);

  useEffect(() => {
    // ✅ FIX: Use raw email for MQTT topic — must match firmware TOPIC_SENSORS exactly.
    // The firmware builds: agrisense/{USER_EMAIL}/field_b/sensors
    // Do NOT normalize/transform the email — it will break topic matching.
    const primary = (user?.email || 'agrisense_pro').trim();
    const secondary = 'field_b';

    const topic = `agrisense/${primary}/${secondary}/#`;

    if (connectionRef.current === topic) return;
    connectionRef.current = topic;

    const handleMqttMessage = (topic, data) => {
      if (!data || typeof data !== 'object') return;

      const timestamp = Date.now();
      const topicLower = topic.toLowerCase();

      // ✅ FIXED: Always update device status from topic routing first,
      // regardless of node name. This prevents the bug where checkAndSet()
      // results were silently discarded by the early return below.
      setDevices(prevDevs => {
        const nextDevs = { ...prevDevs };

        const checkAndSet = (key) => {
          nextDevs[key] = {
            ...nextDevs[key],
            status: 'ACTIVE',
            lastUpdate: timestamp
          };
        };

        // ✅ FIX: Robust node detection for unified payloads.
        // Even if the data isn't nested under "soil:", if it contains moisture, it's a soil node.
        const topicSoil = topicLower.includes('soil');
        const topicWeather = topicLower.includes('weather');
        const topicVision = topicLower.includes('vision');

        if (topicSoil || data.soil || data.moisture || data.m || data.ph) checkAndSet('soil_node');
        if (topicWeather || data.weather || data.temp || data.humidity || data.ldr) checkAndSet('weather_node');
        if (topicVision || data.vision || data.detection) checkAndSet('vision_node');

        setSystemOverview(calculateSystemOverview(nextDevs));
        return nextDevs;
      });

      // ✅ FIX: Removed email gate — MQTT topic isolation is sufficient security.
      // The subscription topic already filters by user email:
      //   agrisense/{user_email}/field_b/#
      // The old email check caused ALL sensor data to be silently dropped whenever
      // there was a case difference, typo, or any mismatch between the hardcoded
      // firmware email and the Firebase login email.
      //
      // We now process any message that arrives on our subscribed topic.
      if (data && typeof data === 'object') {
        const updatedSensorData = processMqttMessage(topic, data, sensorDataRef.current);
        if (updatedSensorData !== sensorDataRef.current) {
          sensorDataRef.current = updatedSensorData;
          setSensorData(updatedSensorData); 
        }
      }

      setLastGlobalUpdate(new Date().toLocaleTimeString());
    };

    // ✅ FIX: Pass raw email string as primaryId so mqttService builds the correct topic
    mqttService.connect(primary, secondary, handleMqttMessage, (status) => setMqttStatus(status));

    return () => {
      mqttService.disconnect();
      connectionRef.current = null;
    };
  }, [farmInfo?.projectName, farmInfo?.name, user?.email]);

  useEffect(() => {
    const watchdog = setInterval(() => {
      const now = Date.now();
      setDevices(prevDevs => {
        let changed = false;
        const nextDevs = { ...prevDevs };
        Object.keys(nextDevs).forEach(id => {
          if (nextDevs[id].status !== 'OFFLINE') {
            if (!nextDevs[id].lastUpdate || (now - nextDevs[id].lastUpdate > 15000)) {
              nextDevs[id] = { ...nextDevs[id], status: 'OFFLINE' };
              changed = true;
            }
          }
        });
        if (changed) setSystemOverview(calculateSystemOverview(nextDevs));
        return changed ? nextDevs : prevDevs;
      });
    }, 5000);
    return () => clearInterval(watchdog);
  }, []);

  useEffect(() => {
    let tick = 0;
    const livePulse = setInterval(() => {
      const currentData = sensorDataRef.current;
      // ✅ FIX #8: Only snapshot history when we have real sensor values.
      // Avoids polluting history with initial null-state entries.
      if (!currentData || currentData.soil?.moisture == null) return;
      const now = Date.now();
      const payload = { ...currentData, timestamp: now, node: "unified_snapshot" };
      setSensorHistory(prev => [...prev, payload].slice(-2000));
      
      // ✅ FIX: Store telemetry in Firestore periodically for historical charts
      tick++;
      if (tick % 12 === 0 && user?.email) {
        try {
          const docRef = doc(db, "farmers", user.email, "telemetry", String(now));
          setDoc(docRef, payload, { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }, 5000);

    return () => clearInterval(livePulse);
  }, [user?.email]);

  // 🚀 PERFORMANCE: Hydrate Latest Sensor Telemetry from Cloud on Initial Mount
  useEffect(() => {
    if (!user?.email) return;
    
    const hydrate = async () => {
      try {
        const telRef = collection(db, "farmers", user.email, "telemetry");
        const q = query(telRef, orderBy("timestamp", "desc"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const latest = snap.docs[0].data();
          setSensorData(prev => {
            const hasLive = prev.soil?.moisture != null;
            if (hasLive) return prev; // Live MQTT always takes precedence
            return {
              ...prev,
              soil: latest.soil || prev.soil,
              weather: latest.weather || prev.weather,
              vision: latest.vision || prev.vision,
            };
          });
        }
      } catch (err) {
        console.warn("⚠️ [HYDRATION] Latest state fetch failed (likely missing index or empty coll)");
      }
    };
    
    hydrate();
  }, [user?.email]);

  // 🛰️ DATA MASKING ENGINE: Zeroes out data if node is manually disabled OR hardware goes OFFLINE
  const maskedSensorData = useMemo(() => {
    const isSoilDown    = nodePower?.soil    === false || devices.soil_node?.status    === 'OFFLINE';
    const isWeatherDown = nodePower?.weather === false || devices.weather_node?.status === 'OFFLINE';
    const isVisionDown  = nodePower?.vision  === false || devices.vision_node?.status  === 'OFFLINE';

    return {
      ...sensorData,
      soil:    isSoilDown    ? {} : sensorData.soil,
      weather: isWeatherDown ? {} : sensorData.weather,
      vision:  isVisionDown  ? {} : sensorData.vision,
    };
  }, [sensorData, nodePower, devices]);

  // ✅ FIX #9: Mask devices status based on nodePower. 
  // Ensures Dashboard reflects 'OFFLINE' when user manually disables a node.
  const maskedDevices = useMemo(() => {
    const next = { ...devices };
    if (nodePower?.soil    === false) next.soil_node    = { ...next.soil_node,    status: 'OFFLINE' };
    if (nodePower?.weather === false) next.weather_node = { ...next.weather_node, status: 'OFFLINE' };
    if (nodePower?.vision  === false) next.vision_node  = { ...next.vision_node,  status: 'OFFLINE' };
    return next;
  }, [devices, nodePower]);

  const fetchHistory = async (startTime) => {
    if (!user?.email) return [];
    try {
      const telRef = collection(db, "farmers", user.email, "telemetry");
      const q = query(
        telRef, 
        where("timestamp", ">=", startTime),
        orderBy("timestamp", "asc"),
        limit(5000)
      );
      const telSnap = await getDocs(q);
      const history = telSnap.docs.map(d => d.data());
      if (history.length > 0) setSensorHistory(history);
      return history;
    } catch (err) {
      return [];
    }
  };

  const systemHealth = useMemo(() => ({
    soil: calculateNodeHealth('soil', maskedSensorData.soil),
    weather: calculateNodeHealth('weather', maskedSensorData.weather)
  }), [maskedSensorData]);

  const farmHealthScore = useMemo(() => calculateOverallHealth(systemHealth, maskedDevices), [systemHealth, maskedDevices]);
  const recommendations = useMemo(() => sensorData?.soil?.moisture != null ? getAIv2Recommendations(sensorData) : [], [sensorData]);

  const maskedSystemOverview = useMemo(() => calculateSystemOverview(maskedDevices), [maskedDevices]);

  const value = useMemo(() => ({
    sensorData: maskedSensorData,
    sensorHistory,
    devices: maskedDevices,
    rawDevices: devices, // Added rawDevices to allow control panel to see true hardware status
    systemOverview: maskedSystemOverview,
    mqttStatus,
    cloudSyncStatus,
    lastGlobalUpdate,
    setSensorHistory,
    fetchHistory,
    systemHealth,
    farmHealthScore,
    recommendations
  }), [
    maskedSensorData, sensorHistory, maskedDevices, devices, maskedSystemOverview, mqttStatus,
    cloudSyncStatus, lastGlobalUpdate, systemHealth, farmHealthScore, recommendations
  ]);

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
};

export const useTelemetry = () => useContext(TelemetryContext);
