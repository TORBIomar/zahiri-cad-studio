import React from 'react';
import { useToastStore, ToastType } from '../store/useToastStore';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          border: 'border-emerald-500/40',
          bg: 'bg-zinc-950/95 shadow-[0_8px_24px_rgba(16,185,129,0.15)]',
          bar: 'bg-emerald-400',
          titleColor: 'text-emerald-300',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          border: 'border-amber-500/40',
          bg: 'bg-zinc-950/95 shadow-[0_8px_24px_rgba(245,158,11,0.15)]',
          bar: 'bg-amber-400',
          titleColor: 'text-amber-300',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          border: 'border-rose-500/40',
          bg: 'bg-zinc-950/95 shadow-[0_8px_24px_rgba(244,63,94,0.15)]',
          bar: 'bg-rose-400',
          titleColor: 'text-rose-300',
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
          border: 'border-cyan-500/40',
          bg: 'bg-zinc-950/95 shadow-[0_8px_24px_rgba(6,182,212,0.15)]',
          bar: 'bg-cyan-400',
          titleColor: 'text-cyan-300',
        };
    }
  };

  return (
    <div className="fixed top-14 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const style = getStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-lg border backdrop-blur-xl p-3 text-xs text-zinc-200 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${style.border} ${style.bg}`}
          >
            <div className="flex items-start gap-2.5">
              {style.icon}
              <div className="flex-1 min-w-0 pr-2">
                <p className={`font-bold text-[12px] leading-tight ${style.titleColor}`}>
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Countdown animation bar */}
            {toast.duration && toast.duration > 0 && (
              <div
                className={`absolute bottom-0 left-0 h-0.5 ${style.bar} opacity-70 animate-[toast-progress_linear_forwards]`}
                style={{
                  animationDuration: `${toast.duration}ms`,
                  width: '100%',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
