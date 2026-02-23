<template>
  <div class="relative" ref="dropdownRef">
    <button
      v-if="options.length >= 1"
      ref="buttonRef"
      @click.stop="toggleDropdown"
      class="flex flex-row items-center justify-center text-gray-400 hover:text-gray-300 px-1.5 py-1 rounded hover:opacity-100 opacity-80"
      :title="title">
      <Icon :name="icon" class="w-3.5 h-3.5 my-1 opacity-45" />
    </button>
    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed z-[9999] bg-[#2d3142] border border-gray-600 rounded-lg shadow-lg py-1 font-poppins"
        :style="{ ...dropdownStyle, minWidth: props.minWidth }">
        <button
          v-for="option in options"
          :key="option.value"
          @click.stop="selectOption(option)"
          class="w-full px-3 py-1.5 text-left text-sm hover:bg-[#353849] transition-colors flex items-center gap-2"
          :class="option.active ? 'text-indigo-400' : 'text-gray-300'">
          <Icon v-if="option.active" name="mdi:check" class="w-3.5 h-3.5" />
          <span :class="{ 'ml-5.5': !option.active }">{{ option.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
export interface DropdownOption {
  value: string | number
  label: string
  active?: boolean
}

const props = withDefaults(defineProps<{
  options: DropdownOption[]
  icon?: string
  title?: string
  alignment?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  minWidth?: string
}>(), {
  icon: 'mingcute:edit-line',
  title: 'Select option',
  alignment: 'bottom-left',
  minWidth: '100px'
})

const emit = defineEmits<{
  optionSelected: [option: DropdownOption]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const updateDropdownPosition = () => {
  if (!buttonRef.value) return

  const rect = buttonRef.value.getBoundingClientRect()
  const menuRect = menuRef.value?.getBoundingClientRect()
  const gap = 4
  const menuHeight = menuRect?.height ?? 0
  const menuWidth = menuRect?.width ?? 0

  switch (props.alignment) {
    case 'top-left':
      dropdownStyle.value = {
        top: `${rect.top - menuHeight - gap}px`,
        left: `${rect.left}px`,
      }
      break
    case 'top-right':
      dropdownStyle.value = {
        top: `${rect.top - menuHeight - gap}px`,
        left: `${rect.right - menuWidth}px`,
      }
      break
    case 'bottom-right':
      dropdownStyle.value = {
        top: `${rect.bottom + gap}px`,
        left: `${rect.right - menuWidth}px`,
      }
      break
    default: // bottom-left
      dropdownStyle.value = {
        top: `${rect.bottom + gap}px`,
        left: `${rect.left}px`,
      }
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

watch(isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updateDropdownPosition()
      // Second tick to recalculate with actual menu dimensions
      nextTick(() => {
        updateDropdownPosition()
      })
    })
  }
})

const selectOption = (option: DropdownOption) => {
  emit('optionSelected', option)
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(target) &&
    menuRef.value &&
    !menuRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>
