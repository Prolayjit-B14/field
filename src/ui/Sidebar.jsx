import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings as SettingsIcon,
  CloudSun, Database, FlaskConical, Camera,
  Sparkles, BarChart2, Network, Bell,
  Sprout, Waves, FileText, ShieldCheck,
  ChevronLeft, ChevronRight, Leaf, User, PieChart, LayoutDashboard,
  ArrowRight, ArrowLeft, Activity, Cpu, LogOut, Droplets,
  AlertCircle, Wrench, Sliders, Scan
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useTelemetry } from '../state/TelemetryContext';

const Sidebar = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, farmInfo, logout } = useApp();
  const { mqttStatus } = useTelemetry();
  const location = useLocation();
  const close = () => setIsSidebarOpen(false);

  const farmName     = farmInfo?.name || 'Krishnanagar Farm';
  const clientName   = user?.name || 'Pro B';
  const isLive       = mqttStatus === 'connected';

  const navSections = [
    {
      title: 'Core Monitoring',
      links: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'var(--primary)' },
        { name: 'Soil Monitor', path: '/soil-monitoring', icon: Sprout, color: 'var(--primary)' },
        { name: 'Weather Station', path: '/weather', icon: CloudSun, color: 'var(--accent)' },
        { name: 'Camera Stream', path: '/camera', icon: Camera, color: '#8B5CF6' }
      ]
    },
    {
      title: 'Smart Agronomy & AI',
      links: [
        { name: 'AI Plant Vision', path: '/ai-vision', icon: Scan, color: '#15803D' },
        { name: 'Fertilizer Engine', path: '/fertilizer-engine', icon: Sprout, color: '#15803D' },
        { name: 'Farm Advisor', path: '/crop-advisor', icon: Sparkles, color: 'var(--accent)' },
        { name: 'Soil Forensics', path: '/precision-soil-testing', icon: FlaskConical, color: 'var(--primary)' }
      ]
    },
    {
      title: 'Hardware & IoT Control',
      links: [
        { name: 'Device Manager', path: '/device-area', icon: Cpu, color: 'var(--secondary)' },
        { name: 'Actuator Control', path: '/actuators', icon: Waves, color: '#10B981' },
        { name: 'IoT / MQTT Config', path: '/mqtt-config', icon: Network, color: 'var(--secondary)' }
      ]
    },
    {
      title: 'Reports & Alerts',
      links: [
        { name: 'Farm Reports', path: '/reports', icon: FileText, color: 'var(--primary)' },
        { name: 'Analytics Hub', path: '/analytics', icon: PieChart, color: 'var(--secondary)' },
        { name: 'Alerts', path: '/alerts', icon: Bell, color: 'var(--accent)' }
      ]
    },
    {
      title: 'Account & Settings',
      links: [
        { name: 'My Account', path: '/account', icon: User, color: 'var(--primary)' },
        { name: 'Settings', path: '/settings', icon: SettingsIcon, color: 'var(--text-muted)' },
        ...(user?.email?.toLowerCase() === 'prolayjitbiswas14112004@gmail.com' ? [
          { name: 'Admin Control', path: '/admin', icon: ShieldCheck, color: 'var(--danger)' }
        ] : [])
      ]
    }
  ];

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 10001, 
              background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)' 
            }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '290px', zIndex: 10002,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(30px)',
          display: 'flex', flexDirection: 'column',
          boxShadow: isSidebarOpen ? 'var(--shadow-premium)' : 'none',
          overflow: 'hidden',
          borderRight: '1px solid var(--border-main)',
          fontFamily: "'Outfit', sans-serif"
        }}
      >
        {/* ── TOP HEADER: PROFILE + CLOSE ── */}
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', borderBottom: '1px solid var(--border-main)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ 
                width: '42px', height: '42px', borderRadius: '12px', 
                background: 'var(--primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {user?.photoURL && !user.photoURL.includes('unsplash.com') ? (
                  <img src={user.photoURL} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--bg-card)' }}>
                    {(user?.name || user?.displayName || user?.email || 'P').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ 
                position: 'absolute', bottom: '-1px', right: '-1px', 
                width: '10px', height: '10px', borderRadius: '50%', 
                background: isLive ? '#15803D' : '#F59E0B', 
                border: '2px solid var(--bg-card)'
              }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(clientName || 'Pro B').split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.03em' }}>
                {farmName}
              </div>
            </div>
          </div>

          {/* ❌ CLOSE BUTTON (RIGHT SIDE) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={close}
            style={{ 
              width: '36px', height: '36px', borderRadius: '10px', 
              background: 'var(--bg-main)', border: '1px solid var(--border-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* ── NAVIGATION LIST ORGANIZED BY SECTIONS ── */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 30px' }}>
          {navSections.map((section, sIdx) => (
            <div key={section.title} style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: 'var(--text-inactive)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 12px 6px'
              }}>
                {section.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {section.links.map((link, i) => {
                  const NavIcon = link.icon;
                  const isActive = location.pathname === link.path;

                  return (
                    <NavLink 
                      key={link.path} 
                      to={link.path} 
                      onClick={close}
                      style={{
                        position: 'relative', display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', textDecoration: 'none', borderRadius: '12px',
                        background: isActive ? 'var(--primary-soft)' : 'transparent',
                        transition: '0.15s ease'
                      }}
                    >
                      <div style={{ 
                        width: '30px', height: '30px', borderRadius: '8px', 
                        background: isActive ? 'var(--bg-card)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                      }}>
                        <NavIcon size={17} color={link.color} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span style={{ 
                        fontSize: '0.88rem', fontWeight: isActive ? 800 : 600, 
                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)', zIndex: 1
                      }}>
                        {link.name}
                      </span>
                      
                      {isActive && (
                        <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', zIndex: 1 }} />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── SYSTEM FOOTER ── */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-main)', borderTop: '1px solid var(--border-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                AgriSense Pro
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                v19.0.0 IoT Native
              </div>
            </div>

            <button
              onClick={() => {
                close();
                logout();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
