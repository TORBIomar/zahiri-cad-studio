import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCadStore } from '../store/useCadStore';
import { useAuthStore } from '../store/useAuthStore';
import { generateTubeGCode } from '../utils/GCodeGenerator';
import {
  FileCode,
  Download,
  Copy,
  Check,
  X,
  Terminal,
  Lock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

interface GCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GCodeExportModal: React.FC<GCodeExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const state = useCadStore();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isBlocked = user?.role === 'ROLE_OPERATOR' && state.workflowStatus !== 'APPROVED';

  const gcodeText = generateTubeGCode(state);
  const outerDiameter = state.profileType === 'round' ? state.outerRadius * 2 : state.rectWidth;
  const fileName = `Zahiri_Tube_${state.length}x${outerDiameter}mm.nc`;

  const handleCopy = () => {
    if (isBlocked) return;
    navigator.clipboard.writeText(gcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (isBlocked) return;
    const blob = new Blob([gcodeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[100000]">
        <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                {t('gcode.title')}
                <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30">
                  ISO 6983 / DIN 66025
                </span>
                {isBlocked && (
                  <span className="bg-rose-500/20 text-rose-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> VERROUILLÉ (ATTENTE VALIDATION)
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {fileName} ({state.cuts.filter((c) => c.enabled).length} {t('telemetry.csgEvaluated')})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isBlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950 space-y-4">
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Lock className="w-10 h-10" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-base font-bold text-zinc-100">
                Export G-Code Verrouillé (Attente Validation Usine)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ce plan n'a pas encore reçu l'approbation formelle de l'Administrateur Usine. Le transfert du code machine vers la découpe laser est strictement suspendu.
              </p>
              <p className="text-xs text-amber-300/90 font-medium">
                En cas d'anomalie de fabrication, d'interférence mandrin ou de problème de tolérance, signalez l'incident directement à l'Ingénieur CAD.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                state.setIncidentModalOpen(true);
              }}
              className="mt-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Signaler une Anomalie / Incident</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-zinc-950 p-4 font-mono text-xs text-amber-300/90 leading-relaxed border-b border-zinc-800">
            <pre className="whitespace-pre-wrap">
              {gcodeText.split('\n').map((line, idx) => (
                <div key={idx} className="flex hover:bg-zinc-900/60 rounded px-1">
                  <span className="w-10 text-zinc-600 select-none text-right pr-4 text-[10px]">
                    {idx + 1}
                  </span>
                  <span
                    className={
                      line.startsWith('(')
                        ? 'text-zinc-500 italic'
                        : line.startsWith('M03') || line.startsWith('M05')
                        ? 'text-red-400 font-bold'
                        : line.startsWith('G1')
                        ? 'text-amber-300 font-semibold'
                        : 'text-zinc-200'
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        )}

        <div className="p-3 bg-zinc-900 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>{t('gcode.format')}</span>
          </div>

          <div className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <button
                  disabled
                  className="px-3 py-1.5 bg-zinc-800/40 text-zinc-600 rounded font-medium text-xs cursor-not-allowed border border-zinc-800"
                >
                  {t('gcode.copy')}
                </button>

                <button
                  disabled
                  className="px-4 py-1.5 bg-zinc-800/40 text-zinc-600 font-bold rounded text-xs cursor-not-allowed border border-zinc-800 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{t('gcode.download')} (Bloqué)</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{t('gcode.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t('gcode.copy')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded shadow-lg shadow-amber-500/10 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('gcode.download')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
