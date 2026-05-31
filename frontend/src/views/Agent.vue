<template>
  <div class="agent-page">
    <section class="agent-hero glass">
      <div>
        <span class="hero-kicker">系统数据操作 Agent</span>
        <h2>通过对话查询、审批、删除和导入数据</h2>
        <p>Agent 会把自然语言转换成系统 API 调用。当前运行在 mock 数据环境，所有操作会立即反映到各业务页面。</p>
      </div>
      <div class="tool-strip">
        <span :class="{ active: canUseCloud }">
          <AppIcon :name="canUseCloud ? 'Cloud' : 'CloudOff'" :size="14" />
          {{ modelModeLabel }}
        </span>
        <span v-for="tool in tools" :key="tool">
          <AppIcon name="WandSparkles" :size="14" />
          {{ tool }}
        </span>
      </div>
    </section>

    <div class="agent-grid">
      <main class="chat-panel glass">
        <div class="chat-history" ref="historyRef">
          <div v-for="message in messages" :key="message.id" :class="['message', message.role, message.status]">
            <div class="message-avatar">
              <AppIcon
                :name="message.role === 'agent' && message.status === 'thinking' ? 'LoaderCircle' : message.role === 'agent' ? 'Bot' : 'UserRound'"
                :class="{ spin: message.role === 'agent' && message.status === 'thinking' }"
                :size="18"
              />
            </div>
            <div class="message-body">
              <div v-if="message.role === 'agent' && message.thoughts?.length" :class="['thought-panel', { open: message.thoughtExpanded, done: message.thoughtDone }]">
                <button class="thought-toggle" @click="message.thoughtExpanded = !message.thoughtExpanded">
                  <AppIcon :name="message.thoughtExpanded ? 'ChevronUp' : 'ChevronDown'" :size="14" />
                  <span>思考过程</span>
                  <em>{{ message.thoughtDone ? '已完成' : '思考中' }}</em>
                  <b v-if="!message.thoughtDone">
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                </button>
                <div v-show="message.thoughtExpanded" class="thought-content">
                  <div v-for="thought in message.thoughts" :key="thought.id" :class="['thought-line', thought.status]">
                    <span class="thought-dot"></span>
                    <span>{{ thought.text }}</span>
                  </div>
                </div>
              </div>
              <div v-if="message.html || message.status === 'streaming'" class="message-text">
                <span v-html="message.html"></span>
                <span v-if="message.status === 'streaming'" class="stream-cursor"></span>
              </div>
              <div v-if="message.actions?.length" class="action-log">
                <div v-for="action in message.actions" :key="actionKey(action)" :class="['action-item', actionStatus(action)]">
                  <AppIcon :name="actionIcon(action)" :class="{ spin: actionStatus(action) === 'running' }" :size="13" />
                  <span>{{ actionLabel(action) }}</span>
                  <em>{{ actionStatusText(action) }}</em>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pendingImport.rows.length" class="pending-import">
          <div>
            <strong>{{ pendingImport.fileName }}</strong>
            <span>{{ currentImportTitle }}，{{ pendingImport.rows.length }} 条待导入</span>
          </div>
          <select v-model="pendingImport.type" class="select mini-select">
            <option v-for="type in importTypes" :key="type.key" :value="type.key">{{ type.title }}</option>
          </select>
          <button class="btn btn-primary btn-sm" @click="runImport">
            <AppIcon name="Upload" :size="15" />
            一键导入
          </button>
        </div>

        <div class="composer">
          <button class="icon-action" @click="chooseFile" aria-label="上传文件">
            <AppIcon name="Paperclip" :size="19" />
          </button>
          <textarea
            v-model="prompt"
            class="agent-input"
            rows="2"
            placeholder="例如：查询待审批访客；批准访客 1；删除报修 3；把上传的文件导入为学生用户"
            @keydown.enter.exact.prevent="submitPrompt"
          ></textarea>
          <button class="btn btn-primary send-btn" :disabled="busy || (!prompt.trim() && !pendingImport.rows.length)" @click="submitPrompt">
            <AppIcon :name="busy ? 'LoaderCircle' : 'Send'" :class="{ spin: busy }" :size="17" />
            发送
          </button>
          <input ref="fileInput" class="hidden-input" type="file" accept=".pdf,.docx,.txt,.md,.xlsx,.xls,.csv,text/plain,text/csv" @change="handleFile" />
        </div>
      </main>

      <aside class="side-panel glass">
        <h3>可调用能力</h3>
        <div class="capability-list">
          <div class="capability">
            <AppIcon name="Search" :size="18" />
            <div>
              <strong>查询数据</strong>
              <span>访客、晚归、报修、用电、卫生、互助、公告、楼栋、用户</span>
            </div>
          </div>
          <div class="capability">
            <AppIcon name="ListChecks" :size="18" />
            <div>
              <strong>审批处理</strong>
              <span>批准或拒绝访客预约、晚归报备</span>
            </div>
          </div>
          <div class="capability">
            <AppIcon name="Trash2" :size="18" />
            <div>
              <strong>删除任务</strong>
              <span>按 ID 删除指定业务记录</span>
            </div>
          </div>
          <div class="capability">
            <AppIcon name="FileUp" :size="18" />
            <div>
              <strong>文件导入</strong>
              <span>CSV、TXT、MD、XLSX、DOCX、PDF 表格文本</span>
            </div>
          </div>
        </div>

        <div class="examples">
          <h4>示例指令</h4>
          <button v-for="item in examples" :key="item" @click="useExample(item)">{{ item }}</button>
        </div>

        <div class="model-settings">
          <div class="settings-head">
            <AppIcon name="ServerCog" :size="19" />
            <div>
              <strong>模型配置</strong>
              <span>{{ modelModeLabel }}</span>
            </div>
          </div>
          <label class="toggle-row">
            <span>云端模型</span>
            <input v-model="modelConfig.enabled" type="checkbox" />
            <i></i>
          </label>
          <label class="config-field">
            <span>接口地址</span>
            <input v-model.trim="modelConfig.baseUrl" type="url" placeholder="https://api.openai.com/v1/chat/completions" />
          </label>
          <label class="config-field">
            <span>模型</span>
            <input v-model.trim="modelConfig.model" type="text" placeholder="gpt-4.1-mini" />
          </label>
          <label class="config-field">
            <span>密钥</span>
            <input v-model="modelConfig.apiKey" type="password" autocomplete="off" placeholder="sk-..." />
          </label>
          <label class="config-field">
            <span>温度</span>
            <input v-model.number="modelConfig.temperature" type="number" min="0" max="1" step="0.1" />
          </label>
          <button class="btn btn-light config-save" @click="saveModelConfig">
            <AppIcon name="Save" :size="15" />
            保存配置
          </button>
          <p v-if="modelStatus" class="model-status">{{ modelStatus }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { useToastStore } from '../stores/toast'
import api from '../api'
import { importTypes, inferImportType, parseImportFile, validateImportRows } from '../utils/importTools'

const MODEL_CONFIG_KEY = 'dormitory_agent_model_config_v1'

const RESOURCE_CATALOG = [
  { key: 'visitors', keys: ['访客', '预约'], label: '访客预约', list: '/visitors', item: '/visitors', reviewable: true, statuses: ['pending', 'approved', 'rejected'] },
  { key: 'late-returns', keys: ['晚归'], label: '晚归报备', list: '/late-returns', item: '/late-returns', reviewable: true, statuses: ['pending', 'approved', 'rejected'] },
  { key: 'repairs', keys: ['报修', '维修'], label: '报修记录', list: '/repairs', item: '/repairs', statuses: ['pending', 'processing', 'done'] },
  { key: 'power', keys: ['用电', '功率', '告警'], label: '用电记录', list: '/power', item: '/power', statuses: ['warning'] },
  { key: 'hygiene', keys: ['卫生'], label: '卫生检查', list: '/hygiene', item: '/hygiene' },
  { key: 'mutual-aids', keys: ['互助'], label: '互助信息', list: '/mutual-aids', item: '/mutual-aids', statuses: ['open', 'accepted', 'done'] },
  { key: 'announcements', keys: ['公告', '通知'], label: '公告通知', list: '/announcements', item: '/announcements' },
  { key: 'buildings', keys: ['楼栋'], label: '楼栋', list: '/buildings', item: '/buildings' },
  { key: 'rooms', keys: ['房间', '寝室'], label: '房间', list: '/rooms', item: '/rooms' },
  { key: 'users', keys: ['用户', '学生'], label: '用户', list: '/users', item: '/users' },
  { key: 'dashboard', keys: ['仪表盘', '概览'], label: '仪表盘', list: '/dashboard', item: '' },
  { key: 'statistics', keys: ['统计', '数据统计'], label: '数据统计', list: '/statistics', item: '' }
]

const defaultModelConfig = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4.1-mini',
  temperature: 0.2
}

