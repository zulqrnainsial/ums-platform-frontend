<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Student Profile Completion</h2>
          <p>Complete student profile, guardian, documents and previous education after admission transfer.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-management/students">
            <a-button>Back to Students</a-button>
          </NuxtLink>
          <a-button @click="loadAll">Refresh</a-button>
        </a-space>
      </div>

      <a-spin :spinning="loading">
        <a-alert
          v-if="completion"
          class="mb-3"
          :type="completion.is_complete ? 'success' : 'warning'"
          :message="completion.is_complete ? 'Profile is complete' : 'Profile is incomplete'"
          :description="completion.issues?.join(' | ') || 'No issues found.'"
          show-icon
        />

        <a-card class="mb-3" title="Completion Summary">
          <a-progress :percent="completion?.completion_percentage || 0" />

          <a-row :gutter="[12, 12]" class="mt-3">
            <a-col :xs="24" :md="6">
              <a-tag :color="completion?.sections?.profile ? 'green' : 'orange'">
                Profile
              </a-tag>
            </a-col>
            <a-col :xs="24" :md="6">
              <a-tag :color="completion?.sections?.guardian ? 'green' : 'orange'">
                Guardian
              </a-tag>
            </a-col>
            <a-col :xs="24" :md="6">
              <a-tag :color="completion?.sections?.previous_education ? 'green' : 'orange'">
                Previous Education
              </a-tag>
            </a-col>
            <a-col :xs="24" :md="6">
              <a-tag :color="completion?.sections?.documents ? 'green' : 'orange'">
                Documents
              </a-tag>
            </a-col>
          </a-row>
        </a-card>

        <a-tabs>
          <a-tab-pane key="profile" tab="Profile">
            <a-card>
              <a-form layout="vertical">
                <a-row :gutter="[12, 12]">
                  <a-col :xs="24" :md="8">
                    <a-form-item label="First Name">
                      <a-input v-model:value="profileForm.first_name" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Last Name">
                      <a-input v-model:value="profileForm.last_name" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Father Name">
                      <a-input v-model:value="profileForm.father_name" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Mother Name">
                      <a-input v-model:value="profileForm.mother_name" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="CNIC / B-Form">
                      <a-input v-model:value="profileForm.cnic_bform" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Date of Birth">
                      <a-date-picker
                        v-model:value="profileForm.date_of_birth"
                        value-format="YYYY-MM-DD"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Gender">
                      <a-select
                        v-model:value="profileForm.gender"
                        :options="genderOptions"
                        allow-clear
                      />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Phone">
                      <a-input v-model:value="profileForm.phone" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Alternate Phone">
                      <a-input v-model:value="profileForm.alternate_phone" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="8">
                    <a-form-item label="Email">
                      <a-input v-model:value="profileForm.email" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="12">
                    <a-form-item label="Current Address">
                      <a-textarea v-model:value="profileForm.current_address" :rows="3" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24" :md="12">
                    <a-form-item label="Permanent Address">
                      <a-textarea v-model:value="profileForm.permanent_address" :rows="3" />
                    </a-form-item>
                  </a-col>

                  <a-col :xs="24">
                    <a-button type="primary" @click="saveProfile">
                      Save Profile
                    </a-button>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>
          </a-tab-pane>

          <a-tab-pane key="guardians" tab="Guardians">
            <a-card>
              <template #extra>
                <a-button type="primary" @click="openGuardianModal(null)">
                  Add Guardian
                </a-button>
              </template>

              <a-table
                :data-source="detail?.guardians || []"
                row-key="id"
                size="small"
                :pagination="false"
              >
                <a-table-column title="Name" data-index="guardian_name" />
                <a-table-column title="Phone" data-index="guardian_phone" />
                <a-table-column title="CNIC" data-index="guardian_cnic" />
                <a-table-column title="Primary" data-index="is_primary" />
                <a-table-column title="Emergency" data-index="is_emergency_contact" />

                <a-table-column title="Action">
                  <template #default="{ record }">
                    <a-space>
                      <a-button size="small" @click="openGuardianModal(record)">
                        Edit
                      </a-button>
                      <a-popconfirm
                        title="Remove this guardian link?"
                        @confirm="removeGuardian(record)"
                      >
                        <a-button size="small" danger>
                          Remove
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>
          </a-tab-pane>

          <a-tab-pane key="previous" tab="Previous Education">
            <a-card>
              <template #extra>
                <a-button type="primary" @click="openPreviousEducationModal(null)">
                  Add Previous Education
                </a-button>
              </template>

              <a-table
                :data-source="detail?.previous_educations || []"
                row-key="id"
                size="small"
                :pagination="false"
              >
                <a-table-column title="Degree/Class" data-index="degree_class_name" />
                <a-table-column title="Roll No" data-index="roll_no" />
                <a-table-column title="Passing Year" data-index="passing_year" />
                <a-table-column title="Total" data-index="total_marks" />
                <a-table-column title="Obtained" data-index="obtained_marks" />
                <a-table-column title="%" data-index="percentage" />

                <a-table-column title="Action">
                  <template #default="{ record }">
                    <a-space>
                      <a-button size="small" @click="openPreviousEducationModal(record)">
                        Edit
                      </a-button>
                      <a-popconfirm
                        title="Remove this previous education?"
                        @confirm="removePreviousEducation(record)"
                      >
                        <a-button size="small" danger>
                          Remove
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>
          </a-tab-pane>

          <a-tab-pane key="documents" tab="Documents">
            <a-card>
              <a-table
                :data-source="detail?.documents || []"
                row-key="id"
                size="small"
                :pagination="false"
              >
                <a-table-column title="Title" data-index="document_title" />
                <a-table-column title="File" data-index="file_name" />
                <a-table-column title="Status" data-index="verification_status" />
                <a-table-column title="Remarks" data-index="remarks" />

                <a-table-column title="Action">
                  <template #default="{ record }">
                    <a-button size="small" type="primary" @click="openDocumentModal(record)">
                      Verify
                    </a-button>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-spin>

      <a-modal
        v-model:open="guardianOpen"
        title="Guardian"
        ok-text="Save"
        :confirm-loading="saving"
        @ok="saveGuardian"
      >
        <a-form layout="vertical">
          <a-form-item label="Name" required>
            <a-input v-model:value="guardianForm.name" />
          </a-form-item>

          <a-form-item label="CNIC">
            <a-input v-model:value="guardianForm.cnic" />
          </a-form-item>

          <a-form-item label="Phone">
            <a-input v-model:value="guardianForm.phone" />
          </a-form-item>

          <a-form-item label="Email">
            <a-input v-model:value="guardianForm.email" />
          </a-form-item>

          <a-form-item label="Occupation">
            <a-input v-model:value="guardianForm.occupation" />
          </a-form-item>

          <a-form-item label="Address">
            <a-textarea v-model:value="guardianForm.address" :rows="3" />
          </a-form-item>

          <a-space>
            <a-checkbox v-model:checked="guardianForm.is_primary">
              Primary
            </a-checkbox>
            <a-checkbox v-model:checked="guardianForm.is_emergency_contact">
              Emergency Contact
            </a-checkbox>
            <a-checkbox v-model:checked="guardianForm.can_pick_student">
              Can Pick Student
            </a-checkbox>
          </a-space>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="previousOpen"
        title="Previous Education"
        ok-text="Save"
        :confirm-loading="saving"
        @ok="savePreviousEducation"
      >
        <a-form layout="vertical">
          <a-form-item label="Degree / Class">
            <a-input v-model:value="previousForm.degree_class_name" />
          </a-form-item>

          <a-row :gutter="[12, 12]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Roll No">
                <a-input v-model:value="previousForm.roll_no" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Registration No">
                <a-input v-model:value="previousForm.registration_no" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Passing Year">
                <a-input-number v-model:value="previousForm.passing_year" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Grade">
                <a-input v-model:value="previousForm.grade" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Total Marks">
                <a-input-number v-model:value="previousForm.total_marks" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Obtained Marks">
                <a-input-number v-model:value="previousForm.obtained_marks" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="Remarks">
            <a-textarea v-model:value="previousForm.remarks" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="documentOpen"
        title="Verify Document"
        ok-text="Save"
        :confirm-loading="saving"
        @ok="saveDocumentVerification"
      >
        <a-form layout="vertical">
          <a-form-item label="Document">
            <a-input :value="selectedDocument?.document_title" disabled />
          </a-form-item>

          <a-form-item label="Verification Status" required>
            <a-select
              v-model:value="documentForm.verification_status"
              :options="documentStatusOptions"
            />
          </a-form-item>

          <a-form-item label="Remarks">
            <a-textarea v-model:value="documentForm.remarks" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>
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
const saving = ref(false)

