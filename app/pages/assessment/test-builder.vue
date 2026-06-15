<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Assessment Test Builder</h2>
          <p>Create sections and assign questions in bulk from question banks.</p>
        </div>

        <a-space>
          <a-button @click="loadBuilder" :disabled="!selectedAssessmentId">
            Refresh
          </a-button>
          <a-button type="primary" @click="openSectionCreate" :disabled="!selectedAssessmentId">
            Add Section
          </a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="12">
            <a-form-item label="Assessment / Test">
              <a-select
                v-model:value="selectedAssessmentId"
                :options="lookups.assessments"
                show-search
                option-filter-prop="label"
                placeholder="Select assessment/test"
                @change="loadBuilder"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <a-card v-if="builder.assessment" class="mb-3">
        <a-descriptions bordered size="small" :column="3">
          <a-descriptions-item label="Code">
            {{ builder.assessment.code }}
          </a-descriptions-item>
          <a-descriptions-item label="Title">
            {{ builder.assessment.title }}
          </a-descriptions-item>
          <a-descriptions-item label="Purpose">
            {{ builder.assessment.purpose_code }}
          </a-descriptions-item>
          <a-descriptions-item label="Mode">
            {{ builder.assessment.mode_code }}
          </a-descriptions-item>
          <a-descriptions-item label="Status">
            {{ builder.assessment.status_code }}
          </a-descriptions-item>
          <a-descriptions-item label="Duration">
            {{ builder.assessment.duration_minutes || '-' }} minutes
          </a-descriptions-item>
          <a-descriptions-item label="Sections">
            {{ builder.summary?.section_count || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="Questions">
            {{ builder.summary?.question_count || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="Total Marks">
            {{ builder.summary?.total_marks || 0 }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-empty v-if="!selectedAssessmentId" description="Select an assessment/test to start building." />

      <a-collapse v-if="builder.assessment" accordion>
        <a-collapse-panel
          v-for="section in builder.assessment.sections"
          :key="section.id"
          :header="`${section.section_code} - ${section.section_title}`"
        >
          <template #extra>
            <a-space @click.stop>
              <a-button size="small" @click="openBulkAssign(section)">
                Bulk Assign
              </a-button>
              <a-button size="small" @click="openSectionEdit(section)">
                Edit
              </a-button>
              <a-popconfirm title="Delete this section and its assigned questions?" @confirm="deleteSection(section)">
                <a-button size="small" danger>
                  Delete
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>

          <a-descriptions size="small" bordered :column="4" class="mb-3">
            <a-descriptions-item label="Subject">
              {{ section.subject?.name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Questions">
              {{ section.questions?.length || 0 }}
            </a-descriptions-item>
            <a-descriptions-item label="Total Marks">
              {{ section.total_marks || 0 }}
            </a-descriptions-item>
            <a-descriptions-item label="Duration">
              {{ section.duration_minutes || '-' }}
            </a-descriptions-item>
          </a-descriptions>

          <a-table
            :data-source="section.questions || []"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <a-table-column title="#" data-index="display_order" width="70" />
            <a-table-column title="Question">
              <template #default="{ record }">
                <div>{{ record.question?.question_text }}</div>
                <small>
                  {{ record.question?.question_type_code }} |
                  {{ record.question?.difficulty_code }}
                </small>
              </template>
            </a-table-column>
            <a-table-column title="Marks" data-index="marks" width="100" />
            <a-table-column title="Negative" data-index="negative_marks" width="100" />
            <a-table-column title="Action" width="100">
              <template #default="{ record }">
                <a-popconfirm title="Remove this question from test?" @confirm="removeQuestion(record)">
                  <a-button size="small" danger>
                    Remove
                  </a-button>
                </a-popconfirm>
              </template>
            </a-table-column>
          </a-table>
        </a-collapse-panel>
      </a-collapse>

      <a-modal
        v-model:open="sectionOpen"
        :title="sectionForm.id ? 'Edit Section' : 'Add Section'"
        @ok="saveSection"
      >
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Section Code" required>
                <a-input v-model:value="sectionForm.section_code" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Section Title" required>
                <a-input v-model:value="sectionForm.section_title" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Subject">
                <a-select
                  v-model:value="sectionForm.assessment_subject_id"
                  :options="lookups.subjects"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Selection Mode">
                <a-select
                  v-model:value="sectionForm.question_selection_mode_code"
                  :options="lookups.selectionModes"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Total Questions">
                <a-input-number v-model:value="sectionForm.total_questions" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Total Marks">
                <a-input-number v-model:value="sectionForm.total_marks" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Duration Minutes">
                <a-input-number v-model:value="sectionForm.duration_minutes" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24">
              <a-form-item label="Instructions">
                <a-textarea v-model:value="sectionForm.instructions" :rows="3" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="bulkOpen"
        title="Bulk Assign Questions"
        width="900px"
        @ok="runBulkAssign"
      >
        <a-alert
          type="info"
          show-icon
          class="mb-3"
          message="Questions will be assigned to the selected section using the filters below."
        />

        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="8">
              <a-form-item label="Question Bank">
                <a-select
                v-model:value="bulkForm.question_bank_ids"
                :options="lookups.questionBanks"
                mode="multiple"
                allow-clear
                show-search
                option-filter-prop="label"
                placeholder="Select one or more question banks"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Subject">
                <a-select
  v-model:value="bulkForm.assessment_subject_ids"
  :options="lookups.subjects"
  mode="multiple"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Select one or more subjects"
  @change="bulkForm.assessment_topic_ids = []"
/>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Topic">
                <a-select
  v-model:value="bulkForm.assessment_topic_ids"
  :options="filteredBulkTopics"
  mode="multiple"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Select one or more topics"
/>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Question Type">
                <a-select
  v-model:value="bulkForm.question_type_codes"
  :options="lookups.questionTypes"
  mode="multiple"
  allow-clear
  placeholder="Select one or more question types"
/>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Difficulty">
                <a-select
  v-model:value="bulkForm.difficulty_codes"
  :options="lookups.difficulties"
  mode="multiple"
  allow-clear
  placeholder="Select one or more difficulty levels"
/>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Cognitive Level">
                <a-select
  v-model:value="bulkForm.cognitive_level_codes"
  :options="lookups.cognitiveLevels"
  mode="multiple"
  allow-clear
  placeholder="Select one or more cognitive levels"
/>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Selection Mode">
                <a-select v-model:value="bulkForm.selection_mode">
                  <a-select-option value="latest">Latest</a-select-option>
                  <a-select-option value="random">Random</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Number of Questions">
                <a-input-number v-model:value="bulkForm.number_of_questions" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Marks Per Question">
                <a-input-number v-model:value="bulkForm.marks_per_question" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Negative Marks">
                <a-input-number v-model:value="bulkForm.negative_marks_per_question" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Time Seconds / Question">
                <a-input-number v-model:value="bulkForm.time_seconds_per_question" class="w-100" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Approved Only">
                <a-switch v-model:checked="bulkForm.approved_only" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Overwrite Section Questions">
                <a-switch v-model:checked="bulkForm.overwrite_existing" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()

const selectedAssessmentId = ref<number | null>(null)
const sectionOpen = ref(false)
const bulkOpen = ref(false)
const selectedSection = ref<any>(null)

const builder = reactive<any>({
  assessment: null,
  summary: null,
})

const lookups = reactive<any>({
  assessments: [],
  subjects: [],
  topics: [],
  questionBanks: [],
  questionTypes: [],
  difficulties: [],
  cognitiveLevels: [],
  selectionModes: [],
})

const emptySectionForm = () => ({
  id: null,
  assessment_subject_id: null,
  section_code: '',
  section_title: '',
  instructions: '',
  total_questions: null,
  total_marks: 0,
  passing_marks: null,
  duration_minutes: null,
  question_selection_mode_code: 'manual',
  shuffle_questions: false,
  display_order: 0,
  status_code: 'active',
})

const emptyBulkForm = () => ({
  question_bank_ids: [],
  assessment_subject_ids: [],
  assessment_topic_ids: [],
  question_type_codes: [],
  difficulty_codes: [],
  cognitive_level_codes: [],

  selection_mode: 'latest',
  number_of_questions: 10,
  approved_only: false,
  overwrite_existing: false,
  marks_per_question: 1,
  negative_marks_per_question: 0,
  time_seconds_per_question: null,
  is_mandatory: true,
})

const sectionForm = reactive<any>(emptySectionForm())
const bulkForm = reactive<any>(emptyBulkForm())

const filteredBulkTopics = computed(() => {
  if (!bulkForm.assessment_subject_ids?.length) return lookups.topics

  return lookups.topics.filter((x: any) => {
    return bulkForm.assessment_subject_ids
      .map((id: any) => Number(id))
      .includes(Number(x.assessment_subject_id))
  })
})
const normalizeCodeOptions = (items: any[]) => {
  return items.map((item: any) => ({
    label: item.label || item.name || item.code,
    value: String(item.code || item.value),
    code: String(item.code || item.value),
    name: item.name || item.label,
  }))
}
const loadLookups = async () => {
  const [
    assessments,
    subjects,
    topics,
    banks,
    types,
    difficulties,
    cognitive,
    selectionModes,
  ] = await Promise.all([
    api.getOptions('/dynamic-options/assessments'),
    api.getOptions('/dynamic-options/assessment-subjects'),
    api.getOptions('/dynamic-options/assessment-topics'),
    api.getOptions('/dynamic-options/question-banks'),
    api.getOptions('/dynamic-options/lookups/QUESTION_TYPE'),
    api.getOptions('/dynamic-options/lookups/QUESTION_DIFFICULTY'),
    api.getOptions('/dynamic-options/lookups/COGNITIVE_LEVEL'),
    api.getOptions('/dynamic-options/lookups/QUESTION_SELECTION_MODE'),
  ])

  lookups.assessments = assessments?.data || []
  lookups.subjects = subjects?.data || []
  lookups.topics = topics?.data || []
  lookups.questionBanks = banks?.data || []
  lookups.questionTypes = normalizeCodeOptions(types?.data || [])
lookups.difficulties = normalizeCodeOptions(difficulties?.data || [])
lookups.cognitiveLevels = normalizeCodeOptions(cognitive?.data || [])
  lookups.selectionModes = selectionModes?.data || []
}

const loadBuilder = async () => {
  if (!selectedAssessmentId.value) {
    builder.assessment = null
    builder.summary = null
    return
  }

  try {
    const response: any = await api.getAssessmentBuilder(selectedAssessmentId.value)
    builder.assessment = response?.data?.assessment || null
    builder.summary = response?.data?.summary || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load assessment builder.')
  }
}

const openSectionCreate = () => {
  Object.assign(sectionForm, emptySectionForm())
  sectionOpen.value = true
}

const openSectionEdit = (section: any) => {
  Object.assign(sectionForm, emptySectionForm(), section)
  sectionOpen.value = true
}

const saveSection = async () => {
  if (!selectedAssessmentId.value) {
    message.error('Please select assessment.')
    return
  }

  try {
    if (sectionForm.id) {
      await api.updateAssessmentBuilderSection(sectionForm.id, { ...sectionForm })
    } else {
      await api.createAssessmentBuilderSection(selectedAssessmentId.value, { ...sectionForm })
    }

    message.success('Section saved successfully.')
    sectionOpen.value = false
    await loadBuilder()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save section.')
  }
}

const deleteSection = async (section: any) => {
  await api.deleteAssessmentBuilderSection(section.id)
  message.success('Section deleted successfully.')
  await loadBuilder()
}

const openBulkAssign = (section: any) => {
  selectedSection.value = section

  Object.assign(bulkForm, emptyBulkForm(), {
    assessment_subject_ids: section.assessment_subject_id
      ? [section.assessment_subject_id]
      : [],
  })

  bulkOpen.value = true
}

const runBulkAssign = async () => {
  if (!selectedSection.value) {
    message.error('Section is required.')
    return
  }

  try {
    const payload = {
  ...bulkForm,
  question_bank_ids: (bulkForm.question_bank_ids || []).map((x: any) => Number(x)),
  assessment_subject_ids: (bulkForm.assessment_subject_ids || []).map((x: any) => Number(x)),
  assessment_topic_ids: (bulkForm.assessment_topic_ids || []).map((x: any) => Number(x)),
  question_type_codes: (bulkForm.question_type_codes || []).map((x: any) => String(x)),
  difficulty_codes: (bulkForm.difficulty_codes || []).map((x: any) => String(x)),
  cognitive_level_codes: (bulkForm.cognitive_level_codes || []).map((x: any) => String(x)),
}

const response: any = await api.bulkAssignAssessmentQuestions(selectedSection.value.id, payload)
    const result = response?.data || {}

    message.success(`Assigned: ${result.assigned || 0}, Skipped existing: ${result.skipped_existing || 0}`)
    bulkOpen.value = false
    await loadBuilder()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to assign questions.')
  }
}

const removeQuestion = async (record: any) => {
  await api.removeAssessmentQuestion(record.id)
  message.success('Question removed successfully.')
  await loadBuilder()
}

onMounted(async () => {
  await loadLookups()
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

.w-100 {
  width: 100%;
}
</style>