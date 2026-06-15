<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Tenant Management</h2>
          <p>Create and manage universities, colleges, schools, and institutions.</p>
        </div>

        <a-space>
          <a-input-search
            v-model:value="filters.search"
            placeholder="Search tenants"
            style="width: 260px"
            @search="fetchTenants"
            allow-clear
          />

          <a-select
            v-model:value="filters.status"
            placeholder="Status"
            style="width: 160px"
            allow-clear
            @change="fetchTenants"
          >
            <a-select-option value="active">Active</a-select-option>
            <a-select-option value="inactive">Inactive</a-select-option>
            <a-select-option value="pending">Pending</a-select-option>
            <a-select-option value="suspended">Suspended</a-select-option>
            <a-select-option value="archived">Archived</a-select-option>
          </a-select>

          <a-button type="primary" @click="openCreateModal">
            Create Tenant
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="tenants"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'subscription_status'">
            <a-tag>
              {{ record.subscription_status }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" type="primary" @click="openModulesModal(record)">
                Modules
              </a-button>
              <a-button size="small" @click="openEditModal(record)">
                Edit
              </a-button>

              <a-button
                v-if="record.status !== 'active'"
                size="small"
                type="primary"
                @click="activateTenant(record)"
              >
                Activate
              </a-button>

              <a-button
                v-if="record.status === 'active'"
                size="small"
                @click="deactivateTenant(record)"
              >
                Deactivate
              </a-button>

              <a-popconfirm
                title="Are you sure you want to delete this tenant?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="deleteTenant(record)"
              >
                <a-button size="small" danger>
                  Delete
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="modal.visible"
        :title="modal.isEdit ? 'Edit Tenant' : 'Create Tenant'"
        width="800px"
        :confirm-loading="saving"
        @ok="saveTenant"
        @cancel="closeModal"
      >
        <a-form layout="vertical">
          <a-row :gutter="[16, 0]">
            <a-col :span="12">
              <a-form-item label="Tenant Name" required>
                <a-input v-model:value="form.name" placeholder="Demo University" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Tenant Code" required>
                <a-input v-model:value="form.code" placeholder="demo_university" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Email">
                <a-input v-model:value="form.email" placeholder="admin@demo.test" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
            <a-form-item label="Admin Name" required>
                <a-input v-model:value="form.admin_name" />
            </a-form-item>
            </a-col>

            <a-col :span="12">
            <a-form-item label="Admin Email" required>
                <a-input v-model:value="form.admin_email" />
            </a-form-item>
            </a-col>

            <a-col :span="12">
            <a-form-item label="Admin Password" required>
                <a-input-password v-model:value="form.admin_password" />
            </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Phone">
                <a-input v-model:value="form.phone" placeholder="03000000000" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Timezone" required>
                <a-input v-model:value="form.timezone" placeholder="Asia/Karachi" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Locale" required>
                <a-select v-model:value="form.locale">
                  <a-select-option value="en">English</a-select-option>
                  <a-select-option value="ur">Urdu</a-select-option>
                  <a-select-option value="ar">Arabic</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Status" required>
                <a-select v-model:value="form.status">
                  <a-select-option value="active">Active</a-select-option>
                  <a-select-option value="inactive">Inactive</a-select-option>
                  <a-select-option value="pending">Pending</a-select-option>
                  <a-select-option value="suspended">Suspended</a-select-option>
                  <a-select-option value="archived">Archived</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Subscription Status" required>
                <a-select v-model:value="form.subscription_status">
                  <a-select-option value="trial">Trial</a-select-option>
                  <a-select-option value="active">Active</a-select-option>
                  <a-select-option value="expired">Expired</a-select-option>
                  <a-select-option value="cancelled">Cancelled</a-select-option>
                  <a-select-option value="suspended">Suspended</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Subscription Start Date">
                <a-date-picker
                  v-model:value="form.subscription_start_date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Subscription End Date">
                <a-date-picker
                  v-model:value="form.subscription_end_date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Theme Color">
                <a-input v-model:value="form.theme_color" placeholder="#1677ff" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Logo Path">
                <a-input v-model:value="form.logo" placeholder="/uploads/logos/demo.png" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
      <a-modal
  v-model:open="modulesModal.visible"
  title="Assign Tenant Modules"
  width="850px"
  :confirm-loading="savingTenantModules"
  @ok="saveTenantModules"
  @cancel="closeModulesModal"
>
  <a-alert
    v-if="modulesModal.tenantName"
    :message="`Tenant: ${modulesModal.tenantName}`"
    type="info"
    show-icon
    style="margin-bottom: 16px"
  />

  <a-checkbox-group v-model:value="selectedTenantModuleIds" style="width: 100%">
    <a-row :gutter="[8, 8]">
      <a-col
        v-for="module in allModuleOptions"
        :key="module.value"
        :span="8"
      >
        <a-checkbox :value="module.value" :disabled="module.is_core">
          {{ module.label }}
          <a-tag v-if="module.is_core" color="blue">Core</a-tag>
        </a-checkbox>
      </a-col>
    </a-row>
  </a-checkbox-group>
</a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

interface Tenant {
  id: number
  name: string
  code: string
  email: string | null
  phone: string | null
  logo: string | null
  theme_color: string | null
  timezone: string
  locale: string
  status: string
  subscription_status: string
  subscription_start_date: string | null
  subscription_end_date: string | null
}
interface ModuleOption {
  label: string
  value: number
  code?: string
  is_core?: boolean
}

const allModuleOptions = ref<ModuleOption[]>([])
const selectedTenantModuleIds = ref<number[]>([])
const savingTenantModules = ref(false)

const modulesModal = reactive({
  visible: false,
  tenantId: null as number | null,
  tenantName: '',
})
const { apiFetch } = useApi()

const loading = ref(false)
const saving = ref(false)
const tenants = ref<Tenant[]>([])

const filters = reactive({
  search: '',
  status: undefined as string | undefined,
  subscription_status: undefined as string | undefined,
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
})

const modal = reactive({
  visible: false,
  isEdit: false,
  editId: null as number | null,
})

const form = reactive({
  name: '',
  code: '',
  email: '',
  phone: '',
  logo: '',
  admin_name: '',
  admin_email: '',
  admin_password: '',
  module_ids: [] as number[],
  theme_color: '#1677ff',
  timezone: 'Asia/Karachi',
  locale: 'en',
  status: 'active',
  subscription_status: 'trial',
  subscription_start_date: '',
  subscription_end_date: '',
})

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Phone',
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: 'Subscription',
    dataIndex: 'subscription_status',
    key: 'subscription_status',
  },
  {
    title: 'Actions',
    key: 'actions',
  },
]

