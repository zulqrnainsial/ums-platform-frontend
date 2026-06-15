<template>
  <a-card>
    <div class="panel-header">
      <div>
        <h3>Bulk Question Import</h3>
        <p>
          Import questions from Excel. Select default values below. Rows can override these defaults if columns are provided in the file.
        </p>
      </div>

      <a-space>
        <a-button @click="downloadTemplate">
          Template Info
        </a-button>

        <a-button
  type="primary"
  :loading="uploading"
  :disabled="!canImport"
  @click="submitImport"
>
  Import Questions
</a-button>
      </a-space>
    </div>

    <a-alert
      type="info"
      show-icon
      class="mb-3"
      message="Excel file should contain one question per row. MCQ options can be provided as option_a, option_b, option_c, option_d and correct_options."
    />

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :md="8">
        <label class="form-label required">Question Bank</label>
        <a-select
          v-model:value="form.question_bank_id"
          :options="lookups.questionBanks"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Select question bank"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label required">Subject</label>
        <a-select
          v-model:value="form.assessment_subject_id"
          :options="lookups.subjects"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Select subject"
          @change="form.assessment_topic_id = null"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label">Topic</label>
        <a-select
          v-model:value="form.assessment_topic_id"
          :options="filteredTopics"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Select topic"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label required">Default Question Type</label>
        <a-select
          v-model:value="form.question_type_code"
          :options="lookups.questionTypes"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Select question type"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label">Default Difficulty</label>
        <a-select
          v-model:value="form.difficulty_code"
          :options="lookups.difficulties"
          allow-clear
          placeholder="Select difficulty"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label">Default Cognitive Level</label>
        <a-select
          v-model:value="form.cognitive_level_code"
          :options="lookups.cognitiveLevels"
          allow-clear
          placeholder="Select cognitive level"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label">Default Marks</label>
        <a-input-number
          v-model:value="form.marks"
          class="w-100"
          :min="0"
          :step="0.5"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label">Default Negative Marks</label>
        <a-input-number
          v-model:value="form.negative_marks"
          class="w-100"
          :min="0"
          :step="0.25"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label class="form-label">Default Time Seconds</label>
        <a-input-number
          v-model:value="form.time_seconds"
          class="w-100"
          :min="0"
        />
      </a-col>

      <a-col :xs="24">
        <label class="form-label required">Excel File</label>

        <a-upload
          :before-upload="beforeUpload"
          :max-count="1"
          accept=".xlsx,.xls"
          :file-list="fileList"
          @remove="removeFile"
        >
          <a-button>
            Select Excel File
          </a-button>
        </a-upload>
      </a-col>
    </a-row>

    <a-divider />

    <a-collapse>
      <a-collapse-panel key="columns" header="Required Excel Columns">
        <a-table
          :columns="templateColumns"
          :data-source="templateRows"
          :pagination="false"
          size="small"
          row-key="column"
        />
      </a-collapse-panel>
    </a-collapse>
<a-modal
  v-model:open="templateOpen"
  title="Question Import Template Columns"
  width="900px"
  :footer="null"
>
  <a-table
    :columns="templateColumns"
    :data-source="templateRows"
    :pagination="false"
    size="small"
    row-key="column"
  />
