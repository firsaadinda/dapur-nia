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
  { id: 'm1_ayam_bakar', nama: 'Nasi Ayam Bakar Madu', harga: 25000, kategori: 'makanan', sisa_porsi: 30, tersedia: true },
  { id: 'm2_rendang', nama: 'Nasi Rendang Daging Sapi', harga: 35000, kategori: 'makanan', sisa_porsi: 15, tersedia: true },
  { id: 'm3_ayam_lengkuas', nama: 'Nasi Ayam Goreng Lengkuas', harga: 24000, kategori: 'makanan', sisa_porsi: 25, tersedia: true },
  { id: 'm4_sate_ayam', nama: 'Sate Ayam Madura + Lontong', harga: 25000, kategori: 'makanan', sisa_porsi: 20, tersedia: true },
  { id: 'm5_cumi_cabe_ijo', nama: 'Nasi Cumi Cabai Hijau', harga: 28000, kategori: 'makanan', sisa_porsi: 12, tersedia: true },
  { id: 'm6_soto_ayam', nama: 'Soto Ayam Lamongan Komplit', harga: 20000, kategori: 'makanan', sisa_porsi: 18, tersedia: true },
  { id: 'm7_gudeg', nama: 'Nasi Gudeg Komplit Krecek', harga: 22000, kategori: 'makanan', sisa_porsi: 0, tersedia: true },
  { id: 'm14_pempek_pacak', nama: 'Pempek Pacak', harga: 25000, kategori: 'makanan', sisa_porsi: 20, tersedia: true },
  { id: 'm8_es_teh', nama: 'Es Teh Manis Melati Jumbo', harga: 5000, kategori: 'minuman', sisa_porsi: 50, tersedia: true },
  { id: 'm12_es_kelapa_jeruk', nama: 'Es Kelapa Jeruk', harga: 15000, kategori: 'minuman', sisa_porsi: 40, tersedia: true },
  { id: 'm13_fresh_mojito', nama: 'Fresh Mojito Mocktail', harga: 18000, kategori: 'minuman', sisa_porsi: 25, tersedia: true },
  { id: 'm15_jus_alpukat', nama: 'Jus Alpukat', harga: 12000, kategori: 'minuman', sisa_porsi: 20, tersedia: true },
  { id: 'm9_asinan_kiamboy', nama: 'Oriental Asinan Kiamboy', harga: 22000, kategori: 'dessert', sisa_porsi: 25, tersedia: true },
  { id: 'm10_fruity_salad', nama: 'Fruity Salad', harga: 20000, kategori: 'dessert', sisa_porsi: 30, tersedia: true },
  { id: 'm11_mango_buko', nama: 'Drip Mango Buko', harga: 18000, kategori: 'dessert', sisa_porsi: 35, tersedia: true },
  { id: 'm16_puding_strawberry', nama: 'Puding Creamy Strawberry', harga: 15000, kategori: 'dessert', sisa_porsi: 25, tersedia: true },
];

const SEED_PELANGGAN = [
  { id: '081234567890', nama: 'Budi Santoso', no_whatsapp: '081234567890', alamat: 'Jl. Melati No. 12, RT 03/RW 05' },
  { id: '081398765432', nama: 'Siti Aminah', no_whatsapp: '081398765432', alamat: 'Perum Griya Asri Blok C2' },
  { id: '085611223344', nama: 'Andi Wijaya', no_whatsapp: '085611223344', alamat: 'Jl. Kenanga No. 7' },
];

const today = new Date().toISOString().split('T')[0];

const SEED_PESANAN = [
  {
    id: 'pes1',
    pelanggan_id: '081234567890',
    nama_pelanggan: 'Budi Santoso',
    alamat_kirim: 'Jl. Melati No. 12, RT 03/RW 05',
    menu_id: 'm1_ayam_bakar',
    nama_menu: 'Nasi Ayam Bakar Madu',
    harga_satuan: 25000,
    jumlah_porsi: 20,
    ongkir: 5000,
    total: 505000,
    status: 'dibayar',
    bukti_bayar: 'qris_mandiri_budi.png',
    tanggal: today
  },
  {
    id: 'pes2',
    pelanggan_id: '081398765432',
    nama_pelanggan: 'Siti Aminah',
    alamat_kirim: 'Perum Griya Asri Blok C2',
    menu_id: 'm8_es_teh',
    nama_menu: 'Es Teh Manis Melati Jumbo',
    harga_satuan: 5000,
    jumlah_porsi: 12,
    ongkir: 0,
    total: 60000,
    status: 'selesai',
    bukti_bayar: 'qris_mandiri_siti.png',
    tanggal: today
  },
  {
    id: 'pes3',
    pelanggan_id: '085611223344',
    nama_pelanggan: 'Andi Wijaya',
    alamat_kirim: 'Jl. Kenanga No. 7',
    menu_id: 'm5_cumi_cabe_ijo',
    nama_menu: 'Nasi Cumi Cabai Hijau',
    harga_satuan: 28000,
    jumlah_porsi: 2,
    ongkir: 14000,
    total: 70000,
    status: 'menunggu_bayar',
    bukti_bayar: '',
    tanggal: today
  }
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
        kategori: m.kategori,
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

    console.log('Menyimpan pesanan ke koleksi "pesanan"...');
    for (const p of SEED_PESANAN) {
      await setDoc(doc(db, 'pesanan', p.id), {
        pelanggan_id: p.pelanggan_id,
        nama_pelanggan: p.nama_pelanggan,
        alamat_kirim: p.alamat_kirim,
        menu_id: p.menu_id,
        nama_menu: p.nama_menu,
        harga_satuan: p.harga_satuan,
        jumlah_porsi: p.jumlah_porsi,
        ongkir: p.ongkir,
        total: p.total,
        status: p.status,
        bukti_bayar: p.bukti_bayar || '',
        tanggal: p.tanggal,
        dibuat_pada: serverTimestamp(),
      });
      console.log(`  + Pesanan: ${p.nama_pelanggan} - ${p.nama_menu}`);
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
