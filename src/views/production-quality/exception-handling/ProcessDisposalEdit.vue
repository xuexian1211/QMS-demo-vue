<template>
  <div class="process-disposal-edit-container">
    <div class="toolbar">
      <a-button @click="handleBack">
        <template #icon><ArrowLeftOutlined /></template>
        返回
      </a-button>
      <a-button @click="handleReset">重置</a-button>
      <a-button type="primary" @click="handleSave" :loading="saving">
        <template #icon><SaveOutlined /></template>
        保存
      </a-button>
    </div>

    <div class="content-container">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        class="edit-form"
      >
        <!-- 基本信息 -->
        <a-card title="基本信息" size="small" class="form-card">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item label="处置单号" name="disposalNo">
                <a-input v-model:value="formData.disposalNo" placeholder="系统自动生成" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="生产工单" name="workOrder">
                <a-input v-model:value="formData.workOrder" placeholder="请输入生产工单号" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发现日期" name="discoveryDate">
                <a-date-picker 
                  v-model:value="formData.discoveryDate" 
                  placeholder="请选择发现日期"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="状态" name="status">
                <a-select v-model:value="formData.status" placeholder="请选择状态" :options="statusOptions" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item label="生产线" name="productionLine">
                <a-select v-model:value="formData.productionLine" placeholder="请选择生产线" :options="productionLines" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="工序" name="process">
                <a-select v-model:value="formData.process" placeholder="请选择工序" :options="processes" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="班次" name="shift">
                <a-select v-model:value="formData.shift" placeholder="请选择班次" :options="shiftOptions" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发现人" name="discoverer">
                <a-input v-model:value="formData.discoverer" placeholder="请输入发现人" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 不合格情况描述 -->
        <a-card title="不合格情况描述" size="small" class="form-card">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="产品编码" name="productCode">
                <a-input v-model:value="formData.productCode" placeholder="请输入产品编码" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="产品名称" name="productName">
                <a-input v-model:value="formData.productName" placeholder="请输入产品名称" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="不合格数量" name="defectQuantity">
                <a-input-number 
                  v-model:value="formData.defectQuantity" 
                  placeholder="请输入不合格数量"
                  :min="1"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="不合格描述" name="defectDescription">
                <a-textarea 
                  v-model:value="formData.defectDescription" 
                  placeholder="请详细描述不合格情况"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="原因分析" name="causeAnalysis">
                <a-textarea 
                  v-model:value="formData.causeAnalysis" 
                  placeholder="请分析不合格原因"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 处置方式 -->
        <a-card title="处置方式" size="small" class="form-card">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="处置方式" name="disposalMethod">
                <a-select v-model:value="formData.disposalMethod" placeholder="请选择处置方式" :options="disposalMethodOptions" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="紧急程度" name="urgencyLevel">
                <a-select v-model:value="formData.urgencyLevel" placeholder="请选择紧急程度" :options="urgencyOptions" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="处置人" name="processor">
                <a-input v-model:value="formData.processor" placeholder="请输入处置人" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="处置措施" name="disposalMeasures">
                <a-textarea 
                  v-model:value="formData.disposalMeasures" 
                  placeholder="请描述具体的处置措施"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="处置结果" name="disposalResult">
                <a-textarea 
                  v-model:value="formData.disposalResult" 
                  placeholder="请描述处置结果"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 人员信息 -->
        <a-card title="人员信息" size="small" class="form-card">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item label="责任部门" name="responsibleDept">
                <a-select v-model:value="formData.responsibleDept" placeholder="请选择责任部门" :options="deptOptions" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="责任人" name="responsiblePerson">
                <a-input v-model:value="formData.responsiblePerson" placeholder="请输入责任人" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="联系电话" name="contactPhone">
                <a-input v-model:value="formData.contactPhone" placeholder="请输入联系电话" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="审核人" name="reviewer">
                <a-input v-model:value="formData.reviewer" placeholder="请输入审核人" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 审核信息 -->
        <a-card title="审核信息" size="small" class="form-card">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="审核意见" name="auditOpinion">
                <a-textarea 
                  v-model:value="formData.auditOpinion" 
                  placeholder="请输入审核意见"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="纠正措施" name="correctiveAction">
                <a-textarea 
                  v-model:value="formData.correctiveAction" 
                  placeholder="请输入纠正措施"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 备注信息 -->
        <a-card title="备注信息" size="small" class="form-card">
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="备注" name="remark">
                <a-textarea 
                  v-model:value="formData.remark" 
                  placeholder="请输入备注信息"
                  :rows="3"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

// 是否为编辑模式
const isEdit = computed(() => route.name === 'ProcessDisposalEdit')

// 表单引用
const formRef = ref()
const saving = ref(false)
const activeTab = ref('basic')

// 表单数据
const formData = reactive({
  disposalNo: '',
  workOrder: '',
  discoveryDate: null,
  status: 'pending',
  productionLine: undefined,
  process: undefined,
  shift: undefined,
  productCode: '',
  productName: '',
  defectQuantity: null,
  defectDescription: '',
  causeAnalysis: '',
  disposalMethod: '',
  urgencyLevel: undefined,
  disposalMeasures: '',
  disposalResult: '',
  discoverer: '',
  processor: '',
  reviewer: '',
  responsibleDept: undefined,
  responsiblePerson: '',
  contactPhone: '',
  auditOpinion: '',
  correctiveAction: '',
  remark: ''
})

