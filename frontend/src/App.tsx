import React, { useEffect, useState } from 'react';
import { useCadStore, ViewMode } from './store/useCadStore';
import { useAuthStore } from './store/useAuthStore';
import { HeaderNav } from './components/HeaderNav';
import { SidebarParameters } from './components/SidebarParameters';
import { SidebarReadouts } from './components/SidebarReadouts';
import { CadCanvas } from './components/canvas/CadCanvas';
import { Blueprint2DView } from './components/canvas/Blueprint2DView';
import { StatusBar } from './components/StatusBar';
import { AuthModal } from './components/AuthModal';
import { RoleSuperpowerBar } from './components/RoleSuperpowerBar';
import { ToastContainer } from './components/ToastContainer';
import { ShortcutsModal } from './components/ShortcutsModal';
import { OperatorErrorReportModal } from './components/OperatorErrorReportModal';
import { IncidentReviewModal } from './components/IncidentReviewModal';
import { AdminUserApprovalModal } from './components/AdminUserApprovalModal';

export function App() {
  const {
    viewMode,
    setViewMode,
    setLeftSidebarOpen,
    toggleSetting,
  } = useCadStore();
  const { user, initAuth } = useAuthStore();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // When CNC Operator logs in, maximize viewport by default
  useEffect(() => {
    if (user?.role === 'ROLE_OPERATOR') {
      setLeftSidebarOpen(false);
    }
  }, [user?.role, setLeftSidebarOpen]);

  // Global industrial CAD keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      // Space: Toggle Laser Cut Simulator
      if (e.code === 'Space') {
        e.preventDefault();
        toggleSetting('isLaserAnimating');
      }
      // View presets: 1, 2, 3, 4
      else if (e.key === '1') {
        setViewMode('shaded');
      } else if (e.key === '2') {
        setViewMode('wireframe');
      } else if (e.key === '3') {
        setViewMode('laser_cut');
      } else if (e.key === '4') {
        setViewMode('blueprint');
      }
      // Quick view helpers
      else if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        toggleSetting('showGrid');
      } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
        toggleSetting('showDimensions');
      } else if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey) {
        toggleSetting('showAxes');
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSetting, setViewMode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none antialiased">
      {/* Sleek Top Navigation */}
      <HeaderNav onOpenShortcuts={() => setIsShortcutsOpen(true)} />

      {/* Main CAD Workspace Layout */}
      <main className="flex flex-1 relative overflow-hidden">
        {/* Left Parameters Drawer */}
        <SidebarParameters />

        {/* 3D Canvas / Blueprint Viewport */}
        <section className="flex-1 h-full relative overflow-hidden">
          {viewMode === 'blueprint' ? (
            <Blueprint2DView />
          ) : (
            <CadCanvas onOpenShortcuts={() => setIsShortcutsOpen(true)} />
          )}

          {/* Role-Specific Superpower HUD (CNC Laser Deck, Admin Costing, Engineer Drafting, Guest Chip) */}
          <RoleSuperpowerBar />
        </section>

        {/* Right Telemetry & Feasibility Drawer */}
        <SidebarReadouts />
      </main>

      {/* Minimal Status Bar */}
      <StatusBar onOpenShortcuts={() => setIsShortcutsOpen(true)} />

      {/* High-tech Modals & Overlays */}
      <AuthModal />
      <OperatorErrorReportModal />
      <IncidentReviewModal />
      <AdminUserApprovalModal />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <ToastContainer />
    </div>
  );
}

export default App;
