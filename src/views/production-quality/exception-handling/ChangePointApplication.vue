<template>
  <div class="page-container">
    <div class="page-header">
      <h1>变化点申请单</h1>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建申请单
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="申请单号">
          <a-input v-model:value="searchForm.applicationNo" placeholder="请输入申请单号" />
        </a-form-item>
        <a-form-item label="变更类型">
          <a-select v-model:value="searchForm.changeType" placeholder="请选择变更类型" style="width: 150px" :options="[
            { value: 'design', label: '设计变更' },
            { value: 'process', label: '工艺变更' },
            { value: 'material', label: '材料变更' },
            { value: 'equipment', label: '设备变更' },
            { value: 'supplier', label: '供应商变更' }
          ]" />
        </a-form-item>
        <a-form-item label="申请状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择申请状态" style="width: 120px" :options="[
            { value: 'pending', label: '待审批' },
            { value: 'approved', label: '已批准' },
            { value: 'rejected', label: '已拒绝' },
            { value: 'implemented', label: '已实施' }
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
        <template v-if="column.key === 'changeType'">
          <a-tag :color="getChangeTypeColor(record.changeType)">
            {{ getChangeTypeText(record.changeType) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'urgencyLevel'">
          <a-tag :color="getUrgencyLevelColor(record.urgencyLevel)">
            {{ getUrgencyLevelText(record.urgencyLevel) }}
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
              @click="approveRecord(record)"
            >
              批准
            </a-button>
            <a-button 
              v-if="record.status === 'pending'" 
              type="link" 
              size="small" 
              danger
              @click="rejectRecord(record)"
            >
              拒绝
            </a-button>
            <a-popconfirm
              title="确定要删除这个申请单吗？"
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
      :title="isEdit ? '编辑申请单' : '新建申请单'"
      width="1200px"
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
            <a-form-item label="申请单号" name="applicationNo">
              <a-input v-model:value="formData.applicationNo" placeholder="系统自动生成" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="申请日期" name="applicationDate">
              <a-date-picker v-model:value="formData.applicationDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="申请人" name="applicant">
              <a-input v-model:value="formData.applicant" placeholder="请输入申请人姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="变更类型" name="changeType">
              <a-select v-model:value="formData.changeType" placeholder="请选择变更类型" :options="[
                { value: 'design', label: '设计变更' },
                { value: 'process', label: '工艺变更' },
                { value: 'material', label: '材料变更' },
                { value: 'equipment', label: '设备变更' },
                { value: 'supplier', label: '供应商变更' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="紧急程度" name="urgencyLevel">
              <a-select v-model:value="formData.urgencyLevel" placeholder="请选择紧急程度" :options="[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="影响范围" name="impactScope">
              <a-select v-model:value="formData.impactScope" placeholder="请选择影响范围" :options="[
                { value: 'product', label: '产品' },
                { value: 'process', label: '工艺' },
                { value: 'quality', label: '质量' },
                { value: 'all', label: '全部' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="变更标题" name="title">
              <a-input v-model:value="formData.title" placeholder="请输入变更标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="相关产品" name="relatedProducts">
              <a-input v-model:value="formData.relatedProducts" placeholder="请输入相关产品信息" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="变更原因" name="changeReason">
          <a-textarea v-model:value="formData.changeReason" :rows="3" placeholder="请详细描述变更原因" />
        </a-form-item>
        <a-form-item label="变更内容" name="changeContent">
          <a-textarea v-model:value="formData.changeContent" :rows="4" placeholder="请详细描述变更内容" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="变更前状态" name="beforeChange">
              <a-textarea v-model:value="formData.beforeChange" :rows="3" placeholder="请描述变更前状态" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="变更后状态" name="afterChange">
              <a-textarea v-model:value="formData.afterChange" :rows="3" placeholder="请描述变更后状态" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="风险评估" name="riskAssessment">
              <a-textarea v-model:value="formData.riskAssessment" :rows="3" placeholder="请评估变更风险" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="应对措施" name="countermeasures">
              <a-textarea v-model:value="formData.countermeasures" :rows="3" placeholder="请制定应对措施" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="计划实施日期" name="plannedDate">
              <a-date-picker v-model:value="formData.plannedDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="审批人" name="approver">
              <a-input v-model:value="formData.approver" placeholder="请输入审批人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="审批日期" name="approvalDate">
              <a-date-picker v-model:value="formData.approvalDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="实施结果" name="implementationResult">
              <a-textarea v-model:value="formData.implementationResult" :rows="3" placeholder="请描述实施结果" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="验证结果" name="verificationResult">
              <a-textarea v-model:value="formData.verificationResult" :rows="3" placeholder="请描述验证结果" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" :rows="2" placeholder="请输入备注信息" />
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
  applicationNo: '',
  changeType: '',
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
    title: '申请单号',
    dataIndex: 'applicationNo',
    key: 'applicationNo',
    width: 140
  },
  {
    title: '变更标题',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: '变更类型',
    dataIndex: 'changeType',
    key: 'changeType',
    width: 100
  },
  {
    title: '紧急程度',
    dataIndex: 'urgencyLevel',
    key: 'urgencyLevel',
    width: 100
  },
  {
    title: '申请人',
    dataIndex: 'applicant',
    key: 'applicant',
    width: 100
  },
  {
    title: '申请日期',
    dataIndex: 'applicationDate',
    key: 'applicationDate',
    width: 120
  },
  {
    title: '计划实施日期',
    dataIndex: 'plannedDate',
    key: 'plannedDate',
    width: 120
  },
  {
    title: '申请状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '审批人',
    dataIndex: 'approver',
    key: 'approver',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
    fixed: 'right'
  }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  id: null,
  applicationNo: '',
  applicationDate: null,
  applicant: '',
  changeType: 'design',
  urgencyLevel: 'medium',
  impactScope: 'product',
  title: '',
  relatedProducts: '',
  changeReason: '',
  changeContent: '',
  beforeChange: '',
  afterChange: '',
  riskAssessment: '',
  countermeasures: '',
  plannedDate: null,
  approver: '',
  approvalDate: null,
  implementationResult: '',
  verificationResult: '',
  remark: '',
  status: 'pending'
})

// 表单验证规则
const rules = {
  applicationDate: [{ required: true, message: '请选择申请日期', trigger: 'change' }],
  applicant: [{ required: true, message: '请输入申请人姓名', trigger: 'blur' }],
  changeType: [{ required: true, message: '请选择变更类型', trigger: 'change' }],
  urgencyLevel: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
  impactScope: [{ required: true, message: '请选择影响范围', trigger: 'change' }],
  title: [{ required: true, message: '请输入变更标题', trigger: 'blur' }],
  changeReason: [{ required: true, message: '请描述变更原因', trigger: 'blur' }],
  changeContent: [{ required: true, message: '请描述变更内容', trigger: 'blur' }],
  plannedDate: [{ required: true, message: '请选择计划实施日期', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    applicationNo: 'CCN20240115001',
    applicationDate: '2024-01-15',
    applicant: '张三',
    changeType: 'design',
    urgencyLevel: 'high',
    impactScope: 'product',
    title: '产品A外观设计变更',
    relatedProducts: '产品A, 产品A-1',
    changeReason: '客户反馈外观不够美观',
    changeContent: '调整产品外壳设计，增加圆角处理',
    beforeChange: '方形外壳，边角锐利',
    afterChange: '圆角设计，外观更美观',
    riskAssessment: '可能影响模具成本',
    countermeasures: '与模具厂商协商成本控制',
    plannedDate: '2024-02-01',
    approver: '李经理',
    approvalDate: '2024-01-16',
    implementationResult: '已实施，效果良好',
    verificationResult: '客户满意度提升',
    remark: '',
    status: 'implemented'
  },
  {
    id: 2,
    applicationNo: 'CCN20240116001',
    applicationDate: '2024-01-16',
    applicant: '王五',
    changeType: 'process',
    urgencyLevel: 'medium',
    impactScope: 'process',
    title: '焊接工艺参数优化',
    relatedProducts: '产品B, 产品C',
    changeReason: '提高焊接质量和效率',
    changeContent: '调整焊接电流和时间参数',
    beforeChange: '电流100A，时间5s',
    afterChange: '电流120A，时间4s',
    riskAssessment: '需要重新验证工艺',
    countermeasures: '进行小批量试生产验证',
    plannedDate: '2024-01-25',
    approver: '',
    approvalDate: null,
    implementationResult: '',
    verificationResult: '',
    remark: '等待审批',
    status: 'pending'
  },
  {
    id: 3,
    applicationNo: 'CCN20240117001',
    applicationDate: '2024-01-17',
    applicant: '赵六',
    changeType: 'material',
    urgencyLevel: 'low',
    impactScope: 'quality',
    title: '原材料供应商变更',
    relatedProducts: '产品D',
    changeReason: '原供应商涨价，寻找替代供应商',
    changeContent: '更换供应商B为供应商C',
    beforeChange: '供应商B，价格10元/kg',
    afterChange: '供应商C，价格9元/kg',
    riskAssessment: '质量可能存在风险',
    countermeasures: '进行材料性能测试',
    plannedDate: '2024-02-10',
    approver: '钱经理',
    approvalDate: '2024-01-18',
    implementationResult: '',
    verificationResult: '',
    remark: '质量测试未通过',
    status: 'rejected'
  }
]

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    implemented: 'blue'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    implemented: '已实施'
  }
  return texts[status] || status
}

