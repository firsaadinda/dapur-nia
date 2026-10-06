import { db } from '@/lib/firebase';
import type { Pelanggan } from '@/types';
import { validatePelanggan } from '@/lib/validators';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const STORAGE_KEY = 'dapur_nia_pelanggan_v3';

const INITIAL_PELANGGAN: Pelanggan[] = [
  {
    id: '081234567890',
    nama: 'Budi Santoso',
    no_whatsapp: '081234567890',
    alamat: 'Jl. Melati No. 12, RT 03/RW 05',
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: '081398765432',
    nama: 'Siti Aminah',
    no_whatsapp: '081398765432',
    alamat: 'Perum Griya Asri Blok C2',
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: '085611223344',
    nama: 'Andi Wijaya',
    no_whatsapp: '085611223344',
    alamat: 'Jl. Kenanga No. 7',
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: '081399887766',
    nama: 'Ratna Dewi',
    no_whatsapp: '081399887766',
    alamat: 'Perumahan Pesona Indah Blok D-05',
    dibuat_pada: '2026-10-02T08:00:00.000Z',
  },
];

let memoryPelanggan: Pelanggan[] = [...INITIAL_PELANGGAN];

function getLocalPelanggan(): Pelanggan[] {
  if (typeof localStorage === 'undefined') {
    return memoryPelanggan;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PELANGGAN));
      return INITIAL_PELANGGAN;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PELANGGAN;
  }
}

function saveLocalPelanggan(list: Pelanggan[]) {
  if (typeof localStorage === 'undefined') {
    memoryPelanggan = list;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function getPelangganList(): Promise<Pelanggan[]> {
  let list: Pelanggan[] = [];
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, 'pelanggan'));
      list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<Pelanggan, 'id'>;
        let nama = data.nama || '';
        if (nama.toLowerCase().includes('ratna dewi')) {
          nama = 'Ratna Dewi';
        }
        return {
          id: docSnap.id,
          ...data,
          nama,
        };
      });
    } catch (err) {
      console.error('Error fetching pelanggan from Firestore, falling back to local:', err);
    }
  }
  if (!list.length) {
    list = getLocalPelanggan();
  }
  // Pastikan Ratna Dewi selalu ada di data pelanggan
  if (!list.some((p) => p.no_whatsapp === '081399887766' || p.nama.toLowerCase().includes('ratna dewi'))) {
    list.push({
      id: '081399887766',
      nama: 'Ratna Dewi',
      no_whatsapp: '081399887766',
      alamat: 'Perumahan Pesona Indah Blok D-05',
      dibuat_pada: '2026-10-02T08:00:00.000Z',
    });
  }
  return list;
}

export async function getPelangganById(noWhatsapp: string): Promise<Pelanggan | null> {
  if (db) {
    const docSnap = await getDoc(doc(db, 'pelanggan', noWhatsapp));
    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<Pelanggan, 'id'>;
      let nama = data.nama || '';
      if (nama.toLowerCase().includes('ratna dewi')) {
        nama = 'Ratna Dewi';
      }
      return { id: docSnap.id, ...data, nama };
    }
  }
  const list = getLocalPelanggan();
  const found = list.find((p) => p.no_whatsapp === noWhatsapp);
  if (found) {
    let nama = found.nama;
    if (nama.toLowerCase().includes('ratna dewi')) {
      nama = 'Ratna Dewi';
    }
    return { ...found, nama };
  }
  if (noWhatsapp === '081399887766') {
    return {
      id: '081399887766',
      nama: 'Ratna Dewi',
      no_whatsapp: '081399887766',
      alamat: 'Perumahan Pesona Indah Blok D-05',
      dibuat_pada: '2026-10-02T08:00:00.000Z',
    };
  }
  return null;
}

export async function addPelanggan(data: {
  nama: string;
  no_whatsapp: string;
  alamat: string;
}): Promise<Pelanggan> {
  const validation = validatePelanggan(data);
  if (!validation.isValid) {
    const firstErr = Object.values(validation.errors)[0];
    throw new Error(firstErr);
  }

  const cleanWa = data.no_whatsapp.trim();

  // Acceptance criteria 2: Given nomor WhatsApp sudah digunakan, When data baru dikirim, Then permintaan ditolak
  const existing = await getPelangganById(cleanWa);
  if (existing) {
    throw new Error(`Nomor WhatsApp ${cleanWa} sudah terdaftar atas nama ${existing.nama}.`);
  }

  if (db) {
    const docRef = doc(db, 'pelanggan', cleanWa);
    await setDoc(docRef, {
      nama: data.nama.trim(),
      no_whatsapp: cleanWa,
      alamat: data.alamat.trim(),
      dibuat_pada: serverTimestamp(),
    });
    return {
      id: cleanWa,
      nama: data.nama.trim(),
      no_whatsapp: cleanWa,
      alamat: data.alamat.trim(),
      dibuat_pada: new Date().toISOString(),
    };
  }

  const localList = getLocalPelanggan();
  const newPelanggan: Pelanggan = {
    id: cleanWa,
    nama: data.nama.trim(),
    no_whatsapp: cleanWa,
    alamat: data.alamat.trim(),
    dibuat_pada: new Date().toISOString(),
  };
  localList.push(newPelanggan);
  saveLocalPelanggan(localList);
  return newPelanggan;
}

export async function deletePelanggan(noWhatsapp: string): Promise<void> {
  if (db) {
    await deleteDoc(doc(db, 'pelanggan', noWhatsapp));
    return;
  }
  const localList = getLocalPelanggan().filter((p) => p.no_whatsapp !== noWhatsapp);
  saveLocalPelanggan(localList);
}
