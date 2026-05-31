<template>
  <div class="import-page">
    <section v-if="!auth.isAdmin" class="glass no-access">
      <AppIcon name="ShieldCheck" :size="42" />
      <h3>仅管理员可导入数据</h3>
      <p class="text-secondary">请使用管理员账号进入该功能。</p>
    </section>

    <template v-else>
      <section class="import-hero glass">
        <div>
          <span class="hero-kicker">管理端批量导入</span>
          <h2>下载示例文档，上传后即可一键导入</h2>
          <p>当前支持 CSV 示例文档，Excel/WPS 可直接打开编辑。导入会自动校验必填字段，并写入本地 mock 数据。</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" @click="downloadTemplate">
            <AppIcon name="Download" :size="16" />
            下载当前模板
          </button>
          <button class="btn btn-primary" @click="chooseFile">
            <AppIcon name="Upload" :size="16" />
            上传文档
          </button>
        </div>
      </section>

      <div class="import-grid">
        <aside class="type-panel glass">
          <button
            v-for="type in importTypes"
            :key="type.key"
            :class="['type-card', { active: selectedKey === type.key }]"
            @click="selectType(type.key)"
          >
            <span class="type-icon">
              <AppIcon :name="type.icon" :size="19" />
            </span>
            <span class="type-copy">
              <strong>{{ type.title }}</strong>
              <small>{{ type.desc }}</small>
            </span>
          </button>
        </aside>

        <main class="workspace glass">
          <div class="workspace-header">
            <div>
              <h3>{{ currentType.title }}</h3>
              <p class="text-sm text-secondary">{{ currentType.tip }}</p>
            </div>
            <span class="file-chip">
              <AppIcon name="FileSpreadsheet" :size="16" />
              {{ fileName || '未选择文件' }}
            </span>
          </div>

          <div class="field-strip">
            <span v-for="field in currentType.fields" :key="field.key" :class="['field-pill', { required: field.required }]">
              {{ field.label }}
              <small>{{ field.key }}</small>
            </span>
          </div>

          <input ref="fileInput" class="hidden-input" type="file" accept=".csv,text/csv,text/plain" @change="handleFileChange" />

          <div class="upload-zone" @click="chooseFile">
            <AppIcon name="FileUp" :size="34" />
            <strong>点击上传 CSV 文档</strong>
            <span>请先下载示例模板，保留表头后填写数据再上传。</span>
          </div>

          <div class="action-row">
            <button class="btn btn-secondary" @click="downloadTemplate">
              <AppIcon name="Download" :size="16" />
              下载示例文档
            </button>
            <button class="btn btn-secondary" @click="loadSampleRows">
              <AppIcon name="Eye" :size="16" />
              预览示例数据
            </button>
            <button class="btn btn-primary" :disabled="!canImport || importing" @click="importNow">
              <AppIcon :name="importing ? 'LoaderCircle' : 'Upload'" :class="{ spin: importing }" :size="16" />
              {{ importing ? '导入中' : '一键导入' }}
            </button>
          </div>

          <section class="preview-card">
            <div class="preview-head">
              <h4>导入预览</h4>
              <span class="text-sm text-secondary">{{ parsedRows.length }} 条待导入</span>
            </div>

            <div v-if="validationErrors.length" class="error-list">
              <div v-for="err in validationErrors" :key="err" class="error-item">
                <AppIcon name="CircleAlert" :size="16" />
                {{ err }}
              </div>
            </div>

            <div v-if="parsedRows.length" class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th v-for="field in visibleFields" :key="field.key">{{ field.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in previewRows" :key="index">
                    <td v-for="field in visibleFields" :key="field.key">{{ row[field.key] || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-preview">
              <AppIcon name="Inbox" :size="34" />
              <span>上传文档后会在这里预览前 5 行数据</span>
            </div>
          </section>

          <section v-if="result" class="result-panel">
            <div class="result-card success">
              <strong>{{ result.imported }}</strong>
              <span>导入成功</span>
            </div>
            <div class="result-card danger">
              <strong>{{ result.failed }}</strong>
              <span>失败记录</span>
            </div>
            <div v-if="result.errors?.length" class="result-errors">
              <div v-for="err in result.errors" :key="`${err.row}-${err.message}`">
                第 {{ err.row }} 行：{{ err.message }}
              </div>
            </div>
          </section>
        </main>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api'

const auth = useAuthStore()
const toast = useToastStore()
const fileInput = ref(null)
const selectedKey = ref('buildings-rooms')
const fileName = ref('')
const parsedRows = ref([])
const validationErrors = ref([])
const result = ref(null)
const importing = ref(false)

const importTypes = [
  {
    key: 'buildings-rooms',
    title: '楼栋房间',
    icon: 'Building2',
    desc: '楼栋、楼层、房间容量',
    tip: '用于初始化宿舍资源，楼栋不存在时会自动创建。',
    fields: [
      { key: 'building_name', label: '楼栋名称', required: true },
      { key: 'floors', label: '楼层数' },
      { key: 'room_number', label: '房间号', required: true },
      { key: 'floor', label: '所在楼层' },
      { key: 'capacity', label: '容量' }
    ],
    sample: [
      { building_name: '梅园 5 号楼', floors: '6', room_number: '501', floor: '5', capacity: '4' },
      { building_name: '梅园 5 号楼', floors: '6', room_number: '502', floor: '5', capacity: '4' }
    ]
  },
  {
    key: 'users',
    title: '学生用户',
    icon: 'Users',
    desc: '账号、姓名、寝室分配',
    tip: '用户名重复时会更新已有用户信息，未填写密码时默认 123456。',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'password', label: '密码' },
      { key: 'name', label: '姓名', required: true },
      { key: 'role', label: '角色' },
      { key: 'gender', label: '性别' },
      { key: 'phone', label: '手机号' },
      { key: 'building_name', label: '楼栋名称' },
      { key: 'room_number', label: '房间号' }
    ],
    sample: [
      { username: 'student20', password: '123456', name: '周雨', role: 'student', gender: '女', phone: '13810000020', building_name: '梅园 5 号楼', room_number: '501' },
      { username: 'student21', password: '123456', name: '何川', role: 'student', gender: '男', phone: '13810000021', building_name: '梅园 5 号楼', room_number: '502' }
    ]
  },
  {
    key: 'repairs',
    title: '报修记录',
    icon: 'Wrench',
    desc: '批量导入历史报修',
    tip: '用户名必须已存在，系统会根据用户当前寝室生成楼栋房间信息。',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'type', label: '报修类型' },
      { key: 'description', label: '问题描述', required: true },
      { key: 'urgency', label: '紧急程度' },
      { key: 'status', label: '状态' },
      { key: 'assigned_to', label: '维修员' }
    ],
    sample: [
      { username: 'student1', type: 'electric', description: '台灯插座接触不良', urgency: 'medium', status: 'pending', assigned_to: '' },
      { username: 'student2', type: 'network', description: '寝室网络频繁断连', urgency: 'high', status: 'processing', assigned_to: '王师傅' }
    ]
  },
  {
    key: 'power',
    title: '用电记录',
    icon: 'Zap',
    desc: '功率、阈值、记录时间',
    tip: '楼栋或房间不存在时会自动补齐，功率超过阈值会标记为告警。',
    fields: [
      { key: 'building_name', label: '楼栋名称', required: true },
      { key: 'room_number', label: '房间号', required: true },
      { key: 'watt', label: '功率', required: true },
      { key: 'threshold', label: '阈值' },
      { key: 'created_at', label: '记录时间' }
    ],
    sample: [
      { building_name: '梅园 5 号楼', room_number: '501', watt: '1880', threshold: '2000', created_at: '2026-06-01 20:00' },
      { building_name: '梅园 5 号楼', room_number: '502', watt: '2380', threshold: '2000', created_at: '2026-06-01 20:05' }
    ]
  },
  {
    key: 'hygiene',
    title: '卫生检查',
    icon: 'ClipboardCheck',
    desc: '房间评分与评语',
    tip: '评分会自动换算等级，检查人不填时使用当前管理员。',
    fields: [
      { key: 'building_name', label: '楼栋名称', required: true },
      { key: 'room_number', label: '房间号', required: true },
      { key: 'score', label: '评分', required: true },
      { key: 'comment', label: '评语' },
      { key: 'inspector_username', label: '检查人用户名' },
      { key: 'created_at', label: '检查时间' }
    ],
    sample: [
      { building_name: '梅园 5 号楼', room_number: '501', score: '9', comment: '物品摆放整齐', inspector_username: 'admin', created_at: '2026-06-02 15:00' },
      { building_name: '梅园 5 号楼', room_number: '502', score: '7', comment: '阳台需要整理', inspector_username: 'admin', created_at: '2026-06-02 15:10' }
    ]
  },
  {
    key: 'visitors',
    title: '访客预约',
    icon: 'Users',
    desc: '来访人、事由、审批状态',
    tip: '用户名必须已存在，状态可填 pending、approved、rejected。',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'visitor_name', label: '访客姓名', required: true },
      { key: 'visitor_id_card', label: '身份证号' },
      { key: 'reason', label: '来访事由' },
      { key: 'visit_time', label: '来访时间' },
      { key: 'status', label: '状态' }
    ],
    sample: [
      { username: 'student1', visitor_name: '李先生', visitor_id_card: '310101198001010011', reason: '送资料', visit_time: '2026-06-03 14:00', status: 'pending' }
    ]
  },
  {
    key: 'late-returns',
    title: '晚归报备',
    icon: 'Clock',
    desc: '晚归原因与回寝时间',
    tip: '用户名必须已存在，状态可填 pending、approved、rejected。',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'reason', label: '晚归事由', required: true },
      { key: 'expected_time', label: '预计回寝' },
      { key: 'actual_time', label: '实际回寝' },
      { key: 'status', label: '状态' }
    ],
    sample: [
      { username: 'student2', reason: '实验室项目验收', expected_time: '23:40', actual_time: '', status: 'pending' }
    ]
  },
  {
    key: 'mutual-aids',
    title: '互助信息',
    icon: 'HeartHandshake',
    desc: '互助需求与接单状态',
    tip: '用户名必须已存在，互助类型可填 delivery、carpool、borrow、study、other。',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'type', label: '互助类型' },
      { key: 'title', label: '标题', required: true },
      { key: 'description', label: '详细描述' },
      { key: 'status', label: '状态' },
      { key: 'helper_username', label: '帮助人用户名' }
    ],
    sample: [
      { username: 'student1', type: 'delivery', title: '帮取快递', description: '北门快递柜，今晚可取', status: 'open', helper_username: '' }
    ]
  },
  {
    key: 'announcements',
    title: '公告通知',
    icon: 'Megaphone',
    desc: '公告标题、正文、置顶',
    tip: '是否置顶可填 true、false、是、否。',
    fields: [
      { key: 'title', label: '标题', required: true },
      { key: 'content', label: '内容' },
      { key: 'is_pinned', label: '是否置顶' },
      { key: 'created_at', label: '发布时间' }
    ],
    sample: [
      { title: '端午假期宿舍安全提醒', content: '离寝前请关闭电源并锁好门窗。', is_pinned: 'true', created_at: '2026-06-05 09:00' }
    ]
  }
]

