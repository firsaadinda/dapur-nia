import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, User, Eye, EyeOff, UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterPageProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onGoToHome: () => void;
}

export function RegisterPage({ onSuccess, onGoToLogin, onGoToHome }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    return err?.message || 'Gagal mendaftarkan akun. Silakan coba lagi.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nama.trim()) {
      setError('Silakan masukkan nama lengkap atau nama pengelola.');
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
      setError('Kata sandi harus minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await signUp(nama, email, password);
      toast.success(`Akun berhasil dibuat! Selamat datang, ${nama}`);
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
            Daftar Akun Pemilik
          </h1>
          <p className="text-xs text-[#5F6B4F]">
            Buat akun baru untuk mengelola menu, harga, dan kuota katering Dapur Nia.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-name" className="text-xs font-bold text-[#1C2311]">
              Nama Pengguna / Pemilik
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-name"
                type="text"
                placeholder="Contoh: Ibu Nia / Firsa Adinda"
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

          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-bold text-[#1C2311]">
              Alamat Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-email"
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
            <Label htmlFor="reg-password" className="text-xs font-bold text-[#1C2311]">
              Kata Sandi (Minimal 6 Karakter)
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6B4F]" />
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
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
          </div>

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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#EF4D21] hover:bg-[#D44018] text-white font-bold h-11 rounded-xl shadow-xs gap-2 transition-all mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mendaftarkan Akun...
              </span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Daftar Akun
              </>
            )}
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 pt-5 border-t border-[#E0E2D8] text-center text-xs text-[#5F6B4F]">
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
