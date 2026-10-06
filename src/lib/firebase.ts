import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const env: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) ||
  {};

const clean = (val: string | undefined) =>
  (val || '').trim().replace(/^["']|["']$/g, '').replace(/,$/, '').trim();

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDPG_lEw8a7WTi_bIt6VpTQsj2pJgqhSw0',
  authDomain: 'bootcamp-future-maker-3a054.firebaseapp.com',
  projectId: 'bootcamp-future-maker-3a054',
  storageBucket: 'bootcamp-future-maker-3a054.firebasestorage.app',
  messagingSenderId: '29788769543',
  appId: '1:29788769543:web:586b1dc845c22fca79c9a2',
};

const firebaseConfig = {
  apiKey: clean(env.VITE_FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN) || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: clean(env.VITE_FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: clean(env.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: clean(env.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: clean(env.VITE_FIREBASE_APP_ID) || DEFAULT_FIREBASE_CONFIG.appId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.warn('Gagal menginisialisasi Firebase, beralih ke local storage store:', err);
  }
}

export { app, db, auth, googleProvider };
