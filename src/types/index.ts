// Skema Data Cloud Firestore App 2 Dapur Nia
// Sesuai dengan spesifikasi Skema-Firestore-Dapur-Nia.md

export type OrderStatus =
  | 'menunggu_bayar'
  | 'dibayar'
  | 'diproses'
  | 'selesai'
  | 'dibatalkan';

export interface Menu {
  id: string;
  nama: string; // 1 - 60 karakter
  harga: number; // Angka bulat rupiah, >= 0
  sisa_porsi: number; // Angka bulat, >= 0. Jika 0 tampil sebagai "Habis"
  tersedia: boolean; // true: tampil di daftar, false: disembunyikan
  dibuat_pada?: any; // Firestore serverTimestamp atau Date / string
}

export interface Pelanggan {
  id: string; // Nomor WhatsApp (sama dengan no_whatsapp)
  nama: string; // 1 - 60 karakter
  no_whatsapp: string; // Diawali 08, total 10 - 13 angka
  alamat: string; // 1 - 200 karakter
  dibuat_pada?: any;
}

export interface Pesanan {
  id: string;
  pelanggan_id: string; // ID dokumen pelanggan (nomor WhatsApp)
  nama_pelanggan: string; // Snapshot nama pelanggan saat memesan
  alamat_kirim: string; // Snapshot alamat kirim saat memesan
  menu_id: string; // ID dokumen menu yang dipesan
  nama_menu: string; // Snapshot nama menu saat memesan
  harga_satuan: number; // Snapshot harga menu saat memesan
  jumlah_porsi: number; // Angka bulat >= 1 dan <= sisa_porsi
  ongkir: number; // Ongkos kirim, >= 0
  total: number; // Invariant: (harga_satuan * jumlah_porsi) + ongkir
  status: OrderStatus;
  bukti_bayar?: string; // Tautan gambar atau catatan transfer
  tanggal: string; // Format YYYY-MM-DD
  dibuat_pada?: any;
}

export interface LaporanItem {
  menu_id: string;
  nama_menu: string;
  porsi_terjual: number;
  total_omzet: number;
}

export interface LaporanHarian {
  tanggal: string;
  total_porsi: number;
  total_uang_masuk: number;
  rincian_menu: LaporanItem[];
  daftar_pesanan: Pesanan[];
}
