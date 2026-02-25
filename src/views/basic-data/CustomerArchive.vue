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
        <a-dropdown>
          <a-button>
            <template #icon>
              <ImportOutlined />
            </template>导入
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleImportMenu">
              <a-menu-item key="template">下载导入模板</a-menu-item>
              <a-menu-item key="upload">上传Excel文件</a-menu-item>
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

    <!-- 隐藏的文件上传 -->
    <input ref="importFileRef" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="handleImportFile" />

    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="所属组织">
          <a-select v-model:value="searchForm.orgId" style="width: 140px" placeholder="全部" allow-clear mode="multiple"
            :max-tag-count="1">
            <a-select-option value="Group">集团</a-select-option>
            <a-select-option value="1">合肥工厂</a-select-option>
            <a-select-option value="2">芜湖工厂</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="客户编码">
          <a-input v-model:value="searchForm.customerCode" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="客户名称">
          <a-input v-model:value="searchForm.customerName" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="客户等级">
          <a-select v-model:value="searchForm.customerLevel" style="width: 120px" placeholder="请选择" allow-clear>
            <a-select-option value="A">A级客户</a-select-option>
            <a-select-option value="B">B级客户</a-select-option>
            <a-select-option value="C">C级客户</a-select-option>
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
          <template v-if="column.key === 'orgId'">
            <a-tag :color="getOrgColor(record.orgId)">
              {{ getOrgName(record.orgId) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'customerLevel'">
            <a-tag :color="getCustomerLevelColor(record.customerLevel)">
              {{ getCustomerLevelText(record.customerLevel) }}
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

    <!-- 新增/编辑/查看模态框 -->
    <a-modal v-model:visible="modalVisible" :title="modalTitle" width="1000px" @ok="handleSubmit" @cancel="handleCancel"
      :footer="isView ? null : undefined">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="所属组织" name="orgId">
              <a-select v-model:value="formData.orgId" placeholder="请选择所属组织" :disabled="isView">
                <a-select-option value="Group">集团（全局）</a-select-option>
                <a-select-option value="1">合肥工厂</a-select-option>
                <a-select-option value="2">芜湖工厂</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="客户编码" name="customerCode">
              <a-input v-model:value="formData.customerCode" placeholder="请输入客户编码" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="客户名称" name="customerName">
              <a-input v-model:value="formData.customerName" placeholder="请输入客户名称" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="客户等级" name="customerLevel">
              <a-select v-model:value="formData.customerLevel" placeholder="请选择客户等级" :disabled="isView">
                <a-select-option value="A">A级客户</a-select-option>
                <a-select-option value="B">B级客户</a-select-option>
                <a-select-option value="C">C级客户</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="信用等级" name="creditLevel">
              <a-rate v-model:value="formData.creditLevel" allow-half :disabled="isView" />
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

        <a-divider>基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="统一社会信用代码" name="creditCode">
              <a-input v-model:value="formData.creditCode" placeholder="请输入统一社会信用代码" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="法定代表人" name="legalPerson">
              <a-input v-model:value="formData.legalPerson" placeholder="请输入法定代表人" :disabled="isView" />
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
            <a-form-item label="邮箱地址" name="email">
              <a-input v-model:value="formData.email" placeholder="请输入邮箱地址" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="详细地址" name="address">
          <a-textarea v-model:value="formData.address" placeholder="请输入详细地址" :rows="2" :disabled="isView" />
        </a-form-item>

        <a-divider>其他信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开户银行" name="bankName">
              <a-input v-model:value="formData.bankName" placeholder="请输入开户银行" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="银行账号" name="bankAccount">
              <a-input v-model:value="formData.bankAccount" placeholder="请输入银行账号" :disabled="isView" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" placeholder="请输入备注信息" :rows="3" :disabled="isView" />
        </a-form-item>

        <a-divider>附件管理</a-divider>
        <a-form-item label="资质附件">
          <a-upload v-model:file-list="formData.attachments" :disabled="isView" :before-upload="() => false"
            list-type="text">
            <a-button :disabled="isView">
              <UploadOutlined /> 上传附件
            </a-button>
          </a-upload>
          <div v-if="formData.attachments && formData.attachments.length"
            style="margin-top: 8px; color: #8c8c8c; font-size: 12px;">
            已上传 {{ formData.attachments.length }} 个附件
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal v-model:visible="viewModalVisible" title="客户详情" width="900px" :footer="null">
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="所属组织">
          <a-tag :color="getOrgColor(viewData.orgId)">{{ getOrgName(viewData.orgId) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="客户编码">{{ viewData.customerCode }}</a-descriptions-item>
        <a-descriptions-item label="客户名称">{{ viewData.customerName }}</a-descriptions-item>
        <a-descriptions-item label="客户等级">
          <a-tag :color="getCustomerLevelColor(viewData.customerLevel)">
            {{ getCustomerLevelText(viewData.customerLevel) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="信用等级">
          <a-rate :value="viewData.creditLevel" disabled allow-half />
        </a-descriptions-item>
        <a-descriptions-item label="统一社会信用代码">{{ viewData.creditCode }}</a-descriptions-item>
        <a-descriptions-item label="法定代表人">{{ viewData.legalPerson }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ viewData.phone }}</a-descriptions-item>
        <a-descriptions-item label="邮箱地址">{{ viewData.email }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
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
    ImportOutlined,
    UploadOutlined,
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
  const importFileRef = ref()

  // 搜索表单
  const searchForm = reactive({
    orgId: undefined,
    customerCode: '',
    customerName: '',
    customerLevel: undefined,
    status: undefined
  })

  // 表单数据
  const formData = reactive({
    id: '',
    orgId: 'Group',
    customerCode: '',
    customerName: '',
    customerLevel: 'B',
    creditLevel: 3,
    creditCode: '',
    legalPerson: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccount: '',
    remark: '',
    status: '1',
    attachments: []
  })

  // 表格列定义
  const columns = [
    { title: '所属组织', dataIndex: 'orgId', key: 'orgId', width: 100 },
    { title: '客户编码', dataIndex: 'customerCode', key: 'customerCode', width: 120 },
    { title: '客户名称', dataIndex: 'customerName', key: 'customerName', width: 180 },
    { title: '客户等级', dataIndex: 'customerLevel', key: 'customerLevel', width: 100 },
    { title: '信用等级', dataIndex: 'creditLevel', key: 'creditLevel', width: 140 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' }
  ]

  // 表格数据
  const dataSource = ref([
    { id: '1', orgId: 'Group', customerCode: 'CUST001', customerName: '华为技术有限公司', customerLevel: 'A', creditLevel: 5, creditCode: '91440300708461136T', legalPerson: '任正非', phone: '0755-28780808', email: 'contact@huawei.com', address: '广东省深圳市龙岗区坂田华为基地', bankName: '中国工商银行深圳分行', bankAccount: '622202400001234567', remark: '重要战略客户', status: '1', createTime: '2024-01-15 10:30:00', updateTime: '2024-01-15 10:30:00', attachments: [] },
    { id: '2', orgId: '1', customerCode: 'CUST002', customerName: '腾讯科技有限公司', customerLevel: 'A', creditLevel: 4.5, creditCode: '91440300708461136T', legalPerson: '马化腾', phone: '0755-86013388', email: 'contact@tencent.com', address: '广东省深圳市南山区科技园', bankName: '中国建设银行深圳分行', bankAccount: '622700720001234567', remark: '长期合作客户', status: '1', createTime: '2024-01-15 10:35:00', updateTime: '2024-01-15 10:35:00', attachments: [] },
    { id: '3', orgId: '2', customerCode: 'CUST003', customerName: '阿里巴巴集团', customerLevel: 'A', creditLevel: 4.5, creditCode: '91330100MA2802X12X', legalPerson: '张勇', phone: '0571-85022088', email: 'contact@alibaba.com', address: '浙江省杭州市余杭区文一西路969号', bankName: '中国工商银行杭州分行', bankAccount: '622202120001234567', remark: '电商领域重要客户', status: '1', createTime: '2024-01-15 10:40:00', updateTime: '2024-01-15 10:40:00', attachments: [] }
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
    customerCode: [{ required: true, message: '请输入客户编码', trigger: 'blur' }],
    customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
    customerLevel: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
  }

  // 多组织工具方法
  const getOrgName = (orgId) => {
    const map = { 'Group': '集团', '1': '合肥工厂', '2': '芜湖工厂' }
    return map[orgId] || '未知'
  }

  const getOrgColor = (orgId) => {
    const map = { 'Group': 'purple', '1': 'blue', '2': 'cyan' }
    return map[orgId] || 'default'
  }

  // 工具方法
  const getCustomerLevelText = (level) => {
    const levelMap = { 'A': 'A级客户', 'B': 'B级客户', 'C': 'C级客户' }
    return levelMap[level] || '未知'
  }

  const getCustomerLevelColor = (level) => {
    const colorMap = { 'A': 'red', 'B': 'orange', 'C': 'blue' }
    return colorMap[level] || 'default'
  }

  // 计算属性
  const modalTitle = computed(() => {
    if (isView.value) return '查看客户档案'
    return isEdit.value ? '编辑客户档案' : '新增客户档案'
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
    Object.assign(searchForm, { orgId: undefined, customerCode: '', customerName: '', customerLevel: undefined, status: undefined })
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
    Object.assign(formData, { ...record })
  }

  const handleView = (record) => {
    isEdit.value = true
    isView.value = true
    Object.assign(formData, { ...record })
    modalVisible.value = true
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除客户 ${record.customerName} 吗？`,
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
      id: '', orgId: 'Group', customerCode: '', customerName: '', customerLevel: 'B', creditLevel: 3,
      creditCode: '', legalPerson: '', phone: '', email: '', address: '',
      bankName: '', bankAccount: '', remark: '', status: '1', attachments: []
    })
    formRef.value?.resetFields()
  }

  const handleExport = () => {
    if (dataSource.value.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    const exportColumns = [
      { title: '客户编码', dataIndex: 'customerCode' },
      { title: '客户名称', dataIndex: 'customerName' },
      { title: '客户等级', dataIndex: 'customerLevel' },
      { title: '联系人', dataIndex: 'contact' },
      { title: '联系电话', dataIndex: 'phone' },
      { title: '电子邮箱', dataIndex: 'email' },
      { title: '状态', dataIndex: 'status' }
    ]
    const { exportToCSV } = useExport()
    exportToCSV(dataSource.value, exportColumns, '客户档案')
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

  // 导入功能
  const handleImportMenu = ({ key }) => {
    if (key === 'template') {
      message.success('导入模板下载功能（客户编码、客户名称、等级、联系电话等列）')
    } else if (key === 'upload') {
      importFileRef.value?.click()
    }
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    message.info(`正在解析文件: ${file.name}`)
    // NOTE: 实际项目中应使用 xlsx 等库进行解析
    setTimeout(() => {
      message.success('导入完成（前端模拟），共处理 0 条数据')
    }, 1000)
    e.target.value = ''
  }

  const fetchData = () => {
    loading.value = true
    setTimeout(() => {
      let filteredData = [...dataSource.value]
      // 多组织过滤
      if (searchForm.orgId && searchForm.orgId.length > 0) {
        filteredData = filteredData.filter(item => searchForm.orgId.includes(item.orgId))
      }
      if (searchForm.customerCode) filteredData = filteredData.filter(item => item.customerCode.includes(searchForm.customerCode))
      if (searchForm.customerName) filteredData = filteredData.filter(item => item.customerName.includes(searchForm.customerName))
      if (searchForm.customerLevel) filteredData = filteredData.filter(item => item.customerLevel === searchForm.customerLevel)
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