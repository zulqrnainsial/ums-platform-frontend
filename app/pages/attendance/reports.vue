<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Attendance Reports</h2>
          <p>Course-wise summaries, student percentages and defaulter reports.</p>
        </div>

        <a-space>
          <NuxtLink to="/attendance/mark">
            <a-button>Mark Attendance</a-button>
          </NuxtLink>

          <NuxtLink to="/attendance/sessions">
            <a-button>Sessions</a-button>
          </NuxtLink>
        </a-space>
      </div>

      <a-card title="Filters" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="4">
            <a-select
  v-model:value="filters.academic_session_id"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Academic Session"
  style="width: 100%"
  :options="context.academic_sessions || []"
  @change="onFilterChange"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
  v-model:value="filters.academic_term_id"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Academic Term"
  style="width: 100%"
  :options="context.academic_terms || []"
  @change="onFilterChange"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
  v-model:value="filters.program_id"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Program"
  style="width: 100%"
  :options="context.programs || []"
  @change="onFilterChange"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
  v-model:value="filters.student_batch_id"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Batch"
  style="width: 100%"
  :options="context.student_batches || []"
  @change="onFilterChange"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
  v-model:value="filters.section_id"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Section"
  style="width: 100%"
  :options="context.sections || []"
  @change="onFilterChange"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-select
  v-model:value="filters.curriculum_subject_id"
  allow-clear
  show-search
  option-filter-prop="label"
  placeholder="Course"
  style="width: 100%"
  :options="courseOptions"
/>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-date-picker
              v-model:value="filters.date_from"
              placeholder="From Date"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-date-picker
              v-model:value="filters.date_to"
              placeholder="To Date"
              style="width: 100%"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-input-number
              v-model:value="filters.minimum_percentage"
              placeholder="Minimum %"
              style="width: 100%"
              :min="0"
              :max="100"
            />
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button
              type="primary"
              block
              :loading="loading"
              @click="loadReports"
            >
              Load Reports
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :md="6">
          <a-card :loading="loading">
            <a-statistic title="Courses" :value="summary.courses || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card :loading="loading">
            <a-statistic title="Total Records" :value="summary.total_records || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card :loading="loading">
            <a-statistic title="Present" :value="summary.present || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="6">
          <a-card :loading="loading">
            <a-statistic title="Absent" :value="summary.absent || 0" />
          </a-card>
        </a-col>
      </a-row>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="summary" tab="Course Summary">
          <a-card title="Course Attendance Summary">
            <a-table
              :data-source="summaryRows"
              row-key="curriculum_subject_id"
              size="small"
              :loading="loading"
              :pagination="{ pageSize: 15 }"
            >
              <a-table-column title="Course Code" data-index="course_code" />
              <a-table-column title="Course Title" data-index="course_title" />
              <a-table-column title="Total" data-index="total_records" />
              <a-table-column title="Present" data-index="present_count" />
              <a-table-column title="Absent" data-index="absent_count" />
              <a-table-column title="Late" data-index="late_count" />
              <a-table-column title="Leave" data-index="leave_count" />
              <a-table-column title="Attendance %">
                <template #default="{ record }">
                  <a-tag :color="percentageColor(record.attendance_percentage)">
                    {{ record.attendance_percentage }}%
                  </a-tag>
                </template>
              </a-table-column>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="students" tab="Student Percentages">
          <a-card title="Student Course Attendance Percentages">
            <a-table
              :data-source="studentRows"
              row-key="student_course_key"
              size="small"
              :loading="loading"
              :pagination="{ pageSize: 15 }"
            >
              <a-table-column title="Student No" data-index="student_no" />
              <a-table-column title="Name" data-index="student_name" />
              <a-table-column title="Roll No" data-index="roll_no" />
              <a-table-column title="Course Code" data-index="course_code" />
              <a-table-column title="Course Title" data-index="course_title" />
              <a-table-column title="Total" data-index="total_classes" />
              <a-table-column title="Present" data-index="present_count" />
              <a-table-column title="Absent" data-index="absent_count" />
              <a-table-column title="Late" data-index="late_count" />
              <a-table-column title="Leave" data-index="leave_count" />
              <a-table-column title="Attendance %">
                <template #default="{ record }">
                  <a-tag :color="percentageColor(record.attendance_percentage)">
                    {{ record.attendance_percentage }}%
                  </a-tag>
                </template>
              </a-table-column>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="defaulters" tab="Defaulters">
          <a-card title="Attendance Defaulters">
            <a-alert
              class="mb-3"
              type="warning"
              show-icon
              :message="`Students below ${filters.minimum_percentage || 75}% attendance.`"
            />

            <a-table
              :data-source="defaulterRows"
              row-key="student_course_key"
              size="small"
              :loading="loading"
              :pagination="{ pageSize: 15 }"
            >
              <a-table-column title="Student No" data-index="student_no" />
              <a-table-column title="Name" data-index="student_name" />
              <a-table-column title="Roll No" data-index="roll_no" />
              <a-table-column title="Course Code" data-index="course_code" />
              <a-table-column title="Course Title" data-index="course_title" />
              <a-table-column title="Total" data-index="total_classes" />
              <a-table-column title="Attendance %">
                <template #default="{ record }">
                  <a-tag color="red">
                    {{ record.attendance_percentage }}%
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="Required %" data-index="minimum_percentage" />
              <a-table-column title="Shortfall %">
                <template #default="{ record }">
                  <a-tag color="orange">
                    {{ record.shortfall_percentage }}%
                  </a-tag>
                </template>
              </a-table-column>
            </a-table>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApi()

