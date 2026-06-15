<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Roles</h2>
          <p>Create roles and assign permissions.</p>
        </div>

        <a-space>
          <a-input-search
            v-model:value="filters.search"
            placeholder="Search roles"
            style="width: 260px"
            allow-clear
            @search="fetchRoles"
          />

          <a-button type="primary" @click="openCreateModal">
            Create Role
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions_count'">
            <a-tag>{{ record.permissions_count || record.permissions?.length || 0 }} permissions</a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openEditModal(record)">
                Edit
              </a-button>

              <a-button size="small" type="primary" @click="openPermissionModal(record)">
                Permissions
              </a-button>

              <a-popconfirm
                title="Are you sure you want to delete this role?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="deleteRole(record)"
              >
                <a-button
                  size="small"
                  danger
                  :disabled="isCoreRole(record.name)"
                >
                  Delete
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="roleModal.visible"
        :title="roleModal.isEdit ? 'Edit Role' : 'Create Role'"
        :confirm-loading="saving"
        @ok="saveRole"
        @cancel="closeRoleModal"
      >
        <a-form layout="vertical">
          <a-form-item label="Role Name" required>
            <a-input v-model:value="roleForm.name" placeholder="Registrar" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="permissionModal.visible"
        title="Assign Permissions"
        width="900px"
        :confirm-loading="savingPermissions"
        @ok="savePermissions"
        @cancel="closePermissionModal"
      >
        <a-alert
          v-if="permissionModal.roleName"
          :message="`Role: ${permissionModal.roleName}`"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-collapse>
          <a-collapse-panel
            v-for="group in permissionGroups"
            :key="group.module"
            :header="formatModuleName(group.module)"
          >
            <a-row :gutter="[8, 8]">
  <a-col
    v-for="permission in group.permissions"
    :key="permission.name"
    :span="8"
  >
    <a-checkbox
      :checked="isPermissionSelected(permission.name)"
      @change="togglePermission(permission.name, $event.target.checked)"
    >
      {{ permission.name }}
    </a-checkbox>
  </a-col>
</a-row>
          </a-collapse-panel>
        </a-collapse>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

interface Role {
  id: number
  name: string
  guard_name: string
  permissions?: string[]
  permissions_count?: number
}

interface PermissionGroup {
  module: string
  permissions: {
    id: number
    name: string
    guard_name: string
  }[]
}

const { apiFetch } = useApi()

const loading = ref(false)
const saving = ref(false)
const savingPermissions = ref(false)

const roles = ref<Role[]>([])
const permissionGroups = ref<PermissionGroup[]>([])
const selectedPermissions = ref<string[]>([])

const filters = reactive({
  search: '',
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
})

const roleModal = reactive({
  visible: false,
  isEdit: false,
  editId: null as number | null,
})

const permissionModal = reactive({
  visible: false,
  roleId: null as number | null,
  roleName: '',
})

const roleForm = reactive({
  name: '',
})

const columns = [
  {
    title: 'Role Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Guard',
    dataIndex: 'guard_name',
    key: 'guard_name',
  },
  {
    title: 'Permissions',
    key: 'permissions_count',
  },
  {
    title: 'Actions',
    key: 'actions',
  },
]

const fetchRoles = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch('/rbac/roles', {
      method: 'GET',
      query: {
        search: filters.search || undefined,
        page: pagination.current,
        per_page: pagination.pageSize,
      },
    })

    roles.value = response.data || []
    pagination.total = response.meta?.total || 0
    pagination.current = response.meta?.current_page || 1
    pagination.pageSize = response.meta?.per_page || 10
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to fetch roles.')
  } finally {
    loading.value = false
  }
}

const fetchPermissionGroups = async () => {
  const response: any = await apiFetch('/rbac/permissions/grouped', {
    method: 'GET',
  })

  permissionGroups.value = response.data || []
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  fetchRoles()
}

const openCreateModal = () => {
  roleForm.name = ''
  roleModal.isEdit = false
  roleModal.editId = null
  roleModal.visible = true
}

const openEditModal = (role: Role) => {
  roleForm.name = role.name
  roleModal.isEdit = true
  roleModal.editId = role.id
  roleModal.visible = true
}

const closeRoleModal = () => {
  roleModal.visible = false
  roleModal.isEdit = false
  roleModal.editId = null
  roleForm.name = ''
}

const saveRole = async () => {
  saving.value = true

  try {
    if (roleModal.isEdit && roleModal.editId) {
      await apiFetch(`/rbac/roles/${roleModal.editId}`, {
        method: 'PUT',
        body: roleForm,
      })

      message.success('Role updated successfully.')
    } else {
      await apiFetch('/rbac/roles', {
        method: 'POST',
        body: roleForm,
      })

      message.success('Role created successfully.')
    }

    closeRoleModal()
    fetchRoles()
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
      message.error(error?.data?.message || 'Failed to save role.')
    }
  } finally {
    saving.value = false
  }
}

const deleteRole = async (role: Role) => {
  try {
    await apiFetch(`/rbac/roles/${role.id}`, {
      method: 'DELETE',
    })

    message.success('Role deleted successfully.')
    fetchRoles()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to delete role.')
  }
}

const openPermissionModal = async (role: Role) => {
  permissionModal.roleId = role.id
  permissionModal.roleName = role.name
  permissionModal.visible = true

  selectedPermissions.value = [...(role.permissions || [])]

  if (permissionGroups.value.length === 0) {
    await fetchPermissionGroups()
  }
}

const closePermissionModal = () => {
  permissionModal.visible = false
  permissionModal.roleId = null
  permissionModal.roleName = ''
  selectedPermissions.value = []
}

const savePermissions = async () => {
  if (!permissionModal.roleId) {
    message.error('Role is missing.')
    return
  }

  savingPermissions.value = true

  try {
    await apiFetch(`/rbac/roles/${permissionModal.roleId}/assign-permissions`, {
      method: 'POST',
      body: {
        permissions: selectedPermissions.value,
      },
    })

    message.success('Permissions assigned successfully.')
    closePermissionModal()
    fetchRoles()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to assign permissions.')
  } finally {
    savingPermissions.value = false
  }
}

const isCoreRole = (name: string) => {
  return ['Super Admin', 'Tenant Admin'].includes(name)
}

const formatModuleName = (module: string) => {
  return module
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}
const isPermissionSelected = (permissionName: string) => {
  return selectedPermissions.value.includes(permissionName)
}

const togglePermission = (permissionName: string, checked: boolean) => {
  if (checked) {
    if (!selectedPermissions.value.includes(permissionName)) {
      selectedPermissions.value.push(permissionName)
    }

    return
  }

  selectedPermissions.value = selectedPermissions.value.filter(
    permission => permission !== permissionName
  )
}
onMounted(() => {
  fetchRoles()
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