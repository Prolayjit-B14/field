import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../state/AppContext';
import { 
  Lock, Mail, User, ArrowLeft, Eye, EyeOff, 
  Check, AlertCircle, RefreshCw, X, Shield, Sparkles, Send, CheckCircle2
} from 'lucide-react';

// ─── 🌐 OFFICIAL GOOGLE 'G' ICON ─────────────────────────────────────────────
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

// ─── 🌿 DUAL LEAF WATERMARK ACCENT (TOP-RIGHT OF CARDS) ──────────────────────
const LeafAccent = () => (
  <div style={{ position: 'absolute', top: '24px', right: '24px', pointerEvents: 'none', zIndex: 3 }}>
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M38.5 6.5C31.5 6 18.5 13 18.5 24C18.5 30 24 35 30 35C38 35 40 20 40 8C40 6.5 39.5 6.5 38.5 6.5Z" 
        fill="#9FE6BA" 
        fillOpacity="0.85"
      />
      <path 
        d="M26 18C20 18 10 24 10 32C10 37 14 40 18 40C24 40 28 29 28 19C28 18 27 18 26 18Z" 
        fill="#72DB99" 
        fillOpacity="0.75"
      />
      <path 
        d="M20 22C24 26 28 32 30 35" 
        stroke="#FFFFFF" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeOpacity="0.6" 
      />
      <path 
        d="M12 30C15 33 17 37 18 40" 
        stroke="#FFFFFF" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeOpacity="0.6" 
      />
    </svg>
  </div>
);

// ─── 🍃 AGRISENSE CIRCULAR BRAND BADGE ────────────────────────────────────────
const AgriSenseLogoBadge = () => (
  <div style={{
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: '#FFFFFF',
    border: '2px solid #16A34A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)',
    flexShrink: 0
  }}>
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central IoT stem / data line */}
      <path d="M14 22V10" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="14" cy="22" r="2.2" fill="#15803D" />
      
      {/* Left Leaf + Circuit branch */}
      <path d="M14 16C10.5 16 7.5 13.5 7 9.5C9.5 9.5 13 11 14 14" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#DCFCE7" />
      <circle cx="7.2" cy="9.5" r="1.5" fill="#15803D" />
      
      {/* Right Leaf + Circuit branch */}
      <path d="M14 16C17.5 16 20.5 13.5 21 9.5C18.5 9.5 15 11 14 14" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#DCFCE7" />
      <circle cx="20.8" cy="9.5" r="1.5" fill="#15803D" />

      {/* Top sensor antenna node */}
      <circle cx="14" cy="6.5" r="2" fill="#16A34A" />
      <path d="M14 8.5V6.5" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