// 获取变更类型颜色
const getChangeTypeColor = (type) => {
  const colors = {
    design: 'blue',
    process: 'green',
    material: 'orange',
    equipment: 'purple',
    supplier: 'cyan'
  }
  return colors[type] || 'default'
}

// 获取变更类型文本
const getChangeTypeText = (type) => {
  const texts = {
    design: '设计变更',
    process: '工艺变更',
    material: '材料变更',
    equipment: '设备变更',
    supplier: '供应商变更'
  }
  return texts[type] || type
}

// 获取紧急程度颜色
const getUrgencyLevelColor = (level) => {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    urgent: 'purple'
  }
  return colors[level] || 'default'
}

// 获取紧急程度文本
const getUrgencyLevelText = (level) => {
  const texts = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return texts[level] || level
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
  searchForm.applicationNo = ''
  searchForm.changeType = ''
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
    applicationDate: record.applicationDate ? dayjs(record.applicationDate) : null,
    plannedDate: record.plannedDate ? dayjs(record.plannedDate) : null,
    approvalDate: record.approvalDate ? dayjs(record.approvalDate) : null
  })
}

// 查看记录
const viewRecord = (record) => {
  message.info('查看功能开发中...')
}

// 批准申请
const approveRecord = (record) => {
  record.status = 'approved'
  record.approvalDate = dayjs().format('YYYY-MM-DD')
  message.success('已批准申请')
}

