import { useState, useEffect } from 'react';
import type { Pesanan, Menu, Pelanggan, OrderStatus } from '@/types';
import { getPesananList, createPesanan, updatePesananStatus } from '@/services/pesananService';
import { getMenus } from '@/services/menuService';
import { getPelangganList } from '@/services/pelangganService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const ALUR_STEPS: OrderStatus[] = ['menunggu_bayar', 'dibayar', 'diproses', 'selesai'];

const STATUS_MAP: Record<OrderStatus, { label: string; pillClass: string }> = {
  menunggu_bayar: { label: 'Menunggu Bayar', pillClass: 'bg-[#FEF3C7] text-[#A16207] border border-[#FDE68A]' },
  dibayar: { label: 'Sudah Dibayar', pillClass: 'bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]' },
  diproses: { label: 'Sedang Diproses', pillClass: 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]' },
  selesai: { label: 'Selesai', pillClass: 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]' },
  dibatalkan: { label: 'Dibatalkan', pillClass: 'bg-[#EEE7E1] text-[#6B5E55] border border-[#E0D7D0]' },
};

export function PesananModule({ onOrderChanged }: { onOrderChanged?: () => void }) {
  const [orders, setOrders] = useState<Pesanan[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('semua');

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [jumlahPorsi, setJumlahPorsi] = useState<number>(1);
  const [ongkir, setOngkir] = useState<number>(5000);
  const [buktiBayar, setBuktiBayar] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderList, menuList, customerList] = await Promise.all([
        getPesananList(),
        getMenus(),
        getPelangganList(),
      ]);
      setOrders(orderList);
      setMenus(menuList);
      setCustomers(customerList);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data pesanan dari basis data');
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    if (customers.length === 0) {
      toast.error('Tambahkan pelanggan terlebih dahulu');
      return;
    }
    const availableMenus = menus.filter((m) => m.sisa_porsi > 0);
    if (availableMenus.length === 0) {
      toast.error('Semua menu katering saat ini sedang habis!');
      return;
    }
    setSelectedCustomerId(customers[0].no_whatsapp);
    setSelectedMenuId(availableMenus[0].id);
    setJumlahPorsi(1);
    setOngkir(5000);
    setBuktiBayar('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setDialogOpen(true);
  };

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const unitPrice = selectedMenu ? selectedMenu.harga : 0;
  const maxPorsi = selectedMenu ? selectedMenu.sisa_porsi : 1;
  const subtotal = unitPrice * jumlahPorsi;
  const totalBill = subtotal + ongkir;

  const handleStep = (delta: number) => {
    setJumlahPorsi((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxPorsi) return maxPorsi;
      return next;
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedMenuId) {
      toast.error('Pilih pelanggan dan menu yang valid');
      return;
    }

    setSaving(true);
    try {
      await createPesanan({
        pelanggan_id: selectedCustomerId,
        menu_id: selectedMenuId,
        jumlah_porsi: jumlahPorsi,
        ongkir: Number(ongkir),
        bukti_bayar: buktiBayar,
        tanggal,
      });

      toast.success('Pesanan tersimpan & sisa porsi berkurang');
      setDialogOpen(false);
      await fetchData();
      onOrderChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat pesanan');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updatePesananStatus(orderId, nextStatus);
      toast.success(
        nextStatus === 'dibatalkan'
          ? 'Pesanan dibatalkan & porsi dikembalikan'
          : `Status pesanan: ${STATUS_MAP[nextStatus].label}`
      );
      await fetchData();
      onOrderChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'semua') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EADFD4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#1F1A17] tracking-tight">
            Pesanan Katering
          </h2>
          <p className="text-xs text-[#6B5E55]">
            Total pesanan: <strong>{orders.length}</strong> pesanan
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Pesanan Baru
        </Button>
      </div>

      {/* Filter Chips Bar */}
      <div className="chips-container py-1">
        {[
          { id: 'semua', label: 'Semua' },
          { id: 'menunggu_bayar', label: 'Menunggu Bayar' },
          { id: 'dibayar', label: 'Sudah Dibayar' },
          { id: 'diproses', label: 'Sedang Diproses' },
          { id: 'selesai', label: 'Selesai' },
          { id: 'dibatalkan', label: 'Dibatalkan' },
        ].map((chip) => {
          const active = filterStatus === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setFilterStatus(chip.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                active
                  ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-xs'
                  : 'bg-white text-[#6B5E55] border-[#EADFD4] hover:border-[#C2410C] hover:text-[#C2410C]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse p-5 bg-white border-[#EADFD4] rounded-xl">
              <div className="h-4 bg-[#F2EAE3] rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-[#F2EAE3] rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-[#F2EAE3] rounded w-full"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-red-900">Gagal Memuat Pesanan</h3>
            <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <Button
            size="sm"
            onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-4 rounded-lg"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="bg-white border border-dashed border-[#EADFD4] rounded-xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#C2410C] mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h3 className="font-heading font-bold text-base text-[#1F1A17]">
            Tidak Ada Pesanan
          </h3>
          <p className="text-xs text-[#6B5E55] max-w-sm mx-auto">
            {filterStatus === 'semua'
              ? 'Belum ada pesanan aktif. Tekan tombol Pesanan Baru untuk membuat transaksi.'
              : `Tidak ada pesanan dengan status "${STATUS_MAP[filterStatus as OrderStatus]?.label || filterStatus}".`}
          </p>
        </div>
      )}

      {/* Order Cards Grid */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredOrders.map((o) => {
            const statusConfig = STATUS_MAP[o.status] || {
              label: o.status,
              pillClass: 'bg-stone-100 text-stone-700',
            };
            const currentStepIdx = ALUR_STEPS.indexOf(o.status);

            return (
              <Card
                key={o.id}
                className="bg-white border border-[#EADFD4] rounded-xl shadow-xs hover:border-[#C2410C] transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#6B5E55]">
                          #{o.id.slice(-6)}
                        </span>
                        <CardTitle className="text-base font-bold font-heading text-[#1F1A17] mt-0.5">
                          {o.nama_pelanggan}
                        </CardTitle>
                        <div className="text-[11px] text-[#6B5E55] flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {o.tanggal}
                          </span>
                          <span>•</span>
                          <span>{o.pelanggan_id}</span>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusConfig.pillClass}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-3 space-y-2 text-xs">
                    {/* Alamat & Catatan */}
                    <div className="bg-[#FFF8F1] p-2.5 rounded-lg border border-[#EADFD4] flex flex-col gap-1">
                      <div className="flex items-start gap-1.5 text-[#6B5E55] text-[11px]">
                        <MapPin className="h-3.5 w-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                        <span className="leading-snug">{o.alamat_kirim}</span>
                      </div>
                      {o.bukti_bayar && (
                        <div className="text-[11px] text-[#6B5E55] pt-1 border-t border-[#EADFD4]/60">
                          <strong>Catatan Bayar:</strong> {o.bukti_bayar}
                        </div>
                      )}
                    </div>

                    {/* Menu and Price Calculation */}
                    <div className="bg-white border border-[#EADFD4] rounded-lg p-2.5 space-y-1">
                      <div className="flex justify-between font-semibold text-[#1F1A17]">
                        <span>{o.nama_menu}</span>
                        <span>
                          {o.jumlah_porsi} × Rp{o.harga_satuan.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B5E55] text-[11px]">
                        <span>Ongkos kirim</span>
                        <span>Rp{o.ongkir.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-[#C2410C] pt-1 border-t border-[#EADFD4] border-dashed">
                        <span>Total Tagihan</span>
                        <span>Rp{o.total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Alur Status Stepper */}
                    <div className="pt-1">
                      <div className="text-[10px] font-bold text-[#6B5E55] uppercase tracking-wider mb-1">
                        Alur Status
                      </div>
                      {o.status === 'dibatalkan' ? (
                        <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626]">
                          Pesanan Dibatalkan
                        </div>
                      ) : (
                        <div className="alur-stepper">
                          {ALUR_STEPS.map((step, idx) => {
                            const isCurrent = step === o.status;
                            const isPassed = currentStepIdx > idx;
                            return (
                              <div key={step} className="flex items-center gap-1">
                                <span
                                  className={`alur-node ${
                                    isCurrent ? 'active' : isPassed ? 'passed' : ''
                                  }`}
                                >
                                  {STATUS_MAP[step].label}
                                </span>
                                {idx < ALUR_STEPS.length - 1 && (
                                  <ChevronRight className="h-3 w-3 text-[#6B5E55]/60" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Footer Transition Buttons */}
                <CardFooter className="px-4 py-3 bg-[#FFF8F1]/50 border-t border-[#EADFD4] flex flex-wrap items-center justify-between gap-2 rounded-b-xl">
                  {/* Status: Menunggu Bayar */}
                  {o.status === 'menunggu_bayar' && (
                    <div className="flex items-center gap-2 w-full justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]"
                        onClick={() => handleStatusChange(o.id, 'dibatalkan')}
                      >
                        Batalkan
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white"
                        onClick={() => handleStatusChange(o.id, 'dibayar')}
                      >
                        Konfirmasi Bayar
                      </Button>
                    </div>
                  )}

                  {/* Status: Dibayar */}
                  {o.status === 'dibayar' && (
                    <div className="flex items-center gap-2 w-full justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]"
                        onClick={() => handleStatusChange(o.id, 'dibatalkan')}
                      >
                        Batalkan
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-[#C2410C] hover:bg-[#9A3412] text-white"
                        onClick={() => handleStatusChange(o.id, 'diproses')}
                      >
                        Mulai Masak
                      </Button>
                    </div>
                  )}

                  {/* Status: Diproses */}
                  {o.status === 'diproses' && (
                    <div className="flex items-center gap-2 w-full justify-end">
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-[#15803D] hover:bg-[#166534] text-white"
                        onClick={() => handleStatusChange(o.id, 'selesai')}
                      >
                        Tandai Selesai
                      </Button>
                    </div>
                  )}

                  {/* Status Terminal */}
                  {(o.status === 'selesai' || o.status === 'dibatalkan') && (
                    <span className="text-xs text-[#6B5E55] italic w-full text-right">
                      Pesanan selesai ({o.status}). Status terkunci.
                    </span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Form Pesanan Baru */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-[#EADFD4] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-[#1F1A17]">
              Pesanan Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B5E55]">
              Total dihitung otomatis dan sisa porsi menu akan dipotong langsung.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-3 py-1">
            {/* Pelanggan */}
            <div className="space-y-1">
              <Label htmlFor="cust-sel" className="text-xs font-bold text-[#1F1A17]">
                Pelanggan
              </Label>
              <select
                id="cust-sel"
                className="w-full h-10 rounded-lg border border-[#EADFD4] bg-white px-3 text-sm focus:border-[#C2410C] outline-none"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <option key={c.no_whatsapp} value={c.no_whatsapp}>
                    {c.nama} — {c.no_whatsapp}
                  </option>
                ))}
              </select>
            </div>

            {/* Menu */}
            <div className="space-y-1">
              <Label htmlFor="menu-sel" className="text-xs font-bold text-[#1F1A17]">
                Menu Katering
              </Label>
              <select
                id="menu-sel"
                className="w-full h-10 rounded-lg border border-[#EADFD4] bg-white px-3 text-sm focus:border-[#C2410C] outline-none"
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                required
              >
                {menus.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.sisa_porsi <= 0}>
                    {m.nama} — Rp{m.harga.toLocaleString('id-ID')} ({m.sisa_porsi > 0 ? `sisa ${m.sisa_porsi}` : 'Habis'})
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah Porsi Stepper */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1F1A17]">
                Jumlah Porsi
              </Label>
              <div>
                <div className="stepper-box">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleStep(-1)}
                    disabled={jumlahPorsi <= 1}
                  >
                    -
                  </button>
                  <input
                    className="stepper-input"
                    value={jumlahPorsi}
                    readOnly
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleStep(1)}
                    disabled={jumlahPorsi >= maxPorsi}
                  >
                    +
                  </button>
                </div>
                {selectedMenu && (
                  <span className="text-[11px] text-[#6B5E55] ml-2">
                    Tersedia {selectedMenu.sisa_porsi} porsi
                  </span>
                )}
              </div>
            </div>

            {/* Ongkos Kirim */}
            <div className="space-y-1">
              <Label htmlFor="ongkir-input" className="text-xs font-bold text-[#1F1A17]">
                Ongkos Kirim (Rp)
              </Label>
              <Input
                id="ongkir-input"
                type="number"
                min={0}
                step={1000}
                className="h-10 border-[#EADFD4] bg-white"
                value={ongkir}
                onChange={(e) => setOngkir(e.target.value === '' ? 0 : Number(e.target.value))}
                required
              />
            </div>

            {/* Live Hitung Breakdown Box */}
            <div className="hitung-box">
              <div className="flex justify-between">
                <span>
                  {selectedMenu?.nama || 'Menu'} Rp{unitPrice.toLocaleString('id-ID')} × {jumlahPorsi}
                </span>
                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#6B5E55]">
                <span>Ongkos kirim</span>
                <span>Rp{ongkir.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between total-row">
                <span>Total</span>
                <span>Rp{totalBill.toLocaleString('id-ID')}</span>
              </div>
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
                disabled={saving || !selectedMenu || selectedMenu.sisa_porsi <= 0}
              >
                {saving ? 'Menyimpan...' : 'Simpan Pesanan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
