<template>
  <div class="insp-scheme-edit-simple">
    <h1>检验方案编辑页面</h1>
    <p>如果您能看到这个页面，说明路由配置正确。</p>
    <p>当前路由参数 ID: {{ route.params.id || '新建模式' }}</p>
    <a-button type="primary" @click="handleBack">返回列表</a-button>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const handleBack = () => {
  router.push('/inspection-model/insp-plans')
}

console.log('InspSchemeEdit 页面已加载')
console.log('路由参数:', route.params)
</script>

<style scoped>
.insp-scheme-edit-simple {
  padding: 24px;
}
</style>
