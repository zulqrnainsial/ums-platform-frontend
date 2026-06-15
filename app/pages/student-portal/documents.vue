<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>My Documents</h2>
          <p>View submitted documents and verification status.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button type="primary" @click="openUploadModal">
  Upload Document
</a-button>
          <a-button @click="loadDocuments">Refresh</a-button>
        </a-space>
      </div>

      <a-card>
        <a-table
          :data-source="documents"
          row-key="id"
          size="small"
          :loading="loading"
          :pagination="{ pageSize: 20 }"
        >
          <a-table-column title="Title" data-index="document_title" />
          <a-table-column title="File" data-index="file_name" />
          <a-table-column title="Status">
            <template #default="{ record }">
              <a-tag :color="statusColor(record.verification_status)">
                {{ record.verification_status || 'pending' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="Remarks" data-index="remarks" />
          <a-table-column title="Verified At" data-index="verified_at" />
        </a-table>
      </a-card>
      <a-modal
  v-model:open="uploadOpen"
  title="Upload Document"
  ok-text="Upload"
  :confirm-loading="uploading"
  @ok="uploadDocument"
>
  <a-form layout="vertical">
    <a-form-item label="Document Title" required>
      <a-input v-model:value="uploadForm.document_title" />
    </a-form-item>

    <a-form-item label="Document Type" required>
      <a-select
        v-model:value="uploadForm.document_type"
        :options="documentTypeOptions"
        placeholder="Select document type"
      />
    </a-form-item>

    <a-form-item label="File" required>
      <a-upload
        :before-upload="beforeDocumentSelect"
        :max-count="1"
      >
        <a-button>Select File</a-button>
      </a-upload>
    </a-form-item>

    <a-form-item label="Remarks">
      <a-textarea v-model:value="uploadForm.remarks" :rows="3" />
    </a-form-item>
  </a-form>
</a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const portalApi = useStudentPortalApi()

const loading = ref(false)
const documents = ref<any[]>([])

const unwrap = (response: any) => response?.data?.data || response?.data || response || []

const statusColor = (status: string) => {
  if (status === 'verified') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'resubmission_required') return 'orange'
  return 'blue'
}
const uploadOpen = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)

const uploadForm = reactive<any>({
  document_title: '',
  document_type: undefined,
  remarks: '',
})

const documentTypeOptions = [
  { label: 'CNIC / B-Form', value: 'cnic_bform' },
  { label: 'Matric Certificate', value: 'matric_certificate' },
  { label: 'Intermediate Certificate', value: 'intermediate_certificate' },
  { label: 'Domicile', value: 'domicile' },
  { label: 'Photo', value: 'photo' },
  { label: 'Other', value: 'other' },
]

const openUploadModal = () => {
  Object.assign(uploadForm, {
    document_title: '',
    document_type: undefined,
    remarks: '',
  })

  selectedFile.value = null
  uploadOpen.value = true
}

const beforeDocumentSelect = (file: File) => {
  selectedFile.value = file
  return false
}

const uploadDocument = async () => {
  if (!uploadForm.document_title || !uploadForm.document_type || !selectedFile.value) {
    message.error('Document title, type and file are required.')
    return
  }

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('document_title', uploadForm.document_title)
    formData.append('document_type', uploadForm.document_type)
    formData.append('remarks', uploadForm.remarks || '')
    formData.append('file', selectedFile.value)

    await portalApi.uploadStudentDocument(formData)

    message.success('Document uploaded successfully.')
    uploadOpen.value = false
    await loadDocuments()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to upload document.')
  } finally {
    uploading.value = false
  }
}
const loadDocuments = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentPortalDocuments()
    documents.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load documents.')
  } finally {
    loading.value = false
  }
}

onMounted(loadDocuments)
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
</style>