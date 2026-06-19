<template>
  <div>
    <a-input
      v-if="isText"
      v-model:value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      allow-clear
    />

    <a-textarea
      v-else-if="controlType === 'textarea'"
      v-model:value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="3"
      allow-clear
    />

    <a-input-number
      v-else-if="controlType === 'number'"
      v-model:value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      style="width: 100%"
    />

    <a-date-picker
      v-else-if="controlType === 'date'"
      v-model:value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      style="width: 100%"
      value-format="YYYY-MM-DD"
    />

    <a-date-picker
      v-else-if="controlType === 'datetime'"
      v-model:value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      style="width: 100%"
      show-time
      value-format="YYYY-MM-DD HH:mm:ss"
    />

    <a-switch
      v-else-if="isSwitch"
      v-model:checked="localValue"
      :disabled="disabled"
    />

    <a-select
      v-else-if="isSelect"
      v-model:value="localValue"
      :placeholder="selectPlaceholder"
      :disabled="disabled || dependencyMissing"
      :loading="loadingOptions"
      show-search
      allow-clear
      :filter-option="filterOption"
      @dropdown-visible-change="handleDropdownOpen"
    >
      <a-select-option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :label="option.label"
      >
        {{ option.label }}
      </a-select-option>
    </a-select>

    <a-input
      v-else
      v-model:value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      allow-clear
    />

    <div
      v-if="isSelect && dependencyMissing"
      class="dependency-hint"
    >
      Please select {{ parentFieldLabel }} first.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  field: any
  modelValue?: any
  formData?: Record<string, any>
  disabled?: boolean
  moduleCode?: string
  entityKey?: string
  storageRules?: Record<string, any>
}>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: any): void
}>()
const storage = useDynamicFieldStorageRules()

const storageMode = computed(() => {
  const fieldName = props.field?.field_name || props.field?.name || ''

  if (props.storageRules?.[fieldName]?.storage_mode) {
    return props.storageRules[fieldName].storage_mode
  }

  return storage.inferStorageMode(fieldName)
})
const { apiFetch } = useApi()

const options = ref<any[]>([])
const loadingOptions = ref(false)

const localValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  },
})

const parseMaybeJson = (value: any) => {
  if (!value) {
    return {}
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

const fieldMeta = computed(() => {
  return parseMaybeJson(props.field?.meta)
})

const controlType = computed(() => {
  return String(
    props.field?.control_type ||
    props.field?.control ||
    props.field?.type ||
    'text'
  ).toLowerCase()
})

const isText = computed(() => {
  return ['text', 'string', 'email', 'password', 'input'].includes(controlType.value)
})

const isSelect = computed(() => {
  return ['select', 'dropdown', 'lookup'].includes(controlType.value)
})

const isSwitch = computed(() => {
  return ['switch', 'boolean'].includes(controlType.value)
})

const placeholder = computed(() => {
  return props.field?.placeholder || `Enter ${props.field?.label || ''}`
})

const parentFieldName = computed(() => {
  return (
    fieldMeta.value?.depends_on ||
    fieldMeta.value?.dependsOn ||
    props.field?.depends_on ||
    props.field?.dependsOn ||
    null
  )
})

const dependencyParam = computed(() => {
  return (
    fieldMeta.value?.dependency_param ||
    fieldMeta.value?.dependencyParam ||
    props.field?.dependency_param ||
    props.field?.dependencyParam ||
    parentFieldName.value
  )
})

const parentValue = computed(() => {
  if (!parentFieldName.value) {
    return undefined
  }

  return props.formData?.[parentFieldName.value]
})

const dependencyMissing = computed(() => {
  if (!parentFieldName.value) {
    return false
  }

  return parentValue.value === undefined ||
    parentValue.value === null ||
    parentValue.value === ''
})

const parentFieldLabel = computed(() => {
  if (!parentFieldName.value) {
    return 'parent field'
  }

  return String(parentFieldName.value)
    .replaceAll('_id', '')
    .replaceAll('_', ' ')
})

const selectPlaceholder = computed(() => {
  if (dependencyMissing.value) {
    return `Select ${parentFieldLabel.value} first`
  }

  return props.field?.placeholder || `Select ${props.field?.label || ''}`
})

const getStaticOptions = () => {
  const raw =
    props.field?.options_static_json ??
    props.field?.options ??
    []

  const parsed = parseMaybeJson(raw)

  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(raw)
      ? raw
      : []

  return storage.normalizeOptions(items, storageMode.value)
}



const normalizeResponse = (response: any) => {
  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.items)) {
    return response.items
  }

  if (Array.isArray(response?.options)) {
    return response.options
  }

  if (Array.isArray(response)) {
    return response
  }

  return []
}

const normalizeOptions = (items: any[] = []) => {
  return (items || [])
    .map((item: any) => {
      const label =
        item.label ??
        item.name ??
        item.title ??
        item.text ??
        item.description ??
        item.code ??
        item.value ??
        item.id ??
        ''

      const value =
        item.value !== undefined && item.value !== null && item.value !== ''
          ? item.value
          : item.id

      return {
        ...item,
        label: String(label),
        value,
      }
    })
    .filter((item: any) => item.label !== '' && item.value !== undefined && item.value !== null)
}

const buildQuery = () => {
  const query: Record<string, any> = {}

  if (parentFieldName.value && !dependencyMissing.value) {
    query[dependencyParam.value] = parentValue.value
  }

  return query
}

const getSourceType = () => {
  return (
    props.field?.options_source_type ||
    props.field?.source_type ||
    props.field?.option_source_type ||
    null
  )
}

const getSourceUrl = () => {
  return (
    props.field?.options_source_url ||
    props.field?.source_url ||
    props.field?.option_url ||
    null
  )
}

const loadOptions = async () => {
  if (!isSelect.value) {
    return
  }

  const sourceType = getSourceType()
  const sourceUrl = getSourceUrl()

  if (dependencyMissing.value) {
    options.value = []
    return
  }

  if (sourceType === 'static' || !sourceType) {
    options.value = getStaticOptions()
    return
  }

  if (sourceType !== 'api') {
    options.value = getStaticOptions()
    return
  }

  if (!sourceUrl) {
    options.value = []
    return
  }

  loadingOptions.value = true

  try {
    const response: any = await apiFetch(sourceUrl, {
      method: 'GET',
      query: buildQuery(),
    })

    options.value = normalizeOptions(normalizeResponse(response))
  } catch {
    options.value = []
  } finally {
    loadingOptions.value = false
  }
}

const filterOption = (input: string, option: any) => {
  const searchText = [
    option?.label,
    option?.value,
    option?.children,
    option?.key,
    option?.title,
  ]
    .filter((value) => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase()

  return searchText.includes(String(input || '').toLowerCase())
}

const handleDropdownOpen = async (open: boolean) => {
  if (open) {
    await loadOptions()
  }
}

watch(
  () => parentValue.value,
  async (newValue, oldValue) => {
    if (!parentFieldName.value) {
      return
    }

    if (newValue === oldValue) {
      return
    }

    localValue.value = null
    options.value = []

    if (!dependencyMissing.value) {
      await loadOptions()
    }
  }
)

watch(
  () => props.field,
  async () => {
    await loadOptions()
  },
  { deep: true }
)

onMounted(async () => {
  await loadOptions()
})
</script>

<style scoped>
.dependency-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
</style>