// ─── 🌾 ILLUSTRATED AGRICULTURAL LANDSCAPE ───────────────────────────────────
const FarmLandscape = () => (
  <div style={{ width: '100%', position: 'relative', overflow: 'hidden', height: '150px', pointerEvents: 'none' }}>
    <svg 
      viewBox="0 0 420 150" 
      preserveAspectRatio="none" 
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#AEE0B6" />
          <stop offset="100%" stopColor="#90D39B" />
        </linearGradient>
        <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#43B367" />
          <stop offset="100%" stopColor="#319952" />
        </linearGradient>
        <linearGradient id="hillGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1C7A41" />
          <stop offset="100%" stopColor="#146032" />
        </linearGradient>
      </defs>

      {/* 🌫️ Distant soft green rolling hills */}
      <path 
        d="M-20 115 Q80 75 200 95 T440 90 L440 150 L-20 150 Z" 
        fill="url(#hillGrad1)" 
        opacity="0.85" 
      />

      {/* 🌬️ Wind Turbines */}
      {/* Turbine 1 (Left) */}
      <g transform="translate(285, 45)">
        <line x1="0" y1="0" x2="0" y2="48" stroke="#8CA395" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2.2" fill="#658071" />
        <g className="spin-turbine">
          <line x1="0" y1="0" x2="0" y2="-18" stroke="#7A9484" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="15.5" y2="9" stroke="#7A9484" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-15.5" y2="9" stroke="#7A9484" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>

      {/* Turbine 2 (Center-Right) */}
      <g transform="translate(340, 38)">
        <line x1="0" y1="0" x2="0" y2="55" stroke="#8CA395" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2.2" fill="#658071" />
        <g className="spin-turbine" style={{ animationDelay: '-2s' }}>
          <line x1="0" y1="0" x2="0" y2="-20" stroke="#7A9484" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="17.3" y2="10" stroke="#7A9484" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-17.3" y2="10" stroke="#7A9484" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>

      {/* Turbine 3 (Far Right) */}
      <g transform="translate(395, 48)">
        <line x1="0" y1="0" x2="0" y2="45" stroke="#8CA395" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2" fill="#658071" />
        <g className="spin-turbine" style={{ animationDelay: '-4s' }}>
          <line x1="0" y1="0" x2="0" y2="-16" stroke="#7A9484" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="0" y1="0" x2="13.8" y2="8" stroke="#7A9484" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-13.8" y2="8" stroke="#7A9484" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>

      {/* 🏡 Red Farm Barn */}
      <g transform="translate(378, 86)">
        {/* Main Barn Body */}
        <rect x="0" y="8" width="22" height="15" fill="#D32F2F" rx="1" />
        {/* White Barn Roof Gable */}
        <polygon points="11,0 -2,8 24,8" fill="#F8FAFC" />
        <polygon points="11,1 0,8 22,8" fill="#FFFFFF" />
        {/* White Trim Cross Door */}
        <rect x="7" y="13" width="8" height="10" fill="#FFFFFF" rx="0.5" />
        <rect x="8" y="14" width="6" height="9" fill="#B71C1C" />
        <line x1="8" y1="14" x2="14" y2="23" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="14" y1="14" x2="8" y2="23" stroke="#FFFFFF" strokeWidth="0.8" />
        {/* Small loft window */}
        <polygon points="11,4 8,7 14,7" fill="#FFFFFF" />
      </g>

      {/* 🌾 Mid-ground Meadow Hill */}
      <path 
        d="M-20 120 Q120 85 240 100 T440 98 L440 150 L-20 150 Z" 
        fill="url(#hillGrad2)" 
      />

      {/* 🚜 Agricultural Tractor / Smart Rover */}
      <g transform="translate(320, 94)">
        {/* Chassis */}
        <rect x="4" y="6" width="18" height="9" fill="#15803D" rx="2" />
        {/* Hood */}
        <rect x="15" y="8" width="9" height="7" fill="#16A34A" rx="1" />
        {/* Cabin */}
        <path d="M7 6 L9 1 L16 1 L16 6 Z" fill="#E0F2FE" stroke="#0F172A" strokeWidth="0.8" />
        {/* Exhaust Pipe */}
        <line x1="20" y1="8" x2="20" y2="2" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
        {/* Big Rear Wheel */}
        <circle cx="8" cy="14" r="5.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
        <circle cx="8" cy="14" r="2.5" fill="#FBBF24" />
        {/* Small Front Wheel */}
        <circle cx="21" cy="15" r="3.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
        <circle cx="21" cy="15" r="1.5" fill="#FBBF24" />
      </g>

      {/* 🌿 Foreground Rich Emerald Rolling Field Curve */}
      <path 
        d="M-20 132 Q140 100 280 112 T440 110 L440 150 L-20 150 Z" 
        fill="url(#hillGrad3)" 
      />
    </svg>

    <style>{`
      @keyframes spinTurbine {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .spin-turbine {
        transform-origin: 0px 0px;
        animation: spinTurbine 12s linear infinite;
      }
    `}</style>
  </div>
);

