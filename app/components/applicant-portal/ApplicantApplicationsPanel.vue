<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Applications</a-typography-title>
      <a-button size="small" :loading="loading" @click="$emit('refresh')">
        Refresh
      </a-button>
    </div>

    <a-alert
      type="info"
      show-icon
      class="mb-3"
      message="These are the application rows created from your preference group. Fee voucher and checklist are handled per selected preference/application."
    />

    <a-table
      :columns="columns"
      :data-source="applications"
      row-key="id"
      size="small"
      :pagination="{ pageSize: 5 }"
      :scroll="{ x: 900 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'preference_order'">
          <a-tag color="processing">
            {{ record.preference_order || '-' }}
          </a-tag>
        </template>

        <template v-if="column.key === 'status'">
          <a-space direction="vertical" size="small">
            <a-tag>{{ record.application_status_code }}</a-tag>
            <a-tag>{{ record.fee_status_code }}</a-tag>
          </a-space>
        </template>

        <template v-if="column.key === 'action'">
          <a-space wrap>
            <a-button size="small" @click="$emit('generate-voucher', record.id)">
              Generate Voucher
            </a-button>

            <a-button type="primary" size="small" @click="$emit('open-checklist', record.id)">
              Checklist
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  applications: any[]
  loading: boolean
}>()

defineEmits<{
  refresh: []
  'open-checklist': [applicationId: number]
  'generate-voucher': [applicationId: number]
}>()

const columns = [
  {
    title: 'Pref',
    key: 'preference_order',
    width: 80,
  },
  {
    title: 'Application No',
    dataIndex: 'application_no',
    key: 'application_no',
    width: 170,
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
    width: 150,
  },
  {
    title: 'Status',
    key: 'status',
    width: 150,
  },
  {
    title: 'Action',
    key: 'action',
    width: 230,
  },
]
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
</style>
