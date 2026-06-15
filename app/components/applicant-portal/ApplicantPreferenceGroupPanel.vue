<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Program Preference List</a-typography-title>
      <a-button size="small" :loading="loading" @click="$emit('refresh')">
        Refresh
      </a-button>
    </div>

    <a-alert
      v-if="!group"
      type="info"
      show-icon
      message="No preference group found yet. Add eligible programs from the Eligible Programs tab."
      class="mb-3"
    />

    <template v-else>
      <a-card size="small" class="mb-3">
        <a-descriptions size="small" bordered :column="2">
          <a-descriptions-item label="Group No">
            {{ group.application_group_no }}
          </a-descriptions-item>

          <a-descriptions-item label="Status">
            <a-tag :color="groupStatusColor(group.status_code)">
              {{ group.status_code }}
            </a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="Admission Session">
            {{ group.admission_session_name || group.admission_session_id }}
          </a-descriptions-item>

          <a-descriptions-item label="Submitted At">
            {{ group.submitted_at || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-alert
        type="warning"
        show-icon
        class="mb-3"
        message="Preference 1 is considered first during merit processing. Keep your most preferred program at the top."
      />

      <a-table
        :columns="columns"
        :data-source="preferences"
        row-key="id"
        size="small"
        :pagination="false"
        :loading="loading"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'preference_order'">
            <a-tag color="processing">
              Preference {{ record.preference_order }}
            </a-tag>
          </template>

          <template v-if="column.key === 'status'">
            <a-space direction="vertical" size="small">
              <a-tag>{{ record.application_status_code }}</a-tag>
              <a-tag>{{ record.eligibility_status_code }}</a-tag>
              <a-tag>{{ record.fee_status_code }}</a-tag>
            </a-space>
          </template>

          <template v-if="column.key === 'action'">
            <a-space wrap>
              <a-button
                size="small"
                :disabled="!canEdit || index === 0"
                @click="moveUp(index)"
              >
                Up
              </a-button>

              <a-button
                size="small"
                :disabled="!canEdit || index === preferences.length - 1"
                @click="moveDown(index)"
              >
                Down
              </a-button>

              <a-button
                size="small"
                danger
                :disabled="!canEdit"
                @click="removePreference(record.id)"
              >
                Remove
              </a-button>

              <a-button
                size="small"
                @click="$emit('generate-voucher', record.id)"
              >
                Voucher
              </a-button>

              <a-button
                type="primary"
                size="small"
                @click="$emit('open-checklist', record.id)"
              >
                Checklist
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="action-bar">
        <a-button
          type="primary"
          :disabled="!canEdit || preferences.length === 0"
          :loading="submitting"
          @click="submitGroup"
        >
          Submit Preference Group
        </a-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const props = defineProps<{
  applicantId: number
  group: any
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
  'open-checklist': [applicationId: number]
  'generate-voucher': [applicationId: number]
  submitted: []
}>()

const api = useApplicantPortalApi()
const submitting = ref(false)

const preferences = computed(() => {
  return [...(props.group?.applications || [])].sort(
    (a: any, b: any) => Number(a.preference_order) - Number(b.preference_order)
  )
})

const canEdit = computed(() => {
  return ['draft', 'deficient'].includes(props.group?.status_code)
})

const columns = [
  {
    title: 'Preference',
    key: 'preference_order',
    width: 130,
  },
  {
    title: 'Program',
    dataIndex: 'offered_program_title',
    key: 'offered_program_title',
  },
  {
    title: 'Quota',
    dataIndex: 'quota_name',
    key: 'quota_name',
    width: 160,
  },
  {
    title: 'Status',
    key: 'status',
    width: 150,
  },
  {
    title: 'Action',
    key: 'action',
    width: 360,
  },
]

const groupStatusColor = (status: string) => {
  if (status === 'submitted') return 'processing'
  if (status === 'confirmed') return 'success'
  if (status === 'cancelled') return 'error'
  return 'default'
}

const persistOrder = async (rows: any[]) => {
  const items = rows.map((row: any, index: number) => ({
    id: row.id,
    preference_order: index + 1,
  }))

  if (api.isApplicantSession()) {
    await api.applicantReorderPreferences(items)
  } else {
    await api.reorderPreferences(props.applicantId, items)
  }

  emit('refresh')
}

const moveUp = async (index: number) => {
  const rows = [...preferences.value]
  const temp = rows[index - 1]
  rows[index - 1] = rows[index]
  rows[index] = temp

  try {
    await persistOrder(rows)
    message.success('Preference order updated.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to reorder preferences.')
  }
}

const moveDown = async (index: number) => {
  const rows = [...preferences.value]
  const temp = rows[index + 1]
  rows[index + 1] = rows[index]
  rows[index] = temp

  try {
    await persistOrder(rows)
    message.success('Preference order updated.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to reorder preferences.')
  }
}

const removePreference = async (applicationId: number) => {
  try {
    if (api.isApplicantSession()) {
      await api.applicantRemovePreference(applicationId)
    } else {
      await api.removePreference(props.applicantId, applicationId)
    }

    message.success('Preference removed.')
    emit('refresh')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to remove preference.')
  }
}

const submitGroup = async () => {
  if (!props.group?.id) return

  submitting.value = true

  try {
    if (api.isApplicantSession()) {
      await api.applicantSubmitPreferenceGroup(props.group.id)
    } else {
      await api.submitPreferenceGroup(props.applicantId, props.group.id)
    }

    message.success('Preference group submitted successfully.')
    emit('submitted')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit preference group.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
