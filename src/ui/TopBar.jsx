import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../state/AppContext';
import { useTelemetry } from '../state/TelemetryContext';
import { 
  Bell, Menu, User, Sun, Moon
} from 'lucide-react';

const AgriSenseLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.04em' }}>
      AgriSense <span style={{ color: '#15803D' }}>Pro</span>
    </span>
  </div>
);

const NotificationDot = React.memo(() => {
  const { recommendations } = useTelemetry();
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div style={{ 
      position: 'absolute', top: '7px', right: '7px', 
      width: '8px', height: '8px',
      background: 'var(--danger)', 
      borderRadius: '50%', border: '2px solid var(--bg-card)'
    }}></div>
  );
});

const TopBar = ({ title }) => {
  const { user, setIsSidebarOpen, isDarkMode, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="top-bar" style={{ 
      position: 'relative', zIndex: 1000, 
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-main)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: '58px',
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)'
    }}>

      {/* LEFT: UNIFORM HAMBURGER MENU BUTTON ACROSS ENTIRE APP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(prev => !prev)}
          style={{ 
            background: 'var(--bg-main)', 
            border: '1px solid var(--border-main)', 
            color: 'var(--text-main)', 
            cursor: 'pointer', 
            width: '38px', 
            height: '38px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0 
          }}
        >
          <Menu size={20} strokeWidth={2.5} />
        </motion.button>
        
        {location.pathname === '/dashboard' ? (
          <AgriSenseLogo />
        ) : (
          <h1 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 900, 
            color: 'var(--text-main)', 
            margin: 0, 
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px'
          }}>
            {title}
          </h1>
        )}
      </div>

      {/* 🔔 RIGHT SIDE: ACTIONS & PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/alerts')}
          style={{ 
            cursor: 'pointer', 
            width: '38px', 
            height: '38px', 
            background: 'var(--bg-main)', 
            border: '1px solid var(--border-main)', 
            borderRadius: '12px', 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Bell size={19} color="var(--text-muted)" strokeWidth={2} />
          <NotificationDot />
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          style={{ 
            cursor: 'pointer', 
            width: '38px', 
            height: '38px', 
            background: 'var(--bg-main)', 
            border: '1px solid var(--border-main)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          {isDarkMode ? (
            <Sun size={19} color="var(--accent)" strokeWidth={2.5} />
          ) : (
            <Moon size={19} color="#15803D" strokeWidth={2.5} />
          )}
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/account')}
          style={{ 
            cursor: 'pointer', 
            width: '38px', 
            height: '38px', 
            borderRadius: '12px', 
            overflow: 'hidden',
            background: 'var(--bg-main)', 
            border: '1px solid var(--border-main)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}
        >
          {user?.photoURL && !user.photoURL.includes('unsplash.com') ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#15803D' }}>
              {(user?.name || user?.displayName || user?.email || 'P').charAt(0).toUpperCase()}
            </span>
          )}
        </motion.div>
      </div>
    </header>
  );
};

export default TopBar;
