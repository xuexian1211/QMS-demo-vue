<template>
  <div class="data-application">
    <div class="page-header">
      <h2>数据应用管理</h2>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建应用
        </a-button>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>
          导出配置
        </a-button>
      </a-space>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="5">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索应用名称/编码"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="appType" placeholder="应用类型" allowClear :options="[
            { value: 'api', label: '数据接口' },
            { value: 'region', label: '行政区划' },
            { value: 'integration', label: '数据集成' },
            { value: 'sync', label: '数据同步' }
          ]" />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="状态" allowClear :options="[
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '禁用' }
          ]" />
        </a-col>
        <a-col :span="5">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 应用列表 -->
    <a-table 
      :columns="columns" 
      :data-source="applications" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'appType'">
          <a-tag :color="getAppTypeColor(record.appType)">
            {{ getAppTypeText(record.appType) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-switch 
            :checked="record.status === 'active'" 
            @change="handleStatusChange(record)"
          />
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" size="small" @click="handleTest(record)">测试</a-button>
            <a-button type="link" size="small" @click="handleConfig(record)">配置</a-button>
            <a-popconfirm
              title="确定要删除这个应用吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑应用模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑应用' : '新建应用'"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="应用名称" name="appName">
              <a-input v-model:value="formData.appName" placeholder="请输入应用名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="应用编码" name="appCode">
              <a-input v-model:value="formData.appCode" placeholder="请输入应用编码" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="应用类型" name="appType">
              <a-select v-model:value="formData.appType" placeholder="请选择应用类型" @change="handleAppTypeChange" :options="[
                { value: 'api', label: '数据接口' },
                { value: 'region', label: '行政区划' },
                { value: 'integration', label: '数据集成' },
                { value: 'sync', label: '数据同步' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="formData.status" placeholder="请选择状态" :options="[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '禁用' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="应用描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入应用描述" />
        </a-form-item>

        <!-- 数据接口配置 -->
        <template v-if="formData.appType === 'api'">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="接口地址" name="apiUrl">
                <a-input v-model:value="formData.apiUrl" placeholder="请输入接口地址" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="请求方法" name="apiMethod">
                <a-select v-model:value="formData.apiMethod" placeholder="请选择请求方法" :options="[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' }
                ]" />
              </a-form-item>
            </a-col>
          </a-row>
        </template>

        <!-- 行政区划配置 -->
        <template v-if="formData.appType === 'region'">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="数据源" name="dataSource">
                <a-select v-model:value="formData.dataSource" placeholder="请选择数据源" :options="[
                  { value: 'national', label: '国家标准' },
                  { value: 'custom', label: '自定义数据' }
                ]" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="更新频率" name="updateFrequency">
                <a-select v-model:value="formData.updateFrequency" placeholder="请选择更新频率" :options="[
                  { value: 'realtime', label: '实时' },
                  { value: 'daily', label: '每日' },
                  { value: 'weekly', label: '每周' },
                  { value: 'monthly', label: '每月' }
                ]" />
              </a-form-item>
            </a-col>
          </a-row>
        </template>

        <a-form-item label="排序" name="sortOrder">
          <a-input-number 
            v-model:value="formData.sortOrder" 
            :min="0" 
            style="width: 100%" 
            placeholder="排序号，数字越小越靠前"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="应用详情"
      width="900px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="应用ID">{{ viewData.id }}</a-descriptions-item>
        <a-descriptions-item label="应用名称">{{ viewData.appName }}</a-descriptions-item>
        <a-descriptions-item label="应用编码">{{ viewData.appCode }}</a-descriptions-item>
        <a-descriptions-item label="应用类型">
          <a-tag :color="getAppTypeColor(viewData.appType)">
            {{ getAppTypeText(viewData.appType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-badge :status="viewData.status === 'active' ? 'success' : 'default'" :text="viewData.status === 'active' ? '启用' : '禁用'" />
        </a-descriptions-item>
        <a-descriptions-item label="排序">{{ viewData.sortOrder }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="应用描述" :span="2">{{ viewData.description }}</a-descriptions-item>
        
        <!-- 数据接口特有信息 -->
        <template v-if="viewData.appType === 'api'">
          <a-descriptions-item label="接口地址">{{ viewData.apiUrl }}</a-descriptions-item>
          <a-descriptions-item label="请求方法">{{ viewData.apiMethod }}</a-descriptions-item>
        </template>
        
        <!-- 行政区划特有信息 -->
        <template v-if="viewData.appType === 'region'">
          <a-descriptions-item label="数据源">{{ viewData.dataSource }}</a-descriptions-item>
          <a-descriptions-item label="更新频率">{{ viewData.updateFrequency }}</a-descriptions-item>
        </template>
      </a-descriptions>
    </a-modal>

    <!-- 测试应用模态框 -->
    <a-modal
      v-model:open="testModalVisible"
      title="测试应用"
      width="700px"
      @ok="handleTestExecute"
      @cancel="testModalVisible = false"
    >
      <div class="test-section">
        <h4>应用信息</h4>
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="应用名称">{{ testApp.appName }}</a-descriptions-item>
          <a-descriptions-item label="应用类型">{{ getAppTypeText(testApp.appType) }}</a-descriptions-item>
        </a-descriptions>
        
        <!-- 数据接口测试 -->
        <template v-if="testApp.appType === 'api'">
          <h4 style="margin-top: 16px;">接口测试</h4>
          <a-form layout="vertical">
            <a-form-item label="请求参数">
              <a-textarea v-model:value="testParams" :rows="4" placeholder='{"key": "value"}' />
            </a-form-item>
          </a-form>
        </template>
        
        <!-- 行政区划测试 -->
        <template v-if="testApp.appType === 'region'">
          <h4 style="margin-top: 16px;">数据测试</h4>
          <a-form layout="vertical">
            <a-form-item label="查询条件">
              <a-input v-model:value="testQuery" placeholder="输入地区名称或编码" />
            </a-form-item>
          </a-form>
        </template>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const appType = ref()
const status = ref()
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const testModalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const viewData = ref({})
const testApp = ref({})
const testParams = ref('')
const testQuery = ref('')

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
    title: '应用ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '应用名称',
    dataIndex: 'appName',
    key: 'appName',
    width: 150
  },
  {
    title: '应用编码',
    dataIndex: 'appCode',
    key: 'appCode',
    width: 150
  },
  {
    title: '应用类型',
    dataIndex: 'appType',
    key: 'appType',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    key: 'sortOrder',
    width: 80
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
    fixed: 'right'
  }
]

// 表单数据
const formData = reactive({
  appName: '',
  appCode: '',
  appType: '',
  description: '',
  status: 'active',
  sortOrder: 0,
  apiUrl: '',
  apiMethod: 'GET',
  dataSource: '',
  updateFrequency: ''
})

// 表单验证规则
const formRules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
  appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }]
}

