<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Bulk Course Registration</h2>
          <p>Register curriculum subjects for a complete batch, section and academic term.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-management/students">
            <a-button>Students</a-button>
          </NuxtLink>

          <a-button @click="loadContext">
            Refresh
          </a-button>
        </a-space>
      </div>

      <a-card title="Registration Filters" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <label>Academic Session</label>
            <a-select
              v-model:value="filters.academic_session_id"
              placeholder="Select academic session"
              style="width: 100%"
              allow-clear
              :options="academicSessionOptions"
              @change="resetPreview"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Program</label>
            <a-select
              v-model:value="filters.program_id"
              placeholder="Select program"
              style="width: 100%"
              allow-clear
              :options="programOptions"
              @change="resetPreview"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>Academic Term</label>
            <a-select
              v-model:value="filters.academic_term_id"
              placeholder="Term"
              style="width: 100%"
              allow-clear
              :options="academicTermOptions"
              @change="resetPreview"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>Term Number</label>
            <a-input-number
              v-model:value="filters.term_number"
              placeholder="1"
              style="width: 100%"
              @change="resetPreview"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Batch</label>
            <a-select
              v-model:value="filters.student_batch_id"
              placeholder="Select batch"
              style="width: 100%"
              allow-clear
              :options="batchOptions"
              @change="resetPreview"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Section</label>
            <a-select
              v-model:value="filters.section"
              placeholder="Select section"
              style="width: 100%"
              allow-clear
              :options="sectionOptions"
              @change="resetPreview"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>Registration Type</label>
            <a-select
              v-model:value="filters.registration_type"
              style="width: 100%"
              :options="registrationTypeOptions"
            />
          </a-col>

          <a-col :xs="24" :md="8">
            <label>Remarks</label>
            <a-input
              v-model:value="filters.remarks"
              placeholder="Optional remarks"
            />
          </a-col>

          <a-col :xs="24" :md="4" class="action-col">
            <a-button
              type="primary"
              block
              :loading="previewLoading"
              @click="loadPreview"
            >
              Preview
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card title="Self Registration Settings" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="5">
            <a-checkbox v-model:checked="settings.student_self_registration_enabled">
              Enable Student Self Registration
            </a-checkbox>
          </a-col>

          <a-col :xs="24" :md="5">
            <a-checkbox v-model:checked="settings.requires_admin_approval">
              Requires Admin Approval
            </a-checkbox>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-checkbox v-model:checked="settings.allow_add_drop">
              Allow Add / Drop
            </a-checkbox>
          </a-col>

          <a-col :xs="24" :md="5">
            <a-date-picker
              v-model:value="settings.registration_start_at"
              show-time
              placeholder="Start Date"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-date-picker
              v-model:value="settings.registration_end_at"
              show-time
              placeholder="End Date"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="settings.min_credit_hours"
              placeholder="Min Credit"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="settings.max_credit_hours"
              placeholder="Max Credit"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button
              type="primary"
              block
              :loading="settingsSaving"
              :disabled="!filters.academic_session_id"
              @click="saveSettings"
            >
              Save Settings
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Students" :value="summary.students_count || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Subjects" :value="summary.subjects_count || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Already Registered" :value="summary.already_registered_count || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Missing Registrations" :value="summary.missing_registrations_count || 0" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[12, 12]">
        <a-col :xs="24" :lg="12">
          <a-card title="Students">
            <template #extra>
              <a-space>
                <a-button size="small" @click="selectAllStudents">
                  Select All
                </a-button>
                <a-button size="small" @click="selectedStudentEnrollmentIds = []">
                  Clear
                </a-button>
              </a-space>
            </template>

            <a-table
              :data-source="students"
              row-key="student_enrollment_id"
              size="small"
              :loading="previewLoading"
              :pagination="{ pageSize: 10 }"
              :row-selection="studentRowSelection"
            >
              <a-table-column title="Student No" data-index="student_no" />
              <a-table-column title="Name" data-index="student_name" />
              <a-table-column title="Roll No" data-index="roll_no" />
              <a-table-column title="Section" data-index="section" />
            </a-table>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Subjects">
            <template #extra>
              <a-space>
                <a-button size="small" @click="selectAllSubjects">
                  Select All
                </a-button>
                <a-button size="small" @click="selectedCurriculumSubjectIds = []">
                  Clear
                </a-button>
              </a-space>
            </template>

            <a-table
              :data-source="subjects"
              row-key="curriculum_subject_id"
              size="small"
              :loading="previewLoading"
              :pagination="{ pageSize: 10 }"
              :row-selection="subjectRowSelection"
            >
              <a-table-column title="Code" data-index="course_code" />
              <a-table-column title="Subject" data-index="course_title" />
              <a-table-column title="Type" data-index="subject_type_code" />
              <a-table-column title="Term" data-index="term_no" />
              <a-table-column title="Credit" data-index="credit_hours" />
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <a-card class="mt-3">
        <a-space>
          <a-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="!canRegister"
            @click="submitBulkRegistration"
          >
            Register Selected Courses
          </a-button>

          <span>
            Selected Students: {{ selectedStudentEnrollmentIds.length }}
          </span>

          <span>
            Selected Subjects: {{ selectedCurriculumSubjectIds.length }}
          </span>
        </a-space>
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { message, Modal } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApi()

