<template>
  <div class="unit-management">
    <div class="page-header">
      <h2>计量单位管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增单位
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="单位编码">
          <a-input 
            v-model:value="searchForm.unitCode" 
            placeholder="请输入单位编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="单位名称">
          <a-input 
            v-model:value="searchForm.unitName" 
            placeholder="请输入单位名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="单位类型">
          <a-select 
            v-model:value="searchForm.unitType" 
            placeholder="请选择单位类型"
            allow-clear
            style="width: 150px"
          >
            <a-select-option value="weight">重量</a-select-option>
            <a-select-option value="length">长度</a-select-option>
            <a-select-option value="volume">体积</a-select-option>
            <a-select-option value="count">数量</a-select-option>
            <a-select-option value="area">面积</a-select-option>
            <a-select-option value="time">时间</a-select-option>
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
          <template v-if="column.key === 'unitType'">
            <a-tag :color="getUnitTypeColor(record.unitType)">
              {{ getUnitTypeName(record.unitType) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">
              {{ record.status === '1' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'isBaseUnit'">
            <a-tag :color="record.isBaseUnit === '1' ? 'blue' : 'default'">
              {{ record.isBaseUnit === '1' ? '是' : '否' }}
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
                title="确定要删除这个单位吗？"
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
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="单位编码" name="unitCode">
              <a-input v-model:value="formData.unitCode" placeholder="请输入单位编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="单位名称" name="unitName">
              <a-input v-model:value="formData.unitName" placeholder="请输入单位名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="单位类型" name="unitType">
              <a-select v-model:value="formData.unitType" placeholder="请选择单位类型">
                <a-select-option value="weight">重量</a-select-option>
                <a-select-option value="length">长度</a-select-option>
                <a-select-option value="volume">体积</a-select-option>
                <a-select-option value="count">数量</a-select-option>
                <a-select-option value="area">面积</a-select-option>
                <a-select-option value="time">时间</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="换算基准单位" name="baseUnitId">
              <a-select v-model:value="formData.baseUnitId" placeholder="请选择基准单位" allow-clear>
                <a-select-option v-for="unit in baseUnits" :key="unit.id" :value="unit.id">
                  {{ unit.unitName }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="换算系数" name="conversionFactor">
              <a-input-number 
                v-model:value="formData.conversionFactor" 
                placeholder="请输入换算系数"
                :min="0"
                :precision="6"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="是否基准单位" name="isBaseUnit">
              <a-radio-group v-model:value="formData.isBaseUnit">
                <a-radio value="1">是</a-radio>
                <a-radio value="0">否</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="排序" name="sortOrder">
              <a-input-number 
                v-model:value="formData.sortOrder" 
                placeholder="请输入排序号"
                :min="0"
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
            placeholder="请输入单位描述"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="单位详情"
      width="600px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="单位编码">{{ viewData.unitCode }}</a-descriptions-item>
        <a-descriptions-item label="单位名称">{{ viewData.unitName }}</a-descriptions-item>
        <a-descriptions-item label="单位类型">
          <a-tag :color="getUnitTypeColor(viewData.unitType)">
            {{ getUnitTypeName(viewData.unitType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="换算基准单位">{{ getBaseUnitName(viewData.baseUnitId) }}</a-descriptions-item>
        <a-descriptions-item label="换算系数">{{ viewData.conversionFactor }}</a-descriptions-item>
        <a-descriptions-item label="是否基准单位">
          <a-tag :color="viewData.isBaseUnit === '1' ? 'blue' : 'default'">
            {{ viewData.isBaseUnit === '1' ? '是' : '否' }}
          </a-tag>
        </a-descriptions-item>
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
  unitCode: '',
  unitName: '',
  unitType: undefined,
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  unitCode: '',
  unitName: '',
  unitType: undefined,
  baseUnitId: undefined,
  conversionFactor: 1,
  isBaseUnit: '0',
  sortOrder: 0,
  description: '',
  status: '1'
})

// 表格列定义
const columns = [
  {
    title: '单位编码',
    dataIndex: 'unitCode',
    key: 'unitCode',
    width: 100,
    fixed: 'left'
  },
  {
    title: '单位名称',
    dataIndex: 'unitName',
    key: 'unitName',
    width: 120,
    fixed: 'left'
  },
  {
    title: '单位类型',
    dataIndex: 'unitType',
    key: 'unitType',
    width: 100
  },
  {
    title: '换算基准单位',
    dataIndex: 'baseUnitName',
    key: 'baseUnitName',
    width: 120
  },
  {
    title: '换算系数',
    dataIndex: 'conversionFactor',
    key: 'conversionFactor',
    width: 100,
    sorter: true
  },
  {
    title: '基准单位',
    dataIndex: 'isBaseUnit',
    key: 'isBaseUnit',
    width: 100
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
    unitCode: 'KG',
    unitName: '千克',
    unitType: 'weight',
    baseUnitId: null,
    baseUnitName: '无',
    conversionFactor: 1.0,
    isBaseUnit: '1',
    sortOrder: 1,
    description: '国际标准重量单位',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    unitCode: 'TON',
    unitName: '吨',
    unitType: 'weight',
    baseUnitId: '1',
    baseUnitName: '千克',
    conversionFactor: 1000.0,
    isBaseUnit: '0',
    sortOrder: 2,
    description: '重量单位，1吨=1000千克',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00'
  },
  {
    id: '3',
    unitCode: 'G',
    unitName: '克',
    unitType: 'weight',
    baseUnitId: '1',
    baseUnitName: '千克',
    conversionFactor: 0.001,
    isBaseUnit: '0',
    sortOrder: 3,
    description: '重量单位，1千克=1000克',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00'
  },
  {
    id: '4',
    unitCode: 'M',
    unitName: '米',
    unitType: 'length',
    baseUnitId: null,
    baseUnitName: '无',
    conversionFactor: 1.0,
    isBaseUnit: '1',
    sortOrder: 1,
    description: '国际标准长度单位',
    status: '1',
    createTime: '2024-01-15 10:45:00',
    updateTime: '2024-01-15 10:45:00'
  },
  {
    id: '5',
    unitCode: 'CM',
    unitName: '厘米',
    unitType: 'length',
    baseUnitId: '4',
    baseUnitName: '米',
    conversionFactor: 0.01,
    isBaseUnit: '0',
    sortOrder: 2,
    description: '长度单位，1米=100厘米',
    status: '1',
    createTime: '2024-01-15 10:50:00',
    updateTime: '2024-01-15 10:50:00'
  },
  {
    id: '6',
    unitCode: 'PCS',
    unitName: '个',
    unitType: 'count',
    baseUnitId: null,
    baseUnitName: '无',
    conversionFactor: 1.0,
    isBaseUnit: '1',
    sortOrder: 1,
    description: '数量单位',
    status: '1',
    createTime: '2024-01-15 10:55:00',
    updateTime: '2024-01-15 10:55:00'
  }
])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 6,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 查看数据
const viewData = ref({})

// 基准单位列表
const baseUnits = computed(() => {
  return dataSource.value.filter(unit => unit.isBaseUnit === '1')
})

// 表单验证规则
const rules = {
  unitCode: [
    { required: true, message: '请输入单位编码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '单位编码只能包含大写字母和下划线', trigger: 'blur' }
  ],
  unitName: [
    { required: true, message: '请输入单位名称', trigger: 'blur' }
  ],
  unitType: [
    { required: true, message: '请选择单位类型', trigger: 'change' }
  ],
  conversionFactor: [
    { required: true, message: '请输入换算系数', trigger: 'blur' }
  ]
}

// 工具方法
const getUnitTypeName = (unitType) => {
  const typeMap = {
    'weight': '重量',
    'length': '长度',
    'volume': '体积',
    'count': '数量',
    'area': '面积',
    'time': '时间'
  }
  return typeMap[unitType] || '未知'
}

const getUnitTypeColor = (unitType) => {
  const colorMap = {
    'weight': 'purple',
    'length': 'blue',
    'volume': 'cyan',
    'count': 'green',
    'area': 'orange',
    'time': 'red'
  }
  return colorMap[unitType] || 'default'
}

const getBaseUnitName = (baseUnitId) => {
  if (!baseUnitId) return '无'
  const unit = dataSource.value.find(item => item.id === baseUnitId)
  return unit ? unit.unitName : '未知'
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑单位' : '新增单位')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    unitCode: '',
    unitName: '',
    unitType: undefined,
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
        const baseUnitName = formData.baseUnitId ? 
          dataSource.value.find(item => item.id === formData.baseUnitId)?.unitName : '无'
        dataSource.value[index] = {
          ...formData,
          baseUnitName,
          updateTime: new Date().toLocaleString()
        }
        message.success('更新成功')
      }
    } else {
      // 新增操作
      const newId = (Math.max(...dataSource.value.map(item => parseInt(item.id))) + 1).toString()
      const baseUnitName = formData.baseUnitId ? 
        dataSource.value.find(item => item.id === formData.baseUnitId)?.unitName : '无'
      const newItem = {
        ...formData,
        id: newId,
        baseUnitName,
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
    unitCode: '',
    unitName: '',
    unitType: undefined,
    baseUnitId: undefined,
    conversionFactor: 1,
    isBaseUnit: '0',
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
    
    if (searchForm.unitCode) {
      filteredData = filteredData.filter(item => 
        item.unitCode.includes(searchForm.unitCode)
      )
    }
    
    if (searchForm.unitName) {
      filteredData = filteredData.filter(item => 
        item.unitName.includes(searchForm.unitName)
      )
    }
    
    if (searchForm.unitType) {
      filteredData = filteredData.filter(item => item.unitType === searchForm.unitType)
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
.unit-management {
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