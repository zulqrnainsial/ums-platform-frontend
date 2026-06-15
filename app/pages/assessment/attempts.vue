<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Assessment Attempts</h2>
          <p>View submitted attempts, answers, marking status, and participant details.</p>
        </div>

        <a-button @click="loadAttempts">
          Refresh
        </a-button>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="7">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search roll no, applicant, CNIC, assessment"
              allow-clear
              @search="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.assessment_id"
              :options="lookups.assessments"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Assessment"
              @change="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.assessment_schedule_id"
              :options="filteredSchedules"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Schedule"
              @change="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
              v-model:value="filters.status_code"
              :options="attemptStatusOptions"
              allow-clear
              placeholder="Attempt Status"
              @change="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-button block @click="resetFilters">
              Reset
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card>
        <a-table
          :columns="columns"
          :data-source="rows"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          @change="handleTableChanged"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'applicant'">
              <strong>{{ record.applicant_no || '-' }}</strong>
              <div>{{ record.applicant_name || '-' }}</div>
              <small>{{ record.cnic_bform || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'assessment'">
              <strong>{{ record.assessment_title }}</strong>
              <div>{{ record.assessment_code }}</div>
              <small>{{ record.schedule_title || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'roll'">
              <strong>{{ record.roll_no || '-' }}</strong>
              <div>Attempt No: {{ record.attempt_no }}</div>
            </template>

            <template v-else-if="column.key === 'time'">
              <div>Start: {{ formatDate(record.started_at) }}</div>
              <div>Submit: {{ formatDate(record.submitted_at) }}</div>
              <small>Duration: {{ formatDuration(record.duration_seconds) }}</small>
            </template>

            <template v-else-if="column.key === 'status'">
              <div>
                <a-tag>Attempt: {{ record.status_code }}</a-tag>
              </div>
              <div>
                <a-tag>Participant: {{ record.attempt_status_code }}</a-tag>
              </div>
              <div>
                <a-tag>Result: {{ record.result_status_code }}</a-tag>
              </div>
            </template>

            <template v-else-if="column.key === 'marks'">
              <div>Total: {{ record.assessment_total_marks || '-' }}</div>
              <div>Final: {{ record.final_marks || 0 }}</div>
              <small>{{ record.percentage || 0 }}%</small>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-button size="small" type="primary" @click="openDetail(record)">
                View Attempt
              </a-button>
              <a-button size="small" @click="openActivityLogs(record)">
                Activity
              </a-button>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="detailOpen"
        title="Assessment Attempt Detail"
        width="1200px"
        :footer="null"
      >
        <a-spin :spinning="detailLoading">
          <template v-if="detail">
            <a-descriptions bordered size="small" :column="3" class="mb-3">
              <a-descriptions-item label="Applicant">
                {{ detail.applicant?.applicant_no }} - {{ detail.applicant?.full_name }}
              </a-descriptions-item>
              <a-descriptions-item label="Roll No">
                {{ detail.participant?.roll_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Attempt No">
                {{ detail.attempt?.attempt_no }}
              </a-descriptions-item>

              <a-descriptions-item label="Assessment">
                {{ detail.assessment?.code }} - {{ detail.assessment?.title }}
              </a-descriptions-item>
              <a-descriptions-item label="Schedule">
                {{ detail.schedule?.title || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Status">
                {{ detail.attempt?.status_code }}
              </a-descriptions-item>

              <a-descriptions-item label="Started At">
                {{ formatDate(detail.attempt?.started_at) }}
              </a-descriptions-item>
              <a-descriptions-item label="Submitted At">
                {{ formatDate(detail.attempt?.submitted_at) }}
              </a-descriptions-item>
              <a-descriptions-item label="Duration">
                {{ formatDuration(detail.attempt?.duration_seconds) }}
              </a-descriptions-item>

              <a-descriptions-item label="Obtained">
                {{ detail.attempt?.obtained_marks || 0 }}
              </a-descriptions-item>
              <a-descriptions-item label="Negative">
                {{ detail.attempt?.negative_marks || 0 }}
              </a-descriptions-item>
              <a-descriptions-item label="Final / Percentage">
                {{ detail.attempt?.final_marks || 0 }} / {{ detail.attempt?.percentage || 0 }}%
              </a-descriptions-item>
            </a-descriptions>

            <a-alert
              v-if="detail.result"
              type="info"
              show-icon
              class="mb-3"
              :message="`Result: ${detail.result.result_status_code}, Passed: ${detail.result.is_passed ? 'Yes' : 'No'}`"
            />

            <a-table
              :data-source="detail.answers || []"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <a-table-column title="#" width="60">
                <template #default="{ index }">
                  {{ index + 1 }}
                </template>
              </a-table-column>

              <a-table-column title="Question">
                <template #default="{ record }">
                  <strong>{{ record.question_text }}</strong>
                  <div>
                    <small>
                      Type: {{ record.question_type_code }}
                      |
                      Topic: {{ record.topic?.name || '-' }}
                      |
                      Difficulty: {{ record.difficulty_code || '-' }}
                    </small>
                  </div>
                </template>
              </a-table-column>

              <a-table-column title="Submitted Answer">
                <template #default="{ record }">
                  <div v-if="record.selected_options?.length">
                    <div v-for="option in record.selected_options" :key="option.id">
                      {{ option.option_key }}. {{ option.option_text }}
                    </div>
                  </div>

                  <div v-else-if="record.answer_text">
                    {{ record.answer_text }}
                  </div>

                  <div v-else-if="record.answer_number !== null && record.answer_number !== undefined">
                    {{ record.answer_number }}
                  </div>

                  <span v-else>-</span>
                </template>
              </a-table-column>

              <a-table-column title="Correct Answer">
                <template #default="{ record }">
                  <div v-if="record.correct_options?.length">
                    <div v-for="option in record.correct_options" :key="option.id">
                      {{ option.option_key }}. {{ option.option_text }}
                    </div>
                  </div>

                  <div v-else-if="record.answer_keys?.length">
                    <div v-for="(key, index) in record.answer_keys" :key="index">
                      {{ key.answer_text || key.answer_number || '-' }}
                    </div>
                  </div>

                  <span v-else>-</span>
                </template>
              </a-table-column>

              <a-table-column title="Marking" width="170">
                <template #default="{ record }">
                  <div>
                    <a-tag v-if="record.is_correct === true" color="green">Correct</a-tag>
                    <a-tag v-else-if="record.is_correct === false" color="red">Wrong</a-tag>
                    <a-tag v-else color="orange">Manual</a-tag>
                  </div>
                  <div>Marks: {{ record.marks_awarded || 0 }} / {{ record.marks || 0 }}</div>
                  <div>Negative: {{ record.negative_marks_applied || 0 }}</div>
                </template>
              </a-table-column>
            </a-table>
          </template>
        </a-spin>
      </a-modal>
    </div>
    <a-drawer
      v-model:open="activityOpen"
      title="Attempt Activity Logs"
      width="720"
    >
      <a-table
        :data-source="activityRows"
        row-key="id"
        size="small"
        :loading="activityLoading"
        :pagination="{ pageSize: 20 }"
      >
        <a-table-column title="Time" data-index="occurred_at" />
        <a-table-column title="Event" data-index="event_code" />
        <a-table-column title="Severity" data-index="severity_code" />
        <a-table-column title="Question" data-index="assessment_question_id" />
        <a-table-column title="IP" data-index="ip_address" />
      </a-table>
    </a-drawer>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()
const genApi = useApi()

const loading = ref(false)
const detailLoading = ref(false)
const detailOpen = ref(false)

const rows = ref<any[]>([])
const detail = ref<any>(null)
const activityOpen = ref(false)
const activityLoading = ref(false)
const activityRows = ref<any[]>([])
const filters = reactive<any>({
  search: '',
  assessment_id: null,
  assessment_schedule_id: null,
  status_code: null,
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
})

const lookups = reactive<any>({
  assessments: [],
  schedules: [],
})

const attemptStatusOptions = [
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Evaluated', value: 'evaluated' },
  { label: 'Auto Submitted', value: 'auto_submitted' },
  { label: 'Cancelled', value: 'cancelled' },
]

const columns = [
  { title: 'Applicant', key: 'applicant' },
  { title: 'Assessment', key: 'assessment' },
  { title: 'Roll / Attempt', key: 'roll', width: 150 },
  { title: 'Time', key: 'time', width: 230 },
  { title: 'Status', key: 'status', width: 190 },
  { title: 'Marks', key: 'marks', width: 130 },
  { title: 'Action', key: 'action', width: 130 },
]

const filteredSchedules = computed(() => {
  if (!filters.assessment_id) return lookups.schedules

  return lookups.schedules.filter((item: any) => {
    return Number(item.assessment_id) === Number(filters.assessment_id)
  })
})

const loadLookups = async () => {
  const [assessments, schedules] = await Promise.all([
    api.getOptions('/dynamic-options/assessments'),
    api.getOptions('/dynamic-options/assessment-schedules'),
  ])

  lookups.assessments = assessments?.data || []
  lookups.schedules = schedules?.data || []
}

const loadAttempts = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdminAssessmentAttempts({
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    })

    const payload = response?.data || {}

    rows.value = payload.data || []
    pagination.total = payload.total || 0
    pagination.current = payload.current_page || pagination.current
    pagination.pageSize = payload.per_page || pagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load assessment attempts.')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  pagination.current = 1
  await loadAttempts()
}

const resetFilters = async () => {
  filters.search = ''
  filters.assessment_id = null
  filters.assessment_schedule_id = null
  filters.status_code = null
  pagination.current = 1
  await loadAttempts()
}

const handleTableChanged = async (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  await loadAttempts()
}

const openDetail = async (record: any) => {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const response: any = await api.getAdminAssessmentAttemptDetail(record.id)
    detail.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attempt detail.')
  } finally {
    detailLoading.value = false
  }
}

const formatDate = (value: any) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').replace('.000000Z', '')
}
const openActivityLogs = async (record: any) => {
  activityOpen.value = true
  activityLoading.value = true
  activityRows.value = []

  try {
    const response: any = await genApi.getAdminAssessmentAttemptActivityLogs(record.id)
    activityRows.value = response?.data?.data || response?.data || response || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load activity logs.')
  } finally {
    activityLoading.value = false
  }
}
const formatDuration = (seconds: any) => {
  if (seconds === null || seconds === undefined) return '-'

  const total = Number(seconds)

  if (Number.isNaN(total)) return '-'

  const minutes = Math.floor(total / 60)
  const remainingSeconds = total % 60

  return `${minutes}m ${remainingSeconds}s`
}

onMounted(async () => {
  await loadLookups()
  await loadAttempts()
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
  color: #888;
  margin-bottom: 0;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>