import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Simulate / Pause Fiber Laser Cutting' },
    { key: '1, 2, 3, 4', desc: 'Switch View: Shaded / Wireframe / Laser / Blueprint' },
    { key: 'Ctrl + Z', desc: 'Undo Parametric / Cut Changes' },
    { key: 'Ctrl + Y', desc: 'Redo Geometry Changes' },
    { key: 'G', desc: 'Toggle 3D Bed Floor Grid' },
    { key: 'D', desc: 'Toggle Dimension Annotation Overlays' },
    { key: 'A', desc: 'Toggle 3D Coordinate Axis Gizmo' },
    { key: 'F', desc: 'Toggle Fullscreen Workspace' },
    { key: '?', desc: 'Open / Close Shortcuts Cheatsheet' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl p-5 text-xs text-zinc-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Keyboard className="w-4 h-4" />
            <span>Industrial CAD Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition"
            >
              <span className="text-zinc-300 text-[11px]">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-mono text-[10px] font-semibold shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
