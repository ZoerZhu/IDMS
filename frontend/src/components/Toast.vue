<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
        <span class="toast-icon">
          <AppIcon :name="icons[t.type] || 'Info'" :size="18" />
        </span>
        <span>{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
const icons = {
  success: 'CircleCheck',
  error: 'CircleX',
  warning: 'CircleAlert',
  info: 'Info'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  min-width: 260px;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-glass);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 650;
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  pointer-events: auto;
}

.toast-icon {
  display: flex;
  align-items: center;
}

.toast-success { color: var(--success); border-color: rgba(22, 138, 82, 0.18); }
.toast-error { color: var(--danger); border-color: rgba(192, 47, 54, 0.18); }
.toast-warning { color: var(--warning); border-color: rgba(167, 100, 18, 0.18); }
.toast-info { color: var(--info); border-color: rgba(40, 104, 168, 0.18); }

.toast-enter-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(72px) scale(0.94);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(72px) scale(0.94);
}
</style>
