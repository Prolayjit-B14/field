/**
 * Farm Advisor Pro v17.1.0 Main Application Entry
 * Handles routing, global layout, and organized page imports.
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
// import { App as CapApp } from '@capacitor/app';
const CapApp = null; // Fallback for browser
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid, LineChart, Cpu,
  Camera, Bell, User, Leaf,
  Settings as SettingsIcon, FlaskConical, Sparkles,
  AlertCircle, AlertTriangle
} from 'lucide-react';
import { TelemetryProvider } from './state/TelemetryContext';

// Context & State
import { AppProvider, useApp } from './state/AppContext';

// Reusable Components
import TopBar from './ui/TopBar';
import Sidebar from './ui/Sidebar';
import AgriBot from './ui/AgriBot';

// 🚀 PERFORMANCE: Lazy load pages to prevent white-screen on startup
import Login from './pages/Auth/Login';
import Splash from './pages/Auth/Splash';
// 🚀 PERFORMANCE: Lazy load pages
const Account = React.lazy(() => import('./pages/Auth/Account'));
const AdminDashboard = React.lazy(() => import('./pages/Auth/AdminDashboard'));
const Dashboard = React.lazy(() => import('./pages/Core/Dashboard'));
const AlertCenter = React.lazy(() => import('./pages/Core/AlertCenter'));
const NotificationDetail = React.lazy(() => import('./pages/Core/NotificationDetail'));
const Settings = React.lazy(() => import('./pages/Core/Settings'));
const SoilMonitor = React.lazy(() => import('./pages/Monitoring/SoilMonitor'));
const SensorDetail = React.lazy(() => import('./pages/Monitoring/SensorDetail'));
const WeatherMonitor = React.lazy(() => import('./pages/Monitoring/WeatherMonitor'));
const VisualMonitor = React.lazy(() => import('./pages/Monitoring/VisualMonitor'));
const DeviceManager = React.lazy(() => import('./pages/Control/DeviceManager'));
const DeviceDetails = React.lazy(() => import('./pages/Control/DeviceDetails'));
const MqttConfig = React.lazy(() => import('./pages/Control/MqttConfig'));
const AnalyticsHub = React.lazy(() => import('./pages/Analytics/AnalyticsHub'));
const Reports = React.lazy(() => import('./pages/Analytics/Reports'));
const SoilForensics = React.lazy(() => import('./pages/Advisory/SoilForensics'));
const FarmAdvisor = React.lazy(() => import('./pages/Advisory/FarmAdvisor'));
const FertilizerEngine = React.lazy(() => import('./pages/Advisory/FertilizerEngine'));
const PestCropAnalysis = React.lazy(() => import('./pages/Advisory/PestCropAnalysis'));
const AIVision = React.lazy(() => import('./pages/Advisory/AIVision'));
const ActuatorControl = React.lazy(() => import('./pages/Control/ActuatorControl'));
const FarmSetup = React.lazy(() => import('./pages/Auth/FarmSetup'));


// ─── LOADING SKELETON ──────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ 
    height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)',
    gap: '20px', zIndex: 10000, position: 'fixed', top: 0, left: 0
  }}>
    <div style={{ width: '50px', height: '50px', border: '4px solid var(--border-main)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>INITIALIZING ENGINE...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);


// 🚀 PERFORMANCE: Memoize BottomNav to prevent re-renders on every telemetry update
const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { 
      id: 'Home', 
      path: '/dashboard', 
      icon: LayoutGrid, 
      color: 'var(--primary)',
      matches: ['/dashboard']
    },
    { 
      id: 'Soil', 
      path: '/soil-monitoring', 
      icon: FlaskConical, 
      color: 'var(--secondary)',
      matches: ['/soil-monitoring', '/sensor-detail', '/precision-soil-testing']
    },
    { 
      id: 'Advisor', 
      path: '/fertilizer-engine', 
      icon: Sparkles, 
      color: 'var(--accent)',
      matches: ['/fertilizer-engine', '/pest-analysis', '/crop-advisor', '/ai-vision', '/crop-vision', '/vision']
    },
    { 
      id: 'Analytics', 
      path: '/reports', 
      icon: LineChart, 
      color: 'var(--primary)',
      matches: ['/reports', '/analytics', '/alerts', '/notification-detail']
    },
    { 
      id: 'Devices', 
      path: '/device-area', 
      icon: Cpu, 
      color: 'var(--secondary)',
      matches: ['/device-area', '/device-detail', '/actuators', '/mqtt-config']
    },
  ];

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-main)',
      height: '66px', display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '0 8px', zIndex: 1000,
      boxShadow: 'var(--shadow-lg)'
    }}>
      {tabs.map((item) => {
        const Icon = item.icon;
        const isActive = item.matches.includes(location.pathname);

        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            style={{
              background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', color: isActive ? item.color : 'var(--text-inactive)',
              padding: '10px 0', flex: 1, cursor: 'pointer', outline: 'none',
              position: 'relative'
            }}
          >
            <motion.div
              animate={{ 
                scale: isActive ? 1.15 : 1,
                y: isActive ? -2 : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} color={isActive ? item.color : 'var(--text-inactive)'} />
            </motion.div>
            <motion.span 
              animate={{ opacity: isActive ? 1 : 0.6, y: isActive ? 0 : 2 }}
              style={{ fontSize: '0.65rem', fontWeight: isActive ? 800 : 600, letterSpacing: '0.02em' }}
            >
              {item.id}
            </motion.span>
          </motion.button>
        );
      })}
    </nav>
  );
});

// ─── ERROR BOUNDARY ────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { 
    console.error("AgriSense Crash Detected:", error, errorInfo);
    try {
      const logs = JSON.parse(localStorage.getItem('agrisense_crash_logs') || '[]');
      logs.push({ message: error.message, stack: error.stack, time: new Date().toISOString() });
      localStorage.setItem('agrisense_crash_logs', JSON.stringify(logs.slice(-10)));
    } catch(e) {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'white' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '25px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>System Anomaly</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px', marginBottom: '2rem', maxWidth: '280px' }}>Our diagnostic module detected a conflict in the interface layer. A re-sync is recommended.</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '14px 30px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>RE-SYNC PLATFORM</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = ({ children }) => {
  const location = useLocation();
  const mainRef = React.useRef(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  const titles = {
    '/dashboard':              'Dashboard',
    '/soil-monitoring':        'Soil Monitor',
    '/sensor-detail':          'Sensor Detail',
    '/weather':                'Weather Station',
    '/camera':                 'Camera View',
    '/device-area':            'Device Manager',
    '/device-detail':          'Device Details',
    '/device-details':         'Device Details',
    '/mqtt-config':            'IoT / MQTT Configuration',
    '/actuators':              'Actuator Control',
    '/precision-soil-testing': 'Soil Forensics',
    '/crop-advisor':           'Farm Advisor',
    '/fertilizer-engine':      'Fertilizer Engine',
    '/pest-analysis':          'AI Plant Vision',
    '/ai-vision':              'AI Plant Vision',
    '/crop-vision':            'AI Plant Vision',
    '/vision':                 'AI Plant Vision',
    '/farm-setup':             'Farm Setup',
    '/reports':                'Farm Reports',
    '/analytics':              'Analytics Hub',
    '/account':                'My Account',
    '/alerts':                 'Alerts',
    '/notification-detail':    'Alerts',
    '/profile':                'My Account',
    '/settings':               'Settings',
    '/admin':                  'Admin Panel',
  };

  // 🚀 PERFORMANCE: Navigation History Tracker for Directional Animations
  const [navDirection, setNavDirection] = React.useState(0);
  const prevPathRef = React.useRef(location.pathname);

  useEffect(() => {
    const paths = [
      '/dashboard', 
      '/precision-soil-testing', 
      '/crop-advisor', 
      '/analytics', 
      '/device-area',
      '/soil-monitoring', 
      '/weather', 
      '/camera', 
      '/alerts', 
      '/reports', 
      '/account'
    ];
    const prevIdx = paths.indexOf(prevPathRef.current);
    const currIdx = paths.indexOf(location.pathname);
    
    if (prevIdx !== -1 && currIdx !== -1) {
      if (prevIdx === currIdx) setNavDirection(0);
      else setNavDirection(currIdx > prevIdx ? 1 : -1);
    } else {
      setNavDirection(0); // Fade only for unknown paths
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const variants = {
    enter: (direction) => ({
      x: direction === 0 ? 0 : (direction > 0 ? 100 : -100),
      opacity: 0,
      scale: direction === 0 ? 0.98 : 1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction === 0 ? 0 : (direction < 0 ? 100 : -100),
      opacity: 0,
      scale: direction === 0 ? 0.98 : 1,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0
    })
  };

  return (
    <div style={{ 
      height: '100dvh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      background: 'var(--bg-main)' 
    }}>
      <TopBar title={titles[location.pathname] || 'AgriSense'} />
      <main 
        ref={mainRef} 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden', 
          WebkitOverflowScrolling: 'touch', 
          position: 'relative' 
        }}
      >
        <div style={{ 
          maxWidth: '480px', 
          margin: '0 auto', 
          width: '100%', 
          boxSizing: 'border-box',
          paddingBottom: '84px'
        }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav />
      <Sidebar />
      {location.pathname === '/dashboard' && <AgriBot />}
    </div>
  );
};

const AppRoutes = () => {
  const app = useApp();
  console.log("🚦 [AppRoutes]: useApp returned", app ? "data" : "NULL");
  if (!app || Object.keys(app).length === 0) {
    console.log("🚦 [AppRoutes]: App context is missing or empty!");
    return <div style={{ color: 'var(--danger)', padding: '20px', background: 'var(--bg-main)', height: '100dvh' }}>App context is missing or empty!</div>;
  }
  const { user, isDataLoading, isDarkMode, cloudSyncStatus, setIsDataLoading } = app;
  const navigate = useNavigate();
  const location = useLocation();

  console.log("🚦 [AppRoutes]: Current State:", { user: user?.email, isDataLoading, path: location.pathname });

  useEffect(() => {
    if (window.hideAppLoader) {
      window.hideAppLoader();
    }
  }, []);

  useEffect(() => {
    // ✋ LOADING GUARD: Wait for Cloud Sync to finish
    if (isDataLoading) return;
  }, [user, isDataLoading, location.pathname, navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let backListener;
    let urlListener;

    const initListeners = async () => {
      try {
        setTimeout(async () => {
          try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide();
          } catch (e) {}
        }, 2000);

        if (CapApp) {
          backListener = await CapApp.addListener('backButton', () => {
            if (['/dashboard', '/login', '/'].includes(location.pathname)) {
              CapApp.exitApp();
            } else {
              navigate(-1);
            }
          });

          urlListener = await CapApp.addListener('appUrlOpen', (data) => {
            console.log('🔗 AgriSense Deep Link Detected:', data.url);
            if (data.url.includes('google') || data.url.includes('firebase')) {
              window.location.reload();
            }
          });
        }
      } catch (e) {
        console.warn("Capacitor listeners failed:", e);
      }
    };
    initListeners();

    const handleGlobalError = (errorLog) => {
      console.error("🚀 RELEASE_CRASH_DETECTED:", errorLog);
      try {
        const logs = JSON.parse(localStorage.getItem('agrisense_crash_logs') || '[]');
        logs.push(errorLog);
        localStorage.setItem('agrisense_crash_logs', JSON.stringify(logs.slice(-10)));
      } catch (e) {}
    };

    window.addEventListener('error', (event) => handleGlobalError({ message: event.message, source: event.filename, line: event.lineno, col: event.colno, error: event.error?.stack, time: new Date().toISOString() }));
    window.addEventListener('unhandledrejection', (e) => handleGlobalError({ message: e.reason?.message || 'Promise Rejection', error: e.reason, time: new Date().toISOString() }));

    return () => {
      backListener?.remove();
      urlListener?.remove();
      window.removeEventListener('error', handleGlobalError);
    };
  }, [location.pathname, navigate]);

  const isPublicRoute = ['/', '/login', '/farm-setup'].includes(location.pathname);

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/farm-setup" element={<FarmSetup />} />
      
      {/* 🛠️ PERSISTENT LAYOUT WRAPPER: Prevents layout re-mounting on every navigation */}
      <Route element={<MainLayout><React.Suspense fallback={<PageLoader />}><Outlet /></React.Suspense></MainLayout>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsHub />} />
        <Route path="/soil-monitoring" element={<SoilMonitor />} />
        <Route path="/sensor-detail" element={<SensorDetail />} />
        <Route path="/camera" element={<VisualMonitor />} />
        <Route path="/device-area" element={<DeviceManager />} />
        <Route path="/device-detail" element={<DeviceDetails />} />
        <Route path="/device-details" element={<DeviceDetails />} />
        <Route path="/mqtt-config" element={<MqttConfig />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/notification-detail" element={<AlertCenter />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/weather" element={<WeatherMonitor />} />
        <Route path="/precision-soil-testing" element={<SoilForensics />} />
        <Route path="/crop-advisor" element={<FarmAdvisor />} />
        <Route path="/fertilizer-engine" element={<FertilizerEngine />} />
        <Route path="/pest-analysis" element={<AIVision initialMode="pest" />} />
        <Route path="/ai-vision" element={<AIVision />} />
        <Route path="/crop-vision" element={<AIVision />} />
        <Route path="/vision" element={<AIVision />} />
        <Route path="/actuators" element={<ActuatorControl />} />
        <Route path="/admin" element={user?.email?.toLowerCase() === 'prolayjitbiswas14112004@gmail.com' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
      </Route>

      <Route path="/profile" element={<Navigate to="/account" />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};


// Helper to bridge AppContext and TelemetryProvider
// ⚠️ MUST be defined BEFORE App() so it is not accessed before initialization (const is not hoisted)
const TelemetryWrapper = ({ children }) => {
  const { user, farmInfo, nodePower } = useApp();
  return (
    <TelemetryProvider user={user} farmInfo={farmInfo} nodePower={nodePower}>
      {children}
    </TelemetryProvider>
  );
};

export default function App() {
  console.log("🛠️ [APP]: Rendering App component");
  return (
    <Router>
      <AppProvider>
        <ErrorBoundary>
          <TelemetryWrapper>
            <React.Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </React.Suspense>
          </TelemetryWrapper>
        </ErrorBoundary>
      </AppProvider>
    </Router>
  );
}

