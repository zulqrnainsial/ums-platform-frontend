<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Course / Subject Registration</h2>
          <p>Register subjects for the selected student's academic enrollment.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-management/students">
            <a-button>Back to Students</a-button>
          </NuxtLink>
          <a-button @click="loadAll">Refresh</a-button>
        </a-space>
      </div>

      <a-spin :spinning="loading">
        <a-card class="mb-3" title="Student Enrollment Context">
          <a-descriptions bordered size="small" :column="2">
            <a-descriptions-item label="Student">
              {{ context?.student?.full_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Student No">
              {{ context?.student?.student_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Program ID">
              {{ context?.current_enrollment?.program_id || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Academic Session ID">
              {{ context?.current_enrollment?.academic_session_id || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Roll No">
              {{ context?.current_enrollment?.roll_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Enrollment Status">
              {{ context?.current_enrollment?.status || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card class="mb-3" title="Available Courses">
          <template #extra>
            <a-space>
              <a-input
                v-model:value="termNo"
                placeholder="Term No"
                style="width: 100px"
                allow-clear
              />
              <a-button @click="loadAvailableCourses">Load Courses</a-button>
              <a-button
                type="primary"
                :disabled="selectedCourseIds.length === 0"
                @click="registerSelected"
              >
                Register Selected
              </a-button>
            </a-space>
          </template>

          <a-table
            :data-source="availableCourses"
            row-key="curriculum_subject_id"
            size="small"
            :pagination="{ pageSize: 20 }"
            :row-selection="rowSelection"
          >
            <a-table-column title="Code" data-index="course_code" />
            <a-table-column title="Title" data-index="course_title" />
            <a-table-column title="Credit Hours" data-index="credit_hours" />
            <a-table-column title="Type" data-index="subject_type_code" />
            <a-table-column title="Term" data-index="term_no" />

            <a-table-column title="Status">
              <template #default="{ record }">
                <a-tag v-if="record.already_registered" color="green">
                  Already Registered
                </a-tag>
                <a-tag v-else>
                  Available
                </a-tag>
              </template>
            </a-table-column>
          </a-table>
        </a-card>

        <a-card title="Registered Courses">
          <a-table
            :data-source="registeredCourses"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 20 }"
          >
            <a-table-column title="Code" data-index="course_code" />
            <a-table-column title="Title" data-index="course_title" />
            <a-table-column title="Credit Hours" data-index="credit_hours" />
            <a-table-column title="Type" data-index="subject_type_code" />
            <a-table-column title="Registration Type" data-index="registration_type" />
            <a-table-column title="Status" data-index="status" />

            <a-table-column title="Action">
              <template #default="{ record }">
                <a-popconfirm
                  title="Remove this course registration?"
                  @confirm="removeCourse(record)"
                >
                  <a-button
                    size="small"
                    danger
                    :disabled="record.is_locked"
                  >
                    Remove
                  </a-button>
                </a-popconfirm>
              </template>
            </a-table-column>
          </a-table>
        </a-card>
      </a-spin>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const route = useRoute()
const api = useApi()

const studentId = Number(route.params.studentId)

const loading = ref(false)
const context = ref<any>(null)
const availableCourses = ref<any[]>([])
const registeredCourses = ref<any[]>([])
const selectedCourseIds = ref<number[]>([])
const termNo = ref<string>('')

const rowSelection = computed(() => ({
  selectedRowKeys: selectedCourseIds.value,
  getCheckboxProps: (record: any) => ({
    disabled: record.already_registered,
  }),
  onChange: (keys: any[]) => {
    selectedCourseIds.value = keys.map(Number)
  },
}))

const unwrap = (response: any) => response?.data?.data || response?.data || response || []

const loadContext = async () => {
  const response: any = await api.getStudentCourseRegistrationContext(studentId)
  context.value = unwrap(response)
}

const loadAvailableCourses = async () => {
  const enrollmentId = context.value?.current_enrollment?.id

  if (!enrollmentId) {
    return
  }

  const response: any = await api.getStudentAvailableCourses(studentId, {
    student_enrollment_id: enrollmentId,
    term_no: termNo.value || undefined,
  })

  availableCourses.value = unwrap(response)
  selectedCourseIds.value = []
}

const loadRegisteredCourses = async () => {
  const response: any = await api.getStudentRegisteredCourses(studentId)
  registeredCourses.value = unwrap(response)
}

const loadAll = async () => {
  loading.value = true

  try {
    await loadContext()
    await loadAvailableCourses()
    await loadRegisteredCourses()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load course registration.')
  } finally {
    loading.value = false
  }
}

const registerSelected = async () => {
  const enrollmentId = context.value?.current_enrollment?.id

  if (!enrollmentId) {
    message.error('Student enrollment not found.')
    return
  }

  if (selectedCourseIds.value.length === 0) {
    message.error('Please select courses.')
    return
  }

  loading.value = true

  try {
    await api.registerStudentCourses(studentId, {
      student_enrollment_id: enrollmentId,
      curriculum_subject_ids: selectedCourseIds.value,
      registration_type: 'regular',
    })

    message.success('Courses registered successfully.')
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to register courses.')
  } finally {
    loading.value = false
  }
}

const removeCourse = async (record: any) => {
  loading.value = true

  try {
    await api.unregisterStudentCourse(record.id)
    message.success('Course removed successfully.')
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to remove course.')
  } finally {
    loading.value = false
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