function loadModelConfig() {
  try {
    return { ...defaultModelConfig, ...JSON.parse(localStorage.getItem(MODEL_CONFIG_KEY) || '{}') }
  } catch {
    return { ...defaultModelConfig }
  }
}

const toast = useToastStore()
const prompt = ref('')
const busy = ref(false)
const fileInput = ref(null)
const historyRef = ref(null)
const modelConfig = reactive(loadModelConfig())
const modelStatus = ref('')
const messages = ref([
  {
    id: 1,
    role: 'agent',
    html: '我可以查询系统数据、审批访客或晚归、删除指定记录，也可以读取你上传的 CSV、Excel、PDF、DOCX、TXT、MD 并导入对应数据。',
    actions: []
  }
])

const pendingImport = reactive({
  fileName: '',
  type: 'users',
  rows: []
})

const tools = ['GET 查询', 'PUT 审批', 'DELETE 删除', 'POST 导入']
const examples = [
  '查询待审批访客',
  '批准全部待审批访客',
  '拒绝访客 4',
  '查询用电告警',
  '删除报修 3',
  '把上传文件一键导入为学生用户'
]

const currentImportTitle = computed(() => importTypes.find(item => item.key === pendingImport.type)?.title || '待识别数据')
const canUseCloud = computed(() => Boolean(modelConfig.enabled && modelConfig.baseUrl && modelConfig.model && modelConfig.apiKey))
const modelModeLabel = computed(() => canUseCloud.value ? `云端模型 ${modelConfig.model}` : '本地规则模式')

function addMessage(role, text, actions = []) {
  messages.value.push({
    id: Date.now() + Math.random(),
    role,
    html: formatText(text),
    status: 'done',
    actions: actions.map(action => normalizeAction(action, 'done'))
  })
  scrollHistory()
}

function createAgentMessage(thinkingText = '模型思考中') {
  const message = {
    id: Date.now() + Math.random(),
    role: 'agent',
    html: '',
    status: 'thinking',
    thinkingText,
    thoughtExpanded: true,
    thoughtDone: false,
    thoughts: [],
    actions: []
  }
  addThought(message, thinkingText, 'running')
  messages.value.push(message)
  scrollHistory()
  return message
}

