<template>
  <div class="process-disposal-view-container">
    <div class="toolbar">
      <a-button @click="handleBack">
        <template #icon><ArrowLeftOutlined /></template>
        返回
      </a-button>
      <a-button type="primary" @click="handleEdit" v-if="!isReadOnly">
        <template #icon><EditOutlined /></template>
        编辑
      </a-button>
      <a-button @click="handlePrint">
        <template #icon><PrinterOutlined /></template>
        打印
      </a-button>
      <a-button @click="handleExport">
        <template #icon><ExportOutlined /></template>
        导出
      </a-button>
    </div>

    <div class="content-container">
      <!-- 基本信息 -->
      <a-card title="基本信息" size="small" class="info-card">
        <a-row :gutter="16">
          <a-col :span="6">
            <div class="info-item">
              <span class="label">处置单号：</span>
              <span class="value">{{ recordData.disposalNo }}</span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item">
              <span class="label">生产工单：</span>
              <span class="value">{{ recordData.workOrder }}</span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item">
              <span class="label">发现日期：</span>
              <span class="value">{{ formatDateTime(recordData.discoveryDate) }}</span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item">
              <span class="label">状态：</span>
              <a-tag :color="getStatusColor(recordData.status)">
                {{ getStatusText(recordData.status) }}
              </a-tag>
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="6">
            <div class="info-item">
              <span class="label">生产线：</span>
              <span class="value">{{ recordData.productionLine }}</span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item">
              <span class="label">工序：</span>
              <span class="value">{{ recordData.process }}</span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item">
              <span class="label">班次：</span>
              <span class="value">{{ recordData.shift === 'day' ? '白班' : '夜班' }}</span>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="info-item">
              <span class="label">发现人：</span>
              <span class="value">{{ recordData.discoverer }}</span>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!-- 不合格情况描述 -->
      <a-card title="不合格情况描述" size="small" class="info-card">
        <a-row :gutter="16">
          <a-col :span="8">
            <div class="info-item">
              <span class="label">产品编码：</span>
              <span class="value">{{ recordData.productCode }}</span>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="info-item">
              <span class="label">产品名称：</span>
              <span class="value">{{ recordData.productName }}</span>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="info-item">
              <span class="label">不合格数量：</span>
              <span class="value">{{ recordData.defectQuantity }} 件</span>
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <div class="info-item">
              <span class="label">不合格描述：</span>
              <span class="value">{{ recordData.defectDescription }}</span>
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <div class="info-item">
              <span class="label">原因分析：</span>
              <span class="value">{{ recordData.causeAnalysis }}</span>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!-- 处置方式 -->
      <a-card title="处置方式" size="small" class="info-card">
        <a-row :gutter="16">
          <a-col :span="8">
            <div class="info-item">
              <span class="label">处置方式：</span>
              <a-tag :color="getDisposalMethodColor(recordData.disposalMethod)">
                {{ getDisposalMethodText(recordData.disposalMethod) }}
              </a-tag>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="info-item">
              <span class="label">紧急程度：</span>
              <a-tag :color="getUrgencyColor(recordData.urgencyLevel)">
                {{ getUrgencyText(recordData.urgencyLevel) }}
              </a-tag>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="info-item">
              <span class="label">处置人：</span>
              <span class="value">{{ recordData.processor || '未指定' }}</span>
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <div class="info-item">
              <span class="label">处置措施：</span>
              <span class="value">{{ recordData.disposalMeasures }}</span>
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <div class="info-item">
              <span class="label">处置结果：</span>
              <span class="value">{{ recordData.disposalResult || '暂无' }}</span>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!-- Tab页签区域 -->
      <a-tabs v-model:activeKey="activeTab" class="info-tabs">
        <!-- 人员信息 -->
        <a-tab-pane key="personnel" tab="人员信息">
          <a-card size="small" class="tab-card">
            <a-row :gutter="16">
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">发现人：</span>
                  <span class="value">{{ recordData.discoverer }}</span>
                </div>
              </a-col>
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">发现时间：</span>
                  <span class="value">{{ formatDateTime(recordData.discoveryDate) }}</span>
                </div>
              </a-col>
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">处理人：</span>
                  <span class="value">{{ recordData.processor || '未指定' }}</span>
                </div>
              </a-col>
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">处理时间：</span>
                  <span class="value">{{ formatDate(recordData.processingDate) }}</span>
                </div>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">责任部门：</span>
                  <span class="value">{{ recordData.responsibleDept }}</span>
                </div>
              </a-col>
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">责任人：</span>
                  <span class="value">{{ recordData.responsiblePerson }}</span>
                </div>
              </a-col>
              <a-col :span="6">
                <div class="info-item">
                  <span class="label">联系电话：</span>
                  <span class="value">{{ recordData.contactPhone }}</span>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-tab-pane>

        <!-- 流程管理 -->
        <a-tab-pane key="process" tab="流程管理">
          <a-card size="small" class="tab-card">
            <a-row :gutter="16">
              <a-col :span="8">
                <div class="info-item">
                  <span class="label">审核人：</span>
                  <span class="value">{{ recordData.reviewer || '未指定' }}</span>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="info-item">
                  <span class="label">审核时间：</span>
                  <span class="value">{{ formatDate(recordData.auditTime) }}</span>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="info-item">
                  <span class="label">处置日期：</span>
                  <span class="value">{{ formatDate(recordData.disposalDate) }}</span>
                </div>
              </a-col>
            </a-row>
            <a-divider>审核意见</a-divider>
            <a-row :gutter="16">
              <a-col :span="24">
                <div class="info-item">
                  <span class="label">审核意见：</span>
                  <span class="value">{{ recordData.auditOpinion || '暂无审核意见' }}</span>
                </div>
              </a-col>
            </a-row>
            <a-divider>纠正措施</a-divider>
            <a-row :gutter="16">
              <a-col :span="24">
                <div class="info-item">
                  <span class="label">纠正措施：</span>
                  <span class="value">{{ recordData.correctiveAction || '暂无纠正措施' }}</span>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-tab-pane>

        <!-- 流程记录 -->
        <a-tab-pane key="timeline" tab="流程记录">
          <a-card size="small" class="tab-card">
            <a-timeline>
              <a-timeline-item 
                v-for="(record, index) in processRecords" 
                :key="index"
                :color="getTimelineColor(record.status)"
              >
                <template #dot>
                  <component :is="getTimelineIcon(record.status)" />
                </template>
                <div class="timeline-content">
                  <div class="timeline-title">{{ record.title }}</div>
                  <div class="timeline-desc">{{ record.description }}</div>
                  <div class="timeline-time">{{ formatDateTime(record.time) }}</div>
                  <div class="timeline-user">操作人：{{ record.user }}</div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </a-card>
        </a-tab-pane>

        <!-- 备注信息 -->
        <a-tab-pane key="remark" tab="备注信息">
          <a-card size="small" class="tab-card">
            <a-row :gutter="16">
              <a-col :span="24">
                <div class="info-item">
                  <span class="label">备注：</span>
                  <span class="value">{{ recordData.remark || '暂无备注' }}</span>
                </div>
              </a-col>
            </a-row>
            <a-divider>时间记录</a-divider>
            <a-row :gutter="16">
              <a-col :span="8">
                <div class="info-item">
                  <span class="label">创建时间：</span>
                  <span class="value">{{ formatDateTime(recordData.createTime) }}</span>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="info-item">
                  <span class="label">更新时间：</span>
                  <span class="value">{{ formatDateTime(recordData.updateTime) }}</span>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PrinterOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const activeTab = ref('personnel')
