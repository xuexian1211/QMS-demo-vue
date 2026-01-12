<template>
  <div class="production-team">
    <div class="page-header">
      <h2>生产班组管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增班组
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="班组编码">
          <a-input 
            v-model:value="searchForm.teamCode" 
            placeholder="请输入班组编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="班组名称">
          <a-input 
            v-model:value="searchForm.teamName" 
            placeholder="请输入班组名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="所属部门">
          <a-select 
            v-model:value="searchForm.departmentId" 
            placeholder="请选择所属部门"
            allow-clear
            style="width: 200px"
          >
            <a-select-option value="1">生产一部</a-select-option>
            <a-select-option value="2">生产二部</a-select-option>
            <a-select-option value="3">生产三部</a-select-option>
            <a-select-option value="4">质量部</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="班组长">
          <a-input 
            v-model:value="searchForm.leaderName" 
            placeholder="请输入班组长姓名"
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
          <template v-if="column.key === 'workShift'">
            <a-tag :color="getShiftColor(record.workShift)">
              {{ getShiftText(record.workShift) }}
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
                title="确定要删除这个班组吗？"
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
            <a-form-item label="班组编码" name="teamCode">
              <a-input v-model:value="formData.teamCode" placeholder="请输入班组编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="班组名称" name="teamName">
              <a-input v-model:value="formData.teamName" placeholder="请输入班组名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属部门" name="departmentId">
              <a-select v-model:value="formData.departmentId" placeholder="请选择所属部门">
                <a-select-option value="1">生产一部</a-select-option>
                <a-select-option value="2">生产二部</a-select-option>
                <a-select-option value="3">生产三部</a-select-option>
                <a-select-option value="4">质量部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="班组长" name="leaderId">
              <a-select v-model:value="formData.leaderId" placeholder="请选择班组长">
                <a-select-option value="1">张三</a-select-option>
                <a-select-option value="2">李四</a-select-option>
                <a-select-option value="3">王五</a-select-option>
                <a-select-option value="4">赵六</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="工作班次" name="workShift">
              <a-select v-model:value="formData.workShift" placeholder="请选择工作班次">
                <a-select-option value="day">白班</a-select-option>
                <a-select-option value="night">夜班</a-select-option>
                <a-select-option value="morning">早班</a-select-option>
                <a-select-option value="afternoon">中班</a-select-option>
                <a-select-option value="mixed">混合班</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="班组人数" name="memberCount">
              <a-input-number 
                v-model:value="formData.memberCount" 
                placeholder="请输入班组人数"
                :min="1"
                :max="50"
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
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工作地点" name="workLocation">
              <a-input v-model:value="formData.workLocation" placeholder="请输入工作地点" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="主要职责" name="responsibilities">
          <a-textarea 
            v-model:value="formData.responsibilities" 
            placeholder="请输入班组主要职责"
            :rows="3"
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
      title="班组详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="班组编码">{{ viewData.teamCode }}</a-descriptions-item>
        <a-descriptions-item label="班组名称">{{ viewData.teamName }}</a-descriptions-item>
        <a-descriptions-item label="所属部门">{{ getDepartmentName(viewData.departmentId) }}</a-descriptions-item>
        <a-descriptions-item label="班组长">{{ getLeaderName(viewData.leaderId) }}</a-descriptions-item>
        <a-descriptions-item label="工作班次">
          <a-tag :color="getShiftColor(viewData.workShift)">
            {{ getShiftText(viewData.workShift) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="班组人数">{{ viewData.memberCount }}人</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ viewData.phone }}</a-descriptions-item>
        <a-descriptions-item label="工作地点">{{ viewData.workLocation }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="主要职责" :span="3">{{ viewData.responsibilities || '无' }}</a-descriptions-item>
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
  teamCode: '',
  teamName: '',
  departmentId: undefined,
  leaderName: '',
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  teamCode: '',
  teamName: '',
  departmentId: undefined,
  leaderId: undefined,
  workShift: 'day',
  memberCount: 1,
  phone: '',
  workLocation: '',
  responsibilities: '',
  remark: '',
  status: '1'
})

