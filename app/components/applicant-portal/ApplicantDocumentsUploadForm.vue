<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Documents</a-typography-title>
      <a-button size="small" :loading="loading" @click="loadItems">Refresh</a-button>
    </div>
<a-alert
  v-if="locked"
  type="warning"
  show-icon
  class="mb-3"
  message="Documents are locked because your application has already been submitted."
/>
    <a-card size="small" class="mb-3">
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="10">
            <a-form-item label="Document Type">
              <a-select
                v-model:value="form.document_type_id"
                :options="documentTypes"
                allow-clear
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="10">
            <a-form-item label="Document Title" required>
              <a-input v-model:value="form.document_title" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-form-item label="File" required>
              <input type="file" @change="handleFileChange" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-button type="primary" :loading="uploading" :disabled="locked" @click="upload">
          Upload Document
        </a-button>
      </a-form>
    </a-card>

    <a-table :columns="columns" :data-source="items" row-key="id" size="small" :loading="loading" :pagination="{ pageSize: 5 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'file'">
          {{ record.original_file_name || '-' }}
        </template>

        <template v-if="column.key === 'action'">
          <a-space>
            <a-button
              size="small"
              type="link"
              :href="apiBase + record.preview_url"
              target="_blank"
              :disabled="!record.preview_url"
            >
              Preview
            </a-button>

            <a-button
              size="small"
              type="link"
              :href="apiBase + record.download_url"
              target="_blank"
              :disabled="!record.download_url"
            >
              Download
            </a-button>

            <a-button size="small" danger :disabled="locked" @click="remove(record)">
              Delete
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{
  applicantId: number
  locked?: boolean
}>()
const api = useApplicantPortalApi()
const config = useRuntimeConfig()

const apiBase =
  config.public?.apiBase ||
  config.public?.apiBaseUrl ||
  config.public?.apiUrl ||
  'http://localhost:8000/api'

const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const items = ref<any[]>([])
const documentTypes = ref<any[]>([])

const form = reactive<any>({
  document_type_id: null,
  document_title: null,
})

const columns = [
  { title: 'Document Title', dataIndex: 'document_title', key: 'document_title' },
  { title: 'File', key: 'file' },
  { title: 'Status', dataIndex: 'verification_status_code', key: 'verification_status_code', width: 130 },
  { title: 'Action', key: 'action', width: 260 },
]

const normalizeOptions = (response: any) => {
  return (response?.data || []).map((x: any) => ({
    label: x.label || x.name,
    value: x.value || x.id,
  }))
}

const loadDocumentTypes = async () => {
  const response: any = await api.getOptions('/dynamic-options/lookups/DOCUMENT_TYPE')
  documentTypes.value = normalizeOptions(response)
}

const loadItems = async () => {
  loading.value = true
  try {
    const response: any = api.isApplicantSession()
  ? await api.applicantGetDocuments()
  : await api.getApplicantDocuments(props.applicantId)
    items.value = response?.data?.data || response?.data || []
  } finally {
    loading.value = false
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

const upload = async () => {
  if (props.locked) {
    message.warning('Documents are locked.')
    return
  }
  if (!form.document_title) {
    message.error('Document title is required.')
    return
  }

  if (!selectedFile.value) {
    message.error('Please select a file.')
    return
  }

  uploading.value = true

  try {
    const fd = new FormData()
    fd.append('applicant_id', String(props.applicantId))
    fd.append('document_title', form.document_title)

    if (form.document_type_id) {
      fd.append('document_type_id', String(form.document_type_id))
    }

    fd.append('file', selectedFile.value)

    await api.uploadApplicantDocument(fd)

    message.success('Document uploaded.')
    form.document_title = null
    form.document_type_id = null
    selectedFile.value = null

    await loadItems()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to upload document.')
  } finally {
    uploading.value = false
  }
}

const remove = async (record: any) => {
  if (props.locked) {
    message.warning('Documents are locked.')
    return
  }
  await api.deleteApplicantDocument(record.id)
  message.success('Document deleted.')
  await loadItems()
}

onMounted(async () => {
  await loadDocumentTypes()
  await loadItems()
})
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>