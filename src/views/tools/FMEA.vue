<template>
  <div class="fmea-page">
    <a-card title="FMEA失效模式分析" :bordered="false">
      <a-row :gutter="16" style="margin-bottom: 16px;">
        <a-col :span="6">
          <a-button type="primary" @click="showCreateModal = true">
            <PlusOutlined /> 新建FMEA
          </a-button>
        </a-col>
        <a-col :span="6">
          <a-select v-model:value="selectedType" placeholder="FMEA类型" style="width: 100%;" :options="[
            { value: 'design', label: '设计FMEA' },
            { value: 'process', label: '过程FMEA' },
            { value: 'system', label: '系统FMEA' }
          ]" />
        </a-col>
        <a-col :span="12">
          <a-input-search v-model:value="searchText" placeholder="搜索产品/工序" />
        </a-col>
      </a-row>

      <a-table :columns="fmeaColumns" :data-source="fmeaData" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rpn'">
            <a-tag :color="getRpnColor(record.rpn)">{{ record.rpn }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
            <a-button type="link" size="small" @click="editFmea(record)">编辑</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- FMEA详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="FMEA分析详情"
      width="1200px"
      :footer="null"
    >
      <div v-if="currentRecord">
        <a-descriptions :column="2" bordered style="margin-bottom: 16px;">
          <a-descriptions-item label="产品/工序">{{ currentRecord.product }}</a-descriptions-item>
          <a-descriptions-item label="FMEA类型">{{ currentRecord.type }}</a-descriptions-item>
          <a-descriptions-item label="版本">{{ currentRecord.version }}</a-descriptions-item>
          <a-descriptions-item label="负责人">{{ currentRecord.owner }}</a-descriptions-item>
        </a-descriptions>

        <a-table :columns="detailColumns" :data-source="currentRecord.details" size="small" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedType = ref('')
const searchText = ref('')
const currentRecord = ref()

const fmeaColumns = [
  { title: '产品/工序', dataIndex: 'product', key: 'product' },
  { title: 'FMEA类型', dataIndex: 'type', key: 'type' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '最高RPN', dataIndex: 'rpn', key: 'rpn' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
  { title: '操作', key: 'action' }
]

const detailColumns = [
  { title: '工序', dataIndex: 'process', key: 'process' },
  { title: '失效模式', dataIndex: 'failureMode', key: 'failureMode' },
  { title: '失效后果', dataIndex: 'failureEffect', key: 'failureEffect' },
  { title: '严重度(S)', dataIndex: 'severity', key: 'severity' },
  { title: '发生率(O)', dataIndex: 'occurrence', key: 'occurrence' },
  { title: '探测度(D)', dataIndex: 'detection', key: 'detection' },
  { title: 'RPN', dataIndex: 'rpn', key: 'rpn' },
  { title: '建议措施', dataIndex: 'action', key: 'action' }
]

const fmeaData = ref([
  {
    key: '1',
    product: '发动机缸体铸造',
    type: '过程FMEA',
    version: 'V2.1',
    rpn: 120,
    owner: '张工程师',
    updateTime: '2023-11-14',
    details: [
      {
        key: '1',
        process: '模具准备',
        failureMode: '模具温度不均',
        failureEffect: '铸件气孔',
        severity: 7,
        occurrence: 4,
        detection: 5,
        rpn: 140,
        action: '优化模具冷却系统'
      }
    ]
  },
  {
    key: '2',
    product: '变速箱齿轮加工',
    type: '设计FMEA',
    version: 'V1.5',
    rpn: 80,
    owner: '李工程师',
    updateTime: '2023-11-13',
    details: []
  }
])

const getRpnColor = (rpn: number) => {
  if (rpn >= 100) return 'red'
  if (rpn >= 50) return 'orange'
  return 'green'
}

const viewDetail = (record: any) => {
  currentRecord.value = record
  showDetailModal.value = true
}

const editFmea = (record: any) => {
  console.log('编辑FMEA:', record)
}
</script>

<style scoped>
.fmea-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>