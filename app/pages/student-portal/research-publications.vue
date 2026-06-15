<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Research / Publications</h2>
          <p>Submit and view research work, papers, projects and publications.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button type="primary" @click="openModal">Add</a-button>
          <a-button @click="loadRows">Refresh</a-button>
        </a-space>
      </div>

      <a-table
        :data-source="rows"
        row-key="id"
        size="small"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
      >
        <a-table-column title="Type" data-index="type" />
        <a-table-column title="Title" data-index="title" />
        <a-table-column title="Journal / Conference" data-index="journal_or_conference" />
        <a-table-column title="Year" data-index="publication_year" />
        <a-table-column title="Status" data-index="status" />

        <a-table-column title="Action">
          <template #default="{ record }">
            <a-space>
              <a v-if="record.attachment_url" :href="record.attachment_url" target="_blank">
                View
              </a>

              <a-popconfirm
                title="Delete this record?"
                @confirm="removeRecord(record)"
              >
                <a-button size="small" danger>
                  Delete
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </a-table>

      <a-modal
        v-model:open="open"
        title="Add Research / Publication"
        ok-text="Submit"
        :confirm-loading="saving"
        width="760px"
        @ok="save"
      >
        <a-form layout="vertical">
          <a-form-item label="Type">
            <a-select v-model:value="form.type" :options="typeOptions" />
          </a-form-item>

          <a-form-item label="Title" required>
            <a-input v-model:value="form.title" />
          </a-form-item>

          <a-form-item label="Journal / Conference">
            <a-input v-model:value="form.journal_or_conference" />
          </a-form-item>

          <a-row :gutter="[12, 12]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Publisher">
                <a-input v-model:value="form.publisher" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Publication Year">
                <a-input-number v-model:value="form.publication_year" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="DOI">
            <a-input v-model:value="form.doi" />
          </a-form-item>

          <a-form-item label="URL">
            <a-input v-model:value="form.url" />
          </a-form-item>

          <a-form-item label="Abstract">
            <a-textarea v-model:value="form.abstract" :rows="4" />
          </a-form-item>

          <a-form-item label="Attachment">
            <a-upload :before-upload="beforeSelectAttachment" :max-count="1">
              <a-button>Select Attachment</a-button>
            </a-upload>
          </a-form-item>

          <a-form-item label="Remarks">
            <a-textarea v-model:value="form.remarks" :rows="3" />
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
const saving = ref(false)
const open = ref(false)
const rows = ref<any[]>([])
const selectedAttachment = ref<File | null>(null)

const form = reactive<any>({
  type: 'publication',
  title: '',
  journal_or_conference: '',
  publisher: '',
  doi: '',
  url: '',
  publication_year: undefined,
  abstract: '',
  remarks: '',
})

const typeOptions = [
  { label: 'Publication', value: 'publication' },
  { label: 'Research Project', value: 'research_project' },
  { label: 'Conference Paper', value: 'conference_paper' },
  { label: 'Thesis', value: 'thesis' },
  { label: 'Other', value: 'other' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || []

const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentResearchPublications()
    rows.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load records.')
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  Object.assign(form, {
    type: 'publication',
    title: '',
    journal_or_conference: '',
    publisher: '',
    doi: '',
    url: '',
    publication_year: undefined,
    abstract: '',
    remarks: '',
  })

  selectedAttachment.value = null
  open.value = true
}

const beforeSelectAttachment = (file: File) => {
  selectedAttachment.value = file
  return false
}

const save = async () => {
  if (!form.title) {
    message.error('Title is required.')
    return
  }

  saving.value = true

  try {
    const formData = new FormData()

    Object.keys(form).forEach((key) => {
      if (form[key] !== undefined && form[key] !== null) {
        formData.append(key, form[key])
      }
    })

    if (selectedAttachment.value) {
      formData.append('attachment', selectedAttachment.value)
    }

    await portalApi.submitStudentResearchPublication(formData)

    message.success('Research/publication submitted.')
    open.value = false
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save record.')
  } finally {
    saving.value = false
  }
}

const removeRecord = async (record: any) => {
  try {
    await portalApi.deleteStudentResearchPublication(record.id)
    message.success('Record removed.')
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to delete record.')
  }
}

onMounted(loadRows)
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