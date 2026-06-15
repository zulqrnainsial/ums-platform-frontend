<template>
  <div class="wizard-shell">
    <a-card size="small" class="wizard-card">
      <a-alert
        v-if="editLocks?.message"
        type="warning"
        show-icon
        class="mb-3"
        :message="editLocks.message"
      />
      <a-tabs
        v-model:activeKey="activeTab"
        class="portal-tabs"
        @change="handleTabChanged"
      >
        <a-tab-pane key="personal" tab="Personal Info">
          <ApplicantPersonalInfoForm
            :applicant-id="applicantId"
            :applicant="applicant"
            :locked="!!editLocks?.locks?.personal_info"
            @saved="loadApplicant"
          />
        </a-tab-pane>

        <a-tab-pane key="qualifications" tab="Qualifications">
          <ApplicantQualificationsForm
            :applicant-id="applicantId"
            :locked="!!editLocks?.locks?.qualifications"
          />
        </a-tab-pane>

        <a-tab-pane key="experience" tab="Experience">
          <ApplicantExperiencesForm :applicant-id="applicantId" />
        </a-tab-pane>

        <a-tab-pane key="research" tab="Research">
          <ApplicantResearchForm :applicant-id="applicantId" />
        </a-tab-pane>

        <a-tab-pane key="publications" tab="Publications">
          <ApplicantPublicationsForm :applicant-id="applicantId" />
        </a-tab-pane>

        <a-tab-pane key="tests" tab="Test Results">
          <ApplicantTestResultsForm
            :applicant-id="applicantId"
            :locked="!!editLocks?.locks?.test_results"
          />
        </a-tab-pane>

        <a-tab-pane key="documents" tab="Documents">
          <ApplicantDocumentsUploadForm
            :applicant-id="applicantId"
            :locked="!!editLocks?.locks?.documents"
          />
        </a-tab-pane>

        <a-tab-pane key="eligible" tab="Eligible Programs">
          <a-alert
            type="info"
            show-icon
            class="mb-3"
            message="Select eligible programs and add them to your preference list."
          />

          
          <EligibleProgramsPanel
  :applicant-id="applicantId"
  :eligible-programs="eligiblePrograms"
  :not-eligible-programs="notEligiblePrograms"
  :loading="loadingEligible"
  :locked="!!editLocks?.locks?.eligible_programs"
  @refresh="loadEligiblePrograms"
  @applied="handleApplied"
  @preference-added="handleApplied"
/>
        </a-tab-pane>

        <a-tab-pane key="applications" tab="Applications">
          
          <ApplicantApplicationsPanel
  :applications="applications"
  :loading="loadingApplications"
  :locked="!!editLocks?.locks?.applications"
  @refresh="loadApplications"
  @open-checklist="openChecklist"
  @generate-voucher="generateVoucher"
/>
        </a-tab-pane>

        <a-tab-pane key="fees" tab="Fee & Payment">
          <ApplicantFeePaymentPanel
            :applicant-id="applicantId"
            :applications="applications"
            @changed="handleFeeChanged"
          />
        </a-tab-pane>

        <a-tab-pane key="checklist" tab="Checklist">
          <ApplicantChecklistPanel
            :checklist="checklist"
            :loading="loadingChecklist"
            @refresh="loadChecklist"
            @final-submit="submitFinal"
          />
        </a-tab-pane>

        <a-tab-pane key="my-tests" tab="My Tests">
          <ApplicantMyTestsPanel />
        </a-tab-pane>

        <a-tab-pane key="admission-offers" tab="Admission Offers">
          <ApplicantAdmissionOffersPanel />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

