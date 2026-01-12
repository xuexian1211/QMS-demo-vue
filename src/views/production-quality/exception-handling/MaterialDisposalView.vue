<template>
  <div class="material-disposal-view">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack" class="back-button">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </a-button>
        <div class="title-section">
          <h2 class="page-title">来料不合格处置单详情</h2>
          <div class="status-badge" :class="getStatusClass(formData.status)">
            {{ getStatusText(formData.status) }}
          </div>
        </div>
      </div>
      <div class="header-actions">
        <a-button class="action-button">
          <template #icon><ShareAltOutlined /></template>
          流程
        </a-button>
        <a-button class="action-button">
          <template #icon><MessageOutlined /></template>
          评论
        </a-button>
        <a-button type="primary" class="edit-button" @click="handleEdit">
          <template #icon><EditOutlined /></template>
          编辑
        </a-button>
      </div>
    </div>

    <div class="form-container">
      <a-form
        :model="formData.value"
        layout="vertical"
        class="disposal-form"
      >
        <!-- 主信息区域 -->
        <div class="main-info-section">
          <h3 class="section-title">基本信息</h3>
          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item label="处置单号">
                <a-input v-model:value="formData.disposalNo" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发现时间">
                <a-input :value="formatDateTime(formData.discoveryDate)" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发现部门">
                <a-input v-model:value="formData.discoveryDepartment" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="处理状态">
                <a-input :value="getStatusText(formData.status)" disabled />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16" v-if="formData.otherDepartment">
            <a-col :span="6">
              <a-form-item label="其他部门">
                <a-input v-model:value="formData.otherDepartment" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发现人">
                <a-input v-model:value="formData.discoverer" disabled />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16" v-if="!formData.otherDepartment">
            <a-col :span="6">
              <a-form-item label="发现人">
                <a-input v-model:value="formData.discoverer" disabled />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- Tab页签区域 -->
        <a-tabs v-model:activeKey="activeTab" class="form-tabs">
          <!-- 供应商信息 -->
          <a-tab-pane key="supplier" tab="供应商信息">
            <div class="tab-content">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="物料名称">
                    <a-input v-model:value="formData.materialName" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="物料型号">
                    <a-input v-model:value="formData.materialModel" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="批次号">
                    <a-input v-model:value="formData.batchNo" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="采购订单号">
                    <a-input v-model:value="formData.purchaseOrderNo" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="供应商名称">
                    <a-input v-model:value="formData.supplierName" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="供应商编码">
                    <a-input v-model:value="formData.supplierCode" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="联系人">
                    <a-input v-model:value="formData.contactPerson" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="联系电话">
                    <a-input v-model:value="formData.contactPhone" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-tab-pane>

          <!-- 不合格详情 -->
          <a-tab-pane key="defect" tab="不合格详情">
            <div class="tab-content">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="不合格现象">
                    <a-textarea
                      v-model:value="formData.defectPhenomenon"
                      :rows="3"
                      disabled
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="不合格类别">
                    <a-input v-model:value="formData.defectCategory" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="不合格数量">
                    <a-input-number
                      v-model:value="formData.defectQuantity"
                      disabled
                      style="width: 100%"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="总数量">
                    <a-input-number
                      v-model:value="formData.totalQuantity"
                      disabled
                      style="width: 100%"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="隔离区域">
                    <a-input v-model:value="formData.isolationArea" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="隔离标识">
                    <a-input v-model:value="formData.isolationMark" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="隔离人">
                    <a-input v-model:value="formData.isolationPerson" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-tab-pane>

          <!-- 处理记录 -->
          <a-tab-pane key="process" tab="处理记录">
            <div class="tab-content">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="评审部门">
                    <a-input :value="formData.reviewDepartments?.join('、')" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="评审日期">
                    <a-input :value="formatDate(formData.reviewDate)" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="处置方式">
                    <a-input :value="getDisposalMethodText(formData.disposalMethod)" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16" v-if="formData.disposalMethod === 'concession_discount'">
                <a-col :span="8">
                  <a-form-item label="降价比例(%)">
                    <a-input-number
                      v-model:value="formData.discountPercentage"
                      disabled
                      style="width: 100%"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="整改期限">
                    <a-input :value="formatDate(formData.rectificationDeadline)" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="16">
                  <a-form-item label="需提交文件">
                    <a-input :value="formData.requiredDocuments?.join('、')" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="执行部门">
                    <a-input v-model:value="formData.executionDepartment" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="执行人">
                    <a-input v-model:value="formData.executor" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="执行完成日期">
                    <a-input :value="formatDate(formData.executionDate)" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="24">
                  <a-form-item label="执行结果">
                    <a-textarea
                      v-model:value="formData.executionResult"
                      :rows="3"
                      disabled
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="验证部门">
                    <a-input v-model:value="formData.verificationDepartment" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="验证人">
                    <a-input v-model:value="formData.verifier" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="验证结论">
                    <a-input v-model:value="formData.verificationConclusion" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-tab-pane>

          <!-- 审核信息 -->
          <a-tab-pane key="approval" tab="审核信息">
            <div class="tab-content">
              <a-row :gutter="16">
                <a-col :span="6">
                  <a-form-item label="填写人签字">
                    <a-input v-model:value="formData.fillerSignature" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="部门主管签字">
                    <a-input v-model:value="formData.departmentHeadSignature" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="品质部审核">
                    <a-input v-model:value="formData.qualityDepartmentReview" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="审批人签字">
                    <a-input v-model:value="formData.approverSignature" disabled />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="24">
                  <a-form-item label="备注信息">
                    <a-textarea
                      v-model:value="formData.remark"
                      :rows="3"
                      disabled
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftOutlined, ShareAltOutlined, MessageOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

