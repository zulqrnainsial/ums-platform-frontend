<template>
  <a-sub-menu
    v-if="hasChildren"
    :key="menu.code"
  >
    <template #title>
      <span>{{ menu.title }}</span>
    </template>

    <template
      v-for="child in menu.children"
      :key="child.code"
    >
      <AppSidebarItem :menu="child" />
    </template>
  </a-sub-menu>

  <a-menu-item
    v-else
    :key="menu.route"
    @click="go(menu.route)"
  >
    {{ menu.title }}
  </a-menu-item>
</template>

<script setup lang="ts">
interface MenuItem {
  id: number
  title: string
  code: string
  route: string | null
  icon?: string | null
  children?: MenuItem[]
}

const props = defineProps<{
  menu: MenuItem
}>()

const router = useRouter()

const hasChildren = computed(() => {
  return props.menu.children && props.menu.children.length > 0
})

const go = (route: string | null) => {
  if (!route) return

  router.push(route)
}
</script>