<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Faculty Allocation</h2>
          <p>Create faculty, course offerings, validate teacher load, and save allocations.</p>
        </div>

        <a-space>
          <a-button @click="loadAll">Refresh</a-button>
        </a-space>
      </div>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="faculty" tab="Faculty">
          <a-card title="Create Faculty Member" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="6">
                <label>Employee No</label>
                <a-input v-model:value="facultyForm.employee_no" placeholder="FAC-001" />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Full Name</label>
                <a-input v-model:value="facultyForm.full_name" placeholder="Dr. Ahmed" />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Email</label>
                <a-input v-model:value="facultyForm.email" placeholder="email@example.com" />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Phone</label>
                <a-input v-model:value="facultyForm.phone" placeholder="Phone" />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Employment Type</label>
                <a-select
                  v-model:value="facultyForm.employment_type_code"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Employment type"
                  style="width: 100%"
                  :options="employmentTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Designation</label>
                <a-select
                  v-model:value="facultyForm.designation_code"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Designation"
                  style="width: 100%"
                  :options="designationOptions"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Faculty Type</label>
                <a-select
                  v-model:value="facultyForm.faculty_type_code"
                  style="width: 100%"
                  :options="facultyTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="6" class="action-col">
                <a-button
                  type="primary"
                  block
                  :loading="savingFaculty"
                  @click="saveFaculty"
                >
                  Save Faculty
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Faculty Members">
            <a-table
              :data-source="facultyMembers"
              row-key="id"
              size="small"
              :loading="loadingFaculty"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Employee No" data-index="employee_no" />
              <a-table-column title="Name" data-index="full_name" />
              <a-table-column title="Email" data-index="email" />
              <a-table-column title="Employment" data-index="employment_type_code" />
              <a-table-column title="Designation" data-index="designation_code" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="policies" tab="Load Policies">
          <a-card title="Create Load Policy" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="6">
                <label>Employment Type</label>
                <a-select
                  v-model:value="policyForm.employment_type_code"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :options="employmentTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Designation</label>
                <a-select
                  v-model:value="policyForm.designation_code"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :options="designationOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Max Credit Hours</label>
                <a-input-number
                  v-model:value="policyForm.max_weekly_credit_hours"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Max Contact Hours</label>
                <a-input-number
                  v-model:value="policyForm.max_weekly_contact_hours"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Max Daily Hours</label>
                <a-input-number
                  v-model:value="policyForm.max_daily_contact_hours"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="policyForm.allow_theory">Theory</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="policyForm.allow_practical">Practical</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="policyForm.allow_lab">Lab</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="policyForm.allow_tutorial">Tutorial</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-button
                  type="primary"
                  block
                  :loading="savingPolicy"
                  @click="savePolicy"
                >
                  Save Policy
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Load Policies">
            <a-table
              :data-source="loadPolicies"
              row-key="id"
              size="small"
              :loading="loadingPolicies"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Employment" data-index="employment_type_code" />
              <a-table-column title="Designation" data-index="designation_code" />
              <a-table-column title="Max Credit" data-index="max_weekly_credit_hours" />
              <a-table-column title="Max Contact" data-index="max_weekly_contact_hours" />
              <a-table-column title="Max Daily" data-index="max_daily_contact_hours" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>
