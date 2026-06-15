<template>
  <ApplicantWizardShell :applicant-id="applicantId" />
</template>

<script setup lang="ts">
import ApplicantWizardShell from '~/components/applicant-portal/ApplicantWizardShell.vue'

const route = useRoute()

const applicantId = computed(() => Number(route.params.applicantId))

</script>