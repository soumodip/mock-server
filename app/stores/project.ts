import { defineStore } from 'pinia';

export type AuthType =
  | 'api-key'
  | 'bearer-token'
  | 'basic-auth'
  | 'digest-auth'
  | 'oauth1'
  | 'oauth2'
  | 'hawk'
  | 'aws-signature'
  | 'akamai-edgegrid'
  | 'jwt-bearer';

export interface AuthConfig {
  // API Key
  apiKey?: string;
  apiKeyHeader?: string;

  // Bearer Token
  bearerToken?: string;

  // Basic Auth
  basicUsername?: string;
  basicPassword?: string;

  // Digest Auth
  digestUsername?: string;
  digestPassword?: string;
  digestRealm?: string;
  digestNonce?: string;
  digestQop?: string;

  // OAuth 1.0
  oauth1ConsumerKey?: string;
  oauth1ConsumerSecret?: string;
  oauth1Token?: string;
  oauth1TokenSecret?: string;
  oauth1SignatureMethod?: string;

  // OAuth 2.0
  oauth2AccessToken?: string;
  oauth2RefreshToken?: string;
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2TokenUrl?: string;

  // Hawk
  hawkId?: string;
  hawkKey?: string;
  hawkAlgorithm?: string;

  // AWS Signature
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsService?: string;

  // Akamai EdgeGrid
  akamaiClientToken?: string;
  akamaiClientSecret?: string;
  akamaiAccessToken?: string;

  // JWT Bearer
  jwtToken?: string;
  jwtSecret?: string;
  jwtAlgorithm?: string;
}

export interface ProjectGroup {
  name: string;
  isAdminPanelPage: boolean;
}

export interface Project {
  id: string;
  name: string;
  isAuth: boolean;
  authType?: AuthType;
  authConfig?: AuthConfig;
  // Legacy field for backward compatibility
  accessToken: string;
  groups?: (string | ProjectGroup)[];
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to normalize groups (handles both string and object formats)
export function normalizeGroup(group: string | ProjectGroup): ProjectGroup {
  if (typeof group === 'string') {
    return { name: group, isAdminPanelPage: false };
  }
  return group;
}

// Helper function to get group name
export function getGroupName(group: string | ProjectGroup): string {
  if (typeof group === 'string') {
    return group;
  }
  return group.name;
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [] as Project[],
    selectedProjectId: null as string | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProjects() {
      this.loading = true;
      this.error = null;
      try {
        const data = await $fetch<Project[]>('/api/projects');
        this.projects = data;

        // Auto-select first project if none selected
        if (!this.selectedProjectId && data.length > 0) {
          this.selectedProjectId = data[0]!.id;
        }
      } catch (error) {
        this.error = 'Failed to fetch projects';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchProject(id: string) {
      this.loading = true;
      this.error = null;
      try {
        return await $fetch<Project>(`/api/projects/${id}`);
      } catch (error) {
        this.error = 'Failed to fetch project';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const newProject = await $fetch<Project>('/api/projects', {
          method: 'POST',
          body: project,
        });
        this.projects.push(newProject);

        // Auto-select newly created project
        this.selectedProjectId = newProject.id;

        return newProject;
      } catch (error) {
        this.error = 'Failed to create project';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProject(id: string, project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const updatedProject = await $fetch<Project>(`/api/projects/${id}`, {
          method: 'PUT',
          body: project,
        });
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
          this.projects[index] = updatedProject;
        }
        return updatedProject;
      } catch (error) {
        this.error = 'Failed to update project';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteProject(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await $fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });
        this.projects = this.projects.filter(p => p.id !== id);

        // If deleted project was selected, select first available project
        if (this.selectedProjectId === id) {
          this.selectedProjectId = this.projects.length > 0 ? this.projects[0]!.id : null;
        }
      } catch (error) {
        this.error = 'Failed to delete project';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    selectProject(id: string) {
      this.selectedProjectId = id;
    },

    setProjects(projects: Project[]) {
      this.projects = projects;
    }
  },
});
