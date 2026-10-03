import { useState, useEffect } from 'react';
import type { Menu } from '@/types';
import { getMenus, addMenu, updateMenu, deleteMenu, resetToDefaultMenus } from '@/services/menuService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, RotateCcw, UtensilsCrossed } from 'lucide-react';
import { getMenuImagePath } from '@/lib/menuImages';
import { toast } from 'sonner';

export function MenuModule({ onMenuChanged }: { onMenuChanged?: () => void }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState<number | ''>('');
  const [sisaPorsi, setSisaPorsi] = useState<number | ''>('');
  const [tersedia, setTersedia] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const openAddDialog = () => {
    setEditingMenu(null);
    setNama('');
    setHarga('');
    setSisaPorsi('');
    setTersedia(true);
    setDialogOpen(true);
  };

  const openEditDialog = (menu: Menu) => {
    setEditingMenu(menu);
    setNama(menu.nama);
    setHarga(menu.harga);
    setSisaPorsi(menu.sisa_porsi);
    setTersedia(menu.tersedia);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, {
          nama,
          harga: Number(harga),
          sisa_porsi: Number(sisaPorsi),
          tersedia,
        });
        toast.success(`Menu diperbarui: ${nama}`);
      } else {
        await addMenu({
          nama,
          harga: Number(harga),
          sisa_porsi: Number(sisaPorsi),
          tersedia,
        });
        toast.success(`Menu tersimpan: ${nama}`);
      }

      setDialogOpen(false);
      await fetchMenus();
      onMenuChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus ${name}? Menu ini hilang permanen dari daftar.`)) return;
    try {
      await deleteMenu(id);
      toast.success('Menu dihapus');
      await fetchMenus();
      onMenuChanged?.();
    } catch {
      toast.error('Gagal menghapus menu');
    }
  };

  const handleResetMenus = async () => {
    resetToDefaultMenus();
    await fetchMenus();
    onMenuChanged?.();
    toast.success('Daftar menu katering lengkap berhasil dimuat ulang!');
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#36491C] tracking-tight">
            Menu Harian
          </h2>
          <p className="text-xs text-[#5F6B4F]">
            Total: <strong>{menus.length}</strong> menu katering terdaftar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMenus}
            className="text-xs h-9 border-[#E0E2D8] text-[#5F6B4F] hover:text-[#4D642D] hover:border-[#4D642D] gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Muat Ulang
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-[#4D642D] hover:bg-[#36491C] text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Tambah Menu
          </Button>
        </div>
      </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse p-4 bg-white/70 backdrop-blur-md border-white/60 rounded-xl">
                <div className="h-4 bg-[#D7DFC9] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#D7DFC9] rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-[#D7DFC9] rounded w-full"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50/90 backdrop-blur-md border border-red-200/50 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-heading font-bold text-red-900">Gagal Memuat Menu</h3>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchMenus} className="bg-red-600 text-white mt-4 rounded-lg">Coba Lagi</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && menus.length === 0 && (
          <div className="bg-white/70 backdrop-blur-md border border-dashed border-[#E0E2D8] rounded-xl p-16 text-center space-y-4">
            <div className="text-5xl">🍽️</div>
            <h3 className="font-heading font-black text-2xl text-[#1C2311]">Belum Ada Menu</h3>
            <p className="text-[#5F6B4F]">Mulai tambahkan menu katering di atas.</p>
          </div>
        )}

        {/* Original Menu Cards Grid */}
        {!loading && !error && menus.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menus.map((item) => {
              const isHabis = item.sisa_porsi <= 0;
              const imgSrc = getMenuImagePath(item.id, item.nama);

              return (
                <Card
                  key={item.id}
                  className="bg-white/85 backdrop-blur-md border border-[#C2410C] rounded-2xl shadow-none outline-none ring-0 hover:shadow-none hover:border-[#9A3412] transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Image container */}
                    <div className="relative aspect-[4/3] w-full bg-[#F4F7EF] overflow-hidden flex items-center justify-center">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={item.nama}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#9AA787] space-y-1.5 p-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-[#D7DFC9] flex items-center justify-center text-[#74835F]">
                            <UtensilsCrossed className="h-5 w-5 stroke-[1.75]" />
                          </div>
                          <span className="text-[11px] font-medium tracking-wide text-[#74835F]">Dapur Nia Catering</span>
                        </div>
                      )}

                      {/* Floating status pill */}
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

                    <CardContent className="px-4 pb-3 text-xs text-[#5F6B4F] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        {item.tersedia ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
                            Tersedia
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-stone-400" />
                            Nonaktif
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-[#5F6B4F]">
                        Kuota: <strong className={isHabis ? 'text-[#DC2626]' : 'text-[#1C2311]'}>{item.sisa_porsi}</strong>
                      </span>
                    </CardContent>
                  </div>

                  <CardFooter className="px-4 py-3 bg-[#FCF9F2]/40 border-t border-[#E0E2D8] flex justify-end gap-2 rounded-b-xl">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-4 text-xs border-[#E0E2D8] text-[#1C2311] hover:border-[#4D642D] rounded-full bg-white shadow-xs"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5 text-[#4D642D]" />
                      Ubah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-4 text-xs text-[#DC2626] hover:bg-[#FEE2E2] rounded-full"
                      onClick={() => handleDelete(item.id, item.nama)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Hapus
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

      {/* Modal Dialog Form Tambah / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-[#E0E2D8] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-[#1C2311]">
              {editingMenu ? 'Ubah Menu' : 'Tambah Menu Baru'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5F6B4F]">
              Harga satuan dan sisa porsi tidak boleh bernilai negatif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nama-m" className="text-xs font-bold text-[#1C2311]">
                Nama Menu
              </Label>
              <Input
                id="nama-m"
                placeholder="Contoh: Nasi Rendang Sapi Komplit"
                value={nama}
                maxLength={60}
                className="h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                onChange={(e) => setNama(e.target.value)}
                required
              />
              <div className="flex justify-between text-[11px] text-[#5F6B4F]">
                <span>1 - 60 karakter</span>
                <span>{nama.length}/60</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="harga-m" className="text-xs font-bold text-[#1C2311]">
                  Harga (Rp)
                </Label>
                <Input
                  id="harga-m"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="25000"
                  className="h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                  value={harga}
                  onChange={(e) => setHarga(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="porsi-m" className="text-xs font-bold text-[#1C2311]">
                  Kuota
                </Label>
                <Input
                  id="porsi-m"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="30"
                  className="h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                  value={sisaPorsi}
                  onChange={(e) => setSisaPorsi(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="tersedia-m"
                type="checkbox"
                checked={tersedia}
                onChange={(e) => setTersedia(e.target.checked)}
                className="h-4 w-4 rounded border-[#E0E2D8] text-[#4D642D] focus:ring-[#4D642D] accent-[#4D642D]"
              />
              <Label htmlFor="tersedia-m" className="text-sm cursor-pointer text-[#1C2311]">
                Tampilkan di katalog menu aktif
              </Label>
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#E0E2D8] text-[#1C2311] flex-1 h-11 font-bold"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#EF4D21] hover:bg-[#D44018] text-white flex-1 h-11 font-bold"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
