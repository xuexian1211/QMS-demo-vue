<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack" class="back-button">
          <template #icon>
            <ArrowLeftOutlined />
          </template>
          返回
        </a-button>
        <div class="title-section">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <a-tag v-if="form.version" color="blue">{{ form.version }}</a-tag>
          <a-tag :color="getStatusColor(form.status)">{{ getStatusText(form.status) }}</a-tag>
        </div>
      </div>
      <div class="header-actions" v-if="!isView">
        <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
      </div>
    </div>

    <a-card class="form-card" title="基本信息">
      <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }">
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="方案编码" name="planCode">
              <a-input v-model:value="form.planCode" :disabled="isView || isEdit" placeholder="请输入" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="方案名称" name="planName">
              <a-input v-model:value="form.planName" :disabled="isView" placeholder="请输入" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="版本" name="version">
              <a-input v-model:value="form.version" :disabled="isView" placeholder="如：V1.0" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="检验类型" name="inspType">
              <a-select v-model:value="form.inspType" :disabled="isView" placeholder="请选择">
                <a-select-option value="IQC">IQC来料检验</a-select-option>
                <a-select-option value="IPQC">IPQC过程检验</a-select-option>
                <a-select-option value="FQC">FQC成品检验</a-select-option>
                <a-select-option value="OQC">OQC出货检验</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联模板" name="templateId">
              <a-select v-model:value="form.templateId" :disabled="isView" placeholder="请选择">
                <a-select-option v-for="t in templateOptions" :key="t.id" :value="t.id">{{ t.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态">
              <a-tag :color="getStatusColor(form.status)">{{ getStatusText(form.status) }}</a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="16">
            <a-form-item label="备注" name="remark" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea v-model:value="form.remark" :disabled="isView" :rows="2" placeholder="请输入备注" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card class="tab-card">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="binding" tab="方案关联绑定">
          <div class="tab-toolbar" v-if="!isView">
            <a-button type="primary" size="small" @click="handleAddBinding">
              <template #icon>
                <PlusOutlined />
              </template>新增绑定
            </a-button>
          </div>
          <a-table :columns="bindingColumns" :data-source="bindings" row-key="id" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'contextType'">
                <a-tag>{{ record.contextType }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space v-if="!isView">
                  <a-button type="link" size="small" @click="handleEditBinding(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="handleRemoveBinding(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="details" tab="方案明细">
          <div class="tab-toolbar" v-if="!isView">
            <a-button type="primary" size="small" @click="handleAddDetail">
              <template #icon>
                <PlusOutlined />
              </template>新增明细
            </a-button>
          </div>
          <a-table :columns="detailColumns" :data-source="details" row-key="id" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'isLabTestRequired'">
                <a-switch v-model:checked="record.isLabTestRequired" :disabled="isView" size="small" />
              </template>
              <template v-if="column.key === 'isSpcRequired'">
                <a-switch v-model:checked="record.isSpcRequired" :disabled="isView" size="small" />
              </template>
              <template v-if="column.key === 'action'">
                <a-space v-if="!isView">
                  <a-button type="link" size="small" @click="handleEditDetail(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="handleRemoveDetail(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="phenomenon" tab="明细不良现象绑定">
          <div class="tab-toolbar" v-if="!isView">
            <a-button type="primary" size="small" @click="handleAddPhenomenonMap">
              <template #icon>
                <PlusOutlined />
              </template>新增绑定
            </a-button>
          </div>
          <a-table :columns="phenomenonColumns" :data-source="phenomenonMaps" row-key="id" size="small"
            :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" danger size="small" @click="handleRemovePhenomenonMap(record)"
                  v-if="!isView">删除</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="materialSpec" tab="物料检验规格">
          <div class="tab-toolbar" v-if="!isView">
            <a-button type="primary" size="small" @click="handleAddMaterialSpec">
              <template #icon>
                <PlusOutlined />
              </template>新增规格
            </a-button>
          </div>
          <a-table :columns="materialSpecColumns" :data-source="materialSpecs" row-key="id" size="small"
            :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'dataType'">
                <a-tag :color="record.dataType === 'QUANTITATIVE' ? 'blue' : 'purple'">
                  {{ record.dataType === 'QUANTITATIVE' ? '计量型' : '计数型' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space v-if="!isView">
                  <a-button type="link" size="small" @click="handleEditMaterialSpec(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="handleRemoveMaterialSpec(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { message, Modal } from 'ant-design-vue'
  import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'

  const router = useRouter()
  const route = useRoute()

  // --- 状态定义 ---
  const formRef = ref()
  const saving = ref(false)
  const activeTab = ref('binding')

  const isView = computed(() => route.path.includes('/view/'))
  const isEdit = computed(() => route.path.includes('/edit/'))
  const pageTitle = computed(() => {
    if (isView.value) return '查看检验方案'
    return isEdit.value ? '编辑检验方案' : '新增检验方案'
  })

  // 模板选项
  const templateOptions = ref([
    { id: '1', name: 'IQC原材料检验模板' },
    { id: '2', name: 'IPQC过程检验模板' },
    { id: '3', name: 'FQC成品检验模板' },
    { id: '4', name: 'OQC出货检验模板' },
  ])

  // 表单状态
  const form = reactive({
    id: null as string | null,
    planCode: '',
    planName: '',
    version: 'V1.0',
    status: 'DRAFT',
    inspType: undefined as string | undefined,
    templateId: undefined as string | undefined,
    remark: ''
  })

  const rules = {
    planCode: [{ required: true, message: '请输入方案编码', trigger: 'blur' }],
    planName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
    inspType: [{ required: true, message: '请选择检验类型', trigger: 'change' }]
  }

  // 状态显示
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = { DRAFT: 'default', IN_APPROVAL: 'processing', APPROVED: 'success', OBSOLETE: 'error' }
    return colorMap[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = { DRAFT: '草稿', IN_APPROVAL: '审批中', APPROVED: '已批准', OBSOLETE: '已作废' }
    return textMap[status] || status
  }

  // --- 关联绑定 ---
  const bindings = ref < any[] > ([])
  const bindingColumns = [
    { title: '业务上下文', dataIndex: 'contextType', key: 'contextType', width: 120 },
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 150 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName', width: 120 },
    { title: '工序', dataIndex: 'operationName', key: 'operationName', width: 100 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { title: '操作', key: 'action', width: 120 }
  ]

  // --- 方案明细 ---
  const details = ref < any[] > ([])
  const detailColumns = [
    { title: '检验项目', dataIndex: 'itemName', key: 'itemName', width: 150 },
    { title: '抽样规则', dataIndex: 'samplingRuleName', key: 'samplingRuleName', width: 150 },
    { title: '检验方法', dataIndex: 'methodName', key: 'methodName', width: 120 },
    { title: '量检具', dataIndex: 'instrumentName', key: 'instrumentName', width: 100 },
    { title: '实验室', key: 'isLabTestRequired', width: 80 },
    { title: 'SPC', key: 'isSpcRequired', width: 60 },
    { title: '操作', key: 'action', width: 120 }
  ]

  // --- 不良现象绑定 ---
  const phenomenonMaps = ref < any[] > ([])
  const phenomenonColumns = [
    { title: '检验项目', dataIndex: 'itemName', key: 'itemName', width: 150 },
    { title: '不良现象', dataIndex: 'phenomenonName', key: 'phenomenonName', width: 200 },
    { title: '不良分类', dataIndex: 'categoryName', key: 'categoryName', width: 120 },
    { title: '操作', key: 'action', width: 80 }
  ]

  // --- 物料检验规格 ---
  const materialSpecs = ref < any[] > ([])
  const materialSpecColumns = [
    { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
    { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 120 },
    { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 100 },
    { title: '目标值', dataIndex: 'targetValue', key: 'targetValue', width: 80 },
    { title: '上限', dataIndex: 'upperLimit', key: 'upperLimit', width: 80 },
    { title: '下限', dataIndex: 'lowerLimit', key: 'lowerLimit', width: 80 },
    { title: '单位', dataIndex: 'uom', key: 'uom', width: 60 },
    { title: '操作', key: 'action', width: 120 }
  ]

  // --- 操作方法 ---
  const handleBack = () => {
    router.push('/inspection-model/insp-plans')
  }

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

  // 绑定操作
  const handleAddBinding = () => {
    bindings.value.push({
      id: Date.now().toString(),
      contextType: 'IQC',
      materialCode: 'M001',
      materialName: '铝锭',
      supplierName: '供应商A',
      operationName: '',
      priority: 10
    })
    message.success('已添加绑定')
  }

  const handleEditBinding = (record: any) => {
    message.info('编辑绑定: ' + record.id)
  }

  const handleRemoveBinding = (record: any) => {
    bindings.value = bindings.value.filter(i => i.id !== record.id)
    message.success('已删除绑定')
  }

  // 明细操作
  const handleAddDetail = () => {
    details.value.push({
      id: Date.now().toString(),
      itemName: '长度',
      samplingRuleName: 'AQL 0.65 Level II',
      methodName: '卡尺测量',
      instrumentName: '游标卡尺',
      isLabTestRequired: false,
      isSpcRequired: true
    })
    message.success('已添加明细')
  }

  const handleEditDetail = (record: any) => {
    message.info('编辑明细: ' + record.id)
  }

  const handleRemoveDetail = (record: any) => {
    details.value = details.value.filter(i => i.id !== record.id)
    message.success('已删除明细')
  }

  // 不良现象绑定操作
  const handleAddPhenomenonMap = () => {
    phenomenonMaps.value.push({
      id: Date.now().toString(),
      itemName: '长度',
      phenomenonName: '尺寸超差',
      categoryName: '尺寸类'
    })
    message.success('已添加不良现象绑定')
  }

  const handleRemovePhenomenonMap = (record: any) => {
    phenomenonMaps.value = phenomenonMaps.value.filter(i => i.id !== record.id)
    message.success('已删除不良现象绑定')
  }

  // 物料规格操作
  const handleAddMaterialSpec = () => {
    materialSpecs.value.push({
      id: Date.now().toString(),
      materialCode: 'M001',
      inspItemName: '长度',
      dataType: 'QUANTITATIVE',
      targetValue: 100,
      upperLimit: 101,
      lowerLimit: 99,
      uom: 'mm'
    })
    message.success('已添加物料规格')
  }

  const handleEditMaterialSpec = (record: any) => {
    message.info('编辑物料规格: ' + record.id)
  }

  const handleRemoveMaterialSpec = (record: any) => {
    materialSpecs.value = materialSpecs.value.filter(i => i.id !== record.id)
    message.success('已删除物料规格')
  }

  // 加载数据
  onMounted(() => {
    const id = route.params.id as string | undefined
    if (id) {
      // 模拟加载数据
      Object.assign(form, {
        id,
        planCode: 'IP-HFC-CASTING',
        planName: '合肥工厂-压铸件通用方案',
        version: 'V1.0',
        status: 'APPROVED',
        inspType: 'IPQC',
        templateId: '2',
        remark: '用于压铸件过程检验'
      })
      bindings.value = [
        { id: '801', contextType: 'IPQC', materialCode: 'M007', materialName: '压铸件壳体', supplierName: '', operationName: '压铸工序', priority: 10 }
      ]
      details.value = [
        { id: '701', itemName: '壳体A面平面度', samplingRuleName: 'AQL 0.65', methodName: '三坐标测量', instrumentName: '三坐标测量机', isLabTestRequired: false, isSpcRequired: true }
      ]
      phenomenonMaps.value = [
        { id: '1', itemName: '壳体A面平面度', phenomenonName: '平面度超差', categoryName: '尺寸类' }
      ]
      materialSpecs.value = [
        { id: '901', materialCode: 'M007', inspItemName: '壳体A面平面度', dataType: 'QUANTITATIVE', targetValue: 0.05, upperLimit: 0.08, lowerLimit: 0, uom: 'mm' }
      ]
    }
  })
</script>

<style scoped>
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    background: #fff;
    padding: 16px;
    border-radius: 4px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-button {
    padding: 0;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .form-card {
    margin-bottom: 16px;
  }

  .tab-card {
    margin-bottom: 16px;
  }

  .tab-toolbar {
    margin-bottom: 12px;
  }
</style>