import type { PdfDocumentModel, PdfProject } from './types';

const STORAGE_KEY_PREFIX = 'savia_pdf_pro_project_';
const RECENT_PROJECTS_KEY = 'savia_pdf_pro_recent_list';

export class ProjectService {
  /**
   * Save a PDF project to local persistence
   */
  public static saveProject(doc: PdfDocumentModel, customName?: string): PdfProject {
    const name = customName || doc.fileName || 'Proyecto Sin Título';
    const projectId = doc.id || `proj-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const project: PdfProject = {
      id: projectId,
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      document: {
        ...doc,
        id: projectId,
        fileName: name,
        isDirty: false
      },
      version: 1
    };

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(project));
      this.addToRecentList(projectId, name, timestamp);
    } catch (e) {
      console.warn('LocalStorage limit exceeded, attempting storage trim:', e);
    }

    return project;
  }

  /**
   * Load project by ID
   */
  public static loadProject(projectId: string): PdfProject | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * List all stored recent projects
   */
  public static listRecentProjects(): { id: string; name: string; updatedAt: string }[] {
    try {
      const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Delete project
   */
  public static deleteProject(projectId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      const recent = this.listRecentProjects().filter(p => p.id !== projectId);
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recent));
    } catch (e) {
      console.error('Error deleting project:', e);
    }
  }

  private static addToRecentList(id: string, name: string, updatedAt: string) {
    const list = this.listRecentProjects().filter(item => item.id !== id);
    list.unshift({ id, name, updatedAt });
    // Keep max 20 recent projects
    const trimmed = list.slice(0, 20);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(trimmed));
  }
}