const fetchTenants = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch('/admin/tenants', {
      method: 'GET',
      query: {
        search: filters.search || undefined,
        status: filters.status || undefined,
        subscription_status: filters.subscription_status || undefined,
        page: pagination.current,
        per_page: pagination.pageSize,
      },
    })

    tenants.value = response.data || []

    pagination.total = response.meta?.total || 0
    pagination.current = response.meta?.current_page || 1
    pagination.pageSize = response.meta?.per_page || 10
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to fetch tenants.')
  } finally {
    loading.value = false
  }
}
const fetchAllModuleOptions = async () => {
  const response: any = await apiFetch('/modules/options', {
    method: 'GET',
  })

  allModuleOptions.value = response.data || []
}

const openModulesModal = async (tenant: Tenant) => {
  modulesModal.visible = true
  modulesModal.tenantId = tenant.id
  modulesModal.tenantName = tenant.name
  selectedTenantModuleIds.value = []

  const response: any = await apiFetch(`/admin/tenants/${tenant.id}/modules/assignment-options`, {
    method: 'GET',
  })

  allModuleOptions.value = response.data || []

  selectedTenantModuleIds.value = allModuleOptions.value
    .filter((module: any) => module.is_assigned)
    .map((module: any) => module.value)
}

const closeModulesModal = () => {
  modulesModal.visible = false
  modulesModal.tenantId = null
  modulesModal.tenantName = ''
  selectedTenantModuleIds.value = []
}

