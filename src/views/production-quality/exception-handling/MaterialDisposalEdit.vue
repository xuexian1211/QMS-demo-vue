<template>
  <div class="material-disposal-edit">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack" class="back-button">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </a-button>
        <div class="title-section">
          <h2 class="page-title">来料不合格处置单-编辑</h2>
          <div class="status-badge" :class="getStatusClass(formData.status)">
            {{ getStatusText(formData.status) }}
          </div>
        </div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
      </div>
    </div>

    <div class="form-container">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        class="disposal-form"
      >
        <!-- 主信息区域 -->
        <div class="main-info-section">
          <div class="section-title">
            <FileTextOutlined />
            基本信息
          </div>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="处置单号" name="disposalNo">
                <a-input v-model:value="formData.disposalNo" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="发现时间" name="discoveryDate" required>
                <a-date-picker
                  v-model:value="formData.discoveryDate"
                  show-time
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择发现时间"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="发现部门" name="discoveryDepartment" required>
                <a-select v-model:value="formData.discoveryDepartment" placeholder="请选择发现部门" :options="[
                  { value: '品质部（IQC）', label: '品质部（IQC）' },
                  { value: '品质部（IPQC）', label: '品质部（IPQC）' },
                  { value: '品质部（FQC）', label: '品质部（FQC）' },
                  { value: '生产部', label: '生产部' },
                  { value: '其他', label: '其他' }
                ]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16" v-if="formData.discoveryDepartment === '其他'">
            <a-col :span="8">
              <a-form-item label="其他部门" name="otherDepartment" required>
                <a-input v-model:value="formData.otherDepartment" placeholder="请输入其他部门" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="发现人" name="discoverer" required>
                <a-input v-model:value="formData.discoverer" placeholder="请输入发现人" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="供应商名称" name="supplierName" required>
                <a-input v-model:value="formData.supplierName" placeholder="请输入供应商名称" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="批次号" name="batchNo" required>
                <a-input v-model:value="formData.batchNo" placeholder="请输入批次号" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- Tab页签区域 -->
        <div class="form-tabs">
          <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
            <!-- 物料信息 -->
            <a-tab-pane key="material" tab="物料信息">
              <div class="tab-content">
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="物料名称" name="materialName" required>
                      <a-input v-model:value="formData.materialName" placeholder="请输入物料名称" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="物料型号" name="materialModel" required>
                      <a-input v-model:value="formData.materialModel" placeholder="请输入物料型号" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="采购订单号" name="purchaseOrderNo" required>
                      <a-input v-model:value="formData.purchaseOrderNo" placeholder="请输入采购订单号" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="供应商编码" name="supplierCode" required>
                      <a-input v-model:value="formData.supplierCode" placeholder="请输入供应商编码" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="联系人" name="contactPerson" required>
                      <a-input v-model:value="formData.contactPerson" placeholder="请输入联系人" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="联系电话" name="contactPhone" required>
                      <a-input v-model:value="formData.contactPhone" placeholder="请输入联系电话" />
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
                    <a-form-item label="不合格现象" name="defectPhenomenon" required>
                      <a-textarea
                        v-model:value="formData.defectPhenomenon"
                        :rows="3"
                        placeholder="请详细描述不合格现象"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="不合格类别" name="defectCategory" required>
                      <a-select v-model:value="formData.defectCategory" placeholder="请选择不合格类别" :options="[
                        { value: '尺寸超差', label: '尺寸超差' },
                        { value: '外观缺陷', label: '外观缺陷' },
                        { value: '性能不符', label: '性能不符' },
                        { value: '材质问题', label: '材质问题' },
                        { value: '包装问题', label: '包装问题' },
                        { value: '其他', label: '其他' }
                      ]" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="不合格数量" name="defectQuantity" required>
                      <a-input-number
                        v-model:value="formData.defectQuantity"
                        :min="1"
                        placeholder="请输入不合格数量"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="总数量" name="totalQuantity" required>
                      <a-input-number
                        v-model:value="formData.totalQuantity"
                        :min="1"
                        placeholder="请输入总数量"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="隔离区域" name="isolationArea" required>
                      <a-input v-model:value="formData.isolationArea" placeholder="请输入隔离区域" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="隔离标识" name="isolationMark" required>
                      <a-select v-model:value="formData.isolationMark" placeholder="请选择隔离标识" :options="[
                        { value: '红色标牌', label: '红色标牌' },
                        { value: '黄色标牌', label: '黄色标牌' },
                        { value: '蓝色标牌', label: '蓝色标牌' }
                      ]" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="隔离人" name="isolationPerson" required>
                      <a-input v-model:value="formData.isolationPerson" placeholder="请输入隔离人" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </a-tab-pane>

            <!-- 处理记录 -->
            <a-tab-pane key="processing" tab="处理记录">
              <div class="tab-content">
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="评审部门" name="reviewDepartments" required>
                      <a-select
                        v-model:value="formData.reviewDepartments"
                        mode="multiple"
                        placeholder="请选择评审部门"
                        :options="[
                          { value: '品质部', label: '品质部' },
                          { value: '采购部', label: '采购部' },
                          { value: '制造技术部', label: '制造技术部' },
                          { value: '研发技术部', label: '研发技术部' },
                          { value: '生产部', label: '生产部' }
                        ]"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="评审日期" name="reviewDate" required>
                      <a-date-picker
                        v-model:value="formData.reviewDate"
                        format="YYYY-MM-DD"
                        placeholder="请选择评审日期"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="处置方式" name="disposalMethod" required>
                      <a-select v-model:value="formData.disposalMethod" placeholder="请选择处置方式" :options="[
                        { value: 'return', label: '退货（退回供应商返工/分选）' },
                        { value: 'concession', label: '让步接收（不降价）' },
                        { value: 'concession_discount', label: '让步接收（降价）' },
                        { value: 'sorting', label: '挑选使用（我司分选）' }
                      ]" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8" v-if="formData.disposalMethod === 'concession_discount'">
                    <a-form-item label="降价比例(%)" name="discountPercentage">
                      <a-input-number
                        v-model:value="formData.discountPercentage"
                        :min="1"
                        :max="100"
                        placeholder="请输入降价比例"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="执行部门" name="executionDepartment">
                      <a-input v-model:value="formData.executionDepartment" placeholder="请输入执行部门" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="执行人" name="executor">
                      <a-input v-model:value="formData.executor" placeholder="请输入执行人" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="执行完成日期" name="executionDate">
                      <a-date-picker
                        v-model:value="formData.executionDate"
                        format="YYYY-MM-DD"
                        placeholder="请选择执行完成日期"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item label="执行结果" name="executionResult">
                      <a-textarea
                        v-model:value="formData.executionResult"
                        :rows="3"
                        placeholder="请输入执行结果"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const saving = ref(false)

