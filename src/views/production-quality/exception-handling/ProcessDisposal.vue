<template>
  <div class="process-disposal-container">
    <div class="toolbar">
      <a-button type="primary" @click="handleAdd">
        <template #icon><PlusOutlined /></template>
        新增
      </a-button>
      <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
        <template #icon><EditOutlined /></template>
        编辑
      </a-button>
      <a-button @click="handleViewSelected" :disabled="selectedRowKeys.length !== 1">
        <template #icon><EyeOutlined /></template>
        查看
      </a-button>
      <a-button @click="handleBatchDelete" :disabled="selectedRowKeys.length === 0" danger>
        <template #icon><DeleteOutlined /></template>
        删除
      </a-button>
      <a-button @click="handleExport">
        <template #icon><ExportOutlined /></template>
        导出
      </a-button>
      <a-button @click="handleRefresh">
        <template #icon><ReloadOutlined /></template>
        刷新
      </a-button>
    </div>

    <a-card title="搜索条件" size="small" class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="处置单号">
          <a-input v-model:value="searchForm.disposalNo" placeholder="请输入处置单号" />
        </a-form-item>
        <a-form-item label="生产工单">
          <a-input v-model:value="searchForm.workOrder" placeholder="请输入生产工单号" />
        </a-form-item>
        <a-form-item label="产品编码">
          <a-input v-model:value="searchForm.productCode" placeholder="请输入产品编码" />
        </a-form-item>
        <a-form-item label="处置状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择处置状态" style="width: 120px" :options="[
            { value: 'pending', label: '待处理' },
            { value: 'processing', label: '处理中' },
            { value: 'completed', label: '已完成' },
            { value: 'closed', label: '已关闭' }
          ]" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="{ ...pagination, total: filteredData.length, pageSize: 20 }"
        :scroll="{ x: 1200, y: 'calc(100vh - 220px)' }"
        :row-selection="rowSelection"
        row-key="id"
        size="small"
        @change="handleTableChange"
        class="compact-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'disposalMethod'">
            <a-tag :color="getDisposalMethodColor(record.disposalMethod)" class="method-tag">
              {{ getDisposalMethodText(record.disposalMethod) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)" class="status-tag">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'discoveryDate'">
            {{ formatDate(record.discoveryDate) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
              <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这条记录吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 编辑页面路由 -->
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  disposalNo: '',
  workOrder: '',
  productCode: '',
  status: undefined
})

// 表格数据
const dataSource = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
})

// 行选择配置
const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (keys) => {
    selectedRowKeys.value = keys
  }
}

// 过滤后的数据
const filteredData = computed(() => {
  let data = dataSource.value
  
  if (searchForm.disposalNo) {
    data = data.filter(item => item.disposalNo.includes(searchForm.disposalNo))
  }
  if (searchForm.workOrder) {
    data = data.filter(item => item.workOrder.includes(searchForm.workOrder))
  }
  if (searchForm.productCode) {
    data = data.filter(item => item.productCode.includes(searchForm.productCode))
  }
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  return data
})

// 表格列定义
const columns = [
  {
    title: '处置单号',
    dataIndex: 'disposalNo',
    key: 'disposalNo',
    width: 140,
    customRender: ({ text, record }) => {
      return h('a', {
        onClick: () => viewRecord(record),
        style: { color: '#1890ff', textDecoration: 'underline' }
      }, text)
    }
  },
  {
    title: '生产工单',
    dataIndex: 'workOrder',
    key: 'workOrder',
    width: 120
  },
  {
    title: '生产线',
    dataIndex: 'productionLine',
    key: 'productionLine'
  },
  {
    title: '工序',
    dataIndex: 'process',
    key: 'process'
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
    title: '处置状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '发现日期',
    dataIndex: 'discoveryDate',
    key: 'discoveryDate',
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
  workOrder: '',
  discoveryDate: null,
  productionLine: '',
  process: '',
  shift: 'day',
  productCode: '',
  productName: '',
  defectQuantity: null,
  discoverer: '',
  defectDescription: '',
  causeAnalysis: '',
  disposalMethod: 'rework',
  urgencyLevel: 'medium',
  processor: '',
  processingDate: null,
  disposalResult: '',
  correctiveAction: '',
  remark: '',
  status: 'pending'
})

