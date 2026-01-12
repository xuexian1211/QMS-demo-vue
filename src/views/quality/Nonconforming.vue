<template>
  <div class="page-container">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>搜索：</label>
          <a-input
            v-model:value="searchText"
            placeholder="请输入处置单号、物料名称、供应商"
            style="width: 250px"
            allowClear
          />
        </div>
        <div class="filter-item">
          <label>日期范围：</label>
          <a-range-picker v-model:value="dateRange" style="width: 240px" />
        </div>
        <div class="filter-item">
          <label>状态：</label>
          <a-select
            v-model:value="statusFilter"
            placeholder="请选择状态"
            style="width: 120px"
            allowClear
            :options="[
              { value: '待处理', label: '待处理' },
              { value: '处理中', label: '处理中' },
              { value: '已处理', label: '已处理' },
              { value: '已关闭', label: '已关闭' }
            ]"
          />
        </div>
        <div class="filter-item">
          <label>严重程度：</label>
          <a-select
            v-model:value="severityFilter"
            placeholder="请选择严重程度"
            style="width: 120px"
            allowClear
            :options="[
              { value: '轻微', label: '轻微' },
              { value: '一般', label: '一般' },
              { value: '严重', label: '严重' }
            ]"
          />
        </div>
        <div class="filter-item">
          <a-button type="primary" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <a-button @click="resetFilters">重置</a-button>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <a-button type="primary" @click="handleCreate">
          <template #icon><PlusOutlined /></template>
          新增
        </a-button>
        <a-button 
          danger 
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          <template #icon><DeleteOutlined /></template>
          删除
        </a-button>
        <a-button 
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchView"
        >
          <template #icon><EyeOutlined /></template>
          查看
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
      <div class="toolbar-right">
        <span v-if="selectedRowKeys.length > 0" class="selected-info">
          已选择 {{ selectedRowKeys.length }} 项
        </span>
      </div>
    </div>

    <!-- 数据列表 -->
    <div class="table-section">
      <a-table 
        :columns="columns" 
        :data-source="nonconformingData" 
        :pagination="pagination"
        :row-selection="rowSelection"
        @change="handleTableChange"
        bordered
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'severity'">
            <a-tag :color="getSeverityColor(record.severity)">{{ getSeverityText(record.severity) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="viewDetail(record)">
                <template #icon><EyeOutlined /></template>
                查看
              </a-button>
              <a-button type="link" size="small" v-if="record.status === 'pending'" @click="editRecord(record)">
                <template #icon><EditOutlined /></template>
                修改
              </a-button>
              <a-button type="link" size="small" v-if="record.status === 'pending'" @click="startProcess(record)">
                <template #icon><PlayCircleOutlined /></template>
                开始处理
              </a-button>
              <a-popconfirm
                title="确定要删除这条记录吗？"
                @confirm="deleteRecord(record)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="link" size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新建/编辑处理单模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="isEdit ? '编辑不合格品处理单' : '新建不合格品处理单'"
      width="1000px"
      @ok="handleCreateProcess"
    >
      <a-form :model="createForm" layout="vertical">
        <!-- 主信息区域 -->
        <div class="main-info-section">
          <h4 class="section-title">基本信息</h4>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="物料名称" name="materialName" :rules="[{ required: true, message: '请输入物料名称' }]">
                <a-input v-model:value="createForm.materialName" placeholder="输入物料名称" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="物料编码" name="materialCode" :rules="[{ required: true, message: '请输入物料编码' }]">
                <a-input v-model:value="createForm.materialCode" placeholder="输入物料编码" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="不合格数量" name="quantity" :rules="[{ required: true, message: '请输入不合格数量' }]">
                <a-input-number v-model:value="createForm.quantity" :min="1" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="严重程度" name="severity" :rules="[{ required: true, message: '请选择严重程度' }]">
                <a-select v-model:value="createForm.severity" placeholder="选择严重程度"
                  :options="[
                    { value: 'minor', label: '轻微' },
                    { value: 'major', label: '严重' },
                    { value: 'critical', label: '致命' }
                  ]"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="发现时间" name="discoverTime" :rules="[{ required: true, message: '请选择发现时间' }]">
                <a-date-picker v-model:value="createForm.discoverTime" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="处理状态" name="status">
                <a-select v-model:value="createForm.status" placeholder="选择处理状态"
                  :options="[
                    { value: 'pending', label: '待处理' },
                    { value: 'processing', label: '处理中' },
                    { value: 'completed', label: '已处理' }
                  ]"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- Tab页签区域 -->
        <div class="form-tabs">
          <a-tabs v-model:activeKey="activeTab" type="card">
            <!-- 产品详情 -->
            <a-tab-pane key="product" tab="产品详情">
              <div class="tab-content">
                <a-form-item label="不合格描述" name="description" :rules="[{ required: true, message: '请描述不合格情况' }]">
                  <a-textarea v-model:value="createForm.description" :rows="6" placeholder="详细描述不合格情况，包括具体问题、影响范围等" />
                </a-form-item>
              </div>
            </a-tab-pane>
            
            <!-- 处理方案 -->
            <a-tab-pane key="process" tab="处理方案">
              <div class="tab-content">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="处理方式" name="processMethod">
                      <a-select v-model:value="createForm.processMethod" placeholder="选择处理方式" :options="[
                        { value: 'return', label: '退货' },
                        { value: 'rework', label: '返工' },
                        { value: 'scrap', label: '报废' },
                        { value: 'accept', label: '特采' }
                      ]" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="处理人" name="processor">
                      <a-input v-model:value="createForm.processor" placeholder="输入处理人" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-form-item label="处理说明" name="processRemark">
                  <a-textarea v-model:value="createForm.processRemark" :rows="4" placeholder="输入处理说明，包括处理步骤、注意事项等" />
                </a-form-item>
              </div>
            </a-tab-pane>

            <!-- 处理记录 -->
            <a-tab-pane key="record" tab="处理记录">
              <div class="tab-content">
                <a-empty description="暂无处理记录" />
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="不合格品处理单详情"
      width="1000px"
      :footer="null"
    >
      <div v-if="currentRecord">
        <!-- 基本信息模块 -->
        <div style="margin-bottom: 24px">
          <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #262626;">基本信息</h4>
          <a-descriptions :column="3" bordered>
            <a-descriptions-item label="处理单号">{{ currentRecord.processNo }}</a-descriptions-item>
            <a-descriptions-item label="物料名称">{{ currentRecord.materialName }}</a-descriptions-item>
            <a-descriptions-item label="物料编码">{{ currentRecord.materialCode }}</a-descriptions-item>
            <a-descriptions-item label="不合格数量">{{ currentRecord.quantity }}</a-descriptions-item>
            <a-descriptions-item label="严重程度">
              <a-tag :color="getSeverityColor(currentRecord.severity)">{{ getSeverityText(currentRecord.severity) }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="发现时间">{{ currentRecord.discoverTime }}</a-descriptions-item>
          </a-descriptions>
        </div>

        <!-- 不合格描述模块 -->
        <div style="margin-bottom: 24px">
          <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #262626;">不合格描述</h4>
          <p>{{ currentRecord.description || '暂无描述' }}</p>
        </div>

        <!-- 处理信息模块 -->
        <div>
          <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #262626;">处理信息</h4>
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="状态">
              <a-tag :color="getStatusColor(currentRecord.status)">{{ getStatusText(currentRecord.status) }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="处理人">{{ currentRecord.processor || '未分配' }}</a-descriptions-item>
            <a-descriptions-item label="处理方式">{{ currentRecord.processMethod || '未确定' }}</a-descriptions-item>
            <a-descriptions-item label="处理时间">{{ currentRecord.processTime || '未处理' }}</a-descriptions-item>
          </a-descriptions>
          <div style="margin-top: 16px">
            <strong>处理说明：</strong>
            <p style="margin-top: 8px">{{ currentRecord.processRemark || '暂无说明' }}</p>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExportOutlined, 
  ImportOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

// 响应式数据
const searchText = ref('')
const dateRange = ref([])
const statusFilter = ref('')
const severityFilter = ref('')
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const currentRecord = ref(null)
const isEdit = ref(false)
const selectedRowKeys = ref<string[]>([])

// 表格列定义
const columns = [
  { 
    title: '处理单号', 
    dataIndex: 'processNo', 
    key: 'processNo',
    width: 140,
    fixed: 'left'
  },
  { 
    title: '物料名称', 
    dataIndex: 'materialName', 
    key: 'materialName',
    width: 150
  },
  { 
    title: '物料编码', 
    dataIndex: 'materialCode', 
    key: 'materialCode',
    width: 120
  },
  { 
    title: '不合格数量', 
    dataIndex: 'quantity', 
    key: 'quantity',
    width: 100,
    align: 'right'
  },
  { 
    title: '严重程度', 
    dataIndex: 'severity', 
    key: 'severity',
    width: 100,
    align: 'center'
  },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status',
    width: 100,
    align: 'center'
  },
  { 
    title: '发现时间', 
    dataIndex: 'discoverTime', 
    key: 'discoverTime',
    width: 150
  },
  { 
    title: '处理人', 
    dataIndex: 'processor', 
    key: 'processor',
    width: 100
  },
  { 
    title: '操作', 
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 行选择配置
const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys
  }
}

// 模拟数据
const nonconformingData = ref([
  {
    key: '1',
    processNo: 'NC20231114001',
    materialName: '发动机缸体',
    materialCode: 'ENG-001',
    quantity: 5,
    severity: 'major',
    status: 'processing',
    discoverTime: '2023-11-14 09:30',
    processor: '李四',
    description: '发动机缸体表面有划痕，影响装配精度',
    processMethod: 'rework',
    processTime: '2023-11-14 14:20',
    processRemark: '返工处理后重新检验合格'
  },
  {
    key: '2',
    processNo: 'NC20231114002',
    materialName: '变速箱齿轮',
    materialCode: 'GER-002',
    quantity: 12,
    severity: 'minor',
    status: 'pending',
    discoverTime: '2023-11-14 10:15',
    processor: '',
    description: '齿轮表面轻微锈蚀，不影响使用性能',
    processMethod: '',
    processTime: '',
    processRemark: ''
  },
  {
    key: '3',
    processNo: 'NC20231114003',
    materialName: '刹车片',
    materialCode: 'BRK-003',
    quantity: 8,
    severity: 'critical',
    status: 'completed',
    discoverTime: '2023-11-13 16:45',
    processor: '王五',
    description: '刹车片厚度不符合标准，存在安全隐患',
    processMethod: 'scrap',
    processTime: '2023-11-14 11:30',
    processRemark: '报废处理，重新采购合格品'
  }
])

// 表单数据
const createForm = reactive({
  materialName: '',
  materialCode: '',
  quantity: 1,
  severity: '',
  description: '',
  discoverTime: null,
  processMethod: '',
  processor: '',
  processRemark: '',
  status: ''
})

// Tab页签控制
const activeTab = ref('product')

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
})