<a-tab-pane key="split-offerings" tab="Split Offerings">
  <a-card title="Create Theory / Practical Split Offerings" class="mb-3">
    <a-alert
      class="mb-3"
      type="info"
      show-icon
      message="Use this to create separate theory offerings by section and practical/lab offerings by teaching group."
    />

    <a-row :gutter="[12, 12]">
      <a-col :xs="24" :md="6">
        <label>Academic Session</label>
        <a-select
          v-model:value="splitForm.academic_session_id"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Session"
          style="width: 100%"
          :options="context.academic_sessions"
          @change="reloadSplitContext"
        />
      </a-col>

      <a-col :xs="24" :md="6">
        <label>Program</label>
        <a-select
          v-model:value="splitForm.program_id"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Program"
          style="width: 100%"
          :options="context.programs"
          @change="reloadSplitContext"
        />
      </a-col>

      <a-col :xs="24" :md="6">
        <label>Academic Term</label>
        <a-select
          v-model:value="splitForm.academic_term_id"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Term"
          style="width: 100%"
          :options="context.academic_terms"
          @change="reloadSplitContext"
        />
      </a-col>

      <a-col :xs="24" :md="6">
        <label>Batch</label>
        <a-select
          v-model:value="splitForm.student_batch_id"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Batch"
          style="width: 100%"
          :options="context.student_batches"
          @change="reloadSplitContext"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label>Curriculum Subject</label>
        <a-select
          v-model:value="splitForm.curriculum_subject_id"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Subject"
          style="width: 100%"
          :options="context.curriculum_subjects"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label>Theory Sections</label>
        <a-select
          v-model:value="splitForm.theory_section_ids"
          mode="multiple"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Select theory sections"
          style="width: 100%"
          :options="context.sections"
        />
      </a-col>

      <a-col :xs="24" :md="8">
        <label>Practical / Lab Groups</label>
        <a-select
          v-model:value="splitForm.practical_group_ids"
          mode="multiple"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="Select practical groups"
          style="width: 100%"
          :options="teachingGroupOptions"
        />
      </a-col>

      <a-col :xs="24" :md="4">
        <label>Theory Credit</label>
        <a-input-number
          v-model:value="splitForm.theory_credit_hours"
          style="width: 100%"
          :min="0"
        />
      </a-col>

      <a-col :xs="24" :md="4">
        <label>Theory Contact</label>
        <a-input-number
          v-model:value="splitForm.theory_contact_hours"
          style="width: 100%"
          :min="0"
        />
      </a-col>

      <a-col :xs="24" :md="4">
        <label>Practical Credit</label>
        <a-input-number
          v-model:value="splitForm.practical_credit_hours"
          style="width: 100%"
          :min="0"
        />
      </a-col>

      <a-col :xs="24" :md="4">
        <label>Practical Contact</label>
        <a-input-number
          v-model:value="splitForm.practical_contact_hours"
          style="width: 100%"
          :min="0"
        />
      </a-col>

      <a-col :xs="24" :md="4">
        <label>Practical Room</label>
        <a-select
          v-model:value="splitForm.practical_room_type_code"
          style="width: 100%"
          :options="roomTypeOptions"
        />
      </a-col>

      <a-col :xs="24" :md="4" class="action-col">
        <a-button
          type="primary"
          block
          :loading="creatingSplitOfferings"
          @click="createSplitOfferings"
        >
          Create Split
        </a-button>
      </a-col>
    </a-row>
  </a-card>
