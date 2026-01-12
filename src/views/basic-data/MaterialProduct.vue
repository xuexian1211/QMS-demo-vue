<template>
  <div class="material-product">
    <div class="page-header">
      <h2>物料/产品管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增物料
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="物料编码">
          <a-input 
            v-model:value="searchForm.materialCode" 
            placeholder="请输入物料编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input 
            v-model:value="searchForm.materialName" 
            placeholder="请输入物料名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="物料分类">
          <a-select 
            v-model:value="searchForm.categoryId" 
            placeholder="请选择分类"
            allow-clear
            style="width: 150px"
          >
            <a-select-option value="1">原材料</a-select-option>
            <a-select-option value="2">金属材料</a-select-option>
            <a-select-option value="3">非金属材料</a-select-option>
            <a-select-option value="4">半成品</a-select-option>
            <a-select-option value="5">成品</a-select-option>
          </a-select>
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
                title="确定要删除这个物料吗？"
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
            <a-form-item label="物料编码" name="materialCode">
              <a-input v-model:value="formData.materialCode" placeholder="请输入物料编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="物料名称" name="materialName">
              <a-input v-model:value="formData.materialName" placeholder="请输入物料名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="物料分类" name="categoryId">
              <a-select v-model:value="formData.categoryId" placeholder="请选择物料分类">
                <a-select-option value="1">原材料</a-select-option>
                <a-select-option value="2">金属材料</a-select-option>
                <a-select-option value="3">非金属材料</a-select-option>
                <a-select-option value="4">半成品</a-select-option>
                <a-select-option value="5">成品</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规格型号" name="specification">
              <a-input v-model:value="formData.specification" placeholder="请输入规格型号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="基本单位" name="baseUnit">
              <a-select v-model:value="formData.baseUnit" placeholder="请选择基本单位">
                <a-select-option value="KG">千克</a-select-option>
                <a-select-option value="PCS">个</a-select-option>
                <a-select-option value="M">米</a-select-option>
                <a-select-option value="L">升</a-select-option>
                <a-select-option value="TON">吨</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="安全库存" name="safetyStock">
              <a-input-number 
                v-model:value="formData.safetyStock" 
                placeholder="请输入安全库存"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="单价" name="unitPrice">
              <a-input-number 
                v-model:value="formData.unitPrice" 
                placeholder="请输入单价"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio value="1">启用</a-radio>
                <a-radio value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述" name="description">
          <a-textarea 
            v-model:value="formData.description" 
            placeholder="请输入物料描述"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="物料详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="物料编码">{{ viewData.materialCode }}</a-descriptions-item>
        <a-descriptions-item label="物料名称">{{ viewData.materialName }}</a-descriptions-item>
        <a-descriptions-item label="物料分类">{{ getCategoryName(viewData.categoryId) }}</a-descriptions-item>
        <a-descriptions-item label="规格型号">{{ viewData.specification }}</a-descriptions-item>
        <a-descriptions-item label="基本单位">{{ getUnitName(viewData.baseUnit) }}</a-descriptions-item>
        <a-descriptions-item label="安全库存">{{ viewData.safetyStock }}</a-descriptions-item>
        <a-descriptions-item label="单价">¥{{ viewData.unitPrice }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ viewData.creator }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="3">{{ viewData.description || '无' }}</a-descriptions-item>
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
  materialCode: '',
  materialName: '',
  categoryId: undefined,
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  materialCode: '',
  materialName: '',
  categoryId: undefined,
  specification: '',
  baseUnit: undefined,
  safetyStock: 0,
  unitPrice: 0,
  description: '',
  status: '1'
})

// 表格列定义
const columns = [
  {
    title: '物料编码',
    dataIndex: 'materialCode',
    key: 'materialCode',
    width: 120,
    fixed: 'left'
  },
  {
    title: '物料名称',
    dataIndex: 'materialName',
    key: 'materialName',
    width: 150,
    fixed: 'left'
  },
  {
    title: '物料分类',
    dataIndex: 'categoryId',
    key: 'categoryId',
    width: 100,
    customRender: ({ text }) => getCategoryName(text)
  },
  {
    title: '规格型号',
    dataIndex: 'specification',
    key: 'specification',
    width: 120
  },
  {
    title: '基本单位',
    dataIndex: 'baseUnit',
    key: 'baseUnit',
    width: 80,
    customRender: ({ text }) => getUnitName(text)
  },
  {
    title: '安全库存',
    dataIndex: 'safetyStock',
    key: 'safetyStock',
    width: 100,
    sorter: true
  },
  {
    title: '单价',
    dataIndex: 'unitPrice',
    key: 'unitPrice',
    width: 100,
    sorter: true,
    customRender: ({ text }) => `¥${text}`
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
    width: 200,
    fixed: 'right'
  }
]

