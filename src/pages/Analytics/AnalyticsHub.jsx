/**
 * AgriSense Pro v17.1.0 High-Density Analytical Intelligence Hub
 * 8-Chart Diagnostic Matrix per module for Deep Insight.
 * Fixed: Synchronized with global sensor history for immediate graph rendering.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
  Sprout, CloudRain, Archive, Download, FileText, Droplets, Camera
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { useLocation, useNavigate } from 'react-router-dom';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
const COLORS = {
  good: 'var(--primary)', warning: 'var(--accent)', critical: 'var(--danger)', neutral: 'var(--text-muted)',
  bg: 'var(--bg-main)', card: 'var(--bg-card)', border: 'var(--glass-stroke)', text: 'var(--text-main)', subtext: 'var(--text-muted)',
  soil: ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--danger)', 'var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--primary)'],
  weather: ['var(--secondary)', 'var(--accent)', 'var(--primary)', 'var(--secondary)', 'var(--danger)', 'var(--primary)', 'var(--accent)', 'var(--secondary)'],
  water: ['var(--secondary)', 'var(--primary)', 'var(--primary)', 'var(--accent)'],
  vision: ['var(--accent)', 'var(--secondary)', 'var(--danger)', 'var(--primary)']
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────
// 🚀 PERFORMANCE: Memoize the card and use CSS containment to prevent layout thrashing
const AnalyticsCard = React.memo(({ title, isOffline, children, height = '340px', currentVal, avgVal, minVal, maxVal, unit = '', isHistorical, color }) => {
  return (
    <motion.div 
      variants={itemFadeUp}
      style={{
        background: 'linear-gradient(165deg, var(--bg-card) 0%, var(--bg-main) 100%)',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '1px solid var(--glass-stroke)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        height,
        position: 'relative',
        overflow: 'hidden',
        contain: 'content' // 🚀 PERFORMANCE: Isolate paint and layout
      }}
    >

      {/* 🚀 Diagnostic Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '14px', borderRadius: '4px', background: color }} />
            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, margin: 0, color: COLORS.subtext, letterSpacing: '0.05em' }}>{title}</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 950, color: COLORS.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {(isHistorical ? avgVal : currentVal)?.toFixed(1) || '--'}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: COLORS.subtext, opacity: 0.8 }}>
              {unit}
            </span>
          </div>
        </div>
        
        {isHistorical && !isOffline && (
          <div style={{ 
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', 
            background: 'var(--border-main)', padding: '1px', borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{ background: 'transparent', padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 900, color: COLORS.subtext, marginBottom: '2px' }}>Min</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 950, color: COLORS.text }}>{minVal?.toFixed(1) || '--'}</span>
            </div>
            <div style={{ background: 'transparent', padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 900, color: COLORS.subtext, marginBottom: '2px' }}>Max</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 950, color: COLORS.text }}>{maxVal?.toFixed(1) || '--'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 Chart Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', opacity: isOffline ? 0.05 : 1 }}>
          {children}
        </div>
        {isOffline && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Offline text removed per user request */}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ─── ANIMATION CONFIGS ──────────────────────────────────────────────────────
const springConfig = { type: "spring", stiffness: 300, damping: 30 };
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};
const itemFadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: springConfig }
};

const TIME_RANGES = [
  { id: 'realtime', label: 'Live', duration: 5 * 60 * 1000 },
  { id: '1h', label: '1 Hr', duration: 60 * 60 * 1000 },
  { id: '6h', label: '6 Hr', duration: 6 * 60 * 60 * 1000 },
  { id: '1d', label: '1 Day', duration: 24 * 60 * 60 * 1000 },
  { id: '1w', label: '7 Days', duration: 7 * 24 * 60 * 60 * 1000 },
  { id: '1m', label: '28 Days', duration: 28 * 24 * 60 * 60 * 1000 },
];

