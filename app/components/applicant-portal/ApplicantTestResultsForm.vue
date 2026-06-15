<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Test Results</a-typography-title>
      <a-button type="primary" size="small" :disabled="locked" @click="openCreate">
        Add Test Result
      </a-button>
    </div>
<a-alert
  v-if="locked"
  type="warning"
  show-icon
  class="mb-3"
  message="Test results are locked because your application has already been submitted."
/>
    <a-table :columns="columns" :data-source="items" row-key="id" size="small" :loading="loading" :pagination="{ pageSize: 5 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'score'">
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

    <a-modal v-model:open="modalOpen" title="Test Result" width="760px" :confirm-loading="saving" :ok-button-props="{ disabled: locked }" @ok="save">
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="Test Code">
              <a-input v-model:value="form.test_code" placeholder="Example: NAT-IM" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Test Name">
              <a-input v-model:value="form.test_name" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Roll No">
              <a-input v-model:value="form.roll_no" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Test Date">
              <a-date-picker v-model:value="form.test_date" value-format="YYYY-MM-DD" class="w-100" />
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
  test_source_code: 'external',
  test_code: null,
  test_name: null,
  roll_no: null,
  test_date: null,
  total_marks: null,
  obtained_marks: null,
  percentage: null,
  percentile: null,
  result_status_code: 'submitted',
  is_verified: false,
  remarks: null,
})

const columns = [
  { title: 'Test Code', dataIndex: 'test_code', key: 'test_code', width: 140 },
  { title: 'Test Name', dataIndex: 'test_name', key: 'test_name' },
  { title: 'Roll No', dataIndex: 'roll_no', key: 'roll_no', width: 140 },
  { title: 'Score', key: 'score', width: 180 },
  { title: 'Status', dataIndex: 'result_status_code', key: 'result_status_code', width: 120 },
  { title: 'Action', key: 'action', width: 150 },
]

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    applicant_id: props.applicantId,
    test_source_code: 'external',
    test_code: null,
    test_name: null,
    roll_no: null,
    test_date: null,
    total_marks: null,
    obtained_marks: null,
    percentage: null,
    percentile: null,
    result_status_code: 'submitted',
    is_verified: false,
    remarks: null,
  })
}

const loadItems = async () => {
  loading.value = true
  try {
    const response: any = api.isApplicantSession()
  ? await api.applicantGetTestResults()
  : await api.getApplicantTestResults(props.applicantId)
    items.value = response?.data?.data || response?.data || []
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
  saving.value = true
  try {
    if (api.isApplicantSession()) {
  await api.applicantSaveTestResult({ ...form }, editingId.value)
} else {
  await api.saveApplicantTestResult({ ...form }, editingId.value)
}
    message.success('Test result saved.')
    modalOpen.value = false
    await loadItems()
  } finally {
    saving.value = false
  }
}

const remove = async (record: any) => {
  if (api.isApplicantSession()) {
  await api.applicantDeleteTestResult(record.id)
} else {
  await api.deleteApplicantTestResult(record.id)
}
  message.success('Test result deleted.')
  await loadItems()
}

onMounted(loadItems)
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