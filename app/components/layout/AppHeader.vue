<template>
  <div class="header-wrapper">
    <div>
      <strong>University Management System</strong>
    </div>

    <div>
      <a-space>
        <span v-if="authStore.user">
          {{ authStore.user.name }}
        </span>

        <a-tag v-if="authStore.user?.user_type">
          {{ authStore.user.user_type }}
        </a-tag>

        <a-button danger size="small" @click="handleLogout">
          Logout
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/auth/login')
}
</script>

<style scoped>
.header-wrapper {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>