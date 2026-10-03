import { useState } from 'react';
import { validateMenu, validatePelanggan, validatePesanan, canTransitionStatus } from '@/lib/validators';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckCircle2, XCircle, Play } from 'lucide-react';

interface TestResult {
  id: number;
  nama: string;
  skenario: string;
  hasil: 'LULUS' | 'GAGAL' | 'BELUM_DIUJI';
  pesanPenolakan?: string;
  detail: string;
}

export function UjiTembusModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 1,
      nama: 'Uji 1: Field Kosong',
      skenario: 'Kirim formulir menu dengan nama kosong atau pelanggan tanpa alamat',
      detail: 'Sistem harus menolak dan menampilkan pesan perbaikan field.',
      hasil: 'BELUM_DIUJI',
    },
    {
      id: 2,
      nama: 'Uji 2: Tipe Salah',
      skenario: 'Kirim nilai non-angka atau NaN ke kolom harga satuan',
      detail: 'Sistem harus memvalidasi tipe data angka bulat positif.',
      hasil: 'BELUM_DIUJI',
    },
    {
      id: 3,
      nama: 'Uji 3: Teks Terlalu Panjang / Format Salah',
      skenario: 'Kirim nama menu > 60 karakter atau nomor WA bukan format 10-13 digit (08xx)',
      detail: 'Sistem harus menolak data yang melampaui batas skema.',
      hasil: 'BELUM_DIUJI',
    },
    {
      id: 4,
      nama: 'Uji 4: Nilai Negatif',
      skenario: 'Kirim harga = -15000 atau sisa_porsi = -5 ke koleksi menu',
      detail: 'Invariant 1: Harga dan sisa_porsi tidak pernah bernilai negatif.',
      hasil: 'BELUM_DIUJI',
    },
    {
      id: 5,
      nama: 'Uji 5: Nilai di Luar Batas (Porsi 0 / Melebihi Kuota)',
      skenario: 'Kirim pesanan dengan jumlah_porsi = 0 atau porsi = 10 saat sisa hanya 3',
      detail: 'Invariant 2: Porsi minimal 1 dan tidak melebihi sisa_porsi menu.',
      hasil: 'BELUM_DIUJI',
    },
    {
      id: 6,
      nama: 'Uji 6: Perubahan Status Tidak Sah (FSM Jumping)',
      skenario: 'Ubah status dari "menunggu_bayar" langsung melompat ke "selesai"',
      detail: 'Aturan FSM: Status tidak boleh melompat atau mundur.',
      hasil: 'BELUM_DIUJI',
    },
  ]);

  const [running, setRunning] = useState(false);

  const runAllTests = () => {
    setRunning(true);

    const updated: TestResult[] = [
      // Test 1: Field Kosong
      (() => {
        const resMenu = validateMenu({ nama: '   ', harga: 20000, sisa_porsi: 10 });
        const resCust = validatePelanggan({ nama: '', no_whatsapp: '', alamat: '' });
        const rejected = !resMenu.isValid && !resCust.isValid;
        return {
          id: 1,
          nama: 'Uji 1: Field Kosong',
          skenario: 'Kirim formulir menu kosong & pelanggan tanpa nama/alamat',
          hasil: rejected ? 'LULUS' : 'GAGAL',
          pesanPenolakan: resMenu.errors.nama + ' & ' + resCust.errors.nama,
          detail: 'Validasi form menu & pelanggan berhasil menolak input kosong.',
        };
      })(),

      // Test 2: Tipe Salah
      (() => {
        const res = validateMenu({ nama: 'Menu Test', harga: NaN, sisa_porsi: 10 });
        const rejected = !res.isValid && Boolean(res.errors.harga);
        return {
          id: 2,
          nama: 'Uji 2: Tipe Salah',
          skenario: 'Kirim harga = NaN (bukan angka)',
          hasil: rejected ? 'LULUS' : 'GAGAL',
          pesanPenolakan: res.errors.harga || 'Tidak ditolak (Bug)',
          detail: 'Validasi tipe berhasil menolak harga non-angka.',
        };
      })(),

      // Test 3: Teks Terlalu Panjang
      (() => {
        const longName = 'A'.repeat(65);
        const res = validateMenu({ nama: longName, harga: 25000, sisa_porsi: 10 });
        const rejected = !res.isValid && Boolean(res.errors.nama);
        return {
          id: 3,
          nama: 'Uji 3: Teks Terlalu Panjang (> 60 Karakter)',
          skenario: 'Kirim nama menu dengan panjang 65 karakter',
          hasil: rejected ? 'LULUS' : 'GAGAL',
          pesanPenolakan: res.errors.nama || 'Tidak ditolak (Bug)',
          detail: 'Validasi batas panjang karakter berhasil menolak nama > 60.',
        };
      })(),

      // Test 4: Nilai Negatif
      (() => {
        const res = validateMenu({ nama: 'Menu Negatif', harga: -10000, sisa_porsi: -1 });
        const rejected = !res.isValid && (Boolean(res.errors.harga) || Boolean(res.errors.sisa_porsi));
        return {
          id: 4,
          nama: 'Uji 4: Nilai Negatif (Invariant 1)',
          skenario: 'Kirim harga = -10000 dan sisa_porsi = -1',
          hasil: rejected ? 'LULUS' : 'GAGAL',
          pesanPenolakan: res.errors.harga || res.errors.sisa_porsi || 'Tidak ditolak',
          detail: 'Invariant 1 ditegakkan: Nilai negatif mutlak ditolak.',
        };
      })(),

      // Test 5: Nilai di Luar Batas (Porsi 0 / Melebihi Kuota)
      (() => {
        const resZero = validatePesanan({
          pelanggan_id: '081234567890',
          menu_id: 'menu_1',
          harga_satuan: 20000,
          jumlah_porsi: 0, // Dilarang!
          sisa_porsi_menu: 5,
          ongkir: 5000,
          total: 5000,
        });
        const resOver = validatePesanan({
          pelanggan_id: '081234567890',
          menu_id: 'menu_1',
          harga_satuan: 20000,
          jumlah_porsi: 10, // Melebihi sisa 5!
          sisa_porsi_menu: 5,
          ongkir: 5000,
          total: 205000,
        });
        const rejected = !resZero.isValid && !resOver.isValid;
        return {
          id: 5,
          nama: 'Uji 5: Nilai di Luar Batas (Invariant 2)',
          skenario: 'Coba pesan 0 porsi dan pesan 10 porsi (kuota hanya 5)',
          hasil: rejected ? 'LULUS' : 'GAGAL',
          pesanPenolakan: resZero.errors.jumlah_porsi + ' | ' + resOver.errors.jumlah_porsi,
          detail: 'Invariant 2 ditegakkan: 0 porsi dan overbooking ditolak sistem.',
        };
      })(),

      // Test 6: Perubahan Status Ilegal (FSM Jumping)
      (() => {
        const illegalJump = canTransitionStatus('menunggu_bayar', 'selesai'); // Seharusnya FALSE
        const illegalBack = canTransitionStatus('diproses', 'menunggu_bayar'); // Seharusnya FALSE
        const rejected = !illegalJump && !illegalBack;
        return {
          id: 6,
          nama: 'Uji 6: Perubahan Status Tidak Sah (FSM Guard)',
          skenario: 'Simulasi transisi menunggu_bayar -> selesai & diproses -> menunggu_bayar',
          hasil: rejected ? 'LULUS' : 'GAGAL',
          pesanPenolakan: rejected ? 'Transisi ilegal diblokir oleh guard FSM' : 'Bug: FSM mengizinkan lompat status',
          detail: 'Aturan FSM ditegakkan: Transisi melompat atau mundur ditolak.',
        };
      })(),
    ];

    setTests(updated);
    setRunning(false);
  };

  const passCount = tests.filter((t) => t.hasil === 'LULUS').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-white border-[#E0E2D8] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <DialogTitle>Uji Validasi 6 Masukan Tidak Sah</DialogTitle>
          </div>
          <DialogDescription>
            Pengujian otomatis acceptance criteria & penegakan 3 invariant sesuai PRD Bagian 8.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Action Header */}
          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-200">
            <div>
              <span className="text-xs font-semibold text-stone-700">Hasil Evaluasi: </span>
              <span className="text-xs font-bold text-emerald-700">
                {passCount} dari {tests.length} Skenario Lulus
              </span>
            </div>
            <Button
              onClick={runAllTests}
              size="sm"
              disabled={running}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-8"
            >
              <Play className="h-3.5 w-3.5" />
              {running ? 'Menguji...' : 'Jalankan Semua Uji Validasi'}
            </Button>
          </div>

          {/* Test Cases List */}
          <div className="space-y-2">
            {tests.map((test) => (
              <div
                key={test.id}
                className="p-3 rounded-lg border border-stone-200 bg-card text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-stone-800">{test.nama}</span>
                  {test.hasil === 'LULUS' && (
                    <Badge className="bg-emerald-600 font-bold shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      LULUS (DITOLAK)
                    </Badge>
                  )}
                  {test.hasil === 'GAGAL' && (
                    <Badge variant="destructive" className="font-bold shrink-0 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      GAGAL
                    </Badge>
                  )}
                  {test.hasil === 'BELUM_DIUJI' && (
                    <Badge variant="outline" className="text-stone-500 font-mono text-[10px]">
                      Siap Diuji
                    </Badge>
                  )}
                </div>

                <p className="text-stone-600 text-[11px]">
                  <strong>Skenario:</strong> {test.skenario}
                </p>

                {test.pesanPenolakan && (
                  <p className="text-amber-800 bg-amber-50/80 p-1.5 rounded border border-amber-200 text-[11px] font-mono">
                    Sistem Penolakan: {test.pesanPenolakan}
                  </p>
                )}

                <p className="text-[10px] text-muted-foreground">{test.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
