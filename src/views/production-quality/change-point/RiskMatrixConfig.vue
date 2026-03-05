<template>
  <div class="page-container">

    <!-- ══ Toolbar ══════════════════════════════════════════════════════ -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">风险评判矩阵规则配置</span>
        <span class="toolbar-hint">IAFT 16949 / ISO 9001 质量合规引擎</span>
      </div>
      <a-space>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>导出引擎配置
        </a-button>
        <a-button type="primary" @click="showAddModal" id="btn-add-rule">
          <template #icon><PlusOutlined /></template>新增风控规则
        </a-button>
      </a-space>
    </div>

    <!-- 引擎状态说明 -->
    <a-alert
      type="info"
      class="engine-alert"
      show-icon
    >
      <template #message>
        <strong>🦾 自动化风控引擎：规则预判说明</strong>
      </template>
      <template #description>
        系统在接收变化点提报时，将根据「变化类型 + 语义关键词」自动匹配以下规则。
        <strong>高/中风险规则</strong>将强制触发「审批路由升级」及「MES 物理互锁（拦截排产，生成验证任务）」；<strong>低风险规则</strong>则由班组长快速确认放行。
      </template>
    </a-alert>

    <!-- ══ 规则列表区域 ══════════════════════════════════════════════════ -->
    <div class="main-content">
      
      <!-- 左侧分类切换（侧边 Tab 布局更专业） -->
      <div class="category-menu">
        <button
          v-for="opt in changeTypeOptions"
          :key="opt.value"
          class="category-item"
          :class="{ 'category-item--active': activeTab === opt.value }"
          @click="activeTab = opt.value as ChangePointType"
          :aria-selected="activeTab === opt.value"
        >
          <span class="category-item__icon">{{ opt.icon }}</span>
          <span class="category-item__label">{{ opt.label.split(' ')[0] }}</span>
          <span class="category-item__count">{{ getRulesByType(opt.value as ChangePointType).length }}</span>
        </button>
      </div>

      <!-- 右侧规则表格 -->
      <div class="rule-panel">
        <div class="rule-panel__header">
          <div class="panel-title">
            {{ changeTypeOptions.find(o => o.value === activeTab)?.label }} 风险规则
          </div>
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索规则名称或关键词…"
            style="width: 240px"
            size="small"
            allow-clear
          />
        </div>

        <div class="table-container">
          <a-table
            :columns="ruleColumns"
            :data-source="filteredRules"
            :pagination="false"
            row-key="id"
            size="middle"
            :scroll="{ y: 'calc(100vh - 380px)' }"
          >
            <template #bodyCell="{ column, record }">
              
              <!-- 子场景 -->
              <template v-if="column.key === 'subType'">
                <div class="rule-name-cell">
                  <span class="rule-name">{{ record.subType }}</span>
                  <div class="rule-desc" :title="record.description">{{ record.description }}</div>
                </div>
              </template>

              <!-- 关键词 -->
              <template v-else-if="column.key === 'keyword'">
                <div class="keyword-tags">
                  <span v-for="k in record.keyword.split(',').filter((x:any) => x)" :key="k" class="keyword-tag">
                    {{ k }}
                  </span>
                </div>
              </template>

              <!-- 自动定级 -->
              <template v-else-if="column.key === 'defaultRiskLevel'">
                <div class="risk-pill" :class="`risk-pill--${record.defaultRiskLevel}`">
                  <span class="risk-pill__dot"></span>
                  {{ riskLabelMap[record.defaultRiskLevel as RiskLevel] }}
                </div>
              </template>

              <!-- 动作配置汇总 -->
              <template v-else-if="column.key === 'actions'">
                <div class="action-stack">
                  <span class="action-tag" :class="{ 'action-tag--active': record.requireQEApproval }">
                    {{ record.requireDirectorApproval ? '👑 总监审批' : record.requireQEApproval ? '👨‍💻 QE复核' : '👤 班长确认' }}
                  </span>
                  <span v-if="record.requireMesLock" class="action-tag action-tag--lock">🔒 MES互锁</span>
                </div>
              </template>

              <!-- 开关 -->
              <template v-else-if="column.key === 'isActive'">
                <a-switch v-model:checked="record.isActive" size="small" @change="(v: boolean) => toggleRule(record, v)" aria-label="启用/禁用规则" />
              </template>

              <!-- 操作 -->
              <template v-else-if="column.key === 'action'">
                <a-space size="small">
                  <a-button type="link" size="small" @click="editRule(record)">编辑</a-button>
                  <a-popconfirm
                    title="确定删除此规则吗？删除后相同场景的变化点将无法触发自动风控逻辑。"
                    ok-text="确定删除"
                    cancel-text="取消"
                    ok-type="danger"
                    @confirm="deleteRule(record.id)"
                  >
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </div>

    <!-- ══ 新增/编辑规则弹窗 ════════════════════════════════════════════ -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingRule ? '编辑评判规则' : '新增评判规则'"
      width="680px"
      ok-text="应用规则"
      cancel-text="取消"
      @ok="submitRule"
      :destroy-on-close="true"
    >
      <div class="rule-modal">
        <a-form :model="ruleForm" layout="vertical">
          
          <div class="modal-section-title">基本场景定义</div>
          <a-row :gutter="20">
            <a-col :span="10">
              <a-form-item label="管控要素类别" required>
                <a-select v-model:value="ruleForm.changeType"
                  :options="changeTypeOptions.map(o => ({ value: o.value, label: `${o.icon} ${o.label}` }))" />
              </a-form-item>
            </a-col>
            <a-col :span="14">
              <a-form-item label="变化子场景名称" required>
                <a-input v-model:value="ruleForm.subType" placeholder="如：外部供应商临时切换…" autocomplete="off" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="语义触发关键词 (Comma Separated)">
            <a-input v-model:value="ruleForm.keyword" placeholder="大修, 更换, 切换, 维修…" autocomplete="off" />
            <div class="form-item-hint">申报人在填写标题/描述时命中任一词汇，将命中此风控规则。</div>
          </a-form-item>

          <div class="modal-section-title">自动决策动作配置</div>
          <div class="action-config-card">
            
            <a-form-item label="基准风险等级 (Benchmark Risk)" required>
              <div class="risk-selector">
                <label v-for="risk in riskOptions" :key="risk.value" class="risk-opt" :class="[`risk-opt--${risk.value}`, { 'risk-opt--active': ruleForm.defaultRiskLevel === risk.value }]">
                  <input type="radio" v-model="ruleForm.defaultRiskLevel" :value="risk.value" style="display:none">
                  <span class="risk-opt__icon">{{ risk.icon }}</span>
                  <div class="risk-opt__content">
                    <div class="risk-opt__title">{{ risk.label }}</div>
                    <div class="risk-opt__desc">{{ risk.desc }}</div>
                  </div>
                </label>
              </div>
            </a-form-item>

            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="审批路由要求">
                  <div class="custom-check-group">
                    <a-checkbox v-model:checked="ruleForm.requireQEApproval">
                      <div class="check-label-wrap">
                        <span class="check-main">需要 QE 复核</span>
                        <span class="check-sub">将流转至 QE/品质经理工作台</span>
                      </div>
                    </a-checkbox>
                    <a-checkbox v-model:checked="ruleForm.requireDirectorApproval" :disabled="!ruleForm.requireQEApproval">
                      <div class="check-label-wrap">
                        <span class="check-main">需要总监签批</span>
                        <span class="check-sub">关键决策升级至品质总监层级</span>
                      </div>
                    </a-checkbox>
                  </div>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="物理防御干预">
                  <div class="lock-config-box" :class="{ 'lock-config-box--active': ruleForm.requireMesLock }">
                    <a-checkbox v-model:checked="ruleForm.requireMesLock">
                      <div class="check-label-wrap">
                        <span class="check-main">启用 MES 互锁</span>
                        <span class="check-sub">审批即触发机台锁定，拦截异常报工</span>
                      </div>
                    </a-checkbox>
                  </div>
                </a-form-item>
              </a-col>
            </a-row>
          </div>

          <a-form-item label="审计依据说明 / 条款追溯">
            <a-textarea v-model:value="ruleForm.description" :rows="3" placeholder="填写 IATF 16949 / ISO 9001 条款号或企业内控制度编号…" autocomplete="off" :spellcheck="false" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import { PlusOutlined, ExportOutlined } from '@ant-design/icons-vue'
  import { message } from 'ant-design-vue'
  import type { RiskMatrixRule, ChangePointType, RiskLevel } from '@/types/change-point'
  import { CHANGE_TYPE_OPTIONS } from '@/types/change-point'

  const changeTypeOptions = CHANGE_TYPE_OPTIONS
  const activeTab = ref<ChangePointType>('man')
  const searchKeyword = ref('')

  const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }
  const riskOptions = [
    { value: 'low',    label: '低风险 (Low)', icon: '🟢', desc: '基层闭环建议项' },
    { value: 'medium', label: '中风险 (Medium)', icon: '🟡', desc: '需验证与复核管控' },
    { value: 'high',   label: '高风险 (High)', icon: '🔴', desc: '体系强制封锁拦截' },
  ]

  const rules = ref<RiskMatrixRule[]>([
    { id: '1', changeType: 'man', subType: '新员工上岗', keyword: '新员工,入职,实习期', defaultRiskLevel: 'low', requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, description: 'ISO 9001:2015 条款 7.2 能力要求', isActive: true },
    { id: '2', changeType: 'man', subType: '关键工位技能调整', keyword: '调岗,特殊工位,技能鉴定', defaultRiskLevel: 'medium', requireQEApproval: true, requireDirectorApproval: false, requireMesLock: false, description: 'IATF 16949 条款 7.2.1 岗位要求', isActive: true },
    { id: '3', changeType: 'machine', subType: '核心设备大修/换模', keyword: '模具,换模,大修,模具维修', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, description: 'IATF 16949 条款 8.5.1.5 全面生产维护', isActive: true },
    { id: '6', changeType: 'material', subType: '材料供应商临时切换', keyword: '供应商,铝锭切换,采购变更', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, description: 'IATF 16949 条款 8.4.2.4 供应商性能监控', isActive: true },
    { id: '8', changeType: 'method', subType: '工艺关键参数修正', keyword: '射速,压力,温度窗口,参数', defaultRiskLevel: 'medium', requireQEApproval: true, requireDirectorApproval: false, requireMesLock: true, description: 'IATF 16949 条款 8.5.6 更改控制', isActive: true },
    { id: '11', changeType: 'measure', subType: '精密检具校准超期', keyword: '检具维修,校准,失准', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, description: 'ISO 9001:2015 条款 7.1.5 监视和测量资源', isActive: true },
  ])

  const getRulesByType = (type: ChangePointType) => rules.value.filter(r => r.changeType === type)

  const filteredRules = computed(() => {
    const r = getRulesByType(activeTab.value)
    if (!searchKeyword.value) return r
    return r.filter(it => it.subType.includes(searchKeyword.value) || it.keyword.includes(searchKeyword.value))
  })

  const ruleColumns = [
    { title: '规则名称及说明', key: 'subType', minWidth: 200 },
    { title: '触发关键词', key: 'keyword', width: 160 },
    { title: '风险预判', key: 'defaultRiskLevel', width: 90 },
    { title: '执行动作', key: 'actions', width: 170 },
    { title: '启用', key: 'isActive', width: 68 },
    { title: '操作选项', key: 'action', width: 120, fixed: 'right' as const },
  ]

  // ── 弹窗逻辑 ────────────────────────────────────────────────────────
  const modalVisible = ref(false)
  const editingRule = ref<RiskMatrixRule | null>(null)
  const ruleForm = reactive<Partial<RiskMatrixRule>>({
    changeType: 'machine', subType: '', keyword: '', defaultRiskLevel: 'medium',
    requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, description: '', isActive: true,
  })

  const showAddModal = () => {
    editingRule.value = null
    Object.assign(ruleForm, {
      changeType: activeTab.value, subType: '', keyword: '', defaultRiskLevel: 'medium',
      requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, description: '',
    })
    modalVisible.value = true
  }

  const editRule = (rule: RiskMatrixRule) => {
    editingRule.value = rule
    Object.assign(ruleForm, { ...rule })
    modalVisible.value = true
  }

  const submitRule = () => {
    if (!ruleForm.subType) return message.warning('请填写规则名称')
    if (editingRule.value) {
      Object.assign(editingRule.value, { ...ruleForm })
      message.success('风控规则已更新并动态同步至评审引擎')
    } else {
      rules.value.push({ ...ruleForm, id: `r${Date.now()}` } as RiskMatrixRule)
      message.success('新规则已挂载至评判引擎')
    }
    modalVisible.value = false
  }

  const toggleRule = (rule: RiskMatrixRule, active: boolean) => {
    message.success(`规则 「${rule.subType}」 已${active ? '挂载启用' : '卸载停用'}`)
  }

  const deleteRule = (id: string) => {
    const idx = rules.value.findIndex(r => r.id === id)
    if (idx >= 0) {
      rules.value.splice(idx, 1)
      message.success('已从评判引擎中永久移除此规则')
    }
  }

  const handleExport = () => message.info('正在导出 CSV 格式评判规则配置文件…')
