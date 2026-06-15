<template>
  <AppLayout>
    <div class="page-container">
      <a-page-header title="Dashboard" sub-title="University Management System" />

      <a-row :gutter="[16, 16]">
        <a-col :span="6">
          <a-card>
            <a-statistic title="Tenants" :value="0" />
          </a-card>
        </a-col>

        <a-col :span="6">
          <a-card>
            <a-statistic title="Students" :value="0" />
          </a-card>
        </a-col>

        <a-col :span="6">
          <a-card>
            <a-statistic title="Employees" :value="0" />
          </a-card>
        </a-col>

        <a-col :span="6">
          <a-card>
            <a-statistic title="Today Collection" :value="0" prefix="Rs." />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '~/components/layout/AppLayout.vue'
</script>