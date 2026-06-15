<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Section / Batch Allocation</h2>
          <p>Allocate admitted/enrolled students into batches, sections, roll numbers and registration numbers.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-management/students">
            <a-button>Students</a-button>
          </NuxtLink>
          <a-button @click="loadContext">Refresh</a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-input
              v-model:value="filters.q"
              placeholder="Search student"
              allow-clear
              @pressEnter="loadContext"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.allocation_status"
              placeholder="Allocation Status"
              allow-clear
              :options="allocationStatusOptions"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input
              v-model:value="filters.section"
              placeholder="Section"
              allow-clear
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button type="primary" block @click="loadContext">
              Search
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card class="mb-3" title="Bulk Allocation">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-select
              v-model:value="bulkForm.student_batch_id"
              placeholder="Batch"
              allow-clear
              :options="batchOptions"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-select
  v-model:value="bulkForm.section"
  placeholder="Section"
  allow-clear
  :options="sectionOptions"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input
              v-model:value="bulkForm.roll_prefix"
              placeholder="Roll Prefix e.g. BSCS-26-"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input
              v-model:value="bulkForm.registration_prefix"
              placeholder="Reg Prefix e.g. REG-26-"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-input-number
              v-model:value="bulkForm.start_roll_no"
              placeholder="Start"
              style="width: 100%"
              :min="1"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-input-number
              v-model:value="bulkForm.padding"
              placeholder="Pad"
              style="width: 100%"
              :min="1"
              :max="10"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
              v-model:value="bulkForm.allocation_status"
              :options="allocationStatusOptions"
              placeholder="Status"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-checkbox v-model:checked="bulkForm.overwrite_existing">
              Overwrite existing
            </a-checkbox>
          </a-col>

          <a-col :xs="24" :md="5">
            <a-button
              type="primary"
              danger
              block
              :disabled="selectedEnrollmentIds.length === 0"
              @click="bulkAllocate"
            >
              Allocate Selected
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
        :row-selection="rowSelection"
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

          <template v-else-if="column.key === 'batch'">
            <div>{{ record.batch_code || '-' }}</div>
            <small>{{ record.batch_name || '-' }}</small>
          </template>

          <template v-else-if="column.key === 'allocation'">
            <div>Section: {{ record.section || '-' }}</div>
            <div>Roll: {{ record.roll_no || '-' }}</div>
            <div>Reg: {{ record.registration_no || '-' }}</div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag>{{ record.allocation_status || 'pending' }}</a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-button size="small" type="primary" @click="openEdit(record)">
              Edit
            </a-button>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="editOpen"
        title="Edit Enrollment Allocation"
        ok-text="Save"
        :confirm-loading="saving"
        @ok="saveSingleAllocation"
      >
        <a-form layout="vertical">
          <a-form-item label="Student">
            <a-input :value="selectedRow?.student_name" disabled />
          </a-form-item>

          <a-form-item label="Batch">
            <a-select
              v-model:value="editForm.student_batch_id"
              allow-clear
              :options="batchOptions"
            />
          </a-form-item>

          <a-row :gutter="[12, 12]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Section">
                <a-select
  v-model:value="editForm.section"
  placeholder="Section"
  allow-clear
  :options="sectionOptions"
/>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Roll Sequence">
                <a-input-number
                  v-model:value="editForm.roll_sequence_no"
                  style="width: 100%"
                  :min="1"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Roll No">
                <a-input v-model:value="editForm.roll_no" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Registration No">
                <a-input v-model:value="editForm.registration_no" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Allocation Status">
                <a-select
                  v-model:value="editForm.allocation_status"
                  :options="allocationStatusOptions"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="Remarks">
            <a-textarea v-model:value="editForm.remarks" :rows="3" />
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
const batches = ref<any[]>([])
const sections = ref<string[]>([])
const selectedEnrollmentIds = ref<number[]>([])

const editOpen = ref(false)
const selectedRow = ref<any>(null)

const filters = reactive<any>({
  q: '',
  allocation_status: undefined,
  section: '',
})

