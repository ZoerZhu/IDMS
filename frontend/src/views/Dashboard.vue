<template>
  <div class="dashboard">
    <section class="hero glass">
      <div>
        <span class="hero-kicker">今日宿舍运行状态</span>
        <h2>待办、风险与服务入口集中呈现</h2>
        <p>当前使用 mock 数据，支持完整演示登录、审批、报修、公告、统计和楼栋维护流程。</p>
      </div>
      <div class="hero-orbit">
        <div class="orbit-core">
          <AppIcon name="Activity" :size="34" />
        </div>
        <span class="orbit-line"></span>
      </div>
    </section>

    <div class="grid-4 mb-lg">
      <div v-for="s in statCards" :key="s.label" class="stat-card glass">
        <div class="stat-icon">
          <AppIcon :name="s.icon" :size="22" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label text-secondary text-sm">{{ s.label }}</div>
        </div>
        <span class="stat-trend">{{ s.trend }}</span>
      </div>
    </div>

    <div class="grid-2">
      <section class="panel glass">
        <div class="panel-header">
          <h3>快捷操作</h3>
          <span class="text-sm text-secondary">常用服务入口</span>
        </div>
        <div class="quick-grid">
          <router-link v-for="q in quickActions" :key="q.path" :to="q.path" class="quick-item">
            <span class="quick-icon">
              <AppIcon :name="q.icon" :size="21" />
            </span>
            <span class="text-sm">{{ q.label }}</span>
          </router-link>
        </div>
      </section>

      <section class="panel glass">
        <div class="panel-header">
          <h3>最新公告</h3>
          <router-link to="/announcements" class="panel-link">查看全部</router-link>
        </div>
        <div v-if="announcements.length === 0" class="empty-state">
          <AppIcon name="Megaphone" :size="34" />
          <span>暂无公告</span>
        </div>
        <div v-for="a in announcements" :key="a.id" class="ann-item">
          <div class="ann-pin" v-if="a.is_pinned">
            <AppIcon name="Pin" :size="14" />
          </div>
          <div>
            <div class="ann-title">{{ a.title }}</div>
            <div class="text-sm text-secondary">{{ a.content?.slice(0, 58) }}{{ a.content?.length > 58 ? '...' : '' }}</div>
          </div>
        </div>
      </section>
    </div>

    <div class="grid-2 mt-md">
      <section class="panel glass">
        <div class="panel-header">
          <h3>流程健康度</h3>
          <span class="text-sm text-secondary">按日常处理优先级排序</span>
        </div>
        <div class="health-list">
          <div v-for="item in healthItems" :key="item.label" class="health-row">
            <div class="health-copy">
              <AppIcon :name="item.icon" :size="18" />
              <span>{{ item.label }}</span>
            </div>
            <div class="health-track">
              <span :style="{ width: item.percent + '%' }"></span>
            </div>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>

      <section :class="['panel glass alert-panel', { active: powerWarnings > 0 }]">
        <div class="alert-icon">
          <AppIcon :name="powerWarnings > 0 ? 'CircleAlert' : 'ShieldCheck'" :size="28" />
        </div>
        <div>
          <h3>{{ powerWarnings > 0 ? '用电安全告警' : '用电状态平稳' }}</h3>
          <p class="text-sm text-secondary">
            {{ powerWarnings > 0 ? `存在 ${powerWarnings} 条功率超限记录，请优先检查高功率房间。` : '当前无超限记录，可继续保持定期巡检。' }}
          </p>
        </div>
        <router-link to="/power" class="btn btn-secondary btn-sm">
          <AppIcon name="ArrowRight" :size="16" />
          查看用电
        </router-link>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const dashboard = ref({})
const announcements = ref([])
const powerWarnings = ref(0)

const statCards = computed(() => [
  { label: '报修总数', value: dashboard.value.repairs || 0, icon: 'Wrench', trend: '维修' },
  { label: '待处理报修', value: dashboard.value.repairs_pending || 0, icon: 'Timer', trend: '待办' },
  { label: '今日卫生记录', value: dashboard.value.hygiene_today || 0, icon: 'ClipboardCheck', trend: '检查' },
  { label: '宿舍总数', value: dashboard.value.rooms || 0, icon: 'DoorOpen', trend: '资源' }
])

