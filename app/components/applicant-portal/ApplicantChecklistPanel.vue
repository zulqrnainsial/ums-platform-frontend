<template>
  <div>
    <div class="panel-header">
      <a-typography-title :level="5">Final Submission Checklist</a-typography-title>

      <a-space>
        <a-button size="small" :loading="loading" @click="$emit('refresh')">
          Refresh
        </a-button>

        <a-button
          type="primary"
          size="small"
          :disabled="!checklist?.can_submit"
          @click="$emit('final-submit')"
        >
          Final Submit
        </a-button>
      </a-space>
    </div>

    <a-empty
      v-if="!checklist"
      description="Select an application to view checklist"
    />

    <template v-else>
      <a-alert
        :type="checklist.can_submit ? 'success' : 'warning'"
        show-icon
        class="mb-3"
        :message="checklist.can_submit ? 'Application is ready for final submission.' : 'Application checklist is incomplete.'"
      />

      <a-progress
        :percent="progressPercent"
        class="mb-3"
      />

      <a-list
        bordered
        size="small"
        :data-source="checklist.items || []"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>
                <a-space>
                  <a-tag :color="item.passed ? 'success' : 'error'">
                    {{ item.passed ? 'Passed' : 'Pending' }}
                  </a-tag>

                  <span>{{ item.title }}</span>

                  <a-tag v-if="item.required">Required</a-tag>
                  <a-tag v-else>Optional</a-tag>
                </a-space>
              </template>

              <template #description>
                {{ item.message }}
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  checklist: any
  loading: boolean
}>()

defineEmits<{
  refresh: []
  'final-submit': []
}>()

const progressPercent = computed(() => {
  if (!props.checklist?.total_required) return 0

  return Math.round(
    (props.checklist.total_passed / props.checklist.total_required) * 100
  )
})
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