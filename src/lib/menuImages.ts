// Mapping foto menu katering Dapur Nia ala Sonokembang Prestige
export const MENU_IMAGE_MAP: Record<string, string> = {
  m1_ayam_bakar: '/images/menu/ayam_bakar.jpg',
  m2_rendang: '/images/menu/rendang.jpg',
  m3_ayam_lengkuas: '/images/menu/ayam_lengkuas.jpg',
  m4_sate_ayam: '/images/menu/sate_ayam.png',
  m5_cumi_cabe_ijo: '/images/menu/cumi.jpg',
  m6_soto_ayam: '/images/menu/soto.jpg',
  m7_gudeg: '/images/menu/gudeg.jpg',
  m8_es_teh: '/images/menu/es_teh.png',
};

export function getMenuImagePath(menuId: string, menuName: string): string | null {
  // Cek ID langsung
  if (MENU_IMAGE_MAP[menuId]) {
    return MENU_IMAGE_MAP[menuId];
  }

  // Cek pencocokan kata kunci nama
  const lower = menuName.toLowerCase();
  if (lower.includes('sate')) return '/images/menu/sate_ayam.png';
  if (lower.includes('ayam bakar')) return '/images/menu/ayam_bakar.jpg';
  if (lower.includes('rendang')) return '/images/menu/rendang.jpg';
  if (lower.includes('lengkuas')) return '/images/menu/ayam_lengkuas.jpg';
  if (lower.includes('cumi')) return '/images/menu/cumi.jpg';
  if (lower.includes('soto')) return '/images/menu/soto.jpg';
  if (lower.includes('gudeg')) return '/images/menu/gudeg.jpg';
  if (lower.includes('teh')) return '/images/menu/es_teh.png';

  return null;
}
