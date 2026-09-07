import React from 'react';
import { useCadStore, MATERIALS } from '../store/useCadStore';
import { useAuthStore } from '../store/useAuthStore';
import { Grid3X3, Compass, Ruler, Cpu, Keyboard } from 'lucide-react';

interface StatusBarProps {
  onOpenShortcuts?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onOpenShortcuts }) => {
  const {
    showGrid,
    showAxes,
    showDimensions,
    toggleSetting,
    materialId,
    length,
    outerRadius,
  } = useCadStore();

  const { user, isGuest } = useAuthStore();
  const activeMaterial = MATERIALS[materialId] || MATERIALS.steel_304;

  const getRoleTag = () => {
    if (isGuest || !user) {
      return { text: 'GUEST PREVIEW', color: 'text-amber-400/90 border-amber-500/30 bg-amber-500/10' };
    }
    switch (user.role) {
      case 'ROLE_OPERATOR':
        return { text: 'CNC OPERATOR', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' };
      case 'ROLE_ADMIN':
        return { text: 'PLANT ADMIN', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
      default:
        return { text: 'CAD ENGINEER', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
    }
  };

  const roleTag = getRoleTag();

  return (
    <footer className="h-6.5 bg-zinc-950 border-t border-zinc-800/70 px-3 flex items-center justify-between text-[10px] text-zinc-400 z-20 select-none font-mono">
      <div className="flex items-center gap-3">
        {/* Viewport helper toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSetting('showGrid')}
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 active:scale-95 ${
              showGrid
                ? 'bg-zinc-800 text-amber-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle 3D Grid (G)"
          >
            <Grid3X3 className="w-3 h-3" />
            <span>Grid</span>
          </button>

          <button
            onClick={() => toggleSetting('showAxes')}
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 active:scale-95 ${
              showAxes
                ? 'bg-zinc-800 text-cyan-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Axis Gizmo (A)"
          >
            <Compass className="w-3 h-3" />
            <span>Axis</span>
          </button>

          <button
            onClick={() => toggleSetting('showDimensions')}
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 active:scale-95 ${
              showDimensions
                ? 'bg-zinc-800 text-emerald-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Dimension Overlays (D)"
          >
            <Ruler className="w-3 h-3" />
            <span>Dims</span>
          </button>
        </div>

        <div className="h-3 w-px bg-zinc-800" />

        <div className="text-zinc-400 hidden md:flex items-center gap-2">
          <span>DIM: L={length}mm · Ø={outerRadius * 2}mm</span>
        </div>
      </div>

      {/* Center: Active Role Tag */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded border font-semibold tracking-wider text-[9px] ${roleTag.color}`}>
          {roleTag.text}
        </span>

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-[9px]"
            title="Show CAD Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-2.5 h-2.5 text-amber-400" />
            <span>Shortcuts</span>
            <kbd className="text-[8px] bg-zinc-800 px-1 rounded text-zinc-400 font-bold">?</kbd>
          </button>
        )}
      </div>

      {/* Right: Engine & Material Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-zinc-300">
          <Cpu className="w-3 h-3 text-zinc-500" />
          <span className="truncate max-w-[120px]">{activeMaterial.name}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>60 FPS</span>
        </div>
      </div>
    </footer>
  );
};
