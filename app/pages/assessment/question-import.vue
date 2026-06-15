<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Question Import</h2>
          <p>Bulk import questions from Excel into the assessment question bank.</p>
        </div>

        <a-button @click="goToQuestions">
          Back to Questions
        </a-button>
      </div>

      <QuestionImportPanel />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '~/components/layout/AppLayout.vue'
import QuestionImportPanel from '~/components/assessment/QuestionImportPanel.vue'

const router = useRouter()

const goToQuestions = () => {
  router.push('/assessment/questions')
}
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin-bottom: 4px;
}

.page-header p {
  margin-bottom: 0;
  color: #888;
}
</style>