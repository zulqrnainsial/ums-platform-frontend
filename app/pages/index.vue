<script setup lang="ts">
const token = useCookie<string | null>('auth_token')

if (token.value) {
  navigateTo('/dashboard')
} else {
  navigateTo('/auth/login')
}
</script>

<template>
  <div />
</template>