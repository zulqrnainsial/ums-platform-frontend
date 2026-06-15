<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Dynamic Field Storage Validation</h2>
          <p>Validate ID/code storage consistency across admission, assessment, merit, and platform modules.</p>
        </div>

        <a-button @click="loadReport">
          Refresh
        </a-button>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-select
              v-model:value="filters.module_code"
              :options="moduleOptions"
              allow-clear
              placeholder="Module"
              @change="loadReport"
            />
          </a-col>

          <a-col :xs="24" :md="8">
            <a-input
              v-model:value="filters.entity_key"
              placeholder="Entity/table name"
              allow-clear
              @pressEnter="loadReport"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button block type="primary" @click="loadReport">
              Apply
            </a-button>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button block @click="resetFilters">
              Reset
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Total Rules" :value="summary.total_rules" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Clean" :value="summary.clean" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Fixable" :value="summary.fixable" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Manual Review" :value="summary.needs_manual_review" />
          </a-card>
        </a-col>
      </a-row>

      <a-card>
        <a-table
          :data-source="rows"
          :loading="loading"
          :pagination="{ pageSize: 20 }"
          row-key="row_key"
          size="small"
        >
          <a-table-column title="Module" data-index="module_code" width="120" />
          <a-table-column title="Entity" data-index="entity_key" width="220" />
          <a-table-column title="Field" data-index="field_name" width="220" />
          <a-table-column title="Mode" data-index="storage_mode" width="120" />

          <a-table-column title="Status" width="160">
            <template #default="{ record }">
              <a-tag :color="statusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column title="Bad" data-index="bad_count" width="90" />
          <a-table-column title="Fixable" data-index="fixable_count" width="90" />
          <a-table-column title="Message" data-index="message" />
        </a-table>
      </a-card>

      <a-alert
        class="mt-3"
        type="warning"
        show-icon
        message="This page reports issues only. To apply automatic fixes, run the backend artisan command with --apply after reviewing the report."
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const { apiFetch } = useApi()

const loading = ref(false)

const filters = reactive<any>({
  module_code: null,
  entity_key: '',
})

const summary = reactive<any>({
  total_rules: 0,
  clean: 0,
  fixable: 0,
  needs_manual_review: 0,
  missing: 0,
})

const rows = ref<any[]>([])

const moduleOptions = [
  { label: 'Admission', value: 'admission' },
  { label: 'Assessment', value: 'assessment' },
  { label: 'Platform', value: 'platform' },
]

const loadReport = async () => {
  loading.value = true

  try {
    const query = new URLSearchParams()

    if (filters.module_code) {
      query.append('module_code', filters.module_code)
    }

    if (filters.entity_key) {
      query.append('entity_key', filters.entity_key)
    }

    const suffix = query.toString() ? `?${query.toString()}` : ''

    const response: any = await apiFetch(`/platform/dynamic-field-storage-validation${suffix}`, {
      method: 'GET',
    })

    const payload = response?.data || {}

    Object.assign(summary, payload.summary || {})

    rows.value = (payload.rows || []).map((row: any, index: number) => ({
      ...row,
      row_key: `${row.module_code}-${row.entity_key}-${row.field_name}-${index}`,
    }))
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load validation report.')
  } finally {
    loading.value = false
  }
}

const resetFilters = async () => {
  filters.module_code = null
  filters.entity_key = ''
  await loadReport()
}

const statusColor = (status: string) => {
  if (status === 'clean') return 'green'
  if (status === 'fixable') return 'orange'
  if (status === 'fixed') return 'green'
  if (status === 'needs_manual_review') return 'red'
  if (status === 'table_missing' || status === 'field_missing') return 'purple'
  return 'default'
}

onMounted(async () => {
  await loadReport()
})
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin-bottom: 4px;
}

.page-header p {
  margin-bottom: 0;
  color: #888;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 16px;
}
</style>