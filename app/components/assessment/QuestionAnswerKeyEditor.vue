<template>
  <a-card title="Answer Keys" size="small">
    <template #extra>
      <a-button size="small" type="primary" @click="addAnswer">
        Add Answer Key
      </a-button>
    </template>

    <a-table
      :data-source="answerKeys"
      :pagination="false"
      row-key="index"
      size="small"
    >
      <a-table-column title="Answer Text">
        <template #default="{ record }">
          <a-textarea
            v-model:value="record.answer_text"
            :rows="2"
            :disabled="questionType === 'numeric'"
          />
        </template>
      </a-table-column>

      <a-table-column v-if="questionType === 'numeric'" title="Answer Number" width="180">
        <template #default="{ record }">
          <a-input-number v-model:value="record.answer_number" class="w-100" />
        </template>
      </a-table-column>

      <a-table-column title="Case Sensitive" width="140">
        <template #default="{ record }">
          <a-switch v-model:checked="record.case_sensitive" />
        </template>
      </a-table-column>

      <a-table-column v-if="questionType === 'numeric'" title="Tolerance" width="140">
        <template #default="{ record }">
          <a-input-number v-model:value="record.numeric_tolerance" class="w-100" />
        </template>
      </a-table-column>

      <a-table-column title="Action" width="90">
        <template #default="{ index }">
          <a-button danger size="small" @click="removeAnswer(index)">
            Remove
          </a-button>
        </template>
      </a-table-column>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  questionType: string
}>()

const answerKeys = defineModel<any[]>('answerKeys', {
  default: () => [],
})

const addAnswer = () => {
  answerKeys.value.push({
    answer_text: '',
    answer_number: null,
    case_sensitive: false,
    numeric_tolerance: null,
    status_code: 'active',
  })
}

const removeAnswer = (index: number) => {
  answerKeys.value.splice(index, 1)
}
</script>

<style scoped>
.w-100 {
  width: 100%;
}
</style>