function scrollHistory() {
  nextTick(() => {
    if (historyRef.value) historyRef.value.scrollTop = historyRef.value.scrollHeight
  })
}

function formatText(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function normalizeAction(action, status = 'done') {
  if (typeof action === 'object' && action) return action
  return {
    id: Date.now() + Math.random(),
    label: String(action || ''),
    status
  }
}

function addThought(message, text, status = 'done') {
  if (!message) return null
  const thought = {
    id: Date.now() + Math.random(),
    text,
    status
  }
  message.thoughts = message.thoughts || []
  message.thoughts.push(thought)
  message.thoughtExpanded = true
  scrollHistory()
  return thought
}

function completeThought(thought, status = 'done') {
  if (thought) thought.status = status
}

function updateThought(thought, text, status = 'done') {
  if (!thought) return
  thought.text = text
  thought.status = status
}

function finishThoughts(message) {
  if (!message) return
  message.thoughts?.forEach(thought => {
    if (thought.status === 'running') thought.status = 'done'
  })
  message.thoughtDone = true
  message.thoughtExpanded = false
  scrollHistory()
}

function actionKey(action) {
  return typeof action === 'object' ? action.id || action.label : action
}

function actionLabel(action) {
  return typeof action === 'object' ? action.label : action
}

function actionStatus(action) {
  return typeof action === 'object' ? action.status || 'done' : 'done'
}

function actionIcon(action) {
  const status = actionStatus(action)
  if (status === 'running') return 'LoaderCircle'
  if (status === 'error') return 'CircleAlert'
  if (status === 'pending') return 'Circle'
  return 'Check'
}

function actionStatusText(action) {
  const status = actionStatus(action)
  if (status === 'running') return '调用中'
  if (status === 'error') return '失败'
  if (status === 'pending') return '等待'
  return '完成'
}

function waitFrame(ms = 12) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function streamMessage(message, text) {
  const chars = Array.from(String(text || ''))
  finishThoughts(message)
  message.status = 'streaming'
  message.html = ''
  for (let index = 0; index < chars.length; index += 2) {
    message.html = formatText(chars.slice(0, index + 2).join(''))
    scrollHistory()
    await waitFrame(chars.length > 260 ? 5 : 12)
  }
  message.html = formatText(chars.join(''))
  message.status = 'done'
  scrollHistory()
}

function startToolCall(message, label) {
  if (!message) return null
  const thought = addThought(message, `调用工具：${label}`, 'running')
  const action = {
    id: Date.now() + Math.random(),
    label,
    status: 'running'
  }
  message.actions.push(action)
  scrollHistory()
  return {
    done() {
      if (action.status === 'running') action.status = 'done'
      completeThought(thought, 'done')
      scrollHistory()
    },
    error() {
      if (action.status === 'running') action.status = 'error'
      completeThought(thought, 'error')
      scrollHistory()
    }
  }
}

function addToolCall(message, label, status = 'done') {
  if (!message) return
  addThought(message, label, status)
  message.actions.push({
    id: Date.now() + Math.random(),
    label,
    status
  })
  scrollHistory()
}

function createTrace(message) {
  return {
    start: label => startToolCall(message, label),
    add: (label, status = 'done') => addToolCall(message, label, status),
    think: (text, status = 'done') => addThought(message, text, status),
    finish: () => finishThoughts(message)
  }
}

function markRunningActions(message, status = 'error') {
  message?.actions?.forEach(action => {
    if (action.status === 'running') action.status = status
  })
  message?.thoughts?.forEach(thought => {
    if (thought.status === 'running') thought.status = status
  })
}

function chooseFile() {
  fileInput.value?.click()
}

function useExample(text) {
  prompt.value = text
}

function saveModelConfig() {
  const saved = {
    enabled: Boolean(modelConfig.enabled),
    baseUrl: modelConfig.baseUrl.trim(),
    apiKey: modelConfig.apiKey,
    model: modelConfig.model.trim(),
    temperature: Number.isFinite(Number(modelConfig.temperature)) ? Number(modelConfig.temperature) : 0.2
  }
  Object.assign(modelConfig, saved)
  localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(saved))
  modelStatus.value = saved.enabled ? '云端模型配置已保存' : '已保存，当前使用本地规则模式'
  toast.success('模型配置已保存')
}

function resetPendingImport() {
  pendingImport.fileName = ''
  pendingImport.rows = []
  pendingImport.type = 'users'
  if (fileInput.value) fileInput.value.value = ''
}

async function handleFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  busy.value = true
  try {
    const rows = await parseImportFile(file)
    if (!rows.length) {
      addMessage('agent', `已读取 ${file.name}，但没有识别到表格数据。请确认文档中包含表头和数据行，或另存为 CSV 后上传。`)
      toast.warning('未识别到可导入表格')
      return
    }
    pendingImport.fileName = file.name
    pendingImport.rows = rows
    pendingImport.type = inferImportType(rows, pendingImport.type)
    const errors = validateImportRows(pendingImport.type, rows)
    addMessage(
      'agent',
      `已解析文件：${file.name}\n识别类型：${currentImportTitle.value}\n数据行数：${rows.length}\n${errors.length ? `校验提示：${errors.slice(0, 4).join('；')}` : '校验通过，可以直接点击一键导入，或发送“导入”。'}`,
      [`解析文件 ${file.name}`, `推断导入类型 ${pendingImport.type}`]
    )
  } catch (error) {
    addMessage('agent', `文件解析失败：${error.message || '无法读取该格式'}。建议将表格另存为 CSV 或 XLSX 后重试。`)
    toast.error('文件解析失败')
  } finally {
    busy.value = false
  }
}