interface MaterialDisposalRecord {
  id?: number
  disposalNo: string
  discoveryDate: string | null
  discoveryDepartment: string
  otherDepartment?: string
  discoverer: string
  materialName: string
  materialModel: string
  batchNo: string
  purchaseOrderNo: string
  supplierName: string
  supplierCode: string
  contactPerson: string
  contactPhone: string
  defectPhenomenon: string
  defectCategory: string
  defectQuantity: number
  totalQuantity: number
  isolationArea: string
  isolationMark: string
  isolationPerson: string
  reviewDepartments: string[]
  reviewDate: string | null
  disposalMethod: string
  discountPercentage: number | null
  rectificationDeadline: string | null
  requiredDocuments: string[]
  executionDepartment: string
  executor: string
  executionDate: string | null
  executionResult: string
  verificationDepartment: string
  verifier: string
  verificationConclusion: string
  fillerSignature: string
  departmentHeadSignature: string
  qualityDepartmentReview: string
  approverSignature: string
  remark: string
  status: string
}

const router = useRouter()
const route = useRoute()

// 表单数据
const formData = ref<MaterialDisposalRecord>({
  disposalNo: '',
  discoveryDate: null,
  discoveryDepartment: '',
  otherDepartment: '',
  discoverer: '',
  materialName: '',
  materialModel: '',
  batchNo: '',
  purchaseOrderNo: '',
  supplierName: '',
  supplierCode: '',
  contactPerson: '',
  contactPhone: '',
  defectPhenomenon: '',
  defectCategory: '',
  defectQuantity: 0,
  totalQuantity: 0,
  isolationArea: '',
  isolationMark: '',
  isolationPerson: '',
  reviewDepartments: [],
  reviewDate: null,
  disposalMethod: '',
  discountPercentage: 0,
  rectificationDeadline: null,
  requiredDocuments: [],
  executionDepartment: '',
  executor: '',
  executionDate: null,
  executionResult: '',
  verificationDepartment: '',
  verifier: '',
  verificationConclusion: '',
  fillerSignature: '',
  departmentHeadSignature: '',
  qualityDepartmentReview: '',
  approverSignature: '',
  remark: '',
  status: 'draft'
})

const activeTab = ref('supplier')

// 格式化日期
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

// 格式化日期时间
const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''
}

