<template>
  <div class="page-container">
    <div class="page-header">
      <h1>出货检验单(OQC)</h1>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建检验单
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="检验单号">
          <a-input v-model:value="searchForm.inspectionNo" placeholder="请输入检验单号" />
        </a-form-item>
        <a-form-item label="销售订单">
          <a-input v-model:value="searchForm.salesOrder" placeholder="请输入销售订单号" />
        </a-form-item>
        <a-form-item label="客户名称">
          <a-input v-model:value="searchForm.customer" placeholder="请输入客户名称" />
        </a-form-item>
        <a-form-item label="检验状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择检验状态" style="width: 120px" :options="[
            { value: 'pending', label: '待检验' },
            { value: 'inspecting', label: '检验中' },
            { value: 'passed', label: '合格' },
            { value: 'failed', label: '不合格' }
          ]" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
            <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
            <a-button 
              v-if="record.status === 'pending'" 
              type="link" 
              size="small" 
              @click="startInspection(record)"
            >
              开始检验
            </a-button>
            <a-popconfirm
              title="确定要删除这个检验单吗？"
              @confirm="deleteRecord(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑检验单' : '新建检验单'"
      width="1100px"
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
          <a-col :span="8">
            <a-form-item label="检验单号" name="inspectionNo">
              <a-input v-model:value="formData.inspectionNo" placeholder="系统自动生成" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="销售订单" name="salesOrder">
              <a-input v-model:value="formData.salesOrder" placeholder="请输入销售订单号" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="检验日期" name="inspectionDate">
              <a-date-picker v-model:value="formData.inspectionDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="客户名称" name="customer">
              <a-select v-model:value="formData.customer" placeholder="请选择客户" show-search :options="customers.map(customer => ({ value: customer.name, label: customer.name }))" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="产品编码" name="productCode">
              <a-input v-model:value="formData.productCode" placeholder="请输入产品编码" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="产品名称" name="productName">
              <a-input v-model:value="formData.productName" placeholder="请输入产品名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="出货数量" name="shipmentQuantity">
              <a-input-number v-model:value="formData.shipmentQuantity" placeholder="请输入出货数量" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="抽样数量" name="sampleQuantity">
              <a-input-number v-model:value="formData.sampleQuantity" placeholder="请输入抽样数量" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="检验员" name="inspector">
              <a-input v-model:value="formData.inspector" placeholder="请输入检验员姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="出货批次" name="shipmentBatch">
              <a-input v-model:value="formData.shipmentBatch" placeholder="请输入出货批次号" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="运输方式" name="shippingMethod">
              <a-select v-model:value="formData.shippingMethod" placeholder="请选择运输方式" :options="[
                { value: 'land', label: '陆运' },
                { value: 'sea', label: '海运' },
                { value: 'air', label: '空运' },
                { value: 'express', label: '快递' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="目的地" name="destination">
              <a-input v-model:value="formData.destination" placeholder="请输入目的地" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="检验项目" name="items">
          <div v-for="(item, index) in formData.items" :key="index" class="inspection-item">
            <a-row :gutter="8">
              <a-col :span="3">
                <a-input v-model:value="item.category" placeholder="类别" />
              </a-col>
              <a-col :span="4">
                <a-input v-model:value="item.name" placeholder="检验项目" />
              </a-col>
              <a-col :span="3">
                <a-input v-model:value="item.standard" placeholder="标准值" />
              </a-col>
              <a-col :span="2">
                <a-input v-model:value="item.unit" placeholder="单位" />
              </a-col>
              <a-col :span="2">
                <a-input-number v-model:value="item.actualValue" placeholder="实测值" style="width: 100%" />
              </a-col>
              <a-col :span="2">
                <a-select v-model:value="item.result" placeholder="结果" :options="[
                  { value: 'pass', label: '合格' },
                  { value: 'fail', label: '不合格' }
                ]" />
              </a-col>
              <a-col :span="4">
                <a-input v-model:value="item.remark" placeholder="备注" />
              </a-col>
              <a-col :span="2">
                <a-button type="text" danger @click="removeItem(index)">删除</a-button>
              </a-col>
            </a-row>
          </div>
          <a-button type="dashed" @click="addItem" style="width: 100%; margin-top: 8px">
            <template #icon><PlusOutlined /></template>
            添加检验项目
          </a-button>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="检验结论" name="conclusion">
              <a-radio-group v-model:value="formData.conclusion">
                <a-radio value="passed">合格</a-radio>
                <a-radio value="failed">不合格</a-radio>
                <a-radio value="conditional">有条件接收</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="出货决定" name="shipmentDecision">
              <a-select v-model:value="formData.shipmentDecision" placeholder="请选择出货决定" :options="[
                { value: 'approved', label: '准予出货' },
                { value: 'conditional', label: '有条件出货' },
                { value: 'rejected', label: '拒绝出货' },
                { value: 'rework', label: '返工后出货' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" :rows="3" placeholder="请输入备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

// 搜索表单
const searchForm = reactive({
  inspectionNo: '',
  salesOrder: '',
  customer: '',
  status: ''
})

// 表格数据
const dataSource = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条数据`
})

// 表格列定义
const columns = [
  {
    title: '检验单号',
    dataIndex: 'inspectionNo',
    key: 'inspectionNo',
    width: 140
  },
  {
    title: '销售订单',
    dataIndex: 'salesOrder',
    key: 'salesOrder',
    width: 120
  },
  {
    title: '客户名称',
    dataIndex: 'customer',
    key: 'customer'
  },
  {
    title: '产品编码',
    dataIndex: 'productCode',
    key: 'productCode',
    width: 120
  },
  {
    title: '产品名称',
    dataIndex: 'productName',
    key: 'productName'
  },
  {
    title: '出货数量',
    dataIndex: 'shipmentQuantity',
    key: 'shipmentQuantity',
    width: 100
  },
  {
    title: '检验状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '检验日期',
    dataIndex: 'inspectionDate',
    key: 'inspectionDate',
    width: 120
  },
  {
    title: '检验员',
    dataIndex: 'inspector',
    key: 'inspector',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  id: null,
  inspectionNo: '',
  salesOrder: '',
  inspectionDate: null,
  customer: '',
  productCode: '',
  productName: '',
  shipmentQuantity: null,
  sampleQuantity: null,
  inspector: '',
  shipmentBatch: '',
  shippingMethod: '',
  destination: '',
  items: [],
  conclusion: 'passed',
  shipmentDecision: 'approved',
  remark: '',
  status: 'pending'
})

// 客户数据
const customers = ref([
  { id: 1, name: '客户A' },
  { id: 2, name: '客户B' },
  { id: 3, name: '客户C' }
])

// 表单验证规则
const rules = {
  salesOrder: [{ required: true, message: '请输入销售订单号', trigger: 'blur' }],
  inspectionDate: [{ required: true, message: '请选择检验日期', trigger: 'change' }],
  customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
  productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  shipmentQuantity: [{ required: true, message: '请输入出货数量', trigger: 'blur' }],
  sampleQuantity: [{ required: true, message: '请输入抽样数量', trigger: 'blur' }],
  inspector: [{ required: true, message: '请输入检验员姓名', trigger: 'blur' }],
  shippingMethod: [{ required: true, message: '请选择运输方式', trigger: 'change' }],
  conclusion: [{ required: true, message: '请选择检验结论', trigger: 'change' }],
  shipmentDecision: [{ required: true, message: '请选择出货决定', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    inspectionNo: 'OQC20240115001',
    salesOrder: 'SO20240115001',
    inspectionDate: '2024-01-15',
    customer: '客户A',
    productCode: 'PROD001',
    productName: '产品A',
    shipmentQuantity: 500,
    sampleQuantity: 50,
    inspector: '张三',
    shipmentBatch: 'SHIP001',
    shippingMethod: 'land',
    destination: '北京',
    status: 'passed',
    conclusion: 'passed',
    shipmentDecision: 'approved',
    remark: '检验合格，准予出货'
  },
  {
    id: 2,
    inspectionNo: 'OQC20240116001',
    salesOrder: 'SO20240116001',
    inspectionDate: '2024-01-16',
    customer: '客户B',
    productCode: 'PROD002',
    productName: '产品B',
    shipmentQuantity: 300,
    sampleQuantity: 30,
    inspector: '李四',
    shipmentBatch: 'SHIP002',
    shippingMethod: 'air',
    destination: '上海',
    status: 'failed',
    conclusion: 'failed',
    shipmentDecision: 'rework',
    remark: '包装不符合要求，需要重新包装'
  },
  {
    id: 3,
    inspectionNo: 'OQC20240117001',
    salesOrder: 'SO20240117001',
    inspectionDate: '2024-01-17',
    customer: '客户C',
    productCode: 'PROD003',
    productName: '产品C',
    shipmentQuantity: 200,
    sampleQuantity: 20,
    inspector: '王五',
    shipmentBatch: 'SHIP003',
    shippingMethod: 'sea',
    destination: '广州',
    status: 'pending',
    conclusion: 'passed',
    shipmentDecision: 'approved',
    remark: ''
  }
]

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    inspecting: 'blue',
    passed: 'green',
    failed: 'red'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待检验',
    inspecting: '检验中',
    passed: '合格',
    failed: '不合格'
  }
  return texts[status] || status
}

// 获取数据
const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    dataSource.value = mockData
    pagination.total = mockData.length
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.inspectionNo = ''
  searchForm.salesOrder = ''
  searchForm.customer = ''
  searchForm.status = ''
  handleSearch()
}

// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

// 显示新建模态框
const showCreateModal = () => {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

// 编辑记录
const editRecord = (record) => {
  isEdit.value = true
  modalVisible.value = true
  Object.assign(formData, {
    ...record,
    inspectionDate: record.inspectionDate ? dayjs(record.inspectionDate) : null,
    items: record.items || [
      { category: '', name: '', standard: '', unit: '', actualValue: null, result: 'pass', remark: '' }
    ]
  })
}

// 查看记录
const viewRecord = (record) => {
  message.info('查看功能开发中...')
}

// 开始检验
const startInspection = (record) => {
  record.status = 'inspecting'
  message.success('已开始检验')
}

// 删除记录
const deleteRecord = (id) => {
  const index = dataSource.value.findIndex(item => item.id === id)
  if (index > -1) {
    dataSource.value.splice(index, 1)
    pagination.total--
    message.success('删除成功')
  }
}

// 添加检验项目
const addItem = () => {
  formData.items.push({ category: '', name: '', standard: '', unit: '', actualValue: null, result: 'pass', remark: '' })
}

// 移除检验项目
const removeItem = (index) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = dataSource.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        dataSource.value[index] = {
          ...formData,
          inspectionDate: formData.inspectionDate ? formData.inspectionDate.format('YYYY-MM-DD') : null
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const inspectionNo = `OQC${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
      const newItem = {
        ...formData,
        id: newId,
        inspectionNo,
        inspectionDate: formData.inspectionDate ? formData.inspectionDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        status: 'pending'
      }
      dataSource.value.unshift(newItem)
      pagination.total++
      message.success('创建成功')
    }
    
    modalVisible.value = false
    resetForm()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    inspectionNo: '',
    salesOrder: '',
    inspectionDate: null,
    customer: '',
    productCode: '',
    productName: '',
    shipmentQuantity: null,
    sampleQuantity: null,
    inspector: '',
    shipmentBatch: '',
    shippingMethod: '',
    destination: '',
    items: [{ category: '', name: '', standard: '', unit: '', actualValue: null, result: 'pass', remark: '' }],
    conclusion: 'passed',
    shipmentDecision: 'approved',
    remark: '',
    status: 'pending'
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.search-form {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.inspection-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>