// 表格数据
const dataSource = ref([
  {
    id: '1',
    materialCode: 'RAW001',
    materialName: '不锈钢板',
    categoryId: '2',
    specification: '304-2B-1.0mm',
    baseUnit: 'KG',
    safetyStock: 100,
    unitPrice: 15.50,
    description: '304不锈钢板，厚度1.0mm',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00',
    creator: '张三'
  },
  {
    id: '2',
    materialCode: 'RAW002',
    materialName: '铝合金型材',
    categoryId: '2',
    specification: '6061-T6-20x20mm',
    baseUnit: 'M',
    safetyStock: 50,
    unitPrice: 25.80,
    description: '6061铝合金型材，截面20x20mm',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00',
    creator: '李四'
  },
  {
    id: '3',
    materialCode: 'PROD001',
    materialName: '电子控制器',
    categoryId: '5',
    specification: 'ECU-2024-V1.0',
    baseUnit: 'PCS',
    safetyStock: 20,
    unitPrice: 350.00,
    description: '主控制器ECU，版本1.0',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00',
    creator: '王五'
  },
  {
    id: '4',
    materialCode: 'SEMI001',
    materialName: '电路板组件',
    categoryId: '4',
    specification: 'PCB-100x80mm',
    baseUnit: 'PCS',
    safetyStock: 30,
    unitPrice: 45.60,
    description: '半成品电路板组件',
    status: '1',
    createTime: '2024-01-15 10:45:00',
    updateTime: '2024-01-15 10:45:00',
    creator: '赵六'
  },
  {
    id: '5',
    materialCode: 'RAW003',
    materialName: '工程塑料',
    categoryId: '3',
    specification: 'ABS-黑色',
    baseUnit: 'KG',
    safetyStock: 80,
    unitPrice: 12.30,
    description: 'ABS工程塑料，黑色颗粒',
    status: '1',
    createTime: '2024-01-15 10:50:00',
    updateTime: '2024-01-15 10:50:00',
    creator: '钱七'
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

// 查看数据
const viewData = ref({})

// 表单验证规则
const rules = {
  materialCode: [
    { required: true, message: '请输入物料编码', trigger: 'blur' }
  ],
  materialName: [
    { required: true, message: '请输入物料名称', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择物料分类', trigger: 'change' }
  ],
  baseUnit: [
    { required: true, message: '请选择基本单位', trigger: 'change' }
  ]
}

// 工具方法
const getCategoryName = (categoryId) => {
  const categoryMap = {
    '1': '原材料',
    '2': '金属材料',
    '3': '非金属材料',
    '4': '半成品',
    '5': '成品'
  }
  return categoryMap[categoryId] || '未知'
}

const getUnitName = (unit) => {
  const unitMap = {
    'KG': '千克',
    'PCS': '个',
    'M': '米',
    'L': '升',
    'TON': '吨'
  }
  return unitMap[unit] || '未知'
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑物料' : '新增物料')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    materialCode: '',
    materialName: '',
    categoryId: undefined,
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
    ...record
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
        dataSource.value[index] = {
          ...formData,
          updateTime: new Date().toLocaleString()
        }
        message.success('更新成功')
      }
    } else {
      // 新增操作
      const newId = (Math.max(...dataSource.value.map(item => parseInt(item.id))) + 1).toString()
      const newItem = {
        ...formData,
        id: newId,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
        creator: '当前用户'
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
    materialCode: '',
    materialName: '',
    categoryId: undefined,
    specification: '',
    baseUnit: undefined,
    safetyStock: 0,
    unitPrice: 0,
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
    
    if (searchForm.materialCode) {
      filteredData = filteredData.filter(item => 
        item.materialCode.includes(searchForm.materialCode)
      )
    }
    
    if (searchForm.materialName) {
      filteredData = filteredData.filter(item => 
        item.materialName.includes(searchForm.materialName)
      )
    }
    
    if (searchForm.categoryId) {
      filteredData = filteredData.filter(item => item.categoryId === searchForm.categoryId)
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
.material-product {
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