import { defineStore } from 'pinia';

export interface Param {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
}

export interface Validator {
  field: string;
  rule: string;
  message: string;
}

export interface StatusMock {
  statusCode: number;
  headerParams?: Param[];
  queryParams?: Param[];
  bodyParams?: Param[];
  validators?: Validator[];
  responseObjectId: string;
  responseValue?: string;
  enabled: boolean;
}

export type ContentType =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'application/xml'
  | 'text/xml'
  | 'application/graphql';

export interface ApiMock {
  id: string;
  projectId: string;
  endpoint: string;
  name?: string;
  description?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  contentType?: ContentType;
  statusMocks: StatusMock[];
  errorResponseObjectId: string;
  errorResponseValue?: string;
  enabled: boolean;
  isAuth: boolean;
  isAdminEndpoint: boolean;
  apiIndex: number;
  group?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useApiStore = defineStore('api', {
  state: () => ({
    apis: [] as ApiMock[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchApis() {
      this.loading = true;
      this.error = null;
      try {
        const data = await $fetch<ApiMock[]>('/api/mocks');
        this.apis = data;
      } catch (error) {
        this.error = 'Failed to fetch APIs';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchApi(id: string) {
      this.loading = true;
      this.error = null;
      try {
        return await $fetch<ApiMock>(`/api/mocks/${id}`);
      } catch (error) {
        this.error = 'Failed to fetch API';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createApi(api: Omit<ApiMock, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const newApi = await $fetch<ApiMock>('/api/mocks', {
          method: 'POST',
          body: api,
        });
        this.apis.push(newApi);
        return newApi;
      } catch (error) {
        this.error = 'Failed to create API';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateApi(id: string, api: Partial<Omit<ApiMock, 'id' | 'createdAt' | 'updatedAt'>>) {
      this.loading = true;
      this.error = null;
      try {
        const updatedApi = await $fetch<ApiMock>(`/api/mocks/${id}`, {
          method: 'PUT',
          body: api,
        });
        const index = this.apis.findIndex(a => a.id === id);
        if (index !== -1) {
          this.apis[index] = updatedApi;
        }
        return updatedApi;
      } catch (error) {
        this.error = 'Failed to update API';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteApi(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await $fetch(`/api/mocks/${id}`, {
          method: 'DELETE',
        });
        this.apis = this.apis.filter(a => a.id !== id);
      } catch (error) {
        this.error = 'Failed to delete API';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async toggleEnabled(id: string) {
      const api = this.apis.find(a => a.id === id);
      if (!api) return;

      try {
        await this.updateApi(id, {
          ...api,
          enabled: !api.enabled,
        });
      } catch (error) {
        console.error('Failed to toggle API:', error);
      }
    },
  },
});