</a-tab-pane>
        <a-tab-pane key="offerings" tab="Course Offerings">
          <a-card title="Create Course Offering" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="6">
                <label>Academic Session</label>
                <a-select
                  v-model:value="offeringForm.academic_session_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Session"
                  style="width: 100%"
                  :options="context.academic_sessions"
                  @change="reloadContext"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Program</label>
                <a-select
                  v-model:value="offeringForm.program_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Program"
                  style="width: 100%"
                  :options="context.programs"
                  @change="reloadContext"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Academic Term</label>
                <a-select
                  v-model:value="offeringForm.academic_term_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Term"
                  style="width: 100%"
                  :options="context.academic_terms"
                  @change="reloadContext"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Batch</label>
                <a-select
                  v-model:value="offeringForm.student_batch_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Batch"
                  style="width: 100%"
                  :options="context.student_batches"
                  @change="reloadContext"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Section</label>
                <a-select
                  v-model:value="offeringForm.section_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Section"
                  style="width: 100%"
                  :options="context.sections"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Curriculum Subject</label>
                <a-select
                  v-model:value="offeringForm.curriculum_subject_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Subject"
                  style="width: 100%"
                  :options="context.curriculum_subjects"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Subject Type</label>
                <a-select
                  v-model:value="offeringForm.subject_type_code"
                  style="width: 100%"
                  :options="subjectTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Credit Hours</label>
                <a-input-number
                  v-model:value="offeringForm.credit_hours"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Contact Hours</label>
                <a-input-number
                  v-model:value="offeringForm.contact_hours_per_week"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Room Type</label>
                <a-select
                  v-model:value="offeringForm.required_room_type_code"
                  style="width: 100%"
                  :options="roomTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Capacity</label>
                <a-input-number
                  v-model:value="offeringForm.required_capacity"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="offeringForm.requires_multimedia">
                  Multimedia
                </a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="offeringForm.requires_lab">
                  Lab Required
                </a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-button
                  type="primary"
                  block
                  :loading="savingOffering"
                  @click="saveOffering"
                >
                  Save Offering
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Course Offerings">
            <a-table
              :data-source="courseOfferings"
              row-key="id"
              size="small"
              :loading="loadingOfferings"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Course Code" data-index="course_code" />
              <a-table-column title="Course Title" data-index="course_title" />
              <a-table-column title="Type" data-index="subject_type_code" />
              <a-table-column title="Program" data-index="program_name" />
              <a-table-column title="Batch" data-index="batch_name" />
              <a-table-column title="Section" data-index="section_name" />
              <a-table-column title="Credit" data-index="credit_hours" />
              <a-table-column title="Contact" data-index="contact_hours_per_week" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="allocations" tab="Allocations">
          <a-card title="Validate / Save Teacher Allocation" class="mb-3">
            <a-alert
  class="mb-3"
  type="info"
  show-icon
  message="Use filters to isolate theory section offerings or practical/lab group offerings before assigning teachers."
/>

<a-row :gutter="[12, 12]" class="mb-3">
  <a-col :xs="24" :md="6">
    <label>Offering Type Filter</label>
    <a-select
      v-model:value="allocationOfferingFilters.subject_type_code"
      allow-clear
      placeholder="Theory / Practical / Lab"
      style="width: 100%"
      :options="subjectTypeOptions"
    />
  </a-col>

  <a-col :xs="24" :md="6">
    <label>Section Filter</label>
    <a-select
      v-model:value="allocationOfferingFilters.section_id"
      allow-clear
      show-search
      option-filter-prop="label"
      placeholder="Section"
      style="width: 100%"
      :options="context.sections"
    />
  </a-col>

  <a-col :xs="24" :md="6">
    <label>Teaching Group Filter</label>
    <a-select
      v-model:value="allocationOfferingFilters.academic_teaching_group_id"
      allow-clear
      show-search
      option-filter-prop="label"
      placeholder="Practical / Lab group"
      style="width: 100%"
      :options="allocationTeachingGroupOptions"
    />
  </a-col>

  <a-col :xs="24" :md="6" class="action-col">
    <a-button block @click="clearAllocationOfferingFilters">
      Clear Filters
    </a-button>
  </a-col>