import ApplicantPersonalInfoForm from './ApplicantPersonalInfoForm.vue'
import ApplicantQualificationsForm from './ApplicantQualificationsForm.vue'
import ApplicantExperiencesForm from './ApplicantExperiencesForm.vue'
import ApplicantResearchForm from './ApplicantResearchForm.vue'
import ApplicantPublicationsForm from './ApplicantPublicationsForm.vue'
import ApplicantTestResultsForm from './ApplicantTestResultsForm.vue'
import ApplicantDocumentsUploadForm from './ApplicantDocumentsUploadForm.vue'
import EligibleProgramsPanel from './EligibleProgramsPanel.vue'
import ApplicantApplicationsPanel from './ApplicantApplicationsPanel.vue'
import ApplicantChecklistPanel from './ApplicantChecklistPanel.vue'
import ApplicantFeePaymentPanel from './ApplicantFeePaymentPanel.vue'
import ApplicantMyTestsPanel from './ApplicantMyTestsPanel.vue'
import ApplicantAdmissionOffersPanel from './ApplicantAdmissionOffersPanel.vue'

const props = defineProps<{
  applicantId: number
}>()

const emit = defineEmits<{
  stepChanged: [step: number]
  applicantLoaded: [applicant: any]
  progressChanged: [payload: any]
}>()

const api = useApplicantPortalApi()

const activeTab = ref('personal')

const loadingApplicant = ref(false)
const loadingEligible = ref(false)
const loadingApplications = ref(false)
const loadingChecklist = ref(false)
const admissionOffers = ref<any[]>([])
const applicant = ref<any>(null)
const eligiblePrograms = ref<any[]>([])
const notEligiblePrograms = ref<any[]>([])
const applications = ref<any[]>([])
const checklist = ref<any>(null)
const selectedApplicationId = ref<number | null>(null)
const editLocks = ref<any>({
  locks: {},
  editable: {},
  message: '',
})
const tabStepMap: Record<string, number> = {
  personal: 0,
  qualifications: 1,
  experience: 1,
  research: 1,
  publications: 1,
  tests: 1,
  documents: 2,
  eligible: 3,
  applications: 4,
  fees: 4,
  'my-tests': 4,
  'admission-offers': 4,
  checklist: 5,
}
const emitProgress = () => {
  const hasApplication = Array.isArray(applications.value) && applications.value.length > 0

  const offers = admissionOffers.value || []

  const hasOffer = offers.some((offer: any) => {
    return ['offered', 'accepted'].includes(String(offer.offer_status_code || '').toLowerCase())
  })

  const hasAcceptedOffer = offers.some((offer: any) => {
    return String(offer.offer_status_code || '').toLowerCase() === 'accepted'
  })

  const hasPaymentVerified = offers.some((offer: any) => {
    return String(offer.voucher_status_code || '').toLowerCase() === 'paid'
  })

  const hasConfirmedAdmission = offers.some((offer: any) => {
    return String(offer.confirmation_status_code || '').toLowerCase() === 'confirmed'
      || String(offer.admission_confirmation_status_code || '').toLowerCase() === 'confirmed'
  })

  emit('progressChanged', {
    hasApplication,
    hasOffer,
    hasAcceptedOffer,
    hasPaymentVerified,
    hasConfirmedAdmission,
  })

  if (hasConfirmedAdmission) {
    emit('stepChanged', 5)
  } else if (hasAcceptedOffer || hasOffer) {
    emit('stepChanged', 4)
  } else if (hasApplication) {
    emit('stepChanged', 4)
  } else if (applicant.value?.profile_status_code === 'completed') {
    emit('stepChanged', 2)
  }
}
const setStepByTab = (key: string) => {
  emit('stepChanged', tabStepMap[key] ?? 0)
}
const loadAdmissionOffers = async () => {
  try {
    if (typeof api.applicantGetAdmissionOffers !== 'function') {
      emitProgress()
      return
    }

    const response: any = await api.applicantGetAdmissionOffers()

    admissionOffers.value = response?.data?.offers
      || response?.data?.data
      || response?.data
      || []

    emitProgress()
  } catch {
    admissionOffers.value = []
    emitProgress()
  }
}
const handleTabChanged = async (key: string) => {
  setStepByTab(key)

  if (key === 'eligible') {
    await loadEligiblePrograms()
  }

  if (key === 'applications' || key === 'fees') {
    await loadApplications()
  }

  if (key === 'checklist') {
    await loadChecklist()
  }
}
const loadEditLocks = async () => {
  try {
    const response: any = api.isApplicantSession()
      ? await api.applicantGetEditLocks()
      : await api.getApplicantEditLocks(props.applicantId)
    console.log(response)
    editLocks.value = response?.data || {
      locks: {},
      editable: {},
      message: '',
    }
  } catch {
    editLocks.value = {
      locks: {},
      editable: {},
      message: '',
    }
  }
}
const handleApplicantSaved = async () => {
  await loadApplicant()
}

