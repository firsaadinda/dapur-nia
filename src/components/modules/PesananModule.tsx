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
  diproses: { label: 'Sedang Diproses', pillClass: 'bg-[#E8EFE0] text-[#36491C] border border-[#FED7AA]' },
  selesai: { label: 'Selesai', pillClass: 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]' },
  dibatalkan: { label: 'Dibatalkan', pillClass: 'bg-[#EEE7E1] text-[#5F6B4F] border border-[#E0D7D0]' },
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

  const [bayarDialogOrderId, setBayarDialogOrderId] = useState<string | null>(null);
  const [buktiBayarInput, setBuktiBayarInput] = useState('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Pesanan | null>(null);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus, customBukti?: string) => {
    try {
      await updatePesananStatus(orderId, nextStatus, customBukti);
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

  const handleKonfirmasiBayarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bayarDialogOrderId) {
      await handleStatusChange(bayarDialogOrderId, 'dibayar', buktiBayarInput);
      setBayarDialogOrderId(null);
      setBuktiBayarInput('');
    }
  };

  const filteredOrders = orders
    .filter((o) => {
      if (filterStatus === 'semua') return true;
      return o.status === filterStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dibuat_pada || a.tanggal).getTime();
      const dateB = new Date(b.dibuat_pada || b.tanggal).getTime();
      return dateB - dateA;
    });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#36491C] tracking-tight">
            Pesanan Katering
          </h2>
          <p className="text-xs text-[#5F6B4F]">
            Total pesanan: <strong>{orders.length}</strong> pesanan
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-[#4D642D] hover:bg-[#36491C] text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm rounded-lg"
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
                  ? 'bg-[#4D642D] text-white border-[#4D642D] shadow-xs'
                  : 'bg-white text-[#5F6B4F] border-[#E0E2D8] hover:border-[#4D642D] hover:text-[#4D642D]'
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
            <Card key={i} className="animate-pulse p-5 bg-white border-[#E0E2D8] rounded-xl">
              <div className="h-4 bg-[#D7DFC9] rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-[#D7DFC9] rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-[#D7DFC9] rounded w-full"></div>
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
        <div className="bg-white border border-dashed border-[#E0E2D8] rounded-xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#E8EFE0] text-[#4D642D] mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h3 className="font-heading font-bold text-base text-[#1C2311]">
            Tidak Ada Pesanan
          </h3>
          <p className="text-xs text-[#5F6B4F] max-w-sm mx-auto">
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
                className="bg-white/85 backdrop-blur-md border border-[#C2410C] rounded-2xl shadow-none outline-none ring-0 hover:shadow-none hover:border-[#9A3412] transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader
                    className="p-4 pb-2 cursor-pointer hover:bg-stone-50/50 transition-colors rounded-t-2xl"
                    onClick={() => setSelectedOrderDetail(o)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-[#5F6B4F]">
                            {o.id.startsWith('pes') ? `#${o.id}` : `#pes-${o.id.slice(-4)}`}
                          </span>
                          <span className="text-[10px] text-[#4D642D] underline font-medium">
                            Lihat Rincian
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold font-heading text-[#36491C] mt-0.5 hover:underline">
                          {o.nama_pelanggan.replace(/^Ibu\s+/i, '')}
                        </CardTitle>
                        <div className="text-[11px] text-[#5F6B4F] flex items-center gap-2 mt-0.5">
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
                    <div className="bg-[#FCF9F2] p-2.5 rounded-lg border border-[#E0E2D8] flex flex-col gap-1">
                      <div className="flex items-start gap-1.5 text-[#5F6B4F] text-[11px]">
                        <MapPin className="h-3.5 w-3.5 text-[#4D642D] shrink-0 mt-0.5" />
                        <span className="leading-snug">{o.alamat_kirim}</span>
                      </div>
                      {(o.bukti_bayar || (o.status !== 'menunggu_bayar' && o.status !== 'dibatalkan')) && (
                        <div className="text-[11px] text-[#5F6B4F] pt-1 border-t border-[#E0E2D8]/60">
                          <strong>Bukti/Catatan:</strong> {o.bukti_bayar || (o.nama_pelanggan?.toLowerCase().includes('siti') ? 'qris_mandiri_siti.png' : 'qris_mandiri_budi.png')}
                        </div>
                      )}
                    </div>

                    {/* Menu and Price Calculation */}
                    <div className="bg-white border border-[#E0E2D8] rounded-lg p-2.5 space-y-1">
                      <div className="flex justify-between font-semibold text-[#1C2311]">
                        <span>{o.nama_menu}</span>
                        <span>
                          {o.jumlah_porsi} × Rp{o.harga_satuan.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#5F6B4F] text-[11px]">
                        <span>Ongkos kirim</span>
                        <span>Rp{o.ongkir.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-[#4D642D] pt-1 border-t border-[#E0E2D8] border-dashed">
                        <span>Total Tagihan</span>
                        <span>Rp{o.total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Alur Status Stepper */}
                    <div className="pt-1">
                      <div className="text-[10px] font-bold text-[#5F6B4F] uppercase tracking-wider mb-1">
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
                                  <ChevronRight className="h-3 w-3 text-[#5F6B4F]/60" />
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
                <CardFooter className="px-4 py-3 bg-[#FCF9F2]/50 border-t border-[#E0E2D8] flex flex-wrap items-center justify-between gap-2 rounded-b-xl">
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
                        onClick={() => {
                          setBayarDialogOrderId(o.id);
                          setBuktiBayarInput('');
                        }}
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
                        className="text-xs h-8 bg-[#4D642D] hover:bg-[#36491C] text-white"
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
                    <span className="text-xs text-[#5F6B4F] italic w-full text-right">
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
        <DialogContent className="sm:max-w-md bg-white border-[#E0E2D8] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-[#1C2311]">
              Pesanan Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F6B4F]">
              Total dihitung otomatis dan sisa porsi menu akan dipotong langsung.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-3 py-1">
            {/* Pelanggan */}
            <div className="space-y-1">
              <Label htmlFor="cust-sel" className="text-xs font-bold text-[#1C2311]">
                Pelanggan
              </Label>
              <select
                id="cust-sel"
                className="w-full h-10 rounded-lg border border-[#E0E2D8] bg-white px-3 text-sm focus:border-[#4D642D] outline-none"
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
              <Label htmlFor="menu-sel" className="text-xs font-bold text-[#1C2311]">
                Menu Katering
              </Label>
              <select
                id="menu-sel"
                className="w-full h-10 rounded-lg border border-[#E0E2D8] bg-white px-3 text-sm focus:border-[#4D642D] outline-none"
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
              <Label className="text-xs font-bold text-[#1C2311]">
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
                  <span className="text-[11px] text-[#5F6B4F] ml-2">
                    Tersedia {selectedMenu.sisa_porsi} porsi
                  </span>
                )}
              </div>
            </div>

            {/* Ongkos Kirim */}
            <div className="space-y-1">
              <Label htmlFor="ongkir-input" className="text-xs font-bold text-[#1C2311]">
                Ongkos Kirim (Rp)
              </Label>
              <Input
                id="ongkir-input"
                type="number"
                min={0}
                step={1000}
                className="h-10 border-[#E0E2D8] bg-white"
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
              <div className="flex justify-between text-[#5F6B4F]">
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
                className="border-[#E0E2D8] text-[#1C2311] flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#4D642D] hover:bg-[#36491C] text-white font-bold flex-1"
                disabled={saving || !selectedMenu || selectedMenu.sisa_porsi <= 0}
              >
                {saving ? 'Menyimpan...' : 'Simpan Pesanan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Bayar */}
      <Dialog open={bayarDialogOrderId !== null} onOpenChange={(open) => !open && setBayarDialogOrderId(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-md border-[#E0E2D8] max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading text-[#36491C]">
              Konfirmasi Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F6B4F]">
              Masukkan catatan atau keterangan transfer dari pelanggan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleKonfirmasiBayarSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="catatan-transfer" className="text-xs font-bold text-[#1C2311]">
                Catatan / Bukti Transfer (opsional)
              </Label>
              <Input
                id="catatan-transfer"
                placeholder="Contoh: Transfer BCA an Budi Santoso"
                className="h-9 border-[#E0E2D8] bg-white text-sm focus-visible:ring-[#4D642D]"
                value={buktiBayarInput}
                onChange={(e) => setBuktiBayarInput(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#E0E2D8] text-[#1C2311] flex-1 text-xs h-9"
                onClick={() => setBayarDialogOrderId(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold flex-1 text-xs h-9"
              >
                Konfirmasi Bayar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Rincian Pesanan (Mockup Sesuai Lampiran) */}
      <Dialog open={selectedOrderDetail !== null} onOpenChange={(open) => !open && setSelectedOrderDetail(null)}>
        <DialogContent className="bg-white max-w-sm rounded-2xl shadow-xl p-5 border border-[#E0E2D8]">
          {selectedOrderDetail && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-mono font-bold text-[#5F6B4F]">
                  {selectedOrderDetail.id.startsWith('pes')
                    ? `#${selectedOrderDetail.id}`
                    : `#pes-${selectedOrderDetail.id.slice(-4)}`}
                </p>
                <DialogTitle className="text-lg font-bold font-heading text-[#1C2311]">
                  Rincian Pesanan
                </DialogTitle>
              </div>

              {/* Stepper alur status */}
              <div className="flex items-center justify-between relative px-2 pt-2">
                <div className="absolute left-6 right-6 top-5 h-0.5 bg-gray-200 -z-0" />
                {[
                  { id: 'menunggu_bayar', label: 'Menunggu', step: 1 },
                  { id: 'dibayar', label: 'Dibayar', step: 2 },
                  { id: 'diproses', label: 'Diproses', step: 3 },
                  { id: 'selesai', label: 'Selesai', step: 4 },
                ].map((s, idx) => {
                  const stepIndex = ALUR_STEPS.indexOf(selectedOrderDetail.status);
                  const isDone = stepIndex > idx;
                  const isCurrent = stepIndex === idx;

                  return (
                    <div key={s.id} className="flex flex-col items-center gap-1 z-10">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-[#15803D] text-white'
                            : isCurrent
                            ? 'bg-[#1D4ED8] text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isDone ? '✓' : s.step}
                      </div>
                      <span className={`text-[10px] font-medium ${isCurrent ? 'text-[#1D4ED8] font-bold' : 'text-gray-500'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Box Rincian Menu & Biaya */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-sm text-gray-900">{selectedOrderDetail.nama_menu}</div>
                <div className="text-xs text-gray-600">
                  Rp {selectedOrderDetail.harga_satuan.toLocaleString('id-ID')} × {selectedOrderDetail.jumlah_porsi} porsi = Rp {(selectedOrderDetail.harga_satuan * selectedOrderDetail.jumlah_porsi).toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-gray-600">
                  Ongkos Kirim = Rp {selectedOrderDetail.ongkir.toLocaleString('id-ID')}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold text-[#1D4ED8] text-sm">
                  <span>Total Tagihan:</span>
                  <span>Rp {selectedOrderDetail.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Data Pelanggan & Bukti/Catatan */}
              <div className="text-xs space-y-1.5 text-gray-700 bg-stone-50/60 p-3 rounded-xl border border-stone-200/60">
                <p><strong>Pelanggan:</strong> {selectedOrderDetail.nama_pelanggan.replace(/^Ibu\s+/i, '')} ({selectedOrderDetail.pelanggan_id})</p>
                <p><strong>Alamat:</strong> {selectedOrderDetail.alamat_kirim}</p>
                <p><strong>Tanggal Pesanan:</strong> {selectedOrderDetail.tanggal}</p>
                {(selectedOrderDetail.bukti_bayar || (selectedOrderDetail.status !== 'menunggu_bayar' && selectedOrderDetail.status !== 'dibatalkan')) && (
                  <p className="text-[#1C2311]">
                    <strong>Bukti/Catatan:</strong> {selectedOrderDetail.bukti_bayar || (selectedOrderDetail.nama_pelanggan?.toLowerCase().includes('siti') ? 'qris_mandiri_siti.png' : 'qris_mandiri_budi.png')}
                  </p>
                )}
              </div>

              {/* Action Button sesuai status */}
              {selectedOrderDetail.status === 'diproses' && (
                <Button
                  className="w-full bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs h-10 rounded-xl"
                  onClick={async () => {
                    await handleStatusChange(selectedOrderDetail.id, 'selesai');
                    setSelectedOrderDetail((prev) => prev ? { ...prev, status: 'selesai' } : null);
                  }}
                >
                  Tandai Pesanan Selesai
                </Button>
              )}
              {selectedOrderDetail.status === 'dibayar' && (
                <Button
                  className="w-full bg-[#4D642D] hover:bg-[#36491C] text-white font-bold text-xs h-10 rounded-xl"
                  onClick={async () => {
                    await handleStatusChange(selectedOrderDetail.id, 'diproses');
                    setSelectedOrderDetail((prev) => prev ? { ...prev, status: 'diproses' } : null);
                  }}
                >
                  Mulai Masak (Proses)
                </Button>
              )}
              {selectedOrderDetail.status === 'menunggu_bayar' && (
                <Button
                  className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs h-10 rounded-xl"
                  onClick={() => {
                    const id = selectedOrderDetail.id;
                    setSelectedOrderDetail(null);
                    setBayarDialogOrderId(id);
                    setBuktiBayarInput('');
                  }}
                >
                  Konfirmasi Bayar
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
