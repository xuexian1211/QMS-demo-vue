<template>
  <div class="dashboard">
    <a-row :gutter="[16, 16]">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="今日检验单"
            :value="1256"
            :precision="0"
            suffix="单"
            :value-style="{ color: '#3f8600' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="待处理客诉"
            :value="23"
            :precision="0"
            suffix="件"
            :value-style="{ color: '#cf1322' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="合格率"
            :value="98.5"
            :precision="1"
            suffix="%"
            :value-style="{ color: '#3f8600' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="供应商数量"
            :value="186"
            :precision="0"
            suffix="家"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <a-col :span="12">
        <a-card title="质量趋势" :bordered="false">
          <div style="height: 300px; display: flex; align-items: center; justify-content: center; color: #999;">
            质量趋势图表区域
          </div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="待办任务" :bordered="false">
          <a-list :data-source="todoList" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <span>{{ item.title }}</span>
                  </template>
                  <template #description>
                    <span>{{ item.description }}</span>
                  </template>
                </a-list-item-meta>
                <div>{{ item.time }}</div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const todoList = ref([
  {
    title: 'IQC检验单待处理',
    description: '发动机缸体批次检验',
    time: '2小时前'
  },
  {
    title: '客诉24小时围堵',
    description: '变速箱异响问题处理',
    time: '3小时前'
  },
  {
    title: '供应商审核计划',
    description: '一汽铸造年度审核',
    time: '1天前'
  }
])
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>