import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCadStore, MATERIALS } from '../store/useCadStore';
import { ProjectService } from '../services/projectService';
import { PdfExportService } from '../services/pdfExportService';
import { DxfExportService } from '../services/dxfExportService';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '../store/useToastStore';
import {
  Play,
  Pause,
  Zap,
  Shield,
  Layers,
  Lock,
  Unlock,
  FileSpreadsheet,
  FileCode,
  DollarSign,
  Package,
  Sparkles,
  Save,
  LogIn,
  CheckCircle2,
  Gauge,
  Clock,
  Plus,
  Compass,
} from 'lucide-react';

interface RoleSuperpowerBarProps {
  onOpenGCodeModal?: () => void;
}

export const RoleSuperpowerBar: React.FC<RoleSuperpowerBarProps> = ({ onOpenGCodeModal }) => {
  const { user, isGuest, setAuthModalOpen } = useAuthStore();
  const cadState = useCadStore();
  const { i18n } = useTranslation();
  const { showSuccess, showInfo } = useToastStore();

  const {
    isLaserAnimating,
    toggleSetting,
    laserSpeedMultiplier,
    setLaserSpeedMultiplier,
    designLocked,
    toggleDesignLock,
    batchQuantity,
    setBatchQuantity,
    materialId,
    laserPowerKW,
    assistGas,
    cuts,
    length,
    outerRadius,
    wallThickness,
    profileType,
    rectWidth,
    rectHeight,
    addCutFeature,
    setGCodeModalOpen,
  } = cadState;

  const [savingNotice, setSavingNotice] = useState<string | null>(null);

  const activeMaterial = MATERIALS[materialId] || MATERIALS.steel_304;

  // Live calculations for Admin Cost Estimator based on Moroccan industrial fabrication rates
  const costing = useMemo(() => {
    const lCm = length / 10;
    let crossSectionAreaCm2 = 0;
    if (profileType === 'round') {
      const rOuterCm = outerRadius / 10;
      const rInnerCm = Math.max(0, rOuterCm - wallThickness / 10);
      crossSectionAreaCm2 = Math.PI * (rOuterCm ** 2 - rInnerCm ** 2);
    } else {
      const wCm = (profileType === 'square' ? outerRadius * 2 : rectWidth) / 10;
      const hCm = (profileType === 'square' ? outerRadius * 2 : rectHeight) / 10;
      const tCm = wallThickness / 10;
      crossSectionAreaCm2 = wCm * hCm - Math.max(0, wCm - 2 * tCm) * Math.max(0, hCm - 2 * tCm);
    }
    const volumeCm3 = crossSectionAreaCm2 * lCm;
    const netWeightKg = (volumeCm3 * activeMaterial.density) / 1000;

    // Prix matières premières réels au Maroc (Casablanca / Tanger) en Dirhams (DH/kg)
    const rawCostPerKgMap: Record<string, number> = {
      steel_s235: 14.0,   // Acier S235 ordinaire: 14 DH/kg
      steel_304: 38.0,    // Acier Inox 304: 38 DH/kg
      aluminum_6061: 48.0,// Aluminium 6061: 48 DH/kg
      brass: 68.0,        // Laiton C36000: 68 DH/kg
      titanium_gr5: 320.0,// Titane Spécial: 320 DH/kg
    };
    const rawCostPerKg = rawCostPerKgMap[materialId] || 15.0;
    const materialCost = netWeightKg * rawCostPerKg;

    const enabledCuts = cuts.filter((c) => c.enabled);
    const cutTimeMin = (enabledCuts.length * 0.45 + (length / 1000) * 0.1) / (activeMaterial.cuttingSpeedFactor || 1);
    // Taux horaire machine laser fibre au Maroc: ~210 DH/heure (soit ~3.5 DH/min)
    const machineCost = (cutTimeMin / 60) * 210;

    // Frais de calage / mandrin rotatif atelier: 12 DH
    const setupFeeDH = 12.0;

    const unitCost = Math.round(Math.max(25, materialCost + machineCost + setupFeeDH));
    const discountRate = batchQuantity >= 50 ? 0.88 : batchQuantity >= 20 ? 0.94 : 1.0;
    const batchTotal = Math.round(unitCost * batchQuantity * discountRate);

    return {
      netWeightKg: netWeightKg.toFixed(2),
      materialCostDH: materialCost.toFixed(1),
      machineCostDH: machineCost.toFixed(1),
      unitCost,
      batchTotal: batchTotal.toLocaleString('fr-FR'),
      discount: batchQuantity >= 50 ? 'Remise Volume -12%' : batchQuantity >= 20 ? 'Remise Volume -6%' : 'Tarif Normal',
      cutTimeSec: Math.round(cutTimeMin * 60),
    };
  }, [length, outerRadius, wallThickness, rectWidth, rectHeight, profileType, materialId, cuts, activeMaterial, batchQuantity]);

  const handleCloudSave = async () => {
    showInfo('Sauvegarde CAD...', 'Synchronisation avec la base de données cloud');
    const res = await ProjectService.saveProject(cadState);
    showSuccess('Cloud Sync Réussi', res.message);
  };

  const handleAdminPdf = () => {
    PdfExportService.exportTechnicalDataSheet(cadState, i18n.language, {
      unitCost: costing.unitCost,
      batchTotal: costing.batchTotal,
      batchQuantity,
      materialCostDH: costing.materialCostDH,
      machineCostDH: costing.machineCostDH,
    });
    showSuccess('Devis Officiel PDF', `Devis établi pour lot de ${batchQuantity} pièces (${costing.batchTotal} DH)`);
  };

  const handleEngineerDxf = () => {
    DxfExportService.exportSheetMetalDxf(cadState);
    showSuccess('DXF Vector Exported', 'Unrolled flat pattern ready for laser CAM');
  };

  const handleToggleLock = () => {
    toggleDesignLock();
    if (!designLocked) {
      showSuccess('Inspection Lock Enabled', 'Geometry dimensions protected from modifications');
    } else {
      showInfo('Inspection Lock Disabled', 'Dimensions unlocked for editing');
    }
  };

  const triggerGCode = () => {
    if (onOpenGCodeModal) onOpenGCodeModal();
    else setGCodeModalOpen(true);
  };

  // 1. GUEST PREVIEW MODE: Floating sleek chip
  if (isGuest || !user) {
    return (
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 glass-hud rounded-full text-xs text-zinc-200 border border-amber-500/30 shadow-[0_4px_24px_rgba(245,158,11,0.12)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-semibold text-amber-300 text-[11px] tracking-wide">Guest CAD Preview</span>
          <span className="text-zinc-500 text-[11px] hidden sm:inline">• Full 3D & Cuts Unlocked</span>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="ml-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-full text-[11px] transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In for Roles</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. CNC OPERATOR: Machine Shop & Laser Execution HUD
  if (user.role === 'ROLE_OPERATOR') {
    return (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-2xl px-4 transition-all duration-300">
        <div className="glass-hud rounded-2xl border border-cyan-500/40 p-2.5 px-3.5 flex items-center justify-between text-xs text-zinc-200 shadow-[0_8px_32px_rgba(6,182,212,0.18)]">
          {/* Laser Cut Simulator Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => toggleSetting('isLaserAnimating')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition text-xs active:scale-95 ${
                isLaserAnimating
                  ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/30'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80'
              }`}
              title="Toggle Fiber Laser Cut Simulation"
            >
              {isLaserAnimating ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Laser Running</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                  <span>Simulate Cut</span>
                </>
              )}
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setLaserSpeedMultiplier(speed)}
                  className={`px-2 py-0.5 rounded-md transition ${
                    laserSpeedMultiplier === speed
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Machine Telemetry Gauges */}
          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono border-x border-zinc-800/80 px-4">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-400 text-[10px]">Gas:</span>
              <span className="text-zinc-100 font-bold uppercase">{assistGas === 'nitrogen' ? 'N₂ 18 Bar' : 'O₂ 6 Bar'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400 text-[10px]">Cycle:</span>
              <span className="text-zinc-100 font-bold">{costing.cutTimeSec}s</span>
            </div>
          </div>

          {/* Machine Actions & Guard Lock */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLock}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-[11px] active:scale-95 ${
                designLocked
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title={designLocked ? 'Design Locked for Shop Floor Inspection' : 'Design Unlocked'}
            >
              {designLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span className="hidden md:inline font-medium">{designLocked ? 'Guard Active' : 'Lock Dims'}</span>
            </button>

            <button
              onClick={triggerGCode}
              className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95"
              title="Stream G-Code to Fiber Laser CNC Machine"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Send to CNC (.NC)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. PLANT ADMIN: Cost Quotation & Manufacturing Batch Deck
  if (user.role === 'ROLE_ADMIN') {
    return (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-3xl px-4 transition-all duration-300">
        <div className="glass-hud rounded-2xl border border-emerald-500/40 p-3 flex items-center justify-between text-xs text-zinc-200 shadow-[0_8px_32px_rgba(16,185,129,0.18)]">
          {/* Batch Selector */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5 text-[11px]">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              Batch:
            </span>
            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
              {[1, 10, 50, 100].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setBatchQuantity(qty)}
                  className={`px-2.5 py-0.5 rounded-md font-mono font-semibold transition ${
                    batchQuantity === qty
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {qty}x
                </button>
              ))}
            </div>
          </div>

          {/* Live Moroccan Cost Output (MAD / DH) */}
          <div className="flex items-center gap-4 text-[11px] font-mono border-x border-zinc-800/80 px-4">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Prix Unitaire HT</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-zinc-100 text-sm">{costing.unitCost}</span>
                <span className="text-emerald-400 font-bold text-[10px]">DH</span>
              </div>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Total Lot ({batchQuantity}x)</span>
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-emerald-400 text-base">{costing.batchTotal}</span>
                <span className="text-emerald-300 font-bold text-[10px]">DH</span>
              </div>
            </div>
            <div className="hidden lg:flex flex-col text-[9px] text-zinc-400 font-mono leading-tight">
              <span>Matière: {costing.materialCostDH} DH</span>
              <span>Usinage: {costing.machineCostDH} DH</span>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full hidden md:inline font-semibold">
              {costing.discount}
            </span>
          </div>

          {/* Official Engineering Spec PDF Sign-Off */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdminPdf}
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95"
              title="Generate Signed Technical Data Sheet & Quotation"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Official PDF Quote</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. CAD ENGINEER: Precision Drafting & Parametrics Quick HUD
  return (
    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
      <div className="flex items-center gap-2 px-3.5 py-1.5 glass-hud rounded-full text-xs text-zinc-200 border border-amber-500/30 shadow-[0_4px_24px_rgba(245,158,11,0.12)]">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold pr-2.5 border-r border-zinc-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-wide text-[11px]">CAD Drafting Hub</span>
        </div>

        <button
          onClick={() => addCutFeature('hole')}
          className="px-2 py-0.5 hover:bg-zinc-800 rounded-md text-[11px] text-zinc-300 hover:text-white transition flex items-center gap-1 active:scale-95"
          title="Add Laser Hole"
        >
          <Plus className="w-3 h-3 text-amber-400" />
          <span>Hole</span>
        </button>

        <button
          onClick={() => addCutFeature('slot')}
          className="px-2 py-0.5 hover:bg-zinc-800 rounded-md text-[11px] text-zinc-300 hover:text-white transition flex items-center gap-1 active:scale-95"
          title="Add Laser Slot"
        >
          <Plus className="w-3 h-3 text-amber-400" />
          <span>Slot</span>
        </button>

        <div className="h-3 w-px bg-zinc-800 mx-0.5" />

        <button
          onClick={handleEngineerDxf}
          className="px-2.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-[11px] font-semibold transition flex items-center gap-1 active:scale-95"
          title="Export 2D DXF Unrolled Flat Pattern"
        >
          <Layers className="w-3 h-3" />
          <span>DXF Vector</span>
        </button>

        <button
          onClick={handleCloudSave}
          className="px-2.5 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-full text-[11px] font-semibold transition flex items-center gap-1 active:scale-95"
          title="Save Design to MySQL Database"
        >
          <Save className="w-3 h-3" />
          <span>Cloud Sync</span>
        </button>

        {savingNotice && (
          <span className="text-[10px] text-amber-400 font-mono animate-pulse">{savingNotice}</span>
        )}
      </div>
    </div>
  );
};