// 生产线数据
const productionLines = ref([
  { id: 1, name: '生产线A' },
  { id: 2, name: '生产线B' },
  { id: 3, name: '生产线C' }
])

// 工序数据
const processes = ref([
  { id: 1, name: '装配' },
  { id: 2, name: '焊接' },
  { id: 3, name: '喷涂' },
  { id: 4, name: '包装' }
])

// 表单验证规则
const rules = {
  workOrder: [{ required: true, message: '请输入生产工单号', trigger: 'blur' }],
  discoveryDate: [{ required: true, message: '请选择发现日期', trigger: 'change' }],
  productionLine: [{ required: true, message: '请选择生产线', trigger: 'change' }],
  process: [{ required: true, message: '请选择工序', trigger: 'change' }],
  productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  defectQuantity: [{ required: true, message: '请输入不合格数量', trigger: 'blur' }],
  discoverer: [{ required: true, message: '请输入发现人姓名', trigger: 'blur' }],
  defectDescription: [{ required: true, message: '请描述不合格情况', trigger: 'blur' }],
  disposalMethod: [{ required: true, message: '请选择处置方式', trigger: 'change' }],
  urgencyLevel: [{ required: true, message: '请选择紧急程度', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    disposalNo: 'IPQCD20240115001',
    workOrder: 'WO20240115001',
    discoveryDate: '2024-01-15',
    productionLine: '生产线A',
    process: '装配',
    shift: 'day',
    productCode: 'PROD001',
    productName: '产品A',
    defectQuantity: 25,
    discoverer: '张三',
    defectDescription: '装配尺寸偏差',
    causeAnalysis: '工装夹具磨损',
    disposalMethod: 'rework',
    urgencyLevel: 'high',
    processor: '李四',
    processingDate: '2024-01-16',
    disposalResult: '已重新装配，检验合格',
    correctiveAction: '更换工装夹具，定期维护',
    status: 'completed'
  },
  {
    id: 2,
    disposalNo: 'IPQCD20240116001',
    workOrder: 'WO20240116001',
    discoveryDate: '2024-01-16',
    productionLine: '生产线B',
    process: '焊接',
    shift: 'night',
    productCode: 'PROD002',
    productName: '产品B',
    defectQuantity: 15,
    discoverer: '王五',
    defectDescription: '焊接强度不足',
    causeAnalysis: '焊接参数设置不当',
    disposalMethod: 'repair',
    urgencyLevel: 'medium',
    processor: '赵六',
    processingDate: '2024-01-17',
    disposalResult: '已重新焊接，强度达标',
    correctiveAction: '优化焊接参数，加强培训',
    status: 'processing'
  },
  {
    id: 3,
    disposalNo: 'IPQCD20240117001',
    workOrder: 'WO20240117001',
    discoveryDate: '2024-01-17',
    productionLine: '生产线C',
    process: '喷涂',
    shift: 'day',
    productCode: 'PROD003',
    productName: '产品C',
    defectQuantity: 10,
    discoverer: '钱七',
    defectDescription: '表面涂层不均匀',
    causeAnalysis: '喷枪堵塞，涂料粘度不当',
    disposalMethod: 'scrap',
    urgencyLevel: 'low',
    processor: '',
    processingDate: null,
    disposalResult: '',
    correctiveAction: '',
    status: 'pending'
  }
]

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green',
    closed: 'gray'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭'
  }
  return texts[status] || status
}

