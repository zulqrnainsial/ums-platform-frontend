<template>
  <AppLayout>
    <div class="page-container">
      <a-page-header title="Dashboard" sub-title="University Management System" />

      <a-row :gutter="[16, 16]">
  <a-col
    v-for="card in cards"
    :key="card.title"
    :xs="24"
    :sm="12"
    :md="8"
    :lg="6"
  >
    <a-card :loading="loading">
      <a-statistic
        :title="card.title"
        :value="card.value"
      />
    </a-card>
  </a-col>
</a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '~/components/layout/AppLayout.vue'
import { message } from 'ant-design-vue'

const { apiFetch } = useApi()

const loading = ref(false)

const summary = ref<any>({
  scope: null,
})

const loadSummary = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch('/dashboard/summary', {
      method: 'GET',
    })

    summary.value = response?.data || {}
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load dashboard summary.')
  } finally {
    loading.value = false
  }
}

const cards = computed(() => {
  if (summary.value?.scope === 'platform') {
    return [
      { title: 'Tenants', value: summary.value.tenants || 0 },
      { title: 'Active Tenants', value: summary.value.active_tenants || 0 },
      { title: 'Users', value: summary.value.users || 0 },
      { title: 'Modules', value: summary.value.modules || 0 },
      { title: 'Login Logs', value: summary.value.login_logs || 0 },
      { title: 'Audit Logs', value: summary.value.audit_logs || 0 },
    ]
  }

  return [
    { title: 'Students', value: summary.value.students || 0 },
    { title: 'Applicants', value: summary.value.applicants || 0 },
    { title: 'Programs', value: summary.value.programs || 0 },
    { title: 'Enrollments', value: summary.value.enrollments || 0 },
    { title: 'Course Registrations', value: summary.value.course_registrations || 0 },
    { title: 'Users', value: summary.value.users || 0 },
  ]
})

onMounted(loadSummary)
</script>