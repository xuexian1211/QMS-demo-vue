<template>
  <div class="customer-complaint">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索投诉单号、客户名称"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-range-picker v-model:value="dateRange" style="margin-right: 16px;" @change="handleDateChange" />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="pending">待处理</a-select-option>
          <a-select-option value="processing">处理中</a-select-option>
          <a-select-option value="completed">已完成</a-select-option>
        </a-select>
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新建投诉单
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="complaintData" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-if="column.key === 'urgency'">
          <a-tag :color="getUrgencyColor(record.urgency)">{{ getUrgencyText(record.urgency) }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">查看详情</a-button>
          <a-button type="link" size="small" @click="containment24h(record)" v-if="record.status === 'pending'">24小时围堵</a-button>
        </template>
      </template>
    </a-table>

    <!-- 新建投诉单模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新建客户投诉单"
      width="800px"
      @ok="handleCreateComplaint"
    >
      <a-form :model="createForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客户名称">
              <a-select v-model:value="createForm.customerName" placeholder="选择客户">
                <a-select-option value="faw">一汽大众</a-select-option>
                <a-select-option value="dfl">东风汽车</a-select-option>
                <a-select-option value="geely">吉利汽车</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="紧急程度">
              <a-select v-model:value="createForm.urgency" placeholder="选择紧急程度">
                <a-select-option value="low">一般</a-select-option>
                <a-select-option value="medium">紧急</a-select-option>
                <a-select-option value="high">非常紧急</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="产品名称">
              <a-input v-model:value="createForm.productName" placeholder="输入产品名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="批次号">
              <a-input v-model:value="createForm.batchNo" placeholder="输入批次号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="问题描述">
          <a-textarea v-model:value="createForm.description" :rows="4" placeholder="详细描述客户投诉的问题" />
        </a-form-item>
        <a-form-item label="客户要求">
          <a-textarea v-model:value="createForm.requirement" :rows="3" placeholder="输入客户的具体要求" />
        </a-form-item>
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
  { title: '投诉单号', dataIndex: 'complaintNo', key: 'complaintNo' },
  { title: '客户名称', dataIndex: 'customerName', key: 'customerName' },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
  { title: '紧急程度', dataIndex: 'urgency', key: 'urgency' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '投诉时间', dataIndex: 'complaintTime', key: 'complaintTime' },
  { title: '处理人', dataIndex: 'processor', key: 'processor' },
  { title: '操作', key: 'action' }
]

const complaintData = ref([
  {
    key: '1',
    complaintNo: 'CC20231114001',
    customerName: '一汽大众',
    productName: '发动机总成',
    batchNo: 'B20231101001',
    urgency: 'high',
    status: 'processing',
    complaintTime: '2023-11-14 08:30',
    processor: '张三'
  },
  {
    key: '2',
    complaintNo: 'CC20231114002',
    customerName: '东风汽车',
    productName: '变速箱总成',
    batchNo: 'B20231102002',
    urgency: 'medium',
    status: 'pending',
    complaintTime: '2023-11-14 10:15',
    processor: ''
  },
  {
    key: '3',
    complaintNo: 'CC20231114003',
    customerName: '吉利汽车',
    productName: '制动系统',
    batchNo: 'B20231103003',
    urgency: 'low',
    status: 'completed',
    complaintTime: '2023-11-13 14:20',
    processor: '李四'
  }
])

const createForm = reactive({
  customerName: '',
  urgency: '',
  productName: '',
  batchNo: '',
  description: '',
  requirement: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

const handleDateChange = () => {
  console.log('日期范围:', dateRange.value)
}

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  }
  return texts[status] || status
}

const getUrgencyColor = (urgency: string) => {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red'
  }
  return colors[urgency] || 'default'
}

const getUrgencyText = (urgency: string) => {
  const texts = {
    low: '一般',
    medium: '紧急',
    high: '非常紧急'
  }
  return texts[urgency] || urgency
}

const viewDetail = (record: any) => {
  console.log('查看详情:', record)
}

const containment24h = (record: any) => {
  console.log('24小时围堵:', record)
}

const handleCreateComplaint = () => {
  console.log('创建投诉单:', createForm)
  showCreateModal.value = false
}
</script>

<style scoped>
.customer-complaint {
  padding: 24px;
  background: #fff;
}
</style>