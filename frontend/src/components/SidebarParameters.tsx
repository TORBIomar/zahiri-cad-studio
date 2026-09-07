import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCadStore,
  ProfileType,
} from '../store/useCadStore';
import { CutFeatureManager } from './CutFeatureManager';
import {
  Circle,
  Square,
  RectangleHorizontal,
  Sliders,
  Plus,
  Trash2,
  Copy,
  Layers,
  Move,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

export const SidebarParameters: React.FC = () => {
  const { t } = useTranslation();
  const {
    tubes,
    activeTubeId,
    addTube,
    selectTube,
    deleteTube,
    duplicateTube,
    updateActiveTubeTransform,
    profileType,
    setProfileType,
    length,
    outerRadius,
    wallThickness,
    rectWidth,
    rectHeight,
    setTubeDimensions,
    isLeftSidebarOpen,
    toggleLeftSidebar,
    designLocked,
  } = useCadStore();

  const activeTube = tubes.find((t) => t.id === activeTubeId) || tubes[0];

  const presets = [
    { label: 'Ø80 × 3.5mm', type: 'round', r: 40, t: 3.5, l: 1200 },
    { label: 'Ø100 × 4.0mm', type: 'round', r: 50, t: 4.0, l: 1500 },
    { label: 'Square 60 × 3mm', type: 'square', r: 30, t: 3.0, l: 1000 },
    { label: 'Rect 80×50 × 3mm', type: 'rectangular', w: 80, h: 50, t: 3.0, l: 1200 },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    if (designLocked) return;
    setProfileType(preset.type as ProfileType);
    setTubeDimensions({
      length: preset.l,
      outerRadius: preset.r || 40,
      wallThickness: preset.t,
      rectWidth: preset.w || 80,
      rectHeight: preset.h || 50,
    });
  };

  return (
    <aside
      className={`drawer-transition flex flex-col h-[calc(100vh-3rem-1.75rem)] z-10 select-none bg-zinc-900/95 backdrop-blur-md border-r border-zinc-800/80 shrink-0 overflow-hidden ${
        isLeftSidebarOpen ? 'w-80' : 'w-12'
      }`}
    >
      {!isLeftSidebarOpen ? (
        <div className="flex flex-col items-center py-2.5 h-full w-12 text-zinc-400 animate-in fade-in duration-200">
          <button
            onClick={toggleLeftSidebar}
            className="p-1.5 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 rounded-md transition mb-3 active:scale-95"
            title="Expand CAD Parameters"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <button onClick={toggleLeftSidebar} className="p-1.5 hover:text-zinc-200" title="Cross-Section Profile">
              <Sliders className="w-3.5 h-3.5 text-amber-400/80" />
            </button>
            <button onClick={toggleLeftSidebar} className="p-1.5 hover:text-zinc-200" title="Cut Features">
              <Circle className="w-3.5 h-3.5 text-cyan-400/80" />
            </button>
            <button onClick={toggleLeftSidebar} className="p-1.5 hover:text-zinc-200" title="Tube Assembly">
              <Layers className="w-3.5 h-3.5 text-emerald-400/80" />
            </button>
          </div>

          <div className="mt-auto pb-4">
            <span className="text-[9px] font-mono [writing-mode:vertical-lr] rotate-180 text-zinc-500 uppercase tracking-widest font-semibold">
              Parameters
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full w-80 overflow-y-auto text-xs text-zinc-300 animate-in fade-in duration-200">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-zinc-100 text-xs uppercase tracking-wider">
                {t('parameters.title')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">ISO 10303</span>
              <button
                onClick={toggleLeftSidebar}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
                title="Collapse Parameters"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

      <div className="p-3 space-y-4">
        {designLocked && (
          <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2 rounded text-[11px] flex items-center gap-2 animate-in fade-in">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Inspection Lock Active: Geometry protected from accidental changes.</span>
          </div>
        )}
        {/* Multi-Tube Assembly Manager */}
        <div className="bg-zinc-950/90 p-2.5 rounded border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-zinc-200 text-[11px]">TUBE ASSEMBLY ({tubes.length})</span>
            </div>
            <button
              onClick={() => addTube('round')}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>Add Tube</span>
            </button>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {tubes.map((tube, idx) => {
              const isActive = tube.id === activeTubeId;
              return (
                <div
                  key={tube.id}
                  onClick={() => selectTube(tube.id)}
                  className={`p-1.5 rounded border text-xs cursor-pointer transition flex items-center justify-between ${
                    isActive
                      ? 'bg-zinc-900 border-amber-500 text-amber-400 font-semibold'
                      : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] text-zinc-500">#{idx + 1}</span>
                    <span className="truncate text-[11px]">{tube.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateTube(tube.id);
                      }}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition"
                      title="Duplicate Tube"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {tubes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTube(tube.id);
                        }}
                        className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded transition"
                        title="Delete Tube"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spatial 3D Positioning Controls for Active Tube */}
          {activeTube && (
            <div className="border-t border-zinc-800/80 pt-2 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Move className="w-3 h-3 text-cyan-400" />
                  <span>3D Spatial Offset:</span>
                </span>
                <span className="font-mono text-cyan-400">
                  X:{activeTube.position[0].toFixed(1)} Y:{activeTube.position[1].toFixed(1)} Z:{activeTube.position[2].toFixed(1)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <div className="text-[9px] text-zinc-400 mb-0.5">Pos X</div>
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    step={0.1}
                    value={activeTube.position[0]}
                    onChange={(e) =>
                      updateActiveTubeTransform({
                        position: [Number(e.target.value), activeTube.position[1], activeTube.position[2]],
                      })
                    }
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="text-[9px] text-zinc-400 mb-0.5">Pos Y</div>
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    step={0.1}
                    value={activeTube.position[1]}
                    onChange={(e) =>
                      updateActiveTubeTransform({
                        position: [activeTube.position[0], Number(e.target.value), activeTube.position[2]],
                      })
                    }
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="text-[9px] text-zinc-400 mb-0.5">Pos Z</div>
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    step={0.1}
                    value={activeTube.position[2]}
                    onChange={(e) =>
                      updateActiveTubeTransform({
                        position: [activeTube.position[0], activeTube.position[1], Number(e.target.value)],
                      })
                    }
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            {t('parameters.profileSection')} ({activeTube?.name})
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded border border-zinc-800">
            <button
              onClick={() => setProfileType('round')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition ${
                profileType === 'round'
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span className="text-[10px]">{t('parameters.profiles.round')}</span>
            </button>

            <button
              onClick={() => setProfileType('square')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition ${
                profileType === 'square'
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Square className="w-4 h-4" />
              <span className="text-[10px]">{t('parameters.profiles.square')}</span>
            </button>

            <button
              onClick={() => setProfileType('rectangular')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition ${
                profileType === 'rectangular'
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RectangleHorizontal className="w-4 h-4" />
              <span className="text-[10px]">{t('parameters.profiles.rectangular')}</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
            {t('parameters.standardSchedules')}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 p-1.5 rounded text-[10px] text-left transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 bg-zinc-950/70 p-2.5 rounded border border-zinc-800/80">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
            <span className="font-semibold text-zinc-200 text-[11px]">{t('parameters.primaryDimensions')}</span>
            <span className="text-[10px] font-mono text-amber-400">{t('parameters.millimeters')}</span>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-zinc-300">{t('parameters.totalLength')}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={length}
                  min={100}
                  max={3000}
                  step={10}
                  onChange={(e) => setTubeDimensions({ length: Number(e.target.value) })}
                  className="w-16 bg-zinc-900 border border-zinc-700 text-right text-amber-400 font-mono px-1 py-0.5 rounded text-xs focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-zinc-500">mm</span>
              </div>
            </div>
            <input
              type="range"
              min={200}
              max={3000}
              step={10}
              value={length}
              onChange={(e) => setTubeDimensions({ length: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {profileType === 'round' && (
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-zinc-300">{t('parameters.outerDiameter')}:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={outerRadius * 2}
                    min={20}
                    max={300}
                    step={1}
                    onChange={(e) => setTubeDimensions({ outerRadius: Number(e.target.value) / 2 })}
                    className="w-16 bg-zinc-900 border border-zinc-700 text-right text-cyan-400 font-mono px-1 py-0.5 rounded text-xs focus:border-cyan-500 outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={1}
                value={outerRadius}
                onChange={(e) => setTubeDimensions({ outerRadius: Number(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}

          {profileType === 'rectangular' && (
            <>
              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('parameters.width')}:</span>
                  <input
                    type="number"
                    value={rectWidth}
                    min={20}
                    max={200}
                    onChange={(e) => setTubeDimensions({ rectWidth: Number(e.target.value) })}
                    className="w-16 bg-zinc-900 border border-zinc-700 text-right text-cyan-400 font-mono px-1 py-0.5 rounded text-xs outline-none"
                  />
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={rectWidth}
                  onChange={(e) => setTubeDimensions({ rectWidth: Number(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('parameters.height')}:</span>
                  <input
                    type="number"
                    value={rectHeight}
                    min={20}
                    max={200}
                    onChange={(e) => setTubeDimensions({ rectHeight: Number(e.target.value) })}
                    className="w-16 bg-zinc-900 border border-zinc-700 text-right text-cyan-400 font-mono px-1 py-0.5 rounded text-xs outline-none"
                  />
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={rectHeight}
                  onChange={(e) => setTubeDimensions({ rectHeight: Number(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </>
          )}

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-zinc-300">{t('parameters.wallThickness')}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={wallThickness}
                  min={1}
                  max={15}
                  step={0.5}
                  onChange={(e) => setTubeDimensions({ wallThickness: Number(e.target.value) })}
                  className="w-16 bg-zinc-900 border border-zinc-700 text-right text-zinc-200 font-mono px-1 py-0.5 rounded text-xs outline-none"
                />
                <span className="text-[10px] text-zinc-500">mm</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={wallThickness}
              onChange={(e) => setTubeDimensions({ wallThickness: Number(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-zinc-300"
            />
          </div>
        </div>

        <CutFeatureManager />
      </div>
        </div>
      )}
    </aside>
  );
};
