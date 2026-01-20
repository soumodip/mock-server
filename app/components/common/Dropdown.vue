<template>
  <div class="relative" ref="dropdownRef">
    <button
      ref="buttonRef"
      type="button"
      @click="toggleDropdown"
      class="px-3 py-1.5 border border-gray-600 bg-[#2d3142] rounded-full focus:ring-2 focus:ring-blue-500 w-full text-left flex items-center justify-between gap-2 hover:bg-[#353849] transition-colors"
      :class="[{ 'ring-2 ring-blue-500': isOpen }, !compact && 'min-w-[200px]']"
    >
      <span class="text-gray-200 text-sm truncate">
        {{ selectedLabel || placeholder }}
      </span>
      <Icon
        name="mdi:chevron-down"
        class="w-4 h-4 text-gray-400 transition-transform flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="menuRef"
          class="fixed z-[9999] bg-[#2d3142] border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto font-poppins"
          :style="dropdownStyle"
        >
          <div class="py-1">
            <button
              type="button"
              v-for="option in options"
              :key="option.value"
              @click="!option.disabled && selectOption(option)"
              :disabled="option.disabled"
              class="w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between"
              :class="[
                modelValue === option.value ? 'bg-[#353849] text-indigo-400' : '',
                option.disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-[#353849]'
              ]"
            >
              <span class="truncate">{{ option.label }}</span>
              <Icon
                v-if="modelValue === option.value"
                name="mdi:check"
                class="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2"
              />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue: string | number | null;
  options: DropdownOption[];
  placeholder?: string;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  compact: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  'change': [value: string | number];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue);
  return selected ? selected.label : '';
});

const updateDropdownPosition = () => {
  if (!buttonRef.value) return;

  const rect = buttonRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

watch(isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updateDropdownPosition();
    });
  }
});

const selectOption = (option: DropdownOption) => {
  emit('update:modelValue', option.value);
  emit('change', option.value);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(target) &&
    menuRef.value &&
    !menuRef.value.contains(target)
  ) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', updateDropdownPosition, true);
  window.addEventListener('resize', updateDropdownPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updateDropdownPosition, true);
  window.removeEventListener('resize', updateDropdownPosition);
});
</script>
