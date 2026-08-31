import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../state/AppContext';
import { 
  Lock, Mail, User, 
  ShieldCheck, ArrowRight, Eye, EyeOff, Fingerprint,
  AlertCircle, CheckCircle2, X, Sparkles, RefreshCw, Info
} from 'lucide-react';

// 🌐 OFFICIAL MULTI-COLOR GOOGLE 'G' SVG
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [existingGuestId, setExistingGuestId] = useState('');
  const [error, setError] = useState(null);
  
  const { login, guestLogin, register, googleLogin } = useApp();
  const navigate = useNavigate();

  // 🚀 PRIMARY ACTION: GOOGLE OAUTH FLOW
  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const res = await googleLogin();
      if (res === true || (res && res.success)) {
        navigate('/dashboard');
      } else {
        setError(res?.error || "Google authentication failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred during Google Sign-In.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 📧 SECONDARY ACTION: MANUAL EMAIL/PASSWORD FLOW
  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsManualLoading(true);
    try {
      if (isSignUp) {
        if (!fullName || !email || !password) {
          setIsManualLoading(false);
          return setError("Please fill in all required fields.");
        }
        const res = await register(fullName, email, password);
        if (res === true || (res && res.success)) {
          navigate('/dashboard');
        } else {
          setError(res?.error || "Failed to create account. Email may exist.");
        }
      } else {
        if (!email || !password) {
          setIsManualLoading(false);
          return setError("Please enter your email and password.");
        }
        const res = await login(email, password);
        if (res === true || (res && res.success)) {
          navigate('/dashboard');
        } else {
          setError(res?.error || "Invalid email or password.");
        }
      }
    } catch (err) {
      setError("An error occurred during authentication.");
    } finally {
      setIsManualLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100dvh', width: '100vw', 
      background: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #0f172a 100%)', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1.25rem', fontFamily: "'Outfit', sans-serif",
      position: 'relative', overflowY: 'auto', overflowX: 'hidden'
    }}>

      {/* Decorative Glow Background Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(66, 133, 244, 0.15) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto' }}>
        
        {/* 🍃 PREMIUM BRANDING HERO */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '10px' }}>
            <Sparkles size={14} color="#10B981" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34D399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI-Powered Smart Farming</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white', margin: 0, letterSpacing: '-0.04em', textShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            AgriSense <span style={{ color: '#10B981' }}>Pro</span>
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.85rem', margin: '6px 0 0', fontWeight: 500 }}>
            Industrial IoT & Precision Crop Intelligence
          </p>
        </motion.div>

        {/* 🃏 CRYSTAL GLASS AUTHENTICATION CARD */}
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          style={{ 
            width: '100%', background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)', borderRadius: '28px', padding: '2rem 1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', border: '1px solid rgba(255, 255, 255, 0.14)'
          }}
        >
          <AnimatePresence mode="wait">
            {!isGuestMode ? (
              <motion.div key="main-auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                
                {/* Header Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    {isSignUp ? 'Create Your Account' : 'Welcome to AgriSense'}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
                    Sign in with your Google identity to continue
                  </p>
                </div>

                {/* 🚨 ERROR BANNER */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.35)', 
                        color: '#FCA5A5', padding: '12px 14px', borderRadius: '16px', marginBottom: '1.25rem', 
                        fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '10px'
                      }}
                    >
                      <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <div style={{ flex: 1 }}>{error}</div>
                      <X size={16} color="#FCA5A5" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setError(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 🌟 1. PRIMARY: OFFICIAL "CONTINUE WITH GOOGLE" BUTTON */}
                <motion.button 
                  whileHover={{ scale: isGoogleLoading ? 1 : 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: isGoogleLoading ? 1 : 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isManualLoading}
                  style={{ 
                    width: '100%', height: '54px', borderRadius: '16px', 
                    background: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.9)', 
                    color: '#1F2937', fontWeight: 800, fontSize: '0.95rem', cursor: isGoogleLoading ? 'wait' : 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.25)', marginBottom: '1.5rem',
                    transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
                  }}
                >
                  {isGoogleLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <RefreshCw size={18} color="#4285F4" />
                      </motion.div>
                      <span style={{ color: '#4B5563', fontWeight: 700 }}>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon size={22} />
                      <span>Continue with Google</span>
                    </>
                  )}
                </motion.button>

                {/* ─── SLEEK OR DIVIDER ─── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Or use password
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
                </div>

                {/* 📧 SECONDARY: EMAIL / PASSWORD ACCORDION */}
                {!showEmailForm ? (
                  <motion.button 
                    whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEmailForm(true)}
                    style={{ 
                      width: '100%', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontWeight: 700, 
                      fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '10px', marginBottom: '1rem' 
                    }}
                  >
                    <Mail size={16} color="#10B981" />
                    <span>Sign in with Email & Password</span>
                  </motion.button>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleManualLogin}
                  >
                    {isSignUp && (
                      <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
                        <User size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
                          style={{ width: '100%', height: '48px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', paddingLeft: '48px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                    <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
                      <Mail size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', height: '48px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', paddingLeft: '48px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                      <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', height: '48px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', paddingLeft: '48px', paddingRight: '48px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      disabled={isManualLoading}
                      style={{ 
                        width: '100%', height: '50px', borderRadius: '15px', background: '#10B981', border: 'none', 
                        color: 'white', fontWeight: 900, fontSize: '0.95rem', cursor: isManualLoading ? 'wait' : 'pointer', 
                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      {isManualLoading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </motion.button>

                    <div style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: '1rem' }}>
                      <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#34D399', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                      </span>
                    </div>
                  </motion.form>
                )}

                {/* 👤 GUEST ACCESS BUTTON */}
                <motion.button 
                  whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setIsGuestMode(true)}
                  style={{ 
                    width: '100%', height: '44px', borderRadius: '14px', background: 'transparent', 
                    border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', fontWeight: 800, 
                    fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: '8px', letterSpacing: '0.06em'
                  }}
                >
                  <User size={13} /> CONTINUE AS GUEST
                </motion.button>

                {/* 📜 TERMS & PRIVACY FOOTER */}
                <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '1.5rem', lineHeight: '1.4' }}>
                  By signing in, you agree to our{' '}
                  <span onClick={() => setActiveModal('terms')} style={{ color: '#34D399', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span onClick={() => setActiveModal('privacy')} style={{ color: '#34D399', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>.
                </div>

              </motion.div>
            ) : (
              /* 👤 GUEST MODE VIEW */
              <motion.div key="guest-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white', textAlign: 'center' }}>
                  Field Guest Access
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: '1.75rem' }}>
                  Enter your name or operator code to access the field telemetry simulator.
                </p>
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  if (!guestName) return setError("Please enter your name."); 
                  let finalId = existingGuestId?.trim();
                  if (finalId && !finalId.includes('@')) {
                    if (!finalId.startsWith('guest-')) finalId = `guest-${finalId.padStart(4, '0')}`;
                    finalId = `${finalId}@agrisense.in`;
                  }
                  await guestLogin(guestName, finalId); 
                  navigate('/dashboard'); 
                }}>
                  <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <User size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" placeholder="Your Operator Name" value={guestName} onChange={e => setGuestName(e.target.value)} autoFocus
                      style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '15px', paddingLeft: '48px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                    <Fingerprint size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" placeholder="Station ID (Optional, e.g. 0005)" value={existingGuestId} onChange={e => setExistingGuestId(e.target.value)}
                      style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '15px', paddingLeft: '48px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    style={{ width: '100%', height: '54px', borderRadius: '16px', background: '#10B981', border: 'none', color: 'white', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 8px 18px rgba(16, 185, 129, 0.3)' }}
                  >
                    ENTER FIELD DASHBOARD
                  </motion.button>
                </form>

                <button 
                  onClick={() => setIsGuestMode(false)}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', padding: '12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}
                >
                  ← BACK TO GOOGLE SIGN-IN
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 🛡️ SECURITY FOOTER BADGE */}
      <div style={{ 
        position: 'relative', marginTop: '2rem', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.45 
      }}>
        <ShieldCheck size={14} color="#10B981" />
        <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          OAUTH 2.0 & GOOGLE IDENTITY VERIFIED
        </span>
      </div>

      {/* 📋 INFORMATIONAL TERMS / PRIVACY MODAL */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '24px', maxWidth: '440px', width: '100%', color: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#10B981' }}>
                  {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
                <X size={20} color="rgba(255,255,255,0.6)" style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                {activeModal === 'terms' ? (
                  <>
                    <p>AgriSense Pro operates in accordance with standard agricultural technology guidelines. By connecting with Google OAuth, you grant access only to your verified identity (name, email, and avatar) for session authentication.</p>
                    <p>Sensor telemetry, irrigation actuator commands, and field data are linked directly to your authenticated user identity.</p>
                  </>
                ) : (
                  <>
                    <p>We respect your privacy. AgriSense Pro does not sell or share your personal information or Google account credentials with third parties.</p>
                    <p>Google OAuth 2.0 tokens are handled securely through Firebase Authentication and standard browser sessions. No passwords are stored on our servers.</p>
                  </>
                )}
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                style={{ marginTop: '20px', width: '100%', height: '44px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                GOT IT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;
