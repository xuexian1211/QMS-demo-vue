<template>
  <div class="insp-scheme-edit">
    <a-page-header
      :title="isEdit ? '编辑检验方案' : '新建检验方案'"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="handleBack">取消</a-button>
          <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 基本信息卡片 -->
    <a-card title="基本信息" :bordered="false" style="margin-top: 16px;">
      <a-form
        :model="formData"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="方案编码" required>
              <a-input v-model:value="formData.schemeCode" placeholder="请输入方案编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="方案名称" required>
              <a-input v-model:value="formData.schemeName" placeholder="请输入方案名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="版本号" required>
              <a-input v-model:value="formData.version" placeholder="请输入版本号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-tag :color="getStatusColor(formData.status)">{{ getStatusText(formData.status) }}</a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16" v-if="formData.sourceTemplateId">
          <a-col :span="12">
            <a-form-item label="源模板">
              <a-input :value="formData.sourceTemplateName" disabled />
              <a-button type="link" size="small" @click="handleViewTemplate">查看模板</a-button>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 详情页签卡片 -->
    <a-card :bordered="false" style="margin-top: 16px;">
      <a-tabs v-model:activeKey="activeTab">
        <!-- 检验项目明细 -->
        <a-tab-pane key="details" tab="检验项目明细">
          <div class="detail-toolbar">
            <a-space>
              <a-button type="primary" @click="handleAddDetail">
                <template #icon><PlusOutlined /></template>
                添加项目
              </a-button>
              <a-button @click="handleImportFromTemplate" v-if="!formData.sourceTemplateId">
                <template #icon><ImportOutlined /></template>
                从模板导入
              </a-button>
              <a-button danger @click="handleBatchDelete" :disabled="selectedRowKeys.length === 0">
                <template #icon><DeleteOutlined /></template>
                批量删除
              </a-button>
            </a-space>
          </div>

          <a-table
            :columns="detailColumns"
            :data-source="formData.details"
            :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
            :pagination="false"
            row-key="id"
            :scroll="{ x: 1500 }"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'sortOrder'">
                <a-input-number v-model:value="record.sortOrder" :min="1" style="width: 80px" />
              </template>
              <template v-else-if="column.key === 'inspItemName'">
                <a-select
                  v-model:value="record.inspItemId"
                  placeholder="请选择检验项目"
                  show-search
                  :filter-option="filterOption"
                  @change="(val) => handleItemChange(val, record)"
                  style="width: 200px"
                >
                  <a-select-option v-for="item in inspectionItems" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </a-select-option>
                </a-select>
                <a-tag v-if="record.fromTemplate" color="blue" style="margin-left: 8px">模板</a-tag>
              </template>
              <template v-else-if="column.key === 'characteristicClass'">
                <a-select v-model:value="record.characteristicClass" style="width: 100px">
                  <a-select-option value="SC">SC</a-select-option>
                  <a-select-option value="CC">CC</a-select-option>
                  <a-select-option value="Major">Major</a-select-option>
                  <a-select-option value="Minor">Minor</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'samplingRule'">
                <a-select
                  v-model:value="record.samplingRuleId"
                  placeholder="请选择抽样规则"
                  style="width: 180px"
                >
                  <a-select-option v-for="rule in samplingRules" :key="rule.id" :value="rule.id">
                    {{ rule.ruleName }}
                  </a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'inspMethod'">
                <a-select
                  v-model:value="record.inspMethodId"
                  placeholder="请选择检验方法"
                  allow-clear
                  style="width: 150px"
                >
                  <a-select-option v-for="method in inspMethods" :key="method.id" :value="method.id">
                    {{ method.methodName }}
                  </a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'spcEnabled'">
                <a-switch v-model:checked="record.spcEnabled" />
              </template>
              <template v-else-if="column.key === 'labRequired'">
                <a-switch v-model:checked="record.labRequired" />
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleEditDetail(record)">编辑</a-button>
                  <a-button type="link" size="small" danger @click="handleDeleteDetail(index)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 明细不良现象绑定 [NEW] -->
        <a-tab-pane key="defects" tab="明细不良现象绑定">
          <a-row :gutter="16">
            <a-col :span="10">
              <a-card title="检验项目" size="small">
                <a-list
                  :data-source="formData.details || []"
                  size="small"
                >
                  <template #renderItem="{ item }">
                    <a-list-item
                      :class="{ 'selected-item': selectedDetailId === item.id }"
                      @click="handleSelectDetail(item)"
                      style="cursor: pointer;"
                    >
                      <a-list-item-meta>
                        <template #title>{{ item.inspItemName }}</template>
                        <template #description>
                          <a-tag size="small">{{ item.characteristicClass }}</a-tag>
                          <a-tag v-if="item.relatedPhenomenonIds?.length" color="blue" size="small">
                            已绑定 {{ item.relatedPhenomenonIds.length }} 个现象
                          </a-tag>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </a-card>
            </a-col>
            <a-col :span="14">
              <a-card title="关联不良现象" size="small" v-if="selectedDetailId">
                <template #extra>
                  <a-button type="primary" size="small" @click="handleAddPhenomenon">
                    <template #icon><PlusOutlined /></template>
                    添加现象
                  </a-button>
                </template>
                <a-table
                  :columns="phenomenonColumns"
                  :data-source="selectedDetailPhenomena"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                      <a-button type="link" size="small" danger @click="handleRemovePhenomenon(record)">
                        移除
                      </a-button>
                    </template>
                  </template>
                </a-table>
              </a-card>
              <a-empty v-else description="请先选择左侧的检验项目" />
            </a-col>
          </a-row>
        </a-tab-pane>

        <!-- 策略绑定 -->
        <a-tab-pane key="strategies" tab="策略绑定" v-if="isEdit">
          <div class="strategy-toolbar">
            <a-button type="primary" @click="handleAddStrategy">
              <template #icon><PlusOutlined /></template>
              新增策略
            </a-button>
          </div>

          <a-table
            :columns="strategyColumns"
            :data-source="strategies"
            :loading="loadingStrategies"
            :pagination="false"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'contextType'">
                <a-tag>{{ record.contextType }}</a-tag>
              </template>
              <template v-else-if="column.key === 'matchDimension'">
                <div class="match-dimension">
                  <a-tag v-if="record.matchDimension.materialId" color="blue">
                    物料: {{ record.matchDimension.materialId }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension.materialGroupId" color="cyan">
                    物料组: {{ record.matchDimension.materialGroupId }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension.supplierId" color="green">
                    供应商: {{ record.matchDimension.supplierId }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension.customerId" color="purple">
                    客户: {{ record.matchDimension.customerId }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension.operationNo" color="orange">
                    工序: {{ record.matchDimension.operationNo }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension.ipqcType" color="red">
                    IPQC类型: {{ record.matchDimension.ipqcType }}
                  </a-tag>
                </div>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-switch
                  :checked="record.status === 'enabled'"
                  @change="(checked) => handleToggleStrategyStatus(record, checked)"
                />
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleEditStrategy(record)">编辑</a-button>
                  <a-button type="link" size="small" danger @click="handleDeleteStrategy(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 物料检验规格 [NEW] -->
        <a-tab-pane key="specs" tab="物料检验规格" v-if="isEdit">
          <a-alert
            message="规格说明"
            description="此页签展示基于策略绑定的物料及方案项目自动聚合的检验规格。您可以在此编辑规格，并同步至物料档案。"
            type="info"
            show-icon
            style="margin-bottom: 16px;"
          />
          
          <div class="spec-toolbar">
            <a-space>
              <a-button type="primary" @click="handleRefreshSpecs">
                <template #icon><ReloadOutlined /></template>
                刷新规格
              </a-button>
              <a-button @click="handleSyncToMaterial" :disabled="!hasSpecChanges">
                <template #icon><SyncOutlined /></template>
                同步至物料档案
              </a-button>
            </a-space>
          </div>

          <a-table
            :columns="specColumns"
            :data-source="materialSpecs"
            :loading="loadingSpecs"
            :pagination="false"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'targetValue'">
                <a-input-number v-model:value="record.targetValue" :precision="2" style="width: 100px" />
              </template>
              <template v-else-if="column.key === 'upperLimit'">
                <a-input-number v-model:value="record.upperLimit" :precision="2" style="width: 100px" />
              </template>
              <template v-else-if="column.key === 'lowerLimit'">
                <a-input-number v-model:value="record.lowerLimit" :precision="2" style="width: 100px" />
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="handleEditSpec(record)">编辑</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 添加/编辑项目明细弹窗 -->
    <a-modal
      v-model:open="detailModalVisible"
      :title="detailModalTitle"
      @ok="handleDetailModalOk"
      width="800px"
    >
      <a-form :model="currentDetail" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="检验项目" required>
          <a-select
            v-model:value="currentDetail.inspItemId"
            placeholder="请选择检验项目"
            show-search
            :filter-option="filterOption"
            @change="handleDetailItemChange"
          >
            <a-select-option v-for="item in inspectionItems" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="特性分类" required>
          <a-select v-model:value="currentDetail.characteristicClass">
            <a-select-option value="SC">SC-特殊特性</a-select-option>
            <a-select-option value="CC">CC-关键特性</a-select-option>
            <a-select-option value="Major">Major-主要</a-select-option>
            <a-select-option value="Minor">Minor-次要</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="抽样规则" required>
          <a-select v-model:value="currentDetail.samplingRuleId" placeholder="请选择抽样规则">
            <a-select-option v-for="rule in samplingRules" :key="rule.id" :value="rule.id">
              {{ rule.ruleName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="检验方法">
          <a-select v-model:value="currentDetail.inspMethodId" placeholder="请选择检验方法" allow-clear>
            <a-select-option v-for="method in inspMethods" :key="method.id" :value="method.id">
              {{ method.methodName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="SPC监控">
          <a-switch v-model:checked="currentDetail.spcEnabled" />
        </a-form-item>
        <a-form-item label="送检实验室">
          <a-switch v-model:checked="currentDetail.labRequired" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加/编辑策略弹窗 -->
    <a-modal
      v-model:open="strategyModalVisible"
      :title="strategyModalTitle"
      @ok="handleStrategyModalOk"
      width="700px"
    >
      <a-form :model="currentStrategy" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="策略名称" required>
          <a-input v-model:value="currentStrategy.strategyName" placeholder="请输入策略名称" />
        </a-form-item>
        <a-form-item label="业务上下文" required>
          <a-select v-model:value="currentStrategy.contextType">
            <a-select-option value="IQC">IQC</a-select-option>
            <a-select-option value="IPQC">IPQC</a-select-option>
            <a-select-option value="FQC">FQC</a-select-option>
            <a-select-option value="OQC">OQC</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="物料">
          <a-input v-model:value="currentStrategy.matchDimension.materialId" placeholder="请输入物料ID" />
        </a-form-item>
        <a-form-item label="物料组">
          <a-input v-model:value="currentStrategy.matchDimension.materialGroupId" placeholder="请输入物料组ID" />
        </a-form-item>
        <a-form-item label="供应商" v-if="currentStrategy.contextType === 'IQC'">
          <a-input v-model:value="currentStrategy.matchDimension.supplierId" placeholder="请输入供应商ID" />
        </a-form-item>
        <a-form-item label="客户" v-if="currentStrategy.contextType === 'OQC' || currentStrategy.contextType === 'FQC'">
          <a-input v-model:value="currentStrategy.matchDimension.customerId" placeholder="请输入客户ID" />
        </a-form-item>
        <a-form-item label="工序号" v-if="currentStrategy.contextType === 'IPQC'">
          <a-input v-model:value="currentStrategy.matchDimension.operationNo" placeholder="请输入工序号" />
        </a-form-item>
        <a-form-item label="IPQC类型" v-if="currentStrategy.contextType === 'IPQC'">
          <a-select v-model:value="currentStrategy.matchDimension.ipqcType" placeholder="请选择IPQC类型" allow-clear>
            <a-select-option value="FAI">FAI-首件检</a-select-option>
            <a-select-option value="PATROL">PATROL-巡检</a-select-option>
            <a-select-option value="LAI">LAI-末件检</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级" required>
          <a-input-number v-model:value="currentStrategy.priority" :min="1" :max="999" style="width: 100%" />
          <div style="color: #999; font-size: 12px;">数值越小优先级越高</div>
        </a-form-item>
        <a-form-item label="触发条件">
          <a-select v-model:value="currentStrategy.triggerCondition">
            <a-select-option value="ALWAYS">总是触发</a-select-option>
            <a-select-option value="ON_NEW_SUPPLIER_FIRST_N_BATCHES">新供应商前N批</a-select-option>
            <a-select-option value="ON_ECN_FIRST_N_BATCHES">工程变更前N批</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="触发阈值" v-if="currentStrategy.triggerCondition !== 'ALWAYS'">
          <a-input-number v-model:value="currentStrategy.triggerValue" :min="1" placeholder="请输入批次数" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加不良现象弹窗 -->
    <a-modal
      v-model:open="phenomenonModalVisible"
      title="添加不良现象"
      @ok="handlePhenomenonModalOk"
      width="600px"
    >
      <a-select
        v-model:value="selectedPhenomenonIds"
        mode="multiple"
        placeholder="请选择不良现象"
        style="width: 100%"
        :filter-option="filterOption"
        show-search
      >
        <a-select-option v-for="phenomenon in availablePhenomena" :key="phenomenon.id" :value="phenomenon.id">
          {{ phenomenon.phenomenonName }}
        </a-select-option>
      </a-select>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  ImportOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import type { InspScheme, InspSchemeDetail, InspStrategy, InspectionItem, MaterialSpec } from '@/types'
import {
  getInspSchemeDetail,
  createInspScheme,
  updateInspScheme,
  batchUpdateInspSchemeDetails,
  getInspStrategiesByScheme,
  createInspStrategy,
  updateInspStrategy,
  deleteInspStrategy,
  toggleInspStrategyStatus
} from '@/api/inspScheme'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const activeTab = ref('basic')
const saving = ref(false)

// 根据路由路径自动切换标签页
if (route.path.includes('/strategies')) {
  activeTab.value = 'strategies'
}

// 表单数据
const formData = reactive<Partial<InspScheme>>({
  schemeCode: '',
  schemeName: '',
  version: 'V1.0',
  status: 'DRAFT',
  description: '',
  details: []
})

// 检验项目明细相关
const selectedRowKeys = ref<string[]>([])
const detailColumns = [
  { title: '序号', key: 'sortOrder', width: 80 },
  { title: '检验项目', key: 'inspItemName', width: 250 },
  { title: '特性分类', key: 'characteristicClass', width: 120 },
  { title: '抽样规则', key: 'samplingRule', width: 200 },
  { title: '检验方法', key: 'inspMethod', width: 180 },
  { title: 'SPC', key: 'spcEnabled', width: 80 },
  { title: '送检', key: 'labRequired', width: 80 },
  { title: '操作', key: 'action', fixed: 'right', width: 150 }
]

// 策略相关
const strategies = ref<InspStrategy[]>([])
const loadingStrategies = ref(false)
const strategyColumns = [
  { title: '策略名称', dataIndex: 'strategyName', key: 'strategyName' },
  { title: '上下文', key: 'contextType', width: 100 },
  { title: '匹配维度', key: 'matchDimension', width: 300 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 }
]

// 基础数据
const inspectionItems = ref<InspectionItem[]>([])
const samplingRules = ref<any[]>([])
const inspMethods = ref<any[]>([])

// 明细弹窗
const detailModalVisible = ref(false)
const detailModalTitle = ref('添加检验项目')
const currentDetail = reactive<Partial<InspSchemeDetail>>({
  sortOrder: 1,
  characteristicClass: 'Major',
  spcEnabled: false,
  labRequired: false
})

// 策略弹窗
const strategyModalVisible = ref(false)
const strategyModalTitle = ref('新增策略')
const currentStrategy = reactive<Partial<InspStrategy>>({
  strategyName: '',
  contextType: 'IQC',
  matchDimension: {},
  priority: 100,
  triggerCondition: 'ALWAYS',
  status: 'enabled'
})

// 不良现象绑定相关
const selectedDetailId = ref<string | null>(null)
const phenomenonModalVisible = ref(false)
const selectedPhenomenonIds = ref<string[]>([])
const availablePhenomena = ref<any[]>([
  { id: '1', phenomenonName: '尺寸超差' },
  { id: '2', phenomenonName: '表面划伤' },
  { id: '3', phenomenonName: '毛刺' },
  { id: '4', phenomenonName: '变形' },
  { id: '5', phenomenonName: '裂纹' }
])

const phenomenonColumns = [
  { title: '现象名称', dataIndex: 'phenomenonName', key: 'phenomenonName' },
  { title: '操作', key: 'action', width: 100 }
]

const selectedDetailPhenomena = computed(() => {
  if (!selectedDetailId.value) return []
  const detail = formData.details?.find(d => d.id === selectedDetailId.value)
  if (!detail || !detail.relatedPhenomenonIds) return []
  return availablePhenomena.value.filter(p => detail.relatedPhenomenonIds?.includes(p.id))
})

// 物料规格相关
const materialSpecs = ref<MaterialSpec[]>([])
const loadingSpecs = ref(false)
const hasSpecChanges = ref(false)

const specColumns = [
  { title: '物料ID', dataIndex: 'materialId', key: 'materialId', width: 120 },
  { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
  { title: '目标值', key: 'targetValue', width: 120 },
  { title: '上限(USL)', key: 'upperLimit', width: 120 },
  { title: '下限(LSL)', key: 'lowerLimit', width: 120 },
  { title: '单位', dataIndex: 'uom', key: 'uom', width: 80 },
  { title: '操作', key: 'action', width: 100 }
]

// 加载数据
const loadData = async () => {
  if (isEdit.value) {
    try {
      const res = await getInspSchemeDetail(route.params.id as string)
      if (res.data.success) {
        Object.assign(formData, res.data.data)
      }
    } catch (error) {
      message.error('加载数据失败')
    }
  }
}

// 加载策略
const loadStrategies = async () => {
  if (!isEdit.value) return
  loadingStrategies.value = true
  try {
    const res = await getInspStrategiesByScheme(route.params.id as string)
    if (res.data.success) {
      strategies.value = res.data.data
    }
  } catch (error) {
    message.error('加载策略失败')
  } finally {
    loadingStrategies.value = false
  }
}

// 保存
const handleSave = async () => {
  if (!formData.schemeCode || !formData.schemeName) {
    message.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await updateInspScheme(route.params.id as string, formData)
      await batchUpdateInspSchemeDetails(route.params.id as string, formData.details || [])
      message.success('保存成功')
    } else {
      const res = await createInspScheme(formData)
      if (res.data.success) {
        message.success('创建成功')
        router.push(`/inspection-model/insp-scheme/edit/${res.data.data.id}`)
      }
    }
  } catch (error) {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 返回
const handleBack = () => {
  router.back()
}

// 添加明细
const handleAddDetail = () => {
  detailModalTitle.value = '添加检验项目'
  Object.assign(currentDetail, {
    sortOrder: (formData.details?.length || 0) + 1,
    characteristicClass: 'Major',
    spcEnabled: false,
    labRequired: false
  })
  detailModalVisible.value = true
}

// 明细弹窗确认
const handleDetailModalOk = () => {
  if (!currentDetail.inspItemId) {
    message.warning('请选择检验项目')
    return
  }
  
  if (!formData.details) {
    formData.details = []
  }
  
  formData.details.push({ ...currentDetail } as InspSchemeDetail)
  detailModalVisible.value = false
}

// 删除明细
const handleDeleteDetail = (index: number) => {
  formData.details?.splice(index, 1)
}

// 批量删除
const handleBatchDelete = () => {
  Modal.confirm({
    title: '确认删除选中的项目？',
    onOk: () => {
      formData.details = formData.details?.filter(d => !selectedRowKeys.value.includes(d.id))
      selectedRowKeys.value = []
    }
  })
}

// 选择变化
const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys
}

// 过滤选项
const filterOption = (input: string, option: any) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 项目变化
const handleItemChange = (itemId: string, record: InspSchemeDetail) => {
  const item = inspectionItems.value.find(i => i.id === itemId)
  if (item) {
    record.inspItemName = item.name
    record.inspItemCode = item.code
  }
}

// 明细项目变化（弹窗中）
const handleDetailItemChange = (itemId: string) => {
  const item = inspectionItems.value.find(i => i.id === itemId)
  if (item) {
    currentDetail.inspItemName = item.name
    currentDetail.inspItemCode = item.code
  }
}

// 编辑明细
const handleEditDetail = (record: InspSchemeDetail) => {
  detailModalTitle.value = '编辑检验项目'
  Object.assign(currentDetail, { ...record })
  detailModalVisible.value = true
}

// 从模板导入
const handleImportFromTemplate = () => {
  message.info('从模板导入功能开发中...')
}

// 查看模板
const handleViewTemplate = () => {
  if (formData.sourceTemplateId) {
    router.push(`/inspection-model/insp-templates/view/${formData.sourceTemplateId}`)
  }
}

// 编辑策略
const handleEditStrategy = (record: InspStrategy) => {
  strategyModalTitle.value = '编辑策略'
  Object.assign(currentStrategy, { ...record })
  strategyModalVisible.value = true
}

// 添加策略
const handleAddStrategy = () => {
  strategyModalTitle.value = '新增策略'
  Object.assign(currentStrategy, {
    schemeId: route.params.id,
    strategyName: '',
    contextType: 'IQC',
    matchDimension: {},
    priority: 100,
    triggerCondition: 'ALWAYS',
    status: 'enabled'
  })
  strategyModalVisible.value = true
}

// 策略弹窗确认
const handleStrategyModalOk = async () => {
  if (!currentStrategy.strategyName) {
    message.warning('请输入策略名称')
    return
  }

  try {
    await createInspStrategy(currentStrategy as InspStrategy)
    message.success('创建成功')
    strategyModalVisible.value = false
    loadStrategies()
  } catch (error) {
    message.error('创建失败')
  }
}

// 删除策略
const handleDeleteStrategy = async (record: InspStrategy) => {
  Modal.confirm({
    title: '确认删除？',
    onOk: async () => {
      try {
        await deleteInspStrategy(record.id)
        message.success('删除成功')
        loadStrategies()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

// 切换策略状态
const handleToggleStrategyStatus = async (record: InspStrategy, checked: boolean) => {
  try {
    await toggleInspStrategyStatus(record.id, checked ? 'enabled' : 'disabled')
    message.success('状态更新成功')
    loadStrategies()
  } catch (error) {
    message.error('状态更新失败')
  }
}

// 不良现象绑定相关方法
const handleSelectDetail = (item: InspSchemeDetail) => {
  selectedDetailId.value = item.id
}

const handleAddPhenomenon = () => {
  selectedPhenomenonIds.value = []
  phenomenonModalVisible.value = true
}

const handlePhenomenonModalOk = () => {
  if (!selectedDetailId.value || selectedPhenomenonIds.value.length === 0) {
    message.warning('请选择不良现象')
    return
  }
  
  const detail = formData.details?.find(d => d.id === selectedDetailId.value)
  if (detail) {
    if (!detail.relatedPhenomenonIds) {
      detail.relatedPhenomenonIds = []
    }
    // 合并新选择的现象ID
    detail.relatedPhenomenonIds = [
      ...new Set([...detail.relatedPhenomenonIds, ...selectedPhenomenonIds.value])
    ]
  }
  
  phenomenonModalVisible.value = false
  message.success('添加成功')
}

const handleRemovePhenomenon = (record: any) => {
  if (!selectedDetailId.value) return
  
  const detail = formData.details?.find(d => d.id === selectedDetailId.value)
  if (detail && detail.relatedPhenomenonIds) {
    detail.relatedPhenomenonIds = detail.relatedPhenomenonIds.filter(id => id !== record.id)
    message.success('移除成功')
  }
}

// 物料规格相关方法
const handleRefreshSpecs = async () => {
  loadingSpecs.value = true
  try {
    // TODO: 实现从策略和物料档案获取规格
    // 模拟数据
    materialSpecs.value = [
      {
        id: '1',
        orgId: '1',
        materialId: 'M001',
        inspItemCode: 'ITEM001',
        inspItemName: '长度',
        specType: 'QUANTITATIVE',
        targetValue: 100,
        upperLimit: 100.5,
        lowerLimit: 99.5,
        uom: 'mm',
        createTime: '',
        updateTime: '',
        creator: '',
        updater: ''
      }
    ]
    message.success('刷新成功')
  } catch (error) {
    message.error('刷新失败')
  } finally {
    loadingSpecs.value = false
  }
}

const handleSyncToMaterial = async () => {
  Modal.confirm({
    title: '确认同步',
    content: '是否将当前修改的规格同步至物料档案？',
    onOk: async () => {
      try {
        // TODO: 实现同步逻辑
        message.success('同步成功')
        hasSpecChanges.value = false
      } catch (error) {
        message.error('同步失败')
      }
    }
  })
}

const handleEditSpec = (record: MaterialSpec) => {
  // TODO: 打开规格编辑弹窗
  message.info('编辑规格功能待实现')
}

// 辅助方法
const getStatusColor = (status?: string) => {
  const colorMap: Record<string, string> = {
    DRAFT: 'default',
    IN_APPROVAL: 'processing',
    APPROVED: 'success',
    OBSOLETE: 'error'
  }
  return colorMap[status || 'DRAFT'] || 'default'
}

const getStatusText = (status?: string) => {
  const textMap: Record<string, string> = {
    DRAFT: '草稿',
    IN_APPROVAL: '审批中',
    APPROVED: '已批准',
    OBSOLETE: '已作废'
  }
  return textMap[status || 'DRAFT'] || '草稿'
}

onMounted(() => {
  loadData()
  if (isEdit.value) {
    loadStrategies()
    // 如果是规格标签页，加载规格数据
    if (activeTab.value === 'specs') {
      handleRefreshSpecs()
    }
  }
  // TODO: 加载基础数据（检验项目、抽样规则、检验方法等）
})
</script>

<style scoped>
.insp-scheme-edit .detail-toolbar,
.insp-scheme-edit .strategy-toolbar,
.insp-scheme-edit .spec-toolbar {
  margin-bottom: 16px;
}

.insp-scheme-edit .match-dimension {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.insp-scheme-edit .selected-item {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}
</style>