// 表格列定义
const columns = [
  {
    title: '班组编码',
    dataIndex: 'teamCode',
    key: 'teamCode',
    width: 120,
    fixed: 'left'
  },
  {
    title: '班组名称',
    dataIndex: 'teamName',
    key: 'teamName',
    width: 150,
    fixed: 'left'
  },
  {
    title: '所属部门',
    dataIndex: 'departmentName',
    key: 'departmentName',
    width: 120,
    customRender: ({ record }) => getDepartmentName(record.departmentId)
  },
  {
    title: '班组长',
    dataIndex: 'leaderName',
    key: 'leaderName',
    width: 100,
    customRender: ({ record }) => getLeaderName(record.leaderId)
  },
  {
    title: '工作班次',
    dataIndex: 'workShift',
    key: 'workShift',
    width: 100
  },
  {
    title: '班组人数',
    dataIndex: 'memberCount',
    key: 'memberCount',
    width: 100,
    sorter: true
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 120
  },
  {
    title: '工作地点',
    dataIndex: 'workLocation',
    key: 'workLocation',
    width: 150
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
    teamCode: 'TEAM001',
    teamName: '装配一组',
    departmentId: '1',
    leaderId: '1',
    workShift: 'day',
    memberCount: 8,
    phone: '13800138001',
    workLocation: '生产车间A区',
    responsibilities: '负责电子产品的装配工作，包括PCB焊接、组件装配等',
    remark: '技术骨干班组',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    teamCode: 'TEAM002',
    teamName: '装配二组',
    departmentId: '1',
    leaderId: '2',
    workShift: 'night',
    memberCount: 6,
    phone: '13800138002',
    workLocation: '生产车间A区',
    responsibilities: '负责夜间装配工作，确保生产连续性',
    remark: '夜班班组',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00'
  },
  {
    id: '3',
    teamCode: 'TEAM003',
    teamName: '测试班组',
    departmentId: '4',
    leaderId: '3',
    workShift: 'day',
    memberCount: 5,
    phone: '13800138003',
    workLocation: '测试车间B区',
    responsibilities: '负责产品质量测试，包括功能测试、性能测试等',
    remark: '质量控制关键班组',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00'
  },
  {
    id: '4',
    teamCode: 'TEAM004',
    teamName: '包装班组',
    departmentId: '2',
    leaderId: '4',
    workShift: 'afternoon',
    memberCount: 7,
    phone: '13800138004',
    workLocation: '包装车间C区',
    responsibilities: '负责产品包装、标识和入库工作',
    remark: '包装效率优秀班组',
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
  teamCode: [
    { required: true, message: '请输入班组编码', trigger: 'blur' }
  ],
  teamName: [
    { required: true, message: '请输入班组名称', trigger: 'blur' }
  ],
  departmentId: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  leaderId: [
    { required: true, message: '请选择班组长', trigger: 'change' }
  ],
  workShift: [
    { required: true, message: '请选择工作班次', trigger: 'change' }
  ],
  memberCount: [
    { required: true, message: '请输入班组人数', trigger: 'blur' }
  ]
}

// 工具方法
const getDepartmentName = (departmentId) => {
  const departmentMap = {
    '1': '生产一部',
    '2': '生产二部',
    '3': '生产三部',
    '4': '质量部'
  }
  return departmentMap[departmentId] || '未知'
}

const getLeaderName = (leaderId) => {
  const leaderMap = {
    '1': '张三',
    '2': '李四',
    '3': '王五',
    '4': '赵六'
  }
  return leaderMap[leaderId] || '未指定'
}

const getShiftText = (shift) => {
  const shiftMap = {
    'day': '白班',
    'night': '夜班',
    'morning': '早班',
    'afternoon': '中班',
    'mixed': '混合班'
  }
  return shiftMap[shift] || '未知'
}

const getShiftColor = (shift) => {
  const colorMap = {
    'day': 'blue',
    'night': 'purple',
    'morning': 'green',
    'afternoon': 'orange',
    'mixed': 'cyan'
  }
  return colorMap[shift] || 'default'
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑生产班组' : '新增生产班组')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    teamCode: '',
    teamName: '',
    departmentId: undefined,
    leaderName: '',
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
    teamCode: '',
    teamName: '',
    departmentId: undefined,
    leaderId: undefined,
    workShift: 'day',
    memberCount: 1,
    phone: '',
    workLocation: '',
    responsibilities: '',
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
    
    if (searchForm.teamCode) {
      filteredData = filteredData.filter(item => 
        item.teamCode.includes(searchForm.teamCode)
      )
    }
    
    if (searchForm.teamName) {
      filteredData = filteredData.filter(item => 
        item.teamName.includes(searchForm.teamName)
      )
    }
    
    if (searchForm.departmentId) {
      filteredData = filteredData.filter(item => item.departmentId === searchForm.departmentId)
    }
    
    if (searchForm.leaderName) {
      filteredData = filteredData.filter(item => 
        getLeaderName(item.leaderId).includes(searchForm.leaderName)
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
.production-team {
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