// 方法
const handleSearch = () => {
  console.log('搜索:', searchText.value)
  message.success('搜索功能执行中...')
}

const handleDateChange = (dates: any) => {
  console.log('日期范围变化:', dates)
}

const handleStatusFilter = () => {
  console.log('状态筛选:', statusFilter.value)
}

const resetFilters = () => {
  searchText.value = ''
  dateRange.value = []
  statusFilter.value = ''
  severityFilter.value = ''
  message.success('筛选条件已重置')
}

const handleTableChange = (pag: any, filters: any, sorter: any) => {
  console.log('表格变化:', pag, filters, sorter)
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(createForm, {
    materialName: '',
    materialCode: '',
    quantity: 1,
    severity: '',
    description: '',
    discoverTime: null,
    processMethod: '',
    processor: '',
    processRemark: ''
  })
  showCreateModal.value = true
}

const handleBatchEdit = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要修改的记录')
    return
  }
  message.info(`批量编辑 ${selectedRowKeys.value.length} 条记录`)
}

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的记录')
    return
  }
  message.success(`批量删除 ${selectedRowKeys.value.length} 条记录`)
  selectedRowKeys.value = []
}

const handleExport = () => {
  message.success('导出功能执行中...')
}

const handleImport = () => {
  message.info('导入功能开发中...')
}

