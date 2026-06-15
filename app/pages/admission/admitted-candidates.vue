<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Admitted Candidates</h2>
          <p>View confirmed admissions offered program wise and quota wise.</p>
        </div>

        <a-space>
          <a-button @click="resetFilters">Reset</a-button>
          <a-button @click="loadData">Refresh</a-button>
        </a-space>
      </div>

      <a-card size="small" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-input-search
              v-model:value="filters.q"
              placeholder="Search applicant, CNIC, student no"
              @search="loadData"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.admission_session_id"
              :options="lookups.admissionSessions"
              placeholder="Admission Session"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.offered_program_id"
              :options="lookups.offeredPrograms"
              placeholder="Offered Program"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.program_quota_seat_id"
              :options="lookups.programQuotaSeats"
              placeholder="Quota / Seat Category"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-button type="primary" block @click="loadData">
              Apply
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        row-key="confirmation_id"
        size="small"
        :pagination="pagination"
        :scroll="{ x: 1450 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'candidate'">
            <strong>{{ record.applicant_no || '-' }}</strong>
            <div>{{ record.applicant_name || '-' }}</div>
            <small>{{ record.cnic_bform || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'program'">
            <strong>{{ record.offered_program_code || '-' }}</strong>
            <div>{{ record.offered_program_title || record.offered_program_name || '-' }}</div>
          </template>

          <template v-else-if="column.key === 'quota'">
            <a-tag>{{ record.quota_name || record.quota_title || record.quota_code || '-' }}</a-tag>
          </template>

          <template v-else-if="column.key === 'voucher'">
            <div>{{ record.voucher_no || '-' }}</div>
            <a-tag v-if="record.payment_status_code" :color="record.payment_status_code === 'paid' ? 'green' : 'orange'">
              {{ record.payment_status_code }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'student'">
            <a-tag v-if="record.student_no" color="green">
              {{ record.student_no }}
            </a-tag>
            <a-tag v-else color="red">
              Not Created
            </a-tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag color="green">
              {{ record.confirmation_status_code || 'confirmed' }}
            </a-tag>

            <a-tag
              v-if="record.transfer_status_code === 'transferred'"
              color="blue"
            >
              transferred
            </a-tag>

            <div>
              <small>{{ record.confirmed_at || '-' }}</small>
            </div>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
                <a-button
                v-if="!record.student_id || record.transfer_status_code !== 'transferred'"
                size="small"
                type="primary"
                @click="transferToStudent(record)"
                >
                Transfer to Student
                </a-button>

                <a-button
                v-else-if="record.finalization_status_code !== 'finalized'"
                size="small"
                type="primary"
                @click="finalizeAdmission(record)"
                >
                Finalize Admission
                </a-button>

                <a-tag v-else color="green">
                Finalized
                </a-tag>
            </a-space>
          </template>

          <template v-else>
            {{ record[column.dataIndex] ?? '-' }}
          </template>
        </template>
      </a-table>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()

const loading = ref(false)
const rows = ref<any[]>([])

const filters = reactive<any>({
  q: '',
  admission_session_id: undefined,
  offered_program_id: undefined,
  program_quota_seat_id: undefined,
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
})

const lookups = reactive<any>({
  admissionSessions: [],
  offeredPrograms: [],
  programQuotaSeats: [],
})

const columns = [
  { title: 'Candidate', key: 'candidate', width: 230 },
  { title: 'Program', key: 'program', width: 300 },
  { title: 'Quota', key: 'quota', width: 150 },
  { title: 'Merit Position', dataIndex: 'merit_position', key: 'merit_position', width: 120 },
  { title: 'Score', dataIndex: 'final_merit_score', key: 'final_merit_score', width: 100 },
  { title: 'Voucher', key: 'voucher', width: 180 },
  { title: 'Student', key: 'student', width: 150 },
  { title: 'Status', key: 'status', width: 190 },
  { title: 'Action', key: 'action', width: 190 },
]

const optionData = (response: any) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  return []
}

const numericOrUndefined = (value: any) => {
  if (value === null || value === undefined || value === '') return undefined

  if (typeof value === 'object') {
    const actual = value.value ?? value.id ?? value.key
    return actual ? Number(actual) : undefined
  }

  return Number(value)
}

const cleanFilters = () => {
  return {
    q: filters.q || undefined,
    admission_session_id: numericOrUndefined(filters.admission_session_id),
    offered_program_id: numericOrUndefined(filters.offered_program_id),
    program_quota_seat_id: numericOrUndefined(filters.program_quota_seat_id),
    page: pagination.current,
    per_page: pagination.pageSize,
  }
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

const finalizeAdmission = async (record: any) => {
  const confirmationId = record.confirmation_id || record.id

  if (!confirmationId) {
    message.error('Confirmation id not found.')
    return
  }

  try {
    await api.finalizeConfirmedAdmission(Number(confirmationId), {
      remarks: 'Finalized from admitted candidates screen.',
    })

    message.success('Admission finalized and student enrollment created successfully.')
    await loadData()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to finalize admission.')
  }
}
const loadData = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdmittedCandidates(cleanFilters())

    const paginator = response?.data || response

    rows.value = paginator?.data || []
    pagination.total = paginator?.total || rows.value.length
    pagination.current = paginator?.current_page || pagination.current
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load admitted candidates.')
  } finally {
    loading.value = false
  }
}

const transferToStudent = async (record: any) => {
  const confirmationId = record.confirmation_id || record.id

  if (!confirmationId) {
    message.error('Confirmation id not found.')
    return
  }

  try {
    await api.transferConfirmedAdmissionToStudent(Number(confirmationId))

    message.success('Candidate transferred to student successfully.')
    await loadData()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to transfer candidate to student.')
  }
}

const resetFilters = async () => {
  filters.q = ''
  filters.admission_session_id = undefined
  filters.offered_program_id = undefined
  filters.program_quota_seat_id = undefined
  pagination.current = 1
  await loadData()
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadData()
}

onMounted(async () => {
  await loadLookups()
  await loadData()
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
</style>