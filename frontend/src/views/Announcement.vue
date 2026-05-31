<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <span class="text-secondary text-sm">共 {{ list.length }} 条公告</span>
      <button v-if="auth.isAdmin" class="btn btn-primary" @click="showForm = true">
        <AppIcon name="Plus" :size="16" />
        发布公告
      </button>
    </div>

    <div class="ann-list">
      <div v-for="a in list" :key="a.id" :class="['ann-card glass', { pinned: a.is_pinned }]">
        <div class="ann-header">
          <div class="flex items-center gap-sm">
            <span v-if="a.is_pinned" class="pin-badge">
              <AppIcon name="Pin" :size="13" />
              置顶
            </span>
            <h3 class="ann-title">{{ a.title }}</h3>
          </div>
          <button v-if="auth.isAdmin" class="btn btn-ghost btn-sm" @click="remove(a.id)" aria-label="删除公告">
            <AppIcon name="Trash2" :size="15" />
          </button>
        </div>
        <p class="ann-content text-secondary">{{ a.content }}</p>
        <div class="ann-meta text-sm">
          <span>{{ a.author_name }}</span>
          <span>{{ formatTime(a.created_at) }}</span>
        </div>
      </div>
      <div v-if="list.length === 0" class="glass" style="padding:60px;text-align:center">
        <AppIcon name="Megaphone" :size="40" style="margin-bottom:12px" />
        <div class="text-secondary">暂无公告</div>
      </div>
    </div>

    <GlassModal v-model="showForm" title="发布公告" width="520px">
      <form @submit.prevent="submit" class="flex flex-col gap-md">
        <div class="form-group">
          <label class="form-label">标题</label>
          <input v-model="form.title" class="input" placeholder="公告标题..." />
        </div>
        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea v-model="form.content" class="textarea" rows="6" placeholder="公告内容..."></textarea>
        </div>
        <div class="flex items-center gap-sm">
          <input type="checkbox" v-model="form.is_pinned" id="pinned" />
          <label for="pinned" class="form-label" style="margin:0;cursor:pointer">置顶</label>
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
const showForm = ref(false)
const form = reactive({ title: '', content: '', is_pinned: false })

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`
}

async function load() {
  const res = await api.get('/announcements')
  if (res.code === 0) list.value = res.data
}

async function submit() {
  if (!form.title) { toast.warning('请输入标题'); return }
  const res = await api.post('/announcements', form)
  if (res.code === 0) {
    toast.success('公告已发布')
    showForm.value = false
    form.title = ''; form.content = ''; form.is_pinned = false
    load()
  }
}

async function remove(id) {
  await api.delete(`/announcements/${id}`)
  toast.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.ann-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ann-card {
  padding: 20px 24px;
  transition: var(--transition);
}
.ann-card.pinned {
  border-left: 3px solid var(--accent);
  background: rgba(102, 126, 234, 0.04);
}
.ann-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}
.ann-title {
  font-size: 16px;
  font-weight: 600;
}
.pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 50px;
  background: rgba(17,17,17,0.08);
  color: var(--text-primary);
  flex-shrink: 0;
}
.ann-content {
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 12px;
}
.ann-meta {
  display: flex;
  gap: 16px;
  color: var(--text-tertiary);
}
</style>
