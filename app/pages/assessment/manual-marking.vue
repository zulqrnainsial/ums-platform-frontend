<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Manual Marking</h2>
          <p>Evaluate descriptive, code, file, and manually required answers.</p>
        </div>

        <a-button @click="loadRows">
          Refresh
        </a-button>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="7">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search applicant, roll no, question"
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
              v-model:value="filters.question_type_code"
              :options="questionTypeOptions"
              allow-clear
              placeholder="Question Type"
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
              <small>{{ record.roll_no || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'assessment'">
              <strong>{{ record.assessment_title || '-' }}</strong>
              <div>{{ record.assessment_code || '-' }}</div>
              <small>{{ record.schedule_title || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'question'">
              <strong>{{ record.question_text }}</strong>
              <div>
                <a-tag>{{ record.question_type_code }}</a-tag>
                <a-tag>{{ record.difficulty_code }}</a-tag>
              </div>
            </template>

            <template v-else-if="column.key === 'answer'">
              <div v-if="record.answer_text">
                {{ record.answer_text }}
              </div>
              <div v-else-if="record.answer_number !== null && record.answer_number !== undefined">
                {{ record.answer_number }}
              </div>
              <span v-else>-</span>
            </template>

            <template v-else-if="column.key === 'marks'">
              <div>Max: {{ record.marks || 0 }}</div>
              <div>Negative: {{ record.negative_marks || 0 }}</div>
              <div>Awarded: {{ record.marks_awarded || 0 }}</div>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-button type="primary" size="small" @click="openMarking(record)">
                Mark
              </a-button>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="markingOpen"
        title="Mark Answer"
        width="850px"
        @ok="saveMarking"
        :confirm-loading="saving"
      >
        <template v-if="selected">
          <a-descriptions bordered size="small" :column="2" class="mb-3">
            <a-descriptions-item label="Applicant">
              {{ selected.applicant_no }} - {{ selected.applicant_name }}
            </a-descriptions-item>
            <a-descriptions-item label="Roll No">
              {{ selected.roll_no }}
            </a-descriptions-item>
            <a-descriptions-item label="Assessment">
              {{ selected.assessment_title }}
            </a-descriptions-item>
            <a-descriptions-item label="Question Type">
              {{ selected.question_type_code }}
            </a-descriptions-item>
          </a-descriptions>

          <a-card size="small" title="Question" class="mb-3">
            <div>{{ selected.question_text }}</div>
            <div v-if="selected.question_html" v-html="selected.question_html" />
          </a-card>

          <a-card size="small" title="Submitted Answer" class="mb-3">
            <div v-if="selected.answer_text">
              {{ selected.answer_text }}
            </div>
            <div v-else-if="selected.answer_number !== null && selected.answer_number !== undefined">
              {{ selected.answer_number }}
            </div>
            <span v-else>-</span>
          </a-card>

          <a-row :gutter="[12, 12]">
            <a-col :xs="24" :md="8">
              <label class="form-label">Correct?</label>
              <a-select
                v-model:value="markForm.is_correct"
                :options="[
                  { label: 'Correct', value: true },
                  { label: 'Wrong', value: false },
                  { label: 'Partially / Manual', value: null },
                ]"
              />
            </a-col>

            <a-col :xs="24" :md="8">
              <label class="form-label">Marks Awarded</label>
              <a-input-number
                v-model:value="markForm.marks_awarded"
                class="w-100"
                :min="0"
                :max="Number(selected.marks || 0)"
                :step="0.5"
              />
            </a-col>

            <a-col :xs="24" :md="8">
              <label class="form-label">Negative Marks</label>
              <a-input-number
                v-model:value="markForm.negative_marks_applied"
                class="w-100"
                :min="0"
                :step="0.25"
              />
            </a-col>

            <a-col :xs="24">
              <label class="form-label">Remarks</label>
              <a-textarea
                v-model:value="markForm.marking_remarks"
                :rows="4"
                placeholder="Enter marking remarks"
              />
            </a-col>
          </a-row>
        </template>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()

const loading = ref(false)
const saving = ref(false)
const markingOpen = ref(false)

const rows = ref<any[]>([])
const selected = ref<any>(null)

const filters = reactive<any>({
  search: '',
  assessment_id: null,
  assessment_schedule_id: null,
  question_type_code: null,
})

const markForm = reactive<any>({
  is_correct: null,
  marks_awarded: 0,
  negative_marks_applied: 0,
  marking_remarks: '',
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

const questionTypeOptions = [
  { label: 'Short Answer', value: 'short_answer' },
  { label: 'Long Answer', value: 'long_answer' },
  { label: 'Fill Blank', value: 'fill_blank' },
  { label: 'Code', value: 'code' },
  { label: 'File Upload', value: 'file_upload' },
]

const columns = [
  { title: 'Applicant', key: 'applicant', width: 220 },
  { title: 'Assessment', key: 'assessment', width: 260 },
  { title: 'Question', key: 'question' },
  { title: 'Answer', key: 'answer' },
  { title: 'Marks', key: 'marks', width: 140 },
  { title: 'Action', key: 'action', width: 100 },
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

const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await api.getManualMarkingPendingAnswers({
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
    message.error(error?.data?.message || 'Unable to load manual marking answers.')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  pagination.current = 1
  await loadRows()
}

const resetFilters = async () => {
  filters.search = ''
  filters.assessment_id = null
  filters.assessment_schedule_id = null
  filters.question_type_code = null
  pagination.current = 1
  await loadRows()
}

const handleTableChanged = async (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  await loadRows()
}

const openMarking = (record: any) => {
  selected.value = record

  markForm.is_correct = record.is_correct
  markForm.marks_awarded = Number(record.marks_awarded || 0)
  markForm.negative_marks_applied = Number(record.negative_marks_applied || 0)
  markForm.marking_remarks = record.marking_remarks || ''

  markingOpen.value = true
}

const saveMarking = async () => {
  if (!selected.value) return

  saving.value = true

  try {
    await api.markManualAnswer(selected.value.id, {
      is_correct: markForm.is_correct,
      marks_awarded: markForm.marks_awarded,
      negative_marks_applied: markForm.negative_marks_applied || 0,
      marking_remarks: markForm.marking_remarks,
    })

    message.success('Answer marked successfully.')
    markingOpen.value = false
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to mark answer.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadLookups()
  await loadRows()
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

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
}

.w-100 {
  width: 100%;
}
</style>