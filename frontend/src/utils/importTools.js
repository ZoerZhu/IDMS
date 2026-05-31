export const importTypes = [
  {
    key: 'buildings-rooms',
    title: '楼栋房间',
    fields: [
      { key: 'building_name', label: '楼栋名称', required: true },
      { key: 'floors', label: '楼层数' },
      { key: 'room_number', label: '房间号', required: true },
      { key: 'floor', label: '所在楼层' },
      { key: 'capacity', label: '容量' }
    ]
  },
  {
    key: 'users',
    title: '学生用户',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'password', label: '密码' },
      { key: 'name', label: '姓名', required: true },
      { key: 'role', label: '角色' },
      { key: 'gender', label: '性别' },
      { key: 'phone', label: '手机号' },
      { key: 'building_name', label: '楼栋名称' },
      { key: 'room_number', label: '房间号' }
    ]
  },
  {
    key: 'repairs',
    title: '报修记录',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'type', label: '报修类型' },
      { key: 'description', label: '问题描述', required: true },
      { key: 'urgency', label: '紧急程度' },
      { key: 'status', label: '状态' },
      { key: 'assigned_to', label: '维修员' }
    ]
  },
  {
    key: 'power',
    title: '用电记录',
    fields: [
      { key: 'building_name', label: '楼栋名称', required: true },
      { key: 'room_number', label: '房间号', required: true },
      { key: 'watt', label: '功率', required: true },
      { key: 'threshold', label: '阈值' },
      { key: 'created_at', label: '记录时间' }
    ]
  },
  {
    key: 'hygiene',
    title: '卫生检查',
    fields: [
      { key: 'building_name', label: '楼栋名称', required: true },
      { key: 'room_number', label: '房间号', required: true },
      { key: 'score', label: '评分', required: true },
      { key: 'comment', label: '评语' },
      { key: 'inspector_username', label: '检查人用户名' },
      { key: 'created_at', label: '检查时间' }
    ]
  },
  {
    key: 'visitors',
    title: '访客预约',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'visitor_name', label: '访客姓名', required: true },
      { key: 'visitor_id_card', label: '身份证号' },
      { key: 'reason', label: '来访事由' },
      { key: 'visit_time', label: '来访时间' },
      { key: 'status', label: '状态' }
    ]
  },
  {
    key: 'late-returns',
    title: '晚归报备',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'reason', label: '晚归事由', required: true },
      { key: 'expected_time', label: '预计回寝' },
      { key: 'actual_time', label: '实际回寝' },
      { key: 'status', label: '状态' }
    ]
  },
  {
    key: 'mutual-aids',
    title: '互助信息',
    fields: [
      { key: 'username', label: '用户名', required: true },
      { key: 'type', label: '互助类型' },
      { key: 'title', label: '标题', required: true },
      { key: 'description', label: '详细描述' },
      { key: 'status', label: '状态' },
      { key: 'helper_username', label: '帮助人用户名' }
    ]
  },
  {
    key: 'announcements',
    title: '公告通知',
    fields: [
      { key: 'title', label: '标题', required: true },
      { key: 'content', label: '内容' },
      { key: 'is_pinned', label: '是否置顶' },
      { key: 'created_at', label: '发布时间' }
    ]
  }
]

const cnToKey = importTypes.reduce((acc, type) => {
  type.fields.forEach(field => {
    acc[field.label] = field.key
  })
  return acc
}, {})

export function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [cnToKey[key] || key, String(value ?? '').trim()]))
}

export function parseCsv(text) {
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
    .map(items => normalizeRow(headers.reduce((acc, header, index) => {
      acc[header] = items[index] ?? ''
      return acc
    }, {})))
}

export function parseDelimitedText(text) {
  const tableLines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => line.includes(',') || line.includes('\t') || line.includes('|'))

  if (!tableLines.length) return []
  const cleaned = tableLines
    .filter(line => !/^\|?\s*-{2,}/.test(line.replace(/\|/g, '').trim()))
    .map(line => {
      if (line.includes('|')) return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(item => item.trim()).join(',')
      if (line.includes('\t')) return line.split('\t').map(item => item.trim()).join(',')
      return line
    })
    .join('\n')
  return parseCsv(cleaned)
}

