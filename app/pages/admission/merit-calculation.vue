<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Merit Calculation</h2>
          <p>Calculate applicant merit scores and view component-wise calculation details.</p>
        </div>

        <a-space>
          <a-button @click="loadScores">
            Refresh
          </a-button>

          <a-button type="primary" @click="openBulkCalculate">
            Bulk Calculate
          </a-button>

          <a-button @click="openSingleCalculate">
            Calculate Single Applicant
          </a-button>
        </a-space>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search applicant/formula"
              allow-clear
              @search="handleSearch"
            />
          </a-col>

          <a-col :xs="24" :md="5">
            <a-select
              v-model:value="filters.admission_merit_formula_id"
              :options="lookups.formulas"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="Formula"
              @change="handleSearch"
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

          <a-col :xs="24" :md="3">
            <a-button block @click="resetFilters">
              Reset
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-card>
        <a-table
          :columns="columns"
          :data-source="rows"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          @change="handleTableChanged"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'applicant'">
              <strong>{{ record.applicant_no || '-' }}</strong>
              <div>{{ record.applicant_name || '-' }}</div>
              <small>{{ record.cnic_bform || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'formula'">
              <strong>{{ record.formula_code || '-' }}</strong>
              <div>{{ record.formula_title || '-' }}</div>
              <small>{{ record.admission_session_title || record.admission_session_name || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'context'">
              <div>{{ record.offered_program_title || record.offered_program_name || '-' }}</div>
              <small>Quota ID: {{ record.program_quota_seat_id || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'score'">
              <strong>{{ record.final_merit_score }}</strong>
              <div>Weighted: {{ record.total_weighted_score }}</div>
              <small>Weight: {{ record.total_component_weight }}</small>
            </template>

            <template v-else-if="column.key === 'eligible'">
              <a-tag :color="record.is_eligible_for_merit ? 'green' : 'red'">
                {{ record.is_eligible_for_merit ? 'Eligible' : 'Not Eligible' }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag>{{ record.status_code }}</a-tag>
              <div>
                <small>{{ formatDate(record.calculated_at) }}</small>
              </div>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-button size="small" type="primary" @click="openDetail(record)">
                View Detail
              </a-button>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="singleOpen"
        title="Calculate Single Applicant Merit"
        width="850px"
        @ok="runSingleCalculate"
        :confirm-loading="calculating"
      >
        <a-alert
          type="info"
          show-icon
          class="mb-3"
          message="Select one applicant and one merit formula. Context fields are optional but recommended for program-specific merit."
        />

        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Applicant" required>
                <a-select
                  v-model:value="calculationForm.applicant_id"
                  :options="lookups.applicants"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Select applicant"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Merit Formula" required>
                <a-select
                  v-model:value="calculationForm.admission_merit_formula_id"
                  :options="lookups.formulas"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Select formula"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Admission Session">
                <a-select
                  v-model:value="calculationForm.admission_session_id"
                  :options="lookups.admissionSessions"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Offered Program">
                <a-select
                  v-model:value="calculationForm.offered_program_id"
                  :options="lookups.offeredPrograms"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Preference Group">
                <a-select
                  v-model:value="calculationForm.admission_preference_group_id"
                  :options="lookups.preferenceGroups"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Quota / Seat Category">
                <a-select
                  v-model:value="calculationForm.program_quota_seat_id"
                  :options="lookups.programQuotaSeats"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="bulkOpen"
        title="Bulk Calculate Merit"
        width="850px"
        @ok="runBulkCalculate"
        :confirm-loading="calculating"
      >
        <a-alert
          type="warning"
          show-icon
          class="mb-3"
          message="Bulk calculation will calculate merit for all matching applicants. Use carefully after formula and test results are finalized."
        />

        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Merit Formula" required>
                <a-select
                  v-model:value="bulkForm.admission_merit_formula_id"
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
                  v-model:value="bulkForm.admission_session_id"
                  :options="lookups.admissionSessions"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Offered Program">
                <a-select
                  v-model:value="bulkForm.offered_program_id"
                  :options="lookups.offeredPrograms"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Preference Group">
                <a-select
                  v-model:value="bulkForm.admission_preference_group_id"
                  :options="lookups.preferenceGroups"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Quota / Seat Category">
                <a-select
                  v-model:value="bulkForm.program_quota_seat_id"
                  :options="lookups.programQuotaSeats"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Applicant Status">
                <a-select
                  v-model:value="bulkForm.applicant_status_code"
                  :options="[
                    { label: 'Active', value: 'active' },
                    { label: 'Submitted', value: 'submitted' },
                    { label: 'Eligible', value: 'eligible' }
                  ]"
                  allow-clear
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>

        <a-alert
          v-if="bulkResult"
          type="success"
          show-icon
          class="mt-3"
          :message="`Calculated: ${bulkResult.calculated || 0}, Failed: ${bulkResult.failed || 0}`"
        />

        <a-table
          v-if="bulkResult?.errors?.length"
          :data-source="bulkResult.errors"
          :pagination="{ pageSize: 5 }"
          size="small"
          row-key="applicant_id"
          class="mt-3"
        >
          <a-table-column title="Applicant ID" data-index="applicant_id" width="130" />
          <a-table-column title="Error" data-index="message" />
        </a-table>
      </a-modal>

      <a-modal
        v-model:open="detailOpen"
        title="Applicant Merit Score Detail"
        width="1150px"
        :footer="null"
      >
        <a-spin :spinning="detailLoading">
          <template v-if="detail">
            <a-descriptions bordered size="small" :column="3" class="mb-3">
              <a-descriptions-item label="Applicant">
                {{ detail.applicant?.applicant_no }} - {{ detail.applicant?.full_name }}
              </a-descriptions-item>
              <a-descriptions-item label="Formula">
                {{ detail.formula?.code }} - {{ detail.formula?.title }}
              </a-descriptions-item>
              <a-descriptions-item label="Status">
                {{ detail.score?.status_code }}
              </a-descriptions-item>

              <a-descriptions-item label="Final Merit Score">
                <strong>{{ detail.score?.final_merit_score }}</strong>
              </a-descriptions-item>
              <a-descriptions-item label="Weighted Score">
                {{ detail.score?.total_weighted_score }}
              </a-descriptions-item>
              <a-descriptions-item label="Eligible">
                <a-tag :color="detail.score?.is_eligible_for_merit ? 'green' : 'red'">
                  {{ detail.score?.is_eligible_for_merit ? 'Yes' : 'No' }}
                </a-tag>
              </a-descriptions-item>

              <a-descriptions-item label="Bonus">
                {{ detail.score?.bonus_score }}
              </a-descriptions-item>
              <a-descriptions-item label="Deduction">
                {{ detail.score?.deduction_score }}
              </a-descriptions-item>
              <a-descriptions-item label="Calculated At">
                {{ formatDate(detail.score?.calculated_at) }}
              </a-descriptions-item>
            </a-descriptions>

            <a-alert
              v-if="detail.score?.failed_required_components_json?.length"
              type="error"
              show-icon
              class="mb-3"
              message="Some required merit components failed or were missing."
            />

            <a-table
              :data-source="detail.components || []"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <a-table-column title="Component">
                <template #default="{ record }">
                  <strong>{{ record.component_code }}</strong>
                  <div>{{ record.component_title }}</div>
                  <small>{{ record.component_type_code }} | {{ record.source_type_code }}</small>
                </template>
              </a-table-column>

              <a-table-column title="Source" width="150">
                <template #default="{ record }">
                  {{ record.source_key || '-' }}
                </template>
              </a-table-column>

              <a-table-column title="Raw" width="160">
                <template #default="{ record }">
                  <div>Obtained: {{ record.raw_obtained_marks ?? '-' }}</div>
                  <div>Total: {{ record.raw_total_marks ?? '-' }}</div>
                  <small>{{ record.raw_percentage ?? 0 }}%</small>
                </template>
              </a-table-column>

              <a-table-column title="Normalized" data-index="normalized_score" width="120" />
              <a-table-column title="Weight" data-index="component_weight" width="100" />
              <a-table-column title="Weighted Score" data-index="weighted_score" width="130" />

              <a-table-column title="Passed" width="110">
                <template #default="{ record }">
                  <a-tag :color="record.is_component_passed ? 'green' : 'red'">
                    {{ record.is_component_passed ? 'Yes' : 'No' }}
                  </a-tag>
                </template>
              </a-table-column>

              <a-table-column title="Included" width="110">
                <template #default="{ record }">
                  <a-tag :color="record.include_in_total ? 'blue' : 'default'">
                    {{ record.include_in_total ? 'Yes' : 'No' }}
                  </a-tag>
                </template>
              </a-table-column>
            </a-table>
          </template>
        </a-spin>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()

const loading = ref(false)
const calculating = ref(false)
const detailLoading = ref(false)

const singleOpen = ref(false)
const bulkOpen = ref(false)
const detailOpen = ref(false)

const rows = ref<any[]>([])
const detail = ref<any>(null)
const bulkResult = ref<any>(null)

const filters = reactive<any>({
  search: '',
  admission_merit_formula_id: null,
  admission_session_id: null,
  offered_program_id: null,
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
})

const lookups = reactive<any>({
  applicants: [],
  formulas: [],
  admissionSessions: [],
  offeredPrograms: [],
  preferenceGroups: [],
  programQuotaSeats: [],
})

const emptyCalculationForm = () => ({
  applicant_id: null,
  admission_merit_formula_id: null,
  admission_session_id: null,
  offered_program_id: null,
  admission_preference_group_id: null,
  program_quota_seat_id: null,
})

const emptyBulkForm = () => ({
  admission_merit_formula_id: null,
  admission_session_id: null,
  offered_program_id: null,
  admission_preference_group_id: null,
  program_quota_seat_id: null,
  applicant_status_code: null,
})

const calculationForm = reactive<any>(emptyCalculationForm())
const bulkForm = reactive<any>(emptyBulkForm())

const columns = [
  { title: 'Applicant', key: 'applicant' },
  { title: 'Formula', key: 'formula' },
  { title: 'Context', key: 'context' },
  { title: 'Score', key: 'score', width: 150 },
  { title: 'Eligible', key: 'eligible', width: 120 },
  { title: 'Status', key: 'status', width: 150 },
  { title: 'Action', key: 'action', width: 130 },
]

const loadLookups = async () => {
  const [
    applicants,
    formulas,
    admissionSessions,
    offeredPrograms,
    preferenceGroups,
    programQuotaSeats,
  ] = await Promise.all([
    api.getOptions('/dynamic-options/applicants'),
    api.getOptions('/dynamic-options/admission-merit-formulas'),
    api.getOptions('/dynamic-options/admission-sessions'),
    api.getOptions('/dynamic-options/offered-programs'),
    api.getOptions('/dynamic-options/admission-preference-groups'),
    api.getOptions('/dynamic-options/program-quota-seats'),
  ])

  const optionData = (response: any) => {
    if (Array.isArray(response)) return response
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data?.data)) return response.data.data
    return []
    }

    lookups.applicants = optionData(applicants)
    lookups.formulas = optionData(formulas)
    lookups.admissionSessions = optionData(admissionSessions)
    lookups.offeredPrograms = optionData(offeredPrograms)
    lookups.preferenceGroups = optionData(preferenceGroups)
    lookups.programQuotaSeats = optionData(programQuotaSeats)
}

const loadScores = async () => {
  loading.value = true

  try {
    const response: any = await api.getApplicantMeritScores({
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
    message.error(error?.data?.message || 'Unable to load merit scores.')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  pagination.current = 1
  await loadScores()
}

const resetFilters = async () => {
  filters.search = ''
  filters.admission_merit_formula_id = null
  filters.admission_session_id = null
  filters.offered_program_id = null
  pagination.current = 1
  await loadScores()
}

const handleTableChanged = async (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  await loadScores()
}

const openSingleCalculate = () => {
  Object.assign(calculationForm, emptyCalculationForm())
  singleOpen.value = true
}

const openBulkCalculate = () => {
  Object.assign(bulkForm, emptyBulkForm())
  bulkResult.value = null
  bulkOpen.value = true
}

const runSingleCalculate = async () => {
  if (!calculationForm.applicant_id) {
    message.error('Applicant is required.')
    return
  }

  if (!calculationForm.admission_merit_formula_id) {
    message.error('Merit formula is required.')
    return
  }

  calculating.value = true

  try {
    await api.calculateApplicantMeritScore({ ...calculationForm })

    message.success('Applicant merit calculated.')
    singleOpen.value = false
    await loadScores()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to calculate applicant merit.')
  } finally {
    calculating.value = false
  }
}

const runBulkCalculate = async () => {
  if (!bulkForm.admission_merit_formula_id) {
    message.error('Merit formula is required.')
    return
  }

  calculating.value = true

  try {
    const response: any = await api.bulkCalculateApplicantMeritScores({ ...bulkForm })

    bulkResult.value = response?.data || null

    message.success('Bulk merit calculation completed.')
    await loadScores()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to bulk calculate merit.')
  } finally {
    calculating.value = false
  }
}

const openDetail = async (record: any) => {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const response: any = await api.getApplicantMeritScoreDetail(record.id)
    detail.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load merit score detail.')
  } finally {
    detailLoading.value = false
  }
}

const formatDate = (value: any) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').replace('.000000Z', '')
}

onMounted(async () => {
  await loadLookups()
  await loadScores()
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

.mt-3 {
  margin-top: 16px;
}
</style>