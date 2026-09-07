import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCadStore,
  ProfileType,
} from '../store/useCadStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
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
  ArrowLeftRight,
  Compass,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const SidebarParameters: React.FC = () => {
  const { t } = useTranslation();
  const { user, isGuest, setAuthModalOpen } = useAuthStore();
  const { showWarning } = useToastStore();
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
    cornerRadius,
    weldSeamAngle,
    dimensionUnit,
    setDimensionUnit,
    setTubeDimensions,
    isLeftSidebarOpen,
    toggleLeftSidebar,
    designLocked,
  } = useCadStore();

  const isOperator = user?.role === 'ROLE_OPERATOR';
  const isLocked = designLocked || isOperator;

  const activeTube = tubes.find((t) => t.id === activeTubeId) || tubes[0];
  const unitDiv = dimensionUnit === 'cm' ? 10 : 1;
  const unitLabel = dimensionUnit;

  const presetsByProfile: Record<ProfileType, Array<{ label: string; sub: string; type: ProfileType; l: number; r?: number; w?: number; h?: number; t: number; cr?: number }>> = {
    round: [
      { label: '1" Sch 40', sub: 'Ø33.4×3.4', type: 'round', r: 16.7, t: 3.38, l: 1000 },
      { label: '2" Sch 10', sub: 'Ø60.3×2.8', type: 'round', r: 30.15, t: 2.77, l: 1200 },
      { label: 'Ø80 Heavy', sub: 'Ø80×4.0', type: 'round', r: 40, t: 4.0, l: 1200 },
      { label: 'Ø100 Shell', sub: 'Ø100×3.5', type: 'round', r: 50, t: 3.5, l: 1500 },
    ],
    square: [
      { label: '40×40 Light', sub: 'T: 2.5mm', type: 'square', r: 20, w: 40, h: 40, t: 2.5, cr: 3.0, l: 1000 },
      { label: '60×60 Struct', sub: 'T: 3.0mm', type: 'square', r: 30, w: 60, h: 60, t: 3.0, cr: 4.5, l: 1200 },
      { label: '80×80 Heavy', sub: 'T: 4.0mm', type: 'square', r: 40, w: 80, h: 80, t: 4.0, cr: 6.0, l: 1500 },
      { label: '100×100 Frame', sub: 'T: 5.0mm', type: 'square', r: 50, w: 100, h: 100, t: 5.0, cr: 8.0, l: 1800 },
    ],
    rectangular: [
      { label: '60×40 Rail', sub: 'T: 2.5mm', type: 'rectangular', r: 25, w: 60, h: 40, t: 2.5, cr: 3.0, l: 1000 },
      { label: '80×40 Beam', sub: 'T: 3.0mm', type: 'rectangular', r: 30, w: 80, h: 40, t: 3.0, cr: 4.0, l: 1200 },
      { label: '100×50 Gantry', sub: 'T: 4.0mm', type: 'rectangular', r: 35, w: 100, h: 50, t: 4.0, cr: 5.0, l: 1500 },
      { label: '120×60 Heavy', sub: 'T: 5.0mm', type: 'rectangular', r: 40, w: 120, h: 60, t: 5.0, cr: 6.0, l: 1800 },
    ],
  };

  const applyPreset = (preset: typeof presetsByProfile['round'][0]) => {
    if (isLocked) return;
    setProfileType(preset.type);
    setTubeDimensions({
      length: preset.l,
      outerRadius: preset.r || 40,
      wallThickness: preset.t,
      rectWidth: preset.w || 80,
      rectHeight: preset.h || 50,
      cornerRadius: preset.cr || 3.0,
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
        {isOperator ? (
          <div className="bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 p-2.5 rounded-xl text-[11px] flex items-start gap-2 animate-in fade-in shadow-sm">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Mode Opérateur CNC (Lecture Seule)</span>
              <span className="text-zinc-400 text-[10px] leading-tight block">
                Cotes figées par le Bureau d'Études. Les modifications géométriques sont réservées à l'Ingénieur CAD.
              </span>
            </div>
          </div>
        ) : designLocked ? (
          <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2 rounded text-[11px] flex items-center gap-2 animate-in fade-in">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Inspection Lock Active: Geometry protected from accidental changes.</span>
          </div>
        ) : null}
        {/* Multi-Tube Assembly Manager */}
        <div className="bg-zinc-950/90 p-2.5 rounded border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-zinc-200 text-[11px]">TUBE ASSEMBLY ({tubes.length})</span>
            </div>
            {!isLocked && (
              <button
                onClick={() => {
                  if (isGuest || !user) {
                    showWarning(
                      'Connexion Requise',
                      "L'assemblage multi-tubes nécessite un compte Ingénieur."
                    );
                    setAuthModalOpen(true);
                    return;
                  }
                  addTube('round');
                }}
                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>Add Tube</span>
              </button>
            )}
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

                  {!isLocked && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isGuest || !user) {
                            showWarning(
                              'Connexion Requise',
                              "La duplication de pièces nécessite un compte."
                            );
                            setAuthModalOpen(true);
                            return;
                          }
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Spatial 3D Positioning Controls for Active Tube */}
          {activeTube && (
            <fieldset disabled={isLocked} className="border-t border-zinc-800/80 pt-2 space-y-2 disabled:opacity-60">
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
            </fieldset>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            {t('parameters.profileSection')} ({activeTube?.name})
          </label>
          <fieldset disabled={isLocked} className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded border border-zinc-800 disabled:opacity-60">
            <button
              onClick={() => setProfileType('round')}
              className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 transition ${
                profileType === 'round'
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
              } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
              } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <RectangleHorizontal className="w-4 h-4" />
              <span className="text-[10px]">{t('parameters.profiles.rectangular')}</span>
            </button>
          </fieldset>
        </div>

        {/* Standard Industry Presets Tailored per Profile */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              {profileType === 'round' ? 'Pipe Schedules (ASTM/EN)' : profileType === 'square' ? 'Box Tube Sizes (EN 10219)' : 'Hollow Section Sizes (ISO)'}
            </label>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">{profileType}</span>
          </div>
          <fieldset disabled={isLocked} className="grid grid-cols-2 gap-1.5 disabled:opacity-50">
            {presetsByProfile[profileType].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className={`border border-zinc-800 p-1.5 rounded text-left transition flex flex-col ${
                  isLocked
                    ? 'bg-zinc-950/60 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-950 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100'
                }`}
              >
                <span className="text-[10px] font-semibold text-zinc-200">{preset.label}</span>
                <span className="text-[9px] font-mono text-zinc-500">{preset.sub}</span>
              </button>
            ))}
          </fieldset>
        </div>

        {/* Primary Parametric Dimensions & Profile Specialty Controls */}
        <div className="space-y-3 bg-zinc-950/70 p-2.5 rounded border border-zinc-800/80">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-200 text-[11px]">{t('parameters.primaryDimensions')}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-800 text-amber-400 rounded">
                {profileType === 'round' ? 'CHS' : profileType === 'square' ? 'SHS' : 'RHS'}
              </span>
            </div>

            {/* Unit Switcher: mm vs cm */}
            <div className="flex items-center bg-zinc-900 border border-zinc-750 rounded-md p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setDimensionUnit('mm')}
                className={`px-1.5 py-0.2 rounded transition font-bold ${
                  dimensionUnit === 'mm'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Millimeters (mm)"
              >
                mm
              </button>
              <button
                onClick={() => setDimensionUnit('cm')}
                className={`px-1.5 py-0.2 rounded transition font-bold ${
                  dimensionUnit === 'cm'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Centimeters (cm)"
              >
                cm
              </button>
            </div>
          </div>

          {/* Primary Parametric Dimensions Controls */}
          <fieldset disabled={isLocked} className="space-y-3 disabled:opacity-80">
          {/* Profile-Specific Industrial Specification Badge */}
          {profileType === 'round' && (
            <div className="flex items-center justify-between text-[9px] text-cyan-400 font-mono bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/30">
              <span className="flex items-center gap-1">
                <Circle className="w-2.5 h-2.5" /> EN 10210 CIRCULAR (CHS)
              </span>
              <span className="text-zinc-400">4-AXIS ROTARY</span>
            </div>
          )}

          {profileType === 'square' && (
            <div className="flex items-center justify-between text-[9px] text-amber-400 font-mono bg-amber-950/30 px-2 py-1 rounded border border-amber-800/30">
              <span className="flex items-center gap-1">
                <Square className="w-2.5 h-2.5" /> EN 10219 SQUARE (SHS)
              </span>
              <span className="text-zinc-400">4-FACE 90° INDEX</span>
            </div>
          )}

          {profileType === 'rectangular' && (
            <div className="flex items-center justify-between text-[9px] text-emerald-400 font-mono bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/30">
              <span className="flex items-center gap-1">
                <RectangleHorizontal className="w-2.5 h-2.5" /> ISO 12633 RECT (RHS)
              </span>
              <span className="text-zinc-400">DUAL-HEIGHT Z-TRACK</span>
            </div>
          )}

          {/* Total Length (All Profiles) */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-zinc-300">{t('parameters.totalLength')}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Number((length / unitDiv).toFixed(dimensionUnit === 'cm' ? 1 : 0))}
                  min={100 / unitDiv}
                  max={3000 / unitDiv}
                  step={dimensionUnit === 'cm' ? 1 : 10}
                  onChange={(e) => setTubeDimensions({ length: Number(e.target.value) * unitDiv })}
                  className="w-16 bg-zinc-900 border border-zinc-700 text-right text-amber-400 font-mono px-1 py-0.5 rounded text-xs focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-zinc-500">{unitLabel}</span>
              </div>
            </div>
            <input
              type="range"
              min={200 / unitDiv}
              max={3000 / unitDiv}
              step={dimensionUnit === 'cm' ? 1 : 10}
              value={Number((length / unitDiv).toFixed(dimensionUnit === 'cm' ? 1 : 0))}
              onChange={(e) => setTubeDimensions({ length: Number(e.target.value) * unitDiv })}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* --- ROUND PROFILE SPECIALTY CONTROLS --- */}
          {profileType === 'round' && (
            <>
              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('parameters.outerDiameter')}:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Number(((outerRadius * 2) / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                      min={20 / unitDiv}
                      max={300 / unitDiv}
                      step={dimensionUnit === 'cm' ? 0.1 : 1}
                      onChange={(e) => setTubeDimensions({ outerRadius: (Number(e.target.value) * unitDiv) / 2 })}
                      className="w-16 bg-zinc-900 border border-zinc-700 text-right text-cyan-400 font-mono px-1 py-0.5 rounded text-xs focus:border-cyan-500 outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">{unitLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10 / unitDiv}
                  max={150 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.1 : 1}
                  value={Number((outerRadius / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                  onChange={(e) => setTubeDimensions({ outerRadius: Number(e.target.value) * unitDiv })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Weld Seam Angle Alignment (Industrial ERW Feature) */}
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>Weld Seam Orientation:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={weldSeamAngle}
                      min={0}
                      max={359}
                      step={5}
                      onChange={(e) => setTubeDimensions({ weldSeamAngle: Number(e.target.value) })}
                      className="w-14 bg-zinc-900 border border-zinc-700 text-right text-amber-400 font-mono px-1 py-0.5 rounded text-xs focus:border-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">deg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={355}
                  step={5}
                  value={weldSeamAngle}
                  onChange={(e) => setTubeDimensions({ weldSeamAngle: Number(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-[9px] text-zinc-500 block mt-1">
                  Rotary weld bead line indicator for CNC pierce clearance.
                </span>
              </div>
            </>
          )}

          {/* --- SQUARE PROFILE SPECIALTY CONTROLS --- */}
          {profileType === 'square' && (
            <>
              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">Side Dimension (A × A):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Number(((outerRadius * 2) / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                      min={20 / unitDiv}
                      max={250 / unitDiv}
                      step={dimensionUnit === 'cm' ? 0.1 : 2}
                      onChange={(e) => {
                        const side = Number(e.target.value) * unitDiv;
                        setTubeDimensions({ outerRadius: side / 2, rectWidth: side, rectHeight: side });
                      }}
                      className="w-16 bg-zinc-900 border border-zinc-700 text-right text-amber-400 font-mono px-1 py-0.5 rounded text-xs focus:border-amber-500 outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">{unitLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10 / unitDiv}
                  max={125 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.1 : 1}
                  value={Number((outerRadius / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                  onChange={(e) => {
                    const r = Number(e.target.value) * unitDiv;
                    setTubeDimensions({ outerRadius: r, rectWidth: r * 2, rectHeight: r * 2 });
                  }}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Corner Fillet Radius */}
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">External Corner Radius (Rc):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Number((cornerRadius / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1))}
                      min={0}
                      max={15 / unitDiv}
                      step={dimensionUnit === 'cm' ? 0.05 : 0.5}
                      onChange={(e) => setTubeDimensions({ cornerRadius: Number(e.target.value) * unitDiv })}
                      className="w-14 bg-zinc-900 border border-zinc-700 text-right text-amber-400 font-mono px-1 py-0.5 rounded text-xs outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">{unitLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.05 : 0.5}
                  value={Number((cornerRadius / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1))}
                  onChange={(e) => setTubeDimensions({ cornerRadius: Number(e.target.value) * unitDiv })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-zinc-500">Standard: 2× Wall Thickness</span>
                  <button
                    onClick={() => setTubeDimensions({ cornerRadius: Math.min(15, Math.max(1, wallThickness * 2)) })}
                    className="text-[9px] font-mono text-amber-400 hover:text-amber-300 underline"
                  >
                    Auto {((wallThickness * 2) / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1)}{unitLabel}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* --- RECTANGULAR PROFILE SPECIALTY CONTROLS --- */}
          {profileType === 'rectangular' && (
            <>
              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('parameters.width')} (W):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Number((rectWidth / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                      min={20 / unitDiv}
                      max={250 / unitDiv}
                      step={dimensionUnit === 'cm' ? 0.1 : 1}
                      onChange={(e) => setTubeDimensions({ rectWidth: Number(e.target.value) * unitDiv })}
                      className="w-16 bg-zinc-900 border border-zinc-700 text-right text-emerald-400 font-mono px-1 py-0.5 rounded text-xs outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">{unitLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20 / unitDiv}
                  max={250 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.1 : 1}
                  value={Number((rectWidth / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                  onChange={(e) => setTubeDimensions({ rectWidth: Number(e.target.value) * unitDiv })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('parameters.height')} (H):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Number((rectHeight / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                      min={20 / unitDiv}
                      max={250 / unitDiv}
                      step={dimensionUnit === 'cm' ? 0.1 : 1}
                      onChange={(e) => setTubeDimensions({ rectHeight: Number(e.target.value) * unitDiv })}
                      className="w-16 bg-zinc-900 border border-zinc-700 text-right text-emerald-400 font-mono px-1 py-0.5 rounded text-xs outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">{unitLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20 / unitDiv}
                  max={250 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.1 : 1}
                  value={Number((rectHeight / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 0))}
                  onChange={(e) => setTubeDimensions({ rectHeight: Number(e.target.value) * unitDiv })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Aspect Ratio & Swap Orientation */}
              <div className="flex items-center justify-between bg-zinc-900/70 p-1.5 rounded border border-zinc-800 text-[10px]">
                <div className="flex items-center gap-1 font-mono text-zinc-400">
                  <span>Aspect Ratio:</span>
                  <span className="text-emerald-400 font-bold">{(rectWidth / Math.max(1, rectHeight)).toFixed(2)} : 1</span>
                </div>
                <button
                  onClick={() => setTubeDimensions({ rectWidth: rectHeight, rectHeight: rectWidth })}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 rounded flex items-center gap-1 transition text-[10px] font-semibold active:scale-95"
                  title="Swap Width and Height (90° Flip)"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Swap W ↔ H</span>
                </button>
              </div>

              {/* Corner Fillet Radius */}
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">Corner Radius (Rc):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Number((cornerRadius / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1))}
                      min={0}
                      max={15 / unitDiv}
                      step={dimensionUnit === 'cm' ? 0.05 : 0.5}
                      onChange={(e) => setTubeDimensions({ cornerRadius: Number(e.target.value) * unitDiv })}
                      className="w-14 bg-zinc-900 border border-zinc-700 text-right text-emerald-400 font-mono px-1 py-0.5 rounded text-xs outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">{unitLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.05 : 0.5}
                  value={Number((cornerRadius / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1))}
                  onChange={(e) => setTubeDimensions({ cornerRadius: Number(e.target.value) * unitDiv })}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-400"
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
                  value={Number((wallThickness / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1))}
                  min={1 / unitDiv}
                  max={15 / unitDiv}
                  step={dimensionUnit === 'cm' ? 0.05 : 0.5}
                  onChange={(e) => setTubeDimensions({ wallThickness: Number(e.target.value) * unitDiv })}
                  className="w-16 bg-zinc-900 border border-zinc-700 text-right text-zinc-200 font-mono px-1 py-0.5 rounded text-xs outline-none"
                />
                <span className="text-[10px] text-zinc-500">{unitLabel}</span>
              </div>
            </div>
            <input
              type="range"
              min={1 / unitDiv}
              max={15 / unitDiv}
              step={dimensionUnit === 'cm' ? 0.05 : 0.5}
              value={Number((wallThickness / unitDiv).toFixed(dimensionUnit === 'cm' ? 2 : 1))}
              onChange={(e) => setTubeDimensions({ wallThickness: Number(e.target.value) * unitDiv })}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-zinc-300"
            />
          </div>
          </fieldset>
        </div>

        <CutFeatureManager readOnly={isLocked} />
      </div>
        </div>
      )}
    </aside>
  );
};
