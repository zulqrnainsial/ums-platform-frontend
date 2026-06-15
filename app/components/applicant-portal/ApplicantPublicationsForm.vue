<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Publications</a-typography-title>
      <a-button type="primary" size="small" @click="openCreate">Add Publication</a-button>
    </div>

    <a-table :columns="columns" :data-source="items" row-key="id" size="small" :loading="loading" :pagination="{ pageSize: 5 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="edit(record)">Edit</a-button>
            <a-button size="small" danger @click="remove(record)">Delete</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="modalOpen" title="Publication" width="760px" :confirm-loading="saving" @ok="save">
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24">
            <a-form-item label="Title" required>
              <a-input v-model:value="form.title" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Journal / Conference">
              <a-input v-model:value="form.journal_conference_name" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Publication Year">
              <a-input v-model:value="form.publication_year" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="DOI">
              <a-input v-model:value="form.doi" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="URL">
              <a-input v-model:value="form.url" />
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
  title: null,
  journal_conference_name: null,
  publisher: null,
  publication_year: null,
  doi: null,
  url: null,
  status_code: 'claimed',
  is_verified: false,
  remarks: null,
})

const columns = [
  { title: 'Title', dataIndex: 'title', key: 'title' },
  { title: 'Journal / Conference', dataIndex: 'journal_conference_name', key: 'journal_conference_name' },
  { title: 'Year', dataIndex: 'publication_year', key: 'publication_year', width: 100 },
  { title: 'Status', dataIndex: 'status_code', key: 'status_code', width: 120 },
  { title: 'Action', key: 'action', width: 150 },
]

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    applicant_id: props.applicantId,
    title: null,
    journal_conference_name: null,
    publisher: null,
    publication_year: null,
    doi: null,
    url: null,
    status_code: 'claimed',
    is_verified: false,
    remarks: null,
  })
}

const loadItems = async () => {
  loading.value = true
  try {
    const response: any = api.isApplicantSession()
  ? await api.applicantGetPublications()
  : await api.getApplicantPublications(props.applicantId)
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
  await api.applicantSavePublication({ ...form }, editingId.value)
} else {
  await api.saveApplicantPublication({ ...form }, editingId.value)
}
    message.success('Publication saved.')
    modalOpen.value = false
    await loadItems()
  } finally {
    saving.value = false
  }
}

const remove = async (record: any) => {
  if (api.isApplicantSession()) {
  await api.applicantDeletePublication(record.id)
} else {
  await api.deleteApplicantPublication(record.id)
}
  message.success('Publication deleted.')
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
</style>