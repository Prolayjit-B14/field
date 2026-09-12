import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../state/TelemetryContext';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const GlobalConnectionBanner = ({ compact = false }) => {
  const { mqttStatus, systemOverview, lastGlobalUpdate } = useTelemetry();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine aggregate state
  const state = React.useMemo(() => {
    if (!isOnline) {
      return {
        label: 'Internet Offline',
        desc: 'Device has no active internet connection',
        color: '#EF4444',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        icon: WifiOff
      };
    }

    if (mqttStatus === 'connecting') {
      return {
        label: 'Connecting to Broker',
        desc: 'Establishing secure MQTT stream...',
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FDE68A',
        icon: RefreshCw,
        spinning: true
      };
    }

    if (mqttStatus === 'reconnecting') {
      return {
        label: 'Reconnecting MQTT',
        desc: 'Attempting broker reconnection...',
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FDE68A',
        icon: RefreshCw,
        spinning: true
      };
    }

    if (mqttStatus === 'disconnected') {
      return {
        label: 'Broker Offline',
        desc: 'Live telemetry stream paused',
        color: '#EF4444',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        icon: AlertCircle
      };
    }

    // MQTT is connected, evaluate hardware node reachability
    const total = systemOverview?.total_nodes || 3;
    const active = systemOverview?.active_nodes || 0;

    if (active === 0) {
      return {
        label: 'Sensors Offline',
        desc: `0 of ${total} hardware nodes broadcasting`,
        color: '#EF4444',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        icon: AlertCircle
      };
    }

    if (active < total) {
      return {
        label: 'Partial Telemetry',
        desc: `${active} of ${total} hardware nodes broadcasting`,
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FDE68A',
        icon: AlertCircle
      };
    }

    return {
      label: 'Telemetry Online',
      desc: lastGlobalUpdate ? `Updated ${lastGlobalUpdate}` : 'All nodes transmitting',
      color: '#15803D',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      icon: CheckCircle2
    };
  }, [isOnline, mqttStatus, systemOverview, lastGlobalUpdate]);

  if (compact) {
    const Icon = state.icon;
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '20px',
        background: state.bg,
        border: `1px solid ${state.border}`,
        color: state.color,
        fontSize: '0.68rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        flexShrink: 0
      }}>
        <Icon size={12} className={state.spinning ? 'animate-spin' : ''} strokeWidth={2.5} />
        <span>{state.label}</span>
      </div>
    );
  }

  // Banner display (shown only when degraded/offline to avoid cluttering optimal state)
  if (state.label === 'Telemetry Online') return null;

  const Icon = state.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        style={{
          margin: '0 1rem 0.75rem',
          padding: '8px 12px',
          background: state.bg,
          border: `1px solid ${state.border}`,
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: state.color,
            flexShrink: 0
          }}>
            <Icon size={14} className={state.spinning ? 'animate-spin' : ''} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: state.color, lineHeight: 1.2 }}>
              {state.label}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748B', lineHeight: 1.2 }}>
              {state.desc}
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: state.color,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Re-sync
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalConnectionBanner;
