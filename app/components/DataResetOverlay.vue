<template>
  <!-- This component is mounted once in the default layout.
       It provides the countdown timer badge and the data-reset modal
       so individual pages don't need to wire up useDataReset(). -->

  <!-- Timer Badge — positioned over the floating info button area -->
  <div v-if="shouldShowTimer"
    class="fixed bottom-[60px] right-6 z-40">
    <div
      class="bg-amber-600 text-white text-[10px] font-medium rounded-md min-w-[20px] h-5 flex items-center justify-center px-1"
      :title="`Data resets in ${formattedTimeRemaining}`">
      {{ formattedTimeRemaining }}
    </div>
  </div>

  <!-- Data Reset Modal -->
  <ModalsDataReset
    :show="showResetModal"
    @refresh="handleRefresh" />
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { useDataReset } from '~/composables/useDataReset';

const {
  shouldShowTimer,
  formattedTimeRemaining,
  shouldShowDataResetModal,
  clearDeletedProject
} = useDataReset();

const showResetModal = ref(false);

// Watch for data reset and show modal
watch(shouldShowDataResetModal, (shouldShow) => {
  if (shouldShow) {
    showResetModal.value = true;
    clearDeletedProject();
  }
});

const handleRefresh = () => {
  showResetModal.value = false;
};
</script>
