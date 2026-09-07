import React, { useState } from 'react';
import { useAuthStore, UserProfile } from '../store/useAuthStore';
import {
  ShieldCheck,
  X,
  UserCheck,
  UserX,
  Clock,
  Building2,
  Calendar,
  Mail,
  Cpu,
  Zap,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const AdminUserApprovalModal: React.FC = () => {
  const {
    isApprovalModalOpen,
    setApprovalModalOpen,
    pendingUsers,
    registeredUsers,
    approveUser,
    rejectUser,
    user: currentUser,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  if (!isApprovalModalOpen) return null;

  const approvedUsers = registeredUsers.filter((u) => u.approved !== false);

  const handleApprove = (u: UserProfile) => {
    approveUser(u.id);
    setActionNotice({
      type: 'success',
      text: `Accès approuvé avec succès pour ${u.fullName} (${u.role === 'ROLE_ENGINEER' ? 'CAD Engineer' : 'CNC Operator'}) !`,
    });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleReject = (u: UserProfile) => {
    rejectUser(u.id);
    setActionNotice({
      type: 'danger',
      text: `Demande d'accès rejetée pour ${u.fullName}.`,
    });
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-500/20 via-zinc-800 to-amber-500/15 border-b border-zinc-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-zinc-100 tracking-wide">
                  Contrôle d'Accès & Approbation Utilisateurs
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Plant Admin Supervision
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gestion des autorisations d'usine pour les Ingénieurs Bureau d'Études et Opérateurs Laser CNC
              </p>
            </div>
          </div>

          <button
            onClick={() => setApprovalModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-100 p-2 rounded-lg hover:bg-zinc-800 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats and Tabs Bar */}
        <div className="bg-zinc-950/80 border-b border-zinc-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Attente de Validation</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                  activeTab === 'pending'
                    ? 'bg-zinc-950 text-amber-400'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {pendingUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'approved'
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Utilisateurs Autorisés</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                {approvedUsers.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connecté en tant que: <strong className="text-zinc-200">{currentUser?.fullName || 'Plant Admin'}</strong></span>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg border text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="font-medium">{actionNotice.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'pending' ? (
            pendingUsers.length === 0 ? (
              <div className="py-14 text-center space-y-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Aucune demande en attente</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Toutes les demandes d'inscription pour CAD Engineer et CNC Operator ont été examinées et traitées.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>{pendingUsers.length} utilisateur{pendingUsers.length > 1 ? 's' : ''} en attente de validation</span>
                  <span className="text-amber-400/90 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Accès bloqué jusqu'à votre approbation
                  </span>
                </div>

                <div className="space-y-2.5">
                  {pendingUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 bg-zinc-950/70 border border-amber-500/30 hover:border-amber-500/50 rounded-xl transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-sm text-zinc-100">{u.fullName}</span>

                          {u.role === 'ROLE_ENGINEER' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Cpu className="w-3 h-3" />
                              CAD Engineer
                            </span>
                          )}

                          {u.role === 'ROLE_OPERATOR' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              <Zap className="w-3 h-3" />
                              CNC Operator
                            </span>
                          )}

                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            En Attente
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="font-mono text-zinc-300">{u.email}</span>
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{u.company || 'Zahiri Metal'}</span>
                          </span>

                          {u.createdAt && (
                            <span className="inline-flex items-center gap-1 text-zinc-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReject(u)}
                          className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(u)}
                          className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approuver l'Accès</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Approved Users Tab */
            <div className="space-y-3">
              <div className="text-xs text-zinc-400 px-1">
                Liste des techniciens et ingénieurs ayant un compte actif avec autorisations validées
              </div>

              <div className="space-y-2">
                {approvedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{u.fullName}</span>

                        {u.role === 'ROLE_ENGINEER' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            CAD Engineer
                          </span>
                        )}
                        {u.role === 'ROLE_OPERATOR' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                            CNC Operator
                          </span>
                        )}
                        {u.role === 'ROLE_ADMIN' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            Plant Admin
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Actif
                        </span>
                      </div>

                      <div className="text-zinc-500 flex items-center gap-3">
                        <span className="font-mono text-zinc-400">{u.email}</span>
                        <span>•</span>
                        <span>{u.company || 'Zahiri Metal'}</span>
                      </div>
                    </div>

                    {u.role !== 'ROLE_ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleReject(u)}
                        className="px-2.5 py-1 text-[11px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition border border-transparent hover:border-rose-500/30"
                        title="Révoquer l'accès"
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              Les utilisateurs approuvés reçoivent immédiatement l'accès à leur espace de travail dédié.
            </span>
          </div>

          <button
            onClick={() => setApprovalModalOpen(false)}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
