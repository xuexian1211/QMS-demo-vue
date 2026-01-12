<template>
  <div class="material-disposal-create">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">来料不合格处置单-新增</h2>
        <div class="header-actions">
          <a-button @click="handleBack">返回</a-button>
          <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
        </div>
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
          <h3 class="section-title">基本信息</h3>
          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item label="处置单号" name="disposalNo">
                <a-input v-model:value="formData.disposalNo" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="6">
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
            <a-col :span="6">
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
            <a-col :span="6">
              <a-form-item label="发现人" name="discoverer" required>
                <a-input v-model:value="formData.discoverer" placeholder="请输入发现人" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16" v-if="formData.discoveryDepartment === '其他'">
            <a-col :span="6">
              <a-form-item label="其他部门" name="otherDepartment" required>
                <a-input v-model:value="formData.otherDepartment" placeholder="请输入其他部门" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item label="物料名称" name="materialName" required>
                <a-input v-model:value="formData.materialName" placeholder="请输入物料名称" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="物料型号" name="materialModel" required>
                <a-input v-model:value="formData.materialModel" placeholder="请输入物料型号" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="批次号" name="batchNo" required>
                <a-input v-model:value="formData.batchNo" placeholder="请输入批次号" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="采购订单号" name="purchaseOrderNo" required>
                <a-input v-model:value="formData.purchaseOrderNo" placeholder="请输入采购订单号" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- Tab页签区域 -->
        <div class="form-tabs">
          <a-tabs v-model:activeKey="activeTab" type="card">
            <!-- 供应商信息 -->
            <a-tab-pane key="supplier" tab="供应商信息">
              <div class="tab-content">
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="供应商名称" name="supplierName" required>
                      <a-input v-model:value="formData.supplierName" placeholder="请输入供应商名称" />
                    </a-form-item>
                  </a-col>
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
                </a-row>
                <a-row :gutter="16">
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
                        :rows="4"
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
                  <a-col :span="12">
                    <a-form-item label="不合格数量" name="defectQuantity" required>
                      <a-input-number
                        v-model:value="formData.defectQuantity"
                        :min="1"
                        placeholder="请输入不合格数量"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
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
              </div>
            </a-tab-pane>

            <!-- 隔离措施 -->
            <a-tab-pane key="isolation" tab="隔离措施">
              <div class="tab-content">
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
          </a-tabs>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const router = useRouter()
const formRef = ref()
const saving = ref(false)
const activeTab = ref('supplier')

// 表单数据
const formData = reactive({
  disposalNo: '',
  discoveryDate: dayjs(),
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
  isolationPerson: ''
})

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
  isolationPerson: [{ required: true, message: '请输入隔离人', trigger: 'blur' }]
}

// 生成处置单号
const generateDisposalNo = () => {
  const date = dayjs().format('YYYYMMDD')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `LHBHG${date}${random}`
}

// 返回列表
const handleBack = () => {
  router.push('/production-quality/exception-handling/material-disposal')
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

// 初始化
onMounted(() => {
  formData.disposalNo = generateDisposalNo()
})
</script>

<style scoped>
.material-disposal-create {
  padding: 0;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  padding: 16px 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.form-container {
  padding: 0 24px 24px;
}

.disposal-form {
  background: #fff;
  padding: 24px;
}

.main-info-section {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
}

.form-tabs {
  background: #fff;
}

.tab-content {
  padding: 20px 0;
}

:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab) {
  border-radius: 6px 6px 0 0;
  border: 1px solid #d9d9d9;
  background: #fafafa;
}

:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active) {
  background: #fff;
  border-bottom-color: #fff;
  color: #1890ff;
}

:deep(.ant-tabs-content-holder) {
  border: 1px solid #d9d9d9;
  border-top: none;
  border-radius: 0 0 6px 6px;
  background: #fff;
}

:deep(.ant-tabs-tabpane) {
  padding: 0 24px;
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
  }
  
  .header-content {
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