<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Admission Fee Status</h2>
          <p>View admission voucher and payment status.</p>
        </div>

        <a-space>
          <NuxtLink to="/student-portal/dashboard">
            <a-button>Dashboard</a-button>
          </NuxtLink>
          <a-button @click="loadFeeStatus">Refresh</a-button>
        </a-space>
      </div>

      <a-spin :spinning="loading">
        <a-row :gutter="[16, 16]" class="mb-3">
          <a-col :xs="24" :md="8">
            <a-card>
              <a-statistic title="Total Payable" :value="fee?.summary?.total_payable || 0" prefix="Rs." />
            </a-card>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-card>
              <a-statistic title="Total Paid" :value="fee?.summary?.total_paid || 0" prefix="Rs." />
            </a-card>
          </a-col>

          <a-col :xs="24" :md="8">
            <a-card>
              <a-statistic title="Balance" :value="fee?.summary?.balance || 0" prefix="Rs." />
              <a-tag class="mt-2" :color="fee?.summary?.status === 'paid' ? 'green' : 'orange'">
                {{ fee?.summary?.status || '-' }}
              </a-tag>
            </a-card>
          </a-col>
        </a-row>

        <a-card title="Vouchers" class="mb-3">
          <a-table
            :data-source="fee?.vouchers || []"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <a-table-column title="Voucher No" data-index="voucher_no" />
            <a-table-column title="Amount" data-index="amount" />
            <a-table-column title="Payable" data-index="payable_amount" />
            <a-table-column title="Status" data-index="status" />
            <a-table-column title="Due Date" data-index="due_date" />
          </a-table>
        </a-card>

        <a-card title="Payments">
          <a-table
            :data-source="fee?.payments || []"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <a-table-column title="Amount" data-index="amount" />
            <a-table-column title="Method" data-index="payment_method" />
            <a-table-column title="Reference" data-index="transaction_reference" />
            <a-table-column title="Status" data-index="status" />
            <a-table-column title="Paid At" data-index="paid_at" />
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
const fee = ref<any>(null)

const unwrap = (response: any) => response?.data?.data || response?.data || response || null

const loadFeeStatus = async () => {
  loading.value = true

  try {
    const response: any = await portalApi.getStudentPortalFeeStatus()
    fee.value = unwrap(response)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load fee status.')
  } finally {
    loading.value = false
  }
}

onMounted(loadFeeStatus)
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

.mt-2 {
  margin-top: 8px;
}
</style>