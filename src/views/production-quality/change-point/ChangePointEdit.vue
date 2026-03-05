<template>
  <div class="page-container">

    <!-- ══ 页头：面包屑 + 状态 + 操作按钮 ═══════════════════════════════ -->
    <div class="page-header">
      <div class="page-header__left">
        <button class="back-btn" @click="goBack" aria-label="返回台账列表">
          <ArrowLeftOutlined />
          <span>台账列表</span>
        </button>
        <a-divider type="vertical" style="height:20px; margin: 0 12px;" />
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div v-if="formData.status" class="header-tags">
          <a-tag :color="statusConfig[formData.status as ChangePointStatus].color as any">
            {{ statusConfig[formData.status as ChangePointStatus].label }}
          </a-tag>
          <span
            v-if="formData.riskLevel"
            class="risk-badge"
            :class="`risk-badge--${formData.riskLevel}`"
          >{{ riskLabelMap[formData.riskLevel as RiskLevel] }}</span>
        </div>
      </div>
      <div class="page-header__actions">
        <a-space>
          <a-button v-if="!isView" @click="saveDraft" :disabled="saving">暂存草稿</a-button>
          <a-button v-if="!isView" type="primary" @click="handleSubmit" :loading="saving" id="btn-submit-change-point">
            {{ isEdit ? '保存修改' : '提交申报' }}
          </a-button>
          <a-button
            v-if="isView && formData.status === 'approving'"
            type="primary"
            class="btn--warn"
            @click="approveModalVisible = true"
            id="btn-approve-change-point"
          >审批决策</a-button>
          <a-button
            v-if="isView && ['locked', 'verifying'].includes(formData.status as string)"
            type="primary"
            @click="goToVerification"
          >前往验证任务</a-button>
          <a-button
            v-if="isView && formData.status === 'released'"
            @click="openCloseLoop"
          >标记闭环</a-button>
        </a-space>
      </div>
    </div>

    <!-- MES 锁机活跃横幅 -->
    <a-alert
      v-if="formData.status === 'locked'"
      type="error"
      show-icon
      class="mes-lock-banner"
    >
      <template #message>
        <strong>🔒 MES 互锁中 — 机台已锁定，批量报工已被防错拦截</strong>
      </template>
      <template #description>
        锁机时间：{{ formatDate(formData.mesLockTime || '') }}。验证通过并确认放行后，系统将自动解锁。
      </template>
      <template #action>
        <a-button size="small" @click="goToVerification">查看验证任务</a-button>
      </template>
    </a-alert>

    <!-- ══ 表单主体（两栏布局：左宽右窄）═══════════════════════════════ -->
    <a-form ref="formRef" :model="formData" layout="vertical">
      <div class="form-layout">

        <!-- ── 左栏：主要信息 ──────────────────────────────────────────── -->
        <div class="form-main">

          <!-- 1. 基本信息 -->
          <div class="form-section">
            <div class="section-heading">
              <span class="section-icon">📋</span>
              <span>基本信息</span>
            </div>
            <div class="section-body">
              <a-row :gutter="20">
                <a-col :span="8">
                  <a-form-item label="变化点单号">
                    <a-input :value="formData.recordNo || '（系统自动生成）'" disabled autocomplete="off" />
                  </a-form-item>
                </a-col>
                <a-col :span="10">
                  <a-form-item label="变化点标题" name="title" :rules="[{ required: true, message: '请填写标题' }]">
                    <a-input
                      v-model:value="formData.title"
                      placeholder="简洁描述本次变化，如：MC-02 换模具…"
                      :disabled="isView"
                      autocomplete="off"
                      :spellcheck="false"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="提报人">
                    <a-input :value="formData.reporter?.name" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- 2. 4M1E 变化分类 -->
          <div class="form-section">
            <div class="section-heading">
              <span class="section-icon">🏷️</span>
              <span>4M1E 变化分类</span>
              <span class="section-hint">选择后系统自动评估初始风险等级</span>
            </div>
            <div class="section-body">

              <!-- 申报/编辑模式：大图标选择器 -->
              <div v-if="!isView" class="type-selector" role="radiogroup" aria-label="变化类型">
                <label
                  v-for="opt in changeTypeOptions"
                  :key="opt.value"
                  class="type-card"
                  :class="{ 'type-card--active': formData.changeDetail.changeType === opt.value }"
                  :style="formData.changeDetail.changeType === opt.value
                    ? { borderColor: opt.color, background: opt.color + '14' }
                    : {}"
                  :aria-label="opt.label"
                >
                  <input
                    type="radio"
                    :name="'changeType'"
                    :value="opt.value"
                    v-model="formData.changeDetail.changeType"
                    style="display:none"
                  />
                  <span class="type-card__icon" aria-hidden="true">{{ opt.icon }}</span>
                  <span class="type-card__label">{{ opt.label.split(' ')[0] }}</span>
                  <span class="type-card__sub">{{ opt.label.split(' ').slice(1).join('') }}</span>
                </label>
              </div>

              <!-- 查看模式：静态展示 -->
              <div v-else class="type-display">
                <span class="type-pill" :style="{ background: typeColorBg[formData.changeDetail.changeType as ChangePointType], color: typeColor[formData.changeDetail.changeType as ChangePointType] }">
                  {{ typeIconMap[formData.changeDetail.changeType as ChangePointType] }}
                  {{ typeLabelMap[formData.changeDetail.changeType as ChangePointType] }}
                </span>
              </div>

              <a-row :gutter="20" style="margin-top: 20px;">
                <a-col :span="8">
                  <a-form-item label="变化子类型">
                    <a-select
                      v-model:value="formData.changeDetail.changeSubType"
                      placeholder="选择子类型…"
                      :options="subTypeOptions"
                      :disabled="isView"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="受影响机台 / 工序">
                    <a-input v-model:value="formData.changeDetail.affectedMachine" placeholder="如：MC-02 / 压铸工序" :disabled="isView" autocomplete="off" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="受影响产品 / 物料">
                    <a-input v-model:value="formData.changeDetail.affectedProduct" placeholder="如：产品型号 / 物料编码" :disabled="isView" autocomplete="off" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="变化详细描述" name="changeDetail.changeDescription" :rules="[{ required: true, message: '请详细描述变化内容' }]">
                    <a-textarea
                      v-model:value="formData.changeDetail.changeDescription"
                      :rows="4"
                      placeholder="详细描述变化内容、产生原因及影响范围…"
                      :disabled="isView"
                      :spellcheck="false"
                      autocomplete="off"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- 3. 风险评估 -->
          <div class="form-section">
            <div class="section-heading">
              <span class="section-icon">⚠️</span>
              <span>风险评估</span>
            </div>
            <div class="section-body">
              <a-row :gutter="20">
                <!-- 自动定级结果大显示块 -->
                <a-col :span="7">
                  <div class="risk-result-block" :class="`risk-result-block--${formData.riskLevel}`">
                    <div class="risk-result-block__icon">{{ riskIconMap[formData.riskLevel as RiskLevel] }}</div>
                    <div class="risk-result-block__label">{{ riskLabelMap[formData.riskLevel as RiskLevel] }}</div>
                    <div class="risk-result-block__hint">{{ riskHintMap[formData.riskLevel as RiskLevel] }}</div>
                  </div>
                </a-col>
                <a-col :span="17">
                  <a-form-item label="风险分析补充">
                    <a-textarea
                      v-model:value="formData.riskDescription"
                      :rows="4"
                      placeholder="补充说明潜在风险点及对产品质量的影响范围…"
                      :disabled="isView"
                      :spellcheck="false"
                      autocomplete="off"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-alert v-if="formData.riskLevel === 'high'" type="error" show-icon banner style="border-radius: 6px; margin-top: 4px;"
                message="高风险警戒：需品质总监审批，审批通过后立即触发 MES 锁机，验证通过前禁止批量报工。" />
              <a-alert v-else-if="formData.riskLevel === 'medium'" type="warning" show-icon banner style="border-radius: 6px; margin-top: 4px;"
                message="中风险提示：需 QE 工程师审批，审批通过后触发 MES 锁机并生成试生产验证任务。" />
            </div>
          </div>

          <!-- 4. 附件 -->
          <div class="form-section">
            <div class="section-heading">
              <span class="section-icon">📎</span>
              <span>附件上传</span>
            </div>
            <div class="section-body">
              <a-upload-dragger :disabled="isView" :file-list="[]" :before-upload="() => false" aria-label="上传变化点相关附件">
                <div class="upload-hint-area">
                  <div class="upload-hint-icon" aria-hidden="true">📁</div>
                  <p class="upload-hint-title">点击或拖拽文件至此区域上传</p>
                  <p class="upload-hint-desc">支持图片、文档，可上传现场照片、技术要求等</p>
                </div>
              </a-upload-dragger>
            </div>
          </div>
        </div>

        <!-- ── 右栏：状态与流程追踪 ──────────────────────────────────── -->
        <div class="form-sidebar">

          <!-- 审批进度卡 -->
          <div class="sidebar-card">
            <div class="sidebar-card__title">📊 处理进度</div>
            <a-steps :current="workflowStep" direction="vertical" size="small" :items="workflowSteps" />
          </div>

          <!-- MES 互锁状态卡（有锁机才显示） -->
          <div v-if="formData.mesLockTime" class="sidebar-card sidebar-card--danger">
            <div class="sidebar-card__title">🔒 MES 互锁状态</div>
            <div class="mes-status-row">
              <a-badge status="error" text="机台锁定中" v-if="!formData.mesUnlockTime" />
              <a-badge status="success" text="已解锁" v-else />
            </div>
            <div class="mes-time-item">
              <span class="mes-time-label">锁机时间</span>
              <span class="mes-time-val">{{ formatDate(formData.mesLockTime) }}</span>
            </div>
            <div v-if="formData.mesUnlockTime" class="mes-time-item">
              <span class="mes-time-label">解锁时间</span>
              <span class="mes-time-val">{{ formatDate(formData.mesUnlockTime) }}</span>
            </div>
            <a-timeline v-if="formData.mesLockLog?.length" style="margin-top: 12px;">
              <a-timeline-item
                v-for="log in formData.mesLockLog"
                :key="log.id"
                :color="log.action === 'violation' ? 'red' : log.action === 'lock' ? 'orange' : 'green'"
              >
                <div class="log-line">
                  <span class="log-action">{{ log.action === 'lock' ? '🔒 锁机' : log.action === 'unlock' ? '🔓 解锁' : '🚨 违规报工' }}</span>
                  <span class="log-time">{{ formatDate(log.operatorTime) }}</span>
                </div>
                <div v-if="log.note" class="log-note">{{ log.note }}</div>
              </a-timeline-item>
            </a-timeline>
          </div>

          <!-- 审批意见卡（已审批才显示） -->
          <div v-if="formData.approveComment" class="sidebar-card">
            <div class="sidebar-card__title">✍️ 审批意见</div>
            <div class="approve-comment-body">
              <div class="approve-comment-who">{{ formData.approver }} · {{ formatDate(formData.approveTime || '') }}</div>
              <blockquote class="approve-comment-text">{{ formData.approveComment }}</blockquote>
            </div>
          </div>

        </div>
      </div>
    </a-form>

    <!-- ══ 审批决策弹窗 ══════════════════════════════════════════════════ -->
    <a-modal
      v-model:open="approveModalVisible"
      title="审批决策"
      width="520px"
      ok-text="提交审批结果"
      cancel-text="取消"
      @ok="submitApproval"
      :destroy-on-close="true"
    >
      <a-form :model="approveForm" layout="vertical">
        <a-form-item label="审批结果" required>
          <div class="approve-radio-group">
            <label class="approve-radio-option" :class="{ 'approve-radio-option--approve': approveForm.result === 'approved' }">
              <input type="radio" v-model="approveForm.result" value="approved" style="display:none">
              <span class="approve-radio-icon">✅</span>
              <div>
                <div class="approve-radio-title">批准通过</div>
                <div class="approve-radio-hint">{{ ['medium', 'high'].includes(formData.riskLevel || '') ? '将自动触发 MES 锁机并生成验证任务' : '低风险，直接放行' }}</div>
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
          <a-textarea v-model:value="approveForm.comment" :rows="3" placeholder="填写审批意见或驳回原因…" autocomplete="off" :spellcheck="false" />
        </a-form-item>
        <a-alert
          v-if="approveForm.result === 'approved' && ['medium', 'high'].includes(formData.riskLevel || '')"
          type="warning" show-icon
          message="注意：批准后将自动调用 MES 接口发送锁机指令，并生成试生产验证任务，请确认无误后提交。"
        />
      </a-form>
    </a-modal>

    <!-- ══ 闭环确认弹窗 ══════════════════════════════════════════════════ -->
    <a-modal
      v-model:open="closeLoopModalVisible"
      title="标记闭环"
      ok-text="确认闭环"
      cancel-text="取消"
      @ok="submitCloseLoop"
      :destroy-on-close="true"
    >
      <a-form layout="vertical">
        <a-form-item label="闭环说明">
          <a-textarea v-model:value="closeLoopComment" :rows="4" placeholder="说明变化已稳定生产，可正式闭环…" autocomplete="off" :spellcheck="false" />
        </a-form-item>
        <a-form-item label="是否触发关联文件升版？">
          <a-switch v-model:checked="triggerDocUpdate" checked-children="是" un-checked-children="否" />
          <span v-if="triggerDocUpdate" class="doc-update-hint">将提示技术部触发 SOP / CP / FMEA 等文件升版</span>
        </a-form-item>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ArrowLeftOutlined } from '@ant-design/icons-vue'
  import { message, Empty } from 'ant-design-vue'
  import dayjs from 'dayjs'
  import type { ChangePointRecord, ChangePointType, RiskLevel, ChangePointStatus } from '@/types/change-point'
  import { STATUS_CONFIG, CHANGE_TYPE_OPTIONS } from '@/types/change-point'

  const router = useRouter()
  const route = useRoute()

  const isEdit   = computed(() => route.path.includes('/edit/'))
  const isView   = computed(() => route.path.includes('/view/'))
  const pageTitle = computed(() => isEdit.value ? '编辑申报单' : isView.value ? '变化点详情' : '新增变化点申报')

  const statusConfig = STATUS_CONFIG
  const changeTypeOptions = CHANGE_TYPE_OPTIONS

  // ── 颜色 / 标签映射 ────────────────────────────────────────────────
  const typeIconMap: Record<ChangePointType, string> = { man: '👷', machine: '🏭', material: '📦', method: '📋', environment: '🌡️', measure: '📐', other: '📝' }
  const typeLabelMap: Record<ChangePointType, string> = { man: '人 (Man)', machine: '机 (Machine)', material: '料 (Material)', method: '法 (Method)', environment: '环 (Env)', measure: '测 (Measure)', other: '其他' }
  const typeColor: Record<ChangePointType, string> = { man: '#1677ff', machine: '#531dab', material: '#d46b08', method: '#08979c', environment: '#389e0d', measure: '#c41d7f', other: '#8c8c8c' }
  const typeColorBg: Record<ChangePointType, string> = { man: '#e6f4ff', machine: '#efdbff', material: '#fff7e6', method: '#e6fffb', environment: '#f6ffed', measure: '#fff0f6', other: '#f5f5f5' }
  const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }
  const riskIconMap:  Record<RiskLevel, string> = { low: '🟢', medium: '🟡', high: '🔴' }
  const riskHintMap:  Record<RiskLevel, string> = {
    low: '班组长确认即可放行',
    medium: 'QE 审批 + MES 锁机 + 试产验证',
    high: '总监审批 + MES 锁机 + 强制试产验证',
  }

  const subTypeMap: Record<ChangePointType, string[]> = {
    man: ['新员工上岗', '岗位调整', '班次变更'],
    machine: ['新设备引入', '设备大修', '设备改造', '模具更换', '维护后复产'],
    material: ['新材料导入', '规格变更', '供应商变更', '批次切换'],
    method: ['新工艺引入', '工艺参数调整', '流程优化'],
    environment: ['温湿度变化', '生产线搬迁', '环境改造'],
    measure: ['新检具引入', '检具更换', '测量方法变更'],
    other: ['客户要求变更', '法规要求变更', '临时工艺调整'],
  }

  const subTypeOptions = computed(() =>
    (subTypeMap[formData.changeDetail.changeType as ChangePointType] || []).map(v => ({ value: v, label: v }))
  )

  // ── 表单数据 ────────────────────────────────────────────────────────
  const formData = reactive<Partial<ChangePointRecord> & { changeDetail: any }>({
    recordNo: '', title: '',
    reporter: { id: 'u0', name: '当前用户', department: '品质部' },
    reportTime: new Date().toISOString(),
    changeDetail: { changeType: 'machine', changeSubType: '', changeDescription: '', affectedMachine: '', affectedProduct: '' },
    riskLevel: 'medium', riskDescription: '', status: 'draft', mesLockLog: [],
  })

  // ── 工作流步骤（右侧进度）──────────────────────────────────────────
  const workflowStep = computed(() => {
    const map: Record<string, number> = {
      draft: 0, submitted: 1, approving: 1, approved: 2, locked: 3, verifying: 3, released: 4, closed: 5, rejected: 1,
    }
    return map[formData.status as string] ?? 0
  })
  const workflowSteps = [
    { title: '草稿', description: '申报人填写' },
    { title: '提报审批', description: '流转至相关人审批' },
    { title: '审批通过', description: '系统触发 MES 锁机' },
    { title: '试产验证', description: 'IPQC 现场逐件验证' },
    { title: '放行解锁', description: '机台恢复正常生产' },
    { title: '闭环归档', description: '文件升版并沉淀经验库' },
  ]

  // ── 弹窗状态 ────────────────────────────────────────────────────────
  const formRef = ref()
  const saving = ref(false)
  const approveModalVisible = ref(false)
  const approveForm = reactive({ result: 'approved', comment: '' })
  const closeLoopModalVisible = ref(false)
  const closeLoopComment = ref('')
  const triggerDocUpdate = ref(false)

  // ── 操作方法 ────────────────────────────────────────────────────────
  const formatDate = (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : ''
  const goBack = () => router.push('/production-quality/change-point/list')
  const goToVerification = () => router.push(`/production-quality/change-point/verification?changePointId=${formData.id || 'demo'}`)

  const handleSubmit = async () => {
    saving.value = true
    setTimeout(() => {
      saving.value = false
      message.success('提交成功！')
      goBack()
    }, 600)
  }

  const saveDraft = () => message.success('草稿已保存')

  const submitApproval = () => {
    if (approveForm.result === 'approved') {
      formData.status = ['medium', 'high'].includes(formData.riskLevel || '') ? 'locked' : 'released'
      message.success('审批通过！')
    } else {
      formData.status = 'rejected'
      message.warning('已驳回。')
    }
    approveModalVisible.value = false
  }

  const openCloseLoop = () => {
    closeLoopComment.value = ''
    triggerDocUpdate.value = false
    closeLoopModalVisible.value = true
  }

  const submitCloseLoop = () => {
    formData.status = 'closed'
    message.success('已完成闭环归档！')
    closeLoopModalVisible.value = false
  }

  onMounted(() => {
    const id = route.params.id as string
    if (id && (isEdit.value || isView.value)) {
      formData.id = id
      formData.recordNo = `CPR-20240305-00${id}`
      formData.title = id === '1' ? '关键机台 #MC-02 大修更换模具' : id === '2' ? '核心原料供应商切换 - 铝锭' : '变化点详情'
      formData.riskLevel = id === '3' ? 'low' : id === '1' ? 'high' : 'medium'
      formData.status = id === '1' ? 'locked' : id === '2' ? 'approving' : 'approved'
      formData.changeDetail.changeType = id === '1' ? 'machine' : id === '2' ? 'material' : 'man'
      formData.changeDetail.changeSubType = id === '1' ? '模具更换' : '材料供应商变更'
      formData.changeDetail.changeDescription = id === '1'
        ? '压铸模具A长期使用老化，本次更换新模具，需验证尺寸精度及表面质量稳定性。'
        : '原铝锭供应商因产能问题无法供货，临时切换至备选供应商B，需验证材料化学成分及机械性能。'
      if (id === '1') {
        formData.mesLockTime = '2024-03-05T09:00:00'
        formData.mesLockLog = [
          { id: 'l1', action: 'lock', machineNo: 'MC-02', operatorTime: '2024-03-05T09:00:00', result: 'success', note: '审批通过，系统自动锁机' },
        ]
      }
      if (id !== '1' && id !== '2') {
        formData.approver = '王 QE'
        formData.approveTime = '2024-03-05T10:30:00'
        formData.approveComment = '变化影响范围已评估，同意批准，请按要求进行试产首件验证后放行。'
      }
    }
  })
</script>

<style scoped>
  /* ── 基础 ────────────────────────────────────────────────────────────── */
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  /* ── 页头 ─────────────────────────────────────────────────────────────── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    padding: 14px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    flex-wrap: wrap;
    gap: 12px;
  }
  .page-header__left { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

  .back-btn {
    appearance: none; border: none; background: transparent; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: #595959; cursor: pointer; padding: 4px 8px;
    border-radius: 4px; transition: background 0.15s, color 0.15s;
    touch-action: manipulation;
  }
  .back-btn:hover { background: #f5f5f5; color: #1a1a1a; }
  .back-btn:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; }

  .page-title {
    font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0;
    text-wrap: balance;
  }

  .header-tags { display: flex; align-items: center; gap: 8px; }

  .risk-badge {
    font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 20px;
  }
  .risk-badge--low    { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
  .risk-badge--medium { background: #fffbe6; color: #d48806; border: 1px solid #ffd591; }
  .risk-badge--high   { background: #fff2f0; color: #cf1322; border: 1px solid #ffc0c0; }

  .btn--warn { background: #fa8c16; border-color: #fa8c16; }
  .btn--warn:hover { background: #ffa940; border-color: #ffa940; }

  /* ── MES 锁机横幅 ────────────────────────────────────────────────────── */
  .mes-lock-banner {
    margin-bottom: 16px;
    border-radius: 8px;
    border-color: #ffc0c0;
  }

  /* ── 双栏表单布局 ─────────────────────────────────────────────────────── */
  .form-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    align-items: start;
  }

  .form-main { display: flex; flex-direction: column; gap: 16px; }

  /* ── 表单分区卡 ──────────────────────────────────────────────────────── */
  .form-section {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow: hidden;
  }
  .section-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 1px solid #f5f5f5;
    background: #fafafa;
  }
  .section-icon { font-size: 16px; }
  .section-hint { font-size: 12px; color: #fa8c16; font-weight: 400; margin-left: 4px; }
  .section-body { padding: 20px; }

  /* ── 4M1E 选择器 ─────────────────────────────────────────────────────── */
  .type-selector {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
  }
  .type-card {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 12px 6px; border-radius: 8px; border: 2px solid #e8e8e8;
    background: #fafafa; cursor: pointer; text-align: center;
    transition: border-color 0.18s, background 0.18s, transform 0.15s;
    touch-action: manipulation; user-select: none;
  }
  .type-card:hover { border-color: #d9d9d9; transform: translateY(-1px); }
  .type-card:focus-within { outline: 2px solid #1677ff; outline-offset: 2px; }
  .type-card--active { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .type-card__icon { font-size: 24px; line-height: 1; }
  .type-card__label { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .type-card__sub { font-size: 11px; color: #8c8c8c; }

  .type-display { padding: 4px 0; }
  .type-pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 14px; font-weight: 600; padding: 4px 14px; border-radius: 20px;
  }

  /* ── 风险评估显示块 ───────────────────────────────────────────────────── */
  .risk-result-block {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 20px 12px; border-radius: 8px; border: 1.5px solid; height: 100%;
    min-height: 120px; text-align: center;
  }
  .risk-result-block--low    { background: #f6ffed; border-color: #b7eb8f; }
  .risk-result-block--medium { background: #fffbe6; border-color: #ffd591; }
  .risk-result-block--high   { background: #fff2f0; border-color: #ffc0c0; }
  .risk-result-block__icon  { font-size: 28px; margin-bottom: 8px; }
  .risk-result-block__label { font-size: 16px; font-weight: 800; margin-bottom: 6px; color: #1a1a1a; }
  .risk-result-block__hint  { font-size: 12px; color: #595959; line-height: 1.5; }

  /* ── 上传区域 ─────────────────────────────────────────────────────────── */
  .upload-hint-area { padding: 16px; text-align: center; }
  .upload-hint-icon { font-size: 36px; margin-bottom: 8px; }
  .upload-hint-title { font-size: 14px; color: #262626; font-weight: 500; margin: 0 0 4px; }
  .upload-hint-desc  { font-size: 12px; color: #8c8c8c; margin: 0; }

  /* ── 右侧边栏 ─────────────────────────────────────────────────────────── */
  .form-sidebar { display: flex; flex-direction: column; gap: 16px; }

  .sidebar-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    border: 1px solid transparent;
  }
  .sidebar-card--danger { border-color: #ffc0c0; background: #fff8f6; }
  .sidebar-card__title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 14px; }

  .mes-status-row { margin-bottom: 10px; }
  .mes-time-item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
  .mes-time-label { color: #8c8c8c; }
  .mes-time-val   { font-weight: 600; color: #1a1a1a; font-variant-numeric: tabular-nums; }

  .log-line { display: flex; justify-content: space-between; font-size: 13px; }
  .log-action { font-weight: 600; }
  .log-time   { color: #8c8c8c; font-size: 11px; font-variant-numeric: tabular-nums; }
  .log-note   { font-size: 12px; color: #595959; background: #fff; padding: 4px 8px; border-radius: 4px; border-left: 3px solid #d9d9d9; margin-top: 4px; }

  .approve-comment-who   { font-size: 12px; color: #8c8c8c; margin-bottom: 6px; }
  .approve-comment-text  { font-size: 13px; color: #434343; margin: 0; padding: 8px 10px; background: #fafafa; border-left: 3px solid #1677ff; border-radius: 4px; line-height: 1.6; }

  /* ── 审批决策弹窗 ──────────────────────────────────────────────────── */
  .approve-radio-group { display: flex; gap: 12px; }
  .approve-radio-option {
    flex: 1; display: flex; align-items: flex-start; gap: 12px; padding: 14px;
    border-radius: 8px; border: 2px solid #e8e8e8; background: #fafafa;
    cursor: pointer; transition: border-color 0.18s, background 0.18s;
    touch-action: manipulation; user-select: none;
  }
  .approve-radio-option:hover { border-color: #d9d9d9; }
  .approve-radio-option--approve { border-color: #52c41a; background: #f6ffed; }
  .approve-radio-option--reject  { border-color: #ff4d4f; background: #fff2f0; }
  .approve-radio-icon { font-size: 22px; flex-shrink: 0; }
  .approve-radio-title { font-weight: 700; font-size: 14px; color: #1a1a1a; margin-bottom: 3px; }
  .approve-radio-hint  { font-size: 12px; color: #8c8c8c; line-height: 1.5; }

  /* ── 闭环弹窗 ──────────────────────────────────────────────────────── */
  .doc-update-hint { margin-left: 10px; font-size: 12px; color: #fa8c16; }
</style>