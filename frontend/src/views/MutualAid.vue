<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div class="flex gap-sm">
        <button v-for="s in ['','open','accepted','done']" :key="s"
          :class="['btn btn-sm', filter === s ? 'btn-primary' : 'btn-secondary']"
          @click="filter = s; load()">
          {{ { '': '全部', open: '进行中', accepted: '已接单', done: '已完成' }[s] }}
        </button>
      </div>
      <button class="btn btn-primary" @click="showForm = true">
        <AppIcon name="Plus" :size="16" />
        发布互助
      </button>
    </div>

    <div class="aid-grid">
      <div v-for="a in list" :key="a.id" class="aid-card glass">
        <div class="aid-header">
          <span class="aid-type-badge">
            <AppIcon :name="typeIcon[a.type]" :size="15" />
            {{ typeMap[a.type] }}
          </span>
          <span :class="['badge', statusClass[a.status]]">{{ statusMap[a.status] }}</span>
        </div>
        <h4 class="aid-title">{{ a.title }}</h4>
        <p class="text-sm text-secondary aid-desc">{{ a.description }}</p>
        <div class="aid-footer">
          <div class="text-sm text-secondary">
            <span>发布: {{ a.user_name }}</span>
            <span v-if="a.helper_name" style="margin-left:12px">帮助: {{ a.helper_name }}</span>
          </div>
          <div class="flex gap-sm">
            <button v-if="a.status === 'open' && a.user_id !== auth.user?.id"
              class="btn btn-sm btn-success" @click="accept(a.id)">
              <AppIcon name="HandHeart" :size="15" />
              我来帮
            </button>
            <button v-if="a.status === 'accepted' && (a.helper_id === auth.user?.id || auth.isAdmin)"
              class="btn btn-sm btn-primary" @click="complete(a.id)">
              <AppIcon name="Check" :size="15" />
              完成
            </button>
            <button v-if="a.user_id === auth.user?.id || auth.isAdmin"
              class="btn btn-sm btn-ghost" @click="remove(a.id)">
              <AppIcon name="Trash2" :size="15" />
              删除
            </button>
          </div>
        </div>
      </div>
      <div v-if="list.length === 0" class="glass" style="padding:60px;text-align:center;grid-column:1/-1">
        <AppIcon name="HeartHandshake" :size="40" style="margin-bottom:12px" />
        <div class="text-secondary">暂无互助信息</div>
      </div>
    </div>

    <GlassModal v-model="showForm" title="发布互助" width="460px">
      <form @submit.prevent="submit" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">互助类型</label>
          <select v-model="form.type" class="select">
            <option value="delivery">代取快递</option>
            <option value="carpool">拼车出行</option>
            <option value="borrow">借用物品</option>
            <option value="study">学习互助</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">标题</label>
          <input v-model="form.title" class="input" placeholder="简要描述..." />
        </div>
        <div class="form-group">
          <label class="form-label">详细描述</label>
          <textarea v-model="form.description" class="textarea" placeholder="详细说明..."></textarea>
        </div>
        <div class="flex justify-between" style="margin-top:8px">
          <button type="button" class="btn btn-secondary" @click="showForm = false">取消</button>
          <button type="submit" class="btn btn-primary">
            <AppIcon name="Send" :size="16" />
            发布
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
const form = reactive({ type: 'other', title: '', description: '' })

const typeMap = { delivery: '代取快递', carpool: '拼车出行', borrow: '借用物品', study: '学习互助', other: '其他' }
const typeIcon = { delivery: 'Package', carpool: 'Car', borrow: 'Repeat2', study: 'BookOpen', other: 'Lightbulb' }
const statusMap = { open: '进行中', accepted: '已接单', done: '已完成' }
const statusClass = { open: 'badge-info', accepted: 'badge-warning', done: 'badge-success' }

async function load() {
  const params = filter.value ? `?status=${filter.value}` : ''
  const res = await api.get(`/mutual-aids${params}`)
  if (res.code === 0) list.value = res.data
}

async function submit() {
  if (!form.title) { toast.warning('请输入标题'); return }
  const res = await api.post('/mutual-aids', form)
  if (res.code === 0) {
    toast.success('互助信息已发布')
    showForm.value = false
    form.title = ''; form.description = ''
    load()
  }
}

async function accept(id) {
  await api.put(`/mutual-aids/${id}`, { status: 'accepted' })
  toast.success('已接单')
  load()
}

async function complete(id) {
  await api.put(`/mutual-aids/${id}`, { status: 'done' })
  toast.success('已完成')
  load()
}

async function remove(id) {
  await api.delete(`/mutual-aids/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.aid-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
.aid-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.aid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.aid-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 50px;
  background: rgba(17,17,17,0.06);
}
.aid-title {
  font-size: 16px;
  font-weight: 600;
}
.aid-desc {
  flex: 1;
}
.aid-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(17,17,17,0.07);
}
</style>
