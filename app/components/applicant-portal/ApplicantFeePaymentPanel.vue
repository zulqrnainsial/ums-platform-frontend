<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Fee Vouchers & Payments</a-typography-title>

      <a-space>
        <a-select
          v-model:value="selectedApplicationId"
          placeholder="Select Application"
          style="width: 320px"
          allow-clear
          @change="loadVouchers"
        >
          <a-select-option
            v-for="application in applications"
            :key="application.id"
            :value="application.id"
          >
            {{ application.application_no }} - {{ application.offered_program_title }}
          </a-select-option>
        </a-select>

        <a-button size="small" :loading="loading" @click="loadVouchers">
          Refresh
        </a-button>

        <a-button
          type="primary"
          size="small"
          :disabled="!selectedApplicationId"
          :loading="generating"
          @click="generateVoucher"
        >
          Generate Voucher
        </a-button>
      </a-space>
    </div>

    <a-alert
      v-if="!selectedApplicationId"
      type="info"
      show-icon
      message="Select an application to view or generate fee voucher."
      class="mb-3"
    />

    <a-spin :spinning="loading">
      <a-empty
        v-if="selectedApplicationId && vouchers.length === 0"
        description="No voucher found for selected application"
      />

      <a-collapse v-else accordion>
        <a-collapse-panel
          v-for="voucher in vouchers"
          :key="voucher.id"
          :header="`${voucher.voucher_no} - ${voucher.voucher_type_code}`"
        >
          <a-descriptions size="small" bordered :column="2">
            <a-descriptions-item label="Voucher No">
              {{ voucher.voucher_no }}
            </a-descriptions-item>

            <a-descriptions-item label="Status">
              <a-tag :color="voucherStatusColor(voucher.status_code)">
                {{ voucher.status_code }}
              </a-tag>
            </a-descriptions-item>

            <a-descriptions-item label="Issue Date">
              {{ voucher.issue_date || '-' }}
            </a-descriptions-item>

            <a-descriptions-item label="Due Date">
              {{ voucher.due_date || '-' }}
            </a-descriptions-item>

            <a-descriptions-item label="Amount">
              {{ voucher.amount }}
            </a-descriptions-item>

            <a-descriptions-item label="Discount">
              {{ voucher.discount_amount }}
            </a-descriptions-item>

            <a-descriptions-item label="Fine">
              {{ voucher.fine_amount }}
            </a-descriptions-item>

            <a-descriptions-item label="Payable">
              <strong>{{ voucher.payable_amount }}</strong>
            </a-descriptions-item>

            <a-descriptions-item label="Paid">
              {{ voucher.paid_amount }}
            </a-descriptions-item>

            <a-descriptions-item label="Balance">
              {{ voucher.balance_amount }}
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <div class="voucher-actions">
            <a-button
              type="primary"
              size="small"
              :disabled="['verified', 'paid', 'cancelled', 'expired'].includes(voucher.status_code)"
              @click="openPaymentModal(voucher)"
            >
              Submit Payment
            </a-button>
          </div>

          <a-divider />

          <a-typography-title :level="5">Payments</a-typography-title>

          <a-table
            :columns="paymentColumns"
            :data-source="voucher.payments || []"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status_code'">
                <a-tag :color="paymentStatusColor(record.status_code)">
                  {{ record.status_code }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-collapse-panel>
      </a-collapse>
    </a-spin>

    <a-modal
      v-model:open="paymentModalOpen"
      title="Submit Payment"
      width="680px"
      :confirm-loading="submittingPayment"
      @ok="submitPayment"
    >
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="Payment Method" required>
              <a-select v-model:value="paymentForm.payment_method_code">
                <a-select-option value="bank_deposit">Bank Deposit</a-select-option>
                <a-select-option value="online">Online</a-select-option>
                <a-select-option value="cash">Cash</a-select-option>
                <a-select-option value="manual">Manual</a-select-option>
                <a-select-option value="adjustment">Adjustment</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Reference No">
              <a-input v-model:value="paymentForm.payment_reference_no" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Payment Date">
              <a-date-picker
                v-model:value="paymentForm.payment_date"
                value-format="YYYY-MM-DD"
                class="w-100"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Amount" required>
              <a-input-number
                v-model:value="paymentForm.amount"
                class="w-100"
                :min="1"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="Payment Proof Document">
              <a-select
                v-model:value="paymentForm.payment_proof_document_id"
                :options="documentOptions"
                allow-clear
                show-search
                option-filter-prop="label"
                placeholder="Optional: select uploaded payment proof document"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="Remarks">
              <a-textarea v-model:value="paymentForm.remarks" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <a-alert
        type="warning"
        show-icon
        message="Payment will remain submitted until verified by admission/accounts office."
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{
  applicantId: number
  applications: any[]
}>()

const emit = defineEmits<{
  changed: []
}>()

const api = useApplicantPortalApi()

const loading = ref(false)
const generating = ref(false)
const submittingPayment = ref(false)

const selectedApplicationId = ref<number | null>(null)
const selectedVoucher = ref<any>(null)
const vouchers = ref<any[]>([])
const documentOptions = ref<any[]>([])

const paymentModalOpen = ref(false)

const paymentForm = reactive<any>({
  applicant_fee_voucher_id: null,
  payment_method_code: 'bank_deposit',
  payment_reference_no: null,
  payment_date: null,
  amount: null,
  payment_proof_document_id: null,
  remarks: null,
})

const paymentColumns = [
  {
    title: 'Method',
    dataIndex: 'payment_method_code',
    key: 'payment_method_code',
    width: 140,
  },
  {
    title: 'Reference No',
    dataIndex: 'payment_reference_no',
    key: 'payment_reference_no',
  },
  {
    title: 'Payment Date',
    dataIndex: 'payment_date',
    key: 'payment_date',
    width: 130,
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    width: 110,
  },
  {
    title: 'Status',
    dataIndex: 'status_code',
    key: 'status_code',
    width: 120,
  },
  {
    title: 'Verified At',
    dataIndex: 'verified_at',
    key: 'verified_at',
    width: 170,
  },
]

const normalizeDocuments = (response: any) => {
  const rows = response?.data?.data || response?.data || []

  return rows.map((item: any) => ({
    label: `${item.document_title}${item.original_file_name ? ' - ' + item.original_file_name : ''}`,
    value: item.id,
  }))
}

const loadDocuments = async () => {
  try {
    const response: any = api.isApplicantSession()
        ? await api.applicantGetDocuments()
        : await api.getApplicantDocuments(props.applicantId)
    documentOptions.value = normalizeDocuments(response)
  } catch {
    documentOptions.value = []
  }
}

const loadVouchers = async () => {
  if (!selectedApplicationId.value) {
    vouchers.value = []
    return
  }

  loading.value = true

  try {
    const response: any = api.isApplicantSession()
        ? await api.applicantGetApplicationVouchers(selectedApplicationId.value)
        : await api.getApplicationVouchers(selectedApplicationId.value)
    vouchers.value = response?.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load vouchers.')
  } finally {
    loading.value = false
  }
}

const generateVoucher = async () => {
  if (!selectedApplicationId.value) {
    message.error('Please select an application.')
    return
  }

  generating.value = true

  try {
    if (api.isApplicantSession()) {
  await api.applicantGenerateVoucher(selectedApplicationId.value)
} else {
  await api.generateVoucher(selectedApplicationId.value)
}
    message.success('Voucher generated successfully.')
    await loadVouchers()
    emit('changed')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to generate voucher.')
  } finally {
    generating.value = false
  }
}

const resetPaymentForm = () => {
  Object.assign(paymentForm, {
    applicant_fee_voucher_id: selectedVoucher.value?.id || null,
    payment_method_code: 'bank_deposit',
    payment_reference_no: null,
    payment_date: new Date().toISOString().slice(0, 10),
    amount: selectedVoucher.value?.balance_amount || selectedVoucher.value?.payable_amount || null,
    payment_proof_document_id: null,
    remarks: null,
  })
}

const openPaymentModal = async (voucher: any) => {
  selectedVoucher.value = voucher
  resetPaymentForm()
  await loadDocuments()
  paymentModalOpen.value = true
}

const submitPayment = async () => {
  if (!paymentForm.applicant_fee_voucher_id) {
    message.error('Voucher is required.')
    return
  }

  if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
    message.error('Payment amount is required.')
    return
  }

  submittingPayment.value = true

  try {
    if (api.isApplicantSession()) {
  await api.applicantSubmitPayment({ ...paymentForm })
} else {
  await api.submitApplicantPayment({ ...paymentForm })
}
    message.success('Payment submitted successfully.')
    paymentModalOpen.value = false
    await loadVouchers()
    emit('changed')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit payment.')
  } finally {
    submittingPayment.value = false
  }
}

const voucherStatusColor = (status: string) => {
  if (['verified', 'paid'].includes(status)) return 'success'
  if (status === 'partially_paid') return 'processing'
  if (['cancelled', 'expired'].includes(status)) return 'error'
  return 'warning'
}

const paymentStatusColor = (status: string) => {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  if (status === 'submitted') return 'processing'
  return 'default'
}

watch(
  () => props.applications,
  () => {
    if (!selectedApplicationId.value && props.applications.length > 0) {
      selectedApplicationId.value = props.applications[0].id
      loadVouchers()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.mb-3 {
  margin-bottom: 16px;
}

.w-100 {
  width: 100%;
}

.voucher-actions {
  display: flex;
  justify-content: flex-end;
}
</style>