const saveTenantModules = async () => {
  if (!modulesModal.tenantId) {
    message.error('Tenant is missing.')
    return
  }

  savingTenantModules.value = true

  try {
    await apiFetch(`/admin/tenants/${modulesModal.tenantId}/modules/assign`, {
      method: 'POST',
      body: {
        module_ids: selectedTenantModuleIds.value,
      },
    })

    message.success('Tenant modules updated successfully.')
    closeModulesModal()
  } catch (error: any) {
    const errors = error?.data?.errors

    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0]

      if (firstKey && Array.isArray(errors[firstKey])) {
        message.error(errors[firstKey][0])
      } else {
        message.error('Failed to update tenant modules.')
      }
    } else {
      message.error(error?.data?.message || 'Failed to update tenant modules.')
    }
  } finally {
    savingTenantModules.value = false
  }
}
const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  fetchTenants()
}

const resetForm = () => {
  form.name = ''
  form.code = ''
  form.email = ''
  form.phone = ''
  form.logo = ''
  form.theme_color = '#1677ff'
  form.timezone = 'Asia/Karachi'
  form.locale = 'en'
  form.status = 'active'
  form.subscription_status = 'trial'
  form.subscription_start_date = ''
  form.subscription_end_date = ''
}

const openCreateModal = () => {
  resetForm()
  modal.isEdit = false
  modal.editId = null
  modal.visible = true
}

const openEditModal = (tenant: Tenant) => {
  form.name = tenant.name
  form.code = tenant.code
  form.email = tenant.email || ''
  form.phone = tenant.phone || ''
  form.logo = tenant.logo || ''
  form.theme_color = tenant.theme_color || '#1677ff'
  form.timezone = tenant.timezone
  form.locale = tenant.locale
  form.status = tenant.status
  form.subscription_status = tenant.subscription_status
  form.subscription_start_date = tenant.subscription_start_date || ''
  form.subscription_end_date = tenant.subscription_end_date || ''

  modal.isEdit = true
  modal.editId = tenant.id
  modal.visible = true
}

const closeModal = () => {
  modal.visible = false
  modal.isEdit = false
  modal.editId = null
}

const saveTenant = async () => {
  saving.value = true

  try {
    if (modal.isEdit && modal.editId) {
      await apiFetch(`/admin/tenants/${modal.editId}`, {
        method: 'PUT',
        body: form,
      })

      message.success('Tenant updated successfully.')
    } else {
      await apiFetch('/admin/tenants', {
        method: 'POST',
        body: form,
      })

      message.success('Tenant created successfully.')
    }

    closeModal()
    fetchTenants()
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
      message.error(error?.data?.message || 'Failed to save tenant.')
    }
  } finally {
    saving.value = false
  }
}

const activateTenant = async (tenant: Tenant) => {
  try {
    await apiFetch(`/admin/tenants/${tenant.id}/activate`, {
      method: 'POST',
    })

    message.success('Tenant activated successfully.')
    fetchTenants()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to activate tenant.')
  }
}

const deactivateTenant = async (tenant: Tenant) => {
  try {
    await apiFetch(`/admin/tenants/${tenant.id}/deactivate`, {
      method: 'POST',
    })

    message.success('Tenant deactivated successfully.')
    fetchTenants()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to deactivate tenant.')
  }
}

const deleteTenant = async (tenant: Tenant) => {
  try {
    await apiFetch(`/admin/tenants/${tenant.id}`, {
      method: 'DELETE',
    })

    message.success('Tenant deleted successfully.')
    fetchTenants()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to delete tenant.')
  }
}

const getStatusColor = (status: string) => {
  if (status === 'active') return 'green'
  if (status === 'inactive') return 'default'
  if (status === 'pending') return 'orange'
  if (status === 'suspended') return 'red'
  if (status === 'archived') return 'purple'

  return 'default'
}

onMounted(() => {
  fetchTenants()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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