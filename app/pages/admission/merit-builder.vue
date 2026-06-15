<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Merit Formula Builder</h2>
          <p>Define formula components and assign formula applicability for admission merit generation.</p>
        </div>

        <a-space>
          <a-button @click="loadFormulas">
            Refresh
          </a-button>

          <a-button type="primary" @click="openFormulaCreate">
            New Formula
          </a-button>
        </a-space>
      </div>

      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="8">
          <a-card title="Merit Formulas">
            <a-input-search
              v-model:value="filters.search"
              placeholder="Search formula"
              allow-clear
              class="mb-3"
              @search="loadFormulas"
            />

            <a-table
              :data-source="formulaRows"
              :loading="formulaLoading"
              :pagination="formulaPagination"
              row-key="id"
              size="small"
              @change="handleFormulaTableChanged"
            >
              <a-table-column title="Formula">
                <template #default="{ record }">
                  <a @click="selectFormula(record)">
                    <strong>{{ record.code }}</strong>
                  </a>
                  <div>{{ record.title }}</div>
                  <small>{{ record.formula_type_code }} | {{ record.status_code }}</small>
                </template>
              </a-table-column>

              <a-table-column title="Weight" width="90">
                <template #default="{ record }">
                  {{ record.total_weight }}
                </template>
              </a-table-column>

              <a-table-column title="Action" width="110">
                <template #default="{ record }">
                  <a-space>
                    <a-button size="small" @click="openFormulaEdit(record)">
                      Edit
                    </a-button>

                    <a-popconfirm title="Delete this formula?" @confirm="deleteFormula(record)">
                      <a-button size="small" danger>
                        Del
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </a-table-column>
            </a-table>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-empty
            v-if="!selectedFormulaId"
            description="Select a formula to configure components and applicability."
          />

          <template v-else>
            <a-card class="mb-3">
              <template #title>
                {{ builder.formula?.code }} - {{ builder.formula?.title }}
              </template>

              <template #extra>
                <a-space>
                  <a-tag :color="builder.summary?.is_weight_valid ? 'green' : 'red'">
                    Weight: {{ builder.summary?.configured_weight || 0 }} / {{ builder.summary?.target_weight || 0 }}
                  </a-tag>

                  <a-button size="small" @click="openComponentCreate">
                    Add Component
                  </a-button>

                  <a-button size="small" @click="openApplicabilityCreate">
                    Add Applicability
                  </a-button>
                </a-space>
              </template>

              <a-descriptions bordered size="small" :column="3">
                <a-descriptions-item label="Formula Type">
                  {{ builder.formula?.formula_type_code }}
                </a-descriptions-item>
                <a-descriptions-item label="Total Weight">
                  {{ builder.formula?.total_weight }}
                </a-descriptions-item>
                <a-descriptions-item label="Passing Score">
                  {{ builder.formula?.passing_merit_score || '-' }}
                </a-descriptions-item>
                <a-descriptions-item label="Components">
                  {{ builder.summary?.component_count || 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="Applicabilities">
                  {{ builder.summary?.applicability_count || 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="Status">
                  {{ builder.formula?.status_code }}
                </a-descriptions-item>
              </a-descriptions>

              <a-alert
                v-if="builder.summary && !builder.summary.is_weight_valid"
                type="warning"
                show-icon
                class="mt-3"
                :message="`Component weight does not match formula total. Difference: ${builder.summary.weight_difference}`"
              />
            </a-card>

            <a-card title="Formula Components" class="mb-3">
              <a-table
                :data-source="builder.formula?.components || []"
                :pagination="false"
                row-key="id"
                size="small"
              >
                <a-table-column title="#" data-index="display_order" width="60" />

                <a-table-column title="Component">
                  <template #default="{ record }">
                    <strong>{{ record.code }}</strong>
                    <div>{{ record.title }}</div>
                    <small>{{ record.component_type_code }} | {{ record.source_type_code }}</small>
                  </template>
                </a-table-column>

                <a-table-column title="Source Key" data-index="source_key" width="130" />
                <a-table-column title="Method" data-index="calculation_method_code" width="170" />
                <a-table-column title="Weight" data-index="weight" width="90" />

                <a-table-column title="Flags" width="160">
                  <template #default="{ record }">
                    <a-tag v-if="record.is_required">Required</a-tag>
                    <a-tag v-if="record.include_in_total">Included</a-tag>
                    <a-tag v-if="record.allow_bonus">Bonus</a-tag>
                    <a-tag v-if="record.allow_negative">Negative</a-tag>
                  </template>
                </a-table-column>

                <a-table-column title="Status" data-index="status_code" width="100" />

                <a-table-column title="Action" width="140">
                  <template #default="{ record }">
                    <a-space>
                      <a-button size="small" @click="openComponentEdit(record)">
                        Edit
                      </a-button>

                      <a-popconfirm title="Delete this component?" @confirm="deleteComponent(record)">
                        <a-button size="small" danger>
                          Del
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>

            <a-card title="Formula Applicability">
              <a-table
                :data-source="builder.formula?.applicabilities || []"
                :pagination="false"
                row-key="id"
                size="small"
              >
                <a-table-column title="Scope" data-index="applicability_scope_code" />
                <a-table-column title="Session ID" data-index="admission_session_id" />
                <a-table-column title="Preference Group ID" data-index="admission_preference_group_id" />
                <a-table-column title="Offered Program ID" data-index="offered_program_id" />
                <a-table-column title="Quota ID" data-index="program_quota_seat_id" />
                <a-table-column title="Default" width="90">
                  <template #default="{ record }">
                    <a-tag :color="record.is_default ? 'green' : 'default'">
                      {{ record.is_default ? 'Yes' : 'No' }}
                    </a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="Priority" data-index="priority" width="90" />
                <a-table-column title="Status" data-index="status_code" width="100" />

                <a-table-column title="Action" width="140">
                  <template #default="{ record }">
                    <a-space>
                      <a-button size="small" @click="openApplicabilityEdit(record)">
                        Edit
                      </a-button>

                      <a-popconfirm title="Delete this applicability?" @confirm="deleteApplicability(record)">
                        <a-button size="small" danger>
                          Del
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </a-table-column>
              </a-table>
            </a-card>
          </template>
        </a-col>
      </a-row>

      <a-modal
        v-model:open="formulaOpen"
        :title="formulaForm.id ? 'Edit Merit Formula' : 'New Merit Formula'"
        width="800px"
        @ok="saveFormula"
      >
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Admission Session">
                <a-select
                  v-model:value="formulaForm.admission_session_id"
                  :options="lookups.admissionSessions"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Formula Type" required>
                <a-select
                  v-model:value="formulaForm.formula_type_code"
                  :options="lookups.formulaTypes"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="10">
              <a-form-item label="Code" required>
                <a-input v-model:value="formulaForm.code" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="14">
              <a-form-item label="Title" required>
                <a-input v-model:value="formulaForm.title" />
              </a-form-item>
            </a-col>

            <a-col :xs="24">
              <a-form-item label="Description">
                <a-textarea v-model:value="formulaForm.description" :rows="3" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Total Weight" required>
                <a-input-number v-model:value="formulaForm.total_weight" class="w-100" :min="0" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Passing Merit Score">
                <a-input-number v-model:value="formulaForm.passing_merit_score" class="w-100" :min="0" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Rounding Precision">
                <a-input-number v-model:value="formulaForm.rounding_precision" class="w-100" :min="0" :max="6" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Status" required>
                <a-select v-model:value="formulaForm.status_code" :options="lookups.statuses" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="componentOpen"
        :title="componentForm.id ? 'Edit Formula Component' : 'New Formula Component'"
        width="950px"
        @ok="saveComponent"
      >
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="8">
              <a-form-item label="Code" required>
                <a-input v-model:value="componentForm.code" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="16">
              <a-form-item label="Title" required>
                <a-input v-model:value="componentForm.title" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Component Type" required>
                <a-select v-model:value="componentForm.component_type_code" :options="lookups.componentTypes" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Source Type" required>
                <a-select v-model:value="componentForm.source_type_code" :options="lookups.sourceTypes" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Calculation Method" required>
                <a-select v-model:value="componentForm.calculation_method_code" :options="lookups.calculationMethods" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
                <a-form-item label="Source Key">
                    <a-input
                    v-model:value="componentForm.source_key"
                    placeholder="Auto-filled from selected source"
                    disabled
                    />
                </a-form-item>
                </a-col>

                <a-col
                v-if="componentForm.source_type_code === 'applicant_qualification'"
                :xs="24"
                :md="8"
                >
                <a-form-item label="Qualification Level">
                    <a-select
                    v-model:value="componentForm.source_binding.qualification_level_id"
                    :options="lookups.meritSourceCatalog.qualification_levels"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    placeholder="Select qualification level"
                    />
                </a-form-item>
                </a-col>

                <a-col
                v-if="componentForm.source_type_code === 'applicant_qualification'"
                :xs="24"
                :md="8"
                >
                <a-form-item label="Subject Group">
                    <a-select
                    v-model:value="componentForm.source_binding.subject_group_id"
                    :options="lookups.meritSourceCatalog.subject_groups"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    placeholder="Optional subject group"
                    />
                </a-form-item>
                </a-col>

                <a-col
                v-if="componentForm.source_type_code === 'assessment_result'"
                :xs="24"
                :md="8"
                >
                <a-form-item label="Assessment">
                    <a-select
                    v-model:value="componentForm.source_binding.assessment_id"
                    :options="lookups.meritSourceCatalog.assessments"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    placeholder="Select assessment"
                    />
                </a-form-item>
                </a-col>

                <a-col
                v-if="componentForm.source_type_code === 'document_verified'"
                :xs="24"
                :md="8"
                >
                <a-form-item label="Document Type">
                    <a-select
                    v-model:value="componentForm.source_binding.document_type_id"
                    :options="lookups.meritSourceCatalog.document_types"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    placeholder="Select document type"
                    />
                </a-form-item>
                </a-col>

                <a-col
                v-if="componentForm.source_type_code === 'document_verified'"
                :xs="24"
                :md="8"
                >
                <a-form-item label="Required Verification Status">
                    <a-select
                    v-model:value="componentForm.source_binding.verification_status_code"
                    :options="lookups.meritSourceCatalog.verification_statuses"
                    />
                </a-form-item>
                </a-col>

                <a-col
                v-if="['document_verified', 'fixed_bonus', 'fixed_deduction'].includes(componentForm.source_type_code)"
                :xs="24"
                :md="8"
                >
                <a-form-item label="Bonus/Penalty Marks">
                    <a-input-number
                    v-model:value="componentForm.source_binding.marks"
                    class="w-100"
                    :min="0"
                    :step="0.5"
                    />
                </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Weight" required>
                <a-input-number v-model:value="componentForm.weight" class="w-100" :min="0" :step="0.5" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Display Order">
                <a-input-number v-model:value="componentForm.display_order" class="w-100" :min="0" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Max Raw Marks">
                <a-input-number v-model:value="componentForm.max_raw_marks" class="w-100" :min="0" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Normalize To">
                <a-input-number v-model:value="componentForm.normalize_to" class="w-100" :min="1" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Minimum Required Score">
                <a-input-number v-model:value="componentForm.minimum_required_score" class="w-100" :min="0" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Required">
                <a-switch v-model:checked="componentForm.is_required" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Include In Total">
                <a-switch v-model:checked="componentForm.include_in_total" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Allow Bonus">
                <a-switch v-model:checked="componentForm.allow_bonus" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="6">
              <a-form-item label="Allow Negative">
                <a-switch v-model:checked="componentForm.allow_negative" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Status" required>
                <a-select v-model:value="componentForm.status_code" :options="lookups.statuses" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="applicabilityOpen"
        :title="applicabilityForm.id ? 'Edit Applicability' : 'New Applicability'"
        width="900px"
        @ok="saveApplicability"
      >
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="Applicability Scope" required>
                <a-select
                  v-model:value="applicabilityForm.applicability_scope_code"
                  :options="lookups.applicabilityScopes"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Status" required>
                <a-select v-model:value="applicabilityForm.status_code" :options="lookups.statuses" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Admission Session">
                <a-select
                  v-model:value="applicabilityForm.admission_session_id"
                  :options="lookups.admissionSessions"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Preference Group">
                <a-select
                  v-model:value="applicabilityForm.admission_preference_group_id"
                  :options="lookups.preferenceGroups"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Offered Program">
                <a-select
                  v-model:value="applicabilityForm.offered_program_id"
                  :options="lookups.offeredPrograms"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="12">
              <a-form-item label="Quota / Seat Category">
                <a-select
                  v-model:value="applicabilityForm.program_quota_seat_id"
                  :options="lookups.programQuotaSeats"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Effective From">
                <a-input v-model:value="applicabilityForm.effective_from" type="date" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="8">
              <a-form-item label="Effective To">
                <a-input v-model:value="applicabilityForm.effective_to" type="date" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="4">
              <a-form-item label="Default">
                <a-switch v-model:checked="applicabilityForm.is_default" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :md="4">
              <a-form-item label="Priority">
                <a-input-number v-model:value="applicabilityForm.priority" class="w-100" :min="0" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApplicantPortalApi()
const genApi = useApi()
const formulaLoading = ref(false)
const selectedFormulaId = ref<number | null>(null)

const formulaOpen = ref(false)
const componentOpen = ref(false)
const applicabilityOpen = ref(false)

const formulaRows = ref<any[]>([])

const builder = reactive<any>({
  formula: null,
  summary: null,
})

const filters = reactive<any>({
  search: '',
})

const formulaPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const lookups = reactive<any>({
  admissionSessions: [],
  formulaTypes: [],
  componentTypes: [],
  sourceTypes: [],
  calculationMethods: [],
  applicabilityScopes: [],
  statuses: [],
  preferenceGroups: [],
  offeredPrograms: [],
  programQuotaSeats: [],

  meritSourceCatalog: {
    source_types: [],
    qualification_levels: [],
    subject_groups: [],
    test_types: [],
    document_types: [],
    assessments: [],
    verification_statuses: [],
    calculation_sources: [],
  },
})

const emptyFormulaForm = () => ({
  id: null,
  admission_session_id: null,
  code: '',
  title: '',
  description: '',
  formula_type_code: 'standard',
  total_weight: 100,
  passing_merit_score: null,
  rounding_precision: 2,
  status_code: 'active',
})

const emptyComponentForm = () => ({
  id: null,
  code: '',
  title: '',
  description: '',
  component_type_code: 'qualification',
  source_type_code: 'applicant_qualification',
  source_key: '',
  calculation_method_code: 'percentage_of_marks',
  weight: 0,
  max_raw_marks: null,
  normalize_to: 100,
  minimum_required_score: null,
  is_required: false,
  include_in_total: true,
  allow_bonus: false,
  allow_negative: false,
  conditions_json: null,
  source_mapping_json: null,
  source_binding: {
    qualification_level_id: null,
    subject_group_id: null,
    assessment_id: null,
    document_type_id: null,
    verification_status_code: 'verified',
    marks: null,
  },
  display_order: 1,
  status_code: 'active',
})

const emptyApplicabilityForm = () => ({
  id: null,
  applicability_scope_code: 'session',
  admission_session_id: null,
  admission_preference_group_id: null,
  offered_program_id: null,
  program_quota_seat_id: null,
  effective_from: null,
  effective_to: null,
  is_default: false,
  priority: 100,
  status_code: 'active',
})

const formulaForm = reactive<any>(emptyFormulaForm())
const componentForm = reactive<any>(emptyComponentForm())
const applicabilityForm = reactive<any>(emptyApplicabilityForm())

const normalizeCodeOptions = (items: any[]) => {
  return items.map((item: any) => ({
    label: item.label || item.name || item.title || item.code,
    value: String(item.code || item.value),
    code: String(item.code || item.value),
    id: item.id,
  }))
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
  const responses = await Promise.all([
    api.getOptions('/dynamic-options/admission-sessions'),
    api.getOptions('/dynamic-options/lookups/merit_formula_type'),
    api.getOptions('/dynamic-options/lookups/merit_component_type'),
    api.getOptions('/dynamic-options/lookups/merit_source_type'),
    api.getOptions('/dynamic-options/lookups/merit_calculation_method'),
    api.getOptions('/dynamic-options/lookups/merit_applicability_scope'),
    api.getOptions('/dynamic-options/lookups/record_status'),
    api.getOptions('/dynamic-options/admission-preference-groups'),
    api.getOptions('/dynamic-options/offered-programs'),
    api.getOptions('/dynamic-options/program-quota-seats'),
    genApi.apiFetch('/admission/merit-builder/source-catalog').catch(() => ({
    data: lookups.meritSourceCatalog,
  })),
  ]) as any[]

  const [
    admissionSessions,
    formulaTypes,
    componentTypes,
    sourceTypes,
    calculationMethods,
    applicabilityScopes,
    statuses,
    preferenceGroups,
    offeredPrograms,
    programQuotaSeats,
    meritSourceCatalogResponse,
  ] = responses

  lookups.admissionSessions = normalizeIdOptions(admissionSessions?.data || [])
  lookups.formulaTypes = normalizeCodeOptions(formulaTypes?.data || [])
  lookups.componentTypes = normalizeCodeOptions(componentTypes?.data || [])
  lookups.sourceTypes = normalizeCodeOptions(sourceTypes?.data || [])
  lookups.calculationMethods = normalizeCodeOptions(calculationMethods?.data || [])
  lookups.applicabilityScopes = normalizeCodeOptions(applicabilityScopes?.data || [])
  lookups.statuses = normalizeCodeOptions(statuses?.data || [])
  lookups.preferenceGroups = normalizeIdOptions(preferenceGroups?.data || [])
  lookups.offeredPrograms = normalizeIdOptions(offeredPrograms?.data || [])
  lookups.programQuotaSeats = normalizeIdOptions(programQuotaSeats?.data || [])

  const sourceCatalog =
    meritSourceCatalogResponse?.data?.data ||
    meritSourceCatalogResponse?.data ||
    meritSourceCatalogResponse ||
    lookups.meritSourceCatalog

  lookups.meritSourceCatalog = {
    ...lookups.meritSourceCatalog,
    ...sourceCatalog,
  }

  if (lookups.meritSourceCatalog?.source_types?.length) {
    lookups.sourceTypes = lookups.meritSourceCatalog.source_types
  }
}

const loadFormulas = async () => {
  formulaLoading.value = true

  try {
    const response: any = await api.getMeritBuilderFormulas({
      ...filters,
      page: formulaPagination.current,
      per_page: formulaPagination.pageSize,
    })

    const payload = response?.data || {}

    formulaRows.value = payload.data || []
    formulaPagination.total = payload.total || 0
    formulaPagination.current = payload.current_page || formulaPagination.current
    formulaPagination.pageSize = payload.per_page || formulaPagination.pageSize
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load merit formulas.')
  } finally {
    formulaLoading.value = false
  }
}

const loadBuilder = async () => {
  if (!selectedFormulaId.value) {
    builder.formula = null
    builder.summary = null
    return
  }

  try {
    const response: any = await api.getMeritBuilderFormula(selectedFormulaId.value)
    builder.formula = response?.data?.formula || null
    builder.summary = response?.data?.summary || null
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load formula builder.')
  }
}

const selectFormula = async (record: any) => {
  selectedFormulaId.value = record.id
  await loadBuilder()
}

const handleFormulaTableChanged = async (pager: any) => {
  formulaPagination.current = pager.current
  formulaPagination.pageSize = pager.pageSize
  await loadFormulas()
}

const openFormulaCreate = () => {
  Object.assign(formulaForm, emptyFormulaForm())
  formulaOpen.value = true
}

const openFormulaEdit = (record: any) => {
  Object.assign(formulaForm, emptyFormulaForm(), record)
  formulaOpen.value = true
}
const findOptionByValue = (items: any[], value: any) => {
  return (items || []).find((item: any) => Number(item.value) === Number(value))
}

const applySourceBindingToComponent = (payload: any) => {
  const binding = componentForm.source_binding || {}
  const mapping: any = {}
  const conditions: any = {}

  if (payload.source_type_code === 'applicant_qualification') {
    const level = findOptionByValue(
      lookups.meritSourceCatalog.qualification_levels,
      binding.qualification_level_id
    )

    const group = findOptionByValue(
      lookups.meritSourceCatalog.subject_groups,
      binding.subject_group_id
    )

    mapping.qualification_level_id = binding.qualification_level_id || null
    mapping.qualification_level_code = level?.code || null
    mapping.subject_group_id = binding.subject_group_id || null
    mapping.subject_group_code = group?.code || null

    payload.source_key = level?.code || ''
  }

  if (payload.source_type_code === 'assessment_result') {
    const assessment = findOptionByValue(
      lookups.meritSourceCatalog.assessments,
      binding.assessment_id
    )

    mapping.assessment_id = binding.assessment_id || null
    mapping.assessment_code = assessment?.code || null

    payload.source_key = assessment?.code || ''
  }

  if (payload.source_type_code === 'document_verified') {
    const documentType = findOptionByValue(
      lookups.meritSourceCatalog.document_types,
      binding.document_type_id
    )

    mapping.document_type_id = binding.document_type_id || null
    mapping.document_type_code = documentType?.code || null
    mapping.verification_status_code = binding.verification_status_code || 'verified'
    mapping.marks = binding.marks ?? payload.weight

    conditions.verification_status_code = binding.verification_status_code || 'verified'

    payload.source_key = documentType?.code || ''
    payload.calculation_method_code = 'fixed_marks'

    if (!payload.allow_bonus && !payload.allow_negative) {
      payload.allow_bonus = true
    }

    payload.include_in_total = false
  }

  if (payload.source_type_code === 'fixed_bonus') {
    mapping.marks = binding.marks ?? payload.weight
    payload.allow_bonus = true
    payload.allow_negative = false
    payload.include_in_total = false
    payload.calculation_method_code = 'fixed_marks'
  }

  if (payload.source_type_code === 'fixed_deduction') {
    mapping.marks = binding.marks ?? payload.weight
    payload.allow_negative = true
    payload.allow_bonus = false
    payload.include_in_total = false
    payload.calculation_method_code = 'fixed_marks'
  }

  payload.source_mapping_json = {
    ...(payload.source_mapping_json || {}),
    ...mapping,
  }

  payload.conditions_json = {
    ...(payload.conditions_json || {}),
    ...conditions,
  }

  delete payload.source_binding

  return payload
}
const saveFormula = async () => {
  try {
    const payload = {
      ...formulaForm,
      formula_type_code: String(formulaForm.formula_type_code || 'standard'),
      status_code: String(formulaForm.status_code || 'active'),
    }

    let response: any

    if (formulaForm.id) {
      response = await api.updateMeritBuilderFormula(formulaForm.id, payload)
    } else {
      response = await api.createMeritBuilderFormula(payload)
    }

    formulaOpen.value = false
    message.success('Merit formula saved.')

    await loadFormulas()

    if (!selectedFormulaId.value) {
      selectedFormulaId.value = response?.data?.id || null
      await loadBuilder()
    } else if (selectedFormulaId.value === formulaForm.id) {
      await loadBuilder()
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save formula.')
  }
}

const deleteFormula = async (record: any) => {
  try {
    await api.deleteMeritBuilderFormula(record.id)
    message.success('Merit formula deleted.')

    if (selectedFormulaId.value === record.id) {
      selectedFormulaId.value = null
      builder.formula = null
      builder.summary = null
    }

    await loadFormulas()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to delete formula.')
  }
}

const openComponentCreate = () => {
  Object.assign(componentForm, emptyComponentForm())
  componentOpen.value = true
}

const openComponentEdit = (record: any) => {
  const sourceMapping = record.source_mapping_json || {}
  const conditions = record.conditions_json || {}

  Object.assign(componentForm, emptyComponentForm(), record, {
    source_binding: {
      qualification_level_id: sourceMapping.qualification_level_id || null,
      subject_group_id: sourceMapping.subject_group_id || null,
      assessment_id: sourceMapping.assessment_id || null,
      document_type_id: sourceMapping.document_type_id || null,
      verification_status_code:
        sourceMapping.verification_status_code ||
        conditions.verification_status_code ||
        'verified',
      marks: sourceMapping.marks || record.weight || null,
    },
  })

  componentOpen.value = true
}

const saveComponent = async () => {
  if (!selectedFormulaId.value) return

    try {
        let payload = {
    ...componentForm,
    component_type_code: String(componentForm.component_type_code || ''),
    source_type_code: String(componentForm.source_type_code || ''),
    calculation_method_code: String(componentForm.calculation_method_code || ''),
    status_code: String(componentForm.status_code || 'active'),
    }

    payload = applySourceBindingToComponent(payload)

    if (componentForm.id) {
      await api.updateMeritFormulaComponent(componentForm.id, payload)
    } else {
      await api.createMeritFormulaComponent(selectedFormulaId.value, payload)
    }

    componentOpen.value = false
    message.success('Formula component saved.')
    await loadBuilder()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save component.')
  }
}

const deleteComponent = async (record: any) => {
  try {
    await api.deleteMeritFormulaComponent(record.id)
    message.success('Formula component deleted.')
    await loadBuilder()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to delete component.')
  }
}

const openApplicabilityCreate = () => {
  Object.assign(applicabilityForm, emptyApplicabilityForm())
  applicabilityOpen.value = true
}

const openApplicabilityEdit = (record: any) => {
  Object.assign(applicabilityForm, emptyApplicabilityForm(), record)
  applicabilityOpen.value = true
}

const saveApplicability = async () => {
  if (!selectedFormulaId.value) return

  try {
    const payload = {
      ...applicabilityForm,
      applicability_scope_code: String(applicabilityForm.applicability_scope_code || ''),
      status_code: String(applicabilityForm.status_code || 'active'),
    }

    if (applicabilityForm.id) {
      await api.updateMeritFormulaApplicability(applicabilityForm.id, payload)
    } else {
      await api.createMeritFormulaApplicability(selectedFormulaId.value, payload)
    }

    applicabilityOpen.value = false
    message.success('Formula applicability saved.')
    await loadBuilder()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save applicability.')
  }
}

const deleteApplicability = async (record: any) => {
  try {
    await api.deleteMeritFormulaApplicability(record.id)
    message.success('Formula applicability deleted.')
    await loadBuilder()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to delete applicability.')
  }
}

onMounted(async () => {
  await loadLookups()
  await loadFormulas()
})
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin-bottom: 4px;
}

.page-header p {
  color: #888;
  margin-bottom: 0;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 16px;
}

.w-100 {
  width: 100%;
}
</style>