const handleRefresh = () => {
  message.success('刷新成功')
  // 这里可以添加重新加载数据的逻辑
}

const viewDetail = (record: any) => {
  currentRecord.value = record
  showDetailModal.value = true
}

const editRecord = (record: any) => {
  isEdit.value = true
  Object.assign(createForm, record)
  showCreateModal.value = true
}

const startProcess = (record: any) => {
  console.log('开始处理:', record)
  message.info('开始处理不合格品')
}

const deleteRecord = (record: any) => {
  console.log('删除记录:', record)
  message.success('记录删除成功')
}

const handleCreateProcess = () => {
  console.log('创建/编辑处理单:', createForm)
  message.success(isEdit.value ? '处理单修改成功' : '处理单创建成功')
  showCreateModal.value = false
  isEdit.value = false
}

const handleCancel = () => {
  showCreateModal.value = false
  isEdit.value = false
}

// 状态相关方法
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已处理'
  }
  return texts[status] || status
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    minor: 'orange',
    major: 'red',
    critical: 'purple'
  }
  return colors[severity] || 'default'
}

const getSeverityText = (severity: string) => {
  const texts: Record<string, string> = {
    minor: '轻微',
    major: '严重',
    critical: '致命'
  }
  return texts[severity] || severity
}

const getProcessMethodText = (method: string) => {
  const texts: Record<string, string> = {
    rework: '返工',
    repair: '返修',
    scrap: '报废',
    accept: '特采',
    return: '退货'
  }
  return texts[method] || method
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

/* 筛选区域 */
.filter-section {
  background: #fff;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.filter-item label {
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
}

/* 工具栏 */
.toolbar-section {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.selected-info {
  color: #1890ff;
  font-size: 14px;
  font-weight: 500;
}

/* 数据列表 */
.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 表格样式 */
:deep(.ant-table) {
  font-size: 14px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.action-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 标签样式 */
.status-tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
}

.severity-tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
}

/* 模态框样式 */
:deep(.ant-modal-header) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-modal-body) {
  padding: 0;
}

