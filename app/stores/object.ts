import { defineStore } from 'pinia';

export interface ObjectField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'object-json' | 'array' | 'array-string' | 'array-number';
  required: boolean;
  ref?: string; // Reference to another object if type is 'object' or 'array'
}

export interface ObjectSchema {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isEntity: boolean;
  isAdminPanelPage: boolean;
  allowedOperations?: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  fields: ObjectField[];
  objectIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export const useObjectStore = defineStore('object', {
  state: () => ({
    objects: [] as ObjectSchema[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchObjects() {
      this.loading = true;
      this.error = null;
      try {
        const data = await $fetch<ObjectSchema[]>('/api/objects');
        this.objects = data;
      } catch (error) {
        this.error = 'Failed to fetch objects';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchObject(id: string) {
      this.loading = true;
      this.error = null;
      try {
        return await $fetch<ObjectSchema>(`/api/objects/${id}`);
      } catch (error) {
        this.error = 'Failed to fetch object';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createObject(object: Omit<ObjectSchema, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const newObject = await $fetch<ObjectSchema>('/api/objects', {
          method: 'POST',
          body: object,
        });
        this.objects.push(newObject);
        return newObject;
      } catch (error) {
        this.error = 'Failed to create object';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateObject(id: string, object: Partial<Omit<ObjectSchema, 'id' | 'createdAt' | 'updatedAt'>>) {
      this.loading = true;
      this.error = null;
      try {
        const updatedObject = await $fetch<ObjectSchema>(`/api/objects/${id}`, {
          method: 'PUT',
          body: object,
        });
        const index = this.objects.findIndex(o => o.id === id);
        if (index !== -1) {
          this.objects[index] = updatedObject;
        }
        return updatedObject;
      } catch (error) {
        this.error = 'Failed to update object';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteObject(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await $fetch(`/api/objects/${id}`, {
          method: 'DELETE',
        });
        this.objects = this.objects.filter(o => o.id !== id);
      } catch (error) {
        this.error = 'Failed to delete object';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
