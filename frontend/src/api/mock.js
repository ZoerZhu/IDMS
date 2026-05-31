const STORAGE_KEY = 'dormitory_mock_state_v4'
const SESSION_USER_KEY = 'dormitory_mock_user_id'

const clone = value => JSON.parse(JSON.stringify(value))
const ok = (data = null, msg = 'success') => ({ code: 0, msg, data })
const fail = (msg = 'error', code = 1) => ({ code, msg, data: null })
const wait = () => new Promise(resolve => setTimeout(resolve, 180))

function iso(hoursAgo = 0) {
  const d = new Date()
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

function createInitialState() {
  const buildings = [
    { id: 1, name: '梅园 1 号楼', floors: 6, created_at: iso(960) },
    { id: 2, name: '梅园 2 号楼', floors: 6, created_at: iso(950) },
    { id: 3, name: '兰园 1 号楼', floors: 7, created_at: iso(940) },
    { id: 4, name: '竹园 1 号楼', floors: 5, created_at: iso(930) }
  ]

  const rooms = []
  let roomId = 1
  buildings.forEach(building => {
    for (let floor = 1; floor <= Math.min(building.floors, 4); floor += 1) {
      for (let index = 1; index <= 4; index += 1) {
        rooms.push({
          id: roomId,
          building_id: building.id,
          floor,
          number: `${floor}0${index}`,
          capacity: 4,
          created_at: iso(900 - roomId)
        })
        roomId += 1
      }
    }
  })

  const users = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      name: '张管理',
      role: 'admin',
      gender: '男',
      phone: '13800000001',
      building_id: null,
      room_id: null,
      avatar: '',
      created_at: iso(800)
    },
    {
      id: 2,
      username: 'student1',
      password: '123456',
      name: '李明',
      role: 'student',
      gender: '男',
      phone: '13810000001',
      building_id: 1,
      room_id: 1,
      avatar: '',
      created_at: iso(700)
    },
    {
      id: 3,
      username: 'student2',
      password: '123456',
      name: '王芳',
      role: 'student',
      gender: '女',
      phone: '13810000002',
      building_id: 1,
      room_id: 2,
      avatar: '',
      created_at: iso(690)
    },
    {
      id: 4,
      username: 'student3',
      password: '123456',
      name: '赵强',
      role: 'student',
      gender: '男',
      phone: '13810000003',
      building_id: 2,
      room_id: 17,
      avatar: '',
      created_at: iso(680)
    },
    {
      id: 5,
      username: 'student4',
      password: '123456',
      name: '陈静',
      role: 'student',
      gender: '女',
      phone: '13810000004',
      building_id: 3,
      room_id: 33,
      avatar: '',
      created_at: iso(670)
    },
    {
      id: 6,
      username: 'student5',
      password: '123456',
      name: '刘洋',
      role: 'student',
      gender: '男',
      phone: '13810000005',
      building_id: 4,
      room_id: 49,
      avatar: '',
      created_at: iso(660)
    }
  ]

  const repairs = [
    { id: 1, user_id: 2, room_id: 1, type: 'water', description: '洗手台水龙头关紧后仍有滴水，需要更换垫片。', urgency: 'medium', status: 'pending', assigned_to: '', images: '', created_at: iso(2), updated_at: iso(2) },
    { id: 2, user_id: 3, room_id: 2, type: 'network', description: '晚间网络频繁断开，路由器重启后只能短暂恢复。', urgency: 'high', status: 'processing', assigned_to: '王师傅', images: '', created_at: iso(9), updated_at: iso(3) },
    { id: 3, user_id: 4, room_id: 17, type: 'furniture', description: '衣柜门合页松动，开合时有明显异响。', urgency: 'low', status: 'done', assigned_to: '李师傅', images: '', created_at: iso(36), updated_at: iso(5) },
    { id: 4, user_id: 5, room_id: 33, type: 'electric', description: '靠阳台一侧插座接触不良，偶发断电。', urgency: 'high', status: 'pending', assigned_to: '', images: '', created_at: iso(5), updated_at: iso(5) },
    { id: 5, user_id: 6, room_id: 49, type: 'other', description: '窗户密封条老化，雨天有渗水情况。', urgency: 'medium', status: 'processing', assigned_to: '周师傅', images: '', created_at: iso(18), updated_at: iso(6) }
  ]

  const powerRecords = []
  let powerId = 1
  const monitoredRooms = [1, 2, 17, 18, 33, 34, 49, 50]
  monitoredRooms.forEach((room_id, roomIndex) => {
    ;[24, 18, 12, 6, 1].forEach((hour, index) => {
      const base = 680 + roomIndex * 95 + index * 80
      const warning = (roomIndex + index) % 5 === 0
      const watt = warning ? 2360 + roomIndex * 70 : base
      powerRecords.push({
        id: powerId,
        room_id,
        watt,
        threshold: 2000,
        is_warning: watt > 2000,
        created_at: iso(hour)
      })
      powerId += 1
    })
  })

  const hygiene = [
    { id: 1, room_id: 1, inspector_id: 1, score: 9, level: 'excellent', comment: '桌面、地面和阳台整洁，物品归位清晰。', created_at: iso(4) },
    { id: 2, room_id: 2, inspector_id: 1, score: 8, level: 'good', comment: '整体干净，垃圾桶需保持每日清理。', created_at: iso(6) },
    { id: 3, room_id: 17, inspector_id: 1, score: 6, level: 'average', comment: '公共区域可见杂物，建议固定收纳位置。', created_at: iso(28) },
    { id: 4, room_id: 33, inspector_id: 1, score: 5, level: 'average', comment: '阳台晾晒区拥挤，通道需要保持畅通。', created_at: iso(30) },
    { id: 5, room_id: 49, inspector_id: 1, score: 4, level: 'poor', comment: '地面有明显灰尘，本周需复查。', created_at: iso(32) },
    { id: 6, room_id: 18, inspector_id: 1, score: 10, level: 'excellent', comment: '卫生状态优秀，可作为本周示范寝室。', created_at: iso(50) }
  ]

  const visitors = [
    { id: 1, user_id: 2, visitor_name: '李女士', visitor_id_card: '310101198802014521', reason: '送换季衣物', visit_time: '2026-06-01 14:00', status: 'pending', reviewer_id: null, created_at: iso(2) },
    { id: 2, user_id: 3, visitor_name: '王先生', visitor_id_card: '310101197912126834', reason: '探望学生', visit_time: '2026-06-02 10:30', status: 'approved', reviewer_id: 1, created_at: iso(16) },
    { id: 3, user_id: 4, visitor_name: '赵女士', visitor_id_card: '310101198606201225', reason: '办理材料交接', visit_time: '2026-06-03 16:00', status: 'rejected', reviewer_id: 1, created_at: iso(26) },
    { id: 4, user_id: 5, visitor_name: '陈先生', visitor_id_card: '310101197704093672', reason: '参加学院活动后短暂停留', visit_time: '2026-06-04 18:30', status: 'pending', reviewer_id: null, created_at: iso(7) }
  ]

  const lateReturns = [
    { id: 1, user_id: 2, reason: '实验室项目验收延期', expected_time: '23:40', actual_time: '', status: 'pending', reviewer_id: null, created_at: iso(1) },
    { id: 2, user_id: 3, reason: '图书馆小组讨论', expected_time: '23:20', actual_time: '23:12', status: 'approved', reviewer_id: 1, created_at: iso(15) },
    { id: 3, user_id: 4, reason: '校外就医返校较晚', expected_time: '00:10', actual_time: '', status: 'pending', reviewer_id: null, created_at: iso(8) },
    { id: 4, user_id: 6, reason: '社团彩排结束过晚', expected_time: '23:55', actual_time: '23:48', status: 'approved', reviewer_id: 1, created_at: iso(24) }
  ]

  const mutualAids = [
    { id: 1, user_id: 2, type: 'delivery', title: '帮取北门快递柜包裹', description: '今晚 20:00 前都可以，柜号和取件码私信发送。', status: 'open', helper_id: null, created_at: iso(2) },
    { id: 2, user_id: 3, type: 'study', title: '高数期末一起刷题', description: '计划连续三晚复盘错题，地点在兰园自习室。', status: 'accepted', helper_id: 5, created_at: iso(14) },
    { id: 3, user_id: 4, type: 'borrow', title: '临时借用网线一根', description: '明天上午归还，最好 2 米以上。', status: 'done', helper_id: 2, created_at: iso(30) },
    { id: 4, user_id: 5, type: 'carpool', title: '周五拼车去虹桥站', description: '18:30 从东门出发，已有两人。', status: 'open', helper_id: null, created_at: iso(4) },
    { id: 5, user_id: 6, type: 'other', title: '寻找失物登记协助', description: '帮忙留意一张黑色校园卡，感谢。', status: 'open', helper_id: null, created_at: iso(6) }
  ]

  const announcements = [
    { id: 1, title: '六月宿舍安全检查安排', content: '本周三 14:00 起按楼栋分批检查，请保持消防通道、插座周边和阳台区域整洁。', author_id: 1, is_pinned: true, created_at: iso(10) },
    { id: 2, title: '访客预约规则更新', content: '访客需提前提交预约，审批通过后在门岗核验身份信息并按预约时间进出。', author_id: 1, is_pinned: false, created_at: iso(26) },
    { id: 3, title: '夏季空调用电提醒', content: '建议空调温度设置在 26 摄氏度以上，离寝时关闭大功率设备，避免线路过载。', author_id: 1, is_pinned: false, created_at: iso(48) },
    { id: 4, title: '卫生优秀寝室公示', content: '梅园 1 号楼 101、兰园 1 号楼 101 本周卫生表现优秀，请继续保持。', author_id: 1, is_pinned: false, created_at: iso(72) }
  ]

  const notifications = [
    { id: 1, user_id: 1, title: '有新的访客预约待审批', content: '李明提交了 6 月 1 日访客预约，请及时处理。', is_read: false, created_at: iso(1) },
    { id: 2, user_id: 1, title: '用电功率超限提醒', content: '梅园 1 号楼 101 当前功率超过阈值，请关注。', is_read: false, created_at: iso(2) },
    { id: 3, user_id: 2, title: '报修申请已进入维修中', content: '网络问题已分配给维修人员，请保持电话畅通。', is_read: false, created_at: iso(3) },
    { id: 4, user_id: 2, title: '新公告已发布', content: '六月宿舍安全检查安排已发布，请查看详情。', is_read: true, created_at: iso(10) }
  ]

  return { buildings, rooms, users, repairs, powerRecords, hygiene, visitors, lateReturns, mutualAids, announcements, notifications }
}

