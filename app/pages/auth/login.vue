<template>
  <div class="login-page">
    <a-card class="login-card">
      <div class="login-header">
        <h2>University Management System</h2>
        <p>Login to continue</p>
      </div>

      <a-form layout="vertical" @submit.prevent="handleLogin">
        <a-form-item label="Email" required>
          <a-input
            v-model:value="form.email"
            placeholder="superadmin@ums.test"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Password" required>
          <a-input-password
            v-model:value="form.password"
            placeholder="password"
            size="large"
            @pressEnter="handleLogin"
          />
        </a-form-item>

        <a-form-item label="Tenant Code">
          <a-input
            v-model:value="form.tenant_code"
            placeholder="Leave empty for Super Admin"
            size="large"
            @pressEnter="handleLogin"
          />
        </a-form-item>

        <a-button
          type="primary"
          size="large"
          block
          :loading="authStore.loading"
          @click="handleLogin"
        >
          Login
        </a-button>
      </a-form>

      
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { useAuthStore } from '~/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: 'superadmin@ums.test',
  password: 'password',
  tenant_code: '',
})

const handleLogin = async () => {
  if (!form.email || !form.password) {
    message.error('Email and password are required.')
    return
  }

  try {
    await authStore.login({
      email: form.email,
      password: form.password,
      tenant_code: form.tenant_code || null,
      device_name: 'web',
    })

    message.success('Login successful.')
    router.push('/dashboard')
  } catch (error: any) {
    const errors = error?.data?.errors

    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0]

      if (firstKey && Array.isArray(errors[firstKey])) {
        message.error(errors[firstKey][0])
      } else {
        message.error('Login failed.')
      }
    } else {
      message.error(error?.data?.message || 'Login failed.')
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 420px;
  border-radius: 10px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h2 {
  margin-bottom: 4px;
  font-weight: 700;
}

.login-header p {
  margin: 0;
  color: #666;
}

.login-help {
  margin-top: 16px;
  color: #666;
  font-size: 13px;
  text-align: center;
}
</style>