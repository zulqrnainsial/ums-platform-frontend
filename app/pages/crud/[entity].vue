<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>{{ meta?.title || entityCode }}</h2>
          <p>{{ meta?.subtitle }}</p>
        </div>

        <div class="page-actions">
          <AppFilterBar
            v-if="meta"
            :filters="meta.filters || []"
            @search="handleSearch"
          />

          <template
            v-for="action in toolbarActions"
            :key="action.name"
          >
            <a-button
              v-if="action.name === 'create'"
              type="primary"
              @click="openCreateModal"
            >
              {{ action.label }}
            </a-button>
          </template>
        </div>
      </div>

      <AppTable
        v-if="meta"
        :columns="meta.columns || []"
        :actions="meta.actions || []"
        :data="records"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        @action="handleRowAction"
      />

      <a-modal
        v-model:open="formModal.visible"
        :title="formModal.isEdit ? `Edit ${meta?.entity_name || entityCode}` : `Create ${meta?.entity_name || entityCode}`"
        width="900px"
        :confirm-loading="saving"
        @ok="saveRecord"
        @cancel="closeFormModal"
      >
        <AppForm
          v-if="meta"
          :fields="meta.fields || []"
          :model="form"
        />
      </a-modal>

      <a-modal
        v-model:open="detailsModal.visible"
        :title="`${meta?.entity_name || entityCode} Details`"
        width="1000px"
        :footer="null"
        @cancel="closeDetailsModal"
      >
        <template v-if="detailsModal.record">
          <a-descriptions
            bordered
            size="small"
            :column="1"
            class="details-descriptions"
          >
            <a-descriptions-item
              v-for="field in detailFields"
              :key="fieldKey(field)"
              :label="field.label || field.title || fieldKey(field)"
            >
              <template v-if="isBooleanField(field)">
                <a-tag :color="detailsModal.record[fieldKey(field)] ? 'green' : 'red'">
                  {{ detailsModal.record[fieldKey(field)] ? 'Yes' : 'No' }}
                </a-tag>
              </template>

              <template v-else-if="isStatusField(field)">
                <a-tag>
                  {{ getRecordDisplayValue(detailsModal.record, field) || '-' }}
                </a-tag>
              </template>

              <template v-else>
                <span class="details-value">
                  {{ getRecordDisplayValue(detailsModal.record, field) || '-' }}
                </span>
              </template>
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <a-space>
            <a-button
              v-if="canEdit"
              type="primary"
              @click="editFromDetails"
            >
              Edit
            </a-button>

            <a-button @click="closeDetailsModal">
              Close
            </a-button>
          </a-space>
        </template>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'
import AppTable from '~/components/common/AppTable.vue'
import AppForm from '~/components/common/AppForm.vue'
import AppFilterBar from '~/components/common/AppFilterBar.vue'

const route = useRoute()
const { apiFetch } = useApi()
const storage = useDynamicFieldStorageRules()
const storageRules = ref<Record<string, any>>({})
const entityCode = computed(() => String(route.params.entity))
const moduleCode = computed(() => {
  return meta.value?.module_code || meta.value?.module || 'admission'
})

const storageEntityKey = computed(() => {
  return meta.value?.table_name || meta.value?.entity_key || entityCode.value
})
const meta = ref<any | null>(null)
const records = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const activeFilters = ref<Record<string, any>>({})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
})

const formModal = reactive({
  visible: false,
  isEdit: false,
  editId: null as number | string | null,
})

const detailsModal = reactive({
  visible: false,
  record: null as any,
})

const form = reactive<Record<string, any>>({})

const authStore = useAuthStore()

const toolbarActions = computed(() => {
  const actions = (meta.value?.actions || [])
    .filter((action: any) => action.placement === 'toolbar')

  if (entityCode.value === 'modules' && authStore.user?.user_type !== 'super_admin') {
    return []
  }

  return actions
})

const rowActions = computed(() => {
  return (meta.value?.actions || []).filter((action: any) => action.placement === 'row')
})

const canEdit = computed(() => {
  return rowActions.value.some((action: any) => action.name === 'edit')
})

const parseMeta = (value: any) => {
  if (!value) return {}

  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

const fieldKey = (field: any) => {
  return String(field?.field_name || field?.name || field?.dataIndex || field?.key || '')
}

const isFieldHiddenInDetails = (field: any) => {
  const key = fieldKey(field)
  const fieldMeta = parseMeta(field?.meta)

  if (!key) return true

  if (
    field?.show_in_detail === false ||
    field?.show_in_details === false ||
    field?.detail_visible === false ||
    fieldMeta?.show_in_detail === false ||
    fieldMeta?.detail_visible === false
  ) {
    return true
  }

  return false
}

const detailFields = computed(() => {
  const fields = meta.value?.fields?.length
    ? meta.value.fields
    : meta.value?.columns || []

  return fields
    .filter((field: any) => !isFieldHiddenInDetails(field))
    .sort((a: any, b: any) => {
      const metaA = parseMeta(a?.meta)
      const metaB = parseMeta(b?.meta)

      return (a?.detail_order ?? metaA?.detail_order ?? a?.display_order ?? 999)
        - (b?.detail_order ?? metaB?.detail_order ?? b?.display_order ?? 999)
    })
})

const fetchMeta = async () => {
  const response: any = await apiFetch(`/dynamic/meta/${entityCode.value}`, {
    method: 'GET',
  })

  meta.value = response.data

  

  initializeForm()
}

const initializeForm = () => {
  Object.keys(form).forEach(key => delete form[key])

  if (!meta.value) return

  ;(meta.value.fields || []).forEach((field: any) => {
    const key = fieldKey(field)

    if (!key) return

    const control = String(field.control || field.control_type || '').toLowerCase()

    if (control === 'switch' || control === 'boolean') {
      form[key] = field.default_value === '1' || field.default_value === true
    } else if (control === 'multi-select' || control === 'checkbox') {
      form[key] = []
    } else {
      form[key] = field.default_value ?? ''
    }
  })
}

const normalizeListResponse = (response: any) => {
  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  return []
}

const normalizePagination = (response: any) => {
  const responseMeta = response?.meta || response?.data?.meta || {}

  pagination.total = responseMeta?.total || response?.total || 0
  pagination.current = responseMeta?.current_page || responseMeta?.current || pagination.current || 1
  pagination.pageSize = responseMeta?.per_page || responseMeta?.pageSize || pagination.pageSize || 10
}

const fetchRecords = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch(`/dynamic/crud/${entityCode.value}`, {
      method: 'GET',
      query: {
        ...activeFilters.value,
        page: pagination.current,
        per_page: pagination.pageSize,
      },
    })

    records.value = normalizeListResponse(response)
    normalizePagination(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to fetch records.')
  } finally {
    loading.value = false
  }
}

