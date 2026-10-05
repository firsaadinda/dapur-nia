// Script Verifikasi Mandiri Fase 2: Service Layer CRUD, Invariant Checking, Stock Rollback & Laporan
import { getMenus, addMenu, updateMenu, deleteMenu } from '../src/services/menuService';
import { getPelangganList, addPelanggan, getPelangganById, deletePelanggan } from '../src/services/pelangganService';
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

async function runPhase2Tests() {
  console.log('=== VERIFIKASI FASE 2: SERVICE LAYER CRUD & INVARIANTS ===\n');

  // --- 1. UJI SERVICE MENU ---
  console.log('--- 1. Uji menuService (CRUD & Invariant 1) ---');
  const initialMenus = await getMenus();
  assert(initialMenus.length > 0, 'getMenus mengembalikan daftar menu awal');

  const newMenu = await addMenu({
    nama: 'Nasi Bebek Madura Sambal Hitam',
    harga: 35000,
    sisa_porsi: 20,
    tersedia: true,
  });
  assert(newMenu.nama === 'Nasi Bebek Madura Sambal Hitam', 'addMenu berhasil menyimpan menu baru');

  // Rejection check: harga negatif
  let errorCaught = false;
  try {
    await addMenu({ nama: 'Menu Ilegal', harga: -1000, sisa_porsi: 10, tersedia: true });
  } catch {
    errorCaught = true;
  }
  assert(errorCaught, 'addMenu menolak harga negatif (Invariant 1)');

  // Update menu
  await updateMenu(newMenu.id, { harga: 38000 });
  const updatedMenus = await getMenus();
  const foundMenu = updatedMenus.find((m) => m.id === newMenu.id);
  assert(foundMenu?.harga === 38000, 'updateMenu berhasil memperbarui harga');

  // --- 2. UJI SERVICE PELANGGAN ---
  console.log('\n--- 2. Uji pelangganService (CRUD & WhatsApp Uniqueness) ---');
  const uniqueWa = '087711223344';
  const newCust = await addPelanggan({
    nama: 'Pak RT Bambang',
    no_whatsapp: uniqueWa,
    alamat: 'Rumah Dinas RT 01/RW 03',
  });
  assert(newCust.id === uniqueWa, 'addPelanggan berhasil dengan ID = no_whatsapp');

  // Acceptance Criteria 2: Cek penolakan duplikasi no WhatsApp
  let duplicateRejected = false;
  try {
    await addPelanggan({
      nama: 'Bambang Kloning',
      no_whatsapp: uniqueWa,
      alamat: 'Alamat lain',
    });
  } catch (err: any) {
    duplicateRejected = true;
  }
  assert(duplicateRejected, 'addPelanggan menolak nomor WhatsApp yang sudah terdaftar (AC 2)');

  const fetchedCust = await getPelangganById(uniqueWa);
  assert(fetchedCust?.nama === 'Pak RT Bambang', 'getPelangganById mengembalikan data yang cocok');

  // --- 3. UJI SERVICE PESANAN (STOCK DEDUCTION, SNAPSHOT & FSM) ---
  console.log('\n--- 3. Uji pesananService (Stok, Invariants & FSM) ---');
  const menuBefore = (await getMenus()).find((m) => m.id === newMenu.id)!;
  const initialStock = menuBefore.sisa_porsi; // 20

  const order1 = await createPesanan({
    pelanggan_id: uniqueWa,
    menu_id: newMenu.id,
    jumlah_porsi: 4,
    ongkir: 5000,
    tanggal: '2026-10-02',
  });

  // Verify stock deduction
  const menuAfter = (await getMenus()).find((m) => m.id === newMenu.id)!;
  assert(
    menuAfter.sisa_porsi === initialStock - 4,
    `createPesanan memotong sisa porsi menu (dari ${initialStock} jadi ${menuAfter.sisa_porsi})`
  );

  // Verify snapshots & Invariant 3 formula
  assert(order1.nama_menu === newMenu.nama, 'Snapshot nama_menu tersimpan');
  assert(order1.harga_satuan === 38000, 'Snapshot harga_satuan tersimpan');
  assert(order1.status === 'menunggu_bayar', 'Status awal pesanan adalah menunggu_bayar');
  assert(order1.total === (38000 * 4) + 5000, 'Invariant 3: total tagihan dihitung akurat (Rp157.000)');

  // FSM transitions
  await updatePesananStatus(order1.id, 'dibayar');
  let ord = (await getPesananList()).find((p) => p.id === order1.id)!;
  assert(ord.status === 'dibayar', 'Status transisi sah: menunggu_bayar -> dibayar');

  await updatePesananStatus(order1.id, 'diproses');
  ord = (await getPesananList()).find((p) => p.id === order1.id)!;
  assert(ord.status === 'diproses', 'Status transisi sah: dibayar -> diproses');

  // Ilegal jump test
  let illegalJumpBlocked = false;
  try {
    await updatePesananStatus(order1.id, 'menunggu_bayar'); // Mundur dilarang
  } catch {
    illegalJumpBlocked = true;
  }
  assert(illegalJumpBlocked, 'FSM memblokir status mundur: diproses -> menunggu_bayar');

  await updatePesananStatus(order1.id, 'selesai');
  ord = (await getPesananList()).find((p) => p.id === order1.id)!;
  assert(ord.status === 'selesai', 'Status transisi sah: diproses -> selesai');

  // --- 4. UJI STOCK ROLLBACK ON CANCEL ---
  console.log('\n--- 4. Uji Pembatalan Pesanan & Rollback Stok ---');
  const stockBeforeCancelOrder = (await getMenus()).find((m) => m.id === newMenu.id)!.sisa_porsi;
  const order2 = await createPesanan({
    pelanggan_id: uniqueWa,
    menu_id: newMenu.id,
    jumlah_porsi: 3,
    ongkir: 5000,
    tanggal: '2026-10-02',
  });
  // Stok berkurang 3
  const stockDuringOrder = (await getMenus()).find((m) => m.id === newMenu.id)!.sisa_porsi;
  assert(stockDuringOrder === stockBeforeCancelOrder - 3, 'Porsi terpotong saat pesanan 2 dibuat');

  // Batalkan pesanan 2
  await updatePesananStatus(order2.id, 'dibatalkan');
  const stockAfterCancel = (await getMenus()).find((m) => m.id === newMenu.id)!.sisa_porsi;
  assert(
    stockAfterCancel === stockBeforeCancelOrder,
    `Rollback kuota berhasil: sisa porsi kembali menjadi ${stockAfterCancel}`
  );

  // --- 5. UJI SERVICE LAPORAN HARIAN ---
  console.log('\n--- 5. Uji laporanService (Agregasi & Filter Pembatalan) ---');
  const laporan = await getLaporanHarian('2026-10-02');
  assert(laporan.tanggal === '2026-10-02', 'Laporan tanggal sesuai');
  // Order 1 (selesai, 4 porsi) harus masuk. Order 2 (dibatalkan, 3 porsi) TIDAK BOLEH masuk!
  const menuSummary = laporan.rincian_menu.find((m: any) => m.menu_id === newMenu.id);
  assert(menuSummary?.porsi_terjual === 4, 'Hanya pesanan sah yang dihitung (4 porsi)');
  const containsCancelled = laporan.daftar_pesanan.some((p: any) => p.status === 'dibatalkan');
  assert(!containsCancelled, 'Acceptance Criteria 2: Pesanan dibatalkan mutlak tidak dihitung di laporan');

  // Empty state check
  const emptyReport = await getLaporanHarian('2099-12-31');
  assert(emptyReport.total_porsi === 0 && emptyReport.total_uang_masuk === 0, 'Acceptance Criteria 3: Tanggal tanpa penjualan menghasilkan laporan kosong (Empty State)');

  // Cleanup test data
  await deleteMenu(newMenu.id);
  await deletePelanggan(uniqueWa);

  console.log(`\n=== HASIL: ${passedTests}/${totalTests} UJI LULUS ===`);
  if (passedTests === totalTests) {
    console.log('Status: FASE 2 BERHASIL DIVERIFIKASI SECARA LENGKAP!');
  } else {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Error saat menjalankan uji Fase 2:', err);
  process.exit(1);
});
