<template>
  <div class="storage-location">
    <div class="page-header">
      <h2>存储地点管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增地点
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="地点编码">
          <a-input 
            v-model:value="searchForm.locationCode" 
            placeholder="请输入地点编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="地点名称">
          <a-input 
            v-model:value="searchForm.locationName" 
            placeholder="请输入地点名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="地点类型">
          <a-select 
            v-model:value="searchForm.locationType" 
            placeholder="请选择地点类型"
            allow-clear
            style="width: 150px"
          >
            <a-select-option value="warehouse">仓库</a-select-option>
            <a-select-option value="workshop">车间</a-select-option>
            <a-select-option value="office">办公室</a-select-option>
            <a-select-option value="outdoor">室外</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人">
          <a-input 
            v-model:value="searchForm.managerName" 
            placeholder="请输入负责人姓名"
            allow-clear
            style="width: 150px"
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
          <template v-if="column.key === 'locationType'">
            <a-tag :color="getLocationTypeColor(record.locationType)">
              {{ getLocationTypeText(record.locationType) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'capacity'">
            <a-progress 
              :percent="getUsagePercent(record)" 
              size="small" 
              :status="getUsageStatus(record)"
              :format="() => `${record.usedCapacity}/${record.totalCapacity}m³`"
            />
          </template>
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
                title="确定要删除这个存储地点吗？"
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
            <a-form-item label="地点编码" name="locationCode">
              <a-input v-model:value="formData.locationCode" placeholder="请输入地点编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="地点名称" name="locationName">
              <a-input v-model:value="formData.locationName" placeholder="请输入地点名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="地点类型" name="locationType">
              <a-select v-model:value="formData.locationType" placeholder="请选择地点类型">
                <a-select-option value="warehouse">仓库</a-select-option>
                <a-select-option value="workshop">车间</a-select-option>
                <a-select-option value="office">办公室</a-select-option>
                <a-select-option value="outdoor">室外</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="总容量(m³)" name="totalCapacity">
              <a-input-number 
                v-model:value="formData.totalCapacity" 
                placeholder="请输入总容量"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio value="1">启用</a-radio>
                <a-radio value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-divider>位置信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属部门" name="departmentId">
              <a-select v-model:value="formData.departmentId" placeholder="请选择所属部门">
                <a-select-option value="1">生产一部</a-select-option>
                <a-select-option value="2">生产二部</a-select-option>
                <a-select-option value="3">仓储部</a-select-option>
                <a-select-option value="4">质量部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="负责人" name="managerId">
              <a-select v-model:value="formData.managerId" placeholder="请选择负责人">
                <a-select-option value="1">张三</a-select-option>
                <a-select-option value="2">李四</a-select-option>
                <a-select-option value="3">王五</a-select-option>
                <a-select-option value="4">赵六</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="温度要求" name="temperature">
              <a-input v-model:value="formData.temperature" placeholder="如：常温、0-4℃、-20℃等" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="详细地址" name="address">
          <a-textarea 
            v-model:value="formData.address" 
            placeholder="请输入详细地址"
            :rows="2"
          />
        </a-form-item>
        
        <a-divider>存储条件</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="湿度要求" name="humidity">
              <a-input v-model:value="formData.humidity" placeholder="如：30-70%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="通风要求" name="ventilation">
              <a-select v-model:value="formData.ventilation" placeholder="请选择通风要求">
                <a-select-option value="good">良好</a-select-option>
                <a-select-option value="normal">一般</a-select-option>
                <a-select-option value="poor">较差</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="防火等级" name="fireLevel">
              <a-select v-model:value="formData.fireLevel" placeholder="请选择防火等级">
                <a-select-option value="A">A级</a-select-option>
                <a-select-option value="B">B级</a-select-option>
                <a-select-option value="C">C级</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="特殊要求" name="specialRequirements">
          <a-textarea 
            v-model:value="formData.specialRequirements" 
            placeholder="请输入特殊存储要求"
            :rows="2"
          />
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea 
            v-model:value="formData.remark" 
            placeholder="请输入备注信息"
            :rows="2"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="存储地点详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="地点编码">{{ viewData.locationCode }}</a-descriptions-item>
        <a-descriptions-item label="地点名称">{{ viewData.locationName }}</a-descriptions-item>
        <a-descriptions-item label="地点类型">
          <a-tag :color="getLocationTypeColor(viewData.locationType)">
            {{ getLocationTypeText(viewData.locationType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="所属部门">{{ getDepartmentName(viewData.departmentId) }}</a-descriptions-item>
        <a-descriptions-item label="负责人">{{ getManagerName(viewData.managerId) }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ viewData.phone }}</a-descriptions-item>
        <a-descriptions-item label="总容量">{{ viewData.totalCapacity }}m³</a-descriptions-item>
        <a-descriptions-item label="已使用">{{ viewData.usedCapacity }}m³</a-descriptions-item>
        <a-descriptions-item label="使用率">
          <a-progress 
            :percent="getUsagePercent(viewData)" 
            size="small" 
            :status="getUsageStatus(viewData)"
          />
        </a-descriptions-item>
        <a-descriptions-item label="温度要求">{{ viewData.temperature }}</a-descriptions-item>
        <a-descriptions-item label="湿度要求">{{ viewData.humidity }}</a-descriptions-item>
        <a-descriptions-item label="通风要求">{{ getVentilationText(viewData.ventilation) }}</a-descriptions-item>
        <a-descriptions-item label="防火等级">{{ viewData.fireLevel }}级</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="详细地址" :span="3">{{ viewData.address }}</a-descriptions-item>
        <a-descriptions-item label="特殊要求" :span="3">{{ viewData.specialRequirements || '无' }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="3">{{ viewData.remark || '无' }}</a-descriptions-item>
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
  locationCode: '',
  locationName: '',
  locationType: undefined,
  managerName: '',
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  locationCode: '',
  locationName: '',
  locationType: 'warehouse',
  departmentId: undefined,
  managerId: undefined,
  totalCapacity: 0,
  usedCapacity: 0,
  phone: '',
  address: '',
  temperature: '',
  humidity: '',
  ventilation: 'normal',
  fireLevel: 'B',
  specialRequirements: '',
  remark: '',
  status: '1'
})

// 表格列定义
const columns = [
  {
    title: '地点编码',
    dataIndex: 'locationCode',
    key: 'locationCode',
    width: 120,
    fixed: 'left'
  },
  {
    title: '地点名称',
    dataIndex: 'locationName',
    key: 'locationName',
    width: 150,
    fixed: 'left'
  },
  {
    title: '地点类型',
    dataIndex: 'locationType',
    key: 'locationType',
    width: 100
  },
  {
    title: '所属部门',
    dataIndex: 'departmentName',
    key: 'departmentName',
    width: 120,
    customRender: ({ record }) => getDepartmentName(record.departmentId)
  },
  {
    title: '负责人',
    dataIndex: 'managerName',
    key: 'managerName',
    width: 100,
    customRender: ({ record }) => getManagerName(record.managerId)
  },
  {
    title: '容量使用情况',
    dataIndex: 'capacity',
    key: 'capacity',
    width: 180
  },
  {
    title: '温度要求',
    dataIndex: 'temperature',
    key: 'temperature',
    width: 100
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 120
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
    locationCode: 'WH001',
    locationName: '原料仓库A',
    locationType: 'warehouse',
    departmentId: '3',
    managerId: '1',
    totalCapacity: 1000,
    usedCapacity: 750,
    phone: '13800138001',
    address: '厂区北侧A栋1楼',
    temperature: '常温',
    humidity: '30-70%',
    ventilation: 'good',
    fireLevel: 'A',
    specialRequirements: '防潮、防尘',
    remark: '主要存储原材料',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    locationCode: 'WH002',
    locationName: '成品仓库B',
    locationType: 'warehouse',
    departmentId: '3',
    managerId: '2',
    totalCapacity: 800,
    usedCapacity: 400,
    phone: '13800138002',
    address: '厂区南侧B栋2楼',
    temperature: '常温',
    humidity: '30-60%',
    ventilation: 'good',
    fireLevel: 'A',
    specialRequirements: '定期通风',
    remark: '存储成品产品',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00'
  },
  {
    id: '3',
    locationCode: 'WS001',
    locationName: '装配车间',
    locationType: 'workshop',
    departmentId: '1',
    managerId: '3',
    totalCapacity: 500,
    usedCapacity: 300,
    phone: '13800138003',
    address: '厂区中央C栋1楼',
    temperature: '18-25℃',
    humidity: '40-60%',
    ventilation: 'normal',
    fireLevel: 'B',
    specialRequirements: '恒温恒湿',
    remark: '产品装配区域',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00'
  },
  {
    id: '4',
    locationCode: 'CF001',
    locationName: '冷藏库',
    locationType: 'warehouse',
    departmentId: '3',
    managerId: '4',
    totalCapacity: 200,
    usedCapacity: 150,
    phone: '13800138004',
    address: '厂区东侧D栋地下1层',
    temperature: '0-4℃',
    humidity: '80-90%',
    ventilation: 'poor',
    fireLevel: 'A',
    specialRequirements: '低温存储',
    remark: '存储需要冷藏的物料',
    status: '1',
    createTime: '2024-01-15 10:45:00',
    updateTime: '2024-01-15 10:45:00'
  }
])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 4,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 查看数据
const viewData = ref({})

// 表单验证规则
const rules = {
  locationCode: [
    { required: true, message: '请输入地点编码', trigger: 'blur' }
  ],
  locationName: [
    { required: true, message: '请输入地点名称', trigger: 'blur' }
  ],
  locationType: [
    { required: true, message: '请选择地点类型', trigger: 'change' }
  ],
  departmentId: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  managerId: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ],
  totalCapacity: [
    { required: true, message: '请输入总容量', trigger: 'blur' }
  ]
}

// 工具方法
const getLocationTypeText = (type) => {
  const typeMap = {
    'warehouse': '仓库',
    'workshop': '车间',
    'office': '办公室',
    'outdoor': '室外'
  }
  return typeMap[type] || '未知'
}

const getLocationTypeColor = (type) => {
  const colorMap = {
    'warehouse': 'blue',
    'workshop': 'green',
    'office': 'orange',
    'outdoor': 'cyan'
  }
  return colorMap[type] || 'default'
}

const getDepartmentName = (departmentId) => {
  const departmentMap = {
    '1': '生产一部',
    '2': '生产二部',
    '3': '仓储部',
    '4': '质量部'
  }
  return departmentMap[departmentId] || '未知'
}

const getManagerName = (managerId) => {
  const managerMap = {
    '1': '张三',
    '2': '李四',
    '3': '王五',
    '4': '赵六'
  }
  return managerMap[managerId] || '未指定'
}

const getVentilationText = (ventilation) => {
  const ventilationMap = {
    'good': '良好',
    'normal': '一般',
    'poor': '较差'
  }
  return ventilationMap[ventilation] || '未知'
}

const getUsagePercent = (record) => {
  if (!record.totalCapacity || record.totalCapacity === 0) return 0
  return Math.round((record.usedCapacity / record.totalCapacity) * 100)
}

const getUsageStatus = (record) => {
  const percent = getUsagePercent(record)
  if (percent >= 90) return 'exception'
  if (percent >= 80) return 'active'
  return 'normal'
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑存储地点' : '新增存储地点')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    locationCode: '',
    locationName: '',
    locationType: undefined,
    managerName: '',
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
  Object.assign(formData, record)
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
        usedCapacity: 0,
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
    locationCode: '',
    locationName: '',
    locationType: 'warehouse',
    departmentId: undefined,
    managerId: undefined,
    totalCapacity: 0,
    usedCapacity: 0,
    phone: '',
    address: '',
    temperature: '',
    humidity: '',
    ventilation: 'normal',
    fireLevel: 'B',
    specialRequirements: '',
    remark: '',
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
    
    if (searchForm.locationCode) {
      filteredData = filteredData.filter(item => 
        item.locationCode.includes(searchForm.locationCode)
      )
    }
    
    if (searchForm.locationName) {
      filteredData = filteredData.filter(item => 
        item.locationName.includes(searchForm.locationName)
      )
    }
    
    if (searchForm.locationType) {
      filteredData = filteredData.filter(item => item.locationType === searchForm.locationType)
    }
    
    if (searchForm.managerName) {
      filteredData = filteredData.filter(item => 
        getManagerName(item.managerId).includes(searchForm.managerName)
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
.storage-location {
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

:deep(.ant-progress-text) {
  font-size: 12px;
}
</style>