import React, { useState } from 'react';
import { triggerCameraPreset, CameraPreset } from './CameraController';
import { useToastStore } from '../../store/useToastStore';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  HelpCircle,
  Eye,
  Grid3X3,
  Ruler,
} from 'lucide-react';
import { useCadStore } from '../../store/useCadStore';

interface ViewportToolbarProps {
  onOpenShortcuts?: () => void;
}

export const ViewportToolbar: React.FC<ViewportToolbarProps> = ({ onOpenShortcuts }) => {
  const { showSuccess } = useToastStore();
  const { showGrid, showDimensions, toggleSetting } = useCadStore();
  const [activePreset, setActivePreset] = useState<CameraPreset>('iso');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    triggerCameraPreset(preset);
    const labels: Record<CameraPreset, string> = {
      iso: 'Isometric 3D',
      top: 'Top View (Planar)',
      front: 'Front View (Z-Axis)',
      right: 'Right Cross-Section',
      reset: 'Re-centered Origin',
    };
    showSuccess('Camera View Changed', labels[preset]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="absolute top-3 right-3 z-20 pointer-events-auto flex items-center gap-1.5 transition-all">
      {/* View Presets Bar */}
      <div className="flex items-center glass-hud rounded-lg p-1 border border-zinc-800/90 shadow-xl text-xs">
        {(['iso', 'top', 'front', 'right'] as CameraPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => handlePreset(preset)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition active:scale-95 ${
              activePreset === preset
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
            title={`Align camera to ${preset.toUpperCase()} view`}
          >
            {preset}
          </button>
        ))}

        <div className="h-3 w-px bg-zinc-800 mx-1" />

        {/* Reset Camera Button */}
        <button
          onClick={() => handlePreset('reset')}
          className="p-1 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/80 rounded transition active:scale-95"
          title="Reset Camera Target & Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-zinc-800 mx-1" />

        {/* Grid Toggle */}
        <button
          onClick={() => toggleSetting('showGrid')}
          className={`p-1 rounded transition active:scale-95 ${
            showGrid ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle 3D Bed Grid (G)"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>

        {/* Dimension Overlay Toggle */}
        <button
          onClick={() => toggleSetting('showDimensions')}
          className={`p-1 rounded transition active:scale-95 ${
            showDimensions ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Dimension Labels (D)"
        >
          <Ruler className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-zinc-800 mx-1" />

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 rounded transition active:scale-95"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Keyboard Shortcuts Cheatsheet */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 rounded transition active:scale-95 ml-0.5"
            title="CAD Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
