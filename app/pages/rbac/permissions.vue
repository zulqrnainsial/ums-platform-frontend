<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Permissions</h2>
          <p>System-generated permissions grouped by module.</p>
        </div>

        <a-space>
  <a-button @click="fetchPermissionGroups">
    Refresh
  </a-button>

  <a-button type="primary" @click="generator.visible = true">
    Generate Permissions
  </a-button>
</a-space>
      </div>

      <a-collapse>
        <a-collapse-panel
          v-for="group in permissionGroups"
          :key="group.module"
          :header="`${formatModuleName(group.module)} (${group.permissions.length})`"
        >
          <a-row :gutter="[8, 8]">
            <a-col
              v-for="permission in group.permissions"
              :key="permission.id"
              :span="6"
            >
              <a-tag style="margin-bottom: 8px">
                {{ permission.name }}
              </a-tag>
            </a-col>
          </a-row>
        </a-collapse-panel>
      </a-collapse>
      <a-modal
  v-model:open="generator.visible"
  title="Generate Permissions"
  :confirm-loading="generator.saving"
  @ok="generatePermissions"
>
  <a-form layout="vertical">
    <a-form-item label="Module" required>
      <a-input v-model:value="generator.module" placeholder="student" />
    </a-form-item>

    <a-form-item label="Resource" required>
      <a-input v-model:value="generator.resource" placeholder="course_registration" />
    </a-form-item>

    <a-form-item label="Actions" required>
      <a-select
        v-model:value="generator.actions"
        mode="tags"
        placeholder="view, create, update, delete, bulk"
      >
        <a-select-option value="view">view</a-select-option>
        <a-select-option value="create">create</a-select-option>
        <a-select-option value="update">update</a-select-option>
        <a-select-option value="delete">delete</a-select-option>
        <a-select-option value="bulk">bulk</a-select-option>
        <a-select-option value="approve">approve</a-select-option>
        <a-select-option value="settings">settings</a-select-option>
      </a-select>
    </a-form-item>
  </a-form>
</a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

interface PermissionGroup {
  module: string
  permissions: {
    id: number
    name: string
    guard_name: string
  }[]
}

const { apiFetch } = useApi()

const permissionGroups = ref<PermissionGroup[]>([])
const generator = reactive({
  visible: false,
  saving: false,
  module: '',
  resource: '',
  actions: ['view'],
})
const fetchPermissionGroups = async () => {
  try {
    const response: any = await apiFetch('/rbac/permissions/grouped', {
      method: 'GET',
    })

    permissionGroups.value = response.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to fetch permissions.')
  }
}
const generatePermissions = async () => {
  if (!generator.module || !generator.resource || generator.actions.length === 0) {
    message.error('Module, resource and at least one action are required.')
    return
  }

  generator.saving = true

  try {
    await apiFetch('/rbac/permissions/generate', {
      method: 'POST',
      body: {
        module: generator.module,
        resource: generator.resource,
        actions: generator.actions,
      },
    })

    message.success('Permissions generated successfully.')

    generator.visible = false
    generator.module = ''
    generator.resource = ''
    generator.actions = ['view']

    await fetchPermissionGroups()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to generate permissions.')
  } finally {
    generator.saving = false
  }
}
const formatModuleName = (module: string) => {
  return module
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

onMounted(() => {
  fetchPermissionGroups()
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