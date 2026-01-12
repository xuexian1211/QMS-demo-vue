<template>
  <div class="system-announcement">
    <div class="page-header">
      <h2>系统公告管理</h2>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建公告
      </a-button>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索公告标题"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="公告状态" allowClear :options="[
            { value: 'published', label: '已发布' },
            { value: 'draft', label: '草稿' },
            { value: 'expired', label: '已过期' }
          ]" />
        </a-col>
        <a-col :span="6">
          <a-range-picker v-model:value="dateRange" @change="handleSearch" />
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 公告列表 -->
    <a-table 
      :columns="columns" 
      :data-source="announcements" 
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
        <template v-if="column.key === 'priority'">
          <a-tag :color="getPriorityColor(record.priority)">
            {{ getPriorityText(record.priority) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除这条公告吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑公告模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="公告标题" name="title">
          <a-input v-model:value="formData.title" placeholder="请输入公告标题" />
        </a-form-item>
        
        <a-form-item label="公告类型" name="type">
          <a-select v-model:value="formData.type" placeholder="请选择公告类型" :options="[
            { value: 'system', label: '系统公告' },
            { value: 'maintenance', label: '维护公告' },
            { value: 'update', label: '更新公告' },
            { value: 'security', label: '安全公告' }
          ]" />
        </a-form-item>

        <a-form-item label="优先级" name="priority">
          <a-select v-model:value="formData.priority" placeholder="请选择优先级" :options="[
            { value: 'high', label: '高' },
            { value: 'medium', label: '中' },
            { value: 'low', label: '低' }
          ]" />
        </a-form-item>

        <a-form-item label="公告内容" name="content">
          <a-textarea 
            v-model:value="formData.content" 
            :rows="6"
            placeholder="请输入公告内容"
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="生效时间" name="effectiveTime">
              <a-date-picker 
                v-model:value="formData.effectiveTime"
                show-time
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="失效时间" name="expiryTime">
              <a-date-picker 
                v-model:value="formData.expiryTime"
                show-time
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="draft">草稿</a-radio>
            <a-radio value="published">发布</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="是否置顶" name="isPinned">
          <a-switch v-model:checked="formData.isPinned" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看公告详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="公告详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="公告标题">{{ viewData.title }}</a-descriptions-item>
        <a-descriptions-item label="公告类型">{{ getTypeText(viewData.type) }}</a-descriptions-item>
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
        <a-descriptions-item label="生效时间">{{ viewData.effectiveTime }}</a-descriptions-item>
        <a-descriptions-item label="失效时间">{{ viewData.expiryTime }}</a-descriptions-item>
        <a-descriptions-item label="是否置顶">{{ viewData.isPinned ? '是' : '否' }}</a-descriptions-item>
        <a-descriptions-item label="公告内容">
          <div style="white-space: pre-wrap;">{{ viewData.content }}</div>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const status = ref()
const dateRange = ref()
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const modalTitle = ref('新建公告')
const formRef = ref()

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列配置
const columns = [
  {
    title: '公告标题',
    dataIndex: 'title',
    key: 'title',
    width: 200
  },
  {
    title: '公告类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
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
    width: 80
  },
  {
    title: '发布人',
    dataIndex: 'publisher',
    key: 'publisher',
    width: 100
  },
  {
    title: '生效时间',
    dataIndex: 'effectiveTime',
    key: 'effectiveTime',
    width: 150
  },
  {
    title: '失效时间',
    dataIndex: 'expiryTime',
    key: 'expiryTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
]

// 表单数据
const formData = reactive({
  title: '',
  type: '',
  priority: 'medium',
  content: '',
  effectiveTime: null,
  expiryTime: null,
  status: 'draft',
  isPinned: false
})

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }],
  expiryTime: [{ required: true, message: '请选择失效时间', trigger: 'change' }]
}

// 模拟数据
const announcements = ref([
  {
    id: 1,
    title: '系统维护通知',
    type: 'maintenance',
    priority: 'high',
    status: 'published',
    publisher: '系统管理员',
    effectiveTime: '2024-01-15 10:00:00',
    expiryTime: '2024-01-20 10:00:00',
    content: '系统将于本周六凌晨2点进行例行维护，预计持续2小时。',
    isPinned: true
  },
  {
    id: 2,
    title: '新功能上线公告',
    type: 'update',
    priority: 'medium',
    status: 'published',
    publisher: '产品经理',
    effectiveTime: '2024-01-10 09:00:00',
    expiryTime: '2024-02-10 09:00:00',
    content: '质量管理模块新增统计分析功能，欢迎体验使用。',
    isPinned: false
  }
])

const viewData = ref({})

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchAnnouncements()
}

const handleReset = () => {
  searchText.value = ''
  status.value = undefined
  dateRange.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchAnnouncements()
}

const showCreateModal = () => {
  modalTitle.value = '新建公告'
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  modalTitle.value = '编辑公告'
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleView = (record: any) => {
  viewData.value = record
  viewModalVisible.value = true
}

const handleDelete = (id: number) => {
  // 模拟删除操作
  const index = announcements.value.findIndex(item => item.id === id)
  if (index > -1) {
    announcements.value.splice(index, 1)
    message.success('删除成功')
    fetchAnnouncements()
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    // 模拟提交操作
    message.success(modalTitle.value === '新建公告' ? '创建成功' : '更新成功')
    modalVisible.value = false
    fetchAnnouncements()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(formData, {
    title: '',
    type: '',
    priority: 'medium',
    content: '',
    effectiveTime: null,
    expiryTime: null,
    status: 'draft',
    isPinned: false
  })
  formRef.value?.resetFields()
}

const fetchAnnouncements = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    pagination.total = announcements.value.length
    loading.value = false
  }, 500)
}

// 状态相关方法
const getStatusColor = (status: string) => {
  const colors = {
    published: 'green',
    draft: 'orange',
    expired: 'red'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts = {
    published: '已发布',
    draft: '草稿',
    expired: '已过期'
  }
  return texts[status] || status
}

const getPriorityColor = (priority: string) => {
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'blue'
  }
  return colors[priority] || 'default'
}

const getPriorityText = (priority: string) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority] || priority
}

const getTypeText = (type: string) => {
  const texts = {
    system: '系统公告',
    maintenance: '维护公告',
    update: '更新公告',
    security: '安全公告'
  }
  return texts[type] || type
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<style scoped>
.system-announcement {
  padding: 24px;
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

.search-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}
</style>