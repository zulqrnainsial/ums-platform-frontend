<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Student Portal</h2>
          <p>Profile, enrollment, courses and documents.</p>
        </div>

        <a-button @click="loadDashboard">Refresh</a-button>
        <NuxtLink to="/student-portal/requests">
  <a-button>Requests</a-button>
</NuxtLink>
<NuxtLink to="/student-portal/fee-status">
  <a-button>Fee Status</a-button>
</NuxtLink>

<NuxtLink to="/student-portal/research-publications">
  <a-button>Research / Publications</a-button>
</NuxtLink>
      </div>

      <a-spin :spinning="loading">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="6">
            <a-card>
              <a-statistic title="Courses" :value="dashboard?.courses_count || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :md="6">
            <a-card>
              <a-statistic title="Documents" :value="dashboard?.documents_count || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :md="6">
            <a-card>
              <a-statistic title="Pending Docs" :value="dashboard?.pending_documents_count || 0" />
            </a-card>
          </a-col>

          <a-col :xs="24" :md="6">
            <a-card>
              <div>Academic Status</div>
              <a-tag>{{ dashboard?.academic_status || '-' }}</a-tag>
            </a-card>
          </a-col>
        </a-row>

        <a-card class="mt-3" title="Student Information">
          <a-descriptions bordered size="small" :column="2">
            <a-descriptions-item label="Student No">
              {{ dashboard?.student?.student_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Name">
              {{ dashboard?.student?.full_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="CNIC / B-Form">
              {{ dashboard?.student?.cnic_bform || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Phone">
              {{ dashboard?.student?.phone || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Program">
              {{ dashboard?.current_enrollment?.program_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Academic Session">
              {{ dashboard?.current_enrollment?.academic_session_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Section">
              {{ dashboard?.current_enrollment?.section || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Roll No">
              {{ dashboard?.current_enrollment?.roll_no || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card class="mt-3" title="Quick Links">
          <a-space wrap>
            <NuxtLink to="/student-portal/profile">
              <a-button>Profile</a-button>
            </NuxtLink>

            <NuxtLink to="/student-portal/enrollment">
              <a-button>Enrollment</a-button>
            </NuxtLink>

            <NuxtLink to="/student-portal/courses">
              <a-button>Courses</a-button>
            </NuxtLink>

            <NuxtLink to="/student-portal/documents">
              <a-button>Documents</a-button>
            </NuxtLink>
          </a-space>
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
const dashboard = ref<any>(null)

const unwrap = (response: any) => response?.data?.data || response?.data || response || null

const loadDashboard = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentPortalDashboard()
    dashboard.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load student portal dashboard.')
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
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

.mt-3 {
  margin-top: 16px;
}
</style>