function readState() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    const initial = createInitialState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
  try {
    return JSON.parse(saved)
  } catch {
    const initial = createInitialState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nextId(state, key) {
  return Math.max(0, ...state[key].map(item => item.id || 0)) + 1
}

function buildingById(state, id) {
  return state.buildings.find(item => item.id === Number(id))
}

function roomById(state, id) {
  return state.rooms.find(item => item.id === Number(id))
}

function userById(state, id) {
  return state.users.find(item => item.id === Number(id))
}

function currentUser(state) {
  const mockId = Number(localStorage.getItem(SESSION_USER_KEY))
  if (mockId) return userById(state, mockId)
  const savedUser = JSON.parse(localStorage.getItem('user') || 'null')
  return savedUser?.id ? userById(state, savedUser.id) : null
}

function roomBuilding(state, roomId) {
  const room = roomById(state, roomId)
  return room ? buildingById(state, room.building_id) : null
}

function shapeUser(state, user) {
  const room = roomById(state, user.room_id)
  const building = room ? buildingById(state, room.building_id) : buildingById(state, user.building_id)
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    gender: user.gender,
    phone: user.phone,
    building_id: user.building_id,
    room_id: user.room_id,
    building: building?.name || '',
    room: room?.number || '',
    avatar: user.avatar || '',
    created_at: user.created_at
  }
}

