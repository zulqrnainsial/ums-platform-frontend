<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Course Registration</h2>
          <p>Register available courses for the current academic term.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/courses">
            <a-button>My Courses</a-button>
          </NuxtLink>
          <a-button @click="loadAll">Refresh</a-button>
        </a-space>
      </div>

      <a-alert
        v-if="!settings?.student_self_registration_enabled"
        type="warning"
        show-icon
        message="Student self course registration is currently disabled."
        class="mb-3"
      />

      <a-alert
        v-else-if="!settings?.window_open"
        type="warning"
        show-icon
        message="Course registration window is currently closed."
        class="mb-3"
      />

      <a-card title="Registration Settings" class="mb-3">
        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="Self Registration">
            <a-tag :color="settings?.student_self_registration_enabled ? 'green' : 'red'">
              {{ settings?.student_self_registration_enabled ? 'Enabled' : 'Disabled' }}
            </a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="Window">
            <a-tag :color="settings?.window_open ? 'green' : 'orange'">
              {{ settings?.window_open ? 'Open' : 'Closed' }}
            </a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="Requires Approval">
            {{ settings?.requires_admin_approval ? 'Yes' : 'No' }}
          </a-descriptions-item>

          <a-descriptions-item label="Add / Drop Allowed">
            {{ settings?.allow_add_drop ? 'Yes' : 'No' }}
          </a-descriptions-item>

          <a-descriptions-item label="Min Credit Hours">
            {{ settings?.min_credit_hours ?? '-' }}
          </a-descriptions-item>

          <a-descriptions-item label="Max Credit Hours">
            {{ settings?.max_credit_hours ?? '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-input-number
              v-model:value="filters.term_number"
              placeholder="Term Number"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button type="primary" block @click="loadAvailableCourses">
              Load Courses
            </a-button>
          </a-col>

          <a-col :xs="24" :md="6">
            <a-statistic
              title="Selected Credit Hours"
              :value="selectedCreditHours"
              :precision="2"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button
              type="primary"
              block
              :disabled="!canSubmit"
              :loading="submitting"
              @click="submitRegistration"
            >
              Submit
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card title="Available Courses">
        <a-table
          :data-source="availableCourses"
          row-key="curriculum_subject_id"
          size="small"
          :loading="loading"
          :pagination="false"
          :row-selection="rowSelection"
        >
          <a-table-column title="Code" data-index="course_code" />
          <a-table-column title="Course" data-index="course_title" />
          <a-table-column title="Type" data-index="subject_type_code" />
          <a-table-column title="Term" data-index="term_no" />
          <a-table-column title="Credit Hours" data-index="credit_hours" />

          <a-table-column title="Status">
            <template #default="{ record }">
              <a-tag v-if="record.already_registered" color="green">
                Already Registered
              </a-tag>
              <a-tag v-else color="blue">
                Available
              </a-tag>
            </template>
          </a-table-column>
        </a-table>
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const portalApi = useStudentPortalApi()

const loading = ref(false)
const submitting = ref(false)

const settings = ref<any>(null)
const availableCourses = ref<any[]>([])
const selectedRowKeys = ref<any[]>([])

const filters = reactive<any>({
  term_number: undefined,
})

const unwrap = (response: any) => response?.data?.data || response?.data || response || null

const selectedCreditHours = computed(() => {
  return availableCourses.value
    .filter((course: any) => selectedRowKeys.value.includes(course.curriculum_subject_id))
    .reduce((sum: number, course: any) => sum + Number(course.credit_hours || 0), 0)
})

const canSubmit = computed(() => {
  if (!settings.value?.student_self_registration_enabled) return false
  if (!settings.value?.window_open) return false
  if (selectedRowKeys.value.length === 0) return false

  const min = Number(settings.value?.min_credit_hours || 0)
  const max = Number(settings.value?.max_credit_hours || 0)

  if (min > 0 && selectedCreditHours.value < min) return false
  if (max > 0 && selectedCreditHours.value > max) return false

  return true
})

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys
  },
  getCheckboxProps: (record: any) => ({
    disabled: record.already_registered,
  }),
}))

const loadSettings = async () => {
  const response: any = await portalApi.getStudentCourseRegistrationSettings()
  settings.value = unwrap(response)
}

const loadAvailableCourses = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentSelfRegistrationAvailableCourses({
      term_number: filters.term_number || undefined,
    })

    const data = unwrap(response)
    availableCourses.value = Array.isArray(data) ? data : []
    selectedRowKeys.value = []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load available courses.')
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  try {
    await loadSettings()

    if (settings.value?.student_self_registration_enabled && settings.value?.window_open) {
      await loadAvailableCourses()
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load course registration.')
  }
}

const submitRegistration = async () => {
  if (!canSubmit.value) {
    message.error('Please select valid courses within the allowed credit hour limit.')
    return
  }

  submitting.value = true

  try {
    await portalApi.submitStudentSelfCourseRegistration({
      term_number: filters.term_number || undefined,
      curriculum_subject_ids: selectedRowKeys.value,
      remarks: 'Submitted by student portal.',
    })

    message.success(
      settings.value?.requires_admin_approval
        ? 'Course registration submitted for approval.'
        : 'Courses registered successfully.',
    )

    await loadAvailableCourses()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit course registration.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadAll)
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