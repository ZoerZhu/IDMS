<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div class="flex gap-sm items-center">
        <span class="text-secondary text-sm">共 {{ list.length }} 条记录</span>
      </div>
      <button v-if="auth.isAdmin" class="btn btn-primary" @click="showForm = true">
        <AppIcon name="Plus" :size="16" />
        新增检查
      </button>
    </div>

    <!-- Level Stats -->
    <div class="grid-4 mb-md">
      <div v-for="lv in levelStats" :key="lv.key" class="glass level-card">
        <span class="level-icon"><AppIcon :name="lv.icon" :size="24" /></span>
        <div>
          <div class="level-count">{{ lv.count }}</div>
          <div class="text-sm text-secondary">{{ lv.label }}</div>
        </div>
      </div>
    </div>

    <div class="glass">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>房间</th><th>楼栋</th><th>评分</th><th>等级</th><th>检查人</th><th>评语</th><th>时间</th><th v-if="auth.isAdmin">操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="h in list" :key="h.id">
              <td>{{ h.room_number }}</td>
              <td>{{ h.building }}</td>
              <td>
                <span class="score-badge" :style="{ background: scoreColor(h.score) }">{{ h.score }}</span>
              </td>
              <td><span :class="['badge', levelClass[h.level]]">{{ levelMap[h.level] }}</span></td>
              <td>{{ h.inspector_name }}</td>
              <td class="text-sm" style="max-width:200px">{{ h.comment }}</td>
              <td class="text-sm text-secondary">{{ formatTime(h.created_at) }}</td>
              <td v-if="auth.isAdmin">
                <button class="btn btn-sm btn-danger" @click="remove(h.id)">
                  <AppIcon name="Trash2" :size="15" />
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td :colspan="auth.isAdmin ? 8 : 7" class="text-center text-secondary" style="padding:40px">
                <AppIcon name="Inbox" :size="28" style="margin-bottom:8px" />
                <div>暂无记录</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <GlassModal v-model="showForm" title="新增卫生检查" width="460px">
      <form @submit.prevent="submit" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">房间</label>
          <select v-model="form.room_id" class="select">
            <option value="">请选择房间</option>
            <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.building_name }} {{ r.number }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">评分 (1-10)</label>
          <input v-model.number="form.score" type="range" min="1" max="10" class="range-input" />
          <div class="flex justify-between text-sm text-secondary">
            <span>1 差</span>
            <span style="font-size:20px;font-weight:700;color:var(--text-primary)">{{ form.score }}</span>
            <span>10 优</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">评语</label>
          <textarea v-model="form.comment" class="textarea" placeholder="检查评语..."></textarea>
        </div>
        <div class="flex justify-between" style="margin-top:8px">
          <button type="button" class="btn btn-secondary" @click="showForm = false">取消</button>
          <button type="submit" class="btn btn-primary">
            <AppIcon name="Send" :size="16" />
            提交
          </button>
        </div>
      </form>
    </GlassModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import GlassModal from '../components/GlassModal.vue'
import api from '../api'

const auth = useAuthStore()
const toast = useToastStore()
const list = ref([])
const rooms = ref([])
const showForm = ref(false)
const form = reactive({ room_id: '', score: 8, comment: '' })

const levelMap = { excellent: '优秀', good: '良好', average: '一般', poor: '差' }
const levelClass = { excellent: 'badge-success', good: 'badge-info', average: 'badge-warning', poor: 'badge-danger' }

const levelStats = computed(() => {
  const counts = { excellent: 0, good: 0, average: 0, poor: 0 }
  list.value.forEach(h => { if (counts[h.level] !== undefined) counts[h.level]++ })
  return [
    { key: 'excellent', label: '优秀', icon: 'BadgeCheck', count: counts.excellent },
    { key: 'good', label: '良好', icon: 'ThumbsUp', count: counts.good },
    { key: 'average', label: '一般', icon: 'MinusCircle', count: counts.average },
    { key: 'poor', label: '差', icon: 'CircleAlert', count: counts.poor },
  ]
})

function scoreColor(s) {
  if (s >= 9) return 'rgba(52,211,153,0.2)'
  if (s >= 7) return 'rgba(96,165,250,0.2)'
  if (s >= 5) return 'rgba(251,191,36,0.2)'
  return 'rgba(248,113,113,0.2)'
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

async function load() {
  const [hygRes, roomsRes] = await Promise.all([api.get('/hygiene'), api.get('/rooms')])
  if (hygRes.code === 0) list.value = hygRes.data
  if (roomsRes.code === 0) rooms.value = roomsRes.data
}

async function submit() {
  if (!form.room_id) { toast.warning('请选择房间'); return }
  const res = await api.post('/hygiene', form)
  if (res.code === 0) {
    toast.success('检查记录已提交')
    showForm.value = false
    load()
  }
}

async function remove(id) {
  await api.delete(`/hygiene/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.level-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}
.level-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 17px;
  background: rgba(17,17,17,0.07);
}
.level-count { font-size: 24px; font-weight: 700; }
.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
}
.range-input {
  width: 100%;
  accent-color: var(--accent);
  height: 6px;
}
</style>
