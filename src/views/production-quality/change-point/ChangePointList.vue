<template>
  <div class="page-container">

    <!-- ══ Toolbar ══════════════════════════════════════════════════════ -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 状态快速切换 Tab -->
        <div class="status-tabs" role="tablist" aria-label="按状态筛选">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            class="status-tab"
            :class="{ 'status-tab--active': searchForm.status === tab.value }"
            role="tab"
            :aria-selected="searchForm.status === tab.value"
            @click="switchStatusTab(tab.value)"
          >
            {{ tab.label }}
            <span v-if="tab.count > 0" class="status-tab__badge">{{ tab.count }}</span>
          </button>
        </div>
      </div>
      <a-space>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>导出台账
        </a-button>
        <a-button @click="handleRefresh" :loading="loading">
          <template #icon><ReloadOutlined /></template>刷新
        </a-button>
        <a-button type="primary" @click="handleAdd" id="btn-add-change-point">
          <template #icon><PlusOutlined /></template>新增申报
        </a-button>
      </a-space>
    </div>

    <!-- ══ 搜索栏（收缩式）══════════════════════════════════════════════ -->
    <a-card :bordered="false" class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="单号 / 标题">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="搜索单号或标题…"
            style="width: 200px"
            allow-clear
            autocomplete="off"
            :spellcheck="false"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="变化类型">
          <a-select v-model:value="searchForm.changeType" placeholder="全部类型" allow-clear style="width: 140px" :options="changeTypeOptions" />
        </a-form-item>
        <a-form-item label="风险等级">
          <a-select v-model:value="searchForm.riskLevel" placeholder="全部等级" allow-clear style="width: 120px"
            :options="[{ value: 'low', label: '低风险' }, { value: 'medium', label: '中风险' }, { value: 'high', label: '高风险' }]" />
        </a-form-item>
        <a-form-item label="提报时间">
          <a-range-picker v-model:value="searchForm.dateRange" style="width: 240px" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetSearch">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ══ 数据表格 ══════════════════════════════════════════════════════ -->
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="{ total: filteredData.length, pageSize: 20, showTotal: (t: number) => `共 ${t} 条记录`, showSizeChanger: false }"
        :scroll="{ x: 1300 }"
        row-key="id"
        size="middle"
        :row-class-name="rowClassName"
      >
        <template #bodyCell="{ column, record }">

          <!-- 单号 -->
          <template v-if="column.key === 'recordNo'">
            <button class="record-no-btn" @click="viewRecord(record)" :aria-label="`查看 ${record.recordNo} 详情`">
              {{ record.recordNo }}
            </button>
          </template>

          <!-- 变化类型 Pill -->
          <template v-else-if="column.key === 'changeType'">
            <span
              class="type-pill"
              :style="{ background: typeColorBg[record.changeDetail.changeType as ChangePointType], color: typeColor[record.changeDetail.changeType as ChangePointType] }"
            >
              {{ typeIconMap[record.changeDetail.changeType as ChangePointType] }}
              {{ typeLabelMap[record.changeDetail.changeType as ChangePointType] }}
            </span>
          </template>

          <!-- 风险等级 -->
          <template v-else-if="column.key === 'riskLevel'">
            <div class="risk-dot-cell">
              <span class="risk-dot" :class="`risk-dot--${record.riskLevel}`" aria-hidden="true"></span>
              {{ riskLabelMap[record.riskLevel as RiskLevel] }}
            </div>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <div class="status-cell">
              <a-badge :status="statusBadgeMap[record.status as ChangePointStatus]" />
              <span>{{ statusConfig[record.status as ChangePointStatus].label }}</span>
              <span v-if="record.status === 'locked'" class="mes-lock-chip" aria-label="MES已锁机">🔒</span>
            </div>
          </template>

          <!-- 提报时间 -->
          <template v-else-if="column.key === 'reportTime'">
            <span class="time-text">{{ formatDate(record.reportTime) }}</span>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space size="small">
              <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
              <a-button
                type="link" size="small"
                :disabled="!['draft', 'submitted', 'rejected'].includes(record.status)"
                @click="editRecord(record)"
              >编辑</a-button>
              <a-button
                v-if="record.status === 'approving'"
                type="link" size="small"
                class="action-link--warn"
                @click="openApproveModal(record)"
              >审批</a-button>
              <a-button
                v-if="['locked', 'verifying'].includes(record.status)"
                type="link" size="small"
                @click="goToVerification(record)"
              >验证</a-button>
              <a-popconfirm
                title="确定删除该申报单吗？此操作不可撤销。"
                ok-text="确定删除"
                cancel-text="取消"
                ok-type="danger"
                placement="topRight"
                @confirm="handleDelete(record.id)"
              >
                <a-button
                  type="link" size="small" danger
                  :disabled="!['draft', 'rejected'].includes(record.status)"
                >删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>

        </template>

        <template #emptyText>
          <a-empty description="暂无变化点申报记录" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </template>
      </a-table>
    </div>

    <!-- ══ 审批决策弹窗 ══════════════════════════════════════════════════ -->
    <a-modal
      v-model:open="approveModalVisible"
      title="变化点审批决策"
      width="580px"
      ok-text="提交审批"
      cancel-text="取消"
      @ok="submitApproval"
      :destroy-on-close="true"
    >
      <div class="approve-modal-body">
        <!-- 被审批单概要 -->
        <div class="approve-target-card">
          <div class="approve-target-no">{{ currentRecord?.recordNo }}</div>
          <div class="approve-target-title">{{ currentRecord?.title }}</div>
          <div class="approve-target-meta">
            <span class="risk-dot" :class="`risk-dot--${currentRecord?.riskLevel}`" aria-hidden="true"></span>
            {{ riskLabelMap[currentRecord?.riskLevel as RiskLevel] }}
            <a-divider type="vertical" />
            提报人：{{ currentRecord?.reporter.name }} · {{ currentRecord?.reporter.department }}
          </div>
        </div>

        <a-form :model="approveForm" layout="vertical">
          <a-form-item label="审批结果" required>
            <div class="approve-radio-group">
              <label class="approve-radio-option" :class="{ 'approve-radio-option--approve': approveForm.result === 'approved' }">
                <input type="radio" v-model="approveForm.result" value="approved" style="display:none">
                <span class="approve-radio-icon">✅</span>
                <div>
                  <div class="approve-radio-title">批准通过</div>
                  <div class="approve-radio-hint">{{ currentRecord && ['medium', 'high'].includes(currentRecord.riskLevel) ? '将自动触发 MES 锁机，并生成试生产验证任务' : '低风险，批准后直接放行' }}</div>
                </div>
              </label>
              <label class="approve-radio-option" :class="{ 'approve-radio-option--reject': approveForm.result === 'rejected' }">
                <input type="radio" v-model="approveForm.result" value="rejected" style="display:none">
                <span class="approve-radio-icon">❌</span>
                <div>
                  <div class="approve-radio-title">驳回申报</div>
                  <div class="approve-radio-hint">申报人可修改后重新提交</div>
                </div>
              </label>
            </div>
          </a-form-item>
          <a-form-item label="审批意见">
            <a-textarea
              v-model:value="approveForm.comment"
              :rows="3"
              placeholder="请填写审批意见或驳回原因…"
              autocomplete="off"
              :spellcheck="false"
            />
          </a-form-item>
          <a-alert
            v-if="approveForm.result === 'approved' && currentRecord && ['medium', 'high'].includes(currentRecord.riskLevel)"
            type="warning"
            show-icon
            message="注意：批准后系统将自动向 MES 发送锁机指令，请在确认机台编号无误后再提交。"
          />
        </a-form>
      </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { PlusOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons-vue'
  import { message, Empty } from 'ant-design-vue'
  import dayjs from 'dayjs'
  import type { ChangePointRecord, ChangePointStatus, RiskLevel, ChangePointType } from '@/types/change-point'
  import { STATUS_CONFIG, CHANGE_TYPE_OPTIONS } from '@/types/change-point'

  const router = useRouter()
  const route = useRoute()
  const statusConfig = STATUS_CONFIG

  // ── 颜色 / 标签映射 ──────────────────────────────────────────────────
  const typeIconMap: Record<ChangePointType, string> = { man: '👷', machine: '🏭', material: '📦', method: '📋', environment: '🌡️', measure: '📐', other: '📝' }
  const typeLabelMap: Record<ChangePointType, string> = { man: '人', machine: '机', material: '料', method: '法', environment: '环', measure: '测', other: '其他' }
  const typeColor: Record<ChangePointType, string> = { man: '#1677ff', machine: '#531dab', material: '#d46b08', method: '#08979c', environment: '#389e0d', measure: '#c41d7f', other: '#8c8c8c' }
  const typeColorBg: Record<ChangePointType, string> = { man: '#e6f4ff', machine: '#efdbff', material: '#fff7e6', method: '#e6fffb', environment: '#f6ffed', measure: '#fff0f6', other: '#f5f5f5' }
  const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }
  const statusBadgeMap: Record<ChangePointStatus, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
    draft: 'default', submitted: 'processing', approving: 'warning', approved: 'processing',
    locked: 'error', verifying: 'warning', released: 'success', rejected: 'error', closed: 'default',
  }

  const changeTypeOptions = CHANGE_TYPE_OPTIONS.map(o => ({ value: o.value, label: `${o.icon} ${o.label.split(' ')[0]}` }))

  // ── 搜索表单 ──────────────────────────────────────────────────────────
  const searchForm = reactive({
    keyword: '',
    changeType: undefined as string | undefined,
    riskLevel: undefined as string | undefined,
    status: (route.query.status as string) || undefined,
    dateRange: null as any,
  })

  // ── 状态快速切换 Tab ──────────────────────────────────────────────────
  const loading = ref(false)

  const dataSource = ref<ChangePointRecord[]>([
    { id: '1', recordNo: 'CPR-20240305-001', title: '关键机台 #MC-02 大修更换模具', reporter: { id: 'u1', name: '张三', department: '生产部', team: 'A班' }, reportTime: '2024-03-05T08:30:00', changeDetail: { changeType: 'machine', changeSubType: '模具更换', changeDescription: '压铸模具A老化，更换新模具', affectedMachine: 'MC-02' }, riskLevel: 'high', status: 'locked', mesLockTime: '2024-03-05T09:00:00', createTime: '2024-03-05T08:30:00', updateTime: '2024-03-05T09:00:00' },
    { id: '2', recordNo: 'CPR-20240305-002', title: '核心原料供应商切换 - 铝锭', reporter: { id: 'u2', name: '李四', department: '品质部' }, reportTime: '2024-03-05T09:15:00', changeDetail: { changeType: 'material', changeSubType: '材料供应商变更', changeDescription: '原供应商缺货，临时切换备选供应商B' }, riskLevel: 'high', status: 'approving', createTime: '2024-03-05T09:15:00', updateTime: '2024-03-05T09:15:00' },
    { id: '3', recordNo: 'CPR-20240305-003', title: '新普工上岗 - 压铸工序 2 人', reporter: { id: 'u3', name: '王五', department: '生产部', team: 'B班' }, reportTime: '2024-03-05T10:00:00', changeDetail: { changeType: 'man', changeSubType: '新员工上岗', changeDescription: '2名新员工进入压铸工序' }, riskLevel: 'low', status: 'released', createTime: '2024-03-05T10:00:00', updateTime: '2024-03-05T10:05:00' },
    { id: '4', recordNo: 'CPR-20240305-004', title: 'IPQC 检具更换 - 卡尺校准换新', reporter: { id: 'u4', name: '赵六', department: '品质部' }, reportTime: '2024-03-05T11:00:00', changeDetail: { changeType: 'measure', changeSubType: '检具更换', changeDescription: '数显卡尺超校准周期，更换新仪器' }, riskLevel: 'medium', status: 'verifying', createTime: '2024-03-05T11:00:00', updateTime: '2024-03-05T11:30:00' },
    { id: '5', recordNo: 'CPR-20240305-005', title: '工艺参数调整 - 压铸温度窗口扩宽', reporter: { id: 'u5', name: '孙七', department: '技术部' }, reportTime: '2024-03-05T13:00:00', changeDetail: { changeType: 'method', changeSubType: '工艺参数调整', changeDescription: '根据试验，将射料温度上限从670℃调整至685℃' }, riskLevel: 'medium', status: 'approved', createTime: '2024-03-05T13:00:00', updateTime: '2024-03-05T14:00:00' },
    { id: '6', recordNo: 'CPR-20240304-001', title: '生产环境改造 - 东侧厂房扩建完成', reporter: { id: 'u6', name: '陈工', department: '工务部' }, reportTime: '2024-03-04T09:00:00', changeDetail: { changeType: 'environment', changeSubType: '生产环境改造', changeDescription: '东侧扩建区投入使用，调整生产线布局' }, riskLevel: 'medium', status: 'closed', createTime: '2024-03-04T09:00:00', updateTime: '2024-03-04T18:00:00' },
    { id: '7', recordNo: 'CPR-20240306-001', title: '年度设备大保养 - 注塑机 IC-05', reporter: { id: 'u7', name: '李工', department: '设备部' }, reportTime: '2024-03-06T07:00:00', changeDetail: { changeType: 'machine', changeSubType: '设备大修', changeDescription: '注塑机 IC-05 年度全面保养，更换易损件' }, riskLevel: 'high', status: 'draft', createTime: '2024-03-06T07:00:00', updateTime: '2024-03-06T07:00:00' },
  ])

  const statusTabs = computed(() => [
    { key: 'all',       label: '全部',    value: undefined, count: 0 },
    { key: 'approving', label: '待审批',  value: 'approving', count: dataSource.value.filter(r => r.status === 'approving').length },
    { key: 'locked',    label: 'MES锁机', value: 'locked',    count: dataSource.value.filter(r => r.status === 'locked').length },
    { key: 'verifying', label: '验证中',  value: 'verifying', count: dataSource.value.filter(r => r.status === 'verifying').length },
    { key: 'released',  label: '已放行',  value: 'released',  count: 0 },
    { key: 'closed',    label: '已闭环',  value: 'closed',    count: 0 },
  ])

  const filteredData = computed(() =>
    dataSource.value.filter(item => {
      if (searchForm.keyword && !item.recordNo.includes(searchForm.keyword) && !item.title.includes(searchForm.keyword)) return false
      if (searchForm.changeType && item.changeDetail.changeType !== searchForm.changeType) return false
      if (searchForm.riskLevel && item.riskLevel !== searchForm.riskLevel) return false
      if (searchForm.status && item.status !== searchForm.status) return false
      return true
    })
  )

  const columns = [
    { title: '单据编号', key: 'recordNo', width: 185, fixed: 'left' as const },
    { title: '变化点标题', dataIndex: 'title', key: 'title', ellipsis: true, minWidth: 220 },
    { title: '类型', key: 'changeType', width: 78 },
    { title: '风险', key: 'riskLevel', width: 90 },
    { title: '状态', key: 'status', width: 155 },
    { title: '提报人', dataIndex: ['reporter', 'name'], key: 'reporter', width: 80 },
    { title: '部门', dataIndex: ['reporter', 'department'], key: 'dept', width: 90 },
    { title: '提报时间', key: 'reportTime', width: 130 },
    { title: '操作', key: 'action', width: 210, fixed: 'right' as const },
  ]

  const rowClassName = (record: ChangePointRecord) => {
    if (record.status === 'locked') return 'row--danger'
    if (record.status === 'approving') return 'row--warning'
    return ''
  }

  // ── 操作 ──────────────────────────────────────────────────────────────
  const handleSearch = () => { loading.value = true; setTimeout(() => loading.value = false, 300) }
  const resetSearch = () => { Object.assign(searchForm, { keyword: '', changeType: undefined, riskLevel: undefined, status: undefined, dateRange: null }); handleSearch() }
  const handleRefresh = () => handleSearch()
  const handleExport = () => message.info('正在生成台账导出文件…')
  const handleAdd = () => router.push('/production-quality/change-point/list/create')
  const formatDate = (d: string) => dayjs(d).format('MM-DD HH:mm')
  const switchStatusTab = (val: string | undefined) => { searchForm.status = val }
  const viewRecord = (r: ChangePointRecord) => router.push('/production-quality/change-point/list/view/' + r.id)
  const editRecord = (r: ChangePointRecord) => router.push('/production-quality/change-point/list/edit/' + r.id)
  const goToVerification = (r: ChangePointRecord) => router.push('/production-quality/change-point/verification?changePointId=' + r.id)

  const handleDelete = (id: string) => {
    const idx = dataSource.value.findIndex(r => r.id === id)
    if (idx >= 0) { dataSource.value.splice(idx, 1); message.success('删除成功') }
  }

  // ── 审批弹窗 ──────────────────────────────────────────────────────────
  const approveModalVisible = ref(false)
  const currentRecord = ref<ChangePointRecord | null>(null)
  const approveForm = reactive({ result: 'approved', comment: '' })

  const openApproveModal = (record: ChangePointRecord) => {
    currentRecord.value = record
    approveForm.result = 'approved'
    approveForm.comment = ''
    approveModalVisible.value = true
  }

  const submitApproval = () => {
    if (!currentRecord.value) return
    const record = dataSource.value.find(r => r.id === currentRecord.value!.id)
    if (record) {
      if (approveForm.result === 'approved') {
        record.status = ['medium', 'high'].includes(record.riskLevel) ? 'locked' : 'released'
        record.mesLockTime = ['medium', 'high'].includes(record.riskLevel) ? new Date().toISOString() : undefined
        message.success(record.status === 'locked' ? '审批通过！MES 锁机指令已发送。' : '审批通过！低风险变化点已放行。')
      } else {
        record.status = 'rejected'
        message.warning('已驳回该变化点申报。')
      }
      record.approver = '当前用户'
      record.approveComment = approveForm.comment
    }
    approveModalVisible.value = false
  }

  onMounted(() => {
    if (route.query.status) searchForm.status = route.query.status as string
  })
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
    padding: 10px 16px;
    margin-bottom: 16px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .toolbar-left { display: flex; align-items: center; overflow-x: auto; }

  /* ── 状态快速切换 Tab ────────────────────────────────────────────────── */
  .status-tabs {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .status-tab {
    appearance: none; border: none; background: transparent; font-family: inherit;
    padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;
    color: #595959; cursor: pointer; position: relative;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
    touch-action: manipulation;
    display: flex; align-items: center; gap: 6px;
  }
  .status-tab:hover { background: #f5f5f5; color: #1a1a1a; }
  .status-tab:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; }
  .status-tab--active { background: #e6f4ff; color: #1677ff; font-weight: 700; }
  .status-tab__badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px;
    background: #ff4d4f; color: #fff; font-size: 11px; font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .status-tab--active .status-tab__badge { background: #1677ff; }

  /* ── 搜索卡片 ─────────────────────────────────────────────────────────── */
  .search-card { margin-bottom: 16px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }

  /* ── 表格容器 ─────────────────────────────────────────────────────────── */
  .table-container {
    background: #fff;
    padding: 0 0 16px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  /* 行状态高亮 */
  :deep(.row--danger > td) { background: #fff8f6 !important; }
  :deep(.row--warning > td) { background: #fffdf0 !important; }

  /* ── 单元格渲染元素 ──────────────────────────────────────────────────── */
  .record-no-btn {
    appearance: none; border: none; padding: 0; background: transparent;
    font-family: 'Monaco', 'Consolas', 'Menlo', monospace;
    font-size: 13px; font-weight: 600; color: #1677ff;
    cursor: pointer; touch-action: manipulation;
  }
  .record-no-btn:hover { text-decoration: underline; color: #4096ff; }
  .record-no-btn:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; border-radius: 2px; }

  .type-pill {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px;
    white-space: nowrap;
  }

  .risk-dot-cell { display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .risk-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .risk-dot--high   { background: #ff4d4f; box-shadow: 0 0 0 2px rgba(255,77,79,0.2); }
  .risk-dot--medium { background: #fa8c16; box-shadow: 0 0 0 2px rgba(250,140,22,0.2); }
  .risk-dot--low    { background: #52c41a; }

  .status-cell { display: flex; align-items: center; gap: 4px; font-size: 13px; }
  .mes-lock-chip { font-size: 13px; margin-left: 2px; }

  .time-text { font-size: 12px; color: #8c8c8c; font-variant-numeric: tabular-nums; }
  .action-link--warn { color: #fa8c16 !important; }

  /* ── 审批弹窗 ─────────────────────────────────────────────────────────── */
  .approve-modal-body { padding: 4px 0; }

  .approve-target-card {
    background: #f9fafb;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }
  .approve-target-no {
    font-family: 'Consolas', 'Menlo', monospace;
    font-size: 12px; color: #8c8c8c; margin-bottom: 4px;
  }
  .approve-target-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; text-wrap: balance; }
  .approve-target-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: #595959;
  }

  .approve-radio-group { display: flex; gap: 12px; margin-bottom: 4px; }
  .approve-radio-option {
    flex: 1; display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 16px; border-radius: 8px; border: 2px solid #e8e8e8;
    background: #fafafa; cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    touch-action: manipulation; user-select: none;
  }
  .approve-radio-option:hover { border-color: #d9d9d9; }
  .approve-radio-option--approve { border-color: #52c41a; background: #f6ffed; }
  .approve-radio-option--reject  { border-color: #ff4d4f; background: #fff2f0; }
  .approve-radio-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
  .approve-radio-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
  .approve-radio-hint { font-size: 12px; color: #8c8c8c; line-height: 1.5; }
</style>