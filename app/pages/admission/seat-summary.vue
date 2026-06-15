<template>
    <app-layout>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Admission Seat Summary</h2>
        <p>View offered program and quota wise seat utilization and remaining seats.</p>
      </div>

      <a-space>
        <a-button @click="loadData">Refresh</a-button>
      </a-space>
    </div>

    <a-card size="small" class="mb-3">
      <a-row :gutter="[12, 12]">
        <a-col :xs="24" :md="6">
          <a-select
            v-model:value="filters.admission_session_id"
            :options="lookups.admissionSessions"
            placeholder="Admission Session"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-col>

        <a-col :xs="24" :md="6">
          <a-select
            v-model:value="filters.offered_program_id"
            :options="lookups.offeredPrograms"
            placeholder="Offered Program"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-col>

        <a-col :xs="24" :md="6">
          <a-select
            v-model:value="filters.program_quota_seat_id"
            :options="lookups.programQuotaSeats"
            placeholder="Quota / Seat Category"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-col>

        <a-col :xs="24" :md="6">
          <a-button type="primary" block @click="loadData">
            Apply
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-row :gutter="[12, 12]" class="mb-3">
      <a-col :xs="24" :md="6">
        <a-card size="small">
          <a-statistic title="Total Seats" :value="totals.total_seats" />
        </a-card>
      </a-col>

      <a-col :xs="24" :md="6">
        <a-card size="small">
          <a-statistic title="Confirmed" :value="totals.confirmed_candidates" />
        </a-card>
      </a-col>

      <a-col :xs="24" :md="6">
        <a-card size="small">
          <a-statistic title="Remaining Seats" :value="totals.remaining_after_confirmation" />
        </a-card>
      </a-col>

      <a-col :xs="24" :md="6">
        <a-card size="small">
          <a-statistic title="Waiting Candidates" :value="totals.waiting_candidates" />
        </a-card>
      </a-col>
    </a-row>

    <a-table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      row-key="admission_merit_list_id"
      size="small"
      :pagination="{ pageSize: 20 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'program'">
          <strong>{{ record.offered_program_code || '-' }}</strong>
          <div>{{ record.offered_program_title || '-' }}</div>
        </template>

        <template v-else-if="column.key === 'quota'">
          <a-tag>{{ record.quota_name || record.quota_code || '-' }}</a-tag>
        </template>

        <template v-else-if="column.key === 'remaining_after_confirmation'">
          <a-tag :color="record.remaining_after_confirmation > 0 ? 'blue' : 'red'">
            {{ record.remaining_after_confirmation }}
          </a-tag>
        </template>

        <template v-else>
          {{ record[column.dataIndex] ?? 0 }}
        </template>
      </template>
    </a-table>
  </div>
  </app-layout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()
const loading = ref(false)
const rows = ref<any[]>([])

const filters = reactive<any>({
  admission_session_id: undefined,
  offered_program_id: undefined,
  program_quota_seat_id: undefined,
})

const lookups = reactive<any>({
  admissionSessions: [],
  offeredPrograms: [],
  programQuotaSeats: [],
})

const columns = [
  { title: 'Program', key: 'program', width: 280 },
  { title: 'Quota', key: 'quota', width: 180 },
  { title: 'Total Seats', dataIndex: 'total_seats', key: 'total_seats', width: 110 },
  { title: 'Selected', dataIndex: 'selected_candidates', key: 'selected_candidates', width: 100 },
  { title: 'Offered', dataIndex: 'offered_candidates', key: 'offered_candidates', width: 100 },
  { title: 'Accepted', dataIndex: 'accepted_candidates', key: 'accepted_candidates', width: 100 },
  { title: 'Payment Submitted', dataIndex: 'payment_submitted_candidates', key: 'payment_submitted_candidates', width: 150 },
  { title: 'Paid', dataIndex: 'paid_candidates', key: 'paid_candidates', width: 100 },
  { title: 'Confirmed', dataIndex: 'confirmed_candidates', key: 'confirmed_candidates', width: 110 },
  { title: 'Waiting', dataIndex: 'waiting_candidates', key: 'waiting_candidates', width: 100 },
  { title: 'Remaining', key: 'remaining_after_confirmation', width: 110 },
]

const totals = computed(() => {
  return rows.value.reduce((acc: any, row: any) => {
    acc.total_seats += Number(row.total_seats || 0)
    acc.confirmed_candidates += Number(row.confirmed_candidates || 0)
    acc.remaining_after_confirmation += Number(row.remaining_after_confirmation || 0)
    acc.waiting_candidates += Number(row.waiting_candidates || 0)
    return acc
  }, {
    total_seats: 0,
    confirmed_candidates: 0,
    remaining_after_confirmation: 0,
    waiting_candidates: 0,
  })
})

const optionData = (response: any) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  return []
}

const loadLookups = async () => {
  try {
    const [sessions, programs, quotas]: any = await Promise.all([
      api.getOptions('/dynamic-options/admission-sessions'),
      api.getOptions('/dynamic-options/offered-programs'),
      api.getOptions('/dynamic-options/program-quota-seats'),
    ])

    lookups.admissionSessions = optionData(sessions)
    lookups.offeredPrograms = optionData(programs)
    lookups.programQuotaSeats = optionData(quotas)
  } catch {
    // keep page usable even if one lookup is missing
  }
}

const loadData = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdmissionSeatSummary(filters)
    rows.value = response?.data?.data || response?.data || response || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load seat summary.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadLookups()
  await loadData()
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
  margin: 0;
  color: #6b7280;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>