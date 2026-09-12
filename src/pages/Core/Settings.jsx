import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  ArrowLeft, Bell, Sun, Moon, Laptop,
  ChevronRight, Database, Shield, Smartphone, 
  Trash2, Download, Info, Check, Globe
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useApp();
  const { lastGlobalUpdate } = useTelemetry();

  const [units, setUnits] = useState('Metric (°C, %, mm)');
  const [language, setLanguage] = useState('English');
  const [refreshInterval, setRefreshInterval] = useState('5 seconds');
  const [offlineMode, setOfflineMode] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [alertSounds, setAlertSounds] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      showToast("Local cache cleared successfully!");
    } catch (e) {
      console.warn("Clear cache note:", e);
    }
  };

  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      units,
      language,
      refreshInterval,
      offlineCacheEnabled: offlineMode
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrisense_settings_${Date.now()}.json`;
    a.click();
    showToast("Settings exported successfully!");
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

      {/* Toast banner */}
      {toastMessage && (
        <div style={{
          background: '#DCFCE7',
          border: '1px solid #86EFAC',
          color: '#15803D',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: '14px',
          textAlign: 'center'
        }}>
          {toastMessage}
        </div>
      )}

      {/* ─── APPEARANCE SECTION (MATCHING PANEL 5) ─── */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 4px' }}>
          Appearance
        </h4>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '14px 16px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Theme</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            background: 'var(--bg-main)',
            borderRadius: '12px',
            padding: '3px',
            border: '1px solid var(--border-main)'
          }}>
            {[
              { id: 'light', label: 'Light', icon: Sun, active: !isDarkMode },
              { id: 'dark', label: 'Dark', icon: Moon, active: isDarkMode }
            ].map(t => (
              <button
                key={t.id}
                onClick={toggleTheme}
                style={{
                  flex: 1,
                  height: '34px',
                  borderRadius: '10px',
                  border: 'none',
                  background: t.active ? 'var(--bg-card)' : 'transparent',
                  color: t.active ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: t.active ? 800 : 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: t.active ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <t.icon size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── GENERAL SETTINGS SECTION (MATCHING PANEL 5) ─── */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 4px' }}>
          General
        </h4>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {/* Unit Settings */}
          <div
            onClick={() => {
              setUnits(u => u.includes('Metric') ? 'Imperial (°F, %, in)' : 'Metric (°C, %, mm)');
              showToast("Measurement units updated");
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-main)',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Unit Settings</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{units}</div>
            </div>
            <ChevronRight size={18} color="var(--text-inactive)" />
          </div>

          {/* Language */}
          <div
            onClick={() => showToast("Language locked to English for Agricultural Telemetry")}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-main)',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Language</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{language}</div>
            </div>
            <ChevronRight size={18} color="var(--text-inactive)" />
          </div>

          {/* Data Refresh */}
          <div
            onClick={() => {
              const next = refreshInterval === '5 seconds' ? '10 seconds' : refreshInterval === '10 seconds' ? '30 seconds' : '5 seconds';
              setRefreshInterval(next);
              showToast(`MQTT poll interval set to ${next}`);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-main)',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Data Refresh Interval</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{refreshInterval}</div>
            </div>
            <ChevronRight size={18} color="var(--text-inactive)" />
          </div>

          {/* Offline Mode Toggle Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px'
          }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Offline Mode</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cache data when offline</div>
            </div>
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={e => setOfflineMode(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#15803D',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── NOTIFICATIONS SECTION (MATCHING PANEL 5) ─── */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 4px' }}>
          Notifications
        </h4>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => setPushNotifications(p => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-main)',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Push Notifications</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{pushNotifications ? 'On' : 'Off'}</div>
            </div>
            <ChevronRight size={18} color="var(--text-inactive)" />
          </div>

          <div
            onClick={() => setAlertSounds(a => !a)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Alert Sounds</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{alertSounds ? 'On' : 'Off'}</div>
            </div>
            <ChevronRight size={18} color="var(--text-inactive)" />
          </div>
        </div>
      </div>

      {/* ─── DATA & STORAGE ACTIONS ─── */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 4px' }}>
          Data & Security
        </h4>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            onClick={handleExportData}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            <span>Export Configuration & Telemetry</span>
          </button>

          <button
            onClick={handleClearCache}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={16} />
            <span>Clear Local Storage Cache</span>
          </button>
        </div>
      </div>

      {/* ─── ABOUT FOOTER ─── */}
      <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          AgriSense Pro v19.0.0 (Production Native)
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-inactive)', marginTop: '2px' }}>
          Hardware: ESP32-WROOM-32 • ESP32-CAM • LoRa SX1278
        </div>
      </div>

    </div>
  );
};

export default Settings;
