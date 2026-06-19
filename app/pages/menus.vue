<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Dynamic Menu Management</h2>
          <p>Create menus and bind them with modules and permissions.</p>
        </div>

        <a-space>
          <a-input-search
            v-model:value="filters.search"
            placeholder="Search menus"
            style="width: 260px"
            allow-clear
            @search="fetchMenus"
          />

          <a-button type="primary" @click="openCreateModal">
            Create Menu
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="menus"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'is_system'">
            <a-tag :color="record.is_system ? 'blue' : 'default'">
              {{ record.is_system ? 'System' : 'Custom' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'is_active'">
            <a-tag :color="record.is_active ? 'green' : 'red'">
              {{ record.is_active ? 'Active' : 'Inactive' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openEditModal(record)">
                Edit
              </a-button>

              <a-button
                v-if="!record.is_active"
                size="small"
                type="primary"
                @click="activateMenu(record)"
              >
                Activate
              </a-button>

              <a-button
                v-if="record.is_active"
                size="small"
                :disabled="record.is_system"
                @click="deactivateMenu(record)"
              >
                Deactivate
              </a-button>

              <a-popconfirm
                title="Are you sure you want to delete this menu?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="deleteMenu(record)"
              >
                <a-button size="small" danger :disabled="record.is_system">
                  Delete
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="modal.visible"
        :title="modal.isEdit ? 'Edit Menu' : 'Create Menu'"
        width="850px"
        :confirm-loading="saving"
        @ok="saveMenu"
        @cancel="closeModal"
      >
        <a-form layout="vertical">
          <a-row :gutter="[16, 0]">
            <a-col :span="12">
              <a-form-item label="Title" required>
                <a-input v-model:value="form.title" placeholder="Reports" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Code" required>
                <a-input v-model:value="form.code" placeholder="reports" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Parent Menu">
                <a-select
  v-model:value="form.parent_id"
  allow-clear
  show-search
  placeholder="Select parent"
  option-filter-prop="label"
  :options="parentMenuSelectOptions"
/>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Module">
                <a-select
  v-model:value="form.module_id"
  allow-clear
  show-search
  placeholder="Select module"
  option-filter-prop="label"
  :options="moduleSelectOptions"
/>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Route">
                <a-input v-model:value="form.route" placeholder="/crud/reports" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Icon">
                <a-input v-model:value="form.icon" placeholder="BarChartOutlined" />
              </a-form-item>
            </a-col>

            <a-col :span="24">
              <a-form-item label="Permission">
                <a-select
  v-model:value="form.permission_name"
  allow-clear
  show-search
  placeholder="Select permission"
  option-filter-prop="label"
  :options="permissionSelectOptions"
/>
              </a-form-item>
            </a-col>

            <a-col :span="8">
              <a-form-item label="Display Order">
                <a-input-number
                  v-model:value="form.display_order"
                  :min="0"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>

            <a-col :span="8">
              <a-form-item label="System Menu">
                <a-switch
                  v-model:checked="form.is_system"
                  :disabled="selectedMenuIsSystem"
                />
              </a-form-item>
            </a-col>

            <a-col :span="8">
              <a-form-item label="Active">
                <a-switch v-model:checked="form.is_active" />
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

const { apiFetch } = useApi()

const loading = ref(false)
const saving = ref(false)
const menus = ref<any[]>([])
const menuOptions = ref<any[]>([])
const moduleOptions = ref<any[]>([])
const permissions = ref<any[]>([])
const selectedMenuIsSystem = ref(false)

const filters = reactive({
  search: '',
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
  tenant_id: null as number | null,
  parent_id: null as number | null,
  module_id: null as number | null,
  title: '',
  code: '',
  route: '',
  icon: '',
  permission_name: null as string | null,
  is_system: false,
  is_active: true,
  display_order: 0,
})

const columns = [
  { title: 'Order', dataIndex: 'display_order', key: 'display_order', width: 80 },
  { title: 'Title', dataIndex: 'title', key: 'title' },
  { title: 'Code', dataIndex: 'code', key: 'code' },
  { title: 'Route', dataIndex: 'route', key: 'route' },
  { title: 'Permission', dataIndex: 'permission_name', key: 'permission_name' },
  { title: 'System', key: 'is_system' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', width: 280 },
]
const parentMenuSelectOptions = computed(() => {
  return menuOptions.value.map((menu: any) => ({
    label: String(menu.label || menu.title || menu.name || ''),
    value: menu.value ?? menu.id,
    disabled: (menu.value ?? menu.id) === modal.editId,
  }))
})

const moduleSelectOptions = computed(() => {
  return moduleOptions.value.map((module: any) => ({
    label: String(module.label || module.name || module.code || ''),
    value: module.value ?? module.id,
  }))
})

const permissionSelectOptions = computed(() => {
  return permissions.value.map((permission: any) => ({
    label: String(permission.name || permission.label || ''),
    value: permission.name || permission.value,
  }))
})
const fetchMenus = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch('/menus', {
      method: 'GET',
      query: {
        search: filters.search || undefined,
        page: pagination.current,
        per_page: pagination.pageSize,
      },
    })

    menus.value = response.data || []
    pagination.total = response.meta?.total || 0
    pagination.current = response.meta?.current_page || 1
    pagination.pageSize = response.meta?.per_page || 10
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to fetch menus.')
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  const [menuRes, moduleRes, permissionRes]: any[] = await Promise.all([
    apiFetch('/menus/options', { method: 'GET' }),
    apiFetch('/modules/options', { method: 'GET' }),
    apiFetch('/rbac/permissions', { method: 'GET' }),
  ])

  menuOptions.value = menuRes.data || []
  moduleOptions.value = moduleRes.data || []
  permissions.value = permissionRes.data || []
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  fetchMenus()
}
const filterSelectOption = (input: string, option: any) => {
  return String(option?.children || option?.label || '')
    .toLowerCase()
    .includes(input.toLowerCase())
}

const loadNextDisplayOrder = async () => {
  if (modal.isEdit) {
    return
  }

  try {
    const response: any = await apiFetch('/menus/next-display-order', {
      method: 'GET',
      query: {
        parent_id: form.parent_id || undefined,
      },
    })

    form.display_order = response?.data?.display_order || 1
  } catch {
    form.display_order = 1
  }
}
const resetForm = () => {
  form.tenant_id = null
  form.parent_id = null
  form.module_id = null
  form.title = ''
  form.code = ''
  form.route = ''
  form.icon = ''
  form.permission_name = null
  form.is_system = false
  form.is_active = true
  form.display_order = 0
  selectedMenuIsSystem.value = false
}

const openCreateModal = async () => {
  resetForm()
  modal.isEdit = false
  modal.editId = null
  modal.visible = true

  await fetchOptions()
  await loadNextDisplayOrder()
}

const openEditModal = async (menu: any) => {
  if (menuOptions.value.length === 0) {
    await fetchOptions()
  }

  form.tenant_id = menu.tenant_id
  form.parent_id = menu.parent_id
  form.module_id = menu.module_id
  form.title = menu.title
  form.code = menu.code
  form.route = menu.route || ''
  form.icon = menu.icon || ''
  form.permission_name = menu.permission_name
  form.is_system = menu.is_system
  form.is_active = menu.is_active
  form.display_order = menu.display_order

  selectedMenuIsSystem.value = menu.is_system

  modal.isEdit = true
  modal.editId = menu.id
  modal.visible = true
}

const closeModal = () => {
  modal.visible = false
  modal.isEdit = false
  modal.editId = null
  resetForm()
}

const saveMenu = async () => {
  saving.value = true

  try {
    const payload = {
      ...form,
      parent_id: form.parent_id || null,
      module_id: form.module_id || null,
      route: form.route || null,
      icon: form.icon || null,
      permission_name: form.permission_name || null,
    }

    if (modal.isEdit && modal.editId) {
      await apiFetch(`/menus/${modal.editId}`, {
        method: 'PUT',
        body: payload,
      })

      message.success('Menu updated successfully.')
    } else {
      await apiFetch('/menus', {
        method: 'POST',
        body: payload,
      })

      message.success('Menu created successfully.')
    }

    closeModal()
    await fetchMenus()
    await fetchOptions()
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
      message.error(error?.data?.message || 'Failed to save menu.')
    }
  } finally {
    saving.value = false
  }
}

const activateMenu = async (menu: any) => {
  try {
    await apiFetch(`/menus/${menu.id}/activate`, {
      method: 'POST',
    })

    message.success('Menu activated successfully.')
    fetchMenus()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to activate menu.')
  }
}

const deactivateMenu = async (menu: any) => {
  try {
    await apiFetch(`/menus/${menu.id}/deactivate`, {
      method: 'POST',
    })

    message.success('Menu deactivated successfully.')
    fetchMenus()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to deactivate menu.')
  }
}

const deleteMenu = async (menu: any) => {
  try {
    await apiFetch(`/menus/${menu.id}`, {
      method: 'DELETE',
    })

    message.success('Menu deleted successfully.')
    fetchMenus()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to delete menu.')
  }
}

onMounted(async () => {
  await fetchMenus()
  await fetchOptions()
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