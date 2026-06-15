<template>
  <AppLayout>
    <div class="eligibility-page">
      <a-page-header
        title="Eligibility Builder"
        sub-title="Configure complete program eligibility in one screen"
      />

      <a-card class="mb-3">
        <a-row :gutter="[16, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="Offered Program">
              <a-select
                v-model:value="selectedOfferedProgramId"
                :options="lookups.offered_programs"
                show-search
                option-filter-prop="label"
                placeholder="Select offered program"
                @change="handleOfferedProgramChanged"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item label="Quota / Seat Category">
              <a-select
                v-model:value="policy.program_quota_seat_id"
                :options="quotaOptions"
                allow-clear
                show-search
                option-filter-prop="label"
                placeholder="Leave empty for program-level policy"
                :disabled="!selectedOfferedProgramId"
                @change="loadPolicy"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!selectedOfferedProgramId"
          description="Select offered program to configure eligibility"
        />

        <template v-else>
          <a-card v-if="selectedOfferedProgram" title="Selected Offered Program" class="mb-3">
            <a-descriptions bordered size="small" :column="3">
              <a-descriptions-item label="Code">
                {{ selectedOfferedProgram.code || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Title">
                {{ selectedOfferedProgram.title || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Shift">
                {{ selectedOfferedProgram.shift_code || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Application Start">
                {{ selectedOfferedProgram.application_start_date || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Application End">
                {{ selectedOfferedProgram.application_end_date || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Application Fee">
                {{ selectedOfferedProgram.application_fee ?? '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Admission Fee">
                {{ selectedOfferedProgram.admission_fee ?? '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Published">
                {{ selectedOfferedProgram.is_published ? 'Yes' : 'No' }}
              </a-descriptions-item>

              <a-descriptions-item label="Status">
                {{ selectedOfferedProgram.status_code || '-' }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>

          <a-alert
            type="info"
            show-icon
            class="mb-3"
            :message="policy.program_quota_seat_id ? 'You are editing quota-specific eligibility. It will apply only to the selected quota.' : 'You are editing program-level eligibility. It will apply when no quota-specific policy exists.'"
          />

          <a-card title="Qualification Requirements" class="mb-3">
            <template #extra>
              <a-button type="primary" size="small" @click="addQualification">
                Add Qualification
              </a-button>
            </template>

            <a-empty
              v-if="policy.qualifications.length === 0"
              description="No qualification requirement added"
            />

            <a-card
              v-for="(item, index) in policy.qualifications"
              :key="index"
              size="small"
              class="nested-card"
            >
              <template #title>
                Requirement {{ Number(index) + 1 }}
              </template>

              <template #extra>
                <a-button danger size="small" @click="removeQualification(Number(index))">
                  Remove
                </a-button>
              </template>

              <a-row :gutter="[16, 0]">
                <a-col :xs="24" :md="8">
                  <a-form-item label="Qualification Level">
                    <a-select
  v-model:value="item.qualification_level_ids"
  :options="lookups.qualification_levels"
  mode="multiple"
  show-search
  option-filter-prop="label"
/>
                  </a-form-item>
                </a-col>

                <a-col :xs="22" :md="8">
                  <a-form-item label="Allowed Subject Groups">
                    <a-select
  v-model:value="item.subject_group_ids"
  :options="lookups.subject_groups"
  mode="multiple"
  show-search
  option-filter-prop="label"
/>
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :md="5">
                  <a-form-item label="Min %">
                    <a-input-number v-model:value="item.minimum_percentage" class="w-100" />
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :md="3">
                  <a-form-item label="Required">
                    <a-switch v-model:checked="item.required" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>
          </a-card>

          <a-card title="Admission Test Policy" class="mb-3">
            <a-row :gutter="[16, 0]">
              <a-col :xs="24" :md="6">
                <a-form-item label="Test Required">
                  <a-switch v-model:checked="policy.tests.required" />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="10">
                <a-form-item label="Accepted Tests">
                  <a-select
  v-model:value="policy.tests.accepted_assessment_ids"
  :options="assessmentOptions"
  mode="multiple"
  show-search
  option-filter-prop="label"
  option-label-prop="label"
  placeholder="Select assessment / admission test"
/>
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-form-item label="Min %">
                  <a-input-number v-model:value="policy.tests.minimum_percentage" class="w-100" />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-form-item label="Min Marks">
                  <a-input-number v-model:value="policy.tests.minimum_marks" class="w-100" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Required Documents" class="mb-3">
            <a-form-item label="Document Types Required">
              <a-select
  v-model:value="policy.documents.required_document_type_ids"
  :options="lookups.document_types"
  mode="multiple"
  show-search
  option-filter-prop="label"
/>
            </a-form-item>
          </a-card>

          <a-card title="Other Rules" class="mb-3">
            <a-row :gutter="[16, 0]">
              <a-col :xs="24" :md="8">
                <a-form-item label="Age Rule Enabled">
                  <a-switch v-model:checked="policy.age.enabled" />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="8">
                <a-form-item label="Age Operator">
                  <a-select v-model:value="policy.age.operator">
                    <a-select-option value="<=">&lt;=</a-select-option>
                    <a-select-option value=">=">&gt;=</a-select-option>
                    <a-select-option value="<">&lt;</a-select-option>
                    <a-select-option value=">">&gt;</a-select-option>
                    <a-select-option value="=">=</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="8">
                <a-form-item label="Age Value">
                  <a-input-number v-model:value="policy.age.value" class="w-100" />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="8">
                <a-form-item label="Gender Rule Enabled">
                  <a-switch v-model:checked="policy.gender.enabled" />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :md="16">
                <a-form-item label="Allowed Genders">
                  <a-select
                    v-model:value="policy.gender.allowed_values"
                    :options="lookups.genders"
                    mode="multiple"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>

          <div class="action-bar">
            <a-button type="primary" size="large" :loading="saving" @click="savePolicy">
              Save Eligibility Policy
            </a-button>
          </div>
        </template>
      </a-spin>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()

const loading = ref(false)
const saving = ref(false)
const selectedOfferedProgramId = ref<number | null>(null)
const selectedOfferedProgram = ref<any>(null)
const quotaOptions = ref<any[]>([])

const lookups = reactive<any>({
  offered_programs: [],
  qualification_levels: [],
  subject_groups: [],
  assessments: [],
  document_types: [],
  test_types: [], // keep only for backward compatibility
  genders: [],
  domicile_provinces: [],
  domicile_districts: [],
})
const emptyPolicy = () => ({
  program_quota_seat_id: null,
  qualifications: [],
  tests: {
    required: false,
    accepted_assessment_ids: [],
    accepted_test_codes: [],
    minimum_percentage: null,
    minimum_marks: null,
    minimum_percentile: null,
  },
documents: {
  required_document_type_ids: [],
},
  age: {
    enabled: false,
    operator: '<=',
    value: null,
  },
  gender: {
    enabled: false,
    allowed_values: [],
  },
  domicile: {
    enabled: false,
    province_ids: [],
    district_ids: [],
  },
})

const policy = reactive<any>(emptyPolicy())
const assessmentOptions = computed(() => {
  return (lookups.assessments || []).map((item: any) => {
    const value = String(item.value ?? item.id)

    const label =
      item.label ||
      item.title ||
      item.name ||
      item.code ||
      `Assessment #${value}`

    return {
      label,
      value,
      id: Number(item.id ?? item.value),
      code: item.code,
      title: item.title || label,
    }
  })
})
const resetPolicy = () => {
  Object.assign(policy, emptyPolicy())
}
const normalizeIdOptions = (items: any[] = []) => {
  const toId = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null

    const numeric = Number(value)

    return Number.isFinite(numeric) && numeric > 0 ? numeric : null
  }

  return (items || [])
    .map((item: any) => {
      const id = toId(item.id ?? item.value)

      const label =
        item.label ||
        item.name ||
        item.title ||
        item.description ||
        item.code ||
        (id ? String(id) : '')

      return {
        label: String(label),
        value: id,
        id,
        code: item.code ?? null,
      }
    })
    .filter((item: any) => item.id !== null)
}
const loadLookups = async () => {
  loading.value = true

  try {
    const response: any = await api.getEligibilityPolicyLookups()
    const data = response?.data || {}

    lookups.offered_programs = data.offered_programs || []
    lookups.qualification_levels = normalizeIdOptions(data.qualification_levels || [])
    lookups.subject_groups = normalizeIdOptions(data.subject_groups || [])
    lookups.assessments = data.assessments || []
    
    lookups.test_types = data.test_types || []
    lookups.document_types = normalizeIdOptions(data.document_types || [])
    lookups.genders = data.genders || []
    lookups.domicile_provinces = data.domicile_provinces || []
    lookups.domicile_districts = data.domicile_districts || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load eligibility builder lookups.')
  } finally {
    loading.value = false
  }
}

const handleOfferedProgramChanged = async () => {
  policy.program_quota_seat_id = null
  quotaOptions.value = []
  selectedOfferedProgram.value = null
  await loadPolicy()
}

const loadPolicy = async () => {
  if (!selectedOfferedProgramId.value) {
    resetPolicy()
    quotaOptions.value = []
    selectedOfferedProgram.value = null
    return
  }

  loading.value = true

  try {
    const quotaId = policy.program_quota_seat_id

    const response: any = await api.getEligibilityPolicy(
      selectedOfferedProgramId.value,
      quotaId
    )

    selectedOfferedProgram.value = response?.data?.offered_program || null
    quotaOptions.value = response?.data?.quota_options || []

    const dataPolicy = response?.data?.policy || emptyPolicy()

    Object.assign(policy, emptyPolicy(), dataPolicy, {
      program_quota_seat_id: quotaId,
    })
    policy.tests.accepted_assessment_ids = (
      policy.tests.accepted_assessment_ids ||
      policy.tests.accepted_test_ids ||
      []
    ).map((x: any) => String(x))
    
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load eligibility policy.')
  } finally {
    loading.value = false
  }
}

const addQualification = () => {
  policy.qualifications.push({
    qualification_level_ids: [],
    subject_group_ids: [],
    minimum_percentage: null,
    minimum_marks: null,
    minimum_cgpa: null,
    required: true,
  })
}

const removeQualification = (index: number) => {
  policy.qualifications.splice(index, 1)
}

const savePolicy = async () => {
  if (!selectedOfferedProgramId.value) {
    message.error('Please select offered program.')
    return
  }

  saving.value = true

  try {
    await api.saveEligibilityPolicy(selectedOfferedProgramId.value, {
  program_quota_seat_id: policy.program_quota_seat_id,
  qualifications: policy.qualifications.map((item: any) => ({
    ...item,
    qualification_level_ids: (item.qualification_level_ids || []).map((id: any) => Number(id)),
    subject_group_ids: (item.subject_group_ids || []).map((id: any) => Number(id)),
  })),
  tests: {
    ...policy.tests,
    accepted_assessment_ids: (policy.tests.accepted_assessment_ids || [])
      .map((x: any) => Number(x))
      .filter((x: any) => Number.isFinite(x)),
  },
  documents: {
    ...policy.documents,
    required_document_type_ids: (policy.documents.required_document_type_ids || []).map((id: any) => Number(id)),
  },
  age: policy.age,
  gender: policy.gender,
  domicile: policy.domicile,
})

    message.success('Eligibility policy saved successfully.')
    await loadPolicy()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save eligibility policy.')
  } finally {
    saving.value = false
  }
}

onMounted(loadLookups)
</script>

<style scoped>
.eligibility-page {
  padding: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}

.nested-card {
  margin-bottom: 12px;
}

.w-100 {
  width: 100%;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
