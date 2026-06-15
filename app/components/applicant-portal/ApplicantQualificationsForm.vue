<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Previous Qualifications</a-typography-title>
      <a-button type="primary" size="small" :disabled="locked" @click="openCreate">
        Add Qualification
      </a-button>
    </div>
<a-alert
  v-if="locked"
  type="warning"
  show-icon
  class="mb-3"
  message="Qualifications are locked because your application has already been submitted."
/>{{ locked }}
    <a-table
      :columns="columns"
      :data-source="items"
      row-key="id"
      size="small"
      :loading="loading"
      :pagination="{ pageSize: 5 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'marks'">
          {{ record.obtained_marks || '-' }} / {{ record.total_marks || '-' }}
          <span v-if="record.percentage">({{ record.percentage }}%)</span>
        </template>

        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" :disabled="locked" @click="edit(record)">Edit</a-button>
            <a-button size="small" danger :disabled="locked" @click="remove(record)">Delete</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      title="Qualification"
      width="780px"
      :confirm-loading="saving"
      :ok-button-props="{ disabled: locked }"
      @ok="save"
    >
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="Qualification Level" required>
              <a-select
                v-model:value="form.qualification_level_id"
                :options="options.qualificationLevels"
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Subject Group">
              <a-select
                v-model:value="form.subject_group_id"
                :options="options.subjectGroups"
                allow-clear
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Board / University">
              <a-select
                v-model:value="form.education_board_id"
                :options="options.boards"
                allow-clear
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Institution">
              <a-select
                v-model:value="form.external_institution_id"
                :options="options.institutions"
                allow-clear
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Degree / Class Name">
              <a-input v-model:value="form.degree_class_name" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Passing Year">
              <a-input v-model:value="form.passing_year" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="Total Marks">
              <a-input-number v-model:value="form.total_marks" class="w-100" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="Obtained Marks">
              <a-input-number v-model:value="form.obtained_marks" class="w-100" @change="calculatePercentage" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="Percentage">
              <a-input-number v-model:value="form.percentage" class="w-100" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="CGPA">
              <a-input-number v-model:value="form.cgpa" class="w-100" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="CGPA Scale">
              <a-input-number v-model:value="form.cgpa_scale" class="w-100" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-form-item label="Grade">
              <a-input v-model:value="form.grade" />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="Remarks">
              <a-textarea v-model:value="form.remarks" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{
  applicantId: number
  locked?: boolean
}>()

const api = useApplicantPortalApi()

const loading = ref(false)
const saving = ref(false)
const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const items = ref<any[]>([])

const form = reactive<any>({
  applicant_id: props.applicantId,
  qualification_level_id: null,
  education_board_id: null,
  external_institution_id: null,
  subject_group_id: null,
  degree_class_name: null,
  passing_year: null,
  result_status_code: 'passed',
  total_marks: null,
  obtained_marks: null,
  percentage: null,
  cgpa: null,
  cgpa_scale: null,
  grade: null,
  equivalence_required: false,
  is_final_result: true,
  is_verified: false,
  remarks: null,
})

const options = reactive<any>({
  qualificationLevels: [],
  subjectGroups: [],
  boards: [],
  institutions: [],
})

const columns = [
  { title: 'Degree/Class', dataIndex: 'degree_class_name', key: 'degree_class_name' },
  { title: 'Passing Year', dataIndex: 'passing_year', key: 'passing_year', width: 120 },
  { title: 'Marks', key: 'marks', width: 180 },
  { title: 'CGPA', dataIndex: 'cgpa', key: 'cgpa', width: 100 },
  { title: 'Grade', dataIndex: 'grade', key: 'grade', width: 100 },
  { title: 'Action', key: 'action', width: 150 },
]

const normalizeOptions = (response: any) => {
  return (response?.data || []).map((x: any) => ({
    label: x.label || x.name || x.title || x.code || String(x.value ?? x.id ?? ''),
    value: x.value ?? x.id,
    id: x.id,
    code: x.code,
  }))
}

const resetForm = () => {
  editingId.value = null

  Object.assign(form, {
    applicant_id: props.applicantId,
    qualification_level_id: null,
    education_board_id: null,
    external_institution_id: null,
    subject_group_id: null,
    degree_class_name: null,
    passing_year: null,
    result_status_code: 'passed',
    total_marks: null,
    obtained_marks: null,
    percentage: null,
    cgpa: null,
    cgpa_scale: null,
    grade: null,
    equivalence_required: false,
    is_final_result: true,
    is_verified: false,
    remarks: null,
  })
}

const loadOptions = async () => {
  const [levels, groups, boards, institutions] = await Promise.all([
    api.getOptions('/dynamic-options/lookups/QUALIFICATION_LEVEL'),
    api.getOptions('/dynamic-options/lookups/SUBJECT_GROUP'),
    api.getOptions('/dynamic-options/lookups/BOARD'),
    api.getOptions('/dynamic-options/lookups/EXTERNAL_INSTITUTION'),
  ])

options.qualificationLevels = normalizeOptions(levels)
options.subjectGroups = normalizeOptions(groups)
options.boards = normalizeOptions(boards)
options.institutions = normalizeOptions(institutions)
}

const loadItems = async () => {
  loading.value = true

  try {
    const response: any = api.isApplicantSession()
        ? await api.applicantGetQualifications()
        : await api.getApplicantQualifications(props.applicantId)
    items.value = response?.data?.data || response?.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load qualifications.')
  } finally {
    loading.value = false
  }
}

const calculatePercentage = () => {
  if (form.total_marks && form.obtained_marks) {
    form.percentage = Number(((form.obtained_marks / form.total_marks) * 100).toFixed(2))
  }
}

const openCreate = () => {
  resetForm()
  modalOpen.value = true
}

const edit = (record: any) => {
  resetForm()
  editingId.value = record.id
  Object.assign(form, record)
  modalOpen.value = true
}

const save = async () => {
  if (props.locked) {
    message.warning('Qualifications are locked.')
    return
  }
  saving.value = true

  try {
    const payload = {
  ...form,
  qualification_level_id: form.qualification_level_id ? Number(form.qualification_level_id) : null,
  subject_group_id: form.subject_group_id ? Number(form.subject_group_id) : null,
  education_board_id: form.education_board_id ? Number(form.education_board_id) : null,
  external_institution_id: form.external_institution_id ? Number(form.external_institution_id) : null,
}

if (api.isApplicantSession()) {
  await api.applicantSaveQualification(payload, editingId.value)
} else {
  await api.saveApplicantQualification(payload, editingId.value)
}
    message.success('Qualification saved.')
    modalOpen.value = false
    await loadItems()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save qualification.')
  } finally {
    saving.value = false
  }
}

const remove = async (record: any) => {
  if (props.locked) {
    message.warning('Qualifications are locked.')
    return
  }
  try {
    if (api.isApplicantSession()) {
        await api.applicantDeleteQualification(record.id)
    } else {
        await api.deleteApplicantQualification(record.id)
    }
    message.success('Qualification deleted.')
    await loadItems()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to delete qualification.')
  }
}

onMounted(async () => {
  await loadOptions()
  await loadItems()
})
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.w-100 {
  width: 100%;
}
</style>