const contextLoading = ref(false)
const previewLoading = ref(false)
const submitting = ref(false)
const settingsSaving = ref(false)

const context = ref<any>({})
const students = ref<any[]>([])
const subjects = ref<any[]>([])
const summary = ref<any>({})

const selectedStudentEnrollmentIds = ref<any[]>([])
const selectedCurriculumSubjectIds = ref<any[]>([])

const filters = reactive<any>({
  academic_session_id: undefined,
  program_id: undefined,
  academic_term_id: undefined,
  term_number: undefined,
  student_batch_id: undefined,
  section: undefined,
  registration_type: 'regular',
  remarks: '',
})

const settings = reactive<any>({
  student_self_registration_enabled: false,
  requires_admin_approval: true,
  allow_add_drop: false,
  registration_start_at: null,
  registration_end_at: null,
  min_credit_hours: undefined,
  max_credit_hours: undefined,
})

const registrationTypeOptions = [
  { label: 'Regular', value: 'regular' },
  { label: 'Repeat', value: 'repeat' },
  { label: 'Improvement', value: 'improvement' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const toOptions = (rows: any[], labelKeys: string[] = [], valueKey = 'id') => {
  return (Array.isArray(rows) ? rows : []).map((row: any) => {
    const labelParts = [
      ...labelKeys.map((key) => row?.[key]),
      row?.label,
      row?.title,
      row?.name,
      row?.code,
      row?.program_name,
      row?.session_name,
      row?.term_name,
      row?.batch_name,
    ]
      .filter((value, index, self) => value && self.indexOf(value) === index)

    return {
      label: labelParts.length
        ? labelParts.join(' - ')
        : String(row?.[valueKey] ?? row?.value ?? row?.id ?? ''),
      value: row?.[valueKey] ?? row?.value ?? row?.id,
    }
  })
}

const academicSessionOptions = computed(() => {
  return toOptions(context.value?.academic_sessions || [], [
    'name',
    'code',
    'session_name',
    'academic_session_name',
  ])
})

const programOptions = computed(() => {
  return toOptions(context.value?.programs || [], [
    'name',
    'code',
    'program_name',
    'program_code',
  ])
})

const academicTermOptions = computed(() => {
  return toOptions(context.value?.academic_terms || [], [
    'name',
    'code',
    'term_name',
    'term_number',
  ])
})

const batchOptions = computed(() => {
  return toOptions(context.value?.student_batches || [], [
    'name',
    'code',
    'batch_name',
    'batch_code',
  ])
})

const sectionOptions = computed(() => {
  return (context.value?.sections || []).map((section: any) => {
    const value =
      section?.section ??
      section?.name ??
      section?.label ??
      section?.value ??
      section

    return {
      label: String(value || ''),
      value: String(value || ''),
    }
  })
})

const canRegister = computed(() => {
  return Boolean(
    filters.academic_session_id &&
    filters.program_id &&
    selectedStudentEnrollmentIds.value.length > 0 &&
    selectedCurriculumSubjectIds.value.length > 0,
  )
})

const studentRowSelection = computed(() => ({
  selectedRowKeys: selectedStudentEnrollmentIds.value,
  onChange: (keys: any[]) => {
    selectedStudentEnrollmentIds.value = keys
  },
}))

const subjectRowSelection = computed(() => ({
  selectedRowKeys: selectedCurriculumSubjectIds.value,
  onChange: (keys: any[]) => {
    selectedCurriculumSubjectIds.value = keys
  },
}))

const resetPreview = () => {
  students.value = []
  subjects.value = []
  summary.value = {}
  selectedStudentEnrollmentIds.value = []
  selectedCurriculumSubjectIds.value = []
}

const selectAllStudents = () => {
  selectedStudentEnrollmentIds.value = students.value.map((row: any) => row.student_enrollment_id)
}

const selectAllSubjects = () => {
  selectedCurriculumSubjectIds.value = subjects.value.map((row: any) => row.curriculum_subject_id)
}

const loadContext = async () => {
  contextLoading.value = true

  try {
    const response: any = await api.getBulkCourseRegistrationContext({
      academic_session_id: filters.academic_session_id || undefined,
      program_id: filters.program_id || undefined,
      academic_term_id: filters.academic_term_id || undefined,
    })

    const payload = unwrap(response)
    context.value = payload || {}

    if (payload?.settings) {
      Object.assign(settings, {
        student_self_registration_enabled: Boolean(payload.settings.student_self_registration_enabled),
        requires_admin_approval: payload.settings.requires_admin_approval !== false,
        allow_add_drop: Boolean(payload.settings.allow_add_drop),
        registration_start_at: payload.settings.registration_start_at
          ? dayjs(payload.settings.registration_start_at)
          : null,
        registration_end_at: payload.settings.registration_end_at
          ? dayjs(payload.settings.registration_end_at)
          : null,
        min_credit_hours: payload.settings.min_credit_hours ?? undefined,
        max_credit_hours: payload.settings.max_credit_hours ?? undefined,
      })
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load registration context.')
  } finally {
    contextLoading.value = false
  }
}

const loadPreview = async () => {
  if (!filters.academic_session_id || !filters.program_id) {
    message.error('Academic session and program are required.')
    return
  }

  previewLoading.value = true

  try {
    const response: any = await api.previewBulkCourseRegistration({
      academic_session_id: filters.academic_session_id,
      program_id: filters.program_id,
      academic_term_id: filters.academic_term_id || undefined,
      term_number: filters.term_number || undefined,
      student_batch_id: filters.student_batch_id || undefined,
      section: filters.section || undefined,
    })

    const payload = unwrap(response)

    students.value = Array.isArray(payload?.students) ? payload.students : []
    subjects.value = Array.isArray(payload?.subjects) ? payload.subjects : []
    summary.value = payload?.summary || {}

    selectedStudentEnrollmentIds.value = students.value.map((row: any) => row.student_enrollment_id)
    selectedCurriculumSubjectIds.value = subjects.value.map((row: any) => row.curriculum_subject_id)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to preview bulk registration.')
  } finally {
    previewLoading.value = false
  }
}

const serializeDateTime = (value: any) => {
  return value?.format ? value.format('YYYY-MM-DD HH:mm:ss') : value || null
}

const saveSettings = async () => {
  if (!filters.academic_session_id) {
    message.error('Academic session is required before saving settings.')
    return
  }

  settingsSaving.value = true

  try {
    await api.saveCourseRegistrationSettings({
      academic_session_id: filters.academic_session_id,
      program_id: filters.program_id || null,
      academic_term_id: filters.academic_term_id || null,
      student_self_registration_enabled: settings.student_self_registration_enabled,
      requires_admin_approval: settings.requires_admin_approval,
      allow_add_drop: settings.allow_add_drop,
      registration_start_at: serializeDateTime(settings.registration_start_at),
      registration_end_at: serializeDateTime(settings.registration_end_at),
      min_credit_hours: settings.min_credit_hours ?? null,
      max_credit_hours: settings.max_credit_hours ?? null,
      status_code: 'active',
    })

    message.success('Course registration settings saved.')
    await loadContext()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save settings.')
  } finally {
    settingsSaving.value = false
  }
}

const submitBulkRegistration = async () => {
  if (!canRegister.value) {
    message.error('Select students and subjects first.')
    return
  }

  Modal.confirm({
    title: 'Register selected courses?',
    content: `This will register ${selectedCurriculumSubjectIds.value.length} subject(s) for ${selectedStudentEnrollmentIds.value.length} student(s). Existing registrations will be skipped.`,
    okText: 'Register',
    async onOk() {
      submitting.value = true

      try {
        const response: any = await api.registerBulkCourses({
          academic_session_id: filters.academic_session_id,
          program_id: filters.program_id,
          academic_term_id: filters.academic_term_id || undefined,
          term_number: filters.term_number || undefined,
          student_batch_id: filters.student_batch_id || undefined,
          section: filters.section || undefined,
          student_enrollment_ids: selectedStudentEnrollmentIds.value,
          curriculum_subject_ids: selectedCurriculumSubjectIds.value,
          registration_type: filters.registration_type || 'regular',
          remarks: filters.remarks || undefined,
        })

        const payload = unwrap(response)

        message.success(
          `Created ${payload.created_count || 0}, skipped ${payload.skipped_count || 0}.`,
        )

        await loadPreview()
      } catch (error: any) {
        message.error(error?.data?.message || 'Unable to register courses.')
      } finally {
        submitting.value = false
      }
    },
  })
}

onMounted(loadContext)
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

.mt-3 {
  margin-top: 16px;
}

.action-col {
  display: flex;
  align-items: flex-end;
}
</style>