import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, LogIn, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onGoToHome: () => void;
}

export function LoginPage({ onSuccess, onGoToRegister, onGoToHome }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const name = user.displayName || user.email?.split('@')[0] || 'Pemilik';
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

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white/90 backdrop-blur-md border border-[#E0E2D8] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Back to Home Button */}
        <button
          onClick={onGoToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5F6B4F] hover:text-[#36491C] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda (Daftar Menu)</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
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
            Masuk dengan email dan kata sandi pemilik untuk mengelola menu katering.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

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
                placeholder="••••••••"
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
          </div>

          <Button
            type="submit"
            disabled={loading}
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

        {/* Switch to Register */}
        <div className="mt-6 pt-5 border-t border-[#E0E2D8] text-center text-xs text-[#5F6B4F]">
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