const quickActions = [
  { path: '/repairs', label: '提交报修', icon: 'Wrench' },
  { path: '/hygiene', label: '卫生打卡', icon: 'ClipboardCheck' },
  { path: '/visitors', label: '访客预约', icon: 'Users' },
  { path: '/late-returns', label: '晚归报备', icon: 'Clock' },
  { path: '/mutual-aid', label: '发布互助', icon: 'HeartHandshake' },
  { path: '/announcements', label: '查看公告', icon: 'Megaphone' }
]

const healthItems = computed(() => {
  const max = Math.max(1, dashboard.value.repairs || 0, dashboard.value.visitors_pending || 0, dashboard.value.aids_open || 0, dashboard.value.power_warnings || 0)
  return [
    { label: '维修待办', value: dashboard.value.repairs_pending || 0, icon: 'Wrench' },
    { label: '访客审批', value: dashboard.value.visitors_pending || 0, icon: 'Users' },
    { label: '晚归审批', value: dashboard.value.late_today || 0, icon: 'Clock' },
    { label: '互助进行中', value: dashboard.value.aids_open || 0, icon: 'HeartHandshake' },
    { label: '用电告警', value: dashboard.value.power_warnings || 0, icon: 'Zap' }
  ].map(item => ({ ...item, percent: Math.max(8, Math.round((item.value / max) * 100)) }))
})

onMounted(async () => {
  const [dashRes, annRes] = await Promise.all([
    api.get('/dashboard'),
    api.get('/announcements')
  ])
  if (dashRes.code === 0) {
    dashboard.value = dashRes.data
    powerWarnings.value = dashRes.data.power_warnings
  }
  if (annRes.code === 0) announcements.value = annRes.data.slice(0, 4)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  display: flex;
  min-height: 172px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  overflow: hidden;
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
}

.hero h2 {
  max-width: 620px;
  font-size: 28px;
  font-weight: 860;
  line-height: 1.25;
}

.hero p {
  max-width: 640px;
  margin-top: 8px;
  color: var(--text-secondary);
}

.hero-orbit {
  position: relative;
  display: grid;
  width: 132px;
  height: 132px;
  flex-shrink: 0;
  place-items: center;
}

.orbit-core {
  z-index: 1;
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border-radius: 28px;
  background: #111111;
  color: #ffffff;
  box-shadow: 0 18px 34px rgba(17, 17, 17, 0.18);
}

.orbit-line {
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(17, 17, 17, 0.12);
  border-radius: 42px;
  animation: orbitSpin 9s linear infinite;
}

.orbit-line::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #111111;
}

.stat-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.stat-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 18px;
  background: rgba(17, 17, 17, 0.07);
  color: var(--text-primary);
}

.stat-value {
  font-size: 30px;
  font-weight: 860;
  line-height: 1;
}

.stat-label {
  margin-top: 5px;
}

.stat-trend {
  align-self: start;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 750;
}

.panel {
  padding: 24px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header h3,
.alert-panel h3 {
  font-size: 16px;
  font-weight: 820;
}

.panel-link {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.panel-link:hover {
  color: var(--text-primary);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  min-height: 108px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.54);
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition);
}

.quick-item:hover {
  background: #111111;
  color: #ffffff;
  transform: translateY(-3px);
}

.quick-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 16px;
  background: rgba(17, 17, 17, 0.06);
}

.quick-item:hover .quick-icon {
  background: rgba(255, 255, 255, 0.16);
}

.ann-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(17, 17, 17, 0.06);
}

.ann-item:last-child {
  border-bottom: 0;
}

.ann-pin {
  display: grid;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: rgba(17, 17, 17, 0.07);
}

.ann-title {
  margin-bottom: 3px;
  font-size: 14px;
  font-weight: 760;
}

.health-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.health-row {
  display: grid;
  grid-template-columns: 118px 1fr 34px;
  align-items: center;
  gap: 12px;
}

.health-copy {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.health-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
}

.health-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #111111;
  transition: width 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.health-row strong {
  font-size: 14px;
  text-align: right;
}

.alert-panel {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
}

.alert-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 22px;
  background: rgba(22, 138, 82, 0.1);
  color: var(--success);
}

.alert-panel.active .alert-icon {
  background: rgba(192, 47, 54, 0.1);
  color: var(--danger);
  animation: pulse 1.8s ease-in-out infinite;
}

.empty-state {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-tertiary);
}

@keyframes orbitSpin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

@media (max-width: 720px) {
  .hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-orbit {
    width: 96px;
    height: 96px;
  }

  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .alert-panel {
    grid-template-columns: 1fr;
  }
}
</style>
