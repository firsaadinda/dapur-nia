import { useState, useEffect } from 'react';
import type { Pelanggan } from '@/types';
import { getPelangganList, addPelanggan, deletePelanggan } from '@/services/pelangganService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Phone, MapPin, Trash2, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export function PelangganModule({ onPelangganChanged }: { onPelangganChanged?: () => void }) {
  const [list, setList] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [nama, setNama] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPelangganList();
      setList(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data pelanggan dari basis data');
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openAddDialog = () => {
    setNama('');
    setNoWhatsapp('');
    setAlamat('');
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await addPelanggan({
        nama,
        no_whatsapp: noWhatsapp,
        alamat,
      });
      toast.success('Pelanggan tersimpan');
      setDialogOpen(false);
      await fetchList();
      onPelangganChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data pelanggan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (wa: string, name: string) => {
    if (!window.confirm(`Hapus ${name}? Data pelanggan hilang permanen.`)) return;
    try {
      await deletePelanggan(wa);
      toast.success('Pelanggan dihapus');
      await fetchList();
      onPelangganChanged?.();
    } catch {
      toast.error('Gagal menghapus data pelanggan');
    }
  };

  const getWaLink = (phone: string) => {
    const formatted = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    return `https://wa.me/${formatted}`;
  };

  const filteredList = list.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.nama.toLowerCase().includes(query) ||
      p.no_whatsapp.includes(query) ||
      p.alamat.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EADFD4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#1F1A17] tracking-tight">
            Data Pelanggan
          </h2>
          <p className="text-xs text-[#6B5E55]">
            Terdaftar: <strong>{list.length}</strong> kontak pelanggan
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm rounded-lg"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B5E55]" />
        <Input
          placeholder="Cari nama atau nomor WhatsApp..."
          className="pl-10 h-10 bg-white border-[#EADFD4] text-xs rounded-xl focus:border-[#C2410C]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse p-4 bg-white border-[#EADFD4] rounded-xl">
              <div className="h-4 bg-[#F2EAE3] rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-[#F2EAE3] rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-[#F2EAE3] rounded w-1/3"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold">
            <Trash2 className="h-5 w-5 rotate-45" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-red-900">Gagal Memuat Pelanggan</h3>
            <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <Button
            size="sm"
            onClick={fetchList}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-4 rounded-lg"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredList.length === 0 && (
        <div className="bg-white border border-dashed border-[#EADFD4] rounded-xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#C2410C] mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h3 className="font-heading font-bold text-base text-[#1F1A17]">
            {searchQuery ? 'Pelanggan Tidak Ditemukan' : 'Belum Ada Pelanggan'}
          </h3>
          <p className="text-xs text-[#6B5E55] max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada data yang cocok dengan "${searchQuery}".`
              : 'Daftarkan kontak pelanggan pertama untuk mulai membuat pesanan katering.'}
          </p>
        </div>
      )}

      {/* Customers Cards Grid */}
      {!loading && !error && filteredList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredList.map((c) => (
            <Card
              key={c.id}
              className="bg-white border border-[#EADFD4] rounded-xl shadow-xs hover:border-[#C2410C] transition-all flex flex-col justify-between"
            >
              <div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold font-heading text-[#1F1A17]">
                        {c.nama}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1 text-[#6B5E55] font-mono mt-0.5">
                        <Phone className="h-3 w-3 text-[#C2410C]" />
                        {c.no_whatsapp}
                      </CardDescription>
                    </div>

                    <a
                      href={getWaLink(c.no_whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] hover:bg-[#BBF7D0] px-2.5 py-1 rounded-full border border-[#BBF7D0] transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat WA
                    </a>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-3 text-xs">
                  <div className="flex items-start gap-1.5 text-[#6B5E55] bg-[#FFF8F1] p-2.5 rounded-lg border border-[#EADFD4]">
                    <MapPin className="h-3.5 w-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                    <span className="leading-snug">{c.alamat}</span>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="px-4 py-2 bg-[#FFF8F1]/40 border-t border-[#EADFD4] flex justify-end rounded-b-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-[#DC2626] hover:bg-[#FEE2E2]"
                  onClick={() => handleDelete(c.no_whatsapp, c.nama)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Hapus
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog Form Tambah Pelanggan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-[#EADFD4] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-[#1F1A17]">
              Tambah Pelanggan
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B5E55]">
              Nomor WhatsApp digunakan sebagai kunci unik pelanggan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="nama-p" className="text-xs font-bold text-[#1F1A17]">
                Nama Lengkap
              </Label>
              <Input
                id="nama-p"
                placeholder="Contoh: Ibu Rina Amalia"
                value={nama}
                maxLength={60}
                className="h-10 border-[#EADFD4]"
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wa-p" className="text-xs font-bold text-[#1F1A17]">
                Nomor WhatsApp
              </Label>
              <Input
                id="wa-p"
                type="tel"
                placeholder="081234567890"
                value={noWhatsapp}
                maxLength={13}
                className="h-10 border-[#EADFD4]"
                onChange={(e) => setNoWhatsapp(e.target.value.replace(/\D/g, ''))}
                required
              />
              <p className="text-[11px] text-[#6B5E55]">
                Awali dengan 08, panjang 10 sampai 13 angka.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="alamat-p" className="text-xs font-bold text-[#1F1A17]">
                Alamat Pengiriman
              </Label>
              <Textarea
                id="alamat-p"
                placeholder="Contoh: Jl. Anggrek No. 15, Blok B RT 03/RW 04"
                value={alamat}
                maxLength={200}
                rows={3}
                className="border-[#EADFD4]"
                onChange={(e) => setAlamat(e.target.value)}
                required
              />
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
                {saving ? 'Menyimpan...' : 'Simpan Pelanggan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
