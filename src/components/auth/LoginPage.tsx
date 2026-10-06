import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, LogIn, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onGoToHome: () => void;
}

export function LoginPage({ onSuccess, onGoToRegister, onGoToHome }: LoginPageProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Email atau kata sandi yang Anda masukkan salah.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format alamat email tidak valid.';
    }
    if (code === 'auth/user-disabled') {
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela masuk Google ditutup sebelum selesai.';
    }
    return err?.message || 'Gagal masuk. Silakan periksa koneksi atau coba lagi.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Silakan masukkan alamat email.');
      return;
    }
    if (!password) {
      setError('Silakan masukkan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      const user = await signIn(email, password);
      const name = user.displayName || user.email?.split('@')[0] || 'Pengguna';
      toast.success(`Berhasil masuk! Selamat datang, ${name}`);
      onSuccess();
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      const name = user.displayName || 'Pengguna';
      toast.success(`Berhasil masuk dengan Google! Selamat datang, ${name}`);
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
            Masuk ke Dapur Nia
          </h1>
          <p className="text-xs text-[#5F6B4F]">
            Masuk sebagai <strong>Bu Nia (Pemilik)</strong> atau <strong>Staf Dapur</strong> untuk mengelola katering.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            disabled={googleLoading || loading}
            onClick={handleGoogleSignIn}
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
            <span>Masuk dengan Akun Google</span>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E0E2D8]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-[#5F6B4F] font-medium">atau masuk dengan email</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-bold text-[#1C2311]">
              Alamat Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="text-xs font-bold text-[#1C2311]">
              Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 border-[#E0E2D8] focus-visible:ring-[#4D642D]"
                required
                autoComplete="current-password"
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

          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-[#4D642D] hover:bg-[#36491C] text-white font-bold h-11 rounded-xl shadow-xs gap-2 transition-all mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sedang Memproses...
              </span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Masuk
              </>
            )}
          </Button>
        </form>

        {/* Quick Test Accounts Box */}
        <div className="mt-5 p-3 rounded-xl bg-[#F4F7EF] border border-[#D7DFC9] space-y-2">
          <div className="text-[11px] font-bold text-[#36491C] flex items-center justify-between">
            <span>Akun Pengujian Demo (Cepat):</span>
            <span className="text-[10px] text-[#5F6B4F]">Klik untuk isi otomatis</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('pemilik.dapurnia@gmail.com');
                setPassword('Password123!');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E0E2D8] hover:border-[#C2410C] hover:text-[#C2410C] text-[11px] text-left transition-colors cursor-pointer"
            >
              <strong className="block font-bold text-[#C2410C]">👑 Bu Nia (Pemilik)</strong>
              <span className="text-[10px] text-[#5F6B4F] truncate block">pemilik.dapurnia...</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('staf.dapurnia@gmail.com');
                setPassword('Password123!');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E0E2D8] hover:border-[#4D642D] hover:text-[#4D642D] text-[11px] text-left transition-colors cursor-pointer"
            >
              <strong className="block font-bold text-[#4D642D]">🍳 Rani (Staf Dapur)</strong>
              <span className="text-[10px] text-[#5F6B4F] truncate block">staf.dapurnia...</span>
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="mt-5 pt-4 border-t border-[#E0E2D8] text-center text-xs text-[#5F6B4F]">
          Belum memiliki akun pengelola?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-bold text-[#C2410C] hover:underline cursor-pointer ml-1"
          >
            Daftar di sini
          </button>
        </div>
      </div>
    </div>
  );
}
