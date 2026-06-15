<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Assessment Results</h2>
          <p>View generated results, section performance, strengths, weaknesses, and admission sync status.</p>
        </div>

        <a-button @click="loadResults">
          Refresh
        </a-button>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="7">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search applicant, roll no, CNIC, assessment"
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
              v-model:value="filters.result_status_code"
              :options="resultStatusOptions"
              allow-clear
              placeholder="Result Status"
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
              <div>Attempt No: {{ record.attempt_no || '-' }}</div>
            </template>

            <template v-else-if="column.key === 'marks'">
              <div>Total: {{ record.total_marks }}</div>
              <div>Obtained: {{ record.obtained_marks }}</div>
              <div>Negative: {{ record.negative_marks }}</div>
              <strong>Final: {{ record.final_marks }}</strong>
            </template>

            <template v-else-if="column.key === 'result'">
              <div>{{ record.percentage }}%</div>
              <a-tag :color="record.is_passed ? 'green' : 'red'">
                {{ record.is_passed ? 'Passed' : 'Failed' }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag>{{ record.result_status_code }}</a-tag>
              <div>
                <small>Generated: {{ formatDate(record.generated_at) }}</small>
              </div>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-space wrap>
                <a-button size="small" type="primary" @click="openDetail(record)">
                  View Result
                </a-button>

                <a-button
                  size="small"
                  @click="approveResult(record)"
                  :disabled="record.result_status_code === 'approved' || record.result_status_code === 'published'"
                >
                  Approve
                </a-button>

                <a-button
                  size="small"
                  @click="publishResult(record)"
                  :disabled="record.result_status_code === 'published'"
                >
                  Publish
                </a-button>

                <a-button size="small" @click="syncToAdmission(record)">
                  Sync
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="detailOpen"
        title="Assessment Result Detail"
        width="1250px"
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
                {{ detail.attempt?.attempt_no || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Assessment">
                {{ detail.assessment?.code }} - {{ detail.assessment?.title }}
              </a-descriptions-item>
              <a-descriptions-item label="Schedule">
                {{ detail.schedule?.title || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Result Status">
                {{ detail.result?.result_status_code }}
              </a-descriptions-item>

              <a-descriptions-item label="Total Marks">
                {{ detail.result?.total_marks }}
              </a-descriptions-item>
              <a-descriptions-item label="Obtained Marks">
                {{ detail.result?.obtained_marks }}
              </a-descriptions-item>
              <a-descriptions-item label="Negative Marks">
                {{ detail.result?.negative_marks }}
              </a-descriptions-item>

              <a-descriptions-item label="Final Marks">
                {{ detail.result?.final_marks }}
              </a-descriptions-item>
              <a-descriptions-item label="Percentage">
                {{ detail.result?.percentage }}%
              </a-descriptions-item>
              <a-descriptions-item label="Passed">
                {{ detail.result?.is_passed ? 'Yes' : 'No' }}
              </a-descriptions-item>

              <a-descriptions-item label="Admission Sync">
                <a-tag :color="detail.is_synced_to_admission ? 'green' : 'orange'">
                  {{ detail.is_synced_to_admission ? 'Synced' : 'Not Synced' }}
                </a-tag>
              </a-descriptions-item>
            </a-descriptions>

            <a-tabs>
              <a-tab-pane key="sections" tab="Section Results">
                <a-table
                  :data-source="detail.section_results || []"
                  :pagination="false"
                  row-key="id"
                  size="small"
                >
                  <a-table-column title="Section">
                    <template #default="{ record }">
                      {{ record.assessment_section_id }}
                    </template>
                  </a-table-column>
                  <a-table-column title="Total" data-index="total_marks" />
                  <a-table-column title="Obtained" data-index="obtained_marks" />
                  <a-table-column title="Negative" data-index="negative_marks" />
                  <a-table-column title="Final" data-index="final_marks" />
                  <a-table-column title="Percentage">
                    <template #default="{ record }">
                      {{ record.percentage }}%
                    </template>
                  </a-table-column>
                  <a-table-column title="Passed">
                    <template #default="{ record }">
                      <a-tag :color="record.is_passed ? 'green' : 'red'">
                        {{ record.is_passed ? 'Yes' : 'No' }}
                      </a-tag>
                    </template>
                  </a-table-column>
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="strengths" tab="Strengths">
                <AnalysisList :items="detail.strengths || []" empty-text="No strengths found." />
              </a-tab-pane>

              <a-tab-pane key="weaknesses" tab="Weaknesses">
                <AnalysisList :items="detail.weaknesses || []" empty-text="No weaknesses found." />
              </a-tab-pane>

              <a-tab-pane key="topic" tab="Topic Analysis">
                <AnalysisList :items="detail.analysis?.topic_analysis || []" empty-text="No topic analysis found." />
              </a-tab-pane>

              <a-tab-pane key="difficulty" tab="Difficulty Analysis">
                <AnalysisList :items="detail.analysis?.difficulty_analysis || []" empty-text="No difficulty analysis found." />
              </a-tab-pane>

              <a-tab-pane key="question-type" tab="Question Type Analysis">
                <AnalysisList :items="detail.analysis?.question_type_analysis || []" empty-text="No question type analysis found." />
              </a-tab-pane>

              <a-tab-pane key="answers" tab="Question Answers">
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

                  <a-table-column title="Submitted">
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

                  <a-table-column title="Correct">
                    <template #default="{ record }">
                      <div v-if="record.correct_options?.length">
                        <div v-for="option in record.correct_options" :key="option.id">
                          {{ option.option_key }}. {{ option.option_text }}
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
              </a-tab-pane>
            </a-tabs>
          </template>
        </a-spin>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const AnalysisList = defineComponent({
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    emptyText: {
      type: String,
      default: 'No data.',
    },
  },
  setup(props) {
    return () => {
      const items = props.items as any[]

      if (!items.length) {
        return h('div', { class: 'empty-box' }, props.emptyText)
      }

      return h(
        'div',
        { class: 'analysis-list' },
        items.map((item: any) =>
          h('div', { class: 'analysis-item' }, [
            h('strong', item.label || '-'),
            h('div', `Questions: ${item.total_questions ?? 0}, Attempted: ${item.attempted ?? 0}, Correct: ${item.correct ?? 0}, Wrong: ${item.wrong ?? 0}`),
            h('div', `Marks: ${item.final_marks ?? 0}/${item.total_marks ?? 0} (${item.percentage ?? 0}%)`),
          ])
        )
      )
    }
  },
})

const api = useApplicantPortalApi()

const loading = ref(false)
const detailLoading = ref(false)
const detailOpen = ref(false)

const rows = ref<any[]>([])
const detail = ref<any>(null)

const filters = reactive<any>({
  search: '',
  assessment_id: null,
  assessment_schedule_id: null,
  result_status_code: null,
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

const resultStatusOptions = [
  { label: 'Generated', value: 'generated' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
]

const columns = [
  { title: 'Applicant', key: 'applicant' },
  { title: 'Assessment', key: 'assessment' },
  { title: 'Roll / Attempt', key: 'roll', width: 150 },
  { title: 'Marks', key: 'marks', width: 160 },
  { title: 'Result', key: 'result', width: 130 },
  { title: 'Status', key: 'status', width: 180 },
  { title: 'Action', key: 'action', width: 260 },
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

const loadResults = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdminAssessmentResults({
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
    message.error(error?.data?.message || 'Unable to load assessment results.')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  pagination.current = 1
  await loadResults()
}

const resetFilters = async () => {
  filters.search = ''
  filters.assessment_id = null
  filters.assessment_schedule_id = null
  filters.result_status_code = null
  pagination.current = 1
  await loadResults()
}

const handleTableChanged = async (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  await loadResults()
}

const openDetail = async (record: any) => {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const response: any = await api.getAdminAssessmentResultDetail(record.id)
    detail.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load result detail.')
  } finally {
    detailLoading.value = false
  }
}

const approveResult = async (record: any) => {
  try {
    await api.approveAdminAssessmentResult(record.id)
    message.success('Result approved.')
    await loadResults()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to approve result.')
  }
}

const publishResult = async (record: any) => {
  try {
    await api.publishAdminAssessmentResult(record.id)
    message.success('Result published.')
    await loadResults()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to publish result.')
  }
}

const syncToAdmission = async (record: any) => {
  try {
    await api.syncAdminAssessmentResultToAdmission(record.id)
    message.success('Result synced to admission.')
    await loadResults()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to sync result.')
  }
}

const formatDate = (value: any) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').replace('.000000Z', '')
}

onMounted(async () => {
  await loadLookups()
  await loadResults()
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

.empty-box {
  padding: 24px;
  text-align: center;
  color: #888;
  border: 1px dashed #ddd;
  border-radius: 6px;
}

.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
}
</style>