</a-row>
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="8">
                <label>Course Offering</label>
                <a-select
                  v-model:value="allocationForm.course_offering_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Select offering"
                  style="width: 100%"
                  :options="courseOfferingOptions"
                />
              </a-col>

              <a-col :xs="24" :md="8">
                <label>Faculty Member</label>
                <a-select
                  v-model:value="allocationForm.faculty_member_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="Select faculty"
                  style="width: 100%"
                  :options="facultyOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Role</label>
                <a-select
                  v-model:value="allocationForm.allocation_role_code"
                  style="width: 100%"
                  :options="allocationRoleOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Contact Hours</label>
                <a-input-number
                  v-model:value="allocationForm.allocated_contact_hours"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <a-button
                  block
                  :loading="validatingAllocation"
                  @click="validateAllocation"
                >
                  Validate
                </a-button>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-button
                  type="primary"
                  block
                  :loading="savingAllocation"
                  @click="saveAllocation"
                >
                  Save Allocation
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-alert
            v-if="validationResult"
            class="mb-3"
            :type="validationResult.valid ? 'success' : 'error'"
            show-icon
            :message="validationResult.valid ? 'Allocation is valid' : 'Allocation has blocking conflicts'"
          />

          <a-card v-if="validationResult?.conflicts?.length" title="Validation Conflicts" class="mb-3">
            <a-table
              :data-source="validationResult.conflicts"
              row-key="conflict_code"
              size="small"
              :pagination="false"
            >
              <a-table-column title="Code" data-index="conflict_code" />
              <a-table-column title="Severity" data-index="conflict_severity" />
              <a-table-column title="Message" data-index="conflict_message" />
            </a-table>
          </a-card>

          <a-card title="Teacher Allocations">
            <a-table
              :data-source="teacherAllocations"
              row-key="id"
              size="small"
              :loading="loadingAllocations"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Course">
  <template #default="{ record }">
    <div>
      <strong>{{ record.course_code || '-' }}</strong>
      <div>{{ record.course_title || '-' }}</div>
    </div>
  </template>
</a-table-column>

<a-table-column title="Offering">
  <template #default="{ record }">
    <a-tag>{{ record.subject_type_code }}</a-tag>
    <div v-if="record.teaching_group_name">
      {{ record.teaching_group_code }} - {{ record.teaching_group_name }}
    </div>
    <div v-else-if="record.section_name">
      {{ record.section_code }} - {{ record.section_name }}
    </div>
    <div v-else>
      No scope
    </div>
  </template>
