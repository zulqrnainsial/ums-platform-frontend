type StorageMode = 'id' | 'code' | 'raw' | 'json_ids' | 'json_codes'

type DynamicFieldStorageRule = {
  module_code: string
  entity_key: string
  field_name: string
  storage_mode: StorageMode
  option_source_key?: string | null
}

export const useDynamicFieldStorageRules = () => {
  const api = useApplicantPortalApi()

  const ruleCache = useState<Record<string, Record<string, DynamicFieldStorageRule>>>(
    'dynamic-field-storage-rule-cache',
    () => ({})
  )

  const entityKey = (moduleCode: string, entityKey: string) => {
    return `${moduleCode}:${entityKey}`
  }

  const loadEntityRules = async (
  moduleCode: string,
  entity: string
): Promise<Record<string, DynamicFieldStorageRule>> => {
  const key = entityKey(moduleCode, entity)

  if (ruleCache.value[key]) {
    return ruleCache.value[key]
  }

  try {
    const response: any = await api.getDynamicFieldStorageRules(moduleCode, entity)

    ruleCache.value[key] = response?.data ?? {}

    return ruleCache.value[key] ?? {}
  } catch {
    ruleCache.value[key] = {}

    return {}
  }
}

  const inferStorageMode = (fieldName: string): StorageMode => {
    if (fieldName.endsWith('_ids') || fieldName.endsWith('_ids_json')) return 'json_ids'
    if (fieldName.endsWith('_codes') || fieldName.endsWith('_codes_json')) return 'json_codes'
    if (fieldName.endsWith('_id')) return 'id'
    if (fieldName.endsWith('_code')) return 'code'
    return 'raw'
  }

  const getStorageMode = (
    rules: Record<string, DynamicFieldStorageRule>,
    fieldName: string
  ): StorageMode => {
    return rules?.[fieldName]?.storage_mode || inferStorageMode(fieldName)
  }
const toSafeNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null

  const numeric = Number(value)

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}
  const optionValueForMode = (option: any, storageMode: StorageMode) => {
  if (!option) return null

  if (storageMode === 'id' || storageMode === 'json_ids') {
    const idValue = toSafeNumber(option.id)

    if (idValue !== null) return idValue

    const valueAsId = toSafeNumber(option.value)

    return valueAsId
  }

  if (storageMode === 'code' || storageMode === 'json_codes') {
    const codeValue = option.code ?? option.value ?? null

    if (codeValue === null || codeValue === undefined || codeValue === '') {
      return null
    }

    return String(codeValue)
  }

  return option.value ?? option.id ?? option.code ?? null
}

  const normalizeOption = (option: any, storageMode: StorageMode) => {
  const label =
    option?.label ??
    option?.name ??
    option?.title ??
    option?.text ??
    option?.description ??
    option?.code ??
    option?.value ??
    option?.id ??
    ''

  return {
    ...option,
    label: String(label),
    value: optionValueForMode(option, storageMode),
    id: option?.id ?? null,
    code: option?.code ?? null,
  }
}

  const normalizeOptions = (options: any[], storageMode: StorageMode) => {
  return (options || [])
    .map((option) => normalizeOption(option, storageMode))
    .filter((option) => option.value !== null && option.value !== undefined && option.value !== '')
}

  const normalizeValueForSubmit = (value: any, storageMode: StorageMode) => {
  if (value === undefined || value === '') return null

  if (storageMode === 'id') {
    return toSafeNumber(value)
  }

  if (storageMode === 'code') {
    return value === null ? null : String(value)
  }

  if (storageMode === 'json_ids') {
    return Array.isArray(value)
      ? value
          .map((x) => toSafeNumber(x))
          .filter((x) => x !== null)
      : []
  }

  if (storageMode === 'json_codes') {
    return Array.isArray(value)
      ? value
          .filter((x) => x !== null && x !== undefined && x !== '')
          .map((x) => String(x))
      : []
  }

  return value
}

  const normalizePayload = (
    payload: Record<string, any>,
    rules: Record<string, DynamicFieldStorageRule>
  ) => {
    const normalized: Record<string, any> = {}

    Object.entries(payload).forEach(([fieldName, value]) => {
      const storageMode = getStorageMode(rules, fieldName)
      normalized[fieldName] = normalizeValueForSubmit(value, storageMode)
    })

    return normalized
  }

  return {
    loadEntityRules,
    inferStorageMode,
    getStorageMode,
    normalizeOption,
    normalizeOptions,
    normalizeValueForSubmit,
    normalizePayload,
  }
}