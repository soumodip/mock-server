import { ref } from 'vue';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

// Module-level singleton state
const toasts = ref<Toast[]>([]);
let nextId = 0;

const MAX_TOASTS = 5;

function addToast(message: string, type: ToastType, duration = 4000) {
  const id = nextId++;

  // Remove oldest if at max
  if (toasts.value.length >= MAX_TOASTS) {
    toasts.value.shift();
  }

  toasts.value.push({ id, message, type, duration });

  // Auto-remove after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
}

function removeToast(id: number) {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
}

export function useToast() {
  return {
    toasts,
    removeToast,
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  };
}
