import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCadStore,
  MATERIALS,
  MaterialId,
  ViewMode,
} from '../store/useCadStore';
import { ProjectService } from '../services/projectService';
import { PdfExportService } from '../services/pdfExportService';
import { DxfExportService } from '../services/dxfExportService';
import { GCodeExportModal } from './GCodeExportModal';
import { ProjectLoadModal } from './ProjectLoadModal';
import { useAuthStore } from '../store/useAuthStore';
import { UserProfileMenu } from './UserProfileMenu';
import {
  Zap,
  RotateCcw,
  Undo,
  Redo,
  FileCode,
  Sparkles,
  Cpu,
  Save,
  Globe,
  FolderOpen,
  FileSpreadsheet,
  Layers,
  LogIn,
  ChevronDown,
  Download,
  Sliders,
  Activity,
  Keyboard,
} from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

interface HeaderNavProps {
  onOpenShortcuts?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onOpenShortcuts }) => {
  const { t, i18n } = useTranslation();
  const cadState = useCadStore();
  const { isGuest, user, setAuthModalOpen } = useAuthStore();
  const { showSuccess, showInfo, showError } = useToastStore();
  const {
    materialId,
    setMaterialId,
    viewMode,
    setViewMode,
    resetDefault,
    undo,
    redo,
    undoStack,
    redoStack,
    isLaserAnimating,
    toggleSetting,
    isLeftSidebarOpen,
    toggleLeftSidebar,
    isRightSidebarOpen,
    toggleRightSidebar,
    isGCodeModalOpen,
    setGCodeModalOpen,
  } = cadState;

  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(nextLang);
    showInfo(
      nextLang === 'fr' ? 'Langue changée' : 'Language Changed',
      nextLang === 'fr' ? 'Interface en Français' : 'Interface in English'
    );
  };

  const handleSaveCad = async () => {
    showInfo(
      i18n.language === 'fr' ? 'Sauvegarde du projet...' : 'Saving CAD Project...',
      'Persisting design parameters & toolpaths'
    );
    const result = await ProjectService.saveProject(cadState);
    if (result.success) {
      showSuccess('CAD Project Saved', result.message);
    } else {
      showError('Save Notice', result.message);
    }
  };

  const handleExportPdf = () => {
    setIsExportDropdownOpen(false);
    PdfExportService.exportTechnicalDataSheet(cadState, i18n.language);
    showSuccess('Engineering Spec (.PDF)', 'Official technical data sheet & quotation generated');
  };

  const handleExportDxf = () => {
    setIsExportDropdownOpen(false);
    DxfExportService.exportSheetMetalDxf(cadState);
    showSuccess('2D CAD Vector (.DXF)', 'Unrolled flat pattern exported for AutoCAD/CAM');
  };

  const handleOpenGCode = () => {
    setIsExportDropdownOpen(false);
    setGCodeModalOpen(true);
  };

  return (
    <>
      <header className="h-12 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 flex items-center justify-between text-xs text-zinc-300 z-30 select-none">
        {/* Left Section: Brand, Sidebar Toggle, Projects & History */}
        <div className="flex items-center gap-2.5">
          {/* Toggle Left Sidebar */}
          <button
            onClick={toggleLeftSidebar}
            className={`p-1.5 rounded-md border transition ${
              isLeftSidebarOpen
                ? 'bg-zinc-800 border-zinc-700 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={isLeftSidebarOpen ? 'Collapse Parameters Sidebar' : 'Expand Parameters Sidebar'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 px-2 py-0.5 rounded">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="font-extrabold text-zinc-100 tracking-wider text-xs">
              ZAHIRI <span className="text-amber-400">METAL</span>
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-0.5" />

          {/* File Operations */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsLoadModalOpen(true)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white rounded transition flex items-center gap-1.5 text-[11px]"
              title="Open or Import Projects (.NC, .JSON)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Open</span>
            </button>

            <button
              onClick={handleSaveCad}
              className="px-2 py-1 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded transition flex items-center gap-1 text-[11px]"
              title="Save CAD Project"
            >
              <Save className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">{t('app.saveCad')}</span>
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center bg-zinc-900/90 rounded border border-zinc-800 p-0.5">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-1 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 hover:text-zinc-100 rounded transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3 h-3" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-1 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 hover:text-zinc-100 rounded transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3 h-3" />
            </button>
            <button
              onClick={resetDefault}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded transition"
              title="Reset CAD Scene"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center Section: Material & View Mode Segment */}
        <div className="flex items-center gap-2">
          {/* Material Select */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value as MaterialId)}
              className="bg-transparent text-zinc-100 text-[11px] font-medium outline-none cursor-pointer"
            >
              {Object.values(MATERIALS).map((mat) => (
                <option key={mat.id} value={mat.id} className="bg-zinc-900 text-zinc-100">
                  {mat.name} ({mat.density} g/cm³)
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Segmented Pill */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            {(['shaded', 'wireframe', 'laser_cut', 'blueprint'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition ${
                  viewMode === mode
                    ? 'bg-zinc-800 text-amber-400 shadow-sm font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t(`app.viewModes.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Streamlined Exports, Sidebars & Auth */}
        <div className="flex items-center gap-2">
          {/* Toggle Right Sidebar (Telemetry) */}
          <button
            onClick={toggleRightSidebar}
            className={`p-1.5 rounded-md border transition ${
              isRightSidebarOpen
                ? 'bg-zinc-800 border-zinc-700 text-cyan-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={isRightSidebarOpen ? 'Collapse Telemetry Sidebar' : 'Expand Telemetry Sidebar'}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="px-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-[10px] font-mono flex items-center gap-1 transition"
            title="Switch Language (EN / FR)"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span className="font-bold uppercase text-amber-400">{i18n.language}</span>
          </button>

          {/* Consolidated Export Center Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold px-2.5 py-1 rounded text-[11px] transition flex items-center gap-1.5 shadow-sm"
              title="Export Vector, Code, or Documentation"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                <button
                  onClick={handleOpenGCode}
                  className="w-full p-2 hover:bg-zinc-800 rounded flex items-center gap-2.5 text-left text-zinc-200 hover:text-white transition group"
                >
                  <FileCode className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                  <div>
                    <div className="font-bold text-[11px]">CNC G-Code (.NC)</div>
                    <div className="text-[9px] text-zinc-400">Rotary toolpath for laser cutter</div>
                  </div>
                </button>

                <button
                  onClick={handleExportDxf}
                  className="w-full p-2 hover:bg-zinc-800 rounded flex items-center gap-2.5 text-left text-zinc-200 hover:text-white transition group"
                >
                  <Layers className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                  <div>
                    <div className="font-bold text-[11px]">2D CAD Vector (.DXF)</div>
                    <div className="text-[9px] text-zinc-400">AutoCAD flat sheet metal unroll</div>
                  </div>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="w-full p-2 hover:bg-zinc-800 rounded flex items-center gap-2.5 text-left text-zinc-200 hover:text-white transition group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                  <div>
                    <div className="font-bold text-[11px]">Engineering Spec (.PDF)</div>
                    <div className="text-[9px] text-zinc-400">Data sheet, weight & cost breakdown</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Primary Quick G-Code Button */}
          <button
            onClick={() => setGCodeModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-2.5 py-1 rounded text-[11px] transition flex items-center gap-1 shadow-md shadow-amber-500/10"
            title="Generate CNC G-Code"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('app.exportGCode')}</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-0.5" />

          {/* User Profile or Sign-In */}
          {isGuest || !user ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-semibold rounded text-[11px] transition flex items-center gap-1.5"
              title="Sign In with Credentials"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>
          ) : (
            <UserProfileMenu />
          )}
        </div>
      </header>

      <GCodeExportModal
        isOpen={isGCodeModalOpen}
        onClose={() => setGCodeModalOpen(false)}
      />

      <ProjectLoadModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />
    </>
  );
};
