<template>
  <div class="material-disposal-container">
    <div class="toolbar">
      <a-button type="primary" @click="handleAdd">
        <template #icon><PlusOutlined /></template>
        新增
      </a-button>
      <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
        <template #icon><EditOutlined /></template>
        编辑
      </a-button>
      <a-button @click="handleViewSelected" :disabled="selectedRowKeys.length !== 1">
        <template #icon><EyeOutlined /></template>
        查看
      </a-button>
      <a-button @click="handleBatchDelete" :disabled="selectedRowKeys.length === 0" danger>
        <template #icon><DeleteOutlined /></template>
        删除
      </a-button>
      <a-button @click="handleExport">
        <template #icon><ExportOutlined /></template>
        导出
      </a-button>
      <a-button @click="handleRefresh">
        <template #icon><ReloadOutlined /></template>
        刷新
      </a-button>
    </div>

    <a-card title="搜索条件" size="small" class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="单据编号">
          <a-input v-model:value="searchForm.disposalNo" placeholder="请输入单据编号" />
        </a-form-item>
        <a-form-item label="供应商名称">
          <a-input v-model:value="searchForm.supplierName" placeholder="请输入供应商名称" />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input v-model:value="searchForm.materialName" placeholder="请输入物料名称" />
        </a-form-item>
        <a-form-item label="处置状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择处置状态" style="width: 120px" :options="[
            { value: 'pending', label: '待处理' },
            { value: 'processing', label: '处理中' },
            { value: 'completed', label: '已完成' },
            { value: 'closed', label: '已关闭' }
          ]" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="{ ...pagination, total: filteredData.length, pageSize: 20 }"
        :scroll="{ x: 1200, y: 'calc(100vh - 220px)' }"
        :row-selection="rowSelection"
        row-key="id"
        size="small"
        @change="handleTableChange"
        class="compact-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'disposalMethod'">
            <a-tag :color="getDisposalMethodColor(record.disposalMethod)" class="method-tag">
              {{ getDisposalMethodText(record.disposalMethod) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)" class="status-tag">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'discoveryDate'">
            {{ formatDate(record.discoveryDate) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
              <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这条记录吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新建/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑处置单' : '新建处置单'"
      width="1400px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <!-- 主信息区域 -->
        <div class="main-info-section">
          <!-- 基本信息 -->
          <a-card title="基本信息" size="small" class="form-card">
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="单据编号" name="disposalNo">
                  <a-input v-model:value="formData.disposalNo" disabled placeholder="系统自动生成" />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="发现日期" name="discoveryDate">
                  <a-date-picker 
                    v-model:value="formData.discoveryDate" 
                    show-time 
                    format="YYYY-MM-DD HH:mm"
                    style="width: 100%" 
                    placeholder="请选择发现日期时间"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="发现部门" name="discoveryDepartment">
                  <a-select v-model:value="formData.discoveryDepartment" placeholder="请选择发现部门" :options="[
                    { value: '品质部（IQC）', label: '品质部（IQC）' },
                    { value: '其他', label: '其他' }
                  ]" />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="发现人员" name="discoverer">
                  <a-input v-model:value="formData.discoverer" placeholder="填写实际发现人姓名" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16" v-if="formData.discoveryDepartment === '其他'">
              <a-col :span="6">
                <a-form-item label="其他部门" name="otherDepartment">
                  <a-input v-model:value="formData.otherDepartment" placeholder="请填写其他部门名称" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>

          <!-- 不合格情况描述 -->
          <a-card title="不合格情况描述" size="small" class="form-card">
            <a-row :gutter="16">
              <a-col :span="16">
                <a-form-item label="缺陷现象" name="defectPhenomenon">
                  <a-textarea v-model:value="formData.defectPhenomenon" :rows="3" placeholder="详细描述缺陷（如尺寸超差、材质不符）" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-row :gutter="8">
                  <a-col :span="24">
                    <a-form-item label="缺陷类别" name="defectCategory">
                      <a-radio-group v-model:value="formData.defectCategory">
                        <a-radio value="A类">A类</a-radio>
                        <a-radio value="B类">B类</a-radio>
                        <a-radio value="C类">C类</a-radio>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="涉及数量" name="defectQuantity">
                      <a-input-number 
                        v-model:value="formData.defectQuantity" 
                        placeholder="涉及不合格数量" 
                        style="width: 100%" 
                        addon-after="件"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="总到货数量" name="totalQuantity">
                      <a-input-number 
                        v-model:value="formData.totalQuantity" 
                        placeholder="总到货数量" 
                        style="width: 100%" 
                        addon-after="件"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-col>
            </a-row>
          </a-card>

          <!-- 处置方式 -->
          <a-card title="处置方式" size="small" class="form-card">
            <a-row :gutter="16">
              <a-col :span="24">
                <a-form-item label="处置方式（单选）" name="disposalMethod">
                  <a-radio-group v-model:value="formData.disposalMethod">
                    <a-radio value="return">退货（退回供应商返工/分选）</a-radio>
                    <a-radio value="concession">让步接收（不降价）</a-radio>
                    <a-radio value="concession_discount">让步接收（降价____%）</a-radio>
                    <a-radio value="sorting">挑选使用（我司分选）</a-radio>
                  </a-radio-group>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16" v-if="formData.disposalMethod === 'concession_discount'">
              <a-col :span="6">
                <a-form-item label="降价比例" name="discountPercentage">
                  <a-input-number 
                    v-model:value="formData.discountPercentage" 
                    placeholder="请输入降价比例" 
                    style="width: 100%" 
                    addon-after="%"
                    :min="1"
                    :max="100"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>
        </div>

        <!-- Tab页签区域 -->
        <a-tabs v-model:activeKey="activeTab" class="form-tabs">
          <!-- 产品信息 -->
          <a-tab-pane key="product" tab="产品信息">
            <a-card size="small" class="tab-card">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="物料名称" name="materialName">
                    <a-input v-model:value="formData.materialName" placeholder="与供应商送货单一致" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="物料型号" name="materialModel">
                    <a-input v-model:value="formData.materialModel" placeholder="与供应商送货单一致" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="物料批号" name="batchNo">
                    <a-input v-model:value="formData.batchNo" placeholder="与供应商送货单一致" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="采购订单号" name="purchaseOrderNo">
                    <a-input v-model:value="formData.purchaseOrderNo" placeholder="与供应商送货单一致" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>
          </a-tab-pane>

          <!-- 供应商信息 -->
          <a-tab-pane key="supplier" tab="供应商信息">
            <a-card size="small" class="tab-card">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="供应商名称" name="supplierName">
                    <a-select v-model:value="formData.supplierName" placeholder="请选择供应商" show-search :options="suppliers.map(supplier => ({ value: supplier.name, label: supplier.name }))" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="供应商代码" name="supplierCode">
                    <a-input v-model:value="formData.supplierCode" placeholder="需准确填写" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="联系人" name="contactPerson">
                    <a-input v-model:value="formData.contactPerson" placeholder="供应商联系人" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="联系电话" name="contactPhone">
                    <a-input v-model:value="formData.contactPhone" placeholder="供应商联系电话" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-divider>供应商整改要求</a-divider>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="整改期限" name="rectificationDeadline">
                    <a-date-picker v-model:value="formData.rectificationDeadline" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="16">
                  <a-form-item label="需提交文件" name="requiredDocuments">
                    <a-checkbox-group v-model:value="formData.requiredDocuments">
                      <a-checkbox value="8D报告">8D报告</a-checkbox>
                      <a-checkbox value="整改计划表">整改计划表</a-checkbox>
                      <a-checkbox value="复检报告">复检报告</a-checkbox>
                    </a-checkbox-group>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>
          </a-tab-pane>

          <!-- 流程管理 -->
          <a-tab-pane key="process" tab="流程管理">
            <a-card size="small" class="tab-card">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="隔离区域" name="isolationArea">
                    <a-input v-model:value="formData.isolationArea" placeholder="需明确隔离位置" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="隔离标识" name="isolationMark">
                    <a-radio-group v-model:value="formData.isolationMark">
                      <a-radio value="黄色标牌">黄色标牌</a-radio>
                      <a-radio value="黄色盛具">黄色盛具</a-radio>
                    </a-radio-group>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="隔离人" name="isolationPerson">
                    <a-input v-model:value="formData.isolationPerson" placeholder="隔离负责人" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-divider>关联凭证编号</a-divider>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="IQC检验单号" name="iqcInspectionNo">
                    <a-input v-model:value="formData.iqcInspectionNo" placeholder="请输入IQC检验单号" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="供应商合格证明编号" name="supplierCertificateNo">
                    <a-input v-model:value="formData.supplierCertificateNo" placeholder="请输入合格证明编号" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="其他凭证" name="otherCertificates">
                    <a-input v-model:value="formData.otherCertificates" placeholder="其他相关凭证" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-divider>评审意见</a-divider>
              <a-row :gutter="16">
                <a-col :span="16">
                  <a-form-item label="评审部门" name="reviewDepartments">
                    <a-checkbox-group v-model:value="formData.reviewDepartments">
                      <a-checkbox value="品质部">品质部</a-checkbox>
                      <a-checkbox value="采购部">采购部</a-checkbox>
                      <a-checkbox value="研发技术部">研发技术部</a-checkbox>
                      <a-checkbox value="制造技术部">制造技术部</a-checkbox>
                    </a-checkbox-group>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="评审日期" name="reviewDate">
                    <a-date-picker v-model:value="formData.reviewDate" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>
          </a-tab-pane>

          <!-- 执行跟踪 -->
          <a-tab-pane key="execution" tab="执行跟踪">
            <a-card size="small" class="tab-card">
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
                    <a-date-picker v-model:value="formData.executionDate" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="24">
                  <a-form-item label="执行结果" name="executionResult">
                    <a-textarea v-model:value="formData.executionResult" :rows="2" placeholder="请输入执行结果" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-divider>验证结果</a-divider>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="验证部门" name="verificationDepartment">
                    <a-input v-model:value="formData.verificationDepartment" placeholder="请选择验证部门" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="验证人" name="verifier">
                    <a-input v-model:value="formData.verifier" placeholder="请输入验证人" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="验证结论" name="verificationConclusion">
                    <a-select v-model:value="formData.verificationConclusion" placeholder="请选择验证结论" :options="[
                      { value: '合格', label: '合格' },
                      { value: '不合格', label: '不合格' },
                      { value: '待验证', label: '待验证' }
                    ]" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>
          </a-tab-pane>

          <!-- 审批信息 -->
          <a-tab-pane key="approval" tab="审批信息">
            <a-card size="small" class="tab-card">
              <a-row :gutter="16">
                <a-col :span="6">
                  <a-form-item label="填写人签字" name="fillerSignature">
                    <a-input v-model:value="formData.fillerSignature" placeholder="请输入填写人签字" />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="部门主管签字" name="departmentHeadSignature">
                    <a-input v-model:value="formData.departmentHeadSignature" placeholder="请输入部门主管签字" />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="品质部审核" name="qualityDepartmentReview">
                    <a-input v-model:value="formData.qualityDepartmentReview" placeholder="请输入品质部审核" />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="审批人签字" name="approverSignature">
                    <a-input v-model:value="formData.approverSignature" placeholder="请输入审批人签字" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-divider>备注</a-divider>
              <a-row :gutter="16">
                <a-col :span="24">
                  <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="formData.remark" :rows="3" placeholder="请输入备注信息" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined, ExportOutlined, ReloadOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  disposalNo: '',
  supplierName: '',
  materialName: '',
  status: ''
})

