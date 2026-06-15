<template>
  <div class="landing-page">
    <a-spin :spinning="loading">
      <header class="hero">
        <div class="hero-content">
          <a-tag color="blue" class="mb-2">Admission Portal</a-tag>

          <h1>{{ tenant?.name || 'University Admission Portal' }}</h1>

          <p>
            View open admissions, eligibility criteria, merit formula, required tests and documents before applying.
          </p>

          <div class="hero-actions">
            <NuxtLink
  :to="{
    path: '/applicant/register',
    query: tenantQuery,
  }"
>
  <a-button type="primary" size="large">Create Applicant Account</a-button>
</NuxtLink>

<NuxtLink
  :to="{
    path: '/applicant/login',
    query: tenantQuery,
  }"
>
  <a-button size="large">Applicant Login</a-button>
</NuxtLink>
          </div>
        </div>

        <div class="hero-card">
          <h3>Admission Status</h3>

          <div class="stat-row">
            <span>Open Sessions</span>
            <strong>{{ sessions.length }}</strong>
          </div>

          <div class="stat-row">
            <span>Offered Programs</span>
            <strong>{{ offeredPrograms.length }}</strong>
          </div>

          <div class="stat-row">
            <span>Available Tests</span>
            <strong>{{ assessments.length }}</strong>
          </div>

          <div class="stat-row">
            <span>Merit Formulas</span>
            <strong>{{ meritFormulas.length }}</strong>
          </div>
        </div>
      </header>

      <a-alert
        v-if="!tenant"
        type="warning"
        show-icon
        class="mb-3"
        message="Tenant information not found"
        description="Please open the applicant portal from a valid tenant link or provide tenant_code in the URL during local testing."
      />

      <section class="section">
        <div class="section-title">
          <h2>How to Apply</h2>
          <p>Follow these steps to complete your admission application.</p>
        </div>

        <a-row :gutter="[16, 16]">
          <a-col
            v-for="(step, index) in howToApply"
            :key="index"
            :xs="24"
            :md="8"
          >
            <a-card class="info-card">
              <a-tag color="blue">Step {{ index + 1 }}</a-tag>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </a-card>
          </a-col>
        </a-row>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>Open Admission Sessions</h2>
          <p>Important dates and active admission sessions.</p>
        </div>

        <a-empty v-if="!sessions.length" description="No open admission session found" />

        <a-row v-else :gutter="[16, 16]">
          <a-col
            v-for="session in sessions"
            :key="session.id"
            :xs="24"
            :md="12"
          >
            <a-card class="info-card">
              <template #title>
                {{ session.name || session.title || session.code || 'Admission Session' }}
              </template>

              <a-descriptions size="small" :column="1">
                <a-descriptions-item label="Application Start">
                  {{ formatDate(session.application_start_date) }}
                </a-descriptions-item>

                <a-descriptions-item label="Application End">
                  {{ formatDate(session.application_end_date) }}
                </a-descriptions-item>

                <a-descriptions-item label="Document Deadline">
                  {{ formatDate(session.document_submission_deadline) }}
                </a-descriptions-item>

                <a-descriptions-item label="Test Dates">
                  {{ formatDate(session.test_start_date) }} - {{ formatDate(session.test_end_date) }}
                </a-descriptions-item>

                <a-descriptions-item label="Merit List Start">
                  {{ formatDate(session.merit_list_start_date) }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
        </a-row>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>Offered Programs</h2>
          <p>Programs currently open for admission.</p>
        </div>

        <a-empty v-if="!offeredPrograms.length" description="No offered program found" />

        <a-row v-else :gutter="[16, 16]">
          <a-col
            v-for="program in offeredPrograms"
            :key="program.id"
            :xs="24"
            :md="8"
          >
            <a-card class="program-card">
              <h3>
                {{ program.offered_program_code || '-' }}
              </h3>

              <p class="program-title">
                {{ program.offered_program_title || program.offered_program_name || program.program_name || '-' }}
              </p>

              <a-space wrap>
                <a-tag v-if="program.shift">{{ program.shift }}</a-tag>
                <a-tag v-if="program.status_code" color="green">{{ program.status_code }}</a-tag>
              </a-space>

              <a-divider />

              <div class="stat-row">
                <span>Application Fee</span>
                <strong>{{ amount(program.application_fee) }}</strong>
              </div>

              <div class="stat-row">
                <span>Admission Fee</span>
                <strong>{{ amount(program.admission_fee) }}</strong>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </section>

      <section class="section two-column">
        <a-card title="Eligibility Criteria Summary">
          <a-empty v-if="!eligibilityRules.length" description="No eligibility rules published" />

          <a-list
            v-else
            :data-source="eligibilityRules"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <div>
                  <strong>{{ item.rule_title || item.rule_code || '-' }}</strong>
                  <div class="muted">
                    {{ item.rule_group || '-' }}
                    <span v-if="item.operator"> | {{ item.operator }}</span>
                    <span v-if="item.value_number"> {{ item.value_number }}</span>
                    <span v-if="item.value_text"> {{ item.value_text }}</span>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <a-card title="Required Admission Tests">
          <a-empty v-if="!assessments.length" description="No active admission test found" />

          <a-list
            v-else
            :data-source="assessments"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <div>
                  <strong>{{ item.code }} - {{ item.title }}</strong>
                  <div class="muted">
                    Total: {{ item.total_marks || '-' }},
                    Passing: {{ item.passing_marks || '-' }},
                    Duration: {{ item.duration_minutes || '-' }} minutes,
                    Attempts: {{ item.attempt_limit || '-' }}
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>Merit Calculation Formula</h2>
          <p>Published formula components used for merit calculation.</p>
        </div>

        <a-empty v-if="!meritFormulas.length" description="No merit formula published" />

        <a-row v-else :gutter="[16, 16]">
          <a-col
            v-for="formula in meritFormulas"
            :key="formula.id"
            :xs="24"
            :md="12"
          >
            <a-card class="info-card">
              <template #title>
                {{ formula.code }} - {{ formula.title || formula.name }}
              </template>

              <a-table
                :columns="formulaColumns"
                :data-source="formula.components || []"
                row-key="id"
                size="small"
                :pagination="false"
              />
            </a-card>
          </a-col>
        </a-row>
      </section>

      <footer class="footer">
        <div>
          <strong>{{ tenant?.name || 'Institution' }}</strong>
          <p>
            {{ tenant?.address || '' }}
            <span v-if="tenant?.phone"> | {{ tenant.phone }}</span>
            <span v-if="tenant?.email"> | {{ tenant.email }}</span>
          </p>
        </div>

        <div>
          <NuxtLink
  :to="{
    path: '/applicant/register',
    query: tenantQuery,
  }"
