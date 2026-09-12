import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { 
  ArrowLeft, Check, Sprout, MapPin, 
  Cpu, CheckCircle2, ChevronRight, Droplets,
  CloudSun, Camera, Zap, RefreshCw, AlertCircle
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Farm Info' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Crop' },
  { id: 4, label: 'Hardware' },
  { id: 5, label: 'Complete' }
];

const FarmSetup = () => {
  const navigate = useNavigate();
  const { user, farmInfo, updateBranding } = useApp();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [farmName, setFarmName] = useState(farmInfo?.name || '');
  const [farmArea, setFarmArea] = useState('5');
  const [areaUnit, setAreaUnit] = useState('Acres');
  const [farmType, setFarmType] = useState('Commercial Farm');
  const [irrigationType, setIrrigationType] = useState('Drip Irrigation');

  // Step 2 Location
  const [locationName, setLocationName] = useState('Krishnanagar, West Bengal, India');
  const [coordinates, setCoordinates] = useState('23.4013° N, 88.5028° E');
  const [isLocating, setIsLocating] = useState(false);

  // Step 3 Crop
  const [selectedCrop, setSelectedCrop] = useState('Rice');

  // Step 4 Hardware
  const [pairedNodes, setPairedNodes] = useState([
    { id: 'SOIL-01', name: 'Soil Node', type: 'Soil', status: 'Online' },
    { id: 'WEAT-01', name: 'Weather Station', type: 'Weather', status: 'Online' },
    { id: 'CAM-01', name: 'Camera Node', type: 'Vision', status: 'Online' }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(-1);
    }
  };

  const handleComplete = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateBranding({
        name: farmName || 'Krishnanagar Farm',
        crop: selectedCrop,
        location: locationName,
        area: `${farmArea} ${areaUnit}`
      });
      setIsSaving(false);
      navigate('/dashboard');
    }, 1000);
  };

  const handleFetchLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates(`${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
          setIsLocating(false);
        },
        (err) => {
          console.warn(err);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: '#EAF5ED',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* ─── TOP APP BAR (MATCHING PANEL 8) ─── */}
      <div style={{
        padding: '24px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <button
          onClick={handleBack}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '14px',
            background: '#FFFFFF',
            border: '1.5px solid #E2EBE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#122B1E',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#122B1E', letterSpacing: '-0.02em' }}>
            Farm Setup
          </h2>
          <div style={{ fontSize: '0.8rem', color: '#6B7F75', fontWeight: 500 }}>
            Let's set up your farm
          </div>
        </div>
      </div>

      {/* ─── 5-STEP PROGRESS BAR (MATCHING PANEL 8) ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 24px 18px',
        position: 'relative'
      }}>
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.id;
          const isActive = currentStep === s.id;

          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isActive ? '#15803D' : isCompleted ? '#16A34A' : '#FFFFFF',
                border: `2px solid ${isActive || isCompleted ? '#15803D' : '#CBD5E1'}`,
                color: isActive || isCompleted ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 900,
                boxShadow: isActive ? '0 4px 10px rgba(21, 128, 61, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {isCompleted ? <Check size={16} strokeWidth={3} /> : s.id}
              </div>

              <span style={{
                fontSize: '0.65rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#15803D' : '#64748B',
                marginTop: '4px',
                whiteSpace: 'nowrap'
              }}>
                {s.label}
              </span>
            </div>
          );
        })}

        {/* Background Connecting Line */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '40px',
          right: '40px',
          height: '2px',
          background: '#CBD5E1',
          zIndex: 1
        }} />
      </div>

      {/* ─── WHITE CARD CONTAINER ─── */}
      <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          style={{
            background: '#FFFFFF',
            borderRadius: '32px',
            padding: '24px 20px',
            boxShadow: '0 20px 40px -10px rgba(18, 50, 25, 0.08)',
            border: '1px solid rgba(22, 128, 61, 0.08)',
            marginBottom: '16px'
          }}
        >
          {/* STEP 1: FARM INFO */}
          {currentStep === 1 && (
            <div>
              {/* Farm Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Farm Name
                </label>
                <input
                  type="text"
                  placeholder="Enter farm name"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#F8FAF9',
                    color: '#0F172A',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Farm Area with Unit selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Farm Area
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Enter farm area"
                    value={farmArea}
                    onChange={e => setFarmArea(e.target.value)}
                    style={{
                      flex: 1,
                      height: '48px',
                      borderRadius: '14px',
                      border: '1.5px solid #E2E8F0',
                      background: '#F8FAF9',
                      color: '#0F172A',
                      padding: '0 14px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <select
                    value={areaUnit}
                    onChange={e => setAreaUnit(e.target.value)}
                    style={{
                      width: '110px',
                      height: '48px',
                      borderRadius: '14px',
                      border: '1.5px solid #E2E8F0',
                      background: '#F8FAF9',
                      color: '#0F172A',
                      padding: '0 10px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option>Acres</option>
                    <option>Hectares</option>
                    <option>Bigha</option>
                  </select>
                </div>
              </div>

              {/* Farm Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Farm Type
                </label>
                <select
                  value={farmType}
                  onChange={e => setFarmType(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#F8FAF9',
                    color: '#0F172A',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option>Commercial Farm</option>
                  <option>Organic Agriculture</option>
                  <option>Polyhouse / Greenhouse</option>
                  <option>Family Homestead</option>
                </select>
              </div>

              {/* Irrigation Type */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Irrigation Type
                </label>
                <select
                  value={irrigationType}
                  onChange={e => setIrrigationType(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#F8FAF9',
                    color: '#0F172A',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option>Drip Irrigation</option>
                  <option>Sprinkler System</option>
                  <option>Flood / Furrow</option>
                  <option>Manual Pump</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Farm Location Address
              </label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                style={{ width: '100%', height: '48px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#F8FAF9', padding: '0 14px', fontSize: '0.9rem', marginBottom: '14px', boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                GPS Coordinates
              </label>
              <input
                type="text"
                value={coordinates}
                readOnly
                style={{ width: '100%', height: '48px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#F1F5F9', padding: '0 14px', fontSize: '0.88rem', color: '#64748B', marginBottom: '14px', boxSizing: 'border-box' }}
              />

              <button
                type="button"
                onClick={handleFetchLocation}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '14px',
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  color: '#15803D',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MapPin size={16} />
                <span>{isLocating ? 'Acquiring GPS...' : 'Use Current Device Location'}</span>
              </button>
            </div>
          )}

          {/* STEP 3: CROP */}
          {currentStep === 3 && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#122B1E', marginBottom: '12px' }}>
                Select Primary Crop
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['Rice', 'Wheat', 'Maize', 'Potato', 'Tomato', 'Mustard', 'Sugarcane', 'Cotton'].map(c => {
                  const isSel = selectedCrop === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCrop(c)}
                      style={{
                        height: '46px',
                        borderRadius: '14px',
                        border: `1.5px solid ${isSel ? '#15803D' : '#E2E8F0'}`,
                        background: isSel ? '#F0FDF4' : '#F8FAF9',
                        color: isSel ? '#15803D' : '#334155',
                        fontSize: '0.88rem',
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: HARDWARE */}
          {currentStep === 4 && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#122B1E', marginBottom: '12px' }}>
                Pair IoT Hardware Nodes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {pairedNodes.map(node => (
                  <div key={node.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAF9', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>{node.name} ({node.id})</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{node.type} Node</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803D' }}>● Ready</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETE */}
          {currentStep === 5 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <CheckCircle2 size={42} color="#15803D" style={{ margin: '0 auto 8px' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#122B1E' }}>
                  Farm Ready for Synchronization!
                </h3>
              </div>
              <div style={{ background: '#F8FAF9', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Farm Name:</span>
                  <strong style={{ color: '#0F172A' }}>{farmName || 'Krishnanagar Farm'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Crop:</span>
                  <strong style={{ color: '#15803D' }}>{selectedCrop}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Area:</span>
                  <strong style={{ color: '#0F172A' }}>{farmArea} {areaUnit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Hardware:</span>
                  <strong style={{ color: '#15803D' }}>3 Nodes Connected</strong>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 🌾 AGRICULTURAL BARN & TRACTOR ILLUSTRATION (MATCHING PANEL 8) */}
        <div style={{ width: '100%', height: '90px', position: 'relative', marginTop: 'auto', pointerEvents: 'none' }}>
          <svg viewBox="0 0 380 90" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            {/* Green rolling crop field */}
            <path d="M0 60 Q120 40 240 55 T380 50 L380 90 L0 90 Z" fill="#9DD7A8" opacity="0.6" />
            <path d="M0 70 Q140 55 280 65 T380 60 L380 90 L0 90 Z" fill="#43B367" opacity="0.8" />

            {/* Red Barn (Right side) */}
            <g transform="translate(300, 32)">
              <rect x="0" y="10" width="34" height="24" fill="#B91C1C" rx="1" />
              <polygon points="17,-2 -2,10 36,10" fill="#991B1B" />
              {/* Barn Door */}
              <rect x="11" y="20" width="12" height="14" fill="#FFFFFF" rx="1" />
              <line x1="11" y1="20" x2="23" y2="34" stroke="#B91C1C" strokeWidth="1" />
              <line x1="23" y1="20" x2="11" y2="34" stroke="#B91C1C" strokeWidth="1" />
            </g>

            {/* Silo */}
            <g transform="translate(285, 26)">
              <rect x="0" y="8" width="12" height="28" fill="#CBD5E1" rx="1" />
              <ellipse cx="6" cy="8" rx="6" ry="4" fill="#94A3B8" />
            </g>

            {/* Tractor */}
            <g transform="translate(345, 42)">
              <rect x="0" y="8" width="16" height="8" fill="#15803D" rx="2" />
              <rect x="8" y="2" width="10" height="10" fill="#15803D" rx="1" />
              <circle cx="4" cy="18" r="4" fill="#1E293B" />
              <circle cx="16" cy="17" r="5.5" fill="#1E293B" />
            </g>
          </svg>
        </div>

        {/* ─── NEXT / COMPLETE BUTTON ─── */}
        <div style={{ padding: '10px 0 20px' }}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={isSaving}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '26px',
              background: '#15803D',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.98rem',
              fontWeight: 800,
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(21, 128, 61, 0.28)'
            }}
          >
            {isSaving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <span>{currentStep === 5 ? 'Complete Setup' : 'Next'}</span>
            )}
          </motion.button>
        </div>
      </div>

    </div>
  );
};

export default FarmSetup;