// 获取处置方式颜色
const getDisposalMethodColor = (method) => {
  const colors = {
    rework: 'orange',
    scrap: 'red',
    repair: 'blue',
    concession: 'green',
    downgrade: 'purple'
  }
  return colors[method] || 'default'
}

// 获取处置方式文本
const getDisposalMethodText = (method) => {
  const texts = {
    rework: '返工',
    scrap: '报废',
    repair: '维修',
    concession: '让步接收',
    downgrade: '降级使用'
  }
  return texts[method] || method
}

// 日期格式化
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

// 工具栏操作函数
const handleAdd = () => {
  router.push('/production-quality/exception-handling/process-disposal/create')
}

const handleEdit = () => {
  if (selectedRowKeys.value.length === 1) {
    const record = dataSource.value.find(item => item.id === selectedRowKeys.value[0])
    if (record) {
      router.push(`/production-quality/exception-handling/process-disposal/edit/${record.id}`)
    }
  }
}

const handleViewSelected = () => {
  if (selectedRowKeys.value.length === 1) {
    const record = dataSource.value.find(item => item.id === selectedRowKeys.value[0])
    if (record) {
      router.push(`/production-quality/exception-handling/process-disposal/view/${record.id}`)
    }
  }
}

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length > 0) {
    const count = selectedRowKeys.value.length
    dataSource.value = dataSource.value.filter(item => !selectedRowKeys.value.includes(item.id))
    selectedRowKeys.value = []
    pagination.total -= count
    message.success(`成功删除 ${count} 条记录`)
  }
}

const handleExport = () => {
  message.info('导出功能开发中...')
}

const handleRefresh = () => {
  fetchData()
  message.success('刷新成功')
}

const handleDelete = (id) => {
  deleteRecord(id)
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
const resetSearch = () => {
  searchForm.disposalNo = ''
  searchForm.workOrder = ''
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

// 显示新建模态框
const showCreateModal = () => {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

// 编辑记录
const editRecord = (record) => {
  isEdit.value = true
  modalVisible.value = true
  Object.assign(formData, {
    ...record,
    discoveryDate: record.discoveryDate ? dayjs(record.discoveryDate) : null,
    processingDate: record.processingDate ? dayjs(record.processingDate) : null
  })
}

// 查看记录
const viewRecord = (record) => {
  router.push(`/production-quality/exception-handling/process-disposal/view/${record.id}`)
}

// 开始处理
const startProcessing = (record) => {
  record.status = 'processing'
  message.success('已开始处理')
}

// 删除记录
const deleteRecord = (id) => {
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
          discoveryDate: formData.discoveryDate ? formData.discoveryDate.format('YYYY-MM-DD') : null,
          processingDate: formData.processingDate ? formData.processingDate.format('YYYY-MM-DD') : null
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const disposalNo = `IPQCD${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
      const newItem = {
        ...formData,
        id: newId,
        disposalNo,
        discoveryDate: formData.discoveryDate ? formData.discoveryDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        processingDate: formData.processingDate ? formData.processingDate.format('YYYY-MM-DD') : null,
        status: 'pending'
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
    workOrder: '',
    discoveryDate: null,
    productionLine: '',
    process: '',
    shift: 'day',
    productCode: '',
    productName: '',
    defectQuantity: null,
    discoverer: '',
    defectDescription: '',
    causeAnalysis: '',
    disposalMethod: 'rework',
    urgencyLevel: 'medium',
    processor: '',
    processingDate: null,
    disposalResult: '',
    correctiveAction: '',
    remark: '',
    status: 'pending'
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.process-disposal-container {
  padding: 16px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-card :deep(.ant-card-body) {
  padding: 16px;
}

.table-container {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.compact-table :deep(.ant-table) {
  font-size: 13px;
}

.compact-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 8px 12px;
}

.compact-table :deep(.ant-table-tbody > tr > td) {
  padding: 8px 12px;
}

.status-tag, .method-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .toolbar .ant-btn {
    flex: 1;
    min-width: 80px;
  }
}
</style>