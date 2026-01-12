<template>
  <div class="page-container">
    <div class="page-header">
      <h1>QRQC快速反应单</h1>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新建反应单
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="反应单号">
          <a-input v-model:value="searchForm.qrqcNo" placeholder="请输入反应单号" />
        </a-form-item>
        <a-form-item label="问题类型">
          <a-select v-model:value="searchForm.problemType" placeholder="请选择问题类型" style="width: 150px" :options="[
            { value: 'quality', label: '质量问题' },
            { value: 'equipment', label: '设备故障' },
            { value: 'process', label: '工艺异常' },
            { value: 'material', label: '材料问题' },
            { value: 'safety', label: '安全问题' }
          ]" />
        </a-form-item>
        <a-form-item label="紧急程度">
          <a-select v-model:value="searchForm.urgencyLevel" placeholder="请选择紧急程度" style="width: 120px" :options="[
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'urgent', label: '紧急' }
          ]" />
        </a-form-item>
        <a-form-item label="处理状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择处理状态" style="width: 120px" :options="[
            { value: 'pending', label: '待处理' },
            { value: 'processing', label: '处理中' },
            { value: 'resolved', label: '已解决' },
            { value: 'closed', label: '已关闭' }
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
        <template v-if="column.key === 'problemType'">
          <a-tag :color="getProblemTypeColor(record.problemType)">
            {{ getProblemTypeText(record.problemType) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'urgencyLevel'">
          <a-tag :color="getUrgencyLevelColor(record.urgencyLevel)">
            {{ getUrgencyLevelText(record.urgencyLevel) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'responseTime'">
          <span :class="{ 'overdue': isOverdue(record) }">
            {{ record.responseTime }}
          </span>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
            <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
            <a-button 
              v-if="record.status === 'pending'" 
              type="link" 
              size="small" 
              @click="startProcessing(record)"
            >
              开始处理
            </a-button>
            <a-button 
              v-if="record.status === 'processing'" 
              type="link" 
              size="small" 
              @click="resolveRecord(record)"
            >
              解决
            </a-button>
            <a-button 
              v-if="record.status === 'resolved'" 
              type="link" 
              size="small" 
              @click="closeRecord(record)"
            >
              关闭
            </a-button>
            <a-popconfirm
              title="确定要删除这个反应单吗？"
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
      :title="isEdit ? '编辑反应单' : '新建反应单'"
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
            <a-form-item label="反应单号" name="qrqcNo">
              <a-input v-model:value="formData.qrqcNo" placeholder="系统自动生成" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="发生时间" name="occurrenceTime">
              <a-date-picker 
                v-model:value="formData.occurrenceTime" 
                show-time 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="报告人" name="reporter">
              <a-input v-model:value="formData.reporter" placeholder="请输入报告人姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="问题类型" name="problemType">
              <a-select v-model:value="formData.problemType" placeholder="请选择问题类型" :options="[
                { value: 'quality', label: '质量问题' },
                { value: 'equipment', label: '设备故障' },
                { value: 'process', label: '工艺异常' },
                { value: 'material', label: '材料问题' },
                { value: 'safety', label: '安全问题' }
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
            <a-form-item label="影响程度" name="impactLevel">
              <a-select v-model:value="formData.impactLevel" placeholder="请选择影响程度" :options="[
                { value: 'minor', label: '轻微' },
                { value: 'moderate', label: '一般' },
                { value: 'serious', label: '严重' },
                { value: 'critical', label: '关键' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="问题标题" name="title">
              <a-input v-model:value="formData.title" placeholder="请输入问题标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="发生地点" name="location">
              <a-input v-model:value="formData.location" placeholder="请输入发生地点" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="问题描述" name="problemDescription">
          <a-textarea v-model:value="formData.problemDescription" :rows="4" placeholder="请详细描述问题情况" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="相关产品" name="relatedProducts">
              <a-input v-model:value="formData.relatedProducts" placeholder="请输入相关产品信息" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="相关设备" name="relatedEquipment">
              <a-input v-model:value="formData.relatedEquipment" placeholder="请输入相关设备信息" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="临时措施" name="temporaryMeasures">
              <a-textarea v-model:value="formData.temporaryMeasures" :rows="3" placeholder="请描述已采取的临时措施" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="根本原因分析" name="rootCauseAnalysis">
              <a-textarea v-model:value="formData.rootCauseAnalysis" :rows="3" placeholder="请分析根本原因" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="纠正措施" name="correctiveActions">
              <a-textarea v-model:value="formData.correctiveActions" :rows="3" placeholder="请制定纠正措施" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="预防措施" name="preventiveActions">
              <a-textarea v-model:value="formData.preventiveActions" :rows="3" placeholder="请制定预防措施" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="责任人" name="responsiblePerson">
              <a-input v-model:value="formData.responsiblePerson" placeholder="请输入责任人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="完成期限" name="deadline">
              <a-date-picker v-model:value="formData.deadline" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="响应时间要求" name="responseTime">
              <a-select v-model:value="formData.responseTime" placeholder="请选择响应时间要求" :options="[
                { value: '30分钟', label: '30分钟' },
                { value: '1小时', label: '1小时' },
                { value: '2小时', label: '2小时' },
                { value: '4小时', label: '4小时' },
                { value: '8小时', label: '8小时' },
                { value: '24小时', label: '24小时' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="验证结果" name="verificationResult">
              <a-select v-model:value="formData.verificationResult" placeholder="请选择验证结果" :options="[
                { value: 'effective', label: '有效' },
                { value: 'partially-effective', label: '部分有效' },
                { value: 'ineffective', label: '无效' },
                { value: 'pending', label: '待验证' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关闭时间" name="closeTime">
              <a-date-picker v-model:value="formData.closeTime" show-time style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="处理人" name="processor">
              <a-input v-model:value="formData.processor" placeholder="请输入处理人姓名" />
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
  qrqcNo: '',
  problemType: '',
  urgencyLevel: '',
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
    title: '反应单号',
    dataIndex: 'qrqcNo',
    key: 'qrqcNo',
    width: 140
  },
  {
    title: '问题标题',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: '问题类型',
    dataIndex: 'problemType',
    key: 'problemType',
    width: 100
  },
  {
    title: '紧急程度',
    dataIndex: 'urgencyLevel',
    key: 'urgencyLevel',
    width: 100
  },
  {
    title: '影响程度',
    dataIndex: 'impactLevel',
    key: 'impactLevel',
    width: 100
  },
  {
    title: '发生时间',
    dataIndex: 'occurrenceTime',
    key: 'occurrenceTime',
    width: 140
  },
  {
    title: '报告人',
    dataIndex: 'reporter',
    key: 'reporter',
    width: 100
  },
  {
    title: '响应时间要求',
    dataIndex: 'responseTime',
    key: 'responseTime',
    width: 120
  },
  {
    title: '责任人',
    dataIndex: 'responsiblePerson',
    key: 'responsiblePerson',
    width: 100
  },
  {
    title: '处理状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    fixed: 'right'
  }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  id: null,
  qrqcNo: '',
  occurrenceTime: null,
  reporter: '',
  problemType: 'quality',
  urgencyLevel: 'medium',
  impactLevel: 'moderate',
  title: '',
  location: '',
  problemDescription: '',
  relatedProducts: '',
  relatedEquipment: '',
  temporaryMeasures: '',
  rootCauseAnalysis: '',
  correctiveActions: '',
  preventiveActions: '',
  responsiblePerson: '',
  deadline: null,
  responseTime: '2小时',
  verificationResult: 'pending',
  closeTime: null,
  processor: '',
  remark: '',
  status: 'pending'
})

// 表单验证规则
const rules = {
  occurrenceTime: [{ required: true, message: '请选择发生时间', trigger: 'change' }],
  reporter: [{ required: true, message: '请输入报告人姓名', trigger: 'blur' }],
  problemType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  urgencyLevel: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
  impactLevel: [{ required: true, message: '请选择影响程度', trigger: 'change' }],
  title: [{ required: true, message: '请输入问题标题', trigger: 'blur' }],
  problemDescription: [{ required: true, message: '请描述问题情况', trigger: 'blur' }],
  responsiblePerson: [{ required: true, message: '请输入责任人姓名', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择完成期限', trigger: 'change' }],
  responseTime: [{ required: true, message: '请选择响应时间要求', trigger: 'change' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    qrqcNo: 'QRQC20240115001',
    occurrenceTime: '2024-01-15 09:30:00',
    reporter: '张三',
    problemType: 'quality',
    urgencyLevel: 'high',
    impactLevel: 'serious',
    title: '产品A尺寸超差',
    location: '生产线1',
    problemDescription: '产品A的关键尺寸超出公差范围，影响装配',
    relatedProducts: '产品A, 产品A-1',
    relatedEquipment: '设备CNC-001',
    temporaryMeasures: '暂停生产，隔离不合格品',
    rootCauseAnalysis: '设备刀具磨损导致加工精度下降',
    correctiveActions: '更换刀具，重新校准设备',
    preventiveActions: '建立刀具磨损监控机制',
    responsiblePerson: '李工程师',
    deadline: '2024-01-16',
    responseTime: '2小时',
    verificationResult: 'effective',
    closeTime: '2024-01-15 15:30:00',
    processor: '李工程师',
    remark: '问题已彻底解决',
    status: 'closed'
  },
  {
    id: 2,
    qrqcNo: 'QRQC20240116001',
    occurrenceTime: '2024-01-16 14:20:00',
    reporter: '王五',
    problemType: 'equipment',
    urgencyLevel: 'urgent',
    impactLevel: 'critical',
    title: '生产线2停机故障',
    location: '生产线2',
    problemDescription: '生产线2主电机故障，整条生产线停机',
    relatedProducts: '产品B, 产品C',
    relatedEquipment: '主电机M-002',
    temporaryMeasures: '切换到备用生产线',
    rootCauseAnalysis: '电机轴承损坏',
    correctiveActions: '更换电机轴承',
    preventiveActions: '增加设备点检频率',
    responsiblePerson: '赵工程师',
    deadline: '2024-01-17',
    responseTime: '30分钟',
    verificationResult: 'pending',
    closeTime: null,
    processor: '赵工程师',
    remark: '正在处理中',
    status: 'processing'
  },
  {
    id: 3,
    qrqcNo: 'QRQC20240117001',
    occurrenceTime: '2024-01-17 11:45:00',
    reporter: '钱六',
    problemType: 'material',
    urgencyLevel: 'medium',
    impactLevel: 'moderate',
    title: '原材料质量问题',
    location: '仓库A',
    problemDescription: '供应商提供的原材料存在色差问题',
    relatedProducts: '产品D',
    relatedEquipment: '',
    temporaryMeasures: '暂停使用该批次原材料',
    rootCauseAnalysis: '',
    correctiveActions: '',
    preventiveActions: '',
    responsiblePerson: '孙经理',
    deadline: '2024-01-18',
    responseTime: '4小时',
    verificationResult: 'pending',
    closeTime: null,
    processor: '',
    remark: '等待供应商反馈',
    status: 'pending'
  }
]

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    processing: 'blue',
    resolved: 'green',
    closed: 'gray'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return texts[status] || status
}

// 获取问题类型颜色
const getProblemTypeColor = (type) => {
  const colors = {
    quality: 'red',
    equipment: 'purple',
    process: 'blue',
    material: 'orange',
    safety: 'green'
  }
  return colors[type] || 'default'
}

// 获取问题类型文本
const getProblemTypeText = (type) => {
  const texts = {
    quality: '质量问题',
    equipment: '设备故障',
    process: '工艺异常',
    material: '材料问题',
    safety: '安全问题'
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

// 检查是否超时
const isOverdue = (record) => {
  if (record.status === 'closed') return false
  const now = dayjs()
  const occurrence = dayjs(record.occurrenceTime)
  const responseTimeMap = {
    '30分钟': 30,
    '1小时': 60,
    '2小时': 120,
    '4小时': 240,
    '8小时': 480,
    '24小时': 1440
  }
  const minutes = responseTimeMap[record.responseTime] || 120
  return now.diff(occurrence, 'minute') > minutes
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
  searchForm.qrqcNo = ''
  searchForm.problemType = ''
  searchForm.urgencyLevel = ''
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
    occurrenceTime: record.occurrenceTime ? dayjs(record.occurrenceTime) : null,
    deadline: record.deadline ? dayjs(record.deadline) : null,
    closeTime: record.closeTime ? dayjs(record.closeTime) : null
  })
}

// 查看记录
const viewRecord = (record) => {
  message.info('查看功能开发中...')
}

// 开始处理
const startProcessing = (record) => {
  record.status = 'processing'
  record.processor = '当前用户'
  message.success('已开始处理')
}

// 解决问题
const resolveRecord = (record) => {
  record.status = 'resolved'
  message.success('问题已解决')
}

// 关闭记录
const closeRecord = (record) => {
  record.status = 'closed'
  record.closeTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  message.success('反应单已关闭')
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
          occurrenceTime: formData.occurrenceTime ? formData.occurrenceTime.format('YYYY-MM-DD HH:mm:ss') : null,
          deadline: formData.deadline ? formData.deadline.format('YYYY-MM-DD') : null,
          closeTime: formData.closeTime ? formData.closeTime.format('YYYY-MM-DD HH:mm:ss') : null
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const qrqcNo = `QRQC${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
      const newItem = {
        ...formData,
        id: newId,
        qrqcNo,
        occurrenceTime: formData.occurrenceTime ? formData.occurrenceTime.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        deadline: formData.deadline ? formData.deadline.format('YYYY-MM-DD') : null,
        closeTime: formData.closeTime ? formData.closeTime.format('YYYY-MM-DD HH:mm:ss') : null,
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
    qrqcNo: '',
    occurrenceTime: null,
    reporter: '',
    problemType: 'quality',
    urgencyLevel: 'medium',
    impactLevel: 'moderate',
    title: '',
    location: '',
    problemDescription: '',
    relatedProducts: '',
    relatedEquipment: '',
    temporaryMeasures: '',
    rootCauseAnalysis: '',
    correctiveActions: '',
    preventiveActions: '',
    responsiblePerson: '',
    deadline: null,
    responseTime: '2小时',
    verificationResult: 'pending',
    closeTime: null,
    processor: '',
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

.overdue {
  color: #ff4d4f;
  font-weight: 600;
}
</style>