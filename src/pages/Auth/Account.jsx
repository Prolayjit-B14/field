import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  User, Shield, Lock, Bell, ChevronRight, 
  LogOut, CheckCircle2, Sprout, Globe, Phone, 
  Mail, X, Save, RefreshCw, Key, ShieldCheck
} from 'lucide-react';

const Account = () => {
  const navigate = useNavigate();
  const { user, farmInfo, updateUser, updateBranding, logout, resetPassword } = useApp();
  const { systemOverview, devices } = useTelemetry();

  const [activeModal, setActiveModal] = useState(null); // 'personal' | 'farm' | 'security' | 'accounts' | 'notifications' | null
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [editName, setEditName] = useState(user?.name || 'Pro B');
  const [editPhone, setEditPhone] = useState(user?.phone || '+91 98765 43210');
  const [editFarmName, setEditFarmName] = useState(farmInfo?.name || 'Krishnanagar Farm');
  const [editLocation, setEditLocation] = useState(user?.location || 'Krishnanagar, West Bengal');

  const totalDevicesCount = Object.keys(devices || {}).length || 5;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name: editName,
        phone: editPhone,
        location: editLocation
      });
      if (editFarmName !== farmInfo?.name) {
        updateBranding({ ...farmInfo, name: editFarmName });
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveModal(null);
      }, 1000);
    } catch (err) {
      console.warn("Save profile note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setIsSaving(true);
    await resetPassword(user.email);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveModal(null);
    }, 1500);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // Get first letter of display name for avatar
  const initial = (user?.name || 'P').charAt(0).toUpperCase();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box'
    }}>

      {/* ─── PROFILE HERO CARD (MATCHING PANEL 2) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '26px',
          padding: '24px 20px 20px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Large Green Circular Initial Avatar */}
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          background: '#15803D',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 900,
          boxShadow: '0 8px 20px rgba(21, 128, 61, 0.28)',
          marginBottom: '12px'
        }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            initial
          )}
        </div>

        {/* User Name & Verified Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: 'var(--text-main)',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            {user?.name || 'Pro B'}
          </h2>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            background: '#DCFCE7',
            color: '#15803D',
            fontSize: '0.65rem',
            fontWeight: 800
          }}>
            <CheckCircle2 size={11} strokeWidth={3} />
            <span>Verified</span>
          </div>
        </div>

        {/* Email */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px' }}>
          {user?.email || 'contact.prolay14@gmail.com'}
        </div>

        {/* Role */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-inactive)', fontWeight: 600, marginBottom: '20px' }}>
          Farmer
        </div>

        {/* ─── 3-COLUMN STATS ROW ─── */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid var(--border-main)',
          paddingTop: '16px'
        }}>
          {/* Farm */}
          <div style={{ textAlign: 'left', paddingRight: '4px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Farm</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {farmInfo?.name || 'Krishnanagar Farm'}
            </div>
          </div>

          {/* Joined */}
          <div style={{ textAlign: 'center', padding: '0 4px', borderLeft: '1px solid var(--border-main)', borderRight: '1px solid var(--border-main)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Joined</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              Jan 15, 2024
            </div>
          </div>

          {/* Devices */}
          <div style={{ textAlign: 'right', paddingLeft: '4px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Devices</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {totalDevicesCount} Connected
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── PROFILE INFORMATION LIST (MATCHING PANEL 2) ─── */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '0.92rem',
          fontWeight: 900,
          color: 'var(--text-main)',
          margin: '0 0 10px 4px',
          letterSpacing: '-0.02em'
        }}>
          Profile Information
        </h3>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '22px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {[
            { id: 'personal', label: 'Personal Information', icon: User },
            { id: 'farm', label: 'Farm Information', icon: Sprout },
            { id: 'security', label: 'Security & Login', icon: Lock },
            { id: 'accounts', label: 'Connected Accounts', icon: Globe },
            { id: 'notifications', label: 'Notification Settings', icon: Bell }
          ].map((item, idx, arr) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveModal(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border-main)' : 'none',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <Icon size={19} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.label}
                  </span>
                </div>

                <ChevronRight size={18} color="var(--text-inactive)" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── RED OUTLINED SIGN OUT BUTTON (MATCHING PANEL 2) ─── */}
      <div style={{ marginTop: 'auto', paddingTop: '8px', paddingBottom: '12px' }}>
        <motion.button
          whileHover={{ scale: 1.01, background: '#FEF2F2' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1.5px solid #FCA5A5',
            color: '#DC2626',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <LogOut size={18} strokeWidth={2.2} />
          <span>Sign Out</span>
        </motion.button>
      </div>

      {/* ─── INTERACTIVE EDIT MODALS ─── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '28px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: 'var(--shadow-premium)',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {activeModal === 'personal' && 'Personal Information'}
                  {activeModal === 'farm' && 'Farm Information'}
                  {activeModal === 'security' && 'Security & Login'}
                  {activeModal === 'accounts' && 'Connected Accounts'}
                  {activeModal === 'notifications' && 'Notification Settings'}
                </h3>
                <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              {saveSuccess && (
                <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: '12px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '14px', textAlign: 'center' }}>
                  ✓ Profile changes successfully saved!
                </div>
              )}

              {/* Personal Information */}
              {activeModal === 'personal' && (
                <form onSubmit={handleSaveProfile}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '0 12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '0 12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Location</label>
                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '0 12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <button type="submit" disabled={isSaving} style={{ width: '100%', height: '48px', borderRadius: '14px', background: '#15803D', border: 'none', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              )}

              {/* Farm Information */}
              {activeModal === 'farm' && (
                <form onSubmit={handleSaveProfile}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Farm Name</label>
                    <input type="text" value={editFarmName} onChange={e => setEditFarmName(e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '0 12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Farm ID</label>
                    <input type="text" readOnly value="FARM-001" style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-muted)', padding: '0 12px', fontSize: '0.9rem' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Primary Crop</label>
                    <input type="text" readOnly value="Rice & Precision Vegetables" style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-muted)', padding: '0 12px', fontSize: '0.9rem' }} />
                  </div>
                  <button type="submit" disabled={isSaving} style={{ width: '100%', height: '48px', borderRadius: '14px', background: '#15803D', border: 'none', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>
                    {isSaving ? 'Updating...' : 'Save Farm Info'}
                  </button>
                </form>
              )}

              {/* Security & Login */}
              {activeModal === 'security' && (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Manage your credentials or send a password reset link to your registered email address ({user?.email}).
                  </p>
                  <button onClick={handleSendResetPassword} disabled={isSaving} style={{ width: '100%', height: '48px', borderRadius: '14px', background: '#15803D', border: 'none', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer', marginBottom: '10px' }}>
                    {isSaving ? 'Sending Link...' : 'Send Password Recovery Email'}
                  </button>
                  <button onClick={() => setActiveModal(null)} style={{ width: '100%', height: '44px', borderRadius: '14px', background: 'transparent', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Connected Accounts */}
              {activeModal === 'accounts' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-main)' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Google Account</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803D' }}>Connected</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>MQTT Telemetry Broker</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>broker.hivemq.com:1883</div>
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803D' }}>Active</span>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeModal === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                    Push Notifications
                    <input type="checkbox" defaultChecked />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                    Critical Threshold Alerts
                    <input type="checkbox" defaultChecked />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                    Daily Telemetry Digest
                    <input type="checkbox" defaultChecked />
                  </label>
                  <button onClick={() => setActiveModal(null)} style={{ marginTop: '10px', width: '100%', height: '46px', borderRadius: '14px', background: '#15803D', border: 'none', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>
                    Done
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Account;
