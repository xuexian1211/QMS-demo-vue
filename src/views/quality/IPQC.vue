<template>
  <div class="ipqc-page">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索检验单号、工序名称"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="lineFilter" placeholder="产线筛选" style="width: 150px; margin-right: 16px;" :options="[
          { value: '', label: '全部产线' },
          { value: 'line1', label: '发动机生产线' },
          { value: 'line2', label: '变速箱生产线' },
          { value: 'line3', label: '底盘生产线' }
        ]" />
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新建检验单
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="ipqcData" :pagination="pagination">
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
      title="新建IPQC检验单"
      width="800px"
      @ok="handleCreateInspection"
    >
      <a-form :model="createForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="产线">
              <a-select v-model:value="createForm.line" placeholder="选择产线" :options="[
                { value: 'line1', label: '发动机生产线' },
                { value: 'line2', label: '变速箱生产线' },
                { value: 'line3', label: '底盘生产线' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工序">
              <a-input v-model:value="createForm.process" placeholder="输入工序名称" />
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
const lineFilter = ref('')
const showCreateModal = ref(false)

const columns = [
  { title: '检验单号', dataIndex: 'inspectionNo', key: 'inspectionNo' },
  { title: '产线', dataIndex: 'line', key: 'line' },
  { title: '工序', dataIndex: 'process', key: 'process' },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '检验数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '检验员', dataIndex: 'inspector', key: 'inspector' },
  { title: '检验时间', dataIndex: 'inspectionDate', key: 'inspectionDate' },
  { title: '操作', key: 'action' }
]

const ipqcData = ref([
  {
    key: '1',
    inspectionNo: 'IPQC20231114001',
    line: '发动机生产线',
    process: '缸体加工',
    productName: '发动机缸体',
    quantity: 50,
    status: 'qualified',
    inspector: '张三',
    inspectionDate: '2023-11-14 16:30'
  },
  {
    key: '2',
    inspectionNo: 'IPQC20231114002',
    line: '变速箱生产线',
    process: '齿轮装配',
    productName: '变速箱齿轮',
    quantity: 30,
    status: 'processing',
    inspector: '李四',
    inspectionDate: '2023-11-14 17:00'
  }
])

const createForm = reactive({
  line: '',
  process: '',
  productName: '',
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

const handleLineFilter = () => {
  console.log('产线筛选:', lineFilter.value)
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
.ipqc-page {
  padding: 24px;
  background: #fff;
}
</style>