<template>
  <div class="page-container">

    <!-- ══ Toolbar ══════════════════════════════════════════════════════ -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">变化点中央看板</span>
        <a-date-picker
          v-model:value="selectedDate"
          :allow-clear="false"
          size="small"
          style="width: 120px; margin-left: 16px;"
          :aria-label="'选择日期'"
        />
        <a-tag v-if="isToday" color="processing" style="margin-left: 8px; border-radius: 20px;">今日</a-tag>
      </div>
      <a-space>
        <a-button @click="handleRefresh" :loading="refreshing">
          <template #icon><ReloadOutlined /></template>刷新
        </a-button>
        <a-button @click="goToList">
          <template #icon><UnorderedListOutlined /></template>全部台账
        </a-button>
        <a-button type="primary" @click="goToCreate">
          <template #icon><PlusOutlined /></template>新增变化点申报
        </a-button>
      </a-space>
    </div>

    <!-- ══ 第一行：KPI 状态条（六宫格，信号灯看板核心）═══════════════ -->
    <div class="kpi-strip">
      <button
        v-for="kpi in kpiCards"
        :key="kpi.key"
        class="kpi-card"
        :class="[`kpi-card--${kpi.colorKey}`, kpi.active ? 'kpi-card--active' : '']"
        @click="kpi.onClick"
        :aria-label="`${kpi.label}：${kpi.value} 件，点击查看`"
      >
        <div class="kpi-card__icon" aria-hidden="true">{{ kpi.icon }}</div>
        <div class="kpi-card__value">
          {{ kpi.value }}
          <span v-if="kpi.trend !== undefined" class="kpi-card__trend" :class="kpi.trend > 0 ? 'kpi-card__trend--up' : 'kpi-card__trend--down'">
            {{ kpi.trend > 0 ? '↑' : '↓' }}{{ Math.abs(kpi.trend) }}
          </span>
        </div>
        <div class="kpi-card__label">{{ kpi.label }}</div>
      </button>
    </div>

    <!-- ══ 第二行：紧急处理收件箱 + 活跃变化点主表格 ═══════════════════ -->
    <!-- 紧急处理区（待审批/验证超时/MES 盲动）仅在有紧急项时显示 -->
    <div v-if="urgentItems.length > 0" class="urgent-inbox">
      <div class="urgent-inbox__header">
        <span class="urgent-inbox__title">
          <span class="urgent-pulse" aria-hidden="true"></span>
          需要立即处理
        </span>
        <a-badge :count="urgentItems.length" :number-style="{ backgroundColor: '#ff4d4f' }" />
      </div>
      <div class="urgent-inbox__list">
        <div
          v-for="item in urgentItems"
          :key="item.id"
          class="urgent-item"
          :class="`urgent-item--${item.level}`"
          @click="item.action"
          role="button"
          :tabindex="0"
          :aria-label="`${item.label}：${item.title}，点击立即处理`"
          @keydown.enter="item.action"
          @keydown.space.prevent="item.action"
        >
          <span class="urgent-item__badge" aria-hidden="true">{{ item.badgeText }}</span>
          <div class="urgent-item__body">
            <span class="urgent-item__no">{{ item.recordNo }}</span>
            <span class="urgent-item__title">{{ item.title }}</span>
          </div>
          <span class="urgent-item__action-label">{{ item.actionLabel }} →</span>
        </div>
      </div>
    </div>

    <!-- ══ 第三行：主区域（活跃表格 + 右侧图表）══════════════════════ -->
    <a-row :gutter="16" style="margin-bottom: 16px;">

      <!-- 活跃变化点大表格 -->
      <a-col :span="15">
        <div class="panel-card">
          <div class="panel-card__header">
            <span class="panel-card__title">🔥 当日活跃变化点</span>
            <a-badge :count="activeChangePoints.length" :number-style="{ backgroundColor: '#1890ff' }" />
          </div>
          <a-table
            :columns="activeColumns"
            :data-source="activeChangePoints"
            :pagination="false"
            size="middle"
            row-key="id"
            :scroll="{ y: 340, x: 800 }"
          >
            <template #bodyCell="{ column, record }">
              <!-- 单号 -->
              <template v-if="column.key === 'recordNo'">
                <button class="record-no-btn" @click="goToDetail(record.id)" :aria-label="`查看 ${record.recordNo} 详情`">
                  {{ record.recordNo }}
                </button>
              </template>
              <!-- 变化分类 -->
              <template v-else-if="column.key === 'changeType'">
                <div class="type-pill" :style="{ background: typeColorBg[record.changeDetail.changeType as ChangePointType], color: typeColor[record.changeDetail.changeType as ChangePointType] }">
                  {{ typeIconMap[record.changeDetail.changeType as ChangePointType] }} {{ typeShortMap[record.changeDetail.changeType as ChangePointType] }}
                </div>
              </template>
              <!-- 风险 -->
              <template v-else-if="column.key === 'riskLevel'">
                <div class="risk-dot-label">
                  <span class="risk-dot" :class="`risk-dot--${record.riskLevel}`" aria-hidden="true"></span>
                  {{ riskLabelMap[record.riskLevel as RiskLevel] }}
                </div>
              </template>
              <!-- 状态 -->
              <template v-else-if="column.key === 'status'">
                <div class="status-label-wrap">
                  <a-badge :status="statusBadgeMap[record.status as ChangePointStatus]" />
                  <span>{{ statusLabelMap[record.status as ChangePointStatus] }}</span>
                  <a-tag v-if="record.status === 'locked'" color="error" class="mes-lock-tag">🔒 MES</a-tag>
                </div>
              </template>
              <!-- 操作 -->
              <template v-else-if="column.key === 'action'">
                <a-space size="small">
                  <a-button type="link" size="small" @click="goToDetail(record.id)">查看</a-button>
                  <a-button v-if="record.status === 'approving'" type="link" size="small" class="action-btn--warn" @click="handleApprove(record)">审批</a-button>
                  <a-button v-if="record.status === 'locked' || record.status === 'verifying'" type="link" size="small" @click="goToVerification(record.id)">验证</a-button>
                </a-space>
              </template>
              <!-- 时间 -->
              <template v-else-if="column.key === 'reportTime'">
                <span class="time-text">{{ formatTime(record.reportTime) }}</span>
              </template>
            </template>
          </a-table>
        </div>
      </a-col>

      <!-- 右侧：图表 + 快捷操作 -->
      <a-col :span="9">
        <!-- 4M1E 分布饼图 -->
        <div class="panel-card" style="margin-bottom: 16px;">
          <div class="panel-card__header">
            <span class="panel-card__title">📊 4M1E 分布（本月）</span>
          </div>
          <v-chart class="chart" :option="typeChartOption" autoresize :aria-label="'本月4M1E变化点类型分布饼图'" />
        </div>

        <!-- 快捷导航 2×2 宫格 -->
        <div class="panel-card">
          <div class="panel-card__header">
            <span class="panel-card__title">⚡ 快捷入口</span>
          </div>
          <div class="quick-nav-grid">
            <button
              v-for="nav in quickNavs"
              :key="nav.key"
              class="quick-nav-item"
              @click="nav.action"
              :aria-label="nav.label"
            >
              <span class="quick-nav-item__icon" aria-hidden="true">{{ nav.icon }}</span>
              <span class="quick-nav-item__label">{{ nav.label }}</span>
              <span v-if="nav.badge" class="quick-nav-item__badge">{{ nav.badge }}</span>
            </button>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- ══ 第四行：趋势图 + 预警列表 + 月度数据 ══════════════════════ -->
    <a-row :gutter="16">

      <!-- 趋势折线图（更宽） -->
      <a-col :span="12">
        <div class="panel-card">
          <div class="panel-card__header">
            <span class="panel-card__title">📈 近 7 天变化点趋势</span>
          </div>
          <v-chart class="chart chart--tall" :option="riskTrendOption" autoresize :aria-label="'近7天风险变化点趋势堆叠柱图'" />
        </div>
      </a-col>

      <!-- 预警收件箱 -->
      <a-col :span="7">
        <div class="panel-card">
          <div class="panel-card__header">
            <span class="panel-card__title">⚠️ 实时预警</span>
            <a-badge :count="unreadAlerts" style="cursor: default;" />
          </div>
          <div class="alert-feed" role="list" aria-label="实时预警列表">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="alert-feed-item"
              :class="[`alert-feed-item--${alert.severity}`, { 'alert-feed-item--unread': !alert.isRead }]"
              role="listitem"
              @click="markAlertRead(alert)"
            >
              <div class="alert-feed-item__top">
                <span class="alert-severity-dot" :class="`alert-severity-dot--${alert.severity}`" aria-hidden="true"></span>
                <span class="alert-record-no">{{ alert.recordNo }}</span>
                <span class="alert-type-tag">{{ alert.alertType === 'blind_move' ? '🚨 盲动报工' : '⏰ 验证超时' }}</span>
                <span class="alert-time">{{ formatTime(alert.triggerTime) }}</span>
              </div>
              <p class="alert-feed-item__msg">{{ alert.message }}</p>
              <div v-if="!alert.isRead" class="alert-feed-item__unread-dot" aria-label="未读"></div>
            </div>
            <div v-if="alerts.length === 0" class="alert-empty">
              <span>🎉 暂无预警，一切正常</span>
            </div>
          </div>
        </div>
      </a-col>

      <!-- 月度汇总数据 -->
      <a-col :span="5">
        <div class="panel-card" style="height: 100%;">
          <div class="panel-card__header">
            <span class="panel-card__title">📅 本月累计</span>
          </div>
          <div class="monthly-stats">
            <div v-for="ms in monthlyStats" :key="ms.label" class="monthly-stat-item">
              <div class="monthly-stat-item__value" :style="{ color: ms.color }">{{ ms.value }}</div>
              <div class="monthly-stat-item__label">{{ ms.label }}</div>
              <div class="monthly-stat-item__bar">
                <div class="monthly-stat-item__bar-fill" :style="{ width: `${ms.rate}%`, background: ms.color }" :aria-valuenow="ms.value"></div>
              </div>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { PlusOutlined, UnorderedListOutlined, ReloadOutlined } from '@ant-design/icons-vue'
  import { message } from 'ant-design-vue'
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { PieChart, BarChart, LineChart } from 'echarts/charts'
  import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
  import VChart from 'vue-echarts'
  import dayjs from 'dayjs'
  import type { ChangePointRecord, AlertRecord, ChangePointStatus, RiskLevel, ChangePointType } from '@/types/change-point'
  import { STATUS_CONFIG } from '@/types/change-point'

  use([CanvasRenderer, PieChart, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent])

  const router = useRouter()
  const selectedDate = ref(dayjs())
  const refreshing = ref(false)

  const isToday = computed(() => selectedDate.value.isSame(dayjs(), 'day'))

  // ── 颜色映射 ────────────────────────────────────────────────────────────
  const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }

  const typeIconMap: Record<ChangePointType, string> = {
    man: '👷', machine: '🏭', material: '📦', method: '📋', environment: '🌡️', measure: '📐', other: '📝'
  }
  const typeShortMap: Record<ChangePointType, string> = {
    man: '人', machine: '机', material: '料', method: '法', environment: '环', measure: '测', other: '其他'
  }
  const typeColor: Record<ChangePointType, string> = {
    man: '#1677ff', machine: '#531dab', material: '#d46b08', method: '#08979c', environment: '#389e0d', measure: '#c41d7f', other: '#8c8c8c'
  }
  const typeColorBg: Record<ChangePointType, string> = {
    man: '#e6f4ff', machine: '#efdbff', material: '#fff7e6', method: '#e6fffb', environment: '#f6ffed', measure: '#fff0f6', other: '#f5f5f5'
  }
  const statusBadgeMap: Record<ChangePointStatus, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
    draft: 'default', submitted: 'processing', approving: 'warning', approved: 'processing',
    locked: 'error', verifying: 'warning', released: 'success', rejected: 'error', closed: 'default'
  }
  const statusLabelMap = Object.fromEntries(Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])) as Record<ChangePointStatus, string>

  // ── Mock 数据 ─────────────────────────────────────────────────────────
  const activeChangePoints = ref<ChangePointRecord[]>([
    { id: '1', recordNo: 'CPR-20240305-001', title: '关键机台 #MC-02 大修更换模具', reporter: { id: 'u1', name: '张三', department: '生产部', team: 'A班' }, reportTime: '2024-03-05T08:30:00', changeDetail: { changeType: 'machine', changeSubType: '大修', changeDescription: '', affectedMachine: 'MC-02' }, riskLevel: 'high', status: 'locked', mesLockTime: '2024-03-05T09:00:00', createTime: '2024-03-05T08:30:00', updateTime: '2024-03-05T09:00:00' },
    { id: '2', recordNo: 'CPR-20240305-002', title: '核心原料供应商切换 - 铝锭', reporter: { id: 'u2', name: '李四', department: '品质部' }, reportTime: '2024-03-05T09:15:00', changeDetail: { changeType: 'material', changeSubType: '变更', changeDescription: '' }, riskLevel: 'high', status: 'approving', createTime: '2024-03-05T09:15:00', updateTime: '2024-03-05T09:15:00' },
    { id: '3', recordNo: 'CPR-20240305-003', title: '新普工上岗 - 压铸工序 2 人', reporter: { id: 'u3', name: '王五', department: '生产部', team: 'B班' }, reportTime: '2024-03-05T10:00:00', changeDetail: { changeType: 'man', changeSubType: '新员工', changeDescription: '' }, riskLevel: 'low', status: 'released', createTime: '2024-03-05T10:00:00', updateTime: '2024-03-05T10:05:00' },
    { id: '4', recordNo: 'CPR-20240305-004', title: 'IPQC 检具更换 - 卡尺校准换新', reporter: { id: 'u4', name: '赵六', department: '品质部' }, reportTime: '2024-03-05T11:00:00', changeDetail: { changeType: 'measure', changeSubType: '更换', changeDescription: '' }, riskLevel: 'medium', status: 'verifying', createTime: '2024-03-05T11:00:00', updateTime: '2024-03-05T11:30:00' },
    { id: '5', recordNo: 'CPR-20240305-005', title: '工艺参数调整 - 压铸温度窗口扩宽', reporter: { id: 'u5', name: '孙七', department: '技术部' }, reportTime: '2024-03-05T13:00:00', changeDetail: { changeType: 'method', changeSubType: '调整', changeDescription: '' }, riskLevel: 'medium', status: 'approved', createTime: '2024-03-05T13:00:00', updateTime: '2024-03-05T14:00:00' },
  ])

  const alerts = ref<AlertRecord[]>([
    { id: 'a1', changePointId: '1', recordNo: 'CPR-20240305-001', alertType: 'blind_move', severity: 'red', message: 'MC-02 已锁定，MES 检测到违规批量报工！请立即核查原因。', triggerTime: '2024-03-05T11:45:00', notifiedUsers: ['生产总监', '品质总监'], isRead: false },
    { id: 'a2', changePointId: '4', recordNo: 'CPR-20240305-004', alertType: 'verification_timeout', severity: 'orange', message: '已锁机超过 4 小时，试生产验证尚未完成，请及时推进。', triggerTime: '2024-03-05T15:00:00', notifiedUsers: ['QE王强', '生产主管'], isRead: false },
  ])

  const unreadAlerts = computed(() => alerts.value.filter(a => !a.isRead).length)

  // ── KPI 状态卡 ──────────────────────────────────────────────────────
  const kpiCards = computed(() => [
    { key: 'total',     icon: '📋', label: '今日提报',   value: 8,  colorKey: 'neutral',  trend: 2,         onClick: () => goToList() },
    { key: 'locked',    icon: '🔒', label: '当前锁机',   value: 2,  colorKey: 'danger',   trend: 1,         onClick: () => filterByStatus('locked'),    active: activeChangePoints.value.some(r => r.status === 'locked') },
    { key: 'approving', icon: '⏳', label: '待我审批',   value: 1,  colorKey: 'warning',  trend: undefined, onClick: () => filterByStatus('approving'), active: activeChangePoints.value.some(r => r.status === 'approving') },
    { key: 'verifying', icon: '🔬', label: '验证进行中', value: 3,  colorKey: 'info',     trend: undefined, onClick: () => filterByStatus('verifying') },
    { key: 'released',  icon: '✅', label: '今日放行',   value: 5,  colorKey: 'success',  trend: -1,        onClick: () => filterByStatus('released') },
    { key: 'alert',     icon: '⚠️', label: '紧急预警',   value: unreadAlerts.value, colorKey: unreadAlerts.value > 0 ? 'red' : 'neutral', trend: undefined, onClick: () => {} },
  ])

  // ── 紧急处理收件箱 ──────────────────────────────────────────────────
  const urgentItems = computed(() => {
    const items: any[] = []
    activeChangePoints.value.forEach(r => {
      if (r.status === 'approving') {
        items.push({ id: r.id, level: 'warning', recordNo: r.recordNo, title: r.title, badgeText: '待审批', actionLabel: '立即审批', action: () => goToDetail(r.id) })
      }
      if (r.status === 'locked') {
        items.push({ id: `v-${r.id}`, level: 'danger', recordNo: r.recordNo, title: r.title, badgeText: '🔒 MES锁机中', actionLabel: '前往验证', action: () => goToVerification(r.id) })
      }
    })
    alerts.value.filter(a => !a.isRead && a.severity === 'red').forEach(a => {
      items.push({ id: `a-${a.id}`, level: 'critical', recordNo: a.recordNo, title: a.message, badgeText: '🚨 Ding预警', actionLabel: '查看详情', action: () => markAlertRead(a) })
    })
    return items
  })

  // ── 表格列 ──────────────────────────────────────────────────────────
  const activeColumns = [
    { title: '单号', key: 'recordNo', width: 165 },
    { title: '变化标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '分类', key: 'changeType', width: 72 },
    { title: '风险', key: 'riskLevel', width: 80 },
    { title: '状态', key: 'status', width: 140 },
    { title: '提报', key: 'reportTime', width: 90 },
    { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
  ]

  // ── 快捷入口 ────────────────────────────────────────────────────────
  const quickNavs = [
    { key: 'create',       icon: '📝', label: '提交申报', badge: undefined, action: () => goToCreate() },
    { key: 'approval',     icon: '✍️', label: '待我审批', badge: 1,         action: () => filterByStatus('approving') },
    { key: 'verification', icon: '🔬', label: '验证任务', badge: 3,         action: () => router.push('/production-quality/change-point/verification') },
    { key: 'config',       icon: '⚙️', label: '规则配置', badge: undefined, action: () => router.push('/production-quality/change-point/risk-matrix') },
  ]

  // ── 本月汇总 ──────────────────────────────────────────────────────
  const monthlyStats = [
    { label: '总提报数',   value: 42, color: '#1677ff', rate: 100 },
    { label: '高风险拦截', value: 6,  color: '#ff4d4f', rate: Math.round(6 / 42 * 100) },
    { label: '成功闭环',   value: 35, color: '#52c41a', rate: Math.round(35 / 42 * 100) },
    { label: '验证通过率', value: '97%', color: '#13c2c2', rate: 97 },
  ]

  // ── 图表配置 ─────────────────────────────────────────────────────────
  const typeChartOption = computed(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'middle', textStyle: { fontSize: 11, color: '#595959' } },
    color: ['#531dab', '#1677ff', '#d46b08', '#08979c', '#389e0d', '#c41d7f'],
    series: [{
      type: 'pie', radius: ['42%', '65%'], center: ['36%', '50%'],
      label: { show: false },
      itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
      data: [
        { name: '机(Machine)', value: 12 }, { name: '人(Man)', value: 8 },
        { name: '料(Material)', value: 7 }, { name: '法(Method)', value: 6 },
        { name: '测(Measure)', value: 4 }, { name: '环(Env)', value: 3 }
      ],
    }],
  }))

  const riskTrendOption = computed(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['高风险', '中风险', '低风险'], top: 4, textStyle: { fontSize: 11, color: '#595959' } },
    grid: { left: 36, right: 16, bottom: 24, top: 36 },
    xAxis: {
      type: 'category',
      data: ['02-27', '02-28', '03-01', '03-02', '03-03', '03-04', '03-05'],
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisLabel: { color: '#8c8c8c', fontSize: 11 },
    },
    yAxis: {
      type: 'value', minInterval: 1,
      splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
      axisLabel: { color: '#8c8c8c', fontSize: 11 },
    },
    series: [
      { name: '高风险', type: 'bar', stack: 'risk', color: '#ff4d4f', barWidth: '44%', data: [1, 0, 2, 1, 0, 1, 2], itemStyle: { borderRadius: [0, 0, 0, 0] } },
      { name: '中风险', type: 'bar', stack: 'risk', color: '#faad14', data: [2, 3, 1, 2, 4, 2, 3] },
      { name: '低风险', type: 'bar', stack: 'risk', color: '#95de64', data: [3, 2, 4, 3, 2, 3, 3], itemStyle: { borderRadius: [3, 3, 0, 0] } },
    ],
  }))

  // ── 操作方法 ─────────────────────────────────────────────────────────
  const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')
  const goToList = () => router.push('/production-quality/change-point/list')
  const goToCreate = () => router.push('/production-quality/change-point/list/create')
  const goToDetail = (id: string) => router.push('/production-quality/change-point/list/view/' + id)
  const goToVerification = (id: string) => router.push('/production-quality/change-point/verification?changePointId=' + id)
  const filterByStatus = (status: string) => router.push('/production-quality/change-point/list?status=' + status)
  const handleApprove = (item: ChangePointRecord) => goToDetail(item.id)
  const markAlertRead = (alert: AlertRecord) => { alert.isRead = true; message.success('预警已标为已读') }
  const handleRefresh = () => { refreshing.value = true; setTimeout(() => { refreshing.value = false; message.success('数据已刷新') }, 800) }

  onMounted(() => {})
