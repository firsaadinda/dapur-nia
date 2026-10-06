import { useState, useEffect } from 'react';
import type { Menu } from '@/types';
import { getMenus } from '@/services/menuService';
import { getPelangganById, addPelanggan } from '@/services/pelangganService';
import { createPesanan } from '@/services/pesananService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  MessageCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { getMenuImagePath } from '@/lib/menuImages';
import { toast } from 'sonner';

interface DaftarMenuPublicProps {
  onGoToKelolaMenu: () => void;
  isLoggedIn?: boolean;
}

export function DaftarMenuPublic({ onGoToKelolaMenu, isLoggedIn }: DaftarMenuPublicProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'semua' | 'makanan' | 'minuman' | 'dessert'>('semua');

  // State untuk Dialog Pemesanan Tamu
  const [selectedMenuForOrder, setSelectedMenuForOrder] = useState<Menu | null>(null);
  const [orderJumlahPorsi, setOrderJumlahPorsi] = useState<number>(1);
  const [customerNama, setCustomerNama] = useState('');
  const [customerWa, setCustomerWa] = useState('');
  const [customerAlamat, setCustomerAlamat] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMenus();
      setMenus(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar menu dari basis data');
      toast.error('Gagal memuat daftar menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const filteredMenus = menus.filter(
    (item) => activeCategory === 'semua' || item.kategori === activeCategory
  );

  const handleOpenOrder = (menu: Menu) => {
    setSelectedMenuForOrder(menu);
    setOrderJumlahPorsi(1);
    setCustomerNama('');
    setCustomerWa('');
    setCustomerAlamat('');
  };

  const handleCloseOrder = () => {
    setSelectedMenuForOrder(null);
    setOrderSubmitting(false);
  };

  const handleKirimPesanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuForOrder) return;

    if (!customerNama.trim()) {
      toast.error('Silakan isi nama pemesan');
      return;
    }
    const cleanWa = customerWa.trim().replace(/[^0-9]/g, '');
    if (!cleanWa || cleanWa.length < 10 || cleanWa.length > 15) {
      toast.error('Nomor WhatsApp harus valid (10-15 digit)');
      return;
    }
    if (!customerAlamat.trim()) {
      toast.error('Silakan isi alamat pengiriman');
      return;
    }
    if (orderJumlahPorsi < 1 || orderJumlahPorsi > selectedMenuForOrder.sisa_porsi) {
      toast.error(`Jumlah porsi harus antara 1 dan sisa kuota (${selectedMenuForOrder.sisa_porsi})`);
      return;
    }

    setOrderSubmitting(true);
    try {
      // 1. Pastikan pelanggan terdaftar di sistem pelanggan
      const existingPelanggan = await getPelangganById(cleanWa);
      if (!existingPelanggan) {
        await addPelanggan({
          nama: customerNama.trim(),
          no_whatsapp: cleanWa,
          alamat: customerAlamat.trim(),
        });
      }

      // 2. Buat pesanan baru
      const newOrder = await createPesanan({
        pelanggan_id: cleanWa,
        menu_id: selectedMenuForOrder.id,
        jumlah_porsi: orderJumlahPorsi,
        ongkir: 0,
      });

      toast.success(
        `Pesanan #${newOrder.id} berhasil dikirim! Tim Dapur Nia akan segera memprosesnya.`
      );
      handleCloseOrder();
      await fetchMenus();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses pesanan.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleOrderViaWhatsApp = () => {
    if (!selectedMenuForOrder) return;
    const totalHarga = selectedMenuForOrder.harga * orderJumlahPorsi;
    const nama = customerNama.trim() || 'Tamu Pelanggan';
    const alamat = customerAlamat.trim() || 'Alamat dikonfirmasi via chat';

    const text = `Halo Dapur Nia, saya ingin memesan katering:\n\n- *Menu*: ${selectedMenuForOrder.nama}\n- *Jumlah*: ${orderJumlahPorsi} porsi\n- *Total*: Rp ${totalHarga.toLocaleString('id-ID')}\n- *Nama*: ${nama}\n- *Alamat Kirim*: ${alamat}\n\nMohon konfirmasi ketersediaan dan nomor rekening/QRIS untuk pembayaran. Terima kasih!`;
    const url = `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#36491C] to-[#4D642D] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          {/* Badge tanpa emoji sesuai Lampiran 2 */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-[#FCF9F2] border border-white/20">
            <span>Katering Rumahan Lezat & Bergizi</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-white leading-tight">
            Daftar Menu Harian Dapur Nia
          </h1>
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
            Pilihan hidangan nusantara autentik, aneka minuman segar, dan hidangan penutup istimewa yang dimasak segar setiap hari untuk keluarga Anda.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              onClick={onGoToKelolaMenu}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white text-white hover:text-[#36491C] border-white/30 text-xs font-semibold h-9 rounded-xl backdrop-blur-sm gap-2 transition-all cursor-pointer w-fit"
            >
              <ChefHat className="h-4 w-4" />
              {isLoggedIn ? 'Buka Kelola Menu' : 'Kelola Menu (Khusus Pemilik)'}
            </Button>
            <span className="text-xs text-white/85 leading-relaxed">
              Tamu dapat melihat seluruh menu dan memesan tanpa perlu masuk. (Tamu tidak dapat mengakses halaman Kelola Menu, Pelanggan, Pesanan, dan Laporan).
            </span>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none select-none">
          <UtensilsCrossed className="w-64 h-64 text-white transform rotate-12 translate-x-12" />
        </div>
      </div>

      {/* Top Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-xs">
        <div>
          <h2 className="text-lg font-bold font-heading text-[#36491C] tracking-tight">
            Katalog Menu
          </h2>
          <p className="text-xs text-[#5F6B4F]">
            Menampilkan <strong>{filteredMenus.length}</strong> dari total <strong>{menus.length}</strong> menu katering
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['semua', 'makanan', 'minuman', 'dessert'] as const).map((cat) => (
            <Button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className={`text-xs h-8 px-3 rounded-lg font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-[#C2410C] hover:bg-[#9A3412] text-white border-none shadow-xs'
                  : 'text-[#5F6B4F] border-[#E0E2D8] hover:border-[#C2410C] hover:text-[#C2410C] bg-white'
              }`}
              size="sm"
            >
              {cat === 'semua' ? 'Semua Menu' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse p-4 bg-white/70 backdrop-blur-md border-white/60 rounded-2xl">
              <div className="aspect-[4/3] bg-[#E0E2D8] rounded-xl mb-3"></div>
              <div className="h-4 bg-[#D7DFC9] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[#D7DFC9] rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-[#D7DFC9] rounded w-1/3"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50/90 backdrop-blur-md border border-red-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h3 className="font-heading font-bold text-red-900">Gagal Memuat Menu</h3>
          <p className="text-xs text-red-600">{error}</p>
          <Button onClick={fetchMenus} className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs h-9">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Empty state tanpa emoji */}
      {!loading && !error && filteredMenus.length === 0 && (
        <div className="bg-white/70 backdrop-blur-md border border-dashed border-[#E0E2D8] rounded-2xl p-14 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F7EF] flex items-center justify-center mx-auto text-[#74835F]">
            <UtensilsCrossed className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#1C2311]">Tidak Ada Menu Ditemukan</h3>
          <p className="text-xs text-[#5F6B4F]">Belum ada sajian pada kategori ini.</p>
        </div>
      )}

      {/* Public Menu Cards Grid with Direct Guest Order Button */}
      {!loading && !error && filteredMenus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMenus.map((item) => {
            const isHabis = item.sisa_porsi <= 0;
            const imgSrc = getMenuImagePath(item.id, item.nama);

            return (
              <Card
                key={item.id}
                className="bg-white/90 backdrop-blur-md border border-[#E0E2D8] hover:border-[#4D642D] rounded-2xl shadow-none outline-none ring-0 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-[4/3] w-full bg-[#F4F7EF] overflow-hidden flex items-center justify-center">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={item.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#9AA787] space-y-1.5 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-[#D7DFC9] flex items-center justify-center text-[#74835F]">
                          <UtensilsCrossed className="h-5 w-5 stroke-[1.75]" />
                        </div>
                        <span className="text-[11px] font-medium tracking-wide text-[#74835F]">Dapur Nia Catering</span>
                      </div>
                    )}

                    {/* Floating status badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isHabis ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#DC2626] text-white shadow-xs">
                          Habis
                        </span>
                      ) : (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-white/95 backdrop-blur-xs text-[#15803D] border border-[#BBF7D0] shadow-xs">
                          sisa {item.sisa_porsi} porsi
                        </span>
                      )}
                    </div>

                    {/* Category pill */}
                    {item.kategori && (
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1C2311]/70 backdrop-blur-xs text-white">
                          {item.kategori}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content & Details */}
                  <CardHeader className="p-4 pb-1">
                    <CardTitle className="text-base font-bold font-heading leading-snug line-clamp-2 text-[#C2410C]">
                      {item.nama}
                    </CardTitle>
                    <div className="text-xl font-bold font-heading text-[#4D642D] mt-2 tracking-tight">
                      Rp {item.harga.toLocaleString('id-ID')}
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-1 text-xs text-[#5F6B4F] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-medium">
                        {item.tersedia && !isHabis ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
                            <span className="text-[#15803D]">Siap Dipesan</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-stone-400" />
                            <span className="text-stone-500">Tidak Tersedia</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-[#5F6B4F]">
                        Kuota: <strong className={isHabis ? 'text-[#DC2626]' : 'text-[#1C2311]'}>{item.sisa_porsi}</strong>
                      </span>
                    </div>

                    {/* Tombol Pesan Khusus Tamu */}
                    <Button
                      onClick={() => handleOpenOrder(item)}
                      disabled={isHabis || !item.tersedia}
                      size="sm"
                      className={`w-full h-8 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isHabis || !item.tersedia
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : 'bg-[#4D642D] hover:bg-[#36491C] text-white shadow-xs'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                      {isHabis ? 'Porsi Habis' : 'Pesan Sekarang'}
                    </Button>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Pemesanan Katering untuk Tamu */}
      <Dialog open={selectedMenuForOrder !== null} onOpenChange={(open) => !open && handleCloseOrder()}>
        <DialogContent className="sm:max-w-md bg-white border-[#E0E2D8] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-[#1C2311]">
              Pesan Menu Katering
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F6B4F]">
              Isi data pengiriman Anda untuk memesan menu dari Dapur Nia.
            </DialogDescription>
          </DialogHeader>

          {selectedMenuForOrder && (
            <form onSubmit={handleKirimPesanan} className="space-y-4 pt-2">
              {/* Box Rincian Menu */}
              <div className="p-3 rounded-xl bg-[#F4F7EF] border border-[#D7DFC9] flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#1C2311]">
                    {selectedMenuForOrder.nama}
                  </h4>
                  <p className="text-xs text-[#4D642D] font-bold">
                    Rp {selectedMenuForOrder.harga.toLocaleString('id-ID')} / porsi
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5F6B4F] block">Sisa Kuota</span>
                  <strong className="text-xs text-[#15803D] font-bold">
                    {selectedMenuForOrder.sisa_porsi} porsi
                  </strong>
                </div>
              </div>

              {/* Pemilihan Jumlah Porsi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1C2311]">Jumlah Porsi</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg border-[#E0E2D8]"
                    disabled={orderJumlahPorsi <= 1}
                    onClick={() => setOrderJumlahPorsi((p) => Math.max(1, p - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-heading font-bold text-base w-12 text-center text-[#1C2311]">
                    {orderJumlahPorsi}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg border-[#E0E2D8]"
                    disabled={orderJumlahPorsi >= selectedMenuForOrder.sisa_porsi}
                    onClick={() =>
                      setOrderJumlahPorsi((p) =>
                        Math.min(selectedMenuForOrder.sisa_porsi, p + 1)
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-[#5F6B4F] ml-auto">
                    Total: <strong className="text-sm font-bold text-[#C2410C]">Rp {(selectedMenuForOrder.harga * orderJumlahPorsi).toLocaleString('id-ID')}</strong>
                  </span>
                </div>
              </div>

              {/* Data Pelanggan Tamu */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="guest-nama" className="text-xs font-bold text-[#1C2311]">
                    Nama Pemesan
                  </Label>
                  <Input
                    id="guest-nama"
                    placeholder="Contoh: Ibu Ani"
                    value={customerNama}
                    onChange={(e) => setCustomerNama(e.target.value)}
                    required
                    className="h-10 text-xs border-[#E0E2D8]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="guest-wa" className="text-xs font-bold text-[#1C2311]">
                    Nomor WhatsApp
                  </Label>
                  <Input
                    id="guest-wa"
                    placeholder="Contoh: 08123456789"
                    value={customerWa}
                    onChange={(e) => setCustomerWa(e.target.value)}
                    required
                    className="h-10 text-xs border-[#E0E2D8]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="guest-alamat" className="text-xs font-bold text-[#1C2311]">
                    Alamat Pengiriman
                  </Label>
                  <Input
                    id="guest-alamat"
                    placeholder="Contoh: Jl. Melati No. 12, RT 02/RW 03"
                    value={customerAlamat}
                    onChange={(e) => setCustomerAlamat(e.target.value)}
                    required
                    className="h-10 text-xs border-[#E0E2D8]"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOrderViaWhatsApp}
                  className="w-full sm:w-auto flex-1 h-10 text-xs font-semibold border-[#25D366] text-[#128C7E] hover:bg-[#DCFCE7] rounded-xl gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Pesan via WhatsApp
                </Button>
                <Button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full sm:w-auto flex-1 h-10 text-xs font-bold bg-[#4D642D] hover:bg-[#36491C] text-white rounded-xl gap-1.5 shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {orderSubmitting ? 'Memproses...' : 'Kirim Pesanan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
