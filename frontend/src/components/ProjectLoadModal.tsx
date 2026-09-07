import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectDto } from '../services/projectService';
import { useCadStore, ProfileType, MaterialId } from '../store/useCadStore';
import { parseGCodeFile } from '../utils/GCodeParser';
import {
  FolderOpen,
  X,
  Search,
  Box,
  Layers,
  CheckCircle2,
  Upload,
  Download,
  FileCode,
  Lock,
} from 'lucide-react';

import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

interface ProjectLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectLoadModal: React.FC<ProjectLoadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { user, isGuest, setAuthModalOpen } = useAuthStore();
  const { showWarning } = useToastStore();
  const cadState = useCadStore();
  const {
    setProfileType,
    setTubeDimensions,
    setMaterialId,
  } = cadState;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // 1. Fetch remote backend projects if available
      let backendProjects: ProjectDto[] = [];
      try {
        const response = await apiClient.get('/projects');
        if (Array.isArray(response.data)) {
          backendProjects = response.data;
        }
      } catch {
        // Backend offline or unreachable
      }

      // 2. Fetch local storage saved projects (strictly ignore auth/config keys)
      const ignoredKeys = new Set(['zahiri_cad_user', 'zahiri_cad_auth_token', 'zahiri_cad_is_guest', 'zahiri_cad_registered_users']);
      const localKeys = Object.keys(localStorage).filter(
        (k) => (k.startsWith('zahiri_cad_project_') || k.startsWith('zahiri_cad_')) && !ignoredKeys.has(k)
      );
      const localProjects: ProjectDto[] = localKeys
        .map((k) => {
          try {
            const raw = localStorage.getItem(k);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            // Validate that this is actually a project with valid length & radius
            if (!parsed.length || !parsed.outerRadius) return null;
            return {
              ...parsed,
              id: parsed.id || k.replace('zahiri_cad_project_', '').replace('zahiri_cad_', ''),
              name: parsed.name || `Projet CAD (${parsed.length}mm)`,
              profileType: parsed.profileType || 'round',
              materialId: parsed.materialId || 'steel_304',
              length: Number(parsed.length) || 1200,
              outerRadius: Number(parsed.outerRadius) || 40,
              wallThickness: Number(parsed.wallThickness) || 3.5,
              rectWidth: Number(parsed.rectWidth) || (Number(parsed.outerRadius) || 40) * 2,
              rectHeight: Number(parsed.rectHeight) || (Number(parsed.outerRadius) || 40) * 2,
              cuts: Array.isArray(parsed.cuts) ? parsed.cuts : [],
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ProjectDto[];

      // 3. Default preset projects
      const presets: ProjectDto[] = [
        {
          id: 'proj-standard-100',
          name: 'Zahiri_Tube_1500x100mm_Structural',
          materialId: 'steel_304',
          length: 1500,
          outerRadius: 50,
          wallThickness: 4.0,
          profileType: 'round',
          rectWidth: 100,
          rectHeight: 100,
          cuts: [
            { id: 'c1', name: 'Hole Ø30 @ 300mm', type: 'hole', positionZ: 300, polarAngle: 0, radius: 15, slotLength: 50, slotWidth: 20, mitreAngle: 45, enabled: true },
            { id: 'c2', name: 'Slot 60x20 @ 700mm', type: 'slot', positionZ: 700, polarAngle: 90, radius: 15, slotLength: 60, slotWidth: 20, mitreAngle: 45, enabled: true },
            { id: 'c3', name: 'Mitre 45° @ 1500mm', type: 'mitre_end', positionZ: 1500, polarAngle: 0, radius: 15, slotLength: 50, slotWidth: 20, mitreAngle: 45, enabled: true },
          ],
          workflowStatus: 'APPROVED',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'proj-square-80',
          name: 'Zahiri_BoxTube_1200x80mm_Frame',
          materialId: 'steel_s235',
          length: 1200,
          outerRadius: 40,
          wallThickness: 3.0,
          profileType: 'square',
          rectWidth: 80,
          rectHeight: 80,
          cuts: [
            { id: 'c1', name: 'Hole Ø25 @ 200mm', type: 'hole', positionZ: 200, polarAngle: 0, radius: 12.5, slotLength: 40, slotWidth: 15, mitreAngle: 45, enabled: true },
          ],
          workflowStatus: 'PENDING_APPROVAL',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'proj-rect-100x50',
          name: 'Zahiri_Rectangular_1400x100x50mm_Rail',
          materialId: 'steel_304',
          length: 1400,
          outerRadius: 40,
          wallThickness: 3.5,
          profileType: 'rectangular',
          rectWidth: 100,
          rectHeight: 50,
          cuts: [
            { id: 'c1', name: 'Slot 80x25 @ 400mm', type: 'slot', positionZ: 400, polarAngle: 0, radius: 12.5, slotLength: 80, slotWidth: 25, mitreAngle: 45, enabled: true },
            { id: 'c2', name: 'Hole Ø20 @ 900mm', type: 'hole', positionZ: 900, polarAngle: 180, radius: 10, slotLength: 40, slotWidth: 20, mitreAngle: 45, enabled: true },
          ],
          workflowStatus: 'APPROVED',
          updatedAt: new Date().toISOString(),
        },
      ];

      // De-duplicate by ID
      const all = [...backendProjects, ...localProjects, ...presets];
      const seen = new Set<string>();
      const unique = all.filter((p) => {
        if (!p || !p.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      setProjects(unique);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (proj: ProjectDto) => {
    if (!proj) return;
    setProfileType((proj.profileType as ProfileType) || 'round');
    setMaterialId((proj.materialId as MaterialId) || 'steel_304');
    setTubeDimensions({
      length: Number(proj.length) || 1200,
      outerRadius: Number(proj.outerRadius) || 40,
      wallThickness: Number(proj.wallThickness) || 3.5,
      rectWidth: Number(proj.rectWidth) || (Number(proj.outerRadius) || 40) * 2,
      rectHeight: Number(proj.rectHeight) || (Number(proj.outerRadius) || 40) * 2,
    });

    useCadStore.setState({
      cuts: Array.isArray(proj.cuts) ? proj.cuts : [],
      selectedCutId: proj.cuts?.[0]?.id || null,
      workflowStatus: (proj.workflowStatus as any) || 'DRAFT',
      workflowNotes: proj.workflowNotes || 'Loaded CAD project.',
      incidents: Array.isArray(proj.incidents) ? proj.incidents : [],
    });

    onClose();
  };

  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'nc' || extension === 'gcode' || extension === 'tap' || content.includes('G21') || content.includes('G90') || content.includes('G0') || content.includes('G1')) {
          // Parse G-Code file into 3D CAD State
          const parsed = parseGCodeFile(content);
          handleLoad({
            id: `gcode-${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            materialId: parsed.materialId || 'steel_304',
            length: parsed.length,
            outerRadius: parsed.outerRadius,
            wallThickness: parsed.wallThickness,
            profileType: parsed.profileType,
            rectWidth: parsed.rectWidth,
            rectHeight: parsed.rectHeight,
            cuts: parsed.cuts,
          });
          setImportStatus(`Fichier G-Code '${file.name}' importé et reconstruit en 3D ! (${parsed.cuts.length} usinages détectés)`);
        } else {
          // Parse JSON CAD Project File
          const parsed = JSON.parse(content);
          if (!parsed.length || !parsed.outerRadius) {
            throw new Error('Structure de fichier projet Zahiri CAD non valide.');
          }
          handleLoad({
            id: `uploaded-${Date.now()}`,
            name: file.name.replace('.json', ''),
            materialId: parsed.materialId || 'steel_304',
            length: Number(parsed.length) || 1200,
            outerRadius: Number(parsed.outerRadius) || 40,
            wallThickness: Number(parsed.wallThickness) || 3.5,
            profileType: parsed.profileType || 'round',
            rectWidth: Number(parsed.rectWidth) || 80,
            rectHeight: Number(parsed.rectHeight) || 60,
            cuts: Array.isArray(parsed.cuts) ? parsed.cuts : [],
          });
          setImportStatus(`Projet JSON '${file.name}' chargé dans la scène 3D !`);
        }

        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        alert(`Erreur lors de l'importation: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest || !user) {
      showWarning(
        'Connexion Requise',
        "L'importation de fichiers G-Code (.NC) ou de pièces personnalisées nécessite un compte."
      );
      onClose();
      setAuthModalOpen(true);
      return;
    }
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (user?.role === 'ROLE_OPERATOR') return; // Operator cannot inject custom designs
    if (isGuest || !user) {
      showWarning(
        'Connexion Requise',
        "L'importation de fichiers .NC ou de projets personnalisés nécessite un compte Ingénieur ou Opérateur."
      );
      onClose();
      setAuthModalOpen(true);
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleExportJsonBackup = () => {
    if (isGuest || !user) {
      showWarning(
        'Connexion Requise',
        "La sauvegarde et le téléchargement de projets CAO nécessitent d'être connecté."
      );
      onClose();
      setAuthModalOpen(true);
      return;
    }

    const payload = {
      name: `Zahiri_CAD_${cadState.length}x${cadState.outerRadius * 2}mm`,
      materialId: cadState.materialId,
      length: cadState.length,
      outerRadius: cadState.outerRadius,
      wallThickness: cadState.wallThickness,
      profileType: cadState.profileType,
      rectWidth: cadState.rectWidth,
      rectHeight: cadState.rectHeight,
      cuts: cadState.cuts,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Zahiri_Tube_Project_${cadState.length}x${cadState.outerRadius * 2}mm.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const filtered = projects.filter((p) =>
    (p?.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none animate-in fade-in">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (user?.role !== 'ROLE_OPERATOR') setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`bg-zinc-900 border ${
          isDragging ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-zinc-700'
        } w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[100000] transition`}
      >
        <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-zinc-100 text-sm">
                Ouvrir un Projet ou Importer un Fichier G-Code (.NC, .TAP, .JSON)
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Reconstruction géométrique 3D automatique pour laser tube
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

        {/* Guest Mode Alert Banner */}
        {(isGuest || !user) && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Mode Invité : Consultation seule. L'import .NC et les exports nécessitent une connexion.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                setAuthModalOpen(true);
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-[11px] transition shadow-sm shrink-0 ml-2"
            >
              Se Connecter
            </button>
          </div>
        )}

        {/* Upload File & Export Backup Bar */}
        {user?.role !== 'ROLE_OPERATOR' ? (
          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-b border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept=".nc,.gcode,.tap,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => {
                  if (isGuest || !user) {
                    showWarning(
                      'Connexion Requise',
                      "L'importation de fichiers G-Code (.NC) nécessite un compte Ingénieur ou Opérateur."
                    );
                    onClose();
                    setAuthModalOpen(true);
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-1.5 rounded text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Importer G-Code (.NC / .TAP)</span>
              </button>

              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                ou glissez-déposez le fichier ici
              </span>
            </div>

            <button
              onClick={handleExportJsonBackup}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded text-xs transition flex items-center gap-1.5 active:scale-95 shrink-0"
              title="Télécharger une sauvegarde JSON du projet"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sauvegarde JSON</span>
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-cyan-950/40 border-b border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
            <span className="font-semibold flex items-center gap-1.5">
              <span>File d'Attente Atelier Usine</span>
              <span className="text-[10px] text-zinc-400 font-mono font-normal">
                (Chargement de projet pour usinage - Conception figée)
              </span>
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40 font-mono">
              Mode Opérateur CNC
            </span>
          </div>
        )}

        {isDragging && (
          <div className="bg-amber-500/20 border-b border-amber-500/50 p-4 text-center text-amber-300 text-xs font-semibold animate-pulse">
            Déposez votre fichier .NC, .GCODE, .TAP ou .JSON pour reconstruire le modèle 3D
          </div>
        )}

        {importStatus && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 px-3 py-1.5 text-xs font-mono flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher dans la base de projets usine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1.5 rounded w-full outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-950">
          {loading ? (
            <div className="text-center text-zinc-500 py-8 text-xs font-mono">
              Chargement des projets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-xs italic">
              Aucun projet trouvé. Importez un fichier G-Code ci-dessus !
            </div>
          ) : (
            filtered.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              const profile = (proj.profileType || 'round').toUpperCase();
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className={`p-3 rounded border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-500 text-zinc-100 shadow-md'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-xs">
                          {proj.name || 'Projet Tube CAD'}
                        </span>
                        {proj.workflowStatus === 'APPROVED' ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            APPROUVÉ
                          </span>
                        ) : proj.workflowStatus === 'PENDING_APPROVAL' ? (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                            ATTENTE ADMIN
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {profile} {proj.length || 1200}mm × Ø{(proj.outerRadius || 40) * 2}mm | T:{proj.wallThickness || 3.5}mm
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-zinc-800 text-cyan-400 font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-700 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {proj.cuts?.length || 0} cuts
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(proj);
                      }}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-[11px] transition flex items-center gap-1 active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Charger</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Sélectionné: {selectedProject ? selectedProject.name || 'Projet sans nom' : 'Aucun'}</span>
          <button
            onClick={() => selectedProject && handleLoad(selectedProject)}
            disabled={!selectedProject}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded text-xs transition active:scale-95"
          >
            Charger le modèle 3D
          </button>
        </div>
      </div>
    </div>
  );
};
