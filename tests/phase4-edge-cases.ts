// Script Verifikasi Mandiri Fase 4: Uji Tembus 6 Masukan Tidak Sah (Bagian 8 PRD)
import { validateMenu, validatePelanggan, validatePesanan, canTransitionStatus } from '../src/lib/validators';

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

console.log('=== VERIFIKASI FASE 4: 6 SKENARIO UJI TEMBUS MASUKAN TIDAK SAH ===\n');

// 1. Field Kosong
console.log('--- Uji 1: Field Kosong ---');
const resEmptyMenu = validateMenu({ nama: '', harga: 20000, sisa_porsi: 10 });
assert(!resEmptyMenu.isValid && Boolean(resEmptyMenu.errors.nama), 'Uji 1.1: Nama menu kosong ditolak');

const resEmptyCustName = validatePelanggan({ nama: '', no_whatsapp: '081234567890', alamat: 'Alamat' });
assert(!resEmptyCustName.isValid && Boolean(resEmptyCustName.errors.nama), 'Uji 1.2: Nama pelanggan kosong ditolak');

const resEmptyCustAddress = validatePelanggan({ nama: 'Pelanggan', no_whatsapp: '081234567890', alamat: '' });
assert(!resEmptyCustAddress.isValid && Boolean(resEmptyCustAddress.errors.alamat), 'Uji 1.3: Alamat pengiriman kosong ditolak');

// 2. Tipe Salah
console.log('\n--- Uji 2: Tipe Salah ---');
const resNaNPrice = validateMenu({ nama: 'Menu', harga: NaN, sisa_porsi: 10 });
assert(!resNaNPrice.isValid && Boolean(resNaNPrice.errors.harga), 'Uji 2.1: Harga bernilai NaN ditolak');

const resFloatPrice = validateMenu({ nama: 'Menu', harga: 25000.5, sisa_porsi: 10 });
assert(!resFloatPrice.isValid && Boolean(resFloatPrice.errors.harga), 'Uji 2.2: Harga bukan angka bulat rupiah ditolak');

const resFloatPortion = validateMenu({ nama: 'Menu', harga: 25000, sisa_porsi: 2.5 });
assert(!resFloatPortion.isValid && Boolean(resFloatPortion.errors.sisa_porsi), 'Uji 2.3: Porsi bukan angka bulat ditolak');

// 3. Teks Terlalu Panjang / Format Di Luar Skema
console.log('\n--- Uji 3: Teks Terlalu Panjang & Format Khusus ---');
const resLongMenu = validateMenu({ nama: 'M'.repeat(61), harga: 25000, sisa_porsi: 10 });
assert(!resLongMenu.isValid && Boolean(resLongMenu.errors.nama), 'Uji 3.1: Nama menu > 60 karakter ditolak');

const resLongCustName = validatePelanggan({ nama: 'N'.repeat(61), no_whatsapp: '081234567890', alamat: 'Alamat' });
assert(!resLongCustName.isValid && Boolean(resLongCustName.errors.nama), 'Uji 3.2: Nama pelanggan > 60 karakter ditolak');

const resLongCustAddress = validatePelanggan({ nama: 'Nama', no_whatsapp: '081234567890', alamat: 'A'.repeat(201) });
assert(!resLongCustAddress.isValid && Boolean(resLongCustAddress.errors.alamat), 'Uji 3.3: Alamat pelanggan > 200 karakter ditolak');

const resInvalidWaNonDigit = validatePelanggan({ nama: 'Nama', no_whatsapp: '0812abc56789', alamat: 'Alamat' });
assert(!resInvalidWaNonDigit.isValid && Boolean(resInvalidWaNonDigit.errors.no_whatsapp), 'Uji 3.4: Nomor WA mengandung huruf ditolak');

// 4. Nilai Negatif (Invariant 1)
console.log('\n--- Uji 4: Nilai Negatif ---');
const resNegPrice = validateMenu({ nama: 'Menu', harga: -100, sisa_porsi: 10 });
assert(!resNegPrice.isValid && Boolean(resNegPrice.errors.harga), 'Uji 4.1: Harga negatif ditolak');

const resNegStock = validateMenu({ nama: 'Menu', harga: 20000, sisa_porsi: -5 });
assert(!resNegStock.isValid && Boolean(resNegStock.errors.sisa_porsi), 'Uji 4.2: Sisa porsi negatif ditolak');

const resNegOngkir = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 20000,
  jumlah_porsi: 1,
  sisa_porsi_menu: 5,
  ongkir: -5000,
  total: 15000,
});
assert(!resNegOngkir.isValid && Boolean(resNegOngkir.errors.ongkir), 'Uji 4.3: Ongkos kirim negatif ditolak');

// 5. Nilai di Luar Batas (Invariant 2)
console.log('\n--- Uji 5: Nilai di Luar Batas ---');
const resZeroOrder = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 20000,
  jumlah_porsi: 0,
  sisa_porsi_menu: 5,
  ongkir: 5000,
  total: 5000,
});
assert(!resZeroOrder.isValid && Boolean(resZeroOrder.errors.jumlah_porsi), 'Uji 5.1: Pesanan 0 porsi ditolak');

const resOverStockOrder = validatePesanan({
  pelanggan_id: '081234567890',
  menu_id: 'm1',
  harga_satuan: 20000,
  jumlah_porsi: 8,
  sisa_porsi_menu: 5,
  ongkir: 5000,
  total: 165000,
});
assert(!resOverStockOrder.isValid && Boolean(resOverStockOrder.errors.jumlah_porsi), 'Uji 5.2: Pesanan 8 porsi saat stok 5 ditolak');

// 6. Perubahan Status Tidak Sah (FSM Jumping)
console.log('\n--- Uji 6: Perubahan Status Tidak Sah ---');
assert(!canTransitionStatus('menunggu_bayar', 'diproses'), 'Uji 6.1: menunggu_bayar -> diproses (Lompat status ditolak)');
assert(!canTransitionStatus('menunggu_bayar', 'selesai'), 'Uji 6.2: menunggu_bayar -> selesai (Lompat status ditolak)');
assert(!canTransitionStatus('diproses', 'menunggu_bayar'), 'Uji 6.3: diproses -> menunggu_bayar (Mundur status ditolak)');
assert(!canTransitionStatus('diproses', 'dibayar'), 'Uji 6.4: diproses -> dibayar (Mundur status ditolak)');
assert(!canTransitionStatus('selesai', 'diproses'), 'Uji 6.5: selesai -> diproses (Terminal state terkunci)');
assert(!canTransitionStatus('dibatalkan', 'menunggu_bayar'), 'Uji 6.6: dibatalkan -> menunggu_bayar (Terminal state terkunci)');

console.log(`\n=== HASIL: ${passedTests}/${totalTests} UJI LULUS ===`);
if (passedTests === totalTests) {
  console.log('Status: FASE 4 UJI TEMBUS 6 MASUKAN TIDAK SAH LULUS 100%!');
} else {
  process.exit(1);
}
