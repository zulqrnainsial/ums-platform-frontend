<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>My Profile</h2>
          <p>View student profile, guardians and previous education.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button @click="loadProfile">Refresh</a-button>
        </a-space>
      </div>

      <a-spin :spinning="loading">
        <a-card class="mb-3" title="Profile Picture">
  <a-space align="center">
    <a-avatar
      :size="96"
      :src="profile?.student?.profile_photo_url"
    >
      {{ profile?.student?.full_name?.charAt(0) || 'S' }}
    </a-avatar>

    <a-upload
      :before-upload="beforeProfileUpload"
      :show-upload-list="false"
      accept="image/png,image/jpeg,image/webp"
    >
      <a-button type="primary">
        Upload Profile Picture
      </a-button>
    </a-upload>
  </a-space>
</a-card>
        <a-card title="Profile" class="mb-3">
          <a-descriptions bordered size="small" :column="2">
            <a-descriptions-item label="Student No">
              {{ profile?.student?.student_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Name">
              {{ profile?.student?.full_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Father Name">
              {{ profile?.student?.father_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="CNIC / B-Form">
              {{ profile?.student?.cnic_bform || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="DOB">
              {{ profile?.student?.date_of_birth || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Gender">
              {{ profile?.student?.gender || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Phone">
              {{ profile?.student?.phone || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Email">
              {{ profile?.student?.email || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Current Address">
              {{ profile?.student?.current_address || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Permanent Address">
              {{ profile?.student?.permanent_address || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="Guardians" class="mb-3">
          <a-table
            :data-source="profile?.guardians || []"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <a-table-column title="Name" data-index="guardian_name" />
            <a-table-column title="Phone" data-index="guardian_phone" />
            <a-table-column title="Email" data-index="guardian_email" />
            <a-table-column title="Primary" data-index="is_primary" />
            <a-table-column title="Emergency" data-index="is_emergency_contact" />
          </a-table>
        </a-card>

        <a-card title="Previous Education">
          <a-table
            :data-source="profile?.previous_educations || []"
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
          </a-table>
        </a-card>
      </a-spin>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const portalApi = useStudentPortalApi()

const loading = ref(false)
const profile = ref<any>(null)

const unwrap = (response: any) => response?.data?.data || response?.data || response || null

const loadProfile = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentPortalProfile()
    profile.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load profile.')
  } finally {
    loading.value = false
  }
}
const beforeProfileUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('photo', file)

  try {
    await portalApi.uploadStudentProfilePicture(formData)
    message.success('Profile picture uploaded successfully.')
    await loadProfile()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to upload profile picture.')
  }

  return false
}
onMounted(loadProfile)
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