const isReadOnly = ref(false)
const recordData = reactive({
  id: '',
  disposalNo: '',
  workOrder: '',
  discoveryDate: null,
  productionLine: '',
  process: '',
  shift: '',
  productCode: '',
  productName: '',
  defectQuantity: null,
  defectDescription: '',
  causeAnalysis: '',
  disposalMethod: '',
  urgencyLevel: '',
  disposalMeasures: '',
  disposalResult: '',
  disposalPerson: '',
  disposalDate: null,
  discoverer: '',
  processor: '',
  processingDate: null,
  reviewer: '',
  responsibleDept: '',
  responsiblePerson: '',
  contactPhone: '',
  status: '',
  createTime: null,
  updateTime: null,
  auditTime: null,
  auditOpinion: '',
  correctiveAction: '',
  remark: ''
})

// 流程记录
const processRecords = ref([])

// 返回按钮
const handleBack = () => {
  router.push('/production-quality/exception-handling/process-disposal')
}

// 编辑按钮
const handleEdit = () => {
  router.push(`/production-quality/exception-handling/process-disposal/edit/${recordData.id}`)
}

// 打印按钮
const handlePrint = () => {
  window.print()
  message.success('打印功能已启动')
}

// 导出按钮
const handleExport = () => {
  message.info('导出功能开发中...')
}

// 状态转换函数
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green',
    closed: 'default'
  }
  return colorMap[status] || 'default'
}

const getDisposalMethodText = (method) => {
  const methodMap = {
    rework: '返工',
    repair: '返修',
    scrap: '报废',
    concession: '让步接收',
    return: '退回供应商'
  }
  return methodMap[method] || method
}