// 表格数据
const dataSource = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])
const selectedRows = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条数据`
})

// 过滤后的数据
const filteredData = computed(() => {
  let data = dataSource.value
  
  if (searchForm.disposalNo) {
    data = data.filter(item => item.disposalNo.includes(searchForm.disposalNo))
  }
  
  if (searchForm.supplierName) {
    data = data.filter(item => item.supplierName.includes(searchForm.supplierName))
  }
  
  if (searchForm.materialName) {
    data = data.filter(item => item.materialName.includes(searchForm.materialName))
  }
  
  if (searchForm.status) {
    data = data.filter(item => item.status === searchForm.status)
  }
  
  return data
})

// 行选择配置
const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (selectedKeys, selectedRows) => {
    selectedRowKeys.value = selectedKeys
    selectedRows.value = selectedRows
  },
  getCheckboxProps: (record) => ({
    disabled: false,
    name: record.name,
  }),
}

// 表格列定义
const columns = [
  {
      title: '单据编号',
      dataIndex: 'disposalNo',
      key: 'disposalNo',
      width: 150,
      customRender: ({ text, record }) => h('a', {
        onClick: () => viewRecord(record)
      }, text)
    },
  {
    title: '发现日期',
    dataIndex: 'discoveryDate',
    key: 'discoveryDate',
    width: 140
  },
  {
    title: '供应商名称',
    dataIndex: 'supplierName',
    key: 'supplierName',
    width: 120
  },
  {
    title: '物料名称',
    dataIndex: 'materialName',
    key: 'materialName',
    width: 120
  },
  {
    title: '物料型号',
    dataIndex: 'materialModel',
    key: 'materialModel',
    width: 100
  },
  {
    title: '缺陷类别',
    dataIndex: 'defectCategory',
    key: 'defectCategory',
    width: 80
  },
  {
    title: '涉及数量',
    dataIndex: 'defectQuantity',
    key: 'defectQuantity',
    width: 80
  },
  {
    title: '处置方式',
    dataIndex: 'disposalMethod',
    key: 'disposalMethod',
    width: 120
  },
  {
    title: '处置状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const formData = reactive({
  id: null,
  // 基本信息
  disposalNo: '',
  discoveryDate: null,
  discoveryDepartment: '',
  otherDepartment: '',
  discoverer: '',
  // 产品基础信息
  materialName: '',
  materialModel: '',
  batchNo: '',
  purchaseOrderNo: '',
  // 供应商信息
  supplierName: '',
  supplierCode: '',
  contactPerson: '',
  contactPhone: '',
  // 不合格情况描述
  defectPhenomenon: '',
  defectCategory: '',
  defectQuantity: null,
  totalQuantity: null,
  // 标识隔离情况
  isolationArea: '',
  isolationMark: '',
  isolationPerson: '',
  // 关联凭证编号
  iqcInspectionNo: '',
  supplierCertificateNo: '',
  otherCertificates: '',
  // 评审意见
  reviewDepartments: [],
  reviewDate: null,
  // 处置方式
  disposalMethod: '',
  discountPercentage: null,
  // 供应商整改要求
  rectificationDeadline: null,
  requiredDocuments: [],
  // 执行情况
  executionDepartment: '',
  executor: '',
  executionDate: null,
  executionResult: '',
  // 验证结果
  verificationDepartment: '',
  verifier: '',
  verificationConclusion: '',
  // 审核签字
  fillerSignature: '',
  departmentHeadSignature: '',
  qualityDepartmentReview: '',
  approverSignature: '',
  // 备注
  remark: '',
  status: 'pending'
})

// 当前激活的Tab
const activeTab = ref('product')

// 供应商数据
const suppliers = ref([
  { id: 1, name: '供应商A' },
  { id: 2, name: '供应商B' },
  { id: 3, name: '供应商C' }
])

// 表单验证规则
const rules = {
  // 基本信息
  discoveryDate: [{ required: true, message: '请选择发现日期', trigger: 'change' }],
  discoveryDepartment: [{ required: true, message: '请选择发现部门', trigger: 'change' }],
  discoverer: [{ required: true, message: '请输入发现人员姓名', trigger: 'blur' }],
  otherDepartment: [{ required: false, message: '请填写其他部门名称', trigger: 'blur' }],
  
  // 产品基础信息
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  materialModel: [{ required: true, message: '请输入物料型号', trigger: 'blur' }],
  batchNo: [{ required: true, message: '请输入物料批号', trigger: 'blur' }],
  purchaseOrderNo: [{ required: true, message: '请输入采购订单号', trigger: 'blur' }],
  
  // 供应商信息
  supplierName: [{ required: true, message: '请选择供应商名称', trigger: 'change' }],
  supplierCode: [{ required: true, message: '请输入供应商代码', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  
  // 不合格情况描述
  defectPhenomenon: [{ required: true, message: '请描述缺陷现象', trigger: 'blur' }],
  defectCategory: [{ required: true, message: '请选择缺陷类别', trigger: 'change' }],
  defectQuantity: [{ required: true, message: '请输入涉及数量', trigger: 'blur' }],
  totalQuantity: [{ required: true, message: '请输入总到货数量', trigger: 'blur' }],
  
  // 标识隔离情况
  isolationArea: [{ required: true, message: '请输入隔离区域', trigger: 'blur' }],
  isolationMark: [{ required: true, message: '请选择隔离标识', trigger: 'change' }],
  isolationPerson: [{ required: true, message: '请输入隔离人', trigger: 'blur' }],
  
  // 关联凭证编号
  iqcInspectionNo: [{ required: true, message: '请输入IQC检验单号', trigger: 'blur' }],
  
  // 评审意见
  reviewDepartments: [{ required: true, message: '请选择评审部门', trigger: 'change' }],
  reviewDate: [{ required: true, message: '请选择评审日期', trigger: 'change' }],
  
  // 处置方式
  disposalMethod: [{ required: true, message: '请选择处置方式', trigger: 'change' }],
  discountPercentage: [{ required: false, message: '请输入降价比例', trigger: 'blur' }],
  
  // 供应商整改要求
  rectificationDeadline: [{ required: true, message: '请选择整改期限', trigger: 'change' }],
  requiredDocuments: [{ required: true, message: '请选择需提交文件', trigger: 'change' }],
  
  // 执行情况
  executionDepartment: [{ required: false, message: '请输入执行部门', trigger: 'blur' }],
  executor: [{ required: false, message: '请输入执行人', trigger: 'blur' }],
  executionDate: [{ required: false, message: '请选择执行完成日期', trigger: 'change' }],
  executionResult: [{ required: false, message: '请输入执行结果', trigger: 'blur' }],
  
  // 验证结果
  verificationDepartment: [{ required: false, message: '请选择验证部门', trigger: 'change' }],
  verifier: [{ required: false, message: '请输入验证人', trigger: 'blur' }],
  verificationConclusion: [{ required: false, message: '请选择验证结论', trigger: 'change' }],
  
  // 审核签字
  fillerSignature: [{ required: false, message: '请输入填写人签字', trigger: 'blur' }],
  departmentHeadSignature: [{ required: false, message: '请输入部门主管签字', trigger: 'blur' }],
  qualityDepartmentReview: [{ required: false, message: '请输入品质部审核', trigger: 'blur' }],
  approverSignature: [{ required: false, message: '请输入审批人签字', trigger: 'blur' }]
}

// 模拟数据
const mockData = [
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

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green',
    closed: 'gray'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭'
  }
  return texts[status] || status
}

// 获取处置方式颜色
const getDisposalMethodColor = (method) => {
  const colors = {
    return: 'red',
    concession: 'orange',
    concession_discount: 'gold',
    sorting: 'blue'
  }
  return colors[method] || 'default'
}

// 获取处置方式文本
const getDisposalMethodText = (method) => {
  const texts = {
    return: '退货（退回供应商返工/分选）',
    concession: '让步接收（不降价）',
    concession_discount: '让步接收（降价）',
    sorting: '挑选使用（我司分选）'
  }
  return texts[method] || method
}

// 获取缺陷类别颜色
const getDefectCategoryColor = (category) => {
  const colors = {
    'A类': 'red',
    'B类': 'orange',
    'C类': 'blue'
  }
  return colors[category] || 'default'
}

// 获取缺陷类别文本
const getDefectCategoryText = (category) => {
  return category || ''
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    'draft': 'status-draft',
    'pending': 'status-pending',
    'processing': 'status-processing',
    'completed': 'status-completed',
    'closed': 'status-closed'
  }
  return classMap[status] || ''
}

// 获取数据
const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    dataSource.value = [...mockData]
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
  searchForm.disposalNo = ''
  searchForm.supplierName = ''
  searchForm.materialName = ''
  searchForm.status = ''
  handleSearch()
}

// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

// 新建处置单
const handleAdd = () => {
  router.push('/production-quality/exception-handling/material-disposal/create')
}

// 编辑处置单（工具栏）
const handleEdit = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要编辑的记录')
    return
  }
  if (selectedRowKeys.value.length > 1) {
    message.warning('只能选择一条记录进行编辑')
    return
  }
  const selectedId = selectedRowKeys.value[0]
  router.push(`/production-quality/exception-handling/material-disposal/edit?id=${selectedId}`)
}

// 查看处置单（工具栏）
const handleViewSelected = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要查看的记录')
    return
  }
  if (selectedRowKeys.value.length > 1) {
    message.warning('只能选择一条记录进行查看')
    return
  }
  const selectedId = selectedRowKeys.value[0]
  router.push({
    path: '/production-quality/exception-handling/material-disposal/view',
    query: { id: selectedId }
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的记录')
    return
  }
  
  const deleteCount = selectedRowKeys.value.length
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除选中的 ${deleteCount} 条记录吗？删除后不可恢复！`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      // 执行删除操作
      selectedRowKeys.value.forEach(id => {
        const index = dataSource.value.findIndex(item => item.id === id)
        if (index > -1) {
          dataSource.value.splice(index, 1)
        }
      })
      pagination.total -= deleteCount
      selectedRowKeys.value = []
      selectedRows.value = []
      message.success(`成功删除 ${deleteCount} 条记录`)
    },
    onCancel() {
      message.info('已取消删除')
    }
  })
}

