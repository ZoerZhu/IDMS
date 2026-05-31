import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'repairs', name: 'Repair', component: () => import('../views/Repair.vue') },
      { path: 'power', name: 'Power', component: () => import('../views/Power.vue') },
      { path: 'hygiene', name: 'Hygiene', component: () => import('../views/Hygiene.vue') },
      { path: 'visitors', name: 'Visitor', component: () => import('../views/Visitor.vue') },
      { path: 'late-returns', name: 'LateReturn', component: () => import('../views/LateReturn.vue') },
      { path: 'mutual-aid', name: 'MutualAid', component: () => import('../views/MutualAid.vue') },
      { path: 'announcements', name: 'Announcement', component: () => import('../views/Announcement.vue') },
      { path: 'buildings', name: 'Building', component: () => import('../views/Building.vue') },
      { path: 'agent', name: 'Agent', component: () => import('../views/Agent.vue') },
      { path: 'imports', name: 'ImportData', component: () => import('../views/ImportData.vue') },
      { path: 'statistics', name: 'Statistics', component: () => import('../views/Statistics.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    next('/login')
  } else if (to.path === '/login' && auth.token) {
    next('/')
  } else {
    next()
  }
})

export default router