const getDisposalMethodColor = (method) => {
  const colorMap = {
    rework: 'blue',
    repair: 'orange',
    scrap: 'red',
    concession: 'green',
    return: 'purple'
  }
  return colorMap[method] || 'default'
}

const getUrgencyText = (urgency) => {
  const urgencyMap = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return urgencyMap[urgency] || urgency
}

const getUrgencyColor = (urgency) => {
  const colorMap = {
    low: 'green',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }
  return colorMap[urgency] || 'default'
}

// 时间轴相关函数
const getTimelineIcon = (status) => {
  const iconMap = {
    created: ClockCircleOutlined,
    processing: SyncOutlined,
    completed: CheckCircleOutlined,
    rejected: ExclamationCircleOutlined
  }
  return iconMap[status] || ClockCircleOutlined
}

const getTimelineColor = (status) => {
  const colorMap = {
    created: 'gray',
    processing: 'blue',
    completed: 'green',
    rejected: 'red'
  }
  return colorMap[status] || 'gray'
}

// 日期格式化
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''
}

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : ''
}

// 获取详情数据
const fetchDetail = async () => {
  const id = route.params.id
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟详情数据
    Object.assign(recordData, {
      id: id,
      disposalNo: 'PROC202401001',
      workOrder: 'WO202401001',
      discoveryDate: '2024-01-15 09:30:00',
      productionLine: '生产线A',
      process: '焊接工序',
      shift: '白班',
      productCode: 'P001',
      productName: '传动轴组件',
      defectQuantity: 5,
      defectDescription: '焊接出现气孔缺陷，主要分布在焊缝区域，影响产品质量',
      causeAnalysis: '焊接参数设置不当，电流过大导致焊缝气孔增多',
      disposalMethod: 'rework',
      urgencyLevel: 'high',
      disposalMeasures: '重新调整焊接参数，对不合格品进行返工处理',
      disposalResult: '已完成返工，质量检验合格',
      disposalPerson: '李四',
      disposalDate: '2024-01-15 16:30:00',
      discoverer: '张三',
      processor: '李四',
      processingDate: '2024-01-15 16:30:00',
      reviewer: '王五',
      responsibleDept: '生产部',
      responsiblePerson: '张三',
      contactPhone: '13800138000',
      status: 'completed',
      createTime: '2024-01-15 09:30:00',
      updateTime: '2024-01-15 16:30:00',
      auditTime: '2024-01-15 17:00:00',
      auditOpinion: '返工处理符合要求，同意关闭',
      correctiveAction: '设备维护计划已制定，操作员培训已安排',
      remark: '需要加强过程质量控制'
    })

    // 根据状态设置是否只读
    isReadOnly.value = recordData.status === 'completed'

    // 流程记录
    processRecords.value = [
      {
        title: '创建处置单',
        description: '发现焊接气孔缺陷，创建过程不合格品处置单',
        time: '2024-01-15 09:30:00',
        user: '张三',
        status: 'created'
      },
      {
        title: '开始处理',
        description: '开始对不合格品进行返工处理',
        time: '2024-01-15 14:00:00',
        user: '李四',
        status: 'processing'
      },
      {
        title: '处理完成',
        description: '返工处理完成，质量检验合格',
        time: '2024-01-15 16:30:00',
        user: '李四',
        status: 'completed'
      },
      {
        title: '审核通过',
        description: '审核通过，处置单关闭',
        time: '2024-01-15 17:00:00',
        user: '王五',
        status: 'completed'
      }
    ]
  } catch (error) {
    message.error('获取详情失败')
  }
}

// 生命周期
onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.process-disposal-view-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  line-height: 1.5;
}

.info-item .label {
  color: #000000d9;
  font-weight: 500;
  min-width: 100px;
  flex-shrink: 0;
}

.info-item .value {
  color: #00000073;
  flex: 1;
  word-break: break-all;
}

.info-tabs {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.tab-card {
  border: none;
  box-shadow: none;
}

.timeline-content {
  padding-left: 8px;
}

.timeline-title {
  font-weight: 500;
  color: #000000d9;
  margin-bottom: 4px;
}

.timeline-desc {
  color: #00000073;
  margin-bottom: 4px;
}

.timeline-time {
  color: #00000040;
  font-size: 12px;
  margin-bottom: 2px;
}

.timeline-user {
  color: #00000073;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .process-disposal-view-container {
    padding: 8px;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item .label {
    margin-bottom: 4px;
  }
}

/* 打印样式 */
@media print {
  .process-disposal-view-container {
    padding: 0;
    background: #fff;
  }
  
  .toolbar {
    display: none;
  }
  
  .info-card,
  .info-tabs {
    box-shadow: none;
    border: 1px solid #d9d9d9;
  }
}
</style>