<template>
  <div class="material-category">
    <div class="page-header">
      <h2>物料分类管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增分类
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="分类名称">
          <a-input 
            v-model:value="searchForm.categoryName" 
            placeholder="请输入分类名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="分类编码">
          <a-input 
            v-model:value="searchForm.categoryCode" 
            placeholder="请输入分类编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select 
            v-model:value="searchForm.status" 
            placeholder="请选择状态"
            allow-clear
            style="width: 120px"
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="table-container">
      <a-table 
        :columns="columns" 
        :data-source="dataSource" 
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">
              {{ record.status === '1' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-button type="link" size="small" @click="handleView(record)">
                <template #icon><EyeOutlined /></template>
                查看
              </a-button>
              <a-popconfirm
                title="确定要删除这个分类吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="link" size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="600px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="分类名称" name="categoryName">
          <a-input v-model:value="formData.categoryName" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="分类编码" name="categoryCode">
          <a-input v-model:value="formData.categoryCode" placeholder="请输入分类编码" />
        </a-form-item>
        <a-form-item label="上级分类" name="parentId">
          <a-tree-select
            v-model:value="formData.parentId"
            :tree-data="categoryTreeData"
            placeholder="请选择上级分类"
            allow-clear
            tree-default-expand-all
          />
        </a-form-item>
        <a-form-item label="排序" name="sortOrder">
          <a-input-number 
            v-model:value="formData.sortOrder" 
            placeholder="请输入排序号"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea 
            v-model:value="formData.description" 
            placeholder="请输入分类描述"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="1">启用</a-radio>
            <a-radio value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="分类详情"
      width="600px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="分类名称">{{ viewData.categoryName }}</a-descriptions-item>
        <a-descriptions-item label="分类编码">{{ viewData.categoryCode }}</a-descriptions-item>
        <a-descriptions-item label="上级分类">{{ viewData.parentName || '无' }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ viewData.sortOrder }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">{{ viewData.description || '无' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  categoryName: '',
  categoryCode: '',
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  categoryName: '',
  categoryCode: '',
  parentId: undefined,
  sortOrder: 0,
  description: '',
  status: '1'
})

// 表格列定义
const columns = [
  {
    title: '分类名称',
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 150
  },
  {
    title: '分类编码',
    dataIndex: 'categoryCode',
    key: 'categoryCode',
    width: 120
  },
  {
    title: '上级分类',
    dataIndex: 'parentName',
    key: 'parentName',
    width: 120
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    key: 'sortOrder',
    width: 80,
    sorter: true
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
    width: 200,
    fixed: 'right'
  }
]

// 表格数据
const dataSource = ref([
  {
    id: '1',
    categoryName: '原材料',
    categoryCode: 'RAW_MATERIAL',
    parentName: '无',
    parentId: null,
    sortOrder: 1,
    description: '生产用原材料分类',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    categoryName: '金属材料',
    categoryCode: 'METAL',
    parentName: '原材料',
    parentId: '1',
    sortOrder: 1,
    description: '各类金属材料',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00'
  },
  {
    id: '3',
    categoryName: '非金属材料',
    categoryCode: 'NON_METAL',
    parentName: '原材料',
    parentId: '1',
    sortOrder: 2,
    description: '各类非金属材料',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00'
  },
  {
    id: '4',
    categoryName: '半成品',
    categoryCode: 'SEMI_FINISHED',
    parentName: '无',
    parentId: null,
    sortOrder: 2,
    description: '生产过程中的半成品',
    status: '1',
    createTime: '2024-01-15 10:45:00',
    updateTime: '2024-01-15 10:45:00'
  },
  {
    id: '5',
    categoryName: '成品',
    categoryCode: 'FINISHED',
    parentName: '无',
    parentId: null,
    sortOrder: 3,
    description: '最终产品',
    status: '1',
    createTime: '2024-01-15 10:50:00',
    updateTime: '2024-01-15 10:50:00'
  }
])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 5,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 分类树数据
const categoryTreeData = ref([
  {
    title: '无',
    value: null,
    key: 'null'
  },
  {
    title: '原材料',
    value: '1',
    key: '1',
    children: [
      {
        title: '金属材料',
        value: '2',
        key: '2'
      },
      {
        title: '非金属材料',
        value: '3',
        key: '3'
      }
    ]
  },
  {
    title: '半成品',
    value: '4',
    key: '4'
  },
  {
    title: '成品',
    value: '5',
    key: '5'
  }
])

// 查看数据
const viewData = ref({})

// 表单验证规则
const rules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ],
  categoryCode: [
    { required: true, message: '请输入分类编码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '分类编码只能包含大写字母和下划线', trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序号', trigger: 'blur' }
  ]
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑分类' : '新增分类')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    categoryName: '',
    categoryCode: '',
    status: undefined
  })
  handleSearch()
}

const handleTableChange = (pag, filters, sorter) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

const showAddModal = () => {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

const handleEdit = (record) => {
  isEdit.value = true
  modalVisible.value = true
  Object.assign(formData, {
    ...record,
    parentId: record.parentId
  })
}

const handleView = (record) => {
  viewData.value = record
  viewModalVisible.value = true
}

const handleDelete = (id) => {
  // 模拟删除操作
  const index = dataSource.value.findIndex(item => item.id === id)
  if (index > -1) {
    dataSource.value.splice(index, 1)
    message.success('删除成功')
    fetchData()
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      // 编辑操作
      const index = dataSource.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        const parentName = formData.parentId ? 
          categoryTreeData.value.find(item => item.value === formData.parentId)?.title : '无'
        dataSource.value[index] = {
          ...formData,
          parentName,
          updateTime: new Date().toLocaleString()
        }
        message.success('更新成功')
      }
    } else {
      // 新增操作
      const newId = (Math.max(...dataSource.value.map(item => parseInt(item.id))) + 1).toString()
      const parentName = formData.parentId ? 
        categoryTreeData.value.find(item => item.value === formData.parentId)?.title : '无'
      const newItem = {
        ...formData,
        id: newId,
        parentName,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }
      dataSource.value.push(newItem)
      message.success('新增成功')
    }
    
    modalVisible.value = false
    fetchData()
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
    id: '',
    categoryName: '',
    categoryCode: '',
    parentId: undefined,
    sortOrder: 0,
    description: '',
    status: '1'
  })
  formRef.value?.resetFields()
}

const fetchData = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    // 这里可以根据搜索条件过滤数据
    let filteredData = [...dataSource.value]
    
    if (searchForm.categoryName) {
      filteredData = filteredData.filter(item => 
        item.categoryName.includes(searchForm.categoryName)
      )
    }
    
    if (searchForm.categoryCode) {
      filteredData = filteredData.filter(item => 
        item.categoryCode.includes(searchForm.categoryCode)
      )
    }
    
    if (searchForm.status !== undefined) {
      filteredData = filteredData.filter(item => item.status === searchForm.status)
    }
    
    pagination.total = filteredData.length
    loading.value = false
  }, 500)
}

// 生命周期
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.material-category {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
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
  color: #262626;
}

.search-form {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.table-container {
  margin-top: 16px;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}
</style>