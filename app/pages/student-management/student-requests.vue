<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Student Requests</h2>
          <p>Review profile correction, document resubmission and course add/drop requests.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-management/students">
            <a-button>Students</a-button>
          </NuxtLink>
          <a-button @click="loadRows">Refresh</a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="7">
            <a-input
              v-model:value="filters.q"
              placeholder="Search request no, student"
              allow-clear
              @pressEnter="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.request_type"
              allow-clear
              placeholder="Request Type"
              :options="requestTypeOptions"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.status"
              allow-clear
              placeholder="Status"
              :options="statusOptions"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button type="primary" block @click="loadRows">
              Search
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-table
        :columns="columns"
        :data-source="rows"
        row-key="id"
        size="small"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'student'">
            <strong>{{ record.student_no || '-' }}</strong>
            <div>{{ record.student_name || '-' }}</div>
            <small>{{ record.cnic_bform || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'request'">
            <strong>{{ record.request_no || '-' }}</strong>
            <div>{{ record.title || '-' }}</div>
            <small>{{ record.request_type }}</small>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-button size="small" type="primary" @click="openDecision(record)">
              Review
            </a-button>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="decisionOpen"
        title="Review Student Request"
        ok-text="Save Decision"
        :confirm-loading="saving"
        width="760px"
        @ok="saveDecision"
      >
        <a-descriptions bordered size="small" :column="2" class="mb-3">
          <a-descriptions-item label="Request No">
            {{ selectedRequest?.request_no || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="Student">
            {{ selectedRequest?.student_name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="Type">
            {{ selectedRequest?.request_type || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="Status">
            {{ selectedRequest?.status || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-card title="Requested Payload" size="small" class="mb-3">
          <pre>{{ parsedPayload }}</pre>
        </a-card>

        <a-form layout="vertical">
          <a-form-item label="Decision" required>
            <a-select
              v-model:value="decisionForm.decision"
              :options="decisionOptions"
            />
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="decisionForm.apply_changes">
              Apply changes automatically after approval
            </a-checkbox>
          </a-form-item>

          <a-form-item label="Admin Remarks">
            <a-textarea
              v-model:value="decisionForm.admin_remarks"
              :rows="3"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApi()

const loading = ref(false)
const saving = ref(false)
const rows = ref<any[]>([])

const decisionOpen = ref(false)
const selectedRequest = ref<any>(null)

const filters = reactive<any>({
  q: '',
  request_type: undefined,
  status: undefined,
})

const decisionForm = reactive<any>({
  decision: 'approved',
  apply_changes: true,
  admin_remarks: '',
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
})

const requestTypeOptions = [
  { label: 'Profile Correction', value: 'profile_correction' },
  { label: 'Document Resubmission', value: 'document_resubmission' },
  { label: 'Course Add / Drop', value: 'course_add_drop' },
]

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const decisionOptions = [
  { label: 'Approve', value: 'approved' },
  { label: 'Reject', value: 'rejected' },
]

const columns = [
  { title: 'Student', key: 'student' },
  { title: 'Request', key: 'request' },
  { title: 'Submitted', dataIndex: 'submitted_at' },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Action', key: 'action', width: 100 },
]

const parsedPayload = computed(() => {
  const payload = selectedRequest.value?.requested_payload_json

  if (!payload) {
    return '{}'
  }

  if (typeof payload === 'string') {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2)
    } catch {
      return payload
    }
  }

  return JSON.stringify(payload, null, 2)
})

const statusColor = (status: string) => {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'pending') return 'orange'
  return 'blue'
}

const cleanFilters = () => {
  const payload: any = {
    page: pagination.current,
    per_page: pagination.pageSize,
  }

  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      payload[key] = filters[key]
    }
  })

  return payload
}

const unwrapPaginator = (response: any) => {
  if (response?.success && response?.data?.data) {
    return response.data
  }

  if (response?.data?.success && response?.data?.data?.data) {
    return response.data.data
  }

  if (response?.data?.data) {
    return response.data
  }

  if (response?.data) {
    return response.data
  }

  return response || {}
}

const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await api.getStudentRequests(cleanFilters())
    const paginator = unwrapPaginator(response)

    rows.value = paginator.data || []
    pagination.total = paginator.total || rows.value.length
    pagination.current = paginator.current_page || pagination.current
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load student requests.')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadRows()
}

const openDecision = (record: any) => {
  selectedRequest.value = record

  Object.assign(decisionForm, {
    decision: 'approved',
    apply_changes: true,
    admin_remarks: '',
  })

  decisionOpen.value = true
}

const saveDecision = async () => {
  if (!selectedRequest.value?.id) {
    return
  }

  saving.value = true

  try {
    await api.decideStudentRequest(selectedRequest.value.id, decisionForm)

    message.success('Student request decision saved.')
    decisionOpen.value = false
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save decision.')
  } finally {
    saving.value = false
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

.mb-3 {
  margin-bottom: 16px;
}

pre {
  white-space: pre-wrap;
  margin: 0;
}
</style>