// 模拟应用数据
const applications = ref([
  {
    id: 5001,
    appName: '物料信息接口',
    appCode: 'material_api',
    appType: 'api',
    status: 'active',
    description: '获取物料基础信息的REST API接口',
    sortOrder: 1,
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-01-15 14:30:00',
    apiUrl: 'http://api.example.com/materials',
    apiMethod: 'GET'
  },
  {
    id: 5002,
    appName: '国家标准行政区划',
    appCode: 'national_region',
    appType: 'region',
    status: 'active',
    description: '国家标准行政区划数据，支持省市区三级联动',
    sortOrder: 2,
    createTime: '2024-01-08 14:20:00',
    updateTime: '2024-01-14 09:15:00',
    dataSource: 'national',
    updateFrequency: 'weekly'
  },
  {
    id: 5003,
    appName: '检验数据同步',
    appCode: 'inspection_sync',
    appType: 'sync',
    status: 'active',
    description: '检验数据与外部系统同步应用',
    sortOrder: 3,
    createTime: '2024-01-05 16:45:00',
    updateTime: '2024-01-12 11:20:00'
  },
  {
    id: 5004,
    appName: '供应商数据集成',
    appCode: 'supplier_integration',
    appType: 'integration',
    status: 'inactive',
    description: '供应商数据集成服务，支持多数据源整合',
    sortOrder: 4,
    createTime: '2024-01-03 10:30:00',
    updateTime: '2024-01-10 15:45:00'
  },
  {
    id: 5005,
    appName: '自定义行政区划',
    appCode: 'custom_region',
    appType: 'region',
    status: 'active',
    description: '企业自定义行政区划数据',
    sortOrder: 5,
    createTime: '2024-01-02 09:15:00',
    updateTime: '2024-01-08 16:20:00',
    dataSource: 'custom',
    updateFrequency: 'monthly'
  }
])

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchApplications()
}

const handleReset = () => {
  searchText.value = ''
  appType.value = undefined
  status.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchApplications()
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  isEdit.value = true
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleView = (record: any) => {
  viewData.value = { ...record }
  viewModalVisible.value = true
}

const handleTest = (record: any) => {
  testApp.value = { ...record }
  testParams.value = ''
  testQuery.value = ''
  testModalVisible.value = true
}

const handleConfig = (record: any) => {
  message.info(`配置 ${record.appName} 功能开发中...`)
}

const handleDelete = (id: number) => {
  const index = applications.value.findIndex(item => item.id === id)
  if (index > -1) {
    applications.value.splice(index, 1)
    message.success('删除成功')
    fetchApplications()
  }
}

const handleStatusChange = (record: any) => {
  const index = applications.value.findIndex(item => item.id === record.id)
  if (index > -1) {
    applications.value[index].status = record.status === 'active' ? 'inactive' : 'active'
    message.success('状态更新成功')
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = applications.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        applications.value[index] = { 
          ...formData, 
          updateTime: new Date().toLocaleString() 
        }
        message.success('更新成功')
      }
    } else {
      const newApp = {
        ...formData,
        id: Date.now(),
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }
      applications.value.unshift(newApp)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchApplications()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

const handleTestExecute = () => {
  message.success(`${testApp.value.appName} 测试执行成功`)
  testModalVisible.value = false
}

const handleExport = () => {
  message.info('导出功能开发中...')
}

const handleAppTypeChange = (value: string) => {
  // 重置类型相关字段
  formData.apiUrl = ''
  formData.apiMethod = 'GET'
  formData.dataSource = ''
  formData.updateFrequency = ''
}

const fetchApplications = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = applications.value.length
    loading.value = false
  }, 500)
}

const resetForm = () => {
  Object.assign(formData, {
    appName: '',
    appCode: '',
    appType: '',
    description: '',
    status: 'active',
    sortOrder: 0,
    apiUrl: '',
    apiMethod: 'GET',
    dataSource: '',
    updateFrequency: ''
  })
  formRef.value?.resetFields()
}

// 辅助方法
const getAppTypeColor = (type: string) => {
  const colors = {
    api: 'blue',
    region: 'green',
    integration: 'purple',
    sync: 'orange'
  }
  return colors[type] || 'default'
}

const getAppTypeText = (type: string) => {
  const texts = {
    api: '数据接口',
    region: '行政区划',
    integration: '数据集成',
    sync: '数据同步'
  }
  return texts[type] || type
}

onMounted(() => {
  fetchApplications()
})
</script>

<style scoped>
.data-application {
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

.test-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}
</style>