// 表单验证规则
const formRules = {
  workOrder: [{ required: true, message: '请输入生产工单号', trigger: 'blur' }],
  discoveryDate: [{ required: true, message: '请选择发现日期', trigger: 'change' }],
  productionLine: [{ required: true, message: '请选择生产线', trigger: 'change' }],
  process: [{ required: true, message: '请选择工序', trigger: 'change' }],
  shift: [{ required: true, message: '请选择班次', trigger: 'change' }],
  productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  defectQuantity: [{ required: true, message: '请输入不合格数量', trigger: 'blur' }],
  defectDescription: [{ required: true, message: '请描述不合格情况', trigger: 'blur' }],
  disposalMethod: [{ required: true, message: '请选择处置方式', trigger: 'change' }],
  discoverer: [{ required: true, message: '请输入发现人', trigger: 'blur' }]
}

// 选项数据
const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' }
]

const productionLines = [
  { value: 'line1', label: '生产线A' },
  { value: 'line2', label: '生产线B' },
  { value: 'line3', label: '生产线C' }
]

const processes = [
  { value: 'cutting', label: '下料工序' },
  { value: 'welding', label: '焊接工序' },
  { value: 'assembly', label: '装配工序' },
  { value: 'painting', label: '喷涂工序' },
  { value: 'testing', label: '测试工序' }
]

const shiftOptions = [
  { value: 'day', label: '白班' },
  { value: 'night', label: '夜班' }
]

const disposalMethodOptions = [
  { value: 'rework', label: '返工' },
  { value: 'scrap', label: '报废' },
  { value: 'repair', label: '维修' },
  { value: 'concession', label: '让步接收' },
  { value: 'downgrade', label: '降级使用' }
]

const urgencyOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' }
]

const deptOptions = [
  { value: 'production', label: '生产部' },
  { value: 'quality', label: '质量部' },
  { value: 'technical', label: '技术部' },
  { value: 'procurement', label: '采购部' }
]

// 返回按钮
const handleBack = () => {
  router.push('/production-quality/exception-handling/process-disposal')
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
  if (!isEdit.value) {
    formData.disposalNo = ''
  }
}

// 保存表单
const handleSave = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (isEdit.value) {
      message.success('更新成功')
    } else {
      message.success('创建成功')
    }
    
    // 返回列表页
    handleBack()
  } catch (error) {
    if (error.errorFields) {
      message.error('请检查表单填写')
    } else {
      message.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 初始化数据
const initData = async () => {
  if (isEdit.value) {
    const id = route.params.id
    // 模拟获取编辑数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    Object.assign(formData, {
      disposalNo: 'PROC202401001',
      workOrder: 'WO202401001',
      discoveryDate: dayjs('2024-01-15'),
      productionLine: 'line1',
      process: 'welding',
      shift: 'day',
      productCode: 'P001',
      productName: '传动轴组件',
      defectQuantity: 5,
      defectDescription: '焊接出现气孔缺陷',
      causeAnalysis: '焊接参数设置不当',
      disposalMethod: 'rework',
      urgencyLevel: 'high',
      disposalMeasures: '重新调整焊接参数进行返工',
      discoverer: '张三',
      processor: '李四',
      reviewer: '王五',
      responsibleDept: 'production',
      responsiblePerson: '张三',
      contactPhone: '13800138000'
    })
  } else {
    // 新建模式，生成处置单号
    formData.disposalNo = `PROC${dayjs().format('YYYYMMDDHHmmss')}`
  }
}

// 生命周期
onMounted(() => {
  initData()
})
</script>

<style scoped>
.process-disposal-edit-container {
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 16px;
}

.toolbar {
  background: #fff;
  padding: 16px 24px;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.content-container {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
  padding: 24px;
}

.edit-form {
  max-width: 1200px;
  margin: 0 auto;
}

.form-card {
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.form-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.form-card :deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

.form-card :deep(.ant-card-body) {
  padding: 24px;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
  color: #262626;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number) {
  border-radius: 6px;
}

:deep(.ant-btn) {
  border-radius: 6px;
  height: 32px;
  font-weight: 500;
}

:deep(.ant-btn-primary) {
  background: #1890ff;
  border-color: #1890ff;
}

:deep(.ant-btn-primary:hover) {
  background: #40a9ff;
  border-color: #40a9ff;
}

:deep(.ant-card) {
  border-radius: 6px;
}

:deep(.ant-textarea) {
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .process-disposal-edit-container {
    padding: 8px;
  }
  
  .toolbar {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  
  .content-container {
    padding: 16px;
  }
  
  .edit-form {
    max-width: 100%;
  }
  
  .form-card :deep(.ant-card-body) {
    padding: 16px;
  }
}

/* 打印样式 */
@media print {
  .toolbar {
    display: none;
  }
  
  .process-disposal-edit-container {
    background: #fff;
    padding: 0;
  }
  
  .content-container {
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .form-card {
    box-shadow: none;
    border: 1px solid #ddd;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
}
</style>