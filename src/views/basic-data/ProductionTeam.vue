<template>
  <div class="page-container">
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="showAddModal">
          <template #icon>
            <PlusOutlined />
          </template>新增
        </a-button>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEditSelected">
          <template #icon>
            <EditOutlined />
          </template>编辑
        </a-button>
        <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
          <template #icon>
            <DeleteOutlined />
          </template>删除
        </a-button>
        <a-dropdown :disabled="selectedRowKeys.length === 0">
          <a-button>状态操作
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleBatchStatusChange">
              <a-menu-item key="enable">批量启用</a-menu-item>
              <a-menu-item key="disable">批量禁用</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a-button @click="handleExport">
          <template #icon>
            <ExportOutlined />
          </template>导出
        </a-button>
        <a-button @click="fetchData">
          <template #icon>
            <ReloadOutlined />
          </template>刷新
        </a-button>
      </a-space>
    </div>

    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="班组编码">
          <a-input v-model:value="searchForm.teamCode" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="班组名称">
          <a-input v-model:value="searchForm.teamName" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="所属部门">
          <a-select v-model:value="searchForm.departmentId" style="width: 150px" placeholder="请选择" allow-clear>
            <a-select-option value="1">生产一部</a-select-option>
            <a-select-option value="2">生产二部</a-select-option>
            <a-select-option value="3">生产三部</a-select-option>
            <a-select-option value="4">质量部</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" style="width: 100px" placeholder="请选择" allow-clear>
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="table-container">
      <a-table :columns="columns" :data-source="dataSource" :loading="loading" row-key="id" size="middle"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
        @change="handleTableChange">
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
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-divider type="vertical" />
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-divider type="vertical" />
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑/查看模态框 -->
    <a-modal v-model:visible="modalVisible" :title="modalTitle" width="900px" @ok="handleSubmit" @cancel="handleCancel"
      :footer="isView ? null : undefined">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="班组编码" name="teamCode">
              <a-input v-model:value="formData.teamCode" placeholder="请输入班组编码" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="班组名称" name="teamName">
              <a-input v-model:value="formData.teamName" placeholder="请输入班组名称" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属部门" name="departmentId">
              <a-select v-model:value="formData.departmentId" placeholder="请选择所属部门" :disabled="isView">
                <a-select-option value="1">生产一部</a-select-option>
                <a-select-option value="2">生产二部</a-select-option>
                <a-select-option value="3">生产三部</a-select-option>
                <a-select-option value="4">质量部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="班组长" name="leaderId">
              <a-select v-model:value="formData.leaderId" placeholder="请选择班组长" :disabled="isView">
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
              <a-select v-model:value="formData.workShift" placeholder="请选择工作班次" :disabled="isView">
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
              <a-input-number v-model:value="formData.memberCount" placeholder="请输入" :min="1" :max="50"
                style="width: 100%" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status" :disabled="isView">
                <a-radio value="1">启用</a-radio>
                <a-radio value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入联系电话" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工作地点" name="workLocation">
              <a-input v-model:value="formData.workLocation" placeholder="请输入工作地点" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="主要职责" name="responsibilities">
          <a-textarea v-model:value="formData.responsibilities" placeholder="请输入班组主要职责" :rows="3" :disabled="isView" />
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" placeholder="请输入备注信息" :rows="2" :disabled="isView" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal v-model:visible="viewModalVisible" title="班组详情" width="800px" :footer="null">
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="班组编码">{{ viewData.teamCode }}</a-descriptions-item>
        <a-descriptions-item label="班组名称">{{ viewData.teamName }}</a-descriptions-item>
        <a-descriptions-item label="所属部门">{{ getDepartmentName(viewData.departmentId) }}</a-descriptions-item>
        <a-descriptions-item label="班组长">{{ getLeaderName(viewData.leaderId) }}</a-descriptions-item>
        <a-descriptions-item label="工作班次">
          <a-tag :color="getShiftColor(viewData.workShift)">{{ getShiftText(viewData.workShift) }}</a-tag>
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
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExportOutlined,
    ReloadOutlined,
    DownOutlined
  } from '@ant-design/icons-vue'
  import { useExport } from '@/utils/excel'

  // 响应式数据
  const loading = ref(false)
  const modalVisible = ref(false)
  const viewModalVisible = ref(false)
  const isEdit = ref(false)
  const isView = ref(false)
  const formRef = ref()
  const selectedRowKeys = ref([])

  // 搜索表单
  const searchForm = reactive({
    teamCode: '',
    teamName: '',
    departmentId: undefined,
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
    { title: '班组编码', dataIndex: 'teamCode', key: 'teamCode', width: 120 },
    { title: '班组名称', dataIndex: 'teamName', key: 'teamName', width: 150 },
    { title: '所属部门', key: 'departmentName', width: 120, customRender: ({ record }) => getDepartmentName(record.departmentId) },
    { title: '班组长', key: 'leaderName', width: 100, customRender: ({ record }) => getLeaderName(record.leaderId) },
    { title: '工作班次', dataIndex: 'workShift', key: 'workShift', width: 100 },
    { title: '班组人数', dataIndex: 'memberCount', key: 'memberCount', width: 100, sorter: true },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' }
  ]

  // 表格数据
  const dataSource = ref([
    { id: '1', teamCode: 'TEAM001', teamName: '装配一组', departmentId: '1', leaderId: '1', workShift: 'day', memberCount: 8, phone: '13800138001', workLocation: '生产车间A区', responsibilities: '负责电子产品的装配工作', remark: '技术骨干班组', status: '1', createTime: '2024-01-15 10:30:00', updateTime: '2024-01-15 10:30:00' },
    { id: '2', teamCode: 'TEAM002', teamName: '装配二组', departmentId: '1', leaderId: '2', workShift: 'night', memberCount: 6, phone: '13800138002', workLocation: '生产车间A区', responsibilities: '负责夜间装配工作', remark: '夜班班组', status: '1', createTime: '2024-01-15 10:35:00', updateTime: '2024-01-15 10:35:00' },
    { id: '3', teamCode: 'TEAM003', teamName: '测试班组', departmentId: '4', leaderId: '3', workShift: 'day', memberCount: 5, phone: '13800138003', workLocation: '测试车间B区', responsibilities: '负责产品质量测试', remark: '质量控制关键班组', status: '1', createTime: '2024-01-15 10:40:00', updateTime: '2024-01-15 10:40:00' },
    { id: '4', teamCode: 'TEAM004', teamName: '包装班组', departmentId: '2', leaderId: '4', workShift: 'afternoon', memberCount: 7, phone: '13800138004', workLocation: '包装车间C区', responsibilities: '负责产品包装、标识和入库工作', remark: '包装效率优秀班组', status: '1', createTime: '2024-01-15 10:45:00', updateTime: '2024-01-15 10:45:00' }
  ])

  // 分页配置
  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 4,
    showSizeChanger: true,
    showQuickJumper: true
  })

  // 查看数据
  const viewData = ref({})

  // 表单验证规则
  const rules = {
    teamCode: [{ required: true, message: '请输入班组编码', trigger: 'blur' }],
    teamName: [{ required: true, message: '请输入班组名称', trigger: 'blur' }],
    departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
    leaderId: [{ required: true, message: '请选择班组长', trigger: 'change' }],
    workShift: [{ required: true, message: '请选择工作班次', trigger: 'change' }],
    memberCount: [{ required: true, message: '请输入班组人数', trigger: 'blur' }]
  }

  // 工具方法
  const getDepartmentName = (departmentId) => {
    const departmentMap = { '1': '生产一部', '2': '生产二部', '3': '生产三部', '4': '质量部' }
    return departmentMap[departmentId] || '未知'
  }

  const getLeaderName = (leaderId) => {
    const leaderMap = { '1': '张三', '2': '李四', '3': '王五', '4': '赵六' }
    return leaderMap[leaderId] || '未指定'
  }

  const getShiftText = (shift) => {
    const shiftMap = { 'day': '白班', 'night': '夜班', 'morning': '早班', 'afternoon': '中班', 'mixed': '混合班' }
    return shiftMap[shift] || '未知'
  }

  const getShiftColor = (shift) => {
    const colorMap = { 'day': 'blue', 'night': 'purple', 'morning': 'green', 'afternoon': 'orange', 'mixed': 'cyan' }
    return colorMap[shift] || 'default'
  }

  // 计算属性
  const modalTitle = computed(() => {
    if (isView.value) return '查看生产班组'
    return isEdit.value ? '编辑生产班组' : '新增生产班组'
  })

  // 选择变更
  const onSelectChange = (keys) => {
    selectedRowKeys.value = keys
  }

  // 方法
  const handleSearch = () => {
    pagination.current = 1
    fetchData()
  }

  const resetSearch = () => {
    Object.assign(searchForm, { teamCode: '', teamName: '', departmentId: undefined, status: undefined })
    handleSearch()
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    fetchData()
  }

  const showAddModal = () => {
    isEdit.value = false
    modalVisible.value = true
    resetForm()
  }

  const handleEditSelected = () => {
    const record = dataSource.value.find(i => i.id === selectedRowKeys.value[0])
    if (record) handleEdit(record)
  }

  const handleEdit = (record) => {
    isEdit.value = true
    isView.value = false
    modalVisible.value = true
    Object.assign(formData, record)
  }

  const handleView = (record) => {
    isEdit.value = true
    isView.value = true
    Object.assign(formData, record)
    modalVisible.value = true
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除班组 ${record.teamName} 吗？`,
      okType: 'danger',
      onOk() {
        const index = dataSource.value.findIndex(item => item.id === record.id)
        if (index > -1) {
          dataSource.value.splice(index, 1)
          message.success('删除成功')
          fetchData()
        }
      }
    })
  }

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
      okType: 'danger',
      onOk() {
        dataSource.value = dataSource.value.filter(i => !selectedRowKeys.value.includes(i.id))
        selectedRowKeys.value = []
        message.success('删除成功')
      }
    })
  }

  const handleSubmit = async () => {
    try {
      await formRef.value.validate()

      if (isEdit.value) {
        const index = dataSource.value.findIndex(item => item.id === formData.id)
        if (index > -1) {
          dataSource.value[index] = { ...formData, updateTime: new Date().toLocaleString() }
          message.success('更新成功')
        }
      } else {
        const newId = (Math.max(...dataSource.value.map(item => parseInt(item.id))) + 1).toString()
        const newItem = {
          ...formData, id: newId,
          createTime: new Date().toLocaleString(), updateTime: new Date().toLocaleString()
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
      id: '', teamCode: '', teamName: '', departmentId: undefined, leaderId: undefined,
      workShift: 'day', memberCount: 1, phone: '', workLocation: '',
      responsibilities: '', remark: '', status: '1'
    })
    formRef.value?.resetFields()
  }

  const handleExport = () => {
    if (dataSource.value.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    const exportColumns = [
      { title: '班组编码', dataIndex: 'teamCode' },
      { title: '班组名称', dataIndex: 'teamName' },
      { title: '所属部门', dataIndex: 'departmentName' },
      { title: '班组长', dataIndex: 'leaderName' },
      { title: '班次', dataIndex: 'workShift' },
      { title: '人数', dataIndex: 'memberCount' },
      { title: '状态', dataIndex: 'status' }
    ]
    const { exportToCSV } = useExport()
    exportToCSV(dataSource.value, exportColumns, '生产班组')
    message.success('导出成功')
  }

  const handleBatchStatusChange = ({ key }) => {
    const newStatus = key === 'enable' ? '1' : '0'
    const statusText = key === 'enable' ? '启用' : '禁用'
    Modal.confirm({
      title: `确认批量${statusText}`,
      content: `确定${statusText}选中的 ${selectedRowKeys.value.length} 条记录吗？`,
      onOk() {
        dataSource.value.forEach(item => {
          if (selectedRowKeys.value.includes(item.id)) {
            item.status = newStatus
          }
        })
        selectedRowKeys.value = []
        message.success(`批量${statusText}成功`)
      }
    })
  }

  const fetchData = () => {
    loading.value = true
    setTimeout(() => {
      let filteredData = [...dataSource.value]
      if (searchForm.teamCode) filteredData = filteredData.filter(item => item.teamCode.includes(searchForm.teamCode))
      if (searchForm.teamName) filteredData = filteredData.filter(item => item.teamName.includes(searchForm.teamName))
      if (searchForm.departmentId) filteredData = filteredData.filter(item => item.departmentId === searchForm.departmentId)
      if (searchForm.status !== undefined) filteredData = filteredData.filter(item => item.status === searchForm.status)
      pagination.total = filteredData.length
      loading.value = false
    }, 300)
  }

  // 生命周期
  onMounted(() => {
    fetchData()
  })
</script>

<style scoped>
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  .toolbar {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }

  .search-card {
    margin-bottom: 16px;
  }

  .table-container {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
  }
</style>