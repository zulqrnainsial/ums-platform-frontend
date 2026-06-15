<template>
  <div class="applicant-portal-page">
    <a-card>
      <template #title>
        Applicant Portal Testing
      </template>

      <template #extra>
        <a-button type="primary" :loading="loading" @click="loadApplicants">
          Refresh
        </a-button>
      </template>

      <a-alert
        type="info"
        show-icon
        class="mb-3"
        message="This is the applicant portal testing entry point. Select an applicant to open the wizard shell."
      />

      <a-spin :spinning="loading">
        <a-table
          :columns="columns"
          :data-source="applicants"
          :pagination="{ pageSize: 10 }"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" @click="openApplicant(record)">
                Open Portal
              </a-button>
            </template>
          </template>
        </a-table>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const router = useRouter()
const api = useApplicantPortalApi()

const loading = ref(false)
const applicants = ref<any[]>([])

const columns = [
  {
    title: 'Applicant No',
    dataIndex: 'applicant_no',
    key: 'applicant_no',
  },
  {
    title: 'Full Name',
    dataIndex: 'full_name',
    key: 'full_name',
  },
  {
    title: 'Father Name',
    dataIndex: 'father_name',
    key: 'father_name',
  },
  {
    title: 'CNIC / B-Form',
    dataIndex: 'cnic_bform',
    key: 'cnic_bform',
  },
  {
    title: 'Action',
    key: 'action',
    width: 140,
  },
]

const loadApplicants = async () => {
  loading.value = true

  try {
    const response: any = await api.getApplicants()
    applicants.value = response?.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load applicants.')
  } finally {
    loading.value = false
  }
}

const openApplicant = (record: any) => {
  router.push(`/applicant-portal/${record.id}`)
}

onMounted(() => {
  loadApplicants()
})
</script>

<style scoped>
.applicant-portal-page {
  padding: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>