import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Camera, Image as ImageIcon, Zap, CheckCircle2, AlertTriangle,
  AlertCircle, Leaf, Bug, ChevronRight, RefreshCw, X, MessageSquare,
  Check, Info, Shield, ArrowRight, Sparkles, Scissors, HelpCircle,
  Maximize2, Eye, Compass, CornerDownRight, Cpu
} from 'lucide-react';

import { PlantVisionEngine } from '@mobile/vision/PlantVisionEngine';
import { formatVisionResult } from '@mobile/results/ResultFormatter';
import { DeveloperDiagnostics } from '@mobile/results/DeveloperDiagnostics';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#15803D',       // Deep green for primary action
  primaryLight: '#16A34A',  // Action green
  primarySoft: '#DCFCE7',   // Soft green for healthy badges & highlights
  healthyText: '#15803D',   // Crisp green text
  danger: '#EF4444',        // Red for detected pests / problems
  dangerSoft: '#FEE2E2',    // Light red
  warning: '#F59E0B',       // Amber for damage / discoloration
  warningSoft: '#FEF3C7',   // Light amber
  neutral: '#64748B',       // Gray for uncertain / unknown state
  neutralSoft: '#F1F5F9',   // Light gray
  bgMain: 'var(--bg-main, #F8FAFC)',
  bgCard: 'var(--bg-card, #FFFFFF)',
  textMain: 'var(--text-main, #0F172A)',
  textMuted: 'var(--text-muted, #64748B)',
  border: 'var(--border-main, #E2E8F0)'
};

// ─── GUIDED CAPTURE MODES ─────────────────────────────────────────────────────
const ANALYSIS_MODES = [
  {
    id: 'health',
    label: 'Plant Health',
    icon: Leaf,
    instruction: 'Capture the whole leaf',
    subGuide: 'Ensure the entire leaf blade and stem are clearly visible'
  },
  {
    id: 'pest',
    label: 'Pest Check',
    icon: Bug,
    instruction: 'Move closer and capture the affected area',
    subGuide: 'Focus closely on clusters, webs, or insect activity'
  },
  {
    id: 'damage',
    label: 'Damage Check',
    icon: Scissors,
    instruction: 'Capture the damaged portion clearly',
    subGuide: 'Frame tears, holes, and fractured stems inside the guide'
  }
];

const INITIAL_RECENT_SCANS = [
  {
    id: 'scan-1',
    plant: 'Rice Leaf',
    time: 'Today, 10:42 AM',
    result: 'Healthy',
    confidence: '94%',
    type: 'healthy'
  },
  {
    id: 'scan-2',
    plant: 'Tomato Leaf',
    time: 'Today, 08:15 AM',
    result: 'Pest Detected',
    confidence: '93%',
    type: 'pest'
  },
  {
    id: 'scan-3',
    plant: 'Rice Leaf',
    time: 'Yesterday, 04:30 PM',
    result: 'Damage',
    confidence: '92%',
    type: 'damage'
  }
];

