<template>
  <div class="product-disposal-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">成品不合格处理单</h1>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建处置单
      </a-button>
      <a-button @click="handleRefresh">
        <template #icon><ReloadOutlined /></template>
        刷新
      </a-button>
      <a-button @click="handleExport">
        <template #icon><ExportOutlined /></template>
        导出
      </a-button>
    </div>

    <!-- 搜索表单 -->
    <a-card class="search-card">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="处置单号">
          <a-input v-model:value="searchForm.disposalNo" placeholder="请输入处置单号" allow-clear />
        </a-form-item>
        <a-form-item label="检验单号">
          <a-input v-model:value="searchForm.inspectionNo" placeholder="请输入检验单号" allow-clear />
        </a-form-item>
        <a-form-item label="产品编码">
          <a-input v-model:value="searchForm.productCode" placeholder="请输入产品编码" allow-clear />
        </a-form-item>
        <a-form-item label="处理状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px" :options="[
            { value: 'pending', label: '待处理' },
            { value: 'processing', label: '处理中' },
            { value: 'completed', label: '已完成' }
          ]" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 处置单表格 -->
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'disposalMethod'">
            <a-tag :color="getMethodColor(record.disposalMethod)">
              {{ getMethodText(record.disposalMethod) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除这条记录吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新建/编辑处置单模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="900px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        class="modal-form"
      >
        <!-- 基本信息 -->
        <a-card title="基本信息" class="form-card">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="处置单号" name="disposalNo">
                <a-input v-model:value="formData.disposalNo" placeholder="系统自动生成" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="检验单号" name="inspectionNo">
                <a-input v-model:value="formData.inspectionNo" placeholder="请输入检验单号" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="处置日期" name="disposalDate">
                <a-date-picker v-model:value="formData.disposalDate" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="处理状态" name="status">
                <a-select v-model:value="formData.status" placeholder="请选择状态" :options="[
                  { value: 'pending', label: '待处理' },
                  { value: 'processing', label: '处理中' },
                  { value: 'completed', label: '已完成' }
                ]" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 产品信息 -->
        <a-card title="产品信息" class="form-card">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="产品编码" name="productCode">
                <a-input v-model:value="formData.productCode" placeholder="请输入产品编码" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="产品名称" name="productName">
                <a-input v-model:value="formData.productName" placeholder="请输入产品名称" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="批次号" name="batchNo">
                <a-input v-model:value="formData.batchNo" placeholder="请输入批次号" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="生产日期" name="productionDate">
                <a-date-picker v-model:value="formData.productionDate" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="数量" name="quantity">
                <a-input-number v-model:value="formData.quantity" style="width: 100%" :min="0" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="单位" name="unit">
                <a-input v-model:value="formData.unit" placeholder="请输入单位" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 不合格描述 -->
        <a-card title="不合格描述" class="form-card">
          <a-form-item label="不合格描述" name="defectDescription">
            <a-textarea v-model:value="formData.defectDescription" :rows="4" placeholder="请详细描述不合格情况" />
          </a-form-item>
          <a-form-item label="不合格数量" name="defectQuantity">
            <a-input-number v-model:value="formData.defectQuantity" style="width: 100%" :min="0" />
          </a-form-item>
        </a-card>

        <!-- 原因分析 -->
        <a-card title="原因分析" class="form-card">
          <a-form-item label="原因分析" name="causeAnalysis">
            <a-textarea v-model:value="formData.causeAnalysis" :rows="4" placeholder="请分析不合格原因" />
          </a-form-item>
          <a-form-item label="责任部门" name="responsibleDept">
            <a-select v-model:value="formData.responsibleDept" placeholder="请选择责任部门" :options="[
              { value: 'production', label: '生产部' },
              { value: 'quality', label: '品质部' },
              { value: 'technology', label: '技术部' },
              { value: 'equipment', label: '设备部' }
            ]" />
          </a-form-item>
        </a-card>

        <!-- 处置方案 -->
        <a-card title="处置方案" class="form-card">
          <a-form-item label="处置方法" name="disposalMethod">
            <a-radio-group v-model:value="formData.disposalMethod">
              <a-radio value="rework">返工</a-radio>
              <a-radio value="scrap">报废</a-radio>
              <a-radio value="return">退货</a-radio>
              <a-radio value="special">特采</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="处置说明" name="disposalDescription">
            <a-textarea v-model:value="formData.disposalDescription" :rows="3" placeholder="请说明处置方案" />
          </a-form-item>
          <a-form-item label="预计完成时间" name="expectedCompletionTime">
            <a-date-picker v-model:value="formData.expectedCompletionTime" style="width: 100%" />
          </a-form-item>
        </a-card>

        <!-- 人员信息 -->
        <a-card title="人员信息" class="form-card">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="处理人" name="processor">
                <a-input v-model:value="formData.processor" placeholder="请输入处理人" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="审核人" name="reviewer">
                <a-input v-model:value="formData.reviewer" placeholder="请输入审核人" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 备注 -->
        <a-card title="备注" class="form-card">
          <a-form-item label="备注" name="remarks">
            <a-textarea v-model:value="formData.remarks" :rows="3" placeholder="请输入备注信息" />
          </a-form-item>
        </a-card>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { PlusOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

// 搜索表单
const searchForm = reactive({
  disposalNo: '',
  inspectionNo: '',
  productCode: '',
  status: ''
})

// 表格数据
const dataSource = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条数据`
})

// 表格列定义
const columns = [
  {
    title: '处置单号',
    dataIndex: 'disposalNo',
    key: 'disposalNo',
    width: 140
  },
  {
    title: '检验单号',
    dataIndex: 'inspectionNo',
    key: 'inspectionNo',
    width: 140
  },
  {
    title: '产品编码',
    dataIndex: 'productCode',
    key: 'productCode',
    width: 120
  },
  {
    title: '产品名称',
    dataIndex: 'productName',
    key: 'productName'
  },
  {
    title: '不合格数量',
    dataIndex: 'defectQuantity',
    key: 'defectQuantity',
    width: 100
  },
  {
    title: '处置方式',
    dataIndex: 'disposalMethod',
    key: 'disposalMethod',
    width: 100
  },
  {
    title: '处理状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '处置日期',
    dataIndex: 'disposalDate',
    key: 'disposalDate',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  id: null,
  disposalNo: '',
  inspectionNo: '',
  disposalDate: null,
  status: 'pending',
  productCode: '',
  productName: '',
  batchNo: '',
  productionDate: null,
  quantity: null,
  unit: '',
  defectDescription: '',
  defectQuantity: null,
  causeAnalysis: '',
  responsibleDept: '',
  disposalMethod: 'rework',
  disposalDescription: '',
  expectedCompletionTime: null,
  processor: '',
  reviewer: '',
  remarks: ''
})

// 表单验证规则
const formRules = {
  inspectionNo: [{ required: true, message: '请输入检验单号', trigger: 'blur' }],
  disposalDate: [{ required: true, message: '请选择处置日期', trigger: 'change' }],
  productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  defectDescription: [{ required: true, message: '请描述不合格情况', trigger: 'blur' }],
  causeAnalysis: [{ required: true, message: '请分析不合格原因', trigger: 'blur' }],
  disposalMethod: [{ required: true, message: '请选择处置方法', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    disposalNo: 'FQCD20240115001',
    inspectionNo: 'FQC20240115001',
    disposalDate: '2024-01-15',
    status: 'completed',
    productCode: 'PROD001',
    productName: '产品A',
    batchNo: 'BATCH001',
    productionDate: '2024-01-14',
    quantity: 1000,
    unit: '件',
    defectDescription: '外观有划痕，尺寸偏差',
    defectQuantity: 50,
    causeAnalysis: '包装不当，工装磨损',
    responsibleDept: 'production',
    disposalMethod: 'rework',
    disposalDescription: '重新加工处理',
    expectedCompletionTime: '2024-01-16',
    processor: '李四',
    reviewer: '王五',
    remarks: '已处理完成'
  },
  {
    id: 2,
    disposalNo: 'FQCD20240116001',
    inspectionNo: 'FQC20240116001',
    disposalDate: '2024-01-16',
    status: 'processing',
    productCode: 'PROD002',
    productName: '产品B',
    batchNo: 'BATCH002',
    productionDate: '2024-01-15',
    quantity: 500,
    unit: '件',
    defectDescription: '功能失效，性能不达标',
    defectQuantity: 30,
    causeAnalysis: '元器件质量问题',
    responsibleDept: 'technology',
    disposalMethod: 'scrap',
    disposalDescription: '报废处理',
    expectedCompletionTime: '2024-01-17',
    processor: '赵六',
    reviewer: '',
    remarks: '正在处理中'
  },
  {
    id: 3,
    disposalNo: 'FQCD20240117001',
    inspectionNo: 'FQC20240117001',
    disposalDate: '2024-01-17',
    status: 'pending',
    productCode: 'PROD003',
    productName: '产品C',
    batchNo: 'BATCH003',
    productionDate: '2024-01-16',
    quantity: 800,
    unit: '件',
    defectDescription: '颜色偏差，轻微瑕疵',
    defectQuantity: 20,
    causeAnalysis: '涂料批次差异',
    responsibleDept: 'quality',
    disposalMethod: 'special',
    disposalDescription: '特采处理',
    expectedCompletionTime: '2024-01-18',
    processor: '',
    reviewer: '',
    remarks: '待处理'
  }
]

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  }
  return texts[status] || status
}

// 获取处置方法颜色
const getMethodColor = (method) => {
  const colors = {
    rework: 'orange',
    scrap: 'red',
    return: 'blue',
    special: 'green'
  }
  return colors[method] || 'default'
}

// 获取处置方法文本
const getMethodText = (method) => {
  const texts = {
    rework: '返工',
    scrap: '报废',
    return: '退货',
    special: '特采'
  }
  return texts[method] || method
}

// 获取数据
const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    dataSource.value = mockData
    pagination.total = mockData.length
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

// 重置搜索
const handleReset = () => {
  searchForm.disposalNo = ''
  searchForm.inspectionNo = ''
  searchForm.productCode = ''
  searchForm.status = ''
  handleSearch()
}

// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

// 刷新
const handleRefresh = () => {
  fetchData()
}

// 导出
const handleExport = () => {
  message.info('导出功能开发中...')
}

// 显示新建模态框
const showCreateModal = () => {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

// 查看记录
const handleView = (record) => {
  message.info('查看功能开发中...')
}

// 编辑记录
const handleEdit = (record) => {
  isEdit.value = true
  modalVisible.value = true
  Object.assign(formData, {
    ...record,
    disposalDate: record.disposalDate ? dayjs(record.disposalDate) : null,
    productionDate: record.productionDate ? dayjs(record.productionDate) : null,
    expectedCompletionTime: record.expectedCompletionTime ? dayjs(record.expectedCompletionTime) : null
  })
}

// 删除记录
const handleDelete = (id) => {
  const index = dataSource.value.findIndex(item => item.id === id)
  if (index > -1) {
    dataSource.value.splice(index, 1)
    pagination.total--
    message.success('删除成功')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = dataSource.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        dataSource.value[index] = {
          ...formData,
          disposalDate: formData.disposalDate ? formData.disposalDate.format('YYYY-MM-DD') : null,
          productionDate: formData.productionDate ? formData.productionDate.format('YYYY-MM-DD') : null,
          expectedCompletionTime: formData.expectedCompletionTime ? formData.expectedCompletionTime.format('YYYY-MM-DD') : null
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const disposalNo = `FQCD${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
      const newItem = {
        ...formData,
        id: newId,
        disposalNo,
        disposalDate: formData.disposalDate ? formData.disposalDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        productionDate: formData.productionDate ? formData.productionDate.format('YYYY-MM-DD') : null,
        expectedCompletionTime: formData.expectedCompletionTime ? formData.expectedCompletionTime.format('YYYY-MM-DD') : null
      }
      dataSource.value.unshift(newItem)
      pagination.total++
      message.success('创建成功')
    }
    
    modalVisible.value = false
    resetForm()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    disposalNo: '',
    inspectionNo: '',
    disposalDate: null,
    status: 'pending',
    productCode: '',
    productName: '',
    batchNo: '',
    productionDate: null,
    quantity: null,
    unit: '',
    defectDescription: '',
    defectQuantity: null,
    causeAnalysis: '',
    responsibleDept: '',
    disposalMethod: 'rework',
    disposalDescription: '',
    expectedCompletionTime: null,
    processor: '',
    reviewer: '',
    remarks: ''
  })
  formRef.value?.resetFields()
}

