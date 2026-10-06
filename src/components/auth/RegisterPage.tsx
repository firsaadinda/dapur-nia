import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Crown,
  ChefHat,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface RegisterPageProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onGoToHome: () => void;
}

export function RegisterPage({ onSuccess, onGoToLogin, onGoToHome }: RegisterPageProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('pemilik');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
    }
    if (code === 'auth/weak-password') {
      return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format alamat email tidak valid.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela pendaftaran Google ditutup sebelum selesai.';
    }
    return err?.message || 'Gagal mendaftarkan akun. Silakan coba lagi.';
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (!email || email === 'pemilik.dapurnia@gmail.com' || email === 'staf.dapurnia@gmail.com') {
      setEmail(selectedRole === 'pemilik' ? 'pemilik.dapurnia@gmail.com' : 'staf.dapurnia@gmail.com');
    }
    if (!nama || nama === 'Bu Nia (Pemilik)' || nama === 'Rani (Staf Dapur)') {
      setNama(selectedRole === 'pemilik' ? 'Bu Nia (Pemilik)' : 'Rani (Staf Dapur)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nama.trim()) {
      setError('Silakan masukkan nama lengkap.');
      return;
    }
    if (nama.trim().length > 60) {
      setError('Nama tidak boleh lebih dari 60 karakter.');
      return;
    }
    if (!email.trim()) {
      setError('Silakan masukkan alamat email.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi harus minimal 6 karakter (disarankan 12-16 karakter).');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await signUp(nama, email, password, role);
      const roleText = role === 'pemilik' ? 'Bu Nia (Pemilik)' : 'Staf Dapur';
      toast.success(`Akun ${roleText} berhasil didaftarkan ke Firestore!`);
      onSuccess();
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      const name = user.displayName || 'Pengguna';
      toast.success(`Berhasil terhubung dengan Google! Selamat datang, ${name}`);
      onSuccess();
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white/95 backdrop-blur-md border border-[#E0E2D8] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Back to Home Button */}
        <button
          onClick={onGoToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5F6B4F] hover:text-[#36491C] mb-5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda (Daftar Menu)</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center">
            <img
              src="/images/logo-transparent.png"
              alt="Dapur Nia"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-bold font-heading text-[#36491C] tracking-tight">
            Daftar Akun Pengguna
          </h1>
          <p className="text-xs text-[#5F6B4F]">
            Daftarkan akun <strong>Bu Nia (Pemilik)</strong> atau <strong>Staf Dapur</strong> ke database katering.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-Up Button */}
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            disabled={googleLoading || loading}
            onClick={handleGoogleSignUp}
            className="w-full h-11 border-[#E0E2D8] hover:bg-[#F4F7EF] hover:border-[#36491C] text-[#1C2311] font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
          >
            {googleLoading ? (
              <span className="h-4 w-4 border-2 border-[#4D642D] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.02h3.88c2.27-2.09 3.66-5.17 3.66-9.11z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.12C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.59H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.41l4.04-3.12z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.12c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
            )}
            <span>Daftar Cepat dengan Akun Google</span>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E0E2D8]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-[#5F6B4F] font-medium">atau daftar dengan email</span>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Peran (Role Selector) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#1C2311]">
              Pilih Peran Pengguna (Role)
            </Label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Pemilik */}
              <div
                onClick={() => handleSelectRole('pemilik')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                  role === 'pemilik'
                    ? 'border-[#C2410C] bg-[#FFF7ED] text-[#C2410C] shadow-xs'
                    : 'border-[#E0E2D8] bg-white text-[#5F6B4F] hover:border-[#C2410C]/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    role === 'pemilik' ? 'bg-[#C2410C] text-white' : 'bg-[#F4F7EF] text-[#5F6B4F]'
                  }`}
                >
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <strong className="text-xs font-heading font-bold block">Bu Nia (Pemilik)</strong>
                  <span className="text-[10px] text-[#5F6B4F] leading-tight block mt-0.5">
                    Kelola menu, stok, omzet & finansial
                  </span>
                </div>
              </div>

              {/* Option 2: Staf Dapur */}
              <div
                onClick={() => handleSelectRole('staf')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                  role === 'staf'
                    ? 'border-[#4D642D] bg-[#F4F7EF] text-[#36491C] shadow-xs'
                    : 'border-[#E0E2D8] bg-white text-[#5F6B4F] hover:border-[#4D642D]/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    role === 'staf' ? 'bg-[#4D642D] text-white' : 'bg-[#F4F7EF] text-[#5F6B4F]'
                  }`}
                >
                  <ChefHat className="h-4 w-4" />
                </div>
                <div>
                  <strong className="text-xs font-heading font-bold block">Staf Dapur</strong>
                  <span className="text-[10px] text-[#5F6B4F] leading-tight block mt-0.5">
                    Antrean masak & verifikasi pesanan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-name" className="text-xs font-bold text-[#1C2311]">
              Nama Lengkap Pengguna
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-name"
                type="text"
                placeholder={role === 'pemilik' ? 'Contoh: Bu Nia' : 'Contoh: Rani (Staf Dapur)'}
                value={nama}
                maxLength={60}
                onChange={(e) => setNama(e.target.value)}
                className="pl-10 h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                required
                autoComplete="name"
              />
            </div>
            <div className="flex justify-end text-[10px] text-[#5F6B4F]">
              <span>{nama.length}/60 karakter</span>
            </div>
          </div>

          {/* Alamat Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-bold text-[#1C2311]">
              Alamat Email {role === 'pemilik' ? 'Pemilik' : 'Staf'}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-email"
                type="email"
                placeholder={role === 'pemilik' ? 'pemilik.dapurnia@gmail.com' : 'staf.dapurnia@gmail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Kata Sandi */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-bold text-[#1C2311]">
              Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6B4F] hover:text-[#1C2311] p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Ketentuan Sandi yang Diminta */}
            <div className="p-2.5 rounded-lg bg-[#F4F7EF] border border-[#D7DFC9] text-[11px] text-[#36491C] leading-relaxed flex items-start gap-2 mt-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#4D642D] mt-0.5" />
              <span>
                <strong>Ketentuan Sandi:</strong> Minimal 12 hingga 16 karakter, Gunakan gabungan huruf kapital (A-Z), huruf kecil (a-z), angka (0-9), serta simbol atau tanda baca.
              </span>
            </div>
          </div>

          {/* Konfirmasi Kata Sandi */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm-password" className="text-xs font-bold text-[#1C2311]">
              Konfirmasi Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Quick Tip info */}
          <div className="p-2.5 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-[11px] flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-[#C2410C] mt-0.5" />
            <span>
              Data pengguna akan langsung tersimpan di koleksi Firestore <strong>pengguna</strong> (di bawah pesanan).
            </span>
          </div>

          <Button
            type="submit"
            disabled={loading || googleLoading}
            className={`w-full font-bold h-11 rounded-xl shadow-xs gap-2 transition-all mt-2 cursor-pointer ${
              role === 'pemilik'
                ? 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                : 'bg-[#4D642D] hover:bg-[#36491C] text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mendaftarkan Akun {role === 'pemilik' ? 'Bu Nia' : 'Staf'}...
              </span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Daftar Akun {role === 'pemilik' ? 'Bu Nia (Pemilik)' : 'Staf'}
              </>
            )}
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="mt-5 pt-4 border-t border-[#E0E2D8] text-center text-xs text-[#5F6B4F]">
          Sudah memiliki akun?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-bold text-[#4D642D] hover:underline cursor-pointer ml-1"
          >
            Masuk di sini
          </button>
        </div>
      </div>
    </div>
  );
}
