import { useState, useEffect } from 'react';
import { DaftarMenuPublic } from '@/components/modules/DaftarMenuPublic';
import { MenuModule } from '@/components/modules/MenuModule';
import { PelangganModule } from '@/components/modules/PelangganModule';
import { PesananModule } from '@/components/modules/PesananModule';
import { LaporanModule } from '@/components/modules/LaporanModule';
import { UjiTembusModal } from '@/components/modules/UjiTembusModal';
import { LoginPage } from '@/components/auth/LoginPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Utensils,
  ChefHat,
  Users,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  LogOut,
  Loader2,
  Crown,
  Lock,
} from 'lucide-react';

export type TabId =
  | 'daftar-menu'
  | 'kelola-menu'
  | 'masuk'
  | 'daftar'
  | 'pelanggan'
  | 'pesanan'
  | 'laporan';

const TAB_STORAGE_KEY = 'dapur_nia_active_tab';

export function App() {
  const { user, role, loading: authLoading, signOutUser } = useAuth();
  
  // Initial tab determination from URL hash or localStorage
  const getInitialTab = (): TabId => {
    if (typeof window !== 'undefined') {
      const validTabs: TabId[] = [
        'daftar-menu',
        'kelola-menu',
        'masuk',
        'daftar',
        'pelanggan',
        'pesanan',
        'laporan',
      ];

      // 1. Check pathname (e.g. /kelola-menu, /masuk)
      const path = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '') as TabId;
      if (validTabs.includes(path)) return path;

      // 2. Check hash (e.g. #/kelola-menu, #kelola-menu)
      const hash = window.location.hash.replace(/^#\/?/, '') as TabId;
      if (validTabs.includes(hash)) return hash;

      // 3. Check localStorage
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabId;
      if (saved && validTabs.includes(saved)) return saved;
    }
    return 'daftar-menu';
  };

  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);
  const [ujiTembusOpen, setUjiTembusOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync pathname, hash, and localStorage when activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TAB_STORAGE_KEY, activeTab);
      const targetPath = activeTab === 'daftar-menu' ? '/' : `/${activeTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [activeTab]);

  // Listen to popstate and hashchange (browser Back / Forward navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Protected Route Logic:
  // Tamu tidak dapat mengakses Kelola Menu, Pelanggan, Pesanan, dan Laporan
  const protectedTabs: TabId[] = ['kelola-menu', 'pelanggan', 'pesanan', 'laporan'];

  useEffect(() => {
    if (!authLoading && !user && protectedTabs.includes(activeTab)) {
      setActiveTab('masuk');
      toast.info('Halaman ini khusus pengelola. Silakan masuk terlebih dahulu.');
    }
  }, [authLoading, user, activeTab]);

  const handleDataChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNavigate = (tab: TabId) => {
    if (protectedTabs.includes(tab) && !user) {
      setActiveTab('masuk');
      toast.info('Halaman ini khusus pengelola. Silakan masuk terlebih dahulu.');
      return;
    }
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setActiveTab('daftar-menu');
      toast.success('Berhasil keluar. Sesi telah diakhiri.');
    } catch {
      toast.error('Gagal keluar. Silakan coba lagi.');
    }
  };

  const navItems = [
    { id: 'daftar-menu' as const, label: 'Daftar Menu', icon: Utensils },
    { id: 'kelola-menu' as const, label: 'Kelola Menu', icon: ChefHat },
    { id: 'pelanggan' as const, label: 'Pelanggan', icon: Users },
    { id: 'pesanan' as const, label: 'Pesanan', icon: ShoppingBag },
    { id: 'laporan' as const, label: 'Laporan', icon: BarChart3 },
  ];

  const userName =
    user?.displayName === 'Firsa Adinda (Pemilik)' || user?.displayName === 'Mbak Dina (Pemilik)'
      ? 'Bu Nia'
      : user?.displayName || user?.email?.split('@')[0] || (role === 'pemilik' ? 'Bu Nia' : 'Staf Dapur');

  return (
    <div className="min-h-screen bg-[#FCF9F2] text-[#1C2311] flex flex-col font-sans relative">
      {/* Background Pattern Layer */}
      <div
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'url("/images/bg_pattern.jpg")',
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top App Bar (Header Dapur Nia) */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-white/60 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            {/* Brand Logo & Name */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => handleNavigate('daftar-menu')}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/images/logo-transparent.png"
                  alt="Dapur Nia"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
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
                const isRestrictedForGuest = !user && protectedTabs.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#4D642D] text-white shadow-xs'
                        : isRestrictedForGuest
                        ? 'text-[#8E9B7E] hover:text-[#36491C] hover:bg-white/70'
                        : 'text-[#5F6B4F] hover:text-[#1C2311] hover:bg-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {isRestrictedForGuest && (
                      <Lock className="h-2.5 w-2.5 opacity-60 text-[#8E9B7E]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action / Auth Area */}
            <div className="flex items-center gap-2">
              {authLoading ? (
                <div className="flex items-center gap-1.5 text-xs text-[#5F6B4F] px-2 py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Memuat sesi...</span>
                </div>
              ) : user ? (
                /* Authenticated User: Display User Name at the top & Keluar button */
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#F4F7EF] border border-[#D7DFC9] shadow-xs">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                        role === 'pemilik' ? 'bg-[#C2410C]' : 'bg-[#4D642D]'
                      }`}
                    >
                      {role === 'pemilik' ? (
                        <Crown className="h-3 w-3 text-white" />
                      ) : (
                        <ChefHat className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-[#36491C] max-w-[85px] sm:max-w-[140px] truncate leading-tight">
                        {userName}
                      </span>
                      <span className="text-[9px] font-semibold text-[#5F6B4F] leading-tight">
                        {role === 'pemilik' ? 'Pemilik' : 'Staf Dapur'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 px-2.5 sm:px-3 text-xs border-[#E0E2D8] text-[#C2410C] hover:bg-[#FEE2E2] hover:border-[#DC2626] rounded-full gap-1.5 font-semibold cursor-pointer"
                    title="Keluar dari sesi"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </Button>
                </div>
              ) : (
                /* Unauthenticated Guest: Show Masuk button */
                <Button
                  size="sm"
                  onClick={() => handleNavigate('masuk')}
                  className={`text-xs font-semibold h-8 px-3.5 rounded-full gap-1.5 shadow-xs cursor-pointer ${
                    activeTab === 'masuk' || activeTab === 'daftar'
                      ? 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                      : 'bg-[#4D642D] hover:bg-[#36491C] text-white'
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Masuk</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="md:hidden border-t border-[#E0E2D8] px-3 py-1.5 bg-[#FCF9F2]">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const isRestrictedForGuest = !user && protectedTabs.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-[#4D642D] text-white shadow-xs'
                        : isRestrictedForGuest
                        ? 'text-[#8E9B7E] bg-white/70 border border-[#E0E2D8]'
                        : 'text-[#5F6B4F] hover:text-[#1C2311] bg-white border border-[#E0E2D8]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {isRestrictedForGuest && (
                      <Lock className="h-2.5 w-2.5 opacity-60 text-[#8E9B7E]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content View Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#4D642D]" />
              <p className="text-xs text-[#5F6B4F]">Memuat sistem Dapur Nia...</p>
            </div>
          ) : (
            <>
              {/* 1. Public Menu Catalog (Accessible to guests without login) */}
              {activeTab === 'daftar-menu' && (
                <DaftarMenuPublic
                  key={`daftar-menu-${refreshTrigger}`}
                  onGoToKelolaMenu={() => handleNavigate('kelola-menu')}
                  isLoggedIn={Boolean(user)}
                />
              )}

              {/* 2. Kelola Menu (Owner Management with Add, Edit, Delete / Staf Review) */}
              {activeTab === 'kelola-menu' && user && (
                <MenuModule
                  key={`kelola-menu-${refreshTrigger}`}
                  onMenuChanged={handleDataChanged}
                  userRole={role}
                />
              )}

              {/* 3. Halaman Masuk (Login with Email & Password via Firebase Auth) */}
              {activeTab === 'masuk' && (
                <LoginPage
                  onSuccess={() => setActiveTab('kelola-menu')}
                  onGoToRegister={() => setActiveTab('daftar')}
                  onGoToHome={() => setActiveTab('daftar-menu')}
                />
              )}

              {/* 4. Halaman Daftar (Register Account with Role selection) */}
              {activeTab === 'daftar' && (
                <RegisterPage
                  onSuccess={() => setActiveTab('kelola-menu')}
                  onGoToLogin={() => setActiveTab('masuk')}
                  onGoToHome={() => setActiveTab('daftar-menu')}
                />
              )}

              {/* 5. Pelanggan Module */}
              {activeTab === 'pelanggan' && user && (
                <PelangganModule
                  key={`pelanggan-${refreshTrigger}`}
                  onPelangganChanged={handleDataChanged}
                />
              )}

              {/* 6. Pesanan Module */}
              {activeTab === 'pesanan' && user && (
                <PesananModule
                  key={`pesanan-${refreshTrigger}`}
                  onOrderChanged={handleDataChanged}
                />
              )}

              {/* 7. Laporan Module (Khusus Pemilik per PRD 2.2) */}
              {activeTab === 'laporan' && user && (
                role === 'pemilik' ? (
                  <LaporanModule key={`laporan-${refreshTrigger}`} />
                ) : (
                  <div className="bg-white/80 backdrop-blur-md border border-[#E0E2D8] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 my-8 shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center mx-auto text-[#DC2626]">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-[#1C2311]">
                      Akses Finansial Khusus Pemilik Usaha
                    </h3>
                    <p className="text-xs text-[#5F6B4F] leading-relaxed">
                      Modul ringkasan omzet harian dan pembukuan finansial hanya dapat diakses oleh akun dengan peran <strong>Pemilik Usaha</strong>.
                    </p>
                    <div className="pt-2">
                      <Button
                        onClick={() => handleNavigate('pesanan')}
                        className="bg-[#4D642D] hover:bg-[#36491C] text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer"
                      >
                        Buka Antrean Pesanan Dapur
                      </Button>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-white/60 py-4 bg-white/50 backdrop-blur-sm text-center text-xs text-[#5F6B4F]">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="hidden sm:inline-block font-bold text-[#C2410C]">
              Dapur Nia v1.0 <span className="font-normal">— Katering Harian Rumahan</span>
            </span>

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
