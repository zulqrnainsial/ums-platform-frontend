<template>
  <div>
    <a-spin :spinning="loading">
      <template v-if="payload">
        <div class="attempt-header">
          <div>
            <h3>{{ payload.assessment?.title || 'Assessment Attempt' }}</h3>
            <p>
              Questions: {{ payload.total_questions }} |
              Answered: {{ payload.answered_count }}
            </p>
          </div>

          <div class="timer" :class="{ danger: remainingSeconds <= 60 }">
            {{ formattedTime }}
          </div>
        </div>

        <a-alert
          v-if="remainingSeconds <= 60 && remainingSeconds > 0"
          type="warning"
          show-icon
          class="mb-3"
          message="Less than one minute remaining."
        />

        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="6">
            <a-card title="Questions" size="small">
              <div class="question-grid">
                <a-button
                  v-for="(q, index) in questions"
                  :key="q.assessment_question_id"
                  size="small"
                  :type="index === currentIndex ? 'primary' : isAnswered(q) ? 'default' : 'dashed'"
                  @click="currentIndex = Number(index)"
                >
                  {{ Number(index) + 1 }}
                </a-button>
              </div>
            </a-card>
          </a-col>

          <a-col :xs="24" :md="18">
            <a-card v-if="currentQuestion" size="small">
              <template #title>
                Question {{ currentIndex + 1 }} of {{ questions.length }}
              </template>

              <div class="question-text">
                <div v-if="currentQuestion.question_html" v-html="currentQuestion.question_html"></div>
                <div v-else>{{ currentQuestion.question_text }}</div>
              </div>

              <a-divider />

              <template v-if="isSingleChoice">
                <a-radio-group v-model:value="singleSelected">
                  <a-space direction="vertical">
                    <a-radio
                      v-for="option in currentQuestion.options || []"
                      :key="option.id"
                      :value="option.id"
                    >
                      <span v-if="option.option_html" v-html="option.option_html"></span>
                      <span v-else>{{ option.option_key }}. {{ option.option_text }}</span>
                    </a-radio>
                  </a-space>
                </a-radio-group>
              </template>

              <template v-else-if="isMultipleChoice">
                <a-checkbox-group v-model:value="multipleSelected">
                  <a-space direction="vertical">
                    <a-checkbox
                      v-for="option in currentQuestion.options || []"
                      :key="option.id"
                      :value="option.id"
                    >
                      <span v-if="option.option_html" v-html="option.option_html"></span>
                      <span v-else>{{ option.option_key }}. {{ option.option_text }}</span>
                    </a-checkbox>
                  </a-space>
                </a-checkbox-group>
              </template>

              <template v-else-if="currentQuestion.question_type_code === 'numeric'">
                <a-input-number
                  v-model:value="answerNumber"
                  style="width: 100%"
                  placeholder="Enter numeric answer"
                />
              </template>

              <template v-else>
                <a-textarea
                  v-model:value="answerText"
                  :rows="5"
                  placeholder="Write your answer"
                />
              </template>

              <a-divider />

              <a-space>
                <a-button :disabled="currentIndex === 0" @click="previousQuestion">
                  Previous
                </a-button>

                <a-button type="primary" :loading="saving" @click="saveCurrentAnswer">
                  Save Answer
                </a-button>

                <a-button :disabled="currentIndex === questions.length - 1" @click="nextQuestion">
                  Next
                </a-button>

                <a-popconfirm
                  title="Submit this attempt?"
                  ok-text="Submit"
                  cancel-text="Cancel"
                  @confirm="submitAttempt"
                >
                  <a-button danger :loading="submitting">
                    Submit Test
                  </a-button>
                </a-popconfirm>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const props = defineProps<{
  attemptId: number
}>()

const emit = defineEmits<{
  submitted: []
}>()

const api = useApplicantPortalApi()

const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const payload = ref<any>(null)

const currentIndex = ref(0)
const remainingSeconds = ref(0)
let timerHandle: any = null
const lastLoggedQuestionId = ref<number | null>(null)
let heartbeatHandle: any = null
const singleSelected = ref<number | null>(null)
const multipleSelected = ref<number[]>([])
const answerText = ref('')
const answerNumber = ref<number | null>(null)

const questions = computed(() => payload.value?.questions || [])
const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

const isSingleChoice = computed(() => {
  return ['mcq_single', 'true_false'].includes(currentQuestion.value?.question_type_code)
})

const isMultipleChoice = computed(() => {
  return currentQuestion.value?.question_type_code === 'mcq_multiple'
})