</a-table-column>
              <a-table-column title="Faculty" data-index="faculty_name" />
              <a-table-column title="Role" data-index="allocation_role_code" />
              <a-table-column title="Credit" data-index="allocated_credit_hours" />
              <a-table-column title="Contact" data-index="allocated_contact_hours" />
              <a-table-column title="Status">
                <template #default="{ record }">
                  <a-tag :color="allocationStatusColor(record.allocation_status_code)">
                    {{ record.allocation_status_code }}
                  </a-tag>
                </template>
              </a-table-column>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="conflicts" tab="Conflicts">
          <a-card title="Faculty Allocation Conflicts">
            <a-table
              :data-source="conflicts"
              row-key="id"
              size="small"
              :loading="loadingConflicts"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Faculty" data-index="faculty_name" />
              <a-table-column title="Course" data-index="course_title" />
              <a-table-column title="Code" data-index="conflict_code" />
              <a-table-column title="Severity">
                <template #default="{ record }">
                  <a-tag :color="conflictSeverityColor(record.conflict_severity)">
                    {{ record.conflict_severity }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="Message" data-index="conflict_message" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'

const api = useApi()

const activeTab = ref('faculty')

const loadingContext = ref(false)
const loadingFaculty = ref(false)
const loadingPolicies = ref(false)
const loadingOfferings = ref(false)
const loadingAllocations = ref(false)
const loadingConflicts = ref(false)

const savingFaculty = ref(false)
const savingPolicy = ref(false)
const savingOffering = ref(false)
const validatingAllocation = ref(false)
const savingAllocation = ref(false)

const facultyMembers = ref<any[]>([])
const loadPolicies = ref<any[]>([])
const courseOfferings = ref<any[]>([])
const teacherAllocations = ref<any[]>([])
const conflicts = ref<any[]>([])
const validationResult = ref<any>(null)

const creatingSplitOfferings = ref(false)
const splitTeachingGroups = ref<any[]>([])
const allocationTeachingGroups = ref<any[]>([])
const allocationOfferingFilters = reactive<any>({
  subject_type_code: undefined,
  section_id: undefined,
  academic_teaching_group_id: undefined,
})

const context = reactive<any>({
  academic_sessions: [],
  academic_terms: [],
  programs: [],
  student_batches: [],
  sections: [],
  curriculum_subjects: [],
  faculty_members: [],
  employment_types: [],
  designations: [],
  subject_types: [],
})

const facultyForm = reactive<any>({
  employee_no: '',
  full_name: '',
  email: '',
  phone: '',
  employment_type_code: 'permanent',
  designation_code: undefined,
  faculty_type_code: 'teaching',
  status_code: 'active',
})

const policyForm = reactive<any>({
  employment_type_code: 'permanent',
  designation_code: undefined,
  faculty_type_code: 'teaching',
  max_weekly_credit_hours: 12,
  max_weekly_contact_hours: 18,
  max_daily_contact_hours: 6,
  max_consecutive_slots: 2,
  allow_theory: true,
  allow_practical: true,
  allow_lab: true,
  allow_tutorial: true,
  status_code: 'active',
})

const offeringForm = reactive<any>({
  academic_session_id: undefined,
  academic_term_id: undefined,
  program_id: undefined,
  student_batch_id: undefined,
  section_id: undefined,
  academic_teaching_group_id: undefined,
  curriculum_subject_id: undefined,
  subject_type_code: 'theory',
  credit_hours: 3,
  contact_hours_per_week: 3,
  required_sessions_per_week: 2,
  required_hours_per_session: 1.5,
  required_room_type_code: 'classroom',
  required_capacity: 60,
  requires_multimedia: false,
  requires_lab: false,
  status_code: 'offered',
})

const allocationForm = reactive<any>({
  course_offering_id: undefined,
  faculty_member_id: undefined,
  allocation_role_code: 'primary',
  allocated_credit_hours: undefined,
  allocated_contact_hours: undefined,
  remarks: '',
})
const splitForm = reactive<any>({
  academic_session_id: undefined,
  academic_term_id: undefined,
  program_id: undefined,
  student_batch_id: undefined,
  curriculum_subject_id: undefined,

  theory_section_ids: [],
  practical_group_ids: [],

  theory_credit_hours: 3,
  theory_contact_hours: 3,

  practical_credit_hours: 1,
  practical_contact_hours: 2,

  practical_room_type_code: 'computer_lab',
})
const facultyTypeOptions = [
  { label: 'Teaching', value: 'teaching' },
  { label: 'Lab', value: 'lab' },
  { label: 'Borrowed', value: 'borrowed' },
]

const fallbackEmploymentTypes = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Visiting', value: 'visiting' },
  { label: 'Borrowed', value: 'borrowed' },
]

const fallbackDesignations = [
  { label: 'Lecturer', value: 'lecturer' },
  { label: 'Assistant Professor', value: 'assistant_professor' },
  { label: 'Associate Professor', value: 'associate_professor' },
  { label: 'Professor', value: 'professor' },
  { label: 'Lab Instructor', value: 'lab_instructor' },
]

const fallbackSubjectTypes = [
  { label: 'Theory', value: 'theory' },
  { label: 'Practical', value: 'practical' },
  { label: 'Lab', value: 'lab' },
  { label: 'Tutorial', value: 'tutorial' },
]

const roomTypeOptions = [
  { label: 'Classroom', value: 'classroom' },
  { label: 'Lecture Theater', value: 'lecture_theater' },
  { label: 'Computer Lab', value: 'computer_lab' },
  { label: 'Science Lab', value: 'science_lab' },
]

const allocationRoleOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Co Teacher', value: 'co_teacher' },
  { label: 'Lab Instructor', value: 'lab_instructor' },
  { label: 'Teaching Assistant', value: 'teaching_assistant' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const employmentTypeOptions = computed(() => {
  return context.employment_types?.length ? context.employment_types : fallbackEmploymentTypes
})

const designationOptions = computed(() => {
  return context.designations?.length ? context.designations : fallbackDesignations
})

const subjectTypeOptions = computed(() => {
  return context.subject_types?.length ? context.subject_types : fallbackSubjectTypes
})

const facultyOptions = computed(() => {
  return facultyMembers.value.map((faculty: any) => ({
    label: `${faculty.employee_no ? `${faculty.employee_no} - ` : ''}${faculty.full_name}`,
    value: faculty.id,
  }))
})
const allocationTeachingGroupOptions = computed(() => {
  return allocationTeachingGroups.value.map((group: any) => ({
    label: `${group.group_code} - ${group.group_name}`,
    value: group.id,
  }))
})
const courseOfferingOptions = computed(() => {
  return courseOfferings.value
    .filter((offering: any) => {
      if (
        allocationOfferingFilters.subject_type_code &&
        offering.subject_type_code !== allocationOfferingFilters.subject_type_code
      ) {
        return false
      }

      if (
        allocationOfferingFilters.section_id &&
        Number(offering.section_id) !== Number(allocationOfferingFilters.section_id)
      ) {
        return false
      }

      if (
        allocationOfferingFilters.academic_teaching_group_id &&
        Number(offering.academic_teaching_group_id) !== Number(allocationOfferingFilters.academic_teaching_group_id)
      ) {
        return false
      }

      return true
    })
    .map((offering: any) => {
      const scopeLabel = offering.academic_teaching_group_id
        ? `${offering.teaching_group_code || ''} ${offering.teaching_group_name || ''}`.trim()
        : `${offering.section_code || ''} ${offering.section_name || ''}`.trim()

      return {
        label: `${offering.course_code ? `${offering.course_code} - ` : ''}${offering.course_title || 'Course'} | ${offering.subject_type_code || '-'} | ${scopeLabel || 'No scope'}`,
        value: offering.id,
      }
    })
})

const contextParams = computed(() => ({
  academic_session_id: offeringForm.academic_session_id || undefined,
  academic_term_id: offeringForm.academic_term_id || undefined,
  program_id: offeringForm.program_id || undefined,
  student_batch_id: offeringForm.student_batch_id || undefined,
  section_id: offeringForm.section_id || undefined,
}))

const splitContextParams = computed(() => ({
  academic_session_id: splitForm.academic_session_id || undefined,
  academic_term_id: splitForm.academic_term_id || undefined,
  program_id: splitForm.program_id || undefined,
  student_batch_id: splitForm.student_batch_id || undefined,
}))

const teachingGroupOptions = computed(() => {
  return splitTeachingGroups.value.map((group: any) => ({
    label: `${group.group_code} - ${group.group_name}`,
    value: group.id,
  }))
})
const selectedCourseOffering = computed(() => {
  return courseOfferings.value.find(
    (offering: any) => Number(offering.id) === Number(allocationForm.course_offering_id),
  )
})
const allocationStatusColor = (status: string) => {
  if (status === 'valid' || status === 'approved') return 'green'
  if (status === 'conflicted' || status === 'rejected') return 'red'
  if (status === 'cancelled') return 'orange'
  return 'blue'
}

const conflictSeverityColor = (severity: string) => {
  if (severity === 'error') return 'red'
  if (severity === 'warning') return 'orange'
  return 'blue'
}
const clearAllocationOfferingFilters = () => {
  allocationOfferingFilters.subject_type_code = undefined
  allocationOfferingFilters.section_id = undefined
  allocationOfferingFilters.academic_teaching_group_id = undefined
}
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
    context.curriculum_subjects = payload.curriculum_subjects || []
    context.faculty_members = payload.faculty_members || []
    context.employment_types = payload.employment_types || []
    context.designations = payload.designations || []
    context.subject_types = payload.subject_types || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load faculty allocation context.')
  } finally {
    loadingContext.value = false
  }
}
const loadAllocationTeachingGroups = async () => {
  try {
    const response: any = await api.getTeachingGroups({
      per_page: 200,
      group_type_code: allocationOfferingFilters.subject_type_code === 'lab'
        ? 'lab_group'
        : 'practical_group',
    })

    const payload = unwrap(response)
    allocationTeachingGroups.value = payload.data || []
  } catch (error: any) {
    allocationTeachingGroups.value = []
  }
}
const reloadContext = async () => {
  await loadContext()
}