const loading = ref(false)
const activeTab = ref('summary')

const summary = ref<any>({})
const summaryRows = ref<any[]>([])
const studentRows = ref<any[]>([])
const defaulterRows = ref<any[]>([])
const context = reactive<any>({
  academic_sessions: [],
  programs: [],
  academic_terms: [],
  student_batches: [],
  sections: [],
  courses: [],
})
const filters = reactive<any>({
  academic_session_id: undefined,
  academic_term_id: undefined,
  program_id: undefined,
  student_batch_id: undefined,
  section_id: undefined,
  curriculum_subject_id: undefined,
  date_from: undefined,
  date_to: undefined,
  minimum_percentage: 75,
})

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const serializeDate = (value: any) => {
  return value?.format ? value.format('YYYY-MM-DD') : value
}
const contextParams = computed(() => ({
  academic_session_id: filters.academic_session_id || undefined,
  program_id: filters.program_id || undefined,
  academic_term_id: filters.academic_term_id || undefined,
  student_batch_id: filters.student_batch_id || undefined,
  section_id: filters.section_id || undefined,
}))
const courseOptions = computed(() => {
  return (context.courses || []).map((course: any) => ({
    label: `${course.course_code ? `${course.course_code} - ` : ''}${course.label || course.course_title || 'Course'}`,
    value: course.value ?? course.curriculum_subject_id,
  }))
})
const reportParams = computed(() => ({
  academic_session_id: filters.academic_session_id || undefined,
  academic_term_id: filters.academic_term_id || undefined,
  program_id: filters.program_id || undefined,
  student_batch_id: filters.student_batch_id || undefined,
  section_id: filters.section_id || undefined,
  curriculum_subject_id: filters.curriculum_subject_id || undefined,
  date_from: serializeDate(filters.date_from) || undefined,
  date_to: serializeDate(filters.date_to) || undefined,
  minimum_percentage: filters.minimum_percentage || 75,
}))
const loadContext = async () => {
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
    message.error(error?.data?.message || 'Unable to load report filters.')
  }
}
const onFilterChange = async () => {
  filters.curriculum_subject_id = undefined
  await loadContext()
}
const percentageColor = (percentage: number) => {
  const value = Number(percentage || 0)

  if (value >= 85) return 'green'
  if (value >= 75) return 'blue'
  if (value >= 60) return 'orange'
  return 'red'
}

const addKeys = (rows: any[]) => {
  return rows.map((row: any, index: number) => ({
    ...row,
    student_course_key: `${row.student_id || 'course'}-${row.curriculum_subject_id || index}`,
  }))
}

const loadReports = async () => {
  loading.value = true

  try {
    const [summaryResponse, studentResponse, defaulterResponse]: any[] = await Promise.all([
      api.getAttendanceReportSummary(reportParams.value),
      api.getAttendanceStudentCoursePercentages(reportParams.value),
      api.getAttendanceDefaulters(reportParams.value),
    ])

    const summaryPayload = unwrap(summaryResponse)
    const studentPayload = unwrap(studentResponse)
    const defaulterPayload = unwrap(defaulterResponse)

    summary.value = summaryPayload.summary || {}
    summaryRows.value = summaryPayload.rows || []
    studentRows.value = addKeys(Array.isArray(studentPayload) ? studentPayload : [])
    defaulterRows.value = addKeys(Array.isArray(defaulterPayload) ? defaulterPayload : [])
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attendance reports.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadContext()
  await loadReports()
})
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>