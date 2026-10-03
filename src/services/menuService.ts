import { db } from '@/lib/firebase';
import type { Menu } from '@/types';
import { validateMenu } from '@/lib/validators';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

const STORAGE_KEY = 'dapur_nia_menu_v2';

const INITIAL_MENUS: Menu[] = [
  {
    id: 'm1_ayam_bakar',
    nama: 'Nasi Ayam Bakar Madu',
    harga: 25000,
    sisa_porsi: 30,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm2_rendang',
    nama: 'Nasi Rendang Daging Sapi',
    harga: 35000,
    sisa_porsi: 15,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm3_ayam_lengkuas',
    nama: 'Nasi Ayam Goreng Lengkuas',
    harga: 24000,
    sisa_porsi: 25,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm4_sate_ayam',
    nama: 'Sate Ayam Madura + Lontong',
    harga: 25000,
    sisa_porsi: 20,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm5_cumi_cabe_ijo',
    nama: 'Nasi Cumi Cabai Hijau',
    harga: 28000,
    sisa_porsi: 12,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm6_soto_ayam',
    nama: 'Soto Ayam Lamongan Komplit',
    harga: 20000,
    sisa_porsi: 18,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm7_gudeg',
    nama: 'Nasi Gudeg Komplit Krecek',
    harga: 22000,
    sisa_porsi: 0, // Habis untuk pengujian kuota 0
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
  {
    id: 'm8_es_teh',
    nama: 'Es Teh Manis Melati Jumbo',
    harga: 5000,
    sisa_porsi: 50,
    tersedia: true,
    dibuat_pada: new Date().toISOString(),
  },
];

let memoryMenus: Menu[] = [...INITIAL_MENUS];

function getLocalMenus(): Menu[] {
  if (typeof localStorage === 'undefined') {
    return memoryMenus;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MENUS));
      return INITIAL_MENUS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length <= 3) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MENUS));
      return INITIAL_MENUS;
    }
    return parsed;
  } catch {
    return INITIAL_MENUS;
  }
}

export function resetToDefaultMenus(): Menu[] {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MENUS));
  }
  memoryMenus = [...INITIAL_MENUS];
  return INITIAL_MENUS;
}

function saveLocalMenus(menus: Menu[]) {
  if (typeof localStorage === 'undefined') {
    memoryMenus = menus;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
}

export async function getMenus(): Promise<Menu[]> {
  if (db) {
    try {
      const q = query(collection(db, 'menu'), orderBy('nama', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Menu, 'id'>),
      }));
    } catch (err) {
      console.error('Error fetching menus from Firestore, falling back to local:', err);
    }
  }
  return getLocalMenus();
}

export async function addMenu(data: {
  nama: string;
  harga: number;
  sisa_porsi: number;
  tersedia: boolean;
}): Promise<Menu> {
  const validation = validateMenu(data);
  if (!validation.isValid) {
    const firstErr = Object.values(validation.errors)[0];
    throw new Error(firstErr);
  }

  if (db) {
    const docRef = await addDoc(collection(db, 'menu'), {
      nama: data.nama.trim(),
      harga: Number(data.harga),
      sisa_porsi: Number(data.sisa_porsi),
      tersedia: Boolean(data.tersedia),
      dibuat_pada: serverTimestamp(),
    });
    return {
      id: docRef.id,
      nama: data.nama.trim(),
      harga: Number(data.harga),
      sisa_porsi: Number(data.sisa_porsi),
      tersedia: Boolean(data.tersedia),
      dibuat_pada: new Date().toISOString(),
    };
  }

  const localList = getLocalMenus();
  const newMenu: Menu = {
    id: `menu_${Date.now()}`,
    nama: data.nama.trim(),
    harga: Number(data.harga),
    sisa_porsi: Number(data.sisa_porsi),
    tersedia: Boolean(data.tersedia),
    dibuat_pada: new Date().toISOString(),
  };
  localList.push(newMenu);
  saveLocalMenus(localList);
  return newMenu;
}

export async function updateMenu(
  id: string,
  data: Partial<Omit<Menu, 'id' | 'dibuat_pada'>>
): Promise<void> {
  if (data.nama !== undefined || data.harga !== undefined || data.sisa_porsi !== undefined) {
    const existing = (await getMenus()).find((m) => m.id === id);
    if (!existing) throw new Error('Menu tidak ditemukan.');
    const validation = validateMenu({
      nama: data.nama ?? existing.nama,
      harga: data.harga ?? existing.harga,
      sisa_porsi: data.sisa_porsi ?? existing.sisa_porsi,
    });
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      throw new Error(firstErr);
    }
  }

  if (db) {
    const docRef = doc(db, 'menu', id);
    await updateDoc(docRef, { ...data });
    return;
  }

  const localList = getLocalMenus();
  const index = localList.findIndex((m) => m.id === id);
  if (index !== -1) {
    localList[index] = { ...localList[index], ...data };
    saveLocalMenus(localList);
  }
}

export async function deleteMenu(id: string): Promise<void> {
  if (db) {
    await deleteDoc(doc(db, 'menu', id));
    return;
  }
  const localList = getLocalMenus().filter((m) => m.id !== id);
  saveLocalMenus(localList);
}
