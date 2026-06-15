<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Question Bank Quality Dashboard</h2>
          <p>Review question bank completeness, metadata coverage, Bloom distribution, and missing quality items.</p>
        </div>

        <a-space>
          <a-button @click="loadDashboard">Refresh</a-button>
          <NuxtLink to="/assessment/questions">
            <a-button type="primary">Question Editor</a-button>
          </NuxtLink>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.question_bank_id"
              :options="lookups.questionBanks"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Question Bank"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.assessment_subject_id"
              :options="lookups.subjects"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Subject"
              @change="filters.assessment_topic_id = undefined"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.assessment_topic_id"
              :options="filteredTopics"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Topic"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
              v-model:value="filters.difficulty_code"
              :options="lookups.difficulties"
              allow-clear
              placeholder="Difficulty"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-select
              v-model:value="filters.bloom_level_code"
              :options="lookups.bloomLevels"
              allow-clear
              placeholder="Bloom"
            />
          </a-col>

          <a-col :xs="24" :md="2">
            <a-button block type="primary" @click="loadDashboard">
              Apply
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-spin :spinning="loading">
        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Total Questions" :value="summary.total_questions || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Quality Score" :value="summary.quality_score || 0" suffix="%" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Missing Answer Key" :value="summary.missing_answer_key || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Missing Bloom Level" :value="summary.missing_bloom || 0" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Missing Difficulty" :value="summary.missing_difficulty || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Missing Options" :value="summary.missing_options || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Missing Explanation" :value="summary.missing_explanation || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :sm="12" :lg="6">
            <a-card>
              <a-statistic title="Missing Topic" :value="summary.missing_topic || 0" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :lg="12">
            <a-card title="Bloom Level Distribution">
              <SimpleCountTable :items="dashboard.by_bloom_level" />
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="12">
            <a-card title="Difficulty Distribution">
              <SimpleCountTable :items="dashboard.by_difficulty" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :lg="12">
            <a-card title="Question Type Distribution">
              <SimpleCountTable :items="dashboard.by_question_type" />
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="12">
            <a-card title="Topic Coverage">
              <SimpleCountTable :items="dashboard.by_topic" />
            </a-card>
          </a-col>
        </a-row>

        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :lg="12">
            <a-card title="Subject Coverage">
              <SimpleCountTable :items="dashboard.by_subject" />
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="12">
            <a-card title="Question Bank Coverage">
              <SimpleCountTable :items="dashboard.by_question_bank" />
            </a-card>
          </a-col>
        </a-row>

        <a-card title="Questions Requiring Attention">
          <a-table
            :columns="issueColumns"
            :data-source="dashboard.quality_issues || []"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'question'">
                <strong>#{{ record.id }}</strong>
                <div>{{ record.question_text }}</div>
                <small>
                  {{ record.question_bank_name || '-' }} |
                  {{ record.subject_name || '-' }} |
                  {{ record.topic_name || '-' }}
                </small>
              </template>

              <template v-else-if="column.key === 'classification'">
                <a-space wrap>
                  <a-tag>{{ record.question_type_code || '-' }}</a-tag>
                  <a-tag>{{ record.difficulty_code || 'No Difficulty' }}</a-tag>
                  <a-tag>{{ record.bloom_level_code || 'No Bloom' }}</a-tag>
                </a-space>
              </template>

              <template v-else-if="column.key === 'counts'">
                <div>Options: {{ record.option_count }}</div>
                <div>Answer Keys: {{ record.answer_key_count }}</div>
              </template>

              <template v-else-if="column.key === 'issues'">
                <a-space wrap>
                  <a-tag
                    v-for="issue in record.issues || []"
                    :key="issue"
                    color="red"
                  >
                    {{ issue }}
                  </a-tag>
                </a-space>
              </template>

              <template v-else-if="column.key === 'action'">
                <NuxtLink :to="`/assessment/questions?edit=${record.id}`">
                  <a-button size="small">Fix</a-button>
                </NuxtLink>
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

const SimpleCountTable = defineComponent({
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  template: `
    <a-table
      :columns="columns"
      :data-source="items"
      row-key="label"
      size="small"
      :pagination="false"
    />
  `,
  setup() {
    return {
      columns: [
        { title: 'Label', dataIndex: 'label' },
        { title: 'Total', dataIndex: 'total', width: 100 },
      ],
    }
  },
})