const loadFacultyMembers = async () => {
  loadingFaculty.value = true

  try {
    const response: any = await api.getFacultyMembers({ per_page: 100 })
    const payload = unwrap(response)

    facultyMembers.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load faculty members.')
  } finally {
    loadingFaculty.value = false
  }
}
const reloadSplitContext = async () => {
  try {
    const contextResponse: any = await api.getFacultyAllocationContext(splitContextParams.value)
    const contextPayload = unwrap(contextResponse)

    context.academic_sessions = contextPayload.academic_sessions || []
    context.academic_terms = contextPayload.academic_terms || []
    context.programs = contextPayload.programs || []
    context.student_batches = contextPayload.student_batches || []
    context.sections = contextPayload.sections || []
    context.curriculum_subjects = contextPayload.curriculum_subjects || []

    const groupsResponse: any = await api.getTeachingGroups({
      ...splitContextParams.value,
      group_type_code: 'practical_group',
      per_page: 100,
    })

    const groupsPayload = unwrap(groupsResponse)
    splitTeachingGroups.value = groupsPayload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load split offering context.')
  }
}

const createSplitOfferings = async () => {
  if (
    !splitForm.academic_session_id ||
    !splitForm.academic_term_id ||
    !splitForm.program_id ||
    !splitForm.student_batch_id ||
    !splitForm.curriculum_subject_id
  ) {
    message.error('Session, term, program, batch and subject are required.')
    return
  }

  if (!splitForm.theory_section_ids?.length && !splitForm.practical_group_ids?.length) {
    message.error('Select at least one theory section or practical group.')
    return
  }

  const offeringTypes: any[] = []

  if (splitForm.theory_section_ids?.length) {
    offeringTypes.push({
      subject_type_code: 'theory',
      section_ids: splitForm.theory_section_ids,
      credit_hours: splitForm.theory_credit_hours,
      contact_hours_per_week: splitForm.theory_contact_hours,
      required_sessions_per_week: 2,
      required_hours_per_session: 1.5,
      required_room_type_code: 'classroom',
      requires_multimedia: true,
      requires_lab: false,
      status_code: 'offered',
    })
  }

  if (splitForm.practical_group_ids?.length) {
    offeringTypes.push({
      subject_type_code: 'practical',
      teaching_group_ids: splitForm.practical_group_ids,
      credit_hours: splitForm.practical_credit_hours,
      contact_hours_per_week: splitForm.practical_contact_hours,
      required_sessions_per_week: 1,
      required_hours_per_session: splitForm.practical_contact_hours,
      required_room_type_code: splitForm.practical_room_type_code,
      requires_multimedia: false,
      requires_lab: true,
      status_code: 'offered',
    })
  }

  creatingSplitOfferings.value = true

  try {
    const response: any = await api.createSplitCourseOfferings({
      academic_session_id: splitForm.academic_session_id,
      academic_term_id: splitForm.academic_term_id,
      program_id: splitForm.program_id,
      student_batch_id: splitForm.student_batch_id,
      curriculum_subject_id: splitForm.curriculum_subject_id,
      offering_types: offeringTypes,
    })

    const payload = unwrap(response)

    message.success(`${Array.isArray(payload) ? payload.length : 0} course offerings created/found.`)

    await loadCourseOfferings()
    activeTab.value = 'offerings'
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to create split offerings.')
  } finally {
    creatingSplitOfferings.value = false
  }
}

const loadLoadPolicies = async () => {
  loadingPolicies.value = true

  try {
    const response: any = await api.getFacultyLoadPolicies()
    const payload = unwrap(response)

    loadPolicies.value = Array.isArray(payload) ? payload : []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load load policies.')
  } finally {
    loadingPolicies.value = false
  }
}

