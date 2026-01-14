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
        <a-form-item label="供应商编码">
          <a-input v-model:value="searchForm.supplierCode" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="供应商名称">
          <a-input v-model:value="searchForm.supplierName" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="供应商等级">
          <a-select v-model:value="searchForm.supplierLevel" style="width: 130px" placeholder="请选择" allow-clear>
            <a-select-option value="A">A级供应商</a-select-option>
            <a-select-option value="B">B级供应商</a-select-option>
            <a-select-option value="C">C级供应商</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="供应类型">
          <a-select v-model:value="searchForm.supplyType" style="width: 120px" placeholder="请选择" allow-clear>
            <a-select-option value="raw_material">原材料</a-select-option>
            <a-select-option value="equipment">设备</a-select-option>
            <a-select-option value="service">服务</a-select-option>
            <a-select-option value="other">其他</a-select-option>
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
          <template v-if="column.key === 'supplierLevel'">
            <a-tag :color="getSupplierLevelColor(record.supplierLevel)">
              {{ getSupplierLevelText(record.supplierLevel) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'supplyType'">
            <a-tag :color="getSupplyTypeColor(record.supplyType)">
              {{ getSupplyTypeText(record.supplyType) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'creditLevel'">
            <a-rate :value="record.creditLevel" disabled allow-half />
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
    <a-modal v-model:visible="modalVisible" :title="modalTitle" width="1000px" @ok="handleSubmit"
      @cancel="handleCancel">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="供应商编码" name="supplierCode">
              <a-input v-model:value="formData.supplierCode" placeholder="请输入供应商编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="供应商名称" name="supplierName">
              <a-input v-model:value="formData.supplierName" placeholder="请输入供应商名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="供应商等级" name="supplierLevel">
              <a-select v-model:value="formData.supplierLevel" placeholder="请选择供应商等级">
                <a-select-option value="A">A级供应商</a-select-option>
                <a-select-option value="B">B级供应商</a-select-option>
                <a-select-option value="C">C级供应商</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="供应类型" name="supplyType">
              <a-select v-model:value="formData.supplyType" placeholder="请选择供应类型">
                <a-select-option value="raw_material">原材料</a-select-option>
                <a-select-option value="equipment">设备</a-select-option>
                <a-select-option value="service">服务</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="信用等级" name="creditLevel">
              <a-rate v-model:value="formData.creditLevel" allow-half />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio value="1">启用</a-radio>
                <a-radio value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="合作年限" name="cooperationYears">
              <a-input-number v-model:value="formData.cooperationYears" placeholder="请输入" :min="0" :max="50"
                style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="统一社会信用代码" name="creditCode">
              <a-input v-model:value="formData.creditCode" placeholder="请输入统一社会信用代码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="法定代表人" name="legalPerson">
              <a-input v-model:value="formData.legalPerson" placeholder="请输入法定代表人" />
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
            <a-form-item label="邮箱地址" name="email">
              <a-input v-model:value="formData.email" placeholder="请输入邮箱地址" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="详细地址" name="address">
          <a-textarea v-model:value="formData.address" placeholder="请输入详细地址" :rows="2" />
        </a-form-item>

        <a-divider>其他信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开户银行" name="bankName">
              <a-input v-model:value="formData.bankName" placeholder="请输入开户银行" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="银行账号" name="bankAccount">
              <a-input v-model:value="formData.bankAccount" placeholder="请输入银行账号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" placeholder="请输入备注信息" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal v-model:visible="viewModalVisible" title="供应商详情" width="900px" :footer="null">
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="供应商编码">{{ viewData.supplierCode }}</a-descriptions-item>
        <a-descriptions-item label="供应商名称">{{ viewData.supplierName }}</a-descriptions-item>
        <a-descriptions-item label="供应商等级">
          <a-tag :color="getSupplierLevelColor(viewData.supplierLevel)">
            {{ getSupplierLevelText(viewData.supplierLevel) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="供应类型">
          <a-tag :color="getSupplyTypeColor(viewData.supplyType)">
            {{ getSupplyTypeText(viewData.supplyType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="信用等级">
          <a-rate :value="viewData.creditLevel" disabled allow-half />
        </a-descriptions-item>
        <a-descriptions-item label="合作年限">{{ viewData.cooperationYears }} 年</a-descriptions-item>
        <a-descriptions-item label="统一社会信用代码">{{ viewData.creditCode }}</a-descriptions-item>
        <a-descriptions-item label="法定代表人">{{ viewData.legalPerson }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ viewData.phone }}</a-descriptions-item>
        <a-descriptions-item label="邮箱地址">{{ viewData.email }}</a-descriptions-item>
        <a-descriptions-item label="详细地址" :span="3">{{ viewData.address }}</a-descriptions-item>
        <a-descriptions-item label="开户银行">{{ viewData.bankName }}</a-descriptions-item>
        <a-descriptions-item label="银行账号">{{ viewData.bankAccount }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
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
    supplierCode: '',
    supplierName: '',
    supplierLevel: undefined,
    supplyType: undefined,
    status: undefined
  })

  // 表单数据
  const formData = reactive({
    id: '',
    supplierCode: '',
    supplierName: '',
    supplierLevel: 'B',
    supplyType: 'raw_material',
    creditLevel: 3,
    cooperationYears: 1,
    creditCode: '',
    legalPerson: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccount: '',
    remark: '',
    status: '1'
  })

  // 表格列定义
  const columns = [
    { title: '供应商编码', dataIndex: 'supplierCode', key: 'supplierCode', width: 120 },
    { title: '供应商名称', dataIndex: 'supplierName', key: 'supplierName', width: 180 },
    { title: '供应商等级', dataIndex: 'supplierLevel', key: 'supplierLevel', width: 100 },
    { title: '供应类型', dataIndex: 'supplyType', key: 'supplyType', width: 100 },
    { title: '信用等级', dataIndex: 'creditLevel', key: 'creditLevel', width: 140 },
    { title: '合作年限', dataIndex: 'cooperationYears', key: 'cooperationYears', width: 80, customRender: ({ record }) => `${record.cooperationYears}年` },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' }
  ]

  // 表格数据
  const dataSource = ref([
    { id: '1', supplierCode: 'SUP001', supplierName: '富士康科技集团', supplierLevel: 'A', supplyType: 'equipment', creditLevel: 4, cooperationYears: 5, creditCode: '91440300617505445L', legalPerson: '郭台铭', phone: '0755-28128888', email: 'supplier@foxconn.com', address: '广东省深圳市宝安区龙华街道富士康科技园', bankName: '中国建设银行深圳分行', bankAccount: '622700720001234567', remark: '主要设备供应商', status: '1', createTime: '2024-01-15 10:30:00', updateTime: '2024-01-15 10:30:00' },
    { id: '2', supplierCode: 'SUP002', supplierName: '中芯国际集成电路制造有限公司', supplierLevel: 'A', supplyType: 'raw_material', creditLevel: 4.5, cooperationYears: 3, creditCode: '91310115764784131X', legalPerson: '周子学', phone: '021-38610000', email: 'contact@smics.com', address: '上海市浦东新区张江路18号', bankName: '中国工商银行上海分行', bankAccount: '622202100001234567', remark: '芯片原材料供应商', status: '1', createTime: '2024-01-15 10:35:00', updateTime: '2024-01-15 10:35:00' },
    { id: '3', supplierCode: 'SUP003', supplierName: '京东方科技集团股份有限公司', supplierLevel: 'B', supplyType: 'raw_material', creditLevel: 3.5, cooperationYears: 2, creditCode: '91110108101738232B', legalPerson: '陈炎顺', phone: '010-64318888', email: 'supplier@boe.com.cn', address: '北京市朝阳区酒仙桥路10号', bankName: '中国银行北京分行', bankAccount: '621790100001234567', remark: '显示屏供应商', status: '1', createTime: '2024-01-15 10:40:00', updateTime: '2024-01-15 10:40:00' }
  ])

  // 分页配置
  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 3,
    showSizeChanger: true,
    showQuickJumper: true
  })

  // 查看数据
  const viewData = ref({})

  // 表单验证规则
  const rules = {
    supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
    supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
    supplierLevel: [{ required: true, message: '请选择供应商等级', trigger: 'change' }],
    supplyType: [{ required: true, message: '请选择供应类型', trigger: 'change' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
  }

  // 工具方法
  const getSupplierLevelText = (level) => {
    const levelMap = { 'A': 'A级供应商', 'B': 'B级供应商', 'C': 'C级供应商' }
    return levelMap[level] || '未知'
  }

  const getSupplierLevelColor = (level) => {
    const colorMap = { 'A': 'red', 'B': 'orange', 'C': 'blue' }
    return colorMap[level] || 'default'
  }

  const getSupplyTypeText = (type) => {
    const typeMap = { 'raw_material': '原材料', 'equipment': '设备', 'service': '服务', 'other': '其他' }
    return typeMap[type] || '未知'
  }

  const getSupplyTypeColor = (type) => {
    const colorMap = { 'raw_material': 'green', 'equipment': 'blue', 'service': 'purple', 'other': 'gray' }
    return colorMap[type] || 'default'
  }

  // 计算属性
  const modalTitle = computed(() => isEdit.value ? '编辑供应商档案' : '新增供应商档案')

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
    Object.assign(searchForm, { supplierCode: '', supplierName: '', supplierLevel: undefined, supplyType: undefined, status: undefined })
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
    Object.assign(formData, { ...record })
  }

  const handleView = (record) => {
    viewData.value = record
    viewModalVisible.value = true
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除供应商 ${record.supplierName} 吗？`,
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
      id: '', supplierCode: '', supplierName: '', supplierLevel: 'B', supplyType: 'raw_material',
      creditLevel: 3, cooperationYears: 1, creditCode: '', legalPerson: '', phone: '', email: '',
      address: '', bankName: '', bankAccount: '', remark: '', status: '1'
    })
    formRef.value?.resetFields()
  }

  const handleExport = () => {
    if (dataSource.value.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    const exportColumns = [
      { title: '供应商编码', dataIndex: 'supplierCode' },
      { title: '供应商名称', dataIndex: 'supplierName' },
      { title: '供应商等级', dataIndex: 'supplierLevel' },
      { title: '供应类型', dataIndex: 'supplyType' },
      { title: '联系人', dataIndex: 'contact' },
      { title: '联系电话', dataIndex: 'phone' },
      { title: '状态', dataIndex: 'status' }
    ]
    const { exportToCSV } = useExport()
    exportToCSV(dataSource.value, exportColumns, '供应商档案')
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
      if (searchForm.supplierCode) filteredData = filteredData.filter(item => item.supplierCode.includes(searchForm.supplierCode))
      if (searchForm.supplierName) filteredData = filteredData.filter(item => item.supplierName.includes(searchForm.supplierName))
      if (searchForm.supplierLevel) filteredData = filteredData.filter(item => item.supplierLevel === searchForm.supplierLevel)
      if (searchForm.supplyType) filteredData = filteredData.filter(item => item.supplyType === searchForm.supplyType)
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