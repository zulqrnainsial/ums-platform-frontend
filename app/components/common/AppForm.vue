<template>
  <a-form layout="vertical">
    <a-row :gutter="[16, 0]">
      <a-col
        v-for="field in fields"
        :key="field.id || field.field_name || field.name"
        :span="getSpan(field)"
      >
        <a-form-item
          :label="field.label"
          :required="Boolean(field.is_required)"
        >
          <AppFieldRenderer
            v-model="model[field.field_name || field.name]"
            :field="field"
            :form-data="model"
          />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<script setup lang="ts">
import AppFieldRenderer from './AppFieldRenderer.vue'

defineProps<{
  fields: any[]
  model: Record<string, any>
}>()

const getSpan = (field: any) => {
  const meta = parseMeta(field?.meta)

  return meta?.span || field?.span || 12
}

const parseMeta = (meta: any) => {
  if (!meta) {
    return {}
  }

  if (typeof meta === 'object') {
    return meta
  }

  try {
    return JSON.parse(meta)
  } catch {
    return {}
  }
}
</script>