const handleSearch = (filters: Record<string, any>) => {
  activeFilters.value = filters
  pagination.current = 1
  fetchRecords()
}

const handleTableChange = (pager: any, _filters: any, sorter: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize

  if (sorter?.field) {
    activeFilters.value.sort_field = sorter.field
    activeFilters.value.sort_order = sorter.order
  }

  fetchRecords()
}

const openCreateModal = () => {
  initializeForm()
  formModal.visible = true
  formModal.isEdit = false
  formModal.editId = null
}

const openEditModal = (record: any) => {
  initializeForm()

  Object.keys(form).forEach((key) => {
    form[key] = record[key]
  })

  formModal.visible = true
  formModal.isEdit = true
  formModal.editId = record.id
}

const closeFormModal = () => {
  formModal.visible = false
  formModal.isEdit = false
  formModal.editId = null
  initializeForm()
}

const openDetailsModal = (record: any) => {
  detailsModal.record = record
  detailsModal.visible = true
}

const closeDetailsModal = () => {
  detailsModal.visible = false
  detailsModal.record = null
}

const editFromDetails = () => {
  if (!detailsModal.record) return

  const record = detailsModal.record
  closeDetailsModal()
  openEditModal(record)
}

const saveRecord = async () => {
  saving.value = true
  const payload = { ...form }
  try {
    if (formModal.isEdit && formModal.editId) {
      await apiFetch(`/dynamic/crud/${entityCode.value}/${formModal.editId}`, {
        method: 'PUT',
        body: payload,
      })

      message.success('Record updated successfully.')
    } else {
      await apiFetch(`/dynamic/crud/${entityCode.value}`, {
        method: 'POST',
        body: payload,
      })

      message.success('Record created successfully.')
    }

    closeFormModal()
    fetchRecords()
  } catch (error: any) {
    const errors = error?.data?.errors

    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0]

      if (firstKey && Array.isArray(errors[firstKey])) {
        message.error(errors[firstKey][0])
      } else {
        message.error('Validation failed.')
      }
    } else {
      message.error(error?.data?.message || 'Failed to save record.')
    }
  } finally {
    saving.value = false
  }
}

const deleteRecord = async (record: any) => {
  try {
    await apiFetch(`/dynamic/crud/${entityCode.value}/${record.id}`, {
      method: 'DELETE',
    })

    message.success('Record deleted successfully.')
    fetchRecords()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to delete record.')
  }
}

const handleRowAction = (action: any, record: any) => {
  if (entityCode.value === 'modules' && authStore.user?.user_type !== 'super_admin') {
    message.warning('Only Super Admin can manage modules.')
    return
  }

  if (action.name === 'view' || action.name === 'details') {
    openDetailsModal(record)
    return
  }

  if (action.name === 'edit') {
    openEditModal(record)
    return
  }

  if (action.name === 'delete') {
    deleteRecord(record)
    return
  }

  message.info(`Action ${action.name} is not implemented yet.`)
}

const getRecordDisplayValue = (record: any, field: any) => {
  const key = fieldKey(field)

  if (!key) return ''

  const displayKeys = [
    `${key}_display`,
    `${key}_name`,
    `${key}_label`,
    `${key.replace(/_id$/, '')}_display`,
    `${key.replace(/_id$/, '')}_name`,
    `${key.replace(/_id$/, '')}_label`,
  ]

  for (const displayKey of displayKeys) {
    if (record[displayKey] !== undefined && record[displayKey] !== null && record[displayKey] !== '') {
      return record[displayKey]
    }
  }

  const value = record[key]

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object' && value !== null) {
    return value.name || value.title || value.label || value.code || JSON.stringify(value)
  }

  return value
}

const isBooleanField = (field: any) => {
  const type = String(field?.data_type || field?.type || field?.control || field?.control_type || '').toLowerCase()

  return ['boolean', 'bool', 'switch'].includes(type)
}

const isStatusField = (field: any) => {
  const key = fieldKey(field).toLowerCase()

  return key === 'status' || key.endsWith('_status') || key.endsWith('status_code')
}

watch(
  () => entityCode.value,
  async () => {
    await fetchMeta()
    await fetchRecords()
  }
)

onMounted(async () => {
  await fetchMeta()
  await fetchRecords()
})
</script>

<style scoped>
.page-container {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.page-header p {
  margin: 4px 0 0;
  color: #666;
}

.page-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 75%;
}

.details-descriptions {
  margin-bottom: 16px;
}

.details-value {
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
  }

  .page-actions {
    justify-content: flex-start;
    max-width: 100%;
  }
}
</style>
