<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Admission Manager Dashboard</h2>
          <p>Admission pipeline, seat utilization, offers, payments, confirmations and transfer analysis.</p>
        </div>

        <a-space>
          <a-button @click="loadDashboard">Refresh</a-button>
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
            <a-button type="primary" block @click="loadDashboard">
              Apply
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col
          v-for="card in cards"
          :key="card.key"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card size="small">
            <a-statistic :title="card.title" :value="card.value" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :lg="12">
          <a-card title="Admissions by Program" size="small">
            <Bar v-if="programChartData" :data="programChartData" :options="chartOptions" />
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Admissions by Quota" size="small">
            <Bar v-if="quotaChartData" :data="quotaChartData" :options="chartOptions" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :lg="12">
          <a-card title="Offer Status" size="small">
            <Pie v-if="offerChartData" :data="offerChartData" :options="pieOptions" />
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Voucher / Payment Status" size="small">
            <Pie v-if="voucherChartData" :data="voucherChartData" :options="pieOptions" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :lg="12">
          <a-card title="Daily Applications" size="small">
            <Line v-if="dailyApplicationsChartData" :data="dailyApplicationsChartData" :options="chartOptions" />
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Daily Confirmations" size="small">
            <Line v-if="dailyConfirmationsChartData" :data="dailyConfirmationsChartData" :options="chartOptions" />
          </a-card>
        </a-col>
      </a-row>

      <a-card title="Seat Utilization" size="small" class="mb-3">
        <a-table
          :columns="seatColumns"
          :data-source="dashboard.seat_summary"
          row-key="offered_program_id"
          size="small"
          :pagination="{ pageSize: 10 }"
          :scroll="{ x: 1200 }"
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
      </a-card>

      <a-card title="Admission Reports" size="small">
        <a-row :gutter="[12, 12]">
          <a-col
            v-for="report in reports"
            :key="report.code"
            :xs="24"
            :md="8"
            :lg="6"
          >
            <a-card size="small" class="report-card">
              <strong>{{ report.title }}</strong>
              <p>{{ report.description }}</p>
              <a-button size="small" type="primary" @click="openReport(report.code)">
                View Report
              </a-button>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar, Pie, Line } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
)

const api = useApplicantPortalApi()

const loading = ref(false)

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

const dashboard = reactive<any>({
  cards: {},
  program_summary: [],
  quota_summary: [],
  offer_status_summary: [],
  voucher_status_summary: [],
  daily_applications: [],
  daily_confirmations: [],
  seat_summary: [],
})

const reports = [
  { code: 'applicants', title: 'Applicants', description: 'Applicant profile and status report.' },
  { code: 'applications', title: 'Applications', description: 'Submitted program applications.' },
  { code: 'merit-scores', title: 'Merit Scores', description: 'Calculated merit scores.' },
  { code: 'merit-lists', title: 'Merit Lists', description: 'Generated merit lists.' },
  { code: 'offers', title: 'Offers', description: 'Offer, acceptance and waiting status.' },
  { code: 'vouchers', title: 'Vouchers', description: 'Admission fee voucher and payment report.' },
  { code: 'confirmed-admissions', title: 'Confirmed Admissions', description: 'Confirmed and transferred admissions.' },
  { code: 'seat-summary', title: 'Seat Summary', description: 'Program and quota wise seat utilization.' },
  { code: 'waiting-list', title: 'Waiting List', description: 'Waiting candidates and promotion status.' },
]

const seatColumns = [
  { title: 'Program', key: 'program', width: 260 },
  { title: 'Quota', key: 'quota', width: 160 },
  { title: 'Seats', dataIndex: 'total_seats', key: 'total_seats', width: 90 },
  { title: 'Candidates', dataIndex: 'total_candidates', key: 'total_candidates', width: 110 },
  { title: 'Selected', dataIndex: 'selected_candidates', key: 'selected_candidates', width: 100 },
  { title: 'Waiting', dataIndex: 'waiting_candidates', key: 'waiting_candidates', width: 100 },
  { title: 'Accepted', dataIndex: 'accepted_candidates', key: 'accepted_candidates', width: 100 },
  { title: 'Confirmed', dataIndex: 'confirmed_candidates', key: 'confirmed_candidates', width: 110 },
  { title: 'Remaining', key: 'remaining_after_confirmation', width: 110 },
]