const api = useApi()

const loading = ref(false)

const dashboard = ref<any>({
  summary: {},
  by_question_bank: [],
  by_subject: [],
  by_topic: [],
  by_question_type: [],
  by_difficulty: [],
  by_cognitive_level: [],
  by_bloom_level: [],
  quality_issues: [],
})

const filters = reactive<any>({
  question_bank_id: undefined,
  assessment_subject_id: undefined,
  assessment_topic_id: undefined,
  difficulty_code: undefined,
  bloom_level_code: undefined,
})

const lookups = reactive<any>({
  questionBanks: [],
  subjects: [],
  topics: [],
  difficulties: [],
  bloomLevels: [],
})

const summary = computed(() => dashboard.value?.summary || {})

const filteredTopics = computed(() => {
  if (!filters.assessment_subject_id) {
    return lookups.topics
  }

  return lookups.topics.filter((topic: any) => {
    return Number(topic.assessment_subject_id) === Number(filters.assessment_subject_id)
  })
})

const issueColumns = [
  { title: 'Question', key: 'question' },
  { title: 'Classification', key: 'classification', width: 260 },
  { title: 'Counts', key: 'counts', width: 140 },
  { title: 'Issues', key: 'issues' },
  { title: 'Action', key: 'action', width: 90 },
]

const unwrapOptions = (response: any) => {
  const rows = response?.data?.data || response?.data || response || []
  return Array.isArray(rows) ? rows : []
}

const normalizeIdOptions = (items: any[]) => {
  return (items || []).map((item: any) => {
    const value = Number(item.value ?? item.id)

    return {
      label: item.label || item.name || item.title || item.code || `Option #${value}`,
      value,
      id: value,
      code: item.code,
      name: item.name || item.title || item.label,
      assessment_subject_id: item.assessment_subject_id
        ? Number(item.assessment_subject_id)
        : null,
    }
  })
}

const normalizeCodeOptions = (items: any[]) => {
  return (items || []).map((item: any) => {
    const value = String(item.value ?? item.code ?? item.id)

    return {
      label: item.label || item.name || item.title || item.code || value,
      value,
      code: String(item.code ?? item.value ?? value),
    }
  })
}

const loadLookups = async () => {
  const [
    banks,
    subjects,
    topics,
    difficulties,
    bloomLevels,
  ] = await Promise.all([
    api.apiFetch('/dynamic-options/question-banks').catch(() => ({ data: [] })),
    api.apiFetch('/dynamic-options/assessment-subjects').catch(() => ({ data: [] })),
    api.apiFetch('/dynamic-options/assessment-topics').catch(() => ({ data: [] })),
    api.apiFetch('/dynamic-options/lookups/QUESTION_DIFFICULTY').catch(() => ({ data: [] })),
    api.apiFetch('/dynamic-options/lookups/BLOOM_LEVEL').catch(() => ({ data: [] })),
  ])

  lookups.questionBanks = normalizeIdOptions(unwrapOptions(banks))
  lookups.subjects = normalizeIdOptions(unwrapOptions(subjects))
  lookups.topics = normalizeIdOptions(unwrapOptions(topics))
  lookups.difficulties = normalizeCodeOptions(unwrapOptions(difficulties))

  const bloomOptions = normalizeCodeOptions(unwrapOptions(bloomLevels))

  lookups.bloomLevels = bloomOptions.length
    ? bloomOptions
    : [
        { label: 'Remember', value: 'remember', code: 'remember' },
        { label: 'Understand', value: 'understand', code: 'understand' },
        { label: 'Apply', value: 'apply', code: 'apply' },
        { label: 'Analyze', value: 'analyze', code: 'analyze' },
        { label: 'Evaluate', value: 'evaluate', code: 'evaluate' },
        { label: 'Create', value: 'create', code: 'create' },
      ]
}

const cleanFilters = () => {
  const payload: any = {}

  Object.keys(filters).forEach((key) => {
    const value = filters[key]

    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value
    }
  })

  return payload
}

const loadDashboard = async () => {
  loading.value = true

  try {
    const response: any = await api.apiFetch('/assessment/questions/quality-dashboard', {
      query: cleanFilters(),
    })

    dashboard.value = response?.data?.data || response?.data || response || dashboard.value
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load question bank quality dashboard.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadLookups()
  await loadDashboard()
})
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>