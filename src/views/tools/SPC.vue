<template>
  <div class="spc-page">
    <a-row :gutter="[16, 16]">
      <a-col :span="8">
        <a-card title="控制图类型选择">
          <a-select v-model:value="chartType" style="width: 100%; margin-bottom: 16px;" :options="[
            { value: 'xbar', label: 'Xbar-R图' },
            { value: 'p', label: 'P图' },
            { value: 'c', label: 'C图' },
            { value: 'u', label: 'U图' }
          ]" />
          <a-select v-model:value="selectedProduct" placeholder="选择产品" style="width: 100%; margin-bottom: 16px;" :options="[
            { value: 'engine', label: '发动机缸体' },
            { value: 'gear', label: '变速箱齿轮' },
            { value: 'brake', label: '刹车片' }
          ]" />
          <a-button type="primary" block @click="generateChart">生成控制图</a-button>
        </a-card>
      </a-col>
      <a-col :span="16">
        <a-card title="SPC控制图">
          <div style="height: 400px; display: flex; align-items: center; justify-content: center; color: #999;">
            <div>
              <div style="font-size: 18px; margin-bottom: 16px;">控制图显示区域</div>
              <div>选择产品和参数后生成SPC控制图</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <a-col :span="24">
        <a-card title="过程能力分析">
          <a-table :columns="capabilityColumns" :data-source="capabilityData" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'cpk'">
                <a-tag :color="getCpkColor(record.cpk)">{{ record.cpk }}</a-tag>
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

const chartType = ref('xbar')
const selectedProduct = ref('')

const capabilityColumns = [
  { title: '参数名称', dataIndex: 'parameter', key: 'parameter' },
  { title: '规格下限', dataIndex: 'lsl', key: 'lsl' },
  { title: '规格上限', dataIndex: 'usl', key: 'usl' },
  { title: '过程均值', dataIndex: 'mean', key: 'mean' },
  { title: '标准差', dataIndex: 'stdDev', key: 'stdDev' },
  { title: 'Cp', dataIndex: 'cp', key: 'cp' },
  { title: 'Cpk', dataIndex: 'cpk', key: 'cpk' },
  { title: '能力等级', dataIndex: 'grade', key: 'grade' }
]

const capabilityData = ref([
  {
    key: '1',
    parameter: '缸体内径',
    lsl: '85.00',
    usl: '85.05',
    mean: '85.025',
    stdDev: '0.008',
    cp: '2.08',
    cpk: '1.98',
    grade: 'A+'
  },
  {
    key: '2',
    parameter: '表面粗糙度',
    lsl: '0.8',
    usl: '1.2',
    mean: '1.0',
    stdDev: '0.1',
    cp: '1.33',
    cpk: '1.25',
    grade: 'A'
  }
])

const generateChart = () => {
  console.log('生成控制图:', chartType.value, selectedProduct.value)
}

const getCpkColor = (cpk: string) => {
  const value = parseFloat(cpk)
  if (value >= 1.67) return 'green'
  if (value >= 1.33) return 'blue'
  if (value >= 1.0) return 'orange'
  return 'red'
}
</script>

<style scoped>
.spc-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>