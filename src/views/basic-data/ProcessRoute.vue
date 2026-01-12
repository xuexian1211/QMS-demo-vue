<template>
  <div class="process-route">
    <div class="page-header">
      <h2>工艺路线管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增路线
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="路线编码">
          <a-input 
            v-model:value="searchForm.routeCode" 
            placeholder="请输入路线编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="路线名称">
          <a-input 
            v-model:value="searchForm.routeName" 
            placeholder="请输入路线名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="适用产品">
          <a-input 
            v-model:value="searchForm.productName" 
            placeholder="请输入适用产品"
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
        :expandable="{ expandedRowRender, expandedRowKeys, onExpandedRowsChange }"
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
                title="确定要删除这条工艺路线吗？"
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
      width="1000px"
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
            <a-form-item label="路线编码" name="routeCode">
              <a-input v-model:value="formData.routeCode" placeholder="请输入路线编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="路线名称" name="routeName">
              <a-input v-model:value="formData.routeName" placeholder="请输入路线名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="适用产品" name="productId">
              <a-select v-model:value="formData.productId" placeholder="请选择适用产品">
                <a-select-option value="1">电子控制器</a-select-option>
                <a-select-option value="2">电路板组件</a-select-option>
                <a-select-option value="3">机械外壳</a-select-option>
                <a-select-option value="4">传感器模块</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="版本" name="version">
              <a-input v-model:value="formData.version" placeholder="请输入版本号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="标准工时(分钟)" name="standardTime">
              <a-input-number 
                v-model:value="formData.standardTime" 
                placeholder="请输入标准工时"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="产能(件/小时)" name="capacity">
              <a-input-number 
                v-model:value="formData.capacity" 
                placeholder="请输入产能"
                :min="0"
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
        <a-form-item label="描述" name="description">
          <a-textarea 
            v-model:value="formData.description" 
            placeholder="请输入工艺路线描述"
            :rows="3"
          />
        </a-form-item>
        
        <a-divider>工序配置</a-divider>
        <a-form-item label="工序列表">
          <a-table 
            :columns="processColumns" 
            :data-source="formData.processes" 
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'processName'">
                <a-input v-model:value="record.processName" placeholder="工序名称" />
              </template>
              <template v-if="column.key === 'workCenter'">
                <a-select v-model:value="record.workCenter" placeholder="工作中心">
                  <a-select-option value="WC001">装配车间</a-select-option>
                  <a-select-option value="WC002">测试车间</a-select-option>
                  <a-select-option value="WC003">包装车间</a-select-option>
                </a-select>
              </template>
              <template v-if="column.key === 'standardTime'">
                <a-input-number 
                  v-model:value="record.standardTime" 
                  placeholder="标准工时"
                  :min="0"
                  style="width: 100%"
                />
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" danger @click="removeProcess(index)">
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </template>
            </template>
            <template #footer>
              <a-button type="dashed" @click="addProcess" block>
                <template #icon><PlusOutlined /></template>
                添加工序
              </a-button>
            </template>
          </a-table>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="工艺路线详情"
      width="1000px"
      :footer="null"
    >
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="路线编码">{{ viewData.routeCode }}</a-descriptions-item>
        <a-descriptions-item label="路线名称">{{ viewData.routeName }}</a-descriptions-item>
        <a-descriptions-item label="版本">{{ viewData.version }}</a-descriptions-item>
        <a-descriptions-item label="适用产品">{{ getProductName(viewData.productId) }}</a-descriptions-item>
        <a-descriptions-item label="标准工时">{{ viewData.standardTime }}分钟</a-descriptions-item>
        <a-descriptions-item label="产能">{{ viewData.capacity }}件/小时</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="3">{{ viewData.description || '无' }}</a-descriptions-item>
      </a-descriptions>
      
      <a-divider>工序详情</a-divider>
      <a-table 
        :columns="processColumns" 
        :data-source="viewData.processes || []" 
        :pagination="false"
        size="small"
      />
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
const expandedRowKeys = ref([])

// 搜索表单
const searchForm = reactive({
  routeCode: '',
  routeName: '',
  productName: '',
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  routeCode: '',
  routeName: '',
  productId: undefined,
  version: '',
  standardTime: 0,
  capacity: 0,
  description: '',
  status: '1',
  processes: []
})

// 工序列定义
const processColumns = [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 60,
    customRender: ({ index }) => index + 1
  },
  {
    title: '工序名称',
    dataIndex: 'processName',
    key: 'processName',
    width: 150
  },
  {
    title: '工作中心',
    dataIndex: 'workCenter',
    key: 'workCenter',
    width: 120
  },
  {
    title: '标准工时(分钟)',
    dataIndex: 'standardTime',
    key: 'standardTime',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 80
  }
]

