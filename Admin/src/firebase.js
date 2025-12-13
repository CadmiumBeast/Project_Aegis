import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Log config to verify it's loaded (remove in production)
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Loaded' : '✗ Missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Set auth persistence
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Failed to enable persistence:", error);
    });

  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Create fallback objects to prevent crashes
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
export default app;