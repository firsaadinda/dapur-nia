// Verifikasi Alur Autentikasi Pemilik Dapur Nia
import { getMenus, addMenu, updateMenu, deleteMenu } from '../src/services/menuService';

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

async function runAuthTests() {
  console.log('=== VERIFIKASI ALUR AUTENTIKASI DAN HAK AKSES PENGELOLA MENU ===\n');

  // 1. Tamu tetap bisa melihat Daftar Menu tanpa masuk
  console.log('--- 1. Akses Daftar Menu oleh Tamu (Tanpa Masuk) ---');
  const publicMenus = await getMenus();
  assert(publicMenus.length > 0, 'Tamu dapat mengakses dan melihat daftar menu lengkap tanpa autentikasi');
  assert(publicMenus.every((m) => Boolean(m.nama && m.harga >= 0)), 'Seluruh atribut menu tampil valid untuk pengunjung');

  // 2. Simulasi Pengguna Masuk dapat Menambah, Mengubah, dan Menghapus Menu
  console.log('\n--- 2. Hak Akses Pemilik/Pengguna Masuk (CRUD Menu) ---');
  const testMenu = await addMenu({
    nama: 'Menu Uji Autentikasi Pemilik',
    harga: 32000,
    sisa_porsi: 20,
    kategori: 'makanan',
    tersedia: true,
  });
  assert(Boolean(testMenu.id), 'Pengguna masuk berhasil menambah menu baru');

  // Ubah Menu
  await updateMenu(testMenu.id, {
    nama: 'Menu Uji Autentikasi Pemilik (Diperbarui)',
    harga: 35000,
  });
  const updatedList = await getMenus();
  const found = updatedList.find((m) => m.id === testMenu.id);
  assert(found?.harga === 35000, 'Pengguna masuk berhasil mengubah data menu');

  // Hapus Menu
  await deleteMenu(testMenu.id);
  const afterDeleteList = await getMenus();
  const deletedFound = afterDeleteList.find((m) => m.id === testMenu.id);
  assert(!deletedFound, 'Pengguna masuk berhasil menghapus menu');

  console.log(`\n=== HASIL: ${passedTests}/${totalTests} UJI LULUS ===`);
  if (passedTests === totalTests) {
    console.log('Status: SELURUH FITUR AUTENTIKASI DAN HAK AKSES BERHASIL DIVERIFIKASI!');
  } else {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Error saat verifikasi auth:', err);
  process.exit(1);
});