// 计算属性
const modalTitle = computed(() => {
  return isEdit.value ? '编辑成品不合格处置单' : '新建成品不合格处置单'
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.product-disposal-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  padding: 16px 24px;
  margin-bottom: 24px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #262626;
}

.toolbar {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.table-container {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-card {
  margin-bottom: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-card :deep(.ant-card-head) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.form-card :deep(.ant-card-head-title) {
  font-weight: 500;
  color: #262626;
  font-size: 14px;
}

.form-card :deep(.ant-card-body) {
  padding: 20px;
}

.form-card :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #595959;
}

.form-card :deep(.ant-input),
.form-card :deep(.ant-select-selector),
.form-card :deep(.ant-picker),
.form-card :deep(.ant-input-number),
.form-card :deep(.ant-textarea) {
  border-radius: 4px;
}

.form-card :deep(.ant-radio-group) {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.modal-form {
  max-height: 70vh;
  overflow-y: auto;
}

.modal-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.modal-form :deep(.ant-card) {
  border: 1px solid #e8e8e8;
}

.modal-form :deep(.ant-card:last-child) {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-disposal-container {
    padding: 16px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-card :deep(.ant-card-body) {
    padding: 16px;
  }
  
  .form-card :deep(.ant-radio-group) {
    flex-direction: column;
    gap: 8px;
  }
}
</style>