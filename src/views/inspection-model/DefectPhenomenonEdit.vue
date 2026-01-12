<template>
  <div class="page-container">
    <a-card title="不良现象" size="small" class="form-card">
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="6"><a-form-item label="分类代码" name="categoryCode"><a-input
                v-model:value="form.categoryCode" /></a-form-item></a-col>
          <a-col :span="6"><a-form-item label="分类名称" name="categoryName"><a-input
                v-model:value="form.categoryName" /></a-form-item></a-col>
          <a-col :span="6"><a-form-item label="父级ID" name="parentId"><a-input-number v-model:value="form.parentId"
                style="width:100%" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="描述" name="description"><a-input
                v-model:value="form.description" /></a-form-item></a-col>
        </a-row>
        <a-space>
          <a-button type="primary" @click="submit">提交</a-button>
          <a-button @click="cancel">返回列表</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { message } from 'ant-design-vue'

  const router = useRouter()
  const route = useRoute()
  const formRef = ref()
  const form = reactive({ categoryCode: '', categoryName: '', parentId: null as number | null, description: '' })
  const rules: any = {
    categoryCode: [{ required: true, message: '请输入分类代码', trigger: 'blur' }],
    categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
  }
  const submit = async () => { try { await formRef.value?.validate(); message.success('提交成功'); router.push('/inspection-model/defect-categories') } catch { message.error('请完善必填项') } }
  const cancel = () => router.push('/inspection-model/defect-categories')
  onMounted(() => { const id = route.params.id as string | undefined; if (id) { Object.assign(form, { categoryCode: 'DCAT-APP', categoryName: '外观缺陷', parentId: null, description: '表面相关缺陷' }) } })
</script>

<style scoped>
  .page-container {
    padding: 24px;
    background: #f5f5f5;
    min-height: calc(100vh - 60px)
  }

  .form-card :deep(.ant-card-body) {
    padding: 16px
  }
</style>