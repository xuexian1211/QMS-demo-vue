<template>
  <div class="msa-page">
    <a-card title="MSA测量系统分析" :bordered="false">
      <a-row :gutter="16" style="margin-bottom: 16px;">
        <a-col :span="6">
          <a-button type="primary" @click="showCreateModal = true">
            <PlusOutlined /> 新建MSA分析
          </a-button>
        </a-col>
        <a-col :span="6">
          <a-select v-model:value="selectedGauge" placeholder="选择量具" style="width: 100%;" :options="[
            { value: 'caliper', label: '游标卡尺' },
            { value: 'micrometer', label: '千分尺' },
            { value: 'cmm', label: '三坐标测量机' },
            { value: 'gage', label: '量规' }
          ]" />
        </a-col>
        <a-col :span="12">
          <a-input-search v-model:value="searchText" placeholder="搜索分析编号" />
        </a-col>
      </a-row>

      <a-table :columns="msaColumns" :data-source="msaData" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'gaugeRR'">
            <a-tag :color="getGaugeRRColor(record.gaugeRR)">{{ record.gaugeRR }}%</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
            <a-button type="link" size="small" @click="exportReport(record)">导出报告</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- MSA详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="MSA分析详情"
      width="1000px"
      :footer="null"
    >
      <div v-if="currentRecord">
        <a-descriptions :column="2" bordered style="margin-bottom: 16px;">
          <a-descriptions-item label="分析编号">{{ currentRecord.analysisNo }}</a-descriptions-item>
          <a-descriptions-item label="量具名称">{{ currentRecord.gaugeName }}</a-descriptions-item>
          <a-descriptions-item label="测量特性">{{ currentRecord.characteristic }}</a-descriptions-item>
          <a-descriptions-item label="分析日期">{{ currentRecord.analysisDate }}</a-descriptions-item>
        </a-descriptions>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-card title="Gage R&R结果" size="small">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="EV(重复性)">{{ currentRecord.ev }}%</a-descriptions-item>
                <a-descriptions-item label="AV(再现性)">{{ currentRecord.av }}%</a-descriptions-item>
                <a-descriptions-item label="Gage R&R">{{ currentRecord.gaugeRR }}%</a-descriptions-item>
                <a-descriptions-item label="PV(零件变差)">{{ currentRecord.pv }}%</a-descriptions-item>
                <a-descriptions-item label="TV(总变差)">{{ currentRecord.tv }}%</a-descriptions-item>
                <a-descriptions-item label="ndc(可区分类别数)">{{ currentRecord.ndc }}</a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card title="测量数据" size="small">
              <a-table :columns="dataColumns" :data-source="currentRecord.measureData" size="small" :pagination="false" />
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedGauge = ref('')
const searchText = ref('')
const currentRecord = ref()

const msaColumns = [
  { title: '分析编号', dataIndex: 'analysisNo', key: 'analysisNo' },
  { title: '量具名称', dataIndex: 'gaugeName', key: 'gaugeName' },
  { title: '测量特性', dataIndex: 'characteristic', key: 'characteristic' },
  { title: 'Gage R&R', dataIndex: 'gaugeRR', key: 'gaugeRR' },
  { title: 'ndc', dataIndex: 'ndc', key: 'ndc' },
  { title: '分析日期', dataIndex: 'analysisDate', key: 'analysisDate' },
  { title: '操作', key: 'action' }
]

const dataColumns = [
  { title: '零件', dataIndex: 'part', key: 'part' },
  { title: '测量员1', dataIndex: 'operator1', key: 'operator1' },
  { title: '测量员2', dataIndex: 'operator2', key: 'operator2' },
  { title: '测量员3', dataIndex: 'operator3', key: 'operator3' }
]

const msaData = ref([
  {
    key: '1',
    analysisNo: 'MSA20231114001',
    gaugeName: '游标卡尺',
    characteristic: '发动机缸体直径',
    gaugeRR: 12.5,
    ndc: 15,
    analysisDate: '2023-11-14',
    ev: 8.2,
    av: 9.3,
    pv: 95.8,
    tv: 100,
    measureData: [
      { key: '1', part: 'P001', operator1: 50.12, operator2: 50.13, operator3: 50.11 },
      { key: '2', part: 'P002', operator1: 50.15, operator2: 50.14, operator3: 50.16 }
    ]
  },
  {
    key: '2',
    analysisNo: 'MSA20231114002',
    gaugeName: '千分尺',
    characteristic: '齿轮厚度',
    gaugeRR: 8.7,
    ndc: 22,
    analysisDate: '2023-11-13',
    ev: 5.5,
    av: 6.8,
    pv: 97.2,
    tv: 100,
    measureData: []
  }
])

const getGaugeRRColor = (value: number) => {
  if (value > 30) return 'red'
  if (value > 10) return 'orange'
  return 'green'
}

const viewDetail = (record: any) => {
  currentRecord.value = record
  showDetailModal.value = true
}

const exportReport = (record: any) => {
  console.log('导出MSA报告:', record)
}
</script>

<style scoped>
.msa-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>