import { getPesananList } from './pesananService';
import type { LaporanHarian, LaporanItem } from '@/types';

export async function getLaporanHarian(tanggal: string): Promise<LaporanHarian> {
  const allPesanan = await getPesananList();

  // Filter tanggal & kecualikan status 'dibatalkan'
  const validPesanan = allPesanan.filter(
    (p) => p.tanggal === tanggal && p.status !== 'dibatalkan'
  );

  let totalUangMasuk = 0;
  let totalPorsi = 0;
  const menuMap: Record<string, LaporanItem> = {};

  for (const p of validPesanan) {
    totalUangMasuk += p.total;
    totalPorsi += p.jumlah_porsi;

    if (!menuMap[p.menu_id]) {
      menuMap[p.menu_id] = {
        menu_id: p.menu_id,
        nama_menu: p.nama_menu,
        porsi_terjual: 0,
        total_omzet: 0,
      };
    }

    menuMap[p.menu_id].porsi_terjual += p.jumlah_porsi;
    menuMap[p.menu_id].total_omzet += p.harga_satuan * p.jumlah_porsi;
  }

  return {
    tanggal,
    total_porsi: totalPorsi,
    total_uang_masuk: totalUangMasuk,
    rincian_menu: Object.values(menuMap),
    daftar_pesanan: validPesanan,
  };
}