const formattedTime = computed(() => {
  const total = Math.max(0, remainingSeconds.value || 0)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const logActivity = async (
  eventCode: string,
  payload: Record<string, any> = {}
) => {
  try {
    await api.applicantLogAssessmentAttemptActivity(props.attemptId, {
      event_code: eventCode,
      assessment_question_id: currentQuestion.value?.assessment_question_id || null,
      question_id: currentQuestion.value?.question_id || null,
      event_payload_json: {
        current_index: currentIndex.value,
        remaining_seconds: remainingSeconds.value,
        ...payload,
      },
    })
  } catch {
    // Do not disturb applicant attempt if monitoring log fails.
  }
}
const loadAttempt = async () => {
  loading.value = true

  try {
    const response: any = await api.applicantGetAssessmentAttempt(props.attemptId)
    payload.value = response?.data || null
    remainingSeconds.value = Number(payload.value?.remaining_seconds || 0)
    loadCurrentAnswer()
    startTimer()
    startHeartbeat()
    await logActivity('heartbeat', { source: 'attempt_loaded' })
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load attempt.')
  } finally {
    loading.value = false
  }
}

const startTimer = () => {
  if (timerHandle) {
    clearInterval(timerHandle)
  }

  timerHandle = setInterval(async () => {
    remainingSeconds.value -= 1

    if (remainingSeconds.value <= 0) {
      clearInterval(timerHandle)
      await submitAttempt(true)
    }
  }, 1000)
}
const startHeartbeat = () => {
  if (heartbeatHandle) {
    clearInterval(heartbeatHandle)
  }

  heartbeatHandle = setInterval(() => {
    logActivity('heartbeat')
  }, 30000)
}
const handleVisibilityChange = () => {
  if (document.hidden) {
    logActivity('tab_hidden')
  } else {
    logActivity('tab_visible')
  }
}

const handleWindowBlur = () => {
  logActivity('browser_focus_lost')
}

const handleWindowFocus = () => {
  logActivity('browser_focus_returned')
}

const handleOffline = () => {
  logActivity('network_offline')
}

const handleOnline = () => {
  logActivity('network_online')
}
const loadCurrentAnswer = () => {
  const q = currentQuestion.value
  const existing = q?.existing_answer

  singleSelected.value = null
  multipleSelected.value = []
  answerText.value = ''
  answerNumber.value = null

  if (!existing) return

  const selected = existing.selected_option_ids_json || []

  if (isSingleChoice.value) {
    singleSelected.value = selected[0] || null
  } else if (isMultipleChoice.value) {
    multipleSelected.value = selected
  } else if (q.question_type_code === 'numeric') {
    answerNumber.value = existing.answer_number
  } else {
    answerText.value = existing.answer_text || ''
  }
}

watch(currentIndex, loadCurrentAnswer)

const isAnswered = (q: any) => {
  const existing = q.existing_answer

  if (!existing) return false

  return !!(
    (existing.selected_option_ids_json && existing.selected_option_ids_json.length) ||
    existing.answer_text ||
    existing.answer_number !== null
  )
}

watch(currentIndex, async () => {
  loadCurrentAnswer()

  const qid = currentQuestion.value?.assessment_question_id || null

  if (qid && qid !== lastLoggedQuestionId.value) {
    lastLoggedQuestionId.value = qid

    await logActivity('question_viewed', {
      assessment_question_id: qid,
    })
  }
})

const answerPayload = () => {
  const q = currentQuestion.value

  const payload: any = {
    assessment_question_id: q.assessment_question_id,
    selected_option_ids_json: null,
    answer_text: null,
    answer_number: null,
    time_spent_seconds: null,
  }

  if (isSingleChoice.value) {
    payload.selected_option_ids_json = singleSelected.value ? [singleSelected.value] : []
  } else if (isMultipleChoice.value) {
    payload.selected_option_ids_json = multipleSelected.value || []
  } else if (q.question_type_code === 'numeric') {
    payload.answer_number = answerNumber.value
  } else {
    payload.answer_text = answerText.value
  }

  return payload
}

const saveCurrentAnswer = async () => {
  if (!currentQuestion.value) return

  saving.value = true

  try {
    const response: any = await api.applicantSaveAssessmentAnswer(
      props.attemptId,
      answerPayload()
    )

    const saved = response?.data?.answer
    currentQuestion.value.existing_answer = saved
    payload.value.answered_count = response?.data?.answered_count ?? payload.value.answered_count

    message.success('Answer saved.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save answer.')
  } finally {
    saving.value = false
  }
}

const previousQuestion = async () => {
  await saveCurrentAnswer()
  if (currentIndex.value > 0) currentIndex.value -= 1
}

const nextQuestion = async () => {
  await saveCurrentAnswer()
  if (currentIndex.value < questions.value.length - 1) currentIndex.value += 1
}

const submitAttempt = async (auto = false) => {
  submitting.value = true

  try {
    if (!auto && currentQuestion.value) {
      await saveCurrentAnswer()
    }

    await api.applicantSubmitAssessmentAttempt(props.attemptId)

    message.success(auto ? 'Time is over. Attempt submitted.' : 'Attempt submitted successfully.')
    emit('submitted')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit attempt.')
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadAttempt()

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
})

onBeforeUnmount(() => {
  if (timerHandle) {
    clearInterval(timerHandle)
  }

  if (heartbeatHandle) {
    clearInterval(heartbeatHandle)
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('blur', handleWindowBlur)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
})
</script>

<style scoped>
.attempt-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.timer {
  font-size: 28px;
  font-weight: 700;
  padding: 8px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.timer.danger {
  color: #cf1322;
  border-color: #ff4d4f;
}

.question-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-text {
  font-size: 15px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>