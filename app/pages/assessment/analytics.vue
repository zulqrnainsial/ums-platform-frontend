<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Assessment Analytics</h2>
          <p>Analyze assessment performance, strengths, weaknesses, topics, difficulty levels, and question types.</p>
        </div>

        <a-button @click="loadAnalytics">
          Refresh
        </a-button>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="8">
            <a-select
              v-model:value="filters.assessment_id"
              :options="lookups.assessments"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Assessment"
              @change="handleAssessmentChanged"
            />
          </a-col>

          <a-col :xs="24" :md="8">
            <a-select
              v-model:value="filters.assessment_schedule_id"
              :options="filteredSchedules"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Schedule"
              @change="loadAnalytics"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button block type="primary" @click="loadAnalytics">
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

      <a-spin :spinning="loading">
        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Participants" :value="summary.participants || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Attempts" :value="summary.attempts || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Generated Results" :value="summary.results || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Pending Results" :value="summary.pending_count || 0" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Pass Count" :value="summary.pass_count || 0" />
              <small>{{ summary.pass_percentage || 0 }}%</small>
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Fail Count" :value="summary.fail_count || 0" />
              <small>{{ summary.fail_percentage || 0 }}%</small>
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Average %" :value="summary.average_percentage || 0" suffix="%" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Average Marks" :value="summary.average_marks || 0" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :lg="12">
            <a-card title="Topic Performance">
              <PerformanceTable :items="analytics.topic_analysis" />
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="12">
            <a-card title="Difficulty Performance">
              <PerformanceTable :items="analytics.difficulty_analysis" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :lg="12">
            <a-card title="Question Type Performance">
              <PerformanceTable :items="analytics.question_type_analysis" />
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="12">
            <a-card title="Strengths / Weaknesses">
              <a-row :gutter="[12, 12]">
                <a-col :span="12">
                  <h4>Strengths</h4>
                  <a-list
                    size="small"
                    :data-source="strengths"
                    bordered
                  >
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.percentage }}%</span>
                      </a-list-item>
                    </template>
                  </a-list>
                </a-col>

                <a-col :span="12">
                  <h4>Weaknesses</h4>
                  <a-list
                    size="small"
                    :data-source="weaknesses"
                    bordered
                  >
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.percentage }}%</span>
                      </a-list-item>
                    </template>
                  </a-list>
                </a-col>
              </a-row>
            </a-card>
          </a-col>
        </a-row>

        <a-card title="Applicant Results">
          <a-table
            :columns="applicantColumns"
            :data-source="analytics.applicant_results || []"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'applicant'">
                <strong>{{ record.applicant_no }}</strong>
                <div>{{ record.applicant_name }}</div>
                <small>{{ record.cnic_bform }}</small>
              </template>

              <template v-else-if="column.key === 'assessment'">
                <strong>{{ record.assessment_title }}</strong>
                <div>{{ record.assessment_code }}</div>
                <small>{{ record.schedule_title }}</small>
              </template>

              <template v-else-if="column.key === 'roll'">
                <strong>{{ record.roll_no }}</strong>
                <div>Attempt: {{ record.attempt_no }}</div>
              </template>

              <template v-else-if="column.key === 'marks'">
                <div>Total: {{ record.total_marks }}</div>
                <div>Final: {{ record.final_marks }}</div>
                <small>{{ record.percentage }}%</small>
              </template>

              <template v-else-if="column.key === 'passed'">
                <a-tag :color="record.is_passed ? 'green' : 'red'">
                  {{ record.is_passed ? 'Passed' : 'Failed' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-spin>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const PerformanceTable = defineComponent({
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const columns = [
      { title: 'Label', dataIndex: 'label' },
      { title: 'Questions', dataIndex: 'total_questions', width: 100 },
      { title: 'Attempted', dataIndex: 'attempted', width: 100 },
      { title: 'Correct', dataIndex: 'correct', width: 90 },
      { title: 'Wrong', dataIndex: 'wrong', width: 90 },
      { title: 'Final Marks', dataIndex: 'final_marks', width: 110 },
      { title: 'Percentage', dataIndex: 'percentage', width: 120 },
    ]

    return () =>
      h('div', [
        h(
          'a-table',
          {
            columns,
            dataSource: props.items,
            rowKey: 'label',
            pagination: false,
            size: 'small',
          },
          {
            bodyCell: ({ column, record }: any) => {
              if (column.dataIndex === 'percentage') {
                return `${record.percentage || 0}%`
              }

              return record[column.dataIndex] ?? '-'
            },
          }
        ),
      ])
  },
})

const api = useApplicantPortalApi()

const loading = ref(false)

const filters = reactive<any>({
  assessment_id: null,
  assessment_schedule_id: null,
})

const lookups = reactive<any>({
  assessments: [],
  schedules: [],
})

const analytics = reactive<any>({
  summary: {},
  topic_analysis: [],
  difficulty_analysis: [],
  question_type_analysis: [],
  applicant_results: [],
})

const summary = computed(() => analytics.summary || {})

const strengths = computed(() => {
  return [...(analytics.topic_analysis || [])]
    .filter((item: any) => Number(item.percentage) >= 70)
    .sort((a: any, b: any) => Number(b.percentage) - Number(a.percentage))
    .slice(0, 5)
})

const weaknesses = computed(() => {
  return [...(analytics.topic_analysis || [])]
    .filter((item: any) => Number(item.percentage) < 50)
    .sort((a: any, b: any) => Number(a.percentage) - Number(b.percentage))
    .slice(0, 5)
})

const filteredSchedules = computed(() => {
  if (!filters.assessment_id) return lookups.schedules

  return lookups.schedules.filter((item: any) => {
    return Number(item.assessment_id) === Number(filters.assessment_id)
  })
})

const applicantColumns = [
  { title: 'Applicant', key: 'applicant' },
  { title: 'Assessment', key: 'assessment' },
  { title: 'Roll / Attempt', key: 'roll', width: 150 },
  { title: 'Marks', key: 'marks', width: 140 },
  { title: 'Passed', key: 'passed', width: 120 },
]

const loadLookups = async () => {
  const [assessments, schedules] = await Promise.all([
    api.getOptions('/dynamic-options/assessments'),
    api.getOptions('/dynamic-options/assessment-schedules'),
  ])

  lookups.assessments = assessments?.data || []
  lookups.schedules = schedules?.data || []
}

const loadAnalytics = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdminAssessmentAnalytics({ ...filters })
    const payload = response?.data || {}

    analytics.summary = payload.summary || {}
    analytics.topic_analysis = payload.topic_analysis || []
    analytics.difficulty_analysis = payload.difficulty_analysis || []
    analytics.question_type_analysis = payload.question_type_analysis || []
    analytics.applicant_results = payload.applicant_results || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load assessment analytics.')
  } finally {
    loading.value = false
  }
}

const handleAssessmentChanged = async () => {
  filters.assessment_schedule_id = null
  await loadAnalytics()
}

const resetFilters = async () => {
  filters.assessment_id = null
  filters.assessment_schedule_id = null
  await loadAnalytics()
}

onMounted(async () => {
  await loadLookups()
  await loadAnalytics()
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