const loadCourseOfferings = async () => {
  loadingOfferings.value = true

  try {
    const response: any = await api.getCourseOfferings({ per_page: 100 })
    const payload = unwrap(response)

    courseOfferings.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load course offerings.')
  } finally {
    loadingOfferings.value = false
  }
}

const loadTeacherAllocations = async () => {
  loadingAllocations.value = true

  try {
    const response: any = await api.getTeacherAllocations({ per_page: 100 })
    const payload = unwrap(response)

    teacherAllocations.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load teacher allocations.')
  } finally {
    loadingAllocations.value = false
  }
}

const loadConflicts = async () => {
  loadingConflicts.value = true

  try {
    const response: any = await api.getFacultyAllocationConflicts({ per_page: 100 })
    const payload = unwrap(response)

    conflicts.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load allocation conflicts.')
  } finally {
    loadingConflicts.value = false
  }
}

const loadAll = async () => {
  await Promise.all([
    loadContext(),
    loadFacultyMembers(),
    loadLoadPolicies(),
    loadCourseOfferings(),
    loadTeacherAllocations(),
    loadConflicts(),
    loadAllocationTeachingGroups(),
  ])
}

const saveFaculty = async () => {
  if (!facultyForm.full_name) {
    message.error('Faculty full name is required.')
    return
  }

  savingFaculty.value = true

  try {
    await api.createFacultyMember({ ...facultyForm })
    message.success('Faculty member saved.')
    facultyForm.employee_no = ''
    facultyForm.full_name = ''
    facultyForm.email = ''
    facultyForm.phone = ''
    await Promise.all([loadFacultyMembers(), loadContext()])
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save faculty member.')
  } finally {
    savingFaculty.value = false
  }
}

const savePolicy = async () => {
  savingPolicy.value = true

  try {
    await api.createFacultyLoadPolicy({ ...policyForm })
    message.success('Load policy saved.')
    await loadLoadPolicies()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save load policy.')
  } finally {
    savingPolicy.value = false
  }
}

const saveOffering = async () => {
  if (!offeringForm.curriculum_subject_id) {
    message.error('Curriculum subject is required.')
    return
  }

  savingOffering.value = true

  try {
    await api.createCourseOffering({ ...offeringForm })
    message.success('Course offering saved.')
    await loadCourseOfferings()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save course offering.')
  } finally {
    savingOffering.value = false
  }
}

const validateAllocation = async () => {
  if (!allocationForm.course_offering_id || !allocationForm.faculty_member_id) {
    message.error('Course offering and faculty member are required.')
    return
  }

  validatingAllocation.value = true

  try {
    const response: any = await api.validateTeacherAllocation({ ...allocationForm })
    validationResult.value = unwrap(response)

    if (validationResult.value.valid) {
      message.success('Allocation is valid.')
    } else {
      message.error('Allocation has blocking conflicts.')
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to validate allocation.')
  } finally {
    validatingAllocation.value = false
  }
}

const saveAllocation = async () => {
  if (!allocationForm.course_offering_id || !allocationForm.faculty_member_id) {
    message.error('Course offering and faculty member are required.')
    return
  }

  savingAllocation.value = true

  try {
    const response: any = await api.createTeacherAllocation({ ...allocationForm })
    const payload = unwrap(response)

    validationResult.value = payload.validation || null

    message.success('Teacher allocation saved.')
    allocationForm.course_offering_id = undefined
    allocationForm.faculty_member_id = undefined
    allocationForm.allocated_credit_hours = undefined
    allocationForm.allocated_contact_hours = undefined

    await Promise.all([loadTeacherAllocations(), loadConflicts()])
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save teacher allocation.')
  } finally {
    savingAllocation.value = false
  }
}
watch(
  () => allocationForm.course_offering_id,
  () => {
    const offering = selectedCourseOffering.value

    if (!offering) return

    allocationForm.allocated_credit_hours = Number(offering.credit_hours || 0)
    allocationForm.allocated_contact_hours = Number(offering.contact_hours_per_week || 0)
  },
)
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
</style>