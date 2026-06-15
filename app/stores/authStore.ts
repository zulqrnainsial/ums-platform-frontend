import { defineStore } from 'pinia'

interface AuthUser {
  id: number
  tenant_id: number | null
  name: string
  email: string
  phone?: string | null
  user_type: string
  status: string
  tenant?: any
}

interface LoginPayload {
  email: string
  password: string
  tenant_code?: string | null
  device_name?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    token: null as string | null,
    roles: [] as string[],
    permissions: [] as string[],
    menus: [] as any[],
    isAuthenticated: false,
    loading: false,
    initialized: false,
  }),

  actions: {
    async login(payload: LoginPayload) {
      const { apiFetch } = useApi()

      this.loading = true

      try {
        const response: any = await apiFetch('/auth/login', {
          method: 'POST',
          body: {
            email: payload.email,
            password: payload.password,
            tenant_code: payload.tenant_code || null,
            device_name: payload.device_name || 'web',
          },
        })

        const token = response.data.token

        localStorage.setItem('auth_token', token)

        this.token = token
        this.user = response.data.user
        this.roles = response.data.roles || []
        this.permissions = response.data.permissions || []
        this.isAuthenticated = true
        this.initialized = true

        await this.fetchMenus(token)

        return response
      } finally {
        this.loading = false
      }
    },

    async initializeAuth() {
      const token = localStorage.getItem('auth_token')

      if (!token) {
        this.logoutLocal()
        return false
      }

      try {
        await this.fetchMe(token)
        await this.fetchMenus(token)

        this.token = token
        this.isAuthenticated = true
        this.initialized = true

        return true
      } catch {
        this.logoutLocal()
        return false
      }
    },

    async fetchMe(token: string) {
      const { apiFetch } = useApi()

      const response: any = await apiFetch('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      this.user = response.data.user
      this.roles = response.data.roles || []
      this.permissions = response.data.permissions || []

      return response.data.user
    },

    async fetchMenus(token?: string) {
      const { apiFetch } = useApi()

      const currentToken = token || localStorage.getItem('auth_token')

      if (!currentToken) {
        this.menus = []
        return []
      }

      const response: any = await apiFetch('/auth/menus', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      this.menus = response.data || []

      return this.menus
    },

    async logout() {
      const { apiFetch } = useApi()

      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
        })
      } catch {
        // ignore logout API failure
      } finally {
        this.logoutLocal()
      }
    },

    logoutLocal() {
      if (process.client) {
        localStorage.removeItem('auth_token')
      }

      this.user = null
      this.token = null
      this.roles = []
      this.permissions = []
      this.menus = []
      this.isAuthenticated = false
      this.initialized = false
    },

    can(permission: string): boolean {
      return this.permissions.includes(permission)
    },

    canAny(permissions: string[]): boolean {
      return permissions.some(permission => this.permissions.includes(permission))
    },

    hasRole(role: string): boolean {
      return this.roles.includes(role)
    },
  },
})