import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  AlertTriangle, Bell, Info, 
  CheckCircle2, Clock, Filter, 
  Trash2, ChevronRight, X, ShieldCheck,
  Zap, Droplets, Thermometer, WifiOff
} from 'lucide-react';

const COLORS = {
  critical: 'var(--danger)',
  warning: 'var(--accent)',
  info: 'var(--secondary)',
  success: 'var(--primary)',
  text: 'var(--text-main)',
  subtext: 'var(--text-muted)',
  bg: 'var(--bg-main)',
  border: 'var(--glass-stroke)'
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};
const itemFadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────

const AlertCard = ({ alert, onDismiss }) => {
  const config = {
    critical: { icon: AlertTriangle, color: COLORS.critical, bg: 'var(--danger-soft)', border: 'var(--danger-soft)', label: 'CRITICAL' },
    warning: { icon: AlertTriangle, color: COLORS.warning, bg: 'var(--accent-soft)', border: 'var(--accent-soft)', label: 'WARNING' },
    info: { icon: Info, color: COLORS.info, bg: 'var(--secondary-soft)', border: 'var(--secondary-soft)', label: 'INFO' },
    success: { icon: CheckCircle2, color: COLORS.success, bg: 'var(--success-soft)', border: 'var(--success-soft)', label: 'OPTIMAL' }
  }[alert.type] || { icon: Bell, color: COLORS.text, bg: 'var(--bg-card)', border: 'var(--border-main)', label: 'ALERT' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      style={{
        background: `linear-gradient(165deg, ${config.bg} 0%, var(--bg-sheet) 100%)`, 
        borderRadius: '24px', 
        padding: '1.25rem',
        marginBottom: '1rem', 
        border: `1px solid var(--border-main)`,
        boxShadow: 'var(--shadow-lg)', 
        position: 'relative', 
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', gap: '14px' }}>
        <div style={{ 
          width: '46px', height: '46px', borderRadius: '16px', background: config.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: `1px solid ${config.border}`
        }}>
          {React.createElement(config.icon, { size: 22, color: config.color, strokeWidth: 2.5 })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 950, color: config.color, letterSpacing: '0.05em', background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '6px' }}>
                {config.label}
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: COLORS.subtext, display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
              <Clock size={10} /> {alert.time}
            </span>
          </div>
          
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: COLORS.text, letterSpacing: '-0.01em' }}>{alert.title}</h4>
          
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: COLORS.subtext, lineHeight: 1.5, fontWeight: 600 }}>
            {alert.message}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
             <motion.button 
               whileTap={{ scale: 0.95 }}
               style={{ 
                 padding: '8px 16px', borderRadius: '12px', border: 'none', 
                 background: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '0.7rem', fontWeight: 900,
                 cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
               }}
             >
               INVESTIGATE
             </motion.button>
             <motion.button 
               whileTap={{ scale: 0.95 }}
               onClick={onDismiss} 
               style={{ 
                 padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-main)', 
                 background: 'var(--bg-card)', color: COLORS.subtext, fontSize: '0.7rem', fontWeight: 900,
                 cursor: 'pointer'
               }}
             >
               DISMISS
             </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────

