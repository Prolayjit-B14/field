/**
 * AgriSense Pro v18.0.0 "Ultra-Premium" Weather Monitoring
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CloudRain, Sun, Wind, Thermometer, Droplets,
  Sunrise, Sunset, LineChart, Umbrella, CloudSun,
  AlignLeft, AlignCenter, BarChart3, List, Layout, Rows, Columns,
  ChevronRight, Cloud, Zap, ArrowUp, ArrowDown, Minus,
  Gauge, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
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

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────

const DiagnosticCard = ({ label, value, min, max, icon: Icon, color, range, trendInfo, unit, sensorId }) => {
  const navigate = useNavigate();
  const isOffline = value === null || value === undefined;
  const systemColor = isOffline ? 'var(--text-inactive)' : color;

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
      onClick={() => navigate('/sensor-detail', { state: { sensorId, from: '/weather' } })}
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

      <div style={{
        background: 'var(--bg-card)',
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0.5rem 1rem 0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{
            fontSize: '3.2rem', fontWeight: 950,
            color: isOffline ? 'var(--text-inactive)' : 'var(--text-main)',
            letterSpacing: '-0.06em', lineHeight: 1, textAlign: 'center'
          }}>
            {isOffline ? '--' : value}
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-inactive)' }}>{unit}</span>
        </div>

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

const RegionalMetric = ({ label, value, icon: Icon, color }) => (
  <motion.div 
    variants={itemFadeUp}
    style={{ 
      background: 'var(--bg-card)', padding: '1rem 0.5rem', borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--glass-stroke)', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' 
    }}
  >
     <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <Icon size={16} color={color} strokeWidth={2.5} />
     </div>
     <div style={{ textAlign: 'center' }}>
       <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>{label}</p>
       <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{value}</p>
     </div>
  </motion.div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

const WeatherMonitoring = () => {
  const navigate = useNavigate();
  const { apiWeather, apiForecast } = useApp();
  const { sensorData, sensorHistory, systemHealth } = useTelemetry();
  const trend = useTrendEngine(sensorHistory);

  const weather = sensorData?.weather || {};
  const weatherScore = systemHealth.weather;
  
  const stats = useMemo(() => {
    const safeNum = (val, dec = 1) => (val !== null && val !== undefined && !isNaN(val)) ? Number(val).toFixed(dec) : null;
    return { 
      temp: safeNum(weather.temp), 
      humidity: safeNum(weather.humidity, 0), 
      light: safeNum(weather.lightIntensity, 0), 
      rain: safeNum(weather.rainLevel, 1) 
    };
  }, [weather]);

  const isOnline = weatherScore !== null;

  const heroConfig = useMemo(() => {
    const mainColor = '#3B82F6';
    if (!isOnline) return { label: 'Node Offline', status: 'Inactive', color: 'var(--text-muted)', bg: 'var(--bg-main)' };
    if (weatherScore >= 75) return { label: 'Weather Optimal', status: 'Stable', color: mainColor, bg: 'var(--bg-card)' };
    if (weatherScore >= 45) return { label: 'Climate Warning', status: 'Adjust', color: 'var(--accent)', bg: 'var(--bg-card)' };
    return { label: 'Extreme Alert', status: 'Urgent', color: 'var(--danger)', bg: 'var(--bg-card)' };
  }, [isOnline, weatherScore]);

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ padding: '16px', paddingBottom: '24px' }}
    >
      {/* Industrial Hero Card */}
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
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: heroConfig.color + '10', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px',
              background: 'var(--bg-sheet)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
              border: '1px solid ' + heroConfig.color + '20'
            }}>
              <CloudSun size={24} color={heroConfig.color} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Weather Health Index
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: '140px' }}>
            <span style={{ fontSize: '5rem', fontWeight: 950, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.06em', lineHeight: 0.9 }}>
              {(!isOnline || weatherScore === null) ? '--' : Math.round(weatherScore)}
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.6 }}>%</span>
          </div>

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
                {isOnline ? '4 / 4' : '0 / 4'}
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

      {/* Sensor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <DiagnosticCard sensorId="weather_temp" label="Temp"     value={stats.temp}     min={18} max={32} unit="°C" icon={Thermometer} color="#FF6B35" range="18-32 °C" trendInfo={trend.temperature} />
        <DiagnosticCard sensorId="humidity"     label="Humidity" value={stats.humidity} min={40} max={70} unit="%"  icon={Droplets}    color="#4DA8FF" range="40-70 %"  trendInfo={trend.humidity} />
        <DiagnosticCard sensorId="light"        label="Sunlight" value={stats.light}    min={1000} max={8000} unit="lx" icon={Sun}     color="#FFD600" range="1k-8k lx" />
        <DiagnosticCard sensorId="rain"         label="Rain"     value={stats.rain}     min={0} max={100} unit="mm" icon={CloudRain}   color="#3B82F6" range="0-100 mm" />
      </div>

      {/* Regional Data Grid */}
      <motion.section variants={itemFadeUp} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <div style={{ width: '4px', height: '18px', background: 'var(--secondary)', borderRadius: '2px' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.02em' }}>Regional Intelligence</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
           <RegionalMetric label="AQI"    value={apiWeather?.aqi || '--'} icon={Activity} color="#10B981" />
           <RegionalMetric label="Wind"   value={apiWeather?.windSpeed || '--'} icon={Wind} color="#F59E0B" />
           <RegionalMetric label="Press"  value={apiWeather?.pressure || '--'} icon={Gauge} color="#8B5CF6" />
           <RegionalMetric label="Feels"  value={`${apiWeather?.feelsLike || '--'}°`} icon={Thermometer} color="#EF4444" />
           <RegionalMetric label="Set"    value={apiWeather?.sunset || '--'} icon={Sunset} color="#3B82F6" />
           <RegionalMetric label="Rise"   value={apiWeather?.sunrise || '--'} icon={Sunrise} color="#F59E0B" />
           <RegionalMetric label="UV"     value={apiWeather?.uvIndex || '--'} icon={Sun} color="#F97316" />
           <RegionalMetric label="Clouds" value={apiWeather?.clouds ? `${apiWeather.clouds}%` : '--'} icon={Cloud} color="#64748B" />
        </div>
      </motion.section>

      {/* 5-Day Forecast */}
      <motion.section variants={itemFadeUp} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '2px' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.02em' }}>5-Day Forecast</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(apiForecast || []).map((day, idx) => (
            <motion.div 
              key={idx} 
              whileTap={{ scale: 0.98 }}
              style={{ 
                display: 'flex', alignItems: 'center', padding: '1rem', 
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--glass-stroke)', boxShadow: 'var(--shadow-sm)' 
              }}
            >
              <div style={{ width: '70px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{day.date}</p>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-sheet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {day.condition.includes('Rain') ? <CloudRain size={20} color="var(--secondary)" /> : <Sun size={20} color="var(--accent)" />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{day.condition}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Umbrella size={12} color="var(--secondary)" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--secondary)' }}>{day.rainProb || '0%'}</span>
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{day.temp}°</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.button 
        variants={itemFadeUp}
        whileTap={{ scale: 0.98 }} 
        onClick={() => navigate('/analytics', { state: { tab: 'weather' } })} 
        className="btn-premium"
        style={{ width: '100%', marginTop: '1rem' }}
      >
        DETAILED ANALYTICS <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
};

export default WeatherMonitoring;
