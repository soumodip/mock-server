import { defineStore } from 'pinia';

export interface Framework {
  id: string;
  name: string;
  value: string;
}

export interface System {
  id: string;
  name: string;
  value: string;
  frameworks: Framework[];
}

export const usePromptsStore = defineStore('prompts', {
  state: () => ({
    systems: [
      {
        id: 'app',
        name: 'App',
        value: 'app',
        frameworks: [
          { id: 'flutter', name: 'Flutter', value: 'flutter' },
          { id: 'react-native', name: 'React Native', value: 'react-native' }
        ]
      },
      {
        id: 'frontend',
        name: 'Frontend',
        value: 'frontend',
        frameworks: [
          { id: 'nuxtjs', name: 'Nuxt.js', value: 'nuxtjs' },
          { id: 'nextjs', name: 'Next.js', value: 'nextjs' }
        ]
      },
      {
        id: 'admin-frontend',
        name: 'Admin Frontend',
        value: 'admin-frontend',
        frameworks: [
          { id: 'nuxtjs', name: 'Nuxt.js', value: 'nuxtjs' },
          { id: 'nextjs', name: 'Next.js', value: 'nextjs' }
        ]
      },
      {
        id: 'backend',
        name: 'Backend',
        value: 'backend',
        frameworks: [
          { id: 'nodejs-typeorm', name: 'Node.js + TypeORM', value: 'nodejs-typeorm' },
          { id: 'fastapi', name: 'FastAPI', value: 'fastapi' },
          { id: 'flask', name: 'Flask', value: 'flask' }
        ]
      }
    ] as System[],
    activeSystem: 'admin-frontend' as string,
    activeFramework: 'nuxtjs' as string
  }),

  getters: {
    currentSystem: (state) => state.systems.find(s => s.value === state.activeSystem),
    currentFramework: (state) => {
      const system = state.systems.find(s => s.value === state.activeSystem);
      return system?.frameworks.find(f => f.value === state.activeFramework);
    }
  },

  actions: {
    setActiveSystem(systemValue: string) {
      this.activeSystem = systemValue;
      // Set the first framework of the selected system as active
      const system = this.systems.find(s => s.value === systemValue);
      if (system && system.frameworks.length > 0) {
        this.activeFramework = system.frameworks[0]!.value;
      }
    },

    setActiveFramework(frameworkValue: string) {
      this.activeFramework = frameworkValue;
    }
  }
});