const AlertCenter = () => {
  const { sensorData, systemOverview, devices } = useTelemetry();
  const [filter, setFilter] = useState('all');
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const generatedAlerts = useMemo(() => {
    if (!sensorData) return [];
    const alerts = [];

    const addAlert = (id, title, message, type) => {
      if (!dismissedAlerts.has(id)) {
        alerts.push({ id, title, message, type, time: 'Real-time' });
      }
    };

    // 1. Soil Node Alerts
    if (sensorData.soil?.moisture !== null) {
      if (sensorData.soil.moisture < 25) addAlert('soil_dry', 'Critical Soil Dryness', `Moisture dropped to ${sensorData.soil.moisture}%. Irrigation bypass is required.`, 'critical');
      else if (sensorData.soil.moisture > 75) addAlert('soil_wet', 'Waterlogging Detected', `Saturation at ${sensorData.soil.moisture}%. Risk of root hypoxia.`, 'warning');
    }
    
    // 2. Weather & Environment
    if (sensorData.weather?.temp !== null) {
      if (sensorData.weather.temp > 38) addAlert('temp_high', 'Heat Stress Warning', `Ambient temp reached ${sensorData.weather.temp}°C. Photosynthesis inhibiting.`, 'critical');
      else if (sensorData.weather.temp < 5) addAlert('temp_low', 'Frost Risk Alert', `Temperature at ${sensorData.weather.temp}°C. Cell membrane damage possible.`, 'warning');
    }

    // 4. Hardware Connectivity
    const offlineNodes = Object.entries(devices || {}).filter(([k, d]) => d?.status === 'OFFLINE');
    if (offlineNodes.length > 0) {
      addAlert('connectivity_issue', 'Node Link Failure', `${offlineNodes.length} hardware nodes stopped responding to the gateway.`, 'critical');
    }

    // 5. Positive Insights
    if (alerts.length === 0) {
      addAlert('system_nominal', 'Systems Nominal', 'All field sensors reporting optimal health data.', 'success');
    }

    return alerts;
  }, [sensorData, systemOverview, dismissedAlerts, devices]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return generatedAlerts;
    return generatedAlerts.filter(a => a.type === filter);
  }, [generatedAlerts, filter]);

  const dismissAlert = (id) => setDismissedAlerts(prev => new Set(prev).add(id));
  const clearAll = () => setDismissedAlerts(new Set(generatedAlerts.map(a => a.id)));

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ padding: '1.5rem', paddingBottom: '140px', background: COLORS.bg, fontFamily: "'Outfit', sans-serif" }}
    >
      
      {/* 1. FILTERS */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '8px' }} className="no-scrollbar">
        {[
          { id: 'all', label: 'All', icon: Bell, color: 'var(--primary)' },
          { id: 'critical', label: 'Critical', icon: Zap, color: COLORS.critical },
          { id: 'warning', label: 'Warnings', icon: AlertTriangle, color: COLORS.warning },
          { id: 'success', label: 'Optimal', icon: ShieldCheck, color: COLORS.success }
        ].map(f => {
          const isActive = filter === f.id;
          return (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '10px 18px', borderRadius: '16px', border: 'none',
                background: isActive ? f.color : 'var(--bg-card)',
                color: isActive ? 'var(--bg-card)' : COLORS.subtext,
                fontSize: '0.75rem', fontWeight: 850, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: isActive ? `0 8px 25px ${f.color}30` : 'var(--shadow-sm)',
                border: isActive ? 'none' : '1px solid var(--glass-stroke)',
                transition: '0.3s'
              }}
            >
              {React.createElement(f.icon, { size: 14, strokeWidth: 3 })} {f.label}
            </motion.button>
          );
        })}
      </div>

      {/* 2. ACTIONS (Now below filters) */}
      <section style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={clearAll} 
            style={{ 
              background: 'var(--danger-soft)', border: 'none', 
              padding: '8px 14px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)',
              cursor: 'pointer', transition: '0.2s'
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 950, letterSpacing: '0.05em' }}>CLEAR ALL</span>
            <Trash2 size={15} strokeWidth={2.5} />
          </motion.button>
      </section>

      {/* 3. ALERTS LIST */}
      <div style={{ minHeight: '400px' }}>
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                height: '350px', background: 'linear-gradient(165deg, var(--bg-main) 0%, var(--bg-card) 100%)',
                borderRadius: '32px', border: '1.5px dashed var(--glass-stroke)', padding: '2rem', textAlign: 'center'
              }}
            >
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '24px', background: 'var(--primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
              }}>
                <ShieldCheck size={36} color={COLORS.success} strokeWidth={2} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: COLORS.text }}>Shield Active</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: COLORS.subtext, fontWeight: 700, maxWidth: '200px', lineHeight: 1.5 }}>
                All industrial systems are reporting normal parameters.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
};

export default AlertCenter;
