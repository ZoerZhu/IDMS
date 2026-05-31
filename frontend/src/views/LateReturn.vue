<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div class="flex gap-sm">
        <button v-for="s in ['','pending','approved','rejected']" :key="s"
          :class="['btn btn-sm', filter === s ? 'btn-primary' : 'btn-secondary']"
          @click="filter = s; load()">
          {{ { '': '全部', pending: '待审批', approved: '已批准', rejected: '已拒绝' }[s] }}
        </button>
      </div>
      <button class="btn btn-primary" @click="showForm = true">
        <AppIcon name="Plus" :size="16" />
        晚归报备
      </button>
    </div>

    <div class="glass">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>姓名</th><th>楼栋</th><th>房间</th><th>事由</th><th>预计回寝</th><th>实际回寝</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="l in list" :key="l.id">
              <td>{{ l.user_name }}</td>
              <td>{{ l.building }}</td>
              <td>{{ l.room }}</td>
              <td class="text-sm">{{ l.reason }}</td>
              <td>{{ l.expected_time }}</td>
              <td>{{ l.actual_time || '-' }}</td>
              <td><span :class="['badge', statusClass[l.status]]">{{ statusMap[l.status] }}</span></td>
              <td>
                <div class="flex gap-sm">
                  <template v-if="auth.isAdmin && l.status === 'pending'">
                    <button class="btn btn-sm btn-success" @click="approve(l.id)">
                      <AppIcon name="Check" :size="15" />
                      批准
                    </button>
                    <button class="btn btn-sm btn-danger" @click="reject(l.id)">
                      <AppIcon name="X" :size="15" />
                      拒绝
                    </button>
                  </template>
                  <button v-if="auth.isAdmin" class="btn btn-sm btn-ghost" @click="remove(l.id)">
                    <AppIcon name="Trash2" :size="15" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="8" class="text-center text-secondary" style="padding:40px">
                <AppIcon name="Inbox" :size="28" style="margin-bottom:8px" />
                <div>暂无数据</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <GlassModal v-model="showForm" title="晚归报备" width="420px">
      <form @submit.prevent="submit" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">晚归事由</label>
          <textarea v-model="form.reason" class="textarea" placeholder="请说明晚归原因..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">预计回寝时间</label>
          <input v-model="form.expected_time" class="input" placeholder="如: 23:30" />
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
const form = reactive({ reason: '', expected_time: '' })

const statusMap = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
const statusClass = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' }

async function load() {
  const params = filter.value ? `?status=${filter.value}` : ''
  const res = await api.get(`/late-returns${params}`)
  if (res.code === 0) list.value = res.data
}

async function submit() {
  if (!form.reason || !form.expected_time) { toast.warning('请填写完整'); return }
  const res = await api.post('/late-returns', form)
  if (res.code === 0) {
    toast.success('报备提交成功')
    showForm.value = false
    form.reason = ''; form.expected_time = ''
    load()
  }
}

async function approve(id) {
  await api.put(`/late-returns/${id}`, { status: 'approved' })
  toast.success('已批准')
  load()
}

async function reject(id) {
  await api.put(`/late-returns/${id}`, { status: 'rejected' })
  toast.success('已拒绝')
  load()
}

async function remove(id) {
  await api.delete(`/late-returns/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>
