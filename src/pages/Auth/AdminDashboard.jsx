import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../state/AppContext';
import { 
  Users, MapPin, Sprout, 
  ChevronRight, ArrowLeft,
  Search, ShieldCheck, Activity,
  Mail, Calendar, ExternalLink,
  Cpu, Database, Zap, Clock,
  Globe, Fingerprint, Server, User,
  Terminal, BarChart3, Radio, AlertCircle
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
const COLORS = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  danger: 'var(--danger)',
  bg: 'var(--bg-main)',
  card: 'var(--bg-card)',
  border: 'var(--border-main)',
  text: 'var(--text-main)',
  textMuted: 'var(--text-muted)',
  accent: 'var(--text-main)'
};

const AdminDashboard = () => {
  const { getAllFarmers } = useApp();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 🛡️ NEW ERROR STATE
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, registered: 0, guest: 0, activeToday: 0 });

  useEffect(() => {
    // 🛰️ LIVE SATELLITE STREAM: Listen for database changes in real-time
    let isSubscribed = true;
    try {
      const q = query(collection(db, "farmers"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isSubscribed) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("🛰️ [ADMIN] Global Registry Sync:", data.length, "units online");
        
        setFarmers(data.length > 0 ? data : [
          {
            id: 'admin-01',
            name: 'Prolayjit Biswas',
            email: 'prolayjitbiswas14112004@gmail.com',
            location: 'MAKAUT Agri Zone',
            lastLogin: new Date().toISOString(),
            isGuest: false
          }
        ]);
        setError(null); 

        // Global Statistics Engine
        const listToCount = data.length > 0 ? data : [{ isGuest: false, lastLogin: new Date().toISOString() }];
        const today = new Date().toISOString().split('T')[0];
        setStats({
          total: listToCount.length,
          registered: listToCount.filter(f => !f.isGuest).length,
          guest: listToCount.filter(f => f.isGuest).length,
          activeToday: listToCount.filter(f => f.lastLogin && String(f.lastLogin).includes(today)).length
        });
        
        setLoading(false);
      }, async (err) => {
        if (!isSubscribed) return;
        console.warn("📡 FIREBASE STREAM NOTE (using local fallback registry):", err);
        // Fallback to local admin registry
        if (getAllFarmers) {
          const fallbackData = await getAllFarmers();
          setFarmers(fallbackData || []);
          const today = new Date().toISOString().split('T')[0];
          setStats({
            total: (fallbackData || []).length,
            registered: (fallbackData || []).filter(f => !f.isGuest).length,
            guest: (fallbackData || []).filter(f => f.isGuest).length,
            activeToday: (fallbackData || []).filter(f => f.lastLogin && String(f.lastLogin).includes(today)).length
          });
        }
        setError(null);
        setLoading(false);
      });

      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } catch (err) {
      if (getAllFarmers) {
        getAllFarmers().then(fallbackData => {
          if (isSubscribed) {
            setFarmers(fallbackData || []);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    }
  }, [getAllFarmers]);

  const filteredFarmers = farmers.filter(f => {
    const searchLow = search.toLowerCase();
    const nameMatch = (f.name || 'Unknown Farmer').toLowerCase().includes(searchLow);
    const emailMatch = (f.email || '').toLowerCase().includes(searchLow);
    return nameMatch || emailMatch;
  });

  return (
    <div style={{ 
      minHeight: '100dvh', background: COLORS.bg, color: COLORS.text,
      fontFamily: "'Outfit', sans-serif", padding: '24px'
    }}>
      
      {/* ── HEADER ── */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: `${COLORS.primary}15` }}>
              <ShieldCheck size={18} color={COLORS.primary} />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Root Administrator
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: COLORS.accent, margin: 0, letterSpacing: '-0.02em' }}>
            Command Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '2px' }}>Global Registry Management & Node Overview</p>
        </div>

        <div style={{ 
          background: 'var(--bg-card)', padding: '10px 16px', borderRadius: '16px',
          display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-main)'
        }}>
          <Server size={18} color={COLORS.primary} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Server Status</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>CLOUD ACTIVE</div>
          </div>
        </div>
      </div>

      {/* ── ERROR ALERT ── */}
      {error && (
        <div style={{ 
          background: 'var(--danger-soft)', border: '1px solid var(--border-main)',
          color: 'var(--danger)', padding: '16px', borderRadius: '16px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', fontWeight: 600
        }}>
          <AlertCircle size={18} />
          <span>Cloud Connection Error: {error}</span>
        </div>
      )}

      {/* ── GLOBAL STATS GRID ── */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', 
        marginBottom: '32px' 
      }}>
        <StatCard label="Total Registry" value={stats.total} icon={Users} color={COLORS.secondary} />
        <StatCard label="Live Syncs Today" value={stats.activeToday} icon={Zap} color={COLORS.primary} />
        <StatCard label="Registered Units" value={stats.registered} icon={Fingerprint} color="var(--primary)" />
        <StatCard label="Guest Sessions" value={stats.guest} icon={Radio} color={COLORS.textMuted} />
      </div>

      {/* ── REGISTRY SECTION ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px', padding: '0 4px'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: COLORS.accent }}>Deployment Registry</h2>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted }}>{filteredFarmers.length} Units Found</div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} color={COLORS.textMuted} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" placeholder="Search operational ID or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', height: '58px', background: 'var(--bg-card)', 
              border: '1px solid var(--glass-stroke)', borderRadius: '20px',
              paddingLeft: '52px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)',
              outline: 'none', boxShadow: 'var(--shadow-md)'
            }}
          />
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Database size={32} color={COLORS.primary} style={{ opacity: 0.3 }} />
                </motion.div>
                <p style={{ marginTop: '16px', fontSize: '0.85rem', fontWeight: 700, color: COLORS.textMuted }}>Synchronizing with Global Database...</p>
              </div>
            ) : filteredFarmers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-main)', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ color: COLORS.textMuted, fontSize: '0.9rem' }}>No operational records found.</p>
              </div>
            ) : (
              filteredFarmers.map((farmer, i) => (
                <FarmerRow key={farmer.id || farmer.email || `farmer-${i}`} farmer={farmer} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    style={{ 
      background: 'var(--bg-card)', padding: '20px', borderRadius: '24px',
      border: '1px solid var(--border-main)', boxShadow: 'var(--shadow-md)'
    }}
  >
    <div style={{ 
      width: '40px', height: '40px', borderRadius: '12px', background: `${color}10`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
    }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: COLORS.accent, lineHeight: 1 }}>{value || 0}</div>
    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>{label}</div>
  </motion.div>
);

const FarmerRow = ({ farmer, index }) => {
  const safeLocation = farmer.location || 'Unknown Location';
  const locationDisplay = safeLocation.includes('•') ? safeLocation.split('•')[1] : safeLocation;

  const getSafeTime = (time) => {
    if (!time) return '---';
    try {
      const d = new Date(time);
      if (isNaN(d.getTime())) return '---';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '---';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      style={{ 
        background: 'var(--bg-card)', borderRadius: '24px', padding: '16px 20px',
        border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)',
        marginBottom: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${COLORS.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.primary}20` }}>
            <User size={24} color={COLORS.primary} strokeWidth={2.5} />
          </div>
          <div style={{ 
            position: 'absolute', bottom: '-4px', right: '-4px',
            padding: '4px', borderRadius: '6px', background: farmer.isGuest ? 'var(--bg-main)' : 'var(--success-soft)',
            border: '2px solid var(--bg-card)'
          }}>
            {farmer.isGuest ? <Terminal size={10} color="var(--text-muted)" /> : <Globe size={10} color={COLORS.primary} />}
          </div>
        </div>

        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: COLORS.accent }}>{farmer.name || 'System Operator'}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {farmer.email?.toLowerCase() === 'prolayjitbiswas14112004@gmail.com' ? (
              <span style={{ 
                fontSize: '0.55rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px',
                background: 'var(--success-soft)', color: 'var(--primary)',
                textTransform: 'uppercase'
              }}>
                ADMINISTRATOR
              </span>
            ) : (
              <span style={{ 
                fontSize: '0.55rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px',
                background: farmer.isGuest ? 'var(--bg-main)' : 'var(--success-soft)', color: farmer.isGuest ? 'var(--text-muted)' : COLORS.primary,
                textTransform: 'uppercase'
              }}>
                {farmer.isGuest ? 'GUEST SESSION' : 'REGISTERED UNIT'}
              </span>
            )}
            <span style={{ fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: 600 }}>{farmer.email || 'No Email Recorded'}</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
          <Clock size={12} color={COLORS.textMuted} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.accent }}>
            {getSafeTime(farmer.lastLogin)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <MapPin size={10} color={COLORS.primary} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: COLORS.textMuted }}>{locationDisplay}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
