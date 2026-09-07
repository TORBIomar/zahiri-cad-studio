import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, UserRole } from '../store/useAuthStore';
import {
  Zap,
  X,
  Lock,
  Mail,
  User,
  Building2,
  Shield,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    login,
    register,
    loginWithDemo,
    continueAsGuest,
    isLoading,
    error,
    setError,
  } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('ROLE_ENGINEER');
  const [company, setCompany] = useState('Zahiri Metal');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isAuthModalOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusNotice(null);

    if (tab === 'login') {
      const res = await login(email, password);
      if (res.success) {
        setStatusNotice(res.message);
        setTimeout(() => {
          setStatusNotice(null);
          setAuthModalOpen(false);
        }, 800);
      }
    } else {
      if (!fullName.trim()) {
        setError('Full Name is required for registration.');
        return;
      }
      const res = await register({
        email,
        password,
        fullName,
        role,
        company,
      });
      if (res.success) {
        setStatusNotice(res.message);
        setTimeout(() => {
          setStatusNotice(null);
          setAuthModalOpen(false);
        }, 800);
      }
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setStatusNotice(null);
    const res = await loginWithDemo(demoRole);
    if (res.success) {
      setStatusNotice(res.message);
      setTimeout(() => {
        setStatusNotice(null);
        setAuthModalOpen(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl shadow-black overflow-hidden flex flex-col">
        {/* Header Ribbon with Brand */}
        <div className="bg-gradient-to-r from-amber-500/15 via-zinc-800 to-amber-500/10 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Zap className="w-5 h-5 fill-amber-400/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-zinc-100 tracking-wider text-sm">
                  ZAHIRI <span className="text-amber-400">METAL</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CAD Cloud
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Parametric Fiber Laser CAD Portal</p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
              tab === 'login'
                ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
              tab === 'register'
                ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Register Account
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[80vh] space-y-4">
          {/* Quick Demo Access Bar */}
          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">1-Click Sign In</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('ROLE_ENGINEER')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 hover:border-amber-500/60 rounded flex flex-col items-center text-center transition group"
              >
                <Cpu className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-zinc-200">CAD Engineer</span>
                <span className="text-[9px] text-zinc-400 font-mono">engineer@cad.com</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('ROLE_OPERATOR')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/30 hover:border-cyan-500/60 rounded flex flex-col items-center text-center transition group"
              >
                <Zap className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-zinc-200">CNC Operator</span>
                <span className="text-[9px] text-zinc-400 font-mono">cnc@cad.com</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('ROLE_ADMIN')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 hover:border-emerald-500/60 rounded flex flex-col items-center text-center transition group"
              >
                <Shield className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-zinc-200">Plant Admin</span>
                <span className="text-[9px] text-zinc-400 font-mono">admin@cad.com</span>
              </button>
            </div>
            <div className="text-[10px] text-zinc-400 text-center font-mono pt-0.5">
              Default password for all users: <span className="text-amber-400 font-bold">123</span>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-md flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {statusNotice && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Full Name & Title
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Omar Torbi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Organization / Plant
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Zahiri Metal"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Industrial Role
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none transition cursor-pointer"
                      >
                        <option value="ROLE_ENGINEER" className="bg-zinc-900">CAD Engineer</option>
                        <option value="ROLE_OPERATOR" className="bg-zinc-900">CNC Operator</option>
                        <option value="ROLE_ADMIN" className="bg-zinc-900">Plant Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="engineer@cad.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-9 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-md text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Sign In to Workspace' : 'Create Engineering Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Mode Preview Option */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={continueAsGuest}
              className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-md text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <span>Continue in Guest Mode (Full CAD Preview)</span>
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-1.5">
              Instant access to 3D parametric tube CAD, CSG cuts, G-Code & DXF export.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
