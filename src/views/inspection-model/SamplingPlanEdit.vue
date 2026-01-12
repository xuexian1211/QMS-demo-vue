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
          <a-col :span="8">
            <a-form-item label="方案代码" name="planCode">
              <a-input v-model:value="form.planCode" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="方案名称" name="planName">
              <a-input v-model:value="form.planName" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="抽样方法" name="samplingMethod">
              <a-select v-model:value="form.samplingMethod" :disabled="isView" :options="samplingMethodOptions" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="引用标准" name="standard">
              <a-input v-model:value="form.standard" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="描述" name="description">
              <a-input v-model:value="form.description" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="rules" tab="抽样规则">
            <a-button type="dashed" size="small" style="margin-bottom:8px" @click="addRule" v-if="!isView">新增规则</a-button>
            <a-table :columns="ruleColumns" :data-source="rulesData" row-key="id" size="small" />
          </a-tab-pane>
          <a-tab-pane key="details" tab="抽样明细">
            <a-button type="dashed" size="small" style="margin-bottom:8px" @click="addDetail" v-if="!isView">新增明细</a-button>
            <a-table :columns="detailColumns" :data-source="detailsData" row-key="id" size="small" />
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
  if (isView.value) return '抽样方案-查看'
  return route.params.id ? '抽样方案-编辑' : '抽样方案-新增'
})

const samplingMethodOptions = [
  { value: 'FIXED_QUANTITY', label: '固定数量' },
  { value: 'PERCENTAGE', label: '百分比' },
  { value: 'STANDARD_BASED', label: '国标/标准' },
  { value: 'FULL_INSPECTION', label: '全检' }
]

const form = reactive({
  planCode: '',
  planName: '',
  samplingMethod: undefined as any,
  standard: '',
  description: ''
})

const rules: any = {
  planCode: [{ required: true, message: '请输入方案代码', trigger: 'blur' }],
  planName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  samplingMethod: [{ required: true, message: '请选择抽样方法', trigger: 'change' }]
}

const activeTab = ref('rules')

const rulesData = ref<any[]>([])
const detailsData = ref<any[]>([])

const ruleColumns = [
  { title: '规则代码', dataIndex: 'ruleCode', key: 'ruleCode' },
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '检验水平', dataIndex: 'inspectionLevel', key: 'inspectionLevel' },
  { title: '严格类型', dataIndex: 'inspectionType', key: 'inspectionType' },
  { title: 'AQL', dataIndex: 'aqlValue', key: 'aqlValue' },
  { title: '样本量', dataIndex: 'sampleSize', key: 'sampleSize' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const AButton = resolveComponent('a-button')
    const ASpace = resolveComponent('a-space')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', disabled: isView.value, onClick: () => removeRule(record.id) }, { default: () => '移除' })
    ] }) } }
]

const detailColumns = [
  { title: '批量从', dataIndex: 'batchSizeMin', key: 'batchSizeMin' },
  { title: '批量至', dataIndex: 'batchSizeMax', key: 'batchSizeMax' },
  { title: '样本量字码', dataIndex: 'sampleSizeCode', key: 'sampleSizeCode' },
  { title: '接收数Ac', dataIndex: 'acceptanceNumber', key: 'acceptanceNumber' },
  { title: '拒收数Re', dataIndex: 'rejectionNumber', key: 'rejectionNumber' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const AButton = resolveComponent('a-button')
    const ASpace = resolveComponent('a-space')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', disabled: isView.value, onClick: () => removeDetail(record.id) }, { default: () => '移除' })
    ] }) } }
]

const addRule = () => {
  const id = Date.now()
  rulesData.value.push({ id, ruleCode: `RULE-${id}`, ruleName: 'II级正常单次AQL=0.65', inspectionLevel: 'II', inspectionType: 'NORMAL', aqlValue: 0.65, sampleSize: 20 })
}
const removeRule = (id: number) => {
  rulesData.value = rulesData.value.filter(r => r.id !== id)
}
const addDetail = () => {
  const id = Date.now()
  detailsData.value.push({ id, batchSizeMin: 91, batchSizeMax: 150, sampleSizeCode: 'G', acceptanceNumber: 0, rejectionNumber: 1 })
}
const removeDetail = (id: number) => {
  detailsData.value = detailsData.value.filter(r => r.id !== id)
}

const handleBack = () => {
  router.push('/inspection-model/sampling-plans')
}

const handleSave = async () => {
  try {
    saving.value = true
    await formRef.value?.validate()
    message.success('保存成功')
    router.push('/inspection-model/sampling-plans')
  } catch (e) {
    message.error('请完善必填项')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const id = route.params.id as string | undefined
  if (id) {
    Object.assign(form, { planCode: 'AQL-GB2828', planName: 'GB/T 2828.1-2012 AQL抽样', samplingMethod: 'STANDARD_BASED', standard: 'GB/T 2828.1-2012', description: '公司所有AQL抽样的集合' })
    rulesData.value = [{ id: 10, ruleCode: 'AQL-GB2828-L2-N-0.65', ruleName: 'II级正常单次AQL=0.65', inspectionLevel: 'II', inspectionType: 'NORMAL', aqlValue: 0.65, sampleSize: 20 }]
    detailsData.value = [{ id: 101, batchSizeMin: 91, batchSizeMax: 150, sampleSizeCode: 'G', acceptanceNumber: 0, rejectionNumber: 1 }]
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

