// Script Verifikasi Mandiri Fase 1: Validasi Tipe Data, Invariant & FSM
import {
  validateMenu,
  validatePelanggan,
  validatePesanan,
  canTransitionStatus,
  ALLOWED_STATUS_TRANSITIONS,
} from '../src/lib/validators';
import type { OrderStatus } from '../src/types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
  }
}

console.log('=== VERIFIKASI FASE 1: DAPUR NIA APP 2 ===\n');

// 1. UJI INVARIANT 1: MENU
console.log('--- 1. Uji Invariant 1: Validasi Menu ---');
const validMenu = validateMenu({ nama: 'Nasi Ayam Bakar', harga: 25000, sisa_porsi: 30 });
assert(validMenu.isValid, 'Menu valid harus lolos');

const negativePrice = validateMenu({ nama: 'Nasi Ayam', harga: -5000, sisa_porsi: 10 });
assert(!negativePrice.isValid && Boolean(negativePrice.errors.harga), 'Harga negatif (-5000) harus ditolak');

const negativeStock = validateMenu({ nama: 'Nasi Ayam', harga: 25000, sisa_porsi: -1 });
assert(!negativeStock.isValid && Boolean(negativeStock.errors.sisa_porsi), 'Sisa porsi negatif (-1) harus ditolak');

const emptyName = validateMenu({ nama: '   ', harga: 25000, sisa_porsi: 10 });
assert(!emptyName.isValid && Boolean(emptyName.errors.nama), 'Nama menu kosong harus ditolak');

const longName = validateMenu({ nama: 'A'.repeat(65), harga: 25000, sisa_porsi: 10 });
assert(!longName.isValid && Boolean(longName.errors.nama), 'Nama menu > 60 karakter harus ditolak');

// 2. UJI MODUL PELANGGAN
console.log('\n--- 2. Uji Modul Pelanggan ---');
const validCust = validatePelanggan({
  nama: 'Budi Santoso',
  no_whatsapp: '081234567890',
  alamat: 'Jl. Melati No. 12',
});
assert(validCust.isValid, 'Pelanggan valid harus lolos');

const invalidWaPrefix = validatePelanggan({
  nama: 'Budi',
  no_whatsapp: '071234567890',
  alamat: 'Jl. Melati',
});
assert(!invalidWaPrefix.isValid && Boolean(invalidWaPrefix.errors.no_whatsapp), 'Nomor WA bukan 08 harus ditolak');

const shortWa = validatePelanggan({
  nama: 'Budi',
  no_whatsapp: '0812345',
  alamat: 'Jl. Melati',
});
assert(!shortWa.isValid && Boolean(shortWa.errors.no_whatsapp), 'Nomor WA < 10 digit harus ditolak');

const emptyAddress = validatePelanggan({
  nama: 'Budi',
  no_whatsapp: '081234567890',
  alamat: '',
});
assert(!emptyAddress.isValid && Boolean(emptyAddress.errors.alamat), 'Alamat kosong harus ditolak');

// 3. UJI INVARIANT 2: PORSI PESANAN
console.log('\n--- 3. Uji Invariant 2: Porsi Pesanan (Minimal 1 & Kuota) ---');
const zeroPortion = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 25000,
  jumlah_porsi: 0,
  sisa_porsi_menu: 10,
  ongkir: 5000,
  total: 5000,
});
assert(!zeroPortion.isValid && Boolean(zeroPortion.errors.jumlah_porsi), 'Pesanan 0 porsi harus ditolak');

const overQuota = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 25000,
  jumlah_porsi: 15,
  sisa_porsi_menu: 10,
  ongkir: 5000,
  total: 380000,
});
assert(!overQuota.isValid && Boolean(overQuota.errors.jumlah_porsi), 'Pesanan melebihi sisa porsi harus ditolak');

// 4. UJI INVARIANT 3: FORMULA TOTAL TAGIHAN
console.log('\n--- 4. Uji Invariant 3: Total Tagihan ---');
const validOrder = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 25000,
  jumlah_porsi: 2,
  sisa_porsi_menu: 10,
  ongkir: 5000,
  total: 55000, // (25000 * 2) + 5000 = 55000
});
assert(validOrder.isValid, 'Total tagihan yang sesuai invariant harus lolos');

const mismatchTotal = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 25000,
  jumlah_porsi: 2,
  sisa_porsi_menu: 10,
  ongkir: 5000,
  total: 50000, // Salah (kurang 5000)
});
assert(!mismatchTotal.isValid && Boolean(mismatchTotal.errors.total), 'Total tagihan yang tidak cocok dengan formula harus ditolak');

// 5. UJI FINITE STATE MACHINE (FSM)
console.log('\n--- 5. Uji FSM Transisi Status ---');
assert(canTransitionStatus('menunggu_bayar', 'dibayar'), 'menunggu_bayar -> dibayar (Sah)');
assert(canTransitionStatus('menunggu_bayar', 'dibatalkan'), 'menunggu_bayar -> dibatalkan (Sah)');
assert(canTransitionStatus('dibayar', 'diproses'), 'dibayar -> diproses (Sah)');
assert(canTransitionStatus('diproses', 'selesai'), 'diproses -> selesai (Sah)');

// Ilegal transitions
assert(!canTransitionStatus('menunggu_bayar', 'selesai'), 'menunggu_bayar -> selesai (Ilegal jumping harus ditolak)');
assert(!canTransitionStatus('menunggu_bayar', 'diproses'), 'menunggu_bayar -> diproses (Ilegal jumping harus ditolak)');
assert(!canTransitionStatus('diproses', 'menunggu_bayar'), 'diproses -> menunggu_bayar (Ilegal mundur harus ditolak)');
assert(!canTransitionStatus('selesai', 'menunggu_bayar'), 'selesai -> menunggu_bayar (Terminal state terkunci)');
assert(!canTransitionStatus('dibatalkan', 'dibayar'), 'dibatalkan -> dibayar (Terminal state terkunci)');

console.log(`\n=== HASIL: ${passedTests}/${totalTests} UJI LULUS ===`);
if (passedTests === totalTests) {
  console.log('Status: FASE 1 BERHASIL DIVERIFIKASI SECARA LENGKAP!');
} else {
  process.exit(1);
}