async function submitPrompt() {
  const text = prompt.value.trim()
  if (!text && pendingImport.rows.length) {
    await runImport()
    return
  }
  if (!text || busy.value) return
  addMessage('user', text)
  prompt.value = ''
  busy.value = true
  const agentMessage = createAgentMessage(canUseCloud.value ? '云端模型思考中' : '正在分析指令')
  const trace = createTrace(agentMessage)
  try {
    const result = await runAgent(text, trace)
    if (!agentMessage.actions.length && result.actions?.length) {
      agentMessage.actions = result.actions.map(action => normalizeAction(action, 'done'))
    }
    await streamMessage(agentMessage, result.text)
  } catch (error) {
    markRunningActions(agentMessage, 'error')
    await streamMessage(agentMessage, `执行失败：${error.message || '未知错误'}`)
  } finally {
    busy.value = false
  }
}

function includesAny(text, words) {
  return words.some(word => text.includes(word))
}

function extractId(text) {
  const match = text.match(/(?:id|编号|记录)?\s*(\d+)/i)
  return match ? Number(match[1]) : null
}

function resourceFromText(text) {
  return RESOURCE_CATALOG.find(item => item.keys.some(key => text.includes(key))) || RESOURCE_CATALOG[0]
}

function resourceFromPlan(plan = {}, text = '') {
  const resourceKey = String(plan.resource || plan.dataset || '').trim()
  return RESOURCE_CATALOG.find(item => item.key === resourceKey || item.label === resourceKey)
    || resourceFromText(text)
}

function statusFromText(text) {
  if (text.includes('待审批') || text.includes('待处理') || text.includes('pending')) return 'pending'
  if (text.includes('已批准') || text.includes('approved')) return 'approved'
  if (text.includes('已拒绝') || text.includes('rejected')) return 'rejected'
  if (text.includes('告警') || text.includes('超限')) return 'warning'
  if (text.includes('维修中') || text.includes('处理中') || text.includes('processing')) return 'processing'
  if (text.includes('已完成') || text.includes('done')) return 'done'
  if (text.includes('进行中')) return 'open'
  return ''
}

function importTypeFromText(text, fallback = pendingImport.type) {
  const matched = importTypes.find(type => {
    const haystack = [type.key, type.title, ...type.fields.map(field => field.label), ...type.fields.map(field => field.key)]
    return haystack.some(item => String(item).toLowerCase() && text.toLowerCase().includes(String(item).toLowerCase()))
  })
  return matched?.key || fallback
}

function planImportType(plan = {}, text = '') {
  const value = String(plan.importType || plan.type || plan.resource || '').trim()
  const matched = importTypes.find(type => type.key === value || type.title === value)
  return matched?.key || importTypeFromText(text)
}

function describeStatus(status) {
  const map = {
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    warning: '告警',
    open: '进行中',
    processing: '处理中',
    done: '已完成'
  }
  return map[status] || status || '全部状态'
}

function describePlan(plan) {
  const actionMap = {
    query: '查询',
    review: '审批',
    delete: '删除',
    import: '导入',
    answer: '回答'
  }
  const resource = RESOURCE_CATALOG.find(item => item.key === plan.resource)?.label || plan.resource || ''
  const pieces = [actionMap[plan.action] || plan.action]
  if (resource) pieces.push(resource)
  if (plan.status) pieces.push(describeStatus(plan.status))
  if (plan.decision) pieces.push(plan.decision === 'approved' ? '批准' : '拒绝')
  if (plan.id) pieces.push(`#${plan.id}`)
  return pieces.filter(Boolean).join(' / ')
}

function summarizeRows(label, rows) {
  if (!rows.length) return `${label}没有匹配数据。`
  const lines = rows.slice(0, 8).map(row => {
    if (label.includes('访客')) return `#${row.id} ${row.user_name || '-'} 访客 ${row.visitor_name || '-'}，${row.visit_time || '-'}，状态 ${row.status}`
    if (label.includes('晚归')) return `#${row.id} ${row.user_name || '-'}，预计 ${row.expected_time || '-'}，原因 ${row.reason || '-'}，状态 ${row.status}`
    if (label.includes('报修')) return `#${row.id} ${row.user_name || '-'} ${row.building || ''}${row.room_number || ''}，${row.description || '-'}，状态 ${row.status}`
    if (label.includes('用电')) return `#${row.id} ${row.building || ''}${row.room_number || ''}，${row.watt}W / ${row.threshold}W，${row.is_warning ? '超限' : '正常'}`
    if (label.includes('卫生')) return `#${row.id} ${row.building || ''}${row.room_number || ''}，评分 ${row.score}，${row.comment || '-'}`
    if (label.includes('互助')) return `#${row.id} ${row.title || '-'}，发布人 ${row.user_name || '-'}，状态 ${row.status}`
    if (label.includes('公告')) return `#${row.id} ${row.title || '-'}，${row.is_pinned ? '置顶' : '普通'}`
    if (label.includes('楼栋')) return `#${row.id} ${row.name || '-'}，${row.floors} 层，${row.room_count} 间`
    if (label.includes('房间')) return `#${row.id} ${row.building_name || '-'} ${row.number || '-'}，${row.occupant_count}/${row.capacity}`
    if (label.includes('用户')) return `#${row.id} ${row.name || '-'} (${row.username})，${row.building || ''}${row.room || ''}`
    return `#${row.id || '-'} ${JSON.stringify(row)}`
  })
  return `${label}匹配 ${rows.length} 条：\n${lines.join('\n')}${rows.length > lines.length ? `\n仅展示前 ${lines.length} 条。` : ''}`
}

