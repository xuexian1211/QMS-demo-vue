<template>
  <div class="page-container">
    <div class="split-layout">
      <!-- 左侧：抽样方案管理 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">抽样方案</span>
          <a-space>
            <a-tooltip title="新增方案">
              <a-button type="primary" size="small" shape="circle" @click="handleCreatePlan">
                <template #icon>
                  <PlusOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="刷新">
              <a-button size="small" shape="circle" @click="loadPlans">
                <template #icon>
                  <ReloadOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </div>

        <div class="search-box">
          <a-input v-model:value="planSearch" placeholder="搜索方案代码/名称" allow-clear size="small">
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-select v-model:value="orgFilter" placeholder="组织过滤" allow-clear size="small"
            style="width: 100%; margin-top: 8px;">
            <a-select-option :value="null">集团</a-select-option>
            <a-select-option :value="1">合肥工厂</a-select-option>
            <a-select-option :value="2">芜湖工厂</a-select-option>
          </a-select>
        </div>

        <div class="plan-list">
          <a-spin :spinning="plansLoading">
            <a-empty v-if="filteredPlans.length === 0" description="暂无方案" />
            <div v-else v-for="plan in filteredPlans" :key="plan.id" class="plan-item"
              :class="{ active: selectedPlanId === plan.id }" @click="handleSelectPlan(plan)">
              <div class="plan-item-header">
                <span class="plan-code">{{ plan.planCode }}</span>
                <a-tag color="blue" v-if="plan.samplingMethod === 'STANDARD_BASED'">国标</a-tag>
                <a-tag color="cyan" v-else>自定义</a-tag>
              </div>
              <div class="plan-name">{{ plan.planName }}</div>
              <div class="plan-desc">{{ plan.description || '无描述' }}</div>

              <div class="plan-actions">
                <EyeOutlined class="action-icon" @click.stop="handleViewPlan(plan)" />
                <EditOutlined class="action-icon" @click.stop="handleEditPlan(plan)" />
                <DeleteOutlined class="action-icon" @click.stop="handleDeletePlan(plan)" />
              </div>
            </div>
          </a-spin>
        </div>
      </div>

      <!-- 右侧：方案规则及明细 -->
      <div class="right-panel">
        <a-empty v-if="!selectedPlanId" description="请选择左侧方案查看规则" class="empty-state" />

        <div v-else class="content-wrapper">
          <div class="right-header">
            <div class="header-info">
              <div class="plan-title">{{ selectedPlan?.planName }}</div>
              <div class="plan-meta">
                <a-tag>代码: {{ selectedPlan?.planCode }}</a-tag>
                <a-tag>标准: {{ selectedPlan?.standard || '-' }}</a-tag>
              </div>
            </div>
            <div class="header-actions">
              <a-button type="primary" @click="handleAddRule">
                <template #icon>
                  <PlusOutlined />
                </template>
                新增规则
              </a-button>
              <a-button danger :disabled="selectedRuleKeys.length === 0" @click="handleBatchDeleteRules">
                批量删除
              </a-button>
            </div>
          </div>

          <div class="rules-table-container">
            <a-table :columns="ruleColumns" :data-source="rulesData" :loading="rulesLoading" row-key="id" size="middle"
              :row-selection="{ selectedRowKeys: selectedRuleKeys, onChange: onRuleSelectChange }" :pagination="false"
              class="rules-table">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="handleEditRule(record)">编辑</a-button>
                    <a-button type="link" danger size="small" @click="handleDeleteRule(record)">删除</a-button>
                  </a-space>
                </template>
              </template>

              <!-- 嵌套子表格：抽样明细 -->
              <template #expandedRowRender="{ record }">
                <div class="detail-table-wrapper">
                  <div class="detail-header">
                    <span class="detail-title">抽样明细 ({{ record.ruleCode }})</span>
                    <!-- 可以在这里添加明细的操作按钮，如果需要 -->
                  </div>
                  <a-table :columns="detailColumns" :data-source="record.details" row-key="id" size="small"
                    :pagination="false" :bordered="true">
                  </a-table>
                </div>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 方案编辑弹窗 (简化版，实际项目可用单独组件) -->
    <a-modal v-model:visible="planModalVisible" :title="isEditPlan ? '编辑抽样方案' : '新增抽样方案'" @ok="savePlan">
      <a-form layout="vertical" :model="planForm">
        <a-form-item label="方案代码" required><a-input v-model:value="planForm.planCode" /></a-form-item>
        <a-form-item label="方案名称" required><a-input v-model:value="planForm.planName" /></a-form-item>
        <a-form-item label="抽样方法" required>
          <a-select v-model:value="planForm.samplingMethod">
            <a-select-option value="STANDARD_BASED">国标/标准</a-select-option>
            <a-select-option value="FIXED_QUANTITY">固定数量</a-select-option>
            <a-select-option value="PERCENTAGE">百分比</a-select-option>
            <a-select-option value="FULL_INSPECTION">全检</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述"><a-textarea v-model:value="planForm.description" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 规则详情/编辑弹窗 -->
    <a-modal v-model:visible="ruleModalVisible" :title="isEditRule ? '编辑规则' : '规则详情'" width="700px" @ok="saveRule">
      <a-form layout="vertical" :model="ruleForm">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="规则代码" required>
              <a-input v-model:value="ruleForm.ruleCode" :disabled="!isEditRule" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规则名称" required>
              <a-input v-model:value="ruleForm.ruleName" :disabled="!isEditRule" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="检验水平">
              <a-select v-model:value="ruleForm.inspectionLevel" :disabled="!isEditRule">
                <a-select-option value="I">I</a-select-option>
                <a-select-option value="II">II</a-select-option>
                <a-select-option value="III">III</a-select-option>
                <a-select-option value="S1">S1</a-select-option>
                <a-select-option value="S2">S2</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="检验类型">
              <a-select v-model:value="ruleForm.inspectionType" :disabled="!isEditRule">
                <a-select-option value="NORMAL">正常检验</a-select-option>
                <a-select-option value="STRICT">加严检验</a-select-option>
                <a-select-option value="REDUCED">放宽检验</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="AQL值">
              <a-input-number v-model:value="ruleForm.aqlValue" :disabled="!isEditRule" :min="0" :step="0.1"
                style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-divider>抽样明细</a-divider>
        <a-table :columns="detailColumns" :data-source="ruleForm.details" :pagination="false" size="small" bordered />
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined
  } from '@ant-design/icons-vue'

  const router = useRouter()

  // --- 状态定义 ---
  const plansLoading = ref(false)
  const plansData = ref < any[] > ([])
  const planSearch = ref('')
  const orgFilter = ref<number | null | undefined>(undefined)
  const selectedPlanId = ref < number | null > (null)

  const rulesLoading = ref(false)
  const rulesData = ref < any[] > ([])
  const selectedRuleKeys = ref < number[] > ([])

  const planModalVisible = ref(false)
  const isEditPlan = ref(false)
  const planForm = reactive({ id: null, planCode: '', planName: '', samplingMethod: 'STANDARD_BASED', description: '' })

  // --- 左侧：方案管理逻辑 ---

  // 过滤方案列表
  const filteredPlans = computed(() => {
    let result = plansData.value

    // 文本搜索
    if (planSearch.value) {
      const key = planSearch.value.toLowerCase()
      result = result.filter(p =>
        p.planCode.toLowerCase().includes(key) ||
        p.planName.toLowerCase().includes(key)
      )
    }

    // 组织过滤
    if (orgFilter.value !== undefined) {
      if (orgFilter.value === null) {
        result = result.filter(p => p.orgId === null)
      } else {
        result = result.filter(p => p.orgId === orgFilter.value)
      }
    }

    return result
  })

  const selectedPlan = computed(() => plansData.value.find(p => p.id === selectedPlanId.value))

  // 加载方案数据 (Mock)
  const loadPlans = () => {
    plansLoading.value = true
    setTimeout(() => {
      plansData.value = [
        { id: 1, planCode: 'AQL-GB2828', planName: 'GB/T 2828.1-2012', samplingMethod: 'STANDARD_BASED', standard: 'GB/T 2828.1', description: '基于国标的AQL抽样' },
        { id: 2, planCode: 'FIX-QTY', planName: '固定数量抽样', samplingMethod: 'FIXED_QUANTITY', standard: '内部标准', description: '不管多少只抽5个' },
        { id: 3, planCode: 'PERCENT-10', planName: '10%抽样', samplingMethod: 'PERCENTAGE', standard: '内部标准', description: '按数量10%抽' },
      ]
      plansLoading.value = false
      // 默认选中第一个
      if (plansData.value.length > 0 && !selectedPlanId.value) {
        handleSelectPlan(plansData.value[0])
      }
    }, 500)
  }

  const handleSelectPlan = (plan: any) => {
    selectedPlanId.value = plan.id
    loadRules(plan.id)
  }

  const handleCreatePlan = () => {
    router.push('/inspection-model/sampling-plans/create')
  }

  const handleViewPlan = (plan: any) => {
    router.push(`/inspection-model/sampling-plans/view/${plan.id}`)
  }

  const handleEditPlan = (plan: any) => {
    router.push(`/inspection-model/sampling-plans/edit/${plan.id}`)
  }

  const handleDeletePlan = (plan: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除方案 ${plan.planName} 吗？`,
      okType: 'danger',
      onOk() {
        plansData.value = plansData.value.filter(p => p.id !== plan.id)
        if (selectedPlanId.value === plan.id) {
          selectedPlanId.value = null
          rulesData.value = []
        }
        message.success('删除成功')
      }
    })
  }

  const savePlan = () => {
    if (!planForm.planCode || !planForm.planName) {
      message.error('请填写必填项')
      return
    }

    if (isEditPlan.value) {
      const idx = plansData.value.findIndex(p => p.id === planForm.id)
      if (idx !== -1) Object.assign(plansData.value[idx], { ...planForm })
    } else {
      plansData.value.push({ ...planForm, id: Date.now() })
    }
    planModalVisible.value = false
    message.success('保存成功')
  }


  // --- 右侧：规则及明细逻辑 ---

  const ruleColumns = [
    { title: '规则代码', dataIndex: 'ruleCode', key: 'ruleCode' },
    { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
    { title: '检验水平', dataIndex: 'inspectionLevel', key: 'inspectionLevel', width: 100 },
    { title: '类型', dataIndex: 'inspectionType', key: 'inspectionType', width: 100 },
    { title: 'AQL值', dataIndex: 'aqlValue', key: 'aqlValue', width: 80 },
    { title: '操作', key: 'action', width: 150 }
  ]

  const detailColumns = [
    { title: '批量下限', dataIndex: 'batchSizeMin', key: 'batchSizeMin' },
    { title: '批量上限', dataIndex: 'batchSizeMax', key: 'batchSizeMax' },
    { title: '样本量字码', dataIndex: 'sampleSizeCode', key: 'sampleSizeCode' },
    { title: 'Ac(接收)', dataIndex: 'acceptanceNumber', key: 'acceptanceNumber' },
    { title: 'Re(拒收)', dataIndex: 'rejectionNumber', key: 'rejectionNumber' },
  ]

  const loadRules = (planId: number) => {
    rulesLoading.value = true
    selectedRuleKeys.value = []
    // Mock: 根据不同 planId 返回不同规则
    setTimeout(() => {
      if (planId === 1) {
        rulesData.value = [
          {
            id: 101, ruleCode: 'GB-L2-N-0.65', ruleName: 'Level II 正常 AQL 0.65', inspectionLevel: 'II', inspectionType: 'NORMAL', aqlValue: 0.65,
            details: [
              { id: 1, batchSizeMin: 1, batchSizeMax: 8, sampleSizeCode: 'A', acceptanceNumber: 0, rejectionNumber: 1 },
              { id: 2, batchSizeMin: 9, batchSizeMax: 15, sampleSizeCode: 'B', acceptanceNumber: 0, rejectionNumber: 1 },
              { id: 3, batchSizeMin: 16, batchSizeMax: 25, sampleSizeCode: 'C', acceptanceNumber: 0, rejectionNumber: 1 },
            ]
          },
          {
            id: 102, ruleCode: 'GB-L2-S-0.65', ruleName: 'Level II 加严 AQL 0.65', inspectionLevel: 'II', inspectionType: 'STRICT', aqlValue: 0.65,
            details: [
              { id: 4, batchSizeMin: 1, batchSizeMax: 8, sampleSizeCode: 'A', acceptanceNumber: 0, rejectionNumber: 1 },
            ]
          }
        ]
      } else {
        rulesData.value = []
      }
      rulesLoading.value = false
    }, 300)
  }

  const onRuleSelectChange = (keys: number[]) => {
    selectedRuleKeys.value = keys
  }

  const handleAddRule = () => {
    // 实际项目中应弹窗或跳转，此处简化演示
    const newRule = {
      id: Date.now(),
      ruleCode: 'NEW-RULE',
      ruleName: '新规则',
      inspectionLevel: 'II',
      inspectionType: 'NORMAL',
      aqlValue: 1.0,
      details: []
    }
    rulesData.value.push(newRule)
    message.success('已添加新规则')
  }

  const handleBatchDeleteRules = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selectedRuleKeys.value.length} 条规则吗？`,
      okType: 'danger',
      onOk() {
        rulesData.value = rulesData.value.filter(r => !selectedRuleKeys.value.includes(r.id))
        selectedRuleKeys.value = []
        message.success('批量删除成功')
      }
    })
  }

  const ruleModalVisible = ref(false)
  const isEditRule = ref(false)
  const ruleForm = reactive < any > ({ id: null, ruleCode: '', ruleName: '', inspectionLevel: 'II', inspectionType: 'NORMAL', aqlValue: 1.0, details: [] })

  const handleEditRule = (record: any) => {
    isEditRule.value = true
    Object.assign(ruleForm, { ...record, details: [...(record.details || [])] })
    ruleModalVisible.value = true
  }

  const handleViewRule = (record: any) => {
    isEditRule.value = false
    Object.assign(ruleForm, { ...record, details: [...(record.details || [])] })
    ruleModalVisible.value = true
  }

  const saveRule = () => {
    if (isEditRule.value) {
      const idx = rulesData.value.findIndex(r => r.id === ruleForm.id)
      if (idx !== -1) Object.assign(rulesData.value[idx], { ...ruleForm, details: [...ruleForm.details] })
      message.success('规则已更新')
    }
    ruleModalVisible.value = false
  }

  const handleDeleteRule = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除规则 ${record.ruleName} 吗？`,
      okType: 'danger',
      onOk() {
        rulesData.value = rulesData.value.filter(r => r.id !== record.id)
        message.success('删除成功')
      }
    })
  }

  onMounted(() => {
    loadPlans()
  })
</script>

<style scoped>
  .page-container {
    height: calc(100vh - 64px);
    /* 减去顶部导航高度 */
    background-color: #f0f2f5;
    padding: 16px;
    overflow: hidden;
  }

  .split-layout {
    display: flex;
    height: 100%;
    gap: 16px;
    background-color: transparent;
  }

  /* 左侧面板样式 */
  .left-panel {
    width: 300px;
    min-width: 300px;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-title {
    font-weight: 600;
    font-size: 16px;
    color: #1f1f1f;
  }

  .search-box {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .plan-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .plan-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
    position: relative;
  }

  .plan-item:hover {
    background-color: #fafaFA;
  }

  .plan-item.active {
    background-color: #e6f7ff;
    border-left-color: #1890ff;
  }

  .plan-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .plan-code {
    font-weight: 500;
    color: #1f1f1f;
  }

  .plan-name {
    font-size: 13px;
    color: #595959;
    margin-bottom: 4px;
  }

  .plan-desc {
    font-size: 12px;
    color: #8c8c8c;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-actions {
    display: none;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 4px;
  }

  .plan-item:hover .plan-actions {
    display: flex;
    gap: 8px;
  }

  .action-icon {
    color: #8c8c8c;
    font-size: 14px;
  }

  .action-icon:hover {
    color: #1890ff;
  }

  .action-icon:nth-child(2):hover {
    color: #ff4d4f;
  }

  /* 右侧面板样式 */
  .right-panel {
    flex: 1;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .empty-state {
    margin: auto;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .right-header {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: #fff;
  }

  .plan-title {
    font-size: 20px;
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 8px;
  }

  .plan-meta {
    display: flex;
    gap: 8px;
  }

  .rules-table-container {
    flex: 1;
    overflow: auto;
    padding: 24px;
  }

  /* 嵌套表格样式优化 */
  .detail-table-wrapper {
    background: #fafafa;
    padding: 12px;
    border-radius: 4px;
  }

  .detail-header {
    margin-bottom: 8px;
    font-weight: 500;
    color: #595959;
    font-size: 13px;
  }
</style>