function shapeBuilding(state, building) {
  return {
    ...building,
    room_count: state.rooms.filter(room => room.building_id === building.id).length
  }
}

function shapeRoom(state, room) {
  return {
    ...room,
    building_name: buildingById(state, room.building_id)?.name || '',
    occupant_count: state.users.filter(user => user.room_id === room.id).length
  }
}

function shapeRepair(state, repair) {
  const user = userById(state, repair.user_id)
  const room = roomById(state, repair.room_id)
  const building = roomBuilding(state, repair.room_id)
  return {
    ...repair,
    user_name: user?.name || '',
    room_number: room?.number || '',
    building: building?.name || ''
  }
}

function shapePower(state, power) {
  const room = roomById(state, power.room_id)
  const building = roomBuilding(state, power.room_id)
  return {
    ...power,
    room_number: room?.number || '',
    building: building?.name || ''
  }
}

function shapeHygiene(state, record) {
  const room = roomById(state, record.room_id)
  const building = roomBuilding(state, record.room_id)
  const inspector = userById(state, record.inspector_id)
  return {
    ...record,
    room_number: room?.number || '',
    building: building?.name || '',
    inspector_name: inspector?.name || ''
  }
}

function shapeVisitor(state, visitor) {
  const user = userById(state, visitor.user_id)
  const reviewer = userById(state, visitor.reviewer_id)
  const room = roomById(state, user?.room_id)
  const building = room ? buildingById(state, room.building_id) : null
  return {
    ...visitor,
    user_name: user?.name || '',
    room: room?.number || '',
    building: building?.name || '',
    reviewer_name: reviewer?.name || ''
  }
}

function shapeLateReturn(state, item) {
  const user = userById(state, item.user_id)
  const reviewer = userById(state, item.reviewer_id)
  const room = roomById(state, user?.room_id)
  const building = room ? buildingById(state, room.building_id) : null
  return {
    ...item,
    user_name: user?.name || '',
    room: room?.number || '',
    building: building?.name || '',
    reviewer_name: reviewer?.name || ''
  }
}

function shapeMutualAid(state, item) {
  const user = userById(state, item.user_id)
  const helper = userById(state, item.helper_id)
  return {
    ...item,
    user_name: user?.name || '',
    helper_name: helper?.name || ''
  }
}

function shapeAnnouncement(state, item) {
  const author = userById(state, item.author_id)
  return { ...item, author_name: author?.name || '' }
}

function addNotification(state, userId, title, content) {
  if (!userId) return
  state.notifications.unshift({
    id: nextId(state, 'notifications'),
    user_id: userId,
    title,
    content,
    is_read: false,
    created_at: new Date().toISOString()
  })
}

function filterByStatus(items, params) {
  const status = params.get('status')
  return status ? items.filter(item => item.status === status) : items
}

