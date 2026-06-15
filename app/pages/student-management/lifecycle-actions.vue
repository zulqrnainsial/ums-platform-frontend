<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Student Lifecycle Actions</h2>
          <p>Freeze, withdraw, transfer, reactivate or cancel student academic lifecycle.</p>
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
          <a-col :xs="24" :md="7">
            <a-input
              v-model:value="filters.q"
              placeholder="Search student, CNIC, roll no"
              allow-clear
              @pressEnter="loadContext"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.student_status"
              allow-clear
              placeholder="Student Status"
              :options="studentStatusOptions"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.lifecycle_status"
              allow-clear
              placeholder="Lifecycle Status"
              :options="lifecycleStatusOptions"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button type="primary" block @click="loadContext">
              Search
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-table
        :columns="columns"
        :data-source="rows"
        row-key="student_id"
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
            <div>
              Section: {{ record.section || '-' }}
            </div>
          </template>

          <template v-else-if="column.key === 'numbers'">
            <div>Roll: {{ record.roll_no || '-' }}</div>
            <div>Reg: {{ record.registration_no || '-' }}</div>
          </template>

          <template v-else-if="column.key === 'status'">
            <div>
              <a-tag>{{ record.student_status || '-' }}</a-tag>
            </div>
            <div>
              <a-tag color="blue">{{ record.lifecycle_status || '-' }}</a-tag>
            </div>
            <small>{{ record.lifecycle_effective_date || '' }}</small>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-button size="small" type="primary" @click="openLifecycleModal(record)">
              Action
            </a-button>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="actionOpen"
        title="Apply Lifecycle Action"
        ok-text="Apply"
        :confirm-loading="saving"
        width="760px"
        @ok="saveLifecycleAction"
      >
        <a-alert
          class="mb-3"
          type="warning"
          show-icon
          message="This action updates student and enrollment status and creates a status history record."
        />

        <a-form layout="vertical">
          <a-row :gutter="[12, 12]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Student">
                <a-input :value="selectedRow?.student_name" disabled />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Current Status">
                <a-input :value="selectedRow?.student_status" disabled />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Action" required>
                <a-select
                  v-model:value="actionForm.action_code"
                  :options="actionOptions"
                  placeholder="Select action"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Effective Date">
                <a-date-picker
                  v-model:value="actionForm.effective_date"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>

            <template v-if="actionForm.action_code === 'transfer'">
              <a-col :xs="24" :md="12">
                <a-form-item label="Target Program ID" required>
                  <a-select
  v-model:value="actionForm.target_program_id"
  placeholder="Select target program"
  allow-clear
  :options="programOptions"
/>
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="12">
                <a-form-item label="Target Academic Session ID" required>
                  <a-select
  v-model:value="actionForm.target_academic_session_id"
  placeholder="Select target academic session"
  allow-clear
  :options="academicSessionOptions"
/>
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="12">
                <a-form-item label="Target Term ID">
                  <a-select
  v-model:value="actionForm.target_term_id"
  placeholder="Select target term"
  allow-clear
  :options="academicTermOptions"
/>
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="12">
                <a-form-item label="Target Section">
                  <a-select
  v-model:value="actionForm.target_section"
  placeholder="Select target section"
  allow-clear
  :options="sectionOptions"
/>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
  <a-form-item label="Target Batch">
    <a-select
      v-model:value="actionForm.target_student_batch_id"
      placeholder="Select target batch"
      allow-clear
      :options="batchOptions"
    />
  </a-form-item>
</a-col>
            </template>

            <a-col :xs="24">
              <a-form-item label="Reason" required>
                <a-textarea
                  v-model:value="actionForm.reason"
                  :rows="3"
                  placeholder="Reason is required for audit trail"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24">
              <a-form-item label="Remarks">
                <a-textarea
                  v-model:value="actionForm.remarks"
                  :rows="2"
                />
              </a-form-item>
            </a-col>
          </a-row>
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
const actions = ref<Record<string, any>>({})

const actionOpen = ref(false)
const selectedRow = ref<any>(null)

