<template>
  <div>
    <a-space class="mb-3">
      <a-button @click="loadTests">Refresh</a-button>
    </a-space>

    <a-table
      :columns="columns"
      :data-source="tests"
      :loading="loading"
      row-key="id"
      size="small"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'test'">
          <strong>{{ record.assessment?.code || '-' }}</strong>
          <div>{{ record.assessment?.title || '-' }}</div>
          <small>
            Duration: {{ record.assessment?.duration_minutes || '-' }} minutes |
            Total: {{ record.assessment?.total_marks || '-' }} |
            Passing: {{ record.assessment?.passing_marks || '-' }}
          </small>
        </template>

        <template v-else-if="column.key === 'schedule'">
          <div>{{ record.schedule?.title || '-' }}</div>
          <small>
            {{ record.schedule?.start_at || '-' }} to {{ record.schedule?.end_at || '-' }}
          </small>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-space wrap>
            <a-tag>{{ record.attempt_status_code || '-' }}</a-tag>
            <a-tag v-if="record.result_status_code">{{ record.result_status_code }}</a-tag>
          </a-space>
        </template>

        <template v-else-if="column.key === 'result'">
          <template v-if="record.result">
            <strong>{{ record.result.final_marks ?? '-' }}</strong>
            <span> / {{ record.assessment?.total_marks ?? '-' }}</span>
            <div>{{ record.result.percentage ?? '-' }}%</div>
          </template>
          <span v-else>-</span>
        </template>

        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button
              v-if="record.can_start || record.can_resume"
              type="primary"
              size="small"
              :loading="startingId === record.id"
              @click="startAttempt(record)"
            >
              {{ record.can_resume ? 'Resume Test' : 'Start Test' }}
            </a-button>

            <a-tooltip v-else :title="record.can_start_reason || 'Test cannot be started.'">
              <a-button size="small" disabled>Start Test</a-button>
            </a-tooltip>

            <a-button
              v-if="record.latest_attempt"
              size="small"
              @click="openReview(record.latest_attempt.id)"
            >
              View Review
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="attemptOpen"
      title="Assessment Attempt"
      width="96%"
      :footer="null"
      :mask-closable="false"
      destroy-on-close
    >
      <ApplicantAssessmentAttemptRunner
        v-if="activeAttemptId"
        :attempt-id="activeAttemptId"
        @submitted="handleAttemptSubmitted"
      />
    </a-modal>

    <a-modal
      v-model:open="reviewOpen"
      title="Attempt Review"
      width="90%"
      :footer="null"
      destroy-on-close
    >
      <a-spin :spinning="reviewLoading">
        <template v-if="review">
          <a-descriptions size="small" bordered :column="3" class="mb-3">
            <a-descriptions-item label="Test">
              {{ review.assessment?.title || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Attempt">
              {{ review.attempt?.attempt_no || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Status">
              {{ review.attempt?.status_code || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Marks">
              {{ review.attempt?.final_marks ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="Percentage">
              {{ review.attempt?.percentage ?? '-' }}%
            </a-descriptions-item>
            <a-descriptions-item label="Correct Answers">
              {{ review.show_correct_answers ? 'Visible' : 'Hidden' }}
            </a-descriptions-item>
          </a-descriptions>

          <a-collapse>
            <a-collapse-panel
              v-for="(answer, index) in review.answers || []"
              :key="answer.answer_id"
              :header="`Q${Number(index) + 1}: ${answer.question_text || '-'}`"
            >
              <div v-html="answer.question_html"></div>

              <div class="mb-2">
                <strong>Your Answer:</strong>
                <span v-if="answer.answer_text">{{ answer.answer_text }}</span>
                <span v-else-if="answer.answer_number !== null">{{ answer.answer_number }}</span>
                <span v-else>{{ selectedOptionsText(answer) }}</span>
              </div>

              <div>
                <strong>Marks:</strong>
                {{ answer.marks_awarded ?? 0 }}
                <span v-if="answer.negative_marks_applied">
                  | Negative: {{ answer.negative_marks_applied }}
                </span>
              </div>

              <div v-if="review.show_correct_answers" class="mt-2">
                <strong>Options:</strong>
                <ul>
                  <li v-for="option in answer.options || []" :key="option.id">
                    {{ option.option_key }}. {{ option.option_text }}
                    <a-tag v-if="option.is_correct" color="green">Correct</a-tag>
                  </li>
                </ul>
              </div>

              <a-alert
                v-if="answer.explanation"
                type="info"
                show-icon
                class="mt-2"
                :message="answer.explanation"
              />
            </a-collapse-panel>
          </a-collapse>
        </template>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import ApplicantAssessmentAttemptRunner from './ApplicantAssessmentAttemptRunner.vue'

const api = useApplicantPortalApi()

const loading = ref(false)
const tests = ref<any[]>([])
const startingId = ref<number | null>(null)

const attemptOpen = ref(false)
const activeAttemptId = ref<number | null>(null)

const reviewOpen = ref(false)
const reviewLoading = ref(false)
const review = ref<any>(null)

const columns = [
  { title: 'Test', key: 'test' },
  { title: 'Schedule', key: 'schedule' },
  { title: 'Status', key: 'status' },
  { title: 'Result', key: 'result' },
  { title: 'Action', key: 'action' },
]

const loadTests = async () => {
  loading.value = true

  try {
    const response: any = await api.applicantGetMyAssessments()
    tests.value = response?.data?.tests || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load tests.')
  } finally {
    loading.value = false
  }
}

const startAttempt = async (record: any) => {
  startingId.value = record.id

  try {
    const response: any = await api.applicantStartAssessmentAttempt(record.id)
    const data = response?.data || {}

    activeAttemptId.value = data.attempt?.id
    attemptOpen.value = true
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to start test.')
  } finally {
    startingId.value = null
  }
}

const handleAttemptSubmitted = async () => {
  attemptOpen.value = false
  activeAttemptId.value = null
  await loadTests()
}

const openReview = async (attemptId: number) => {
  reviewOpen.value = true
  reviewLoading.value = true
  review.value = null

  try {
    const response: any = await api.applicantGetAssessmentAttemptReview(attemptId)
    review.value = response?.data || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attempt review.')
  } finally {
    reviewLoading.value = false
  }
}

const selectedOptionsText = (answer: any) => {
  const selected = answer.selected_option_ids_json || []
  const options = answer.options || []

  return options
    .filter((x: any) => selected.includes(x.id))
    .map((x: any) => `${x.option_key}. ${x.option_text}`)
    .join(', ') || '-'
}

onMounted(loadTests)
</script>

<style scoped>
.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}
</style>