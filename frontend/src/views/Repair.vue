<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div class="flex gap-sm">
        <button v-for="s in ['','pending','processing','done']" :key="s"
          :class="['btn btn-sm', filter === s ? 'btn-primary' : 'btn-secondary']"
          @click="filter = s; load()">
          {{ { '': '全部', pending: '待处理', processing: '维修中', done: '已完成' }[s] }}
        </button>
      </div>
      <button class="btn btn-primary" @click="showForm = true">
        <AppIcon name="Plus" :size="16" />
        提交报修
      </button>
    </div>

    <div class="glass">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>报修人</th>
              <th>楼栋</th>
              <th>房间</th>
              <th>类型</th>
              <th>描述</th>
              <th>紧急度</th>
              <th>状态</th>
              <th>维修员</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in list" :key="r.id">
              <td>{{ r.user_name }}</td>
              <td>{{ r.building }}</td>
              <td>{{ r.room_number }}</td>
              <td><span class="badge badge-info">{{ typeMap[r.type] }}</span></td>
              <td class="text-sm" style="max-width:200px">{{ r.description }}</td>
              <td><span :class="['badge', urgencyClass[r.urgency]]">{{ urgencyMap[r.urgency] }}</span></td>
              <td><span :class="['badge', statusClass[r.status]]">{{ statusMap[r.status] }}</span></td>
              <td>{{ r.assigned_to || '-' }}</td>
              <td>
                <div class="flex gap-sm">
                  <button v-if="auth.isAdmin && r.status !== 'done'" class="btn btn-sm btn-success"
                    @click="updateStatus(r)">
                    <AppIcon name="CirclePlay" :size="15" />
                    处理
                  </button>
                  <button v-if="auth.isAdmin" class="btn btn-sm btn-danger"
                    @click="remove(r.id)">
                    <AppIcon name="Trash2" :size="15" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="9" class="text-center text-secondary" style="padding:40px">
                <AppIcon name="Inbox" :size="28" style="margin-bottom:8px" />
                <div>暂无数据</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Submit Form Modal -->
    <GlassModal v-model="showForm" title="提交报修" width="500px">
      <form @submit.prevent="submit" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">报修类型</label>
          <select v-model="form.type" class="select">
            <option value="water">水电</option>
            <option value="electric">电路</option>
            <option value="furniture">家具</option>
            <option value="network">网络</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">紧急程度</label>
          <select v-model="form.urgency" class="select">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">问题描述</label>
          <textarea v-model="form.description" class="textarea" placeholder="请详细描述问题..."></textarea>
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
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import GlassModal from '../components/GlassModal.vue'
import api from '../api'

const auth = useAuthStore()
const toast = useToastStore()
const list = ref([])
const filter = ref('')
const showForm = ref(false)
const form = reactive({ type: 'other', urgency: 'medium', description: '' })

const typeMap = { water: '水电', electric: '电路', furniture: '家具', network: '网络', other: '其他' }
const urgencyMap = { low: '低', medium: '中', high: '高' }
const statusMap = { pending: '待处理', processing: '维修中', done: '已完成' }
const urgencyClass = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger' }
const statusClass = { pending: 'badge-warning', processing: 'badge-info', done: 'badge-success' }

async function load() {
  const params = filter.value ? `?status=${filter.value}` : ''
  const res = await api.get(`/repairs${params}`)
  if (res.code === 0) list.value = res.data
}

async function submit() {
  if (!form.description) { toast.warning('请填写问题描述'); return }
  const res = await api.post('/repairs', form)
  if (res.code === 0) {
    toast.success('报修提交成功')
    showForm.value = false
    form.description = ''
    load()
  }
}

async function updateStatus(r) {
  const next = { pending: 'processing', processing: 'done' }
  const assigned = r.status === 'pending' ? '王师傅' : r.assigned_to
  await api.put(`/repairs/${r.id}`, {
    status: next[r.status] || 'done',
    assigned_to: assigned
  })
  toast.success('状态已更新')
  load()
}

async function remove(id) {
  await api.delete(`/repairs/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>