:deep(.ant-modal-footer) {
  border-top: 1px solid #f0f0f0;
  padding: 12px 24px;
}

/* 表单容器 */
.form-container {
  background: #fff;
}

.form-toolbar {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.create-form {
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

/* 表单项样式 */
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #262626;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker) {
  border-radius: 6px;
}

:deep(.ant-input:focus),
:deep(.ant-select-focused .ant-select-selector),
:deep(.ant-picker:hover) {
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.1);
}

/* 详情页面样式 */
.detail-container {
  background: #fff;
}

.detail-section {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.detail-content {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  line-height: 1.6;
  color: #262626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    min-width: auto;
  }
  
  .toolbar-section {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .filter-section,
  .toolbar-section {
    padding: 16px;
  }
  
  .create-form,
  .detail-section {
    padding: 16px;
  }
}

/* 主信息区域样式 */
.main-info-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 2px solid #1890ff;
}

/* Tab页签样式 */
.form-tabs {
  margin-top: 16px;
}

.tab-content {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  min-height: 200px;
}

:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab) {
  border-radius: 6px 6px 0 0;
  border: 1px solid #f0f0f0;
  background: #fafafa;
}

:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active) {
  background: #fff;
  border-color: #1890ff;
  color: #1890ff;
}

:deep(.ant-tabs-content-holder) {
  border: 1px solid #f0f0f0;
  border-radius: 0 0 6px 6px;
  background: #fff;
}

:deep(.ant-tabs-tabpane) {
  padding: 0;
}
</style>