import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, terminate } from 'firebase/firestore';

// Baca file .env dan isi ke process.env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '').replace(/,$/, '').trim();
        process.env[key] = val;
      }
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function testConnection() {
  console.log('--- TEST KONEKSI CLOUD FIRESTORE ---');
  console.log('Project ID   :', firebaseConfig.projectId);
  console.log('API Key      :', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 10)}...` : 'KOSONG');

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('[GAGAL] Nilai VITE_FIREBASE_API_KEY atau VITE_FIREBASE_PROJECT_ID belum diisi di .env');
    process.exit(1);
  }

  let db: any = null;
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    console.log('Mencoba membaca dokumen dari koleksi "menu"...');
    const snapshot = await getDocs(collection(db, 'menu'));
    console.log(`[BERHASIL] Firestore terhubung! Ditemukan ${snapshot.docs.length} dokumen di koleksi "menu".`);

    if (db) {
      await terminate(db);
    }
    console.log('Status: SUKSES');
    process.exit(0);
  } catch (err: any) {
    console.error('[GAGAL]', err.message || err);

    if (err.message && err.message.includes('NOT_FOUND')) {
      console.error('\n⚠️ PENYEBAB: Database Firestore belum dibuat (5 NOT_FOUND).');
      console.error('Solusi: Buka Firebase Console -> Build -> Firestore Database -> Klik "Create Database".');
    } else if (err.code === 'permission-denied') {
      console.error('\n⚠️ PENYEBAB: Security Rules masih terkunci (permission-denied).');
      console.error('Solusi: Di Firebase Console -> Firestore Database -> Rules -> Ubah menjadi "allow read, write: if true;".');
    }

    if (db) {
      try {
        await terminate(db);
      } catch {}
    }
    process.exit(1);
  }
}

testConnection();
