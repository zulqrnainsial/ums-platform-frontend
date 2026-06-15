<template>
  <div class="app-table-wrapper">
    <a-table
      :columns="computedColumns"
      :data-source="data"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      bordered
      size="small"
      table-layout="fixed"
      class="compact-crud-table"
      @change="handleChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === '__actions'">
          <a-space wrap size="small">
            <a-button
              size="small"
              type="primary"
              ghost
              @click="emitView(record)"
            >
              View
            </a-button>

            <template
              v-for="action in rowActions"
              :key="action.name"
            >
              <a-popconfirm
                v-if="action.confirmation_required"
                :title="action.confirmation_title || 'Are you sure?'"
                :description="action.confirmation_message"
                ok-text="Yes"
                cancel-text="No"
                @confirm="emitAction(action, record)"
              >
                <a-button
                  size="small"
                  :danger="action.name === 'delete'"
                >
                  {{ action.label }}
                </a-button>
              </a-popconfirm>

              <a-button
                v-else
                size="small"
                :danger="action.name === 'delete'"
                @click="emitAction(action, record)"
              >
                {{ action.label }}
              </a-button>
            </template>
          </a-space>
        </template>

        <template v-else-if="isBooleanColumn(column)">
          <a-tag :color="record[column.dataIndex] ? 'green' : 'red'">
            {{ record[column.dataIndex] ? 'Yes' : 'No' }}
          </a-tag>
        </template>

        <template v-else-if="isStatusColumn(column)">
          <a-tag>
            {{ getDisplayValue(record, column) || '-' }}
          </a-tag>
        </template>

        <template v-else>
          <a-tooltip :title="String(getDisplayValue(record, column) ?? '-')">
            <span class="cell-ellipsis">
              {{ getDisplayValue(record, column) ?? '-' }}
            </span>
          </a-tooltip>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  columns: any[]
  actions: any[]
  data: any[]
  loading: boolean
  pagination: any
}>()

const emit = defineEmits<{
  change: [pagination: any, filters: any, sorter: any]
  action: [action: any, record: any]
}>()

const parseMeta = (meta: any) => {
  if (!meta) return {}

  if (typeof meta === 'object') return meta

  try {
    return JSON.parse(meta)
  } catch {
    return {}
  }
}

const normalizeKey = (column: any) => {
  return String(column?.dataIndex || column?.data_index || column?.field_name || column?.name || column?.key || '')
}

const getColumnTitle = (column: any) => {
  return column?.title || column?.label || normalizeKey(column)
}

const isVisibleByMetadata = (column: any) => {
  const meta = parseMeta(column?.meta)

  if (
    column?.show_in_table === true ||
    column?.is_table_visible === true ||
    column?.visible_in_table === true ||
    column?.table_visible === true ||
    meta?.show_in_table === true ||
    meta?.table_visible === true
  ) {
    return true
  }

  if (
    column?.show_in_table === false ||
    column?.is_table_visible === false ||
    column?.visible_in_table === false ||
    column?.table_visible === false ||
    meta?.show_in_table === false ||
    meta?.table_visible === false
  ) {
    return false
  }

  return null
}

const priorityScore = (column: any) => {
  const key = normalizeKey(column).toLowerCase()
  const title = String(getColumnTitle(column)).toLowerCase()
  const text = `${key} ${title}`

  if (['id', 'tenant_id', 'created_by', 'updated_by', 'deleted_at', 'created_at', 'updated_at'].includes(key)) return -100
  if (key.endsWith('_at')) return -20
  if (key.endsWith('_id')) return -10

  if (text.includes('applicant no') || key.includes('applicant_no')) return 100
  if (text.includes('application no') || key.includes('application_no')) return 100
  if (key === 'code' || key.endsWith('_code')) return 90
  if (key === 'name' || key.endsWith('_name')) return 85
  if (key === 'title' || key.includes('title')) return 85
  if (key === 'full_name') return 85
  if (text.includes('program')) return 75
  if (text.includes('department')) return 70
  if (text.includes('faculty')) return 65
  if (text.includes('phone') || text.includes('cnic') || text.includes('email')) return 60
  if (text.includes('status')) return 55
  if (text.includes('date')) return 45
  if (text.includes('order')) return 40

  return 10
}

const rowActions = computed(() => {
  return (props.actions || [])
    .filter((action: any) => action.placement === 'row')
    .filter((action: any) => action.name !== 'view' && action.name !== 'details')
})

const compactColumns = computed(() => {
  const rawColumns = props.columns || []
  const explicitColumns = rawColumns.filter((column: any) => isVisibleByMetadata(column) === true)

  if (explicitColumns.length > 0) {
    return explicitColumns.slice(0, 6)
  }

  return [...rawColumns]
    .filter((column: any) => isVisibleByMetadata(column) !== false)
    .filter((column: any) => priorityScore(column) > -50)
    .sort((a: any, b: any) => priorityScore(b) - priorityScore(a))
    .slice(0, 6)
})

const computedColumns = computed(() => {
  const baseColumns = compactColumns.value.map((column: any) => {
    const key = normalizeKey(column)
    const meta = parseMeta(column?.meta)

    return {
      ...column,
      title: getColumnTitle(column),
      dataIndex: key,
      key,
      sorter: column.sortable || false,
      ellipsis: true,
      width: meta?.width || column?.width || defaultWidthForColumn(column),
    }
  })

  baseColumns.push({
    title: 'Actions',
    key: '__actions',
    fixed: false,
    width: rowActions.value.length > 1 ? 210 : 150,
  })

  return baseColumns
})

const defaultWidthForColumn = (column: any) => {
  const key = normalizeKey(column).toLowerCase()

  if (key.includes('status')) return 120
  if (key.includes('date')) return 140
  if (key.includes('code') || key.includes('no')) return 150
  if (key.includes('phone') || key.includes('cnic')) return 150

  return 180
}

const getDisplayValue = (record: any, column: any) => {
  const key = normalizeKey(column)

  if (!key) {
    return ''
  }

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

const isBooleanColumn = (column: any) => {
  return ['boolean', 'bool', 'switch'].includes(String(column?.data_type || column?.type || '').toLowerCase())
}

const isStatusColumn = (column: any) => {
  const key = normalizeKey(column).toLowerCase()

  return key === 'status' || key.endsWith('_status') || key.endsWith('status_code')
}

const handleChange = (pagination: any, filters: any, sorter: any) => {
  emit('change', pagination, filters, sorter)
}

const emitAction = (action: any, record: any) => {
  emit('action', action, record)
}

const emitView = (record: any) => {
  emit('action', {
    name: 'view',
    label: 'View',
    placement: 'row',
  }, record)
}
</script>

<style scoped>
.app-table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.compact-crud-table {
  width: 100%;
}

.cell-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

:deep(.ant-table) {
  width: 100%;
}

:deep(.ant-table-cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-table-thead > tr > th) {
  white-space: nowrap;
}
</style>