const detail = ref<any>(null)
const completion = ref<any>(null)

const guardianOpen = ref(false)
const previousOpen = ref(false)
const documentOpen = ref(false)

const selectedGuardian = ref<any>(null)
const selectedPrevious = ref<any>(null)
const selectedDocument = ref<any>(null)

const profileForm = reactive<any>({})
const guardianForm = reactive<any>({})
const previousForm = reactive<any>({})
const documentForm = reactive<any>({
  verification_status: 'pending',
  remarks: '',
})

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

const documentStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Resubmission Required', value: 'resubmission_required' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || null

const fillProfileForm = () => {
  const student = detail.value?.student || {}

  Object.assign(profileForm, {
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    father_name: student.father_name || '',
    mother_name: student.mother_name || '',
    cnic_bform: student.cnic_bform || '',
    passport_no: student.passport_no || '',
    date_of_birth: student.date_of_birth || undefined,
    gender: student.gender || undefined,
    phone: student.phone || '',
    alternate_phone: student.alternate_phone || '',
    email: student.email || '',
    current_address: student.current_address || '',
    permanent_address: student.permanent_address || '',
    remarks: student.remarks || '',
  })
}

const loadAll = async () => {
  loading.value = true

  try {
    const detailResponse: any = await api.getStudentManagementStudent(studentId)
    detail.value = unwrap(detailResponse)

    const completionResponse: any = await api.getStudentProfileCompletion(studentId)
    completion.value = unwrap(completionResponse)

    fillProfileForm()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load student profile.')
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true

  try {
    await api.updateStudentProfile(studentId, profileForm)
    message.success('Profile updated successfully.')
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to update profile.')
  } finally {
    saving.value = false
  }
}

const openGuardianModal = (record: any) => {
  selectedGuardian.value = record

  Object.assign(guardianForm, {
    student_guardian_id: record?.id || null,
    guardian_id: record?.guardian_id || null,
    name: record?.guardian_name || '',
    cnic: record?.guardian_cnic || '',
    phone: record?.guardian_phone || '',
    email: record?.guardian_email || '',
    occupation: record?.occupation || '',
    address: record?.address || '',
    is_primary: !!record?.is_primary,
    is_emergency_contact: !!record?.is_emergency_contact,
    can_pick_student: !!record?.can_pick_student,
    status: record?.status || 'active',
  })

  guardianOpen.value = true
}

const saveGuardian = async () => {
  if (!guardianForm.name) {
    message.error('Guardian name is required.')
    return
  }

  saving.value = true

  try {
    await api.saveStudentGuardian(studentId, guardianForm)
    message.success('Guardian saved successfully.')
    guardianOpen.value = false
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save guardian.')
  } finally {
    saving.value = false
  }
}

const removeGuardian = async (record: any) => {
  saving.value = true

  try {
    await api.deleteStudentGuardian(record.id)
    message.success('Guardian removed successfully.')
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to remove guardian.')
  } finally {
    saving.value = false
  }
}

const openPreviousEducationModal = (record: any) => {
  selectedPrevious.value = record

  Object.assign(previousForm, {
    id: record?.id || null,
    degree_class_name: record?.degree_class_name || '',
    roll_no: record?.roll_no || '',
    registration_no: record?.registration_no || '',
    passing_year: record?.passing_year || undefined,
    total_marks: record?.total_marks || undefined,
    obtained_marks: record?.obtained_marks || undefined,
    grade: record?.grade || '',
    remarks: record?.remarks || '',
    status: record?.status || 'active',
  })

  previousOpen.value = true
}

const savePreviousEducation = async () => {
  saving.value = true

  try {
    await api.saveStudentPreviousEducation(studentId, previousForm)
    message.success('Previous education saved successfully.')
    previousOpen.value = false
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save previous education.')
  } finally {
    saving.value = false
  }
}

const removePreviousEducation = async (record: any) => {
  saving.value = true

  try {
    await api.deleteStudentPreviousEducation(record.id)
    message.success('Previous education removed successfully.')
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to remove previous education.')
  } finally {
    saving.value = false
  }
}

const openDocumentModal = (record: any) => {
  selectedDocument.value = record

  documentForm.verification_status = record?.verification_status || 'pending'
  documentForm.remarks = record?.remarks || ''

  documentOpen.value = true
}

const saveDocumentVerification = async () => {
  if (!selectedDocument.value?.id) {
    return
  }

  saving.value = true

  try {
    await api.verifyStudentDocument(selectedDocument.value.id, documentForm)
    message.success('Document verification updated successfully.')
    documentOpen.value = false
    await loadAll()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to verify document.')
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

.mt-3 {
  margin-top: 16px;
}
</style>