<template>
  <div>
    <div class="panel-header">
      <div>
        <h3>Admission Offers</h3>
        <p>View your merit list status and respond to admission offers.</p>
      </div>

      <a-button @click="loadOffers">
        Refresh
      </a-button>
    </div>

    <a-alert
      v-if="summary.accepted > 0"
      type="success"
      show-icon
      class="mb-3"
      message="You have accepted an admission offer."
    />

    <a-alert
      v-else-if="summary.offered > 0"
      type="warning"
      show-icon
      class="mb-3"
      message="You have an admission offer. Please accept or reject it before expiry."
    />

    <a-alert
      v-else-if="summary.waiting > 0"
      type="info"
      show-icon
      class="mb-3"
      message="You are currently on the waiting list."
    />

    <a-table
      :data-source="offers"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="small"
    >
      <a-table-column title="Program / List">
        <template #default="{ record }">
          <strong>{{ record.offered_program_label || '-' }}</strong>
          <div>{{ record.preference_group_label || '-' }}</div>
          <small>
            {{ record.list_no || '-' }}
            <template v-if="record.merit_list_title">
              - {{ record.merit_list_title }}
            </template>
          </small>
        </template>
      </a-table-column>

      <a-table-column title="Merit" width="150">
        <template #default="{ record }">
          <div>Position: <strong>{{ record.merit_position || '-' }}</strong></div>
          <div>Score: <strong>{{ record.final_merit_score || '-' }}</strong></div>
          <small>Preference: {{ record.preference_order || '-' }}</small>
        </template>
      </a-table-column>

      <a-table-column title="Status" width="180">
        <template #default="{ record }">
          <div class="mb-1">
            <a-tag :color="selectionColor(record.selection_status_code)">
              {{ record.selection_status_code }}
            </a-tag>
          </div>

          <a-tag :color="offerColor(record.offer_status_code)">
            {{ record.offer_status_code }}
          </a-tag>

          <div v-if="record.offer_expiry_at" class="small-muted">
            Expiry: {{ formatDate(record.offer_expiry_at) }}
          </div>
        </template>
      </a-table-column>
        <a-table-column title="Status" width="180">
            <template #default="{ record }">
                <div v-if="record.voucher_id" style="margin-top: 6px;">
                <a-tag color="blue">
                    Voucher: {{ record.voucher_no }}
                </a-tag>

                <a-tag>
                    Amount: {{ record.voucher_amount }}
                </a-tag>

                <a-tag>
                    Voucher Status: {{ record.voucher_status_code }}
                </a-tag>
                </div>
            </template>
        </a-table-column>
      <a-table-column title="Decision" width="180">
        <template #default="{ record }">
          <div v-if="record.accepted_at">
            Accepted at:<br />
            <strong>{{ formatDate(record.accepted_at) }}</strong>
          </div>

          <div v-else-if="record.rejected_at">
            Rejected at:<br />
            <strong>{{ formatDate(record.rejected_at) }}</strong>
          </div>

          <div v-else>
            -
          </div>
        </template>
      </a-table-column>

      <a-table-column title="Action" width="220">
        <template #default="{ record }">
          <a-space v-if="canRespond(record)">
            <a-popconfirm
              title="Are you sure you want to accept this admission offer?"
              @confirm="acceptOffer(record)"
            >
              <a-button type="primary" size="small">
                Accept
              </a-button>
            </a-popconfirm>

            <a-popconfirm
              title="Rejecting this offer may move your seat to the next waiting applicant. Continue?"
              @confirm="rejectOffer(record)"
            >
              <a-button danger size="small">
                Reject
              </a-button>
            </a-popconfirm>
          </a-space>
<a-button
  v-if="record.offer_status_code === 'accepted'
    && record.voucher_id
    && ['unpaid', 'rejected'].includes(record.voucher_status_code)"
  type="primary"
  size="small"
  @click="openPaymentModal(record)"
>
  Submit Payment
</a-button>

<a-tag
  v-else-if="record.voucher_status_code === 'payment_submitted'"
  color="orange"
>
  Payment Submitted
</a-tag>

<a-tag
  v-else-if="record.voucher_status_code === 'paid'"
  color="green"
>
  Payment Verified
</a-tag>

<a-tag
  v-if="record.confirmation_status_code === 'confirmed'"
  color="green"
>
  Admission Confirmed
</a-tag>
          <span v-else class="small-muted">
            No action available
          </span>
        </template>
      </a-table-column>
    </a-table>
<a-modal
  v-model:open="paymentModalOpen"
  title="Submit Admission Fee Payment"
  @ok="submitPayment"
