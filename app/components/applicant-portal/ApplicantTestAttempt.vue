<template>
  <div class="attempt-page">
    <div class="attempt-header">
      <div>
        <h2>{{ payload.assessment?.title }}</h2>
        <p>
          Attempt No: {{ payload.attempt?.attempt_no }}
          |
          Questions: {{ payload.total_questions }}
          |
          Answered: {{ answeredCount }}
        </p>
      </div>

      <a-space>
        <a-tag color="blue">
          {{ payload.assessment?.duration_minutes || '-' }} minutes
        </a-tag>

        <a-popconfirm title="Submit final attempt?" @confirm="submitAttempt">
          <a-button type="primary" danger>
            Submit Test
          </a-button>
        </a-popconfirm>
      </a-space>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="7">
        <a-card title="Questions" size="small">
          <div class="question-nav">
            <a-button
              v-for="(question, index) in payload.questions"
              :key="question.assessment_question_id"
              size="small"
              :type="index === currentIndex ? 'primary' : isAnswered(question) ? 'default' : 'dashed'"
              @click="currentIndex = Number(index)"
            >
              {{ Number(index) + 1 }}
            </a-button>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="17">
        <a-card v-if="currentQuestion" size="small">
          <template #title>
            Question {{ currentIndex + 1 }}
          </template>

          <template #extra>
            <a-tag>{{ currentQuestion.question_type_code }}</a-tag>
            <a-tag>{{ currentQuestion.marks }} marks</a-tag>
          </template>

          <div class="question-text">
            {{ currentQuestion.question_text }}
          </div>

          <div
            v-if="currentQuestion.question_html"
            class="question-html"
            v-html="currentQuestion.question_html"
          />

          <a-divider />

          <div v-if="currentQuestion.question_type_code === 'mcq_single' || currentQuestion.question_type_code === 'true_false'">
            <a-radio-group v-model:value="answerState.singleOptionId">
              <a-space direction="vertical">
                <a-radio
                  v-for="option in currentQuestion.options"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.option_key }}. {{ option.option_text }}
                </a-radio>
              </a-space>
            </a-radio-group>
          </div>

          <div v-else-if="currentQuestion.question_type_code === 'mcq_multiple'">
            <a-checkbox-group v-model:value="answerState.multipleOptionIds">
              <a-space direction="vertical">
                <a-checkbox
                  v-for="option in currentQuestion.options"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.option_key }}. {{ option.option_text }}
                </a-checkbox>
              </a-space>
            </a-checkbox-group>
          </div>

          <div v-else-if="currentQuestion.question_type_code === 'numeric'">
            <a-input-number
              v-model:value="answerState.answerNumber"
              class="w-100"
              placeholder="Enter numeric answer"
            />
          </div>

          <div v-else>
            <a-textarea
              v-model:value="answerState.answerText"
              :rows="6"
              placeholder="Enter your answer"
            />
          </div>

          <div class="question-actions">
            <a-button @click="previousQuestion" :disabled="currentIndex === 0">
              Previous
            </a-button>

            <a-button type="primary" :loading="saving" @click="saveCurrentAnswer">
              Save Answer
            </a-button>

            <a-button @click="nextQuestion" :disabled="currentIndex === payload.questions.length - 1">
              Next
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{
  attemptPayload: any
}>()

const emit = defineEmits<{
  submitted: [payload?: any]
}>()

const api = useApplicantPortalApi()

const payload = reactive<any>(props.attemptPayload)
const currentIndex = ref(0)
const saving = ref(false)

const answerState = reactive<any>({
  singleOptionId: null,
  multipleOptionIds: [],
  answerText: '',
  answerNumber: null,
})

const answeredMap = reactive<Record<number, boolean>>({})

const currentQuestion = computed(() => payload.questions?.[currentIndex.value] || null)

const answeredCount = computed(() => Object.values(answeredMap).filter(Boolean).length)

function loadExistingAnswer() {
  const question = currentQuestion.value

  answerState.singleOptionId = null
  answerState.multipleOptionIds = []
  answerState.answerText = ''
  answerState.answerNumber = null

  if (!question?.existing_answer) {
    return
  }

  const answer = question.existing_answer

  if (question.question_type_code === 'mcq_single' || question.question_type_code === 'true_false') {
    answerState.singleOptionId = answer.selected_option_ids_json?.[0] || null
  } else if (question.question_type_code === 'mcq_multiple') {
    answerState.multipleOptionIds = answer.selected_option_ids_json || []
  } else if (question.question_type_code === 'numeric') {
    answerState.answerNumber = answer.answer_number
  } else {
    answerState.answerText = answer.answer_text || ''
  }

  answeredMap[question.assessment_question_id] = true
}

watch(currentQuestion, () => {
  loadExistingAnswer()
}, { immediate: true })

const isAnswered = (question: any) => {
  return !!answeredMap[question.assessment_question_id] || !!question.existing_answer
}

const saveCurrentAnswer = async () => {
  const question = currentQuestion.value

  if (!question) return

  saving.value = true

  try {
    let payloadAnswer: any = {
      assessment_question_id: question.assessment_question_id,
    }

    if (question.question_type_code === 'mcq_single' || question.question_type_code === 'true_false') {
      payloadAnswer.selected_option_ids_json = answerState.singleOptionId ? [answerState.singleOptionId] : []
    } else if (question.question_type_code === 'mcq_multiple') {
      payloadAnswer.selected_option_ids_json = answerState.multipleOptionIds || []
    } else if (question.question_type_code === 'numeric') {
      payloadAnswer.answer_number = answerState.answerNumber
    } else {
      payloadAnswer.answer_text = answerState.answerText
    }

    const response: any = await api.applicantSaveAssessmentAnswer(payload.attempt.id, payloadAnswer)

    answeredMap[question.assessment_question_id] = true
    question.existing_answer = response?.data?.answer || null

    message.success('Answer saved.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save answer.')
  } finally {
    saving.value = false
  }
}

const previousQuestion = () => {
  if (currentIndex.value > 0) currentIndex.value--
}

const nextQuestion = () => {
  if (currentIndex.value < payload.questions.length - 1) currentIndex.value++
}

const submitAttempt = async () => {
  try {
    const response: any = await api.applicantSubmitAssessmentAttempt(payload.attempt.id)
    message.success('Test submitted successfully.')
    emit('submitted', response?.data)
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to submit test.')
  }
}
</script>

<style scoped>
.attempt-page {
  padding: 8px;
}

.attempt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.attempt-header h2 {
  margin-bottom: 4px;
}

.question-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.question-html {
  margin-bottom: 12px;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.w-100 {
  width: 100%;
}
</style>