const loadApplicant = async () => {
  loadingApplicant.value = true

  try {
    const response: any = api.isApplicantSession()
      ? await api.applicantGetProfile()
      : await api.getApplicant(props.applicantId)

    applicant.value = response?.data || null
    emitProgress()
    if (applicant.value) {
      emit('applicantLoaded', applicant.value)
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load applicant.')
  } finally {
    loadingApplicant.value = false
  }
}

const loadEligiblePrograms = async () => {
  loadingEligible.value = true

  try {
    const response: any = api.isApplicantSession()
      ? await api.applicantGetEligiblePrograms()
      : await api.getEligiblePrograms(props.applicantId)

    eligiblePrograms.value = response?.data?.eligible_programs || []
    notEligiblePrograms.value = response?.data?.not_eligible_programs || []

    if (response?.data?.applicant) {
      applicant.value = {
        ...(applicant.value || {}),
        ...response.data.applicant,
      }

      emit('applicantLoaded', applicant.value)
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load eligible programs.')
  } finally {
    loadingEligible.value = false
  }
}

const loadApplications = async () => {
  loadingApplications.value = true

  try {
    const response: any = api.isApplicantSession()
      ? await api.applicantGetApplications()
      : await api.getApplications(props.applicantId)

    applications.value = response?.data?.applications || []
    emitProgress()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load applications.')
  } finally {
    loadingApplications.value = false
  }
}

const loadChecklist = async () => {
  if (!selectedApplicationId.value) {
    checklist.value = null
    return
  }

  loadingChecklist.value = true

  try {
    const response: any = api.isApplicantSession()
      ? await api.applicantGetChecklist(selectedApplicationId.value)
      : await api.getChecklist(selectedApplicationId.value)

    checklist.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load checklist.')
  } finally {
    loadingChecklist.value = false
  }
}

const handleApplied = async () => {
  message.success('Application created successfully.')

  activeTab.value = 'applications'
  emit('stepChanged', 4)

  await loadApplications()
}

const openChecklist = async (applicationId: number) => {
  selectedApplicationId.value = applicationId
  activeTab.value = 'checklist'
  emit('stepChanged', 5)

  await loadChecklist()
}

const generateVoucher = async (applicationId: number) => {
  try {
    if (api.isApplicantSession()) {
      await api.applicantGenerateVoucher(applicationId)
    } else {
      await api.generateVoucher(applicationId)
    }

    message.success('Voucher generated successfully.')
    await loadApplications()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to generate voucher.')
  }
}

const handleFeeChanged = async () => {
  await loadApplications()

  if (selectedApplicationId.value) {
    await loadChecklist()
  }
}

const submitFinal = async () => {
  if (!selectedApplicationId.value) {
    message.warning('Please open an application checklist first.')
    return
  }

  try {
    if (api.isApplicantSession()) {
      await api.applicantFinalSubmit(selectedApplicationId.value)
    } else {
      await api.finalSubmit(selectedApplicationId.value)
    }

    message.success('Application finally submitted successfully.')
    await loadChecklist()
    await loadApplications()
  } catch (error: any) {
    message.error(error?.data?.message || 'Final submission failed.')
  }
}

onMounted(async () => {
  emit('stepChanged', 0)

  await Promise.all([
    loadApplicant(),
    loadApplications(),
    loadAdmissionOffers(),
    loadEditLocks(),
  ])

  emitProgress()
})
</script>

<style scoped>
.wizard-shell {
  width: 100%;
  max-width: 100%;
}

.wizard-card {
  border-radius: 10px;
}

.portal-tabs {
  width: 100%;
}

.mb-3 {
  margin-bottom: 16px;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

:deep(.ant-tabs-content-holder) {
  overflow-x: auto;
}

:deep(.ant-tabs-tab) {
  padding: 10px 0;
}
</style>