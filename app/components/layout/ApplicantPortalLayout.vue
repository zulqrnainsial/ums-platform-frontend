<template>
  <div class="applicant-portal-layout">
    <header class="portal-header">
      <div>
        <h2>Applicant Portal</h2>
        <p>Continue and track your admission application</p>
      </div>

      <div class="portal-header-right">
        <a-tag v-if="applicant?.applicant_no" color="blue">
          {{ applicant.applicant_no }}
        </a-tag>

        <a-button danger @click="$emit('logout')">
          Logout
        </a-button>
      </div>
    </header>

    <section class="portal-profile-card">
      <a-row :gutter="[12, 12]">
        <a-col :xs="24" :md="6">
          <div class="info-label">Applicant No</div>
          <div class="info-value">{{ applicant?.applicant_no || '-' }}</div>
        </a-col>

        <a-col :xs="24" :md="6">
          <div class="info-label">Full Name</div>
          <div class="info-value">{{ applicantName }}</div>
        </a-col>

        <a-col :xs="24" :md="6">
          <div class="info-label">Profile Status</div>
          <a-tag :color="profileStatusColor">
            {{ applicant?.profile_status_code || '-' }}
          </a-tag>
        </a-col>

        <a-col :xs="24" :md="6">
          <div class="info-label">Applicant Status</div>
          <a-tag :color="applicantStatusColor">
            {{ applicant?.applicant_status_code || applicant?.status_code || '-' }}
          </a-tag>
        </a-col>
      </a-row>
    </section>

    <section class="portal-stepper-card">
      <a-steps :current="currentStep" size="small" responsive>
        <a-step title="Profile" />
        <a-step title="Qualifications" />
        <a-step title="Documents" />
        <a-step title="Programs" />
        <a-step title="Preferences" />
        <a-step title="Checklist" />
      </a-steps>
    </section>

    <main class="portal-main">
      <aside class="portal-sidebar">
        <a-card size="small" title="Applicant Summary">
          <div class="summary-row">
            <span>Applicant No</span>
            <strong>{{ applicant?.applicant_no || '-' }}</strong>
          </div>

          <div class="summary-row">
            <span>Name</span>
            <strong>{{ applicantName }}</strong>
          </div>

          <div class="summary-row">
            <span>CNIC / B-Form</span>
            <strong>{{ applicant?.cnic_bform || '-' }}</strong>
          </div>

          <div class="summary-row">
            <span>Phone</span>
            <strong>{{ applicant?.phone || '-' }}</strong>
          </div>

          <div class="summary-row">
            <span>Email</span>
            <strong>{{ applicant?.email || '-' }}</strong>
          </div>

          <div class="summary-row">
            <span>Profile</span>
            <a-tag :color="profileStatusColor">
              {{ applicant?.profile_status_code || '-' }}
            </a-tag>
          </div>

          <div class="summary-row">
            <span>Status</span>
            <a-tag :color="applicantStatusColor">
              {{ applicant?.applicant_status_code || applicant?.status_code || '-' }}
            </a-tag>
          </div>
        </a-card>

        <a-card size="small" title="Admission Progress" class="mt-3">
  <a-timeline>
    <a-timeline-item color="green">
      Applicant Registered
    </a-timeline-item>

    <a-timeline-item :color="applicant?.profile_status_code === 'completed' ? 'green' : 'gray'">
      Profile Completed
    </a-timeline-item>

    <a-timeline-item :color="hasApplication ? 'green' : 'gray'">
      Application Submitted
    </a-timeline-item>

    <a-timeline-item :color="hasOffer ? 'green' : 'gray'">
      Admission Offer Generated
    </a-timeline-item>

    <a-timeline-item :color="hasAcceptedOffer ? 'green' : 'gray'">
      Offer Accepted
    </a-timeline-item>

    <a-timeline-item :color="hasPaymentVerified ? 'green' : 'gray'">
      Payment Verified
    </a-timeline-item>

    <a-timeline-item :color="hasConfirmedAdmission ? 'green' : 'gray'">
      Admission Confirmed
    </a-timeline-item>
  </a-timeline>
</a-card>
<a-card size="small" title="What should I do next?" class="mt-3">
  <a-alert
    v-if="applicant?.profile_status_code !== 'completed'"
    type="warning"
    show-icon
    message="Complete your applicant profile."
  />

  <a-alert
    v-else
    type="success"
    show-icon
    message="Profile completed. Continue with documents, eligible programs and application submission."
  />

  <a-divider />

  <ul class="guidance-list">
    <li>Complete personal information.</li>
    <li>Add academic qualifications.</li>
    <li>Upload required documents.</li>
    <li>Add admission test result if required.</li>
    <li>Check eligible programs.</li>
    <li>Submit application before deadline.</li>
    <li>Track admission offer and payment status.</li>
  </ul>
</a-card>
      </aside>

      <section class="portal-content">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  applicant?: any
  currentStep?: number
  hasApplication?: boolean
  hasOffer?: boolean
  hasAcceptedOffer?: boolean
  hasPaymentVerified?: boolean
  hasConfirmedAdmission?: boolean
}>()

defineEmits<{
  logout: []
}>()

const applicantName = computed(() => {
  return props.applicant?.full_name
    || `${props.applicant?.first_name || ''} ${props.applicant?.last_name || ''}`.trim()
    || '-'
})

const profileStatusColor = computed(() => {
  return props.applicant?.profile_status_code === 'completed' ? 'green' : 'orange'
})

const applicantStatusColor = computed(() => {
  const status = props.applicant?.applicant_status_code || props.applicant?.status_code
  return status === 'active' ? 'green' : 'default'
})
</script>

<style scoped>
.applicant-portal-layout {
  min-height: 100vh;
  background: #f3f6fb;
  padding: 18px;
}

.portal-header {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e7eb;
}

.portal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.portal-header p {
  margin: 4px 0 0;
  color: #6b7280;
}

.portal-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.portal-profile-card,
.portal-stepper-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-value {
  font-weight: 600;
  color: #111827;
}

.portal-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
}

.portal-sidebar {
  min-width: 0;
}

.portal-content {
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row span {
  color: #6b7280;
}

.summary-row strong {
  color: #111827;
  text-align: right;
}

.mt-3 {
  margin-top: 16px;
}
.guidance-list {
  padding-left: 18px;
  margin: 0;
}

.guidance-list li {
  margin-bottom: 8px;
  color: #374151;
}
@media (max-width: 992px) {
  .portal-main {
    grid-template-columns: 1fr;
  }

  .portal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .portal-header-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>