>
  <a-button type="primary">Apply Now</a-button>
</NuxtLink>
        </div>
      </footer>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'

const route = useRoute()
const api = usePublicAdmissionGuidanceApi()

const loading = ref(false)

const tenant = ref<any>(null)
const sessions = ref<any[]>([])
const offeredPrograms = ref<any[]>([])
const eligibilityRules = ref<any[]>([])
const meritFormulas = ref<any[]>([])
const assessments = ref<any[]>([])
const requiredDocuments = ref<any[]>([])
const howToApply = ref<any[]>([])
const tenantQuery = computed(() => {
  const tenant = route.query.tenant || route.query.tenant_code

  if (!tenant) return {}

  return {
    tenant,
  }
})
const formulaColumns = [
  { title: 'Component', dataIndex: 'title', key: 'title' },
  { title: 'Type', dataIndex: 'component_type', key: 'component_type' },
  { title: 'Source', dataIndex: 'source_type', key: 'source_type' },
  { title: 'Weight', dataIndex: 'weight', key: 'weight' },
]
const currentTenant = computed(() => {
  return route.query.tenant || route.query.tenant_code || ''
})
const loadGuidance = async () => {
  loading.value = true

  try {
    const response: any = await api.getAdmissionGuidance({
  tenant: currentTenant.value,
})

    const data = response?.data || {}

    tenant.value = data.tenant || null
    sessions.value = data.sessions || []
    offeredPrograms.value = data.offered_programs || []
    eligibilityRules.value = data.eligibility_rules || []
    meritFormulas.value = data.merit_formulas || []
    assessments.value = data.assessments || []
    requiredDocuments.value = data.required_documents || []
    howToApply.value = data.how_to_apply || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load admission guidance.')
  } finally {
    loading.value = false
  }
}

const formatDate = (value: any) => {
  if (!value) return '-'
  return dayjs(value).format('DD MMM YYYY')
}

const amount = (value: any) => {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value).toLocaleString()
}

onMounted(loadGuidance)
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: #f3f6fb;
  padding: 24px;
}

.hero {
  min-height: 360px;
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  border-radius: 20px;
  padding: 42px;
  color: #ffffff;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  align-items: center;
}

.hero-content h1 {
  font-size: 42px;
  margin: 0 0 12px;
  color: #ffffff;
}

.hero-content p {
  font-size: 17px;
  max-width: 700px;
  color: #dbeafe;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.hero-card {
  background: rgba(255, 255, 255, 0.96);
  color: #111827;
  border-radius: 16px;
  padding: 22px;
}

.hero-card h3 {
  margin-bottom: 18px;
}

.section {
  margin-top: 24px;
}

.section-title {
  margin-bottom: 14px;
}

.section-title h2 {
  margin-bottom: 4px;
}

.section-title p {
  color: #6b7280;
  margin: 0;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card,
.program-card {
  height: 100%;
  border-radius: 12px;
}

.program-card h3 {
  margin-bottom: 6px;
}

.program-title {
  min-height: 44px;
  color: #374151;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row span,
.muted {
  color: #6b7280;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}

.footer {
  margin-top: 24px;
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.footer p {
  margin: 4px 0 0;
  color: #6b7280;
}

@media (max-width: 992px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 26px;
  }

  .hero-content h1 {
    font-size: 30px;
  }

  .two-column {
    grid-template-columns: 1fr;
  }

  .footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>