</script>

<style scoped>
  /* ── 基础 ────────────────────────────────────────────────────────────── */
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  /* ── Toolbar ─────────────────────────────────────────────────────────── */
  .toolbar {
    background: #fff;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .toolbar-left { display: flex; align-items: center; }
  .toolbar-title { font-size: 17px; font-weight: 700; color: #1a1a1a; }

  /* ── KPI Strip（六宫格状态条）─────────────────────────────────────── */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .kpi-card {
    /* Reset button */
    appearance: none;
    border: none;
    font-family: inherit;
    text-align: left;
    /* Layout */
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    background: #fff;
    border: 1.5px solid transparent;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
    touch-action: manipulation;
  }
  .kpi-card:hover { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
  .kpi-card:active { transform: translateY(0); }
  .kpi-card:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; }

  /* Color variants */
  .kpi-card--neutral  { border-color: #e8e8e8; }
  .kpi-card--danger   { border-color: #ffc0c0; background: linear-gradient(135deg, #fff 60%, #fff2f0); }
  .kpi-card--warning  { border-color: #ffd591; background: linear-gradient(135deg, #fff 60%, #fffbe6); }
  .kpi-card--info     { border-color: #bae0ff; background: linear-gradient(135deg, #fff 60%, #e6f4ff); }
  .kpi-card--success  { border-color: #b7eb8f; background: linear-gradient(135deg, #fff 60%, #f6ffed); }
  .kpi-card--red      { border-color: #ff4d4f; background: linear-gradient(135deg, #fff2f0 0%, #fff 70%); }

  .kpi-card--active { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }

  .kpi-card__icon { font-size: 22px; line-height: 1; }
  .kpi-card__value {
    font-size: 30px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: #1a1a1a;
    line-height: 1.1;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .kpi-card__trend { font-size: 12px; font-weight: 600; }
  .kpi-card__trend--up   { color: #ff4d4f; }
  .kpi-card__trend--down { color: #52c41a; }
  .kpi-card__label { font-size: 12px; color: #8c8c8c; margin-top: 2px; }

  /* ── 紧急处理收件箱 ──────────────────────────────────────────────── */
  .urgent-inbox {
    background: #fff;
    border-radius: 8px;
    border: 1.5px solid #ff4d4f;
    padding: 12px 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.12);
  }
  .urgent-inbox__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .urgent-inbox__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 14px;
    color: #cf1322;
  }
  .urgent-pulse {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #ff4d4f;
    animation: pulse 1.4s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .urgent-pulse { animation: none; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.4); }
  }

  .urgent-inbox__list { display: flex; flex-direction: column; gap: 6px; }

  .urgent-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
    touch-action: manipulation;
  }
  .urgent-item:hover    { background: #fafafa; }
  .urgent-item:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; border-radius: 6px; }
  .urgent-item--warning  { background: #fffbe6; }
  .urgent-item--danger   { background: #fff2f0; }
  .urgent-item--critical { background: #fff2f0; border: 1px dashed #ff4d4f; }
  .urgent-item--warning:hover  { background: #fff7cc; }
  .urgent-item--danger:hover   { background: #ffe4e4; }

  .urgent-item__badge {
    font-size: 11px; font-weight: 700; border-radius: 4px;
    padding: 2px 8px; white-space: nowrap;
    background: #ff4d4f; color: #fff;
  }
  .urgent-item--warning .urgent-item__badge { background: #fa8c16; }
  .urgent-item__body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
  .urgent-item__no { font-family: 'Consolas', 'Menlo', monospace; font-size: 12px; font-weight: 600; color: #595959; white-space: nowrap; }
  .urgent-item__title { font-size: 13px; color: #262626; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .urgent-item__action-label { font-size: 12px; font-weight: 600; color: #1677ff; white-space: nowrap; flex-shrink: 0; }

  /* ── 通用面板卡片 ─────────────────────────────────────────────────── */
  .panel-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  .panel-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f5f5f5;
  }
  .panel-card__title { font-size: 14px; font-weight: 700; color: #1a1a1a; }

  /* ── 表格相关 ─────────────────────────────────────────────────────── */
  .record-no-btn {
    appearance: none; border: none; padding: 0; background: transparent;
    font-family: 'Monaco', 'Consolas', 'Menlo', monospace;
    font-size: 13px; font-weight: 600; color: #1677ff;
    cursor: pointer; touch-action: manipulation;
  }
  .record-no-btn:hover { text-decoration: underline; color: #4096ff; }
  .record-no-btn:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; border-radius: 2px; }

  .type-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .risk-dot-label { display: flex; align-items: center; gap: 6px; font-size: 12px; }
  .risk-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .risk-dot--high   { background: #ff4d4f; box-shadow: 0 0 0 2px rgba(255,77,79,0.2); }
  .risk-dot--medium { background: #faad14; box-shadow: 0 0 0 2px rgba(250,173,20,0.2); }
  .risk-dot--low    { background: #52c41a; }

  .status-label-wrap { display: flex; align-items: center; gap: 4px; font-size: 13px; }
  .mes-lock-tag { font-size: 11px; padding: 0 4px; line-height: 18px; margin-left: 2px; }

  .action-btn--warn { color: #fa8c16 !important; }
  .time-text { font-variant-numeric: tabular-nums; font-size: 12px; color: #8c8c8c; }

  /* ── 图表 ─────────────────────────────────────────────────────────── */
  .chart { height: 180px; }
  .chart--tall { height: 210px; }

  /* ── 快捷入口 2×2 ────────────────────────────────────────────────── */
  .quick-nav-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .quick-nav-item {
    appearance: none; border: 1.5px solid #e8e8e8; background: #fafafa;
    border-radius: 8px; padding: 14px 10px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    position: relative;
    transition: border-color 0.18s, background 0.18s, transform 0.15s;
    touch-action: manipulation;
    font-family: inherit;
  }
  .quick-nav-item:hover { border-color: #1677ff; background: #e6f4ff; transform: translateY(-1px); }
  .quick-nav-item:active { transform: translateY(0); }
  .quick-nav-item:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; }
  .quick-nav-item__icon { font-size: 22px; }
  .quick-nav-item__label { font-size: 13px; font-weight: 600; color: #262626; }
  .quick-nav-item__badge {
    position: absolute; top: 6px; right: 8px;
    background: #ff4d4f; color: #fff;
    font-size: 11px; font-weight: 700;
    min-width: 18px; height: 18px;
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    padding: 0 4px; font-variant-numeric: tabular-nums;
  }

  /* ── 预警动态流 ──────────────────────────────────────────────────── */
  .alert-feed {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 220px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .alert-feed::-webkit-scrollbar { width: 4px; }
  .alert-feed::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 2px; }

  .alert-feed-item {
    border-radius: 8px;
    padding: 10px 12px;
    border: 1px solid transparent;
    cursor: pointer;
    position: relative;
    transition: background 0.15s;
  }
  .alert-feed-item--red    { background: #fff2f0; border-color: #ffc0c0; }
  .alert-feed-item--orange { background: #fffbe6; border-color: #ffd591; }
  .alert-feed-item:hover { filter: brightness(0.97); }

  .alert-feed-item__top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }
  .alert-severity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .alert-severity-dot--red    { background: #ff4d4f; }
  .alert-severity-dot--orange { background: #fa8c16; }

  .alert-record-no { font-family: 'Consolas', 'Menlo', monospace; font-size: 12px; font-weight: 600; color: #595959; }
  .alert-type-tag { font-size: 11px; font-weight: 700; color: #434343; }
  .alert-time { font-size: 11px; color: #8c8c8c; margin-left: auto; font-variant-numeric: tabular-nums; }
  .alert-feed-item__msg { font-size: 12px; color: #434343; line-height: 1.5; margin: 0; }
  .alert-feed-item__unread-dot {
    position: absolute; top: 10px; right: 10px;
    width: 7px; height: 7px; border-radius: 50%; background: #ff4d4f;
  }
  .alert-empty { text-align: center; color: #8c8c8c; font-size: 13px; padding: 24px 0; }

  /* ── 月度汇总 ─────────────────────────────────────────────────────── */
  .monthly-stats { display: flex; flex-direction: column; gap: 16px; }
  .monthly-stat-item {}
  .monthly-stat-item__value {
    font-size: 24px; font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1; margin-bottom: 2px;
  }
  .monthly-stat-item__label { font-size: 12px; color: #8c8c8c; margin-bottom: 6px; }
  .monthly-stat-item__bar {
    height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;
  }
  .monthly-stat-item__bar-fill {
    height: 100%; border-radius: 2px;
    transition: width 0.6s ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .monthly-stat-item__bar-fill { transition: none; }
  }
</style>