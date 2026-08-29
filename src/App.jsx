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
const SoilMonitor = React.lazy(() => import('./pages/Monitoring/SoilMonitor'));
const WeatherMonitor = React.lazy(() => import('./pages/Monitoring/WeatherMonitor'));
const StorageMonitor = React.lazy(() => import('./pages/Monitoring/StorageMonitor'));
const VisualMonitor = React.lazy(() => import('./pages/Monitoring/VisualMonitor'));
const IrrigationSystem = React.lazy(() => import('./pages/Control/IrrigationSystem'));
const DeviceManager = React.lazy(() => import('./pages/Control/DeviceManager'));
const AnalyticsHub = React.lazy(() => import('./pages/Analytics/AnalyticsHub'));
const Reports = React.lazy(() => import('./pages/Analytics/Reports'));
const SoilForensics = React.lazy(() => import('./pages/Advisory/SoilForensics'));
const FarmAdvisor = React.lazy(() => import('./pages/Advisory/FarmAdvisor'));


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
    { id: 'Home', path: '/dashboard', icon: LayoutGrid, color: 'var(--primary)' },
    { id: 'Soil', path: '/precision-soil-testing', icon: FlaskConical, color: 'var(--secondary)' },
    { id: 'Advisor', path: '/crop-advisor', icon: Sparkles, color: 'var(--accent)' },
    { id: 'Analytics', path: '/analytics', icon: LineChart, color: 'var(--primary)' },
    { id: 'Devices', path: '/device-area', icon: Cpu, color: 'var(--secondary)' },
  ];

  const activeIndex = tabs.findIndex(tab => tab.path === location.pathname);

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-main)',
      height: '66px', display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '0 8px', zIndex: 1000,
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Tab Links */}

      {tabs.map((item, index) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <motion.button
            key={item.path}
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
    '/irrigation':             'Irrigation Control',
    '/weather':                'Weather Station',
    '/storage-hub':            'Storage Area',
    '/camera':                 'Camera View',
    '/device-area':            'Device Management',
    '/precision-soil-testing': 'Soil Test',
    '/crop-advisor':           'Farm Advisor',
    '/reports':                'Farm Report',
    '/analytics':              'Analytics Hub',
    '/account':                'My Account',
    '/alerts':                 'Alerts',
    '/profile':                'My Account',
    '/settings':               'My Account',
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
      '/irrigation', 
      '/weather', 
      '/storage-hub', 
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
    <div style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-main)' }}>
      <TopBar title={titles[location.pathname] || 'AgriSense'} />
      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', paddingBottom: '120px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%', height: '100%' }}>
          <AnimatePresence mode="popLayout" custom={navDirection}>
            <motion.div 
              key={location.pathname}
              custom={navDirection}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 260, damping: 28 },
                opacity: { duration: 0.25, ease: "easeInOut" },
                scale: { duration: 0.25, ease: "easeOut" }
              }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
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

    // 🚀 DIRECT ACCESS: No more forced onboarding.
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
        // 🛡️ RELEASE GUARD: Safety timeout to hide native splash if logic fails
        setTimeout(async () => {
          try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide();
          } catch (e) {}
        }, 2000); // Reduced from 5000ms to 2000ms for snappier feel


        if (CapApp) {
          // 🔙 Back button handling
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

    // 🕵️ RELEASE DIAGNOSTICS: Capture production-only failures
    const handleGlobalError = (event) => {
      const errorLog = {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        col: event.colno,
        error: event.error?.stack,
        time: new Date().toISOString()
      };
      console.error("🚀 RELEASE_CRASH_DETECTED:", errorLog);
      // Optional: Store in localStorage for audit
      try {
        const logs = JSON.parse(localStorage.getItem('agrisense_crash_logs') || '[]');
        logs.push(errorLog);
        localStorage.setItem('agrisense_crash_logs', JSON.stringify(logs.slice(-10)));
      } catch (e) {}
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (e) => handleGlobalError({ message: e.reason?.message || 'Promise Rejection', error: e.reason }));

    return () => {
      backListener?.remove();
      urlListener?.remove();
      window.removeEventListener('error', handleGlobalError);
    };
  }, [location.pathname, navigate]);


  const isPublicRoute = ['/', '/login'].includes(location.pathname);


  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      
      {/* 🛠️ PERSISTENT LAYOUT WRAPPER: Prevents layout re-mounting on every navigation */}
      <Route element={<MainLayout><React.Suspense fallback={<PageLoader />}><Outlet /></React.Suspense></MainLayout>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsHub />} />
        <Route path="/soil-monitoring" element={<SoilMonitor />} />
        <Route path="/irrigation" element={<IrrigationSystem />} />
        <Route path="/storage-hub" element={<StorageMonitor />} />
        <Route path="/camera" element={<VisualMonitor />} />
        <Route path="/device-area" element={<DeviceManager />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/account" element={<Account />} />
        <Route path="/weather" element={<WeatherMonitor />} />
        <Route path="/precision-soil-testing" element={<SoilForensics />} />
        <Route path="/crop-advisor" element={<FarmAdvisor />} />
        <Route path="/admin" element={user?.email?.toLowerCase() === 'prolayjitbiswas14112004@gmail.com' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
      </Route>

      <Route path="/profile" element={<Navigate to="/account" />} />
      <Route path="/settings" element={<Navigate to="/account" />} />
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