const currentType = computed(() => importTypes.find(item => item.key === selectedKey.value) || importTypes[0])
const visibleFields = computed(() => currentType.value.fields.slice(0, 6))
const previewRows = computed(() => parsedRows.value.slice(0, 5))
const canImport = computed(() => parsedRows.value.length > 0 && validationErrors.value.length === 0)

function selectType(key) {
  selectedKey.value = key
  resetFileState()
}

function chooseFile() {
  fileInput.value?.click()
}

function resetFileState() {
  fileName.value = ''
  parsedRows.value = []
  validationErrors.value = []
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function rowsToCsv(rows) {
  const headers = currentType.value.fields.map(field => field.key)
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
  ].join('\r\n')
}

function downloadTemplate() {
  const csv = `\uFEFF${rowsToCsv(currentType.value.sample)}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeTitle = currentType.value.title.replace(/[\\/:*?"<>|]/g, '')
  link.href = url
  link.download = `${safeTitle}-示例导入模板.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.success('示例 CSV 文档已开始下载')
}

function loadSampleRows() {
  fileName.value = `${currentType.value.title}示例数据`
  parsedRows.value = currentType.value.sample.map(row => ({ ...row }))
  validateRows()
  result.value = null
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (char === '"' && quoted && next === '"') {
      value += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }
  row.push(value)
  rows.push(row)

  const headers = (rows.shift() || []).map(item => item.replace(/^\uFEFF/, '').trim())
  return rows
    .filter(items => items.some(item => String(item).trim() !== ''))
    .map(items => headers.reduce((acc, header, index) => {
      acc[header] = String(items[index] ?? '').trim()
      return acc
    }, {}))
}

