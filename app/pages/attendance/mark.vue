<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Mark Attendance</h2>
          <p>Mark course-wise attendance for registered students.</p>
        </div>

        <a-space>
          <NuxtLink to="/attendance/sessions">
            <a-button>Sessions</a-button>
          </NuxtLink>

          <a-button @click="loadContext">
            Refresh
          </a-button>
        </a-space>
      </div>

      <a-card title="Attendance Filters" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <label>Academic Session</label>
            <a-select
              v-model:value="filters.academic_session_id"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Select academic session"
              style="width: 100%"
              :options="context.academic_sessions || []"
              @change="onMainFilterChange"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Program</label>
            <a-select
              v-model:value="filters.program_id"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Select program"
              style="width: 100%"
              :options="context.programs || []"
              @change="onMainFilterChange"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Academic Term</label>
            <a-select
              v-model:value="filters.academic_term_id"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Select term"
              style="width: 100%"
              :options="context.academic_terms || []"
              @change="onMainFilterChange"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Batch</label>
            <a-select
              v-model:value="filters.student_batch_id"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Select batch"
              style="width: 100%"
              :options="context.student_batches || []"
              @change="onMainFilterChange"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Section</label>
            <a-select
              v-model:value="filters.section_id"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Select section"
              style="width: 100%"
              :options="context.sections || []"
              @change="onMainFilterChange"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Course</label>
            <a-select
              v-model:value="filters.curriculum_subject_id"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Select course"
              style="width: 100%"
              :options="courseOptions"
              @change="resetStudents"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>Date</label>
            <a-date-picker
              v-model:value="filters.attendance_date"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>Session Type</label>
            <a-select
              v-model:value="filters.session_type"
              style="width: 100%"
              :options="sessionTypeOptions"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>Start Time</label>
            <a-time-picker
              v-model:value="filters.start_time"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <label>End Time</label>
            <a-time-picker
              v-model:value="filters.end_time"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="8">
            <label>Topic</label>
            <a-input
              v-model:value="filters.topic"
              placeholder="Lecture topic"
            />
          </a-col>

          <a-col :xs="24" :md="4" class="action-col">
            <a-button
              type="primary"
              block
              :loading="loadingStudents"
              @click="loadStudents"
            >
              Load Students
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Students" :value="students.length" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Present" :value="statusCounts.present" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Absent" :value="statusCounts.absent" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card>
            <a-statistic title="Late / Leave" :value="statusCounts.lateLeave" />
          </a-card>
        </a-col>
      </a-row>

      <a-card title="Students">
        <template #extra>
          <a-space>
            <a-button size="small" @click="markAll('present')">
              Mark All Present
            </a-button>

            <a-button size="small" danger @click="markAll('absent')">
              Mark All Absent
            </a-button>
          </a-space>
        </template>

        <a-table
          :data-source="students"
          row-key="student_course_registration_id"
          size="small"
          :loading="loadingStudents"
          :pagination="{ pageSize: 20 }"
        >
          <a-table-column title="Student No" data-index="student_no" />
          <a-table-column title="Name" data-index="student_name" />
          <a-table-column title="Roll No" data-index="roll_no" />
          <a-table-column title="Registration No" data-index="registration_no" />
          <a-table-column title="Course" data-index="course_title" />

          <a-table-column title="Status">
            <template #default="{ record }">
              <a-select
                v-model:value="record.status_code"
                size="small"
                style="width: 130px"
                :options="attendanceStatusOptions"
              />
            </template>
          </a-table-column>

          <a-table-column title="Remarks">
            <template #default="{ record }">
              <a-input
                v-model:value="record.remarks"
                size="small"
                placeholder="Remarks"
              />
            </template>
          </a-table-column>
        </a-table>
      </a-card>

      <a-card class="mt-3">
        <a-space>
          <a-button
            type="primary"
            size="large"
            :loading="saving"
            :disabled="!canSave"
            @click="saveAttendance"
          >
            Save Attendance
          </a-button>

          <span v-if="lastSessionId">
            Last Session ID: {{ lastSessionId }}
          </span>

          <a-button
            v-if="lastSessionId"
            danger
            :loading="locking"
            @click="lockSession"
          >
            Lock Session
          </a-button>
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
const loadingStudents = ref(false)
const saving = ref(false)
const locking = ref(false)

const context = reactive<any>({
  academic_sessions: [],
  programs: [],
  academic_terms: [],
  student_batches: [],
  sections: [],
  courses: [],
})

const students = ref<any[]>([])
const lastSessionId = ref<number | null>(null)

const filters = reactive<any>({
  academic_session_id: undefined,
  program_id: undefined,
  academic_term_id: undefined,
  student_batch_id: undefined,
  section_id: undefined,
  curriculum_subject_id: undefined,
  attendance_date: dayjs(),
  session_type: 'lecture',
  start_time: undefined,
  end_time: undefined,
  topic: '',
  remarks: '',
})

const sessionTypeOptions = [
  { label: 'Lecture', value: 'lecture' },
  { label: 'Lab', value: 'lab' },
  { label: 'Tutorial', value: 'tutorial' },
  { label: 'Seminar', value: 'seminar' },
]

