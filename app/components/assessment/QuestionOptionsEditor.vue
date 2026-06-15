<template>
  <a-card title="Question Options" size="small">
    <template #extra>
      <a-button size="small" type="primary" @click="addOption">
        Add Option
      </a-button>
    </template>

    <a-table
      :data-source="options"
      :pagination="false"
      row-key="display_order"
      size="small"
    >
      <a-table-column title="Key" width="80">
        <template #default="{ record }">
          <a-input v-model:value="record.option_key" />
        </template>
      </a-table-column>

      <a-table-column title="Option Text">
  <template #default="{ record }">
    <AppRichTextEditor
      v-model="record.option_html"
      placeholder="Write option with formatting."
      @plain-text="record.option_text = $event"
    />

    <a-textarea
      v-model:value="record.option_text"
      :rows="1"
      class="mt-2"
      placeholder="Plain option text"
    />
  </template>
</a-table-column>

      <a-table-column title="Correct" width="100">
        <template #default="{ record }">
          <a-switch
            v-model:checked="record.is_correct"
            @change="handleCorrectChanged(record)"
          />
        </template>
      </a-table-column>

      <a-table-column v-if="questionType === 'ordering'" title="Correct Order" width="140">
        <template #default="{ record }">
          <a-input-number v-model:value="record.correct_order" />
        </template>
      </a-table-column>

      <a-table-column v-if="questionType === 'matching'" title="Match Key" width="140">
        <template #default="{ record }">
          <a-input v-model:value="record.match_key" />
        </template>
      </a-table-column>

      <a-table-column v-if="questionType === 'matching'" title="Correct Match" width="160">
        <template #default="{ record }">
          <a-input v-model:value="record.correct_match_key" />
        </template>
      </a-table-column>

      <a-table-column title="Action" width="90">
        <template #default="{ index }">
          <a-button danger size="small" @click="removeOption(index)">
            Remove
          </a-button>
        </template>
      </a-table-column>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import AppRichTextEditor from '~/components/common/AppRichTextEditor.vue'
const props = defineProps<{
  questionType: string
}>()

const options = defineModel<any[]>('options', {
  default: () => [],
})

const addOption = () => {
  const index = options.value.length
  options.value.push({
  option_key: String.fromCharCode(65 + index),
  option_text: '',
  option_html: '',
  is_correct: false,
  display_order: index + 1,
})
}

const removeOption = (index: number) => {
  options.value.splice(index, 1)
}

const handleCorrectChanged = (record: any) => {
  if (props.questionType === 'mcq_single' || props.questionType === 'true_false') {
    options.value.forEach((item: any) => {
      if (item !== record) {
        item.is_correct = false
      }
    })
  }
}
</script>
<style scoped>
.mt-2 {
  margin-top: 8px;
}
</style>