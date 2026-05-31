<template>
  <div class="layout">
    <div v-if="showSidebar" class="mobile-scrim" @click="showSidebar = false"></div>

    <aside :class="['sidebar glass', { open: showSidebar }]">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-mark">
            <AppIcon name="House" :size="22" />
          </div>
          <div>
            <h1 class="logo-title">宿居无忧</h1>
            <p class="logo-sub">智能宿舍管理系统</p>
          </div>
        </div>
      </div>

      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: $route.path === item.path }]"
          @click="showSidebar = false"
        >
          <span class="nav-icon">
            <AppIcon :name="item.icon" :size="20" />
          </span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="user-info" @click="showUserMenu = !showUserMenu">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-copy">
            <div class="user-name">{{ auth.user?.name || '未登录' }}</div>
            <div class="user-role">{{ auth.user?.role === 'admin' ? '管理员' : '学生' }}</div>
          </div>
          <AppIcon class="chevron" name="ChevronUp" :size="16" />
        </button>
        <transition name="modal">
          <div v-if="showUserMenu" class="user-menu glass">
            <button class="menu-item" @click="handleLogout">
              <AppIcon name="LogOut" :size="17" />
              <span>退出登录</span>
            </button>
          </div>
        </transition>
      </div>
    </aside>

    <main class="main">
      <header class="topbar glass">
        <div class="topbar-left">
          <button class="btn btn-ghost menu-trigger" @click="showSidebar = true" aria-label="打开导航">
            <AppIcon name="Menu" :size="20" />
          </button>
          <div>
            <h2 class="page-title">{{ currentTitle }}</h2>
            <p class="page-subtitle">{{ currentSubtitle }}</p>
          </div>
        </div>
        <div class="topbar-right">
          <button class="icon-btn" @click="showNotif = !showNotif" aria-label="通知">
            <AppIcon name="Bell" :size="19" />
            <span v-if="unreadCount" class="notif-badge">{{ unreadCount }}</span>
          </button>
        </div>
      </header>

      <transition name="modal">
        <div v-if="showNotif" class="notif-panel" @click.self="showNotif = false">
          <div class="notif-content glass">
            <div class="notif-header">
              <div>
                <h3>通知中心</h3>
                <p class="text-sm text-secondary">审批、维修与安全提醒</p>
              </div>
              <button class="btn btn-secondary btn-sm" @click="markAllRead">
                <AppIcon name="CheckCheck" :size="16" />
                全部已读
              </button>
            </div>

            <div v-if="notifications.length === 0" class="empty-panel">
              <AppIcon name="Inbox" :size="34" />
              <span>暂无通知</span>
            </div>

            <button
              v-for="n in notifications"
              :key="n.id"
              :class="['notif-item', { unread: !n.is_read }]"
              @click="markRead(n)"
            >
              <span class="notif-dot"></span>
              <span class="notif-main">
                <span class="notif-title">{{ n.title }}</span>
                <span class="notif-body">{{ n.content }}</span>
                <span class="notif-time">{{ formatTime(n.created_at) }}</span>
              </span>
            </button>
          </div>
        </div>
      </transition>

      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const showSidebar = ref(false)
const showUserMenu = ref(false)
const showNotif = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

const navItems = computed(() => {
  const items = [
    { path: '/', label: '仪表盘', icon: 'LayoutDashboard', subtitle: '宿舍事务总览与待办提醒' },
    { path: '/repairs', label: '报修管理', icon: 'Wrench', subtitle: '提交报修、跟踪维修进度' },
    { path: '/power', label: '用电安全', icon: 'Zap', subtitle: '查看功率监测与超限记录' },
    { path: '/hygiene', label: '卫生打卡', icon: 'ClipboardCheck', subtitle: '卫生评分、复查与统计' },
    { path: '/visitors', label: '访客预约', icon: 'Users', subtitle: '预约访客、审批来访申请' },
    { path: '/late-returns', label: '晚归报备', icon: 'Clock', subtitle: '晚归申请与审批记录' },
    { path: '/mutual-aid', label: '宿舍互助', icon: 'HeartHandshake', subtitle: '发布互助需求与接单' },
    { path: '/announcements', label: '公告通知', icon: 'Megaphone', subtitle: '查看宿舍公告与制度提醒' }
  ]
  if (auth.isAdmin) {
    items.push(
      { path: '/buildings', label: '楼栋管理', icon: 'Building2', subtitle: '维护楼栋、楼层与房间信息' },
      { path: '/agent', label: '智能 Agent', icon: 'Bot', subtitle: '对话查询、审批、删除与导入数据' },
      { path: '/imports', label: '数据导入', icon: 'FileUp', subtitle: '下载模板、上传文档并一键导入' },
      { path: '/statistics', label: '数据统计', icon: 'ChartNoAxesColumn', subtitle: '报修、卫生、安全与审批看板' }
    )
  }
  return items
})

const currentNav = computed(() => navItems.value.find(i => i.path === route.path))
const currentTitle = computed(() => currentNav.value?.label || '宿居无忧')
const currentSubtitle = computed(() => currentNav.value?.subtitle || '智能宿舍管理系统')
const userInitial = computed(() => auth.user?.name?.slice(0, 1) || '?')

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadNotifications() {
  try {
    const [notifs, count] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count')
    ])
    if (notifs.code === 0) notifications.value = notifs.data
    if (count.code === 0) unreadCount.value = count.data.count
  } catch {
    toast.warning('通知加载失败')
  }
}

