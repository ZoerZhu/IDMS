<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <span class="text-secondary text-sm">共 {{ buildings.length }} 栋楼</span>
      <button class="btn btn-primary" @click="showBuilding = true">
        <AppIcon name="Plus" :size="16" />
        新增楼栋
      </button>
    </div>

    <div class="building-grid">
      <div v-for="b in buildings" :key="b.id" class="building-card glass">
        <div class="building-header">
          <div>
            <h3>{{ b.name }}</h3>
            <div class="text-sm text-secondary">{{ b.floors }} 层 · {{ b.room_count }} 间</div>
          </div>
          <button class="btn btn-sm btn-danger" @click="deleteBuilding(b.id)">
            <AppIcon name="Trash2" :size="15" />
            删除
          </button>
        </div>

        <div class="room-section">
          <div class="flex justify-between items-center mb-sm">
            <span class="text-sm text-secondary">房间列表</span>
            <button class="btn btn-sm btn-secondary" @click="openAddRoom(b.id)">
              <AppIcon name="Plus" :size="15" />
              添加房间
            </button>
          </div>
          <div class="room-grid">
            <div v-for="r in buildingRooms[b.id]" :key="r.id" class="room-chip">
              <span>{{ r.number }}</span>
              <span class="text-sm text-secondary">{{ r.occupant_count }}/{{ r.capacity }}</span>
              <button class="room-del" @click="deleteRoom(r.id)" aria-label="删除房间">
                <AppIcon name="X" :size="12" />
              </button>
            </div>
            <div v-if="!buildingRooms[b.id]?.length" class="text-sm text-secondary" style="padding:10px">
              暂无房间
            </div>
          </div>
        </div>
      </div>
      <div v-if="buildings.length === 0" class="glass" style="padding:60px;text-align:center;grid-column:1/-1">
        <AppIcon name="Building2" :size="40" style="margin-bottom:12px" />
        <div class="text-secondary">暂无楼栋</div>
      </div>
    </div>

    <!-- Add Building -->
    <GlassModal v-model="showBuilding" title="新增楼栋" width="400px">
      <form @submit.prevent="addBuilding" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">楼栋名称</label>
          <input v-model="buildingForm.name" class="input" placeholder="如: 梅园3号楼" />
        </div>
        <div class="form-group">
          <label class="form-label">楼层数</label>
          <input v-model.number="buildingForm.floors" type="number" class="input" min="1" max="30" />
        </div>
        <div class="flex justify-between" style="margin-top:8px">
          <button type="button" class="btn btn-secondary" @click="showBuilding = false">取消</button>
          <button type="submit" class="btn btn-primary">
            <AppIcon name="Save" :size="16" />
            创建
          </button>
        </div>
      </form>
    </GlassModal>

    <!-- Add Room -->
    <GlassModal v-model="showRoom" title="添加房间" width="400px">
      <form @submit.prevent="addRoom" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">楼层</label>
          <input v-model.number="roomForm.floor" type="number" class="input" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label">房间号</label>
          <input v-model="roomForm.number" class="input" placeholder="如: 301" />
        </div>
        <div class="form-group">
          <label class="form-label">容量</label>
          <input v-model.number="roomForm.capacity" type="number" class="input" min="1" max="8" />
        </div>
        <div class="flex justify-between" style="margin-top:8px">
          <button type="button" class="btn btn-secondary" @click="showRoom = false">取消</button>
          <button type="submit" class="btn btn-primary">
            <AppIcon name="Save" :size="16" />
            添加
          </button>
        </div>
      </form>
    </GlassModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import GlassModal from '../components/GlassModal.vue'
import api from '../api'

const toast = useToastStore()
const buildings = ref([])
const buildingRooms = ref({})
const showBuilding = ref(false)
const showRoom = ref(false)
const buildingForm = reactive({ name: '', floors: 6 })
const roomForm = reactive({ building_id: '', floor: 1, number: '', capacity: 4 })

async function load() {
  const res = await api.get('/buildings')
  if (res.code === 0) {
    buildings.value = res.data
    for (const b of res.data) {
      const rRes = await api.get(`/rooms?building_id=${b.id}`)
      if (rRes.code === 0) buildingRooms.value[b.id] = rRes.data
    }
  }
}

async function addBuilding() {
  if (!buildingForm.name) { toast.warning('请输入楼栋名称'); return }
  const res = await api.post('/buildings', buildingForm)
  if (res.code === 0) {
    toast.success('楼栋已创建')
    showBuilding.value = false
    buildingForm.name = ''; buildingForm.floors = 6
    load()
  }
}

async function deleteBuilding(id) {
  await api.delete(`/buildings/${id}`)
  toast.success('已删除')
  load()
}

function openAddRoom(buildingId) {
  roomForm.building_id = buildingId
  roomForm.floor = 1
  roomForm.number = ''
  roomForm.capacity = 4
  showRoom.value = true
}

async function addRoom() {
  if (!roomForm.number) { toast.warning('请输入房间号'); return }
  const res = await api.post('/rooms', roomForm)
  if (res.code === 0) {
    toast.success('房间已添加')
    showRoom.value = false
    load()
  }
}

async function deleteRoom(id) {
  await api.delete(`/rooms/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}
.building-card {
  padding: 20px;
}
.building-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.building-header h3 {
  font-size: 18px;
  font-weight: 600;
}
.room-section {
  padding-top: 14px;
  border-top: 1px solid rgba(17,17,17,0.07);
}
.room-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.room-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(17,17,17,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  font-size: 13px;
  position: relative;
}
.room-del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--danger);
  color: #fff;
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
}
.room-chip:hover .room-del { display: flex; }
</style>
