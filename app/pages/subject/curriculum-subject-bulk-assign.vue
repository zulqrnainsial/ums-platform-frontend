<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Bulk Assign Curriculum Subjects</h2>
          <p>Select curriculum details once, then edit each selected subject before saving.</p>
        </div>

        <a-button @click="router.push('/crud/curriculum-subjects')">
          Back to Curriculum Subjects
        </a-button>
      </div>

      <a-card>
        <a-form layout="vertical">
          <a-row :gutter="[16, 0]">
            <a-col :span="12">
              <a-form-item label="Curriculum" required>
                <a-select
                  v-model:value="form.curriculum_id"
                  placeholder="Select curriculum"
                  show-search
                  allow-clear
                  :filter-option="filterOption"
                  @change="onCurriculumChange"
                >
                  <a-select-option
                    v-for="item in curriculumOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Program" required>
                <a-select
                  v-model:value="form.program_id"
                  placeholder="Select program"
                  show-search
                  allow-clear
                  :filter-option="filterOption"
                  @change="onProgramChange"
                >
                  <a-select-option
                    v-for="item in programOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Academic Term">
                <a-select
                  v-model:value="form.academic_term_id"
                  placeholder="Select academic term"
                  show-search
                  allow-clear
                  :disabled="!form.program_id"
                  :filter-option="filterOption"
                >
                  <a-select-option
                    v-for="item in academicTermOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Term Number" required>
                <a-input-number
                  v-model:value="form.term_number"
                  :min="1"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>

            <a-col :span="24">
              <a-divider orientation="left">
                Select Subjects
              </a-divider>

              <a-transfer
                v-model:target-keys="selectedSubjectKeys"
                :data-source="subjectTransferData"
                :titles="['Available Subjects', 'Selected Subjects']"
                :render="(item: { title: any }) => item.title"
                :list-style="{ width: '45%', height: '360px' }"
                show-search
                @change="syncSelectedRows"
              />
            </a-col>

            <a-col :span="24" style="margin-top: 24px">
              <a-divider orientation="left">
                Edit Selected Subject Details
              </a-divider>

              <a-alert
                v-if="selectedRows.length === 0"
                type="info"
                show-icon
                message="Select subjects first. Their default credit hours, marks and subject nature will appear here for editing."
              />

              <a-table
                v-else
                :columns="columns"
                :data-source="selectedRows"
                :pagination="false"
                row-key="subject_id"
                bordered
                size="small"
                :scroll="{ x: 1800 }"
              >
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'display_order'">
                    <a-input-number
                      v-model:value="record.display_order"
                      :min="0"
                      style="width: 90px"
                    />
                  </template>

                  <template v-else-if="column.key === 'subject_code'">
                    <a-input v-model:value="record.subject_code" style="width: 130px" />
                  </template>

                  <template v-else-if="column.key === 'subject_name'">
                    <a-input v-model:value="record.subject_name" style="width: 260px" />
                  </template>

                  <template v-else-if="column.key === 'subject_nature'">
                    <a-select v-model:value="record.subject_nature" style="width: 170px">
                      <a-select-option value="theory">Theory</a-select-option>
                      <a-select-option value="practical">Practical</a-select-option>
                      <a-select-option value="theory_practical">Theory + Practical</a-select-option>
                      <a-select-option value="viva">Viva</a-select-option>
                      <a-select-option value="project">Project</a-select-option>
                      <a-select-option value="internship">Internship</a-select-option>
                      <a-select-option value="other">Other</a-select-option>
                    </a-select>
                  </template>

                  <template v-else-if="column.key === 'credit_hours'">
                    <a-input-number
                      v-model:value="record.credit_hours"
                      :min="0"
                      :step="0.5"
                      style="width: 110px"
                    />
                  </template>

                  <template v-else-if="column.key === 'theory_hours'">
                    <a-input-number v-model:value="record.theory_hours" :min="0" style="width: 100px" />
                  </template>

                  <template v-else-if="column.key === 'practical_hours'">
                    <a-input-number v-model:value="record.practical_hours" :min="0" style="width: 110px" />
                  </template>

                  <template v-else-if="column.key === 'tutorial_hours'">
                    <a-input-number v-model:value="record.tutorial_hours" :min="0" style="width: 110px" />
                  </template>

                  <template v-else-if="column.key === 'total_marks'">
                    <a-input-number v-model:value="record.total_marks" :min="0" style="width: 110px" />
                  </template>

                  <template v-else-if="column.key === 'passing_marks'">
                    <a-input-number v-model:value="record.passing_marks" :min="0" style="width: 120px" />
                  </template>

                  <template v-else-if="column.key === 'is_compulsory'">
                    <a-switch v-model:checked="record.is_compulsory" />
                  </template>

                  <template v-else-if="column.key === 'is_credit_subject'">
                    <a-switch v-model:checked="record.is_credit_subject" />
                  </template>

                  <template v-else-if="column.key === 'remarks'">
                    <a-input v-model:value="record.remarks" style="width: 220px" />
                  </template>

                  <template v-else-if="column.key === 'actions'">
                    <a-button danger size="small" @click="removeSelected(record.subject_id)">
                      Remove
                    </a-button>
                  </template>

                  <template v-else>
                    {{ record[column.dataIndex] }}
                  </template>
                </template>
              </a-table>
            </a-col>

            <a-col :span="24" style="margin-top: 20px">
              <a-space>
                <a-checkbox v-model:checked="form.overwrite_existing">
                  Overwrite existing records
                </a-checkbox>
              </a-space>
            </a-col>

            <a-col :span="24" style="margin-top: 20px">
              <a-space>
                <a-button
                  type="primary"
                  :loading="saving"
                  :disabled="selectedRows.length === 0"
                  @click="submit"
                >
                  Save All Selected Subjects
                </a-button>

                <a-button @click="resetForm">
                  Reset
                </a-button>
              </a-space>
            </a-col>
          </a-row>
        </a-form>
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'
import { useApi } from '~/composables/useApi'