const AIVision = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Multi-Stage Vision Engine
  const visionEngine = useMemo(() => new PlantVisionEngine(), []);

  // Active Guided Capture Mode ('health' | 'pest' | 'damage')
  const [activeMode, setActiveMode] = useState(() => {
    if (initialMode === 'pest' || location?.pathname === '/pest-analysis') return 'pest';
    return 'health';
  });

  // Screen state: 'preview' | 'analyzing' | 'result' | 'rejected'
  const [screenState, setScreenState] = useState('preview');

  // Camera & Device State
  const [cameraPermission, setCameraPermission] = useState('initial'); // 'initial' | 'prompt' | 'granted' | 'denied'
  const [cameraStream, setCameraStream] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Analysis Lifecycle & Results
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [rawVisionResult, setRawVisionResult] = useState(null);
  const [formattedResult, setFormattedResult] = useState(null);
  const [recentScans, setRecentScans] = useState(INITIAL_RECENT_SCANS);

  // Modals & Panels
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [showFullAnalysisModal, setShowFullAnalysisModal] = useState(false);
  const [showDevDiagnostics, setShowDevDiagnostics] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentModeInfo = ANALYSIS_MODES.find(m => m.id === activeMode) || ANALYSIS_MODES[0];

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Attach camera stream to video tag
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => console.log('Video playback notice:', err));
    }
  }, [cameraStream, screenState]);

  // Native camera permission trigger
  const requestNativeCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraPermission('denied');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setCameraPermission('granted');
    } catch (err) {
      console.warn('Native camera permission blocked or unavailable:', err);
      setCameraPermission('denied');
    }
  };

  // User taps the dominant Capture button
  const handleCaptureClick = () => {
    if (cameraPermission === 'initial') {
      setCameraPermission('prompt');
      return;
    }

    if (cameraPermission === 'prompt') {
      requestNativeCamera();
      return;
    }

    if (cameraPermission === 'denied') {
      return;
    }

    snapPhoto();
  };

  // Capture snapshot from active video stream
  const snapPhoto = () => {
    let photoCanvas = document.createElement('canvas');

    if (cameraStream && videoRef.current) {
      try {
        photoCanvas.width = videoRef.current.videoWidth || 640;
        photoCanvas.height = videoRef.current.videoHeight || 480;
        const ctx = photoCanvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, photoCanvas.width, photoCanvas.height);
        const dataUrl = photoCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      } catch (err) {
        console.warn('Canvas snapshot notice:', err);
      }
    } else {
      // Simulate snapshot canvas
      photoCanvas.width = 400;
      photoCanvas.height = 300;
      const ctx = photoCanvas.getContext('2d');
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, 400, 300);
      setCapturedImage('leaf_snap_preview');
    }

    executePipeline(photoCanvas);
  };

  // Gallery photo selection
  const handleGalleryUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          setCapturedImage(event.target.result);
          executePipeline(canvas);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── EXECUTE PRODUCTION MULTI-STAGE PIPELINE ───
  const executePipeline = async (canvasElement) => {
    setScreenState('analyzing');
    setAnalysisProgress(10);

    // Stop stream during processing
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    // Progress animation
    const progressTimer = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 15;
      });
    }, 120);

    // Run Engine
    const result = await visionEngine.processImage(canvasElement, activeMode);
    clearInterval(progressTimer);
    setAnalysisProgress(100);

    setTimeout(() => {
      setRawVisionResult(result);
      const formatted = formatVisionResult(result);
      setFormattedResult(formatted);

      if (result.status === 'rejected') {
        setScreenState('rejected');
      } else {
        setScreenState('result');
        // Add to history
        const newScan = {
          id: `scan-${Date.now()}`,
          plant: activeMode === 'pest' ? 'Tomato Leaf' : 'Rice Leaf',
          time: 'Just now',
          result: formatted.statusBadge,
          confidence: formatted.confidence.split(' ')[0],
          type: formatted.status.includes('HEALTHY') ? 'healthy' : (formatted.status.includes('PEST') ? 'pest' : 'damage')
        };
        setRecentScans(prev => [newScan, ...prev.slice(0, 4)]);
      }
    }, 200);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScreenState('preview');
    if (cameraPermission === 'granted') {
      requestNativeCamera();
    }
  };

  const toggleFlash = async () => {
    setFlashActive(prev => !prev);
    if (cameraStream) {
      const track = cameraStream.getVideoTracks()[0];
      if (track?.applyConstraints) {
        try {
          await track.applyConstraints({ advanced: [{ torch: !flashActive }] });
        } catch (e) {}
      }
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      background: COLORS.bgMain,
      minHeight: '100vh',
      fontFamily: "'Outfit', sans-serif",
      color: COLORS.textMain,
      boxSizing: 'border-box'
    }}>

      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleGalleryUpload}
      />

      {/* ─── 1. MINIMAL HEADER ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0 2px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.45rem',
            fontWeight: 850,
            color: COLORS.textMain,
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            AI Plant Vision
          </h1>
          <p style={{
            margin: '2px 0 0',
            fontSize: '0.85rem',
            color: COLORS.textMuted,
            fontWeight: 500
          }}>
            Camera-based plant health analysis
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Small Minimal Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: COLORS.primarySoft,
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(21, 128, 61, 0.2)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: COLORS.primaryLight
            }} />
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: COLORS.healthyText,
              letterSpacing: '0.02em'
            }}>
              AI Ready
            </span>
          </div>

          {/* Discreet Developer Diagnostics Button */}
          <button
            onClick={() => setShowDevDiagnostics(true)}
            title="Developer Diagnostics"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bgCard,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.textMuted,
              cursor: 'pointer'
            }}
          >
            <Cpu size={15} />
          </button>
        </div>
      </div>

      {/* ─── 2. CAMERA PREVIEW STATE ─── */}
      {screenState === 'preview' && (
        <>
          {/* Mode Selector Chips */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: COLORS.bgCard,
            padding: '5px',
            borderRadius: '16px',
            border: `1px solid ${COLORS.border}`
          }}>
            {ANALYSIS_MODES.map(mode => {
              const active = activeMode === mode.id;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 4px',
                    borderRadius: '12px',
                    border: 'none',
                    background: active ? COLORS.primarySoft : 'transparent',
                    color: active ? COLORS.healthyText : COLORS.textMuted,
                    fontSize: '0.8rem',
                    fontWeight: active ? 850 : 650,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={15} color={active ? COLORS.primary : COLORS.textMuted} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Camera Viewport */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>

            {cameraStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(175deg, #166534 0%, #14532D 60%, #052E16 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="220" height="260" viewBox="0 0 200 240" fill="none" style={{ opacity: 0.85 }}>
                  <path
                    d="M100 20C50 65 35 150 100 220C165 150 150 65 100 20Z"
                    fill="#15803D"
                    stroke="#22C55E"
                    strokeWidth="2"
                  />
                  <path d="M100 30V210" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M100 80Q75 65 60 70M100 115Q70 100 55 110M100 150Q75 135 65 145" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  <path d="M100 80Q125 65 140 70M100 115Q130 100 145 110M100 150Q125 135 135 145" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                </svg>
              </div>
            )}

            {/* Top Status */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              padding: '5px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                CAMERA READY
              </span>
            </div>

            {/* Subtle Framing Guide */}
            <div style={{
              position: 'absolute',
              width: activeMode === 'pest' ? '180px' : '220px',
              height: activeMode === 'pest' ? '180px' : '250px',
              borderRadius: '20px',
              border: '2px dashed rgba(255, 255, 255, 0.65)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '18px', height: '18px', borderTop: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF', borderTopLeftRadius: '6px' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', borderTop: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF', borderTopRightRadius: '6px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '18px', height: '18px', borderBottom: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF', borderBottomLeftRadius: '6px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', borderBottom: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF', borderBottomRightRadius: '6px' }} />
            </div>

            {/* Guided Instruction in Preview */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 650,
              color: '#FFFFFF',
              textAlign: 'center',
              maxWidth: '85%'
            }}>
              {currentModeInfo.instruction}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.76rem',
            color: COLORS.textMuted,
            textAlign: 'center',
            padding: '0 8px'
          }}>
            <Info size={14} color={COLORS.primary} />
            <span>Keep leaf centered in good daylight • Move closer for pest inspection</span>
          </div>

          {/* Controls Below Camera */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 24px'
          }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: COLORS.textMain,
                padding: '8px'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                <ImageIcon size={20} color={COLORS.textMain} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS.textMuted }}>
                Gallery
              </span>
            </button>

            <button
              onClick={handleCaptureClick}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: COLORS.primary,
                border: '4px solid #FFFFFF',
                boxShadow: '0 4px 16px rgba(21, 128, 61, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.6)',
                background: COLORS.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Camera size={26} color="#FFFFFF" strokeWidth={2.2} />
              </div>
            </button>

            <button
              onClick={toggleFlash}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: COLORS.textMain,
                padding: '8px'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: flashActive ? COLORS.warningSoft : COLORS.bgCard,
                border: `1px solid ${flashActive ? COLORS.warning : COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                <Zap size={20} color={flashActive ? COLORS.warning : COLORS.textMain} fill={flashActive ? COLORS.warning : 'none'} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: flashActive ? COLORS.warning : COLORS.textMuted }}>
                Flash
              </span>
            </button>
          </div>
        </>
      )}

      {/* ─── 3. PERMISSION MODAL ─── */}
      <AnimatePresence>
        {cameraPermission === 'prompt' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              style={{
                width: '100%',
                maxWidth: '400px',
                background: COLORS.bgCard,
                borderRadius: '24px',
                padding: '26px 22px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: COLORS.primarySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Camera size={28} color={COLORS.primary} />
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 850, color: COLORS.textMain }}>
                Camera access needed
              </h3>
              <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: COLORS.textMain, fontWeight: 500, lineHeight: 1.4 }}>
                Use your phone camera to photograph plants and leaves for AI health analysis.
              </p>
              <p style={{ margin: '0 0 22px', fontSize: '0.78rem', color: COLORS.textMuted, lineHeight: 1.4 }}>
                Camera is used only when you capture a plant image.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={requestNativeCamera}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: COLORS.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  Allow Camera
                </button>

                <button
                  onClick={() => {
                    setCameraPermission('initial');
                    fileInputRef.current?.click();
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'transparent',
                    color: COLORS.textMuted,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '0.9rem',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  Use Gallery Instead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PERMISSION DENIED BANNER ─── */}
      {cameraPermission === 'denied' && (
        <div style={{
          background: COLORS.bgCard,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: COLORS.warningSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Shield size={22} color={COLORS.warning} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: COLORS.textMain, marginBottom: '6px' }}>
            Camera access is off
          </div>
          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '18px', lineHeight: 1.4 }}>
            Enable camera permission to analyze plants using your camera.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={requestNativeCamera}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: COLORS.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              Open Settings
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: COLORS.bgCard,
                color: COLORS.textMain,
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Use Gallery
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. IMAGE ANALYSIS STATE ─── */}
      {screenState === 'analyzing' && (
        <div style={{
          background: COLORS.bgCard,
          borderRadius: '24px',
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: '#0F172A',
            overflow: 'hidden'
          }}>
            {capturedImage && capturedImage !== 'leaf_snap_preview' ? (
              <img
                src={capturedImage}
                alt="Captured leaf"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #166534 0%, #14532D 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Leaf size={72} color="#4ADE80" opacity={0.8} />
              </div>
            )}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              color: '#FFFFFF'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase' }}>
                Multi-Stage Vision Pipeline
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 850 }}>
                Analyzing Plant…
              </div>
            </div>
          </div>

          <div style={{ padding: '22px 20px' }}>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: '#F1F5F9',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <motion.div
                style={{
                  height: '100%',
                  background: COLORS.primary,
                  width: `${analysisProgress}%`
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Leaf color', thresh: 20 },
                { label: 'Leaf structure', thresh: 40 },
                { label: 'Visible damage', thresh: 60 },
                { label: 'Pest signs', thresh: 80 },
                { label: 'Disease signs', thresh: 100 }
              ].map((item, idx) => {
                const isPassed = analysisProgress >= item.thresh;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 650,
                      color: isPassed ? COLORS.textMain : COLORS.textMuted
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: isPassed ? COLORS.primarySoft : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isPassed ? (
                        <Check size={14} color={COLORS.primary} strokeWidth={3} />
                      ) : (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }} />
                      )}
                    </div>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── STAGE 1 REJECTION STATE (NON-PLANT / DARK / BLURRED) ─── */}
      {screenState === 'rejected' && formattedResult && (
        <div style={{
          background: COLORS.bgCard,
          borderRadius: '24px',
          border: `1px solid ${COLORS.border}`,
          padding: '24px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: COLORS.warningSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertTriangle size={28} color={COLORS.warning} />
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 850 }}>
            {formattedResult.title}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: COLORS.textMuted, lineHeight: 1.4 }}>
            {formattedResult.recommendation?.message || formattedResult.summary}
          </p>

          <div style={{
            background: COLORS.bgMain,
            borderRadius: '16px',
            padding: '14px',
            fontSize: '0.82rem',
            color: COLORS.textMain,
            lineHeight: 1.45,
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <b>Camera Tips for Best Results:</b>
            <ul style={{ margin: '6px 0 0', paddingLeft: '20px', color: COLORS.textMuted }}>
              <li>Avoid human faces, soil-only, animals, or distant objects</li>
              <li>Position a single crop leaf filling at least 50% of the viewfinder</li>
              <li>Hold the phone steady in good daylight to prevent blur</li>
            </ul>
          </div>

          <button
            onClick={handleRetake}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              background: COLORS.primary,
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {formattedResult.recommendation?.actionPrompt || 'Retake Photo'}
          </button>
        </div>
      )}

      {/* ─── 5. AI RESULT STATE ─── */}
      {screenState === 'result' && formattedResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{
            background: COLORS.bgCard,
            borderRadius: '24px',
            border: `1px solid ${COLORS.border}`,
            padding: '22px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: formattedResult.themeColor
                }}>
                  {formattedResult.title}
                </h2>
                <span style={{ fontSize: '0.85rem', fontWeight: 650, color: COLORS.textMuted }}>
                  {formattedResult.confidence}
                </span>
              </div>

              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: formattedResult.themeSoftBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {formattedResult.status.includes('HEALTHY') ? (
                  <CheckCircle2 size={24} color={COLORS.primary} />
                ) : formattedResult.status.includes('PEST') ? (
                  <Bug size={24} color={COLORS.danger} />
                ) : formattedResult.isUncertain ? (
                  <HelpCircle size={24} color={COLORS.neutral} />
                ) : (
                  <Scissors size={24} color={COLORS.warning} />
                )}
              </div>
            </div>

            {/* Health Indicators Breakdown */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px 16px',
              background: COLORS.bgMain,
              borderRadius: '18px',
              marginBottom: '18px'
            }}>
              {formattedResult.indicators.map((ind, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.88rem'
                  }}
                >
                  <span style={{ color: COLORS.textMuted, fontWeight: 600 }}>{ind.label}</span>
                  <span style={{
                    fontWeight: 800,
                    color: ind.status === 'healthy' ? COLORS.healthyText : (ind.status === 'danger' ? COLORS.danger : (ind.status === 'warning' ? COLORS.warning : COLORS.neutral))
                  }}>
                    {ind.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Concrete Evidence Points */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                Visual Evidence
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {formattedResult.evidence.map((ev, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: COLORS.textMain, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: formattedResult.themeColor, marginTop: '2px' }}>•</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── 6. AI RECOMMENDATION CARD ─── */}
            <div style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: '16px'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                Recommendation
              </div>
              <p style={{
                margin: '0 0 16px',
                fontSize: '0.88rem',
                color: COLORS.textMain,
                fontWeight: 600,
                lineHeight: 1.45
              }}>
                {formattedResult.recommendation.message}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setShowFullAnalysisModal(true)}
                  style={{
                    padding: '11px 12px',
                    borderRadius: '12px',
                    background: COLORS.bgMain,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '0.82rem',
                    fontWeight: 750,
                    color: COLORS.textMain,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} />
                  View Full Analysis
                </button>

                {formattedResult.recommendation.actionPrompt === 'View Guidance' ? (
                  <button
                    onClick={() => setShowGuidanceModal(true)}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '12px',
                      background: COLORS.dangerSoft,
                      border: `1px solid rgba(239, 68, 68, 0.25)`,
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: COLORS.danger,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Bug size={14} />
                    View Guidance
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/crop-advisor')}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '12px',
                      background: COLORS.primarySoft,
                      border: `1px solid rgba(21, 128, 61, 0.2)`,
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: COLORS.healthyText,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageSquare size={14} />
                    Ask AgriBot
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── 7. ACTIONS AFTER ANALYSIS ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleRetake}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '16px',
                background: COLORS.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)'
              }}
            >
              <Camera size={18} />
              {formattedResult.isUncertain ? 'Capture Better Image' : 'Scan Another Plant'}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '16px',
                background: COLORS.bgCard,
                color: COLORS.textMain,
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ImageIcon size={18} color={COLORS.textMuted} />
              Choose From Gallery
            </button>
          </div>
        </div>
      )}

      {/* ─── 8. RECENT SCANS ─── */}
      <div style={{
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '0.92rem',
          fontWeight: 850,
          color: COLORS.textMain,
          letterSpacing: '-0.01em'
        }}>
          Recent Scans
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {recentScans.map(scan => {
            const isHealthy = scan.type === 'healthy';
            const isPest = scan.type === 'pest';

            return (
              <div
                key={scan.id}
                onClick={handleRetake}
                style={{
                  background: COLORS.bgCard,
                  borderRadius: '16px',
                  border: `1px solid ${COLORS.border}`,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: isHealthy ? COLORS.primarySoft : (isPest ? COLORS.dangerSoft : COLORS.warningSoft),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isHealthy ? (
                      <Leaf size={20} color={COLORS.primary} />
                    ) : isPest ? (
                      <Bug size={20} color={COLORS.danger} />
                    ) : (
                      <Scissors size={20} color={COLORS.warning} />
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: COLORS.textMain }}>
                      {scan.plant}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: COLORS.textMuted, fontWeight: 500 }}>
                      {scan.time}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 850,
                      color: isHealthy ? COLORS.healthyText : (isPest ? COLORS.danger : COLORS.warning)
                    }}>
                      {scan.result}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 650, color: COLORS.textMuted }}>
                      {scan.confidence}
                    </div>
                  </div>
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MODAL: CROP-CARE GUIDANCE ─── */}
      <AnimatePresence>
        {showGuidanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
            onClick={() => setShowGuidanceModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: COLORS.bgCard,
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bug size={20} color={COLORS.danger} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 850 }}>Crop-Care Guidance</h3>
                </div>
                <button
                  onClick={() => setShowGuidanceModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} color={COLORS.textMuted} />
                </button>
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '16px',
                background: COLORS.bgMain,
                border: `1px solid ${COLORS.border}`,
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 650, color: COLORS.textMain, lineHeight: 1.5 }}>
                  Aphid clusters identified along lower leaf veins. Wash foliage with diluted organic neem oil solution (5ml/L). Inspect surrounding rows within 48 hours.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: COLORS.textMuted, textTransform: 'uppercase' }}>
                  Recommended Action Steps
                </div>
                {[
                  'Isolate heavily impacted leaves to prevent dispersion to neighboring rows',
                  'Apply organic cold-pressed neem oil spray in late afternoon to avoid leaf scorch',
                  'Re-scan in 48 hours to confirm pest colony suppression'
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: COLORS.primarySoft, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 850, flexShrink: 0, marginTop: '2px' }}>
                      {idx + 1}
                    </div>
                    <span style={{ color: COLORS.textMain, fontWeight: 550, lineHeight: 1.4 }}>{step}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowGuidanceModal(false)}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '13px',
                  borderRadius: '14px',
                  background: COLORS.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: FULL ANALYSIS DETAIL ─── */}
      <AnimatePresence>
        {showFullAnalysisModal && rawVisionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
            onClick={() => setShowFullAnalysisModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: COLORS.bgCard,
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color={COLORS.primary} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 850 }}>Structured Computer Vision Data</h3>
                </div>
                <button
                  onClick={() => setShowFullAnalysisModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} color={COLORS.textMuted} />
                </button>
              </div>

              <div style={{
                background: '#0F172A',
                borderRadius: '16px',
                padding: '16px',
                color: '#E2E8F0',
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '20px'
              }}>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(rawVisionResult, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => setShowFullAnalysisModal(false)}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  background: COLORS.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Close Full Data
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DEVELOPER DIAGNOSTICS DRAWER ─── */}
      <DeveloperDiagnostics
        isOpen={showDevDiagnostics}
        onClose={() => setShowDevDiagnostics(false)}
        diagnostics={formattedResult?.diagnostics || {
          latencyMs: 38,
          engineMode: 'MobileNetV3 Edge Vision Pipeline',
          calibratedThresholds: {
            confirmedPest: 0.85,
            possiblePest: 0.65,
            confirmedDamage: 0.80,
            leafConditionHigh: 0.85
          },
          qualityMetrics: {
            blurVariance: 84,
            meanLuminance: 122,
            leafCoverageRatio: 0.48,
            sampleResolution: [320, 240]
          }
        }}
      />
    </div>
  );
};

export default AIVision;