async function queryResource(input) {
  const isPlan = typeof input === 'object'
  const text = isPlan ? String(input.text || input.message || '') : input
  const trace = isPlan ? input.trace : null
  const resource = isPlan ? resourceFromPlan(input, text) : resourceFromText(text)
  const status = isPlan ? String(input.status || '') : statusFromText(text)
  trace?.think(`确认查询对象：${resource.label}，筛选：${describeStatus(status)}`, 'done')
  let url = resource.list
  if (status && resource.statuses?.includes(status) && status !== 'warning') url += `?status=${status}`
  if (status === 'warning' && resource.label === '用电记录') url += '?is_warning=true'
  if (input?.id && !['dashboard', 'statistics'].includes(resource.key)) url += `${url.includes('?') ? '&' : '?'}id=${Number(input.id)}`
  const action = trace?.start(`GET ${url}`)
  let res
  try {
    res = await api.get(url)
    if (res.code !== 0) throw new Error(res.msg)
    action?.done()
  } catch (error) {
    action?.error()
    throw error
  }
  const data = Array.isArray(res.data) ? res.data : [res.data]
  const id = Number(input?.id || 0)
  const rows = id && Array.isArray(res.data) ? data.filter(item => item.id === id) : data
  return {
    text: summarizeRows(resource.label, rows),
    actions: [`GET ${url}`]
  }
}

async function review(input) {
  const isPlan = typeof input === 'object'
  const text = isPlan ? String(input.text || input.message || '') : input
  const trace = isPlan ? input.trace : null
  const plannedResource = isPlan ? resourceFromPlan(input, text) : resourceFromText(text)
  const isVisitor = plannedResource.key === 'visitors' || text.includes('访客') || text.includes('预约')
  const resource = isVisitor
    ? { label: '访客预约', url: '/visitors', endpoint: '/visitors' }
    : { label: '晚归报备', url: '/late-returns', endpoint: '/late-returns' }
  const plannedDecision = String(input?.decision || '').toLowerCase()
  const decision = plannedDecision === 'rejected' || includesAny(text, ['拒绝', '驳回'])
    ? 'rejected'
    : plannedDecision === 'approved' || includesAny(text, ['批准', '同意', '通过'])
      ? 'approved'
      : ''
  const id = Number(input?.id || 0) || extractId(text)
  trace?.think(`确认审批对象：${resource.label}${id ? ` #${id}` : '待处理记录'}`, 'done')
  const listAction = trace?.start(`GET ${resource.url}?status=pending`)
  let listRes
  try {
    listRes = await api.get(`${resource.url}?status=pending`)
    if (listRes.code !== 0) throw new Error(listRes.msg)
    listAction?.done()
  } catch (error) {
    listAction?.error()
    throw error
  }
  let targets = listRes.data
  if (id) targets = targets.filter(item => item.id === id)
  if (!decision) {
    trace?.think('审批动作不明确，需要用户指定批准或拒绝', 'done')
    return {
      text: `需要你明确审批动作：批准或拒绝。\n${summarizeRows(resource.label, targets)}`,
      actions: [`GET ${resource.url}?status=pending`]
    }
  }
  if (!targets.length) return { text: `${resource.label}没有匹配的待审批记录。`, actions: [`GET ${resource.url}?status=pending`] }
  if (!id && input?.scope !== 'all' && !includesAny(text, ['全部', '所有', '自动', '批量'])) targets = targets.slice(0, 1)
  trace?.think(`审批策略：${decision === 'approved' ? '批准' : '拒绝'} ${targets.length} 条记录`, 'done')

  const actions = [`GET ${resource.url}?status=pending`]
  for (const item of targets) {
    const updateAction = trace?.start(`PUT ${resource.endpoint}/${item.id} status=${decision}`)
    try {
      const updateRes = await api.put(`${resource.endpoint}/${item.id}`, { status: decision })
      if (updateRes.code !== 0) throw new Error(updateRes.msg)
      updateAction?.done()
    } catch (error) {
      updateAction?.error()
      throw error
    }
    actions.push(`PUT ${resource.endpoint}/${item.id} status=${decision}`)
  }
  return {
    text: `已${decision === 'approved' ? '批准' : '拒绝'} ${targets.length} 条${resource.label}。`,
    actions
  }
}

async function deleteRecord(input) {
  const isPlan = typeof input === 'object'
  const text = isPlan ? String(input.text || input.message || '') : input
  const trace = isPlan ? input.trace : null
  const id = Number(input?.id || 0) || extractId(text)
  if (!id) return { text: '请提供要删除的记录 ID，例如：删除访客 4。', actions: [] }
  const resource = isPlan ? resourceFromPlan(input, text) : resourceFromText(text)
  if (!resource.item) return { text: `${resource.label}不支持按 ID 删除。`, actions: [] }
  trace?.think(`确认删除对象：${resource.label} #${id}`, 'done')
  const action = trace?.start(`DELETE ${resource.item}/${id}`)
  let res
  try {
    res = await api.delete(`${resource.item}/${id}`)
    if (res.code !== 0) throw new Error(res.msg)
    action?.done()
  } catch (error) {
    action?.error()
    throw error
  }
  return {
    text: `已删除${resource.label} #${id}。`,
    actions: [`DELETE ${resource.item}/${id}`]
  }
}

async function executeImport(type = pendingImport.type, trace = null) {
  if (!pendingImport.rows.length) {
    trace?.think('未发现待导入文件数据', 'done')
    return { text: '请先上传包含表头的数据文件，再执行导入。', actions: [] }
  }
  if (importTypes.some(item => item.key === type)) pendingImport.type = type
  trace?.think(`确认导入类型：${currentImportTitle.value}，待导入 ${pendingImport.rows.length} 条`, 'done')
  const errors = validateImportRows(pendingImport.type, pendingImport.rows)
  if (errors.length) {
    trace?.think(`导入校验未通过：${errors.length} 个字段问题`, 'error')
    return { text: `导入前校验未通过：\n${errors.slice(0, 8).join('\n')}`, actions: [] }
  }
  trace?.think('导入字段校验通过', 'done')
  const action = trace?.start(`POST /imports/${pendingImport.type}`)
  let res
  try {
    res = await api.post(`/imports/${pendingImport.type}`, { rows: pendingImport.rows })
    if (res.code !== 0) throw new Error(res.msg)
    action?.done()
  } catch (error) {
    action?.error()
    throw error
  }
  const title = currentImportTitle.value
  const response = {
    text: `一键导入完成。\n类型：${title}\n成功：${res.data.imported} 条\n失败：${res.data.failed} 条${res.data.errors?.length ? `\n${res.data.errors.map(item => `第 ${item.row} 行：${item.message}`).join('\n')}` : ''}`,
    actions: [`POST /imports/${pendingImport.type}`]
  }
  toast.success('Agent 导入完成')
  resetPendingImport()
  return response
}

async function runImport() {
  busy.value = true
  const agentMessage = createAgentMessage('正在准备导入')
  const trace = createTrace(agentMessage)
  try {
    const result = await executeImport(pendingImport.type, trace)
    if (!agentMessage.actions.length && result.actions?.length) {
      agentMessage.actions = result.actions.map(action => normalizeAction(action, 'done'))
    }
    await streamMessage(agentMessage, result.text)
  } catch (error) {
    markRunningActions(agentMessage, 'error')
    await streamMessage(agentMessage, `导入失败：${error.message || '未知错误'}`)
  } finally {
    busy.value = false
  }
}

function normalizeModelEndpoint(value) {
  const url = value.trim().replace(/\/$/, '')
  if (/\/v1$/i.test(url)) return `${url}/chat/completions`
  return url
}

function extractJsonObject(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1] || text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('模型没有返回可执行计划')
  return JSON.parse(raw.slice(start, end + 1))
}

