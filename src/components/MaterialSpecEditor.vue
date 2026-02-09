<template>
  <div class="material-spec-editor">
    <a-card title="物料检验规格" :bordered="false">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><PlusOutlined /></template>
            添加规格
          </a-button>
          <a-button @click="handleBatchImport">
            <template #icon><ImportOutlined /></template>
            批量导入
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'inspItemName'">
            <a-select
              v-model:value="record.inspItemCode"
              placeholder="请选择检验项目"
              show-search
              :filter-option="filterOption"
              @change="(val) => handleItemChange(val, record)"
              style="width: 200px"
            >
              <a-select-option v-for="item in availableItems" :key="item.code" :value="item.code">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'dataType'">
            <a-select v-model:value="record.dataType" style="width: 100px" @change="handleDataTypeChange(record)">
              <a-select-option value="quantitative">计量型</a-select-option>
              <a-select-option value="qualitative">计数型</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'targetValue'">
            <a-input-number
              v-if="record.dataType === 'quantitative'"
              v-model:value="record.targetValue"
              :precision="4"
              style="width: 120px"
            />
          </template>
          <template v-else-if="column.key === 'upperLimit'">
            <a-input-number
              v-if="record.dataType === 'quantitative'"
              v-model:value="record.upperLimit"
              :precision="4"
              style="width: 120px"
            />
          </template>
          <template v-else-if="column.key === 'lowerLimit'">
            <a-input-number
              v-if="record.dataType === 'quantitative'"
              v-model:value="record.lowerLimit"
              :precision="4"
              style="width: 120px"
            />
          </template>
          <template v-else-if="column.key === 'uom'">
            <a-input
              v-if="record.dataType === 'quantitative'"
              v-model:value="record.uom"
              placeholder="单位"
              style="width: 80px"
            />
          </template>
          <template v-else-if="column.key === 'standardText'">
            <a-input
              v-if="record.dataType === 'qualitative'"
              v-model:value="record.standardText"
              placeholder="标准描述"
              style="width: 200px"
            />
          </template>
          <template v-else-if="column.key === 'expectedValue'">
            <a-input
              v-if="record.dataType === 'qualitative'"
              v-model:value="record.expectedValue"
              placeholder="期望值"
              style="width: 100px"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      width="700px"
    >
      <a-form :model="currentSpec" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="检验项目" required>
          <a-select
            v-model:value="currentSpec.inspItemCode"
            placeholder="请选择检验项目"
            show-search
            :filter-option="filterOption"
            @change="handleModalItemChange"
          >
            <a-select-option v-for="item in availableItems" :key="item.code" :value="item.code">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="数据类型" required>
          <a-radio-group v-model:value="currentSpec.dataType">
            <a-radio value="quantitative">计量型</a-radio>
            <a-radio value="qualitative">计数型</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 计量型字段 -->
        <template v-if="currentSpec.dataType === 'quantitative'">
          <a-form-item label="目标值">
            <a-input-number v-model:value="currentSpec.targetValue" :precision="4" style="width: 100%" />
          </a-form-item>
          <a-form-item label="上限(USL)" required>
            <a-input-number v-model:value="currentSpec.upperLimit" :precision="4" style="width: 100%" />
          </a-form-item>
          <a-form-item label="下限(LSL)" required>
            <a-input-number v-model:value="currentSpec.lowerLimit" :precision="4" style="width: 100%" />
          </a-form-item>
          <a-form-item label="单位">
            <a-input v-model:value="currentSpec.uom" placeholder="如: mm, kg" />
          </a-form-item>
        </template>

        <!-- 计数型字段 -->
        <template v-else>
          <a-form-item label="标准描述" required>
            <a-textarea v-model:value="currentSpec.standardText" :rows="3" placeholder="如: 表面无划痕" />
          </a-form-item>
          <a-form-item label="标准代码">
            <a-input v-model:value="currentSpec.standardCode" placeholder="如: PANTONE-877C" />
          </a-form-item>
          <a-form-item label="期望值">
            <a-input v-model:value="currentSpec.expectedValue" placeholder="如: OK, PASS" />
          </a-form-item>
          <a-form-item label="样板图">
            <a-upload>
              <a-button>
                <template #icon><UploadOutlined /></template>
                上传图片
              </a-button>
            </a-upload>
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  ImportOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import type { MaterialSpec, InspectionItem } from '@/types'

