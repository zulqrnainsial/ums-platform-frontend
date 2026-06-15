<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Participant Assignment</h2>
          <p>Assign applicants to assessments, generate roll numbers, and view roll no slips.</p>
        </div>

        <a-space>
          <a-button @click="loadParticipants" :disabled="!filters.assessment_id">
            Refresh Participants
          </a-button>

          <a-button type="primary" @click="assignSelected" :disabled="selectedApplicantIds.length === 0 || !filters.assessment_id">
            Assign Selected Applicants
          </a-button>

          <a-button @click="generateRollNumbers" :disabled="!filters.assessment_id">
            Generate Roll Numbers
          </a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="10">
            <a-form-item label="Assessment / Test">
              <a-select
                v-model:value="filters.assessment_id"
                :options="lookups.assessments"
                show-search
                option-filter-prop="label"
                placeholder="Select assessment/test"
                @change="handleAssessmentChanged"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="Schedule">
              <a-select
                v-model:value="filters.assessment_schedule_id"
                :options="scheduleOptions"
                allow-clear
                show-search
                option-filter-prop="label"
                placeholder="Optional schedule"
                @change="loadParticipants"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="12">
          <a-card title="Applicant Candidates">
            <a-input-search
              v-model:value="candidateFilters.search"
              placeholder="Search applicant"
              allow-clear
              class="mb-3"
              @search="loadCandidates"
            />

            <a-table
              :columns="candidateColumns"
              :data-source="candidateRows"
              :loading="candidateLoading"
              :pagination="candidatePagination"
              row-key="id"
              size="small"
              :row-selection="candidateRowSelection"
              @change="handleCandidateTableChanged"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'applicant'">
                  <strong>{{ record.applicant_no }}</strong>
                  <div>{{ record.full_name }}</div>
                  <small>{{ record.cnic_bform || '-' }}</small>
                </template>

                <template v-else-if="column.key === 'contact'">
                  <div>{{ record.phone || '-' }}</div>
                  <small>{{ record.email || '-' }}</small>
                </template>

                <template v-else-if="column.key === 'status'">
                  <a-tag>{{ record.profile_status_code }}</a-tag>
                  <a-tag>{{ record.applicant_status_code }}</a-tag>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Assigned Participants">
            <a-table
              :columns="participantColumns"
              :data-source="participantRows"
              :loading="participantLoading"
              :pagination="participantPagination"
              row-key="id"
              size="small"
              @change="handleParticipantTableChanged"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'participant'">
                  <strong>{{ record.roll_no || 'Roll No Pending' }}</strong>
                  <div>{{ record.participant_type_code }} #{{ record.participant_id }}</div>
                  <small>Applicant ID: {{ record.applicant_id || '-' }}</small>
                </template>

                <template v-else-if="column.key === 'status'">
                  <a-tag>{{ record.attendance_status_code }}</a-tag>
                  <a-tag>{{ record.attempt_status_code }}</a-tag>
                  <a-tag>{{ record.result_status_code }}</a-tag>
                </template>

                <template v-else-if="column.key === 'action'">
                  <a-button size="small" type="primary" @click="openRollSlip(record)">
                    Roll Slip
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <a-modal
        v-model:open="rollSlipOpen"
        title="Roll No Slip"
        width="800px"
        :footer="null"
      >
        <a-spin :spinning="rollSlipLoading">
          <div v-if="rollSlip" class="roll-slip">
            <div class="roll-slip-header">
              <h2>{{ tenantTitle }}</h2>
              <h3>Assessment Roll No Slip</h3>
            </div>

            <a-descriptions bordered :column="2" size="small">
              <a-descriptions-item label="Roll No">
                {{ rollSlip.participant?.roll_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Seat No">
                {{ rollSlip.participant?.seat_no || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Applicant No">
                {{ rollSlip.applicant?.applicant_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Applicant Name">
                {{ rollSlip.applicant?.full_name || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="CNIC / B-Form">
                {{ rollSlip.applicant?.cnic_bform || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Phone">
                {{ rollSlip.applicant?.phone || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Assessment">
                {{ rollSlip.assessment?.title || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Mode">
                {{ rollSlip.assessment?.mode_code || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Schedule">
                {{ rollSlip.schedule?.title || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Venue">
                {{ rollSlip.schedule?.venue_name || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Start">
                {{ rollSlip.schedule?.start_at || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="End">
                {{ rollSlip.schedule?.end_at || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <h4 class="mt-3">Instructions</h4>
            <ul>
              <li v-for="item in rollSlip.instructions || []" :key="item">
                {{ item }}
              </li>
            </ul>

            <div class="print-actions">
              <a-button type="primary" @click="printRollSlip">
                Print
              </a-button>
            </div>
          </div>
        </a-spin>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()

const tenantTitle = 'University / Institute'

const candidateLoading = ref(false)
const participantLoading = ref(false)
const rollSlipLoading = ref(false)
const rollSlipOpen = ref(false)

const selectedApplicantIds = ref<number[]>([])
const candidateRows = ref<any[]>([])
const participantRows = ref<any[]>([])
const rollSlip = ref<any>(null)

const lookups = reactive<any>({
  assessments: [],
  schedules: [],
})

const filters = reactive<any>({
  assessment_id: null,
  assessment_schedule_id: null,
})

const candidateFilters = reactive<any>({
  search: '',
})

const candidatePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const participantPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const scheduleOptions = computed(() => {
  if (!filters.assessment_id) return lookups.schedules

  return lookups.schedules.filter((item: any) => {
    return item.assessment_id === filters.assessment_id
  })
})

const candidateColumns = [
  { title: 'Applicant', key: 'applicant' },
  { title: 'Contact', key: 'contact', width: 170 },
  { title: 'Status', key: 'status', width: 170 },
]

const participantColumns = [
  { title: 'Participant', key: 'participant' },
  { title: 'Status', key: 'status', width: 210 },
  { title: 'Action', key: 'action', width: 100 },
]

const candidateRowSelection = computed(() => ({
  selectedRowKeys: selectedApplicantIds.value,
  onChange: (keys: number[]) => {
    selectedApplicantIds.value = keys
  },
}))

const loadLookups = async () => {
  const [assessments, schedules] = await Promise.all([
    api.getOptions('/dynamic-options/assessments'),
    api.getOptions('/dynamic-options/assessment-schedules'),
  ])

  lookups.assessments = assessments?.data || []
  lookups.schedules = schedules?.data || []
}

const handleAssessmentChanged = async () => {
  filters.assessment_schedule_id = null
  selectedApplicantIds.value = []
  await loadCandidates()
  await loadParticipants()
}

const loadCandidates = async () => {
  candidateLoading.value = true

  try {
    const response: any = await api.getAssessmentApplicantCandidates({
      search: candidateFilters.search,
      page: candidatePagination.current,
      per_page: candidatePagination.pageSize,
    })

    const payload = response?.data || {}
    candidateRows.value = payload.data || []
    candidatePagination.total = payload.total || 0
    candidatePagination.current = payload.current_page || candidatePagination.current
    candidatePagination.pageSize = payload.per_page || candidatePagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load applicants.')
  } finally {
    candidateLoading.value = false
  }
}

const loadParticipants = async () => {
  if (!filters.assessment_id) {
    participantRows.value = []
    return
  }

  participantLoading.value = true

  try {
    const response: any = await api.getAssessmentParticipants({
      assessment_id: filters.assessment_id,
      assessment_schedule_id: filters.assessment_schedule_id,
      page: participantPagination.current,
      per_page: participantPagination.pageSize,
    })

    const payload = response?.data || {}
    participantRows.value = payload.data || []
    participantPagination.total = payload.total || 0
    participantPagination.current = payload.current_page || participantPagination.current
    participantPagination.pageSize = payload.per_page || participantPagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load participants.')
  } finally {
    participantLoading.value = false
  }
}

const assignSelected = async () => {
  if (!filters.assessment_id) {
    message.error('Please select assessment.')
    return
  }

  if (selectedApplicantIds.value.length === 0) {
    message.error('Please select applicants.')
    return
  }

  try {
    const response: any = await api.bulkAssignApplicantsToAssessment({
      assessment_id: filters.assessment_id,
      assessment_schedule_id: filters.assessment_schedule_id,
      applicant_ids: selectedApplicantIds.value,
    })

    const result = response?.data || {}
    message.success(`Assigned: ${result.assigned || 0}, Skipped existing: ${result.skipped_existing || 0}`)

    selectedApplicantIds.value = []
    await loadParticipants()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to assign applicants.')
  }
}

const generateRollNumbers = async () => {
  if (!filters.assessment_id) {
    message.error('Please select assessment.')
    return
  }

  try {
    const response: any = await api.generateAssessmentRollNumbers({
      assessment_id: filters.assessment_id,
      assessment_schedule_id: filters.assessment_schedule_id,
    })

    message.success(`Roll numbers generated: ${response?.data?.generated || 0}`)
    await loadParticipants()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to generate roll numbers.')
  }
}

const openRollSlip = async (record: any) => {
  rollSlipOpen.value = true
  rollSlipLoading.value = true
  rollSlip.value = null

  try {
    const response: any = await api.getAssessmentRollNoSlip(record.id)
    rollSlip.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load roll no slip.')
  } finally {
    rollSlipLoading.value = false
  }
}

const printRollSlip = () => {
  window.print()
}

const handleCandidateTableChanged = (pager: any) => {
  candidatePagination.current = pager.current
  candidatePagination.pageSize = pager.pageSize
  loadCandidates()
}

const handleParticipantTableChanged = (pager: any) => {
  participantPagination.current = pager.current
  participantPagination.pageSize = pager.pageSize
  loadParticipants()
}

onMounted(async () => {
  await loadLookups()
  await loadCandidates()
})
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.roll-slip-header {
  text-align: center;
  margin-bottom: 16px;
}

.print-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media print {
  body * {
    visibility: hidden;
  }

  .roll-slip,
  .roll-slip * {
    visibility: visible;
  }

  .roll-slip {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  .print-actions {
    display: none;
  }
}
</style>