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
          <a-col :span="8">
            <a-form-item label="检查项编码" name="code">
              <a-input v-model:value="form.code" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="检查项名称" name="name">
              <a-input v-model:value="form.name" :disabled="isView" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="分类" name="category">
              <a-select v-model:value="form.category" :disabled="isView" :options="categoryOptions" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="数据类型" name="dataType">
              <a-select v-model:value="form.dataType" :disabled="isView" :options="dataTypeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="默认方法ID" name="defaultMethodId">
              <a-input-number v-model:value="form.defaultMethodId" :disabled="isView" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="默认量具类型ID" name="defaultInstTypeId">
              <a-input-number v-model:value="form.defaultInstTypeId" :disabled="isView" style="width:100%" />
            </a-form-item>
          </a-col>
        </a-row>
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
  if (isView.value) return '检验项目-查看'
  return route.params.id ? '检验项目-编辑' : '检验项目-新增'
})

const categoryOptions = [
  { value: '尺寸', label: '尺寸' },
  { value: '外观', label: '外观' },
  { value: '理化', label: '理化' },
  { value: '功能', label: '功能' }
]
const dataTypeOptions = [
  { value: 'QUANTITATIVE', label: '计量' },
  { value: 'QUALITATIVE', label: '计数' }
]

const form = reactive({
  code: '',
  name: '',
  category: undefined as any,
  dataType: undefined as any,
  defaultMethodId: null as number | null,
  defaultInstTypeId: null as number | null
})

const rules: any = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
}

const handleBack = () => {
  router.push('/inspection-model/inspection-items')
}

const handleSave = async () => {
  try {
    saving.value = true
    await formRef.value?.validate()
    message.success('保存成功')
    router.push('/inspection-model/inspection-items')
  } catch (e) {
    message.error('请完善必填项')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const id = route.params.id as string | undefined
  if (id) {
    Object.assign(form, { code: 'CHAR-DIM-001', name: '壳体A面平面度', category: '尺寸', dataType: 'QUANTITATIVE', defaultMethodId: 201, defaultInstTypeId: 301 })
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

