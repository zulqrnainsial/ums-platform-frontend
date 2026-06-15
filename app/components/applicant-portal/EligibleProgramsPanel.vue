<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Eligible Programs</a-typography-title>
      <a-button size="small" :loading="loading" @click="$emit('refresh')">
        Refresh
      </a-button>
    </div>

    <a-alert
      type="info"
      show-icon
      class="mb-3"
      message="Add eligible programs to your preference list. You can reorder preferences before submitting the application group."
    />
    <a-alert
      v-if="locked"
      type="warning"
      show-icon
      class="mb-3"
      message="Program preference selection is locked because your application has already been submitted."
    />
    <a-empty
      v-if="!loading && eligiblePrograms.length === 0"
      description="No eligible programs found"
    />

    <a-collapse v-else accordion>
      <a-collapse-panel
        v-for="program in eligiblePrograms"
        :key="program.offered_program_id"
        :header="program.title"
      >
        <a-descriptions size="small" bordered :column="1">
          <a-descriptions-item label="Program Code">
            {{ program.code }}
          </a-descriptions-item>
          <a-descriptions-item label="Department">
            {{ program.department_name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="Application Fee">
            {{ program.application_fee }}
          </a-descriptions-item>
          <a-descriptions-item label="Admission Fee">
            {{ program.admission_fee }}
          </a-descriptions-item>
        </a-descriptions>
            <div class="program-action">
            <a-button
                type="primary"
                size="small"
                :disabled="locked"
                :loading="addingKey === String(program.offered_program_id)"
                @click="addToPreference(program)"
            >
                Add Preference
            </a-button>
            </div>
        <a-divider />

        <a-table
          :columns="quotaColumns"
          :data-source="program.eligible_quotas || []"
          row-key="program_quota_seat_id"
          size="small"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button
                type="primary"
                size="small"
                :disabled="locked"
                :loading="addingKey === `${program.offered_program_id}-${record.program_quota_seat_id}`"
                @click="addToPreference(program)"
              >
                Add Preference
              </a-button>
            </template>
          </template>
        </a-table>
      </a-collapse-panel>
    </a-collapse>

    <a-divider />

    <a-collapse v-if="notEligiblePrograms.length > 0">
      <a-collapse-panel key="notEligible" header="Not Eligible Programs">
        <a-list
          size="small"
          bordered
          :data-source="notEligiblePrograms"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <div class="not-eligible-item">
                <strong>{{ item.title }}</strong>

                <div
                  v-for="quota in item.quota_results"
                  :key="quota.program_quota_seat_id"
                  class="quota-failed"
                >
                  <div>
                    <strong>{{ quota.quota_name }}</strong>
                  </div>

                  <ul>
                    <li
                      v-for="rule in quota.failed_rules"
                      :key="rule.rule_id"
                    >
                      {{ rule.message }}
                    </li>
                  </ul>
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const props = defineProps<{
  applicantId: number
  eligiblePrograms: any[]
  notEligiblePrograms: any[]
  loading: boolean
  locked?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  'preference-added': []
}>()

const api = useApplicantPortalApi()
const addingKey = ref<string | null>(null)

const quotaColumns = [
  {
    title: 'Seat Category',
    dataIndex: 'quota_name',
    key: 'quota_name',
  },
  {
    title: 'Available Seats',
    dataIndex: 'available_seats',
    key: 'available_seats',
    width: 130,
  },
  {
    title: 'Application Fee',
    dataIndex: 'application_fee',
    key: 'application_fee',
    width: 140,
  },
  {
    title: 'Eligibility',
    key: 'eligible',
    width: 110,
  },
]

const addToPreference = async (program: any) => {
  if (props.locked) {
    message.warning('Program preferences are locked.')
    return
  }
  const key = String(program.offered_program_id)
  addingKey.value = key

  try {
    const payload = {
      offered_program_id: program.offered_program_id,
      remarks: `Preference added for ${program.title || program.program_name}`,
    }

    if (api.isApplicantSession()) {
      await api.applicantAddPreference(payload)
    } else {
      await api.addPreference(props.applicantId, payload)
    }

    message.success('Program added to preference list.')
    emit('preference-added')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to add program preference.')
  } finally {
    addingKey.value = null
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

.not-eligible-item {
  width: 100%;
}

.quota-failed {
  margin-top: 8px;
}
.program-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