function normalizePlan(plan) {
  const action = String(plan.action || '').toLowerCase()
  const allowed = ['query', 'review', 'delete', 'import', 'answer']
  if (!allowed.includes(action)) throw new Error('模型计划动作不在允许范围内')
  return {
    action,
    resource: String(plan.resource || '').trim(),
    status: String(plan.status || '').trim(),
    decision: String(plan.decision || '').trim(),
    scope: plan.scope === 'all' ? 'all' : 'single',
    id: Number(plan.id || 0) || null,
    importType: String(plan.importType || plan.type || '').trim(),
    message: String(plan.message || '').trim()
  }
}

async function callCloudPlanner(text) {
  const endpoint = normalizeModelEndpoint(modelConfig.baseUrl)
  const pending = pendingImport.rows.length
    ? {
        fileName: pendingImport.fileName,
        inferredType: pendingImport.type,
        rowCount: pendingImport.rows.length,
        columns: Object.keys(pendingImport.rows[0] || {})
      }
    : null
  const systemPrompt = [
    '你是宿舍管理系统的数据操作计划器。',
    '只返回一个 JSON 对象，不要使用 Markdown，不要解释。',
    '允许的 action 只有 query、review、delete、import、answer。',
    'query 用于读取数据；review 只能审批 visitors 或 late-returns；delete 必须提供 resource 和 id；import 用于导入当前上传文件。',
    'resource 只能从这些 key 中选择：' + RESOURCE_CATALOG.map(item => item.key).join(', ') + '。',
    'status 可选 pending、approved、rejected、warning、open、processing、done。',
    'decision 只能是 approved 或 rejected。',
    '返回结构示例：{"action":"query","resource":"visitors","status":"pending"}。'
  ].join('\n')

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${modelConfig.apiKey}`
    },
    body: JSON.stringify({
      model: modelConfig.model,
      temperature: Number(modelConfig.temperature || 0.2),
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: JSON.stringify({
            userRequest: text,
            pendingImport: pending,
            importTypes: importTypes.map(type => ({ key: type.key, title: type.title, fields: type.fields.map(field => field.key) }))
          })
        }
      ]
    })
  })
  if (!res.ok) throw new Error(`模型接口返回 ${res.status}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || data.output_text || ''
  return normalizePlan(extractJsonObject(content))
}

async function executePlan(plan, sourceText, trace = null) {
  const input = { ...plan, text: sourceText, trace }
  if (plan.action === 'answer') {
    trace?.think('模型判断无需调用业务工具，直接回答', 'done')
    trace?.add('MODEL answer', 'done')
    return { text: plan.message || '我需要更明确的操作对象或记录 ID。', actions: ['MODEL answer'] }
  }
  trace?.think(`校验计划范围：${describePlan(plan)}`, 'done')
  if (plan.action === 'import') return executeImport(planImportType(plan, sourceText), trace)
  if (plan.action === 'delete') return deleteRecord(input)
  if (plan.action === 'review') return review(input)
  if (plan.action === 'query') return queryResource(input)
  throw new Error('无法执行模型计划')
}

