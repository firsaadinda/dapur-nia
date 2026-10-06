import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDPG_lEw8a7WTi_bIt6VpTQsj2pJgqhSw0',
  authDomain: 'bootcamp-future-maker-3a054.firebaseapp.com',
  projectId: 'bootcamp-future-maker-3a054',
  storageBucket: 'bootcamp-future-maker-3a054.firebasestorage.app',
  messagingSenderId: '29788769543',
  appId: '1:29788769543:web:586b1dc845c22fca79c9a2',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

let total = 0;
let passed = 0;

function assert(condition: boolean, title: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${title}`);
  } else {
    console.error(`  [FAIL] ${title}`);
  }
}

async function verify() {
  console.log('=== VERIFIKASI 3 PERMINTAAN PENGGUNA DAPUR NIA ===\n');

  // 1. Verifikasi Koleksi Firestore 'pengguna'
  console.log('--- 1. Pemeriksaan Koleksi Firestore: pengguna ---');
  const snapshot = await getDocs(collection(db, 'pengguna'));
  assert(snapshot.size > 0, `Koleksi 'pengguna' berhasil dibuat di Firestore (total: ${snapshot.size} dokumen)`);

  let buNiaFound = false;
  let raniFound = false;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.nama === 'Bu Nia' || data.email === 'pemilik.dapurnia@gmail.com') {
      buNiaFound = true;
      assert(data.peran === 'pemilik', 'Akun Bu Nia terdaftar dengan peran pemilik');
    }
    if (data.nama?.includes('Rani') || data.email === 'staf.dapurnia@gmail.com') {
      raniFound = true;
      assert(data.peran === 'staf', 'Akun Rani terdaftar dengan peran staf');
    }
  });

  assert(buNiaFound, 'Data login Bu Nia tersimpan di koleksi pengguna');
  assert(raniFound, 'Data login Staf Rani tersimpan di koleksi pengguna');

  console.log(`\n=== HASIL: ${passed}/${total} UJI LULUS ===`);
}

verify().catch((err) => {
  console.error('Error saat verifikasi:', err);
  process.exit(1);
});