function getLevel(score) {
  if (score >= 9) return 'excellent'
  if (score >= 7) return 'good'
  if (score >= 5) return 'average'
  return 'poor'
}

function buildDashboard(state) {
  return {
    repairs: state.repairs.length,
    repairs_pending: state.repairs.filter(item => item.status === 'pending').length,
    hygiene_today: state.hygiene.filter(item => Date.now() - new Date(item.created_at).getTime() < 24 * 60 * 60 * 1000).length,
    late_today: state.lateReturns.filter(item => item.status === 'pending').length,
    visitors_pending: state.visitors.filter(item => item.status === 'pending').length,
    power_warnings: state.powerRecords.filter(item => item.is_warning).length,
    announcements: state.announcements.length,
    aids_open: state.mutualAids.filter(item => item.status === 'open').length,
    users: state.users.length,
    buildings: state.buildings.length,
    rooms: state.rooms.length
  }
}

function buildStatistics(state) {
  const repairTypes = ['water', 'electric', 'furniture', 'network', 'other'].map(type => ({
    type,
    count: state.repairs.filter(item => item.type === type).length
  })).filter(item => item.count > 0)

  const hygieneLevels = ['excellent', 'good', 'average', 'poor'].map(level => ({
    level,
    count: state.hygiene.filter(item => item.level === level).length
  }))

  const average = (items, key) => {
    if (!items.length) return 0
    return Math.round((items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length) * 10) / 10
  }

  return {
    repair: {
      total: state.repairs.length,
      pending: state.repairs.filter(item => item.status === 'pending').length,
      processing: state.repairs.filter(item => item.status === 'processing').length,
      done: state.repairs.filter(item => item.status === 'done').length,
      types: repairTypes
    },
    hygiene: {
      total: state.hygiene.length,
      avg_score: average(state.hygiene, 'score'),
      levels: hygieneLevels
    },
    visitor: {
      total: state.visitors.length,
      pending: state.visitors.filter(item => item.status === 'pending').length
    },
    late_return: {
      total: state.lateReturns.length,
      pending: state.lateReturns.filter(item => item.status === 'pending').length
    },
    power: {
      warnings: state.powerRecords.filter(item => item.is_warning).length,
      avg_watt: average(state.powerRecords, 'watt')
    },
    mutual_aid: {
      total: state.mutualAids.length,
      open: state.mutualAids.filter(item => item.status === 'open').length
    }
  }
}

function cell(row, ...keys) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function numericCell(row, keys, fallback = 0) {
  const value = Number(cell(row, ...keys))
  return Number.isFinite(value) ? value : fallback
}

