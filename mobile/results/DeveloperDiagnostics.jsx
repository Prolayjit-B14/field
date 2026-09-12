import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity, Clock, ShieldCheck, X } from 'lucide-react';

export const DeveloperDiagnostics = ({ diagnostics, isOpen, onClose }) => {
  if (!isOpen || !diagnostics) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1002,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#0F172A',
          color: '#E2E8F0',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '24px 20px',
          maxHeight: '85vh',
          overflowY: 'auto',
          fontFamily: 'monospace'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="#4ADE80" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
              Developer & Agronomic Diagnostics
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#1E293B', padding: '10px 12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>INFERENCE LATENCY</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ADE80', marginTop: '2px' }}>
              {diagnostics.latencyMs || 0} ms
            </div>
          </div>
          <div style={{ background: '#1E293B', padding: '10px 12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>ENGINE MODE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {diagnostics.engineMode || 'Edge CV'}
            </div>
          </div>
        </div>

        {diagnostics.qualityMetrics && (
          <div style={{ background: '#1E293B', padding: '12px 14px', borderRadius: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', marginBottom: '8px' }}>
              INPUT IMAGE METRICS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
              <div>• Blur Variance (Laplacian): <b>{diagnostics.qualityMetrics.blurVariance}</b> (Min: 45)</div>
              <div>• Mean Luminance: <b>{diagnostics.qualityMetrics.meanLuminance}</b> (Valid: 35 - 235)</div>
              <div>• Leaf Pixel Ratio: <b>{diagnostics.qualityMetrics.leafCoverageRatio}</b> (Min: 0.20)</div>
              <div>• Sample Resolution: <b>{diagnostics.qualityMetrics.sampleResolution?.join('x')}</b></div>
            </div>
          </div>
        )}

        <div style={{ background: '#1E293B', padding: '12px 14px', borderRadius: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', marginBottom: '8px' }}>
            ACTIVE CALIBRATED THRESHOLDS
          </div>
          <pre style={{ margin: 0, fontSize: '0.7rem', color: '#CBD5E1', overflowX: 'auto' }}>
            {JSON.stringify(diagnostics.calibratedThresholds || {
              confirmedPest: 0.85,
              possiblePest: 0.65,
              confirmedDamage: 0.80,
              leafConditionHigh: 0.85
            }, null, 2)}
          </pre>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: '#15803D',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Close Diagnostics
        </button>
      </motion.div>
    </motion.div>
  );
};
