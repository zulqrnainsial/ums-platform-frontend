export const useApplicantAuthApi = () => {
  const config = useRuntimeConfig()

  const baseUrl =
    config.public?.apiBase ||
    config.public?.apiBaseUrl ||
    config.public?.apiUrl ||
    'http://localhost:8000/api'

  const tokenKey = 'applicant_token'
  const userKey = 'applicant_user'
  const applicantKey = 'applicant_profile'

  const getToken = () => {
    if (process.server) return null
    return localStorage.getItem(tokenKey)
  }

  const saveSession = (data: any) => {
    if (process.server) return

    localStorage.setItem(tokenKey, data.token)
    localStorage.setItem(userKey, JSON.stringify(data.user || {}))
    localStorage.setItem(applicantKey, JSON.stringify(data.applicant || {}))
  }

  const clearSession = () => {
    if (process.server) return

    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    localStorage.removeItem(applicantKey)
  }

  const getStoredApplicant = () => {
    if (process.server) return null

    const raw = localStorage.getItem(applicantKey)

    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const getTenantCode = () => {
  if (process.server) return null

  const route = useRoute()
  const queryTenant = route.query.tenant

  if (typeof queryTenant === 'string' && queryTenant.trim()) {
    localStorage.setItem('applicant_tenant_code', queryTenant.trim())
    return queryTenant.trim()
  }

  return localStorage.getItem('applicant_tenant_code')
}

const request = async <T = any>(url: string, options: any = {}) => {
  const token = getToken()
  const tenantCode = getTenantCode()

  return await $fetch<T>(`${baseUrl}${url}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      ...(tenantCode ? { 'X-Tenant-Code': tenantCode } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

  const register = async (payload: any) => {
    const response: any = await request('/applicant/auth/register', {
      method: 'POST',
      body: payload,
    })

    if (response?.data?.token) {
      saveSession(response.data)
    }

    return response
  }

  const login = async (payload: any) => {
    const response: any = await request('/applicant/auth/login', {
      method: 'POST',
      body: payload,
    })

    if (response?.data?.token) {
      saveSession(response.data)
    }

    return response
  }

  const me = async () => {
    const response: any = await request('/applicant/auth/me')

    if (response?.data) {
      if (process.client) {
        localStorage.setItem(userKey, JSON.stringify(response.data.user || {}))
        localStorage.setItem(applicantKey, JSON.stringify(response.data.applicant || {}))
      }
    }

    return response
  }

  const logout = async () => {
    try {
      await request('/applicant/auth/logout', {
        method: 'POST',
      })
    } finally {
      clearSession()
    }
  }

  return {
    tokenKey,
    getToken,
    saveSession,
    clearSession,
    getStoredApplicant,
    register,
    login,
    me,
    logout,
  }
}