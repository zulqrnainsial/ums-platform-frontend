<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Merit Lists</h2>
          <p>Generate, view, publish, and manage admission merit lists.</p>
        </div>

        <a-space>
          <a-button @click="loadLists">
            Refresh
          </a-button>

          <a-button type="primary" @click="openGenerate">
            Generate Merit List
          </a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search list no/title"
              allow-clear
              @search="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.admission_session_id"
              :options="lookups.admissionSessions"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Admission Session"
              @change="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.offered_program_id"
              :options="lookups.offeredPrograms"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Offered Program"
              @change="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.status_code"
              :options="statusOptions"
              allow-clear
              placeholder="Status"
              @change="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="3">
            <a-button block @click="resetFilters">
              Reset
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card>
        <a-table
          :data-source="rows"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          @change="handleTableChanged"
        >
          <a-table-column title="List">
            <template #default="{ record }">
              <strong>{{ record.list_no }}</strong>
              <div>{{ record.title || '-' }}</div>
              <small>{{ record.list_type_code }}</small>
            </template>
          </a-table-column>

          <a-table-column title="Context">
            <template #default="{ record }">
              <div>{{ record.admission_session_label || '-' }}</div>
              <small>{{ record.preference_group_label || '-' }}</small>
              <div>{{ record.offered_program_label || '-' }}</div>
              <small>{{ record.quota_label || '-' }}</small>
            </template>
          </a-table-column>

          <a-table-column title="Candidates" width="170">
            <template #default="{ record }">
              <div>Total: {{ record.total_candidates }}</div>
              <div>Selected: {{ record.selected_candidates }}</div>
              <div>Waiting: {{ record.waiting_candidates }}</div>
            </template>
          </a-table-column>

          <a-table-column title="Seats" width="90">
            <template #default="{ record }">
              {{ record.available_seats }}
            </template>
          </a-table-column>

          <a-table-column title="Merit Range" width="150">
            <template #default="{ record }">
              <div>High: {{ record.highest_merit_score || '-' }}</div>
              <div>Low: {{ record.lowest_merit_score || '-' }}</div>
            </template>
          </a-table-column>

          <a-table-column title="Status" width="120">
            <template #default="{ record }">
              <a-tag>{{ record.status_code }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column title="Action" width="230">
            <template #default="{ record }">
              <a-space>
                <a-button size="small" type="primary" @click="openDetail(record)">
                  View
                </a-button>

                <a-popconfirm
                  v-if="record.status_code === 'generated'"
                  title="Publish this merit list?"
                  @confirm="publishList(record)"
                >
                  <a-button size="small">
                    Publish
                  </a-button>
                </a-popconfirm>

                <a-popconfirm
                  v-if="record.status_code !== 'cancelled'"
                  title="Cancel this merit list?"
                  @confirm="cancelList(record)"
                >
                  <a-button size="small" danger>
                    Cancel
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="generateOpen"
        title="Generate Merit List"
        width="900px"
        :confirm-loading="generating"
        @ok="generateList"
      >
        <a-alert
          type="info"
          show-icon
          class="mb-3"
          message="Generate list only after merit scores have been calculated for the same session/program/quota context."
        />

        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="8">
              <a-form-item label="List No">
                <a-input v-model:value="generateForm.list_no" placeholder="Auto if empty" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="16">
              <a-form-item label="Title">
                <a-input v-model:value="generateForm.title" placeholder="Auto if empty" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Merit Formula">
                <a-select
                  v-model:value="generateForm.admission_merit_formula_id"
                  :options="lookups.formulas"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Admission Session">
                <a-select
                  v-model:value="generateForm.admission_session_id"
                  :options="lookups.admissionSessions"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Preference Group">
                <a-select
                  v-model:value="generateForm.admission_preference_group_id"
                  :options="lookups.preferenceGroups"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Offered Program">
                <a-select
                  v-model:value="generateForm.offered_program_id"
                  :options="lookups.offeredPrograms"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Quota / Seat Category">
                <a-select
                  v-model:value="generateForm.program_quota_seat_id"
                  :options="lookups.programQuotaSeats"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Available Seats">
                <a-input-number
                  v-model:value="generateForm.available_seats"
                  class="w-100"
                  :min="0"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="List Type">
                <a-select
                  v-model:value="generateForm.list_type_code"
                  :options="listTypeOptions"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="detailOpen"
        title="Merit List Detail"
        width="1200px"
        :footer="null"
      >
        <a-spin :spinning="detailLoading">
          <template v-if="detail">
            <a-descriptions bordered size="small" :column="4" class="mb-3">
              <a-descriptions-item label="List No">
                {{ detail.list?.list_no }}
              </a-descriptions-item>
              <a-descriptions-item label="Status">
                {{ detail.list?.status_code }}
              </a-descriptions-item>
              <a-descriptions-item label="Total">
                {{ detail.list?.total_candidates }}
              </a-descriptions-item>
              <a-descriptions-item label="Selected">
                {{ detail.list?.selected_candidates }}
              </a-descriptions-item>
              <a-descriptions-item label="Waiting">
                {{ detail.list?.waiting_candidates }}
              </a-descriptions-item>
              <a-descriptions-item label="Seats">
                {{ detail.list?.available_seats }}
              </a-descriptions-item>
              <a-descriptions-item label="Highest">
                {{ detail.list?.highest_merit_score || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Lowest">
                {{ detail.list?.lowest_merit_score || '-' }}
              </a-descriptions-item>
            </a-descriptions>
<a-space class="mb-3">
  <a-popconfirm
    title="Generate offers for selected applicants?"
    @confirm="generateOffersForList"
  >
    <a-button type="primary">
      Generate Offers
    </a-button>
  </a-popconfirm>

  <a-button @click="loadMovements">
    View Movements
  </a-button>
    <a-button
    size="small"
    @click="generateWaitingForActiveList"
    >
    Generate Waiting List
    </a-button>

    <a-button
  v-if="Number(detail?.list?.waiting_candidates || detail?.list?.waiting || 0) > 0"
  @click="promoteNextWaitingForActiveList"
>
  Move Next Waiting to Offered
</a-button> 
</a-space>
            <a-table
              :data-source="detail.applicants?.data || []"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <a-table-column title="Position" data-index="merit_position" width="90" />

              <a-table-column title="Applicant">
                <template #default="{ record }">
                  <strong>{{ record.applicant_no || '-' }}</strong>
                  <div>{{ record.applicant_label || '-' }}</div>
                  <small>{{ record.cnic_bform || '-' }}</small>
                </template>
              </a-table-column>

              <a-table-column title="Preference" data-index="preference_order" width="110" />
              <a-table-column title="Score" data-index="final_merit_score" width="120" />

              <a-table-column title="Selection" width="130">
                <template #default="{ record }">
                  <a-tag :color="record.selection_status_code === 'selected' ? 'green' : 'orange'">
                    {{ record.selection_status_code }}
                  </a-tag>
                </template>
              </a-table-column>

              <a-table-column title="Offer" width="260">
  <template #default="{ record }">
    <div class="mb-1">
      <a-tag>{{ record.offer_status_code }}</a-tag>
    </div>

    <a-space>
      <a-popconfirm
        v-if="['pending', 'offered'].includes(record.offer_status_code) && record.selection_status_code === 'selected'"
        title="Accept this offer?"
        @confirm="acceptOffer(record)"
      >
        <a-button size="small" type="primary">
          Accept
        </a-button>
      </a-popconfirm>

      <a-popconfirm
        v-if="['pending', 'offered'].includes(record.offer_status_code) && record.selection_status_code === 'selected'"
        title="Reject this offer and promote next waiting applicant?"
        @confirm="rejectOffer(record)"
      >
        <a-button size="small" danger>
          Reject
        </a-button>
      </a-popconfirm>

      <a-popconfirm
        v-if="['pending', 'offered'].includes(record.offer_status_code) && record.selection_status_code === 'selected'"
        title="Expire this offer and promote next waiting applicant?"
        @confirm="expireOffer(record)"
      >
        <a-button size="small">
          Expire
        </a-button>
      </a-popconfirm>
      <a-button
  v-if="record.selection_status_code === 'selected'
    && record.offer_status_code === 'accepted'
    && !record.voucher_id"
  type="primary"
  size="small"
  @click="generateVoucher(record)"
>
  Generate Voucher 
</a-button>

<a-tag
  v-if="record.voucher_status_code === 'unpaid'"
  color="orange"
>
  Awaiting Applicant Payment
</a-tag>

<a-button
  v-if="record.voucher_id
    && record.voucher_status_code === 'payment_submitted'"
  type="primary"
  size="small"
  @click="verifyVoucherPayment(record)"
>
  Verify Payment
</a-button>

<a-button
  v-if="record.voucher_status_code === 'paid'
    && record.admission_confirmation_status_code !== 'confirmed'"
  type="primary"
  size="small"
  @click="confirmApplicantAdmission(record)"
>
  Confirm Admission
</a-button>

<a-tag
  v-if="record.admission_confirmation_status_code === 'confirmed'"
  color="green"
>
  Confirmed
</a-tag>
    </a-space>
  </template>
</a-table-column>
            </a-table>
          </template>
        </a-spin>
      </a-modal>
      <a-modal
  v-model:open="movementsOpen"
  title="Offer / Waiting List Movements"
  width="1000px"
  :footer="null"
>
  <a-table
    :data-source="movements"
    :loading="movementsLoading"
    :pagination="{ pageSize: 10 }"
    row-key="id"
    size="small"
  >
    <a-table-column title="Type" data-index="movement_type_code" width="160" />
    <a-table-column title="From Applicant" data-index="from_applicant_id" width="140" />
    <a-table-column title="To Applicant" data-index="to_applicant_id" width="140" />

    <a-table-column title="Selection">
      <template #default="{ record }">
        {{ record.from_selection_status_code || '-' }}
        →
        {{ record.to_selection_status_code || '-' }}
      </template>
    </a-table-column>

    <a-table-column title="Offer">
      <template #default="{ record }">
        {{ record.from_offer_status_code || '-' }}
        →
        {{ record.to_offer_status_code || '-' }}
      </template>
    </a-table-column>

    <a-table-column title="Remarks" data-index="remarks" />
  </a-table>
</a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()
const genApi = useApi()

const loading = ref(false)
const generating = ref(false)
const detailLoading = ref(false)

const generateOpen = ref(false)
const detailOpen = ref(false)

const rows = ref<any[]>([])
const detail = ref<any>(null)
const movementsOpen = ref(false)
const movementsLoading = ref(false)
const movements = ref<any[]>([])
const filters = reactive<any>({
  search: '',
  admission_session_id: null,
  offered_program_id: null,
  status_code: null,
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
})

const lookups = reactive<any>({
  formulas: [],
  admissionSessions: [],
  preferenceGroups: [],
  offeredPrograms: [],
  programQuotaSeats: [],
})

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Generated', value: 'generated' },
  { label: 'Published', value: 'published' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Locked', value: 'locked' },
]

const listTypeOptions = [
  { label: 'Merit', value: 'merit' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Quota', value: 'quota' },
  { label: 'Self Finance', value: 'self_finance' },
  { label: 'Reserved', value: 'reserved' },
]

const emptyGenerateForm = () => ({
  list_no: '',
  title: '',
  list_type_code: 'merit',
  admission_merit_formula_id: null,
  admission_session_id: null,
  admission_preference_group_id: null,
  offered_program_id: null,
  program_quota_seat_id: null,
  available_seats: null,
})

const generateForm = reactive<any>(emptyGenerateForm())
const normalizeIdOptions = (items: any[] = []) => {
  const toId = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null

    const numeric = Number(value)

    return Number.isFinite(numeric) && numeric > 0 ? numeric : null
  }

  return (items || [])
    .map((item: any) => {
      const id = toId(item.id ?? item.value)

      const label =
        item.label ||
        item.name ||
        item.title ||
        item.description ||
        item.code ||
        (id ? String(id) : '')

      return {
        label: String(label),
        value: id,
        id,
        code: item.code ?? null,
      }
    })
    .filter((item: any) => item.id !== null)
}
const loadLookups = async () => {
  const [
    formulas,
    admissionSessions,
    preferenceGroups,
    offeredPrograms,
    programQuotaSeats,
  ] = await Promise.all([
    api.getOptions('/dynamic-options/admission-merit-formulas'),
    api.getOptions('/dynamic-options/admission-sessions'),
    api.getOptions('/dynamic-options/admission-preference-groups'),
    api.getOptions('/dynamic-options/offered-programs'),
    api.getOptions('/dynamic-options/program-quota-seats'),
  ])

    lookups.formulas = normalizeIdOptions(formulas?.data || [])
    lookups.admissionSessions = normalizeIdOptions(admissionSessions?.data || [])
    lookups.preferenceGroups = normalizeIdOptions(preferenceGroups?.data || [])
    lookups.offeredPrograms = normalizeIdOptions(offeredPrograms?.data || [])
    lookups.programQuotaSeats = normalizeIdOptions(programQuotaSeats?.data || [])
}
const generateVoucher = async (record: any) => {
  await genApi.generateAdmissionOfferVoucher({
    admission_merit_list_applicant_id: record.id,
  })

  message.success('Voucher generated.')
  await openDetail(detail.value.list)
}

const generateWaitingForActiveList = async () => {
  const meritListId = resolveMeritListId(detail.value?.list)

  if (!meritListId) {
    message.error('Merit list id not found.')
    return
  }

  const response: any = await api.generateWaitingList(meritListId)

  const data = response?.data || response

  if (Number(data?.waiting_count || 0) === 0) {
    message.info('No waiting candidates found because candidates are within available seats.')
  } else {
    message.success(`Waiting list generated. Waiting candidates: ${data.waiting_count}`)
  }

  await openDetail({ id: meritListId })
}
const promoteNextWaitingForActiveList = async () => {
  const meritListId = resolveMeritListId(detail.value?.list)

  if (!meritListId) {
    message.error('Merit list id not found.')
    return
  }

  await api.promoteNextWaitingCandidate(meritListId, {
    remarks: 'Promoted manually from merit list detail screen.',
  })

  message.success('Next waiting candidate promoted successfully.')
  await openDetail({ id: meritListId })
}
const resolveMeritListId = (value: any) => {
  if (!value) return null

  if (typeof value === 'number' || typeof value === 'string') {
    return Number(value)
  }

  return Number(value.id || value.admission_merit_list_id || value.merit_list_id)
}

const markVoucherPaid = async (record: any) => {
  await genApi.markAdmissionOfferVoucherPaid(record.voucher_id, {
    paid_amount: record.voucher_amount,
  })

  message.success('Voucher marked paid.')
  await openDetail(detail.value.list)
}

const confirmApplicantAdmission = async (record: any) => {
  await genApi.confirmAdmission({
    admission_merit_list_applicant_id: record.id,
  })

  message.success('Admission confirmed.')
  await openDetail(detail.value.list)
}
const loadLists = async () => {
  loading.value = true

  try {
    const response: any = await api.getMeritLists({
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    })

    const payload = response?.data || {}

    rows.value = payload.data || []
    pagination.total = payload.total || 0
    pagination.current = payload.current_page || pagination.current
    pagination.pageSize = payload.per_page || pagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load merit lists.')
  } finally {
    loading.value = false
  }
}
const generateOffersForList = async () => {
  if (!detail.value?.list?.id) {
    message.error('Merit list is not loaded.')
    return
  }

  try {
    await api.generateMeritOffers(detail.value.list.id, {
      remarks: 'Generated from merit list detail screen.',
    })

    message.success('Offers generated.')
    await openDetail(detail.value.list)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to generate offers.')
  }
}
const verifyVoucherPayment = async (record: any) => {
  await genApi.verifyAdmissionOfferVoucherPayment(record.voucher_id)

  message.success('Payment verified.')

  
    await openDetail(detail.value.list)
}
const acceptOffer = async (record: any) => {
  try {
    await api.acceptMeritOffer(record.id, {
      remarks: 'Accepted by admin.',
    })

    message.success('Offer accepted.')
    await openDetail(detail.value.list)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to accept offer.')
  }
}

const rejectOffer = async (record: any) => {
  try {
    await api.rejectMeritOffer(record.id, {
      remarks: 'Rejected by admin.',
      promote_waiting: true,
    })

    message.success('Offer rejected and waiting list moved if available.')
    await openDetail(detail.value.list)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to reject offer.')
  }
}

const expireOffer = async (record: any) => {
  try {
    await api.expireMeritOffer(record.id, {
      remarks: 'Expired by admin.',
      promote_waiting: true,
    })

    message.success('Offer expired and waiting list moved if available.')
    await openDetail(detail.value.list)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to expire offer.')
  }
}

const loadMovements = async () => {
  if (!detail.value?.list?.id) {
    message.error('Merit list is not loaded.')
    return
  }

  movementsOpen.value = true
  movementsLoading.value = true

  try {
    const response: any = await api.getMeritOfferMovements(detail.value.list.id)
    movements.value = response?.data?.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load movements.')
  } finally {
    movementsLoading.value = false
  }
}
const handleSearch = async () => {
  pagination.current = 1
  await loadLists()
}

const resetFilters = async () => {
  filters.search = ''
  filters.admission_session_id = null
  filters.offered_program_id = null
  filters.status_code = null
  pagination.current = 1
  await loadLists()
}

const handleTableChanged = async (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  await loadLists()
}

const openGenerate = () => {
  Object.assign(generateForm, emptyGenerateForm())
  generateOpen.value = true
}

const generateList = async () => {
  generating.value = true

  try {
    const payload = { ...generateForm }

    await api.generateMeritList(payload)

    message.success('Merit list generated.')
    generateOpen.value = false
    await loadLists()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to generate merit list.')
  } finally {
    generating.value = false
  }
}

const openDetail = async (record: any) => {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const response: any = await api.getMeritListDetail(record.id)
    detail.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load merit list detail.')
  } finally {
    detailLoading.value = false
  }
}

const publishList = async (record: any) => {
  try {
    await api.publishMeritList(record.id)
    message.success('Merit list published.')
    await loadLists()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to publish merit list.')
  }
}

const cancelList = async (record: any) => {
  try {
    await api.cancelMeritList(record.id)
    message.success('Merit list cancelled.')
    await loadLists()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to cancel merit list.')
  }
}

onMounted(async () => {
  await loadLookups()
  await loadLists()
})
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

.page-header h2 {
  margin-bottom: 4px;
}

.page-header p {
  color: #888;
  margin-bottom: 0;
}

.mb-3 {
  margin-bottom: 16px;
}

.w-100 {
  width: 100%;
}
.mb-1 {
  margin-bottom: 6px;
}
</style>