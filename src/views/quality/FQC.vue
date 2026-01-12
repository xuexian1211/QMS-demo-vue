<template>
  <div class="fqc-page">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索检验单号、产品名称"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-range-picker v-model:value="dateRange" style="margin-right: 16px;" @change="handleDateChange" />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;" :options="[
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

    <a-table :columns="columns" :data-source="fqcData" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
          <a-button type="link" size="small" v-if="record.status === 'pending'" @click="startInspection(record)">开始检验</a-button>
        </template>
      </template>
    </a-table>

    <!-- 新建检验单模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新建FQC检验单"
      width="800px"
      @ok="handleCreateInspection"
    >
      <a-form :model="createForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="产品名称">
              <a-select v-model:value="createForm.productName" placeholder="选择产品" :options="[
                { value: 'engine', label: '发动机总成' },
                { value: 'transmission', label: '变速箱总成' },
                { value: 'brake', label: '制动系统总成' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="产品型号">
              <a-input v-model:value="createForm.productModel" placeholder="输入产品型号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="生产批次">
              <a-input v-model:value="createForm.batchNo" placeholder="输入批次号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="检验数量">
              <a-input-number v-model:value="createForm.quantity" :min="1" style="width: 100%;" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const searchText = ref('')
const dateRange = ref([])
const statusFilter = ref('')
const showCreateModal = ref(false)

const columns = [
  { title: '检验单号', dataIndex: 'inspectionNo', key: 'inspectionNo' },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '产品型号', dataIndex: 'productModel', key: 'productModel' },
  { title: '生产批次', dataIndex: 'batchNo', key: 'batchNo' },
  { title: '检验数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '检验员', dataIndex: 'inspector', key: 'inspector' },
  { title: '检验时间', dataIndex: 'inspectionDate', key: 'inspectionDate' },
  { title: '操作', key: 'action' }
]

const fqcData = ref([
  {
    key: '1',
    inspectionNo: 'FQC20231114001',
    productName: '发动机总成',
    productModel: 'EA888-2.0T',
    batchNo: 'B20231114001',
    quantity: 50,
    status: 'qualified',
    inspector: '李四',
    inspectionDate: '2023-11-14 14:30'
  },
  {
    key: '2',
    inspectionNo: 'FQC20231114002',
    productName: '变速箱总成',
    productModel: 'DQ380-7DCT',
    batchNo: 'B20231114002',
    quantity: 30,
    status: 'pending',
    inspector: '张三',
    inspectionDate: '2023-11-14 15:00'
  }
])

const createForm = reactive({
  productName: '',
  productModel: '',
  batchNo: '',
  quantity: 1
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 2,
  showSizeChanger: true,
  showQuickJumper: true
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

const handleDateChange = () => {
  console.log('日期范围:', dateRange.value)
}

const handleStatusFilter = () => {
  console.log('状态筛选:', statusFilter.value)
}

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'orange',
    processing: 'blue',
    qualified: 'green',
    unqualified: 'red'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts = {
    pending: '待检验',
    processing: '检验中',
    qualified: '合格',
    unqualified: '不合格'
  }
  return texts[status] || status
}

const viewDetail = (record: any) => {
  console.log('查看详情:', record)
}

const startInspection = (record: any) => {
  console.log('开始检验:', record)
}

const handleCreateInspection = () => {
  console.log('创建检验单:', createForm)
  showCreateModal.value = false
}
</script>

<style scoped>
.fqc-page {
  padding: 24px;
  background: #fff;
}
</style>