// 表单数据
const formData = reactive({
  id: null,
  disposalNo: '',
  discoveryDate: null,
  discoveryDepartment: '品质部（IQC）',
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
  defectQuantity: null,
  totalQuantity: null,
  isolationArea: '',
  isolationMark: '黄色标牌',
  isolationPerson: '',
  iqcInspectionNo: '',
  supplierCertificateNo: '',
  otherCertificates: '',
  reviewDepartments: [],
  reviewDate: null,
  disposalMethod: 'return',
  discountPercentage: null,
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
  status: 'pending'
})

// 当前激活的Tab页签
const activeTab = ref('material')

// Tab切换事件处理
const handleTabChange = (key: string) => {
  console.log('Tab切换事件触发')
  console.log('切换到Tab:', key)
  console.log('当前activeTab值:', activeTab.value)
  
  activeTab.value = key
  console.log('设置后的activeTab值:', activeTab.value)
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审核',
    reviewing: '审核中',
    approved: '已审核',
    rejected: '已驳回',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    draft: 'status-draft',
    pending_review: 'status-pending-review',
    reviewing: 'status-reviewing',
    approved: 'status-approved',
    rejected: 'status-rejected',
    processing: 'status-processing',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }
  return classMap[status] || ''
}

// 表单验证规则
const rules = {
  discoveryDate: [{ required: true, message: '请选择发现时间', trigger: 'change' }],
  discoveryDepartment: [{ required: true, message: '请选择发现部门', trigger: 'change' }],
  otherDepartment: [{ required: true, message: '请输入其他部门', trigger: 'blur' }],
  discoverer: [{ required: true, message: '请输入发现人', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  materialModel: [{ required: true, message: '请输入物料型号', trigger: 'blur' }],
  batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  purchaseOrderNo: [{ required: true, message: '请输入采购订单号', trigger: 'blur' }],
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  defectPhenomenon: [{ required: true, message: '请输入不合格现象', trigger: 'blur' }],
  defectCategory: [{ required: true, message: '请选择不合格类别', trigger: 'change' }],
  defectQuantity: [{ required: true, message: '请输入不合格数量', trigger: 'blur' }],
  totalQuantity: [{ required: true, message: '请输入总数量', trigger: 'blur' }],
  isolationArea: [{ required: true, message: '请输入隔离区域', trigger: 'blur' }],
  isolationMark: [{ required: true, message: '请选择隔离标识', trigger: 'change' }],
  isolationPerson: [{ required: true, message: '请输入隔离人', trigger: 'blur' }],
  reviewDepartments: [{ required: true, message: '请选择评审部门', trigger: 'change' }],
  reviewDate: [{ required: true, message: '请选择评审日期', trigger: 'change' }],
  disposalMethod: [{ required: true, message: '请选择处置方式', trigger: 'change' }]
}

// 返回列表
const handleBack = () => {
  // 使用window.location强制跳转，确保页面刷新
  window.location.href = '/production-quality/exception-handling/material-disposal'
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟保存操作
    setTimeout(() => {
      message.success('保存成功')
      router.push('/production-quality/exception-handling/material-disposal')
    }, 1000)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    saving.value = false
  }
}

// 初始化数据
const initializeData = () => {
  // 从路由参数获取要编辑的记录ID
  const recordId = route.query.id
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
    if (targetRecord) {
      Object.assign(formData, targetRecord)
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
.material-disposal-edit {
  padding: 0;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  padding: 16px 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.back-button {
  color: #1890ff;
  padding: 4px 8px;
  height: auto;
  font-size: 14px;
}

.back-button:hover {
  color: #40a9ff;
  background-color: #f0f8ff;
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

.form-container {
  padding: 0 24px 24px;
}

.disposal-form {
  background: #fff;
}

.main-info-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.main-info-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-info-section .section-title .anticon {
  color: #1890ff;
}

.main-info-section .ant-form-item {
  margin-bottom: 16px;
}

.form-tabs {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 8px;
  padding: 0 24px;
}

.form-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.form-tabs :deep(.ant-tabs-tab) {
  font-weight: 500;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.form-tabs :deep(.ant-tabs-tab:hover) {
  color: #1890ff;
}

.form-tabs :deep(.ant-tabs-tab-active) {
  color: #1890ff;
  font-weight: 600;
}

.form-tabs :deep(.ant-tabs-ink-bar) {
  background-color: #1890ff;
  height: 3px;
}

.form-tabs :deep(.ant-tabs-content-holder) {
  padding: 0;
}

.form-tabs :deep(.ant-tabs-tabpane) {
  outline: none;
}

.tab-content {
  padding: 16px 0;
}

.form-card {
  margin-bottom: 16px;
}

.form-card:last-child {
  margin-bottom: 0;
}

:deep(.ant-card-head) {
  min-height: 48px;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-card-head-title) {
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.ant-card-body) {
  padding: 24px;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  padding: 0 0 4px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .form-container {
    padding: 0 16px 16px;
  }
  
  :deep(.ant-card-body) {
    padding: 16px;
  }
}
</style>