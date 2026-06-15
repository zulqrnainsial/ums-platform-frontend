<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Experience</a-typography-title>
      <a-button type="primary" size="small" @click="openCreate">Add Experience</a-button>
    </div>

    <a-table :columns="columns" :data-source="items" row-key="id" size="small" :loading="loading" :pagination="{ pageSize: 5 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'period'">
          {{ record.from_date || '-' }} to {{ record.currently_working ? 'Present' : (record.to_date || '-') }}
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="edit(record)">Edit</a-button>
            <a-button size="small" danger @click="remove(record)">Delete</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" title="Experience" width="720px" :confirm-loading="saving" @ok="save">
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="Organization" required>
              <a-input v-model:value="form.organization_name" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="Designation">
              <a-input v-model:value="form.designation" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="From Date">
              <a-date-picker v-model:value="form.from_date" value-format="YYYY-MM-DD" class="w-100" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="To Date">
              <a-date-picker v-model:value="form.to_date" value-format="YYYY-MM-DD" class="w-100" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="Currently Working">
              <a-switch v-model:checked="form.currently_working" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="Total Months">
              <a-input-number v-model:value="form.total_months" class="w-100" />
            </a-form-item>
          </a-col>
          <a-col :xs="24">
            <a-form-item label="Job Description">
              <a-textarea v-model:value="form.job_description" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{ applicantId: number }>()
const api = useApplicantPortalApi()

const loading = ref(false)
const saving = ref(false)
const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const items = ref<any[]>([])

const form = reactive<any>({
  applicant_id: props.applicantId,
  organization_name: null,
  designation: null,
  from_date: null,
  to_date: null,
  currently_working: false,
  total_months: 0,
  status_code: 'active',
  job_description: null,
  remarks: null,
})

const columns = [
  { title: 'Organization', dataIndex: 'organization_name', key: 'organization_name' },
  { title: 'Designation', dataIndex: 'designation', key: 'designation' },
  { title: 'Period', key: 'period', width: 220 },
  { title: 'Months', dataIndex: 'total_months', key: 'total_months', width: 90 },
  { title: 'Action', key: 'action', width: 150 },
]

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    applicant_id: props.applicantId,
    organization_name: null,
    designation: null,
    from_date: null,
    to_date: null,
    currently_working: false,
    total_months: 0,
    status_code: 'active',
    job_description: null,
    remarks: null,
  })
}

const loadItems = async () => {
  loading.value = true
  try {
    const response: any = api.isApplicantSession()
  ? await api.applicantGetExperiences()
  : await api.getApplicantExperiences(props.applicantId)
    items.value = response?.data?.data || response?.data || []
  } finally {
    loading.value = false
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
  await api.applicantSaveExperience({ ...form }, editingId.value)
} else {
  await api.saveApplicantExperience({ ...form }, editingId.value)
}
    message.success('Experience saved.')
    modalOpen.value = false
    await loadItems()
  } finally {
    saving.value = false
  }
}

const remove = async (record: any) => {
  if (api.isApplicantSession()) {
  await api.applicantDeleteExperience(record.id)
} else {
  await api.deleteApplicantExperience(record.id)
}
  message.success('Experience deleted.')
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