// 表格列定义
const columns = [
  {
    title: '路线编码',
    dataIndex: 'routeCode',
    key: 'routeCode',
    width: 120,
    fixed: 'left'
  },
  {
    title: '路线名称',
    dataIndex: 'routeName',
    key: 'routeName',
    width: 150,
    fixed: 'left'
  },
  {
    title: '适用产品',
    dataIndex: 'productName',
    key: 'productName',
    width: 120,
    customRender: ({ text, record }) => getProductName(record.productId)
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 80
  },
  {
    title: '标准工时(分钟)',
    dataIndex: 'standardTime',
    key: 'standardTime',
    width: 120,
    sorter: true
  },
  {
    title: '产能(件/小时)',
    dataIndex: 'capacity',
    key: 'capacity',
    width: 120,
    sorter: true
  },
  {
    title: '工序数量',
    dataIndex: 'processCount',
    key: 'processCount',
    width: 100,
    customRender: ({ record }) => record.processes?.length || 0
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
    routeCode: 'PR001',
    routeName: '电子控制器装配路线',
    productId: '1',
    version: 'V1.0',
    standardTime: 120,
    capacity: 50,
    description: '电子控制器标准装配工艺路线',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00',
    processes: [
      { sequence: 1, processName: 'PCB贴片', workCenter: 'WC001', standardTime: 30 },
      { sequence: 2, processName: '元件焊接', workCenter: 'WC001', standardTime: 45 },
      { sequence: 3, processName: '功能测试', workCenter: 'WC002', standardTime: 25 },
      { sequence: 4, processName: '外壳组装', workCenter: 'WC001', standardTime: 15 },
      { sequence: 5, processName: '最终测试', workCenter: 'WC002', standardTime: 5 }
    ]
  },
  {
    id: '2',
    routeCode: 'PR002',
    routeName: '电路板组件生产线',
    productId: '2',
    version: 'V2.1',
    standardTime: 90,
    capacity: 80,
    description: '电路板组件生产工艺路线',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00',
    processes: [
      { sequence: 1, processName: '基板准备', workCenter: 'WC001', standardTime: 10 },
      { sequence: 2, processName: 'SMT贴片', workCenter: 'WC001', standardTime: 40 },
      { sequence: 3, processName: '回流焊接', workCenter: 'WC001', standardTime: 20 },
      { sequence: 4, processName: 'AOI检测', workCenter: 'WC002', standardTime: 15 },
      { sequence: 5, processName: '功能测试', workCenter: 'WC002', standardTime: 5 }
    ]
  },
  {
    id: '3',
    routeCode: 'PR003',
    routeName: '机械外壳加工路线',
    productId: '3',
    version: 'V1.5',
    standardTime: 180,
    capacity: 30,
    description: '机械外壳加工工艺路线',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00',
    processes: [
      { sequence: 1, processName: '材料切割', workCenter: 'WC001', standardTime: 30 },
      { sequence: 2, processName: 'CNC加工', workCenter: 'WC001', standardTime: 80 },
      { sequence: 3, processName: '表面处理', workCenter: 'WC001', standardTime: 40 },
      { sequence: 4, processName: '质量检验', workCenter: 'WC002', standardTime: 20 },
      { sequence: 5, processName: '包装入库', workCenter: 'WC003', standardTime: 10 }
    ]
  }
])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 查看数据
const viewData = ref({})

// 表单验证规则
const rules = {
  routeCode: [
    { required: true, message: '请输入路线编码', trigger: 'blur' }
  ],
  routeName: [
    { required: true, message: '请输入路线名称', trigger: 'blur' }
  ],
  productId: [
    { required: true, message: '请选择适用产品', trigger: 'change' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' }
  ]
}

// 工具方法
const getProductName = (productId) => {
  const productMap = {
    '1': '电子控制器',
    '2': '电路板组件',
    '3': '机械外壳',
    '4': '传感器模块'
  }
  return productMap[productId] || '未知'
}

// 展开行渲染
const expandedRowRender = (record) => {
  return h('div', { style: { margin: 0 } }, [
    h('h4', { style: { marginBottom: '8px' } }, '工序列表'),
    h('a-table', {
      columns: processColumns,
      dataSource: record.processes || [],
      pagination: false,
      size: 'small',
      showHeader: true
    })
  ])
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑工艺路线' : '新增工艺路线')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    routeCode: '',
    routeName: '',
    productName: '',
    status: undefined
  })
  handleSearch()
}

const handleTableChange = (pag, filters, sorter) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

const onExpandedRowsChange = (keys) => {
  expandedRowKeys.value = keys
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
    processes: [...(record.processes || [])]
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

const addProcess = () => {
  const newProcess = {
    sequence: formData.processes.length + 1,
    processName: '',
    workCenter: undefined,
    standardTime: 0
  }
  formData.processes.push(newProcess)
}

const removeProcess = (index) => {
  formData.processes.splice(index, 1)
  // 重新排序
  formData.processes.forEach((process, idx) => {
    process.sequence = idx + 1
  })
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
    routeCode: '',
    routeName: '',
    productId: undefined,
    version: '',
    standardTime: 0,
    capacity: 0,
    description: '',
    status: '1',
    processes: []
  })
  formRef.value?.resetFields()
}

const fetchData = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    // 这里可以根据搜索条件过滤数据
    let filteredData = [...dataSource.value]
    
    if (searchForm.routeCode) {
      filteredData = filteredData.filter(item => 
        item.routeCode.includes(searchForm.routeCode)
      )
    }
    
    if (searchForm.routeName) {
      filteredData = filteredData.filter(item => 
        item.routeName.includes(searchForm.routeName)
      )
    }
    
    if (searchForm.productName) {
      filteredData = filteredData.filter(item => 
        getProductName(item.productId).includes(searchForm.productName)
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
.process-route {
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

:deep(.ant-table-expanded-row) {
  background: #fafafa;
}
</style>