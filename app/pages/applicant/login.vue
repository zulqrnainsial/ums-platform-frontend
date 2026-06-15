<template>
  <div class="auth-page">

    <a-card title="Applicant Login" class="auth-card">
<NuxtLink
  :to="{
    path: '/applicant',
    query: tenantQuery,
  }"
>
  View Admission Information
</NuxtLink>
      <a-form layout="vertical">
        <a-form-item label="Email" required>
          <a-input v-model:value="form.email" />
        </a-form-item>

        <a-form-item label="Password" required>
          <a-input-password v-model:value="form.password" />
        </a-form-item>

        <a-button type="primary" block :loading="loading" @click="login">
          Login
        </a-button>

        <div class="auth-link">
          New applicant?
          <NuxtLink to="/applicant/register">Register here</NuxtLink>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'

const router = useRouter()
const auth = useApplicantAuthApi()
const route = useRoute()
const loading = ref(false)

const form = reactive<any>({
  email: '',
  password: '',
})
const tenantQuery = computed(() => {
  const tenant = route.query.tenant || route.query.tenant_code

  if (!tenant) return {}

  return {
    tenant,
  }
})
const login = async () => {
  loading.value = true

  try {
    await auth.login({ ...form })
    message.success('Login successful.')
    router.push({
  path: '/applicant/dashboard',
  query: tenantQuery.value,
})
  } catch (error: any) {
    message.error(error?.data?.message || 'Login failed.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fb;
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
}

.auth-link {
  text-align: center;
  margin-top: 16px;
}
</style>