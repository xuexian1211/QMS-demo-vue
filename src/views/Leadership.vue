<template>
  <div class="leadership">
    <a-row :gutter="[16, 16]">
      <a-col :span="8">
        <a-card title="质量KPI">
          <div style="height: 300px; display: flex; align-items: center; justify-content: center; color: #999;">
            KPI指标图表
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="供应商排名">
          <a-table :columns="supplierColumns" :data-source="supplierData" size="small" :pagination="false" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="质量成本">
          <div style="height: 300px; display: flex; align-items: center; justify-content: center; color: #999;">
            成本分析图表
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <a-col :span="24">
        <a-card title="质量驾驶舱">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-statistic title="月度合格率" :value="98.7" suffix="%" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="客诉处理及时率" :value="95.2" suffix="%" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="供应商审核完成率" :value="87.5" suffix="%" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="质量改进项目" :value="12" suffix="个" />
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const supplierColumns = [
  {
    title: '排名',
    dataIndex: 'rank',
    key: 'rank'
  },
  {
    title: '供应商',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '合格率',
    dataIndex: 'rate',
    key: 'rate'
  }
]

const supplierData = ref([
  { key: '1', rank: 1, name: '一汽铸造', rate: '99.2%' },
  { key: '2', rank: 2, name: '东风齿轮', rate: '98.8%' },
  { key: '3', rank: 3, name: '上汽制动', rate: '97.5%' }
])
</script>

<style scoped>
.leadership {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>