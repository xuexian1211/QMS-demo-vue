<template>
  <div class="template-management">
    <div class="page-header">
      <h2>系统模板管理</h2>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建模板
        </a-button>
      </a-space>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="5">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索模板名称/描述"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="templateType" placeholder="模板类型" allowClear>
            <a-select-option value="space">空间模板</a-select-option>
            <a-select-option value="print">打印模板</a-select-option>
            <a-select-option value="message">消息模板</a-select-option>
            <a-select-option value="email">邮件模板</a-select-option>
            <a-select-option value="report">报表模板</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="状态" allowClear>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 模板列表 -->
    <a-table 
      :columns="columns" 
      :data-source="templates" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'templateType'">
          <a-tag :color="getTemplateTypeColor(record.templateType)">
            {{ getTemplateTypeText(record.templateType) }}
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
            <a-button type="link" size="small" @click="handlePreview(record)">预览</a-button>
            <a-button type="link" size="small" @click="handleCopy(record)">复制</a-button>
            <a-popconfirm
              title="确定要删除这个模板吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑模板模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="900px"
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
            <a-form-item label="模板名称" name="templateName">
              <a-input v-model:value="formData.templateName" placeholder="请输入模板名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="模板类型" name="templateType">
              <a-select v-model:value="formData.templateType" placeholder="请选择模板类型" @change="handleTypeChange">
                <a-select-option value="space">空间模板</a-select-option>
                <a-select-option value="print">打印模板</a-select-option>
                <a-select-option value="message">消息模板</a-select-option>
                <a-select-option value="email">邮件模板</a-select-option>
                <a-select-option value="report">报表模板</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="模板描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="2" placeholder="请输入模板描述" />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="模板分类" name="category">
              <a-input v-model:value="formData.category" placeholder="请输入模板分类" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="formData.status" placeholder="请选择状态">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 模板内容编辑区 -->
        <a-form-item label="模板内容" name="content">
          <div class="template-editor">
            <div class="editor-toolbar">
              <a-space>
                <a-button size="small" @click="handleInsertVariable('title')">插入标题变量</a-button>
                <a-button size="small" @click="handleInsertVariable('date')">插入日期变量</a-button>
                <a-button size="small" @click="handleInsertVariable('user')">插入用户变量</a-button>
                <a-button size="small" @click="handleInsertVariable('content')">插入内容变量</a-button>
              </a-space>
            </div>
            <a-textarea 
              v-model:value="formData.content" 
              :rows="8" 
              placeholder="请输入模板内容，支持变量格式：${变量名}"
            />
          </div>
        </a-form-item>

        <!-- 模板变量定义 -->
        <a-form-item label="变量定义">
          <a-table 
            :columns="variableColumns" 
            :data-source="formData.variables" 
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'variableName'">
                <a-input v-model:value="record.variableName" placeholder="变量名" />
              </template>
              <template v-if="column.key === 'variableType'">
                <a-select v-model:value="record.variableType" placeholder="变量类型">
                  <a-select-option value="string">字符串</a-select-option>
                  <a-select-option value="number">数字</a-select-option>
                  <a-select-option value="date">日期</a-select-option>
                  <a-select-option value="boolean">布尔值</a-select-option>
                </a-select>
              </template>
              <template v-if="column.key === 'description'">
                <a-input v-model:value="record.description" placeholder="变量描述" />
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" danger @click="handleRemoveVariable(index)">删除</a-button>
              </template>
            </template>
          </a-table>
          <a-button type="dashed" style="width: 100%; margin-top: 8px;" @click="handleAddVariable">
            <template #icon><PlusOutlined /></template>
            添加变量
          </a-button>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="模板详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="模板ID">{{ viewData.id }}</a-descriptions-item>
        <a-descriptions-item label="模板名称">{{ viewData.templateName }}</a-descriptions-item>
        <a-descriptions-item label="模板类型">
          <a-tag :color="getTemplateTypeColor(viewData.templateType)">
            {{ getTemplateTypeText(viewData.templateType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="模板分类">{{ viewData.category }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-badge :status="viewData.status === 'active' ? 'success' : 'default'" :text="viewData.status === 'active' ? '启用' : '禁用'" />
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ viewData.creator }}</a-descriptions-item>
        <a-descriptions-item label="模板描述" :span="2">{{ viewData.description }}</a-descriptions-item>
        <a-descriptions-item label="模板内容" :span="2">
          <pre class="template-content">{{ viewData.content }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewModalVisible"
      title="模板预览"
      width="800px"
      :footer="null"
    >
      <div class="preview-content">
        <div class="preview-form">
          <a-form layout="vertical">
            <a-form-item 
              v-for="variable in previewData.variables" 
              :key="variable.variableName"
              :label="variable.description || variable.variableName"
            >
              <a-input v-model:value="previewData.values[variable.variableName]" :placeholder="`请输入${variable.description || variable.variableName}`" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleGeneratePreview">生成预览</a-button>
            </a-form-item>
          </a-form>
        </div>
        <div class="preview-result" v-if="previewResult">
          <h4>预览结果：</h4>
          <div class="preview-text">{{ previewResult }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const templateType = ref()
const status = ref()
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const previewModalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const viewData = ref({})
const previewResult = ref('')

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
    title: '模板ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '模板名称',
    dataIndex: 'templateName',
    key: 'templateName',
    width: 150
  },
  {
    title: '模板类型',
    dataIndex: 'templateType',
    key: 'templateType',
    width: 100
  },
  {
    title: '模板分类',
    dataIndex: 'category',
    key: 'category',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
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

// 变量表格列配置
const variableColumns = [
  {
    title: '变量名',
    dataIndex: 'variableName',
    key: 'variableName'
  },
  {
    title: '变量类型',
    dataIndex: 'variableType',
    key: 'variableType'
  },
  {
    title: '变量描述',
    dataIndex: 'description',
    key: 'description'
  },
  {
    title: '操作',
    key: 'action',
    width: 80
  }
]

// 表单数据
const formData = reactive({
  templateName: '',
  templateType: '',
  description: '',
  category: '',
  status: 'active',
  content: '',
  variables: []
})

// 预览数据
const previewData = reactive({
  variables: [],
  values: {}
})

// 表单验证规则
const formRules = {
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  templateType: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

// 模拟模板数据
const templates = ref([
  {
    id: 3001,
    templateName: '检验报告模板',
    templateType: 'print',
    category: '质量检验',
    status: 'active',
    description: '用于生成来料检验报告的标准模板',
    content: '检验报告\n检验单号：${inspectionNo}\n物料名称：${materialName}\n检验结果：${result}\n检验时间：${inspectionDate}',
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-01-15 14:30:00',
    creator: 'admin'
  },
  {
    id: 3002,
    templateName: '系统登录消息模板',
    templateType: 'message',
    category: '系统通知',
    status: 'active',
    description: '用户登录成功后的系统消息模板',
    content: '欢迎${userName}登录系统！\n登录时间：${loginTime}\n登录IP：${loginIP}',
    createTime: '2024-01-08 14:20:00',
    updateTime: '2024-01-14 09:15:00',
    creator: 'admin'
  },
  {
    id: 3003,
    templateName: '工作空间模板',
    templateType: 'space',
    category: '工作空间',
    status: 'active',
    description: '新用户注册时的默认工作空间配置',
    content: '个人工作空间\n用户：${userName}\n创建时间：${createTime}\n默认权限：${permissions}',
    createTime: '2024-01-05 16:45:00',
    updateTime: '2024-01-12 11:20:00',
    creator: 'admin'
  },
  {
    id: 3004,
    templateName: '月度报表邮件模板',
    templateType: 'email',
    category: '报表邮件',
    status: 'inactive',
    description: '月度质量分析报表的邮件发送模板',
    content: '月度质量分析报表\n尊敬的${recipient}：\n附件是${month}的质量分析报表，请查收。\n统计时间：${dateRange}\n总检验批次：${totalBatches}',
    createTime: '2024-01-03 10:30:00',
    updateTime: '2024-01-10 15:45:00',
    creator: 'admin'
  }
])

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchTemplates()
}

const handleReset = () => {
  searchText.value = ''
  templateType.value = undefined
  status.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchTemplates()
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  isEdit.value = true
  Object.assign(formData, {
    ...record,
    variables: record.variables || []
  })
  modalVisible.value = true
}

const handleView = (record: any) => {
  viewData.value = record
  viewModalVisible.value = true
}

const handlePreview = (record: any) => {
  previewData.variables = record.variables || []
  previewData.values = {}
  previewData.content = record.content
  previewResult.value = ''
  previewModalVisible.value = true
}

const handleCopy = (record: any) => {
  const newTemplate = {
    ...record,
    id: Date.now(),
    templateName: record.templateName + '_副本',
    createTime: new Date().toLocaleString(),
    updateTime: new Date().toLocaleString()
  }
  templates.value.unshift(newTemplate)
  message.success('模板复制成功')
  fetchTemplates()
}

const handleDelete = (id: number) => {
  const index = templates.value.findIndex(item => item.id === id)
  if (index > -1) {
    templates.value.splice(index, 1)
    message.success('删除成功')
    fetchTemplates()
  }
}

const handleStatusChange = (record: any) => {
  const index = templates.value.findIndex(item => item.id === record.id)
  if (index > -1) {
    templates.value[index].status = record.status === 'active' ? 'inactive' : 'active'
    message.success('状态更新成功')
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = templates.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        templates.value[index] = { 
          ...formData, 
          updateTime: new Date().toLocaleString() 
        }
        message.success('更新成功')
      }
    } else {
      const newTemplate = {
        ...formData,
        id: Date.now(),
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
        creator: 'admin'
      }
      templates.value.unshift(newTemplate)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchTemplates()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

const handleTypeChange = (value: string) => {
  // 根据模板类型设置默认变量
  if (value === 'print') {
    formData.variables = [
      { variableName: 'inspectionNo', variableType: 'string', description: '检验单号' },
      { variableName: 'materialName', variableType: 'string', description: '物料名称' }
    ]
  } else if (value === 'message') {
    formData.variables = [
      { variableName: 'userName', variableType: 'string', description: '用户名' },
      { variableName: 'loginTime', variableType: 'date', description: '登录时间' }
    ]
  }
}

const handleInsertVariable = (variable: string) => {
  formData.content += `\${${variable}}`
}

const handleAddVariable = () => {
  formData.variables.push({
    variableName: '',
    variableType: 'string',
    description: ''
  })
}

const handleRemoveVariable = (index: number) => {
  formData.variables.splice(index, 1)
}

const handleGeneratePreview = () => {
  let result = previewData.content
  Object.keys(previewData.values).forEach(key => {
    const value = previewData.values[key] || `[${key}]`
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
  })
  previewResult.value = result
}

const fetchTemplates = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = templates.value.length
    loading.value = false
  }, 500)
}

const resetForm = () => {
  Object.assign(formData, {
    templateName: '',
    templateType: '',
    description: '',
    category: '',
    status: 'active',
    content: '',
    variables: []
  })
  formRef.value?.resetFields()
}

// 辅助方法
const getTemplateTypeColor = (type: string) => {
  const colors = {
    space: 'blue',
    print: 'green',
    message: 'orange',
    email: 'purple',
    report: 'cyan'
  }
  return colors[type] || 'default'
}

const getTemplateTypeText = (type: string) => {
  const texts = {
    space: '空间模板',
    print: '打印模板',
    message: '消息模板',
    email: '邮件模板',
    report: '报表模板'
  }
  return texts[type] || type
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.template-management {
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

.template-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.editor-toolbar {
  background: #fafafa;
  padding: 8px 12px;
  border-bottom: 1px solid #d9d9d9;
}

.template-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.preview-content {
  max-height: 500px;
  overflow-y: auto;
}

.preview-form {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-result {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
}

.preview-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
}
</style>