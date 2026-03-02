<template>
  <div class="task-trigger-simulator">
    <!-- 工具栏 -->
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="handleSimulate" :loading="simulating">
          🚀 模拟触发
        </a-button>
        <a-button @click="loadPreset('IQC')">📦 IQC 预设</a-button>
        <a-button @click="loadPreset('IPQC')">🏭 IPQC 预设</a-button>
        <a-button @click="loadPreset('FQC')">📋 FQC 预设</a-button>
        <a-button @click="loadPreset('OQC')">🚚 OQC 预设</a-button>
        <a-button @click="handleClear">🗑️ 清空</a-button>
      </a-space>
    </div>

    <div class="simulator-content">
      <!-- 左侧：输入区 -->
      <div class="input-panel">
        <a-card title="📝 触发报文输入" :bordered="false" class="input-card">
          <template #extra>
            <a-radio-group v-model:value="inputMode" size="small">
              <a-radio-button value="form">表单模式</a-radio-button>
              <a-radio-button value="json">JSON 模式</a-radio-button>
            </a-radio-group>
          </template>

          <!-- 表单模式 -->
          <a-form v-if="inputMode === 'form'" :model="formData" layout="vertical" class="trigger-form">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="组织/工厂 ID" required>
                  <a-select v-model:value="formData.orgId" placeholder="选择组织">
                    <a-select-option value="HFC_001">HFC_001 - 合肥工厂</a-select-option>
                    <a-select-option value="SH_002">SH_002 - 上海工厂</a-select-option>
                    <a-select-option value="GZ_003">GZ_003 - 广州工厂</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="检验类型" required>
                  <a-select v-model:value="formData.inspectType" placeholder="选择类型">
                    <a-select-option value="IQC">IQC - 来料检验</a-select-option>
                    <a-select-option value="IPQC">IPQC - 过程检验</a-select-option>
                    <a-select-option value="FQC">FQC - 成品检验</a-select-option>
                    <a-select-option value="OQC">OQC - 出货检验</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="来源单据类型" required>
                  <a-select v-model:value="formData.sourceBillType" placeholder="选择单据类型">
                    <a-select-option value="PUR_RECEIVE">PUR_RECEIVE - 采购收货单</a-select-option>
                    <a-select-option value="PROD_ORDER">PROD_ORDER - 生产指令单</a-select-option>
                    <a-select-option value="PROD_INBOUND">PROD_INBOUND - 生产入库单</a-select-option>
                    <a-select-option value="SALES_DELIVER">SALES_DELIVER - 销售发货单</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="来源单据号" required>
                  <a-input v-model:value="formData.sourceBillNo" placeholder="如: WMS-REC-20260226" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="物料编码" required>
                  <a-input v-model:value="formData.materialCode" placeholder="如: M002" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="批次号" required>
                  <a-input v-model:value="formData.batchNo" placeholder="如: B20260226-01" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="扩展上下文 (ext_context)">
              <a-row :gutter="8" v-for="(item, index) in extContextItems" :key="index" style="margin-bottom: 8px;">
                <a-col :span="10">
                  <a-input v-model:value="item.key" placeholder="键 (如: supplier)" />
                </a-col>
                <a-col :span="10">
                  <a-input v-model:value="item.value" placeholder="值 (如: S01)" />
                </a-col>
                <a-col :span="4">
                  <a-button type="text" danger @click="removeExtItem(index)">删除</a-button>
                </a-col>
              </a-row>
              <a-button type="dashed" block @click="addExtItem">+ 添加扩展字段</a-button>
            </a-form-item>
          </a-form>

          <!-- JSON 模式 -->
          <div v-else class="json-editor">
            <a-textarea v-model:value="jsonInput" :rows="16" placeholder='请粘贴 JSON 报文...' class="json-textarea" />
            <div v-if="jsonError" class="json-error">
              <a-alert type="error" :message="jsonError" show-icon />
            </div>
          </div>
        </a-card>

        <!-- 接口说明 -->
        <a-card title="📖 接口说明" :bordered="false" class="api-card" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="接口地址">
              <a-tag color="blue">POST</a-tag>
              <code>/api/v1/inspection/task/trigger</code>
            </a-descriptions-item>
            <a-descriptions-item label="Content-Type">
              <code>application/json</code>
            </a-descriptions-item>
          </a-descriptions>
          <a-collapse class="scenario-collapse" :bordered="false">
            <a-collapse-panel key="wms-iqc" header="🔹 WMS → IQC 来料检验">
              <p>采购收货单提交后，WMS 自动调用此接口触发 IQC 检验任务。</p>
              <p><strong>source_bill_type:</strong> PUR_RECEIVE</p>
            </a-collapse-panel>
            <a-collapse-panel key="mes-ipqc" header="🔹 MES → IPQC 过程检验">
              <p>生产指令单下达或开工报工时，MES 调用此接口触发 IPQC 首件/巡检任务。</p>
              <p><strong>source_bill_type:</strong> PROD_ORDER</p>
            </a-collapse-panel>
            <a-collapse-panel key="wms-fqc" header="🔹 WMS → FQC 成品检验">
              <p>生产入库单生成或产品下线扫码时，触发 FQC 终检任务。</p>
              <p><strong>source_bill_type:</strong> PROD_INBOUND</p>
            </a-collapse-panel>
            <a-collapse-panel key="erp-oqc" header="🔹 金蝶 ERP → OQC 出货检验">
              <p>销售发货单审核时，金蝶云星空调用此接口触发 OQC 出货检验任务。</p>
              <p><strong>source_bill_type:</strong> SALES_DELIVER</p>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-panel">
        <a-card title="📊 判定链路分析" :bordered="false" class="chain-card">
          <template v-if="simulationResult">
            <!-- 总结 -->
            <a-result :status="simulationResult.suggestGenerate ? 'success' : 'warning'"
              :title="simulationResult.suggestGenerate ? '✅ 建议生成检验任务' : '⚠️ 不建议生成检验任务'"
              :sub-title="simulationResult.conclusion" />

            <!-- 匹配到的计划信息 -->
            <a-card v-if="simulationResult.matchedPlan" size="small" class="matched-plan-card">
              <a-descriptions :column="2" size="small" title="匹配计划信息">
                <a-descriptions-item label="计划编号">
                  <a-tag color="blue">{{ simulationResult.matchedPlan.planCode }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="计划名称">{{ simulationResult.matchedPlan.planName }}</a-descriptions-item>
                <a-descriptions-item label="关联方案">{{ simulationResult.matchedPlan.schemeName }}</a-descriptions-item>
                <a-descriptions-item label="检验类型">
                  <a-tag :color="inspTypeColors[simulationResult.matchedPlan.inspType]">
                    {{ simulationResult.matchedPlan.inspType }}
                  </a-tag>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>

            <!-- 判定链路步骤 -->
            <a-timeline class="chain-timeline">
              <a-timeline-item v-for="(node, index) in simulationResult.chain" :key="index"
                :color="stepColors[node.stepResult]">
                <div class="chain-step">
                  <div class="step-header">
                    <span class="step-icon">{{ stepIcons[node.stepResult] }}</span>
                    <span class="step-name">{{ node.stepName }}</span>
                    <a-tag :color="stepTagColors[node.stepResult]" size="small">
                      {{ stepLabels[node.stepResult] }}
                    </a-tag>
                  </div>
                  <div class="step-desc">{{ node.description }}</div>
                  <div v-if="node.matchedData" class="step-data">
                    <a-tag color="cyan">{{ node.matchedData }}</a-tag>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </template>

          <a-empty v-else description="请输入触发报文后点击[模拟触发]查看判定链路">
            <template #image>
              <span style="font-size: 64px;">🔍</span>
            </template>
          </a-empty>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { message } from 'ant-design-vue'
  import type { InspTaskTriggerPayload, SimulationResult, InspContextType } from '@/types'

  // 输入模式
  const inputMode = ref < 'form' | 'json' > ('form')

  // 表单数据
  const formData = reactive < InspTaskTriggerPayload > ({
    orgId: '',
    inspectType: 'IQC' as InspContextType,
    sourceBillType: '',
    sourceBillNo: '',
    materialCode: '',
    batchNo: '',
  })

  // 扩展上下文键值对
  const extContextItems = ref < { key: string; value: string }[] > ([])

  const addExtItem = () => {
    extContextItems.value.push({ key: '', value: '' })
  }

  const removeExtItem = (index: number) => {
    extContextItems.value.splice(index, 1)
  }

  // JSON 模式
  const jsonInput = ref('')
  const jsonError = ref('')

  // 模拟状态
  const simulating = ref(false)
  const simulationResult = ref < SimulationResult | null > (null)

  // 颜色映射表
  const inspTypeColors: Record<string, string> = {
    IQC: 'blue',
    IPQC: 'orange',
    FQC: 'green',
    OQC: 'purple',
  }

  const stepColors: Record<string, string> = {
    pass: 'green',
    fail: 'red',
    skip: 'gray',
  }

  const stepTagColors: Record<string, string> = {
    pass: 'success',
    fail: 'error',
    skip: 'default',
  }

  const stepLabels: Record<string, string> = {
    pass: '通过',
    fail: '失败',
    skip: '跳过',
  }

  const stepIcons: Record<string, string> = {
    pass: '✅',
    fail: '❌',
    skip: '⏭️',
  }

  /**
   * 构建 payload: 从表单或 JSON 文本解析
   */
  const buildPayload = (): InspTaskTriggerPayload | null => {
    if (inputMode.value === 'json') {
      try {
        const parsed = JSON.parse(jsonInput.value)
        jsonError.value = ''
        return parsed
      } catch (e) {
        jsonError.value = 'JSON 格式错误，请检查语法'
        return null
      }
    }
    // 表单模式校验
    if (!formData.orgId || !formData.inspectType || !formData.sourceBillType || !formData.sourceBillNo || !formData.materialCode || !formData.batchNo) {
      message.warning('请填写所有必填字段')
      return null
    }
    const extContext: Record<string, string> = {}
    extContextItems.value.forEach(item => {
      if (item.key.trim()) {
        extContext[item.key.trim()] = item.value.trim()
      }
    })
    return {
      ...formData,
      extContext: Object.keys(extContext).length > 0 ? extContext : undefined,
    }
  }

  /**
   * 模拟匹配引擎 —— 基于已有检验计划模型的匹配逻辑
   * NOTE: 前端模拟数据，实际由后端 InspectionTaskMatchingService 实现
   */
  const simulateMatching = (payload: InspTaskTriggerPayload): SimulationResult => {
    const chain: SimulationResult['chain'] = []

    // 模拟计划库（示例模拟数据）
    const mockPlans = [
      { planCode: 'PLN-HFC-IQC-001', planName: '合肥工厂来料检验计划', schemeName: '铝合金外壳IQC方案', inspType: 'IQC' as InspContextType, orgId: 'HFC_001', materialCode: 'M002', priority: 5, triggerBillType: 'PUR_RECEIVE', supplier: 'S01', maxBatch: 0 },
      { planCode: 'PLN-HFC-IPQC-001', planName: '合肥工厂过程检验计划', schemeName: '压铸线IPQC方案', inspType: 'IPQC' as InspContextType, orgId: 'HFC_001', materialCode: 'M003', priority: 10, triggerBillType: 'PROD_ORDER', supplier: '', maxBatch: 0 },
      { planCode: 'PLN-HFC-FQC-001', planName: '合肥工厂成品检验计划', schemeName: '成品出厂FQC方案', inspType: 'FQC' as InspContextType, orgId: 'HFC_001', materialCode: 'M004', priority: 5, triggerBillType: 'PROD_INBOUND', supplier: '', maxBatch: 0 },
      { planCode: 'PLN-SH-OQC-001', planName: '上海工厂出货检验计划', schemeName: '出货OQC标准方案', inspType: 'OQC' as InspContextType, orgId: 'SH_002', materialCode: 'M005', priority: 5, triggerBillType: 'SALES_DELIVER', supplier: '', maxBatch: 3 },
      { planCode: 'PLN-HFC-IQC-002', planName: '合肥工厂来料全检计划(新供应商)', schemeName: '新供应商全检方案', inspType: 'IQC' as InspContextType, orgId: 'HFC_001', materialCode: 'M002', priority: 3, triggerBillType: 'PUR_RECEIVE', supplier: 'S02', maxBatch: 3 },
    ]

    // 第一步：计划匹配
    const orgFiltered = mockPlans.filter(p => p.orgId === payload.orgId && p.inspType === payload.inspectType)
    if (orgFiltered.length === 0) {
      chain.push({
        stepName: '第一步：计划匹配',
        stepResult: 'fail',
        description: `未找到组织 [${payload.orgId}] 下类型为 [${payload.inspectType}] 的生效计划`,
      })
      return { suggestGenerate: false, chain, conclusion: '未找到匹配的检验计划，判定为 Ignored（免检或未配置）。' }
    }
    chain.push({
      stepName: '第一步：计划匹配 - 组织与类型过滤',
      stepResult: 'pass',
      description: `在组织 [${payload.orgId}] 下找到 ${orgFiltered.length} 条 [${payload.inspectType}] 类型计划`,
    })

    // 多维度过滤 - 物料
    const materialFiltered = orgFiltered.filter(p => p.materialCode === payload.materialCode)
    if (materialFiltered.length === 0) {
      chain.push({
        stepName: '第一步：计划匹配 - 物料维度过滤',
        stepResult: 'fail',
        description: `物料 [${payload.materialCode}] 未在任何计划中配置`,
      })
      return { suggestGenerate: false, chain, conclusion: `物料 [${payload.materialCode}] 无对应检验计划，该物料可能属于免检物料。` }
    }
    chain.push({
      stepName: '第一步：计划匹配 - 物料维度过滤',
      stepResult: 'pass',
      description: `物料 [${payload.materialCode}] 匹配 ${materialFiltered.length} 条计划`,
    })

    // 多维度过滤 - 供应商/客户（ext_context）
    let contextFiltered = materialFiltered
    if (payload.extContext?.supplier) {
      const supplierMatch = materialFiltered.filter(p => !p.supplier || p.supplier === payload.extContext!.supplier)
      if (supplierMatch.length > 0) {
        contextFiltered = supplierMatch
        chain.push({
          stepName: '第一步：计划匹配 - 供应商维度过滤',
          stepResult: 'pass',
          description: `供应商 [${payload.extContext.supplier}] 匹配 ${supplierMatch.length} 条计划`,
        })
      }
    }

    // 优先级排序
    contextFiltered.sort((a, b) => a.priority - b.priority)
    const bestPlan = contextFiltered[0]
    chain.push({
      stepName: '第一步：计划匹配 - 优先级排序',
      stepResult: 'pass',
      description: `按优先级排序后，选中最高优先级计划 (P${bestPlan.priority})`,
      matchedData: `${bestPlan.planCode} - ${bestPlan.planName}`,
    })

    // 第二步：触发条件判定
    if (bestPlan.triggerBillType !== payload.sourceBillType) {
      chain.push({
        stepName: '第二步：触发条件判定 - 单据类型校验',
        stepResult: 'fail',
        description: `计划要求单据类型 [${bestPlan.triggerBillType}]，实际为 [${payload.sourceBillType}]，不满足触发条件`,
      })
      return { suggestGenerate: false, chain, conclusion: `单据类型不匹配 (期望: ${bestPlan.triggerBillType}, 实际: ${payload.sourceBillType})。` }
    }
    chain.push({
      stepName: '第二步：触发条件判定 - 单据类型校验',
      stepResult: 'pass',
      description: `单据类型 [${payload.sourceBillType}] 与计划触发配置一致`,
    })

    // 特殊策略检查
    if (bestPlan.maxBatch > 0) {
      // 模拟当前批次为第 N 批
      const currentBatchNum = Math.floor(Math.random() * 5) + 1
      if (currentBatchNum > bestPlan.maxBatch) {
        chain.push({
          stepName: '第二步：触发条件判定 - 动态策略',
          stepResult: 'fail',
          description: `当前批次为第 ${currentBatchNum} 批，不满足"前 ${bestPlan.maxBatch} 批必须检验"的触发条件`,
        })
        return { suggestGenerate: false, chain, conclusion: `当前批次为第 ${currentBatchNum} 批，不满足"前 ${bestPlan.maxBatch} 批"的触发策略，判定为 Ignored。` }
      }
      chain.push({
        stepName: '第二步：触发条件判定 - 动态策略',
        stepResult: 'pass',
        description: `当前批次为第 ${currentBatchNum} 批，满足"前 ${bestPlan.maxBatch} 批必须检验"条件`,
      })
    }

    // 第三步: 任务实例化
    chain.push({
      stepName: '第三步：任务实例化 - 方案快照锁定',
      stepResult: 'pass',
      description: `锁定关联方案 [${bestPlan.schemeName}] 当前版本的检验项与抽样规则`,
    })
    chain.push({
      stepName: '第三步：任务实例化 - 参数覆盖应用',
      stepResult: 'pass',
      description: '检查参数覆盖配置，应用计划级别的阈值微调（如有）',
    })
    chain.push({
      stepName: '第三步：任务实例化 - 指派执行人',
      stepResult: 'pass',
      description: '按计划中设定的默认检验员分派任务',
    })

    return {
      suggestGenerate: true,
      chain,
      conclusion: `成功匹配计划 [${bestPlan.planCode}]，建议生成 ${bestPlan.inspType} 检验任务。`,
      matchedPlan: {
        planCode: bestPlan.planCode,
        planName: bestPlan.planName,
        schemeName: bestPlan.schemeName,
        inspType: bestPlan.inspType,
      },
    }
  }

  /**
   * 执行模拟触发
   */
  const handleSimulate = async () => {
    const payload = buildPayload()
    if (!payload) return

    simulating.value = true
    simulationResult.value = null
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    simulationResult.value = simulateMatching(payload)
    simulating.value = false
    message.success('模拟触发执行完成')
  }

  /**
   * 加载预设报文
   */
  const loadPreset = (type: InspContextType) => {
    const presets: Record<string, InspTaskTriggerPayload> = {
      IQC: {
        orgId: 'HFC_001',
        inspectType: 'IQC',
        sourceBillType: 'PUR_RECEIVE',
        sourceBillNo: 'WMS-REC-20260302',
        materialCode: 'M002',
        batchNo: 'B20260302-01',
        extContext: { supplier: 'S01', warehouse: 'WH-01' },
      },
      IPQC: {
        orgId: 'HFC_001',
        inspectType: 'IPQC',
        sourceBillType: 'PROD_ORDER',
        sourceBillNo: 'MES-ORD-20260302',
        materialCode: 'M003',
        batchNo: 'B20260302-02',
        extContext: { line: 'A01', shift: 'DAY' },
      },
      FQC: {
        orgId: 'HFC_001',
        inspectType: 'FQC',
        sourceBillType: 'PROD_INBOUND',
        sourceBillNo: 'WMS-INB-20260302',
        materialCode: 'M004',
        batchNo: 'B20260302-03',
      },
      OQC: {
        orgId: 'SH_002',
        inspectType: 'OQC',
        sourceBillType: 'SALES_DELIVER',
        sourceBillNo: 'ERP-DEL-20260302',
        materialCode: 'M005',
        batchNo: 'B20260302-04',
        extContext: { customer: 'C01' },
      },
    }

    const preset = presets[type]
    if (inputMode.value === 'form') {
      Object.assign(formData, {
        orgId: preset.orgId,
        inspectType: preset.inspectType,
        sourceBillType: preset.sourceBillType,
        sourceBillNo: preset.sourceBillNo,
        materialCode: preset.materialCode,
        batchNo: preset.batchNo,
      })
      extContextItems.value = preset.extContext
        ? Object.entries(preset.extContext).map(([key, value]) => ({ key, value }))
        : []
    } else {
      jsonInput.value = JSON.stringify(preset, null, 2)
    }
    simulationResult.value = null
    message.info(`已加载 ${type} 预设报文`)
  }

  /**
   * 清空输入和结果
   */
  const handleClear = () => {
    Object.assign(formData, {
      orgId: '',
      inspectType: 'IQC',
      sourceBillType: '',
      sourceBillNo: '',
      materialCode: '',
      batchNo: '',
    })
    extContextItems.value = []
    jsonInput.value = ''
    jsonError.value = ''
    simulationResult.value = null
  }

  // 表单和 JSON 同步
  watch(inputMode, (newMode) => {
    if (newMode === 'json' && formData.orgId) {
      const extContext: Record<string, string> = {}
      extContextItems.value.forEach(item => {
        if (item.key.trim()) extContext[item.key.trim()] = item.value.trim()
      })
      const payload: InspTaskTriggerPayload = {
        ...formData,
        extContext: Object.keys(extContext).length > 0 ? extContext : undefined,
      }
      jsonInput.value = JSON.stringify(payload, null, 2)
    }
  })
</script>

<style scoped>
  .task-trigger-simulator {
    padding: 16px;
    background: #f0f2f5;
    min-height: calc(100vh - 140px);
  }

  .toolbar {
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .simulator-content {
    display: flex;
    gap: 16px;
  }

  .input-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .result-panel {
    flex: 1;
  }

  .input-card {
    border-radius: 4px;
  }

  .chain-card {
    border-radius: 4px;
    min-height: 500px;
  }

  .json-textarea {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 4px;
    padding: 12px;
  }

  .json-error {
    margin-top: 8px;
  }

  .api-card {
    border-radius: 4px;
  }

  .scenario-collapse {
    margin-top: 12px;
  }

  .matched-plan-card {
    margin-bottom: 16px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
  }

  .chain-timeline {
    padding: 16px 0;
  }

  .chain-step {
    padding: 4px 0;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .step-icon {
    font-size: 14px;
  }

  .step-name {
    font-weight: 600;
    color: #333;
  }

  .step-desc {
    color: #666;
    font-size: 13px;
    line-height: 1.6;
  }

  .step-data {
    margin-top: 4px;
  }

  .trigger-form :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
</style>