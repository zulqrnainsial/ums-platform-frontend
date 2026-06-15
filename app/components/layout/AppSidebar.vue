<template>
  <a-menu
    theme="dark"
    mode="inline"
    :selectedKeys="[selectedKey]"
  >
    <template v-for="menu in authStore.menus" :key="menu.code">
      <AppSidebarItem :menu="menu" />
    </template>
  </a-menu>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import AppSidebarItem from './AppSidebarItem.vue'

const authStore = useAuthStore()
const route = useRoute()

const selectedKey = computed(() => route.path)
</script>