<template>
  <div v-if="layoutReady" class="app-layout">
    <a-layout style="min-height: 100vh">
      <a-layout-sider
        v-model:collapsed="collapsed"
        collapsible
        width="250"
      >
        <div class="logo">
          UMS
        </div>

        <AppSidebar />
      </a-layout-sider>

      <a-layout>
        <a-layout-header class="app-header">
          <AppHeader />
        </a-layout-header>

        <a-layout-content class="app-content">
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { ref } from 'vue';
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()
const layoutReady = ref(false)

onMounted(async () => {
  if (!authStore.isAuthenticated || !authStore.user || authStore.menus.length === 0) {
    await authStore.initializeAuth()
  }

  layoutReady.value = true
})
const collapsed = ref(false)
</script>

<style scoped>
.logo {
  height: 64px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 20px;
}

.app-header {
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.app-content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  min-height: calc(100vh - 96px);
}
</style>