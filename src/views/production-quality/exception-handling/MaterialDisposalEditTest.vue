<template>
  <div class="test-edit-page">
    <h1>测试编辑页面</h1>
    
    <div class="test-section">
      <h2>返回按钮测试</h2>
      <button @click="testBack">测试返回功能</button>
      <p>当前路由: {{ $route.path }}</p>
    </div>
    
    <div class="test-section">
      <h2>Tab切换测试</h2>
      <div class="test-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="{ active: activeTab === tab.key }"
        >
          {{ tab.label }}
        </button>
      </div>
      <p>当前Tab: {{ activeTab }}</p>
      <div class="tab-content">
        <div v-if="activeTab === 'tab1'">Tab 1 内容</div>
        <div v-if="activeTab === 'tab2'">Tab 2 内容</div>
        <div v-if="activeTab === 'tab3'">Tab 3 内容</div>
      </div>
    </div>
    
    <div class="test-section">
      <h2>数据加载测试</h2>
      <p>记录ID: {{ recordId }}</p>
      <p>加载数据: {{ JSON.stringify(testData, null, 2) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const activeTab = ref('tab1')
const recordId = ref<string>('')
const testData = ref<any>({})

const tabs = [
  { key: 'tab1', label: 'Tab 1' },
  { key: 'tab2', label: 'Tab 2' },
  { key: 'tab3', label: 'Tab 3' }
]

const testBack = () => {
  console.log('测试返回功能')
  console.log('当前路由:', route.path)
  console.log('准备跳转到:', '/production-quality/exception-handling/material-disposal')
  
  try {
    router.replace('/production-quality/exception-handling/material-disposal')
    console.log('路由跳转命令已发送')
  } catch (error) {
    console.error('路由跳转失败:', error)
    window.location.href = '/production-quality/exception-handling/material-disposal'
  }
}

onMounted(() => {
  console.log('测试页面已挂载')
  recordId.value = route.query.id as string || '未找到ID'
  
  // 模拟数据加载
  if (recordId.value && recordId.value !== '未找到ID') {
    testData.value = {
      id: recordId.value,
      name: '测试数据',
      status: 'loaded'
    }
  }
  
  console.log('记录ID:', recordId.value)
  console.log('测试数据:', testData.value)
})
</script>

<style scoped>
.test-edit-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.test-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.test-tabs button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
}

.test-tabs button.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.tab-content {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #40a9ff;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>