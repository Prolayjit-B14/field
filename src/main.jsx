import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// 🚀 PRODUCTION BOOTSTRAP
const container = document.getElementById('root');
const root = createRoot(container);

try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  // 🛡️ RECOVERY: Immediately hide the diagnostic loader
  if (window.hideAppLoader) {
    window.hideAppLoader();
  }
} catch (err) {
  console.error("❌ [MAIN FATAL ERROR]:", err);
  if (container) {
    container.innerHTML = `
      <div style="color:white; padding:40px; background:#020617; height:100vh; font-family:sans-serif;">
        <h1 style="color:#ef4444;">System Crash</h1>
        <p>A critical failure occurred during engine initialization.</p>
        <pre style="background:#0f172a; padding:15px; border-radius:10px; overflow:auto; font-size:0.8rem; border:1px solid #1e293b;">${err.stack || err.message}</pre>
        <button onclick="location.reload()" style="margin-top:20px; padding:12px 24px; background:#10b981; border:none; color:white; border-radius:8px; font-weight:bold;">RESTART SYSTEM</button>
      </div>
    `;
  }
}