const attendanceStatusOptions = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Late', value: 'late' },
  { label: 'Leave', value: 'leave' },
  { label: 'Excused', value: 'excused' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const courseOptions = computed(() => {
  return (context.courses || []).map((course: any) => ({
    label: `${course.course_code ? `${course.course_code} - ` : ''}${course.label || course.course_title || 'Course'}`,
    value: course.value ?? course.curriculum_subject_id,
  }))
})

const statusCounts = computed(() => {
  const counts = {
    present: 0,
    absent: 0,
    lateLeave: 0,
  }

  students.value.forEach((student: any) => {
    if (student.status_code === 'present') counts.present += 1
    if (student.status_code === 'absent') counts.absent += 1
    if (['late', 'leave', 'excused'].includes(student.status_code)) counts.lateLeave += 1
  })

  return counts
})

const canSave = computed(() => {
  return Boolean(
    filters.academic_session_id &&
    filters.program_id &&
    filters.student_batch_id &&
    filters.section_id &&
    filters.curriculum_subject_id &&
    filters.attendance_date &&
    students.value.length > 0,
  )
})

const contextParams = computed(() => ({
  academic_session_id: filters.academic_session_id || undefined,
  program_id: filters.program_id || undefined,
  academic_term_id: filters.academic_term_id || undefined,
  student_batch_id: filters.student_batch_id || undefined,
  section_id: filters.section_id || undefined,
}))

const loadContext = async () => {
  contextLoading.value = true

  try {
    const response: any = await api.getAttendanceMarkingContext(contextParams.value)
    const payload = unwrap(response)

    context.academic_sessions = payload.academic_sessions || []
    context.programs = payload.programs || []
    context.academic_terms = payload.academic_terms || []
    context.student_batches = payload.student_batches || []
    context.sections = payload.sections || []
    context.courses = payload.courses || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attendance context.')
  } finally {
    contextLoading.value = false
  }
}

const onMainFilterChange = async () => {
  resetStudents()
  filters.curriculum_subject_id = undefined
  await loadContext()
}

const resetStudents = () => {
  students.value = []
  lastSessionId.value = null
}

const loadStudents = async () => {
  if (!filters.academic_session_id || !filters.program_id || !filters.student_batch_id || !filters.section_id || !filters.curriculum_subject_id) {
    message.error('Academic session, program, batch, section and course are required.')
    return
  }

  loadingStudents.value = true

  try {
    const response: any = await api.getAttendanceMarkingStudents({
      academic_session_id: filters.academic_session_id,
      program_id: filters.program_id,
      academic_term_id: filters.academic_term_id || undefined,
      student_batch_id: filters.student_batch_id,
      section_id: filters.section_id,
      curriculum_subject_id: filters.curriculum_subject_id,
    })

    const payload = unwrap(response)
    students.value = Array.isArray(payload) ? payload : []
    lastSessionId.value = null

    if (students.value.length === 0) {
      message.warning('No registered students found for the selected course.')
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load students.')
  } finally {
    loadingStudents.value = false
  }
}

const markAll = (status: string) => {
  students.value = students.value.map((student: any) => ({
    ...student,
    status_code: status,
  }))
}

const serializeDate = (value: any) => {
  return value?.format ? value.format('YYYY-MM-DD') : value
}

const saveAttendance = async () => {
  if (!canSave.value) {
    message.error('Load students before saving attendance.')
    return
  }

  Modal.confirm({
    title: 'Save attendance?',
    content: 'This will create or update attendance for the selected course/date.',
    okText: 'Save',
    async onOk() {
      saving.value = true

      try {
        const response: any = await api.saveAttendanceMarking({
          academic_session_id: filters.academic_session_id,
          program_id: filters.program_id,
          academic_term_id: filters.academic_term_id || null,
          student_batch_id: filters.student_batch_id,
          section_id: filters.section_id,
          curriculum_subject_id: filters.curriculum_subject_id,

          attendance_date: serializeDate(filters.attendance_date),
          session_type: filters.session_type || 'lecture',
          start_time: filters.start_time || null,
          end_time: filters.end_time || null,
          topic: filters.topic || null,
          remarks: filters.remarks || null,

          records: students.value.map((student: any) => ({
            student_id: student.student_id,
            student_enrollment_id: student.student_enrollment_id,
            student_course_registration_id: student.student_course_registration_id,
            status_code: student.status_code || 'present',
            remarks: student.remarks || null,
          })),
        })

        const payload = unwrap(response)
        lastSessionId.value = payload.attendance_session_id || null

        message.success('Attendance saved successfully.')
      } catch (error: any) {
        message.error(error?.data?.message || 'Unable to save attendance.')
      } finally {
        saving.value = false
      }
    },
  })
}

const lockSession = async () => {
  if (!lastSessionId.value) return

  Modal.confirm({
    title: 'Lock attendance session?',
    content: 'Locked attendance cannot be edited.',
    okText: 'Lock',
    okType: 'danger',
    async onOk() {
      locking.value = true

      try {
        await api.lockAttendanceSession(lastSessionId.value as number)
        message.success('Attendance session locked.')
      } catch (error: any) {
        message.error(error?.data?.message || 'Unable to lock attendance session.')
      } finally {
        locking.value = false
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