</a-modal>
    <a-modal
      v-model:open="resultOpen"
      title="Import Result"
      width="900px"
      :footer="null"
    >
      <template v-if="importResult">
        <a-descriptions bordered size="small" :column="3" class="mb-3">
          <a-descriptions-item label="Imported">
            {{ importResult.imported || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="Skipped">
            {{ importResult.skipped || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="Failed">
            {{ importResult.failed || 0 }}
          </a-descriptions-item>
        </a-descriptions>

        <a-alert
          v-if="importResult.message"
          type="success"
          show-icon
          class="mb-3"
          :message="importResult.message"
        />

        <a-table
          v-if="importResult.errors?.length"
          :data-source="importResult.errors"
          :pagination="{ pageSize: 10 }"
          size="small"
          row-key="row"
        >
          <a-table-column title="Row" data-index="row" width="90" />
          <a-table-column title="Message" data-index="message" />
        </a-table>
      </template>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const emit = defineEmits<{
  imported: []
}>()

const api = useApplicantPortalApi()

const uploading = ref(false)
const resultOpen = ref(false)
const importResult = ref<any>(null)
const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const templateOpen = ref(false)
const form = reactive<any>({
  question_bank_id: null,
  assessment_subject_id: null,
  assessment_topic_id: null,
  question_type_code: 'mcq_single',
  difficulty_code: 'medium',
  cognitive_level_code: 'understanding',
  marks: 1,
  negative_marks: 0,
  time_seconds: null,
})

const lookups = reactive<any>({
  questionBanks: [],
  subjects: [],
  topics: [],
  questionTypes: [],
  difficulties: [],
  cognitiveLevels: [],
})

const templateColumns = [
  { title: 'Column', dataIndex: 'column', width: 230 },
  { title: 'Required', dataIndex: 'required', width: 120 },
  { title: 'Description', dataIndex: 'description' },
]

const templateRows = [
  {
    column: 'question_text',
    required: 'Yes',
    description: 'Main question text.',
  },
  {
    column: 'question_type_code',
    required: 'No',
    description: 'mcq_single, mcq_multiple, true_false, short_answer, numeric. If empty, selected default is used.',
  },
  {
    column: 'difficulty_code',
    required: 'No',
    description: 'easy, medium, hard. If empty, selected default is used.',
  },
  {
    column: 'cognitive_level_code',
    required: 'No',
    description: 'remembering, understanding, applying, analyzing, evaluating, creating.',
  },
  {
    column: 'topic_code',
    required: 'No',
    description: 'Topic code. If empty, selected default topic is used.',
  },
  {
    column: 'marks',
    required: 'No',
    description: 'Marks for this question.',
  },
  {
    column: 'negative_marks',
    required: 'No',
    description: 'Negative marks for wrong answer.',
  },
  {
    column: 'option_a, option_b, option_c, option_d',
    required: 'For MCQ',
    description: 'Options for MCQ questions.',
  },
  {
    column: 'correct_options',
    required: 'For MCQ',
    description: 'Example: A or A,C.',
  },
  {
    column: 'answer_text',
    required: 'For text answer',
    description: 'Correct answer for short answer/fill blank/code type questions.',
  },
  {
    column: 'answer_number',
    required: 'For numeric',
    description: 'Correct numeric answer.',
  },
  {
    column: 'explanation',
    required: 'No',
    description: 'Answer explanation.',
  },
]


const filteredTopics = computed(() => {
  if (!form.assessment_subject_id) return lookups.topics

  return lookups.topics.filter((topic: any) => {
    return Number(topic.assessment_subject_id) === Number(form.assessment_subject_id)
  })
})
const canImport = computed(() => {
  return !!(
    form.question_bank_id &&
    form.assessment_subject_id &&
    form.question_type_code &&
    selectedFile.value
  )
})
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
      name: item.name || item.title || item.label,
    }
  })
}

const fallbackQuestionTypes = [
  { label: 'MCQ Single', value: 'mcq_single', code: 'mcq_single' },
  { label: 'MCQ Multiple', value: 'mcq_multiple', code: 'mcq_multiple' },
  { label: 'True / False', value: 'true_false', code: 'true_false' },
  { label: 'Short Answer', value: 'short_answer', code: 'short_answer' },
  { label: 'Numeric', value: 'numeric', code: 'numeric' },
]

const fallbackDifficulties = [
  { label: 'Easy', value: 'easy', code: 'easy' },
  { label: 'Medium', value: 'medium', code: 'medium' },
  { label: 'Hard', value: 'hard', code: 'hard' },
]

const fallbackCognitiveLevels = [
  { label: 'Remembering', value: 'remembering', code: 'remembering' },
  { label: 'Understanding', value: 'understanding', code: 'understanding' },
  { label: 'Applying', value: 'applying', code: 'applying' },
  { label: 'Analyzing', value: 'analyzing', code: 'analyzing' },
  { label: 'Evaluating', value: 'evaluating', code: 'evaluating' },
  { label: 'Creating', value: 'creating', code: 'creating' },
]

