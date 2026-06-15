export const usePublicAdmissionGuidanceApi = () => {
  const config = useRuntimeConfig()

  const apiBaseUrl = config.public.apiBaseUrl || 'http://localhost:8000/api'

  const buildQuery = (params: Record<string, any> = {}) => {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, String(value))
      }
    })

    return query.toString()
  }

  const getAdmissionGuidance = async (params: Record<string, any> = {}) => {
    const query = buildQuery(params)
    const suffix = query ? `?${query}` : ''

    return await $fetch(`${apiBaseUrl}/public/admission-guidance${suffix}`)
  }

  return {
    getAdmissionGuidance,
  }
}