function booleanCell(row, ...keys) {
  const value = cell(row, ...keys).toLowerCase()
  return ['1', 'true', 'yes', 'y', '是', '置顶'].includes(value)
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function userByUsername(state, username) {
  return state.users.find(item => item.username === username)
}

function buildingByName(state, name) {
  return state.buildings.find(item => item.name === name)
}

function roomByBuildingAndNumber(state, buildingId, number) {
  return state.rooms.find(item => item.building_id === Number(buildingId) && item.number === String(number))
}

function ensureBuilding(state, name, floors = 6) {
  if (!name) return null
  let building = buildingByName(state, name)
  if (!building) {
    building = { id: nextId(state, 'buildings'), name, floors: Number(floors || 6), created_at: new Date().toISOString() }
    state.buildings.push(building)
  } else if (floors) {
    building.floors = Math.max(building.floors, Number(floors))
  }
  return building
}

function ensureRoom(state, buildingName, roomNumber, floor = 1, capacity = 4, floors = 6) {
  const building = ensureBuilding(state, buildingName, Math.max(Number(floors || 6), Number(floor || 1)))
  if (!building || !roomNumber) return null
  let room = roomByBuildingAndNumber(state, building.id, roomNumber)
  if (!room) {
    room = {
      id: nextId(state, 'rooms'),
      building_id: building.id,
      floor: Number(floor || String(roomNumber).slice(0, 1) || 1),
      number: String(roomNumber),
      capacity: Number(capacity || 4),
      created_at: new Date().toISOString()
    }
    state.rooms.push(room)
  } else {
    room.capacity = Number(capacity || room.capacity)
    room.floor = Number(floor || room.floor)
  }
  return room
}

function importRows(state, type, rows, operator) {
  const errors = []
  let imported = 0
  const now = new Date().toISOString()

  rows.forEach((row, index) => {
    const rowNo = index + 2
    try {
      if (type === 'buildings-rooms') {
        const buildingName = cell(row, 'building_name', '楼栋名称')
        const roomNumber = cell(row, 'room_number', '房间号')
        if (!buildingName || !roomNumber) throw new Error('楼栋名称和房间号必填')
        ensureRoom(
          state,
          buildingName,
          roomNumber,
          numericCell(row, ['floor', '楼层'], Number(String(roomNumber).slice(0, 1)) || 1),
          numericCell(row, ['capacity', '容量'], 4),
          numericCell(row, ['floors', '楼层数'], 6)
        )
        imported += 1
      } else if (type === 'users') {
        const username = cell(row, 'username', '用户名')
        const name = cell(row, 'name', '姓名')
        if (!username || !name) throw new Error('用户名和姓名必填')
        const buildingName = cell(row, 'building_name', '楼栋名称')
        const roomNumber = cell(row, 'room_number', '房间号')
        const room = buildingName && roomNumber ? ensureRoom(state, buildingName, roomNumber) : null
        let target = userByUsername(state, username)
        const payload = {
          username,
          password: cell(row, 'password', '密码') || '123456',
          name,
          role: cell(row, 'role', '角色') || 'student',
          gender: cell(row, 'gender', '性别'),
          phone: cell(row, 'phone', '手机号'),
          building_id: room?.building_id || null,
          room_id: room?.id || null,
          avatar: '',
          created_at: target?.created_at || now
        }
        if (target) Object.assign(target, payload)
        else state.users.push({ id: nextId(state, 'users'), ...payload })
        imported += 1
      } else if (type === 'repairs') {
        const owner = userByUsername(state, cell(row, 'username', '用户名'))
        if (!owner) throw new Error('用户名不存在')
        state.repairs.unshift({
          id: nextId(state, 'repairs'),
          user_id: owner.id,
          room_id: owner.room_id,
          type: cell(row, 'type', '报修类型') || 'other',
          description: cell(row, 'description', '问题描述'),
          urgency: cell(row, 'urgency', '紧急程度') || 'medium',
          status: cell(row, 'status', '状态') || 'pending',
          assigned_to: cell(row, 'assigned_to', '维修员'),
          images: '',
          created_at: normalizeDate(cell(row, 'created_at', '创建时间')),
          updated_at: now
        })
        imported += 1
      } else if (type === 'power') {
        const room = ensureRoom(state, cell(row, 'building_name', '楼栋名称'), cell(row, 'room_number', '房间号'))
        if (!room) throw new Error('楼栋名称和房间号必填')
        const watt = numericCell(row, ['watt', '功率'], 0)
        const threshold = numericCell(row, ['threshold', '阈值'], 2000)
        state.powerRecords.unshift({
          id: nextId(state, 'powerRecords'),
          room_id: room.id,
          watt,
          threshold,
          is_warning: watt > threshold,
          created_at: normalizeDate(cell(row, 'created_at', '记录时间'))
        })
        imported += 1
      } else if (type === 'hygiene') {
        const room = ensureRoom(state, cell(row, 'building_name', '楼栋名称'), cell(row, 'room_number', '房间号'))
        if (!room) throw new Error('楼栋名称和房间号必填')
        const inspector = userByUsername(state, cell(row, 'inspector_username', '检查人用户名')) || operator
        const score = numericCell(row, ['score', '评分'], 8)
        state.hygiene.unshift({
          id: nextId(state, 'hygiene'),
          room_id: room.id,
          inspector_id: inspector.id,
          score,
          level: getLevel(score),
          comment: cell(row, 'comment', '评语'),
          created_at: normalizeDate(cell(row, 'created_at', '检查时间'))
        })
        imported += 1
      } else if (type === 'visitors') {
        const owner = userByUsername(state, cell(row, 'username', '用户名'))
        if (!owner) throw new Error('用户名不存在')
        state.visitors.unshift({
          id: nextId(state, 'visitors'),
          user_id: owner.id,
          visitor_name: cell(row, 'visitor_name', '访客姓名'),
          visitor_id_card: cell(row, 'visitor_id_card', '身份证号'),
          reason: cell(row, 'reason', '来访事由'),
          visit_time: cell(row, 'visit_time', '来访时间'),
          status: cell(row, 'status', '状态') || 'pending',
          reviewer_id: null,
          created_at: now
        })
        imported += 1
      } else if (type === 'late-returns') {
        const owner = userByUsername(state, cell(row, 'username', '用户名'))
        if (!owner) throw new Error('用户名不存在')
        state.lateReturns.unshift({
          id: nextId(state, 'lateReturns'),
          user_id: owner.id,
          reason: cell(row, 'reason', '晚归事由'),
          expected_time: cell(row, 'expected_time', '预计回寝'),
          actual_time: cell(row, 'actual_time', '实际回寝'),
          status: cell(row, 'status', '状态') || 'pending',
          reviewer_id: null,
          created_at: now
        })
        imported += 1
      } else if (type === 'mutual-aids') {
        const owner = userByUsername(state, cell(row, 'username', '用户名'))
        if (!owner) throw new Error('用户名不存在')
        const helperName = cell(row, 'helper_username', '帮助人用户名')
        const helper = helperName ? userByUsername(state, helperName) : null
        state.mutualAids.unshift({
          id: nextId(state, 'mutualAids'),
          user_id: owner.id,
          type: cell(row, 'type', '互助类型') || 'other',
          title: cell(row, 'title', '标题'),
          description: cell(row, 'description', '详细描述'),
          status: cell(row, 'status', '状态') || 'open',
          helper_id: helper?.id || null,
          created_at: now
        })
        imported += 1
      } else if (type === 'announcements') {
        const title = cell(row, 'title', '标题')
        if (!title) throw new Error('标题必填')
        state.announcements.unshift({
          id: nextId(state, 'announcements'),
          title,
          content: cell(row, 'content', '内容'),
          author_id: operator.id,
          is_pinned: booleanCell(row, 'is_pinned', '是否置顶'),
          created_at: normalizeDate(cell(row, 'created_at', '发布时间'))
        })
        imported += 1
      } else {
        throw new Error('未知导入类型')
      }
    } catch (error) {
      errors.push({ row: rowNo, message: error.message })
    }
  })

  addNotification(state, operator.id, '数据导入完成', `本次导入成功 ${imported} 条，失败 ${errors.length} 条。`)
  return { imported, failed: errors.length, errors: errors.slice(0, 20) }
}

async function handleRequest(method, rawUrl, payload = {}) {
  await wait()
  const state = readState()
  const url = new URL(rawUrl, window.location.origin)
  const path = url.pathname.replace(/^\/api/, '')
  const user = currentUser(state)
  let changed = false
  let response

  if (method === 'POST' && path === '/login') {
    const loginUser = state.users.find(item => item.username === payload.username && item.password === payload.password)
    if (!loginUser) return fail('用户名或密码错误')
    localStorage.setItem(SESSION_USER_KEY, String(loginUser.id))
    return ok({ token: `mock-token-${loginUser.id}-${Date.now()}`, user: shapeUser(state, loginUser) })
  }

  if (!user) return fail('登录已过期', 401)

  if (method === 'POST' && /^\/imports\/[a-z-]+$/.test(path)) {
    if (user.role !== 'admin') return fail('无权限', 403)
    const type = path.split('/').pop()
    const rows = Array.isArray(payload.rows) ? payload.rows : []
    if (!rows.length) return fail('没有可导入的数据')
    const result = importRows(state, type, rows, user)
    changed = true
    response = ok(result, '导入完成')
  } else if (method === 'GET' && path === '/me') {
    response = ok(shapeUser(state, user))
  } else if (method === 'GET' && path === '/users') {
    response = ok(state.users.map(item => shapeUser(state, item)))
  } else if (method === 'DELETE' && /^\/users\/\d+$/.test(path)) {
    if (user.role !== 'admin') return fail('无权限', 403)
    const id = Number(path.split('/').pop())
    if (id === user.id) return fail('不能删除当前登录用户')
    state.users = state.users.filter(item => item.id !== id)
    state.repairs = state.repairs.filter(item => item.user_id !== id)
    state.visitors = state.visitors.filter(item => item.user_id !== id)
    state.lateReturns = state.lateReturns.filter(item => item.user_id !== id)
    state.mutualAids = state.mutualAids.filter(item => item.user_id !== id && item.helper_id !== id)
    state.notifications = state.notifications.filter(item => item.user_id !== id)
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/buildings') {
    response = ok(state.buildings.map(item => shapeBuilding(state, item)))
  } else if (method === 'POST' && path === '/buildings') {
    const building = { id: nextId(state, 'buildings'), name: payload.name, floors: Number(payload.floors || 6), created_at: new Date().toISOString() }
    state.buildings.push(building)
    changed = true
    response = ok(shapeBuilding(state, building), '楼栋已创建')
  } else if (method === 'DELETE' && /^\/buildings\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop())
    state.buildings = state.buildings.filter(item => item.id !== id)
    state.rooms = state.rooms.filter(item => item.building_id !== id)
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/rooms') {
    const buildingId = Number(url.searchParams.get('building_id'))
    const rooms = buildingId ? state.rooms.filter(item => item.building_id === buildingId) : state.rooms
    response = ok(rooms.map(item => shapeRoom(state, item)))
  } else if (method === 'POST' && path === '/rooms') {
    const room = {
      id: nextId(state, 'rooms'),
      building_id: Number(payload.building_id),
      floor: Number(payload.floor || 1),
      number: String(payload.number || ''),
      capacity: Number(payload.capacity || 4),
      created_at: new Date().toISOString()
    }
    state.rooms.push(room)
    changed = true
    response = ok(shapeRoom(state, room), '房间已添加')
  } else if (method === 'DELETE' && /^\/rooms\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop())
    state.rooms = state.rooms.filter(item => item.id !== id)
    state.users.forEach(item => {
      if (item.room_id === id) item.room_id = null
    })
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/repairs') {
    let repairs = user.role === 'admin' ? state.repairs : state.repairs.filter(item => item.user_id === user.id)
    repairs = filterByStatus(repairs, url.searchParams)
    response = ok(repairs.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => shapeRepair(state, item)))
  } else if (method === 'POST' && path === '/repairs') {
    const repair = {
      id: nextId(state, 'repairs'),
      user_id: user.id,
      room_id: user.room_id,
      type: payload.type || 'other',
      description: payload.description || '',
      urgency: payload.urgency || 'medium',
      status: 'pending',
      assigned_to: '',
      images: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    state.repairs.unshift(repair)
    addNotification(state, 1, '新的报修申请', `${user.name} 提交了 ${repair.description.slice(0, 18)} 的报修。`)
    changed = true
    response = ok(shapeRepair(state, repair), '报修已提交')
  } else if (method === 'PUT' && /^\/repairs\/\d+$/.test(path)) {
    const repair = state.repairs.find(item => item.id === Number(path.split('/').pop()))
    Object.assign(repair, payload, { updated_at: new Date().toISOString() })
    addNotification(state, repair.user_id, '报修状态更新', `你的报修状态已更新为 ${repair.status}。`)
    changed = true
    response = ok(shapeRepair(state, repair))
  } else if (method === 'DELETE' && /^\/repairs\/\d+$/.test(path)) {
    state.repairs = state.repairs.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/power/latest') {
    const latest = state.rooms.map(room => state.powerRecords
      .filter(item => item.room_id === room.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0])
      .filter(Boolean)
    response = ok(latest.map(item => shapePower(state, item)))
  } else if (method === 'GET' && path === '/power') {
    let records = state.powerRecords
    if (url.searchParams.has('room_id')) records = records.filter(item => item.room_id === Number(url.searchParams.get('room_id')))
    if (url.searchParams.has('is_warning')) records = records.filter(item => item.is_warning === (url.searchParams.get('is_warning') === 'true'))
    response = ok(records.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => shapePower(state, item)))
  } else if (method === 'GET' && path === '/power/stats') {
    const total = state.powerRecords.length
    const avg = total ? state.powerRecords.reduce((sum, item) => sum + item.watt, 0) / total : 0
    response = ok({ warnings: state.powerRecords.filter(item => item.is_warning).length, total_records: total, avg_watt: Math.round(avg * 10) / 10 })
  } else if (method === 'POST' && path === '/power/record') {
    const watt = Number(payload.watt || 0)
    const threshold = Number(payload.threshold || 2000)
    const power = { id: nextId(state, 'powerRecords'), room_id: Number(payload.room_id), watt, threshold, is_warning: watt > threshold, created_at: new Date().toISOString() }
    state.powerRecords.unshift(power)
    if (power.is_warning) addNotification(state, 1, '用电功率超限', `${shapePower(state, power).building} ${shapePower(state, power).room_number} 当前功率超过阈值。`)
    changed = true
    response = ok(shapePower(state, power))
  } else if (method === 'DELETE' && /^\/power\/\d+$/.test(path)) {
    if (user.role !== 'admin') return fail('无权限', 403)
    state.powerRecords = state.powerRecords.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/hygiene') {
    response = ok(state.hygiene.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => shapeHygiene(state, item)))
  } else if (method === 'POST' && path === '/hygiene') {
    const score = Number(payload.score || 8)
    const record = { id: nextId(state, 'hygiene'), room_id: Number(payload.room_id), inspector_id: user.id, score, level: getLevel(score), comment: payload.comment || '', created_at: new Date().toISOString() }
    state.hygiene.unshift(record)
    changed = true
    response = ok(shapeHygiene(state, record), '检查记录已提交')
  } else if (method === 'DELETE' && /^\/hygiene\/\d+$/.test(path)) {
    state.hygiene = state.hygiene.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/visitors') {
    let list = user.role === 'admin' ? state.visitors : state.visitors.filter(item => item.user_id === user.id)
    list = filterByStatus(list, url.searchParams)
    response = ok(list.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => shapeVisitor(state, item)))
  } else if (method === 'POST' && path === '/visitors') {
    const visitor = { id: nextId(state, 'visitors'), user_id: user.id, visitor_name: payload.visitor_name, visitor_id_card: payload.visitor_id_card || '', reason: payload.reason || '', visit_time: payload.visit_time || '', status: 'pending', reviewer_id: null, created_at: new Date().toISOString() }
    state.visitors.unshift(visitor)
    addNotification(state, 1, '新的访客预约', `${user.name} 提交了访客 ${visitor.visitor_name} 的预约。`)
    changed = true
    response = ok(shapeVisitor(state, visitor), '预约已提交')
  } else if (method === 'PUT' && /^\/visitors\/\d+$/.test(path)) {
    const visitor = state.visitors.find(item => item.id === Number(path.split('/').pop()))
    Object.assign(visitor, payload, { reviewer_id: user.id })
    addNotification(state, visitor.user_id, '访客预约审批结果', `你的访客预约已${visitor.status === 'approved' ? '批准' : '拒绝'}。`)
    changed = true
    response = ok(shapeVisitor(state, visitor))
  } else if (method === 'DELETE' && /^\/visitors\/\d+$/.test(path)) {
    state.visitors = state.visitors.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/late-returns') {
    let list = user.role === 'admin' ? state.lateReturns : state.lateReturns.filter(item => item.user_id === user.id)
    list = filterByStatus(list, url.searchParams)
    response = ok(list.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => shapeLateReturn(state, item)))
  } else if (method === 'POST' && path === '/late-returns') {
    const item = { id: nextId(state, 'lateReturns'), user_id: user.id, reason: payload.reason || '', expected_time: payload.expected_time || '', actual_time: payload.actual_time || '', status: 'pending', reviewer_id: null, created_at: new Date().toISOString() }
    state.lateReturns.unshift(item)
    addNotification(state, 1, '新的晚归报备', `${user.name} 提交了预计 ${item.expected_time} 回寝的报备。`)
    changed = true
    response = ok(shapeLateReturn(state, item), '报备已提交')
  } else if (method === 'PUT' && /^\/late-returns\/\d+$/.test(path)) {
    const item = state.lateReturns.find(record => record.id === Number(path.split('/').pop()))
    Object.assign(item, payload, { reviewer_id: user.id })
    addNotification(state, item.user_id, '晚归报备审批结果', `你的晚归报备已${item.status === 'approved' ? '批准' : '拒绝'}。`)
    changed = true
    response = ok(shapeLateReturn(state, item))
  } else if (method === 'DELETE' && /^\/late-returns\/\d+$/.test(path)) {
    state.lateReturns = state.lateReturns.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/mutual-aids') {
    let list = filterByStatus(state.mutualAids, url.searchParams)
    const type = url.searchParams.get('type')
    if (type) list = list.filter(item => item.type === type)
    response = ok(list.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => shapeMutualAid(state, item)))
  } else if (method === 'POST' && path === '/mutual-aids') {
    const item = { id: nextId(state, 'mutualAids'), user_id: user.id, type: payload.type || 'other', title: payload.title || '', description: payload.description || '', status: 'open', helper_id: null, created_at: new Date().toISOString() }
    state.mutualAids.unshift(item)
    changed = true
    response = ok(shapeMutualAid(state, item), '互助信息已发布')
  } else if (method === 'PUT' && /^\/mutual-aids\/\d+$/.test(path)) {
    const item = state.mutualAids.find(record => record.id === Number(path.split('/').pop()))
    if (payload.status === 'accepted' && !item.helper_id) item.helper_id = user.id
    if (payload.status) item.status = payload.status
    addNotification(state, item.user_id, '互助状态更新', `你的互助信息已更新为 ${item.status}。`)
    changed = true
    response = ok(shapeMutualAid(state, item))
  } else if (method === 'DELETE' && /^\/mutual-aids\/\d+$/.test(path)) {
    state.mutualAids = state.mutualAids.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/announcements') {
    const sorted = state.announcements.slice().sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.created_at) - new Date(a.created_at))
    response = ok(sorted.map(item => shapeAnnouncement(state, item)))
  } else if (method === 'POST' && path === '/announcements') {
    const item = { id: nextId(state, 'announcements'), title: payload.title || '', content: payload.content || '', author_id: user.id, is_pinned: Boolean(payload.is_pinned), created_at: new Date().toISOString() }
    state.announcements.unshift(item)
    state.users.filter(item => item.role === 'student').forEach(student => addNotification(state, student.id, '新公告已发布', item.title))
    changed = true
    response = ok(shapeAnnouncement(state, item), '公告已发布')
  } else if (method === 'DELETE' && /^\/announcements\/\d+$/.test(path)) {
    state.announcements = state.announcements.filter(item => item.id !== Number(path.split('/').pop()))
    changed = true
    response = ok(null, '已删除')
  } else if (method === 'GET' && path === '/notifications') {
    response = ok(state.notifications.filter(item => item.user_id === user.id).slice(0, 50))
  } else if (method === 'GET' && path === '/notifications/unread-count') {
    response = ok({ count: state.notifications.filter(item => item.user_id === user.id && !item.is_read).length })
  } else if (method === 'PUT' && /^\/notifications\/\d+\/read$/.test(path)) {
    const id = Number(path.split('/')[2])
    const item = state.notifications.find(record => record.id === id)
    if (item) item.is_read = true
    changed = true
    response = ok(item)
  } else if (method === 'PUT' && path === '/notifications/read-all') {
    state.notifications.forEach(item => {
      if (item.user_id === user.id) item.is_read = true
    })
    changed = true
    response = ok(null, '全部已读')
  } else if (method === 'GET' && path === '/statistics') {
    response = ok(buildStatistics(state))
  } else if (method === 'GET' && path === '/dashboard') {
    response = ok(buildDashboard(state))
  } else {
    response = fail(`未匹配的 mock 接口: ${method} ${path}`, 404)
  }

  if (changed) saveState(state)
  return clone(response)
}

const mockApi = {
  get(url) {
    return handleRequest('GET', url)
  },
  post(url, payload) {
    return handleRequest('POST', url, payload)
  },
  put(url, payload) {
    return handleRequest('PUT', url, payload)
  },
  delete(url) {
    return handleRequest('DELETE', url)
  }
}

export default mockApi
