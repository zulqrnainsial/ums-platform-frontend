<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Rooms & Resources</h2>
          <p>Manage buildings, floors and teaching rooms for timetable planning.</p>
        </div>

        <a-button @click="loadAll">Refresh</a-button>
      </div>

      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="buildings" tab="Buildings">
          <a-card title="Create Building" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="5">
                <label>Building Code</label>
                <a-input v-model:value="buildingForm.building_code" placeholder="MAIN" />
              </a-col>

              <a-col :xs="24" :md="7">
                <label>Building Name</label>
                <a-input v-model:value="buildingForm.building_name" placeholder="Main Academic Block" />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Type</label>
                <a-select
                  v-model:value="buildingForm.building_type_code"
                  style="width: 100%"
                  :options="buildingTypeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Ownership</label>
                <a-select
                  v-model:value="buildingForm.ownership_scope_code"
                  style="width: 100%"
                  :options="ownershipOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4" class="action-col">
                <a-button
                  type="primary"
                  block
                  :loading="savingBuilding"
                  @click="saveBuilding"
                >
                  Save Building
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Buildings">
            <a-table
              :data-source="buildings"
              row-key="id"
              size="small"
              :loading="loadingBuildings"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Code" data-index="building_code" />
              <a-table-column title="Name" data-index="building_name" />
              <a-table-column title="Type" data-index="building_type_code" />
              <a-table-column title="Ownership" data-index="ownership_scope_code" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="floors" tab="Floors">
          <a-card title="Create Floor" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="7">
                <label>Building</label>
                <a-select
                  v-model:value="floorForm.campus_building_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :options="context.buildings"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Floor Code</label>
                <a-input v-model:value="floorForm.floor_code" placeholder="G" />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Floor Name</label>
                <a-input v-model:value="floorForm.floor_name" placeholder="Ground Floor" />
              </a-col>

              <a-col :xs="24" :md="3">
                <label>Number</label>
                <a-input-number v-model:value="floorForm.floor_number" style="width: 100%" />
              </a-col>

              <a-col :xs="24" :md="4" class="action-col">
                <a-button
                  type="primary"
                  block
                  :loading="savingFloor"
                  @click="saveFloor"
                >
                  Save Floor
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Floors">
            <a-table
              :data-source="floors"
              row-key="id"
              size="small"
              :loading="loadingFloors"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Building" data-index="building_name" />
              <a-table-column title="Code" data-index="floor_code" />
              <a-table-column title="Name" data-index="floor_name" />
              <a-table-column title="Number" data-index="floor_number" />
              <a-table-column title="Status" data-index="status_code" />
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="rooms" tab="Rooms">
          <a-card title="Create Room" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="6">
                <label>Building</label>
                <a-select
                  v-model:value="roomForm.campus_building_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :options="context.buildings"
                  @change="onRoomBuildingChange"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Floor</label>
                <a-select
                  v-model:value="roomForm.campus_floor_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :options="filteredFloorOptions"
                />
              </a-col>

              <a-col :xs="24" :md="6">
                <label>Room Type</label>
                <a-select
                  v-model:value="roomForm.room_type_id"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :options="roomTypeOptions"
                  @change="onRoomTypeChange"
                />
              </a-col>

              <a-col :xs="24" :md="3">
                <label>Room Code</label>
                <a-input v-model:value="roomForm.room_code" placeholder="MAIN-101" />
              </a-col>

              <a-col :xs="24" :md="3">
                <label>Capacity</label>
                <a-input-number v-model:value="roomForm.capacity" style="width: 100%" :min="0" />
              </a-col>

              <a-col :xs="24" :md="8">
                <label>Room Name</label>
                <a-input v-model:value="roomForm.room_name" placeholder="Main Classroom 101" />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Exam Capacity</label>
                <a-input-number v-model:value="roomForm.exam_capacity" style="width: 100%" :min="0" />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Computer Count</label>
                <a-input-number v-model:value="roomForm.computer_count" style="width: 100%" :min="0" />
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.has_multimedia">Multimedia</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.has_projector">Projector</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.has_smart_board">Smart Board</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.has_computers">Computers</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.is_lab">Lab</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.is_shared">Shared</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="roomForm.is_active_for_timetable">Timetable Active</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4" class="action-col">
                <a-button
                  type="primary"
                  block
                  :loading="savingRoom"
                  @click="saveRoom"
                >
                  Save Room
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Rooms">
            <a-table
              :data-source="rooms"
              row-key="id"
              size="small"
              :loading="loadingRooms"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Building" data-index="building_name" />
              <a-table-column title="Floor" data-index="floor_name" />
              <a-table-column title="Code" data-index="room_code" />
              <a-table-column title="Name" data-index="room_name" />
              <a-table-column title="Type" data-index="room_type_code" />
              <a-table-column title="Capacity" data-index="capacity" />
              <a-table-column title="Lab">
                <template #default="{ record }">
                  <a-tag :color="record.is_lab ? 'green' : 'default'">
                    {{ record.is_lab ? 'Yes' : 'No' }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="Features">
                <template #default="{ record }">
                  <a-space wrap>
                    <a-tag v-if="record.has_multimedia">Multimedia</a-tag>
                    <a-tag v-if="record.has_projector">Projector</a-tag>
                    <a-tag v-if="record.has_computers">Computers: {{ record.computer_count || 0 }}</a-tag>
                  </a-space>
                </template>
              </a-table-column>
              <a-table-column title="Timetable">
                <template #default="{ record }">
                  <a-tag :color="record.is_active_for_timetable ? 'green' : 'red'">
                    {{ record.is_active_for_timetable ? 'Active' : 'Inactive' }}
                  </a-tag>
                </template>
              </a-table-column>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="available" tab="Available Room Lookup">
          <a-card title="Find Matching Rooms" class="mb-3">
            <a-row :gutter="[12, 12]">
              <a-col :xs="24" :md="5">
                <label>Room Type</label>
                <a-select
                  v-model:value="lookupFilters.room_type_code"
                  allow-clear
                  style="width: 100%"
                  :options="roomTypeCodeOptions"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <label>Required Capacity</label>
                <a-input-number
                  v-model:value="lookupFilters.required_capacity"
                  style="width: 100%"
                  :min="0"
                />
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="lookupFilters.requires_lab">Lab</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="lookupFilters.requires_multimedia">Multimedia</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="4">
                <a-checkbox v-model:checked="lookupFilters.requires_projector">Projector</a-checkbox>
              </a-col>

              <a-col :xs="24" :md="3" class="action-col">
                <a-button type="primary" block @click="loadAvailableRooms">
                  Search
                </a-button>
              </a-col>
            </a-row>
          </a-card>

          <a-card title="Matching Rooms">
            <a-table
              :data-source="availableRooms"
              row-key="id"
              size="small"
              :loading="loadingAvailableRooms"
              :pagination="{ pageSize: 10 }"
            >
              <a-table-column title="Building" data-index="building_name" />
              <a-table-column title="Floor" data-index="floor_name" />
              <a-table-column title="Room" data-index="room_code" />
              <a-table-column title="Name" data-index="room_name" />
              <a-table-column title="Type" data-index="room_type_code" />
              <a-table-column title="Capacity" data-index="capacity" />
              <a-table-column title="Computers" data-index="computer_count" />
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

const activeTab = ref('rooms')

const loadingContext = ref(false)
const loadingBuildings = ref(false)
const loadingFloors = ref(false)
const loadingRooms = ref(false)
const loadingAvailableRooms = ref(false)

const savingBuilding = ref(false)
const savingFloor = ref(false)
const savingRoom = ref(false)

const buildings = ref<any[]>([])
const floors = ref<any[]>([])
const rooms = ref<any[]>([])
const availableRooms = ref<any[]>([])

const context = reactive<any>({
  buildings: [],
  floors: [],
  room_types: [],
  room_features: [],
  resource_types: [],
})

const buildingForm = reactive<any>({
  building_code: '',
  building_name: '',
  building_type_code: 'academic',
  ownership_scope_code: 'shared',
  status_code: 'active',
})

const floorForm = reactive<any>({
  campus_building_id: undefined,
  floor_code: '',
  floor_name: '',
  floor_number: 0,
  status_code: 'active',
})

const roomForm = reactive<any>({
  campus_building_id: undefined,
  campus_floor_id: undefined,
  room_type_id: undefined,
  room_type_code: undefined,
  room_code: '',
  room_name: '',
  capacity: 40,
  exam_capacity: undefined,
  has_multimedia: false,
  has_projector: false,
  has_smart_board: false,
  has_computers: false,
  computer_count: undefined,
  is_shared: true,
  is_lab: false,
  is_active_for_timetable: true,
  status_code: 'active',
})

const lookupFilters = reactive<any>({
  room_type_code: undefined,
  required_capacity: 40,
  requires_lab: false,
  requires_multimedia: false,
  requires_projector: false,
  requires_computers: false,
})

const buildingTypeOptions = [
  { label: 'Academic', value: 'academic' },
  { label: 'Lab Block', value: 'lab_block' },
  { label: 'Admin', value: 'admin' },
  { label: 'Shared', value: 'shared' },
]

const ownershipOptions = [
  { label: 'Shared', value: 'shared' },
  { label: 'Faculty', value: 'faculty' },
  { label: 'Department', value: 'department' },
  { label: 'Program', value: 'program' },
]

const unwrap = (response: any) => response?.data?.data || response?.data || response || {}

const roomTypeOptions = computed(() => {
  return (context.room_types || []).map((type: any) => ({
    label: type.label,
    value: type.value,
    code: type.code,
    is_lab_space: type.is_lab_space,
  }))
})

const roomTypeCodeOptions = computed(() => {
  return (context.room_types || []).map((type: any) => ({
    label: type.label,
    value: type.code,
  }))
})

const filteredFloorOptions = computed(() => {
  if (!roomForm.campus_building_id) {
    return context.floors || []
  }

  return (context.floors || []).filter(
    (floor: any) => Number(floor.campus_building_id) === Number(roomForm.campus_building_id),
  )
})

const loadContext = async () => {
  loadingContext.value = true

  try {
    const response: any = await api.getResourceManagementContext({
      campus_building_id: roomForm.campus_building_id || undefined,
    })

    const payload = unwrap(response)

    context.buildings = payload.buildings || []
    context.floors = payload.floors || []
    context.room_types = payload.room_types || []
    context.room_features = payload.room_features || []
    context.resource_types = payload.resource_types || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load resource context.')
  } finally {
    loadingContext.value = false
  }
}

const loadBuildings = async () => {
  loadingBuildings.value = true

  try {
    const response: any = await api.getCampusBuildings({ per_page: 100 })
    const payload = unwrap(response)

    buildings.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load buildings.')
  } finally {
    loadingBuildings.value = false
  }
}

const loadFloors = async () => {
  loadingFloors.value = true

  try {
    const response: any = await api.getCampusFloors({ per_page: 100 })
    const payload = unwrap(response)

    floors.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load floors.')
  } finally {
    loadingFloors.value = false
  }
}

const loadRooms = async () => {
  loadingRooms.value = true

  try {
    const response: any = await api.getRooms({ per_page: 100 })
    const payload = unwrap(response)

    rooms.value = payload.data || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load rooms.')
  } finally {
    loadingRooms.value = false
  }
}

const loadAvailableRooms = async () => {
  loadingAvailableRooms.value = true

  try {
    const response: any = await api.getAvailableRooms({
      room_type_code: lookupFilters.room_type_code || undefined,
      required_capacity: lookupFilters.required_capacity || undefined,
      requires_lab: lookupFilters.requires_lab ? 1 : undefined,
      requires_multimedia: lookupFilters.requires_multimedia ? 1 : undefined,
      requires_projector: lookupFilters.requires_projector ? 1 : undefined,
      requires_computers: lookupFilters.requires_computers ? 1 : undefined,
    })

    availableRooms.value = unwrap(response) || []
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to load matching rooms.')
  } finally {
    loadingAvailableRooms.value = false
  }
}

const saveBuilding = async () => {
  if (!buildingForm.building_code || !buildingForm.building_name) {
    message.error('Building code and name are required.')
    return
  }

  savingBuilding.value = true

  try {
    await api.createCampusBuilding({ ...buildingForm })
    message.success('Building saved.')

    buildingForm.building_code = ''
    buildingForm.building_name = ''

    await Promise.all([loadBuildings(), loadContext()])
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save building.')
  } finally {
    savingBuilding.value = false
  }
}

const saveFloor = async () => {
  if (!floorForm.campus_building_id || !floorForm.floor_code || !floorForm.floor_name) {
    message.error('Building, floor code and floor name are required.')
    return
  }

  savingFloor.value = true

  try {
    await api.createCampusFloor({ ...floorForm })
    message.success('Floor saved.')

    floorForm.floor_code = ''
    floorForm.floor_name = ''

    await Promise.all([loadFloors(), loadContext()])
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save floor.')
  } finally {
    savingFloor.value = false
  }
}

const onRoomBuildingChange = async () => {
  roomForm.campus_floor_id = undefined
  await loadContext()
}

const onRoomTypeChange = () => {
  const selected = roomTypeOptions.value.find((type: any) => Number(type.value) === Number(roomForm.room_type_id))

  if (!selected) return

  roomForm.room_type_code = selected.code

  if (selected.is_lab_space) {
    roomForm.is_lab = true
    roomForm.has_computers = true
  }
}

const saveRoom = async () => {
  if (!roomForm.room_code || !roomForm.room_name) {
    message.error('Room code and room name are required.')
    return
  }

  savingRoom.value = true

  try {
    await api.createRoom({ ...roomForm })
    message.success('Room saved.')

    roomForm.room_code = ''
    roomForm.room_name = ''

    await loadRooms()
  } catch (error: any) {
    message.error(error?.data?.message || 'Unable to save room.')
  } finally {
    savingRoom.value = false
  }
}

const loadAll = async () => {
  await Promise.all([
    loadContext(),
    loadBuildings(),
    loadFloors(),
    loadRooms(),
  ])
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
</style>