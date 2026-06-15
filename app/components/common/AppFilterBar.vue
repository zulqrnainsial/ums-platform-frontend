<template>
  <div class="filter-bar">
    <a-input-search
      v-model:value="localFilters.search"
      placeholder="Search"
      class="filter-control"
      allow-clear
      @search="emitSearch"
    />

    <template v-for="filter in filters" :key="filter.field_name">
      <a-input
        v-if="filter.control === 'text'"
        v-model:value="localFilters[filter.field_name]"
        :placeholder="filter.placeholder || filter.label"
        class="filter-control"
        allow-clear
      />

      <a-select
        v-else-if="filter.control === 'select'"
        v-model:value="localFilters[filter.field_name]"
        :placeholder="filter.label"
        class="filter-control"
        allow-clear
      >
        <a-select-option
          v-for="option in filter.options || []"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </a-select-option>
      </a-select>

      <a-date-picker
        v-else-if="filter.control === 'date'"
        v-model:value="localFilters[filter.field_name]"
        value-format="YYYY-MM-DD"
        class="filter-control"
      />
    </template>

    <a-button type="primary" @click="emitSearch">
      Apply
    </a-button>

    <a-button @click="resetFilters">
      Reset
    </a-button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  filters: any[]
}>()

const emit = defineEmits<{
  search: [filters: Record<string, any>]
}>()

const localFilters = reactive<Record<string, any>>({
  search: '',
})

const emitSearch = () => {
  emit('search', { ...localFilters })
}

const resetFilters = () => {
  Object.keys(localFilters).forEach((key) => {
    localFilters[key] = ''
  })

  emitSearch()
}

watch(
  () => props.filters,
  () => {
    props.filters.forEach((filter) => {
      if (!(filter.field_name in localFilters)) {
        localFilters[filter.field_name] = undefined
      }
    })
  },
  { immediate: true }
)
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  max-width: 100%;
}

.filter-control {
  width: 180px;
}

@media (max-width: 992px) {
  .filter-bar {
    justify-content: flex-start;
  }

  .filter-control {
    width: 100%;
    min-width: 220px;
  }
}
</style>
