<template>
  <div>
    <a-spin :spinning="loading">
      <div v-if="!applicant" class="fallback-page">
        <a-alert
          type="warning"
          show-icon
          message="Applicant profile not found. Please login again."
        />
      </div>

      <ApplicantPortalLayout
        v-else
        :applicant="applicant"
        :current-step="currentStep"
        :has-application="portalProgress.hasApplication"
        :has-offer="portalProgress.hasOffer"
        :has-accepted-offer="portalProgress.hasAcceptedOffer"
        :has-payment-verified="portalProgress.hasPaymentVerified"
        :has-confirmed-admission="portalProgress.hasConfirmedAdmission"
        @logout="logout"
      >
        <ApplicantWizardShell
          :applicant-id="applicant.id"
          @step-changed="currentStep = $event"
          @applicant-loaded="applicant = $event"
          @progress-changed="updatePortalProgress"
        />
      </ApplicantPortalLayout>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import ApplicantPortalLayout from '~/components/layout/ApplicantPortalLayout.vue'
import ApplicantWizardShell from '~/components/applicant-portal/ApplicantWizardShell.vue'

const router = useRouter()
const auth = useApplicantAuthApi()

const loading = ref(false)
const applicant = ref<any>(null)
const portalProgress = reactive({
  hasApplication: false,
  hasOffer: false,
  hasAcceptedOffer: false,
  hasPaymentVerified: false,
  hasConfirmedAdmission: false,
})
const currentStep = ref(0)

const loadMe = async () => {
  loading.value = true

  try {
    const response: any = await auth.me()
    applicant.value = response?.data?.applicant || null
  } catch (error: any) {
    auth.clearSession()
    message.error('Please login as applicant.')
    router.push('/applicant/login')
  } finally {
    loading.value = false
  }
}
const updatePortalProgress = (payload: any) => {
  portalProgress.hasApplication = !!payload?.hasApplication
  portalProgress.hasOffer = !!payload?.hasOffer
  portalProgress.hasAcceptedOffer = !!payload?.hasAcceptedOffer
  portalProgress.hasPaymentVerified = !!payload?.hasPaymentVerified
  portalProgress.hasConfirmedAdmission = !!payload?.hasConfirmedAdmission
}
const logout = async () => {
  await auth.logout()
  router.push('/applicant/login')
}

onMounted(() => {
  if (!auth.getToken()) {
    router.push('/applicant/login')
    return
  }

  loadMe()
})
</script>

<style scoped>
.fallback-page {
  background: #f5f7fb;
  min-height: 100vh;
  padding: 16px;
}
</style>