const { apiFetch } = useApi()
const router = useRouter()

const saving = ref(false)

const curriculumOptions = ref<any[]>([])
const programOptions = ref<any[]>([])
const academicTermOptions = ref<any[]>([])
const subjectOptions = ref<any[]>([])

const selectedSubjectKeys = ref<string[]>([])
const selectedRows = ref<any[]>([])

const form = reactive({
  curriculum_id: undefined as number | undefined,
  program_id: undefined as number | undefined,
  academic_term_id: undefined as number | undefined,
  term_number: 1,
  overwrite_existing: false,
})

const columns = [
  { title: 'Order', key: 'display_order', width: 100, fixed: 'left' },
  { title: 'Code', key: 'subject_code', width: 150 },
  { title: 'Subject Name', key: 'subject_name', width: 280 },
  { title: 'Nature', key: 'subject_nature', width: 190 },
  { title: 'Credit Hours', key: 'credit_hours', width: 130 },
  { title: 'Theory', key: 'theory_hours', width: 110 },
  { title: 'Practical', key: 'practical_hours', width: 120 },
  { title: 'Tutorial', key: 'tutorial_hours', width: 120 },
  { title: 'Total Marks', key: 'total_marks', width: 130 },
  { title: 'Passing Marks', key: 'passing_marks', width: 140 },
  { title: 'Compulsory', key: 'is_compulsory', width: 120 },
  { title: 'Credit Subject', key: 'is_credit_subject', width: 130 },
  { title: 'Remarks', key: 'remarks', width: 240 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

const subjectTransferData = computed(() => {
  return subjectOptions.value.map((item: any) => ({
    key: String(item.value),
    title: item.label,
    description: item.code || '',
  }))
})

const filterOption = (input: string, option: any) => {
  return String(option?.children || '')
    .toLowerCase()
    .includes(input.toLowerCase())
}

const fetchCurriculums = async () => {
  const response: any = await apiFetch('/dynamic-options/curriculums', {
    method: 'GET',
  })

  curriculumOptions.value = response.data || []
}

const fetchPrograms = async () => {
  const response: any = await apiFetch('/dynamic-options/programs', {
    method: 'GET',
  })

  programOptions.value = response.data || []
}

const fetchAcademicTerms = async () => {
  if (!form.program_id) {
    academicTermOptions.value = []
    return
  }

  const response: any = await apiFetch('/dynamic-options/academic-terms', {
    method: 'GET',
    query: {
      program_id: form.program_id,
    },
  })

  academicTermOptions.value = response.data || []
}

const fetchSubjects = async () => {
  const response: any = await apiFetch('/dynamic-options/subjects', {
    method: 'GET',
  })

  subjectOptions.value = response.data || []
}

const onCurriculumChange = async () => {
  const selected = curriculumOptions.value.find((x: any) => x.value === form.curriculum_id)

  if (selected?.program_id) {
    form.program_id = selected.program_id
  }

  form.academic_term_id = undefined
  await fetchAcademicTerms()
}

const onProgramChange = async () => {
  form.academic_term_id = undefined
  await fetchAcademicTerms()
}

const makeRowFromSubject = (subject: any, index: number) => {
  return {
    subject_id: Number(subject.value),

    subject_code: subject.code || '',
    subject_name: subject.name || subject.label || '',

    subject_nature: subject.subject_nature || 'theory',

    credit_hours: Number(subject.credit_hours || 0),
    theory_hours: Number(subject.theory_hours || 0),
    practical_hours: Number(subject.practical_hours || 0),
    tutorial_hours: Number(subject.tutorial_hours || 0),

    total_marks: Number(subject.total_marks || 100),
    passing_marks: Number(subject.passing_marks || 40),

    is_compulsory: Boolean(subject.is_compulsory),
    is_credit_subject: Boolean(subject.is_credit_subject),

    display_order: index + 1,
    remarks: '',
  }
}

const syncSelectedRows = () => {
  const existingMap = new Map(
    selectedRows.value.map((row: any) => [String(row.subject_id), row])
  )

  selectedRows.value = selectedSubjectKeys.value.map((key: string, index: number) => {
    if (existingMap.has(key)) {
      return existingMap.get(key)
    }

    const subject = subjectOptions.value.find((item: any) => String(item.value) === key)

    return makeRowFromSubject(subject, index)
  })
}

const removeSelected = (subjectId: number) => {
  selectedSubjectKeys.value = selectedSubjectKeys.value.filter(
    key => Number(key) !== Number(subjectId)
  )

  syncSelectedRows()
}

const resetForm = () => {
  form.curriculum_id = undefined
  form.program_id = undefined
  form.academic_term_id = undefined
  form.term_number = 1
  form.overwrite_existing = false

  selectedSubjectKeys.value = []
  selectedRows.value = []
  academicTermOptions.value = []
}

const validateBeforeSubmit = () => {
  if (!form.curriculum_id) {
    message.error('Curriculum is required.')
    return false
  }

  if (!form.program_id) {
    message.error('Program is required.')
    return false
  }

  if (!form.term_number) {
    message.error('Term number is required.')
    return false
  }

  if (selectedRows.value.length === 0) {
    message.error('Please select at least one subject.')
    return false
  }

  for (const row of selectedRows.value) {
    if (!row.subject_code) {
      message.error('Subject code is required for all selected subjects.')
      return false
    }

    if (!row.subject_name) {
      message.error('Subject name is required for all selected subjects.')
      return false
    }

    if (!row.subject_nature) {
      message.error('Subject nature is required for all selected subjects.')
      return false
    }

    if (Number(row.passing_marks) > Number(row.total_marks)) {
      message.error(`Passing marks cannot exceed total marks for ${row.subject_name}.`)
      return false
    }
  }

  return true
}

const submit = async () => {
  if (!validateBeforeSubmit()) {
    return
  }

  saving.value = true

  try {
    const response: any = await apiFetch('/subject/curriculum-subjects/bulk-assign', {
      method: 'POST',
      body: {
        curriculum_id: form.curriculum_id,
        program_id: form.program_id,
        academic_term_id: form.academic_term_id || null,
        term_number: form.term_number,
        overwrite_existing: form.overwrite_existing,

        items: selectedRows.value.map((row: any) => ({
          subject_id: row.subject_id,
          subject_code: row.subject_code,
          subject_name: row.subject_name,
          subject_nature: row.subject_nature,

          credit_hours: row.credit_hours,
          theory_hours: row.theory_hours,
          practical_hours: row.practical_hours,
          tutorial_hours: row.tutorial_hours,

          total_marks: row.total_marks,
          passing_marks: row.passing_marks,

          is_compulsory: row.is_compulsory,
          is_credit_subject: row.is_credit_subject,

          display_order: row.display_order,
          remarks: row.remarks || null,
        })),
      },
    })

    const data = response.data || {}

    message.success(
      `Saved successfully. Created: ${data.created || 0}, Updated: ${data.updated || 0}, Skipped: ${data.skipped || 0}`
    )

    selectedSubjectKeys.value = []
    selectedRows.value = []
  } catch (error: any) {
    const errors = error?.data?.errors

    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0]

      if (firstKey && Array.isArray(errors[firstKey])) {
        message.error(errors[firstKey][0])
      } else {
        message.error('Validation failed.')
      }
    } else {
      message.error(error?.data?.message || 'Failed to assign curriculum subjects.')
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    fetchCurriculums(),
    fetchPrograms(),
    fetchSubjects(),
  ])
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.page-header p {
  margin: 4px 0 0;
  color: #666;
}
</style>