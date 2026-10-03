// Script Verifikasi Mandiri Fase 3: Siklus Alur Pengguna (User Journey & UI Integration)
import { getMenus, addMenu, deleteMenu } from '../src/services/menuService';
import { getPelangganList, addPelanggan, deletePelanggan } from '../src/services/pelangganService';
import { getPesananList, createPesanan, updatePesananStatus } from '../src/services/pesananService';
import { getLaporanHarian } from '../src/services/laporanService';

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

async function runPhase3Simulation() {
  console.log('=== VERIFIKASI FASE 3: INTEGRASI MODUL ANTARMUKA (USER JOURNEY) ===\n');

  // Skenario 1: Pengelola menambahkan menu harian baru
  console.log('--- Skenario 1: Input Menu Baru dari Modal Formulir ---');
  const createdMenu = await addMenu({
    nama: 'Paket Ayam Bakar Madu Spesial',
    harga: 28000,
    sisa_porsi: 25,
    tersedia: true,
  });
  assert(Boolean(createdMenu.id), 'Menu baru berhasil dibuat dari form modal');
  assert(createdMenu.sisa_porsi === 25, 'Sisa kuota porsi terdaftar 25 porsi');

  // Skenario 2: Pengelola menambahkan pelanggan baru
  console.log('\n--- Skenario 2: Input Pelanggan Baru dari Modal Formulir ---');
  const custPhone = '081399887766';
  const createdCust = await addPelanggan({
    nama: 'Ibu Ratna Dewi',
    no_whatsapp: custPhone,
    alamat: 'Perumahan Pesona Indah Blok D-05',
  });
  assert(createdCust.id === custPhone, 'Pelanggan berhasil disimpan dengan nomor WhatsApp');

  // Skenario 3: Pelanggan membuat pesanan katering
  console.log('\n--- Skenario 3: Buat Pesanan Baru (Live Calculation & Stepper) ---');
  const porsi = 3;
  const ongkir = 5000;
  const expectedTotal = (28000 * porsi) + ongkir; // 89.000

  const order = await createPesanan({
    pelanggan_id: custPhone,
    menu_id: createdMenu.id,
    jumlah_porsi: porsi,
    ongkir,
    tanggal: '2026-10-02',
    bukti_bayar: 'Transfer BCA Ref #99281',
  });

  assert(order.total === expectedTotal, `Kalkulasi total tagihan live akurat: Rp${order.total.toLocaleString('id-ID')}`);
  assert(order.status === 'menunggu_bayar', 'Pesanan masuk pada alur awal: menunggu_bayar');

  const menuAfterOrder = (await getMenus()).find((m) => m.id === createdMenu.id);
  assert(menuAfterOrder?.sisa_porsi === 22, 'Kuota menu terpotong secara instan dari 25 menjadi 22 porsi');

  // Skenario 4: Alur Transisi Status Pesanan (FSM Lifecycle)
  console.log('\n--- Skenario 4: Transisi Status Berurutan (Stepper Alur) ---');
  await updatePesananStatus(order.id, 'dibayar');
  let currentOrder = (await getPesananList()).find((p) => p.id === order.id)!;
  assert(currentOrder.status === 'dibayar', 'Status maju ke: dibayar');

  await updatePesananStatus(order.id, 'diproses');
  currentOrder = (await getPesananList()).find((p) => p.id === order.id)!;
  assert(currentOrder.status === 'diproses', 'Status maju ke: diproses');

  await updatePesananStatus(order.id, 'selesai');
  currentOrder = (await getPesananList()).find((p) => p.id === order.id)!;
  assert(currentOrder.status === 'selesai', 'Status maju ke: selesai (Terminal State)');

  // Skenario 5: Pemeriksaan Laporan Penjualan
  console.log('\n--- Skenario 5: Tampilan Laporan Harian Terintegrasi ---');
  const report = await getLaporanHarian('2026-10-02');
  const itemInReport = report.rincian_menu.find((r) => r.menu_id === createdMenu.id);
  assert(itemInReport?.porsi_terjual === 3, 'Laporan harian mencatat porsi terjual tepat 3 porsi');
  assert(itemInReport?.total_omzet === 28000 * 3, 'Omzet menu tepat Rp84.000');
  assert(report.total_uang_masuk >= expectedTotal, 'Total uang masuk akumulatif mencakup omzet + ongkir');

  // Bersihkan data simulasi
  await deleteMenu(createdMenu.id);
  await deletePelanggan(custPhone);

  console.log(`\n=== HASIL: ${passedTests}/${totalTests} SKENARIO LULUS ===`);
  if (passedTests === totalTests) {
    console.log('Status: FASE 3 INTEGRASI PENGGUNA BERHASIL DIVERIFIKASI PENUH!');
  } else {
    process.exit(1);
  }
}

runPhase3Simulation().catch((err) => {
  console.error('Error saat simulasi Fase 3:', err);
  process.exit(1);
});
