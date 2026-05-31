<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="brand-panel">
        <div class="brand-mark">
          <AppIcon name="House" :size="28" />
        </div>
        <div>
          <h1>宿居无忧</h1>
          <p>学生宿舍智能管理与服务系统</p>
        </div>
        <div class="brand-metrics">
          <div v-for="item in metrics" :key="item.label" class="metric">
            <AppIcon :name="item.icon" :size="18" />
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </section>

      <section class="login-card glass">
        <div class="login-header">
          <span class="eyebrow">Mock 演示环境</span>
          <h2>登录控制台</h2>
          <p>使用演示账号即可查看完整前端功能流程。</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="form.username" class="input" placeholder="请输入用户名" autocomplete="username" />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="form.password" type="password" class="input" placeholder="请输入密码" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary w-full login-btn" :disabled="loading">
            <AppIcon :name="loading ? 'LoaderCircle' : 'LogIn'" :class="{ spin: loading }" :size="18" />
            {{ loading ? '登录中' : '登录' }}
          </button>
        </form>

        <div class="demo-accounts">
          <p class="text-sm text-secondary">演示账号</p>
          <div class="account-chips">
            <button class="chip" @click="fillAccount('admin', 'admin123')">
              <AppIcon name="ShieldCheck" :size="15" />
              管理员 admin
            </button>
            <button class="chip" @click="fillAccount('student1', '123456')">
              <AppIcon name="UserRound" :size="15" />
              学生 student1
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

const metrics = [
  { label: '楼栋', value: '4', icon: 'Building2' },
  { label: '房间', value: '64', icon: 'DoorOpen' },
  { label: '流程', value: '8', icon: 'Workflow' }
]

function fillAccount(u, p) {
  form.username = u
  form.password = p
}

async function handleLogin() {
  if (!form.username || !form.password) {
    toast.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await auth.login(form.username, form.password)
    if (res.code === 0) {
      toast.success(`欢迎回来，${res.data.user.name}`)
      router.push('/')
    } else {
      toast.error(res.msg)
    }
  } catch {
    toast.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 32px;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 16px;
  border: 1px solid rgba(17, 17, 17, 0.06);
  border-radius: 36px;
  pointer-events: none;
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(980px, 100%);
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 22px;
  align-items: stretch;
}

.brand-panel {
  display: flex;
  min-height: 520px;
  flex-direction: column;
  justify-content: space-between;
  padding: 34px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 34px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.72), rgba(242, 242, 239, 0.72));
  box-shadow: var(--shadow-glass);
  animation: panelIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.brand-mark {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 24px;
  background: #111111;
  color: #ffffff;
  box-shadow: 0 18px 36px rgba(17, 17, 17, 0.18);
}

.brand-panel h1 {
  margin-top: 28px;
  font-size: 48px;
  font-weight: 860;
  letter-spacing: 0;
}

.brand-panel p {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 16px;
}

.brand-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--text-secondary);
}

.metric strong {
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1;
}

.metric span {
  font-size: 12px;
}

.login-card {
  align-self: center;
  padding: 34px;
  border-radius: 34px;
  animation: cardIn 0.72s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.login-header {
  margin-bottom: 28px;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
}

.login-header h2 {
  font-size: 26px;
  font-weight: 830;
}

.login-header p {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-btn {
  min-height: 48px;
  margin-top: 6px;
  font-size: 15px;
}

.demo-accounts {
  margin-top: 26px;
}

.demo-accounts p {
  margin-bottom: 10px;
}

.account-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  transition: var(--transition);
}

.chip:hover {
  background: #111111;
  color: #ffffff;
  transform: translateY(-1px);
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes panelIn {
  from { opacity: 0; transform: translateX(-24px) scale(0.98); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(26px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 860px) {
  .login-page {
    padding: 18px;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: auto;
    gap: 30px;
  }

  .brand-panel h1 {
    font-size: 36px;
  }
}
</style>
