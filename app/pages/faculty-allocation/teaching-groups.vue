<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Teaching Groups</h2>
          <p>Create theory/practical/lab groups and assign students.</p>
        </div>

        <a-space>
          <NuxtLink to="/faculty-allocation/allocations">
            <a-button>Faculty Allocation</a-button>
          </NuxtLink>

          <a-button @click="loadAll">Refresh</a-button>
        </a-space>
      </div>

      <a-card title="Filters / Scope" class="mb-3">
        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="6">
            <label>Academic Session</label>
            <a-select
              v-model:value="scope.academic_session_id"
              show-search
              allow-clear
              option-filter-prop="label"
              style="width: 100%"
              :options="context.academic_sessions"
              @change="reloadContext"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Program</label>
            <a-select
              v-model:value="scope.program_id"
              show-search
              allow-clear
              option-filter-prop="label"
              style="width: 100%"
              :options="context.programs"
              @change="reloadContext"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Academic Term</label>
            <a-select
              v-model:value="scope.academic_term_id"
              show-search
              allow-clear
              option-filter-prop="label"
              style="width: 100%"
              :options="context.academic_terms"
              @change="reloadContext"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Batch</label>
            <a-select
              v-model:value="scope.student_batch_id"
              show-search
              allow-clear
              option-filter-prop="label"
              style="width: 100%"
              :options="context.student_batches"
              @change="reloadContext"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Section</label>
            <a-select
              v-model:value="scope.section_id"
              show-search
              allow-clear
              option-filter-prop="label"
              style="width: 100%"
              :options="context.sections"
            />
          </a-col>

          <a-col :xs="24" :md="6">
            <label>Group Type</label>
            <a-select
              v-model:value="groupTypeFilter"
              allow-clear
              style="width: 100%"
              :options="groupTypeOptions"
              @change="loadGroups"
            />
          </a-col>

          <a-col :xs="24" :md="6" class="action-col">
            <a-button type="primary" block @click="loadGroups">
              Load Groups
            </a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="manual" tab="Create Group">
          <a-card title="Create Teaching Group" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="5">
                <label>Group Code</label>
                <a-input v-model:value="groupForm.group_code" placeholder="PG-A" />
              </a-col>

              <a-col :xs="24" :md="7">
                <label>Group Name</label>
                <a-input v-model:value="groupForm.group_name" placeholder="Practical Group A" />
              </a-col>

              <a-col :xs="24" :md="5">
                <label>Group Type</label>
                <a-select
                  v-model:value="groupForm.group_type_code"
                  style="width: 100%"
                  :options="groupTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="3">
                <label>Capacity</label>
                <a-input-number
                  v-model:value="groupForm.capacity"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4" class="action-col">
                <a-button
                  type="primary"
                  block
                  :loading="savingGroup"
                  @click="saveGroup"
                >
                  Save Group
                </a-button>
              </a-col>
            </a-row>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="auto" tab="Auto Practical Groups">
          <a-card title="Create Practical Groups from Section" class="mb-3">
            <a-alert
              class="mb-3"
              type="info"
              show-icon
              message="This will divide eligible students from the selected section into practical/lab groups."
            />

            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="4">
                <label>Group Count</label>
                <a-input-number
                  v-model:value="autoForm.group_count"
                  style="width: 100%"
                  :min="1"
                  :max="20"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Prefix</label>
                <a-input v-model:value="autoForm.group_prefix" placeholder="PG" />
              </a-col>

              <a-col :xs="24" :md="5">
                <label>Group Type</label>
                <a-select
                  v-model:value="autoForm.group_type_code"
                  style="width: 100%"
                  :options="groupTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Capacity</label>
                <a-input-number
                  v-model:value="autoForm.capacity"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="5" class="action-col">
                <a-button
                  type="primary"
                  danger
                  block
                  :loading="creatingAutoGroups"
                  @click="createAutoGroups"
                >
                  Create Groups
                </a-button>
              </a-col>
            </a-row>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="members" tab="Members">
          <a-row :gutter="[12, 12]">
            <a-col :xs="24" :md="10">
              <a-card title="Teaching Groups">
                <a-table
                  :data-source="groups"
                  row-key="id"
                  size="small"
                  :loading="loadingGroups"
                  :pagination="{ pageSize: 10 }"
                  :row-class-name="rowClassName"
                  @row="groupRowHandler"
                >
                  <a-table-column title="Code" data-index="group_code" />
                  <a-table-column title="Name" data-index="group_name" />
                  <a-table-column title="Type" data-index="group_type_code" />
                  <a-table-column title="Strength" data-index="actual_strength" />
                  <a-table-column title="Capacity" data-index="capacity" />
                </a-table>
              </a-card>
            </a-col>

            <a-col :xs="24" :md="14">
              <a-card>
                <template #title>
                  <span>
                    Members
                    <span v-if="selectedGroup">
                      — {{ selectedGroup.group_code }} {{ selectedGroup.group_name }}
                    </span>
                  </span>
                </template>

                <template #extra>
                  <a-space>
                    <a-button
                      :disabled="!selectedGroup"
                      :loading="loadingEligible"
                      @click="loadEligibleStudents"
                    >
                      Load Eligible
                    </a-button>

                    <a-button
                      type="primary"
                      :disabled="!selectedGroup"
                      :loading="syncingMembers"
                      @click="syncMembers"
                    >
                      Sync Selected
                    </a-button>
                  </a-space>
                </template>

                <a-table
                  :data-source="eligibleStudents"
                  row-key="student_id"
                  size="small"
                  :loading="loadingEligible"
                  :row-selection="rowSelection"
                  :pagination="{ pageSize: 10 }"
                >
                  <a-table-column title="Student No" data-index="student_no" />
                  <a-table-column title="Name" data-index="student_name" />
                  <a-table-column title="Roll No" data-index="roll_no" />
                  <a-table-column title="Registration No" data-index="registration_no" />
                  <a-table-column title="Section" data-index="section" />
                </a-table>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>

        <a-tab-pane key="list" tab="All Groups">
          <a-card title="Teaching Groups">
            <a-table
              :data-source="groups"
              row-key="id"
              size="small"
              :loading="loadingGroups"
              :pagination="{ pageSize: 15 }"
            >
              <a-table-column title="Code" data-index="group_code" />
              <a-table-column title="Name" data-index="group_name" />
              <a-table-column title="Type" data-index="group_type_code" />
              <a-table-column title="Session" data-index="academic_session_name" />
              <a-table-column title="Program" data-index="program_name" />
              <a-table-column title="Batch" data-index="batch_name" />
              <a-table-column title="Section" data-index="section_name" />
              <a-table-column title="Strength" data-index="actual_strength" />
              <a-table-column title="Capacity" data-index="capacity" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message, Modal } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApi()