function validateRows() {
  const errors = []
  const required = currentType.value.fields.filter(field => field.required)
  parsedRows.value.forEach((row, rowIndex) => {
    required.forEach(field => {
      if (!row[field.key]) errors.push(`第 ${rowIndex + 2} 行缺少必填字段：${field.label}`)
    })
  })
  validationErrors.value = errors.slice(0, 12)
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  fileName.value = file.name
  result.value = null
  const reader = new FileReader()
  reader.onload = () => {
    try {
      parsedRows.value = parseCsv(String(reader.result || ''))
      validateRows()
      if (!parsedRows.value.length) toast.warning('未解析到可导入数据')
      else toast.success(`已读取 ${parsedRows.value.length} 条数据`)
    } catch {
      parsedRows.value = []
      validationErrors.value = ['文件解析失败，请确认是 CSV 文档']
      toast.error('文件解析失败')
    }
  }
  reader.readAsText(file, 'utf-8')
}

async function importNow() {
  if (!canImport.value) return
  importing.value = true
  try {
    const res = await api.post(`/imports/${currentType.value.key}`, { rows: parsedRows.value })
    if (res.code === 0) {
      result.value = res.data
      toast.success(`导入完成：成功 ${res.data.imported} 条`)
      parsedRows.value = []
      validationErrors.value = []
      fileName.value = ''
      if (fileInput.value) fileInput.value.value = ''
    } else {
      toast.error(res.msg)
    }
  } catch {
    toast.error('导入失败，请检查文档内容')
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.import-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.import-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 26px;
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
}

.import-hero h2 {
  font-size: 26px;
  font-weight: 860;
}

.import-hero p {
  max-width: 680px;
  margin-top: 8px;
  color: var(--text-secondary);
}

.hero-actions,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.import-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 18px;
}

