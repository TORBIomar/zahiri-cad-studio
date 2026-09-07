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
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { triggerCameraPreset, CameraPreset } from './canvas/CameraController';

interface RoleSuperpowerBarProps {
  onOpenGCodeModal?: () => void;
}

export const RoleSuperpowerBar: React.FC<RoleSuperpowerBarProps> = ({ onOpenGCodeModal }) => {
  const { user, isGuest, setAuthModalOpen, setApprovalModalOpen, pendingUsers } = useAuthStore();
  const cadState = useCadStore();
  const { i18n } = useTranslation();
  const { showSuccess, showInfo, showWarning } = useToastStore();

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
    workflowStatus,
    workflowNotes,
    incidents,
    submitForApproval,
    approveProject,
    rejectProject,
    setIncidentModalOpen,
    setReviewIncidentsOpen,
  } = cadState;

  const [savingNotice, setSavingNotice] = useState<string | null>(null);
  const [isDraftingHubCollapsed, setIsDraftingHubCollapsed] = useState(false);
  const [pricingTier, setPricingTier] = useState<'usine' | 'atelier' | 'detail'>('usine');

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

    // Realistic wholesale raw material prices in Morocco (DH/kg)
    const rawCostPerKgMap: Record<string, number> = {
      steel_s235: 8.5,    // Acier S235 ordinaire: 8.5 DH/kg
      steel_304: 21.0,    // Acier Inox 304: 21.0 DH/kg
      aluminum_6061: 25.0,// Aluminium 6061: 25.0 DH/kg
      brass: 38.0,        // Laiton C36000: 38.0 DH/kg
      titanium_gr5: 140.0,// Titane Spécial: 140.0 DH/kg
    };
    const rawCostPerKg = rawCostPerKgMap[materialId] || 9.0;
    const materialCost = netWeightKg * rawCostPerKg;

    const enabledCuts = cuts.filter((c) => c.enabled);
    const cutTimeMin = (enabledCuts.length * 0.35 + (length / 1000) * 0.08) / (activeMaterial.cuttingSpeedFactor || 1);
    // Competitive workshop hourly machine rate: 95 DH/h (~1.58 DH/min)
    const machineCost = (cutTimeMin / 60) * 95;

    // Fixed tooling setup amortized across batch
    const setupFeePerUnit = Math.max(0.2, 10.0 / batchQuantity);

    const tierMultiplier = pricingTier === 'usine' ? 0.70 : pricingTier === 'atelier' ? 0.85 : 1.0;
    const unitCost = Math.max(3, Math.round((materialCost + machineCost + setupFeePerUnit) * tierMultiplier));
    const discountRate = batchQuantity >= 100 ? 0.75 : batchQuantity >= 50 ? 0.82 : batchQuantity >= 20 ? 0.90 : 1.0;
    const batchTotal = Math.round(unitCost * batchQuantity * discountRate);

    const tierLabel = pricingTier === 'usine' ? 'Tarif Usine Direct (-30%)' : pricingTier === 'atelier' ? 'Tarif Atelier (-15%)' : 'Tarif Catalogue';

    return {
      netWeightKg: netWeightKg.toFixed(2),
      materialCostDH: (materialCost * tierMultiplier).toFixed(1),
      machineCostDH: (machineCost * tierMultiplier).toFixed(1),
      unitCost,
      batchTotal: batchTotal.toLocaleString('fr-FR'),
      discount: batchQuantity >= 20 ? `${tierLabel} + Remise Lot` : tierLabel,
      cutTimeSec: Math.round(cutTimeMin * 60),
    };
  }, [length, outerRadius, wallThickness, rectWidth, rectHeight, profileType, materialId, cuts, activeMaterial, batchQuantity, pricingTier]);

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

  // 1. GUEST PREVIEW MODE: Floating sleek bottom HUD
  if (isGuest || !user) {
    return (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
        <div className="flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 glass-hud rounded-full text-xs text-zinc-200 border border-amber-500/40 shadow-[0_8px_32px_rgba(245,158,11,0.22)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-bold text-amber-300 text-xs tracking-wide">Mode Démo Invité</span>
          <span className="text-zinc-400 text-[11px] hidden sm:inline">
            Aperçu 3D interactif · Connexion requise pour Import .NC, G-Code & Exports
          </span>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="ml-1 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold rounded-full text-xs transition shadow-md shadow-amber-500/25 flex items-center gap-1.5 active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Se Connecter / Déverrouiller</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. CNC OPERATOR: Machine Shop & Laser Execution HUD
  if (user.role === 'ROLE_OPERATOR') {
    return (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-3xl px-4 transition-all duration-300">
        <div className="glass-hud rounded-2xl border border-cyan-500/40 p-2.5 px-3.5 flex items-center justify-between text-xs text-zinc-200 shadow-[0_8px_32px_rgba(6,182,212,0.18)]">
          {/* Laser Cut Simulator Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSetting('isLaserAnimating')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95 ${
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
                  className={`px-1.5 py-0.5 rounded-md transition ${
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

          {/* Machine Telemetry Gauges & Status */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono border-x border-zinc-800/80 px-3">
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

            {/* Workflow status badge in CNC HUD */}
            {workflowStatus === 'APPROVED' ? (
              <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> APPROUVÉ
              </span>
            ) : workflowStatus === 'ERROR_REPORTED' ? (
              <button
                onClick={() => setReviewIncidentsOpen(true)}
                className="text-[9px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 cursor-pointer"
                title="Consulter le rapport d'incident"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" /> INCIDENT ACTIF
              </button>
            ) : (
              <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> ATTENTE ADMIN
              </span>
            )}
          </div>

          {/* Machine Actions: Report Error & Stream G-Code */}
          <div className="flex items-center gap-2">
            {/* Operator Error Reporting Button - ALWAYS ACTIVE */}
            <button
              onClick={() => setIncidentModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-500/50 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-rose-500/20"
              title="Signaler une collision mandrin, perçage ou anomalie à l'Ingénieur"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Signaler Incident</span>
            </button>

            {/* G-Code Export: BLOCKED UNLESS APPROVED BY ADMIN */}
            {workflowStatus === 'APPROVED' ? (
              <button
                onClick={triggerGCode}
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 text-zinc-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95"
                title="Générer & Télécharger le G-Code (.NC) pour la machine"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>G-Code (.NC)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  showWarning(
                    'Export CNC Bloqué',
                    'Ce plan est en attente de validation par l\'Administrateur Usine. Seul le signalement d\'anomalie est autorisé pour le moment.'
                  );
                }}
                className="bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-not-allowed transition hover:border-amber-500/40"
                title="En attente de validation Admin - Export G-Code désactivé"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                <span>G-Code (Attente Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. PLANT ADMIN: Cost Quotation & Supervision Pipeline
  if (user.role === 'ROLE_ADMIN') {
    return (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-4xl px-4 transition-all duration-300">
        <div className="glass-hud rounded-2xl border border-emerald-500/40 p-2.5 px-3.5 flex items-center justify-between text-xs text-zinc-200 shadow-[0_8px_32px_rgba(16,185,129,0.18)]">
          {/* Batch & Tier Selectors */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
              {[1, 10, 50, 100].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setBatchQuantity(qty)}
                  className={`px-1.5 py-0.5 rounded-md font-mono font-semibold transition ${
                    batchQuantity === qty
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {qty}x
                </button>
              ))}
            </div>

            {/* Pricing Tier Switcher */}
            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
              <button
                onClick={() => setPricingTier('usine')}
                className={`px-1.5 py-0.5 rounded-md transition font-medium ${
                  pricingTier === 'usine'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Tarif Usine / Direct Fabricant (-30%)"
              >
                Usine
              </button>
              <button
                onClick={() => setPricingTier('atelier')}
                className={`px-1.5 py-0.5 rounded-md transition font-medium ${
                  pricingTier === 'atelier'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Tarif Atelier (-15%)"
              >
                Atelier
              </button>
              <button
                onClick={() => setPricingTier('detail')}
                className={`px-1.5 py-0.5 rounded-md transition font-medium ${
                  pricingTier === 'detail'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Tarif Standard Catalogue"
              >
                Catalogue
              </button>
            </div>
          </div>

          {/* Live Moroccan Cost Output (MAD / DH) */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono border-x border-zinc-800/80 px-3">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Unitaire HT</span>
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
          </div>

          {/* Supervision: Approve, Reject, or View Incident */}
          <div className="flex items-center gap-2">
            {workflowStatus === 'PENDING_APPROVAL' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    approveProject();
                    showSuccess('Projet Approuvé !', 'Ordre de fabrication validé pour la découpe laser CNC.');
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95"
                  title="Valider ce projet pour la production en atelier"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approuver</span>
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Motif du refus ou modifications demandées :') || 'Tolérances ou coûts non conformes';
                    rejectProject(reason);
                    showWarning('Projet Rejeté', `Renvoyé à l'Ingénieur: ${reason}`);
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition flex items-center gap-1 active:scale-95"
                  title="Refuser et demander des corrections à l'Ingénieur"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Refuser</span>
                </button>
              </div>
            )}

            {workflowStatus === 'APPROVED' && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>APPROUVÉ PROD</span>
              </div>
            )}

            {workflowStatus === 'ERROR_REPORTED' && (
              <button
                onClick={() => setReviewIncidentsOpen(true)}
                className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 animate-pulse"
                title="Consulter l'incident signalé par l'atelier"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Incident Atelier !</span>
              </button>
            )}

            <button
              onClick={() => setApprovalModalOpen(true)}
              className="relative bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-zinc-700 active:scale-95"
              title="Gérer et approuver les accès techniciens et ingénieurs"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Accès Utilisateurs</span>
              {pendingUsers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-zinc-950 font-black animate-pulse">
                  {pendingUsers.length}
                </span>
              )}
            </button>

            <button
              onClick={handleAdminPdf}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-zinc-700 active:scale-95"
              title="Generate Signed Technical Data Sheet & Quotation"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Devis PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. CAD ENGINEER: Precision Drafting & Parametrics Quick HUD
  if (isDraftingHubCollapsed) {
    return (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
        <button
          onClick={() => setIsDraftingHubCollapsed(false)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 glass-hud rounded-full text-xs text-amber-300 border border-amber-500/40 shadow-lg hover:border-amber-400 active:scale-95 transition"
          title="Expand CAD Drafting Hub"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-[11px]">CAD Drafting Hub</span>
          <ChevronUp className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
      <div className="flex items-center gap-2 px-3.5 py-1.5 glass-hud rounded-full text-xs text-zinc-200 border border-amber-500/40 shadow-[0_8px_32px_rgba(245,158,11,0.18)]">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold pr-2.5 border-r border-zinc-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-wide text-[11px]">CAD Drafting Hub</span>
        </div>

        {/* Laser Cut Quick Adders */}
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

        {/* Quick Camera Angle Presets for Engineer Convenience */}
        <div className="flex items-center gap-1 bg-zinc-900/90 px-2 py-0.5 rounded-full border border-zinc-800 text-[10px] font-mono">
          <span className="text-zinc-500 text-[9px] uppercase font-semibold mr-0.5">Cam:</span>
          {(['iso', 'top', 'front', 'right'] as CameraPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                triggerCameraPreset(preset);
                showSuccess('Camera View Changed', preset.toUpperCase());
              }}
              className="px-1.5 py-0.2 hover:bg-zinc-750 text-zinc-400 hover:text-amber-300 rounded font-bold uppercase transition active:scale-95"
              title={`Switch 3D Camera View to ${preset.toUpperCase()}`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="h-3 w-px bg-zinc-800 mx-0.5" />

        {/* Export and Save */}
        <button
          onClick={handleEngineerDxf}
          className="px-2.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-[11px] font-semibold transition flex items-center gap-1 active:scale-95"
          title="Export 2D DXF Unrolled Flat Pattern"
        >
          <Layers className="w-3 h-3" />
          <span>DXF</span>
        </button>

        <button
          onClick={handleCloudSave}
          className="px-2.5 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-full text-[11px] font-semibold transition flex items-center gap-1 active:scale-95"
          title="Save Design to MySQL Database"
        >
          <Save className="w-3 h-3" />
          <span>Cloud Sync</span>
        </button>

        <div className="h-3 w-px bg-zinc-800 mx-0.5" />

        {/* Workflow Action / Status Button */}
        {workflowStatus === 'ERROR_REPORTED' ? (
          <button
            onClick={() => setReviewIncidentsOpen(true)}
            className="px-2.5 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 rounded-full text-[11px] font-bold transition flex items-center gap-1 animate-pulse shadow-sm shadow-rose-500/30"
            title="Consulter et résoudre l'incident signalé par l'opérateur CNC"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Incident Signalé !</span>
          </button>
        ) : workflowStatus === 'PENDING_APPROVAL' ? (
          <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-[10px] font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>En Attente Admin</span>
          </span>
        ) : workflowStatus === 'APPROVED' ? (
          <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-[10px] font-mono flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Approuvé Prod</span>
          </span>
        ) : (
          <button
            onClick={() => {
              submitForApproval();
              showSuccess('Soumis à l\'Admin', 'Plan transmis au Superviseur pour validation laser.');
            }}
            className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-full text-[11px] transition flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95"
            title="Soumettre ce plan à l'Administrateur Usine pour validation"
          >
            <Send className="w-3 h-3" />
            <span>Soumettre à l'Admin</span>
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsDraftingHubCollapsed(true)}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition ml-0.5"
          title="Minimize Drafting Hub"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {savingNotice && (
          <span className="text-[10px] text-amber-400 font-mono animate-pulse">{savingNotice}</span>
        )}
      </div>
    </div>
  );
};
