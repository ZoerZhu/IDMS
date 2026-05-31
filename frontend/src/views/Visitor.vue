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
        新增预约
      </button>
    </div>

    <div class="glass">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>申请人</th><th>楼栋</th><th>房间</th><th>访客姓名</th><th>身份证</th><th>事由</th><th>来访时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in list" :key="v.id">
              <td>{{ v.user_name }}</td>
              <td>{{ v.building }}</td>
              <td>{{ v.room }}</td>
              <td>{{ v.visitor_name }}</td>
              <td class="text-sm">{{ v.visitor_id_card }}</td>
              <td class="text-sm">{{ v.reason }}</td>
              <td class="text-sm">{{ v.visit_time }}</td>
              <td><span :class="['badge', statusClass[v.status]]">{{ statusMap[v.status] }}</span></td>
              <td>
                <div class="flex gap-sm">
                  <template v-if="auth.isAdmin && v.status === 'pending'">
                    <button class="btn btn-sm btn-success" @click="approve(v.id)">
                      <AppIcon name="Check" :size="15" />
                      批准
                    </button>
                    <button class="btn btn-sm btn-danger" @click="reject(v.id)">
                      <AppIcon name="X" :size="15" />
                      拒绝
                    </button>
                  </template>
                  <button v-if="auth.isAdmin" class="btn btn-sm btn-ghost" @click="remove(v.id)">
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

    <GlassModal v-model="showForm" title="访客预约" width="460px">
      <form @submit.prevent="submit" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">访客姓名</label>
          <input v-model="form.visitor_name" class="input" placeholder="请输入访客姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">身份证号</label>
          <input v-model="form.visitor_id_card" class="input" placeholder="请输入身份证号" />
        </div>
        <div class="form-group">
          <label class="form-label">来访事由</label>
          <textarea v-model="form.reason" class="textarea" placeholder="来访原因..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">来访时间</label>
          <input v-model="form.visit_time" class="input" placeholder="2026-05-30 14:00" />
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
const form = reactive({ visitor_name: '', visitor_id_card: '', reason: '', visit_time: '' })

const statusMap = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
const statusClass = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' }

async function load() {
  const params = filter.value ? `?status=${filter.value}` : ''
  const res = await api.get(`/visitors${params}`)
  if (res.code === 0) list.value = res.data
}

async function submit() {
  if (!form.visitor_name) { toast.warning('请输入访客姓名'); return }
  const res = await api.post('/visitors', form)
  if (res.code === 0) {
    toast.success('预约提交成功')
    showForm.value = false
    Object.assign(form, { visitor_name: '', visitor_id_card: '', reason: '', visit_time: '' })
    load()
  }
}

async function approve(id) {
  await api.put(`/visitors/${id}`, { status: 'approved' })
  toast.success('已批准')
  load()
}

async function reject(id) {
  await api.put(`/visitors/${id}`, { status: 'rejected' })
  toast.success('已拒绝')
  load()
}

async function remove(id) {
  await api.delete(`/visitors/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>