// 拒绝申请
const rejectRecord = (record) => {
  record.status = 'rejected'
  record.approvalDate = dayjs().format('YYYY-MM-DD')
  message.success('已拒绝申请')
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

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = dataSource.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        dataSource.value[index] = {
          ...formData,
          applicationDate: formData.applicationDate ? formData.applicationDate.format('YYYY-MM-DD') : null,
          plannedDate: formData.plannedDate ? formData.plannedDate.format('YYYY-MM-DD') : null,
          approvalDate: formData.approvalDate ? formData.approvalDate.format('YYYY-MM-DD') : null
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const applicationNo = `CCN${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
      const newItem = {
        ...formData,
        id: newId,
        applicationNo,
        applicationDate: formData.applicationDate ? formData.applicationDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        plannedDate: formData.plannedDate ? formData.plannedDate.format('YYYY-MM-DD') : null,
        approvalDate: formData.approvalDate ? formData.approvalDate.format('YYYY-MM-DD') : null,
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
    applicationNo: '',
    applicationDate: null,
    applicant: '',
    changeType: 'design',
    urgencyLevel: 'medium',
    impactScope: 'product',
    title: '',
    relatedProducts: '',
    changeReason: '',
    changeContent: '',
    beforeChange: '',
    afterChange: '',
    riskAssessment: '',
    countermeasures: '',
    plannedDate: null,
    approver: '',
    approvalDate: null,
    implementationResult: '',
    verificationResult: '',
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
</style>