.type-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  align-self: start;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.type-card:hover {
  background: rgba(17, 17, 17, 0.04);
}

.type-card.active {
  background: #111111;
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(17, 17, 17, 0.16);
}

.type-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 15px;
  background: rgba(17, 17, 17, 0.07);
}

.type-card.active .type-icon {
  background: rgba(255, 255, 255, 0.16);
}

.type-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.type-copy strong {
  font-size: 14px;
}

.type-copy small {
  color: var(--text-tertiary);
  font-size: 12px;
}

.type-card.active .type-copy small {
  color: rgba(255, 255, 255, 0.62);
}

.workspace {
  padding: 24px;
}

.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.workspace-header h3 {
  font-size: 19px;
  font-weight: 840;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 260px;
  padding: 8px 12px;
  overflow: hidden;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.field-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.04);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.field-pill.required {
  color: var(--text-primary);
  border-color: rgba(17, 17, 17, 0.18);
}

.field-pill small {
  color: var(--text-tertiary);
  font-weight: 650;
}

.hidden-input {
  display: none;
}

.upload-zone {
  display: flex;
  min-height: 170px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  border: 1px dashed rgba(17, 17, 17, 0.22);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.upload-zone:hover {
  border-color: rgba(17, 17, 17, 0.42);
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.upload-zone strong {
  color: var(--text-primary);
  font-size: 16px;
}

.preview-card {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.48);
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-head h4 {
  font-size: 15px;
  font-weight: 820;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 12px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 14px;
  background: rgba(192, 47, 54, 0.08);
  color: var(--danger);
  font-size: 13px;
  font-weight: 650;
}

.empty-preview,
.no-access {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-tertiary);
  text-align: center;
}

.no-access h3 {
  color: var(--text-primary);
}

.result-panel {
  display: grid;
  grid-template-columns: repeat(2, 160px) minmax(0, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(17, 17, 17, 0.04);
}

.result-card strong {
  font-size: 28px;
  line-height: 1;
}

.result-card span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.result-card.success strong {
  color: var(--success);
}

.result-card.danger strong {
  color: var(--danger);
}

.result-errors {
  padding: 14px;
  overflow: auto;
  border-radius: 20px;
  background: rgba(192, 47, 54, 0.07);
  color: var(--danger);
  font-size: 13px;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 960px) {
  .import-hero,
  .workspace-header {
    flex-direction: column;
  }

  .import-grid {
    grid-template-columns: 1fr;
  }

  .type-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .type-panel {
    grid-template-columns: 1fr;
  }
}
</style>
