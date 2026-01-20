<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-[#242736] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
      <div class="p-6 border-b border-gray-700">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-200">{{ isEditing ? 'Edit Label' : 'Add Label' }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-300">
            <Icon name="mdi:close" class="w-5 h-5" />
          </button>
        </div>
      </div>
      <div class="p-6">
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-2">Label Name</label>
          <input
            v-model="labelValue"
            type="text"
            class="w-full bg-[#1a1d2e] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Enter label name..."
            @keyup.enter="save"
          />
        </div>
        <div class="flex justify-between items-center gap-3">
          <button
            v-if="isEditing"
            @click="clear"
            class="pl-1 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <Icon name="tdesign:clear" class="h-4 w-4 mr-1" /> Clear
          </button>
          <div class="flex-1"></div>
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="!labelValue.trim()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
  currentLabel?: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [label: string];
  clear: [];
}>();

const labelValue = ref('');

const isEditing = computed(() => !!props.currentLabel);

watch(() => props.show, (newShow) => {
  if (newShow) {
    labelValue.value = props.currentLabel || '';
  }
});

const save = () => {
  if (labelValue.value.trim()) {
    emit('save', labelValue.value.trim());
  }
};

const clear = () => {
  emit('clear');
};
</script>
