<template>
  <div>
    <!-- Stats Row -->
    <div class="grid-3 mb-md">
      <div class="glass stat-box">
        <div class="stat-icon"><AppIcon name="Zap" :size="25" /></div>
        <div>
          <div class="stat-num">{{ stats.avg_watt || 0 }}W</div>
          <div class="text-sm text-secondary">平均功率</div>
        </div>
      </div>
      <div class="glass stat-box">
        <div class="stat-icon danger"><AppIcon name="CircleAlert" :size="25" /></div>
        <div>
          <div class="stat-num" style="color:var(--danger)">{{ stats.warnings || 0 }}</div>
          <div class="text-sm text-secondary">告警次数</div>
        </div>
      </div>
      <div class="glass stat-box">
        <div class="stat-icon"><AppIcon name="ChartNoAxesColumn" :size="25" /></div>
        <div>
          <div class="stat-num">{{ stats.total_records || 0 }}</div>
          <div class="text-sm text-secondary">监测记录</div>
        </div>
      </div>
    </div>

    <!-- Toggle -->
    <div class="flex gap-sm mb-md">
      <button :class="['btn btn-sm', tab==='latest'?'btn-primary':'btn-secondary']" @click="tab='latest'">实时功率</button>
      <button :class="['btn btn-sm', tab==='warnings'?'btn-primary':'btn-secondary']" @click="tab='warnings'">告警记录</button>
      <button v-if="auth.isAdmin" class="btn btn-sm btn-warning" @click="showRecord = true">
        <AppIcon name="Plus" :size="15" />
        录入数据
      </button>
    </div>

    <!-- Latest Power -->
    <div v-if="tab==='latest'" class="glass">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>楼栋</th><th>房间</th><th>当前功率</th><th>阈值</th><th>状态</th><th>时间</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in latest" :key="p.id">
              <td>{{ p.building }}</td>
              <td>{{ p.room_number }}</td>
              <td>
                <div class="flex items-center gap-sm">
                  <div class="power-bar">
                    <div class="power-fill" :style="{
                      width: Math.min(p.watt / p.threshold * 100, 100) + '%',
                      background: p.is_warning ? 'var(--danger)' : 'var(--success)'
                    }"></div>
                  </div>
                  <span :style="{color: p.is_warning ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600}">
                    {{ p.watt }}W
                  </span>
                </div>
              </td>
              <td>{{ p.threshold }}W</td>
              <td>
                <span :class="['badge', p.is_warning ? 'badge-danger' : 'badge-success']">
                  {{ p.is_warning ? '超限' : '正常' }}
                </span>
              </td>
              <td class="text-sm text-secondary">{{ formatTime(p.created_at) }}</td>
            </tr>
            <tr v-if="latest.length === 0">
              <td colspan="6" class="text-center text-secondary" style="padding:40px">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Warning Records -->
    <div v-if="tab==='warnings'" class="glass">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>楼栋</th><th>房间</th><th>功率</th><th>阈值</th><th>超限</th><th>时间</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in warnings" :key="p.id">
              <td>{{ p.building }}</td>
              <td>{{ p.room_number }}</td>
              <td style="color:var(--danger);font-weight:600">{{ p.watt }}W</td>
              <td>{{ p.threshold }}W</td>
              <td style="color:var(--danger)">+{{ (p.watt - p.threshold).toFixed(0) }}W</td>
              <td class="text-sm text-secondary">{{ formatTime(p.created_at) }}</td>
            </tr>
            <tr v-if="warnings.length === 0">
              <td colspan="6" class="text-center text-secondary" style="padding:40px">
                <AppIcon name="ShieldCheck" :size="28" style="margin-bottom:8px" />
                <div>暂无告警</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Record Modal -->
    <GlassModal v-model="showRecord" title="录入用电数据" width="420px">
      <form @submit.prevent="recordPower" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">房间</label>
          <select v-model="recordForm.room_id" class="select">
            <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.building_name }} {{ r.number }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">功率 (W)</label>
          <input v-model.number="recordForm.watt" type="number" class="input" placeholder="当前功率" />
        </div>
        <div class="form-group">
          <label class="form-label">阈值 (W)</label>
          <input v-model.number="recordForm.threshold" type="number" class="input" />
        </div>
        <div class="flex justify-between" style="margin-top:8px">
          <button type="button" class="btn btn-secondary" @click="showRecord = false">取消</button>
          <button type="submit" class="btn btn-primary">
            <AppIcon name="Save" :size="16" />
            录入
          </button>
        </div>
      </form>
    </GlassModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import GlassModal from '../components/GlassModal.vue'
import api from '../api'

const auth = useAuthStore()
const toast = useToastStore()
const tab = ref('latest')
const latest = ref([])
const warnings = ref([])
const rooms = ref([])
const stats = ref({})
const showRecord = ref(false)
const recordForm = reactive({ room_id: '', watt: 0, threshold: 2000 })

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

async function load() {
  const [latestRes, warnRes, statsRes, roomsRes] = await Promise.all([
    api.get('/power/latest'),
    api.get('/power?is_warning=true'),
    api.get('/power/stats'),
    api.get('/rooms')
  ])
  if (latestRes.code === 0) latest.value = latestRes.data
  if (warnRes.code === 0) warnings.value = warnRes.data
  if (statsRes.code === 0) stats.value = statsRes.data
  if (roomsRes.code === 0) rooms.value = roomsRes.data
}

async function recordPower() {
  if (!recordForm.room_id || !recordForm.watt) { toast.warning('请填写完整'); return }
  const res = await api.post('/power/record', recordForm)
  if (res.code === 0) {
    if (res.data.is_warning) toast.error(`功率超标：${res.data.watt}W > ${res.data.threshold}W`)
    else toast.success('数据录入成功')
    showRecord.value = false
    load()
  }
}

onMounted(load)
</script>

<style scoped>
.stat-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.stat-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 18px;
  background: rgba(17,17,17,0.07);
}
.stat-icon.danger {
  background: rgba(192,47,54,0.1);
  color: var(--danger);
}
.stat-num { font-size: 24px; font-weight: 700; }
.power-bar {
  width: 80px;
  height: 6px;
  background: rgba(17,17,17,0.07);
  border-radius: 3px;
  overflow: hidden;
}
.power-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
</style>
