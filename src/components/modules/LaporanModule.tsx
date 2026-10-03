import { useState, useEffect } from 'react';
import type { LaporanHarian } from '@/types';
import { getLaporanHarian } from '@/services/laporanService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, DollarSign, PackageCheck, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export function LaporanModule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [laporan, setLaporan] = useState<LaporanHarian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaporan = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLaporanHarian(date);
      setLaporan(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghitung laporan harian dari basis data');
      toast.error('Gagal menghitung laporan harian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#EADFD4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#1F1A17] tracking-tight">
            Laporan Harian
          </h2>
          <p className="text-xs text-[#6B5E55]">
            Ringkasan omzet dan porsi terjual (pesanan dibatalkan tidak dihitung).
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-[#FFF8F1] border border-[#EADFD4] px-3 py-1.5 rounded-lg">
          <Calendar className="h-4 w-4 text-[#C2410C] shrink-0" />
          <Label htmlFor="date-input" className="text-xs font-bold text-[#1F1A17] shrink-0">
            Tanggal:
          </Label>
          <Input
            id="date-input"
            type="date"
            className="h-8 text-xs bg-white border-[#EADFD4] w-36 font-mono"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="animate-pulse p-6 bg-white border-[#EADFD4] rounded-xl h-28"></Card>
          <Card className="animate-pulse p-6 bg-white border-[#EADFD4] rounded-xl h-28"></Card>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-red-900">Gagal Memuat Laporan</h3>
            <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <Button
            size="sm"
            onClick={() => fetchLaporan(selectedDate)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-4 rounded-lg"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && laporan && laporan.total_porsi === 0 && (
        <div className="bg-white border border-dashed border-[#EADFD4] rounded-xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#C2410C] mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h3 className="font-heading font-bold text-base text-[#1F1A17]">
            Belum Ada Penjualan Pada Tanggal Ini
          </h3>
          <p className="text-xs text-[#6B5E55] max-w-sm mx-auto">
            Tidak ada pesanan aktif tercatat pada <strong>{selectedDate}</strong>.
          </p>
        </div>
      )}

      {/* Active Report View */}
      {!loading && !error && laporan && laporan.total_porsi > 0 && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="bg-white border border-[#EADFD4] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#6B5E55]">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Total Uang Masuk
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-heading text-[#C2410C] mt-2 tracking-tight">
                Rp {laporan.total_uang_masuk.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-[#6B5E55] mt-1">
                Termasuk subtotal menu & ongkir
              </div>
            </Card>

            <Card className="bg-white border border-[#EADFD4] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#6B5E55]">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Porsi Terjual
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                  <PackageCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-heading text-[#15803D] mt-2 tracking-tight">
                {laporan.total_porsi} <span className="text-base font-normal">porsi</span>
              </div>
              <div className="text-[11px] text-[#6B5E55] mt-1">
                Dari {laporan.daftar_pesanan.length} pesanan sah
              </div>
            </Card>
          </div>

          {/* Breakdown per Menu */}
          <Card className="bg-white border border-[#EADFD4] rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-[#EADFD4]">
              <CardTitle className="text-sm font-bold font-heading text-[#1F1A17] flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-[#C2410C]" />
                Porsi Terjual per Menu
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-[#EADFD4]">
                {laporan.rincian_menu.map((item) => (
                  <div
                    key={item.menu_id}
                    className="p-4 flex items-center justify-between hover:bg-[#FFF8F1]/60 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1F1A17]">{item.nama_menu}</p>
                      <p className="text-xs text-[#6B5E55]">
                        Omzet: Rp{item.total_omzet.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#C2410C] bg-[#FFEDD5] border border-[#FED7AA] px-3 py-1 rounded-full">
                      {item.porsi_terjual} porsi
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
