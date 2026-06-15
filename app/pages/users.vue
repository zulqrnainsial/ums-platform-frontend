<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Users</h2>
          <p>Manage tenant users, roles, and account status.</p>
        </div>

        <a-space>
          <a-input-search
            v-model:value="filters.search"
            placeholder="Search users"
            style="width: 240px"
            allow-clear
            @search="fetchUsers"
          />

          <a-select
            v-if="authStore.user?.user_type === 'super_admin'"
            v-model:value="filters.tenant_id"
            placeholder="Tenant"
            style="width: 240px"
            allow-clear
            @change="fetchUsers"
          >
            <a-select-option
              v-for="tenant in tenantOptions"
              :key="tenant.value"
              :value="tenant.value"
            >
              {{ tenant.label }}
            </a-select-option>
          </a-select>

          <a-select
            v-model:value="filters.status"
            placeholder="Status"
            style="width: 150px"
            allow-clear
            @change="fetchUsers"
          >
            <a-select-option value="active">Active</a-select-option>
            <a-select-option value="inactive">Inactive</a-select-option>
            <a-select-option value="suspended">Suspended</a-select-option>
          </a-select>

          <a-button type="primary" @click="openCreateModal">
            Create User
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tenant'">
            {{ record.tenant?.name || '-' }}
          </template>

          <template v-else-if="column.key === 'roles'">
            <a-space wrap>
              <a-tag v-for="role in record.roles || []" :key="role">
                {{ role }}
              </a-tag>
            </a-space>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openEditModal(record)">
                Edit
              </a-button>

              <a-button
                v-if="record.status !== 'active'"
                size="small"
                type="primary"
                @click="activateUser(record)"
              >
                Activate
              </a-button>

              <a-button
                v-if="record.status === 'active'"
                size="small"
                danger
                @click="deactivateUser(record)"
              >
                Deactivate
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="modal.visible"
        :title="modal.isEdit ? 'Edit User' : 'Create User'"
        width="850px"
        :confirm-loading="saving"
        @ok="saveUser"
        @cancel="closeModal"
      >
        <a-form layout="vertical">
          <a-row :gutter="[16, 0]">
            <a-col
              v-if="authStore.user?.user_type === 'super_admin'"
              :span="12"
            >
              <a-form-item label="Tenant" required>
                <a-select
                  v-model:value="form.tenant_id"
                  placeholder="Select tenant"
                  allow-clear
                >
                  <a-select-option
                    v-for="tenant in tenantOptions"
                    :key="tenant.value"
                    :value="tenant.value"
                  >
                    {{ tenant.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Name" required>
                <a-input v-model:value="form.name" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Email" required>
                <a-input v-model:value="form.email" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item
                :label="modal.isEdit ? 'Password (optional)' : 'Password'"
                :required="!modal.isEdit"
              >
                <a-input-password v-model:value="form.password" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Phone">
                <a-input v-model:value="form.phone" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="User Type" required>
                <a-select v-model:value="form.user_type">
                  <a-select-option value="admin">Admin</a-select-option>
                  <a-select-option value="registrar">Registrar</a-select-option>
                  <a-select-option value="accountant">Accountant</a-select-option>
                  <a-select-option value="teacher">Teacher</a-select-option>
                  <a-select-option value="student">Student</a-select-option>
                  <a-select-option value="parent">Parent</a-select-option>
                  <a-select-option value="employee">Employee</a-select-option>
                  <a-select-option value="custom">Custom</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Status" required>
                <a-select v-model:value="form.status">
                  <a-select-option value="active">Active</a-select-option>
                  <a-select-option value="inactive">Inactive</a-select-option>
                  <a-select-option value="suspended">Suspended</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="24">
              <a-form-item label="Roles">
                <a-select
                  v-model:value="form.roles"
                  mode="multiple"
                  placeholder="Select roles"
                  allow-clear
                >
                  <a-select-option
                    v-for="role in roleOptions"
                    :key="role.value"
                    :value="role.value"
                  >
                    {{ role.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'
import { useAuthStore } from '~/stores/authStore'

const { apiFetch } = useApi()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)

const users = ref<any[]>([])
const tenantOptions = ref<any[]>([])
const roleOptions = ref<any[]>([])

const filters = reactive({
  search: '',
  status: undefined as string | undefined,
  tenant_id: undefined as number | undefined,
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

const form = reactive<any>({
  tenant_id: null,
  name: '',
  email: '',
  password: '',
  phone: '',
  user_type: 'employee',
  status: 'active',
  roles: [],
})

const columns = computed(() => {
  const base: any[] = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'User Type', dataIndex: 'user_type', key: 'user_type' },
    { title: 'Roles', key: 'roles' },
    { title: 'Status', key: 'status' },
    { title: 'Actions', key: 'actions', width: 240 },
  ]

  if (authStore.user?.user_type === 'super_admin') {
    base.splice(2, 0, { title: 'Tenant', key: 'tenant' })
  }

  return base
})

const fetchUsers = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch('/users', {
      method: 'GET',
      query: {
        search: filters.search || undefined,
        status: filters.status || undefined,
        tenant_id: filters.tenant_id || undefined,
        page: pagination.current,
        per_page: pagination.pageSize,
      },
    })

    users.value = response.data || []
    pagination.total = response.meta?.total || 0
    pagination.current = response.meta?.current_page || 1
    pagination.pageSize = response.meta?.per_page || 10
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to fetch users.')
  } finally {
    loading.value = false
  }
}

const fetchTenantOptions = async () => {
  if (authStore.user?.user_type !== 'super_admin') {
    return
  }

  const response: any = await apiFetch('/admin/tenants/options', {
    method: 'GET',
  })

  tenantOptions.value = response.data || []
}

const fetchRoleOptions = async () => {
  const response: any = await apiFetch('/rbac/roles/options', {
    method: 'GET',
  })

  roleOptions.value = response.data || []
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  fetchUsers()
}

const resetForm = () => {
  form.tenant_id = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.phone = ''
  form.user_type = 'employee'
  form.status = 'active'
  form.roles = []
}

const openCreateModal = async () => {
  resetForm()
  modal.visible = true
  modal.isEdit = false
  modal.editId = null

  await fetchRoleOptions()
  await fetchTenantOptions()
}

const openEditModal = async (user: any) => {
  resetForm()

  form.tenant_id = user.tenant_id
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.phone = user.phone || ''
  form.user_type = user.user_type
  form.status = user.status
  form.roles = [...(user.roles || [])]

  modal.visible = true
  modal.isEdit = true
  modal.editId = user.id

  await fetchRoleOptions()
  await fetchTenantOptions()
}

const closeModal = () => {
  modal.visible = false
  modal.isEdit = false
  modal.editId = null
  resetForm()
}

const saveUser = async () => {
  saving.value = true

  try {
    const payload: any = { ...form }

    if (!payload.password) {
      delete payload.password
    }

    if (authStore.user?.user_type !== 'super_admin') {
      delete payload.tenant_id
    }

    if (modal.isEdit && modal.editId) {
      await apiFetch(`/users/${modal.editId}`, {
        method: 'PUT',
        body: payload,
      })

      message.success('User updated successfully.')
    } else {
      await apiFetch('/users', {
        method: 'POST',
        body: payload,
      })

      message.success('User created successfully.')
    }

    closeModal()
    fetchUsers()
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
      message.error(error?.data?.message || 'Failed to save user.')
    }
  } finally {
    saving.value = false
  }
}

const activateUser = async (user: any) => {
  try {
    await apiFetch(`/users/${user.id}/activate`, {
      method: 'POST',
    })

    message.success('User activated successfully.')
    fetchUsers()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to activate user.')
  }
}

const deactivateUser = async (user: any) => {
  try {
    await apiFetch(`/users/${user.id}/deactivate`, {
      method: 'POST',
    })

    message.success('User deactivated successfully.')
    fetchUsers()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to deactivate user.')
  }
}

onMounted(async () => {
  await authStore.initializeAuth()
  await fetchUsers()
  await fetchTenantOptions()
  await fetchRoleOptions()
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