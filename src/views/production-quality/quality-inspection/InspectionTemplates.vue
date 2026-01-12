<template>
  <div class="page-container">
    <div class="page-header">
      <h1>检验模板管理</h1>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建模板
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="模板名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="检验类型">
          <a-select v-model:value="searchForm.type" placeholder="请选择检验类型" style="width: 150px" :options="[
            { value: 'IQC', label: '来料检验' },
            { value: 'IPQC', label: '过程检验' },
            { value: 'FQC', label: '成品检验' },
            { value: 'OQC', label: '出货检验' }
          ]" />
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
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
            <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
            <a-popconfirm
              title="确定要删除这个模板吗？"
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
      :title="isEdit ? '编辑模板' : '新建模板'"
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
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="模板名称" name="name">
              <a-input v-model:value="formData.name" placeholder="请输入模板名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="检验类型" name="type">
              <a-select v-model:value="formData.type" placeholder="请选择检验类型" :options="[
                { value: 'IQC', label: '来料检验' },
                { value: 'IPQC', label: '过程检验' },
                { value: 'FQC', label: '成品检验' },
                { value: 'OQC', label: '出货检验' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="模板描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入模板描述" />
        </a-form-item>
        <a-form-item label="检验项目" name="items">
          <div v-for="(item, index) in formData.items" :key="index" class="inspection-item">
            <a-row :gutter="8">
              <a-col :span="8">
                <a-input v-model:value="item.name" placeholder="检验项目名称" />
              </a-col>
              <a-col :span="6">
                <a-select v-model:value="item.method" placeholder="检验方法" :options="[
                  { value: 'visual', label: '目视' },
                  { value: 'measure', label: '测量' },
                  { value: 'test', label: '测试' }
                ]" />
              </a-col>
              <a-col :span="6">
                <a-input v-model:value="item.standard" placeholder="检验标准" />
              </a-col>
              <a-col :span="4">
                <a-button type="text" danger @click="removeItem(index)">删除</a-button>
              </a-col>
            </a-row>
          </div>
          <a-button type="dashed" @click="addItem" style="width: 100%; margin-top: 8px">
            <template #icon><PlusOutlined /></template>
            添加检验项目
          </a-button>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="active">启用</a-radio>
            <a-radio value="inactive">禁用</a-radio>
          </a-radio-group>
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
  type: ''
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
    title: '模板编号',
    dataIndex: 'code',
    key: 'code',
    width: 120
  },
  {
    title: '模板名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '检验类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '检验项目数',
    dataIndex: 'itemCount',
    key: 'itemCount',
    width: 100
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
  type: '',
  description: '',
  items: [],
  status: 'active'
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择检验类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    code: 'TPL001',
    name: '来料检验标准模板',
    type: 'IQC',
    description: '用于原材料进厂检验的标准模板',
    itemCount: 12,
    status: 'active',
    createTime: '2024-01-15 09:30:00'
  },
  {
    id: 2,
    code: 'TPL002',
    name: '过程检验通用模板',
    type: 'IPQC',
    description: '生产过程中的质量检验模板',
    itemCount: 8,
    status: 'active',
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    code: 'TPL003',
    name: '成品出厂检验模板',
    type: 'FQC',
    description: '成品出厂前的最终检验模板',
    itemCount: 15,
    status: 'inactive',
    createTime: '2024-01-17 10:45:00'
  }
]

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
    items: record.items || [
      { name: '', method: '', standard: '' }
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

// 添加检验项目
const addItem = () => {
  formData.items.push({ name: '', method: '', standard: '' })
}

// 移除检验项目
const removeItem = (index) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
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
          itemCount: formData.items.length,
          code: formData.code || `TPL${String(formData.id).padStart(3, '0')}`
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const newItem = {
        ...formData,
        id: newId,
        code: `TPL${String(newId).padStart(3, '0')}`,
        itemCount: formData.items.length,
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
    type: '',
    description: '',
    items: [{ name: '', method: '', standard: '' }],
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

.inspection-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>