const bulkForm = reactive<any>({
  student_batch_id: undefined,
  section: '',
  roll_prefix: '',
  registration_prefix: '',
  start_roll_no: 1,
  padding: 3,
  allocation_status: 'allocated',
  overwrite_existing: false,
})
const placementOptions = ref<any>({
  programs: [],
  academic_sessions: [],
  academic_terms: [],
  sections: [],
  student_batches: [],
})
const editForm = reactive<any>({
  student_batch_id: undefined,
  section: '',
  roll_no: '',
  registration_no: '',
  roll_sequence_no: undefined,
  allocation_status: 'allocated',
  remarks: '',
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
})

const allocationStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Allocated', value: 'allocated' },
  { label: 'Enrolled', value: 'enrolled' },
  { label: 'Active', value: 'active' },
  { label: 'Cancelled', value: 'cancelled' },
]

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

const columns = [
  { title: 'Student', key: 'student' },
  { title: 'Academic', key: 'academic' },
  { title: 'Batch', key: 'batch' },
  { title: 'Allocation', key: 'allocation' },
  { title: 'Status', key: 'status', width: 130 },
  { title: 'Action', key: 'action', width: 100 },
]

const rowSelection = computed(() => ({
  selectedRowKeys: selectedEnrollmentIds.value,
  onChange: (keys: any[]) => {
    selectedEnrollmentIds.value = keys.map(Number)
  },
}))

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
const sectionOptions = computed(() =>
  (placementOptions.value.sections || []).map((row: any) => ({
    label: row.label || row.code || row.value,
    value: row.value || row.code || row.label,
  })),
)

const batchOptions = computed(() =>
  (placementOptions.value.student_batches || []).map((row: any) => ({
    label: `${row.code || ''} ${row.label || ''}`.trim(),
    value: row.id,
  })),
)
const loadPlacementOptions = async () => {
  try {
    const response: any = await api.getStudentAcademicPlacementOptions({})
    placementOptions.value = response?.data?.data || response?.data || response || {}
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load academic placement options.')
  }
}

const loadContext = async () => {
  loading.value = true

  try {
    await loadPlacementOptions()
    const response: any = await api.getStudentSectionBatchAllocationContext(cleanFilters())
    const payload = response?.data?.data || response?.data || response || {}

const paginator = payload.enrollments || {}

rows.value = paginator.data || []
pagination.total = paginator.total || rows.value.length
pagination.current = paginator.current_page || pagination.current

batches.value = payload.batches || []
sections.value = payload.sections || []

    selectedEnrollmentIds.value = []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load allocation context.')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadContext()
}

const bulkAllocate = async () => {
  if (selectedEnrollmentIds.value.length === 0) {
    message.error('Please select students.')
    return
  }

  if (!bulkForm.section) {
    message.error('Section is required.')
    return
  }

  saving.value = true

  try {
    await api.bulkAllocateStudentSectionBatch({
      student_enrollment_ids: selectedEnrollmentIds.value,
      student_batch_id: bulkForm.student_batch_id,
      section: bulkForm.section,
      roll_prefix: bulkForm.roll_prefix,
      registration_prefix: bulkForm.registration_prefix,
      start_roll_no: bulkForm.start_roll_no,
      padding: bulkForm.padding,
      allocation_status: bulkForm.allocation_status,
      overwrite_existing: bulkForm.overwrite_existing,
    })

    message.success('Students allocated successfully.')
    await loadContext()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to allocate students.')
  } finally {
    saving.value = false
  }
}

const openEdit = (record: any) => {
  selectedRow.value = record

  editForm.student_batch_id = record.student_batch_id || undefined
  editForm.section = record.section || ''
  editForm.roll_no = record.roll_no || ''
  editForm.registration_no = record.registration_no || ''
  editForm.roll_sequence_no = record.roll_sequence_no || undefined
  editForm.allocation_status = record.allocation_status || 'allocated'
  editForm.remarks = ''

  editOpen.value = true
}

const saveSingleAllocation = async () => {
  if (!selectedRow.value?.id) {
    return
  }

  saving.value = true

  try {
    await api.updateStudentEnrollmentAllocation(selectedRow.value.id, {
      student_batch_id: editForm.student_batch_id,
      section: editForm.section,
      roll_no: editForm.roll_no,
      registration_no: editForm.registration_no,
      roll_sequence_no: editForm.roll_sequence_no,
      allocation_status: editForm.allocation_status,
      remarks: editForm.remarks,
    })

    message.success('Enrollment allocation updated successfully.')
    editOpen.value = false
    await loadContext()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to update allocation.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadPlacementOptions()
  await loadContext()
})
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