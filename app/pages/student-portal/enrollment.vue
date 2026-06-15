<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>My Enrollment</h2>
          <p>View academic enrollment and enrollment history.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button @click="loadEnrollment">Refresh</a-button>
        </a-space>
      </div>

      <a-spin :spinning="loading">
        <a-card title="Current Enrollment" class="mb-3">
          <a-descriptions bordered size="small" :column="2">
            <a-descriptions-item label="Program">
              {{ enrollment?.current_enrollment?.program_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Academic Session">
              {{ enrollment?.current_enrollment?.academic_session_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Batch">
              {{ enrollment?.current_enrollment?.batch_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Section">
              {{ enrollment?.current_enrollment?.section || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Roll No">
              {{ enrollment?.current_enrollment?.roll_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Registration No">
              {{ enrollment?.current_enrollment?.registration_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Enrollment Status">
              {{ enrollment?.current_enrollment?.status || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Lifecycle Status">
              {{ enrollment?.current_enrollment?.lifecycle_status || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="Enrollment History">
          <a-table
            :data-source="enrollment?.enrollments || []"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <a-table-column title="Program" data-index="program_name" />
            <a-table-column title="Session" data-index="academic_session_name" />
            <a-table-column title="Batch" data-index="batch_name" />
            <a-table-column title="Section" data-index="section" />
            <a-table-column title="Roll No" data-index="roll_no" />
            <a-table-column title="Status" data-index="status" />
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
const enrollment = ref<any>(null)

const unwrap = (response: any) => response?.data?.data || response?.data || response || null

const loadEnrollment = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentPortalEnrollment()
    enrollment.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load enrollment.')
  } finally {
    loading.value = false
  }
}

onMounted(loadEnrollment)
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