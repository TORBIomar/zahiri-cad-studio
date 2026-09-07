import { create } from 'zustand';

export type ProfileType = 'round' | 'square' | 'rectangular';
export type CutType = 'hole' | 'slot' | 'mitre_start' | 'mitre_end';
export type MaterialId = 'steel_304' | 'steel_s235' | 'aluminum_6061' | 'titanium_gr5' | 'brass';
export type ViewMode = 'shaded' | 'wireframe' | 'laser_cut' | 'blueprint';

export interface CutFeature {
  id: string;
  name: string;
  type: CutType;
  positionZ: number; // mm offset along tube length
  polarAngle: number; // deg (0 to 360)
  radius: number; // mm (for hole)
  slotLength: number; // mm (for slot)
  slotWidth: number; // mm (for slot)
  mitreAngle: number; // deg
  enabled: boolean;
}

export interface MaterialSpec {
  id: MaterialId;
  name: string;
  density: number; // g/cm3
  color: string;
  metalness: number;
  roughness: number;
  maxLaserPowerKW: number;
  cuttingSpeedFactor: number;
  gasRecommended: 'nitrogen' | 'oxygen';
}

export const MATERIALS: Record<MaterialId, MaterialSpec> = {
  steel_304: {
    id: 'steel_304',
    name: 'Stainless Steel 304',
    density: 7.93,
    color: '#c0c0c0', // Bright Silver Metal (#c0c0c0)
    metalness: 0.9,
    roughness: 0.25,
    maxLaserPowerKW: 4.0,
    cuttingSpeedFactor: 1.0,
    gasRecommended: 'nitrogen',
  },
  steel_s235: {
    id: 'steel_s235',
    name: 'Structural Steel S235JR',
    density: 7.85,
    color: '#a3a3a3', // Steel Grey
    metalness: 0.85,
    roughness: 0.35,
    maxLaserPowerKW: 6.0,
    cuttingSpeedFactor: 1.4,
    gasRecommended: 'oxygen',
  },
  aluminum_6061: {
    id: 'aluminum_6061',
    name: 'Aluminum 6061-T6',
    density: 2.70,
    color: '#d4d4d8', // Bright Aluminum
    metalness: 0.92,
    roughness: 0.2,
    maxLaserPowerKW: 3.5,
    cuttingSpeedFactor: 1.8,
    gasRecommended: 'nitrogen',
  },
  titanium_gr5: {
    id: 'titanium_gr5',
    name: 'Titanium Grade 5 (Ti-6Al-4V)',
    density: 4.43,
    color: '#8892b0', // Metallic Titanium Blue-Grey
    metalness: 0.85,
    roughness: 0.3,
    maxLaserPowerKW: 2.5,
    cuttingSpeedFactor: 0.7,
    gasRecommended: 'nitrogen',
  },
  brass: {
    id: 'brass',
    name: 'Brass C36000',
    density: 8.50,
    color: '#d97706', // Metallic Brass Amber
    metalness: 0.95,
    roughness: 0.2,
    maxLaserPowerKW: 3.0,
    cuttingSpeedFactor: 1.1,
    gasRecommended: 'nitrogen',
  },
};

export interface TubeItem {
  id: string;
  name: string;
  profileType: ProfileType;
  length: number;
  outerRadius: number;
  wallThickness: number;
  rectWidth: number;
  rectHeight: number;
  position: [number, number, number]; // [X, Y, Z] spatial offset in Three.js units
  rotation: [number, number, number]; // [RX, RY, RZ] spatial rotation in degrees
  cuts: CutFeature[];
  selectedCutId: string | null;
  materialId: MaterialId;
}

interface HistorySnapshot {
  tubes: TubeItem[];
  activeTubeId: string;
}

export interface CadState {
  tubes: TubeItem[];
  activeTubeId: string;

  // Active tube proxy getters/setters for legacy component compatibility
  profileType: ProfileType;
  length: number;
  outerRadius: number;
  wallThickness: number;
  rectWidth: number;
  rectHeight: number;
  cuts: CutFeature[];
  selectedCutId: string | null;
  materialId: MaterialId;

  laserPowerKW: number;
  assistGas: 'nitrogen' | 'oxygen' | 'compressed_air';
  viewMode: ViewMode;
  showGrid: boolean;
  showAxes: boolean;
  showDimensions: boolean;
  isLaserAnimating: boolean;

  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Workspace Layout & Role Superpower States
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  designLocked: boolean;
  batchQuantity: number;
  laserSpeedMultiplier: number;
  isGCodeModalOpen: boolean;

  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  toggleDesignLock: () => void;
  setBatchQuantity: (qty: number) => void;
  setLaserSpeedMultiplier: (speed: number) => void;
  setGCodeModalOpen: (open: boolean) => void;

