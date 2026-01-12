<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack" class="back-button">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </a-button>
        <div class="title-section">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="handleSave" :loading="saving" v-if="!isView">保存</a-button>
      </div>
    </div>

    <a-card size="small" class="form-card">
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="方法名称" name="methodName">
              <a-input v-model:value="form.methodName" :disabled="isView" placeholder="请输入方法名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="附件ID" name="attachmentId">
              <a-input v-model:value="form.attachmentId" :disabled="isView" placeholder="例如：FILE_SOP_001.pdf" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="操作步骤描述" name="operationText">
          <a-textarea v-model:value="form.operationText" :disabled="isView" :rows="6" placeholder="请输入操作步骤" />
        </a-form-item>
        <a-space>
          <a-button @click="handleBack">返回列表</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const formRef = ref()
const saving = ref(false)
const isView = computed(() => route.path.includes('/view/'))
const pageTitle = computed(() => {
  if (isView.value) return '检验方法-查看'
  return route.params.id ? '检验方法-编辑' : '检验方法-新增'
})

const form = reactive({
  methodName: '',
  operationText: '',
  attachmentId: ''
})

const rules: any = {
  methodName: [{ required: true, message: '请输入方法名称', trigger: 'blur' }]
}

const handleBack = () => {
  router.push('/inspection-model/insp-methods')
}

const handleSave = async () => {
  try {
    saving.value = true
    await formRef.value?.validate()
    message.success('保存成功')
    router.push('/inspection-model/insp-methods')
  } catch (e) {
    message.error('请完善必填项')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const id = route.params.id as string | undefined
  if (id) {
    Object.assign(form, { methodName: '通用卡尺测量法', operationText: '1. 校零 2. 清洁工件 3. 测量关键尺寸 4.记录', attachmentId: 'FILE_SOP_001.pdf' })
  }
})
</script>

<style scoped>
.page-container { padding:24px; background:#f5f5f5; min-height:calc(100vh - 60px) }
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
.header-left { display:flex; align-items:center; gap:8px }
.back-button { padding:0 }
.page-title { margin:0; font-size:18px; font-weight:600 }
.form-card :deep(.ant-card-body) { padding:16px }
@media (max-width:768px){ .page-container{ padding:8px } }
</style>

