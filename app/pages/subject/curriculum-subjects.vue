<template>
  <AppLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
            <h2>Curriculum Subjects</h2>
            <p>Manage regular subjects, elective placeholders, and elective pools term-wise.</p>
        </div>
      </div>

      <a-card style="margin-bottom: 16px">
        <a-row :gutter="[16, 0]">
          <a-col :span="8">
            <a-form-item label="Curriculum">
              <a-select
                v-model:value="filters.curriculum_id"
                placeholder="Select curriculum"
                allow-clear
                show-search
                :filter-option="filterOption"
                @change="onCurriculumChange"
              >
                <a-select-option
                  v-for="item in curriculumOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :span="8">
            <a-form-item label="Program">
              <a-select
                v-model:value="filters.program_id"
                placeholder="Select program"
                allow-clear
                show-search
                :filter-option="filterOption"
                @change="onProgramChange"
              >
                <a-select-option
                  v-for="item in programOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :span="8">
            <a-form-item label="Academic Term">
              <a-select
                v-model:value="filters.academic_term_id"
                placeholder="Select academic term"
                allow-clear
                show-search
                :disabled="!filters.program_id"
                :filter-option="filterOption"
              >
                <a-select-option
                  v-for="item in academicTermOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :span="8">
            <a-form-item label="Term Number">
              <a-input-number
                v-model:value="filters.term_number"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <a-col :span="16" class="filter-actions">
            <a-space wrap>
                <a-button type="primary" @click="fetchCurriculumSubjects">
                Load Curriculum Subjects
                </a-button>

                <a-button @click="resetFilters">
                Reset
                </a-button>

                <a-divider type="vertical" />

                <a-button type="primary" @click="openBulkRegularModal">
                Add Regular Subjects
                </a-button>

                <a-button @click="openPlaceholderModal">
                Add Elective Placeholder
                </a-button>

                <a-button @click="router.push('/crud/curriculum-subjects')">
                Advanced CRUD
                </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-card>

      <a-card>
        <a-table
          :columns="mainColumns"
          :data-source="curriculumSubjects"
          :loading="loading"
          row-key="id"
          bordered
          :pagination="false"
          size="middle"
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'display_order'">
              {{ record.display_order ?? '-' }}
            </template>

            <template v-else-if="column.key === 'type'">
              <a-tag :color="record.curriculum_subject_type === 'elective_placeholder' ? 'blue' : 'green'">
                {{ record.curriculum_subject_type === 'elective_placeholder' ? 'Elective Placeholder' : 'Regular' }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'subject'">
              <div>
                <strong>{{ record.subject_code || record.subject?.code || '-' }}</strong>
                <div>{{ record.subject_name || record.subject?.name || record.subject_id_display || '-' }}</div>
              </div>
            </template>

            <template v-else-if="column.key === 'nature'">
              {{ formatNature(record.subject_nature) }}
            </template>

            <template v-else-if="column.key === 'marks'">
              {{ record.total_marks }} / {{ record.passing_marks }}
            </template>

            <template v-else-if="column.key === 'flags'">
              <a-space>
                <a-tag v-if="record.is_compulsory" color="green">Compulsory</a-tag>
                <a-tag v-else>Optional</a-tag>

                <a-tag v-if="record.is_credit_subject" color="blue">Credit</a-tag>
                <a-tag v-else>Non-credit</a-tag>
              </a-space>
            </template>

            <template v-else-if="column.key === 'elective_group'">
              <template v-if="record.curriculum_subject_type === 'elective_placeholder'">
                <div>
                  <strong>{{ record.elective_group_code }}</strong>
                  <div>{{ record.elective_group_name }}</div>
                  <small>Required: {{ record.elective_required_count || 1 }}</small>
                </div>
              </template>
              <template v-else>
                -
              </template>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                {{ record.status }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button
                  v-if="record.curriculum_subject_type === 'elective_placeholder'"
                  size="small"
                  type="primary"
                  @click="openElectivePoolModal(record)"
                >
                  Elective Pool
                </a-button>

                <a-button size="small" @click="openEditModal(record)">
                  Edit
                </a-button>

                <a-button size="small" danger @click="deleteCurriculumSubject(record)">
                  Delete
                </a-button>
              </a-space>
            </template>
          </template>

          <template #expandedRowRender="{ record }">
            <div v-if="record.curriculum_subject_type === 'elective_placeholder'">
              <h4 style="margin-bottom: 12px">
                Elective Pool: {{ record.elective_group_code }}
              </h4>

              <a-table
                :columns="electivePoolColumns"
                :data-source="electivePoolsByGroup[record.elective_group_code] || []"
                row-key="id"
                size="small"
                :pagination="false"
                bordered
              >
                <template #bodyCell="{ column, record: pool }">
                    <template v-if="column.key === 'subject'">
                        <strong>{{ pool.subject_code }}</strong> - {{ pool.subject_name }}
                    </template>

                    <template v-else-if="column.key === 'marks'">
                        {{ pool.total_marks }} / {{ pool.passing_marks }}
                    </template>

                    <template v-else-if="column.key === 'flags'">
                        <a-space>
                        <a-tag v-if="pool.is_compulsory" color="green">Compulsory</a-tag>
                        <a-tag v-else>Optional</a-tag>

                        <a-tag v-if="pool.is_credit_subject" color="blue">Credit</a-tag>
                        <a-tag v-else>Non-credit</a-tag>
                        </a-space>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <a-button
                        size="small"
                        danger
                        @click="deleteElectivePoolSubject(pool)"
                        >
                        Remove
                        </a-button>
                    </template>

                    <template v-else>
                        {{ pool[column.dataIndex] }}
                    </template>
                </template>
              </a-table>
            </div>
          </template>
        </a-table>
      </a-card>

      <!-- Bulk Regular Subjects Modal -->
      <a-modal
        v-model:open="bulkModal.visible"
        title="Bulk Add Regular Subjects"
        width="95%"
        :confirm-loading="saving"
        @ok="saveBulkRegularSubjects"
        @cancel="closeBulkRegularModal"
      >
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 16px"
          message="Select multiple subjects, then edit each selected subject's details before saving."
        />

        <a-row :gutter="[16, 0]">
          <a-col :span="24">
            <a-transfer
              v-model:target-keys="selectedSubjectKeys"
              :data-source="subjectTransferData"
              :titles="['Available Subjects', 'Selected Subjects']"
              :render="(item: { title: any }) => item.title"
              :list-style="{ width: '45%', height: '320px' }"
              show-search
              @change="syncSelectedRows"
            />
          </a-col>

          <a-col :span="24" style="margin-top: 20px">
            <a-table
              v-if="selectedRows.length"
              :columns="editColumns"
              :data-source="selectedRows"
              :pagination="false"
              row-key="subject_id"
              bordered
              size="small"
              :scroll="{ x: 1800 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'display_order'">
                  <a-input-number v-model:value="record.display_order" :min="0" style="width: 90px" />
                </template>

                <template v-else-if="column.key === 'subject_code'">
                  <a-input v-model:value="record.subject_code" style="width: 130px" />
                </template>

                <template v-else-if="column.key === 'subject_name'">
                  <a-input v-model:value="record.subject_name" style="width: 260px" />
                </template>

                <template v-else-if="column.key === 'subject_nature'">
                  <a-select v-model:value="record.subject_nature" style="width: 170px">
                    <a-select-option value="theory">Theory</a-select-option>
                    <a-select-option value="practical">Practical</a-select-option>
                    <a-select-option value="theory_practical">Theory + Practical</a-select-option>
                    <a-select-option value="viva">Viva</a-select-option>
                    <a-select-option value="project">Project</a-select-option>
                    <a-select-option value="internship">Internship</a-select-option>
                    <a-select-option value="other">Other</a-select-option>
                  </a-select>
                </template>

                <template v-else-if="column.key === 'credit_hours'">
                  <a-input-number v-model:value="record.credit_hours" :min="0" :step="0.5" style="width: 110px" />
                </template>

                <template v-else-if="column.key === 'theory_hours'">
                  <a-input-number v-model:value="record.theory_hours" :min="0" style="width: 100px" />
                </template>

                <template v-else-if="column.key === 'practical_hours'">
                  <a-input-number v-model:value="record.practical_hours" :min="0" style="width: 110px" />
                </template>

                <template v-else-if="column.key === 'tutorial_hours'">
                  <a-input-number v-model:value="record.tutorial_hours" :min="0" style="width: 110px" />
                </template>

                <template v-else-if="column.key === 'total_marks'">
                  <a-input-number v-model:value="record.total_marks" :min="0" style="width: 110px" />
                </template>

                <template v-else-if="column.key === 'passing_marks'">
                  <a-input-number v-model:value="record.passing_marks" :min="0" style="width: 120px" />
                </template>

                <template v-else-if="column.key === 'is_compulsory'">
                  <a-switch v-model:checked="record.is_compulsory" />
                </template>

                <template v-else-if="column.key === 'is_credit_subject'">
                  <a-switch v-model:checked="record.is_credit_subject" />
                </template>

                <template v-else-if="column.key === 'remarks'">
                  <a-input v-model:value="record.remarks" style="width: 220px" />
                </template>

                <template v-else-if="column.key === 'actions'">
                  <a-button danger size="small" @click="removeSelectedSubject(record.subject_id)">
                    Remove
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-col>

          <a-col :span="24" style="margin-top: 16px">
            <a-checkbox v-model:checked="bulkModal.overwrite_existing">
              Overwrite existing regular subject records
            </a-checkbox>
          </a-col>
        </a-row>
      </a-modal>

      <!-- Elective Placeholder Modal -->
      <a-modal
        v-model:open="placeholderModal.visible"
        :title="placeholderModal.isEdit ? 'Edit Elective Placeholder' : 'Add Elective Placeholder'"
        width="850px"
        :confirm-loading="saving"
        @ok="savePlaceholder"
        @cancel="closePlaceholderModal"
      >
        <a-form layout="vertical">
          <a-row :gutter="[16, 0]">
            <a-col :span="12">
              <a-form-item label="Placeholder Code" required>
                <a-input v-model:value="placeholderForm.subject_code" placeholder="ELEC-I" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Placeholder Name" required>
                <a-input v-model:value="placeholderForm.subject_name" placeholder="Elective-I" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Elective Group Code" required>
                <a-input v-model:value="placeholderForm.elective_group_code" placeholder="CS-ELECTIVE" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Elective Group Name">
                <a-input v-model:value="placeholderForm.elective_group_name" placeholder="Computer Science Electives" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Required Count" required>
                <a-input-number v-model:value="placeholderForm.elective_required_count" :min="1" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Subject Nature" required>
                <a-select v-model:value="placeholderForm.subject_nature">
                  <a-select-option value="theory">Theory</a-select-option>
                  <a-select-option value="practical">Practical</a-select-option>
                  <a-select-option value="theory_practical">Theory + Practical</a-select-option>
                  <a-select-option value="viva">Viva</a-select-option>
                  <a-select-option value="project">Project</a-select-option>
                  <a-select-option value="internship">Internship</a-select-option>
                  <a-select-option value="other">Other</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Credit Hours">
                <a-input-number v-model:value="placeholderForm.credit_hours" :min="0" :step="0.5" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Total Marks">
                <a-input-number v-model:value="placeholderForm.total_marks" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Passing Marks">
                <a-input-number v-model:value="placeholderForm.passing_marks" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Display Order">
                <a-input-number v-model:value="placeholderForm.display_order" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Compulsory">
                <a-switch v-model:checked="placeholderForm.is_compulsory" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Credit Subject">
                <a-switch v-model:checked="placeholderForm.is_credit_subject" />
              </a-form-item>
            </a-col>

            <a-col :span="24">
              <a-form-item label="Remarks">
                <a-textarea v-model:value="placeholderForm.remarks" :rows="3" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>

      <!-- Elective Pool Modal -->
      <a-modal
        v-model:open="electivePoolModal.visible"
        title="Manage Elective Pool"
        width="95%"
        :confirm-loading="saving"
        @ok="saveElectivePool"
        @cancel="closeElectivePoolModal"
      >
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 16px"
          :message="`Elective Group: ${electivePoolModal.placeholder?.elective_group_code || ''}`"
        />

        <a-transfer
          v-model:target-keys="selectedElectiveSubjectKeys"
          :data-source="subjectTransferData"
          :titles="['Available Subjects', 'Elective Pool Subjects']"
          :render="(item: { title: any }) => item.title"
          :list-style="{ width: '45%', height: '320px' }"
          show-search
          @change="syncElectiveRows"
        />

        <a-table
          v-if="selectedElectiveRows.length"
          style="margin-top: 20px"
          :columns="editColumns"
          :data-source="selectedElectiveRows"
          :pagination="false"
          row-key="subject_id"
          bordered
          size="small"
          :scroll="{ x: 1800 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'display_order'">
              <a-input-number v-model:value="record.display_order" :min="0" style="width: 90px" />
            </template>

            <template v-else-if="column.key === 'subject_code'">
              <a-input v-model:value="record.subject_code" style="width: 130px" />
            </template>

            <template v-else-if="column.key === 'subject_name'">
              <a-input v-model:value="record.subject_name" style="width: 260px" />
            </template>

            <template v-else-if="column.key === 'subject_nature'">
              <a-select v-model:value="record.subject_nature" style="width: 170px">
                <a-select-option value="theory">Theory</a-select-option>
                <a-select-option value="practical">Practical</a-select-option>
                <a-select-option value="theory_practical">Theory + Practical</a-select-option>
                <a-select-option value="viva">Viva</a-select-option>
                <a-select-option value="project">Project</a-select-option>
                <a-select-option value="internship">Internship</a-select-option>
                <a-select-option value="other">Other</a-select-option>
              </a-select>
            </template>

            <template v-else-if="column.key === 'credit_hours'">
              <a-input-number v-model:value="record.credit_hours" :min="0" :step="0.5" style="width: 110px" />
            </template>

            <template v-else-if="column.key === 'theory_hours'">
              <a-input-number v-model:value="record.theory_hours" :min="0" style="width: 100px" />
            </template>

            <template v-else-if="column.key === 'practical_hours'">
              <a-input-number v-model:value="record.practical_hours" :min="0" style="width: 110px" />
            </template>

            <template v-else-if="column.key === 'tutorial_hours'">
              <a-input-number v-model:value="record.tutorial_hours" :min="0" style="width: 110px" />
            </template>

            <template v-else-if="column.key === 'total_marks'">
              <a-input-number v-model:value="record.total_marks" :min="0" style="width: 110px" />
            </template>

            <template v-else-if="column.key === 'passing_marks'">
              <a-input-number v-model:value="record.passing_marks" :min="0" style="width: 120px" />
            </template>

            <template v-else-if="column.key === 'is_compulsory'">
              <a-switch v-model:checked="record.is_compulsory" />
            </template>

            <template v-else-if="column.key === 'is_credit_subject'">
              <a-switch v-model:checked="record.is_credit_subject" />
            </template>

            <template v-else-if="column.key === 'remarks'">
              <a-input v-model:value="record.remarks" style="width: 220px" />
            </template>
            <template v-else-if="column.key === 'actions'">
                <a-button
                    danger
                    size="small"
                    @click="removeElectiveRow(record)"
                >
                    Remove
                </a-button>
            </template>
          </template>
        </a-table>

        <div style="margin-top: 16px">
          <a-checkbox v-model:checked="electivePoolModal.overwrite_existing">
            Overwrite existing elective pool records
          </a-checkbox>
        </div>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import AppLayout from '~/components/layout/AppLayout.vue'
import { useApi } from '~/composables/useApi'

const { apiFetch } = useApi()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)

const curriculumOptions = ref<any[]>([])
const programOptions = ref<any[]>([])
const academicTermOptions = ref<any[]>([])
const subjectOptions = ref<any[]>([])

const curriculumSubjects = ref<any[]>([])
const electivePools = ref<any[]>([])

const selectedSubjectKeys = ref<string[]>([])
const selectedRows = ref<any[]>([])

const selectedElectiveSubjectKeys = ref<string[]>([])
const selectedElectiveRows = ref<any[]>([])

const filters = reactive({
  curriculum_id: undefined as number | undefined,
  program_id: undefined as number | undefined,
  academic_term_id: undefined as number | undefined,
  term_number: undefined as number | undefined,
})

const bulkModal = reactive({
  visible: false,
  overwrite_existing: false,
})

const placeholderModal = reactive({
  visible: false,
  isEdit: false,
  editId: null as number | null,
})

const electivePoolModal = reactive({
  visible: false,
  placeholder: null as any,
  overwrite_existing: false,
})

const placeholderForm = reactive<any>({
  subject_code: '',
  subject_name: '',
  subject_nature: 'theory',
  elective_group_code: '',
  elective_group_name: '',
  elective_required_count: 1,
  credit_hours: 3,
  theory_hours: 3,
  practical_hours: 0,
  tutorial_hours: 0,
  total_marks: 100,
  passing_marks: 40,
  is_compulsory: false,
  is_credit_subject: true,
  display_order: 0,
  remarks: '',
})

const mainColumns = [
  { title: 'Order', key: 'display_order', width: 70 },
  { title: 'Type', key: 'type', width: 150 },
  { title: 'Subject / Placeholder', key: 'subject', width: 300 },
  { title: 'Nature', key: 'nature', width: 130 },
  { title: 'Credits', dataIndex: 'credit_hours', key: 'credit_hours', width: 90 },
  { title: 'Marks', key: 'marks', width: 100 },
  { title: 'Flags', key: 'flags', width: 180 },
  { title: 'Elective Group', key: 'elective_group', width: 230 },
  { title: 'Actions', key: 'actions', width: 250, fixed: 'right' },
]

const electivePoolColumns = [
  { title: 'Order', dataIndex: 'display_order', key: 'display_order', width: 80 },
  { title: 'Subject', key: 'subject' },
  { title: 'Nature', dataIndex: 'subject_nature', key: 'subject_nature', width: 140 },
  { title: 'Credits', dataIndex: 'credit_hours', key: 'credit_hours', width: 100 },
  { title: 'Marks', key: 'marks', width: 110 },
  { title: 'Flags', key: 'flags', width: 200 },
  { title: 'Actions', key: 'actions', width: 120 },
]

const editColumns = [
  { title: 'Order', key: 'display_order', width: 100, fixed: 'left' },
  { title: 'Code', key: 'subject_code', width: 150 },
  { title: 'Subject Name', key: 'subject_name', width: 280 },
  { title: 'Nature', key: 'subject_nature', width: 190 },
  { title: 'Credit Hours', key: 'credit_hours', width: 130 },
  { title: 'Theory', key: 'theory_hours', width: 110 },
  { title: 'Practical', key: 'practical_hours', width: 120 },
  { title: 'Tutorial', key: 'tutorial_hours', width: 120 },
  { title: 'Total Marks', key: 'total_marks', width: 130 },
  { title: 'Passing Marks', key: 'passing_marks', width: 140 },
  { title: 'Compulsory', key: 'is_compulsory', width: 120 },
  { title: 'Credit Subject', key: 'is_credit_subject', width: 130 },
  { title: 'Remarks', key: 'remarks', width: 240 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

const subjectTransferData = computed(() => {
  return subjectOptions.value.map((item: any) => ({
    key: String(item.value),
    title: item.label,
    description: item.code || '',
  }))
})
const deleteElectivePoolSubject = (pool: any) => {
  Modal.confirm({
    title: 'Remove elective subject?',
    content: `${pool.subject_code} - ${pool.subject_name} will be removed from this elective pool.`,
    okText: 'Remove',
    okType: 'danger',
    async onOk() {
      await apiFetch(`/dynamic/crud/curriculum-elective-subjects/${pool.id}`, {
        method: 'DELETE',
      })

      message.success('Elective subject removed from pool.')
      await fetchCurriculumSubjects()
    },
  })
}
const electivePoolsByGroup = computed(() => {
  const grouped: Record<string, any[]> = {}

  for (const item of electivePools.value) {
    const key = item.elective_group_code

    if (!grouped[key]) {
      grouped[key] = []
    }

    grouped[key].push(item)
  }

  return grouped
})
const removeElectiveRow = (row: any) => {
  Modal.confirm({
    title: 'Remove elective subject?',
    content: `${row.subject_code} - ${row.subject_name} will be removed from this elective pool.`,
    okText: 'Remove',
    okType: 'danger',
    async onOk() {
      if (row.id) {
        await apiFetch(`/dynamic/crud/curriculum-elective-subjects/${row.id}`, {
          method: 'DELETE',
        })
      }

      selectedElectiveSubjectKeys.value = selectedElectiveSubjectKeys.value.filter(
        key => Number(key) !== Number(row.subject_id)
      )

      selectedElectiveRows.value = selectedElectiveRows.value.filter(
        item => Number(item.subject_id) !== Number(row.subject_id)
      )

      message.success('Elective subject removed.')

      await fetchCurriculumSubjects()
    },
  })
}
const filterOption = (input: string, option: any) => {
  return String(option?.children || '')
    .toLowerCase()
    .includes(input.toLowerCase())
}

const formatNature = (value: string) => {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const normalizeListResponse = (response: any) => {
  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  return []
}

const fetchCurriculums = async () => {
  const response: any = await apiFetch('/dynamic-options/curriculums', { method: 'GET' })
  curriculumOptions.value = response.data || []
}

const fetchPrograms = async () => {
  const response: any = await apiFetch('/dynamic-options/programs', { method: 'GET' })
  programOptions.value = response.data || []
}

const fetchAcademicTerms = async () => {
  if (!filters.program_id) {
    academicTermOptions.value = []
    return
  }

  const response: any = await apiFetch('/dynamic-options/academic-terms', {
    method: 'GET',
    query: {
      program_id: filters.program_id,
    },
  })

  academicTermOptions.value = response.data || []
}

const fetchSubjects = async () => {
  const response: any = await apiFetch('/dynamic-options/subjects', { method: 'GET' })
  subjectOptions.value = response.data || []
}

const fetchCurriculumSubjects = async () => {
  loading.value = true

  try {
    const response: any = await apiFetch('/dynamic/crud/curriculum-subjects', {
      method: 'GET',
      query: {
        curriculum_id: filters.curriculum_id || undefined,
        program_id: filters.program_id || undefined,
        academic_term_id: filters.academic_term_id || undefined,
        term_number: filters.term_number || undefined,
        per_page: 500,
      },
    })

    curriculumSubjects.value = normalizeListResponse(response)

    await fetchElectivePools()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to load curriculum subjects.')
  } finally {
    loading.value = false
  }
}

const fetchElectivePools = async () => {
  const response: any = await apiFetch('/dynamic/crud/curriculum-elective-subjects', {
    method: 'GET',
    query: {
      curriculum_id: filters.curriculum_id || undefined,
      program_id: filters.program_id || undefined,
      academic_term_id: filters.academic_term_id || undefined,
      per_page: 500,
    },
  })

  electivePools.value = normalizeListResponse(response)
}

const onCurriculumChange = async () => {
  const selected = curriculumOptions.value.find((x: any) => x.value === filters.curriculum_id)

  if (selected?.program_id) {
    filters.program_id = selected.program_id
  }

  filters.academic_term_id = undefined
  await fetchAcademicTerms()
}

const onProgramChange = async () => {
  filters.academic_term_id = undefined
  await fetchAcademicTerms()
}

const resetFilters = () => {
  filters.curriculum_id = undefined
  filters.program_id = undefined
  filters.academic_term_id = undefined
  filters.term_number = undefined
  curriculumSubjects.value = []
  electivePools.value = []
}

const validateHeader = () => {
  if (!filters.curriculum_id) {
    message.error('Please select curriculum.')
    return false
  }

  if (!filters.program_id) {
    message.error('Please select program.')
    return false
  }

  if (!filters.term_number) {
    message.error('Please enter term number.')
    return false
  }

  return true
}

const makeRowFromSubject = (subject: any, index: number) => {
  return {
    subject_id: Number(subject.value),
    subject_code: subject.code || '',
    subject_name: subject.name || subject.label || '',
    subject_nature: subject.subject_nature || 'theory',
    credit_hours: Number(subject.credit_hours || 0),
    theory_hours: Number(subject.theory_hours || 0),
    practical_hours: Number(subject.practical_hours || 0),
    tutorial_hours: Number(subject.tutorial_hours || 0),
    total_marks: Number(subject.total_marks || 100),
    passing_marks: Number(subject.passing_marks || 40),
    is_compulsory: Boolean(subject.is_compulsory),
    is_credit_subject: Boolean(subject.is_credit_subject),
    display_order: index + 1,
    remarks: '',
  }
}

const syncSelectedRows = () => {
  const existingMap = new Map(
    selectedRows.value.map((row: any) => [String(row.subject_id), row])
  )

  selectedRows.value = selectedSubjectKeys.value.map((key: string, index: number) => {
    if (existingMap.has(key)) {
      return existingMap.get(key)
    }

    const subject = subjectOptions.value.find((item: any) => String(item.value) === key)

    return makeRowFromSubject(subject, index)
  })
}

const syncElectiveRows = () => {
  const existingMap = new Map(
    selectedElectiveRows.value.map((row: any) => [String(row.subject_id), row])
  )

  selectedElectiveRows.value = selectedElectiveSubjectKeys.value.map((key: string, index: number) => {
    if (existingMap.has(key)) {
      return existingMap.get(key)
    }

    const subject = subjectOptions.value.find((item: any) => String(item.value) === key)

    return makeRowFromSubject(subject, index)
  })
}

const removeSelectedSubject = (subjectId: number) => {
  selectedSubjectKeys.value = selectedSubjectKeys.value.filter(key => Number(key) !== Number(subjectId))
  syncSelectedRows()
}

const openBulkRegularModal = () => {
  if (!validateHeader()) {
    return
  }

  selectedSubjectKeys.value = []
  selectedRows.value = []
  bulkModal.overwrite_existing = false
  bulkModal.visible = true
}

const closeBulkRegularModal = () => {
  bulkModal.visible = false
}

const validateRows = (rows: any[]) => {
  for (const row of rows) {
    if (!row.subject_code) {
      message.error('Subject code is required for all selected subjects.')
      return false
    }

    if (!row.subject_name) {
      message.error('Subject name is required for all selected subjects.')
      return false
    }

    if (!row.subject_nature) {
      message.error('Subject nature is required for all selected subjects.')
      return false
    }

    if (Number(row.passing_marks) > Number(row.total_marks)) {
      message.error(`Passing marks cannot exceed total marks for ${row.subject_name}.`)
      return false
    }
  }

  return true
}

const saveBulkRegularSubjects = async () => {
  if (!validateHeader() || selectedRows.value.length === 0 || !validateRows(selectedRows.value)) {
    return
  }

  saving.value = true

  try {
    const response: any = await apiFetch('/subject/curriculum-subjects/bulk-assign', {
      method: 'POST',
      body: {
        curriculum_id: filters.curriculum_id,
        program_id: filters.program_id,
        academic_term_id: filters.academic_term_id || null,
        term_number: filters.term_number,
        overwrite_existing: bulkModal.overwrite_existing,
        items: selectedRows.value,
      },
    })

    const data = response.data || {}

    message.success(`Saved. Created: ${data.created || 0}, Updated: ${data.updated || 0}, Skipped: ${data.skipped || 0}`)

    bulkModal.visible = false
    await fetchCurriculumSubjects()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to save regular subjects.')
  } finally {
    saving.value = false
  }
}

const resetPlaceholderForm = () => {
  placeholderForm.subject_code = ''
  placeholderForm.subject_name = ''
  placeholderForm.subject_nature = 'theory'
  placeholderForm.elective_group_code = ''
  placeholderForm.elective_group_name = ''
  placeholderForm.elective_required_count = 1
  placeholderForm.credit_hours = 3
  placeholderForm.theory_hours = 3
  placeholderForm.practical_hours = 0
  placeholderForm.tutorial_hours = 0
  placeholderForm.total_marks = 100
  placeholderForm.passing_marks = 40
  placeholderForm.is_compulsory = false
  placeholderForm.is_credit_subject = true
  placeholderForm.display_order = 0
  placeholderForm.remarks = ''
}

const openPlaceholderModal = () => {
  if (!validateHeader()) {
    return
  }

  resetPlaceholderForm()
  placeholderModal.isEdit = false
  placeholderModal.editId = null
  placeholderModal.visible = true
}

const openEditModal = (record: any) => {
  if (record.curriculum_subject_type === 'elective_placeholder') {
    placeholderForm.subject_code = record.subject_code
    placeholderForm.subject_name = record.subject_name
    placeholderForm.subject_nature = record.subject_nature
    placeholderForm.elective_group_code = record.elective_group_code
    placeholderForm.elective_group_name = record.elective_group_name
    placeholderForm.elective_required_count = record.elective_required_count || 1
    placeholderForm.credit_hours = Number(record.credit_hours || 0)
    placeholderForm.theory_hours = Number(record.theory_hours || 0)
    placeholderForm.practical_hours = Number(record.practical_hours || 0)
    placeholderForm.tutorial_hours = Number(record.tutorial_hours || 0)
    placeholderForm.total_marks = Number(record.total_marks || 100)
    placeholderForm.passing_marks = Number(record.passing_marks || 40)
    placeholderForm.is_compulsory = Boolean(record.is_compulsory)
    placeholderForm.is_credit_subject = Boolean(record.is_credit_subject)
    placeholderForm.display_order = Number(record.display_order || 0)
    placeholderForm.remarks = record.remarks || ''

    placeholderModal.isEdit = true
    placeholderModal.editId = record.id
    placeholderModal.visible = true
    return
  }

  message.info('Regular subject editing will be handled in the next refinement.')
}

const closePlaceholderModal = () => {
  placeholderModal.visible = false
  placeholderModal.isEdit = false
  placeholderModal.editId = null
}

const savePlaceholder = async () => {
  if (!validateHeader()) {
    return
  }

  if (!placeholderForm.subject_code || !placeholderForm.subject_name || !placeholderForm.elective_group_code) {
    message.error('Placeholder code, name, and elective group code are required.')
    return
  }

  saving.value = true

  try {
    const body = {
      curriculum_id: filters.curriculum_id,
      program_id: filters.program_id,
      academic_term_id: filters.academic_term_id || null,
      term_number: filters.term_number,

      curriculum_subject_type: 'elective_placeholder',
      subject_id: null,

      subject_code: placeholderForm.subject_code,
      subject_name: placeholderForm.subject_name,
      subject_nature: placeholderForm.subject_nature,

      elective_group_code: placeholderForm.elective_group_code,
      elective_group_name: placeholderForm.elective_group_name,
      elective_required_count: placeholderForm.elective_required_count,

      credit_hours: placeholderForm.credit_hours,
      theory_hours: placeholderForm.theory_hours,
      practical_hours: placeholderForm.practical_hours,
      tutorial_hours: placeholderForm.tutorial_hours,

      total_marks: placeholderForm.total_marks,
      passing_marks: placeholderForm.passing_marks,

      is_compulsory: placeholderForm.is_compulsory,
      is_credit_subject: placeholderForm.is_credit_subject,

      display_order: placeholderForm.display_order,
      remarks: placeholderForm.remarks || null,
      status: 'active',
    }

    if (placeholderModal.isEdit && placeholderModal.editId) {
      await apiFetch(`/dynamic/crud/curriculum-subjects/${placeholderModal.editId}`, {
        method: 'PUT',
        body,
      })

      message.success('Elective placeholder updated.')
    } else {
      await apiFetch('/dynamic/crud/curriculum-subjects', {
        method: 'POST',
        body,
      })

      message.success('Elective placeholder created.')
    }

    closePlaceholderModal()
    await fetchCurriculumSubjects()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to save elective placeholder.')
  } finally {
    saving.value = false
  }
}

const openElectivePoolModal = (placeholder: any) => {
  electivePoolModal.placeholder = placeholder
  electivePoolModal.overwrite_existing = false

  const existingPoolSubjects = electivePools.value.filter(
    (item: any) =>
      item.curriculum_id === placeholder.curriculum_id &&
      item.program_id === placeholder.program_id &&
      item.elective_group_code === placeholder.elective_group_code &&
      String(item.academic_term_id || '') === String(placeholder.academic_term_id || '')
  )

  selectedElectiveSubjectKeys.value = existingPoolSubjects.map((item: any) =>
    String(item.subject_id)
  )

  selectedElectiveRows.value = existingPoolSubjects.map((item: any, index: number) => ({
    id: item.id,
    subject_id: Number(item.subject_id),

    subject_code: item.subject_code || item.subject?.code || '',
    subject_name: item.subject_name || item.subject?.name || '',

    subject_nature: item.subject_nature || 'theory',

    credit_hours: Number(item.credit_hours || 0),
    theory_hours: Number(item.theory_hours || 0),
    practical_hours: Number(item.practical_hours || 0),
    tutorial_hours: Number(item.tutorial_hours || 0),

    total_marks: Number(item.total_marks || 100),
    passing_marks: Number(item.passing_marks || 40),

    is_compulsory: Boolean(item.is_compulsory),
    is_credit_subject: Boolean(item.is_credit_subject),

    display_order: Number(item.display_order || index + 1),
    remarks: item.remarks || '',
  }))

  electivePoolModal.visible = true
}

const closeElectivePoolModal = () => {
  electivePoolModal.visible = false
  electivePoolModal.placeholder = null
}

const saveElectivePool = async () => {
  if (!electivePoolModal.placeholder) {
    return
  }

  if (selectedElectiveRows.value.length === 0) {
    message.error('Please select elective subjects.')
    return
  }

  if (!validateRows(selectedElectiveRows.value)) {
    return
  }

  saving.value = true

  try {
    const placeholder = electivePoolModal.placeholder

    const response: any = await apiFetch('/subject/curriculum-electives/bulk-assign', {
      method: 'POST',
      body: {
        curriculum_id: placeholder.curriculum_id,
        program_id: placeholder.program_id,
        academic_term_id: placeholder.academic_term_id || null,

        elective_group_code: placeholder.elective_group_code,
        elective_group_name: placeholder.elective_group_name,

        overwrite_existing: electivePoolModal.overwrite_existing,
        items: selectedElectiveRows.value.map((row: any) => ({
            subject_id: row.subject_id,
            subject_code: row.subject_code,
            subject_name: row.subject_name,
            subject_nature: row.subject_nature,

            credit_hours: row.credit_hours,
            theory_hours: row.theory_hours,
            practical_hours: row.practical_hours,
            tutorial_hours: row.tutorial_hours,

            total_marks: row.total_marks,
            passing_marks: row.passing_marks,

            is_compulsory: row.is_compulsory,
            is_credit_subject: row.is_credit_subject,

            display_order: row.display_order,
            remarks: row.remarks || null,
            })),
      },
    })

    const data = response.data || {}

    message.success(`Elective pool saved. Created: ${data.created || 0}, Updated: ${data.updated || 0}, Skipped: ${data.skipped || 0}`)

    closeElectivePoolModal()
    await fetchCurriculumSubjects()
  } catch (error: any) {
    message.error(error?.data?.message || 'Failed to save elective pool.')
  } finally {
    saving.value = false
  }
}

const deleteCurriculumSubject = (record: any) => {
  Modal.confirm({
    title: 'Delete curriculum subject?',
    content: 'This action cannot be undone.',
    okText: 'Delete',
    okType: 'danger',
    async onOk() {
      await apiFetch(`/dynamic/crud/curriculum-subjects/${record.id}`, {
        method: 'DELETE',
      })

      message.success('Deleted successfully.')
      await fetchCurriculumSubjects()
    },
  })
}

onMounted(async () => {
  await Promise.all([
    fetchCurriculums(),
    fetchPrograms(),
    fetchSubjects(),
  ])
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.page-header p {
  margin: 4px 0 0;
  color: #666;
}

.filter-actions {
  display: flex;
  align-items: end;
  padding-bottom: 32px;
}
</style>