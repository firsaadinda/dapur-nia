import { useState } from 'react';
import { MenuModule } from '@/components/modules/MenuModule';
import { PelangganModule } from '@/components/modules/PelangganModule';
import { PesananModule } from '@/components/modules/PesananModule';
import { LaporanModule } from '@/components/modules/LaporanModule';
import { UjiTembusModal } from '@/components/modules/UjiTembusModal';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import {
  Utensils,
  Users,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Database,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'pelanggan' | 'pesanan' | 'laporan'>('menu');
  const [ujiTembusOpen, setUjiTembusOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const navItems = [
    { id: 'menu' as const, label: 'Menu Harian', icon: Utensils },
    { id: 'pelanggan' as const, label: 'Pelanggan', icon: Users },
    { id: 'pesanan' as const, label: 'Pesanan', icon: ShoppingBag },
    { id: 'laporan' as const, label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F1] text-[#1F1A17] flex flex-col font-sans">
      {/* Top App Bar (Header Dapur Nia) */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#EADFD4] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C2410C] text-white flex items-center justify-center font-heading font-bold text-base shadow-xs select-none">
              N
            </div>
            <div>
              <strong className="font-heading text-lg font-bold text-[#1F1A17] leading-tight block">
                Dapur Nia
              </strong>
              <small className="text-[#6B5E55] text-xs font-medium block">
                Katering harian rumahan
              </small>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FFF8F1] p-1 rounded-xl border border-[#EADFD4]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                    active
                      ? 'bg-[#C2410C] text-white shadow-xs'
                      : 'text-[#6B5E55] hover:text-[#1F1A17] hover:bg-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Status & Uji Tembus Button */}
          <div className="flex items-center gap-2">
            {isFirebaseConfigured ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Firestore Aktif
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#A16207] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 rounded-full">
                <Database className="h-3.5 w-3.5" />
                Simulasi Lokal
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUjiTembusOpen(true)}
              className="h-8 text-xs font-heading font-semibold text-[#C2410C] border-[#C2410C] hover:bg-[#FFEDD5] flex items-center gap-1 px-3 rounded-lg"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#C2410C]" />
              <span>Uji Tembus</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Just below header) */}
        <div className="md:hidden border-t border-[#EADFD4] px-4 py-1.5 bg-[#FFF8F1]">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#C2410C] text-white shadow-xs'
                      : 'text-[#6B5E55] hover:text-[#1F1A17] bg-white border border-[#EADFD4]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'menu' && (
          <MenuModule key={`menu-${refreshTrigger}`} onMenuChanged={handleDataChanged} />
        )}
        {activeTab === 'pelanggan' && (
          <PelangganModule key={`pelanggan-${refreshTrigger}`} onPelangganChanged={handleDataChanged} />
        )}
        {activeTab === 'pesanan' && (
          <PesananModule key={`pesanan-${refreshTrigger}`} onOrderChanged={handleDataChanged} />
        )}
        {activeTab === 'laporan' && (
          <LaporanModule key={`laporan-${refreshTrigger}`} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#EADFD4] py-4 bg-white text-center text-xs text-[#6B5E55]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Dapur Nia — App 2 Pemesanan Katering (Sesi 3)</span>
          <span className="text-[11px] text-[#6B5E55]/80">Cloud Firestore · Netlify Ready</span>
        </div>
      </footer>

      {/* Uji Tembus Modal */}
      <UjiTembusModal open={ujiTembusOpen} onOpenChange={setUjiTembusOpen} />

      {/* Global Toast */}
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
