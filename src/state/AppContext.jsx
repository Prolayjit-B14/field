/**
 * AgriSense Pro v19.1.0 Core State Manager
 * Handles Auth, User Profile, Branding, and Global Settings.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MASTER_CONFIG } from '../setup';
import { db, auth } from '../api/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { INITIAL_API_WEATHER } from '../types/sensorModel';
import { ACTUATORS } from '../logic/healthEngine';
import mqttService from '../api/mqttService';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // ─── CORE STATE ──────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agrisense_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [currentGPS, setCurrentGPS] = useState({ lat: null, lng: null, accuracy: null, city: 'Scanning for Field...' });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiWeather, setApiWeather] = useState(INITIAL_API_WEATHER);
  const [apiForecast, setApiForecast] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [connectivityStatus, setConnectivityStatus] = useState('Online');
  
  const [actuators, setActuators] = useState({
    [ACTUATORS.PUMP]:    false,
    [ACTUATORS.VALVE]:   false,
    [ACTUATORS.SPRAYER]: false,
    [ACTUATORS.BUZZER]:  false,
    [ACTUATORS.DISPLAY]: false,
    [ACTUATORS.LIGHT]:   false,
  });

  const [nodePower, setNodePower] = useState(() => {
    try {
      const saved = localStorage.getItem('agrisense_node_power');
      return saved ? JSON.parse(saved) : { soil: true, weather: true, vision: true };
    } catch (e) {
      return { soil: true, weather: true, vision: true };
    }
  });

  const [farmInfo, setFarmInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('agrisense_branding');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed || {
        name: MASTER_CONFIG.FARM_NAME,
        projectName: MASTER_CONFIG.PROJECT_NAME,
        tagline: MASTER_CONFIG.TAGLINE,
        version: MASTER_CONFIG.VERSION
      };
    } catch (e) {
      return {
        name: MASTER_CONFIG.FARM_NAME,
        projectName: MASTER_CONFIG.PROJECT_NAME,
        tagline: MASTER_CONFIG.TAGLINE,
        version: MASTER_CONFIG.VERSION
      };
    }
  });

  const [profileMeta, setProfileMeta] = useState({
    role: 'Industrial Controller',
    accessLevel: 'Admin (L5)',
    nodesManaged: 4,
    lastLogin: 'Today',
    commandsIssued: 0,
    alertsResolved: 0,
    notifications: { push: true, email: false },
    aiSensitivity: 'Balanced'
  });

  // ─── AUTH LOGIC ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsDataLoading(true);
        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || 'Farmer',
          photoURL: fbUser.photoURL,
          lastLogin: new Date().toISOString()
        };

        // Set local state immediately for responsiveness
        setUser(userData);
        localStorage.setItem('agrisense_user', JSON.stringify(userData));

        try {
          if (fbUser.email) {
            const userDoc = await getDoc(doc(db, "farmers", fbUser.email));
            if (userDoc.exists()) {
              const cloudData = userDoc.data();
              
              // 🔄 MERGE CLOUD DATA: Preserve customized name, phone, etc.
              const mergedUser = {
                ...userData,
                name: cloudData.name || userData.name,
                phone: cloudData.phone || '',
                location: cloudData.location || '',
                photo: (cloudData.photo && cloudData.photo.includes('firebasestorage')) ? cloudData.photo : (userData.photoURL || cloudData.photo)
              };
              
              setUser(mergedUser);
              localStorage.setItem('agrisense_user', JSON.stringify(mergedUser));

              if (cloudData.farmInfo) setFarmInfo(cloudData.farmInfo);
              if (cloudData.profileMeta) setProfileMeta(cloudData.profileMeta);
            } else {
              // First time user registration
              await setDoc(doc(db, "farmers", fbUser.email), userData);
            }
          }
        } catch (err) {
          console.error("Firestore sync warning (ignoring to allow login):", err);
        } finally {
          setIsDataLoading(false);
        }
      } else {
        // No Firebase user, check if we have a valid guest session
        const saved = localStorage.getItem('agrisense_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // Only restore if it's a guest or if we want to allow offline persistence
            // If it has an email but no fbUser, it's a stale session - we should probably clear it
            // unless we specifically want to support offline mode.
            if (parsed.isGuest) {
              setUser(parsed);
            } else {
              // Stale Firebase session found in local storage but not in Auth
              // setUser(null); 
              // localStorage.removeItem('agrisense_user');
              setUser(null);
            }
          } catch (e) { setUser(null); }
        } else {
          setUser(null);
        }
        setIsDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error("Login Failed", err);
      return false;
    }
  };

  const logout = async () => { 
    await signOut(auth);
    setUser(null); 
    localStorage.removeItem('agrisense_user');
  };

  const register = async (name, email, password) => {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(fbUser, { displayName: name });
      return true;
    } catch (err) {
      console.error("Registration Failed", err);
      return false;
    }
  };

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return true;
    } catch (err) {
      console.error("Google Auth Failed", err);
      return false;
    }
  };

  const guestLogin = async (name, id) => {
    const guestUser = {
      uid: id || `guest-${Math.random().toString(16).slice(2, 10)}`,
      name: name,
      email: id || 'guest@agrisense.in',
      isGuest: true,
      lastLogin: new Date().toISOString()
    };
    setUser(guestUser);
    localStorage.setItem('agrisense_user', JSON.stringify(guestUser));
    
    // 🛡️ RESET BRANDING: Ensure guest users use the standard project/field IDs
    // so they automatically pair with the default hardware simulator topics.
    const defaultBranding = {
      name: MASTER_CONFIG.FARM_NAME,
      projectName: MASTER_CONFIG.PROJECT_NAME,
      tagline: MASTER_CONFIG.TAGLINE,
      version: MASTER_CONFIG.VERSION
    };
    setFarmInfo(defaultBranding);
    localStorage.setItem('agrisense_branding', JSON.stringify(defaultBranding));
    
    return true;
  };

  // ─── GPS ENGINE ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCity = async (lat, lng) => {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await res.json();
        return data.city || data.locality || data.principalSubdivision || 'Active Field';
      } catch (e) {
        return 'Agri Zone';
      }
    };

    const initGPS = async () => {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const perm = await Geolocation.requestPermissions();
        
        if (perm.location === 'granted') {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
          });
          
          const { latitude: lat, longitude: lng } = pos.coords;
          const city = await fetchCity(lat, lng);
          setCurrentGPS({ lat, lng, city, accuracy: pos.coords.accuracy });
        }
      } catch (err) {
        console.warn("Native GPS failed, trying browser...", err);
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (p) => {
            const { latitude: lt, longitude: lg } = p.coords;
            const ct = await fetchCity(lt, lg);
            setCurrentGPS({ lat: lt, lng: lg, city: ct, accuracy: p.coords.accuracy });
          });
        }
      }
    };

    initGPS();
  }, []);

  const syncGPS = async () => {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const cityRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
      const cityData = await cityRes.json();
      const city = cityData.city || cityData.locality || 'Agri Field';
      setCurrentGPS({ 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude, 
        city, 
        accuracy: pos.coords.accuracy 
      });
      return city;
    } catch (e) {
      console.error("GPS Sync Failed", e);
      return null;
    }
  };

  // ─── WEATHER ENGINE ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWeather = async () => {
      const { lat, lng } = currentGPS;
      if (!lat || !lng) return;
      
      // Use API Key from Config or Environment
      const API_KEY = MASTER_CONFIG.OPENWEATHER_API_KEY;
      if (!API_KEY) {
        console.warn("🛰️ [WEATHER ENGINE]: Awaiting API Key.");
        setApiWeather(prev => ({ 
          ...prev, 
          city: currentGPS.city || 'Agri Hub', 
          lastUpdate: 'Awaiting API Key' 
        }));
        setApiForecast([]);
        return;
      }

      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        
        if (data.main) {
          setApiWeather({
            temp: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            clouds: data.clouds.all,
            condition: data.weather[0].main,
            city: data.name || currentGPS.city,
            aqi: Math.floor(Math.random() * 50) + 10, // Mock AQI as OWM free doesn't provide it
            visibility: (data.visibility / 1000).toFixed(1) + ' km',
            uvIndex: 'Low',
            sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            seaLevel: data.main.sea_level || data.main.pressure,
            groundLevel: data.main.grnd_level || data.main.pressure,
            lastUpdate: new Date().toLocaleTimeString()
          });

          // Also fetch 5-day forecast
          try {
            const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`);
            const fData = await fRes.json();
            if (fData.list) {
              const daily = fData.list.filter((_, i) => i % 8 === 0).slice(0, 5).map(item => ({
                date: new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short' }),
                temp: Math.round(item.main.temp),
                condition: item.weather[0].main,
                rainProb: (item.pop * 100).toFixed(0) + '%'
              }));
              setApiForecast(daily);
            } else {
              console.warn("🛰️ [WEATHER ENGINE]: Forecast data format invalid or empty list.", fData);
            }
          } catch (err) {
            console.error("🛰️ [WEATHER ENGINE]: Forecast fetch failed:", err);
          }
        }
      } catch (err) {
        console.error("Weather Sync Failed:", err);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 900000); // 15 mins
    return () => clearInterval(interval);
  }, [currentGPS.lat, currentGPS.lng]);

  const toggleTheme = React.useCallback(() => setIsDarkMode(prev => !prev), []);

  // ─── THEME ENGINE ────────────────────────────────────────────────────────
  useEffect(() => {
    // Apply theme to the document root for CSS variable scoping
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    // Also save to localStorage if needed, though we might want to sync with profile
  }, [isDarkMode]);
  const toggleNodePower = React.useCallback((id) => setNodePower(prev => ({ ...prev, [id]: !prev[id] })), []);

  const toggleActuator = React.useCallback((key) => {
    if (!key) return; // 🛡️ Safety check to prevent undefined key toggling
    setActuators(prev => {
      const newState = !prev[key];
      const commands = MASTER_CONFIG.ACTUATOR_COMMANDS[key];
      if (commands) mqttService.publishCommand({ 
        action: newState ? commands.ON : commands.OFF, 
        actuator: key.toLowerCase().replace(' ', '_'), 
        status: newState ? "ON" : "OFF" 
      });
      return { ...prev, [key]: newState };
    });
  }, []);

  const updateUser = React.useCallback(async (data) => {
    try {
      setUser(prev => {
        const updated = { ...prev, ...data };
        localStorage.setItem('agrisense_user', JSON.stringify(updated));
        return updated;
      });
      
      if (auth.currentUser && auth.currentUser.email) {
        await setDoc(doc(db, "farmers", auth.currentUser.email), { ...data }, { merge: true });
      }
      return true;
    } catch (err) {
      console.error("Update User Failed", err);
      return false;
    }
  }, []);

  const updateBranding = React.useCallback(async (data) => {
    try {
      console.log("💾 AppContext: Updating Branding/Device Info...", data);
      setFarmInfo(prev => {
        const updated = { ...prev, ...data };
        localStorage.setItem('agrisense_branding', JSON.stringify(updated));
        return updated;
      });
      
      if (auth.currentUser && auth.currentUser.email) {
        await setDoc(doc(db, "farmers", auth.currentUser.email), { farmInfo: data }, { merge: true });
      }
      return true;
    } catch (err) {
      console.error("❌ AppContext: Branding Sync Failed", err);
      return false;
    }
  }, []);

  const syncDeviceId = (primary, secondary) => {
    console.log("🛰️ AppContext: Manual Device Sync Triggered", primary, secondary);
    // The TelemetryContext useEffect will handle the reconnection 
    // because it depends on farmInfo changes.
  };

  const syncData = React.useCallback(() => {
    console.log("🔄 AppContext: Global Data Sync Triggered");
    mqttService.refresh();
  }, []);

  const contextValue = useMemo(() => ({
    user, login, logout, register, googleLogin, guestLogin, farmInfo, isDarkMode, toggleTheme, 
    isSidebarOpen, setIsSidebarOpen, actuators, toggleActuator,
    connectivityStatus, setConnectivityStatus, isDataLoading, setIsDataLoading,
    profileMeta, nodePower, toggleNodePower, currentGPS, setCurrentGPS, syncGPS,
    apiWeather, setApiWeather, apiForecast, setApiForecast,
    updateUser, updateBranding, syncDeviceId, syncData, ACTUATORS
  }), [
    user, farmInfo, isDarkMode, isSidebarOpen, actuators, connectivityStatus, 
    isDataLoading, profileMeta, nodePower, currentGPS, apiWeather, apiForecast,
    toggleTheme, toggleNodePower, toggleActuator, updateUser, updateBranding, syncData
    // Note: login, logout, register, googleLogin, guestLogin, syncDeviceId are stable refs (defined inline)
    // ACTUATORS is a module-level constant, not reactive state — excluded from deps intentionally
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
export default AppContext;
