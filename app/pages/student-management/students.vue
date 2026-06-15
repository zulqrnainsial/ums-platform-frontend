<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Students</h2>
          <p>Students transferred from Admission and available for academic lifecycle management.</p>
        </div>

        <a-space>
            <NuxtLink to="/student-management/lifecycle-actions">
                <a-button>Lifecycle Actions</a-button>
            </NuxtLink>

            <NuxtLink to="/student-management/section-batch-allocation">
                <a-button>Section / Batch Allocation</a-button>
            </NuxtLink>

            <NuxtLink to="/student-management/enrollments">
                <a-button>Enrollments</a-button>
            </NuxtLink>
            <NuxtLink to="/student-management/student-requests">
                <a-button>
                    Student Requests
                </a-button>
            </NuxtLink>
            <a-button @click="loadRows">Refresh</a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="8">
            <a-input
              v-model:value="filters.q"
              placeholder="Search student no, name, CNIC, phone"
              allow-clear
              @pressEnter="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.student_status"
              allow-clear
              placeholder="Student Status"
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
            <div>{{ record.full_name || '-' }}</div>
            <small>{{ record.cnic_bform || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'contact'">
            <div>{{ record.phone || '-' }}</div>
            <small>{{ record.email || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'academic'">
            <div>{{ record.program_name || '-' }}</div>
            <small>{{ record.academic_session_name || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'enrollment'">
            <div>Roll: {{ record.roll_no || '-' }}</div>
            <div>Reg: {{ record.registration_no || '-' }}</div>
            <a-tag>{{ record.enrollment_status || '-' }}</a-tag>
          </template>

          <template v-else-if="column.key === 'source'">
            <a-tag :color="record.admission_confirmation_id ? 'green' : 'default'">
              {{ record.source_label || '-' }}
            </a-tag>
            <div>
              <small>{{ record.admission_confirmation_no || record.applicant_no || '-' }}</small>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag>{{ record.student_status || '-' }}</a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
                <a-button size="small" @click="openDetail(record)">
                    View
                </a-button>

                <a-button size="small" type="primary" @click="openStatusModal(record)">
                    Status
                </a-button>

                <NuxtLink :to="`/student-management/course-registration/${record.id}`">
                    <a-button size="small">
                    Courses
                    </a-button>
                </NuxtLink>

                <NuxtLink :to="`/student-management/profile-completion/${record.id}`">
                    <a-button size="small">
                    Profile
                    </a-button>
                </NuxtLink>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-drawer
        v-model:open="detailOpen"
        title="Student Detail"
        width="900"
      >
        <a-spin :spinning="detailLoading">
          <template v-if="detail?.student">
            <a-descriptions bordered size="small" :column="2" class="mb-3">
              <a-descriptions-item label="Student No">
                {{ detail.student.student_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Name">
                {{ detail.student.full_name || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="CNIC/B-Form">
                {{ detail.student.cnic_bform || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Status">
                {{ detail.student.student_status || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Program">
                {{ detail.student.program_name || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Academic Session">
                {{ detail.student.academic_session_name || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Admission Source">
                {{ detail.student.source_label || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Confirmation No">
                {{ detail.student.admission_confirmation_no || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-card title="Enrollments" size="small" class="mb-3">
              <a-table
                :data-source="detail.enrollments || []"
                row-key="id"
                size="small"
                :pagination="false"
              >
                <a-table-column title="Program" data-index="program_name" />
                <a-table-column title="Session" data-index="academic_session_name" />
                <a-table-column title="Roll No" data-index="roll_no" />
                <a-table-column title="Reg No" data-index="registration_no" />
                <a-table-column title="Status" data-index="status" />
              </a-table>
            </a-card>

            <a-card title="Documents" size="small" class="mb-3">
              <a-table
                :data-source="detail.documents || []"
                row-key="id"
                size="small"
                :pagination="false"
              >
                <a-table-column title="Title" data-index="document_title" />
                <a-table-column title="File" data-index="file_name" />
                <a-table-column title="Verification" data-index="verification_status" />
              </a-table>
            </a-card>

            <a-card title="Status History" size="small">
              <a-table
                :data-source="detail.status_histories || []"
                row-key="id"
                size="small"
                :pagination="false"
              >
                <a-table-column title="From" data-index="from_status" />
                <a-table-column title="To" data-index="to_status" />
                <a-table-column title="Effective Date" data-index="effective_date" />
                <a-table-column title="Reason" data-index="reason" />
              </a-table>
            </a-card>
          </template>
        </a-spin>
      </a-drawer>
    <a-modal
  v-model:open="statusOpen"
  title="Update Student Status"
  ok-text="Update"
  :confirm-loading="statusSaving"
  @ok="saveStudentStatus"
>
  <a-form layout="vertical">
    <a-form-item label="Student">
      <a-input :value="selectedStudent?.full_name" disabled />
    </a-form-item>

    <a-form-item label="Current Status">
      <a-input :value="selectedStudent?.student_status" disabled />
    </a-form-item>

    <a-form-item label="New Status" required>
      <a-select
        v-model:value="statusForm.student_status"
        :options="statusOptions"
        placeholder="Select new status"
      />
    </a-form-item>

    <a-form-item label="Effective Date">
      <a-date-picker
        v-model:value="statusForm.effective_date"
        style="width: 100%"
        value-format="YYYY-MM-DD"
      />
    </a-form-item>

    <a-form-item label="Reason">
      <a-textarea
        v-model:value="statusForm.reason"
        :rows="3"
        placeholder="Reason for status change"
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
const rows = ref<any[]>([])

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<any>(null)

const filters = reactive<any>({
  q: '',
  student_status: undefined,
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
})
const statusOpen = ref(false)
const statusSaving = ref(false)
const selectedStudent = ref<any>(null)

const statusForm = reactive<any>({
  student_status: undefined,
  effective_date: undefined,
  reason: '',
})
const statusOptions = [
  { label: 'Admitted', value: 'admitted' },
  { label: 'Active', value: 'active' },
  { label: 'Enrolled', value: 'enrolled' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Frozen', value: 'frozen' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Graduated', value: 'graduated' },
  { label: 'Cancelled', value: 'cancelled' },
]

const columns = [
  { title: 'Student', key: 'student' },
  { title: 'Contact', key: 'contact' },
  { title: 'Academic', key: 'academic' },
  { title: 'Enrollment', key: 'enrollment' },
  { title: 'Source', key: 'source' },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Action', key: 'action', width: 90 },
]

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
const openStatusModal = (record: any) => {
  selectedStudent.value = record
  statusForm.student_status = record.student_status || undefined
  statusForm.effective_date = undefined
  statusForm.reason = ''
  statusOpen.value = true
}

const saveStudentStatus = async () => {
  if (!selectedStudent.value?.id) {
    return
  }

  if (!statusForm.student_status) {
    message.error('Please select student status.')
    return
  }

  statusSaving.value = true

  try {
    await api.updateStudentAcademicStatus(selectedStudent.value.id, {
      student_status: statusForm.student_status,
      effective_date: statusForm.effective_date,
      reason: statusForm.reason,
    })

    message.success('Student status updated successfully.')
    statusOpen.value = false
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to update student status.')
  } finally {
    statusSaving.value = false
  }
}
const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await api.getStudentManagementStudents(cleanFilters())
    const paginator = unwrapPaginator(response)

    rows.value = paginator.data || []
    pagination.total = paginator.total || rows.value.length
    pagination.current = paginator.current_page || pagination.current
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load students.')
  } finally {
    loading.value = false
  }
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
const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadRows()
}

const openDetail = async (record: any) => {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const response: any = await api.getStudentManagementStudent(record.id)
    detail.value = response?.data?.data || response?.data || response
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load student detail.')
  } finally {
    detailLoading.value = false
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
</style>