const CustomTooltip = ({ active, payload, unit, isRealtime, color }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const timeStr = isRealtime 
      ? new Date(data.name).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : new Date(data.name).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

    const dataSeries = payload.filter(p => p.dataKey !== '_envelope');

    return (
      <div style={{
        background: 'var(--bg-card)',
        padding: '5px 9px',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-main)',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '1px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '0px' }}>
          <div style={{ fontSize: '0.48rem', fontWeight: 800, opacity: 0.5, letterSpacing: '0.05em' }}>{timeStr}</div>
        </div>

        {dataSeries.map((entry, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '1px 0' }}>
            <div style={{ width: '2px', height: '10px', borderRadius: '1px', background: entry.color || color || COLORS.good }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              {dataSeries.length > 1 && <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.4, width: '10px' }}>{entry.dataKey[0]}</span>}
              <span style={{ fontSize: '1rem', fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1 }}>{entry.value?.toFixed(1)}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.5 }}>{unit}</span>
            </div>
          </div>
        ))}

        {dataSeries.length === 1 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--border-main)', marginTop: '2px' }}>
            {(() => {
              const dk = dataSeries[0].dataKey;
              const min = data[`${dk}_min`] ?? data.min;
              const max = data[`${dk}_max`] ?? data.max;
              const delta = (min != null && max != null) ? (max - min) : null;
              if (min == null && max == null) return null;
              return (
                <>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.35rem', fontWeight: 900, opacity: 0.4 }}>MN</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{min?.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.35rem', fontWeight: 900, opacity: 0.4 }}>MX</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{max?.toFixed(1)}</span>
                  </div>
                  {delta !== null && delta > 0 && (
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'baseline', marginLeft: 'auto' }}>
                      <span style={{ fontSize: '0.35rem', fontWeight: 900, opacity: 0.4 }}>Δ</span>
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: COLORS.good }}>{delta.toFixed(1)}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const Pinpoint = (props) => {
  const { cx, cy, stroke } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.15} stroke="none" />
      <circle cx={cx} cy={cy} r={5.5} fill="var(--bg-main)" stroke="var(--text-main)" strokeWidth={2.5} style={{ filter: 'var(--shadow-md)' }} />
    </g>
  );
};