  // Tube Assembly Management Actions
  addTube: (profile?: ProfileType) => void;
  selectTube: (id: string) => void;
  deleteTube: (id: string) => void;
  duplicateTube: (id: string) => void;
  updateActiveTubeTransform: (params: Partial<{ position: [number, number, number]; rotation: [number, number, number] }>) => void;

  setProfileType: (type: ProfileType) => void;
  setTubeDimensions: (params: Partial<Pick<CadState, 'length' | 'outerRadius' | 'wallThickness' | 'rectWidth' | 'rectHeight'>>) => void;

  addCutFeature: (type?: CutType) => void;
  updateCutFeature: (id: string, params: Partial<CutFeature>) => void;
  deleteCutFeature: (id: string) => void;
  toggleCutFeature: (id: string) => void;
  selectCutFeature: (id: string | null) => void;
  duplicateCutFeature: (id: string) => void;

  setMaterialId: (id: MaterialId) => void;
  setLaserSettings: (params: Partial<Pick<CadState, 'laserPowerKW' | 'assistGas'>>) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSetting: (key: 'showGrid' | 'showAxes' | 'showDimensions' | 'isLaserAnimating') => void;
  resetDefault: () => void;
  undo: () => void;
  redo: () => void;
}

const INITIAL_CUTS: CutFeature[] = [
  {
    id: 'cut-1',
    name: 'Hole Ø30 @ 300mm',
    type: 'hole',
    positionZ: 300,
    polarAngle: 0,
    radius: 15,
    slotLength: 50,
    slotWidth: 20,
    mitreAngle: 45,
    enabled: true,
  },
  {
    id: 'cut-2',
    name: 'Slot 60x20 @ 700mm',
    type: 'slot',
    positionZ: 700,
    polarAngle: 90,
    radius: 15,
    slotLength: 60,
    slotWidth: 20,
    mitreAngle: 45,
    enabled: true,
  },
  {
    id: 'cut-3',
    name: 'End Mitre 45°',
    type: 'mitre_end',
    positionZ: 1200,
    polarAngle: 0,
    radius: 15,
    slotLength: 50,
    slotWidth: 20,
    mitreAngle: 45,
    enabled: true,
  },
];

const INITIAL_TUBE: TubeItem = {
  id: 'tube-1',
  name: 'Main Chassis Tube',
  profileType: 'round',
  length: 1200,
  outerRadius: 40,
  wallThickness: 3.5,
  rectWidth: 80,
  rectHeight: 60,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  cuts: INITIAL_CUTS,
  selectedCutId: 'cut-1',
  materialId: 'steel_304',
};

const DEFAULT_STATE = {
  tubes: [INITIAL_TUBE],
  activeTubeId: 'tube-1',

  profileType: INITIAL_TUBE.profileType,
  length: INITIAL_TUBE.length,
  outerRadius: INITIAL_TUBE.outerRadius,
  wallThickness: INITIAL_TUBE.wallThickness,
  rectWidth: INITIAL_TUBE.rectWidth,
  rectHeight: INITIAL_TUBE.rectHeight,
  cuts: INITIAL_TUBE.cuts,
  selectedCutId: INITIAL_TUBE.selectedCutId,
  materialId: INITIAL_TUBE.materialId,

  laserPowerKW: 3.0,
  assistGas: 'nitrogen' as const,
  viewMode: 'shaded' as ViewMode,
  showGrid: true,
  showAxes: true,
  showDimensions: true,
  isLaserAnimating: true,
  undoStack: [],
  redoStack: [],

  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  designLocked: false,
  batchQuantity: 25,
  laserSpeedMultiplier: 1,
  isGCodeModalOpen: false,
};

const getSnapshot = (state: CadState): HistorySnapshot => ({
  tubes: JSON.parse(JSON.stringify(state.tubes)),
  activeTubeId: state.activeTubeId,
});

const updateActiveTubeInList = (state: CadState, updater: (active: TubeItem) => Partial<TubeItem>): Partial<CadState> => {
  const activeIndex = state.tubes.findIndex((t) => t.id === state.activeTubeId);
  if (activeIndex === -1) return state;

  const currentActive = state.tubes[activeIndex];
  const updatedActive = { ...currentActive, ...updater(currentActive) };
  const nextTubes = [...state.tubes];
  nextTubes[activeIndex] = updatedActive;

  return {
    tubes: nextTubes,
    profileType: updatedActive.profileType,
    length: updatedActive.length,
    outerRadius: updatedActive.outerRadius,
    wallThickness: updatedActive.wallThickness,
    rectWidth: updatedActive.rectWidth,
    rectHeight: updatedActive.rectHeight,
    cuts: updatedActive.cuts,
    selectedCutId: updatedActive.selectedCutId,
    materialId: updatedActive.materialId,
  };
};

