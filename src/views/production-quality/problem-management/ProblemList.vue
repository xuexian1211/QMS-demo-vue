<template>
  <div class="problem-management-container">
    <div class="page-header">
      <h2>问题管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><plus-outlined /></template>
        新增问题
      </a-button>
    </div>

    <div class="search-form">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="问题标题">
          <a-input v-model:value="searchForm.title" placeholder="请输入问题标题" allowClear />
        </a-form-item>
        <a-form-item label="问题类型">
          <a-select v-model:value="searchForm.typeId" placeholder="请选择问题类型" allowClear style="width: 150px">
            <a-select-option v-for="type in problemTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级">
          <a-select v-model:value="searchForm.priority" placeholder="请选择优先级" allowClear style="width: 120px">
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="low">低</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allowClear style="width: 120px">
            <a-select-option value="open">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'priority'">
            <a-tag :color="getPriorityColor(record.priority)">
              {{ getPriorityText(record.priority) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这个问题吗？"
                @confirm="handleDelete(record.id)"
                okText="确定"
                cancelText="取消"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      width="800px"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="问题标题" name="title">
          <a-input v-model:value="formData.title" placeholder="请输入问题标题" />
        </a-form-item>
        <a-form-item label="问题类型" name="typeId">
          <a-select v-model:value="formData.typeId" placeholder="请选择问题类型">
            <a-select-option v-for="type in problemTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级" name="priority">
          <a-radio-group v-model:value="formData.priority">
            <a-radio value="high">高</a-radio>
            <a-radio value="medium">中</a-radio>
            <a-radio value="low">低</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="formData.status" placeholder="请选择状态">
            <a-select-option value="open">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="问题描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="4" placeholder="请详细描述问题" />
        </a-form-item>
        <a-form-item label="影响范围" name="impact">
          <a-textarea v-model:value="formData.impact" :rows="3" placeholder="请描述问题的影响范围" />
        </a-form-item>
        <a-form-item label="解决方案" name="solution">
          <a-textarea v-model:value="formData.solution" :rows="3" placeholder="请描述解决方案" />
        </a-form-item>
        <a-form-item label="责任人" name="responsible">
          <a-input v-model:value="formData.responsible" placeholder="请输入责任人" />
        </a-form-item>
        <a-form-item label="预计完成时间" name="expectedDate">
          <a-date-picker 
            v-model:value="formData.expectedDate" 
            style="width: 100%" 
            placeholder="请选择预计完成时间"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情弹窗 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="问题详情"
      :footer="null"
      width="800px"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="问题标题">{{ viewData.title }}</a-descriptions-item>
        <a-descriptions-item label="问题类型">{{ viewData.typeName }}</a-descriptions-item>
        <a-descriptions-item label="优先级">
          <a-tag :color="getPriorityColor(viewData.priority)">
            {{ getPriorityText(viewData.priority) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(viewData.status)">
            {{ getStatusText(viewData.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="责任人">{{ viewData.responsible }}</a-descriptions-item>
        <a-descriptions-item label="预计完成时间">{{ viewData.expectedDate }}</a-descriptions-item>
        <a-descriptions-item label="问题描述" :span="2">
          <div style="white-space: pre-wrap;">{{ viewData.description }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="影响范围" :span="2">
          <div style="white-space: pre-wrap;">{{ viewData.impact }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="解决方案" :span="2">
          <div style="white-space: pre-wrap;">{{ viewData.solution }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createdAt }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updatedAt }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

interface ProblemType {
  id: string
  name: string
  code: string
}

interface Problem {
  id: string
  title: string
  typeId: string
  typeName: string
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'processing' | 'resolved' | 'closed'
  description: string
  impact: string
  solution: string
  responsible: string
  expectedDate: string
  createdAt: string
  updatedAt: string
}

// 搜索表单
const searchForm = reactive({
  title: '',
  typeId: undefined as string | undefined,
  priority: undefined as string | undefined,
  status: undefined as string | undefined
})

// 表格数据
const dataSource = ref<Problem[]>([])
const loading = ref(false)
const problemTypes = ref<ProblemType[]>([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条数据`
})

// 表格列定义
const columns = [
  {
    title: '问题标题',
    dataIndex: 'title',
    key: 'title',
    width: 200,
    ellipsis: true
  },
  {
    title: '问题类型',
    dataIndex: 'typeName',
    key: 'typeName',
    width: 120
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 80
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '责任人',
    dataIndex: 'responsible',
    key: 'responsible',
    width: 100
  },
  {
    title: '预计完成时间',
    dataIndex: 'expectedDate',
    key: 'expectedDate',
    width: 120
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
]

// 弹窗相关
const modalVisible = ref(false)
const modalTitle = ref('新增问题')
const formRef = ref()
const formData = reactive({
  id: '',
  title: '',
  typeId: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  status: 'open' as 'open' | 'processing' | 'resolved' | 'closed',
  description: '',
  impact: '',
  solution: '',
  responsible: '',
  expectedDate: undefined as any
})

// 查看弹窗
const viewModalVisible = ref(false)
const viewData = reactive({
  id: '',
  title: '',
  typeName: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  status: 'open' as 'open' | 'processing' | 'resolved' | 'closed',
  description: '',
  impact: '',
  solution: '',
  responsible: '',
  expectedDate: '',
  createdAt: '',
  updatedAt: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入问题标题', trigger: 'blur' }
  ],
  typeId: [
    { required: true, message: '请选择问题类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ]
}

// 模拟数据
const mockProblemTypes: ProblemType[] = [
  { id: '1', name: '质量问题', code: 'QUALITY' },
  { id: '2', name: '工艺问题', code: 'PROCESS' },
  { id: '3', name: '设备问题', code: 'EQUIPMENT' }
]

const mockProblems: Problem[] = [
  {
    id: '1',
    title: '产品尺寸超差',
    typeId: '1',
    typeName: '质量问题',
    priority: 'high',
    status: 'open',
    description: '某批次产品尺寸超出公差范围，需要立即处理',
    impact: '影响产品质量，可能导致客户投诉',
    solution: '',
    responsible: '张三',
    expectedDate: '2024-12-20',
    createdAt: '2024-12-01 10:00:00',
    updatedAt: '2024-12-01 10:00:00'
  },
  {
    id: '2',
    title: '生产线设备故障',
    typeId: '3',
    typeName: '设备问题',
    priority: 'medium',
    status: 'processing',
    description: '生产线2号设备出现故障，影响生产进度',
    impact: '影响生产效率，可能导致交期延迟',
    solution: '联系维修人员进行检修',
    responsible: '李四',
    expectedDate: '2024-12-15',
    createdAt: '2024-12-02 14:30:00',
    updatedAt: '2024-12-03 09:15:00'
  }
]

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  }
  return colors[priority as keyof typeof colors] || 'default'
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority as keyof typeof texts] || priority
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors = {
    open: 'red',
    processing: 'blue',
    resolved: 'green',
    closed: 'gray'
  }
  return colors[status as keyof typeof colors] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return texts[status as keyof typeof texts] || status
}

// 获取问题类型数据
const fetchProblemTypes = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    problemTypes.value = mockProblemTypes
  } catch (error) {
    message.error('获取问题类型失败')
  }
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filteredData = [...mockProblems]
    
    // 搜索过滤
    if (searchForm.title) {
      filteredData = filteredData.filter(item => 
        item.title.includes(searchForm.title)
      )
    }
    
    if (searchForm.typeId) {
      filteredData = filteredData.filter(item => 
        item.typeId === searchForm.typeId
      )
    }
    
    if (searchForm.priority) {
      filteredData = filteredData.filter(item => 
        item.priority === searchForm.priority
      )
    }
    
    if (searchForm.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchForm.status
      )
    }
    
    dataSource.value = filteredData
    pagination.total = filteredData.length
  } catch (error) {
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

// 重置
const handleReset = () => {
  searchForm.title = ''
  searchForm.typeId = undefined
  searchForm.priority = undefined
  searchForm.status = undefined
  pagination.current = 1
  fetchData()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

// 显示新增弹窗
const showAddModal = () => {
  modalTitle.value = '新增问题'
  modalVisible.value = true
  resetForm()
}

// 查看
const handleView = (record: Problem) => {
  Object.assign(viewData, record)
  viewModalVisible.value = true
}

// 编辑
const handleEdit = (record: Problem) => {
  modalTitle.value = '编辑问题'
  modalVisible.value = true
  Object.assign(formData, {
    ...record,
    expectedDate: record.expectedDate ? dayjs(record.expectedDate) : undefined
  })
}

// 删除
const handleDelete = async (id: string) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    message.success('删除成功')
    fetchData()
  } catch (error) {
    message.error('删除失败')
  }
}

// 弹窗确认
const handleModalOk = async () => {
  try {
    await formRef.value.validate()
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    message.success(formData.id ? '更新成功' : '新增成功')
    modalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('验证失败:', error)
  }
}

// 弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.id = ''
  formData.title = ''
  formData.typeId = ''
  formData.priority = 'medium'
  formData.status = 'open'
  formData.description = ''
  formData.impact = ''
  formData.solution = ''
  formData.responsible = ''
  formData.expectedDate = undefined
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchProblemTypes()
  fetchData()
})
</script>

<style scoped>
.problem-management-container {
  padding: 24px;
  background: #fff;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.search-form {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.table-container {
  background: #fff;
}
</style>