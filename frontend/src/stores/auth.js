import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const res = await api.post('/login', { username, password })
    if (res.code === 0) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchMe() {
    const res = await api.get('/me')
    if (res.code === 0) {
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    }
  }

  return { token, user, isAdmin, isLoggedIn, login, logout, fetchMe }
})