// 获取处置方式文本
const getDisposalMethodText = (method) => {
  const methodMap = {
    'return': '退货（退回供应商返工/分选）',
    'concession': '让步接收（不降价）',
    'concession_discount': '让步接收（降价）',
    'sorting': '挑选使用（我司分选）'
  }
  return methodMap[method] || method
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'pending_review': '待审核',
    'reviewing': '审核中',
    'approved': '已审核',
    'rejected': '已驳回',
    'processing': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    'draft': 'status-draft',
    'pending_review': 'status-pending-review',
    'reviewing': 'status-reviewing',
    'approved': 'status-approved',
    'rejected': 'status-rejected',
    'processing': 'status-processing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  }
  return classMap[status] || ''
}

// 返回列表
const handleBack = () => {
  router.push('/production-quality/exception-handling/material-disposal')
}

// 编辑
const handleEdit = () => {
  router.push(`/production-quality/exception-handling/material-disposal/edit?id=${formData.id}`)
}

// 初始化数据
const initializeData = () => {
  // 从路由参数获取要查看的记录ID
  const recordId = route.query.id
  console.log('查看页面接收到的recordId:', recordId)
  
  if (recordId) {
    // 模拟数据库中的数据
    const mockDataList = [
      {
        id: 1,
        disposalNo: 'LHBHG20240115001',
        discoveryDate: '2024-01-15 09:30',
        discoveryDepartment: '品质部（IQC）',
        discoverer: '张三',
        materialName: '电子元件A',
        materialModel: 'EC-A001',
        batchNo: 'BATCH001',
        purchaseOrderNo: 'PO20240110001',
        supplierName: '供应商A',
        supplierCode: 'SUP001',
        contactPerson: '李经理',
        contactPhone: '13800138001',
        defectPhenomenon: '尺寸超差，超出公差范围0.2mm',
        defectCategory: 'A类',
        defectQuantity: 50,
        totalQuantity: 1000,
        isolationArea: '不合格品区A-01',
        isolationMark: '黄色标牌',
        isolationPerson: '王五',
        iqcInspectionNo: 'IQC20240115001',
        supplierCertificateNo: 'CERT001',
        otherCertificates: '',
        reviewDepartments: ['品质部', '采购部'],
        reviewDate: '2024-01-15',
        disposalMethod: 'return',
        discountPercentage: null,
        rectificationDeadline: '2024-01-25',
        requiredDocuments: ['8D报告', '整改计划表'],
        executionDepartment: '采购部',
        executor: '赵六',
        executionDate: '2024-01-16',
        executionResult: '已退货给供应商，要求重新提供合格产品',
        verificationDepartment: '品质部（SQE）',
        verifier: '孙七',
        verificationConclusion: '合格',
        fillerSignature: '张三',
        departmentHeadSignature: '周主管',
        qualityDepartmentReview: '李审核',
        approverSignature: '王审批',
        remark: '已通知供应商加强质量控制',
        status: 'completed'
      },
      {
        id: 2,
        disposalNo: 'LHBHG20240116001',
        discoveryDate: '2024-01-16 14:20',
        discoveryDepartment: '品质部（IQC）',
        discoverer: '钱八',
        materialName: '机械零件B',
        materialModel: 'MP-B002',
        batchNo: 'BATCH002',
        purchaseOrderNo: 'PO20240112002',
        supplierName: '供应商B',
        supplierCode: 'SUP002',
        contactPerson: '陈经理',
        contactPhone: '13900139002',
        defectPhenomenon: '表面有划痕，影响外观质量',
        defectCategory: 'B类',
        defectQuantity: 30,
        totalQuantity: 500,
        isolationArea: '不合格品区A-02',
        isolationMark: '黄色盛具',
        isolationPerson: '吴九',
        iqcInspectionNo: 'IQC20240116001',
        supplierCertificateNo: 'CERT002',
        otherCertificates: '',
        reviewDepartments: ['品质部', '制造技术部'],
        reviewDate: '2024-01-16',
        disposalMethod: 'concession_discount',
        discountPercentage: 5,
        rectificationDeadline: '2024-01-26',
        requiredDocuments: ['整改计划表'],
        executionDepartment: '制造技术部',
        executor: '郑十',
        executionDate: '2024-01-17',
        executionResult: '已让步接收，降价5%',
        verificationDepartment: 'IQC',
        verifier: '冯十一',
        verificationConclusion: '合格',
        fillerSignature: '钱八',
        departmentHeadSignature: '沈主管',
        qualityDepartmentReview: '韩审核',
        approverSignature: '杨审批',
        remark: '供应商承诺改进包装方式',
        status: 'completed'
      },
      {
        id: 3,
        disposalNo: 'LHBHG20240117001',
        discoveryDate: '2024-01-17 11:45',
        discoveryDepartment: '其他',
        otherDepartment: '生产部',
        discoverer: '朱十二',
        materialName: '原材料C',
        materialModel: 'RM-C003',
        batchNo: 'BATCH003',
        purchaseOrderNo: 'PO20240113003',
        supplierName: '供应商C',
        supplierCode: 'SUP003',
        contactPerson: '秦经理',
        contactPhone: '13700137003',
        defectPhenomenon: '颜色偏差，与标准色板不符',
        defectCategory: 'C类',
        defectQuantity: 20,
        totalQuantity: 200,
        isolationArea: '不合格品区A-03',
        isolationMark: '黄色标牌',
        isolationPerson: '尤十三',
        iqcInspectionNo: 'IQC20240117001',
        supplierCertificateNo: 'CERT003',
        otherCertificates: '',
        reviewDepartments: ['品质部', '采购部', '研发技术部'],
        reviewDate: '2024-01-17',
        disposalMethod: 'sorting',
        discountPercentage: null,
        rectificationDeadline: '2024-01-27',
        requiredDocuments: ['8D报告', '复检报告'],
        executionDepartment: '生产部',
        executor: '',
        executionDate: null,
        executionResult: '',
        verificationDepartment: '',
        verifier: '',
        verificationConclusion: '',
        fillerSignature: '朱十二',
        departmentHeadSignature: '',
        qualityDepartmentReview: '',
        approverSignature: '',
        remark: '等待分选处理',
        status: 'pending'
      }
    ]
    
    // 根据ID查找对应的记录
    const targetRecord = mockDataList.find(item => item.id === parseInt(recordId))
    console.log('查找的targetRecord:', targetRecord)
    
    if (targetRecord) {
      formData.value = targetRecord
      console.log('赋值后的formData:', formData.value)
    } else {
      message.error('未找到对应的记录')
      router.push('/production-quality/exception-handling/material-disposal')
    }
  } else {
    message.error('缺少记录ID参数')
    router.push('/production-quality/exception-handling/material-disposal')
  }
}

onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.material-disposal-view {
  padding: 16px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  background: #fff;
  padding: 16px 24px;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.edit-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #1890ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background: #40a9ff;
}

.form-container {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.disposal-form {
  width: 100%;
}

/* 主信息区域样式 */
.main-info-section {
  background-color: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #1890ff;
}

/* Tab页签样式 */
.form-tabs {
  margin-bottom: 24px;
}

.form-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.form-tabs :deep(.ant-tabs-tab) {
  font-weight: 500;
  padding: 12px 24px;
}

.form-tabs :deep(.ant-tabs-tab-active) {
  color: #1890ff;
  font-weight: 600;
}

.form-tabs :deep(.ant-tabs-ink-bar) {
  background-color: #1890ff;
  height: 3px;
}

.tab-content {
  padding: 16px 0;
}

/* 表单项样式 */
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
  color: #262626;
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-select-selector),
:deep(.ant-picker) {
  border-radius: 4px;
}

:deep(.ant-input:disabled),
:deep(.ant-input-number-disabled),
:deep(.ant-select-disabled .ant-select-selector),
:deep(.ant-picker-disabled) {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #595959;
  cursor: not-allowed;
}

:deep(.ant-textarea:disabled) {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #595959;
  cursor: not-allowed;
  resize: none;
}

/* 状态徽章样式 */
.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-draft {
  background-color: #f0f0f0;
  color: #666;
}

.status-pending-review {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-reviewing {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-approved {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-rejected {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.status-processing {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-cancelled {
  background-color: #f0f0f0;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-info-section {
    padding: 16px;
  }
  
  .tab-content {
    padding: 12px 0;
  }
}

@media (max-width: 768px) {
  .material-disposal-view {
    padding: 16px;
  }
  
  .page-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .form-container {
    padding: 16px;
  }
  
  .main-info-section {
    padding: 12px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .form-tabs :deep(.ant-tabs-tab) {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>