const loadLookups = async () => {
  const [
    banks,
    subjects,
    topics,
    questionTypes,
    difficulties,
    cognitiveLevels,
  ] = await Promise.all([
    api.getOptions('/dynamic-options/question-banks').catch(() => ({ data: [] })),
    api.getOptions('/dynamic-options/assessment-subjects').catch(() => ({ data: [] })),
    api.getOptions('/dynamic-options/assessment-topics').catch(() => ({ data: [] })),

    // Correct existing backend route:
    api.getOptions('/dynamic-options/lookups/QUESTION_TYPE').catch(() => ({ data: [] })),
    api.getOptions('/dynamic-options/lookups/QUESTION_DIFFICULTY').catch(() => ({ data: [] })),
    api.getOptions('/dynamic-options/lookups/COGNITIVE_LEVEL').catch(() => ({ data: [] })),
  ])

  lookups.questionBanks = normalizeIdOptions(unwrapOptions(banks))
  lookups.subjects = normalizeIdOptions(unwrapOptions(subjects))
  lookups.topics = normalizeIdOptions(unwrapOptions(topics))

  const typeOptions = normalizeCodeOptions(unwrapOptions(questionTypes))
  const difficultyOptions = normalizeCodeOptions(unwrapOptions(difficulties))
  const cognitiveOptions = normalizeCodeOptions(unwrapOptions(cognitiveLevels))

  lookups.questionTypes = typeOptions.length ? typeOptions : fallbackQuestionTypes
  lookups.difficulties = difficultyOptions.length ? difficultyOptions : fallbackDifficulties
  lookups.cognitiveLevels = cognitiveOptions.length ? cognitiveOptions : fallbackCognitiveLevels
}

const beforeUpload = (file: File) => {
  selectedFile.value = file
  fileList.value = [file]
  return false
}

const removeFile = () => {
  selectedFile.value = null
  fileList.value = []
}

const validateForm = () => {
  if (!form.question_bank_id) {
    message.error('Question bank is required.')
    return false
  }

  if (!form.assessment_subject_id) {
    message.error('Subject is required.')
    return false
  }

  if (!form.question_type_code) {
    message.error('Question type is required.')
    return false
  }

  if (!selectedFile.value) {
    message.error('Excel file is required.')
    return false
  }

  return true
}

const submitImport = async () => {
  if (!validateForm()) return

  uploading.value = true

  try {
    const data = new FormData()

    data.append('file', selectedFile.value as File)
    data.append('question_bank_id', String(form.question_bank_id))
    data.append('assessment_subject_id', String(form.assessment_subject_id))

    if (form.assessment_topic_id) {
      data.append('assessment_topic_id', String(form.assessment_topic_id))
    }

    data.append('question_type_code', String(form.question_type_code || ''))
    data.append('difficulty_code', String(form.difficulty_code || ''))
    data.append('cognitive_level_code', String(form.cognitive_level_code || ''))
    data.append('marks', String(form.marks || 1))
    data.append('negative_marks', String(form.negative_marks || 0))

    if (form.time_seconds !== null && form.time_seconds !== undefined && form.time_seconds !== '') {
      data.append('time_seconds', String(form.time_seconds))
    }

    const response: any = await api.importAssessmentQuestionsExcel(data)

    importResult.value = response?.data || {
      imported: 0,
      skipped: 0,
      failed: 0,
      message: response?.message || 'Import completed.',
    }

    resultOpen.value = true
    selectedFile.value = null
    fileList.value = []

    emit('imported')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to import questions.')
  } finally {
    uploading.value = false
  }
}

const downloadTemplate = () => {
  templateOpen.value = true
}

onMounted(loadLookups)
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin-bottom: 4px;
}

.panel-header p {
  margin-bottom: 0;
  color: #888;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.required::before {
  content: '* ';
  color: red;
}

.mb-3 {
  margin-bottom: 16px;
}

.w-100 {
  width: 100%;
}
</style>