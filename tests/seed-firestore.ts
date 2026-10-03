import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, terminate, serverTimestamp } from 'firebase/firestore';

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

const SEED_MENUS = [
  { id: 'm1_ayam_bakar', nama: 'Nasi Ayam Bakar Madu', harga: 25000, sisa_porsi: 30, tersedia: true },
  { id: 'm2_rendang', nama: 'Nasi Rendang Daging Sapi', harga: 35000, sisa_porsi: 15, tersedia: true },
  { id: 'm3_ayam_lengkuas', nama: 'Nasi Ayam Goreng Lengkuas', harga: 24000, sisa_porsi: 25, tersedia: true },
  { id: 'm4_sate_ayam', nama: 'Sate Ayam Madura + Lontong', harga: 25000, sisa_porsi: 20, tersedia: true },
  { id: 'm5_cumi_cabe_ijo', nama: 'Nasi Cumi Cabai Hijau', harga: 28000, sisa_porsi: 12, tersedia: true },
  { id: 'm6_soto_ayam', nama: 'Soto Ayam Lamongan Komplit', harga: 20000, sisa_porsi: 18, tersedia: true },
  { id: 'm7_gudeg', nama: 'Nasi Gudeg Komplit Krecek', harga: 22000, sisa_porsi: 0, tersedia: true },
  { id: 'm8_es_teh', nama: 'Es Teh Manis Melati Jumbo', harga: 5000, sisa_porsi: 50, tersedia: true },
];

const SEED_PELANGGAN = [
  { id: '081234567890', nama: 'Budi Santoso', no_whatsapp: '081234567890', alamat: 'Jl. Melati No. 12, RT 03/RW 05' },
  { id: '081398765432', nama: 'Siti Aminah', no_whatsapp: '081398765432', alamat: 'Perum Griya Asri Blok C2' },
  { id: '085611223344', nama: 'Andi Wijaya', no_whatsapp: '085611223344', alamat: 'Jl. Kenanga No. 7' },
];

async function seed() {
  console.log('--- SEEDING CLOUD FIRESTORE DAPUR NIA ---');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    console.log('Menyimpan menu ke koleksi "menu"...');
    for (const m of SEED_MENUS) {
      await setDoc(doc(db, 'menu', m.id), {
        nama: m.nama,
        harga: m.harga,
        sisa_porsi: m.sisa_porsi,
        tersedia: m.tersedia,
        dibuat_pada: serverTimestamp(),
      });
      console.log(`  + Menu: ${m.nama} (${m.sisa_porsi > 0 ? `sisa ${m.sisa_porsi}` : 'Habis'})`);
    }

    console.log('Menyimpan pelanggan ke koleksi "pelanggan"...');
    for (const p of SEED_PELANGGAN) {
      await setDoc(doc(db, 'pelanggan', p.id), {
        nama: p.nama,
        no_whatsapp: p.no_whatsapp,
        alamat: p.alamat,
        dibuat_pada: serverTimestamp(),
      });
      console.log(`  + Pelanggan: ${p.nama} (${p.id})`);
    }

    console.log('\n[SELESAI] Data awal berhasil diunggah ke Cloud Firestore!');
    await terminate(db);
    process.exit(0);
  } catch (err) {
    console.error('[GAGAL]', err);
    await terminate(db);
    process.exit(1);
  }
}

seed();
