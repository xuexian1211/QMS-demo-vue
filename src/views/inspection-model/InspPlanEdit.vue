<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack" class="back-button">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </a-button>
        <div class="title-section">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="handleSave" :loading="saving" v-if="!isView">保存</a-button>
      </div>
    </div>

    <a-card size="small" class="form-card">
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="组织ID" name="orgId">
              <a-input-number v-model:value="form.orgId" :disabled="isView" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="方案编码" name="planCode">
              <a-input v-model:value="form.planCode" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="方案名称" name="planname">
              <a-input v-model:value="form.planname" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="版本号" name="version">
              <a-input v-model:value="form.version" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="form.status" :disabled="isView" :options="statusOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="流程ID" name="workflowInstanceId">
              <a-input-number v-model:value="form.workflowInstanceId" :disabled="isView" style="width:100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="binding" tab="方案关联绑定">
            <a-button type="dashed" size="small" style="margin-bottom:8px" @click="addBinding" v-if="!isView">新增绑定</a-button>
            <a-table :columns="bindingColumns" :data-source="bindings" row-key="id" size="small" />
          </a-tab-pane>
          <a-tab-pane key="details" tab="方案明细">
            <a-button type="dashed" size="small" style="margin-bottom:8px" @click="addDetail" v-if="!isView">新增明细</a-button>
            <a-table :columns="detailColumns" :data-source="details" row-key="id" size="small" />
          </a-tab-pane>
          <a-tab-pane key="phenomenon" tab="明细不良现象绑定">
            <a-button type="dashed" size="small" style="margin-bottom:8px" @click="addPhenomenonMap" v-if="!isView">新增绑定</a-button>
            <a-table :columns="phenomenonColumns" :data-source="phenomenonMaps" row-key="id" size="small" />
          </a-tab-pane>
          <a-tab-pane key="materialSpec" tab="物料检验规格">
            <a-button type="dashed" size="small" style="margin-bottom:8px" @click="addMaterialSpec" v-if="!isView">新增规格</a-button>
            <a-table :columns="materialSpecColumns" :data-source="materialSpecs" row-key="id" size="small" />
          </a-tab-pane>
        </a-tabs>

        <a-space>
          <a-button @click="handleBack">返回列表</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, h, resolveComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const formRef = ref()
const saving = ref(false)
const isView = computed(() => route.path.includes('/view/'))
const pageTitle = computed(() => {
  if (isView.value) return '检验方案-查看'
  return route.params.id ? '检验方案-编辑' : '检验方案-新增'
})

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'IN_APPROVAL', label: '审批中' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'OBSOLETE', label: '已作废' }
]

const form = reactive({
  orgId: null as number | null,
  planCode: '',
  planname: '',
  version: '',
  status: undefined as any,
  workflowInstanceId: null as number | null
})

const rules: any = {
  orgId: [{ required: true, type: 'number', message: '请输入组织ID', trigger: 'change' }],
  planCode: [{ required: true, message: '请输入方案编码', trigger: 'blur' }],
  planname: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const activeTab = ref('binding')

const bindings = ref<any[]>([])
const bindingColumns = [
  { title: '业务上下文', dataIndex: 'contextType', key: 'contextType' },
  { title: '物料ID', dataIndex: 'materialId', key: 'materialId' },
  { title: '物料组ID', dataIndex: 'materialGroupId', key: 'materialGroupId' },
  { title: '供应商ID', dataIndex: 'supplierId', key: 'supplierId' },
  { title: '客户ID', dataIndex: 'customerId', key: 'customerId' },
  { title: '工序号', dataIndex: 'operationNo', key: 'operationNo' },
  { title: 'IPQC类型', dataIndex: 'ipqcType', key: 'ipqcType' },
  { title: '触发条件', dataIndex: 'triggerCondition', key: 'triggerCondition' },
  { title: '触发值', dataIndex: 'triggerValue', key: 'triggerValue' },
  { title: '优先级', dataIndex: 'priority', key: 'priority' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const AButton = resolveComponent('a-button')
    const ASpace = resolveComponent('a-space')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', disabled: isView.value, onClick: () => removeBinding(record.id) }, { default: () => '移除' })
    ] }) } }
]

const details = ref<any[]>([])
const detailColumns = [
  { title: '检验项ID', dataIndex: 'itemId', key: 'itemId' },
  { title: '检验项名称', dataIndex: 'itemName', key: 'itemName' },
  { title: '顺序', dataIndex: 'sequence', key: 'sequence' },
  { title: '抽样规则ID', dataIndex: 'samplingRuleId', key: 'samplingRuleId' },
  { title: '特性分类', dataIndex: 'characteristicClass', key: 'characteristicClass' },
  { title: '检验方法ID', dataIndex: 'methodId', key: 'methodId' },
  { title: '量具类型ID', dataIndex: 'instrumentTypeId', key: 'instrumentTypeId' },
  { title: '送检实验室', dataIndex: 'isLabTestRequired', key: 'isLabTestRequired', customRender: ({ text }: any) => text ? '是' : '否' },
  { title: '频次类型', dataIndex: 'frequencyType', key: 'frequencyType' },
  { title: '频次值', dataIndex: 'frequencyValue', key: 'frequencyValue' },
  { title: '频次单位', dataIndex: 'frequencyUnit', key: 'frequencyUnit' },
  { title: 'SPC监控', dataIndex: 'isSpcRequired', key: 'isSpcRequired', customRender: ({ text }: any) => text ? '是' : '否' },
  { title: 'SIP附件ID', dataIndex: 'attachmentId', key: 'attachmentId' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const AButton = resolveComponent('a-button')
    const ASpace = resolveComponent('a-space')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', disabled: isView.value, onClick: () => removeDetail(record.id) }, { default: () => '移除' })
    ] }) } }
]

