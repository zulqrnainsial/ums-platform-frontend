<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Permissions</h2>
          <p>System-generated permissions grouped by module.</p>
        </div>

        <a-button @click="fetchPermissionGroups">
          Refresh
        </a-button>
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