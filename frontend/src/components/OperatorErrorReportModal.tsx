import React, { useState } from 'react';
import { useCadStore, IncidentCategory } from '../store/useCadStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { AlertTriangle, X, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export const OperatorErrorReportModal: React.FC = () => {
  const { showWarning, showError } = useToastStore();
  const {
    isIncidentModalOpen,
    setIncidentModalOpen,
    reportMachineIncident,
    cuts,
  } = useCadStore();
  const { user } = useAuthStore();

  const [category, setCategory] = useState<IncidentCategory>('clamp_collision');
  const [severity, setSeverity] = useState<'critical' | 'warning'>('critical');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  if (!isIncidentModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const operatorName = user?.fullName || user?.email || 'Laser CNC Operator';
    const finalTitle = title.trim() || getDefaultTitle(category);

    const selectedCut = cuts.find((c) => c.id === selectedFeatureId);

    reportMachineIncident({
      reportedBy: operatorName,
      severity,
      category,
      title: finalTitle,
      details: details.trim() || 'No additional commentary provided. Please inspect chuck clamp zone and piercing tolerances.',
      featureId: selectedFeatureId || undefined,
      positionZ: selectedCut?.positionZ,
    });

    if (severity === 'critical') {
      showError(
        'Incident Machine Signalé !',
        `Production suspendue. Rapport transmis d'urgence au Bureau d'Études (Ingénieur CAD).`
      );
    } else {
      showWarning(
        'Avertissement Transmis',
        `Note d'atelier enregistrée pour révision par l'Ingénieur CAD.`
      );
    }

    // Reset form
    setTitle('');
    setDetails('');
  };

  const getDefaultTitle = (cat: IncidentCategory) => {
    switch (cat) {
      case 'clamp_collision':
        return 'Risque de Collision Mandrin / Mors rotatif';
      case 'pierce_failure':
        return 'Défaut de Perçage / Chevauchement Saignée Laser';
      case 'tolerance_defect':
        return 'Écart Dimensionnel Hors Tolérances Usinage';
      case 'gas_pressure':
        return 'Pression Gaz d\'Assistance / Dégagement Buse Incompatible';
      default:
        return 'Anomalie Détectée en Atelier Laser CNC';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-rose-500/50 rounded-2xl shadow-[0_16px_48px_rgba(244,63,94,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900/90 border-b border-rose-500/30">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Signaler une Anomalie à l'Ingénieur CAD
              </h2>
              <p className="text-xs text-zinc-400">
                Atelier CNC Fibre • Remontée immédiate d'incident d'usinage
              </p>
            </div>
          </div>
          <button
            onClick={() => setIncidentModalOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-zinc-300">
          {/* Severity toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Niveau de Gravité
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition ${
                  severity === 'critical'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>CRITIQUE (Arrêt Production)</span>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('warning')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition ${
                  severity === 'warning'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>AVERTISSEMENT (Amélioration)</span>
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Type d'Incident Détecté
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              <option value="clamp_collision">💥 Collision Mors Mandrin Rotatif (Z trop proche du mandrin &lt;40mm)</option>
              <option value="pierce_failure">⚡ Perçage Défectueux / Entraxe Perçages trop rapproché</option>
              <option value="tolerance_defect">📏 Tolérance Dimensionnelle / Déformation Thermique</option>
              <option value="gas_pressure">💨 Pression Gaz Azote/Oxygène ou Buse Incompatible</option>
              <option value="other">⚠️ Autre Anomalie Physique d'Atelier</option>
            </select>
          </div>

          {/* Affected Feature */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Feature CAD Concernée (Optionnel)
            </label>
            <select
              value={selectedFeatureId}
              onChange={(e) => setSelectedFeatureId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500 font-mono text-xs"
            >
              <option value="">-- Toute la pièce / Général --</option>
              {cuts.map((cut) => (
                <option key={cut.id} value={cut.id}>
                  {cut.name} (Z={cut.positionZ}mm, {cut.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Titre Sommaire
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getDefaultTitle(category)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Explications & Recommandations pour l'Ingénieur
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ex: Le trou Ø30mm est positionné à Z=25mm, les mors de serrage du mandrin 4 mors vont entrer en collision avec la buse laser. Merci de décaler Z à au moins 50mm ou modifier la prise de pièce."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none font-sans"
              required
            />
          </div>

          {/* Safety note */}
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300/90 text-[11px] flex items-start gap-2">
            <Cpu className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              Ce signalement mettra la fabrication en pause et créera un ticket prioritaire directement visible par le Concepteur CAD et le Superviseur Usine.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setIncidentModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-2 active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Transmettre le Rapport à l'Ingénieur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
