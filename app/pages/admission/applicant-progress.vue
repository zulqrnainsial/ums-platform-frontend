<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Applicant Progress</h2>
          <p>Monitor applicant profile, documents, preferences, applications and payment progress.</p>
        </div>

        <a-button type="primary" @click="loadRows">
          Refresh
        </a-button>
      </div>

      <a-card class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="10">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search applicant no, name, CNIC, phone, email"
              allow-clear
              @search="loadRows"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <a-select
              v-model:value="filters.status"
              placeholder="Applicant Status"
              allow-clear
              style="width: 100%"
              @change="loadRows"
            >
              <a-select-option value="active">Active</a-select-option>
              <a-select-option value="inactive">Inactive</a-select-option>
              <a-select-option value="blocked">Blocked</a-select-option>
            </a-select>
          </a-col>

          <a-col :xs="24" :md="4">
            <a-button @click="resetFilters">
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
              <strong>{{ record.applicant_no }}</strong>
              <div>{{ record.full_name }}</div>
              <small>{{ record.cnic_bform || '-' }}</small>
            </template>

            <template v-else-if="column.key === 'progress'">
              <a-progress
                :percent="record.progress_percent"
                size="small"
              />
              <small>{{ record.progress_summary }}</small>
            </template>

            <template v-else-if="column.key === 'steps'">
              <a-space wrap>
                <a-tag :color="record.profile_status_code === 'completed' ? 'green' : 'orange'">
                  Profile
                </a-tag>
                <a-tag :color="record.qualification_count > 0 ? 'green' : 'orange'">
                  Qual {{ record.qualification_count }}
                </a-tag>
                <a-tag :color="record.document_count > 0 ? 'green' : 'orange'">
                  Docs {{ record.document_count }}
                </a-tag>
                <a-tag :color="record.test_count > 0 ? 'green' : 'default'">
                  Test {{ record.test_count }}
                </a-tag>
                <a-tag :color="record.preference_count > 0 ? 'green' : 'orange'">
                  Pref {{ record.preference_count }}
                </a-tag>
              </a-space>
            </template>

            <template v-else-if="column.key === 'application'">
              <div>Applications: {{ record.application_count }}</div>
              <div>Submitted: {{ record.submitted_count }}</div>
              <div>Paid: {{ record.paid_count }}</div>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag>{{ record.applicant_status_code }}</a-tag>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-button size="small" type="primary" @click="openDetail(record)">
                View Progress
              </a-button>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="detailOpen"
        title="Applicant Progress Detail"
        width="1100px"
        :footer="null"
      >
        <a-spin :spinning="detailLoading">
          <template v-if="detail">
            <a-descriptions bordered size="small" :column="2" class="mb-3">
              <a-descriptions-item label="Applicant No">
                {{ detail.applicant?.applicant_no }}
              </a-descriptions-item>
              <a-descriptions-item label="Name">
                {{ detail.applicant?.full_name }}
              </a-descriptions-item>
              <a-descriptions-item label="CNIC / B-Form">
                {{ detail.applicant?.cnic_bform || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Phone">
                {{ detail.applicant?.phone || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Email">
                {{ detail.applicant?.email || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="Profile Status">
                {{ detail.applicant?.profile_status_code || '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-tabs>
              <a-tab-pane key="applications" tab="Applications / Preferences">
                <a-table
                  :data-source="detail.applications || []"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <a-table-column title="Preference" data-index="preference_order" />
                  <a-table-column title="Application No" data-index="application_no" />
                  <a-table-column title="Offered Program" data-index="offered_program_title" />
                  <a-table-column title="Quota" data-index="quota_name" />
                  <a-table-column title="Eligibility" data-index="eligibility_status_code" />
                  <a-table-column title="Application" data-index="application_status_code" />
                  <a-table-column title="Documents" data-index="document_status_code" />
                  <a-table-column title="Fee" data-index="fee_status_code" />
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="qualifications" tab="Qualifications">
                <a-table
                  :data-source="detail.qualifications || []"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <a-table-column title="Level" data-index="qualification_level_id" />
                  <a-table-column title="Group" data-index="subject_group_id" />
                  <a-table-column title="Year" data-index="passing_year" />
                  <a-table-column title="Obtained" data-index="obtained_marks" />
                  <a-table-column title="Total" data-index="total_marks" />
                  <a-table-column title="%" data-index="percentage" />
                  <a-table-column title="Status" data-index="result_status_code" />
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="documents" tab="Documents">
                <a-table
                  :data-source="detail.documents || []"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <a-table-column title="Document Type" data-index="document_type_id" />
                  <a-table-column title="Title" data-index="document_title" />
                  <a-table-column title="Verification" data-index="verification_status_code" />
                  <a-table-column title="Remarks" data-index="remarks" />
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="tests" tab="Test Results">
                <a-table
                  :data-source="detail.test_results || []"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <a-table-column title="Test Code" data-index="test_code" />
                  <a-table-column title="Test Name" data-index="test_name" />
                  <a-table-column title="Roll No" data-index="roll_no" />
                  <a-table-column title="Obtained" data-index="obtained_marks" />
                  <a-table-column title="Total" data-index="total_marks" />
                  <a-table-column title="%" data-index="percentage" />
                  <a-table-column title="Status" data-index="result_status_code" />
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="payments" tab="Vouchers / Payments">
                <h4>Vouchers</h4>
                <a-table
                  :data-source="detail.vouchers || []"
                  :pagination="false"
                  size="small"
                  row-key="id"
                  class="mb-3"
                >
                  <a-table-column title="Voucher No" data-index="voucher_no" />
                  <a-table-column title="Type" data-index="voucher_type_code" />
                  <a-table-column title="Amount" data-index="amount" />
                  <a-table-column title="Due Date" data-index="due_date" />
                  <a-table-column title="Status" data-index="status_code" />
                </a-table>

                <h4>Payments</h4>
                <a-table
                  :data-source="detail.payments || []"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <a-table-column title="Voucher" data-index="voucher_no" />
                  <a-table-column title="Method" data-index="payment_method_code" />
                  <a-table-column title="Reference" data-index="payment_reference_no" />
                  <a-table-column title="Amount" data-index="amount" />
                  <a-table-column title="Status" data-index="payment_status_code" />
                  <a-table-column title="Verified At" data-index="verified_at" />
                </a-table>
              </a-tab-pane>
            </a-tabs>
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
const detailLoading = ref(false)
const detailOpen = ref(false)

const rows = ref<any[]>([])
const detail = ref<any>(null)

const filters = reactive({
  search: '',
  status: undefined as string | undefined,
})

const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
})

const columns = [
  {
    title: 'Applicant',
    key: 'applicant',
    width: 260,
  },
  {
    title: 'Progress',
    key: 'progress',
    width: 220,
  },
  {
    title: 'Steps',
    key: 'steps',
  },
  {
    title: 'Applications',
    key: 'application',
    width: 150,
  },
  {
    title: 'Status',
    key: 'status',
    width: 110,
  },
  {
    title: 'Action',
    key: 'action',
    width: 130,
  },
]

const loadRows = async () => {
  loading.value = true

  try {
    const response: any = await api.getApplicantProgressList({
      search: filters.search,
      status: filters.status,
      page: pagination.current,
      per_page: pagination.pageSize,
    })

    const payload = response?.data || {}

    rows.value = payload.data || []
    pagination.total = payload.total || 0
    pagination.current = payload.current_page || pagination.current
    pagination.pageSize = payload.per_page || pagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load applicant progress.')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.search = ''
  filters.status = undefined
  pagination.current = 1
  loadRows()
}

const handleTableChanged = (pager: any) => {
  pagination.current = pager.current
  pagination.pageSize = pager.pageSize
  loadRows()
}

const openDetail = async (record: any) => {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const response: any = await api.getApplicantProgressDetail(record.id)
    detail.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load applicant detail.')
  } finally {
    detailLoading.value = false
  }
}

onMounted(loadRows)
</script>

<style scoped>
.page-container {
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
  margin-bottom: 0;
  color: #888;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>