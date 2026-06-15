<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>My Courses</h2>
          <p>View registered courses/subjects.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button @click="loadCourses">Refresh</a-button>
        </a-space>
      </div>

      <a-card>
        <a-table
          :data-source="courses"
          row-key="id"
          size="small"
          :loading="loading"
          :pagination="{ pageSize: 20 }"
        >
          <a-table-column title="Code" data-index="course_code" />
          <a-table-column title="Title" data-index="course_title" />
          <a-table-column title="Credit Hours" data-index="credit_hours" />
          <a-table-column title="Type" data-index="subject_type_code" />
          <a-table-column title="Registration Type" data-index="registration_type" />
          <a-table-column title="Status" data-index="status" />

          <a-table-column title="Locked">
            <template #default="{ record }">
              <a-tag :color="record.is_locked ? 'red' : 'green'">
                {{ record.is_locked ? 'Locked' : 'Open' }}
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
const courses = ref<any[]>([])

const unwrap = (response: any) => response?.data?.data || response?.data || response || []

const loadCourses = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentPortalCourses()
    courses.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load courses.')
  } finally {
    loading.value = false
  }
}

onMounted(loadCourses)
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
</style>