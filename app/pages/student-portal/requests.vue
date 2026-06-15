<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>My Requests</h2>
          <p>Submit profile correction, document resubmission and course add/drop requests.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button @click="loadAll">Refresh</a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-space wrap>
          <a-button type="primary" @click="openProfileRequest">
            Profile Correction
          </a-button>

          <a-button @click="openDocumentRequest">
            Document Resubmission
          </a-button>

          <a-button @click="openCourseRequest">
            Course Add / Drop
          </a-button>
        </a-space>
      </a-card>

      <a-table
        :data-source="requests"
        row-key="id"
        size="small"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
      >
        <a-table-column title="Request No" data-index="request_no" />
        <a-table-column title="Type" data-index="request_type" />
        <a-table-column title="Title" data-index="title" />
        <a-table-column title="Submitted" data-index="submitted_at" />

        <a-table-column title="Status">
          <template #default="{ record }">
            <a-tag :color="statusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="Remarks" data-index="admin_remarks" />
      </a-table>

      <a-modal
        v-model:open="profileOpen"
        title="Profile Correction Request"
        ok-text="Submit"
        :confirm-loading="saving"
        @ok="submitProfileRequest"
      >
        <a-alert
          class="mb-3"
          type="info"
          show-icon
          message="Enter only the fields you want admin to correct."
        />

        <a-form layout="vertical">
          <a-form-item label="Phone">
            <a-input v-model:value="profileForm.phone" />
          </a-form-item>

          <a-form-item label="Alternate Phone">
            <a-input v-model:value="profileForm.alternate_phone" />
          </a-form-item>

          <a-form-item label="Email">
            <a-input v-model:value="profileForm.email" />
          </a-form-item>

          <a-form-item label="Current Address">
            <a-textarea v-model:value="profileForm.current_address" :rows="3" />
          </a-form-item>

          <a-form-item label="Permanent Address">
            <a-textarea v-model:value="profileForm.permanent_address" :rows="3" />
          </a-form-item>

          <a-form-item label="Reason" required>
            <a-textarea v-model:value="profileForm.reason" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="documentOpen"
        title="Document Resubmission Request"
        ok-text="Submit"
        :confirm-loading="saving"
        @ok="submitDocumentRequest"
      >
        <a-form layout="vertical">
          <a-form-item label="Document" required>
            <a-select
              v-model:value="documentForm.student_document_id"
              :options="documentOptions"
              placeholder="Select document"
            />
          </a-form-item>

          <a-form-item label="New File Path">
            <a-input v-model:value="documentForm.new_file_path" />
          </a-form-item>

          <a-form-item label="New File Name">
            <a-input v-model:value="documentForm.new_file_name" />
          </a-form-item>

          <a-form-item label="Reason" required>
            <a-textarea v-model:value="documentForm.reason" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="courseOpen"
        title="Course Add / Drop Request"
        ok-text="Submit"
        :confirm-loading="saving"
        @ok="submitCourseRequest"
      >
        <a-form layout="vertical">
          <a-form-item label="Action" required>
            <a-select
              v-model:value="courseForm.action_type"
              :options="courseActionOptions"
            />
          </a-form-item>

          <template v-if="courseForm.action_type === 'add'">
            <a-alert
              class="mb-3"
              type="warning"
              show-icon
              message="For now enter Curriculum Subject ID. Later this can be changed to a dropdown from available curriculum subjects."
            />

            <a-form-item label="Curriculum Subject ID" required>
              <a-select
    v-model:value="courseForm.curriculum_subject_id"
    placeholder="Select course"
    :options="availableCourseOptions"
  />
            </a-form-item>
          </template>

          <template v-if="courseForm.action_type === 'drop'">
            <a-form-item label="Registered Course" required>
              <a-select
                v-model:value="courseForm.course_registration_id"
                :options="courseOptions"
                placeholder="Select registered course"
              />
            </a-form-item>
          </template>

          <a-form-item label="Reason" required>
            <a-textarea v-model:value="courseForm.reason" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const portalApi = useStudentPortalApi()

const loading = ref(false)
const saving = ref(false)

const requests = ref<any[]>([])
const documents = ref<any[]>([])
const courses = ref<any[]>([])

const profileOpen = ref(false)
const documentOpen = ref(false)
const courseOpen = ref(false)
const availableCourses = ref<any[]>([])

