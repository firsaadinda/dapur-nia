import { useState } from 'react';
import { MenuModule } from '@/components/modules/MenuModule';
import { PelangganModule } from '@/components/modules/PelangganModule';
import { PesananModule } from '@/components/modules/PesananModule';
import { LaporanModule } from '@/components/modules/LaporanModule';
import { UjiTembusModal } from '@/components/modules/UjiTembusModal';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Toaster } from '@/components/ui/sonner';
// removed Button
import {
  Utensils,
  Users,
  ShoppingBag,
  BarChart3,
  ShieldCheck
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
    <div className="min-h-screen bg-[#FCF9F2] text-[#1C2311] flex flex-col font-sans relative">
      {/* Background Pattern Layer */}
      <div 
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'url("/images/bg_pattern.jpg")', backgroundSize: '400px', backgroundRepeat: 'repeat' }}
      />
      
      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top App Bar (Header Dapur Nia) */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/60 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 flex items-center justify-center select-none">
              <img src="/images/logo-transparent.png" alt="Dapur Nia" className="w-full h-full object-contain scale-110 drop-shadow-sm" />
            </div>
            <div>
              <strong className="font-heading text-lg font-bold text-[#36491C] leading-tight block">
                Dapur Nia
              </strong>
              <small className="text-[#5F6B4F] text-xs font-medium block">
                Katering Harian Rumahan
              </small>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FCF9F2] p-1 rounded-xl border border-[#E0E2D8]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                    active
                      ? 'bg-[#4D642D] text-white shadow-xs'
                      : 'text-[#5F6B4F] hover:text-[#1C2311] hover:bg-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Mobile Navigation Tabs (Just below header) */}
        <div className="md:hidden border-t border-[#E0E2D8] px-4 py-1.5 bg-[#FCF9F2]">
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
                      ? 'bg-[#4D642D] text-white shadow-xs'
                      : 'text-[#5F6B4F] hover:text-[#1C2311] bg-white border border-[#E0E2D8]'
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
      <footer className="w-full border-t border-white/60 py-4 bg-white/50 backdrop-blur-sm text-center text-xs text-[#5F6B4F]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="hidden sm:inline-block font-bold text-[#C2410C]">Dapur Nia v1.0 <span className="font-normal">— Aplikasi Admin Katering</span></span>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-[#5F6B4F]">
                <span className="h-2 w-2 rounded-full bg-[#15803D] shadow-[0_0_4px_rgba(21,128,61,0.5)]"></span>
                Sistem Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#5F6B4F]">
                <span className="h-2 w-2 rounded-full bg-[#A16207]"></span>
                Simulasi Lokal
              </span>
            )}

            <span className="text-[#E0E2D8]">|</span>

            <button
              onClick={() => setUjiTembusOpen(true)}
              className="inline-flex items-center gap-1.5 text-[#5F6B4F] hover:text-[#C2410C] transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Uji Validasi Sistem</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Uji Tembus Modal */}
      <UjiTembusModal open={ujiTembusOpen} onOpenChange={setUjiTembusOpen} />

      {/* Global Toast */}
      <Toaster position="top-center" richColors />
      </div>
    </div>
  );
}

export default App;
