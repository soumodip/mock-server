import { ref } from 'vue';

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  resolve: ((value: boolean) => void) | null;
}

// Module-level singleton state
const state = ref<ConfirmState>({
  show: false,
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  resolve: null,
});

export function useConfirmDialog() {
  function confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        show: true,
        title: options.title || 'Confirm Action',
        message: options.message,
        confirmText: options.confirmText || 'Delete',
        resolve,
      };
    });
  }

  function handleConfirm() {
    state.value.resolve?.(true);
    state.value.show = false;
    state.value.resolve = null;
  }

  function handleCancel() {
    state.value.resolve?.(false);
    state.value.show = false;
    state.value.resolve = null;
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
