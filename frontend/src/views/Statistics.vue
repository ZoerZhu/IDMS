<template>
  <div>
    <!-- Overview Cards -->
    <div class="grid-4 mb-lg">
      <div class="glass stat-card">
        <div class="stat-icon-wrap"><AppIcon name="Wrench" :size="22" /></div>
        <div>
          <div class="stat-num">{{ stats.repair?.total || 0 }}</div>
          <div class="text-sm text-secondary">报修总数</div>
        </div>
      </div>
      <div class="glass stat-card">
        <div class="stat-icon-wrap"><AppIcon name="ClipboardCheck" :size="22" /></div>
        <div>
          <div class="stat-num">{{ stats.hygiene?.avg_score || 0 }}</div>
          <div class="text-sm text-secondary">平均卫生分</div>
        </div>
      </div>
      <div class="glass stat-card">
        <div class="stat-icon-wrap danger"><AppIcon name="CircleAlert" :size="22" /></div>
        <div>
          <div class="stat-num" style="color:var(--danger)">{{ stats.power?.warnings || 0 }}</div>
          <div class="text-sm text-secondary">用电告警</div>
        </div>
      </div>
      <div class="glass stat-card">
        <div class="stat-icon-wrap"><AppIcon name="HeartHandshake" :size="22" /></div>
        <div>
          <div class="stat-num">{{ stats.mutual_aid?.total || 0 }}</div>
          <div class="text-sm text-secondary">互助信息</div>
        </div>
      </div>
    </div>

    <div class="grid-2 mb-md">
      <!-- Repair Types Chart -->
      <div class="glass chart-card">
        <h3 class="chart-title">报修类型分布</h3>
        <div class="bar-chart">
          <div v-for="item in repairTypeData" :key="item.type" class="bar-row">
            <div class="bar-label">{{ typeMap[item.type] || item.type }}</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{
                width: (item.count / maxRepairType * 100) + '%',
                background: typeColors[item.type] || 'var(--accent)'
              }"></div>
            </div>
            <div class="bar-value">{{ item.count }}</div>
          </div>
          <div v-if="!repairTypeData.length" class="text-secondary text-center" style="padding:30px">暂无数据</div>
        </div>
      </div>

      <!-- Repair Status Donut -->
      <div class="glass chart-card">
        <h3 class="chart-title">报修状态分布</h3>
        <div class="donut-wrap">
          <svg viewBox="0 0 120 120" class="donut">
            <circle v-for="(seg, i) in donutSegments" :key="i"
              cx="60" cy="60" r="45"
              fill="none" :stroke="seg.color" stroke-width="14"
              :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset"
              stroke-linecap="round" />
          </svg>
          <div class="donut-center">
            <div class="donut-total">{{ stats.repair?.total || 0 }}</div>
            <div class="text-sm text-secondary">总计</div>
          </div>
        </div>
        <div class="donut-legend">
          <div v-for="leg in donutLegend" :key="leg.label" class="legend-item">
            <span class="legend-dot" :style="{ background: leg.color }"></span>
            <span class="text-sm">{{ leg.label }}</span>
            <span class="text-sm text-secondary">{{ leg.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Visitor & Late Return Stats -->
      <div class="glass chart-card">
        <h3 class="chart-title">访客 & 晚归统计</h3>
        <div class="mini-stats">
          <div class="mini-stat">
            <div class="mini-label">访客总数</div>
            <div class="mini-value">{{ stats.visitor?.total || 0 }}</div>
            <div class="mini-sub">待审批 <span style="color:var(--warning)">{{ stats.visitor?.pending || 0 }}</span></div>
          </div>
          <div class="mini-stat">
            <div class="mini-label">晚归总数</div>
            <div class="mini-value">{{ stats.late_return?.total || 0 }}</div>
            <div class="mini-sub">待审批 <span style="color:var(--warning)">{{ stats.late_return?.pending || 0 }}</span></div>
          </div>
          <div class="mini-stat">
            <div class="mini-label">互助总数</div>
            <div class="mini-value">{{ stats.mutual_aid?.total || 0 }}</div>
            <div class="mini-sub">进行中 <span style="color:var(--info)">{{ stats.mutual_aid?.open || 0 }}</span></div>
          </div>
        </div>
      </div>

      <!-- Hygiene Distribution -->
      <div class="glass chart-card">
        <h3 class="chart-title">卫生评分分布</h3>
        <div class="score-bars">
          <div v-for="s in scoreDistribution" :key="s.label" class="score-row">
            <span class="score-label">{{ s.label }}</span>
            <div class="score-track">
              <div class="score-fill" :style="{ width: s.pct + '%', background: s.color }"></div>
            </div>
            <span class="score-count">{{ s.count }}</span>
          </div>
        </div>
        <div v-if="stats.hygiene" style="margin-top:16px;text-align:center">
          <span class="text-secondary text-sm">平均分</span>
          <span style="font-size:28px;font-weight:700;margin-left:8px" :style="{color: avgColor}">
            {{ stats.hygiene.avg_score }}
          </span>
          <span class="text-secondary text-sm"> / 10</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const stats = ref({})
const typeMap = { water: '水电', electric: '电路', furniture: '家具', network: '网络', other: '其他' }
const typeColors = {
  water: '#2868a8', electric: '#a76412', furniture: '#168a52',
  network: '#5b5f67', other: '#858b92'
}

const repairTypeData = computed(() => stats.value.repair?.types || [])
const maxRepairType = computed(() => Math.max(1, ...repairTypeData.value.map(t => t.count)))

const statusColors = { pending: '#fbbf24', processing: '#60a5fa', done: '#34d399' }
const statusLabels = { pending: '待处理', processing: '维修中', done: '已完成' }

const circumference = 2 * Math.PI * 45
const donutSegments = computed(() => {
  const r = stats.value.repair
  if (!r) return []
  const total = r.total || 1
  const vals = [
    { count: r.done, color: statusColors.done },
    { count: r.processing, color: statusColors.processing },
    { count: r.pending, color: statusColors.pending },
  ]
  let offset = 0
  return vals.map(v => {
    const pct = v.count / total
    const dash = `${pct * circumference} ${circumference}`
    const seg = { color: v.color, dash, offset: -offset }
    offset += pct * circumference
    return seg
  })
})

const donutLegend = computed(() => {
  const r = stats.value.repair
  if (!r) return []
  return [
    { label: '已完成', count: r.done, color: statusColors.done },
    { label: '维修中', count: r.processing, color: statusColors.processing },
    { label: '待处理', count: r.pending, color: statusColors.pending },
  ]
})

const scoreDistribution = computed(() => {
  const h = stats.value.hygiene
  if (!h) return []
  const levelMap = {
    excellent: { label: '优秀 (9-10)', color: '#168a52' },
    good: { label: '良好 (7-8)', color: '#2868a8' },
    average: { label: '一般 (5-6)', color: '#a76412' },
    poor: { label: '差 (1-4)', color: '#c02f36' }
  }
  const levels = h.levels?.length ? h.levels : []
  const total = Math.max(1, h.total || levels.reduce((sum, item) => sum + item.count, 0))
  return levels.map(item => ({
    label: levelMap[item.level]?.label || item.level,
    count: item.count,
    pct: Math.round((item.count / total) * 100),
    color: levelMap[item.level]?.color || '#111111'
  }))
})

const avgColor = computed(() => {
  const s = stats.value.hygiene?.avg_score || 0
  if (s >= 8) return '#34d399'
  if (s >= 6) return '#60a5fa'
  if (s >= 4) return '#fbbf24'
  return '#f87171'
})

onMounted(async () => {
  const res = await api.get('/statistics')
  if (res.code === 0) stats.value = res.data
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.stat-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(17,17,17,0.07);
}
.stat-icon-wrap.danger {
  background: rgba(192,47,54,0.1);
  color: var(--danger);
}
.stat-num { font-size: 28px; font-weight: 700; }

.chart-card { padding: 24px; }
.chart-title { font-size: 16px; font-weight: 600; margin-bottom: 20px; }

/* Bar Chart */
.bar-chart { display: flex; flex-direction: column; gap: 14px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 60px; font-size: 13px; color: var(--text-secondary); text-align: right; }
.bar-track { flex: 1; height: 8px; background: rgba(17,17,17,0.07); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
.bar-value { width: 30px; font-size: 14px; font-weight: 600; }

/* Donut */
.donut-wrap { position: relative; width: 160px; height: 160px; margin: 0 auto 20px; }
.donut { width: 100%; height: 100%; transform: rotate(-90deg); }
.donut-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.donut-total { font-size: 28px; font-weight: 700; }
.donut-legend { display: flex; justify-content: center; gap: 20px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }

/* Mini Stats */
.mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mini-stat { text-align: center; padding: 16px; background: rgba(17,17,17,0.04); border-radius: var(--radius-sm); }
.mini-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.mini-value { font-size: 28px; font-weight: 700; }
.mini-sub { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

/* Score Bars */
.score-bars { display: flex; flex-direction: column; gap: 12px; }
.score-row { display: flex; align-items: center; gap: 12px; }
.score-label { width: 90px; font-size: 13px; color: var(--text-secondary); }
.score-track { flex: 1; height: 8px; background: rgba(17,17,17,0.07); border-radius: 4px; overflow: hidden; }
.score-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
.score-count { width: 20px; font-size: 13px; font-weight: 600; }
</style>
