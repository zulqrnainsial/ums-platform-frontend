<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Student Enrollments</h2>
          <p>Academic enrollments created from admission finalization or student academic placement.</p>
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
          <a-col :xs="24" :md="8">
            <a-input
              v-model:value="filters.q"
              placeholder="Search student, roll no, registration no"
              allow-clear
              @pressEnter="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.status"
              allow-clear
              placeholder="Enrollment Status"
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

          <template v-else-if="column.key === 'academic'">
            <div>{{ record.program_name || '-' }}</div>
            <small>{{ record.academic_session_name || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'numbers'">
            <div>Roll: {{ record.roll_no || '-' }}</div>
            <div>Reg: {{ record.registration_no || '-' }}</div>
          </template>

          <template v-else-if="column.key === 'source'">
            <a-tag :color="record.admission_confirmation_id ? 'green' : 'default'">
              {{ record.admission_confirmation_id ? 'Admission Finalization' : 'Manual / Legacy' }}
            </a-tag>
            <div>
              <small>{{ record.admission_confirmation_no || '-' }}</small>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag>{{ record.status || '-' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button size="small" type="primary" @click="openEnrollmentModal(record)">
                Edit
            </a-button>
          </template>
        </template>
      </a-table>
      <a-modal
  v-model:open="enrollmentOpen"
  title="Complete Enrollment Details"
  ok-text="Save"
  :confirm-loading="enrollmentSaving"
  @ok="saveEnrollment"
>
  <a-form layout="vertical">
    <a-form-item label="Student">
      <a-input :value="selectedEnrollment?.student_name" disabled />
    </a-form-item>

    <a-row :gutter="[12, 12]">
      <a-col :xs="24" :md="12">
        <a-form-item label="Roll No">
          <a-input v-model:value="enrollmentForm.roll_no" />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12">
        <a-form-item label="Registration No">
          <a-input v-model:value="enrollmentForm.registration_no" />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12">
        <a-form-item label="Section">
          <a-input v-model:value="enrollmentForm.section" />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12">
        <a-form-item label="Status">
          <a-select
            v-model:value="enrollmentForm.status"
            :options="statusOptions"
            allow-clear
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-form-item label="Remarks">
      <a-textarea
        v-model:value="enrollmentForm.remarks"
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
const rows = ref<any[]>([])

const filters = reactive<any>({
  q: '',
  status: undefined,
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
})
const enrollmentOpen = ref(false)
const enrollmentSaving = ref(false)
const selectedEnrollment = ref<any>(null)
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
const enrollmentForm = reactive<any>({
  roll_no: '',
  registration_no: '',
  section: '',
  status: undefined,
  remarks: '',
})
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admitted', value: 'admitted' },
  { label: 'Active', value: 'active' },
  { label: 'Enrolled', value: 'enrolled' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Frozen', value: 'frozen' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const columns = [
  { title: 'Student', key: 'student' },
  { title: 'Academic', key: 'academic' },
  { title: 'Roll / Registration', key: 'numbers' },
  { title: 'Source', key: 'source' },
  { title: 'Status', key: 'status', width: 130 },
  { title: 'Action', key: 'action', width: 100 },
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

const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await api.getStudentManagementEnrollments(cleanFilters())
    const paginator = unwrapPaginator(response)

rows.value = paginator.data || []
pagination.total = paginator.total || rows.value.length
pagination.current = paginator.current_page || pagination.current
    

    
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load enrollments.')
  } finally {
    loading.value = false
  }
}
const openEnrollmentModal = (record: any) => {
  selectedEnrollment.value = record

  enrollmentForm.roll_no = record.roll_no || ''
  enrollmentForm.registration_no = record.registration_no || ''
  enrollmentForm.section = record.section || ''
  enrollmentForm.status = record.status || undefined
  enrollmentForm.remarks = record.remarks || ''

  enrollmentOpen.value = true
}

const saveEnrollment = async () => {
  if (!selectedEnrollment.value?.id) {
    return
  }

  enrollmentSaving.value = true

  try {
    await api.updateStudentEnrollment(selectedEnrollment.value.id, {
      roll_no: enrollmentForm.roll_no,
      registration_no: enrollmentForm.registration_no,
      section: enrollmentForm.section,
      status: enrollmentForm.status,
      remarks: enrollmentForm.remarks,
    })

    message.success('Enrollment updated successfully.')
    enrollmentOpen.value = false
    await loadRows()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to update enrollment.')
  } finally {
    enrollmentSaving.value = false
  }
}
const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadRows()
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