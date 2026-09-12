/**
 * AgriSense Pro - Detailed Device Node Screen
 * Redesigned per exact layout specification:
 * - Top Node Summary Card with Last Sync, Connection, MQTT
 * - 2x2 Sensors Grid with big values, status, and Inspect Sensor links
 * - Status Card (Soil Status / Weather Status / Vision Status)
 * - Node Information (Node ID, Device, Connection, Sensors)
 * - Action buttons: [Check Connection] [Inspect Sensors]
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  ArrowLeft, Droplets, Thermometer, Activity, FlaskConical,
  Sun, CloudRain, Camera, RefreshCw, ArrowRight, Settings,
  CheckCircle2, CloudSun
} from 'lucide-react';

const HARDWARE_NODE_REGISTRY = [
  {
    id: 'SOIL-01',
    nodeKey: 'soil_node',
    name: 'SOIL-01',
    type: 'Soil Monitoring Node',
    category: 'Soil Nodes',
    icon: Droplets,
    color: '#15803D'
  },
  {
    id: 'WEATHER-01',
    nodeKey: 'weather_node',
    name: 'WEATHER-01',
    type: 'Weather Station Node',
    category: 'Weather',
    icon: CloudSun,
    color: '#0EA5E9'
  },
  {
    id: 'CAM-01',
    nodeKey: 'vision_node',
    name: 'CAM-01',
    type: 'Vision & AI Node',
    category: 'Cameras',
    icon: Camera,
    color: '#8B5CF6'
  }
];

const DeviceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sensorData, mqttStatus, lastGlobalUpdate, devices, rawDevices } = useTelemetry();

  const searchParams = new URLSearchParams(location.search);
  const paramNodeId = searchParams.get('node') || searchParams.get('id');
  const targetNodeId = location.state?.nodeId || location.state?.device?.id || paramNodeId || 'SOIL-01';

  const [selectedNodeId, setSelectedNodeId] = useState(targetNodeId);

  React.useEffect(() => {
    const nextTarget = location.state?.nodeId || location.state?.device?.id || paramNodeId;
    if (nextTarget) {
      setSelectedNodeId(nextTarget);
    }
  }, [location.state, location.search]);

  const returnPath = location.state?.from || '/device-area';

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const isMqttLive = mqttStatus === 'connected';

  // Compute live synchronized state for the active node
  const activeNode = useMemo(() => {
    const matched = HARDWARE_NODE_REGISTRY.find(n => n.id === selectedNodeId) || {
      id: selectedNodeId,
      nodeKey: 'soil_node',
      name: selectedNodeId,
      type: 'Custom IoT Node',
      category: 'Soil Nodes',
      icon: Droplets,
      color: '#15803D'
    };

    let isOnline = false;
    let lastSeenText = 'Disconnected';

    if (matched.id === 'SOIL-01') {
      const hasSoilData = sensorData?.soil?.moisture != null || sensorData?.soil?.temp != null;
      const isSoilActive = devices?.soil_node?.status === 'ACTIVE' || rawDevices?.soil_node?.status === 'ACTIVE';
      isOnline = isMqttLive && (isSoilActive || hasSoilData);
      lastSeenText = isOnline 
        ? (lastGlobalUpdate || 'Live Telemetry') 
        : 'Disconnected';
    } else if (matched.id === 'WEATHER-01') {
      const hasWeatherData = sensorData?.weather?.temp != null || sensorData?.weather?.humidity != null;
      const isWeatherActive = devices?.weather_node?.status === 'ACTIVE' || rawDevices?.weather_node?.status === 'ACTIVE';
      isOnline = isMqttLive && (isWeatherActive || hasWeatherData);
      lastSeenText = isOnline 
        ? (lastGlobalUpdate || 'Live Telemetry') 
        : 'Disconnected';
    } else if (matched.id === 'CAM-01') {
      const isCamActive = devices?.vision_node?.status === 'ACTIVE' || rawDevices?.vision_node?.status === 'ACTIVE';
      isOnline = isMqttLive && isCamActive;
      lastSeenText = isOnline ? (lastGlobalUpdate || 'Stream Ready') : 'Disconnected';
    } else {
      isOnline = isMqttLive;
      lastSeenText = isMqttLive ? 'Node Linked' : 'Disconnected';
    }

    return {
      ...matched,
      isOnline,
      status: isOnline ? 'Online' : 'Offline',
      lastSeen: lastSeenText
    };
  }, [selectedNodeId, sensorData, devices, rawDevices, isMqttLive, lastGlobalUpdate]);

  // Real connected sensors mapped to active node
  const connectedSensors = useMemo(() => {
    if (activeNode.id === 'SOIL-01') {
      const m = sensorData?.soil?.moisture;
      const t = sensorData?.soil?.temp;
      const p = sensorData?.soil?.ph;
      const npkObj = sensorData?.soil?.npk;

      return [
        {
          id: 'moisture',
          label: 'Soil Moisture',
          icon: Droplets,
          color: '#15803D',
          value: m != null ? `${m} %` : '-- %',
          status: m != null ? 'Active' : 'Offline',
          sensorId: 'moisture'
        },
        {
          id: 'temp',
          label: 'Soil Temperature',
          icon: Thermometer,
          color: '#FF6B35',
          value: t != null ? `${t} °C` : '-- °C',
          status: t != null ? 'Active' : 'Offline',
          sensorId: 'temp'
        },
        {
          id: 'ph',
          label: 'Soil pH',
          icon: Activity,
          color: '#14B8A6',
          value: p != null ? `${p} pH` : '-- pH',
          status: p != null ? 'Active' : 'Offline',
          sensorId: 'ph'
        },
        {
          id: 'n',
          label: 'NPK Ratio',
          icon: FlaskConical,
          color: '#8B5CF6',
          value: npkObj?.n != null ? `${npkObj.n} : ${npkObj.p} : ${npkObj.k}` : '-- : -- : --',
          status: npkObj?.n != null ? 'Active' : 'Offline',
          sensorId: 'n'
        }
      ];
    }

    if (activeNode.id === 'WEATHER-01') {
      const wt = sensorData?.weather?.temp;
      const wh = sensorData?.weather?.humidity;
      const wl = sensorData?.weather?.lightIntensity;
      const wr = sensorData?.weather?.rainLevel;

      return [
        {
          id: 'weather_temp',
          label: 'Air Temperature',
          icon: Thermometer,
          color: '#FF6B35',
          value: wt != null ? `${wt} °C` : '-- °C',
          status: wt != null ? 'Active' : 'Offline',
          sensorId: 'weather_temp'
        },
        {
          id: 'humidity',
          label: 'Air Humidity',
          icon: Droplets,
          color: '#4DA8FF',
          value: wh != null ? `${wh} %` : '-- %',
          status: wh != null ? 'Active' : 'Offline',
          sensorId: 'humidity'
        },
        {
          id: 'light',
          label: 'Sunlight Intensity',
          icon: Sun,
          color: '#EAB308',
          value: wl != null ? `${wl} lx` : '-- lx',
          status: wl != null ? 'Active' : 'Offline',
          sensorId: 'light'
        },
        {
          id: 'rain',
          label: 'Precipitation',
          icon: CloudRain,
          color: '#3B82F6',
          value: wr != null ? `${wr} mm` : '-- mm',
          status: wr != null ? 'Active' : 'Offline',
          sensorId: 'rain'
        }
      ];
    }

    // Camera Node
    return [
      {
        id: 'vision_stream',
        label: 'Field Camera Stream',
        icon: Camera,
        color: '#8B5CF6',
        value: 'Field B Stream',
        status: isMqttLive ? 'Active' : 'Offline',
        route: '/camera'
      }
    ];
  }, [activeNode, sensorData, isMqttLive]);

  const activeSensorsCount = useMemo(() => {
    return connectedSensors.filter(s => s.status === 'Active').length;
  }, [connectedSensors]);

  // Handle Verify Connection
  const handleVerifyConnection = () => {
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      if (isMqttLive) {
        setVerificationResult({
          success: true,
          message: `${activeNode.id} is connected via HiveMQ WSS broker`
        });
      } else {
        setVerificationResult({
          success: false,
          message: `MQTT broker disconnected. Check network connection.`
        });
      }
      setTimeout(() => setVerificationResult(null), 4000);
    }, 600);
  };

  const Icon = activeNode.icon;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: '100%'
    }}>

      {/* ─── TOP BAR: BACK & NODE SELECTOR ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          onClick={() => navigate(returnPath)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '6px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Device Manager</span>
        </button>

        {/* Node Switcher Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {HARDWARE_NODE_REGISTRY.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '10px',
                border: selectedNodeId === node.id ? 'none' : '1px solid var(--border-main)',
                background: selectedNodeId === node.id ? '#15803D' : 'var(--bg-card)',
                color: selectedNodeId === node.id ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: selectedNodeId === node.id ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              {node.id}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 1. TOP NODE CARD ─── */}
      <motion.div
        key={activeNode.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '20px',
          border: '1.5px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px'
        }}
      >
        {/* Top Header: Icon + Title & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: activeNode.isOnline ? `${activeNode.color}15` : '#F1F5F9',
              border: `1px solid ${activeNode.isOnline ? activeNode.color + '30' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeNode.isOnline ? activeNode.color : '#64748B'
            }}>
              <Icon size={24} strokeWidth={2.4} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {activeNode.name}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                {activeNode.type}
              </div>
            </div>
          </div>

          {/* Status pill: ● Offline or ● Online */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '12px',
            background: activeNode.isOnline ? '#DCFCE7' : '#FEF2F2',
            border: `1px solid ${activeNode.isOnline ? '#86EFAC' : '#FCA5A5'}`,
            color: activeNode.isOnline ? '#15803D' : '#DC2626',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            <span style={{ fontSize: '0.65rem' }}>●</span>
            <span>{activeNode.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </motion.div>

      {/* Verification Toast */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              background: verificationResult.success ? '#DCFCE7' : '#FEE2E2',
              border: `1px solid ${verificationResult.success ? '#86EFAC' : '#FCA5A5'}`,
              color: verificationResult.success ? '#15803D' : '#DC2626',
              borderRadius: '14px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{verificationResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. SENSORS SECTION (2x2 Grid) ─── */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
            Sensors on {activeNode.name}
          </h4>
          <span style={{ 
            fontSize: '0.74rem', 
            fontWeight: 800, 
            color: activeSensorsCount > 0 ? '#15803D' : '#DC2626'
          }}>
            {activeSensorsCount > 0 ? `${activeSensorsCount} Active` : `${connectedSensors.length} Offline`}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: connectedSensors.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {connectedSensors.map(sensor => {
            const SensorIcon = sensor.icon;
            const isSensorLive = sensor.status === 'Active';

            return (
              <motion.div
                key={sensor.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (sensor.sensorId) {
                    navigate('/sensor-detail', { state: { sensorId: sensor.sensorId, from: `/device-detail?node=${activeNode.id}` } });
                  } else if (sensor.route) {
                    navigate(sensor.route);
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  padding: '16px',
                  border: '1.5px solid var(--border-main)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '138px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Row 1: Icon on left, Status Badge on right */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: `${sensor.color}15`,
                    color: sensor.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SensorIcon size={20} strokeWidth={2.4} />
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: isSensorLive ? '#15803D' : '#DC2626'
                  }}>
                    <span style={{ fontSize: '0.55rem' }}>●</span>
                    <span>{isSensorLive ? 'Active' : 'Offline'}</span>
                  </div>
                </div>

                {/* Row 2: Sensor Name with its value beside it (same font size, increased for NPK ratio) */}
                <div style={{ 
                  marginTop: '16px', 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  justifyContent: 'space-between', 
                  gap: '8px' 
                }}>
                  <span style={{ 
                    fontSize: sensor.id === 'n' ? '1.02rem' : '0.92rem', 
                    fontWeight: 800, 
                    color: 'var(--text-main)', 
                    lineHeight: 1.2 
                  }}>
                    {sensor.label}
                  </span>
                  <span style={{ 
                    fontSize: sensor.id === 'n' ? '1.02rem' : '0.92rem', 
                    fontWeight: 950, 
                    color: 'var(--text-main)', 
                    letterSpacing: sensor.id === 'n' ? '0.04em' : '-0.01em',
                    flexShrink: 0 
                  }}>
                    {sensor.value}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. NODE INFORMATION ─── */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 10px 4px' }}>
          Node Information
        </h4>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '22px',
          padding: '16px 20px',
          border: '1.5px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {[
            { label: 'Node ID', value: activeNode.id },
            { label: 'Device', value: activeNode.type },
            { label: 'Connection', value: activeNode.isOnline ? 'Connected' : 'Disconnected', color: activeNode.isOnline ? '#15803D' : 'var(--text-main)' },
            { label: 'Sensors', value: `${connectedSensors.length} Sensors` }
          ].map((row, idx, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: idx < arr.length - 1 ? '1px solid var(--border-main)' : 'none'
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: '0.84rem', color: row.color || 'var(--text-main)', fontWeight: 800 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DeviceDetails;
