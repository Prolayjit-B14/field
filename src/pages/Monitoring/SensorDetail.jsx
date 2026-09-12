/**
 * AgriSense Pro - Dedicated Single Sensor Detail Screen
 * Dynamically renders dedicated telemetry, range, trend analytics,
 * and integrated node status & device details for ANY sensor.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  ArrowLeft, Droplets, Thermometer, Activity, 
  FlaskConical, Beaker, Hexagon, Sun, CloudRain,
  Signal, Battery, Wifi, CheckCircle2, Sliders,
  RefreshCw, Clock, Cpu, ShieldCheck, Sprout, ChevronRight
} from 'lucide-react';

const RANGE_OPTIONS = ['Live', '1H', '6H', '1D', '7D', '28D'];

// Complete sensor catalogue mapping each sensor to its data key, optimal range, and host node
const SENSOR_CONFIGS = {
  // ─── SOIL NODE SENSORS (Node: SOIL-01) ───
  moisture: {
    id: 'moisture',
    name: 'Soil Moisture',
    category: 'Soil Monitoring',
    unit: '%',
    min: 30,
    max: 60,
    optimalStr: '30 – 60 %',
    icon: Droplets,
    color: '#15803D',
    bgIcon: '#F0FDF4',
    borderIcon: '#DCFCE7',
    extractVal: (data) => data?.soil?.moisture,
    chartDefault: 42,
    chartMin: 0,
    chartMax: 100,
    node: {
      id: 'SOIL-01',
      name: 'SOIL-01',
      type: 'Soil Monitoring Node'
    }
  },
  temp: {
    id: 'temp',
    name: 'Soil Temperature',
    category: 'Soil Monitoring',
    unit: '°C',
    min: 18,
    max: 32,
    optimalStr: '18 – 32 °C',
    icon: Thermometer,
    color: '#FF6B35',
    bgIcon: '#FFF7ED',
    borderIcon: '#FFEDD5',
    extractVal: (data) => data?.soil?.temp,
    chartDefault: 24,
    chartMin: 0,
    chartMax: 50,
    node: {
      id: 'SOIL-01',
      name: 'SOIL-01',
      type: 'Soil Monitoring Node'
    }
  },
  ph: {
    id: 'ph',
    name: 'Soil pH Level',
    category: 'Soil Monitoring',
    unit: 'pH',
    min: 6.0,
    max: 7.5,
    optimalStr: '6.0 – 7.5 pH',
    icon: Activity,
    color: '#14B8A6',
    bgIcon: '#F0FDFA',
    borderIcon: '#CCFBF1',
    extractVal: (data) => data?.soil?.ph,
    chartDefault: 6.8,
    chartMin: 0,
    chartMax: 14,
    node: {
      id: 'SOIL-01',
      name: 'SOIL-01',
      type: 'Soil Monitoring Node'
    }
  },
  n: {
    id: 'n',
    name: 'Nitrogen (N)',
    category: 'Soil Fertility',
    unit: 'mg/kg',
    min: 40,
    max: 60,
    optimalStr: '40 – 60 mg/kg',
    icon: FlaskConical,
    color: '#22C55E',
    bgIcon: '#F0FDF4',
    borderIcon: '#DCFCE7',
    extractVal: (data) => data?.soil?.npk?.n,
    chartDefault: 48,
    chartMin: 0,
    chartMax: 100,
    node: {
      id: 'SOIL-01',
      name: 'SOIL-01',
      type: 'Soil Monitoring Node'
    }
  },
  p: {
    id: 'p',
    name: 'Phosphorus (P)',
    category: 'Soil Fertility',
    unit: 'mg/kg',
    min: 20,
    max: 40,
    optimalStr: '20 – 40 mg/kg',
    icon: Beaker,
    color: '#A855F7',
    bgIcon: '#FAF5FF',
    borderIcon: '#F3E8FF',
    extractVal: (data) => data?.soil?.npk?.p,
    chartDefault: 28,
    chartMin: 0,
    chartMax: 80,
    node: {
      id: 'SOIL-01',
      name: 'SOIL-01',
      type: 'Soil Monitoring Node'
    }
  },
  k: {
    id: 'k',
    name: 'Potassium (K)',
    category: 'Soil Fertility',
    unit: 'mg/kg',
    min: 30,
    max: 50,
    optimalStr: '30 – 50 mg/kg',
    icon: Hexagon,
    color: '#EAB308',
    bgIcon: '#FEFCE8',
    borderIcon: '#FEF08A',
    extractVal: (data) => data?.soil?.npk?.k,
    chartDefault: 38,
    chartMin: 0,
    chartMax: 100,
    node: {
      id: 'SOIL-01',
      name: 'SOIL-01',
      type: 'Soil Monitoring Node'
    }
  },

  // ─── WEATHER STATION SENSORS (Node: WEATHER-01) ───
  weather_temp: {
    id: 'weather_temp',
    name: 'Air Temperature',
    category: 'Weather Station',
    unit: '°C',
    min: 18,
    max: 32,
    optimalStr: '18 – 32 °C',
    icon: Thermometer,
    color: '#FF6B35',
    bgIcon: '#FFF7ED',
    borderIcon: '#FFEDD5',
    extractVal: (data) => data?.weather?.temp,
    chartDefault: 26,
    chartMin: 0,
    chartMax: 50,
    node: {
      id: 'WEATHER-01',
      name: 'WEATHER-01',
      type: 'Weather Station Node'
    }
  },
  humidity: {
    id: 'humidity',
    name: 'Air Humidity',
    category: 'Weather Station',
    unit: '%',
    min: 40,
    max: 70,
    optimalStr: '40 – 70 %',
    icon: Droplets,
    color: '#4DA8FF',
    bgIcon: '#EFF6FF',
    borderIcon: '#DBEAFE',
    extractVal: (data) => data?.weather?.humidity,
    chartDefault: 58,
    chartMin: 0,
    chartMax: 100,
    node: {
      id: 'WEATHER-01',
      name: 'WEATHER-01',
      type: 'Weather Station Node'
    }
  },
  light: {
    id: 'light',
    name: 'Sunlight Intensity',
    category: 'Weather Station',
    unit: 'lx',
    min: 1000,
    max: 8000,
    optimalStr: '1,000 – 8,000 lx',
    icon: Sun,
    color: '#EAB308',
    bgIcon: '#FEFCE8',
    borderIcon: '#FEF08A',
    extractVal: (data) => data?.weather?.lightIntensity,
    chartDefault: 4500,
    chartMin: 0,
    chartMax: 10000,
    node: {
      id: 'WEATHER-01',
      name: 'WEATHER-01',
      type: 'Weather Station Node'
    }
  },
  rain: {
    id: 'rain',
    name: 'Precipitation Level',
    category: 'Weather Station',
    unit: 'mm',
    min: 0,
    max: 100,
    optimalStr: '0 – 100 mm',
    icon: CloudRain,
    color: '#3B82F6',
    bgIcon: '#EFF6FF',
    borderIcon: '#DBEAFE',
    extractVal: (data) => data?.weather?.rainLevel,
    chartDefault: 12,
    chartMin: 0,
    chartMax: 150,
    node: {
      id: 'WEATHER-01',
      name: 'WEATHER-01',
      type: 'Weather Station Node'
    }
  }
};

const SensorDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sensorData, sensorHistory, mqttStatus, lastGlobalUpdate } = useTelemetry();

  // Determine which sensor was requested (via state, search query, or default to moisture)
  const searchParams = new URLSearchParams(location.search);
  const requestedSensorId = location.state?.sensorId || searchParams.get('sensor') || 'moisture';
  const returnPath = location.state?.from || (requestedSensorId.includes('weather') || ['humidity', 'light', 'rain'].includes(requestedSensorId) ? '/weather' : '/soil-monitoring');

  const config = SENSOR_CONFIGS[requestedSensorId] || SENSOR_CONFIGS.moisture;
  const SensorIcon = config.icon;

  const [activeRange, setActiveRange] = useState('Live');
  const [rangeConfiguredNotice, setRangeConfiguredNotice] = useState(false);

  // Read actual telemetry value
  const rawValue = config.extractVal(sensorData);
  const isOnline = rawValue !== null && rawValue !== undefined && mqttStatus === 'connected';
  const numValue = isOnline ? parseFloat(rawValue) : null;
  const displayValue = isOnline ? `${rawValue} ${config.unit}` : `-- ${config.unit}`;

  // Evaluate sensor status
  const status = useMemo(() => {
    if (!isOnline || numValue === null || isNaN(numValue)) {
      return { label: 'Offline', color: '#64748B', bg: '#F1F5F9' };
    }
    if (numValue < config.min) {
      return { label: 'Low', color: '#EF4444', bg: '#FEF2F2' };
    }
    if (numValue > config.max) {
      return { label: 'High', color: '#F59E0B', bg: '#FFFBEB' };
    }
    return { label: 'Optimal', color: config.color, bg: config.bgIcon };
  }, [isOnline, numValue, config]);

  // Generate historical trend points for this specific sensor
  const chartPoints = useMemo(() => {
    if (sensorHistory && sensorHistory.length > 5) {
      const extracted = sensorHistory.slice(-10).map(h => {
        const val = config.extractVal(h);
        return val != null && !isNaN(val) ? parseFloat(val) : null;
      }).filter(v => v !== null);

      if (extracted.length >= 3) return extracted;
    }
    // Fallback baseline points around current telemetry or sensible norm
    const base = isOnline && numValue !== null ? numValue : config.chartDefault;
    const spread = (config.max - config.min) * 0.15 || 5;
    return [
      base - spread * 0.8,
      base - spread * 0.3,
      base - spread * 1.1,
      base + spread * 0.2,
      base + spread * 1.2,
      base + spread * 0.7,
      base - spread * 0.2,
      base + spread * 0.9
    ].map(v => Math.max(config.chartMin, Math.min(config.chartMax, Number(v.toFixed(1)))));
  }, [sensorHistory, isOnline, numValue, config]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!isOnline) {
      return { min: '--', max: '--', avg: '--', current: '--' };
    }
    const min = Math.min(...chartPoints).toFixed(1);
    const max = Math.max(...chartPoints).toFixed(1);
    const avg = (chartPoints.reduce((a, b) => a + b, 0) / chartPoints.length).toFixed(1);
    return {
      min: `${min} ${config.unit}`,
      max: `${max} ${config.unit}`,
      avg: `${avg} ${config.unit}`,
      current: `${numValue} ${config.unit}`
    };
  }, [chartPoints, isOnline, numValue, config.unit]);

  // SVG Chart polyline calculation
  const svgWidth = 340;
  const svgHeight = 110;
  const polylineCoords = useMemo(() => {
    const minVal = config.chartMin;
    const maxVal = config.chartMax;
    return chartPoints.map((val, idx) => {
      const x = (idx / (chartPoints.length - 1)) * (svgWidth - 20) + 10;
      const y = svgHeight - 15 - ((val - minVal) / (maxVal - minVal)) * (svgHeight - 30);
      return { x, y, val };
    });
  }, [chartPoints, config.chartMin, config.chartMax]);

  const pointsString = polylineCoords.map(p => `${p.x},${p.y}`).join(' ');

  const handleConfigureRange = () => {
    setRangeConfiguredNotice(true);
    setTimeout(() => setRangeConfiguredNotice(false), 3000);
  };

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

      {/* ─── TOP NAVIGATION BREADCRUMB ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <button
          onClick={() => navigate(returnPath)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: '12px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-main)',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to {returnPath.includes('weather') ? 'Weather' : 'Soil'} Monitor</span>
        </button>

        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {config.category}
        </span>
      </div>

      {/* ─── SENSOR IDENTITY HEADER ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: config.bgIcon,
            border: `1px solid ${config.borderIcon}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: config.color
          }}>
            <SensorIcon size={24} strokeWidth={2.3} />
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {config.name}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              Node: {config.node.id} • {config.node.type}
            </div>
          </div>
        </div>

        {/* Live / Offline Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '20px',
          background: isOnline ? config.color : '#64748B',
          color: '#FFFFFF',
          fontSize: '0.74rem',
          fontWeight: 800,
          boxShadow: isOnline ? `0 2px 8px ${config.color}40` : 'none'
        }}>
          <span style={{ fontSize: '0.7rem' }}>●</span>
          <span>{isOnline ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* ─── PRIMARY TELEMETRY CARD WITH OPTIMAL RANGE ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '26px',
          padding: '22px 20px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 950,
            color: 'var(--text-main)',
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            {displayValue}
          </div>
          <div style={{
            fontSize: '0.84rem',
            fontWeight: 800,
            color: status.color,
            marginTop: '6px'
          }}>
            {status.label} Reading
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            marginTop: '4px',
            fontWeight: 500
          }}>
            Last sync: {lastGlobalUpdate || '5 sec ago'}
          </div>
        </div>

        {/* Right Info: Optimal Range */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Optimal Range
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
            {config.optimalStr}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: status.color,
            marginTop: '4px'
          }}>
            <span>●</span>
            <span>{status.label}</span>
          </div>
        </div>
      </motion.div>

      {/* Range Configured Toast */}
      {rangeConfiguredNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: config.bgIcon,
            border: `1px solid ${config.borderIcon}`,
            color: config.color,
            borderRadius: '14px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>Optimal target range active: {config.optimalStr}</span>
        </motion.div>
      )}

      {/* ─── HISTORICAL RANGE SELECTOR ─── */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '14px',
        background: 'var(--bg-card)',
        padding: '4px',
        borderRadius: '16px',
        border: '1px solid var(--border-main)'
      }}>
        {RANGE_OPTIONS.map(range => {
          const isSelected = activeRange === range;
          return (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              style={{
                flex: 1,
                height: '32px',
                borderRadius: '12px',
                border: 'none',
                background: isSelected ? config.color : 'transparent',
                color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {range}
            </button>
          );
        })}
      </div>

      {/* ─── TREND LINE CHART ─── */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '16px 14px 12px',
        border: '1px solid var(--border-main)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Telemetry Trend</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{config.unit} ({activeRange})</span>
        </div>

        {/* SVG Line Graph */}
        <div style={{ width: '100%', height: '120px', position: 'relative' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Horizontal Grid lines */}
            {[25, 50, 75, 100].map(pct => {
              const gridVal = Math.round(config.chartMin + (pct / 100) * (config.chartMax - config.chartMin));
              const y = svgHeight - 15 - (pct / 100) * (svgHeight - 30);
              return (
                <g key={pct}>
                  <line x1="28" y1={y} x2={svgWidth - 10} y2={y} stroke="var(--border-main)" strokeDasharray="3 3" strokeWidth="1" />
                  <text x="4" y={y + 3} fill="var(--text-inactive)" fontSize="7.5" fontWeight="600">{gridVal}</text>
                </g>
              );
            })}

            {/* Polyline */}
            <polyline
              fill="none"
              stroke={config.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />

            {/* Data point dots */}
            {polylineCoords.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#FFFFFF" stroke={config.color} strokeWidth="2" />
            ))}
          </svg>
        </div>

        {/* X-Axis Timestamps */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 14px 0 28px',
          fontSize: '0.68rem',
          color: 'var(--text-inactive)',
          fontWeight: 600
        }}>
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>Now</span>
        </div>
      </div>

      {/* ─── 4-COLUMN STATISTICS ─── */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 4px' }}>
          Telemetry Statistics
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px'
        }}>
          {[
            { label: 'Min', value: stats.min },
            { label: 'Max', value: stats.max },
            { label: 'Avg', value: stats.avg },
            { label: 'Current', value: stats.current }
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '10px 8px',
                border: '1px solid var(--border-main)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SENSOR ACTIONS: CONFIGURE RANGE & VIEW HOST NODE ─── */}
      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingBottom: '16px' }}>
        <button
          onClick={handleConfigureRange}
          style={{
            flex: 1,
            height: '46px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-main)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Sliders size={16} />
          <span>Configure Range</span>
        </button>

        <button
          onClick={() => navigate('/device-detail', { state: { nodeId: config.node.id, from: returnPath } })}
          style={{
            flex: 1,
            height: '46px',
            borderRadius: '16px',
            background: config.color,
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 4px 14px ${config.color}35`
          }}
        >
          <Cpu size={16} />
          <span>View Node Details</span>
        </button>
      </div>

    </div>
  );
};

export default SensorDetail;
