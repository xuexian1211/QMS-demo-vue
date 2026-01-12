<template>
  <div class="page-container">
    <div class="page-header">
      <h1>成品检验单(FQC)</h1>
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
        <a-form-item label="生产批次">
          <a-input v-model:value="searchForm.batchNo" placeholder="请输入生产批次号" />
        </a-form-item>
        <a-form-item label="产品编码">
          <a-input v-model:value="searchForm.productCode" placeholder="请输入产品编码" />
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
            <a-form-item label="生产批次" name="batchNo">
              <a-input v-model:value="formData.batchNo" placeholder="请输入生产批次号" />
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
            <a-form-item label="产品编码" name="productCode">
              <a-input v-model:value="formData.productCode" placeholder="请输入产品编码" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="产品名称" name="productName">
              <a-input v-model:value="formData.productName" placeholder="请输入产品名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="规格型号" name="specification">
              <a-input v-model:value="formData.specification" placeholder="请输入规格型号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="生产数量" name="productionQuantity">
              <a-input-number v-model:value="formData.productionQuantity" placeholder="请输入生产数量" style="width: 100%" />
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
          <a-col :span="12">
            <a-form-item label="检验标准" name="inspectionStandard">
              <a-select v-model:value="formData.inspectionStandard" placeholder="请选择检验标准" :options="[
                { value: 'GB2828', label: 'GB2828' },
                { value: 'ISO9001', label: 'ISO9001' },
                { value: 'enterprise', label: '企业标准' },
                { value: 'custom', label: '自定义标准' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="检验级别" name="inspectionLevel">
              <a-select v-model:value="formData.inspectionLevel" placeholder="请选择检验级别" :options="[
                { value: 'normal', label: '正常检验' },
                { value: 'tightened', label: '加严检验' },
                { value: 'relaxed', label: '放宽检验' }
              ]" />
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
            <a-form-item label="处理方式" name="disposalMethod">
              <a-select v-model:value="formData.disposalMethod" placeholder="请选择处理方式" :options="[
                { value: 'release', label: '放行' },
                { value: 'rework', label: '返工' },
                { value: 'scrap', label: '报废' },
                { value: 'hold', label: '暂扣' }
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
  batchNo: '',
  productCode: '',
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
    title: '生产批次',
    dataIndex: 'batchNo',
    key: 'batchNo',
    width: 120
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
    title: '生产数量',
    dataIndex: 'productionQuantity',
    key: 'productionQuantity',
    width: 100
  },
  {
    title: '抽样数量',
    dataIndex: 'sampleQuantity',
    key: 'sampleQuantity',
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
  batchNo: '',
  inspectionDate: null,
  productCode: '',
  productName: '',
  specification: '',
  productionQuantity: null,
  sampleQuantity: null,
  inspector: '',
  inspectionStandard: '',
  inspectionLevel: 'normal',
  items: [],
  conclusion: 'passed',
  disposalMethod: 'release',
  remark: '',
  status: 'pending'
})

// 表单验证规则
const rules = {
  batchNo: [{ required: true, message: '请输入生产批次号', trigger: 'blur' }],
  inspectionDate: [{ required: true, message: '请选择检验日期', trigger: 'change' }],
  productCode: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  productionQuantity: [{ required: true, message: '请输入生产数量', trigger: 'blur' }],
  sampleQuantity: [{ required: true, message: '请输入抽样数量', trigger: 'blur' }],
  inspector: [{ required: true, message: '请输入检验员姓名', trigger: 'blur' }],
  inspectionStandard: [{ required: true, message: '请选择检验标准', trigger: 'change' }],
  inspectionLevel: [{ required: true, message: '请选择检验级别', trigger: 'change' }],
  conclusion: [{ required: true, message: '请选择检验结论', trigger: 'change' }],
  disposalMethod: [{ required: true, message: '请选择处理方式', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    inspectionNo: 'FQC20240115001',
    batchNo: 'BATCH20240115001',
    inspectionDate: '2024-01-15',
    productCode: 'PROD001',
    productName: '成品A',
    specification: 'SPEC-A001',
    productionQuantity: 1000,
    sampleQuantity: 80,
    inspector: '张三',
    inspectionStandard: 'GB2828',
    inspectionLevel: 'normal',
    status: 'passed',
    conclusion: 'passed',
    disposalMethod: 'release',
    remark: '检验合格，准予放行'
  },
  {
    id: 2,
    inspectionNo: 'FQC20240116001',
    batchNo: 'BATCH20240116001',
    inspectionDate: '2024-01-16',
    productCode: 'PROD002',
    productName: '成品B',
    specification: 'SPEC-B001',
    productionQuantity: 500,
    sampleQuantity: 50,
    inspector: '李四',
    inspectionStandard: 'ISO9001',
    inspectionLevel: 'tightened',
    status: 'failed',
    conclusion: 'failed',
    disposalMethod: 'rework',
    remark: '外观缺陷，需要返工处理'
  },
  {
    id: 3,
    inspectionNo: 'FQC20240117001',
    batchNo: 'BATCH20240117001',
    inspectionDate: '2024-01-17',
    productCode: 'PROD003',
    productName: '成品C',
    specification: 'SPEC-C001',
    productionQuantity: 800,
    sampleQuantity: 64,
    inspector: '王五',
    inspectionStandard: 'enterprise',
    inspectionLevel: 'normal',
    status: 'pending',
    conclusion: 'passed',
    disposalMethod: 'release',
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
  searchForm.batchNo = ''
  searchForm.productCode = ''
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
      const inspectionNo = `FQC${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
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
    batchNo: '',
    inspectionDate: null,
    productCode: '',
    productName: '',
    specification: '',
    productionQuantity: null,
    sampleQuantity: null,
    inspector: '',
    inspectionStandard: '',
    inspectionLevel: 'normal',
    items: [{ category: '', name: '', standard: '', unit: '', actualValue: null, result: 'pass', remark: '' }],
    conclusion: 'passed',
    disposalMethod: 'release',
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