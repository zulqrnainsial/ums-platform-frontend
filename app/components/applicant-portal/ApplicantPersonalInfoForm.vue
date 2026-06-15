<template>
  <a-spin :spinning="saving || loadingOptions">
    <a-alert
  v-if="locked"
  type="warning"
  show-icon
  class="mb-3"
  message="Personal information is locked because your application has already been submitted."
/>
    <a-form layout="vertical" :disabled="locked">
      <a-row :gutter="[16, 0]">
        <a-col :xs="24" :md="12">
          <a-form-item label="First Name" required>
            <a-input v-model:value="form.first_name" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Last Name">
            <a-input v-model:value="form.last_name" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Father Name" required>
            <a-input v-model:value="form.father_name" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Mother Name">
            <a-input v-model:value="form.mother_name" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="CNIC / B-Form">
            <a-input v-model:value="form.cnic_bform" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Passport No">
            <a-input v-model:value="form.passport_no" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Date of Birth">
            <a-date-picker v-model:value="form.date_of_birth" value-format="YYYY-MM-DD" class="w-100" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Gender">
            <a-select v-model:value="form.gender" allow-clear>
              <a-select-option value="male">Male</a-select-option>
              <a-select-option value="female">Female</a-select-option>
              <a-select-option value="other">Other</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Email">
            <a-input v-model:value="form.email" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Phone">
            <a-input v-model:value="form.phone" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Nationality">
            <a-select
              v-model:value="form.nationality_id"
              :options="options.nationalities"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Religion">
            <a-select
              v-model:value="form.religion_id"
              :options="options.religions"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="8">
          <a-form-item label="Country">
            <a-select
              v-model:value="form.country_id"
              :options="options.countries"
              allow-clear
              show-search
              option-filter-prop="label"
              @change="handleCountryChanged"
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="8">
          <a-form-item label="Province">
            <a-select
              v-model:value="form.province_id"
              :options="filteredProvinces"
              allow-clear
              show-search
              option-filter-prop="label"
              @change="handleProvinceChanged"
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="8">
          <a-form-item label="City">
            <a-select
              v-model:value="form.city_id"
              :options="filteredCities"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Current Address">
            <a-textarea v-model:value="form.current_address" :rows="3" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-form-item label="Permanent Address">
            <a-textarea v-model:value="form.permanent_address" :rows="3" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-space>
        <a-button type="primary" :loading="saving" :disabled="locked" @click="save">
          Save Personal Info
        </a-button>
      </a-space>
    </a-form>
  </a-spin>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

const props = defineProps<{
  applicantId: number
  applicant?: any
  locked?: boolean
}>()

const emit = defineEmits<{
  saved: []
}>()

const api = useApplicantPortalApi()

const saving = ref(false)
const loadingOptions = ref(false)

const form = reactive<any>({
  first_name: null,
  last_name: null,
  father_name: null,
  mother_name: null,
  cnic_bform: null,
  passport_no: null,
  date_of_birth: null,
  gender: null,
  email: null,
  phone: null,
  nationality_id: null,
  religion_id: null,
  country_id: null,
  province_id: null,
  city_id: null,
  current_address: null,
  permanent_address: null,
  profile_status_code: 'completed',
  applicant_status_code: 'active',
})

const options = reactive<any>({
  nationalities: [],
  religions: [],
  countries: [],
  provinces: [],
  cities: [],
})

const filteredProvinces = computed(() => {
  if (!form.country_id) return options.provinces
  return options.provinces.filter((x: any) => !x.parent_id || x.parent_id === form.country_id)
})

const filteredCities = computed(() => {
  if (!form.province_id) return options.cities
  return options.cities.filter((x: any) => !x.parent_id || x.parent_id === form.province_id)
})

const normalizeOptions = (response: any) => {
  return (response?.data || []).map((x: any) => ({
    label: x.label || x.name,
    value: x.value || x.id,
    id: x.id,
    code: x.code,
    name: x.name,
    parent_id: x.parent_id,
  }))
}

const loadOptions = async () => {
  loadingOptions.value = true

  try {
    const [
      nationalities,
      religions,
      countries,
      provinces,
      cities,
    ] = await Promise.all([
      api.getOptions('/dynamic-options/lookups/NATIONALITY'),
      api.getOptions('/dynamic-options/lookups/RELIGION'),
      api.getOptions('/dynamic-options/lookups/COUNTRY'),
      api.getOptions('/dynamic-options/lookups/PROVINCE'),
      api.getOptions('/dynamic-options/lookups/CITY'),
    ])

    options.nationalities = normalizeOptions(nationalities)
    options.religions = normalizeOptions(religions)
    options.countries = normalizeOptions(countries)
    options.provinces = normalizeOptions(provinces)
    options.cities = normalizeOptions(cities)
  } finally {
    loadingOptions.value = false
  }
}

const syncForm = () => {
  if (!props.applicant) return

  Object.keys(form).forEach((key) => {
    if (props.applicant[key] !== undefined) {
      form[key] = props.applicant[key]
    }
  })
}

const handleCountryChanged = () => {
  form.province_id = null
  form.city_id = null
}

const handleProvinceChanged = () => {
  form.city_id = null
}

const save = async () => {
  if (props.locked) {
    message.warning('Personal information is locked.')
    return
  }
  saving.value = true

  try {
    if (api.isApplicantSession()) {
        await api.applicantUpdateProfile({ ...form })
    } else {
        await api.updateApplicant(props.applicantId, { ...form })
    }
    message.success('Applicant personal information saved.')
    emit('saved')
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save applicant.')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.applicant,
  () => syncForm(),
  { immediate: true }
)

onMounted(() => {
  loadOptions()
})
</script>

<style scoped>
.w-100 {
  width: 100%;
}
</style>