import { useAuthStore } from '~/stores/authStore'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/auth/login']

  if (publicRoutes.includes(to.path)) {
    return
  }

  const authStore = useAuthStore()

  const token = localStorage.getItem('auth_token')

  if (!token) {
    authStore.logoutLocal()
    return navigateTo('/auth/login')
  }

  const restored = await authStore.initializeAuth()

  if (!restored) {
    authStore.logoutLocal()
    return navigateTo('/auth/login')
  }
})