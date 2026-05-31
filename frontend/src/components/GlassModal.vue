<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="modal-content glass" :style="{ maxWidth: width }">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button class="modal-close" @click="$emit('update:modelValue', false)" aria-label="关闭">
              <AppIcon name="X" :size="18" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  width: { type: String, default: '480px' }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(17, 17, 17, 0.2);
  backdrop-filter: blur(18px) saturate(1.45);
  -webkit-backdrop-filter: blur(18px) saturate(1.45);
}

.modal-content {
  width: 100%;
  max-height: 86vh;
  overflow-y: auto;
  border-radius: var(--radius-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 820;
}

.modal-close {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.modal-close:hover {
  background: #ffffff;
  color: var(--text-primary);
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px 24px 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 22px;
}
</style>