const filters = reactive<any>({
  q: '',
  student_status: undefined,
  lifecycle_status: undefined,
})
const placementOptions = ref<any>({
  programs: [],
  academic_sessions: [],
  academic_terms: [],
  sections: [],
  student_batches: [],
})
const actionForm = reactive<any>({
  action_code: undefined,
  student_enrollment_id: undefined,
  reason: '',
  effective_date: undefined,
  remarks: '',
  target_program_id: undefined,
  target_academic_session_id: undefined,
  target_term_id: undefined,
  target_section: '',
  target_student_batch_id: undefined,
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
})

const studentStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Enrolled', value: 'enrolled' },
  { label: 'Frozen', value: 'frozen' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Graduated', value: 'graduated' },
]

const lifecycleStatusOptions = [
  { label: 'Freeze', value: 'freeze' },
  { label: 'Withdraw', value: 'withdraw' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Reactivate', value: 'reactivate' },
  { label: 'Cancel', value: 'cancel' },
]

const actionOptions = computed(() =>
  Object.keys(actions.value || {}).map((key) => ({
    label: actions.value[key]?.label || key,
    value: key,
  })),
)
const programOptions = computed(() =>
  (placementOptions.value.programs || []).map((row: any) => ({
    label: row.label,
    value: row.id,
  })),
)

const academicSessionOptions = computed(() =>
  (placementOptions.value.academic_sessions || []).map((row: any) => ({
    label: row.label,
    value: row.id,
  })),
)

const academicTermOptions = computed(() =>
  (placementOptions.value.academic_terms || []).map((row: any) => ({
    label: row.label,
    value: row.id,
  })),
)

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
const columns = [
  { title: 'Student', key: 'student' },
  { title: 'Academic', key: 'academic' },
  { title: 'Roll / Registration', key: 'numbers' },
  { title: 'Status', key: 'status', width: 170 },
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
const loadPlacementOptions = async () => {
  try {
    const response: any = await api.getStudentAcademicPlacementOptions({
      program_id: actionForm.target_program_id,
      academic_session_id: actionForm.target_academic_session_id,
    })

    placementOptions.value = response?.data?.data || response?.data || response || {}
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load academic placement options.')
  }
}
const loadContext = async () => {
  loading.value = true

  try {
    const response: any = await api.getStudentLifecycleContext(cleanFilters())
    const data = response?.data?.data || response?.data || response || {}

    const paginator = data.students || {}

    rows.value = paginator.data || []
    pagination.total = paginator.total || rows.value.length
    pagination.current = paginator.current_page || pagination.current

    actions.value = data.actions || {}
    await loadPlacementOptions()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load lifecycle context.')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadContext()
}

const openLifecycleModal = (record: any) => {
  selectedRow.value = record

  Object.assign(actionForm, {
    action_code: undefined,
    student_enrollment_id: record.student_enrollment_id || undefined,
    reason: '',
    effective_date: undefined,
    remarks: '',
    target_program_id: undefined,
    target_academic_session_id: undefined,
    target_term_id: undefined,
    target_section: '',
    target_student_batch_id: undefined,
  })

  actionOpen.value = true
}

const saveLifecycleAction = async () => {
  if (!selectedRow.value?.student_id) {
    return
  }

  if (!actionForm.action_code) {
    message.error('Please select lifecycle action.')
    return
  }

  if (!actionForm.reason) {
    message.error('Reason is required.')
    return
  }

  if (actionForm.action_code === 'transfer') {
    if (!actionForm.target_program_id || !actionForm.target_academic_session_id) {
      message.error('Target program and academic session are required for transfer.')
      return
    }
  }

  saving.value = true

  try {
    await api.applyStudentLifecycleAction(selectedRow.value.student_id, actionForm)
    message.success('Lifecycle action applied successfully.')
    actionOpen.value = false
    await loadContext()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to apply lifecycle action.')
  } finally {
    saving.value = false
  }
}
watch(
  () => [actionForm.target_program_id, actionForm.target_academic_session_id],
  async () => {
    if (actionOpen.value && actionForm.action_code === 'transfer') {
      await loadPlacementOptions()
    }
  },
)
onMounted(loadContext)
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