function matrixToRows(matrix) {
  const normalized = matrix
    .map(row => (Array.isArray(row) ? row : []))
    .filter(row => row.some(item => String(item ?? '').trim() !== ''))

  const headers = (normalized.shift() || []).map(item => String(item ?? '').replace(/^\uFEFF/, '').trim())
  return normalized.map(items => normalizeRow(headers.reduce((acc, header, index) => {
    if (header) acc[header] = items[index] ?? ''
    return acc
  }, {})))
}

async function parseWorkbook(input, type = 'array') {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(input, { type, raw: false, cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: false
  })
  return matrixToRows(matrix)
}

function decodeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function readUint32(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)
}

function readUint16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8)
}

async function inflateRaw(bytes) {
  if (!globalThis.DecompressionStream) throw new Error('当前浏览器不支持解压 Office 文档，请转换为 CSV 后导入')
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzipEntries(buffer) {
  const bytes = new Uint8Array(buffer)
  const entries = {}
  let offset = 0

  while (offset < bytes.length - 30) {
    if (readUint32(bytes, offset) !== 0x04034b50) {
      offset += 1
      continue
    }
    const method = readUint16(bytes, offset + 8)
    const compressedSize = readUint32(bytes, offset + 18)
    const fileNameLength = readUint16(bytes, offset + 26)
    const extraLength = readUint16(bytes, offset + 28)
    const nameStart = offset + 30
    const dataStart = nameStart + fileNameLength + extraLength
    const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + fileNameLength))
    const compressed = bytes.slice(dataStart, dataStart + compressedSize)
    if (method === 0) entries[name] = compressed
    if (method === 8) entries[name] = await inflateRaw(compressed)
    offset = dataStart + compressedSize
  }
  return entries
}

function xmlEntryToText(entries, name) {
  const entry = entries[name]
  if (!entry) return ''
  return new TextDecoder('utf-8').decode(entry)
}

function columnIndex(ref) {
  const letters = String(ref || '').replace(/[0-9]/g, '')
  return letters.split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1
}

async function parseXlsx(buffer) {
  return parseWorkbook(buffer)
}

async function parseDocx(buffer) {
  const module = await import('mammoth')
  const mammoth = module.default || module
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return parseDelimitedText(result.value || '')
}

function parsePdfFallback(buffer) {
  const bytes = new Uint8Array(buffer)
  const text = new TextDecoder('latin1').decode(bytes)
  const fragments = []
  for (const match of text.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g)) {
    fragments.push(match[1].replace(/\\([()\\])/g, '$1'))
  }
  for (const match of text.matchAll(/\[((?:.|\n)*?)\]\s*TJ/g)) {
    const parts = [...match[1].matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g)].map(item => item[1].replace(/\\([()\\])/g, '$1'))
    if (parts.length) fragments.push(parts.join(''))
  }
  return parseDelimitedText(fragments.join('\n'))
}

async function parsePdfText(buffer) {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useSystemFonts: true
    })
    const pdf = await loadingTask.promise
    const pages = []
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo)
      const content = await page.getTextContent()
      pages.push(content.items.map(item => item.str || '').join('\n'))
    }
    return parseDelimitedText(pages.join('\n'))
  } catch {
    return parsePdfFallback(buffer)
  }
}

export async function parseImportFile(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return parseWorkbook(await file.text(), 'string')
  if (name.endsWith('.txt') || name.endsWith('.md')) return parseDelimitedText(await file.text())
  const buffer = await file.arrayBuffer()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseXlsx(buffer)
  if (name.endsWith('.docx')) return parseDocx(buffer)
  if (name.endsWith('.pdf')) return parsePdfText(buffer)
  throw new Error('暂不支持该文件格式')
}

export function inferImportType(rows, fallback = 'users') {
  const keys = new Set(rows.flatMap(row => Object.keys(row).filter(key => row[key])))
  let best = null
  for (const type of importTypes) {
    const score = type.fields.reduce((sum, field) => sum + (keys.has(field.key) ? (field.required ? 3 : 1) : 0), 0)
    if (!best || score > best.score) best = { type, score }
  }
  return best?.score > 0 ? best.type.key : fallback
}

export function validateImportRows(typeKey, rows) {
  const type = importTypes.find(item => item.key === typeKey)
  if (!type) return ['未知导入类型']
  const required = type.fields.filter(field => field.required)
  const errors = []
  rows.forEach((row, index) => {
    required.forEach(field => {
      if (!row[field.key]) errors.push(`第 ${index + 2} 行缺少必填字段：${field.label}`)
    })
  })
  return errors
}
