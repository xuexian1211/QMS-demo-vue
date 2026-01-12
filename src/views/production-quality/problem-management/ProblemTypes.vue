<template>
  <div class="problem-types-container">
    <div class="page-header">
      <h2>问题类型管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><plus-outlined /></template>
        新增问题类型
      </a-button>
    </div>

    <div class="search-form">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="问题类型名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入问题类型名称" allowClear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allowClear style="width: 120px">
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
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
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status === 'active' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这个问题类型吗？"
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
      width="600px"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="问题类型名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入问题类型名称" />
        </a-form-item>
        <a-form-item label="问题类型编码" name="code">
          <a-input v-model:value="formData.code" placeholder="请输入问题类型编码" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="active">启用</a-radio>
            <a-radio value="inactive">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="排序" name="sortOrder">
          <a-input-number v-model:value="formData.sortOrder" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'

interface ProblemType {
  id: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 搜索表单
const searchForm = reactive({
  name: '',
  status: undefined as string | undefined
})

// 表格数据
const dataSource = ref<ProblemType[]>([])
const loading = ref(false)

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
    title: '问题类型名称',
    dataIndex: 'name',
    key: 'name',
    width: 150
  },
  {
    title: '问题类型编码',
    dataIndex: 'code',
    key: 'code',
    width: 120
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
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
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
]

// 弹窗相关
const modalVisible = ref(false)
const modalTitle = ref('新增问题类型')
const formRef = ref()
const formData = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  status: 'active' as 'active' | 'inactive',
  sortOrder: 0
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入问题类型名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入问题类型编码', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 模拟数据
const mockData: ProblemType[] = [
  {
    id: '1',
    name: '质量问题',
    code: 'QUALITY',
    description: '产品质量相关问题',
    status: 'active',
    sortOrder: 1,
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-01-01 10:00:00'
  },
  {
    id: '2',
    name: '工艺问题',
    code: 'PROCESS',
    description: '生产工艺相关问题',
    status: 'active',
    sortOrder: 2,
    createdAt: '2024-01-02 10:00:00',
    updatedAt: '2024-01-02 10:00:00'
  },
  {
    id: '3',
    name: '设备问题',
    code: 'EQUIPMENT',
    description: '生产设备相关问题',
    status: 'inactive',
    sortOrder: 3,
    createdAt: '2024-01-03 10:00:00',
    updatedAt: '2024-01-03 10:00:00'
  }
]

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filteredData = [...mockData]
    
    // 搜索过滤
    if (searchForm.name) {
      filteredData = filteredData.filter(item => 
        item.name.includes(searchForm.name)
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
  searchForm.name = ''
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
  modalTitle.value = '新增问题类型'
  modalVisible.value = true
  resetForm()
}

// 编辑
const handleEdit = (record: ProblemType) => {
  modalTitle.value = '编辑问题类型'
  modalVisible.value = true
  Object.assign(formData, record)
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
  formData.name = ''
  formData.code = ''
  formData.description = ''
  formData.status = 'active'
  formData.sortOrder = 0
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.problem-types-container {
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