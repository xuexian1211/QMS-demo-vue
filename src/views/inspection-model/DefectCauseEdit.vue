<template>
  <div class="page-container">
    <a-card title="不良原因" size="small" class="form-card">
      <a-tabs>
        <a-tab-pane key="base" tab="基本信息">
          <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="6"><a-form-item label="原因代码" name="code"><a-input v-model:value="form.code" /></a-form-item></a-col>
              <a-col :span="6"><a-form-item label="原因名称" name="name"><a-input v-model:value="form.name" /></a-form-item></a-col>
              <a-col :span="6"><a-form-item label="父级ID" name="parentId"><a-input-number v-model:value="form.parentId" style="width:100%" /></a-form-item></a-col>
              <a-col :span="6"><a-form-item label="原因大类(5M1E)" name="category"><a-select v-model:value="form.category"><a-select-option value="Man">Man</a-select-option><a-select-option value="Machine">Machine</a-select-option><a-select-option value="Material">Material</a-select-option><a-select-option value="Method">Method</a-select-option><a-select-option value="Measurement">Measurement</a-select-option><a-select-option value="Environment">Environment</a-select-option></a-select></a-form-item></a-col>
              <a-col :span="6"><a-form-item label="是否高频原因" name="isHighFrequency"><a-switch v-model:checked="form.isHighFrequency" /></a-form-item></a-col>
            </a-row>
            <a-space>
              <a-button type="primary" @click="submit">提交</a-button>
              <a-button @click="cancel">返回列表</a-button>
            </a-space>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="extra" tab="附加信息">
          <div class="extra-holder"></div>
        </a-tab-pane>
      </a-tabs>
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
const form = reactive({ code:'', name:'', parentId: null as number|null, category: undefined as any, isHighFrequency: false })
const rules: any = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择原因大类', trigger: 'change' }]
}
const submit = async () => { try { await formRef.value?.validate(); message.success('提交成功'); router.push('/inspection-model/defect-causes') } catch { message.error('请完善必填项') } }
const cancel = () => router.push('/inspection-model/defect-causes')
onMounted(() => { const id = route.params.id as string|undefined; if (id) { Object.assign(form, { code:'CA-MAC-AGING', name:'设备老化', parentId:500, category:'Machine', isHighFrequency:true }) } })
</script>

<style scoped>
.page-container { padding:24px; background:#f5f5f5; min-height:calc(100vh - 60px) }
.form-card :deep(.ant-card-body) { padding:16px }
.extra-holder { min-height:120px }
</style>
