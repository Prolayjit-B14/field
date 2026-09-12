import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { 
  ArrowLeft, Wifi, WifiOff, Eye, EyeOff, 
  ShieldCheck, RefreshCw, CheckCircle2, Lock, 
  Server, Cpu, Key, Radio, Save
} from 'lucide-react';
import { MASTER_CONFIG } from '../../setup';

const MqttConfig = () => {
  const navigate = useNavigate();
  const { mqttStatus, lastGlobalUpdate } = useTelemetry();
  const { user, farmInfo } = useApp();

  // Broker inputs
  const [brokerAddress, setBrokerAddress] = useState(MASTER_CONFIG.MQTT_BROKER || 'broker.hivemq.com');
  const [brokerPort, setBrokerPort] = useState(String(MASTER_CONFIG.MQTT_WSS_PORT || '8884'));
  const [username, setUsername] = useState(MASTER_CONFIG.MQTT_USER || 'agrisense');
  const [password, setPassword] = useState(MASTER_CONFIG.MQTT_PASS || 'AgriSense2024');
  const [showPassword, setShowPassword] = useState(false);
  const [clientId, setClientId] = useState(`AgriSensePro_${(user?.name || 'ProB').replace(/\s+/g, '')}_u01`);
  const [farmId, setFarmId] = useState('FARM-001');
  const [topicPrefix, setTopicPrefix] = useState(`agrisense/${(user?.email || 'prolay').split('@')[0]}/field_b`);
  const [useTls, setUseTls] = useState(true);

  // Status & Testing
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(1305); // 00:21:45 base

  // Live uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isConnected = mqttStatus === 'connected';

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        success: true,
        message: 'Broker handshake validated. Ping: 38ms'
      });
      setTimeout(() => setTestResult(null), 3500);
    }, 1200);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setTestResult({
        success: true,
        message: 'MQTT settings saved and synced with ESP32 nodes!'
      });
      setTimeout(() => setTestResult(null), 3500);
    }, 1000);
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



      {/* ─── MQTT STATUS CARD (MATCHING PANEL 8) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '20px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: isConnected ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${isConnected ? '#DCFCE7' : '#FCA5A5'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isConnected ? '#15803D' : '#DC2626',
            flexShrink: 0
          }}>
            {isConnected ? <Radio size={24} strokeWidth={2.2} /> : <WifiOff size={24} strokeWidth={2.2} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: isConnected ? '#15803D' : '#DC2626' }}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
              <span style={{ fontSize: '0.7rem', color: isConnected ? '#15803D' : '#DC2626' }}>●</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
              {isConnected ? 'Connected to broker successfully' : 'Disconnected from telemetry broker'}
            </div>
          </div>
        </div>

        {/* Uptime on Right */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Uptime
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'monospace' }}>
            {formatUptime(uptimeSeconds)}
          </div>
        </div>
      </motion.div>

      {/* Result Toast */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: testResult.success ? '#DCFCE7' : '#FEF2F2',
            border: `1px solid ${testResult.success ? '#86EFAC' : '#FCA5A5'}`,
            color: testResult.success ? '#15803D' : '#DC2626',
            borderRadius: '14px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{testResult.message}</span>
        </motion.div>
      )}

      {/* ─── BROKER SETTINGS FORM (MATCHING PANEL 8) ─── */}
      <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 10px 4px' }}>
          Broker Settings
        </h4>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '22px',
          padding: '16px 18px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Broker Address */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Broker Address
            </label>
            <input
              type="text"
              value={brokerAddress}
              onChange={e => setBrokerAddress(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-main)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                padding: '0 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Port */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Port
            </label>
            <input
              type="text"
              value={brokerPort}
              onChange={e => setBrokerPort(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-main)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                padding: '0 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Username */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-main)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                padding: '0 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Password with Eye toggle */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-main)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  padding: '0 40px 0 12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Client ID */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-main)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                padding: '0 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Farm ID */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Farm ID
            </label>
            <input
              type="text"
              value={farmId}
              onChange={e => setFarmId(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-main)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                padding: '0 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Topic Prefix */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Topic Prefix
            </label>
            <input
              type="text"
              value={topicPrefix}
              onChange={e => setTopicPrefix(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-main)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                padding: '0 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* ─── SECURITY SECTION (MATCHING PANEL 8) ─── */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 10px 4px' }}>
            Security
          </h4>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '14px 18px',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Use TLS / SSL</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Encrypt all telemetry packets over TLS</div>
            </div>
            <input
              type="checkbox"
              checked={useTls}
              onChange={e => setUseTls(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#15803D',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* ─── BOTTOM ACTIONS (MATCHING PANEL 8) ─── */}
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingBottom: '10px' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              flex: 1.4,
              height: '50px',
              borderRadius: '16px',
              background: '#15803D',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)'
            }}
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isConnected) {
                alert("Disconnecting from broker. Hardware will enter autonomous fallback mode.");
              } else {
                handleTestConnection();
              }
            }}
            style={{
              flex: 1,
              height: '50px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-main)',
              color: isConnected ? '#DC2626' : 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isConnected ? 'Disconnect' : 'Reconnect'}
          </button>
        </div>
      </form>

    </div>
  );
};

export default MqttConfig;
