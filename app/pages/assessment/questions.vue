<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Question Editor</h2>
          <p>Create questions with options, answer keys, explanations, topics and difficulty levels.</p>
        </div>

        <a-space>
        <a-button @click="loadRows">
            Refresh
        </a-button>
<NuxtLink to="/assessment/question-bank-quality">
  <a-button>
    Quality Dashboard
  </a-button>
</NuxtLink>
        <a-button @click="importOpen = true">
            Import
        </a-button>

        <a-button type="primary" @click="openCreate">
            Create
        </a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-select
              v-model:value="filters.question_bank_id"
              :options="lookups.questionBanks"
              placeholder="Question Bank"
              allow-clear
              show-search
              option-filter-prop="label"
              @change="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.question_type_code"
              :options="lookups.questionTypes"
              placeholder="Question Type"
              allow-clear
              @change="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.difficulty_code"
              :options="lookups.difficulties"
              placeholder="Difficulty"
              allow-clear
              @change="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="8">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search question"
              allow-clear
              @search="loadRows"
            />
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
            <template v-if="column.key === 'question'">
              <strong>{{ record.question_type_code }}</strong>
              <div>{{ record.question_text }}</div>
              <small>{{ record.bank?.name || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'classification'">
              <a-space wrap>
                <a-tag>{{ record.difficulty_code || '-' }}</a-tag>
                <a-tag>{{ record.cognitive_level_code || '-' }}</a-tag>
                <a-tag v-if="record.bloom_level_code">{{ record.bloom_level_code }}</a-tag>
                <a-tag v-if="record.obe_level_code">{{ record.obe_level_code }}</a-tag>
              </a-space>
            </template>

            <template v-else-if="column.key === 'marks'">
              <div>Marks: {{ record.default_marks }}</div>
              <div>Negative: {{ record.default_negative_marks }}</div>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag>{{ record.approval_status_code }}</a-tag>
              <a-tag :color="record.is_active ? 'green' : 'red'">
                {{ record.is_active ? 'Active' : 'Inactive' }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button size="small" @click="openEdit(record)">
                  Edit
                </a-button>
                <a-popconfirm title="Delete this question?" @confirm="remove(record)">
                  <a-button size="small" danger>
                    Delete
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-drawer
        v-model:open="editorOpen"
        width="980"
        :title="editingId ? 'Edit Question' : 'Create Question'"
      >
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="8">
              <a-form-item label="Question Bank" required>
                <a-select v-model:value="form.question_bank_id" :options="lookups.questionBanks" show-search option-filter-prop="label" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Subject">
                <a-select v-model:value="form.assessment_subject_id" :options="lookups.subjects" allow-clear show-search option-filter-prop="label" @change="form.assessment_topic_id = null" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Topic">
                <a-select v-model:value="form.assessment_topic_id" :options="filteredTopics" allow-clear show-search option-filter-prop="label" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Question Type" required>
                <a-select v-model:value="form.question_type_code" :options="lookups.questionTypes" @change="resetTypeSpecificData" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Difficulty">
                <a-select v-model:value="form.difficulty_code" :options="lookups.difficulties"  @change="userOverrodeSuggestion = true" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
  <a-form-item label="Bloom Level">
    <a-select
      v-model:value="form.bloom_level_code"
      :options="lookups.bloomLevels"
      allow-clear
      placeholder="Select Bloom level"
      @change="userOverrodeSuggestion = true"
    />
  </a-form-item>
</a-col>

<a-col :xs="24" :md="8">
  <a-form-item label="Difficulty">
    <a-select v-model:value="form.difficulty_code" :options="lookups.difficulties" />
  </a-form-item>
</a-col>

<a-col :xs="24" :md="8">
  <a-form-item label="Bloom Level">
    <a-select
      v-model:value="form.bloom_level_code"
      :options="lookups.bloomLevels"
      allow-clear
      placeholder="Select Bloom level"
    />
  </a-form-item>
</a-col>
<a-col :xs="24">
  <a-space>
    <a-button
  ghost
  :loading="suggestingMetadata"
  @click="suggestMetadata(true)"
>
  Suggest Again
</a-button>

    <a-tag v-if="metadataSuggestion?.confidence">
      Confidence: {{ metadataSuggestion.confidence }}
    </a-tag>
  </a-space>

  <a-alert
    v-if="metadataSuggestion?.reason"
    type="info"
    show-icon
    class="mt-2"
    :message="metadataSuggestion.reason"
  />
</a-col>
            <a-col :xs="24">
  <a-form-item label="Question Rich Content" required>
    <AppRichTextEditor
      v-model="form.question_html"
      placeholder="Write the question with formatting."
      @plain-text="form.question_text = $event"
    />
  </a-form-item>
</a-col>

<a-col :xs="24">
  <a-form-item label="Question Plain Text">
    <a-textarea
      v-model:value="form.question_text"
      :rows="2"
      placeholder="Auto-filled from rich content. You may edit it for search/display."
    />
  </a-form-item>
</a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Marks">
                <a-input-number v-model:value="form.default_marks" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Negative Marks">
                <a-input-number v-model:value="form.default_negative_marks" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Time Seconds">
                <a-input-number v-model:value="form.default_time_seconds" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Active">
                <a-switch v-model:checked="form.is_active" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-divider />

          <QuestionOptionsEditor
            v-if="usesOptions"
            v-model:options="form.options"
            :question-type="form.question_type_code"
          />

          <QuestionAnswerKeyEditor
            v-if="usesAnswerKeys"
            v-model:answer-keys="form.answer_keys"
            :question-type="form.question_type_code"
          />

          <a-divider />

          <a-form-item label="Explanation">
            <a-textarea v-model:value="form.explanation" :rows="3" />
          </a-form-item>

          <a-form-item label="Explanation Rich Content">
  <AppRichTextEditor
    v-model="form.explanation_html"
    placeholder="Write formatted explanation."
  />
</a-form-item>

          <div class="drawer-actions">
            <a-button @click="editorOpen = false">
              Cancel
            </a-button>
            <a-button type="primary" :loading="saving" @click="save">
              Save Question
            </a-button>
          </div>
        </a-form>
      </a-drawer>
<a-modal
  v-model:open="importOpen"
  title="Import Questions"
  width="1000px"
  :footer="null"
>
  <QuestionImportPanel @imported="handleImported" />
</a-modal>
      
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '~/components/layout/AppLayout.vue'
import QuestionOptionsEditor from '~/components/assessment/QuestionOptionsEditor.vue'
import QuestionAnswerKeyEditor from '~/components/assessment/QuestionAnswerKeyEditor.vue'
import { message } from 'ant-design-vue'
import QuestionImportPanel from '~/components/assessment/QuestionImportPanel.vue'
import AppRichTextEditor from '~/components/common/AppRichTextEditor.vue'
const api = useApplicantPortalApi()
const genApi = useApi()

const loading = ref(false)
const saving = ref(false)
const editorOpen = ref(false)
const importOpen = ref(false)
const editingId = ref<number | null>(null)
const rows = ref<any[]>([])
const suggestingMetadata = ref(false)
const metadataSuggestion = ref<any>(null)
const suggestionTimer = ref<any>(null)
const userOverrodeSuggestion = ref(false)
const filters = reactive<any>({
  question_bank_id: null,
  question_type_code: null,
  difficulty_code: null,
  search: '',
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
})

const lookups = reactive<any>({
  questionBanks: [],
  subjects: [],
  topics: [],
  questionTypes: [],
  difficulties: [],
  cognitiveLevels: [],
  bloomLevels: [],
})

const emptyForm = () => ({
  question_bank_id: null,
  assessment_subject_id: null,
  assessment_topic_id: null,
  question_type_code: 'mcq_single',
  difficulty_code: 'medium',
  cognitive_level_code: 'understanding',
  bloom_level_code: 'understand',
metadata_json: null,
  question_text: '',
  question_html: '',
  default_marks: 1,
  default_negative_marks: 0,
  default_time_seconds: null,
  explanation: '',
  explanation_html: '',
  approval_status_code: 'draft',
  is_active: true,
  options: [
  { option_key: 'A', option_text: '', option_html: '', is_correct: true, display_order: 1 },
  { option_key: 'B', option_text: '', option_html: '', is_correct: false, display_order: 2 },
  { option_key: 'C', option_text: '', option_html: '', is_correct: false, display_order: 3 },
  { option_key: 'D', option_text: '', option_html: '', is_correct: false, display_order: 4 },
],
  answer_keys: [],
})

const form = reactive<any>(emptyForm())

const columns = [
  { title: 'Question', key: 'question' },
  { title: 'Classification', key: 'classification', width: 180 },
  { title: 'Marks', key: 'marks', width: 140 },
  { title: 'Status', key: 'status', width: 150 },
  { title: 'Action', key: 'action', width: 150 },
]

const usesOptions = computed(() => {
  const typeCode = String(form.question_type_code || '')

  return [
    'mcq_single',
    'mcq_multiple',
    'true_false',
    'matching',
    'ordering',
  ].includes(typeCode)
})
const handleImported = async () => {
  importOpen.value = false
  await loadRows()
}
const usesAnswerKeys = computed(() => {
  const typeCode = String(form.question_type_code || '')

  return [
    'short_answer',
    'long_answer',
    'numeric',
    'fill_blank',
    'code',
  ].includes(typeCode)
})

const filteredTopics = computed(() => {
  if (!form.assessment_subject_id) return lookups.topics

  return lookups.topics.filter((x: any) => {
    return Number(x.assessment_subject_id) === Number(form.assessment_subject_id)
  })
})
const normalizeCodeOptions = (items: any[]) => {
  return items.map((item: any) => ({
    label: item.label || item.name || item.code,
    value: item.code || item.value,
    code: item.code || item.value,
    name: item.name || item.label,
  }))
}
const loadLookups = async () => {
  const [
    banks,
    subjects,
    topics,
    types,
    difficulties,
    cognitiveLevels,
    bloomLevels,
  ] = await Promise.all([
    api.getOptions('/dynamic-options/question-banks'),
    api.getOptions('/dynamic-options/assessment-subjects'),
    api.getOptions('/dynamic-options/assessment-topics'),
    api.getOptions('/dynamic-options/lookups/QUESTION_TYPE'),
    api.getOptions('/dynamic-options/lookups/QUESTION_DIFFICULTY'),
    api.getOptions('/dynamic-options/lookups/COGNITIVE_LEVEL'),
    api.getOptions('/dynamic-options/lookups/BLOOM_LEVEL').catch(() => ({ data: [] })),
  ])

  lookups.questionBanks = banks?.data || []
  lookups.subjects = subjects?.data || []
  lookups.topics = topics?.data || []
  lookups.questionTypes = normalizeCodeOptions(types?.data || [])
  lookups.difficulties = normalizeCodeOptions(difficulties?.data || [])
  lookups.cognitiveLevels = normalizeCodeOptions(cognitiveLevels?.data || [])
  lookups.bloomLevels = normalizeCodeOptions(bloomLevels?.data || [])

if (!lookups.bloomLevels.length) {
  lookups.bloomLevels = [
    { label: 'Remember', value: 'remember', code: 'remember' },
    { label: 'Understand', value: 'understand', code: 'understand' },
    { label: 'Apply', value: 'apply', code: 'apply' },
    { label: 'Analyze', value: 'analyze', code: 'analyze' },
    { label: 'Evaluate', value: 'evaluate', code: 'evaluate' },
    { label: 'Create', value: 'create', code: 'create' },
  ]
}

}

const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await api.getQuestionEditorList({
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
    message.error(error?.data?.message || 'Unable to load questions.')
  } finally {
    loading.value = false
  }
}

const handleTableChanged = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadRows()
}

const openCreate = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  editorOpen.value = true
}

const openEdit = async (record: any) => {
  editingId.value = record.id
  editorOpen.value = true

  const response: any = await api.getQuestionEditorItem(record.id)
  const data = response?.data || {}

  Object.assign(form, emptyForm(), {
    ...data,
    options: data.options || [],
    answer_keys: data.answer_keys || [],
  })
}

const resetTypeSpecificData = () => {
  const typeCode = String(form.question_type_code || '')

  if (['mcq_single', 'mcq_multiple'].includes(typeCode)) {
    form.options = [
  { option_key: 'A', option_text: '', option_html: '', is_correct: true, display_order: 1 },
  { option_key: 'B', option_text: '', option_html: '', is_correct: false, display_order: 2 },
  { option_key: 'C', option_text: '', option_html: '', is_correct: false, display_order: 3 },
  { option_key: 'D', option_text: '', option_html: '', is_correct: false, display_order: 4 },
]
    form.answer_keys = []
    return
  }

  if (typeCode === 'true_false') {
    form.options = [
  { option_key: 'A', option_text: 'True', option_html: 'True', is_correct: true, display_order: 1 },
  { option_key: 'B', option_text: 'False', option_html: 'False', is_correct: false, display_order: 2 },
]
    form.answer_keys = []
    return
  }

  if (['matching', 'ordering'].includes(typeCode)) {
    form.options = [
  { option_key: 'A', option_text: '', option_html: '', is_correct: false, display_order: 1 },
  { option_key: 'B', option_text: '', option_html: '', is_correct: false, display_order: 2 },
]
    form.answer_keys = []
    return
  }

  if (['short_answer', 'long_answer', 'numeric', 'fill_blank', 'code'].includes(typeCode)) {
    form.options = []
    form.answer_keys = [
      {
        answer_text: '',
        answer_number: null,
        case_sensitive: false,
        numeric_tolerance: null,
        status_code: 'active',
      },
    ]
    return
  }

  form.options = []
  form.answer_keys = []
}
const stripHtml = (html: string) => {
  if (!html) return ''

  const div = document.createElement('div')
  div.innerHTML = html

  return div.innerText || div.textContent || ''
}
const suggestMetadata = async (manual = false) => {
  const questionText = form.question_text || stripHtml(form.question_html || '')

  if (!questionText) {
    message.warning('Please enter question text before generating suggestion.')
    return
  }

  suggestingMetadata.value = true

  try {
    const response: any = await genApi.apiFetch('/assessment/questions/suggest-metadata', {
      method: 'POST',
      body: {
        question_text: questionText,
        question_html: form.question_html,
      },
    })

    const data = response?.data?.data || response?.data || response || {}

    metadataSuggestion.value = data

    const suggestions = data.suggestions || {}

    if (suggestions.bloom_level_code && (!userOverrodeSuggestion.value || manual)) {
  form.bloom_level_code = suggestions.bloom_level_code
}

if (suggestions.difficulty_code && (!userOverrodeSuggestion.value || manual)) {
  form.difficulty_code = suggestions.difficulty_code
}

if (suggestions.cognitive_level_code && (!userOverrodeSuggestion.value || manual)) {
  form.cognitive_level_code = suggestions.cognitive_level_code
}

    form.metadata_json = {
      ...(form.metadata_json || {}),
      nlp_suggestion: {
        detected_action_verbs: data.detected_action_verbs || [],
        suggestions,
        confidence: data.confidence || null,
        reason: data.reason || null,
        rule_engine_version: data.rule_engine_version || 'rule_based_v1',
        suggested_at: new Date().toISOString(),
      },
    }

    message.success('Metadata suggestion applied. You can review and override before saving.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to generate metadata suggestion.')
  } finally {
    suggestingMetadata.value = false
  }
}
const save = async () => {
  saving.value = true

  try {
    const payload = {
      ...form,
      question_type_code: String(form.question_type_code || ''),
      difficulty_code: form.difficulty_code ? String(form.difficulty_code) : null,
      cognitive_level_code: form.cognitive_level_code ? String(form.cognitive_level_code) : null,
      bloom_level_code: form.bloom_level_code ? String(form.bloom_level_code) : null,
      metadata_json: form.metadata_json || null,
      question_text: form.question_text || stripHtml(form.question_html || ''),
    }

        if (editingId.value) {
        await api.updateQuestionEditorItem(editingId.value, payload)
        } else {
        await api.createQuestionEditorItem(payload)
        }

    message.success('Question saved successfully.')
    editorOpen.value = false
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save question.')
  } finally {
    saving.value = false
  }
}

const remove = async (record: any) => {
  await api.deleteQuestionEditorItem(record.id)
  message.success('Question deleted successfully.')
  await loadRows()
}

const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).filter(x => x.trim())
  const headers = lines.shift()?.split(',').map(x => x.trim()) || []

  return lines.map(line => {
    const values = line.split(',').map(x => x.trim())
    const row: any = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    return row
  })
}
const scheduleMetadataSuggestion = () => {
  const questionText = form.question_text || stripHtml(form.question_html || '')

  if (!questionText || questionText.trim().length < 10) {
    return
  }

  if (suggestionTimer.value) {
    clearTimeout(suggestionTimer.value)
  }

  suggestionTimer.value = setTimeout(() => {
    suggestMetadata(false)
  }, 800)
}

watch(
  () => form.question_text,
  () => {
    scheduleMetadataSuggestion()
  }
)

watch(
  () => form.question_html,
  () => {
    const plainText = stripHtml(form.question_html || '')

    if (plainText && plainText !== form.question_text) {
      form.question_text = plainText
    }

    scheduleMetadataSuggestion()
  }
)
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
  margin-bottom: 0;
  color: #888;
}

.mb-3 {
  margin-bottom: 16px;
}

.w-100 {
  width: 100%;
}
.mt-2 {
  margin-top: 8px;
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.mt-3 {
  margin-top: 16px;
}
</style>