async function runLocalAgent(text, trace = null) {
  trace?.think('读取用户指令并使用本地规则解析意图', 'done')
  if (pendingImport.rows.length && includesAny(text, ['导入', '上传', '文件'])) {
    trace?.think('识别为文件导入任务', 'done')
    return executeImport(importTypeFromText(text), trace)
  }
  if (includesAny(text, ['删除', '移除', '清除'])) {
    trace?.think('识别为删除任务，需要明确资源和记录 ID', 'done')
    return deleteRecord({ text, trace })
  }
  if (includesAny(text, ['批准', '拒绝', '审阅', '审批', '通过', '驳回'])) {
    trace?.think('识别为审批任务，先读取待处理记录', 'done')
    return review({ text, trace })
  }
  if (includesAny(text, ['查询', '查看', '列出', '统计', '多少', '告警', '待审批'])) {
    trace?.think('识别为查询任务，准备读取匹配数据', 'done')
    return queryResource({ text, trace })
  }
  trace?.think('未匹配到明确工具动作', 'done')
  return {
    text: '我没有识别到明确动作。你可以说：查询待审批访客、批准访客 1、拒绝全部晚归、删除报修 3，或上传文件后说导入。',
    actions: []
  }
}

async function runAgent(text, trace = null) {
  if (!canUseCloud.value) {
    trace?.think('当前未启用云端模型，使用本地规则模式', 'done')
    return runLocalAgent(text, trace)
  }
  trace?.think('当前启用云端模型，准备生成受控操作计划', 'done')
  const modelAction = trace?.start(`MODEL ${modelConfig.model}`)
  const planningThought = trace?.think('请求云端模型返回 JSON 操作计划', 'running')
  try {
    modelStatus.value = '云端模型正在生成操作计划'
    const plan = await callCloudPlanner(text)
    updateThought(planningThought, `模型计划：${describePlan(plan)}`, 'done')
    modelAction?.done()
    trace?.add(`PLAN ${plan.action}${plan.resource ? ` ${plan.resource}` : ''}`, 'done')
    const result = await executePlan(plan, text, trace)
    modelStatus.value = `最近计划：${plan.action}${plan.resource ? ` / ${plan.resource}` : ''}`
    return {
      text: result.text,
      actions: [`MODEL ${modelConfig.model}`, `PLAN ${plan.action}${plan.resource ? ` ${plan.resource}` : ''}`, ...result.actions]
    }
  } catch (error) {
    updateThought(planningThought, `云端模型不可用：${error.message || '未知错误'}`, 'error')
    modelAction?.error()
    trace?.think('回退到本地规则继续处理', 'done')
    const result = await runLocalAgent(text, trace)
    modelStatus.value = `云端模型不可用，已回退本地规则：${error.message || '未知错误'}`
    return {
      text: `云端模型暂不可用，已使用本地规则处理。\n${result.text}`,
      actions: [`MODEL fallback`, ...result.actions]
    }
  }
}
</script>

<style scoped>
.agent-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.agent-hero {
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

.agent-hero h2 {
  font-size: 26px;
  font-weight: 860;
}

.agent-hero p {
  max-width: 720px;
  margin-top: 8px;
  color: var(--text-secondary);
}

.tool-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tool-strip span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.tool-strip span.active {
  background: #111111;
  color: #ffffff;
  box-shadow: 0 18px 40px rgba(17, 17, 17, 0.16);
}

.agent-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}

.chat-panel {
  display: flex;
  min-height: 680px;
  flex-direction: column;
  overflow: hidden;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  display: grid;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 15px;
  background: #111111;
  color: #ffffff;
}

.message.user .message-avatar {
  background: rgba(17, 17, 17, 0.08);
  color: var(--text-primary);
}

.message-body {
  max-width: min(720px, 82%);
  padding: 14px 16px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.64);
  box-shadow: 0 10px 30px rgba(17, 17, 17, 0.05);
  transition: var(--transition);
}

.message.user .message-body {
  background: #111111;
  color: #ffffff;
}

.message.thinking .message-body {
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.76), rgba(245, 245, 245, 0.88), rgba(255, 255, 255, 0.72));
  box-shadow: 0 16px 42px rgba(17, 17, 17, 0.08);
}

.message-text {
  font-size: 14px;
  line-height: 1.7;
}

.thought-panel {
  margin-bottom: 10px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 16px;
  background: rgba(17, 17, 17, 0.025);
  overflow: hidden;
  transition: var(--transition);
}

.thought-panel.done {
  background: rgba(17, 17, 17, 0.018);
}

.thought-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: rgba(17, 17, 17, 0.58);
  cursor: pointer;
  font-size: 12px;
  font-weight: 760;
  text-align: left;
}

.thought-toggle em {
  margin-left: auto;
  color: rgba(17, 17, 17, 0.42);
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
}

.thought-toggle b {
  display: inline-flex;
  gap: 4px;
  margin-left: 2px;
}

.thought-toggle b i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(17, 17, 17, 0.42);
  animation: thinkingPulse 1.1s ease-in-out infinite;
}

.thought-toggle b i:nth-child(2) {
  animation-delay: 0.16s;
}

.thought-toggle b i:nth-child(3) {
  animation-delay: 0.32s;
}

.thought-content {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0 12px 10px 28px;
}

