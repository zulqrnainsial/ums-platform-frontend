<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Attendance Sessions</h2>
          <p>View saved course-wise attendance sessions.</p>
        </div>

        <a-space>
          <NuxtLink to="/attendance/mark">
            <a-button type="primary">Mark Attendance</a-button>
          </NuxtLink>

          <a-button @click="loadSessions">
            Refresh
          </a-button>
        </a-space>
      </div>

      <a-card title="Filters" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="filters.academic_session_id"
              placeholder="Session ID"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="filters.program_id"
              placeholder="Program ID"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="filters.student_batch_id"
              placeholder="Batch ID"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="filters.section_id"
              placeholder="Section ID"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
              v-model:value="filters.status_code"
              allow-clear
              placeholder="Status"
              style="width: 100%"
              :options="statusOptions"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button type="primary" block @click="loadSessions">
              Search
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-table
        :data-source="sessions"
        row-key="id"
        bordered
        size="small"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <a-table-column title="Date" data-index="attendance_date" />
        <a-table-column title="Session" data-index="academic_session_name" />
        <a-table-column title="Term" data-index="academic_term_name" />
        <a-table-column title="Program" data-index="program_name" />
        <a-table-column title="Batch" data-index="batch_name" />
        <a-table-column title="Section" data-index="section_name" />
        <a-table-column title="Course">
          <template #default="{ record }">
            <div>
              <strong>{{ record.course_code || '-' }}</strong>
              <div>{{ record.course_title || '-' }}</div>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="Type" data-index="session_type" />

        <a-table-column title="Status">
          <template #default="{ record }">
            <a-tag :color="statusColor(record.status_code)">
              {{ record.status_code }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="Actions">
          <template #default="{ record }">
            <a-space>
              <a-button size="small" @click="openDetails(record)">
                View
              </a-button>

              <a-button
                size="small"
                danger
                :disabled="record.status_code === 'locked'"
                @click="deleteSession(record)"
              >
                Delete
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>

      <a-modal
        v-model:open="detailModal.visible"
        title="Attendance Session Details"
        width="900px"
        :footer="null"
      >
        <a-descriptions
          v-if="detail.session"
          bordered
          size="small"
          :column="2"
          class="mb-3"
        >
          <a-descriptions-item label="Date">
            {{ detail.session.attendance_date }}
          </a-descriptions-item>

          <a-descriptions-item label="Status">
            {{ detail.session.status_code }}
          </a-descriptions-item>

          <a-descriptions-item label="Course">
            {{ detail.session.course_code }} - {{ detail.session.course_title }}
          </a-descriptions-item>

          <a-descriptions-item label="Topic">
            {{ detail.session.topic || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-table
          :data-source="detail.records || []"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 10 }"
        >
          <a-table-column title="Student No" data-index="student_no" />
          <a-table-column title="Name" data-index="student_name" />
          <a-table-column title="Roll No" data-index="roll_no" />
          <a-table-column title="Status">
            <template #default="{ record }">
              <a-tag :color="attendanceColor(record.status_code)">
                {{ record.status_code }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="Remarks" data-index="remarks" />
        </a-table>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message, Modal } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApi()

const loading = ref(false)
const sessions = ref<any[]>([])

const filters = reactive<any>({
  academic_session_id: undefined,
  program_id: undefined,
  student_batch_id: undefined,
  section_id: undefined,
  status_code: undefined,
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
})

const detailModal = reactive({
  visible: false,
})

const detail = reactive<any>({
  session: null,
  records: [],
})

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Locked', value: 'locked' },
  { label: 'Cancelled', value: 'cancelled' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const statusColor = (status: string) => {
  if (status === 'locked') return 'red'
  if (status === 'submitted') return 'green'
  if (status === 'cancelled') return 'orange'
  return 'blue'
}

const attendanceColor = (status: string) => {
  if (status === 'present') return 'green'
  if (status === 'absent') return 'red'
  if (status === 'late') return 'orange'
  if (status === 'leave') return 'blue'
  return 'default'
}

const loadSessions = async () => {
  loading.value = true

  try {
    const response: any = await api.getAttendanceSessions({
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    })

    const payload = unwrap(response)

    sessions.value = payload.data || []
    pagination.total = payload.total || 0
    pagination.current = payload.current_page || pagination.current
    pagination.pageSize = payload.per_page || pagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attendance sessions.')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadSessions()
}

const openDetails = async (record: any) => {
  try {
    const response: any = await api.getAttendanceSession(record.id)
    const payload = unwrap(response)

    detail.session = payload.session || null
    detail.records = payload.records || []
    detailModal.visible = true
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load session details.')
  }
}

const deleteSession = (record: any) => {
  Modal.confirm({
    title: 'Delete attendance session?',
    content: 'This will soft-delete the attendance session. Locked sessions cannot be deleted.',
    okText: 'Delete',
    okType: 'danger',
    async onOk() {
      try {
        await api.apiFetch(`/attendance/sessions/${record.id}`, {
          method: 'DELETE',
        })

        message.success('Attendance session deleted.')
        await loadSessions()
      } catch (error: any) {
        message.error(error?.data?.message || 'Unable to delete attendance session.')
      }
    },
  })
}

onMounted(loadSessions)
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>