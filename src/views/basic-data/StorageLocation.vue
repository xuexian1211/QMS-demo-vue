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
        <a-form-item label="地点编码">
          <a-input v-model:value="searchForm.locationCode" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="地点名称">
          <a-input v-model:value="searchForm.locationName" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="地点类型">
          <a-select v-model:value="searchForm.locationType" style="width: 120px" placeholder="请选择" allow-clear>
            <a-select-option value="warehouse">仓库</a-select-option>
            <a-select-option value="workshop">车间</a-select-option>
            <a-select-option value="office">办公室</a-select-option>
            <a-select-option value="outdoor">室外</a-select-option>
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
          <template v-if="column.key === 'locationType'">
            <a-tag :color="getLocationTypeColor(record.locationType)">
              {{ getLocationTypeText(record.locationType) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'capacity'">
            <a-progress :percent="getUsagePercent(record)" size="small" :status="getUsageStatus(record)"
              :format="() => `${record.usedCapacity}/${record.totalCapacity}m³`" />
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">
              {{ record.status === '1' ? '启用' : '禁用' }}
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

    <!-- 新增/编辑模态框 -->
    <a-modal v-model:visible="modalVisible" :title="modalTitle" width="900px" @ok="handleSubmit" @cancel="handleCancel">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
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
              <a-input-number v-model:value="formData.totalCapacity" placeholder="请输入" :min="0" :precision="2"
                style="width: 100%" />
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
          <a-textarea v-model:value="formData.address" placeholder="请输入详细地址" :rows="2" />
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
          <a-textarea v-model:value="formData.specialRequirements" placeholder="请输入特殊存储要求" :rows="2" />
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" placeholder="请输入备注信息" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal v-model:visible="viewModalVisible" title="存储地点详情" width="800px" :footer="null">
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
          <a-progress :percent="getUsagePercent(viewData)" size="small" :status="getUsageStatus(viewData)" />
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
  const formRef = ref()
  const selectedRowKeys = ref([])

  // 搜索表单
  const searchForm = reactive({
    locationCode: '',
    locationName: '',
    locationType: undefined,
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
    { title: '地点编码', dataIndex: 'locationCode', key: 'locationCode', width: 120 },
    { title: '地点名称', dataIndex: 'locationName', key: 'locationName', width: 150 },
    { title: '地点类型', dataIndex: 'locationType', key: 'locationType', width: 100 },
    { title: '所属部门', key: 'departmentName', width: 120, customRender: ({ record }) => getDepartmentName(record.departmentId) },
    { title: '负责人', key: 'managerName', width: 100, customRender: ({ record }) => getManagerName(record.managerId) },
    { title: '容量使用情况', dataIndex: 'capacity', key: 'capacity', width: 180 },
    { title: '温度要求', dataIndex: 'temperature', key: 'temperature', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' }
  ]

  // 表格数据
  const dataSource = ref([
    { id: '1', locationCode: 'WH001', locationName: '原料仓库A', locationType: 'warehouse', departmentId: '3', managerId: '1', totalCapacity: 1000, usedCapacity: 750, phone: '13800138001', address: '厂区北侧A栋1楼', temperature: '常温', humidity: '30-70%', ventilation: 'good', fireLevel: 'A', specialRequirements: '防潮、防尘', remark: '主要存储原材料', status: '1', createTime: '2024-01-15 10:30:00', updateTime: '2024-01-15 10:30:00' },
    { id: '2', locationCode: 'WH002', locationName: '成品仓库B', locationType: 'warehouse', departmentId: '3', managerId: '2', totalCapacity: 800, usedCapacity: 400, phone: '13800138002', address: '厂区南侧B栋2楼', temperature: '常温', humidity: '30-60%', ventilation: 'good', fireLevel: 'A', specialRequirements: '定期通风', remark: '存储成品产品', status: '1', createTime: '2024-01-15 10:35:00', updateTime: '2024-01-15 10:35:00' },
    { id: '3', locationCode: 'WS001', locationName: '装配车间', locationType: 'workshop', departmentId: '1', managerId: '3', totalCapacity: 500, usedCapacity: 300, phone: '13800138003', address: '厂区中央C栋1楼', temperature: '18-25℃', humidity: '40-60%', ventilation: 'normal', fireLevel: 'B', specialRequirements: '恒温恒湿', remark: '产品装配区域', status: '1', createTime: '2024-01-15 10:40:00', updateTime: '2024-01-15 10:40:00' },
    { id: '4', locationCode: 'CF001', locationName: '冷藏库', locationType: 'warehouse', departmentId: '3', managerId: '4', totalCapacity: 200, usedCapacity: 150, phone: '13800138004', address: '厂区东侧D栋地下1层', temperature: '0-4℃', humidity: '80-90%', ventilation: 'poor', fireLevel: 'A', specialRequirements: '低温存储', remark: '存储需要冷藏的物料', status: '1', createTime: '2024-01-15 10:45:00', updateTime: '2024-01-15 10:45:00' }
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
    locationCode: [{ required: true, message: '请输入地点编码', trigger: 'blur' }],
    locationName: [{ required: true, message: '请输入地点名称', trigger: 'blur' }],
    locationType: [{ required: true, message: '请选择地点类型', trigger: 'change' }],
    departmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
    managerId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    totalCapacity: [{ required: true, message: '请输入总容量', trigger: 'blur' }]
  }

  // 工具方法
  const getLocationTypeText = (type) => {
    const typeMap = { 'warehouse': '仓库', 'workshop': '车间', 'office': '办公室', 'outdoor': '室外' }
    return typeMap[type] || '未知'
  }

  const getLocationTypeColor = (type) => {
    const colorMap = { 'warehouse': 'blue', 'workshop': 'green', 'office': 'orange', 'outdoor': 'cyan' }
    return colorMap[type] || 'default'
  }

  const getDepartmentName = (departmentId) => {
    const departmentMap = { '1': '生产一部', '2': '生产二部', '3': '仓储部', '4': '质量部' }
    return departmentMap[departmentId] || '未知'
  }

  const getManagerName = (managerId) => {
    const managerMap = { '1': '张三', '2': '李四', '3': '王五', '4': '赵六' }
    return managerMap[managerId] || '未指定'
  }

  const getVentilationText = (ventilation) => {
    const ventilationMap = { 'good': '良好', 'normal': '一般', 'poor': '较差' }
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
    Object.assign(searchForm, { locationCode: '', locationName: '', locationType: undefined, status: undefined })
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
    modalVisible.value = true
    Object.assign(formData, record)
  }

  const handleView = (record) => {
    viewData.value = record
    viewModalVisible.value = true
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除存储地点 ${record.locationName} 吗？`,
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
          ...formData, id: newId, usedCapacity: 0,
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
      id: '', locationCode: '', locationName: '', locationType: 'warehouse', departmentId: undefined,
      managerId: undefined, totalCapacity: 0, usedCapacity: 0, phone: '', address: '',
      temperature: '', humidity: '', ventilation: 'normal', fireLevel: 'B',
      specialRequirements: '', remark: '', status: '1'
    })
    formRef.value?.resetFields()
  }

  const handleExport = () => {
    if (dataSource.value.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    const exportColumns = [
      { title: '地点编码', dataIndex: 'locationCode' },
      { title: '地点名称', dataIndex: 'locationName' },
      { title: '地点类型', dataIndex: 'locationType' },
      { title: '所属仓库', dataIndex: 'warehouseName' },
      { title: '责任人', dataIndex: 'managerName' },
      { title: '状态', dataIndex: 'status' }
    ]
    const { exportToCSV } = useExport()
    exportToCSV(dataSource.value, exportColumns, '库位地点')
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
      if (searchForm.locationCode) filteredData = filteredData.filter(item => item.locationCode.includes(searchForm.locationCode))
      if (searchForm.locationName) filteredData = filteredData.filter(item => item.locationName.includes(searchForm.locationName))
      if (searchForm.locationType) filteredData = filteredData.filter(item => item.locationType === searchForm.locationType)
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