interface Props {
  materialId: string
  schemeDetails?: Array<{ inspItemCode: string; inspItemName: string }>
}

const props = defineProps<Props>()
const emit = defineEmits(['change'])

const dataSource = ref<MaterialSpec[]>([])
const loading = ref(false)

// 可用的检验项目（从方案明细中获取）
const availableItems = computed(() => {
  return props.schemeDetails?.map(d => ({
    code: d.inspItemCode,
    name: d.inspItemName
  })) || []
})

// 表格列定义
const columns = [
  { title: '检验项目', key: 'inspItemName', width: 200 },
  { title: '数据类型', key: 'dataType', width: 120 },
  { title: '目标值', key: 'targetValue', width: 120 },
  { title: '上限(USL)', key: 'upperLimit', width: 120 },
  { title: '下限(LSL)', key: 'lowerLimit', width: 120 },
  { title: '单位', key: 'uom', width: 80 },
  { title: '标准描述', key: 'standardText', width: 200 },
  { title: '期望值', key: 'expectedValue', width: 100 },
  { title: '操作', key: 'action', fixed: 'right', width: 150 }
]

// 弹窗相关
const modalVisible = ref(false)
const modalTitle = ref('添加规格')
const currentSpec = reactive<Partial<MaterialSpec>>({
  dataType: 'quantitative'
})

// 添加规格
const handleAdd = () => {
  modalTitle.value = '添加规格'
  Object.assign(currentSpec, {
    materialId: props.materialId,
    dataType: 'quantitative',
    sortOrder: dataSource.value.length + 1
  })
  modalVisible.value = true
}

// 编辑规格
const handleEdit = (record: MaterialSpec) => {
  modalTitle.value = '编辑规格'
  Object.assign(currentSpec, record)
  modalVisible.value = true
}

// 删除规格
const handleDelete = (record: MaterialSpec) => {
  const index = dataSource.value.findIndex(s => s.id === record.id)
  if (index > -1) {
    dataSource.value.splice(index, 1)
    emit('change', dataSource.value)
  }
}

// 弹窗确认
const handleModalOk = () => {
  if (!currentSpec.inspItemCode) {
    message.warning('请选择检验项目')
    return
  }

  if (currentSpec.dataType === 'quantitative') {
    if (currentSpec.upperLimit === undefined || currentSpec.lowerLimit === undefined) {
      message.warning('请填写上下限')
      return
    }
  } else {
    if (!currentSpec.standardText) {
      message.warning('请填写标准描述')
      return
    }
  }

  if (currentSpec.id) {
    // 更新
    const index = dataSource.value.findIndex(s => s.id === currentSpec.id)
    if (index > -1) {
      dataSource.value[index] = { ...currentSpec } as MaterialSpec
    }
  } else {
    // 新增
    dataSource.value.push({ ...currentSpec, id: Date.now().toString() } as MaterialSpec)
  }

  emit('change', dataSource.value)
  modalVisible.value = false
}

// 项目变化
const handleItemChange = (code: string, record: MaterialSpec) => {
  const item = availableItems.value.find(i => i.code === code)
  if (item) {
    record.inspItemName = item.name
  }
}

// 弹窗项目变化
const handleModalItemChange = (code: string) => {
  const item = availableItems.value.find(i => i.code === code)
  if (item) {
    currentSpec.inspItemName = item.name
  }
}

// 数据类型变化
const handleDataTypeChange = (record: MaterialSpec) => {
  // 清空不相关字段
  if (record.dataType === 'quantitative') {
    record.standardText = undefined
    record.standardCode = undefined
    record.expectedValue = undefined
  } else {
    record.targetValue = undefined
    record.upperLimit = undefined
    record.lowerLimit = undefined
    record.uom = undefined
  }
}

// 批量导入
const handleBatchImport = () => {
  message.info('批量导入功能开发中')
}

// 过滤选项
const filterOption = (input: string, option: any) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 监听物料变化，重新加载数据
watch(() => props.materialId, () => {
  // TODO: 加载该物料的规格数据
  dataSource.value = []
})

// 暴露方法给父组件
defineExpose({
  getData: () => dataSource.value,
  setData: (data: MaterialSpec[]) => {
    dataSource.value = data
  }
})
</script>

<style scoped lang="less">
.material-spec-editor {
  // 样式
}
</style>