</script>

<style scoped>
  /* 基础容器 */
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ════ Toolbar ════ */
  .toolbar {
    background: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .toolbar-left { display: flex; flex-direction: column; }
  .toolbar-title { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .toolbar-hint { font-size: 12px; color: #8c8c8c; margin-top: 2px; }

  /* 引擎公告 */
  .engine-alert { border-radius: 8px; border-color: #bae0ff; }

  /* ════ 主体：侧边 Tab 布局 ════ */
  .main-content {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 16px;
    flex: 1;
    align-items: start;
  }

  /* 目录侧栏 */
  .category-menu {
    background: #fff;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .category-item {
    appearance: none; border: none; background: transparent; font-family: inherit;
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 6px; cursor: pointer; text-align: left;
    transition: background 0.15s, color 0.15s, transform 0.1s;
    touch-action: manipulation;
  }
  .category-item:hover { background: #f5f5f5; }
  .category-item:active { transform: scale(0.98); }
  .category-item--active { background: #1677ff; color: #fff; font-weight: 700; }
  .category-item__icon { font-size: 18px; }
  .category-item__label { flex: 1; font-size: 14px; }
  .category-item__count { font-size: 11px; font-weight: 400; opacity: 0.8; }

  /* 规则面板 */
  .rule-panel {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .rule-panel__header {
    padding: 14px 20px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-title { font-size: 14px; font-weight: 700; color: #1a1a1a; }

  /* ════ 表格单元格 ════ */
  .rule-name-cell { display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
  .rule-name { font-size: 14px; font-weight: 600; color: #262626; }
  .rule-desc {
    font-size: 12px; color: #8c8c8c;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 300px;
  }

  .keyword-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .keyword-tag {
    font-family: 'Consolas', 'Menlo', monospace;
    font-size: 11px; background: #fafafa; border: 1px solid #f0f0f0;
    color: #595959; padding: 1px 6px; border-radius: 4px;
  }

  .risk-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 20px;
  }
  .risk-pill--high   { background: #fff2f0; color: #cf1322; border: 1px solid #ffccc7; }
  .risk-pill--medium { background: #fffbe6; color: #d48806; border: 1px solid #ffe58f; }
  .risk-pill--low    { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
  .risk-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  .action-stack { display: flex; flex-wrap: wrap; gap: 6px; }
  .action-tag {
    font-size: 11px; font-weight: 600; color: #8c8c8c;
    padding: 1px 6px; border-radius: 4px; background: #f5f5f5;
  }
  .action-tag--active { background: #e6f4ff; color: #1677ff; }
  .action-tag--lock   { background: #fff2f0; color: #ff4d4f; border: 1px dashed #ffccc7; }

  /* ════ 弹窗容器 ════ */
  .rule-modal { padding-top: 4px; }
  .modal-section-title {
    font-size: 13px; font-weight: 700; color: #595959;
    margin: 20px 0 10px; padding-left: 8px; border-left: 3px solid #1677ff;
  }
  .form-item-hint { font-size: 12px; color: #8c8c8c; margin-top: 4px; line-height: 1.5; }

  .action-config-card {
    background: #fafafa;
    border: 1.5px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 20px;
  }

  /* 风险大选卡 */
  .risk-selector { display: flex; gap: 10px; margin-bottom: 8px; }
  .risk-opt {
    flex: 1; display: flex; align-items: flex-start; gap: 10px;
    padding: 12px; border-radius: 8px; border: 2px solid #e8e8e8;
    background: #fff; cursor: pointer; transition: all 0.2s;
    touch-action: manipulation;
  }
  .risk-opt:hover { border-color: #d9d9d9; transform: translateY(-1px); }
  .risk-opt--active { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .risk-opt--low.risk-opt--active    { border-color: #52c41a; background: #f6ffed; }
  .risk-opt--medium.risk-opt--active { border-color: #faad14; background: #fffbe6; }
  .risk-opt--high.risk-opt--active   { border-color: #ff4d4f; background: #fff2f0; }

  .risk-opt__icon { font-size: 20px; margin-top: 2px; }
  .risk-opt__title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
  .risk-opt__desc  { font-size: 11px; color: #8c8c8c; line-height: 1.3; }

  /* 复选按钮装饰 */
  .check-label-wrap { display: flex; flex-direction: column; margin-left: 4px; }
  .check-main { font-size: 13px; font-weight: 600; color: #262626; line-height: 1.4; }
  .check-sub  { font-size: 11px; color: #8c8c8c; font-weight: 400; }

  .custom-check-group { display: flex; flex-direction: column; gap: 12px; }
  
  .lock-config-box {
    padding: 12px; border-radius: 6px; border: 1.5px solid #e8e8e8; background: #fff;
    transition: border-color 0.2s, background 0.2s;
  }
  .lock-config-box--active {
    border-color: #ffccc7; background: #fff2f0;
  }
</style>