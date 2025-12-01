
import { Project, ProjectMetadata, ScriptSegment, ParsingRule } from '../types';
import { DEFAULT_SYSTEM_INSTRUCTION } from './geminiService';

export class MockBackendService {
  private STORAGE_KEY_PROJECTS = 'directorai_projects_map';
  private STORAGE_KEY_META = 'directorai_projects_list';
  private STORAGE_KEY_RULES = 'directorai_parsing_rules';

  async listProjects(): Promise<ProjectMetadata[]> {
    return new Promise((resolve) => {
      const data = localStorage.getItem(this.STORAGE_KEY_META);
      resolve(data ? JSON.parse(data) : []);
    });
  }

  async getProject(id: string): Promise<Project | null> {
    return new Promise((resolve) => {
      const allProjects = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROJECTS) || '{}');
      const project = allProjects[id];
      resolve(project || null);
    });
  }

  async createProject(project: Project): Promise<void> {
    return new Promise((resolve) => {
      const allProjects = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROJECTS) || '{}');
      allProjects[project.id] = project;
      localStorage.setItem(this.STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));

      const metas: ProjectMetadata[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_META) || '[]');
      
      const totalShots = project.segments.reduce((acc, seg) => acc + seg.shots.length, 0);

      const newMeta: ProjectMetadata = {
        id: project.id,
        title: project.title,
        lastModified: Date.now(),
        shotCount: totalShots,
        coverImage: project.segments[0]?.shots[0]?.imageUrl || undefined,
        artStyleLabel: project.artStyleConfig.label
      };
      localStorage.setItem(this.STORAGE_KEY_META, JSON.stringify([newMeta, ...metas]));
      resolve();
    });
  }

  async updateProject(project: Project): Promise<void> {
    return new Promise((resolve) => {
      const allProjects = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROJECTS) || '{}');
      allProjects[project.id] = { ...project, lastModified: Date.now() };
      localStorage.setItem(this.STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));

      const metas: ProjectMetadata[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_META) || '[]');
      const index = metas.findIndex(m => m.id === project.id);
      if (index !== -1) {
        const totalShots = project.segments.reduce((acc, seg) => acc + seg.shots.length, 0);
        let cover = metas[index].coverImage;
        // Try to find a valid cover from any segment if not set
        if (!cover) {
            for (const seg of project.segments) {
                const shotWithImg = seg.shots.find(s => s.imageUrl);
                if (shotWithImg) {
                    cover = shotWithImg.imageUrl;
                    break;
                }
            }
        }

        metas[index] = {
          ...metas[index],
          title: project.title,
          lastModified: Date.now(),
          shotCount: totalShots,
          coverImage: cover
        };
        localStorage.setItem(this.STORAGE_KEY_META, JSON.stringify(metas));
      }
      resolve();
    });
  }

  async deleteProject(id: string): Promise<void> {
    return new Promise((resolve) => {
      const allProjects = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROJECTS) || '{}');
      delete allProjects[id];
      localStorage.setItem(this.STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));

      const metas: ProjectMetadata[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_META) || '[]');
      const newMetas = metas.filter(m => m.id !== id);
      localStorage.setItem(this.STORAGE_KEY_META, JSON.stringify(newMetas));
      resolve();
    });
  }

  // --- Parsing Rules Logic ---

  async listParsingRules(): Promise<ParsingRule[]> {
      return new Promise((resolve) => {
          const stored = localStorage.getItem(this.STORAGE_KEY_RULES);
          if (!stored) {
              const defaultRules: ParsingRule[] = [{
                  id: 'default',
                  name: '标准电影分镜 (Standard)',
                  systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
                  isDefault: true
              }];
              localStorage.setItem(this.STORAGE_KEY_RULES, JSON.stringify(defaultRules));
              resolve(defaultRules);
          } else {
              resolve(JSON.parse(stored));
          }
      });
  }

  async saveParsingRule(rule: ParsingRule): Promise<void> {
      return new Promise((resolve) => {
          const rules: ParsingRule[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_RULES) || '[]');
          const index = rules.findIndex(r => r.id === rule.id);
          if (index !== -1) {
              rules[index] = rule;
          } else {
              rules.push(rule);
          }
          localStorage.setItem(this.STORAGE_KEY_RULES, JSON.stringify(rules));
          resolve();
      });
  }

  async deleteParsingRule(id: string): Promise<void> {
      return new Promise((resolve) => {
          const rules: ParsingRule[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_RULES) || '[]');
          const newRules = rules.filter(r => r.id !== id);
          localStorage.setItem(this.STORAGE_KEY_RULES, JSON.stringify(newRules));
          resolve();
      });
  }
}

export const backend = new MockBackendService();