const phenomenonMaps = ref<any[]>([])
const phenomenonColumns = [
  { title: '方案明细ID', dataIndex: 'planDetailId', key: 'planDetailId' },
  { title: '不良现象ID', dataIndex: 'phenomenonId', key: 'phenomenonId' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const AButton = resolveComponent('a-button')
    const ASpace = resolveComponent('a-space')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', disabled: isView.value, onClick: () => removePhenomenonMap(record.id) }, { default: () => '移除' })
    ] }) } }
]

const materialSpecs = ref<any[]>([])
const materialSpecColumns = [
  { title: '物料ID', dataIndex: 'materialId', key: 'materialId' },
  { title: '检验项ID', dataIndex: 'inspItemId', key: 'inspItemId' },
  { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
  { title: '目标值', dataIndex: 'targetValue', key: 'targetValue' },
  { title: '上限', dataIndex: 'upperLimit', key: 'upperLimit' },
  { title: '下限', dataIndex: 'lowerLimit', key: 'lowerLimit' },
  { title: '单位', dataIndex: 'uom', key: 'uom' },
  { title: '标准描述', dataIndex: 'standardText', key: 'standardText' },
  { title: '标准代码', dataIndex: 'standardCode', key: 'standardCode' },
  { title: '期望值', dataIndex: 'expectedValue', key: 'expectedValue' },
  { title: '附件ID', dataIndex: 'attachmentId', key: 'attachmentId' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const AButton = resolveComponent('a-button')
    const ASpace = resolveComponent('a-space')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', disabled: isView.value, onClick: () => removeMaterialSpec(record.id) }, { default: () => '移除' })
    ] }) } }
]

const addBinding = () => {
  const id = Date.now()
  bindings.value.push({ id, contextType: 'IQC', materialId: 'M007', supplierId: 'S02', triggerCondition: 'ALWAYS', triggerValue: null, priority: 10 })
}
const removeBinding = (id: number) => { bindings.value = bindings.value.filter(r => r.id !== id) }

const addDetail = () => {
  const id = Date.now()
  details.value.push({ id, itemId: 101, itemName: '壳体A面平面度', sequence: 10, samplingRuleId: 10, characteristicClass: 'CC', methodId: 201, instrumentTypeId: 301, isLabTestRequired: false, frequencyType: 'PER_TIME', frequencyValue: 2, frequencyUnit: 'HOURS', isSpcRequired: true, attachmentId: '' })
}
const removeDetail = (id: number) => { details.value = details.value.filter(r => r.id !== id) }

const addPhenomenonMap = () => {
  const id = Date.now()
  phenomenonMaps.value.push({ id, planDetailId: 701, phenomenonId: 401 })
}
const removePhenomenonMap = (id: number) => { phenomenonMaps.value = phenomenonMaps.value.filter(r => r.id !== id) }

const addMaterialSpec = () => {
  const id = Date.now()
  materialSpecs.value.push({ id, materialId: 'M007', inspItemId: 701, dataType: 'QUANTITATIVE', targetValue: 50.0, upperLimit: 50.02, lowerLimit: 49.98, uom: 'mm', standardText: '', standardCode: '', expectedValue: '', attachmentId: '' })
}
const removeMaterialSpec = (id: number) => { materialSpecs.value = materialSpecs.value.filter(r => r.id !== id) }

const handleBack = () => { router.push('/inspection-model/insp-plans') }

const handleSave = async () => {
  try {
    saving.value = true
    await formRef.value?.validate()
    message.success('保存成功')
    router.push('/inspection-model/insp-plans')
  } catch (e) {
    message.error('请完善必填项')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const id = route.params.id as string | undefined
  if (id) {
    Object.assign(form, { orgId: 1, planCode: 'IP-HFC-CASTING', planname: '合肥工厂-压铸件通用方案', version: 'V1.0', status: 'APPROVED', workflowInstanceId: 1001 })
    bindings.value = [{ id: 801, contextType: 'IQC', materialId: 'M007', supplierId: 'S02', triggerCondition: 'ALWAYS', triggerValue: null, priority: 10 }]
    details.value = [{ id: 701, itemId: 101, itemName: '壳体A面平面度', sequence: 10, samplingRuleId: 10, characteristicClass: 'CC', methodId: 201, instrumentTypeId: 301, isLabTestRequired: false, frequencyType: 'PER_TIME', frequencyValue: 2, frequencyUnit: 'HOURS', isSpcRequired: true, attachmentId: '' }]
    phenomenonMaps.value = [{ id: 1, planDetailId: 701, phenomenonId: 401 }]
    materialSpecs.value = [{ id: 901, materialId: 'M007', inspItemId: 701, dataType: 'QUANTITATIVE', targetValue: 50.0, upperLimit: 50.02, lowerLimit: 49.98, uom: 'mm', standardText: '', standardCode: '', expectedValue: '', attachmentId: '' }]
  }
})
</script>

<style scoped>
.page-container { padding:24px; background:#f5f5f5; min-height:calc(100vh - 60px) }
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
.header-left { display:flex; align-items:center; gap:8px }
.back-button { padding:0 }
.page-title { margin:0; font-size:18px; font-weight:600 }
.form-card :deep(.ant-card-body) { padding:16px }
@media (max-width:768px){ .page-container{ padding:8px } }
</style>

