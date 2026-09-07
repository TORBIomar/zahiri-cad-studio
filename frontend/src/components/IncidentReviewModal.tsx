import React, { useState } from 'react';
import { useCadStore, MachineIncident } from '../store/useCadStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  User,
  Wrench,
  Flame,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const IncidentReviewModal: React.FC = () => {
  const { showSuccess } = useToastStore();
  const {
    isReviewIncidentsOpen,
    setReviewIncidentsOpen,
    incidents,
    resolveIncident,
    workflowStatus,
    submitForApproval,
  } = useCadStore();
  const { user } = useAuthStore();

  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  if (!isReviewIncidentsOpen) return null;

  const handleResolve = (incident: MachineIncident) => {
    const note = resolutionNotes[incident.id] || 'Modifications géométriques CAD appliquées par l\'Ingénieur.';
    resolveIncident(incident.id, note);
    showSuccess('Incident Résolu', `L'anomalie '${incident.title}' a été corrigée.`);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'clamp_collision':
        return { label: 'Collision Mandrin', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
      case 'pierce_failure':
        return { label: 'Défaut Perçage', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'tolerance_defect':
        return { label: 'Tolérance Usinage', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
      case 'gas_pressure':
        return { label: 'Gaz d\'Assistance', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      default:
        return { label: 'Atelier CNC', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
    }
  };

  const isEngineer = user?.role === 'ROLE_ENGINEER' || user?.role === 'ROLE_ADMIN';
  const unresolvedCount = incidents.filter((i) => !i.resolved).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${unresolvedCount > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {unresolvedCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Rapports d'Incidents & Retours Atelier CNC
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${unresolvedCount > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {unresolvedCount} actif{unresolvedCount > 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Communication directe entre Opérateur CNC et Concepteur CAD
              </p>
            </div>
          </div>
          <button
            onClick={() => setReviewIncidentsOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {incidents.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60" />
              <p className="text-sm text-zinc-300 font-medium">Aucun incident machine signalé</p>
              <p className="text-xs text-zinc-500 max-w-sm">
                La trajectoire G-code, les dégagements mandrin et les perçages sont conformes aux exigences de l'atelier laser.
              </p>
            </div>
          ) : (
            incidents.map((incident) => {
              const badge = getCategoryBadge(incident.category);
              return (
                <div
                  key={incident.id}
                  className={`rounded-xl border p-4 transition ${
                    incident.resolved
                      ? 'bg-zinc-900/30 border-zinc-800/60 opacity-75'
                      : incident.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-500/10'
                      : 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          incident.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 font-bold'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {incident.severity.toUpperCase()}
                      </span>
                      {incident.resolved && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Résolu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-200 mb-1">
                    {incident.title}
                  </h3>

                  <p className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 font-mono mb-3 leading-relaxed">
                    {incident.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Signalé par: <strong className="text-zinc-200">{incident.reportedBy}</strong></span>
                    </div>

                    {incident.positionZ !== undefined && (
                      <span className="font-mono text-amber-400/90 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        Position Z: {incident.positionZ} mm
                      </span>
                    )}
                  </div>

                  {/* Resolution section for Engineer */}
                  {!incident.resolved && isEngineer && (
                    <div className="mt-3.5 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Note de correction (ex: Trou déplacé à Z=60mm hors mors mandrin)..."
                        value={resolutionNotes[incident.id] || ''}
                        onChange={(e) =>
                          setResolutionNotes((prev) => ({ ...prev, [incident.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleResolve(incident)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marquer Résolu</span>
                      </button>
                    </div>
                  )}

                  {incident.resolved && incident.resolutionNote && (
                    <div className="mt-2.5 p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300/90 flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Correction: {incident.resolutionNote}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-zinc-900/90 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            Statut actuel: <span className="font-bold text-zinc-200">{workflowStatus}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {unresolvedCount === 0 && workflowStatus === 'DRAFT' && isEngineer && (
              <button
                onClick={() => {
                  submitForApproval();
                  setReviewIncidentsOpen(false);
                  showSuccess('Re-soumis à l\'Admin', 'Le projet corrigé a été transmis pour approbation.');
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-amber-500/20"
              >
                <span>Re-soumettre à l'Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setReviewIncidentsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
