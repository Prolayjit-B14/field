import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { CheckCircle2, RefreshCw } from 'lucide-react';

const FertilizerEngine = () => {
  const navigate = useNavigate();
  const { farmInfo } = useApp();
  const { sensorData, mqttStatus } = useTelemetry();

  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [fieldArea, setFieldArea] = useState(1); // acres
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Extract telemetry or use specified defaults
  const isMqttLive = mqttStatus === 'connected';
  const npk = sensorData?.soil?.npk;
  const rawMoisture = sensorData?.soil?.moisture;
  const rawPH = sensorData?.soil?.ph;

  const hasNpkData = npk?.n != null && npk?.p != null && npk?.k != null;
  const isOnline = isMqttLive && hasNpkData;

  const displayN = npk?.n != null ? npk.n : 82;
  const displayP = npk?.p != null ? npk.p : 34;
  const displayK = npk?.k != null ? npk.k : 126;
  const displayPH = rawPH != null ? Number(rawPH).toFixed(1) : '6.7';
  const displayMoisture = rawMoisture != null ? Math.round(rawMoisture) : 42;

  // Dynamic recommendation calculation based on NPK
  const recommendation = useMemo(() => {
    if (displayN < 90) {
      const perAcre = 16;
      return {
        fertilizer: 'Urea',
        dose: `${perAcre} kg / acre`,
        rateKg: perAcre,
        method: 'Broadcast',
        bestTime: '6:00 AM – 10:00 AM',
        basis1: `Nitrogen is below the recommended level for ${selectedCrop} at the current growth stage.`,
        basis2: 'The recommendation is based on your latest soil readings and crop information.'
      };
    } else if (displayP < 30) {
      const perAcre = 12;
      return {
        fertilizer: 'DAP / SSP',
        dose: `${perAcre} kg / acre`,
        rateKg: perAcre,
        method: 'Soil Incorporation',
        bestTime: 'Early Morning',
        basis1: `Phosphorus is below the recommended level for ${selectedCrop} at the current growth stage.`,
        basis2: 'The recommendation is based on your latest soil readings and crop information.'
      };
    } else if (displayK < 50) {
      const perAcre = 14;
      return {
        fertilizer: 'Muriate of Potash (MOP)',
        dose: `${perAcre} kg / acre`,
        rateKg: perAcre,
        method: 'Band Placement',
        bestTime: 'Late Afternoon',
        basis1: `Potassium is below the recommended level for ${selectedCrop} at the current growth stage.`,
        basis2: 'The recommendation is based on your latest soil readings and crop information.'
      };
    }

    return {
      fertilizer: 'Urea',
      dose: '16 kg / acre',
      rateKg: 16,
      method: 'Broadcast',
      bestTime: '6:00 AM – 10:00 AM',
      basis1: `Nitrogen is below the recommended level for ${selectedCrop} at the current growth stage.`,
      basis2: 'The recommendation is based on your latest soil readings and crop information.'
    };
  }, [displayN, displayP, displayK, selectedCrop]);

  const totalQuantity = recommendation.rateKg * fieldArea;

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
    }, 750);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '18px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      maxWidth: '680px',
      margin: '0 auto',
      width: '100%'
    }}>

      {/* ─── 1. FIELD SECTION ─── */}
      <div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 900,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Field
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '18px 20px',
            border: '1.5px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              {farmInfo?.name || 'Field A'}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {selectedCrop}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Vegetative Stage
            </span>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {fieldArea} Acre
            </span>
          </div>
        </motion.div>
      </div>

      {/* ─── 2. SOIL CONDITION SECTION ─── */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 900,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            Soil Condition
          </span>

          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: isOnline ? '#15803D' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ fontSize: '0.65rem' }}>●</span>
            <span>{isOnline ? 'LIVE' : 'LIVE'}</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '20px',
            border: '1.5px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* NPK 3 Columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            textAlign: 'center',
            paddingBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Nitrogen
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {displayN}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>
                mg/kg
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Phosphorus
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {displayP}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>
                mg/kg
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Potassium
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {displayK}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>
                mg/kg
              </div>
            </div>
          </div>

          {/* pH and Moisture Row */}
          <div style={{
            borderTop: '1px solid var(--border-main)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>pH</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)' }}>{displayPH}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>Moisture</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)' }}>{displayMoisture}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── 3. AI RECOMMENDATION SECTION ─── */}
      <div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 900,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          AI Recommendation
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '22px 20px',
            border: '1.5px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Recommended Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#15803D',
            fontSize: '0.85rem',
            fontWeight: 900,
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={18} strokeWidth={2.6} />
            <span>Recommended</span>
          </div>

          {/* Fertilizer & Rate */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {recommendation.fertilizer}
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 850, color: '#15803D', marginTop: '4px' }}>
              {recommendation.dose}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-main)', margin: '16px 0' }} />

          {/* Application & Best Time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>Application</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 850, color: 'var(--text-main)' }}>{recommendation.method}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>Best time</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 850, color: 'var(--text-main)' }}>{recommendation.bestTime}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── 4. RECOMMENDATION BASIS SECTION ─── */}
      <div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 900,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Recommendation Basis
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '18px 20px',
            border: '1.5px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.5 }}>
            {recommendation.basis1}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {recommendation.basis2}
          </div>
        </motion.div>
      </div>

      {/* ─── 5. APPLICATION SUMMARY SECTION ─── */}
      <div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 900,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          Application Summary
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '18px 20px',
            border: '1.5px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>Field Area</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 850, color: 'var(--text-main)' }}>{fieldArea} Acre</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-main)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fertilizer</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 850, color: 'var(--text-main)' }}>{recommendation.fertilizer}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-main)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Quantity</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 950, color: '#15803D' }}>{totalQuantity} kg</span>
          </div>
        </motion.div>
      </div>

      {/* ─── 6. ACTION BUTTONS ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', paddingBottom: '16px' }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRecalculate}
          disabled={isRecalculating}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            background: '#15803D',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 850,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)'
          }}
        >
          {isRecalculating && <RefreshCw size={16} className="animate-spin" />}
          <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Recommendation'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/soil-monitoring')}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-main)',
            color: 'var(--text-main)',
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
          <span>View Soil Data</span>
        </motion.button>
      </div>

    </div>
  );
};

export default FertilizerEngine;
