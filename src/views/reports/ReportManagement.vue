<template>
  <div class="report-management">
    <a-row :gutter="[16, 16]">
      <a-col :span="8">
        <a-card title="月度质量报告" hoverable @click="generateReport('monthly')">
          <template #extra>
            <a-button type="primary" size="small">生成报告</a-button>
          </template>
          <p>生成月度质量统计分析报告</p>
          <a-statistic
            title="本月报告"
            :value="reportStats.monthly"
            suffix="份"
            :value-style="{ color: '#3f8600' }"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="检验报告" hoverable @click="generateReport('inspection')">
          <template #extra>
            <a-button type="primary" size="small">生成报告</a-button>
          </template>
          <p>生成各类检验报告汇总</p>
          <a-statistic
            title="今日报告"
            :value="reportStats.inspection"
            suffix="份"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="供应商报告" hoverable @click="generateReport('supplier')">
          <template #extra>
            <a-button type="primary" size="small">生成报告</a-button>
          </template>
          <p>生成供应商质量评估报告</p>
          <a-statistic
            title="本月报告"
            :value="reportStats.supplier"
            suffix="份"
            :value-style="{ color: '#722ed1' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <a-col :span="24">
        <a-card title="报告历史">
          <div style="margin-bottom: 16px;">
            <a-input-search
              v-model:value="searchText"
              placeholder="搜索报告名称"
              style="width: 300px; margin-right: 16px;"
              @search="handleSearch"
            />
            <a-range-picker v-model:value="dateRange" style="margin-right: 16px;" @change="handleDateChange" />
            <a-select v-model:value="typeFilter" placeholder="报告类型" style="width: 120px;">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="monthly">月度报告</a-select-option>
              <a-select-option value="inspection">检验报告</a-select-option>
              <a-select-option value="supplier">供应商报告</a-select-option>
            </a-select>
          </div>

          <a-table :columns="columns" :data-source="reportHistory" :pagination="pagination">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="viewReport(record)">查看</a-button>
                <a-button type="link" size="small" @click="downloadReport(record)">下载</a-button>
                <a-button type="link" size="small" @click="shareReport(record)">分享</a-button>
                <a-button type="link" size="small" danger @click="deleteReport(record)">删除</a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileTextOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons-vue'

const columns = [
  { title: '报告名称', dataIndex: 'reportName', key: 'reportName' },
  { title: '报告类型', dataIndex: 'type', key: 'type' },
  { title: '生成时间', dataIndex: 'generateTime', key: 'generateTime' },
  { title: '生成人', dataIndex: 'generator', key: 'generator' },
  { title: '文件大小', dataIndex: 'fileSize', key: 'fileSize' },
  { title: '操作', key: 'action' }
]

const reportHistory = ref([
  {
    key: '1',
    reportName: '2023年10月质量月报',
    type: 'monthly',
    generateTime: '2023-11-01 10:30',
    generator: '张三',
    fileSize: '2.5MB'
  },
  {
    key: '2',
    reportName: '发动机缸体检验报告',
    type: 'inspection',
    generateTime: '2023-11-14 14:20',
    generator: '李四',
    fileSize: '1.2MB'
  },
  {
    key: '3',
    reportName: 'Q3供应商质量报告',
    type: 'supplier',
    generateTime: '2023-10-15 09:15',
    generator: '王五',
    fileSize: '3.8MB'
  }
])

const pagination = {
  current: 1,
  pageSize: 10,
  total: 45,
  showSizeChanger: true,
  showQuickJumper: true
}

const generateMonthlyReport = () => {
  console.log('生成月度报告')
}

const generateInspectionReport = () => {
  console.log('生成检验报告')
}

const generateSupplierReport = () => {
  console.log('生成供应商报告')
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    monthly: 'blue',
    inspection: 'green',
    supplier: 'purple'
  }
  return colors[type] || 'default'
}

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    monthly: '月报',
    inspection: '检验报告',
    supplier: '供应商报告'
  }
  return texts[type] || type
}

const previewReport = (record: any) => {
  console.log('预览报告:', record)
}

const downloadReport = (record: any) => {
  console.log('下载报告:', record)
}

const shareReport = (record: any) => {
  console.log('分享报告:', record)
}
</script>

<style scoped>
.report-management {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.ant-card {
  cursor: pointer;
  transition: all 0.3s;
}

.ant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>