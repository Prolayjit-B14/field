import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 🚀 OFFICIAL FIREBASE CONFIG WITH PRODUCTION FALLBACKS
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBVj0qDTfUyTeYBS0oEX1B31Knm5sIO-Qs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "agri-sense-pb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "agri-sense-pb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "agri-sense-pb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "981404446811",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:981404446811:web:006d8123c6adca8fbf8f7e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-111EYNGXGS"
};

let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase initializeApp note:", e);
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ⚠️ Analytics removed to prevent mobile webview crashes
export const analytics = null;

// 🔐 SET PERMANENT PERSISTENCE SAFELY
try {
  setPersistence(auth, browserLocalPersistence).catch(err => console.warn("Persistence Error:", err));
} catch (e) {
  console.warn("setPersistence failed:", e);
}

export default app;