async function markRead(n) {
  if (!n.is_read) {
    await api.put(`/notifications/${n.id}/read`)
    n.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

async function markAllRead() {
  await api.put('/notifications/read-all')
  notifications.value.forEach(n => { n.is_read = true })
  unreadCount.value = 0
}

function handleLogout() {
  auth.logout()
  localStorage.removeItem('dormitory_mock_user_id')
  router.push('/login')
}

onMounted(loadNotifications)
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 100;
  display: flex;
  width: var(--sidebar-width);
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 30px 30px 0;
  border-left: 0;
  border-top: 0;
  border-bottom: 0;
}

.sidebar-header {
  padding: 26px 20px 18px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 13px;
}

.logo-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 18px;
  background: #111111;
  color: #ffffff;
  box-shadow: 0 14px 26px rgba(17, 17, 17, 0.18);
}

.logo-title {
  color: var(--text-primary);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0;
}

.logo-sub {
  margin-top: 1px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 8px 14px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 11px 14px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 18px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  transition: var(--transition);
}

.nav-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  opacity: 0;
  transform: translateX(-70%);
  transition: transform 0.6s ease, opacity 0.3s ease;
}

.nav-item:hover {
  background: rgba(17, 17, 17, 0.045);
  color: var(--text-primary);
}

.nav-item:hover::after {
  opacity: 1;
  transform: translateX(70%);
}

.nav-item.active {
  background: #111111;
  color: #ffffff;
  box-shadow: 0 14px 32px rgba(17, 17, 17, 0.16);
}

.nav-icon {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.nav-label,
.nav-badge {
  z-index: 1;
}

.nav-badge {
  min-width: 20px;
  margin-left: auto;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--danger);
  color: #ffffff;
  font-size: 11px;
  text-align: center;
}

.sidebar-footer {
  position: relative;
  padding: 14px;
}

.user-info {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.94);
  transform: translateY(-1px);
}

.user-avatar {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 16px;
  background: #111111;
  color: #ffffff;
  font-weight: 800;
}

.user-copy {
  min-width: 0;
  flex: 1;
}

.user-name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  color: var(--text-tertiary);
  font-size: 12px;
}

.chevron {
  color: var(--text-tertiary);
}

.user-menu {
  position: absolute;
  right: 14px;
  bottom: 82px;
  left: 14px;
  padding: 8px;
  border-radius: 22px;
}

.menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: var(--danger);
  cursor: pointer;
  font-size: 14px;
  font-weight: 650;
  transition: var(--transition);
}

.menu-item:hover {
  background: rgba(192, 47, 54, 0.08);
}

.main {
  display: flex;
  min-height: 100vh;
  flex: 1;
  flex-direction: column;
  margin-left: var(--sidebar-width);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 14px 32px;
  border-radius: 0 0 26px 26px;
  border-top: 0;
  border-right: 0;
  border-left: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.menu-trigger {
  display: none;
}

.page-title {
  font-size: 21px;
  font-weight: 820;
  letter-spacing: 0;
}

.page-subtitle {
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  position: relative;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.74);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
}

.icon-btn:hover {
  background: #ffffff;
  transform: translateY(-1px);
}

.notif-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: var(--danger);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
}

.notif-panel {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: flex;
  justify-content: flex-end;
  background: rgba(17, 17, 17, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.notif-content {
  width: min(420px, calc(100vw - 24px));
  height: calc(100vh - 24px);
  margin: 12px;
  padding: 20px;
  overflow-y: auto;
  border-radius: 30px;
}

.notif-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.notif-header h3 {
  font-size: 18px;
  font-weight: 820;
}

.notif-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.notif-item:hover {
  background: rgba(17, 17, 17, 0.04);
  transform: translateX(-2px);
}

.notif-item.unread {
  border-color: rgba(17, 17, 17, 0.1);
  background: rgba(255, 255, 255, 0.64);
}

.notif-dot {
  width: 9px;
  height: 9px;
  margin-top: 7px;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.18);
}

.notif-item.unread .notif-dot {
  background: var(--danger);
  box-shadow: 0 0 0 5px rgba(192, 47, 54, 0.1);
}

.notif-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.notif-title {
  font-size: 14px;
  font-weight: 760;
}

.notif-body {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.45;
}

.notif-time {
  margin-top: 3px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.empty-panel {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-tertiary);
}

.content {
  flex: 1;
  padding: 28px 32px 42px;
}

.mobile-scrim {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(17, 17, 17, 0.22);
  backdrop-filter: blur(8px);
}

@media (max-width: 860px) {
  .sidebar {
    transform: translateX(calc(-1 * var(--sidebar-width) - 24px));
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .main {
    margin-left: 0;
  }

  .menu-trigger {
    display: inline-flex;
  }

  .topbar {
    min-height: 72px;
    padding: 12px 16px;
  }

  .content {
    padding: 20px 16px 32px;
  }
}
</style>
