import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useProjectStore } from '~/stores/project';

interface DataResetConfig {
  enabled: boolean;
  intervalMs: number;
  lastResetTime: string | null;
}

// Shared state across all component instances
const dataResetConfig = ref<DataResetConfig | null>(null);
const lastKnownResetTime = ref<string | null>(null);
const pendingDeletionCheck = ref<Set<string>>(new Set());
// Store the project ID that was deleted to only show modal if user is on the same project
const deletedProjectId = ref<string | null>(null);

export function useDataReset() {
  const projectStore = useProjectStore();

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  const timeRemaining = ref<number>(0);

  // Check if data reset is enabled
  const isDataResetEnabled = computed(() => {
    return dataResetConfig.value?.enabled ?? false;
  });

  // Get the selected project
  const selectedProject = computed(() => {
    if (!projectStore.selectedProjectId) return null;
    return projectStore.projects.find(p => p.id === projectStore.selectedProjectId) ?? null;
  });

  // Calculate next reset time for the selected project
  const nextResetTime = computed(() => {
    if (!isDataResetEnabled.value || !selectedProject.value?.createdAt || !dataResetConfig.value) {
      return null;
    }
    const createdAt = new Date(selectedProject.value.createdAt).getTime();
    const intervalMs = dataResetConfig.value.intervalMs;
    const nextReset = new Date(createdAt + intervalMs);
    return nextReset.toISOString();
  });

  // Should show timer - only when data reset is enabled AND a project is selected
  const shouldShowTimer = computed(() => {
    return isDataResetEnabled.value && !!selectedProject.value?.createdAt;
  });

  // Format time remaining as MM:SS or HH:MM:SS
  const formattedTimeRemaining = computed(() => {
    if (timeRemaining.value <= 0) return '00:00';

    const totalSeconds = Math.floor(timeRemaining.value / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  // Fetch the data reset config from the API
  const fetchDataResetConfig = async () => {
    try {
      const response = await $fetch<DataResetConfig & { nextResetTime: string | null }>('/api/data-reset/status');

      // Check if a reset has occurred (lastResetTime changed)
      if (lastKnownResetTime.value &&
          response.lastResetTime &&
          lastKnownResetTime.value !== response.lastResetTime) {
        // A reset has occurred - store current project ID for modal check
        // The modal will only show if user is on the same project that was deleted
        deletedProjectId.value = projectStore.selectedProjectId;
      }

      lastKnownResetTime.value = response.lastResetTime;
      dataResetConfig.value = {
        enabled: response.enabled,
        intervalMs: response.intervalMs,
        lastResetTime: response.lastResetTime
      };

      // Update countdown
      updateCountdown();
    } catch (error) {
      console.error('Failed to fetch data reset config:', error);
    }
  };

  // Check if a project has expired and delete it via the backend
  const checkAndDeleteProject = async (projectId: string) => {
    // Prevent duplicate checks for the same project
    if (pendingDeletionCheck.value.has(projectId)) {
      return;
    }

    pendingDeletionCheck.value.add(projectId);

    try {
      const response = await $fetch<{ deleted: boolean; projectId?: string; reason?: string }>(
        '/api/data-reset/check-project',
        {
          method: 'POST',
          body: { projectId }
        }
      );

      if (response.deleted) {
        // Project was actually deleted - store the deleted project ID
        // Modal will only show if user is on the same project
        deletedProjectId.value = projectId;
      }
    } catch (error) {
      console.error('Failed to check/delete project:', error);
    } finally {
      pendingDeletionCheck.value.delete(projectId);
    }
  };

  // Update the countdown timer based on selected project
  const updateCountdown = () => {
    if (!nextResetTime.value) {
      timeRemaining.value = 0;
      return;
    }

    const now = Date.now();
    const nextReset = new Date(nextResetTime.value).getTime();
    timeRemaining.value = Math.max(0, nextReset - now);

    // If countdown reached zero, trigger check and delete via backend
    if (timeRemaining.value === 0 && selectedProject.value) {
      checkAndDeleteProject(selectedProject.value.id);
    }
  };

  // Watch for selected project changes to update countdown immediately
  watch(() => projectStore.selectedProjectId, () => {
    updateCountdown();
  });

  // Start polling for config updates
  const startPolling = () => {
    // Initial fetch
    fetchDataResetConfig();

    // Poll every 30 seconds for config changes (mainly to detect resets)
    pollInterval = setInterval(() => {
      fetchDataResetConfig();
    }, 30 * 1000);

    // Update countdown every second
    countdownInterval = setInterval(() => {
      updateCountdown();
    }, 1000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };

  // Clear the deleted project ID (called when modal is closed)
  const clearDeletedProject = () => {
    deletedProjectId.value = null;
  };

  // Check if data reset modal should be shown
  // Only show if user is currently on the project that was deleted
  const shouldShowDataResetModal = computed(() => {
    return deletedProjectId.value !== null &&
           deletedProjectId.value === projectStore.selectedProjectId;
  });

  // Format date time for display
  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  onMounted(() => {
    startPolling();
  });

  onUnmounted(() => {
    stopPolling();
  });

  return {
    isDataResetEnabled,
    shouldShowTimer,
    nextResetTime,
    timeRemaining,
    formattedTimeRemaining,
    shouldShowDataResetModal,
    dataResetConfig,
    fetchDataResetConfig,
    clearDeletedProject,
    formatDateTime
  };
}
