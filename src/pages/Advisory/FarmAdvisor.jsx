/**
 * Farm Advisor v17.1.0 - Smart Farm Advice Center
 * Comprehensive Overhaul: Integrating Match, Fertilizer, Compost, and Pest Engines.
 * 
 * Aesthetics: Industrial Premium, Consistent Padding/Margins, Framer Motion.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  MapPin, Zap, Calculator, RefreshCw, Activity, Target, Plus, Minus,
  Bug, ShieldCheck, Leaf, Sprout, Globe, AlertCircle, CheckCircle2,
  XCircle, Waves, Clock, FlaskConical, BarChart3, CloudRain, Thermometer,
  ChevronDown, TrendingUp, Droplets, Search, X, ChevronRight, Scale, Microscope,
  Sparkles, Info, TrendingDown, Apple, Flower, Wheat, Citrus, Grape, Carrot, Nut, Banana, AlertTriangle,
  Coffee, Brain, Cloud, Trees, TreePine, TreeDeciduous, Shrub, Clover, Shell, Milk, Sun, Cherry, Bean,
  Lightbulb, CalendarDays, Layers
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';

// ─── ASSET IMPORTS ──────────────────────────────────────────────────────────
import cropCsv from '../../data/geo/CropSuitabilityData_Final.csv?url';
import { CROP_SPECS, METADATA, ALIASES } from '../../data/core/CropDatabase';
import { 
  MONTHS, isAvailable, isAvailableLoc, getCropIcon, getDemandIcon, 
  getDemandColor, formatCropName, parseCSV, aggregateCropProfiles,
  detectSoilType, getPHLabel, getMoistureLabel, getFertilityLabel,
  getLocationClimate, isClimateCompatible
} from '../../data/core/AgronomyUtils';

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const COLORS = {
  primary: 'var(--primary)',
  primaryDark: 'var(--primary-dark)',
  secondary: 'var(--secondary)',
  danger: 'var(--danger)',
  warning: 'var(--accent)',
  background: 'var(--bg-main)',
  cardBg: 'var(--bg-card)',
  textMain: 'var(--text-main)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border-main)',
};

const RAD = {
  card: '24px',
  inner: '18px',
  btn: '14px'
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

const DESIGN = {
  container: '1.25rem',
  cardPad: '1.25rem 1rem',
  cardMargin: '1.25rem',
  gap: '12px',
  innerPad: '1rem',
  smallPad: '8px'
};

const getCropSpec = (name) => {
  if (!name || typeof name !== 'string') return { label: 'unknown' };
  const normalized = name.toLowerCase().trim();
  const target = ALIASES[normalized] || normalized;
  return { ...(CROP_SPECS[target] || {}), label: target };
};

// ─── BOTTOM SHEET COMPONENT ─────────────────────────────────────────────────

const CropBottomSheet = ({ isOpen, onClose, crops, onSelect, selectedCrop }) => {
  const [search, setSearch] = useState('');
  const filtered = (crops || []).filter(c => c.toLowerCase().includes(search.toLowerCase())).sort();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 1000 }}
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', bottom: 0, left: 0, right: 0, 
              background: 'var(--bg-card)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
              zIndex: 1001, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              padding: '1.5rem', boxShadow: 'var(--shadow-lg)', borderTop: '1px solid var(--border-main)'
            }}
          >
            <div style={{ width: '40px', height: '4px', background: 'var(--border-main)', borderRadius: '2px', alignSelf: 'center', marginBottom: '1.5rem' }} />
            
            <div style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2, paddingBottom: '1rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  placeholder="Search 86 Industrial Crops..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px',
                    border: '1px solid var(--border-main)', background: 'var(--bg-main)', outline: 'none',
                    fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)'
                  }}
                />
                {search && <X size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '16px' }} onClick={() => setSearch('')} />}
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '2rem' }} className="no-scrollbar">
              {filtered.map(c => {
                const isSel = c === selectedCrop;
                const spec = getCropSpec(c);
                const { icon: CropIcon, color: cropColor } = getCropIcon(spec.type, c);
                
                return (
                  <motion.div 
                    key={c}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onSelect(c); onClose(); }}
                    style={{ 
                      padding: '16px', borderRadius: '16px', marginBottom: '8px',
                      background: isSel ? `${cropColor}10` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      border: isSel ? `1px solid ${cropColor}30` : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: isSel ? 'var(--bg-card)' : `${cropColor}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CropIcon size={24} color={cropColor} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1rem', fontWeight: isSel ? 800 : 600, color: isSel ? 'var(--text-main)' : 'var(--text-muted)' }}>{formatCropName(spec.label || c)}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-inactive)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{spec.type || 'Crop'}</span>
                      </div>
                    </div>
                    {isSel && <CheckCircle2 size={20} color={cropColor} />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const FarmAdvisor = () => {
  const navigate = useNavigate();
  const { user, currentGPS } = useApp();
  const { sensorData } = useTelemetry();
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [db, setDb] = useState({ crops: null, loading: true, error: false });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sensor'); // 'sensor' or 'suitability'
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Guard against missing context or sensors - MOVED BELOW hooks to avoid Rules of Hooks violation
  const allCropsList = useMemo(() => {
    // Source of truth: CROP_SPECS (Industrial database)
    // We only show crops that we have verified data for.
    const specLabels = Object.keys(CROP_SPECS);
    
    // Also include crops from CSV IF they are in CROP_SPECS or are ALIASES of something in CROP_SPECS
    const csvLabels = Object.keys(db?.crops || {});
    const combined = [...new Set([...specLabels, ...csvLabels])];

    const finalUnique = new Set();
    combined.forEach(raw => {
      const label = raw.toLowerCase().trim();
      const target = ALIASES[label] || label;
      
      // ONLY add if it exists in our industrial database
      if (CROP_SPECS[target]) {
        finalUnique.add(target);
      }
    });

    return [...finalUnique].sort();
  }, [db.crops]);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 80], [1, 0.98]);

  useEffect(() => {
    fetch(cropCsv)
      .then(r => r.text())
      .then(cropTxt => {
        try {
          const crops = aggregateCropProfiles(parseCSV(cropTxt));
          setDb({ crops, loading: false, error: false });
        } catch (e) {
          console.error("DB Parse Error", e);
          setDb({ crops: {}, loading: false, error: true });
        }
      })
      .catch(err => {
        console.error("Fetch Error", err);
        setDb({ crops: {}, loading: false, error: true });
      });
  }, []);

  const brain = useMemo(() => {
    if (db.loading || !db?.crops || !sensorData) return null;
    const spec = getCropSpec(selectedCrop);
    const p = db?.crops?.[selectedCrop] || {};
    
    // Deep fallback logic: Use CSV data if available, otherwise inherit from Spec standards
    const profile = {
      n: p.n || { mid: ((spec.n?.[0] || 0) + (spec.n?.[1] || 100)) / 2, min: spec.n?.[0] || 0, max: spec.n?.[1] || 100, range: (spec.n?.[1] || 100) - (spec.n?.[0] || 0) || 1 },
      p: p.p || { mid: ((spec.p?.[0] || 0) + (spec.p?.[1] || 100)) / 2, min: spec.p?.[0] || 0, max: spec.p?.[1] || 100, range: (spec.p?.[1] || 100) - (spec.p?.[0] || 0) || 1 },
      k: p.k || { mid: ((spec.k?.[0] || 0) + (spec.k?.[1] || 100)) / 2, min: spec.k?.[0] || 0, max: spec.k?.[1] || 100, range: (spec.k?.[1] || 100) - (spec.k?.[0] || 0) || 1 },
      ph: p.ph || { mid: ((spec.ph?.[0] || 5.5) + (spec.ph?.[1] || 7.5)) / 2, min: spec.ph?.[0] || 5.5, max: spec.ph?.[1] || 7.5, range: (spec.ph?.[1] || 7.5) - (spec.ph?.[0] || 5.5) || 1 },
      temperature: p.temperature || { mid: ((spec.temp?.[0] || 15) + (spec.temp?.[1] || 35)) / 2, min: spec.temp?.[0] || 15, max: spec.temp?.[1] || 35, range: (spec.temp?.[1] || 35) - (spec.temp?.[0] || 15) || 1 },
      humidity: p.humidity || { mid: ((spec.hum?.[0] || 40) + (spec.hum?.[1] || 80)) / 2, min: spec.hum?.[0] || 40, max: spec.hum?.[1] || 80, range: (spec.hum?.[1] || 80) - (spec.hum?.[0] || 40) || 1 },
      rainfall: p.rainfall || { mid: ((spec.rain?.[0] || 500) + (spec.rain?.[1] || 1500)) / 2, min: spec.rain?.[0] || 500, max: spec.rain?.[1] || 1500, range: (spec.rain?.[1] || 1500) - (spec.rain?.[0] || 500) || 1 },
      moisture: p.moisture || { mid: 40, min: 10, max: 70, range: 60 },
      season: p.season, soil: p.soil, loc: p.loc, sow: p.sow,
      fert: p.fert, comp: p.comp, pest: p.pest
    };
    
    const metaSource = METADATA[spec.label || selectedCrop] || {};

    const meta = {
      type: spec.type || '---',
      season: metaSource.season || profile.season || '---',
      seasonInsight: metaSource.seasonInsight || '---',
      soil: metaSource.soil || profile.soil || '---',
      soilInsight: metaSource.soilInsight || '---',
      weather: profile.weather || '---',
      sow: metaSource.sow || profile.sow || '---',
      sowInsight: metaSource.sowInsight || '---',
      harvest: metaSource.harvest || '---',
      harvestInsight: metaSource.harvestInsight || '---',
      loc: metaSource.loc || profile.loc || '---',
      locInsight: metaSource.locInsight || '---',
      habitat: metaSource.habitat || '---',
      habitatInsight: metaSource.habitatInsight || '---',
      climate: metaSource.climate || '---',
      climateInsight: metaSource.climateInsight || '---',
      behavior: metaSource.behavior || '---',
      behaviorInsight: metaSource.behaviorInsight || '---',
      adaptability: metaSource.adaptability || '---',
      adaptabilityInsight: metaSource.adaptabilityInsight || '---',
      insight: metaSource.insight || '---',
      insightDetail: metaSource.insightDetail || '---',
      fert: metaSource.fert || profile.fert || '---',
      comp: metaSource.comp || profile.comp || '---',
      pest: metaSource.pest || profile.pest || '---',
      // Dynamic Dose Calculation based on NPK requirements
      bU: spec.n ? (spec.n[1] / 0.46) : 0, 
      bS: spec.p ? (spec.p[1] / 0.16) : 0, 
      bM: spec.k ? (spec.k[1] / 0.60) : 0, 
      bC: 0
    };

    const month = MONTHS[new Date().getMonth()] || "Jan";
    const season = ['Jun','Jul','Aug','Sep','Oct'].includes(month) ? 'Kharif' : (['Nov','Dec','Jan','Feb'].includes(month) ? 'Rabi' : 'Zaid');

    const cur = {
      npk: sensorData?.soil?.npk,
      ph: sensorData?.soil?.ph, moisture: sensorData?.soil?.moisture,
      temp: sensorData?.weather?.temp, hum: sensorData?.weather?.humidity, rain: sensorData?.weather?.rainLevel,
      season, 
      soil: detectSoilType(sensorData?.soil?.ph, sensorData?.soil?.moisture, sensorData?.soil?.npk?.n, sensorData?.soil?.npk?.p, sensorData?.soil?.npk?.k), 
      weather: sensorData?.weather?.condition || 'Clear', 
      month
    };

    // ─── 📊 SMART MATCH ENGINE ───
    const sensors = [
      { id: 'Nitrogen', val: cur.npk?.n, range: spec.n, unit: 'kg/ha', rec: 'Fertilize', icon: Zap, color: '#F59E0B', desc: getFertilityLabel(cur.npk?.n, cur.npk?.p, cur.npk?.k) },
      { id: 'Phosphorus', val: cur.npk?.p, range: spec.p, unit: 'kg/ha', rec: 'Fertilize', icon: Target, color: '#3B82F6', desc: getFertilityLabel(cur.npk?.n, cur.npk?.p, cur.npk?.k) },
      { id: 'Potassium', val: cur.npk?.k, range: spec.k, unit: 'kg/ha', rec: 'Fertilize', icon: Activity, color: '#8B5CF6', desc: getFertilityLabel(cur.npk?.n, cur.npk?.p, cur.npk?.k) },
      { id: 'Soil pH', val: cur.ph, range: spec.ph, unit: 'pH', rec: 'Treat Soil', icon: FlaskConical, color: '#EC4899', desc: getPHLabel(cur.ph) },
      { id: 'Moisture', val: cur.moisture, range: db?.crops?.[selectedCrop] ? profile.moisture : { min: spec.moisture?.[0] || 10, max: spec.moisture?.[1] || 80 }, unit: '%', rec: 'Irrigate', icon: Droplets, color: '#0EA5E9', desc: getMoistureLabel(cur.moisture) },
      { id: 'Temperature', val: cur.temp, range: spec.temp, unit: '°C', rec: 'Cooling', icon: Thermometer, color: '#F43F5E', desc: isAvailableLoc(cur.temp) ? (cur.temp > 30 ? 'Hot' : 'Cool') : '---' },
      { id: 'Rainfall', val: cur.rain, range: db?.crops?.[selectedCrop] ? profile.rainfall : { min: spec.rain?.[0] || 0, max: spec.rain?.[1] || 2000 }, unit: 'mm', rec: 'Weather', icon: CloudRain, color: '#6366F1', desc: isAvailableLoc(cur.rain) ? (cur.rain > 50 ? 'Heavy' : 'Light') : '---' }
    ].map(s => {
      const active = isAvailable(s.val);
      let status = 'Missing', type = 'missing', action = '---', isHigh = false;
      
      // Range can be [min, max] or { min, max }
      const rMin = Array.isArray(s.range) ? s.range[0] : s.range?.min;
      const rMax = Array.isArray(s.range) ? s.range[1] : s.range?.max;

      if (active && typeof rMin !== 'undefined' && rMin !== null) {
        const val = parseFloat(s.val);
        const rangeWidth = Math.max(5, rMax - rMin);
        const outDist = val < rMin ? (rMin - val) : (val > rMax ? (val - rMax) : 0);
        
        // 📊 SMART ANALYSIS LOGIC (Calibrated for accuracy)
        const EPSILON = 0.03; // 3% noise floor
        const isOptimal = (val >= rMin - (rangeWidth * EPSILON) && val <= rMax + (rangeWidth * EPSILON));
        const pct = isOptimal ? 100 : Math.max(15, 90 - (outDist / rangeWidth * 50));
        
        if (isNaN(val)) {
          status = 'Missing'; type = 'missing';
        } else if (isOptimal || pct >= 95) { 
          // 🟢 Optimal Zone (Green)
          status = '✅ Optimal'; type = 'good'; action = 'None'; 
        } else if (pct >= 60) { 
          // 🟡 Warning Zone (Yellow)
          status = val < rMin ? '🔻 Low' : '🔺 High'; 
          type = 'warning'; 
          isHigh = val > rMax;
          action = s.rec;
        } else { 
          // 🔴 < 60%: Critical / Bad
          status = val < rMin ? '🔻 Critical Low' : '🔺 Critical High'; 
          type = 'bad'; 
          isHigh = false; // Force Red
          action = s.rec;
        }
      }
      return { ...s, status, type, action, rMin, rMax, isHigh };
    });

    const matchTable = [
      { f: 'Season', ideal: meta.season, cur: cur.season, isMatch: String(meta.season).toLowerCase().includes(String(cur.season).toLowerCase()), icon: Clock, color: '#F59E0B' },
      { f: 'Soil Type', ideal: meta.soil, cur: cur.soil, isMatch: cur.soil !== 'Missing' && String(meta.soil).toLowerCase().includes(String(cur.soil).toLowerCase()), icon: Globe, color: '#10B981' },
      { 
        f: 'Location', 
        ideal: meta.loc, 
        cur: getLocationClimate(user?.location || 'WB, IN'), 
        isMatch: isClimateCompatible(meta.loc, getLocationClimate(user?.location || 'WB, IN')),
        icon: MapPin, color: '#0EA5E9' 
      },
      { f: 'Sowing Time', ideal: meta.sow, cur: cur.month, icon: Activity, color: '#EF4444' }
    ].map(row => {
      let status = '❌ Not Suitable', type = 'bad';
      if (row.f === 'Soil Type' && row.cur === 'Missing') { status = '⚠ Missing'; type = 'warning'; }
      else if (row.f === 'Sowing Time') {
        const [sS, sE] = (String(row.ideal || 'Jan-Dec')).split('-');
        const sIdx = MONTHS.indexOf(sS), eIdx = MONTHS.indexOf(sE), cIdx = MONTHS.indexOf(cur.month);
        if (row.ideal === 'Year-round' || row.ideal === 'Any' || (cIdx >= sIdx && cIdx <= eIdx)) { status = '✅ Suitable'; type = 'good'; }
        else if (sIdx !== -1 && eIdx !== -1 && Math.min(Math.abs(cIdx - sIdx), Math.abs(cIdx - eIdx)) <= 1) { status = '⚠ Adjustment'; type = 'warning'; }
      } else if (row.isMatch) { status = '✅ Suitable'; type = 'good'; }
      return { ...row, status, type, cur: isAvailableLoc(row.cur) && row.cur !== 'Missing' ? row.cur : '---' };
    });

    const suitabilityTable = [
      { id: 'Season Type', icon: Clock, color: '#F59E0B', ideal: meta.season || '---', decision: meta.seasonInsight || '---', match: matchTable.find(m => m.f === 'Season') },
      { id: 'Sowing Window', icon: CalendarDays, color: '#10B981', ideal: meta.sow || '---', decision: meta.sowInsight || '---', match: matchTable.find(m => m.f === 'Sowing Time') },
      { id: 'Harvest Window', icon: Wheat, color: '#FCD34D', ideal: meta.harvest || '---', decision: meta.harvestInsight || '---' },
      { id: 'Primary Regions', icon: Globe, color: '#3B82F6', ideal: meta.loc || '---', decision: meta.locInsight || '---', match: matchTable.find(m => m.f === 'Location') },
      { id: 'Habitat Type', icon: Trees, color: '#059669', ideal: meta.habitat || '---', decision: meta.habitatInsight || '---' },
      { id: 'Climate Profile', icon: CloudRain, color: '#0EA5E9', ideal: meta.climate || '---', decision: meta.climateInsight || '---' },
      { id: 'Soil Type', icon: Layers, color: '#8B5CF6', ideal: meta.soil || '---', decision: meta.soilInsight || '---', match: matchTable.find(m => m.f === 'Soil Type') },
      { id: 'Crop Behavior', label: 'Crop Behave', icon: Activity, color: '#EC4899', ideal: meta.behavior || '---', decision: meta.behaviorInsight || '---' },
      { id: 'Adaptability', label: 'Adapt', icon: BarChart3, color: '#6366F1', ideal: meta.adaptability || '---', decision: meta.adaptabilityInsight || '---' },
      { id: 'Key Insight', icon: Lightbulb, color: '#F59E0B', ideal: meta.insight || '---', decision: meta.insightDetail || '---' }
    ].map(row => ({
      ...row,
      status: row.match?.status || '✅ Crop Info',
      type: row.match?.type || 'good'
    }));

    // ─── 🧪 FERTILIZER ENGINE ───────────────────────────────────────────────
    const canFertilize = isAvailableLoc(cur.npk?.n) && isAvailableLoc(cur.npk?.p) && isAvailableLoc(cur.npk?.k);
    const defN = canFertilize ? Math.max(0, (profile.n?.mid || 0) - parseFloat(cur.npk?.n || 0)) : 0;
    const defP = canFertilize ? Math.max(0, (profile.p?.mid || 0) - parseFloat(cur.npk?.p || 0)) : 0;
    const defK = canFertilize ? Math.max(0, (profile.k?.mid || 0) - parseFloat(cur.npk?.k || 0)) : 0;
    
    const fertEntry = profile.fert && typeof profile.fert === 'object' ? profile.fert : null;
    let urea = canFertilize ? (defN / 0.46) + (meta.bU * 0.3) : 0;
    let ssp = canFertilize ? (defP / 0.16) + (meta.bS * 0.3) : 0;
    let mop = canFertilize ? (defK / 0.60) + (meta.bM * 0.3) : 0;
    
    const fertReasons = [];
    if (canFertilize) {
      if (parseFloat(cur.temp) > (profile.temperature?.max || 35)) { urea *= 0.9; fertReasons.push("High heat reduction"); }
      if (parseFloat(cur.moisture) < (profile.moisture?.min || 20)) { urea *= 1.1; fertReasons.push("Low moisture adjustment"); }
    }
    const fertReason = canFertilize ? (fertReasons.length > 0 ? fertReasons.join(" • ") : (fertEntry?.weather || "Standard biological dose")) : "OFFLINE - CONNECT NPK SENSORS";

    // ─── 🍃 COMPOST ENGINE ──────────────────────────────────────────────────
    const canCompost = isAvailableLoc(cur.moisture) && isAvailableLoc(cur.ph) && isAvailableLoc(cur.npk?.n);
    const nVal = parseFloat(cur.npk?.n || 0);
    const mVal = parseFloat(cur.moisture || 0);
    
    let compost = canCompost ? (meta.bC + (nVal < 50 ? 3.5 : 0) + (mVal < 25 ? 1.5 : 0)) : 0;
    const cReasons = [];
    if (canCompost) {
      if (mVal < 25) cReasons.push("Low moisture");
      if (String(meta.soil).includes("Sandy")) cReasons.push("Sandy soil");
      if (nVal < 50) cReasons.push("N-Deficiency");
    }
    const compostReason = canCompost ? (cReasons.length > 0 ? cReasons.join(" + ") : "Ideal field balance") : "OFFLINE - CONNECT SOIL SENSORS";
    const compostQtyLabel = compost > 0 ? `${compost.toFixed(1)} tons/acre` : '0 tons/acre (Balanced)';

    // ─── 🛡️ PEST ENGINE (OFFLINE AWARE) ──────────────────────────────────────
    const canAnalyzePest = isAvailableLoc(cur.temp) || isAvailableLoc(cur.hum) || isAvailableLoc(cur.moisture);
    const checkActiveTrigger = (trigger, val, type) => {
      if (!trigger || trigger === '---') return false;
      const t = trigger.toLowerCase();
      const v = parseFloat(val);
      if (isNaN(v)) return false;
      if (type === 'temp') {
        if (t.includes('warm') && v > 26) return true;
        if (t.includes('hot') && v > 32) return true;
        if (t.includes('cool') && v < 22) return true;
      }
      if (type === 'hum') {
        if (t.includes('humid') && v > 75) return true;
        if (t.includes('dry') && v < 40) return true;
      }
      if (type === 'moist') {
        if ((t.includes('wet') || t.includes('high')) && v > 70) return true;
        if (t.includes('dry') && v < 30) return true;
      }
      return false;
    };

    const pestEntry = meta.pest && typeof meta.pest === 'object' ? meta.pest : (profile.pest && typeof profile.pest === 'object' ? profile.pest : null);
    const isThreatActive = canAnalyzePest && pestEntry && (
      checkActiveTrigger(pestEntry.weather, cur.temp, 'temp') || 
      checkActiveTrigger(pestEntry.weather, cur.hum, 'hum') || 
      checkActiveTrigger(pestEntry.water, cur.moisture, 'moist')
    );

    const detectedPests = !canAnalyzePest ? [{ 
      n: 'Sensor Offline', 
      s: 'OFFLINE', 
      isActive: false, 
      intel: 'Connect sensors for threat analysis', 
      action: 'OFFLINE' 
    }] : (pestEntry ? [{
      n: pestEntry.most || (pestEntry.all && typeof pestEntry.all === 'string' ? pestEntry.all.split(',')[0] : 'Standard Pest'),
      s: isThreatActive ? 'ACTIVE THREAT' : 'POTENTIAL',
      isActive: isThreatActive,
      intel: `${pestEntry.weather || 'Warm weather'} + ${pestEntry.water || 'High water'} → Risk (${pestEntry.trigger || 'All Stages'})`,
      action: isThreatActive ? "Take action within 24–48 hrs" : "Monitor field for early signs"
    }] : [{ 
      n: 'Standard Control', 
      s: 'PREVENTATIVE', 
      isActive: false, 
      intel: 'Standard scheduled preventative care', 
      action: 'Routine Schedule' 
    }]);

    // ─── 🎯 REAL-WORLD CONFIDENCE ALGORITHM ───
    // Confidence is calculated based on how close the live field data is to the EXACT mathematical center of the crop's ideal range.
    const calcMeanDistPct = (s) => {
      if (s.type === 'missing' || !isAvailableLoc(s.val)) return 0;
      const val = parseFloat(s.val);
      const range = Math.max(1, s.rMax - s.rMin);
      const mid = (s.rMin + s.rMax) / 2;
      // Distance from exact optimal center (0 is perfect)
      const distFromCenter = Math.abs(val - mid);
      const maxAllowedDist = range / 2;
      // 100% means exactly in the middle of the ideal range.
      return Math.max(0, 100 - ((distFromCenter / maxAllowedDist) * 100));
    };
    
    const activeSensorsCount = sensors.filter(s => s.type !== 'missing' && isAvailableLoc(s.val)).length;
    const completenessFactor = sensors.length > 0 ? (activeSensorsCount / sensors.length) : 0;
    
    const rawConfidence = activeSensorsCount > 0 
      ? sensors.reduce((acc, s) => acc + calcMeanDistPct(s), 0) / activeSensorsCount 
      : 0;
    
    // Final Confidence: 70% based on exact precision of data, 30% based on how many sensors are online.
    const confidence = Math.round((rawConfidence * 0.7) + ((completenessFactor * 100) * 0.3));

    // ─── 📊 WEIGHTED INTELLIGENCE & EXPLAINABILITY ENGINE ───
    const calcMatchPct = (s) => {
      if (s.type === 'missing' || !isAvailableLoc(s.val)) return 0;
      const val = parseFloat(s.val);
      const { rMin, rMax } = s;
      const rangeWidth = Math.max(5, rMax - rMin);
      
      // 🎯 Precision Epsilon (noise floor)
      const EPSILON = 0.03; 
      const isOptimal = (val >= rMin - (rangeWidth * EPSILON) && val <= rMax + (rangeWidth * EPSILON));

      if (isOptimal) {
        // 🎯 Inside Optimal Range: Full 100% Match (Green)
        return 100;
      }
      
      // ⚠️ Outside Range: Graceful Decay
      const outDist = val < rMin ? (rMin - val) : (val - rMax);
      // Linear decay: 90% at the edge, dropping to 60% (Red threshold) at a distance of 60% of the range width
      const decay = (outDist / rangeWidth) * 50;
      return Math.max(15, Math.round(90 - decay));
    };

    const categories = [
      {
        id: 'soil',
        name: 'Soil Health',
        icon: Leaf,
        params: [
          { n: 'Nitrogen (N)', s: sensors[0], weight: 0.25, impact: 'Critical', why: (p) => p < 50 ? 'Low N inhibits vegetative growth.' : 'Optimal N for chlorophyll production.' },
          { n: 'Phosphorus (P)', s: sensors[1], weight: 0.20, impact: 'Critical', why: (p) => p < 50 ? 'Weak roots due to low Phosphorus.' : 'Healthy root development support.' },
          { n: 'Potassium (K)', s: sensors[2], weight: 0.15, impact: 'Important', why: (p) => p < 50 ? 'Reduced disease resistance.' : 'Excellent water regulation & immunity.' },
          { n: 'Soil pH', s: sensors[3], weight: 0.20, impact: 'Critical', why: (p) => p < 70 ? 'Acidity/Alkalinity limits nutrient uptake.' : 'Ideal pH for maximum nutrient availability.' },
          { n: 'Moisture', s: sensors[4], weight: 0.20, impact: 'Important', why: (p) => p < 50 ? 'Hydration stress detected.' : 'Balanced soil-water ratio.' }
        ]
      },
      {
        id: 'climate',
        name: 'Climate & Weather',
        icon: Thermometer,
        params: [
          { n: 'Temperature', s: sensors[5], weight: 0.40, impact: 'Important', why: (p) => p < 60 ? 'Thermal stress affecting metabolism.' : 'Optimal metabolic temperature.' },
          { n: 'Rainfall', s: sensors[6], weight: 0.40, impact: 'Important', why: (p) => p < 50 ? 'Water deficit for crop lifecycle.' : 'Adequate precipitation support.' },
          { n: 'Humidity', s: { pct: 75, type: 'good' }, weight: 0.20, impact: 'Supporting', why: () => 'Optimal transpiration levels.' }
        ]
      },
      {
        id: 'external',
        name: 'External Factors',
        icon: Globe,
        params: [
          { n: 'Season', s: { pct: matchTable[0].type === 'good' ? 100 : 40, type: matchTable[0].type }, weight: 0.35, impact: 'Supporting', why: (p) => p > 80 ? 'Ideal physiological window.' : 'Seasonal mismatch detected.' },
          { n: 'Growing Time', s: { pct: matchTable[3].type === 'good' ? 100 : 50, type: matchTable[3].type }, weight: 0.35, impact: 'Supporting', why: (p) => p > 80 ? 'Perfect sowing timeline.' : 'Sowing delay impact expected.' },
          { n: 'Location', s: { pct: matchTable[2].type === 'good' ? 100 : 70, type: matchTable[2].type }, weight: 0.30, impact: 'Supporting', why: () => 'Geographically viable zone.' }
        ]
      }
    ];

    // Process all parameters with data logic
    const processedGroups = categories.map(cat => {
      let catScore = 0;
      const items = cat.params.map(p => {
        const pct = p.s.pct !== undefined ? p.s.pct : calcMatchPct(p.s);
        const status = pct > 80 ? 'Good' : (pct > 50 ? 'Moderate' : 'Poor');
        const color = pct > 80 ? COLORS.primary : (pct > 50 ? COLORS.warning : COLORS.danger);
        catScore += pct * p.weight;
        return { ...p, pct, status, color, explain: p.why(pct) };
      });
      return { ...cat, score: Math.round(catScore), items };
    });

    const weights = { soil: 0.50, climate: 0.35, external: 0.15 };
    // Calculate actual connectivity to handle "No Data" states
    const activeSensors = sensors.filter(s => s.type !== 'missing').length;
    const isOffline = activeSensors === 0;

    const matchScore = isOffline ? 0 : Math.round(
      processedGroups.reduce((acc, g) => acc + (g.score * weights[g.id]), 0)
    );
    
    // ─── 🌍 REAL-WORLD SUITABILITY ENGINE ───
    // Suitability focuses on long-term viability (Environment/Season heavily weighted)
    // Even if NPK is perfect today (Match Score high), if it's the wrong season/location, Suitability drops.
    const suitWeights = { soil: 0.15, climate: 0.35, external: 0.50 };
    const suitabilityScore = isOffline ? 0 : Math.round(
      processedGroups.reduce((acc, g) => acc + (g.score * suitWeights[g.id]), 0)
    );

    let recStatus = 'MODERATE', recColor = '#F59E0B', recIcon = AlertCircle;
    if (matchScore > 80) { recStatus = 'RECOMMENDED'; recColor = '#10B981'; recIcon = CheckCircle2; }
    else if (matchScore < 50) { recStatus = 'NOT RECOMMENDED'; recColor = '#EF4444'; recIcon = XCircle; }

    const suitLabel = suitabilityScore > 80 ? 'High Suitability' : (suitabilityScore > 50 ? 'Moderate' : 'Low Suitability');
    const suitColor = suitabilityScore > 80 ? COLORS.primary : (suitabilityScore > 50 ? COLORS.warning : COLORS.danger);

    const criticalFailures = processedGroups.flatMap(g => g.items).filter(p => p.impact === 'Critical' && p.pct < 60);
    const detailedInsight = criticalFailures.length > 0 
      ? `CRITICAL ALERT: Your field shows significant deficits in ${criticalFailures.map(f => f.n).join(', ')}. These factors are essential for ${selectedCrop} and must be corrected before proceeding.`
      : `SUITABILITY ANALYSIS: Field conditions are ${matchScore > 80 ? 'ideal' : 'stable'}. Focus on maintaining ${processedGroups[0].items.filter(p => p.pct < 85).map(p => p.n).join(', ') || 'current levels'} for maximum yield efficiency.`;

    return {
      sensors, suitabilityTable, confidence, matchScore, suitabilityScore, recStatus, recColor, recIcon, isOffline, demand: metaSource.demand || (['Cash Crop', 'Fruit', 'Seed'].includes(spec.type) ? 'High' : (['Fiber', 'Grain', 'Vegetable', 'Pulse'].includes(spec.type) ? 'Stable' : 'Moderate')),
      summary: {
        groups: processedGroups,
        overall: suitabilityScore,
        status: suitLabel,
        color: suitColor,
        insight: detailedInsight
      },
      fertilizer: {
        isValid: canFertilize,
        urea: urea * 1, ssp: ssp * 1, mop: mop * 1,
        product: meta.fert?.common || 'NPK Mix',
        reason: canFertilize ? (meta.fert?.logic || fertReason) : "CONNECT NPK SENSORS",
        stage: meta.fert?.stage || 'Vegetative',
        products: meta.fert?.products || ['Urea', 'DAP', 'MOP']
      },
      compost: {
        isValid: canCompost,
        perAcre: compostQtyLabel,
        product: meta.compost?.type || 'Organic Manure',
        reason: canCompost ? (meta.compost?.logic || compostReason) : "OFFLINE - CONNECT SOIL SENSORS",
        stage: meta.compost?.stage || 'Basal'
      },
      pests: {
        detected: detectedPests
      },
      meta
    };
  }, [
    db, 
    selectedCrop, 
    sensorData?.soil?.moisture, 
    sensorData?.soil?.temp, 
    sensorData?.soil?.ph,
    sensorData?.soil?.npk?.n,
    sensorData?.soil?.npk?.p,
    sensorData?.soil?.npk?.k,
    sensorData?.weather?.temp,
    sensorData?.weather?.rainLevel,
    sensorData?.vision?.detection
  ]);

  if (db.loading || !brain) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}><RefreshCw className="animate-spin" color={COLORS.primary} /></div>;

  if (db.error) return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '20px', textAlign: 'center' }}>
    <AlertTriangle size={48} color={COLORS.danger} style={{ marginBottom: '1rem' }} />
    <h2 style={{ fontWeight: 900, color: 'var(--text-main)' }}>Database Sync Error</h2>
    <p style={{ color: COLORS.textMuted }}>Unable to load crop specifications.</p>
  </div>;

  const cardStyle = {
    background: 'var(--bg-card)',
    borderRadius: RAD.card,
    padding: DESIGN.cardPad,
    marginBottom: DESIGN.cardMargin,
    border: '1px solid var(--border-main)',
    boxShadow: 'var(--shadow-md)',
    position: 'relative',
    overflow: 'hidden'
  };

  const sectionHeader = { margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 950, color: COLORS.textMain, display: 'flex', alignItems: 'center', gap: '10px' };

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="no-scrollbar" 
      style={{ 
        background: 'var(--bg-main)', 
        minHeight: '100%', 
        padding: '16px',
        paddingBottom: '24px',
        fontFamily: "'Outfit', sans-serif", 
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {!isReady ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CALIBRATING ADVISOR...</div>
        </div>
      ) : (
        <>

      {/* 🚀 INDUSTRIAL CROP HERO CARD - PREMIUM REDESIGN */}
      <div style={{ padding: `0.5rem ${DESIGN.container} ${DESIGN.container}` }}>
        <motion.div 
          variants={itemFadeUp}
          style={{ 
            background: 'var(--bg-card)', borderRadius: '24px', padding: DESIGN.cardPad,
            boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-main)',
            opacity: heroOpacity,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: DESIGN.cardMargin
          }}
        >
          {/* 1. HEADER SECTION: CROP SELECTOR */}
          <div 
            onClick={() => setIsSheetOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--border-main)',
              cursor: 'pointer', marginBottom: DESIGN.innerPad
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getCropIcon(brain.meta.type, selectedCrop).color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.createElement(getCropIcon(brain.meta.type, selectedCrop).icon, { size: 16, color: 'var(--bg-card)' })}
              </div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '0.02em', margin: 0 }}>
                {formatCropName(selectedCrop)}
              </h1>
            </div>
            <ChevronDown size={18} color="var(--text-muted)" />
          </div>

          {/* 2. FIELD PROFILE CONTEXT: UNIFORM 3x2 GRID */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DESIGN.gap, 
            marginBottom: DESIGN.cardMargin 
          }}>
            {[
              { label: 'Soil Type', val: 'Loamy', icon: Layers, color: COLORS.primary },
              { label: 'Climate', val: 'Sub-Tropical', icon: Cloud, color: COLORS.secondary },
              { label: 'Region', val: currentGPS?.city || 'Regional Hub', icon: MapPin, color: '#6366F1' },
              { label: 'Market', val: brain.demand, icon: TrendingUp, color: getDemandColor(brain.demand) },
              { label: 'Crop Category', val: brain.meta.type, icon: Leaf, color: COLORS.primary },
              { label: 'Location', val: currentGPS?.city || 'Active Field', icon: MapPin, color: COLORS.secondary }
            ].map((p, i) => (
              <div key={i} style={{ 
                background: `${p.color}08`, padding: '10px', borderRadius: '14px', 
                display: 'flex', flexDirection: 'column', gap: '4px', border: `1px solid ${p.color}15`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {React.createElement(p.icon, { size: 12, color: p.color })}
                  <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: p.color, letterSpacing: '0.04em' }}>{p.label}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: COLORS.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3. CORE ADVISORY DECISION */}
          <div style={{ 
            background: `${brain.recColor}08`, borderRadius: '18px', padding: DESIGN.innerPad,
            border: `1px solid ${brain.recColor}15`, marginBottom: DESIGN.cardMargin,
            display: 'flex', alignItems: 'center', gap: '14px'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: brain.recColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${brain.recColor}30` }}>
              {React.createElement(brain.recIcon, { size: 22, color: "white" })}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 950, color: brain.recColor }}>{brain.recStatus}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)' }}>
                  {brain.isOffline ? 'Sync Pending' : `${brain.matchScore}% Match`}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1.3 }}>{brain.isOffline ? 'Sensors disconnected. Real-time suitability pending.' : brain.recReason}</p>
            </div>
          </div>

          {/* END HERO CARD CONTENT */}
        </motion.div>
      </div>


      <CropBottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        crops={allCropsList} 
        onSelect={setSelectedCrop} 
        selectedCrop={selectedCrop}
      />

      {/* 🎛️ INDUSTRIAL TAB SWITCHER */}
      <div style={{ padding: `0 ${DESIGN.container} ${DESIGN.container}`, display: 'flex', gap: DESIGN.gap }}>
        {[
          { id: 'sensor', label: 'Sensor Data', icon: Activity },
          { id: 'suitability', label: 'Crop Suitability', icon: Leaf }
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '14px', borderRadius: '18px',
                background: isActive ? 'var(--bg-card)' : 'var(--bg-sheet)',
                border: isActive ? '1px solid var(--border-main)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer', transition: 'none', outline: 'none'
              }}
            >
              <t.icon size={16} color={isActive ? COLORS.primary : COLORS.textMuted} />
              <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 900 : 700, color: isActive ? COLORS.textMain : COLORS.textMuted }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: `0 ${DESIGN.container}` }}>
        {activeTab === 'sensor' ? (
          <>
            {/* 📋 SMART MATCH TABLE ENGINE */}
            <div style={{ ...cardStyle, background: `linear-gradient(165deg, ${COLORS.primary}08 0%, var(--bg-card) 100%)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.cardMargin }}>
                <div style={{ padding: '0 2px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 950, color: COLORS.textMain, display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <Activity size={20} color={COLORS.primary} />
                    Field Data Compare Table
                  </h3>
                </div>
              </div>

              <div style={{ 
                display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: DESIGN.gap, 
                padding: '10px 8px', 
                background: `linear-gradient(90deg, ${COLORS.primary}08 0%, transparent 100%)`,
                borderRadius: '12px',
                marginBottom: DESIGN.gap 
              }}>
                 {['Factor', 'Field', 'Optimal'].map((h, i) => (
                   <span key={i} style={{ 
                     fontSize: '0.9rem', fontWeight: 950, color: COLORS.textMuted, textTransform: 'uppercase',
                     textAlign: 'left',
                     paddingLeft: i === 0 ? '30px' : 0
                   }}>{h}</span>
                 ))}
              </div>

              {brain.sensors.map((s, idx) => (
                <div 
                  key={s.id}
                  style={{ 
                    display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: DESIGN.gap, 
                    padding: `${DESIGN.gap} 8px`, minHeight: '52px', borderBottom: `1px solid ${COLORS.background}`, 
                    alignItems: 'center' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div style={{ minWidth: '22px', height: '22px', borderRadius: '5px', background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {React.createElement(s.icon, { size: 11, color: s.color })}
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 950, color: COLORS.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.id}</span>
                  </div>
                  <span style={{ 
                    fontSize: '1.15rem', fontWeight: 950, 
                    color: s.type === 'good' ? COLORS.primary : (s.type === 'warning' ? COLORS.warning : (s.type === 'missing' ? COLORS.textMuted : COLORS.danger)),
                    textAlign: 'left' 
                  }}>
                    {s.type === 'missing' ? '---' : `${Math.round(parseFloat(s.val) || 0)}${s.unit}`}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: COLORS.textMuted, textAlign: 'left' }}>
                    {(typeof s.rMin !== 'undefined' && s.rMin !== null) ? `${Math.round(s.rMin)}-${Math.round(s.rMax)}` : '---'}
                  </span>
                </div>
              ))}
            </div>

            {/* 🧪 FERTILIZER ENGINE */}
            <motion.div 
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/fertilizer-engine')}
              style={{ 
                ...cardStyle, 
                background: `linear-gradient(165deg, ${COLORS.secondary}08 0%, var(--bg-card) 100%)`,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, height: '100%', 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)', 
                pointerEvents: 'none' 
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.cardMargin, position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${COLORS.secondary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calculator size={20} color={COLORS.secondary} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: COLORS.textMain }}>Fertilizer Engine</h3>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: COLORS.textMuted }}>AI Field Plan & Dosages</div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '0.74rem', fontWeight: 850, color: COLORS.secondary,
                  background: `${COLORS.secondary}15`, padding: '6px 12px', borderRadius: '20px',
                  border: `1px solid ${COLORS.secondary}25`
                }}>
                  <span>Open Engine</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {!brain.fertilizer.isValid ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '20px', border: `1px dashed var(--border-main)` }}>
                  <RefreshCw size={24} color={COLORS.textMuted} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: COLORS.textMuted, marginBottom: '8px' }}>NPK Sensors Offline</div>
                  <div style={{ fontSize: '0.72rem', color: COLORS.secondary, fontWeight: 700 }}>Tap to open manual calculator & presets →</div>
                </div>
              ) : (
                <>
                  {/* HERO VALUE CARDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DESIGN.gap, marginBottom: DESIGN.cardMargin }}>
                    {[
                      { label: 'Urea', val: brain.fertilizer.urea },
                      { label: 'SSP', val: brain.fertilizer.ssp },
                      { label: 'MOP', val: brain.fertilizer.mop }
                    ].map((f, i) => (
                      <div key={i} style={{ 
                        background: 'var(--bg-card)', borderRadius: '16px', padding: '12px 8px', 
                        border: '1px solid var(--border-main)', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 900, color: COLORS.textMuted, letterSpacing: '0.04em' }}>{f.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 950, color: COLORS.textMain, marginTop: '2px' }}>{Math.round(f.val)}<span style={{ fontSize: '0.7rem', marginLeft: '2px', opacity: 0.5 }}>kg</span></div>
                      </div>
                    ))}
                  </div>

                  {/* ACTIONABLE ADVISORY */}
                  <div style={{ padding: `0 ${DESIGN.smallPad}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                       <Scale size={13} color={COLORS.primary} style={{ marginTop: '2px' }} />
                       <div>
                         <div style={{ fontSize: '0.6rem', fontWeight: 900, color: COLORS.textMuted, marginBottom: '2px' }}>Apply:</div>
                         <span style={{ fontSize: '0.8rem', fontWeight: 850, color: COLORS.textMain, lineHeight: 1.3 }}>
                           DAP + SSP (Basal), Urea split, MOP as Potash source
                         </span>
                       </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px', opacity: 0.7 }}>
                       <Clock size={13} color={COLORS.primary} style={{ marginTop: '2px' }} />
                       <div>
                         <div style={{ fontSize: '0.6rem', fontWeight: 900, color: COLORS.textMuted, marginBottom: '2px' }}>Schedule:</div>
                         <span style={{ fontSize: '0.75rem', fontWeight: 750, color: COLORS.textMuted, lineHeight: 1.3 }}>
                           Basal → Tillering → Panicle (split N application)
                         </span>
                       </div>
                    </div>
                  </div>

                  {/* BOTTOM CTA LINK */}
                  <div style={{ 
                    marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-main)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                  }}>
                    <span style={{ fontSize: '0.72rem', color: COLORS.textMuted, fontWeight: 700 }}>
                      AI Custom Split & Application Schedule
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 900, color: COLORS.secondary, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Detailed Engine <ChevronRight size={13} />
                    </span>
                  </div>
                </>
              )}
            </motion.div>

            {/* 🌿 COMPOST ENGINE */}
            <div style={{ ...cardStyle, background: `linear-gradient(165deg, ${COLORS.primary}08 0%, var(--bg-card) 100%)` }}>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, height: '100%', 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)', 
                pointerEvents: 'none' 
              }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.cardMargin }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${COLORS.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={20} color={COLORS.primary} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: COLORS.textMain }}>Compost Engine</h3>
                    </div>
                {/* Status badge removed for cleaner header */}
                  </div>

              {!brain.compost.isValid ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '20px', border: `1px dashed var(--border-main)` }}>
                  <RefreshCw size={24} color={COLORS.textMuted} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: COLORS.textMuted }}>Soil Sensors Offline</div>
                </div>
              ) : (
                <>
                  {/* BALANCE STATUS DISPLAY */}
                  <div style={{ padding: `8px ${DESIGN.container}`, textAlign: 'left', marginBottom: DESIGN.cardMargin }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: COLORS.textMuted, marginBottom: '4px' }}>Requirement:</div>
                    <span style={{ fontSize: '1.8rem', fontWeight: 950, color: COLORS.textMain, lineHeight: 1 }}>{brain.compost.perAcre}</span>
                  </div>

                  {/* COMPACT FOOTER */}
                  <div style={{ padding: DESIGN.smallPad, display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.5 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Sprout size={11} color={COLORS.primary} />
                       <span style={{ fontSize: '0.62rem', fontWeight: 800, color: COLORS.textMain }}>{brain.compost.product}</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Clock size={11} color={COLORS.primary} />
                       <span style={{ fontSize: '0.62rem', fontWeight: 800, color: COLORS.textMain }}>{brain.compost.stage}</span>
                     </div>
                  </div>
                </>
              )}
            </div>

            {/* 🛡️ PEST ENGINE */}
            <div style={{ ...cardStyle, background: `linear-gradient(165deg, ${COLORS.danger}08 0%, var(--bg-card) 100%)` }}>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, height: '100%', 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)', 
                pointerEvents: 'none' 
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: DESIGN.cardMargin }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${COLORS.danger}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bug size={20} color={COLORS.danger} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: COLORS.textMain }}>Pest Analysis</h3>
                </div>
              </div>

              {brain.isOffline ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '20px', border: `1px dashed var(--border-main)` }}>
                  <RefreshCw size={24} color={COLORS.textMuted} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: COLORS.textMuted }}>Syncing Threat Forensics...</div>
                </div>
              ) : (
                brain.pests.detected.map((p, i) => (
                  <div key={i} style={{ padding: `${DESIGN.smallPad} ${DESIGN.innerPad}` }}>
                    <div style={{ marginBottom: DESIGN.smallPad }}>
                       <span style={{ fontSize: '1.1rem', fontWeight: 950, color: COLORS.textMain }}>{p.n}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 750, color: p.isActive ? COLORS.textMain : COLORS.textMuted }}>
                      {p.intel}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* 🌾 CROP SUITABILITY CHECK TABLE - INDUSTRIAL REDESIGN */
          <div style={{ ...cardStyle, background: `linear-gradient(165deg, ${COLORS.secondary}08 0%, var(--bg-card) 100%)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.cardMargin, padding: '0 4px' }}>
              <h3 style={{ ...sectionHeader, fontSize: '1.3rem', fontWeight: 950, gap: '10px', marginBottom: 0 }}>
                {getCropIcon(CROP_SPECS[selectedCrop]?.type, selectedCrop) && React.createElement(getCropIcon(CROP_SPECS[selectedCrop]?.type, selectedCrop).icon, { size: 20, color: COLORS.secondary })}
                Crop Suitability Analysis Table
              </h3>
            </div>
            
            <div style={{ 
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', gap: DESIGN.gap, 
              padding: '10px 8px', 
              background: `linear-gradient(90deg, ${COLORS.secondary}08 0%, transparent 100%)`,
              borderRadius: '12px',
              marginBottom: DESIGN.gap 
            }}>
              {['Factor', 'Ideal', 'Industrial Insights'].map((h, i) => (
                <span key={i} style={{ 
                  fontSize: '0.75rem', fontWeight: 950, color: '#94A3B8',
                  letterSpacing: '0.04em',
                  textAlign: 'left',
                  paddingLeft: i === 0 ? '30px' : 0
                }}>{h}</span>
              ))}
            </div>

            {brain.suitabilityTable.map((row, idx) => (
              <div key={row.id} style={{ 
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', gap: DESIGN.gap, 
                padding: `14px 8px`, 
                minHeight: '60px',
                borderBottom: idx === brain.suitabilityTable.length - 1 ? 'none' : `1px solid var(--border-main)`, 
                alignItems: 'start'
              }}>
                {/* Column 1: Factor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ minWidth: '22px', height: '22px', borderRadius: '5px', background: `${row.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {React.createElement(row.icon, { size: 11, color: row.color })}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: COLORS.textMain, lineHeight: 1.4 }}>{row.label || row.id}</span>
                </div>

                {/* Column 2: Target Spec */}
                <div style={{ textAlign: 'left' }}>
                  <span style={{ 
                    fontSize: '0.85rem', fontWeight: 800, color: COLORS.textMain, 
                    lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: '4', WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden'
                  }}>
                    {row.ideal}
                  </span>
                </div>

                {/* Column 3: Insights */}
                <div style={{ textAlign: 'left' }}>
                  <span style={{ 
                    fontSize: '0.8rem', color: COLORS.textMain, fontWeight: 600, lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: '4', WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden'
                  }}>
                    {row.decision}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
};

export default FarmAdvisor;
