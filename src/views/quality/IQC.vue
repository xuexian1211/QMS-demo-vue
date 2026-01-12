<template>
  <div class="iqc-page">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索检验单号、物料名称"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-range-picker v-model:value="dateRange" style="margin-right: 16px;" @change="handleDateChange" />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px; margin-right: 16px;" @change="handleStatusFilter" :options="[
          { value: '', label: '全部' },
          { value: 'pending', label: '待检验' },
          { value: 'processing', label: '检验中' },
          { value: 'qualified', label: '合格' },
          { value: 'unqualified', label: '不合格' }
        ]" />
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新建检验单
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="iqcData" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
          <a-button type="link" size="small" v-if="record.status === 'pending'" @click="startInspection(record)">开始检验</a-button>
          <a-button type="link" size="small" v-if="record.status === 'processing'" @click="continueInspection(record)">继续检验</a-button>
        </template>
      </template>
    </a-table>

    <!-- 新建检验单模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新建IQC检验单"
      width="800px"
      @ok="handleCreateInspection"
    >
      <a-form :model="createForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="供应商">
              <a-select v-model:value="createForm.supplierId" placeholder="选择供应商" :options="suppliers.map(supplier => ({
                value: supplier.id,
                label: supplier.name
              }))" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来料批次">
              <a-input v-model:value="createForm.batchNo" placeholder="输入批次号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="物料名称">
              <a-select v-model:value="createForm.materialId" placeholder="选择物料" :options="materials.map(material => ({
                value: material.id,
                label: `${material.name} (${material.code})`
              }))" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来料数量">
              <a-input-number v-model:value="createForm.quantity" :min="1" style="width: 100%;" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注">
          <a-textarea v-model:value="createForm.remark" :rows="3" placeholder="输入备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 检验详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="检验详情"
      width="1000px"
      :footer="null"
    >
      <div v-if="currentRecord">
        <a-descriptions :column="2" bordered style="margin-bottom: 16px;">
          <a-descriptions-item label="检验单号">{{ currentRecord.inspectionNo }}</a-descriptions-item>
          <a-descriptions-item label="供应商">{{ currentRecord.supplierName }}</a-descriptions-item>
          <a-descriptions-item label="物料名称">{{ currentRecord.materialName }}</a-descriptions-item>
          <a-descriptions-item label="来料批次">{{ currentRecord.batchNo }}</a-descriptions-item>
          <a-descriptions-item label="来料数量">{{ currentRecord.quantity }}</a-descriptions-item>
          <a-descriptions-item label="检验状态">
            <a-tag :color="getStatusColor(currentRecord.status)">{{ getStatusText(currentRecord.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="检验员">{{ currentRecord.inspector }}</a-descriptions-item>
          <a-descriptions-item label="检验时间">{{ currentRecord.inspectionTime }}</a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ currentRecord.remark }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

// 响应式数据
const searchText = ref('')
const dateRange = ref([])
const statusFilter = ref('')
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const currentRecord = ref(null)

// 表格列定义
const columns = [
  {
    title: '检验单号',
    dataIndex: 'inspectionNo',
    key: 'inspectionNo',
  },
  {
    title: '供应商',
    dataIndex: 'supplierName',
    key: 'supplierName',
  },
  {
    title: '物料名称',
    dataIndex: 'materialName',
    key: 'materialName',
  },
  {
    title: '来料批次',
    dataIndex: 'batchNo',
    key: 'batchNo',
  },
  {
    title: '来料数量',
    dataIndex: 'quantity',
    key: 'quantity',
  },
  {
    title: '检验状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '检验时间',
    dataIndex: 'inspectionTime',
    key: 'inspectionTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

// 模拟数据
const iqcData = ref([
  {
    id: 1,
    inspectionNo: 'IQC202411001',
    supplierName: '供应商A',
    materialName: '原材料A',
    batchNo: 'B202411001',
    quantity: 1000,
    status: 'pending',
    inspectionTime: '2024-11-14 10:00:00',
    inspector: '张三',
    remark: '备注信息',
  },
  {
    id: 2,
    inspectionNo: 'IQC202411002',
    supplierName: '供应商B',
    materialName: '原材料B',
    batchNo: 'B202411002',
    quantity: 500,
    status: 'qualified',
    inspectionTime: '2024-11-14 09:30:00',
    inspector: '李四',
    remark: '检验合格',
  },
])

const suppliers = ref([
  { id: 1, name: '供应商A' },
  { id: 2, name: '供应商B' },
  { id: 3, name: '供应商C' },
])

const materials = ref([
  { id: 1, name: '原材料A', code: 'MAT001' },
  { id: 2, name: '原材料B', code: 'MAT002' },
  { id: 3, name: '原材料C', code: 'MAT003' },
])

const createForm = ref({
  supplierId: '',
  batchNo: '',
  materialId: '',
  quantity: 1,
  remark: '',
})

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 2,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

// 方法
const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

const handleDateChange = (dates: any) => {
  console.log('日期范围变化:', dates)
}

const handleStatusFilter = () => {
  console.log('状态筛选:', statusFilter.value)
}

const handleTableChange = (pagination: any, filters: any, sorter: any) => {
  console.log('表格变化:', pagination, filters, sorter)
}

const handleCreateInspection = () => {
  console.log('创建检验单:', createForm.value)
  message.success('检验单创建成功')
  showCreateModal.value = false
  // 重置表单
  createForm.value = {
    supplierId: '',
    batchNo: '',
    materialId: '',
    quantity: 1,
    remark: '',
  }
}

const viewDetail = (record: any) => {
  currentRecord.value = record
  showDetailModal.value = true
}

const startInspection = (record: any) => {
  console.log('开始检验:', record)
  message.info('开始检验')
}

const continueInspection = (record: any) => {
  console.log('继续检验:', record)
  message.info('继续检验')
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    qualified: 'green',
    unqualified: 'red',
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待检验',
    processing: '检验中',
    qualified: '合格',
    unqualified: '不合格',
  }
  return texts[status] || '未知'
}

onMounted(() => {
  console.log('IQC页面已加载')
})
</script>

<style scoped>
.iqc-page {
  padding: 24px;
}
</style>