export const useCadStore = create<CadState>((set, get) => ({
  ...DEFAULT_STATE,

  addTube: (profile = 'round') => {
    const current = get();
    const newId = `tube-${Date.now()}`;
    const nextOffset = current.tubes.length * 1.5;

    const newTube: TubeItem = {
      id: newId,
      name: `Tube #${current.tubes.length + 1}`,
      profileType: profile,
      length: 1200,
      outerRadius: 40,
      wallThickness: 3.5,
      rectWidth: 80,
      rectHeight: 60,
      position: [0, nextOffset, 0],
      rotation: [0, 0, 0],
      cuts: [],
      selectedCutId: null,
      materialId: 'steel_304',
    };

    set({
      tubes: [...current.tubes, newTube],
      activeTubeId: newId,
      profileType: newTube.profileType,
      length: newTube.length,
      outerRadius: newTube.outerRadius,
      wallThickness: newTube.wallThickness,
      rectWidth: newTube.rectWidth,
      rectHeight: newTube.rectHeight,
      cuts: newTube.cuts,
      selectedCutId: null,
      materialId: newTube.materialId,
      undoStack: [...current.undoStack, getSnapshot(current)],
      redoStack: [],
    });
  },

  selectTube: (id) => {
    const { tubes } = get();
    const target = tubes.find((t) => t.id === id);
    if (!target) return;

    set({
      activeTubeId: id,
      profileType: target.profileType,
      length: target.length,
      outerRadius: target.outerRadius,
      wallThickness: target.wallThickness,
      rectWidth: target.rectWidth,
      rectHeight: target.rectHeight,
      cuts: target.cuts,
      selectedCutId: target.selectedCutId,
      materialId: target.materialId,
    });
  },

  deleteTube: (id) => {
    const current = get();
    if (current.tubes.length <= 1) return; // Keep at least 1 tube

    const remaining = current.tubes.filter((t) => t.id !== id);
    const nextActive = remaining[0];

    set({
      tubes: remaining,
      activeTubeId: nextActive.id,
      profileType: nextActive.profileType,
      length: nextActive.length,
      outerRadius: nextActive.outerRadius,
      wallThickness: nextActive.wallThickness,
      rectWidth: nextActive.rectWidth,
      rectHeight: nextActive.rectHeight,
      cuts: nextActive.cuts,
      selectedCutId: nextActive.selectedCutId,
      materialId: nextActive.materialId,
      undoStack: [...current.undoStack, getSnapshot(current)],
      redoStack: [],
    });
  },

  duplicateTube: (id) => {
    const current = get();
    const target = current.tubes.find((t) => t.id === id);
    if (!target) return;

    const newId = `tube-${Date.now()}`;
    const duplicate: TubeItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Copy)`,
      position: [target.position[0] + 1.2, target.position[1], target.position[2]],
    };

    set({
      tubes: [...current.tubes, duplicate],
      activeTubeId: newId,
      profileType: duplicate.profileType,
      length: duplicate.length,
      outerRadius: duplicate.outerRadius,
      wallThickness: duplicate.wallThickness,
      rectWidth: duplicate.rectWidth,
      rectHeight: duplicate.rectHeight,
      cuts: duplicate.cuts,
      selectedCutId: duplicate.selectedCutId,
      materialId: duplicate.materialId,
      undoStack: [...current.undoStack, getSnapshot(current)],
      redoStack: [],
    });
  },

  updateActiveTubeTransform: (params) => {
    set((state) => updateActiveTubeInList(state, (active) => ({ ...active, ...params })));
  },

  setProfileType: (profileType) => {
    const current = get();
    set((state) => updateActiveTubeInList(state, () => ({ profileType })));
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  setTubeDimensions: (params) => {
    const current = get();
    set((state) => updateActiveTubeInList(state, (active) => ({ ...active, ...params })));
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  addCutFeature: (type = 'hole') => {
    const current = get();
    const activeTube = current.tubes.find((t) => t.id === current.activeTubeId);
    if (!activeTube) return;

    const newId = `cut-${Date.now()}`;
    const nextZ = Math.min(activeTube.length - 100, Math.max(100, activeTube.cuts.length * 250 + 200));

    const newCut: CutFeature = {
      id: newId,
      name: `${type === 'hole' ? 'Hole Ø30' : type === 'slot' ? 'Slot 50x20' : 'Mitre Cut'} @ ${nextZ}mm`,
      type,
      positionZ: type === 'mitre_end' ? activeTube.length : type === 'mitre_start' ? 0 : nextZ,
      polarAngle: 0,
      radius: 15,
      slotLength: 50,
      slotWidth: 20,
      mitreAngle: 45,
      enabled: true,
    };

    set((state) =>
      updateActiveTubeInList(state, (active) => ({
        cuts: [...active.cuts, newCut],
        selectedCutId: newId,
      }))
    );
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  updateCutFeature: (id, params) => {
    const current = get();
    set((state) =>
      updateActiveTubeInList(state, (active) => ({
        cuts: active.cuts.map((cut) => (cut.id === id ? { ...cut, ...params } : cut)),
      }))
    );
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  deleteCutFeature: (id) => {
    const current = get();
    set((state) =>
      updateActiveTubeInList(state, (active) => {
        const remaining = active.cuts.filter((c) => c.id !== id);
        return {
          cuts: remaining,
          selectedCutId: active.selectedCutId === id ? (remaining[0]?.id || null) : active.selectedCutId,
        };
      })
    );
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  toggleCutFeature: (id) => {
    const current = get();
    set((state) =>
      updateActiveTubeInList(state, (active) => ({
        cuts: active.cuts.map((cut) => (cut.id === id ? { ...cut, enabled: !cut.enabled } : cut)),
      }))
    );
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  selectCutFeature: (selectedCutId) => {
    set((state) => updateActiveTubeInList(state, () => ({ selectedCutId })));
  },

  duplicateCutFeature: (id) => {
    const current = get();
    const activeTube = current.tubes.find((t) => t.id === current.activeTubeId);
    if (!activeTube) return;

    const target = activeTube.cuts.find((c) => c.id === id);
    if (!target) return;

    const newId = `cut-${Date.now()}`;
    const duplicate: CutFeature = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      positionZ: Math.min(activeTube.length - 50, target.positionZ + 100),
    };

    set((state) =>
      updateActiveTubeInList(state, (active) => ({
        cuts: [...active.cuts, duplicate],
        selectedCutId: newId,
      }))
    );
    set((state) => ({ undoStack: [...current.undoStack, getSnapshot(current)], redoStack: [] }));
  },

  setMaterialId: (materialId) => {
    set((state) => updateActiveTubeInList(state, () => ({ materialId })));
  },

  setLaserSettings: (params) => set((state) => ({ ...state, ...params })),

  setViewMode: (viewMode) => set({ viewMode }),

  toggleSetting: (key) => set((state) => ({ [key]: !state[key] })),

  resetDefault: () => set(DEFAULT_STATE),

  undo: () => {
    const current = get();
    if (current.undoStack.length === 0) return;

    const previous = current.undoStack[current.undoStack.length - 1];
    const newUndoStack = current.undoStack.slice(0, -1);
    const activeTube = previous.tubes.find((t) => t.id === previous.activeTubeId) || previous.tubes[0];

    set({
      ...previous,
      profileType: activeTube.profileType,
      length: activeTube.length,
      outerRadius: activeTube.outerRadius,
      wallThickness: activeTube.wallThickness,
      rectWidth: activeTube.rectWidth,
      rectHeight: activeTube.rectHeight,
      cuts: activeTube.cuts,
      selectedCutId: activeTube.selectedCutId,
      materialId: activeTube.materialId,
      undoStack: newUndoStack,
      redoStack: [...current.redoStack, getSnapshot(current)],
    });
  },

  redo: () => {
    const current = get();
    if (current.redoStack.length === 0) return;

    const next = current.redoStack[current.redoStack.length - 1];
    const newRedoStack = current.redoStack.slice(0, -1);
    const activeTube = next.tubes.find((t) => t.id === next.activeTubeId) || next.tubes[0];

    set({
      ...next,
      profileType: activeTube.profileType,
      length: activeTube.length,
      outerRadius: activeTube.outerRadius,
      wallThickness: activeTube.wallThickness,
      rectWidth: activeTube.rectWidth,
      rectHeight: activeTube.rectHeight,
      cuts: activeTube.cuts,
      selectedCutId: activeTube.selectedCutId,
      materialId: activeTube.materialId,
      undoStack: [...current.undoStack, getSnapshot(current)],
      redoStack: newRedoStack,
    });
  },

  toggleLeftSidebar: () => set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),
  setLeftSidebarOpen: (open: boolean) => set({ isLeftSidebarOpen: open }),
  setRightSidebarOpen: (open: boolean) => set({ isRightSidebarOpen: open }),
  toggleDesignLock: () => set((s) => ({ designLocked: !s.designLocked })),
  setBatchQuantity: (qty: number) => set({ batchQuantity: Math.max(1, qty) }),
  setLaserSpeedMultiplier: (speed: number) => set({ laserSpeedMultiplier: speed }),
  setGCodeModalOpen: (open: boolean) => set({ isGCodeModalOpen: open }),
}));
