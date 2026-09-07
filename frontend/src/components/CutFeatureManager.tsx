import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCadStore, CutFeature, CutType } from '../store/useCadStore';
import {
  Scissors,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

interface CutFeatureManagerProps {
  readOnly?: boolean;
}

export const CutFeatureManager: React.FC<CutFeatureManagerProps> = ({ readOnly = false }) => {
  const { t } = useTranslation();
  const { user, isGuest, setAuthModalOpen } = useAuthStore();
  const { showWarning } = useToastStore();
  const {
    cuts,
    selectedCutId,
    selectCutFeature,
    addCutFeature,
    updateCutFeature,
    deleteCutFeature,
    toggleCutFeature,
    duplicateCutFeature,
    length,
    outerRadius,
  } = useCadStore();

  const handleAddHole = () => {
    if (isGuest || !user) {
      showWarning(
        'Connexion Requise',
        "L'ajout de découpes et perçages laser personnalisés nécessite un compte Ingénieur."
      );
      setAuthModalOpen(true);
      return;
    }
    addCutFeature('hole');
  };

  const handleAddSlot = () => {
    if (isGuest || !user) {
      showWarning(
        'Connexion Requise',
        "L'ajout de rainures et découpes laser personnalisées nécessite un compte Ingénieur."
      );
      setAuthModalOpen(true);
      return;
    }
    addCutFeature('slot');
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest || !user) {
      showWarning(
        'Connexion Requise',
        "La duplication d'usinages nécessite d'être connecté."
      );
      setAuthModalOpen(true);
      return;
    }
    duplicateCutFeature(id);
  };

  const selectedCut = cuts.find((c) => c.id === selectedCutId);

  return (
    <div className="space-y-3 bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-zinc-200 text-[11px]">{t('cutList.title')}</span>
          <span className="bg-zinc-800 text-zinc-400 font-mono text-[9px] px-1.5 py-0.2 rounded-full">
            {cuts.length}
          </span>
          {readOnly && (
            <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30">
              Lecture Seule
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleAddHole}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>{t('cutList.addHole')}</span>
            </button>

            <button
              onClick={handleAddSlot}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>{t('cutList.addSlot')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {cuts.length === 0 ? (
          <div className="text-[11px] text-zinc-500 text-center py-3 italic">
            {t('cutList.noCuts')}
          </div>
        ) : (
          cuts.map((cut) => {
            const isSelected = cut.id === selectedCutId;
            return (
              <div
                key={cut.id}
                onClick={() => selectCutFeature(cut.id)}
                className={`p-2 rounded border text-xs cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-zinc-900 border-amber-500/60 text-zinc-100 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
                } ${!cut.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    disabled={readOnly}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) toggleCutFeature(cut.id);
                    }}
                    className={`transition ${
                      readOnly ? 'cursor-not-allowed opacity-60' : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {cut.enabled ? (
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex flex-col">
                    <span className="font-medium text-[11px] truncate text-zinc-200">
                      {cut.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Z: {cut.positionZ}mm | ∠{cut.polarAngle}°
                    </span>
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDuplicate(cut.id, e)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition"
                      title="Dupliquer Feature"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isGuest || !user) {
                          showWarning(
                            'Connexion Requise',
                            "La suppression d'usinages nécessite d'être connecté."
                          );
                          setAuthModalOpen(true);
                          return;
                        }
                        deleteCutFeature(cut.id);
                      }}
                      className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded transition"
                      title="Supprimer Feature"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedCut && (
        <fieldset disabled={readOnly} className="border-t border-zinc-800/80 pt-2.5 space-y-2.5 disabled:opacity-60">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
            <span>{t('cutList.editTitle')} ({t(`cutList.cutTypes.${selectedCut.type}`).toUpperCase()})</span>
            <span className="font-mono text-[9px] text-zinc-500">ID: {selectedCut.id}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded border border-zinc-800">
            {(['hole', 'slot', 'mitre_start', 'mitre_end'] as CutType[]).map((tType) => (
              <button
                key={tType}
                disabled={readOnly}
                onClick={() =>
                  updateCutFeature(selectedCut.id, {
                    type: tType,
                    name: `${t(`cutList.cutTypes.${tType}`)} @ ${selectedCut.positionZ}mm`,
                  })
                }
                className={`py-1 px-1 rounded text-[9px] font-medium text-center transition ${
                  selectedCut.type === tType
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {t(`cutList.cutTypes.${tType}`)}
              </button>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-zinc-300">{t('cutList.zOffset')}:</span>
              <span className="font-mono text-red-400 font-bold">{selectedCut.positionZ} mm</span>
            </div>
            <input
              type="range"
              disabled={readOnly}
              min={0}
              max={length}
              step={5}
              value={selectedCut.positionZ}
              onChange={(e) =>
                updateCutFeature(selectedCut.id, {
                  positionZ: Number(e.target.value),
                })
              }
              className={`w-full h-1 bg-zinc-800 rounded appearance-none accent-red-400 ${
                readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            />
          </div>

          {selectedCut.type === 'hole' && (
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-zinc-300">{t('cutList.holeDiameter')}:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedCut.radius * 2} mm</span>
              </div>
              <input
                type="range"
                disabled={readOnly}
                min={5}
                max={Math.min(80, outerRadius * 1.6)}
                step={1}
                value={selectedCut.radius * 2}
                onChange={(e) =>
                  updateCutFeature(selectedCut.id, {
                    radius: Number(e.target.value) / 2,
                  })
                }
                className={`w-full h-1 bg-zinc-800 rounded appearance-none accent-amber-400 ${
                  readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              />
            </div>
          )}

          {selectedCut.type === 'slot' && (
            <>
              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('cutList.slotLength')}:</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedCut.slotLength} mm</span>
                </div>
                <input
                  type="range"
                  disabled={readOnly}
                  min={10}
                  max={200}
                  step={5}
                  value={selectedCut.slotLength}
                  onChange={(e) =>
                    updateCutFeature(selectedCut.id, {
                      slotLength: Number(e.target.value),
                    })
                  }
                  className={`w-full h-1 bg-zinc-800 rounded appearance-none accent-cyan-400 ${
                    readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-300">{t('cutList.slotWidth')}:</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedCut.slotWidth} mm</span>
                </div>
                <input
                  type="range"
                  disabled={readOnly}
                  min={5}
                  max={60}
                  step={1}
                  value={selectedCut.slotWidth}
                  onChange={(e) =>
                    updateCutFeature(selectedCut.id, {
                      slotWidth: Number(e.target.value),
                    })
                  }
                  className={`w-full h-1 bg-zinc-800 rounded appearance-none accent-cyan-400 ${
                    readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                />
              </div>
            </>
          )}

          {(selectedCut.type === 'mitre_start' || selectedCut.type === 'mitre_end') && (
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-zinc-300">{t('cutList.mitreAngle')}:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedCut.mitreAngle}°</span>
              </div>
              <input
                type="range"
                disabled={readOnly}
                min={15}
                max={75}
                step={5}
                value={selectedCut.mitreAngle}
                onChange={(e) =>
                  updateCutFeature(selectedCut.id, {
                    mitreAngle: Number(e.target.value),
                  })
                }
                className={`w-full h-1 bg-zinc-800 rounded appearance-none accent-amber-400 ${
                  readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-zinc-300">{t('cutList.polarAngle')}:</span>
              <span className="font-mono text-zinc-300 font-bold">{selectedCut.polarAngle}°</span>
            </div>
            <input
              type="range"
              disabled={readOnly}
              min={0}
              max={360}
              step={15}
              value={selectedCut.polarAngle}
              onChange={(e) =>
                updateCutFeature(selectedCut.id, {
                  polarAngle: Number(e.target.value),
                })
              }
              className={`w-full h-1 bg-zinc-800 rounded appearance-none accent-zinc-400 ${
                readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            />
          </div>
        </fieldset>
      )}
    </div>
  );
};