const activeTab = ref('manual')
const groupTypeFilter = ref<string | undefined>()

const loadingContext = ref(false)
const loadingGroups = ref(false)
const savingGroup = ref(false)
const creatingAutoGroups = ref(false)
const loadingEligible = ref(false)
const syncingMembers = ref(false)

const groups = ref<any[]>([])
const eligibleStudents = ref<any[]>([])
const selectedGroup = ref<any | null>(null)
const selectedStudentRowKeys = ref<number[]>([])

const context = reactive<any>({
  academic_sessions: [],
  academic_terms: [],
  programs: [],
  student_batches: [],
  sections: [],
})

const scope = reactive<any>({
  academic_session_id: undefined,
  academic_term_id: undefined,
  program_id: undefined,
  student_batch_id: undefined,
  section_id: undefined,
})

const groupForm = reactive<any>({
  group_code: '',
  group_name: '',
  group_type_code: 'practical_group',
  capacity: 40,
})

const autoForm = reactive<any>({
  group_count: 5,
  group_prefix: 'PG',
  group_type_code: 'practical_group',
  capacity: 40,
})

const groupTypeOptions = [
  { label: 'Theory Section', value: 'theory_section' },
  { label: 'Practical Group', value: 'practical_group' },
  { label: 'Lab Group', value: 'lab_group' },
  { label: 'Tutorial Group', value: 'tutorial_group' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const contextParams = computed(() => ({
  academic_session_id: scope.academic_session_id || undefined,
  academic_term_id: scope.academic_term_id || undefined,
  program_id: scope.program_id || undefined,
  student_batch_id: scope.student_batch_id || undefined,
  section_id: scope.section_id || undefined,
}))

const loadContext = async () => {
  loadingContext.value = true

  try {
    const response: any = await api.getFacultyAllocationContext(contextParams.value)
    const payload = unwrap(response)

    context.academic_sessions = payload.academic_sessions || []
    context.academic_terms = payload.academic_terms || []
    context.programs = payload.programs || []
    context.student_batches = payload.student_batches || []
    context.sections = payload.sections || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load context.')
  } finally {
    loadingContext.value = false
  }
}

const reloadContext = async () => {
  await loadContext()
}

const groupScopePayload = () => ({
  academic_session_id: scope.academic_session_id,
  academic_term_id: scope.academic_term_id,
  program_id: scope.program_id,
  student_batch_id: scope.student_batch_id,
  section_id: scope.section_id,
})

const validateScope = () => {
  if (!scope.academic_session_id || !scope.academic_term_id || !scope.program_id || !scope.student_batch_id) {
    message.error('Academic session, term, program and batch are required.')
    return false
  }

  return true
}

const loadGroups = async () => {
  loadingGroups.value = true

  try {
    const response: any = await api.getTeachingGroups({
      ...contextParams.value,
      group_type_code: groupTypeFilter.value || undefined,
      per_page: 100,
    })

    const payload = unwrap(response)
    groups.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load teaching groups.')
  } finally {
    loadingGroups.value = false
  }
}

const saveGroup = async () => {
  if (!validateScope()) return

  if (!groupForm.group_code || !groupForm.group_name) {
    message.error('Group code and group name are required.')
    return
  }

  savingGroup.value = true

  try {
    await api.createTeachingGroup({
      ...groupScopePayload(),
      ...groupForm,
      actual_strength: 0,
      status_code: 'active',
    })

    message.success('Teaching group saved.')
    groupForm.group_code = ''
    groupForm.group_name = ''
    await loadGroups()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save teaching group.')
  } finally {
    savingGroup.value = false
  }
}

const createAutoGroups = () => {
  if (!validateScope()) return

  if (!scope.section_id) {
    message.error('Section is required for automatic practical group creation.')
    return
  }

  Modal.confirm({
    title: 'Create practical groups?',
    content: 'This will create groups and distribute eligible students from the selected section.',
    okText: 'Create',
    async onOk() {
      creatingAutoGroups.value = true

      try {
        await api.createPracticalGroupsFromSection({
          ...groupScopePayload(),
          group_count: autoForm.group_count,
          group_prefix: autoForm.group_prefix,
          group_type_code: autoForm.group_type_code,
          capacity: autoForm.capacity,
        })

        message.success('Practical groups created.')
        await loadGroups()
      } catch (error: any) {
        message.error(error?.data?.message || 'Unable to create practical groups.')
      } finally {
        creatingAutoGroups.value = false
      }
    },
  })
}

const loadEligibleStudents = async () => {
  if (!validateScope()) return

  loadingEligible.value = true

  try {
    const response: any = await api.getEligibleStudentsForTeachingGroup({
      academic_session_id: scope.academic_session_id,
      program_id: scope.program_id,
      student_batch_id: scope.student_batch_id,
      section_id: scope.section_id || undefined,
      limit: 1000,
    })

    const payload = unwrap(response)
    eligibleStudents.value = Array.isArray(payload) ? payload : []

    const currentMembersResponse: any = selectedGroup.value
      ? await api.getTeachingGroupMembers(selectedGroup.value.id)
      : null

    const currentMembers = currentMembersResponse ? unwrap(currentMembersResponse) : []
    selectedStudentRowKeys.value = currentMembers.map((row: any) => row.student_id)

    if (eligibleStudents.value.length === 0) {
      message.warning('No eligible students found.')
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load eligible students.')
  } finally {
    loadingEligible.value = false
  }
}

const rowSelection = computed(() => ({
  selectedRowKeys: selectedStudentRowKeys.value,
  onChange: (keys: number[]) => {
    selectedStudentRowKeys.value = keys
  },
}))

const syncMembers = async () => {
  if (!selectedGroup.value) {
    message.error('Select a teaching group first.')
    return
  }

  const rows = eligibleStudents.value
    .filter((student: any) => selectedStudentRowKeys.value.includes(student.student_id))
    .map((student: any) => ({
      student_id: student.student_id,
      student_enrollment_id: student.student_enrollment_id,
      status_code: 'active',
    }))

  syncingMembers.value = true

  try {
    await api.syncTeachingGroupMembers(selectedGroup.value.id, rows)
    message.success('Teaching group members synced.')
    await loadGroups()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to sync members.')
  } finally {
    syncingMembers.value = false
  }
}

const groupRowHandler = (record: any) => {
  return {
    onClick: async () => {
      selectedGroup.value = record
      selectedStudentRowKeys.value = []
      await loadEligibleStudents()
    },
  }
}

const rowClassName = (record: any) => {
  return selectedGroup.value?.id === record.id ? 'selected-row' : ''
}

const loadAll = async () => {
  await loadContext()
  await loadGroups()
}

onMounted(loadAll)
</script>

<style scoped>
.page {
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 16px;
}

.action-col {
  display: flex;
  align-items: flex-end;
}

:deep(.selected-row td) {
  background: #e6f4ff !important;
}
</style>