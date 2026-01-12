<template>
  <div class="page-container">
    <div class="page-header">
      <h1>检验规则管理</h1>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建规则
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="规则名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入规则名称" />
        </a-form-item>
        <a-form-item label="适用类型">
          <a-select v-model:value="searchForm.type" placeholder="请选择适用类型" style="width: 150px">
            <a-select-option value="IQC">来料检验</a-select-option>
            <a-select-option value="IPQC">过程检验</a-select-option>
            <a-select-option value="FQC">成品检验</a-select-option>
            <a-select-option value="OQC">出货检验</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" style="width: 100px">
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

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
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'priority'">
          <a-tag :color="getPriorityColor(record.priority)">
            {{ getPriorityText(record.priority) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
            <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
            <a-popconfirm
              title="确定要删除这个规则吗？"
              @confirm="deleteRecord(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑规则' : '新建规则'"
      width="900px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="规则名称" name="name">
              <a-input v-model:value="formData.name" placeholder="请输入规则名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规则编码" name="code">
              <a-input v-model:value="formData.code" placeholder="请输入规则编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="适用类型" name="type">
              <a-select v-model:value="formData.type" placeholder="请选择适用类型">
                <a-select-option value="IQC">来料检验</a-select-option>
                <a-select-option value="IPQC">过程检验</a-select-option>
                <a-select-option value="FQC">成品检验</a-select-option>
                <a-select-option value="OQC">出货检验</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="优先级" name="priority">
              <a-select v-model:value="formData.priority" placeholder="请选择优先级">
                <a-select-option value="high">高</a-select-option>
                <a-select-option value="medium">中</a-select-option>
                <a-select-option value="low">低</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio value="active">启用</a-radio>
                <a-radio value="inactive">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="规则描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入规则描述" />
        </a-form-item>
        <a-form-item label="检验条件" name="conditions">
          <div v-for="(condition, index) in formData.conditions" :key="index" class="condition-item">
            <a-row :gutter="8">
              <a-col :span="6">
                <a-input v-model:value="condition.field" placeholder="检验字段" />
              </a-col>
              <a-col :span="4">
                <a-select v-model:value="condition.operator" placeholder="操作符">
                  <a-select-option value=">">大于</a-select-option>
                  <a-select-option value=">=">大于等于</a-select-option>
                  <a-select-option value="<">小于</a-select-option>
                  <a-select-option value="<=">小于等于</a-select-option>
                  <a-select-option value="=">等于</a-select-option>
                  <a-select-option value="!=">不等于</a-select-option>
                  <a-select-option value="contains">包含</a-select-option>
                </a-select>
              </a-col>
              <a-col :span="6">
                <a-input v-model:value="condition.value" placeholder="标准值" />
              </a-col>
              <a-col :span="6">
                <a-input v-model:value="condition.unit" placeholder="单位" />
              </a-col>
              <a-col :span="2">
                <a-button type="text" danger @click="removeCondition(index)">删除</a-button>
              </a-col>
            </a-row>
          </div>
          <a-button type="dashed" @click="addCondition" style="width: 100%; margin-top: 8px">
            <template #icon><PlusOutlined /></template>
            添加检验条件
          </a-button>
        </a-form-item>
        <a-form-item label="处理方式" name="action">
          <a-select v-model:value="formData.action" placeholder="请选择处理方式">
            <a-select-option value="pass">通过</a-select-option>
            <a-select-option value="warning">警告</a-select-option>
            <a-select-option value="fail">不通过</a-select-option>
            <a-select-option value="rework">返工</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
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
    title: '规则编码',
    dataIndex: 'code',
    key: 'code',
    width: 120
  },
  {
    title: '规则名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '适用类型',
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
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  id: null,
  name: '',
  code: '',
  type: '',
  priority: 'medium',
  description: '',
  conditions: [],
  action: '',
  status: 'active'
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择适用类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  action: [{ required: true, message: '请选择处理方式', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    code: 'RULE001',
    name: '尺寸检验规则',
    type: 'IQC',
    priority: 'high',
    description: '用于零部件尺寸检验的规则',
    status: 'active',
    createTime: '2024-01-15 09:30:00'
  },
  {
    id: 2,
    code: 'RULE002',
    name: '外观质量检验规则',
    type: 'IPQC',
    priority: 'medium',
    description: '生产过程中外观质量检验规则',
    status: 'active',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    code: 'RULE003',
    name: '性能测试规则',
    type: 'FQC',
    priority: 'high',
    description: '成品性能测试的检验规则',
    status: 'inactive',
    createTime: '2024-01-17 10:45:00'
  }
]

// 获取优先级颜色
const getPriorityColor = (priority) => {
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  }
  return colors[priority] || 'default'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority] || priority
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
  searchForm.name = ''
  searchForm.type = ''
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
    conditions: record.conditions || [
      { field: '', operator: '', value: '', unit: '' }
    ]
  })
}

// 查看记录
const viewRecord = (record) => {
  message.info('查看功能开发中...')
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

// 添加检验条件
const addCondition = () => {
  formData.conditions.push({ field: '', operator: '', value: '', unit: '' })
}

// 移除检验条件
const removeCondition = (index) => {
  if (formData.conditions.length > 1) {
    formData.conditions.splice(index, 1)
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = dataSource.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        dataSource.value[index] = { ...formData }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const newItem = {
        ...formData,
        id: newId,
        code: formData.code || `RULE${String(newId).padStart(3, '0')}`,
        createTime: new Date().toLocaleString('zh-CN')
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
    name: '',
    code: '',
    type: '',
    priority: 'medium',
    description: '',
    conditions: [{ field: '', operator: '', value: '', unit: '' }],
    action: '',
    status: 'active'
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.search-form {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.condition-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>