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
} from 'lucide-react';

import { apiClient } from '../services/apiClient';

interface ProjectLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectLoadModal: React.FC<ProjectLoadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
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

      // 2. Fetch local storage saved projects
      const localKeys = Object.keys(localStorage).filter((k) => k.startsWith('zahiri_cad_'));
      const localProjects: ProjectDto[] = localKeys
        .map((k) => {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '');
            return { ...parsed, id: k.replace('zahiri_cad_', '') };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

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
          cuts: [
            { id: 'c1', name: 'Hole Ø30 @ 300mm', type: 'hole', positionZ: 300, polarAngle: 0, radius: 15, slotLength: 50, slotWidth: 20, mitreAngle: 45, enabled: true },
            { id: 'c2', name: 'Slot 60x20 @ 700mm', type: 'slot', positionZ: 700, polarAngle: 90, radius: 15, slotLength: 60, slotWidth: 20, mitreAngle: 45, enabled: true },
            { id: 'c3', name: 'Mitre 45° @ 1500mm', type: 'mitre_end', positionZ: 1500, polarAngle: 0, radius: 15, slotLength: 50, slotWidth: 20, mitreAngle: 45, enabled: true },
          ],
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
          cuts: [
            { id: 'c1', name: 'Hole Ø25 @ 200mm', type: 'hole', positionZ: 200, polarAngle: 0, radius: 12.5, slotLength: 40, slotWidth: 15, mitreAngle: 45, enabled: true },
          ],
          updatedAt: new Date().toISOString(),
        },
      ];

      // De-duplicate by ID
      const all = [...backendProjects, ...localProjects, ...presets];
      const seen = new Set<string>();
      const unique = all.filter((p) => {
        if (!p.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      setProjects(unique);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (proj: ProjectDto) => {
    setProfileType(proj.profileType as ProfileType);
    setMaterialId((proj.materialId as MaterialId) || 'steel_304');
    setTubeDimensions({
      length: proj.length,
      outerRadius: proj.outerRadius,
      wallThickness: proj.wallThickness,
      rectWidth: proj.rectWidth || proj.outerRadius * 2,
      rectHeight: proj.rectHeight || proj.outerRadius * 2,
    });

    useCadStore.setState({
      cuts: proj.cuts || [],
      selectedCutId: proj.cuts?.[0]?.id || null,
    });

    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'nc' || extension === 'gcode' || extension === 'tap' || content.includes('G21') || content.includes('G90')) {
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
            cuts: parsed.cuts,
          });
          setImportStatus(`G-Code file '${file.name}' parsed & reconstructed in 3D!`);
        } else {
          // Parse JSON CAD Project File
          const parsed = JSON.parse(content);
          if (!parsed.length || !parsed.outerRadius) {
            throw new Error('Invalid Zahiri CAD project file structure.');
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
          setImportStatus(`JSON Project '${file.name}' loaded into 3D CAD!`);
        }

        setTimeout(() => setImportStatus(null), 3500);
      } catch (err: any) {
        alert(`Error importing file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExportJsonBackup = () => {
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
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[100000]">
        <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-zinc-100 text-sm">
                Open / Upload CAD or G-Code File (.NC, .GCODE, .JSON)
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Supports G-Code Toolpaths & CAD Project Files
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

        {/* Upload File & Export Backup Bar */}
        <div className="p-3 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".nc,.gcode,.tap,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-1.5 rounded text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Upload .NC / .GCODE / .JSON File</span>
            </button>

            <span className="text-[10px] text-zinc-400 font-mono">
              Parses G-code & 3D CAD models
            </span>
          </div>

          <button
            onClick={handleExportJsonBackup}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded text-xs transition flex items-center gap-1.5"
            title="Download JSON Project Backup"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backup to JSON</span>
          </button>
        </div>

        {importStatus && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 px-3 py-1.5 text-xs font-mono flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search database & local projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1.5 rounded w-full outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-950">
          {loading ? (
            <div className="text-center text-zinc-500 py-8 text-xs font-mono">
              Loading projects...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-xs italic">
              No saved projects found. Upload a file above!
            </div>
          ) : (
            filtered.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
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
                      <span className="font-bold text-zinc-100 text-xs">
                        {proj.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {proj.profileType.toUpperCase()} {proj.length}mm × Ø{proj.outerRadius * 2}mm | T:{proj.wallThickness}mm
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
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-[11px] transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Load</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Selected: {selectedProject ? selectedProject.name : 'None'}</span>
          <button
            onClick={() => selectedProject && handleLoad(selectedProject)}
            disabled={!selectedProject}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded text-xs transition"
          >
            Load Selected CAD Model
          </button>
        </div>
      </div>
    </div>
  );
};