const AnalyticsHub = () => {
  const { farmInfo } = useApp();
  const { sensorData, devices, sensorHistory, fetchHistory } = useTelemetry();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'soil');
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // 🚀 PERFORMANCE: Defer chart rendering until after navigation transition
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // 🛰️ DYNAMIC CLOUD FETCH: Load data when time range changes
  useEffect(() => {
    const rawNow = Date.now();
    const startTime = rawNow - timeRange.duration;
    
    // Only fetch if we are looking at a range larger than the last few minutes
    if (timeRange.id !== 'realtime') {
      setIsLoading(true);
      fetchHistory(startTime).finally(() => setIsLoading(false));
    }
  }, [timeRange.id]);

  // 🧠 TIME METRICS: Align with calendar boundaries for industrial determinism
  const timeMetrics = useMemo(() => {
    const rawNow = Date.now();
    const isMultiDay = ['1d', '1w', '1m'].includes(timeRange.id);
    
    if (!isMultiDay) {
      return { now: rawNow, startTime: rawNow - timeRange.duration };
    }

    // Align to local midnight of the start day
    const startOfToday = new Date(rawNow).setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(rawNow).setHours(24, 0, 0, 0);
    const numDays = Math.round(timeRange.duration / 86400000);
    const startTime = startOfToday - ((numDays - 1) * 86400000);
    
    return {
      now: rawNow,
      startTime: startTime,
      endTime: startOfTomorrow
    };
  }, [timeRange.duration, timeRange.id, sensorHistory.length]); // Update when data changes

  // ─── PROCESS GLOBAL HISTORY INTO CATEGORIZED TRENDS ───
  const historyData = useMemo(() => {
    const { startTime } = timeMetrics;
    const isRealtime = timeRange.id === 'realtime';
    
    const intervals = {
      'realtime': 5000, 
      '1h': 60000, 
      '6h': 300000,      // 🟢 6 Hour Logic: 5 Min Buckets (72 Points)
      '1d': 1800000,     // 🟢 1 Day Logic: 30 Min Buckets (48 Points)
      '1w': 3600000,     // 🟢 7 Day Logic: 1 Hour Buckets (168 Points)
      '1m': 86400000     // 🟢 28 Day Logic: 1 Day Buckets (28 Points)
    };
    const bucketSize = intervals[timeRange.id] || 0;

    const filteredHistory = sensorHistory.filter(entry => 
      entry.timestamp && entry.timestamp > 1000000 && entry.timestamp >= startTime
    );

    const mapData = (raw, type) => {
      if (raw.length === 0) return [];
      const mapped = raw.map(entry => {
        const ts = Number(entry.timestamp || 0);
        const base = { name: ts, plotTime: ts };
        if (type === 'soil') {
          return { ...base, 
            moisture: entry.soil?.moisture, ph: entry.soil?.ph, temp: entry.soil?.temp,
            n: entry.soil?.npk?.n, p: entry.soil?.npk?.p, k: entry.soil?.npk?.k,
            health: entry.soil?.healthIndex
          };
        }
        if (type === 'weather') {
          return { ...base, 
            temp: entry.weather?.temp, humidity: entry.weather?.humidity,
            lightIntensity: entry.weather?.lightIntensity, rainLevel: entry.weather?.rainLevel,
            health: entry.weather?.healthIndex
          };
        }
        if (type === 'water') {
          return { ...base, 
            level: entry.water?.level,
            pump: entry.water?.pumpActive ? 1 : 0
          };
        }
        if (type === 'vision') {
          return { ...base, 
            active: entry.vision?.active ? 1 : 0,
            pest: entry.vision?.detection === 'Pest Detected' ? 1 : 0
          };
        }
        return base;
      });

      if (isRealtime || bucketSize === 0) return mapped;

      // 🛰️ DYNAMIC BASE RESOLUTION (Step 1 of 2)
      const baseResolutions = { 
        '1h': 60000, 
        '6h': 60000,     // 6h uses 1-min base
        '1d': 300000,    // 1d uses 5-min base
        '1w': 1800000,   // 7d uses 30-min base (Requested: mean of 30-min values)
        '1m': 3600000    // 30d uses 1-hour base (Requested: mean of 1-hour values)
      };

      // 🛰️ TWO-STEP INDUSTRIAL AGGREGATION (Specifically for 6h Logic)
      // Step 1: Normalize into 1-minute resolution (Preserving absolute min/max for the area envelope)
      const baseRes = baseResolutions[timeRange.id] || 60000;

      // Step 1: Normalize into Base Resolution (eliminates sampling noise)
      const baseResolutionData = [];
      const bBuckets = {};
      mapped.forEach(entry => {
        const bKey = Math.floor(entry.name / baseRes) * baseRes;
        if (!bBuckets[bKey]) bBuckets[bKey] = [];
        bBuckets[bKey].push(entry);
      });

      Object.keys(bBuckets).sort().forEach(bKey => {
        const pts = bBuckets[bKey];
        const bAvg = { name: Number(bKey) };
        const keys = Object.keys(mapped[0]).filter(k => !['name', 'plotTime'].includes(k));
        keys.forEach(k => {
          const v = pts.map(p => p[k]).filter(x => x !== null && x !== undefined);
          if (v.length) {
            bAvg[k] = v.reduce((a, b) => a + b, 0) / v.length;
            bAvg[`${k}_min`] = Math.min(...v);
            bAvg[`${k}_max`] = Math.max(...v);
          } else {
            bAvg[k] = null;
            bAvg[`${k}_min`] = null;
            bAvg[`${k}_max`] = null;
          }
        });
        baseResolutionData.push(bAvg);
      });

      // Step 2: Aggregate into final bucketSize (e.g. 1-hour for 7d)
      const aggregated = [];
      const buckets = {};
      baseResolutionData.forEach(entry => {
        // 🛰️ CALENDAR ALIGNMENT: Ensure buckets align with midnight for multi-day views
        let bucketKey;
        if (bucketSize >= 86400000) {
          bucketKey = new Date(entry.name).setHours(0, 0, 0, 0);
        } else {
          bucketKey = Math.floor(entry.name / bucketSize) * bucketSize;
        }

        if (!buckets[bucketKey]) buckets[bucketKey] = [];
        buckets[bucketKey].push(entry);
      });

      const bucketKeys = Object.keys(buckets).sort((a,b) => Number(a)-Number(b));
      bucketKeys.forEach(bucketKey => {
        const bucketPoints = buckets[bucketKey];
        const avgEntry = { name: Number(bucketKey) };
        const keys = Object.keys(mapped[0]).filter(k => !['name', 'plotTime'].includes(k));
        
        keys.forEach(k => {
          const avgs = bucketPoints.map(p => p[k]).filter(v => v !== null && v !== undefined);
          const mins = bucketPoints.map(p => p[`${k}_min`]).filter(v => v !== null && v !== undefined);
          const maxs = bucketPoints.map(p => p[`${k}_max`]).filter(v => v !== null && v !== undefined);

          if (avgs.length > 0) {
            avgEntry[k] = avgs.reduce((a, b) => a + b, 0) / avgs.length;
            avgEntry[`${k}_min`] = Math.min(...mins);
            avgEntry[`${k}_max`] = Math.max(...maxs);
          } else {
            avgEntry[k] = null;
            avgEntry[`${k}_min`] = null;
            avgEntry[`${k}_max`] = null;
          }
        });
        aggregated.push(avgEntry);
      });
      return aggregated;
    };

    return {
      soil: mapData(filteredHistory, 'soil'),
      weather: mapData(filteredHistory, 'weather'),
      water: mapData(filteredHistory, 'water'),
      vision: mapData(filteredHistory, 'vision')
    };
  }, [sensorHistory, timeRange.id, timeMetrics]);

  const getIsOffline = (type) => {
    const node = devices[`${type}_node`];
    const deviceOffline = !node || node.status === 'OFFLINE';
    if (!deviceOffline) return false;
    if (type === 'soil') return !sensorData?.soil?.moisture && sensorHistory.length === 0;
    if (type === 'weather') return !sensorData?.weather?.temp && sensorHistory.length === 0;
    if (type === 'water') return !sensorData?.water?.level && sensorHistory.length === 0;
    if (type === 'vision') return !sensorData?.vision?.active && sensorHistory.length === 0;
    return deviceOffline;
  };

  // 🧠 ANALYTICS ENGINE: Static-Grid Oscilloscope Processor with Downsampling
  const processedData = useMemo(() => {
    const isRealtime = timeRange.id === 'realtime';
    const processed = {};
    const now = Date.now();
    const realtimeStart = now - (5 * 60 * 1000);

    Object.keys(historyData).forEach(tab => {
      let data = historyData[tab] || [];
      
      // 🚀 PERFORMANCE: Downsample large datasets for smooth rendering
      if (data.length > 300) {
        const factor = Math.ceil(data.length / 300);
        data = data.filter((_, i) => i % factor === 0);
      }

      if (!isRealtime) { processed[tab] = data; return; }

      const mapped = data.map(entry => ({
        ...entry,
        plotTime: (Number(entry.name) - realtimeStart) / 1000 
      })).filter(d => d.plotTime >= -5 && d.plotTime <= 305); // Bleed slightly for smooth edges

      if (mapped.length > 0) {
        processed[tab] = mapped;
      } else {
        processed[tab] = [];
      }
    });
    return processed;
  }, [historyData, timeRange.id]);

  const isRealtime = timeRange.id === 'realtime';
  const xDomain = isRealtime ? [0, 300] : [timeMetrics.startTime, timeMetrics.endTime || timeMetrics.now];
  
  // 🕒 DYNAMIC TICK GENERATOR: Ensures clear daily/hourly markings
  const xTicks = useMemo(() => {
    if (isRealtime) return [0, 60, 120, 180, 240, 300];
    
    const { startTime, endTime, now } = timeMetrics;
    const limit = endTime || now;
    const ticks = [];
    
    if (timeRange.id === '1m') {
      // 📅 Monthly (28d): Show every 7 days (Exactly 4 Ticks)
      for (let t = startTime; t <= limit; t += 7 * 24 * 3600000) {
        ticks.push(t);
      }
    } else if (timeRange.id === '1w') {
      // 📅 Weekly: Show every day (7 Ticks)
      for (let t = startTime; t <= limit; t += 24 * 3600000) {
        ticks.push(t);
      }
    } else if (timeRange.id === '1d') {
      // ⏰ Daily: Show every 4 hours (6 Ticks)
      for (let t = startTime; t <= limit; t += 4 * 3600000) {
        ticks.push(t);
      }
    } else if (timeRange.id === '6h') {
      // ⏱️ 6-Hour: Show every hour
      for (let t = startTime; t <= limit; t += 3600000) {
        ticks.push(t);
      }
    }
    
    return ticks.length > 0 ? ticks : undefined;
  }, [timeRange.id, timeMetrics, isRealtime]);

  const getFormatXLabel = () => (v) => {
    if (!isRealtime) {
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      // 📅 For Weekly/Historical: Show Date + Month
      if (timeRange.id === '1w' || timeRange.id === '1m') {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      // ⏰ For Daily: Show Hour:Min
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const realtimeStart = Date.now() - (5 * 60 * 1000);
    const d = new Date(realtimeStart + (v * 1000));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const renderGrid = (tabId) => {
    const charts = {
      soil: [
        { title: "Soil Moisture", type: "line", key: "moisture", color: COLORS.soil[1], unit: "%", min: 0, max: 100 },
        { title: "Soil pH", type: "line", key: "ph", color: COLORS.soil[4], unit: "pH", min: 0, max: 14, tickCount: 8 },
        { title: "Soil Temp", type: "line", key: "temp", color: COLORS.soil[3], unit: "°C", min: 0, max: 60 },
        { title: "Nitrogen (N)", type: "line", key: "n", color: COLORS.soil[0], unit: "mg/kg", min: 0, max: 300 },
        { title: "Phosphorus (P)", type: "line", key: "p", color: COLORS.soil[1], unit: "mg/kg", min: 0, max: 300 },
        { title: "Potassium (K)", type: "line", key: "k", color: COLORS.soil[2], unit: "mg/kg", min: 0, max: 300 },
        { title: "NPK Balance", type: "line_multi", keys: ['n', 'p', 'k'], colors: [COLORS.soil[0], COLORS.soil[1], COLORS.soil[2]], unit: "mg/kg", min: 0, max: 300 }
      ],
      weather: [
        { title: "Ambient Temp", type: "line", key: "temp", color: COLORS.weather[0], unit: "°C", min: 0, max: 60 },
        { title: "Humidity", type: "line", key: "humidity", color: COLORS.weather[1], unit: "%", min: 0, max: 100 },
        { title: "Light (LDR)", type: "line", key: "lightIntensity", color: COLORS.weather[2], unit: "LUX", min: 0, max: 8000 },
        { title: "Rain Level", type: "line", key: "rainLevel", color: COLORS.weather[3], unit: "mm", min: 0, max: 100 }
      ],
      water: [
        { title: "Reservoir Level", type: "line", key: "level", color: COLORS.water[0], unit: "%", min: 0, max: 100 },
        { title: "Hydraulic Flow", type: "line", key: "flow", color: COLORS.water[1], unit: "L/min", min: 0, max: 50 }
      ],
      vision: [
        { title: "Camera Activity", type: "line", key: "active", color: COLORS.vision[0], unit: "", min: 0, max: 2 }
      ]
    }[tabId] || [];

    const isOffline = getIsOffline(tabId);
    const tabData = processedData[tabId] || [];
    const formatXLabel = getFormatXLabel();

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {charts.map((c, i) => {
          // 🚀 ROBUST STATS ENGINE: Handles single-key and multi-key (NPK) summary logic
          const targetKeys = c.keys || (c.key ? [c.key] : []);
          
          // 🛠️ PRE-PROCESS DATA: Create a dedicated envelope property for the Range Area
          const chartData = tabData.map(d => {
            const mns = targetKeys.map(k => d[`${k}_min`] ?? d[k]).filter(v => typeof v === 'number');
            const mxs = targetKeys.map(k => d[`${k}_max`] ?? d[k]).filter(v => typeof v === 'number');
            return {
              ...d,
              _envelope: mns.length && mxs.length ? [Math.min(...mns), Math.max(...mxs)] : null
            };
          });

          const getValsForKey = (k) => tabData.map(d => d[k]).filter(v => typeof v === 'number');
          const getMinForKey = (k) => tabData.map(d => d[`${k}_min`] ?? d[k]).filter(v => typeof v === 'number');
          const getMaxForKey = (k) => tabData.map(d => d[`${k}_max`] ?? d[k]).filter(v => typeof v === 'number');

          const primaryVals = getValsForKey(targetKeys[0] || '');
          const currentVal  = primaryVals.length > 0 ? primaryVals[primaryVals.length - 1] : null;
          const avgVal      = primaryVals.length > 0 ? primaryVals.reduce((a, b) => a + b, 0) / primaryVals.length : null;

          const allMins = targetKeys.flatMap(getMinForKey);
          const allMaxs = targetKeys.flatMap(getMaxForKey);
          const minVal = allMins.length > 0 ? Math.min(...allMins) : null;
          const maxVal = allMaxs.length > 0 ? Math.max(...allMaxs) : null;

          return (
            <AnalyticsCard 
              key={i} 
              title={c.title} 
              isOffline={isOffline}
              currentVal={currentVal}
              avgVal={avgVal}
              minVal={minVal}
              maxVal={maxVal}
              unit={c.unit}
              isHistorical={!isRealtime}
              color={c.color || c.colors?.[0]}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 35, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-stroke)" />
                  <XAxis 
                    dataKey={isRealtime ? "plotTime" : "name"} 
                    type="number"
                    domain={xDomain}
                    ticks={xTicks}
                    tickFormatter={formatXLabel}
                    axisLine={{ stroke: 'var(--border-main)', strokeWidth: 1 }} 
                    tickLine={{ stroke: 'var(--border-main)' }} 
                    tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--text-muted)', dy: 10 }} 
                    interval={0}
                  />
                  <YAxis 
                    axisLine={{ stroke: 'var(--border-main)', strokeWidth: 1 }} 
                    tickLine={{ stroke: 'var(--border-main)' }} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--text-muted)', dx: -5 }}
                    tickFormatter={(v) => v % 1 === 0 ? v : v.toFixed(1)}
                    domain={[c.min ?? 0, c.max ?? 'auto']}
                    allowDataOverflow={true}
                    width={40}
                    tickCount={c.tickCount || 6}
                    interval={0}
                  />
                  <Tooltip 
                    content={<CustomTooltip isRealtime={isRealtime} unit={c.unit} color={c.color || c.colors?.[0]} />}
                    cursor={false}
                    isAnimationActive={false}
                    transitionDuration={200}
                  />
                  {/* 🚀 DIAGNOSTIC ENVELOPE: Pre-calculated range for stability */}
                  {!isRealtime && (
                    <Area
                      type="monotone"
                      dataKey="_envelope"
                      stroke="none"
                      fill={c.color || c.colors?.[0] || COLORS.neutral}
                      fillOpacity={0.08}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {c.type === 'line_multi' ? (
                    c.keys.map((k, idx) => (
                      <Line 
                        key={k} 
                        type="monotone" 
                        dataKey={k} 
                        stroke={c.colors[idx]} 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={<Pinpoint />}
                        isAnimationActive={false}
                      />
                    ))
                  ) : (
                    <Line 
                      type="monotone" 
                      dataKey={c.key} 
                      stroke={c.color} 
                      strokeWidth={3.5} 
                      dot={false} 
                      activeDot={<Pinpoint />}
                      isAnimationActive={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ 
        background: 'var(--bg-main)', 
        minHeight: '100%', 
        padding: '1.25rem', 
        paddingBottom: '140px',
        fontFamily: "'Outfit', sans-serif", 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
          {[
            { id: 'soil', label: 'Soil', icon: Sprout, color: 'var(--primary)' },
            { id: 'weather', label: 'Weather', icon: CloudRain, color: 'var(--secondary)' },
            { id: 'water', label: 'Irrigation', icon: Waves, color: 'var(--accent)' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 16px', borderRadius: '12px', border: 'none',
              background: activeTab === tab.id ? tab.color : 'var(--bg-card)',
              color: activeTab === tab.id ? 'white' : COLORS.text,
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: '0.3s',
              whiteSpace: 'nowrap'
            }}>
              <tab.icon size={14} /><span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ⏱️ TIME RANGE SELECTOR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', marginBottom: '1.25rem' }} className="no-scrollbar">
        {TIME_RANGES.map(range => {
          const isSelected = timeRange.id === range.id;
          return (
            <button
              key={range.id}
              onClick={() => setTimeRange(range)}
              style={{
                whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: '100px',
                border: `1.5px solid ${isSelected ? COLORS.good : 'var(--glass-stroke)'}`,
                background: isSelected ? `${COLORS.good}10` : 'transparent',
                color: isSelected ? COLORS.good : COLORS.subtext,
                fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer',
                transition: '0.2s', outline: 'none'
              }}
            >
              {range.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, paddingBottom: '1rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {isReady ? renderGrid(activeTab) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', background: 'var(--glass)', borderRadius: '24px' }}>
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
             <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PROCESSING DATA MATRIX...</div>
          </div>
        )}
      </div>

      <style>{`
        .recharts-tooltip-wrapper {
          transform: none !important;
          transition: opacity 0.2s ease-in-out !important;
          pointer-events: none !important;
        }
        .analytics-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
};

export default AnalyticsHub;
