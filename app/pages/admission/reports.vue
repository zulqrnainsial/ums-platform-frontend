<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Admission Reports</h2>
          <p>View admission reports with basic filters and export-ready data.</p>
        </div>

        <a-space>
          <a-button @click="loadReport">Refresh</a-button>
        </a-space>
      </div>

      <a-card size="small" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-select
              v-model:value="selectedReport"
              :options="reportOptions"
              placeholder="Select Report"
              @change="loadReport"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.status_code"
              placeholder="Status"
              allow-clear
            >
              <a-select-option value="active">Active</a-select-option>
              <a-select-option value="submitted">Submitted</a-select-option>
              <a-select-option value="calculated">Calculated</a-select-option>
              <a-select-option value="published">Published</a-select-option>
              <a-select-option value="confirmed">Confirmed</a-select-option>
              <a-select-option value="paid">Paid</a-select-option>
              <a-select-option value="waiting">Waiting</a-select-option>
            </a-select>
          </a-col>

          <a-col :xs="24" :md="5">
            <a-date-picker
              v-model:value="filters.date_from"
              value-format="YYYY-MM-DD"
              placeholder="Date From"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-date-picker
              v-model:value="filters.date_to"
              value-format="YYYY-MM-DD"
              placeholder="Date To"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-button type="primary" block @click="loadReport">
              Apply
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card size="small">
        <a-table
          :columns="columns"
          :data-source="rows"
          :loading="loading"
          row-key="id"
          size="small"
          :pagination="pagination"
          :scroll="{ x: 1400 }"
          @change="handleTableChange"
        />
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'
const api = useApplicantPortalApi()
const route = useRoute()

const loading = ref(false)
const rows = ref<any[]>([])
const columns = ref<any[]>([])

const selectedReport = ref<string>((route.query.report as string) || 'applicants')

const filters = reactive<any>({
  status_code: undefined,
  date_from: undefined,
  date_to: undefined,
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 25,
  total: 0,
  showSizeChanger: true,
})

const reportOptions = [
  { label: 'Applicants', value: 'applicants' },
  { label: 'Applications', value: 'applications' },
  { label: 'Merit Scores', value: 'merit-scores' },
  { label: 'Merit Lists', value: 'merit-lists' },
  { label: 'Offers', value: 'offers' },
  { label: 'Vouchers', value: 'vouchers' },
  { label: 'Confirmed Admissions', value: 'confirmed-admissions' },
  { label: 'Seat Summary', value: 'seat-summary' },
  { label: 'Waiting List', value: 'waiting-list' },
]

const buildColumns = (items: any[]) => {
  const first = items[0] || {}

  columns.value = Object.keys(first).map((key) => ({
    title: key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    dataIndex: key,
    key,
    width: 160,
  }))
}

const loadReport = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdmissionReport(selectedReport.value, {
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    })

    const payload = response?.data?.data || response?.data || response

    rows.value = payload?.data || payload || []
    pagination.total = payload?.total || rows.value.length
    pagination.current = payload?.current_page || pagination.current

    buildColumns(rows.value)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load report.')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadReport()
}

onMounted(loadReport)
</script>

<style scoped>
.page {
  padding: 16px;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
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
  margin: 0;
  color: #6b7280;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>