const cards = computed(() => {
  const c = dashboard.cards || {}

  return [
    { key: 'total_applicants', title: 'Total Applicants', value: c.total_applicants || 0 },
    { key: 'completed_profiles', title: 'Completed Profiles', value: c.completed_profiles || 0 },
    { key: 'submitted_applications', title: 'Submitted Applications', value: c.submitted_applications || 0 },
    { key: 'merit_calculated', title: 'Merit Calculated', value: c.merit_calculated || 0 },
    { key: 'merit_lists', title: 'Merit Lists', value: c.merit_lists || 0 },
    { key: 'selected_candidates', title: 'Selected', value: c.selected_candidates || 0 },
    { key: 'waiting_candidates', title: 'Waiting', value: c.waiting_candidates || 0 },
    { key: 'offered_candidates', title: 'Offered', value: c.offered_candidates || 0 },
    { key: 'accepted_candidates', title: 'Accepted', value: c.accepted_candidates || 0 },
    { key: 'payment_submitted', title: 'Payment Submitted', value: c.payment_submitted || 0 },
    { key: 'paid_vouchers', title: 'Paid Vouchers', value: c.paid_vouchers || 0 },
    { key: 'confirmed_admissions', title: 'Confirmed Admissions', value: c.confirmed_admissions || 0 },
    { key: 'transferred_students', title: 'Transferred Students', value: c.transferred_students || 0 },
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const programChartData = computed(() => ({
  labels: dashboard.program_summary.map((x: any) => x.program_code || x.program_title || 'N/A'),
  datasets: [
    {
      label: 'Confirmed',
      data: dashboard.program_summary.map((x: any) => Number(x.confirmed_candidates || 0)),
    },
    {
      label: 'Selected',
      data: dashboard.program_summary.map((x: any) => Number(x.selected_candidates || 0)),
    },
  ],
}))

const quotaChartData = computed(() => ({
  labels: dashboard.quota_summary.map((x: any) => x.quota_name || x.quota_code || 'N/A'),
  datasets: [
    {
      label: 'Confirmed',
      data: dashboard.quota_summary.map((x: any) => Number(x.confirmed_candidates || 0)),
    },
    {
      label: 'Waiting',
      data: dashboard.quota_summary.map((x: any) => Number(x.waiting_candidates || 0)),
    },
  ],
}))

const offerChartData = computed(() => ({
  labels: dashboard.offer_status_summary.map((x: any) => x.status_code || 'N/A'),
  datasets: [
    {
      data: dashboard.offer_status_summary.map((x: any) => Number(x.total || 0)),
    },
  ],
}))

const voucherChartData = computed(() => ({
  labels: dashboard.voucher_status_summary.map((x: any) => x.status_code || 'N/A'),
  datasets: [
    {
      data: dashboard.voucher_status_summary.map((x: any) => Number(x.total || 0)),
    },
  ],
}))

const dailyApplicationsChartData = computed(() => ({
  labels: dashboard.daily_applications.map((x: any) => x.date),
  datasets: [
    {
      label: 'Applications',
      data: dashboard.daily_applications.map((x: any) => Number(x.total || 0)),
    },
  ],
}))

const dailyConfirmationsChartData = computed(() => ({
  labels: dashboard.daily_confirmations.map((x: any) => x.date),
  datasets: [
    {
      label: 'Confirmations',
      data: dashboard.daily_confirmations.map((x: any) => Number(x.total || 0)),
    },
  ],
}))

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
    // Dashboard remains usable without lookup filters.
  }
}

const loadDashboard = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdmissionDashboardSummary(filters)
    const data = response?.data || response

    dashboard.cards = data.cards || {}
    dashboard.program_summary = data.program_summary || []
    dashboard.quota_summary = data.quota_summary || []
    dashboard.offer_status_summary = data.offer_status_summary || []
    dashboard.voucher_status_summary = data.voucher_status_summary || []
    dashboard.daily_applications = data.daily_applications || []
    dashboard.daily_confirmations = data.daily_confirmations || []
    dashboard.seat_summary = data.seat_summary || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load admission dashboard.')
  } finally {
    loading.value = false
  }
}

const openReport = (reportCode: string) => {
  navigateTo(`/admission/reports?report=${reportCode}`)
}

onMounted(async () => {
  await loadLookups()
  await loadDashboard()
})
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

.report-card {
  min-height: 130px;
}

.report-card p {
  color: #6b7280;
  min-height: 38px;
}

:deep(canvas) {
  min-height: 260px;
}
</style>