<template>
  <div class="admission-page">
    <a-card class="admission-card">
      <h2>University Admission Portal</h2>
      <p>Please register or login to continue your admission application.</p>

      <a-space direction="vertical" class="w-100">
        <a-button type="primary" block @click="goRegister">
          Register as Applicant
        </a-button>

        <a-button block @click="goLogin">
          Login as Applicant
        </a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const tenant = computed(() => route.query.tenant)

const goRegister = () => {
  router.push({
    path: '/applicant/register',
    query: tenant.value ? { tenant: tenant.value } : {},
  })
}

const goLogin = () => {
  router.push({
    path: '/applicant/login',
    query: tenant.value ? { tenant: tenant.value } : {},
  })
}
</script>

<style scoped>
.admission-page {
  min-height: 100vh;
  background: #f5f7fb;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.admission-card {
  width: 100%;
  max-width: 460px;
  text-align: center;
}

.w-100 {
  width: 100%;
}
</style>