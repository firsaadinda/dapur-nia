import { useState, useEffect } from 'react';
import type { Menu } from '@/types';
import { getMenus, addMenu, updateMenu, deleteMenu, resetToDefaultMenus } from '@/services/menuService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EADFD4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#1F1A17] tracking-tight">
            Menu Harian
          </h2>
          <p className="text-xs text-[#6B5E55]">
            Total: <strong>{menus.length}</strong> menu katering terdaftar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMenus}
            className="text-xs h-9 border-[#EADFD4] text-[#6B5E55] hover:text-[#C2410C] hover:border-[#C2410C] gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Muat Menu Lengkap
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Tambah Menu
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-4 bg-white border-[#EADFD4] rounded-xl">
              <div className="h-4 bg-[#F2EAE3] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[#F2EAE3] rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-[#F2EAE3] rounded w-full"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-red-900">Gagal Memuat Menu</h3>
            <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <Button
            size="sm"
            onClick={fetchMenus}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-4 rounded-lg"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && menus.length === 0 && (
        <div className="bg-white border border-dashed border-[#EADFD4] rounded-xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#C2410C] mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h3 className="font-heading font-bold text-base text-[#1F1A17]">
            Belum Ada Menu
          </h3>
          <p className="text-xs text-[#6B5E55] max-w-sm mx-auto">
            Mulai tambahkan menu katering harian baru dengan menekan tombol Tambah Menu di atas.
          </p>
        </div>
      )}

      {/* Menu Cards Grid */}
      {!loading && !error && menus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {menus.map((item) => {
            const isHabis = item.sisa_porsi <= 0;
            return (
              <Card
                key={item.id}
                className="bg-white border border-[#EADFD4] rounded-xl shadow-xs hover:border-[#C2410C] transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold font-heading leading-tight text-[#1F1A17]">
                        {item.nama}
                      </CardTitle>
                      {isHabis ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] shrink-0">
                          Habis
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] shrink-0">
                          sisa {item.sisa_porsi}
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold font-heading text-[#C2410C] mt-1">
                      Rp {item.harga.toLocaleString('id-ID')}
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-3 text-xs text-[#6B5E55] flex items-center justify-between">
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
                    <span className="text-[11px] text-[#6B5E55]">
                      Kuota: <strong className={isHabis ? 'text-[#DC2626]' : 'text-[#1F1A17]'}>{item.sisa_porsi} porsi</strong>
                    </span>
                  </CardContent>
                </div>

                <CardFooter className="px-4 py-2 bg-[#FFF8F1]/40 border-t border-[#EADFD4] flex justify-end gap-2 rounded-b-xl">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-[#EADFD4] text-[#1F1A17] hover:border-[#C2410C]"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-3 w-3 mr-1 text-[#C2410C]" />
                    Ubah
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-[#DC2626] hover:bg-[#FEE2E2]"
                    onClick={() => handleDelete(item.id, item.nama)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
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
        <DialogContent className="sm:max-w-md bg-white border-[#EADFD4] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-[#1F1A17]">
              {editingMenu ? 'Ubah Menu' : 'Tambah Menu Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B5E55]">
              Harga satuan dan sisa porsi tidak boleh bernilai negatif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="nama-m" className="text-xs font-bold text-[#1F1A17]">
                Nama Menu
              </Label>
              <Input
                id="nama-m"
                placeholder="Contoh: Nasi Rendang Sapi Komplit"
                value={nama}
                maxLength={60}
                className="h-10 border-[#EADFD4]"
                onChange={(e) => setNama(e.target.value)}
                required
              />
              <div className="flex justify-between text-[11px] text-[#6B5E55]">
                <span>1 - 60 karakter</span>
                <span>{nama.length}/60</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="harga-m" className="text-xs font-bold text-[#1F1A17]">
                  Harga Satuan (Rp)
                </Label>
                <Input
                  id="harga-m"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="25000"
                  className="h-10 border-[#EADFD4]"
                  value={harga}
                  onChange={(e) => setHarga(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="porsi-m" className="text-xs font-bold text-[#1F1A17]">
                  Sisa Porsi (Kuota)
                </Label>
                <Input
                  id="porsi-m"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="30"
                  className="h-10 border-[#EADFD4]"
                  value={sisaPorsi}
                  onChange={(e) => setSisaPorsi(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="tersedia-m"
                type="checkbox"
                checked={tersedia}
                onChange={(e) => setTersedia(e.target.checked)}
                className="h-4 w-4 rounded border-[#EADFD4] text-[#C2410C] focus:ring-[#C2410C] accent-[#C2410C]"
              />
              <Label htmlFor="tersedia-m" className="text-xs cursor-pointer text-[#1F1A17]">
                Tampilkan di katalog menu aktif
              </Label>
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#EADFD4] text-[#1F1A17] flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold flex-1"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Menu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
