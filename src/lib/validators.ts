// Validator dan Penegak Aturan (Business Invariants & FSM)
// Sesuai dengan PRD App 2 Dapur Nia & Skema Firestore

import type { OrderStatus } from '@/types';

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  menunggu_bayar: ['dibayar', 'dibatalkan'],
  dibayar: ['diproses', 'dibatalkan'],
  diproses: ['selesai'],
  selesai: [],
  dibatalkan: [],
};

export const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  menunggu_bayar: { label: 'Menunggu Bayar', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  dibayar: { label: 'Sudah Dibayar', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  diproses: { label: 'Sedang Diproses', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  selesai: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  dibatalkan: { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validasi Modul Menu
 * Invariant 1: harga dan sisa_porsi tidak pernah bernilai negatif
 */
export function validateMenu(data: {
  nama: string;
  harga: number;
  sisa_porsi: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.nama || data.nama.trim().length === 0) {
    errors.nama = 'Nama menu wajib diisi.';
  } else if (data.nama.trim().length > 60) {
    errors.nama = 'Nama menu maksimal 60 karakter.';
  }

  if (data.harga === undefined || data.harga === null || isNaN(data.harga)) {
    errors.harga = 'Harga menu wajib diisi berupa angka.';
  } else if (data.harga < 0) {
    errors.harga = 'Harga menu tidak boleh bernilai negatif (minimal Rp0).';
  } else if (!Number.isInteger(data.harga)) {
    errors.harga = 'Harga harus berupa angka bulat rupiah.';
  }

  if (data.sisa_porsi === undefined || data.sisa_porsi === null || isNaN(data.sisa_porsi)) {
    errors.sisa_porsi = 'Sisa porsi wajib diisi berupa angka.';
  } else if (data.sisa_porsi < 0) {
    errors.sisa_porsi = 'Sisa porsi tidak boleh bernilai negatif (minimal 0).';
  } else if (!Number.isInteger(data.sisa_porsi)) {
    errors.sisa_porsi = 'Sisa porsi harus berupa angka bulat.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validasi Modul Pelanggan
 * - no_whatsapp diawali 08, panjang 10-13 angka
 * - nama 1-60 karakter
 * - alamat 1-200 karakter
 */
export function validatePelanggan(data: {
  nama: string;
  no_whatsapp: string;
  alamat: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.nama || data.nama.trim().length === 0) {
    errors.nama = 'Nama pelanggan wajib diisi.';
  } else if (data.nama.trim().length > 60) {
    errors.nama = 'Nama pelanggan maksimal 60 karakter.';
  }

  const cleanWa = data.no_whatsapp?.trim() || '';
  if (!cleanWa) {
    errors.no_whatsapp = 'Nomor WhatsApp wajib diisi.';
  } else if (!/^08\d{8,11}$/.test(cleanWa)) {
    errors.no_whatsapp = 'Nomor WhatsApp harus diawali 08 dan memiliki panjang 10 sampai 13 angka.';
  }

  if (!data.alamat || data.alamat.trim().length === 0) {
    errors.alamat = 'Alamat pengiriman wajib diisi.';
  } else if (data.alamat.trim().length > 200) {
    errors.alamat = 'Alamat pengiriman maksimal 200 karakter.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validasi Modul Pesanan
 * Invariant 2: jumlah_porsi minimal 1 dan tidak melebihi sisa_porsi menu
 * Invariant 3: total selalu sama dengan (harga_satuan * jumlah_porsi) + ongkir
 */
export function validatePesanan(data: {
  pelanggan_id: string;
  menu_id: string;
  harga_satuan: number;
  jumlah_porsi: number;
  sisa_porsi_menu: number;
  ongkir: number;
  total: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.pelanggan_id) {
    errors.pelanggan_id = 'Pelanggan wajib dipilih.';
  }

  if (!data.menu_id) {
    errors.menu_id = 'Menu katering wajib dipilih.';
  }

  if (data.jumlah_porsi === undefined || data.jumlah_porsi === null || isNaN(data.jumlah_porsi)) {
    errors.jumlah_porsi = 'Jumlah porsi wajib diisi.';
  } else if (!Number.isInteger(data.jumlah_porsi)) {
    errors.jumlah_porsi = 'Jumlah porsi harus berupa angka bulat.';
  } else if (data.jumlah_porsi < 1) {
    errors.jumlah_porsi = 'Jumlah porsi minimal 1 (tidak boleh 0 atau negatif).';
  } else if (data.jumlah_porsi > data.sisa_porsi_menu) {
    errors.jumlah_porsi = `Jumlah porsi (${data.jumlah_porsi}) melebihi sisa porsi yang tersedia (${data.sisa_porsi_menu}).`;
  }

  if (data.ongkir === undefined || data.ongkir === null || isNaN(data.ongkir)) {
    errors.ongkir = 'Ongkos kirim wajib diisi.';
  } else if (data.ongkir < 0) {
    errors.ongkir = 'Ongkos kirim tidak boleh bernilai negatif.';
  }

  // Hitung total ekspektasi
  const expectedTotal = (data.harga_satuan * data.jumlah_porsi) + data.ongkir;
  if (data.total !== expectedTotal) {
    errors.total = `Total tagihan tidak valid (dihitung Rp${expectedTotal.toLocaleString('id-ID')}, diterima Rp${data.total.toLocaleString('id-ID')}).`;
  } else if (data.total < 0) {
    errors.total = 'Total tagihan tidak boleh bernilai negatif.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validasi Transisi Status (FSM Guard)
 */
export function canTransitionStatus(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}