>
  <a-form layout="vertical">
    <a-form-item label="Voucher No">
      <a-input :value="selectedOffer?.voucher_no" disabled />
    </a-form-item>

    <a-form-item label="Paid Amount" required>
      <a-input-number
        v-model:value="paymentForm.paid_amount"
        style="width: 100%"
      />
    </a-form-item>

    <a-form-item label="Payment Reference" required>
      <a-input v-model:value="paymentForm.payment_reference" />
    </a-form-item>

    <a-form-item label="Payment Date">
      <a-date-picker
        v-model:value="paymentForm.paid_at"
        style="width: 100%"
        value-format="YYYY-MM-DD"
      />
    </a-form-item>

    <a-form-item label="Payment Method">
      <a-select v-model:value="paymentForm.payment_method_code">
        <a-select-option value="bank_transfer">Bank Transfer</a-select-option>
        <a-select-option value="cash_deposit">Cash Deposit</a-select-option>
        <a-select-option value="online_transfer">Online Transfer</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item label="Remarks">
      <a-textarea v-model:value="paymentForm.remarks" />
    </a-form-item>
  </a-form>
</a-modal>    
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const api = useApplicantPortalApi()

const loading = ref(false)
const offers = ref<any[]>([])
const summary = reactive<any>({
  total: 0,
  offered: 0,
  accepted: 0,
  rejected: 0,
  waiting: 0,
})
const paymentModalOpen = ref(false)
const selectedOffer = ref<any>(null)

const paymentForm = reactive<any>({
  payment_reference: '',
  paid_amount: null,
  paid_at: '',
  payment_method_code: 'bank_transfer',
  remarks: '',
})
const openPaymentModal = (record: any) => {
  selectedOffer.value = record
  paymentForm.payment_reference = ''
  paymentForm.paid_amount = record.voucher_amount || null
  paymentForm.paid_at = ''
  paymentForm.payment_method_code = 'bank_transfer'
  paymentForm.remarks = ''
  paymentModalOpen.value = true
}

const submitPayment = async () => {
  if (!selectedOffer.value) return

  await api.submitAdmissionOfferPayment(selectedOffer.value.id, paymentForm)

  message.success('Payment submitted. Please wait for verification.')

  paymentModalOpen.value = false
  await loadOffers()
}
const loadOffers = async () => {
  loading.value = true

  try {
    const response: any = await api.applicantAdmissionOffers()
    const payload = response?.data || {}

    offers.value = payload.offers || []

    Object.assign(summary, {
      total: payload.summary?.total || 0,
      offered: payload.summary?.offered || 0,
      accepted: payload.summary?.accepted || 0,
      rejected: payload.summary?.rejected || 0,
      waiting: payload.summary?.waiting || 0,
    })
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load admission offers.')
  } finally {
    loading.value = false
  }
}

const canRespond = (record: any) => {
  if (record.selection_status_code !== 'selected') return false
  if (record.offer_status_code !== 'offered') return false

  if (record.offer_expiry_at) {
    const expiry = new Date(record.offer_expiry_at).getTime()
    if (!Number.isNaN(expiry) && Date.now() > expiry) {
      return false
    }
  }

  return true
}

const acceptOffer = async (record: any) => {
  try {
    await api.applicantAcceptAdmissionOffer(record.id, {
      remarks: 'Accepted by applicant from portal.',
    })

    message.success('Admission offer accepted.')
    await loadOffers()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to accept admission offer.')
  }
}

const rejectOffer = async (record: any) => {
  try {
    await api.applicantRejectAdmissionOffer(record.id, {
      remarks: 'Rejected by applicant from portal.',
    })

    message.success('Admission offer rejected.')
    await loadOffers()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to reject admission offer.')
  }
}

const selectionColor = (status: string) => {
  if (status === 'selected') return 'green'
  if (status === 'waiting') return 'orange'
  if (status === 'not_selected') return 'red'
  return 'default'
}

const offerColor = (status: string) => {
  if (status === 'offered') return 'blue'
  if (status === 'accepted') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'expired') return 'orange'
  return 'default'
}

const formatDate = (value: any) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').replace('.000000Z', '')
}

onMounted(async () => {
  await loadOffers()
})
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin-bottom: 4px;
}

.panel-header p {
  color: #888;
  margin-bottom: 0;
}

.mb-3 {
  margin-bottom: 16px;
}

.mb-1 {
  margin-bottom: 6px;
}

.small-muted {
  font-size: 12px;
  color: #888;
}
</style>