.thought-line {
  position: relative;
  display: flex;
  gap: 8px;
  color: rgba(17, 17, 17, 0.48);
  font-size: 12px;
  line-height: 1.55;
}

.thought-line.running {
  color: rgba(17, 17, 17, 0.62);
}

.thought-line.done {
  color: rgba(17, 17, 17, 0.45);
}

.thought-line.error {
  color: rgba(17, 17, 17, 0.72);
}

.thought-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 auto;
  margin-top: 7px;
  border-radius: 50%;
  background: rgba(17, 17, 17, 0.25);
}

.thought-line.running .thought-dot {
  background: #111111;
  animation: thinkingPulse 1.1s ease-in-out infinite;
}

.thought-line.done .thought-dot {
  background: rgba(17, 17, 17, 0.4);
}

.thought-line.error .thought-dot {
  background: #111111;
}

.stream-cursor {
  display: inline-block;
  width: 7px;
  height: 16px;
  margin-left: 2px;
  border-radius: 99px;
  background: #111111;
  vertical-align: -2px;
  animation: cursorBlink 0.9s steps(2, start) infinite;
}

.action-log {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
}

.message.user .action-log {
  border-top-color: rgba(255, 255, 255, 0.16);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 7px 9px;
  border: 1px solid rgba(17, 17, 17, 0.07);
  border-radius: 13px;
  background: rgba(17, 17, 17, 0.035);
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  transition: var(--transition);
}

.action-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-item em {
  margin-left: auto;
  color: rgba(17, 17, 17, 0.48);
  font-family: inherit;
  font-size: 11px;
  font-style: normal;
  font-weight: 760;
}

.action-item.running {
  border-color: rgba(17, 17, 17, 0.14);
  background: linear-gradient(100deg, rgba(17, 17, 17, 0.04), rgba(17, 17, 17, 0.18), rgba(17, 17, 17, 0.04));
  background-size: 230% 100%;
  color: #111111;
  animation: toolSweep 1.15s ease-in-out infinite;
}

.action-item.done {
  border-color: rgba(17, 17, 17, 0.1);
  background: rgba(17, 17, 17, 0.08);
  color: #111111;
}

.action-item.error {
  border-color: rgba(17, 17, 17, 0.22);
  background: rgba(17, 17, 17, 0.13);
  color: #111111;
}

.pending-import {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px auto;
  align-items: center;
  gap: 10px;
  margin: 0 18px 14px;
  padding: 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  background: rgba(17, 17, 17, 0.04);
}

.pending-import div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.pending-import strong,
.pending-import span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-import span {
  color: var(--text-secondary);
  font-size: 12px;
}

.mini-select {
  min-height: 36px;
  padding-top: 7px;
  padding-bottom: 7px;
}

.composer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
  background: rgba(255, 255, 255, 0.44);
}

.icon-action {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: var(--transition);
}

.icon-action:hover {
  background: #111111;
  color: #ffffff;
}

.agent-input {
  width: 100%;
  min-height: 46px;
  max-height: 140px;
  padding: 12px 14px;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 18px;
  outline: none;
  resize: vertical;
}

.send-btn {
  align-self: end;
  min-height: 46px;
}

.hidden-input {
  display: none;
}

.side-panel {
  align-self: start;
  padding: 20px;
}

.side-panel h3,
.examples h4 {
  font-size: 16px;
  font-weight: 830;
}

.capability-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.capability {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(17, 17, 17, 0.04);
}

.capability strong {
  display: block;
  font-size: 13px;
}

.capability span {
  display: block;
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.examples {
  margin-top: 20px;
}

.examples button {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.62);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.examples button:hover {
  background: #111111;
  color: #ffffff;
}

.model-settings {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.settings-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.settings-head > .app-icon {
  padding: 9px;
  box-sizing: content-box;
  border-radius: 16px;
  background: #111111;
  color: #ffffff;
}

.settings-head strong,
.toggle-row span,
.config-field span {
  display: block;
  font-size: 13px;
  font-weight: 780;
}

.settings-head span {
  display: block;
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 12px;
}

.toggle-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 46px;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  cursor: pointer;
}

.toggle-row input {
  display: none;
}

.toggle-row i {
  position: relative;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.1);
  transition: var(--transition);
}

.toggle-row i::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(17, 17, 17, 0.22);
  content: '';
  transition: var(--transition);
}

.toggle-row input:checked + i {
  background: #111111;
}

.toggle-row input:checked + i::after {
  transform: translateX(20px);
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.config-field input {
  width: 100%;
  min-height: 38px;
  padding: 9px 11px;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.74);
  color: var(--text-primary);
  outline: none;
  transition: var(--transition);
}

.config-field input:focus {
  border-color: rgba(17, 17, 17, 0.26);
  box-shadow: 0 0 0 4px rgba(17, 17, 17, 0.06);
}

.config-save {
  width: 100%;
  margin-top: 12px;
  justify-content: center;
}

.model-status {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes thinkingPulse {
  0%,
  100% {
    opacity: 0.18;
    transform: translateY(0) scale(0.9);
  }

  45% {
    opacity: 0.9;
    transform: translateY(-3px) scale(1);
  }
}

@keyframes cursorBlink {
  50% {
    opacity: 0;
  }
}

@keyframes toolSweep {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

@media (max-width: 1080px) {
  .agent-grid {
    grid-template-columns: 1fr;
  }

  .agent-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .tool-strip {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .pending-import,
  .composer {
    grid-template-columns: 1fr;
  }

  .message-body {
    max-width: 100%;
  }
}
</style>
