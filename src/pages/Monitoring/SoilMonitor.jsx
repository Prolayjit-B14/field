/**
 * AgriSense Pro v18.0.0 "Ultra-Premium" Soil Monitoring
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, Thermometer, Activity, FlaskConical, Beaker, Hexagon, 
  ChevronRight, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import useTrendEngine from '../../hooks/useTrendEngine';

// ─── ANIMATION CONFIGS ──────────────────────────────────────────────────────
const springConfig = { type: 'spring', stiffness: 300, damping: 30 };
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};
const itemFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springConfig }
};

// ─── DIAGNOSTIC CARD ────────────────────────────────────────────────────────

const DiagnosticCard = ({ label, value, min, max, icon: Icon, color, range, trendInfo, sensorId }) => {
  const navigate = useNavigate();
  const isOffline = value === null || value === undefined;
  const systemColor = isOffline ? 'var(--text-inactive)' : color;

  // ── Status dot and body tint: green / yellow / red ──────────────────────
  const numVal = parseFloat(value);
  const health = isOffline ? 'offline'
    : (numVal >= min && numVal <= max) ? 'optimal'
    : (numVal >= min - (max - min) * 0.15 && numVal <= max + (max - min) * 0.15) ? 'warning'
    : 'critical';

  const statusMap = {
    optimal:  { dot: 'var(--primary)' },
    warning:  { dot: 'var(--accent)' },
    critical: { dot: 'var(--danger)' },
    offline:  { dot: 'var(--text-inactive)' }
  };

  const { dot: dotColor } = statusMap[health];

  return (
    <motion.div
      variants={itemFadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/sensor-detail', { state: { sensorId, from: '/soil-monitoring' } })}
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-card)',
        border: '1px solid ' + (isOffline ? 'var(--glass-stroke)' : systemColor + '30'),
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: '170px'
      }}
    >
      {/* ── TOP BAND: solid background ── */}
      <div style={{
        background: isOffline ? 'var(--bg-main)' : systemColor + '15',
        padding: '0.9rem 1rem 0.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '12px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: isOffline ? 'var(--bg-main)' : systemColor + '25',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'none',
          border: isOffline ? 'none' : '1px solid ' + systemColor + '20'
        }}>
          <Icon size={21} color={isOffline ? 'var(--text-inactive)' : systemColor} strokeWidth={2.5} />
        </div>
        <span style={{
          fontSize: '0.8rem', fontWeight: 900,
          color: isOffline ? 'var(--text-inactive)' : systemColor,
          letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.2
        }}>
          {label}
        </span>
      </div>

      {/* ── BODY: PURE WHITE background, big centered value ── */}
      <div style={{
        background: 'var(--bg-card)',
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0.5rem 1rem 0.8rem'
      }}>
        <span style={{
          fontSize: '3.2rem', fontWeight: 950,
          color: isOffline ? 'var(--text-inactive)' : 'var(--text-main)',
          letterSpacing: '-0.06em', lineHeight: 1, textAlign: 'center'
        }}>
          {isOffline ? '--' : value}
        </span>

        {/* Range + trend */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '5px', marginTop: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.48rem', fontWeight: 950,
            color: isOffline ? 'var(--text-inactive)' : systemColor,
            letterSpacing: '0.08em', opacity: 0.75
          }}>RANGE</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-inactive)' }}>
            {range}
          </span>
          {!isOffline && (
            trendInfo?.trend === 'increasing'
              ? <ArrowUp size={11} color={systemColor} />
              : trendInfo?.trend === 'decreasing'
                ? <ArrowDown size={11} color="var(--danger)" />
                : <Minus size={11} color="var(--text-inactive)" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

const SoilMonitoring = () => {
  const navigate = useNavigate();
  const { sensorData, sensorHistory, systemHealth } = useTelemetry();
  const trend = useTrendEngine(sensorHistory);

  const soil = sensorData?.soil || {};
  const healthScore = systemHealth.soil;

  const stats = useMemo(() => {
    const n = soil.npk || {};
    const safeNum = (val, dec = 1) => (val !== null && val !== undefined && !isNaN(val)) ? Number(val).toFixed(dec) : null;
    return {
      moisture: safeNum(soil.moisture),
      temp: safeNum(soil.temp),
      ph: safeNum(soil.ph),
      n: safeNum(n.n, 0),
      p: safeNum(n.p, 0),
      k: safeNum(n.k, 0)
    };
  }, [soil]);

  const isOnline = stats.moisture !== null || stats.temp !== null || stats.ph !== null;

  const heroConfig = useMemo(() => {
    const mainColor = '#8B5E3C';
    if (!isOnline) return { label: 'Node Offline', status: 'Inactive', color: 'var(--text-muted)', bg: 'var(--bg-main)' };
    if (healthScore >= 75) return { label: 'Optimal Soil', status: 'Stable', color: mainColor, bg: 'var(--bg-card)' };
    if (healthScore >= 45) return { label: 'Soil Warning', status: 'Adjust', color: 'var(--accent)', bg: 'var(--bg-card)' };
    return { label: 'Critical Alert', status: 'Urgent', color: 'var(--danger)', bg: 'var(--bg-card)' };
  }, [isOnline, healthScore]);


  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ padding: '16px', paddingBottom: '24px' }}
    >
      {/* Cinematic Hero */}
      <motion.div
        variants={itemFadeUp}
        style={{
          background: heroConfig.bg,
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '1.5rem',
          border: '1px solid ' + (isOnline ? heroConfig.color + '25' : 'var(--border-main)'),
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        {/* Background Accent */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: heroConfig.color + '10', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* ── HEADER ROW ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px',
              background: 'var(--bg-sheet)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
              border: '1px solid ' + heroConfig.color + '20'
            }}>
              <Sprout size={24} color={heroConfig.color} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Soil Health Index
              </h2>
            </div>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: '100px',
            background: 'var(--bg-card)', color: heroConfig.color,
            fontSize: '0.7rem', fontWeight: 950,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid ' + heroConfig.color + '25',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            {heroConfig.status}
          </div>
        </div>

        {/* ── MAIN CONTENT: Split Layout ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Left: Health Score (Fixed width to prevent shifting) */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: '140px' }}>
            <span style={{ fontSize: '5rem', fontWeight: 950, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.06em', lineHeight: 0.9 }}>
              {(!isOnline || healthScore === null) ? '--' : healthScore}
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.6 }}>%</span>
          </div>

          {/* Right: Vital Stats Panel (Compacted) */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            padding: '1rem 1.25rem', background: 'var(--glass)',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)',
            maxWidth: '200px'
          }}>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Sensors
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)' }}>
                {isOnline ? '6 / 6' : '0 / 6'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Sync
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Live
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6-Card Sensor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <DiagnosticCard sensorId="moisture" label="Moisture"       value={stats.moisture} min={30}  max={60}  icon={Sprout}       color="#8B5E3C" range="30-60 %"  trendInfo={trend.moisture} />
        <DiagnosticCard sensorId="temp"     label="Temperature"    value={stats.temp}     min={18}  max={32}  icon={Thermometer}  color="#FF6B35" range="18-32 °C" trendInfo={trend.temperature} />
        <DiagnosticCard sensorId="ph"       label="Soil pH"        value={stats.ph}       min={6.0} max={7.5} icon={Activity}     color="#14B8A6" range="6.0-7.5"  trendInfo={trend.ph} />
        <DiagnosticCard sensorId="n"        label="Nitrogen (N)"   value={stats.n}        min={40}  max={60}  icon={FlaskConical} color="#22C55E" range="40-60 mg" trendInfo={trend.npk} />
        <DiagnosticCard sensorId="p"        label="Phosphorus (P)" value={stats.p}        min={20}  max={40}  icon={Beaker}       color="#A855F7" range="20-40 mg" trendInfo={trend.npk} />
        <DiagnosticCard sensorId="k"        label="Potassium (K)"  value={stats.k}        min={30}  max={50}  icon={Hexagon}      color="#FACC15" range="30-50 mg" trendInfo={trend.npk} />
      </div>


      <motion.button
        variants={itemFadeUp}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/analytics', { state: { tab: 'soil' } })}
        className="btn-premium"

        style={{ width: '100%', marginTop: '1rem' }}
      >
        DETAILED ANALYTICS <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
};

export default SoilMonitoring;