// 删除记录
const handleDelete = (id) => {
  deleteRecord(id)
}

// 导出
const handleExport = () => {
  message.info('导出功能开发中...')
}

// 刷新
const handleRefresh = () => {
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
  router.push(`/production-quality/exception-handling/material-disposal/edit?id=${record.id}`)
}

// 查看记录
const viewRecord = (record) => {
  router.push({
    path: '/production-quality/exception-handling/material-disposal/view',
    query: { id: record.id }
  })
}

// 开始处理
const startProcessing = (record) => {
  record.status = 'processing'
  message.success('已开始处理')
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
          discoveryDate: formData.discoveryDate ? formData.discoveryDate.format('YYYY-MM-DD HH:mm') : null,
          reviewDate: formData.reviewDate ? formData.reviewDate.format('YYYY-MM-DD') : null,
          rectificationDeadline: formData.rectificationDeadline ? formData.rectificationDeadline.format('YYYY-MM-DD') : null,
          executionDate: formData.executionDate ? formData.executionDate.format('YYYY-MM-DD') : null
        }
      }
      message.success('更新成功')
    } else {
      const newId = Math.max(...dataSource.value.map(item => item.id)) + 1
      const disposalNo = `LHBHG${dayjs().format('YYYYMMDD')}${String(newId).padStart(3, '0')}`
      const newItem = {
        ...formData,
        id: newId,
        disposalNo,
        discoveryDate: formData.discoveryDate ? formData.discoveryDate.format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
        reviewDate: formData.reviewDate ? formData.reviewDate.format('YYYY-MM-DD') : null,
        rectificationDeadline: formData.rectificationDeadline ? formData.rectificationDeadline.format('YYYY-MM-DD') : null,
        executionDate: formData.executionDate ? formData.executionDate.format('YYYY-MM-DD') : null,
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
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.material-disposal-container {
  padding: 8px 10px 10px 10px;
  background: #f5f5f5;
  min-height: 100vh;
}

.toolbar {
  background: #fff;
  padding: 8px 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.search-card {
  background: #fff;
  margin-bottom: 8px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-card :deep(.ant-card-head) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  min-height: 32px;
}

.search-card :deep(.ant-card-head-title) {
  font-weight: 500;
  color: #262626;
  font-size: 14px;
  padding: 4px 0;
}

.search-card :deep(.ant-card-body) {
  padding: 8px 10px;
}

.search-card :deep(.ant-form-item) {
  margin-bottom: 8px;
}

.table-container {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-card {
  margin-bottom: 10px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-card :deep(.ant-card-head) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  min-height: 32px;
}

.form-card :deep(.ant-card-head-title) {
  font-weight: 500;
  color: #262626;
  font-size: 14px;
  padding: 4px 0;
}

.form-card :deep(.ant-card-body) {
  padding: 12px;
}

.form-card :deep(.ant-form-item) {
  margin-bottom: 8px;
}

.form-card :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #595959;
}

.form-card :deep(.ant-input),
.form-card :deep(.ant-select-selector),
.form-card :deep(.ant-picker),
.form-card :deep(.ant-input-number),
.form-card :deep(.ant-textarea) {
  border-radius: 4px;
}

.form-card :deep(.ant-radio-group),
.form-card :deep(.ant-checkbox-group) {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.modal-form {
  max-height: 75vh;
  overflow-y: auto;
}

.modal-form :deep(.ant-form-item) {
  margin-bottom: 8px;
}

.modal-form :deep(.ant-card) {
  border: 1px solid #e8e8e8;
}

.modal-form :deep(.ant-card:last-child) {
  margin-bottom: 0;
}

.modal-form :deep(.ant-card-body) {
  padding: 12px;
}

.modal-form :deep(.ant-row) {
  margin-bottom: 0;
}

.modal-form :deep(.ant-col) {
  margin-bottom: 0;
}

.status-tag {
  font-weight: 500;
}

.method-tag {
  font-weight: 500;
}

/* 紧凑表格样式 */
.compact-table :deep(.ant-table-thead > tr > th) {
  padding: 6px 8px !important;
  font-size: 13px;
  font-weight: 600;
  height: 36px;
}

.compact-table :deep(.ant-table-tbody > tr > td) {
  padding: 6px 8px !important;
  font-size: 13px;
  height: 36px;
  line-height: 1.3;
}

.compact-table :deep(.ant-table-row) {
  height: 36px;
}

.compact-table :deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background: #f5f5f5;
}

.compact-table :deep(.ant-table-pagination.ant-pagination) {
  margin: 8px 0;
}

.compact-table :deep(.ant-pagination-item) {
  min-width: 28px;
  height: 28px;
  line-height: 26px;
  font-size: 12px;
}

.compact-table :deep(.ant-pagination-prev),
.compact-table :deep(.ant-pagination-next) {
  min-width: 28px;
  height: 28px;
  line-height: 26px;
}

.compact-table :deep(.ant-pagination-jump-prev),
.compact-table :deep(.ant-pagination-jump-next) {
  height: 28px;
  line-height: 26px;
}

.compact-table :deep(.ant-pagination-options) {
  margin-left: 8px;
}

.compact-table :deep(.ant-pagination-options-size-changer) {
  margin-right: 0;
}

.compact-table :deep(.ant-select-selector) {
  height: 24px;
  font-size: 12px;
}

.compact-table :deep(.ant-select-selection-item) {
  line-height: 22px;
}

.compact-table :deep(.ant-btn) {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 22px;
}

.compact-table :deep(.ant-space-item) {
  font-size: 12px;
}

.compact-table :deep(.ant-tag) {
  font-size: 11px;
  padding: 1px 6px;
  line-height: 16px;
  height: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-disposal-container {
    padding: 8px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 8px;
  }
  
  .search-card :deep(.ant-card-body) {
    padding: 8px;
  }
  
  .form-card :deep(.ant-card-body) {
    padding: 12px;
  }
  
  .form-card :deep(.ant-radio-group),
  .form-card :deep(.ant-checkbox-group) {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 8px;
  }
  
  .form-card :deep(.ant-form-item) {
    margin-bottom: 8px;
  }
}

/* 主信息区域样式 */
.main-info-section {
  margin-bottom: 16px;
}

.main-info-section .form-card {
  margin-bottom: 12px;
}

/* Tab页签样式 */
.form-tabs {
  margin-top: 16px;
}

.form-tabs :deep(.ant-tabs-content-holder) {
  max-height: 60vh;
  overflow-y: auto;
}

.tab-card {
  margin-bottom: 0;
}

.tab-card :deep(.ant-card-body) {
  padding: 16px;
}
</style>