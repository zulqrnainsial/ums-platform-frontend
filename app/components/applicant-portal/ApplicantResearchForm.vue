<template>
  <a-spin :spinning="loading || saving">
    <a-form layout="vertical">
      <a-row :gutter="[16, 0]">
        <a-col :xs="24">
          <a-form-item label="Proposed Research Title">
            <a-input v-model:value="form.proposed_research_title" />
          </a-form-item>
        </a-col>

        <a-col :xs="24">
          <a-form-item label="Statement of Purpose">
            <a-textarea v-model:value="form.statement_of_purpose" :rows="4" />
          </a-form-item>
        </a-col>

        <a-col :xs="24">
          <a-form-item label="Research Interests">
            <a-textarea v-model:value="form.research_interests" :rows="3" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Preferred Supervisor Name">
            <a-input v-model:value="form.preferred_supervisor_name" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Preferred Supervisor Email">
            <a-input v-model:value="form.preferred_supervisor_email" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-button type="primary" :loading="saving" @click="save">
        Save Research Profile
      </a-button>
    </a-form>
  </a-spin>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{ applicantId: number }>()
const api = useApplicantPortalApi()

const loading = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)

const form = reactive<any>({
  applicant_id: props.applicantId,
  proposed_research_title: null,
  statement_of_purpose: null,
  research_interests: null,
  preferred_supervisor_name: null,
  preferred_supervisor_email: null,
  status_code: 'completed',
  remarks: null,
})

const load = async () => {
  loading.value = true
  try {
    const response: any = api.isApplicantSession()
  ? await api.applicantGetResearchProfile()
  : await api.getApplicantResearchProfiles(props.applicantId)

if (api.isApplicantSession()) {
  if (response?.data) {
    editingId.value = response.data.id
    Object.assign(form, response.data)
  }
} else {
  const rows = response?.data?.data || response?.data || []
  if (rows.length > 0) {
    editingId.value = rows[0].id
    Object.assign(form, rows[0])
  }
}
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    if (api.isApplicantSession()) {
  await api.applicantSaveResearchProfile({ ...form })
} else {
  await api.saveApplicantResearchProfile({ ...form }, editingId.value)
}
    message.success('Research profile saved.')
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>