const availableCourseOptions = computed(() =>
  availableCourses.value.map((course: any) => ({
    label: course.label,
    value: course.id,
  })),
)
const profileForm = reactive<any>({
  phone: '',
  alternate_phone: '',
  email: '',
  current_address: '',
  permanent_address: '',
  reason: '',
})

const documentForm = reactive<any>({
  student_document_id: undefined,
  new_file_path: '',
  new_file_name: '',
  reason: '',
})

const courseForm = reactive<any>({
  action_type: 'add',
  curriculum_subject_id: undefined,
  course_registration_id: undefined,
  reason: '',
})

const courseActionOptions = [
  { label: 'Add Course', value: 'add' },
  { label: 'Drop Course', value: 'drop' },
]

const documentOptions = computed(() =>
  documents.value.map((doc: any) => ({
    label: `${doc.document_title || 'Document'} - ${doc.verification_status || 'pending'}`,
    value: doc.id,
  })),
)

const courseOptions = computed(() =>
  courses.value.map((course: any) => ({
    label: `${course.course_code || ''} ${course.course_title || ''}`.trim(),
    value: course.id,
  })),
)

const unwrap = (response: any) => response?.data?.data || response?.data || response || []

const statusColor = (status: string) => {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'pending') return 'orange'
  return 'blue'
}

const loadAll = async () => {
  loading.value = true

  try {
    const [requestResponse, documentResponse, courseResponse, availableCourseResponse] = await Promise.all([
      portalApi.getStudentPortalRequests(),
      portalApi.getStudentPortalDocuments(),
      portalApi.getStudentPortalCourses(),
      portalApi.getStudentPortalAvailableCourses(),
    ])
    availableCourses.value = unwrap(availableCourseResponse)
    requests.value = unwrap(requestResponse)
    documents.value = unwrap(documentResponse)
    courses.value = unwrap(courseResponse)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load requests.')
  } finally {
    loading.value = false
  }
}

const openProfileRequest = () => {
  Object.assign(profileForm, {
    phone: '',
    alternate_phone: '',
    email: '',
    current_address: '',
    permanent_address: '',
    reason: '',
  })

  profileOpen.value = true
}

const openDocumentRequest = () => {
  Object.assign(documentForm, {
    student_document_id: undefined,
    new_file_path: '',
    new_file_name: '',
    reason: '',
  })

  documentOpen.value = true
}

const openCourseRequest = () => {
  Object.assign(courseForm, {
    action_type: 'add',
    curriculum_subject_id: undefined,
    course_registration_id: undefined,
    reason: '',
  })

  courseOpen.value = true
}

const submitProfileRequest = async () => {
  if (!profileForm.reason) {
    message.error('Reason is required.')
    return
  }

  const requestedChanges: any = {}

  ;['phone', 'alternate_phone', 'email', 'current_address', 'permanent_address'].forEach((field) => {
    if (profileForm[field]) {
      requestedChanges[field] = profileForm[field]
    }
  })

  if (Object.keys(requestedChanges).length === 0) {
    message.error('Enter at least one field to correct.')
    return
  }

  saving.value = true

  try {
    await portalApi.submitProfileCorrectionRequest({
      requested_changes: requestedChanges,
      reason: profileForm.reason,
    })

    message.success('Profile correction request submitted.')
    profileOpen.value = false
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit request.')
  } finally {
    saving.value = false
  }
}

const submitDocumentRequest = async () => {
  if (!documentForm.student_document_id || !documentForm.reason) {
    message.error('Document and reason are required.')
    return
  }

  saving.value = true

  try {
    await portalApi.submitDocumentResubmissionRequest(documentForm)
    message.success('Document resubmission request submitted.')
    documentOpen.value = false
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit request.')
  } finally {
    saving.value = false
  }
}

const submitCourseRequest = async () => {
  if (!courseForm.reason) {
    message.error('Reason is required.')
    return
  }

  if (courseForm.action_type === 'add' && !courseForm.curriculum_subject_id) {
    message.error('Curriculum subject is required.')
    return
  }

  if (courseForm.action_type === 'drop' && !courseForm.course_registration_id) {
    message.error('Registered course is required.')
    return
  }

  saving.value = true

  try {
    await portalApi.submitCourseAddDropRequest(courseForm)
    message.success('Course request submitted.')
    courseOpen.value = false
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit request.')
  } finally {
    saving.value = false
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