<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>My Attendance</h2>
          <p>View your course-wise attendance records.</p>
        </div>

        <a-button @click="loadAttendance">
          Refresh
        </a-button>
      </div>

      <a-row :gutter="[12, 12]" class="mb-3">
        <a-col :xs="24" :md="5">
          <a-card :loading="loading">
            <a-statistic title="Total Classes" :value="summary.total || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="5">
          <a-card :loading="loading">
            <a-statistic title="Present" :value="summary.present || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="5">
          <a-card :loading="loading">
            <a-statistic title="Absent" :value="summary.absent || 0" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="5">
          <a-card :loading="loading">
            <a-statistic title="Late / Leave" :value="lateLeave" />
          </a-card>
        </a-col>

        <a-col :xs="24" :md="4">
          <a-card :loading="loading">
            <a-statistic title="Attendance %" :value="summary.percentage || 0" suffix="%" />
          </a-card>
        </a-col>
      </a-row>

      <a-card title="Attendance Records">
        <a-table
          :data-source="records"
          row-key="id"
          size="small"
          :loading="loading"
          :pagination="{ pageSize: 15 }"
        >
          <a-table-column title="Date" data-index="attendance_date" />

          <a-table-column title="Course">
            <template #default="{ record }">
              <div>
                <strong>{{ record.course_code || '-' }}</strong>
                <div>{{ record.course_title || '-' }}</div>
              </div>
            </template>
          </a-table-column>

          <a-table-column title="Type" data-index="session_type" />
          <a-table-column title="Topic" data-index="topic" />

          <a-table-column title="Status">
            <template #default="{ record }">
              <a-tag :color="statusColor(record.status_code)">
                {{ record.status_code }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column title="Remarks" data-index="remarks" />
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
const summary = ref<any>({})
const records = ref<any[]>([])

const lateLeave = computed(() => {
  return Number(summary.value?.late || 0) + Number(summary.value?.leave || 0)
})

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const statusColor = (status: string) => {
  if (status === 'present') return 'green'
  if (status === 'absent') return 'red'
  if (status === 'late') return 'orange'
  if (['leave', 'excused'].includes(status)) return 'blue'
  return 'default'
}

const loadAttendance = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentAttendance()
    const payload = unwrap(response)

    summary.value = payload.summary || {}
    records.value = payload.records || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attendance.')
  } finally {
    loading.value = false
  }
}

onMounted(loadAttendance)
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