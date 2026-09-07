import { apiClient } from './apiClient';
import { CadState } from '../store/useCadStore';

export interface ProjectDto {
  id?: string;
  name: string;
  materialId: string;
  length: number;
  outerRadius: number;
  wallThickness: number;
  profileType: string;
  rectWidth?: number;
  rectHeight?: number;
  cuts: any[];
  userId?: string;
  userEmail?: string;
  updatedAt?: string;
  workflowStatus?: string;
  workflowNotes?: string;
  incidents?: any[];
}

export class ProjectService {
  static async saveProject(cadState: CadState): Promise<{ success: boolean; id: string; message: string }> {
    const userStr = localStorage.getItem('zahiri_cad_user');
    let userId: string | undefined;
    let userEmail: string | undefined;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u.id;
        userEmail = u.email;
      } catch {
        // ignore
      }
    }

    const payload: ProjectDto = {
      name: `Zahiri_Tube_${cadState.length}x${cadState.outerRadius * 2}mm`,
      materialId: cadState.materialId,
      length: cadState.length,
      outerRadius: cadState.outerRadius,
      wallThickness: cadState.wallThickness,
      profileType: cadState.profileType,
      rectWidth: cadState.rectWidth,
      rectHeight: cadState.rectHeight,
      cuts: cadState.cuts,
      userId,
      userEmail,
      workflowStatus: cadState.workflowStatus,
      workflowNotes: cadState.workflowNotes,
      incidents: cadState.incidents,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await apiClient.post('/projects', payload);
      return {
        success: true,
        id: response.data?.id || `proj-${Date.now()}`,
        message: 'Project successfully saved to Spring Boot / MySQL database!',
      };
    } catch (error) {
      const mockId = `local-proj-${Date.now()}`;
      localStorage.setItem(`zahiri_cad_project_${mockId}`, JSON.stringify(payload));
      return {
        success: true,
        id: mockId,
        message: 'CAD State saved locally (Spring Boot endpoint pending).',
      };
    }
  }

  static async loadProject(projectId: string): Promise<ProjectDto | null> {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      const localData =
        localStorage.getItem(`zahiri_cad_project_${projectId}`) ||
        localStorage.getItem(`zahiri_cad_${projectId}`);
      return localData ? JSON.parse(localData) : null;
    }
  }

  static async fetchMaterialInventory(): Promise<any[]> {
    try {
      const response = await apiClient.get('/materials');
      return response.data;
    } catch (error) {
      return [
        { id: 'steel_304', name: 'Stainless Steel 304', stockMeters: 450 },
        { id: 'steel_s235', name: 'Structural Steel S235JR', stockMeters: 1200 },
        { id: 'aluminum_6061', name: 'Aluminum 6061-T6', stockMeters: 300 },
      ];
    }
  }
}