// ─── 📦 REUSABLE FORM INPUT ──────────────────────────────────────────────────
const AuthInput = ({ 
  icon: Icon, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  isPassword = false,
  showPassword = false,
  onTogglePassword,
  error,
  autoComplete
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ width: '100%', marginBottom: '14px', position: 'relative' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: `1.5px solid ${error ? '#EF4444' : isFocused ? '#15803D' : '#E2EBE5'}`,
        boxShadow: isFocused 
          ? '0 0 0 3.5px rgba(21, 128, 61, 0.12)' 
          : '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        height: '52px',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        {Icon && (
          <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Icon 
              size={19} 
              color={error ? '#EF4444' : isFocused ? '#15803D' : '#8CA396'} 
              strokeWidth={1.8} 
            />
          </div>
        )}

        <input 
          type={isPassword ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#122B1E',
            fontSize: '0.92rem',
            fontWeight: 500,
            fontFamily: "'Outfit', sans-serif",
            width: '100%',
            padding: 0
          }}
        />

        {isPassword && (
          <div 
            onClick={onTogglePassword} 
            style={{ 
              marginLeft: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              color: '#8CA396',
              userSelect: 'none',
              padding: '4px'
            }}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          color: '#DC2626',
          fontSize: '0.75rem',
          fontWeight: 600,
          marginTop: '4px',
          marginLeft: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// ─── 🚀 PRIMARY AUTHENTICATION COMPONENT ──────────────────────────────────────
const Login = () => {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot' | 'guest'
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Sign Up Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState(null);

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [stationId, setStationId] = useState('');

  // UI / Async Status
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

  const { login, register, googleLogin, guestLogin, resetPassword } = useApp();
  const navigate = useNavigate();

  // ─── 🛡️ CLIENT VALIDATION HELPERS ──────────────────────────────────────────
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!loginEmail.trim()) {
      newErrors.loginEmail = "Email is required";
    } else if (!validateEmail(loginEmail.trim())) {
      newErrors.loginEmail = "Please enter a valid email address";
    }

    if (!loginPassword) {
      newErrors.loginPassword = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (res === true || (res && res.success)) {
        navigate('/dashboard');
      } else {
        setErrors({ general: res?.error || "Invalid email or password. Please try again." });
      }
    } catch (err) {
      setErrors({ general: "An unexpected error occurred during login." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!firstName.trim()) newErrors.firstName = "First name required";
    if (!lastName.trim()) newErrors.lastName = "Last name required";

    if (!signupEmail.trim()) {
      newErrors.signupEmail = "Email is required";
    } else if (!validateEmail(signupEmail.trim())) {
      newErrors.signupEmail = "Please enter a valid email address";
    }

    if (!signupPassword) {
      newErrors.signupPassword = "Password is required";
    } else if (signupPassword.length < 6) {
      newErrors.signupPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password required";
    } else if (signupPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms and Privacy Policy";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await register(fullName, signupEmail.trim(), signupPassword);
      if (res === true || (res && res.success)) {
        navigate('/dashboard');
      } else {
        setErrors({ general: res?.error || "Registration failed. Email may already be in use." });
      }
    } catch (err) {
      setErrors({ general: "Failed to create account. Please check your details." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrors({});
    setIsLoading(true);
    try {
      const res = await googleLogin();
      if (res === true || (res && res.success)) {
        navigate('/dashboard');
      } else {
        setErrors({ general: res?.error || "Google authentication failed. Please try again." });
      }
    } catch (err) {
      setErrors({ general: "Google Sign-In was interrupted." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim() || !validateEmail(forgotEmail.trim())) {
      setErrors({ forgotEmail: "Please enter a valid email address" });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const res = await resetPassword(forgotEmail.trim());
      if (res.success) {
        setResetSuccessMsg(res.message || "Password reset link sent! Check your inbox.");
      } else {
        setErrors({ forgotEmail: res.error || "Could not send reset email." });
      }
    } catch (err) {
      setErrors({ forgotEmail: "Error sending password reset email." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!guestName.trim()) {
      setErrors({ guestName: "Please enter an operator name" });
      return;
    }

    let finalId = stationId.trim();
    if (finalId && !finalId.includes('@')) {
      if (!finalId.startsWith('guest-')) finalId = `guest-${finalId.padStart(4, '0')}`;
      finalId = `${finalId}@agrisense.in`;
    }

    await guestLogin(guestName.trim(), finalId);
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100vw',
      background: '#EAF5ED',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      boxSizing: 'border-box'
    }}>

      {/* 📱 MOBILE VIEWPORT CONTAINER */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box'
      }}>

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 1: WELCOME BACK / LOGIN (MATCHING REFERENCE 2)
          ══════════════════════════════════════════════════════════════════ */}
          {view === 'login' && (
            <motion.div
              key="login-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100dvh',
                position: 'relative',
                paddingBottom: '24px'
              }}
            >
              {/* 🍃 TOP BRANDING HEADER */}
              <div style={{
                paddingTop: '32px',
                paddingBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                {/* Logo + Title Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '6px'
                }}>
                  <AgriSenseLogoBadge />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '1.65rem',
                      fontWeight: 900,
                      color: '#122B1E',
                      letterSpacing: '-0.03em'
                    }}>
                      AgriSense
                    </span>
                    <span style={{
                      background: '#15803D',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2.5px 8px',
                      borderRadius: '8px',
                      letterSpacing: '0.02em',
                      lineHeight: 1
                    }}>
                      Pro
                    </span>
                  </div>
                </div>

                {/* Brand Tagline */}
                <p style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1E7E34',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Smart Agriculture, Better Future
                </p>
              </div>

              {/* 🌾 AGRICULTURAL LANDSCAPE ILLUSTRATION */}
              <FarmLandscape />

              {/* 🃏 OVERLAPPING WHITE LOGIN CARD */}
              <div style={{
                padding: '0 16px',
                marginTop: '-36px',
                position: 'relative',
                zIndex: 2,
                flex: 1
              }}>
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '34px',
                  padding: '28px 22px 24px',
                  boxShadow: '0 20px 40px -10px rgba(18, 50, 25, 0.08), 0 1px 3px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(22, 128, 61, 0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative Leaf Accent */}
                  <LeafAccent />

                  {/* Card Title & Subtitle */}
                  <div style={{ marginBottom: '22px', position: 'relative', zIndex: 4 }}>
                    <h2 style={{
                      fontSize: '1.45rem',
                      fontWeight: 900,
                      color: '#122B1E',
                      margin: '0 0 4px',
                      letterSpacing: '-0.03em'
                    }}>
                      Welcome Back!
                    </h2>
                    <p style={{
                      fontSize: '0.82rem',
                      color: '#6B7F75',
                      margin: 0,
                      fontWeight: 500
                    }}>
                      Login to continue to your account
                    </p>
                  </div>

                  {/* General Error Banner */}
                  {errors.general && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#B91C1C',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{errors.general}</span>
                    </motion.div>
                  )}

                  {/* 📧 EMAIL INPUT */}
                  <AuthInput 
                    icon={Mail}
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    error={errors.loginEmail}
                    autoComplete="email"
                  />

                  {/* 🔒 PASSWORD INPUT */}
                  <AuthInput 
                    icon={Lock}
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    isPassword={true}
                    showPassword={showLoginPassword}
                    onTogglePassword={() => setShowLoginPassword(!showLoginPassword)}
                    error={errors.loginPassword}
                    autoComplete="current-password"
                  />

                  {/* 🔑 FORGOT PASSWORD LINK */}
                  <div style={{ textAlign: 'right', marginTop: '-4px', marginBottom: '18px' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setResetSuccessMsg(null);
                        setForgotEmail(loginEmail);
                        setView('forgot');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#15803D',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* 🟢 PRIMARY LOGIN BUTTON */}
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLoginSubmit}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      height: '52px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      cursor: isLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 20px rgba(21, 128, 61, 0.28)',
                      marginBottom: '18px',
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: '0.01em'
                    }}
                  >
                    {isLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Logging in...</span>
                      </div>
                    ) : (
                      <span>Login</span>
                    )}
                  </motion.button>

                  {/* ─── HORIZONTAL DIVIDER ─── */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#E2EBE5' }} />
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: '#8CA396',
                      letterSpacing: '0.01em'
                    }}>
                      or continue with
                    </span>
                    <div style={{ flex: 1, height: '1px', background: '#E2EBE5' }} />
                  </div>

                  {/* 🌐 GOOGLE SIGN-IN BUTTON */}
                  <motion.button 
                    whileHover={{ scale: 1.01, background: '#F8FAF9' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      height: '52px',
                      borderRadius: '18px',
                      background: '#FFFFFF',
                      border: '1.5px solid #E2EBE5',
                      color: '#1F2937',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: isLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      marginBottom: '20px',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    <GoogleIcon size={20} />
                    <span>Continue with Google</span>
                  </motion.button>

                  {/* 🔁 SWITCH TO SIGN UP */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.84rem',
                    color: '#6B7F75',
                    fontWeight: 500
                  }}>
                    Don't have an account?{' '}
                    <span 
                      onClick={() => {
                        setErrors({});
                        setView('signup');
                      }}
                      style={{
                        color: '#15803D',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Sign Up
                    </span>
                  </div>

                  {/* 👤 QUICK DEMO / FIELD GUEST ACCESS LINK */}
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button 
                      type="button"
                      onClick={() => setView('guest')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8CA396',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        padding: '4px'
                      }}
                    >
                      Field Operator Simulator Access →
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 2: CREATE ACCOUNT / SIGN UP (MATCHING REFERENCE 1)
          ══════════════════════════════════════════════════════════════════ */}
          {view === 'signup' && (
            <motion.div
              key="signup-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100dvh',
                position: 'relative',
                padding: '20px 16px 28px',
                boxSizing: 'border-box'
              }}
            >
              {/* 🔙 TOP LEFT ROUNDED BACK BUTTON */}
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setErrors({});
                    setView('login');
                  }}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2EBE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    color: '#122B1E'
                  }}
                >
                  <ArrowLeft size={20} strokeWidth={2.2} />
                </motion.button>
              </div>

              {/* 🃏 MAIN CREATE ACCOUNT CARD */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '34px',
                padding: '28px 22px 24px',
                boxShadow: '0 20px 40px -10px rgba(18, 50, 25, 0.08), 0 1px 3px rgba(0,0,0,0.03)',
                border: '1px solid rgba(22, 128, 61, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative Leaf Accent */}
                <LeafAccent />

                {/* Card Title & Subtitle */}
                <div style={{ marginBottom: '20px', position: 'relative', zIndex: 4 }}>
                  <h2 style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    color: '#122B1E',
                    margin: '0 0 4px',
                    letterSpacing: '-0.03em'
                  }}>
                    Create Account
                  </h2>
                  <p style={{
                    fontSize: '0.82rem',
                    color: '#6B7F75',
                    margin: 0,
                    fontWeight: 500
                  }}>
                    Join AgriSense Pro and manage your smart farm
                  </p>
                </div>

                {/* General Error Banner */}
                {errors.general && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#B91C1C',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{errors.general}</span>
                  </motion.div>
                )}

                {/* 👤 ROW 1: FIRST NAME & LAST NAME */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <AuthInput 
                      icon={User}
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      error={errors.firstName}
                      autoComplete="given-name"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <AuthInput 
                      icon={User}
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      error={errors.lastName}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* 📧 ROW 2: EMAIL */}
                <AuthInput 
                  icon={Mail}
                  type="email"
                  placeholder="Enter your email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  error={errors.signupEmail}
                  autoComplete="email"
                />

                {/* 🔒 ROW 3: CREATE PASSWORD */}
                <AuthInput 
                  icon={Lock}
                  type="password"
                  placeholder="Create password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  isPassword={true}
                  showPassword={showSignupPassword}
                  onTogglePassword={() => setShowSignupPassword(!showSignupPassword)}
                  error={errors.signupPassword}
                  autoComplete="new-password"
                />

                {/* 🔒 ROW 4: CONFIRM PASSWORD */}
                <AuthInput 
                  icon={Lock}
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isPassword={true}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                {/* 📜 ROW 5: TERMS & PRIVACY POLICY CHECKBOX */}
                <div style={{ marginBottom: '18px' }}>
                  <div 
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {/* Rounded Green Custom Checkbox */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      background: agreeTerms ? '#15803D' : '#FFFFFF',
                      border: `1.5px solid ${agreeTerms ? '#15803D' : '#94A3B8'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}>
                      {agreeTerms && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#4A5B52', lineHeight: '1.4' }}>
                      I agree to the{' '}
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModal('terms');
                        }}
                        style={{ color: '#15803D', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Terms of Service
                      </span>
                      {' '}and{' '}
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModal('privacy');
                        }}
                        style={{ color: '#15803D', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Privacy Policy
                      </span>
                    </div>
                  </div>

                  {errors.agreeTerms && (
                    <div style={{
                      color: '#DC2626',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      marginTop: '4px',
                      marginLeft: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      <span>{errors.agreeTerms}</span>
                    </div>
                  )}
                </div>

                {/* 🟢 PRIMARY SIGN UP BUTTON */}
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignUpSubmit}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    cursor: isLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 20px rgba(21, 128, 61, 0.28)',
                    marginBottom: '18px',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span>Sign Up</span>
                  )}
                </motion.button>

                {/* ─── HORIZONTAL DIVIDER ─── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '18px'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#E2EBE5' }} />
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: '#8CA396',
                    letterSpacing: '0.01em'
                  }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#E2EBE5' }} />
                </div>

                {/* 🌐 GOOGLE SIGN-UP BUTTON */}
                <motion.button 
                  whileHover={{ scale: 1.01, background: '#F8FAF9' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '18px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2EBE5',
                    color: '#1F2937',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: isLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    marginBottom: '20px',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  <GoogleIcon size={20} />
                  <span>Continue with Google</span>
                </motion.button>

                {/* 🔁 SWITCH TO LOGIN */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.84rem',
                  color: '#6B7F75',
                  fontWeight: 500
                }}>
                  Already have an account?{' '}
                  <span 
                    onClick={() => {
                      setErrors({});
                      setView('login');
                    }}
                    style={{
                      color: '#15803D',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Login
                  </span>
                </div>

              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 3: FORGOT PASSWORD MODAL / VIEW
          ══════════════════════════════════════════════════════════════════ */}
          {view === 'forgot' && (
            <motion.div
              key="forgot-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100dvh',
                padding: '24px 16px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('login')}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2EBE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    color: '#122B1E'
                  }}
                >
                  <ArrowLeft size={20} strokeWidth={2.2} />
                </motion.button>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '34px',
                padding: '30px 24px',
                boxShadow: '0 20px 40px -10px rgba(18, 50, 25, 0.08)',
                border: '1px solid rgba(22, 128, 61, 0.08)',
                textAlign: 'center'
              }}>
                {/* ✉️ GREEN ENVELOPE WITH LOCK (MATCHING PANEL 7) */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '22px',
                  background: '#F0FDF4',
                  border: '1.5px solid #DCFCE7',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.15)'
                }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    <rect width="6" height="5" x="9" y="11" rx="1" fill="#15803D" stroke="#FFFFFF" strokeWidth="1.5"/>
                  </svg>
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#122B1E', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  Forgot Password?
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#6B7F75', margin: '0 0 22px', lineHeight: 1.4, fontWeight: 500 }}>
                  Enter your email and we'll send you a password reset link.
                </p>

                {resetSuccessMsg ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: '#DCFCE7',
                      border: '1px solid #86EFAC',
                      borderRadius: '16px',
                      padding: '16px',
                      color: '#15803D',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>Check Your Email</div>
                    <p style={{ fontSize: '0.75rem', margin: '4px 0 0', opacity: 0.85 }}>{resetSuccessMsg}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleForgotSubmit}>
                    <AuthInput 
                      icon={Mail}
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      error={errors.forgotEmail}
                    />

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        height: '52px',
                        borderRadius: '18px',
                        background: '#15803D',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        cursor: isLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 18px rgba(21, 128, 61, 0.25)',
                        marginTop: '8px',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                    >
                      {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <><span>Send Recovery Link</span><Send size={16} /></>}
                    </motion.button>
                  </form>
                )}

                <button 
                  onClick={() => setView('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#15803D',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 4: FIELD OPERATOR SIMULATOR ACCESS (GUEST)
          ══════════════════════════════════════════════════════════════════ */}
          {view === 'guest' && (
            <motion.div
              key="guest-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100dvh',
                padding: '24px 16px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <button 
                  onClick={() => setView('login')}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2EBE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#122B1E'
                  }}
                >
                  <ArrowLeft size={20} strokeWidth={2.2} />
                </button>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '34px',
                padding: '30px 24px',
                boxShadow: '0 20px 40px -10px rgba(18, 50, 25, 0.08)',
                border: '1px solid rgba(22, 128, 61, 0.08)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '20px',
                  background: '#DCFCE7',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Sparkles size={26} strokeWidth={2.2} />
                </div>

                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#122B1E', margin: '0 0 6px', textAlign: 'center' }}>
                  Field Guest Simulator
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#6B7F75', margin: '0 0 20px', textAlign: 'center', lineHeight: 1.4 }}>
                  Instant access for field technicians and hardware testing stations.
                </p>

                <form onSubmit={handleGuestSubmit}>
                  <AuthInput 
                    icon={User}
                    placeholder="Your Operator Name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    error={errors.guestName}
                  />

                  <AuthInput 
                    icon={Shield}
                    placeholder="Station ID (Optional, e.g. 0005)"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                  />

                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    style={{
                      width: '100%',
                      height: '52px',
                      borderRadius: '18px',
                      background: '#15803D',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 18px rgba(21, 128, 61, 0.25)',
                      marginTop: '8px'
                    }}
                  >
                    ENTER FIELD DASHBOARD
                  </motion.button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button 
                    onClick={() => setView('login')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6B7F75',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Standard Sign-In
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 📋 INFORMATIONAL TERMS OF SERVICE & PRIVACY POLICY MODAL */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 30, 20, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px'
            }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.92, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: '28px',
                padding: '24px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AgriSenseLogoBadge />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#122B1E' }}>
                    {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#F1F5F3',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#4A5B52'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{
                fontSize: '0.82rem',
                color: '#4A5B52',
                lineHeight: '1.6',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}>
                {activeModal === 'terms' ? (
                  <>
                    <p><strong>1. Acceptance:</strong> By registering with AgriSense Pro, you gain access to precision agricultural telemetry, automated irrigation actuators, and soil health intelligence.</p>
                    <p><strong>2. Telemetry Rights:</strong> Field telemetry from your micro-climate sensors, NPK probes, and visual camera nodes belongs securely to your organization.</p>
                    <p><strong>3. Actuator Safety:</strong> Automated irrigation commands should be supervised in accordance with local agricultural safety practices.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1. Data Privacy:</strong> AgriSense Pro does not share your farm sensor coordinates, crop yield data, or Google credentials with third parties.</p>
                    <p><strong>2. Secure Auth:</strong> Authentication is handled with Firebase 256-bit encryption. We store only your verified profile name and email.</p>
                    <p><strong>3. Storage:</strong> Field images captured by the visual monitor are stored securely in your private cloud bucket.</p>
                  </>
                )}
              </div>

              <button 
                onClick={() => setActiveModal(null)}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  height: '46px',
                  background: '#15803D',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;
