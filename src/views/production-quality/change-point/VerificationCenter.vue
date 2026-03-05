<template>
  <div class="page-container">

    <!-- ══════════════════════════════════════════════════════════════════
         列表视图（当 detailVisible = false 时显示）
    ══════════════════════════════════════════════════════════════════════ -->
    <template v-if="!detailVisible">

    <!-- Toolbar -->
    <div class="toolbar">
      <a-space>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>导出台账
        </a-button>
        <a-button @click="handleRefresh" :loading="loading">
          <template #icon><ReloadOutlined /></template>刷新
        </a-button>
      </a-space>
    </div>

    <!-- ══ 统计摘要行（列表顶部快速概览）══════════════════════════════ -->
    <a-row :gutter="16" class="summary-row">
      <a-col :span="6" v-for="item in summaryStats" :key="item.key">
        <div class="summary-card" :class="`summary-card--${item.key}`" @click="filterByStatus(item.statusFilter)">
          <div class="summary-card__icon">{{ item.icon }}</div>
          <div class="summary-card__body">
            <div class="summary-card__count">{{ item.count }}</div>
            <div class="summary-card__label">{{ item.label }}</div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- ══ 搜索筛选 ══════════════════════════════════════════════════ -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="queryParam">
        <a-form-item label="关键字">
          <a-input
            v-model:value="queryParam.keyword"
            placeholder="输入单号或验证标题…"
            allow-clear
            style="width: 220px"
            autocomplete="off"
            :spellcheck="false"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="任务状态">
          <a-select
            v-model:value="queryParam.status"
            style="width: 140px"
            allow-clear
            placeholder="全部状态"
          >
            <a-select-option value="pending">待开始</a-select-option>
            <a-select-option value="running">验证中</a-select-option>
            <a-select-option value="passed">已通过</a-select-option>
            <a-select-option value="failed">不合格</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ══ 任务列表 ══════════════════════════════════════════════════════ -->
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="filteredTasks"
        row-key="id"
        size="middle"
        :pagination="pagination"
        :loading="loading"
        :scroll="{ x: 1000 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">

          <!-- 关联单号 -->
          <template v-if="column.key === 'changePointNo'">
            <button class="record-no-btn" @click="openTaskDetail(record)" :aria-label="`打开任务 ${record.changePointNo} 的详情`">
              {{ record.changePointNo }}
            </button>
          </template>

          <!-- 验证标题 -->
          <template v-else-if="column.key === 'planTitle'">
            <span class="plan-title-text" :title="record.planTitle">{{ record.planTitle }}</span>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <a-badge
              :status="statusBadgeType[record.status]"
              :text="verificationStatusLabelMap[record.status]"
            />
          </template>

          <!-- 验证进度 -->
          <template v-else-if="column.key === 'progress'">
            <div class="progress-cell">
              <a-progress
                :percent="calcPercent(record)"
                size="small"
                :status="progressStatus(record)"
                :show-info="false"
                style="flex: 1; min-width: 80px;"
              />
              <span class="progress-label" :class="`progress-label--${record.status}`">
                {{ record.passedCount }}<span class="progress-sep">/</span>{{ record.requiredCount }}
              </span>
            </div>
          </template>

          <!-- 截止时间 -->
          <template v-else-if="column.key === 'deadline'">
            <div class="deadline-cell">
              <span :class="{ 'deadline-overdue': isOverdue(record.deadline) && record.status === 'running' }">
                {{ formatDate(record.deadline) }}
              </span>
              <a-tag v-if="isOverdue(record.deadline) && record.status === 'running'" color="error" class="overdue-tag">超时</a-tag>
            </div>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openTaskDetail(record)">
              {{ record.status === 'passed' || record.status === 'failed' ? '查看详情' : '办理' }}
            </a-button>
          </template>

        </template>

        <!-- 空状态 -->
        <template #emptyText>
          <a-empty description="暂无验证任务" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </template>
      </a-table>
    </div>

    </template><!-- /v-if="!detailVisible" -->

    <!-- ══════════════════════════════════════════════════════════════════
         详情视图（当 detailVisible = true 时替换整个列表区域）
    ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="detailVisible" class="detail-panel">

      <!-- 详情面包屑导航 -->
      <div class="detail-breadcrumb">
        <a-button type="link" class="detail-back-btn" @click="closeDetail">
          <template #icon><ArrowLeftOutlined /></template>返回列表
        </a-button>
        <a-divider type="vertical" />
        <span class="detail-breadcrumb-current">{{ selectedTask?.changePointNo }} · 试生产验证任务</span>
      </div>

      <template v-if="selectedTask">

        <!-- ── 头部信息块 ──────────────────────────────────────────── -->
        <div class="detail-header-card">
          <div class="detail-header-top">
            <div class="detail-header-left">
              <div class="detail-header-title">{{ selectedTask.planTitle }}</div>
              <div class="detail-header-meta">
                <span>关联单号：<strong>{{ selectedTask.changePointNo }}</strong></span>
                <a-divider type="vertical" />
                <span>验证责任人：<strong>{{ selectedTask.verifier }}</strong></span>
                <a-divider type="vertical" />
                <span>QE 审批：<strong>{{ selectedTask.qeApprover }}</strong></span>
                <a-divider type="vertical" />
                <span>创建时间：{{ formatDateTime(selectedTask.createTime) }}</span>
              </div>
            </div>
            <div class="detail-header-right">
              <a-tag :color="statusTagColor[selectedTask.status]" class="detail-status-tag">
                {{ verificationStatusLabelMap[selectedTask.status] }}
              </a-tag>
            </div>
          </div>

          <!-- ── 4 大核心数据卡 ──────────────────────────────────── -->
          <div class="stat-row">
            <div class="stat-card stat-card--primary">
              <div class="stat-card__value">{{ selectedTask.requiredCount }}</div>
              <div class="stat-card__label">要求连续合格件数</div>
            </div>
            <div class="stat-card stat-card--warning">
              <div class="stat-card__value">{{ selectedTask.completedCount }}</div>
              <div class="stat-card__label">已录入验证件数</div>
            </div>
            <div class="stat-card" :class="selectedTask.passedCount >= selectedTask.requiredCount ? 'stat-card--success' : 'stat-card--default'">
              <div class="stat-card__value">{{ selectedTask.passedCount }}</div>
              <div class="stat-card__label">当前连续合格数</div>
            </div>
            <div class="stat-card" :class="isOverdue(selectedTask.deadline) ? 'stat-card--danger' : 'stat-card--default'">
              <div class="stat-card__value">{{ getRemainingHours(selectedTask.deadline) }}<small>h</small></div>
              <div class="stat-card__label">{{ isOverdue(selectedTask.deadline) ? '超时时长(h)' : '剩余时间(h)' }}</div>
            </div>
          </div>

          <!-- ── 总体进度条 ──────────────────────────────────────── -->
          <div class="overall-progress-wrap">
            <a-progress
              :percent="calcPercent(selectedTask)"
              :status="progressStatus(selectedTask)"
              :format="(p: number) => `${selectedTask?.passedCount}/${selectedTask?.requiredCount} 件合格 (${p}%)`"
            />
          </div>
        </div>

        <!-- ── 动态操作面板（根据状态响应式显示）──────────────────── -->
        <div class="action-banner-wrap">
          <!-- 验证达标，可放行 -->
          <a-alert
            v-if="canRelease"
            type="success"
            show-icon
            class="action-banner action-banner--success"
          >
            <template #message>
              <strong>🎉 验证达标！连续 {{ selectedTask.requiredCount }} 件已全部合格。</strong>
            </template>
            <template #description>
              确认放行后，系统将自动向 MES 发送机台解锁指令，生产防错屏障将解除，机台可恢复正常批量生产。请确认已完成所有现场检验并由 QE 核准。
            </template>
            <template #action>
              <a-button type="primary" size="large" @click="handleRelease" id="btn-release">
                确认放行 &amp; MES 解锁
              </a-button>
            </template>
          </a-alert>

          <!-- 连续中断，出现不合格 -->
          <a-alert
            v-else-if="hasFailItem && selectedTask.status === 'running'"
            type="error"
            show-icon
            class="action-banner action-banner--error"
          >
            <template #message>
              <strong>⚠️ 验证中断：出现不合格件，连续合格计数已重置为 0。</strong>
            </template>
            <template #description>
              请通知工程师/生产主管排查并处理不良原因，待改善后重新开始验证件计数。机台互锁仍处于锁定状态，不可批量生产。
            </template>
            <template #action>
              <a-button danger @click="resetCount" id="btn-reset-count">重置并重新验证</a-button>
            </template>
          </a-alert>

          <!-- 已通过放行 -->
          <a-alert
            v-else-if="selectedTask.status === 'passed'"
            type="success"
            show-icon
            message="该验证任务已通过放行，MES 机台解锁指令已发送。"
            class="action-banner"
          />

          <!-- 验证超时提醒（运行中且已超期） -->
          <a-alert
            v-else-if="isOverdue(selectedTask.deadline) && selectedTask.status === 'running'"
            type="warning"
            show-icon
            class="action-banner"
          >
            <template #message>
              <strong>⏰ 验证已超时，请尽快完成检验录入！</strong>
            </template>
            <template #description>
              超时预警已自动推送至 QE 及品质经理。若短期内无法完成验证，请联系主管决策处理方案。
            </template>
          </a-alert>
        </div>

        <!-- ── 验证记录明细表（主操作区）────────────────────────── -->
        <div class="detail-section-card">
          <div class="detail-section-header">
            <div class="detail-section-title">✅ 试生产验证记录明细</div>
            <a-button
              v-if="selectedTask.status === 'running' || selectedTask.status === 'pending'"
              type="primary"
              @click="addNextItem"
              id="btn-add-verification-item"
              :disabled="selectedTask.status === 'passed'"
            >
              <template #icon><PlusOutlined /></template>录入下一件验证结果
            </a-button>
          </div>

          <!-- 验证件卡片列表（替代普通表格，提供更强视觉层次） -->
          <div class="verification-items-grid">
            <div
              v-for="item in selectedTask.taskItems"
              :key="item.id"
              class="vitem-card"
              :class="`vitem-card--${item.result}`"
            >
              <div class="vitem-card__seq">第 {{ item.sequence }} 件</div>
              <div class="vitem-card__result-icon">
                <span v-if="item.result === 'pass'" class="result-icon result-icon--pass" aria-label="合格">✅</span>
                <span v-else-if="item.result === 'fail'" class="result-icon result-icon--fail" aria-label="不合格">❌</span>
                <span v-else class="result-icon result-icon--pending" aria-label="待检">⏳</span>
              </div>
              <div class="vitem-card__meta">
                <div class="vitem-card__result-label">
                  {{ item.result === 'pass' ? '合格 (Pass)' : item.result === 'fail' ? '不合格 (Fail)' : '待检录入' }}
                </div>
                <div v-if="item.inspector" class="vitem-card__info">{{ item.inspector }} · {{ formatTime(item.inspectTime) }}</div>
                <div v-if="item.note" class="vitem-card__note" :title="item.note">{{ item.note }}</div>
              </div>
              <div class="vitem-card__action">
                <a-button
                  v-if="item.result === 'pending' && (selectedTask.status === 'running' || selectedTask.status === 'pending')"
                  type="primary"
                  size="small"
                  ghost
                  @click="fillItemResult(item)"
                  :aria-label="`填写第 ${item.sequence} 件的验证结果`"
                >填写结果</a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── MES 互锁日志（折叠展示） ────────────────────────── -->
        <div class="detail-section-card">
          <a-collapse ghost>
            <a-collapse-panel key="mes-log" header="🔒 MES 互锁操作日志">
              <a-timeline>
                <a-timeline-item color="red">
                  <template #dot><LockOutlined /></template>
                  <div class="timeline-item">
                    <span class="timeline-action">机台锁定 (Lock)</span>
                    <span class="timeline-time">{{ formatDateTime(selectedTask.createTime) }}</span>
                    <div class="timeline-note">已向 MES 发送机台锁定指令，批量报工防错已启用。</div>
                  </div>
                </a-timeline-item>
                <a-timeline-item v-if="selectedTask.status === 'passed'" color="green">
                  <template #dot><UnlockOutlined /></template>
                  <div class="timeline-item">
                    <span class="timeline-action">机台解锁 (Unlock)</span>
                    <span class="timeline-time">{{ formatDateTime(selectedTask.updateTime) }}</span>
                    <div class="timeline-note">验证通过，已向 MES 发送机台解锁指令，机台恢复正常生产。</div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </a-collapse-panel>
          </a-collapse>
        </div>

      </template>
    </div>

    <!-- ══ 录入验证结果弹窗 ══════════════════════════════════════════ -->
    <a-modal
      v-model:open="fillModalVisible"
      title="录入验证结果"
      width="520px"
      :ok-text="fillForm.result === 'pass' ? '✅ 确认合格' : '❌ 确认不合格'"
      :ok-button-props="{ danger: fillForm.result === 'fail', type: 'primary' }"
      cancel-text="取消"
      @ok="submitItemResult"
      :destroy-on-close="true"
    >
      <div class="fill-modal-body">
        <a-alert
          type="info"
          show-icon
          :message="`正在录入第 ${currentItem?.sequence} 件的检验结果`"
          style="margin-bottom: 20px"
        />
        <a-form :model="fillForm" layout="vertical">
          <a-form-item label="检验结果" required>
            <div class="result-radio-group">
              <label
                class="result-radio-option"
                :class="{ 'result-radio-option--active-pass': fillForm.result === 'pass' }"
              >
                <input type="radio" v-model="fillForm.result" value="pass" style="display:none">
                <span class="result-radio-icon">✅</span>
                <span class="result-radio-text">合格 (Pass)</span>
              </label>
              <label
                class="result-radio-option"
                :class="{ 'result-radio-option--active-fail': fillForm.result === 'fail' }"
              >
                <input type="radio" v-model="fillForm.result" value="fail" style="display:none">
                <span class="result-radio-icon">❌</span>
                <span class="result-radio-text">不合格 (Fail)</span>
              </label>
            </div>
          </a-form-item>
          <a-form-item label="不良或备注说明" v-if="fillForm.result === 'fail'">
            <a-textarea
              v-model:value="fillForm.note"
              :rows="3"
              placeholder="请描述不合格现象、位置或可能的原因…"
              autocomplete="off"
              :spellcheck="false"
            />
          </a-form-item>
          <a-form-item label="备注（可选）" v-else>
            <a-textarea
              v-model:value="fillForm.note"
              :rows="2"
              placeholder="如有补充说明，请填写…"
              autocomplete="off"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, reactive } from 'vue'
  import { useRoute } from 'vue-router'
  import { message, Modal, Empty } from 'ant-design-vue'
  import {
    PlusOutlined, ReloadOutlined, ExportOutlined,
    ArrowLeftOutlined, LockOutlined, UnlockOutlined
  } from '@ant-design/icons-vue'
  import dayjs from 'dayjs'
  import type { VerificationPlan, VerificationTaskItem } from '@/types/change-point'

  type TaskRecord = VerificationPlan & { changePointNo: string }

  const route = useRoute()

  // ── 搜索参数 ──────────────────────────────────────────────────────────
  const queryParam = reactive({ keyword: '', status: undefined as string | undefined })
  const loading = ref(false)

  // ── 状态配置 ──────────────────────────────────────────────────────────
  const verificationStatusLabelMap: Record<string, string> = {
    pending: '待开始', running: '验证中', passed: '已通过', failed: '不合格',
  }
  const statusBadgeType: Record<string, 'default' | 'processing' | 'success' | 'error'> = {
    pending: 'default', running: 'processing', passed: 'success', failed: 'error',
  }
  const statusTagColor: Record<string, string> = {
    pending: 'default', running: 'processing', passed: 'success', failed: 'error',
  }

  // ── 表格列定义 ─────────────────────────────────────────────────────────
  const columns = [
    { title: '关联变化点单号', key: 'changePointNo', width: 190 },
    { title: '验证方案标题', key: 'planTitle', ellipsis: true, minWidth: 200 },
    { title: '状态', key: 'status', width: 110 },
    { title: '合格进度', key: 'progress', width: 180 },
    { title: '验证责任人', dataIndex: 'verifier', key: 'verifier', width: 110 },
    { title: '截止时间', key: 'deadline', width: 155 },
    { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
  ]
  const pagination = reactive({
    total: 0,
    current: 1,
    pageSize: 15,
    showTotal: (t: number) => `共 ${t} 条记录`,
    showSizeChanger: false,
  })

  // ── Mock 数据 ───────────────────────────────────────────────────────────
  const tasks = ref<TaskRecord[]>([
    {
      id: 'vt1', changePointId: '1', changePointNo: 'CPR-20240305-001',
      planTitle: '机台 MC-02 换模具后首件验证（连续 3 件合格）',
      requiredCount: 3, completedCount: 2, passedCount: 2,
      verifier: '赵IPQC', qeApprover: '王QE',
      deadline: dayjs().add(1, 'hour').toISOString(), status: 'running',
      taskItems: [
        { id: 'ti1', sequence: 1, inspector: '赵IPQC', inspectTime: dayjs().subtract(30, 'minute').toISOString(), result: 'pass', note: '' },
        { id: 'ti2', sequence: 2, inspector: '赵IPQC', inspectTime: dayjs().subtract(15, 'minute').toISOString(), result: 'pass', note: '' },
        { id: 'ti3', sequence: 3, inspector: '', inspectTime: '', result: 'pending', note: '' },
      ],
      createTime: dayjs().subtract(2, 'hour').toISOString(),
      updateTime: dayjs().subtract(15, 'minute').toISOString(),
    },
    {
      id: 'vt2', changePointId: '4', changePointNo: 'CPR-20240305-004',
      planTitle: '新卡尺校准引入首样比对验证（5 件比对）',
      requiredCount: 5, completedCount: 5, passedCount: 5,
      verifier: '刘品质', qeApprover: '张工艺',
      deadline: dayjs().subtract(1, 'hour').toISOString(), status: 'passed',
      taskItems: Array.from({ length: 5 }, (_, i) => ({
        id: `ti2${i + 1}`, sequence: i + 1, inspector: '刘品质',
        inspectTime: dayjs().subtract(60 - i * 10, 'minute').toISOString(),
        result: 'pass' as const, note: '',
      })),
      createTime: dayjs().subtract(4, 'hour').toISOString(),
      updateTime: dayjs().subtract(20, 'minute').toISOString(),
    },
    {
      id: 'vt3', changePointId: '7', changePointNo: 'CPR-20240306-002',
      planTitle: '新供应商注塑粒子外观及流动性首批来料验证',
      requiredCount: 2, completedCount: 0, passedCount: 0,
      verifier: '陈IQC', qeApprover: '吴QE',
      deadline: dayjs().add(8, 'hour').toISOString(), status: 'pending',
      taskItems: [
        { id: 'ti31', sequence: 1, inspector: '', inspectTime: '', result: 'pending', note: '' },
        { id: 'ti32', sequence: 2, inspector: '', inspectTime: '', result: 'pending', note: '' },
      ],
      createTime: dayjs().subtract(1, 'hour').toISOString(),
      updateTime: dayjs().subtract(1, 'hour').toISOString(),
    },
    {
      id: 'vt4', changePointId: '9', changePointNo: 'CPR-20240306-007',
      planTitle: '设备接地线重新布线后上电点检验证（连续 3 件）',
      requiredCount: 3, completedCount: 2, passedCount: 0,
      verifier: '周IPQC', qeApprover: '郑QE',
      deadline: dayjs().subtract(3, 'hour').toISOString(), status: 'running',
      taskItems: [
        { id: 'ti41', sequence: 1, inspector: '周IPQC', inspectTime: dayjs().subtract(4, 'hour').toISOString(), result: 'pass', note: '' },
        { id: 'ti42', sequence: 2, inspector: '周IPQC', inspectTime: dayjs().subtract(3.5, 'hour').toISOString(), result: 'fail', note: '第2件发现A面轻微划伤，已隔离' },
        { id: 'ti43', sequence: 3, inspector: '', inspectTime: '', result: 'pending', note: '' },
      ],
      createTime: dayjs().subtract(5, 'hour').toISOString(),
      updateTime: dayjs().subtract(3, 'hour').toISOString(),
    },
  ])

  // ── 统计摘要 ────────────────────────────────────────────────────────────
  const summaryStats = computed(() => [
    { key: 'pending', icon: '🕐', label: '待开始', count: tasks.value.filter(t => t.status === 'pending').length, statusFilter: 'pending' },
    { key: 'running', icon: '🔄', label: '验证中', count: tasks.value.filter(t => t.status === 'running').length, statusFilter: 'running' },
    { key: 'overdue', icon: '⏰', label: '已超时', count: tasks.value.filter(t => t.status === 'running' && isOverdue(t.deadline)).length, statusFilter: 'running' },
    { key: 'passed', icon: '✅', label: '已放行', count: tasks.value.filter(t => t.status === 'passed').length, statusFilter: 'passed' },
  ])

  const filteredTasks = computed(() => {
    let list = tasks.value
    if (queryParam.status) list = list.filter(t => t.status === queryParam.status)
    if (queryParam.keyword) list = list.filter(t =>
      t.changePointNo.includes(queryParam.keyword) || t.planTitle.includes(queryParam.keyword)
    )
    pagination.total = list.length
    return list
  })

  // ── 操作方法 ────────────────────────────────────────────────────────────
  const handleSearch = () => { loading.value = true; setTimeout(() => loading.value = false, 300) }
  const handleReset = () => { queryParam.keyword = ''; queryParam.status = undefined; handleSearch() }
  const handleRefresh = () => handleSearch()
  const handleExport = () => message.info('正在生成验证台账，请稍候…')
  const handleTableChange = (pag: any) => { pagination.current = pag.current }
  const filterByStatus = (status: string) => { queryParam.status = status; handleSearch() }

  // ── 辅助计算 ────────────────────────────────────────────────────────────
  const calcPercent = (record: TaskRecord) => Math.round(record.passedCount / record.requiredCount * 100)
  const progressStatus = (record: TaskRecord): 'success' | 'exception' | 'active' | 'normal' => {
    if (record.status === 'passed') return 'success'
    if (record.status === 'failed' || record.taskItems?.some((i: any) => i.result === 'fail')) return 'exception'
    if (record.status === 'running') return 'active'
    return 'normal'
  }
  const isOverdue = (d: string) => dayjs().isAfter(dayjs(d))
  const getRemainingHours = (d: string) => Math.abs(dayjs(d).diff(dayjs(), 'hour'))
  const formatDate = (d: string) => d ? dayjs(d).format('MM-DD HH:mm') : '—'
  const formatDateTime = (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '—'
  const formatTime = (d: string) => d ? dayjs(d).format('HH:mm') : ''

  // ── 详情页逻辑 ─────────────────────────────────────────────────────────
  const detailVisible = ref(false)
  const selectedTask = ref<TaskRecord | null>(null)

  const openTaskDetail = (record: TaskRecord) => {
    selectedTask.value = record
    detailVisible.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeDetail = () => {
    detailVisible.value = false
    selectedTask.value = null
  }

  const canRelease = computed(() =>
    selectedTask.value
    && selectedTask.value.passedCount >= selectedTask.value.requiredCount
    && selectedTask.value.status === 'running'
  )

  const hasFailItem = computed(() =>
    selectedTask.value?.taskItems.some((i: any) => i.result === 'fail') ?? false
  )

  // ── 录入结果弹窗 ───────────────────────────────────────────────────────
  const fillModalVisible = ref(false)
  const currentItem = ref<VerificationTaskItem | null>(null)
  const fillForm = ref({ result: 'pass', note: '' })

  const addNextItem = () => {
    if (!selectedTask.value) return
    const next = selectedTask.value.taskItems.find((i: any) => i.result === 'pending')
    if (next) fillItemResult(next)
    else message.success('所有验证件均已完成录入')
  }

  const fillItemResult = (item: VerificationTaskItem) => {
    currentItem.value = item
    fillForm.value = { result: 'pass', note: '' }
    fillModalVisible.value = true
  }

  const submitItemResult = () => {
    if (!currentItem.value || !selectedTask.value) return
    const item = selectedTask.value.taskItems.find((i: any) => i.id === currentItem.value!.id) as any
    if (!item) return

    item.result = fillForm.value.result
    item.note = fillForm.value.note
    item.inspector = '当前用户'
    item.inspectTime = new Date().toISOString()

    selectedTask.value.completedCount++
    if (item.result === 'pass') {
      selectedTask.value.passedCount++
    } else {
      selectedTask.value.passedCount = 0
      message.warning('当前件不合格，连续合格计数已中断并归零！')
    }
    if (selectedTask.value.status === 'pending') selectedTask.value.status = 'running'

    fillModalVisible.value = false
    message.success('验证结果已记录')
  }

  const handleRelease = () => {
    Modal.confirm({
      title: '确认放行 & MES 解锁',
      content: '所有连续合格件已达到要求。确认后系统将自动向 MES 发送机台解锁指令，车间防错屏障将解除，请确保已获得 QE 核准。',
      okText: '确认放行',
      okType: 'primary',
      cancelText: '取消',
      onOk: () => {
        if (!selectedTask.value) return
        selectedTask.value.status = 'passed'
        message.success('🎉 放行成功！MES 解锁指令已发送，生产可恢复正常。')
      },
    })
  }

  const resetCount = () => {
    Modal.confirm({
      title: '重置验证计数',
      content: '这将重置连续合格计数为 0，不合格件将恢复为"待检"状态，需重新录入。机台互锁不变，是否继续？',
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        if (!selectedTask.value) return
        selectedTask.value.passedCount = 0
        selectedTask.value.taskItems.forEach((i: any) => { if (i.result === 'fail') i.result = 'pending' })
        message.info('计数已重置，机台仍处于互锁状态，请继续验证并录入结果。')
      },
    })
  }

  onMounted(() => {
    pagination.total = tasks.value.length
    const cpId = route.query.changePointId as string
    if (cpId) {
      const task = tasks.value.find(t => t.changePointId === cpId)
      if (task) openTaskDetail(task)
    }
  })
</script>

<style scoped>
  /* ── 页面基础 ──────────────────────────────────────────────────────── */
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  .toolbar {
    background: #fff;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    display: flex;
    justify-content: flex-end;
  }

  /* ── 统计摘要卡片行 ────────────────────────────────────────────────── */
  .summary-row { margin-bottom: 16px; }

  .summary-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    border: 1.5px solid transparent;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
    user-select: none;
  }
  .summary-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  .summary-card:active { transform: translateY(0); }
  .summary-card--running { border-color: #1890ff; }
  .summary-card--passed { border-color: #52c41a; }
  .summary-card--overdue { border-color: #ff4d4f; }
  .summary-card--pending { border-color: #d9d9d9; }

  .summary-card__icon { font-size: 28px; line-height: 1; }
  .summary-card__body { display: flex; flex-direction: column; }
  .summary-card__count {
    font-size: 26px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    color: #1a1a1a;
  }
  .summary-card__label { font-size: 13px; color: #666; margin-top: 2px; }

  /* ── 搜索与表格 ────────────────────────────────────────────────────── */
  .search-card {
    margin-bottom: 16px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .table-container {
    background: #fff;
    padding: 16px 24px 24px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .record-no-btn {
    background: none;
    border: none;
    padding: 0;
    font-family: 'Monaco', 'Consolas', 'Menlo', monospace;
    font-size: 13px;
    font-weight: 600;
    color: #1890ff;
    cursor: pointer;
    text-decoration: none;
    touch-action: manipulation;
  }
  .record-no-btn:hover { text-decoration: underline; color: #40a9ff; }
  .record-no-btn:focus-visible { outline: 2px solid #1890ff; outline-offset: 2px; border-radius: 2px; }

  .plan-title-text { font-weight: 500; color: #262626; }

  .progress-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .progress-label {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: #595959;
    white-space: nowrap;
    min-width: 36px;
  }
  .progress-label--passed { color: #52c41a; font-weight: 600; }
  .progress-label--running { color: #1890ff; }
  .progress-sep { color: #bfbfbf; margin: 0 1px; }

  .deadline-cell { display: flex; align-items: center; gap: 6px; }
  .deadline-overdue { color: #ff4d4f; font-weight: 500; }
  .overdue-tag { margin: 0; padding: 0 4px; font-size: 11px; line-height: 18px; }

  /* ── 详情页面板 ──────────────────────────────────────────────────── */
  .detail-panel {
    margin-top: 16px;
    animation: slideInUp 0.2s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .detail-panel { animation: none; }
  }

  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .detail-breadcrumb {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 10px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .detail-back-btn { padding: 0 4px; font-size: 13px; color: #595959; }
  .detail-back-btn:hover { color: #1890ff; }
  .detail-breadcrumb-current { font-size: 13px; color: #595959; }

  /* ── 头部信息大卡片 ──────────────────────────────────────────────── */
  .detail-header-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .detail-header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .detail-header-title {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    text-wrap: balance;
    margin-bottom: 8px;
  }
  .detail-header-meta {
    font-size: 13px;
    color: #666;
    line-height: 1.8;
  }
  .detail-header-meta strong { color: #262626; }
  .detail-status-tag { font-size: 14px; padding: 4px 12px; border-radius: 4px; }

  /* ── 4 大统计卡 ──────────────────────────────────────────────────── */
  .stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-card {
    border-radius: 8px;
    padding: 16px 20px;
    border: 1.5px solid #f0f0f0;
    background: #fafafa;
    text-align: center;
    transition: box-shadow 0.2s;
  }
  .stat-card:hover { box-shadow: 0 3px 8px rgba(0,0,0,0.08); }

  .stat-card--primary  { border-color: #bae0ff; background: #e6f4ff; }
  .stat-card--warning  { border-color: #ffd591; background: #fffbe6; }
  .stat-card--success  { border-color: #b7eb8f; background: #f6ffed; }
  .stat-card--danger   { border-color: #ffc0c0; background: #fff2f0; }
  .stat-card--default  { border-color: #e8e8e8; background: #fafafa; }

  .stat-card__value {
    font-size: 32px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: #1a1a1a;
    margin-bottom: 6px;
  }
  .stat-card__value small { font-size: 16px; font-weight: 600; color: #666; margin-left: 2px; }
  .stat-card--primary .stat-card__value  { color: #1677ff; }
  .stat-card--warning .stat-card__value  { color: #d48806; }
  .stat-card--success .stat-card__value  { color: #389e0d; }
  .stat-card--danger .stat-card__value   { color: #cf1322; }

  .stat-card__label { font-size: 12px; color: #8c8c8c; }

  .overall-progress-wrap { padding-top: 4px; }

  /* ── 操作告警横幅 ────────────────────────────────────────────────── */
  .action-banner-wrap { margin-bottom: 16px; }
  .action-banner { border-radius: 8px; }
  .action-banner--success { border-color: #b7eb8f; }
  .action-banner--error   { border-color: #ffc0c0; }

  /* ── 通用分区卡片 ────────────────────────────────────────────────── */
  .detail-section-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .detail-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }
  .detail-section-title { font-size: 15px; font-weight: 700; color: #1a1a1a; }

  /* ── 验证件卡片网格 ──────────────────────────────────────────────── */
  .verification-items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .vitem-card {
    border-radius: 10px;
    border: 2px solid #f0f0f0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: #fafafa;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .vitem-card--pass    { border-color: #b7eb8f; background: #f6ffed; }
  .vitem-card--fail    { border-color: #ffc0c0; background: #fff2f0; }
  .vitem-card--pending { border-color: #d9d9d9; background: #fafafa; }

  .vitem-card__seq { font-size: 12px; color: #8c8c8c; font-weight: 500; letter-spacing: 0.03em; }
  .result-icon { font-size: 36px; line-height: 1; }
  .vitem-card__meta { width: 100%; text-align: center; }
  .vitem-card__result-label { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
  .vitem-card--pass .vitem-card__result-label  { color: #389e0d; }
  .vitem-card--fail .vitem-card__result-label  { color: #cf1322; }
  .vitem-card--pending .vitem-card__result-label { color: #8c8c8c; }
  .vitem-card__info { font-size: 12px; color: #8c8c8c; }
  .vitem-card__note {
    font-size: 12px; color: #595959; margin-top: 4px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
  }
  .vitem-card__action { margin-top: 4px; }

  /* ── MES 时间线 ──────────────────────────────────────────────────── */
  .timeline-item { display: flex; flex-direction: column; gap: 2px; }
  .timeline-action { font-weight: 600; font-size: 14px; }
  .timeline-time { font-size: 12px; color: #8c8c8c; }
  .timeline-note { font-size: 13px; color: #595959; margin-top: 2px; }

  /* ── 结果录入弹窗 ────────────────────────────────────────────────── */
  .fill-modal-body { padding: 4px 0; }

  .result-radio-group { display: flex; gap: 16px; }
  .result-radio-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    border: 2px solid #e8e8e8;
    border-radius: 10px;
    cursor: pointer;
    background: #fafafa;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    touch-action: manipulation;
    user-select: none;
  }
  .result-radio-option:hover { border-color: #d9d9d9; background: #f5f5f5; transform: translateY(-1px); }
  .result-radio-option--active-pass {
    border-color: #52c41a;
    background: #f6ffed;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.15);
  }
  .result-radio-option--active-fail {
    border-color: #ff4d4f;
    background: #fff2f0;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.15);
  }
  .result-radio-icon { font-size: 32px; line-height: 1; }
  .result-radio-text { font-size: 14px; font-weight: 600; color: #1a1a1a; }
</style>