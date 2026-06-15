<template>
  <div class="auth-page">
    <a-card title="Applicant Registration" class="auth-card">
      <a-alert
        type="info"
        show-icon
        class="mb-3"
        message="Create your applicant account to start admission application."
      />
<NuxtLink
  :to="{
    path: '/applicant',
    query: tenantQuery,
  }"
>
  View Admission Information Before Registration
</NuxtLink>
      <a-form layout="vertical">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="First Name" required>
              <a-input v-model:value="form.first_name" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Last Name">
              <a-input v-model:value="form.last_name" />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="Father Name" required>
              <a-input v-model:value="form.father_name" />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="CNIC / B-Form" required>
              <a-input v-model:value="form.cnic_bform" />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="Email" required>
              <a-input v-model:value="form.email" />
            </a-form-item>
          </a-col>

          <a-col :xs="24">
            <a-form-item label="Phone" required>
              <a-input v-model:value="form.phone" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Password" required>
              <a-input-password v-model:value="form.password" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Confirm Password" required>
              <a-input-password v-model:value="form.password_confirmation" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-button type="primary" block :loading="loading" @click="register">
          Register
        </a-button>

        <div class="auth-link">
          Already registered?
          <NuxtLink
  :to="{
    path: '/applicant/login',
    query: tenantQuery,
  }"
>
  Login here
</NuxtLink>
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

const tenantQuery = computed(() => {
  const tenant = route.query.tenant || route.query.tenant_code

  if (!tenant) return {}

  return {
    tenant,
  }
})
const loading = ref(false)

const form = reactive<any>({
  first_name: '',
  last_name: '',
  father_name: '',
  cnic_bform: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})

const register = async () => {
  loading.value = true

  try {
    await auth.register({ ...form })
    message.success('Applicant registered successfully.')
    router.push({
  path: '/applicant/dashboard',
  query: tenantQuery.value,
})
  } catch (error: any) {
    message.error(error?.data?.message || 'Registration failed.')
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
  max-width: 720px;
}

.mb-3 {
  margin-bottom: 16px;
}

.auth-link {
  text-align: center;
  margin-top: 16px;
}
</style>