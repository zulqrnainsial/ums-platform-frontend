<template>
  <AppLayout>
    <div class="payment-page">
      <a-page-header
        title="Payment Verification"
        sub-title="Verify or reject applicant submitted payments"
      />

      <a-card class="mb-3">
        <a-row :gutter="[12, 0]">
          <a-col :xs="24" :md="6">
            <a-form-item label="Applicant">
              <a-input
                v-model:value="filters.applicant_keyword"
                placeholder="Applicant no/name/CNIC"
                allow-clear
                @pressEnter="loadPayments"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="5">
            <a-form-item label="Voucher No">
              <a-input
                v-model:value="filters.voucher_no"
                placeholder="Voucher no"
                allow-clear
                @pressEnter="loadPayments"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-form-item label="Status">
              <a-select v-model:value="filters.status_code" allow-clear>
                <a-select-option value="submitted">Submitted</a-select-option>
                <a-select-option value="verified">Verified</a-select-option>
                <a-select-option value="rejected">Rejected</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-form-item label="From Date">
              <a-date-picker
                v-model:value="filters.from_date"
                value-format="YYYY-MM-DD"
                class="w-100"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-form-item label="To Date">
              <a-date-picker
                v-model:value="filters.to_date"
                value-format="YYYY-MM-DD"
                class="w-100"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="1" class="filter-actions">
            <a-button type="primary" :loading="loading" @click="loadPayments">
              Apply
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card>
        <a-table
          :columns="columns"
          :data-source="payments"
          :loading="loading"
          row-key="id"
          size="small"
          bordered
          :scroll="{ x: 1100 }"
          :pagination="pagination"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'applicant'">
              <strong>{{ record.applicant?.applicant_no || '-' }}</strong>
              <div>{{ record.applicant?.full_name || '-' }}</div>
            </template>

            <template v-else-if="column.key === 'application'">
              <strong>{{ record.application?.application_no || '-' }}</strong>
              <div>{{ record.offered_program?.title || '-' }}</div>
              <small>{{ record.quota?.quota_name || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'voucher'">
              <strong>{{ record.voucher?.voucher_no || '-' }}</strong>
              <div>Payable: {{ record.voucher?.payable_amount || '-' }}</div>
            </template>

            <template v-else-if="column.key === 'status_code'">
              <a-tag :color="statusColor(record.status_code)">
                {{ record.status_code }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'actions'">
              <a-space wrap>
                <a-button size="small" @click="openDetails(record.id)">
                  View
                </a-button>

                <a-button
                  size="small"
                  type="primary"
                  :disabled="record.status_code !== 'submitted'"
                  @click="openVerify(record)"
                >
                  Verify
                </a-button>

                <a-button
                  size="small"
                  danger
                  :disabled="record.status_code !== 'submitted'"
                  @click="openReject(record)"
                >
                  Reject
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="detailsOpen"
        title="Payment Details"
        width="1000px"
        :footer="null"
      >
        <a-spin :spinning="detailsLoading">
          <template v-if="selectedPayment">
            <a-descriptions title="Applicant" bordered size="small" :column="2">
              <a-descriptions-item label="Applicant No">
                {{ selectedPayment.applicant?.applicant_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Name">
                {{ selectedPayment.applicant?.full_name || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="CNIC / B-Form">
                {{ selectedPayment.applicant?.cnic_bform || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Phone">
                {{ selectedPayment.applicant?.phone || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <a-descriptions title="Application" bordered size="small" :column="2">
              <a-descriptions-item label="Application No">
                {{ selectedPayment.application?.application_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Preference">
                {{ selectedPayment.application?.preference_order || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Program">
                {{ selectedPayment.offered_program?.title || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Quota">
                {{ selectedPayment.quota?.quota_name || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <a-descriptions title="Voucher" bordered size="small" :column="3">
              <a-descriptions-item label="Voucher No">
                {{ selectedPayment.voucher?.voucher_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Status">
                {{ selectedPayment.voucher?.status_code || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Due Date">
                {{ selectedPayment.voucher?.due_date || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Payable">
                {{ selectedPayment.voucher?.payable_amount || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Paid">
                {{ selectedPayment.voucher?.paid_amount || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Balance">
                {{ selectedPayment.voucher?.balance_amount || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <a-descriptions title="Payment" bordered size="small" :column="2">
              <a-descriptions-item label="Method">
                {{ selectedPayment.payment_method_code || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Reference No">
                {{ selectedPayment.payment_reference_no || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Payment Date">
                {{ selectedPayment.payment_date || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Amount">
                {{ selectedPayment.amount || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Status">
                <a-tag :color="statusColor(selectedPayment.status_code)">
                  {{ selectedPayment.status_code }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="Verified At">
                {{ selectedPayment.verified_at || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Remarks" :span="2">
                {{ selectedPayment.remarks || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Rejection Reason" :span="2">
                {{ selectedPayment.rejection_reason || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <a-space>
              <a-button
                v-if="selectedPayment.proof_document?.download_url"
                type="link"
                :href="apiBase + selectedPayment.proof_document.download_url"
                target="_blank"
              >
                Download Payment Proof
              </a-button>

              <a-button
                v-if="selectedPayment.status_code === 'submitted'"
                type="primary"
                @click="openVerify(selectedPayment)"
              >
                Verify
              </a-button>

              <a-button
                v-if="selectedPayment.status_code === 'submitted'"
                danger
                @click="openReject(selectedPayment)"
              >
                Reject
              </a-button>
            </a-space>
          </template>
        </a-spin>
      </a-modal>

      <a-modal
        v-model:open="verifyOpen"
        title="Verify Payment"
        :confirm-loading="actionLoading"
        @ok="verifyPayment"
      >
        <a-alert
          type="success"
          show-icon
          message="This will mark the payment as verified and update voucher/application payment status."
          class="mb-3"
        />

        <a-form layout="vertical">
          <a-form-item label="Remarks">
            <a-textarea v-model:value="verifyRemarks" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="rejectOpen"
        title="Reject Payment"
        :confirm-loading="actionLoading"
        @ok="rejectPayment"
      >
        <a-alert
          type="warning"
          show-icon
          message="Please provide a clear rejection reason for the applicant/admission office."
          class="mb-3"
        />

        <a-form layout="vertical">
          <a-form-item label="Rejection Reason" required>
            <a-textarea v-model:value="rejectionReason" :rows="4" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()
const config = useRuntimeConfig()

const apiBase =
  config.public?.apiBase ||
  config.public?.apiBaseUrl ||
  config.public?.apiUrl ||
  'http://localhost:8000/api'

const loading = ref(false)
const detailsLoading = ref(false)
const actionLoading = ref(false)

const payments = ref<any[]>([])
const selectedPayment = ref<any>(null)
const selectedPaymentId = ref<number | null>(null)

const detailsOpen = ref(false)
const verifyOpen = ref(false)
const rejectOpen = ref(false)

const verifyRemarks = ref('')
const rejectionReason = ref('')

const filters = reactive<any>({
  applicant_keyword: '',
  voucher_no: '',
  status_code: 'submitted',
  from_date: null,
  to_date: null,
  per_page: 15,
})

const pagination = reactive<any>({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
})

const columns = [
  { title: 'Applicant', key: 'applicant', width: 220 },
  { title: 'Application / Program', key: 'application', width: 300 },
  { title: 'Voucher', key: 'voucher', width: 220 },
  { title: 'Method', dataIndex: 'payment_method_code', key: 'payment_method_code', width: 130 },
  { title: 'Reference No', dataIndex: 'payment_reference_no', key: 'payment_reference_no', width: 180 },
  { title: 'Date', dataIndex: 'payment_date', key: 'payment_date', width: 130 },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 110 },
  { title: 'Status', dataIndex: 'status_code', key: 'status_code', width: 120 },
  { title: 'Actions', key: 'actions', width: 210, fixed: 'right' },
]

const loadPayments = async () => {
  loading.value = true

  try {
    const response: any = await api.getPaymentVerificationPayments({
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    })

    const payload = response?.data || {}
    payments.value = payload?.data || []

    pagination.total = payload?.meta?.total || 0
    pagination.current = payload?.meta?.current_page || pagination.current
    pagination.pageSize = payload?.meta?.per_page || pagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load payments.')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadPayments()
}

const openDetails = async (paymentId: number) => {
  detailsOpen.value = true
  detailsLoading.value = true

  try {
    const response: any = await api.getPaymentVerificationPayment(paymentId)
    selectedPayment.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load payment details.')
  } finally {
    detailsLoading.value = false
  }
}

const openVerify = (record: any) => {
  selectedPaymentId.value = record.id
  verifyRemarks.value = ''
  verifyOpen.value = true
}

const openReject = (record: any) => {
  selectedPaymentId.value = record.id
  rejectionReason.value = ''
  rejectOpen.value = true
}

const verifyPayment = async () => {
  if (!selectedPaymentId.value) return

  actionLoading.value = true

  try {
    const response: any = await api.verifyPaymentFromAdmin(
      selectedPaymentId.value,
      verifyRemarks.value || null
    )

    message.success('Payment verified successfully.')
    verifyOpen.value = false
    selectedPayment.value = response?.data || selectedPayment.value
    await loadPayments()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to verify payment.')
  } finally {
    actionLoading.value = false
  }
}

const rejectPayment = async () => {
  if (!selectedPaymentId.value) return

  if (!rejectionReason.value.trim()) {
    message.error('Rejection reason is required.')
    return
  }

  actionLoading.value = true

  try {
    const response: any = await api.rejectPaymentFromAdmin(
      selectedPaymentId.value,
      rejectionReason.value
    )

    message.success('Payment rejected successfully.')
    rejectOpen.value = false
    selectedPayment.value = response?.data || selectedPayment.value
    await loadPayments()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to reject payment.')
  } finally {
    actionLoading.value = false
  }
}

const statusColor = (status: string) => {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  if (status === 'submitted') return 'processing'
  return 'default'
}

onMounted(loadPayments)
</script>

<style scoped>
.payment-page {
  padding: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}

.w-100 {
  width: 100%;
}

.filter-actions {
  display: flex;
  align-items: end;
  padding-bottom: 24px;
}
</style>
