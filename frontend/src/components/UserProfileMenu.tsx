import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore, UserRole } from '../store/useAuthStore';
import {
  User,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
} from 'lucide-react';

export const UserProfileMenu: React.FC = () => {
  const { user, isGuest, logout, setAuthModalOpen, setApprovalModalOpen, pendingUsers, backendConnected } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isGuest || !user) {
    return null;
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ROLE_ENGINEER':
        return {
          label: 'CAD Engineer',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotClass: 'bg-amber-400',
        };
      case 'ROLE_OPERATOR':
        return {
          label: 'CNC Operator',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          dotClass: 'bg-cyan-400',
        };
      case 'ROLE_ADMIN':
        return {
          label: 'Plant Admin',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotClass: 'bg-emerald-400',
        };
      default:
        return {
          label: 'Specialist',
          badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          dotClass: 'bg-zinc-400',
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);
  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-md transition text-xs select-none"
        title="Account & Role Profile"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600 flex items-center justify-center font-bold text-[10px] text-amber-300 shadow-inner">
          {initials}
        </div>
        <div className="flex flex-col text-left leading-tight hidden sm:flex">
          <span className="text-zinc-200 font-medium text-[11px] truncate max-w-[110px]">
            {user.fullName.split(' ')[0]}
          </span>
          <span className={`text-[9px] font-mono uppercase tracking-wider px-1 rounded border inline-block ${roleInfo.badgeClass}`}>
            {roleInfo.label}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl shadow-black/80 z-50 p-3 text-xs animate-in fade-in slide-in-from-top-2">
          {/* User info header */}
          <div className="flex items-start gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center font-bold text-sm text-amber-300">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-100 truncate text-[13px]">{user.fullName}</p>
              <p className="text-zinc-400 text-[11px] truncate font-mono">{user.email}</p>
              {user.company && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1">
                  <Building2 className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{user.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role and Permissions Section */}
          <div className="py-2.5 border-b border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Active Role:
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${roleInfo.badgeClass}`}>
                {roleInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-zinc-500 flex items-center gap-1">
                {backendConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Spring Boot API Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-400">Offline CAD Session</span>
                  </>
                )}
              </span>
              <span className="text-zinc-500 font-mono text-[9px]">MySQL 8 Sync</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-1">
            {user.role === 'ROLE_ADMIN' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setApprovalModalOpen(true);
                }}
                className="w-full py-1.5 px-2 hover:bg-zinc-800 rounded text-left text-[11px] text-zinc-200 hover:text-white flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="font-semibold text-emerald-300">Approbations Usine</span>
                </div>
                {pendingUsers.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500 text-zinc-950 font-black">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full py-1.5 px-2 hover:bg-zinc-800 rounded text-left text-[11px] text-zinc-200 hover:text-white flex items-center gap-2 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch User / Role</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full py-1.5 px-2 hover:bg-rose-500/10 hover:text-rose-300 text-zinc-400 rounded text-left text-[11px] flex items-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out to Guest Mode</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
