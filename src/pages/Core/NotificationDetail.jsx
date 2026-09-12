import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  ArrowLeft, AlertTriangle, ShieldCheck, CheckCircle2, 
  Clock, Info, ChevronRight, Check
} from 'lucide-react';

const NotificationDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sensorData, recommendations } = useTelemetry();

  const [isDismissed, setIsDismissed] = useState(false);

  // Read actual telemetry for alert
  const moistureVal = sensorData?.soil?.moisture;
  const currentValDisplay = moistureVal != null ? `${moistureVal} %` : '18.2 %';
  const isCritical = moistureVal != null ? moistureVal < 25 : true;

  const handleInvestigate = () => {
    navigate('/sensor-detail', { state: { sensorId: 'moisture', from: '/alerts' } });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      navigate('/alerts');
    }, 600);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box'
    }}>



      {/* ─── ALERT HEADER CARD (MATCHING PANEL 4) ─── */}
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
          position: 'relative'
        }}
      >
        {/* Top-Right Severity Badge */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '14px',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#DC2626',
          fontSize: '0.72rem',
          fontWeight: 800
        }}>
          <AlertTriangle size={12} strokeWidth={2.5} />
          <span>Critical</span>
        </div>

        {/* Warning Icon in rounded container */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#DC2626',
          marginBottom: '14px'
        }}>
          <AlertTriangle size={26} strokeWidth={2.2} />
        </div>

        {/* Title & Subtitle */}
        <h3 style={{
          margin: '0 0 4px',
          fontSize: '1.25rem',
          fontWeight: 900,
          color: 'var(--text-main)',
          letterSpacing: '-0.02em'
        }}>
          Soil Moisture Critical Low
        </h3>
        <p style={{
          margin: '0 0 10px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          Moisture below safe configured threshold
        </p>

        {/* Timestamp */}
        <div style={{ fontSize: '0.74rem', color: 'var(--text-inactive)', fontWeight: 600 }}>
          May 18, 2024 • 08:21 PM
        </div>
      </motion.div>

      {/* ─── ALERT DETAILS LIST (MATCHING PANEL 4) ─── */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '22px',
        padding: '16px 20px',
        border: '1px solid var(--border-main)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '16px'
      }}>
        {[
          { label: 'Node', value: 'SOIL-01', color: 'var(--text-main)' },
          { label: 'Sensor', value: 'Soil Moisture', color: 'var(--text-main)' },
          { label: 'Current Value', value: currentValDisplay, color: '#DC2626', bold: true },
          { label: 'Threshold', value: '30 %', color: 'var(--text-main)' },
          { label: 'Duration', value: '12 min', color: 'var(--text-main)' },
          { label: 'Status', value: isDismissed ? 'Resolved' : 'Active', color: isDismissed ? '#15803D' : '#DC2626', bold: true }
        ].map((item, idx, arr) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: idx < arr.length - 1 ? '1px solid var(--border-main)' : 'none'
            }}
          >
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {item.label}
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: item.bold ? 900 : 700, color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* ─── RECOMMENDED ACTION CARD (MATCHING PANEL 4) ─── */}
      <div style={{
        background: '#F0FDF4',
        borderRadius: '20px',
        padding: '16px 18px',
        border: '1px solid #DCFCE7',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Recommended Action
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#14532D', fontWeight: 600, lineHeight: 1.4 }}>
          Start irrigation immediately to prevent crop stress. Run water pump relay on Node SOIL-01.
        </p>
      </div>

      {/* ─── ACTION BUTTONS (MATCHING PANEL 4) ─── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '8px' }}>
        <button
          onClick={handleInvestigate}
          style={{
            flex: 1,
            height: '48px',
            borderRadius: '16px',
            background: '#15803D',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)'
          }}
        >
          Investigate
        </button>

        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            height: '48px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-main)',
            color: 'var(--text-main)',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Dismiss
        </button>
      </div>

    </div>
  );
};

export default NotificationDetail;
