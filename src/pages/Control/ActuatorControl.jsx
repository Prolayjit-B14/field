import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { 
  Droplets, Waves, FlaskConical, CloudDrizzle, SprayCan, 
  Fan, CloudFog, Lightbulb, Flashlight, BellRing, 
  AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react';

const ACTUATOR_CATEGORIES = [
  {
    id: 'irrigation',
    title: 'Irrigation',
    items: [
      {
        key: 'pump',
        name: 'Water Pump',
        icon: Droplets,
        color: '#0284C7',
        isOpenType: false
      },
      {
        key: 'valve',
        name: 'Main Valve',
        icon: Waves,
        color: '#0284C7',
        isOpenType: true
      }
    ]
  },
  {
    id: 'crop_care',
    title: 'Crop Care',
    items: [
      {
        key: 'fertilizer',
        name: 'Fertilizer Injector',
        icon: FlaskConical,
        color: '#8B5CF6',
        isOpenType: false
      },
      {
        key: 'pest_sprinkler',
        name: 'Pest Sprinkler',
        icon: CloudDrizzle,
        color: '#06B6D4',
        isOpenType: false
      },
      {
        key: 'sprayer',
        name: 'Crop Sprayer',
        icon: SprayCan,
        color: '#10B981',
        isOpenType: false
      }
    ]
  },
  {
    id: 'environment',
    title: 'Environment',
    items: [
      {
        key: 'fan',
        name: 'Ventilation Fan',
        icon: Fan,
        color: '#3B82F6',
        isOpenType: false
      },
      {
        key: 'fogger',
        name: 'Mist / Fogger',
        icon: CloudFog,
        color: '#64748B',
        isOpenType: false
      }
    ]
  },
  {
    id: 'lighting',
    title: 'Lighting',
    items: [
      {
        key: 'light',
        name: 'Field Light',
        icon: Lightbulb,
        color: '#F59E0B',
        isOpenType: false
      },
      {
        key: 'flood_light',
        name: 'Flood Light',
        icon: Flashlight,
        color: '#EAB308',
        isOpenType: false
      }
    ]
  },
  {
    id: 'safety',
    title: 'Safety',
    items: [
      {
        key: 'siren',
        name: 'Siren',
        icon: BellRing,
        color: '#EF4444',
        isOpenType: false
      }
    ]
  }
];

const INITIAL_ACTUATORS_STATE = {
  pump: { state: true, statusText: 'ON' },
  valve: { state: true, statusText: 'OPEN' },
  fertilizer: { state: false, statusText: 'OFF' },
  pest_sprinkler: { state: false, statusText: 'OFF' },
  sprayer: { state: false, statusText: 'OFF' },
  fan: { state: true, statusText: 'ON' },
  fogger: { state: false, statusText: 'OFF' },
  light: { state: false, statusText: 'OFF' },
  flood_light: { state: false, statusText: 'OFF' },
  siren: { state: false, statusText: 'OFF' }
};

const ActuatorControl = () => {
  const navigate = useNavigate();
  const { farmInfo } = useApp();
  const { mqttStatus } = useTelemetry();

  const isOnline = mqttStatus === 'connected';

  // Hardware Actuators State
  const [actuators, setActuators] = useState(INITIAL_ACTUATORS_STATE);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggle = (key, isOpenType, name) => {
    if (!isOnline) {
      showToast("Cannot control hardware: IoT gateway is offline", "error");
      return;
    }

    const current = actuators[key];
    const nextState = !current.state;
    setPendingCommand(`Sending command to ${name}...`);

    // Simulated real MQTT lifecycle
    setTimeout(() => {
      setActuators(prev => ({
        ...prev,
        [key]: {
          state: nextState,
          statusText: isOpenType ? (nextState ? 'OPEN' : 'CLOSED') : (nextState ? 'ON' : 'OFF')
        }
      }));
      setPendingCommand(null);
      showToast(`Acknowledged: ${name} turned ${isOpenType ? (nextState ? 'OPEN' : 'CLOSED') : (nextState ? 'ON' : 'OFF')}`);
    }, 500);
  };

  const handleEmergencyStop = () => {
    if (window.confirm("EMERGENCY STOP: Are you sure you want to immediately shut down all irrigation pumps, valves, and field actuators?")) {
      setPendingCommand("Broadcasting EMERGENCY STOP to all hardware nodes...");
      setTimeout(() => {
        setActuators(prev => {
          const updated = { ...prev };
          ACTUATOR_CATEGORIES.forEach(cat => {
            cat.items.forEach(item => {
              updated[item.key] = {
                state: false,
                statusText: item.isOpenType ? 'CLOSED' : 'OFF'
              };
            });
          });
          return updated;
        });
        setPendingCommand(null);
        showToast("EMERGENCY STOP CONFIRMED: All actuators deactivated", "error");
      }, 600);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: '100%',
      maxWidth: '720px',
      margin: '0 auto',
      width: '100%'
    }}>


      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              background: toast.type === 'error' ? '#FEF2F2' : '#DCFCE7',
              border: `1px solid ${toast.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
              color: toast.type === 'error' ? '#DC2626' : '#15803D',
              borderRadius: '14px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '14px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Command Indicator */}
      <AnimatePresence>
        {pendingCommand && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#B45309',
              borderRadius: '14px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={14} className="animate-spin" />
            <span>{pendingCommand}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CATEGORIES & ACTUATOR CARDS ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {ACTUATOR_CATEGORIES.map(category => (
          <div key={category.id}>
            {/* Category Header */}
            <h4 style={{
              fontSize: '0.94rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              margin: '0 0 10px 4px',
              letterSpacing: '-0.01em'
            }}>
              {category.title}
            </h4>

            {/* Cards Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {category.items.map(item => {
                const ItemIcon = item.icon;
                const act = actuators[item.key] || { state: false, statusText: 'OFF' };
                const isActive = act.state;

                return (
                  <motion.div
                    key={item.key}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => handleToggle(item.key, item.isOpenType, item.name)}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '20px',
                      padding: '16px 20px',
                      border: '1.5px solid var(--border-main)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Left: Icon + Actuator Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '13px',
                        background: isActive ? `${item.color}15` : '#F1F5F9',
                        border: `1px solid ${isActive ? item.color + '30' : '#E2E8F0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? item.color : '#94A3B8',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        <ItemIcon size={22} strokeWidth={2.3} />
                      </div>

                      <div style={{
                        fontSize: '0.98rem',
                        fontWeight: 850,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.01em'
                      }}>
                        {item.name}
                      </div>
                    </div>

                    {/* Right: Status Text + Toggle Switch */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: 900,
                        color: isActive ? item.color : '#64748B',
                        letterSpacing: '0.02em',
                        minWidth: '42px',
                        textAlign: 'right'
                      }}>
                        {act.statusText}
                      </span>

                      {/* Pill Switch - button color matches icon color */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.key, item.isOpenType, item.name);
                        }}
                        aria-label={`Toggle ${item.name}`}
                        style={{
                          width: '50px',
                          height: '28px',
                          borderRadius: '14px',
                          background: isActive ? item.color : '#CBD5E1',
                          boxShadow: isActive ? `0 2px 8px ${item.color}50` : 'none',
                          border: 'none',
                          position: 'relative',
                          cursor: 'pointer',
                          padding: '3px',
                          transition: 'background 0.2s ease, box-shadow 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          transform: isActive ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── EMERGENCY STOP BUTTON ─── */}
      <div style={{ marginTop: '32px', paddingBottom: '16px' }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEmergencyStop}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '18px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#DC2626',
            fontSize: '0.9rem',
            fontWeight: 850,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <AlertTriangle size={18} strokeWidth={2.4} />
          <span>Emergency Stop (All Actuators)</span>
        </motion.button>
      </div>

    </div>
  );
};

export default ActuatorControl;
