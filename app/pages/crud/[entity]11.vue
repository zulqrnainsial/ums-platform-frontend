<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>{{ meta?.title || entityCode }}</h2>
          <p>{{ meta?.subtitle }}</p>
        </div>

        <a-space>
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
        </a-space>
      </div>

      <AppTable
        v-if="meta"
        :columns="meta.columns"
        :actions="meta.actions"
        :data="records"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        @action="handleRowAction"
      />

      <a-modal
        v-model:open="modal.visible"
        :title="modal.isEdit ? `Edit ${meta?.entity_name}` : `Create ${meta?.entity_name}`"
        width="900px"
        :confirm-loading="saving"
        @ok="saveRecord"
        @cancel="closeModal"
      >
        <AppForm
          v-if="meta"
          :fields="meta.fields"
          :model="form"
        />
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

const entityCode = computed(() => String(route.params.entity))

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

const modal = reactive({
  visible: false,
  isEdit: false,
  editId: null as number | string | null,
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

  meta.value.fields.forEach((field: any) => {
    if (field.control === 'switch') {
      form[field.name] = field.default_value === '1' || field.default_value === true
    } else if (field.control === 'multi-select' || field.control === 'checkbox') {
      form[field.name] = []
    } else {
      form[field.name] = field.default_value ?? ''
    }
  })
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

    records.value = response.data || []
    pagination.total = response.meta?.total || 0
    pagination.current = response.meta?.current_page || 1
    pagination.pageSize = response.meta?.per_page || 10
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
  modal.visible = true
  modal.isEdit = false
  modal.editId = null
}

const openEditModal = (record: any) => {
  initializeForm()

  Object.keys(form).forEach((key) => {
    form[key] = record[key]
  })

  modal.visible = true
  modal.isEdit = true
  modal.editId = record.id
}

const closeModal = () => {
  modal.visible = false
  modal.isEdit = false
  modal.editId = null
  initializeForm()
}

const saveRecord = async () => {
  saving.value = true

  try {
    if (modal.isEdit && modal.editId) {
      await apiFetch(`/dynamic/crud/${entityCode.value}/${modal.editId}`, {
        method: 'PUT',
        body: form,
      })

      message.success('Record updated successfully.')
    } else {
      await apiFetch(`/dynamic/crud/${entityCode.value}`, {
        method: 'POST',
        body: form,
      })

      message.success('Record created successfully.')
    }

    closeModal()
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
    console.log(entityCode.value)
  if (entityCode.value === 'modules' && authStore.user?.user_type !== 'super_admin') {
    message.warning('Only Super Admin can manage modules.')
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
</style>