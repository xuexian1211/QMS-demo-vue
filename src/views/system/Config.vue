<template>
  <div class="system-config">
    <div class="page-header">
      <h2>系统配置管理</h2>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新增配置
      </a-button>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索配置名称或键名"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="category" placeholder="配置分类" allowClear>
            <a-select-option value="system">系统配置</a-select-option>
            <a-select-option value="business">业务配置</a-select-option>
            <a-select-option value="security">安全配置</a-select-option>
            <a-select-option value="notification">通知配置</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="状态" allowClear>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 配置列表 -->
    <a-table 
      :columns="columns" 
      :data-source="configs" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-switch 
            :checked="record.status === 'active'"
            @change="handleStatusChange(record)"
          />
        </template>
        <template v-if="column.key === 'isEncrypted'">
          <a-tag :color="record.isEncrypted ? 'orange' : 'blue'">
            {{ record.isEncrypted ? '加密' : '明文' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除这个配置吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑配置模态框 -->
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
        <a-form-item label="配置名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入配置名称" />
        </a-form-item>
        
        <a-form-item label="配置键名" name="configKey">
          <a-input v-model:value="formData.configKey" placeholder="请输入配置键名" />
        </a-form-item>

        <a-form-item label="配置分类" name="category">
          <a-select v-model:value="formData.category" placeholder="请选择配置分类">
            <a-select-option value="system">系统配置</a-select-option>
            <a-select-option value="business">业务配置</a-select-option>
            <a-select-option value="security">安全配置</a-select-option>
            <a-select-option value="notification">通知配置</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="配置值" name="configValue">
          <a-textarea 
            v-model:value="formData.configValue" 
            :rows="4"
            placeholder="请输入配置值"
          />
        </a-form-item>

        <a-form-item label="数据类型" name="dataType">
          <a-select v-model:value="formData.dataType" placeholder="请选择数据类型">
            <a-select-option value="string">字符串</a-select-option>
            <a-select-option value="number">数字</a-select-option>
            <a-select-option value="boolean">布尔值</a-select-option>
            <a-select-option value="json">JSON对象</a-select-option>
            <a-select-option value="array">数组</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="默认值" name="defaultValue">
          <a-input v-model:value="formData.defaultValue" placeholder="请输入默认值" />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea 
            v-model:value="formData.description" 
            :rows="3"
            placeholder="请输入配置描述"
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="是否必填" name="required">
              <a-switch v-model:checked="formData.required" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否加密" name="isEncrypted">
              <a-switch v-model:checked="formData.isEncrypted" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
              <a-switch 
                :checked="formData.status === 'active'"
                @change="checked => formData.status = checked ? 'active' : 'inactive'"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 查看配置详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="配置详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="配置名称">{{ viewData.name }}</a-descriptions-item>
        <a-descriptions-item label="配置键名">{{ viewData.configKey }}</a-descriptions-item>
        <a-descriptions-item label="配置分类">{{ getCategoryText(viewData.category) }}</a-descriptions-item>
        <a-descriptions-item label="配置值">
          <a-typography-paragraph copyable>
            {{ viewData.configValue }}
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="数据类型">{{ getDataTypeText(viewData.dataType) }}</a-descriptions-item>
        <a-descriptions-item label="默认值">{{ viewData.defaultValue }}</a-descriptions-item>
        <a-descriptions-item label="是否必填">{{ viewData.required ? '是' : '否' }}</a-descriptions-item>
        <a-descriptions-item label="是否加密">
          <a-tag :color="viewData.isEncrypted ? 'orange' : 'blue'">
            {{ viewData.isEncrypted ? '加密' : '明文' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === 'active' ? 'green' : 'red'">
            {{ viewData.status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="描述">{{ viewData.description }}</a-descriptions-item>
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

// 响应式数据
const searchText = ref('')
const category = ref()
const status = ref()
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const modalTitle = ref('新增配置')
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
    title: '配置名称',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '配置键名',
    dataIndex: 'configKey',
    key: 'configKey',
    width: 200
  },
  {
    title: '配置分类',
    dataIndex: 'category',
    key: 'category',
    width: 100
  },
  {
    title: '数据类型',
    dataIndex: 'dataType',
    key: 'dataType',
    width: 100
  },
  {
    title: '是否加密',
    dataIndex: 'isEncrypted',
    key: 'isEncrypted',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
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
  name: '',
  configKey: '',
  category: '',
  configValue: '',
  dataType: 'string',
  defaultValue: '',
  description: '',
  required: false,
  isEncrypted: false,
  status: 'active'
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  configKey: [{ required: true, message: '请输入配置键名', trigger: 'blur' }],
  category: [{ required: true, message: '请选择配置分类', trigger: 'change' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
}

// 模拟数据
const configs = ref([
  {
    id: 1,
    name: '系统标题',
    configKey: 'system.title',
    category: 'system',
    configValue: '质量管理系统',
    dataType: 'string',
    defaultValue: 'QMS',
    description: '系统页面标题显示',
    required: true,
    isEncrypted: false,
    status: 'active',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-01-15 14:30:00'
  },
  {
    id: 2,
    name: '数据库连接池大小',
    configKey: 'database.pool.size',
    category: 'system',
    configValue: '20',
    dataType: 'number',
    defaultValue: '10',
    description: '数据库连接池最大连接数',
    required: false,
    isEncrypted: false,
    status: 'active',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-01-10 09:15:00'
  },
  {
    id: 3,
    name: '邮件服务器密码',
    configKey: 'email.server.password',
    category: 'notification',
    configValue: '******',
    dataType: 'string',
    defaultValue: '',
    description: '邮件服务器认证密码',
    required: true,
    isEncrypted: true,
    status: 'active',
    createdAt: '2024-01-05 16:20:00',
    updatedAt: '2024-01-05 16:20:00'
  }
])

const viewData = ref({})

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchConfigs()
}

const handleReset = () => {
  searchText.value = ''
  category.value = undefined
  status.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchConfigs()
}

const showCreateModal = () => {
  modalTitle.value = '新增配置'
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  modalTitle.value = '编辑配置'
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleView = (record: any) => {
  viewData.value = record
  viewModalVisible.value = true
}

const handleDelete = (id: number) => {
  const index = configs.value.findIndex(item => item.id === id)
  if (index > -1) {
    configs.value.splice(index, 1)
    message.success('删除成功')
    fetchConfigs()
  }
}

const handleStatusChange = (record: any) => {
  record.status = record.status === 'active' ? 'inactive' : 'active'
  message.success(`配置已${record.status === 'active' ? '启用' : '禁用'}`)
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    message.success(modalTitle.value === '新增配置' ? '创建成功' : '更新成功')
    modalVisible.value = false
    fetchConfigs()
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
    name: '',
    configKey: '',
    category: '',
    configValue: '',
    dataType: 'string',
    defaultValue: '',
    description: '',
    required: false,
    isEncrypted: false,
    status: 'active'
  })
  formRef.value?.resetFields()
}

const fetchConfigs = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = configs.value.length
    loading.value = false
  }, 500)
}

// 辅助方法
const getCategoryText = (category: string) => {
  const texts = {
    system: '系统配置',
    business: '业务配置',
    security: '安全配置',
    notification: '通知配置'
  }
  return texts[category] || category
}

const getDataTypeText = (dataType: string) => {
  const texts = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    json: 'JSON对象',
    array: '数组'
  }
  return texts[dataType] || dataType
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.system-config {
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