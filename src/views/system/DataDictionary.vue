<template>
  <div class="data-dictionary">
    <div class="page-header">
      <h2>数据字典管理</h2>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建字典
        </a-button>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>
          导出字典
        </a-button>
      </a-space>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="5">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索字典名称/编码"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="dictType" placeholder="字典类型" allowClear>
            <a-select-option value="system">系统字典</a-select-option>
            <a-select-option value="business">业务字典</a-select-option>
            <a-select-option value="quality">质量字典</a-select-option>
            <a-select-option value="user">用户字典</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="状态" allowClear>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 字典列表 -->
    <a-table 
      :columns="columns" 
      :data-source="dictionaries" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
      :expandable="{ expandedRowRender, expandedRowKeys, onExpandedRowsChange: onExpandedRowsChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dictType'">
          <a-tag :color="getDictTypeColor(record.dictType)">
            {{ getDictTypeText(record.dictType) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-switch 
            :checked="record.status === 'active'" 
            @change="handleStatusChange(record)"
          />
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" size="small" @click="handleManageItems(record)">管理项</a-button>
            <a-popconfirm
              title="确定要删除这个字典吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑字典模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑字典' : '新建字典'"
      width="700px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="字典名称" name="dictName">
              <a-input v-model:value="formData.dictName" placeholder="请输入字典名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="字典编码" name="dictCode">
              <a-input v-model:value="formData.dictCode" placeholder="请输入字典编码" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="字典类型" name="dictType">
              <a-select v-model:value="formData.dictType" placeholder="请选择字典类型">
                <a-select-option value="system">系统字典</a-select-option>
                <a-select-option value="business">业务字典</a-select-option>
                <a-select-option value="quality">质量字典</a-select-option>
                <a-select-option value="user">用户字典</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="formData.status" placeholder="请选择状态">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="字典描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入字典描述" />
        </a-form-item>

        <a-form-item label="排序" name="sortOrder">
          <a-input-number 
            v-model:value="formData.sortOrder" 
            :min="0" 
            style="width: 100%" 
            placeholder="排序号，数字越小越靠前"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="字典详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="字典ID">{{ viewData.id }}</a-descriptions-item>
        <a-descriptions-item label="字典名称">{{ viewData.dictName }}</a-descriptions-item>
        <a-descriptions-item label="字典编码">{{ viewData.dictCode }}</a-descriptions-item>
        <a-descriptions-item label="字典类型">
          <a-tag :color="getDictTypeColor(viewData.dictType)">
            {{ getDictTypeText(viewData.dictType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-badge :status="viewData.status === 'active' ? 'success' : 'default'" :text="viewData.status === 'active' ? '启用' : '禁用'" />
        </a-descriptions-item>
        <a-descriptions-item label="排序">{{ viewData.sortOrder }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="字典描述" :span="2">{{ viewData.description }}</a-descriptions-item>
        <a-descriptions-item label="字典项数量" :span="2">{{ viewData.itemCount || 0 }} 项</a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 管理字典项模态框 -->
    <a-modal
      v-model:open="itemsModalVisible"
      title="管理字典项"
      width="900px"
      @ok="handleItemsSave"
      @cancel="handleItemsCancel"
    >
      <div class="items-header">
        <h4>字典：{{ currentDict.dictName }} ({{ currentDict.dictCode }})</h4>
        <a-button type="primary" @click="handleAddItem">
          <template #icon><PlusOutlined /></template>
          添加字典项
        </a-button>
      </div>
      
      <a-table 
        :columns="itemColumns" 
        :data-source="dictItems" 
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'itemLabel'">
            <a-input v-model:value="record.itemLabel" placeholder="项目标签" />
          </template>
          <template v-if="column.key === 'itemValue'">
            <a-input v-model:value="record.itemValue" placeholder="项目值" />
          </template>
          <template v-if="column.key === 'status'">
            <a-switch 
              :checked="record.status === 'active'" 
              @change="record.status = record.status === 'active' ? 'inactive' : 'active'"
            />
          </template>
          <template v-if="column.key === 'sortOrder'">
            <a-input-number v-model:value="record.sortOrder" :min="0" size="small" />
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" danger @click="handleRemoveItem(index)">删除</a-button>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const dictType = ref()
const status = ref()
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const itemsModalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const viewData = ref({})
const currentDict = ref({})
const expandedRowKeys = ref([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列配置
const columns = [
  {
    title: '字典ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '字典名称',
    dataIndex: 'dictName',
    key: 'dictName',
    width: 150
  },
  {
    title: '字典编码',
    dataIndex: 'dictCode',
    key: 'dictCode',
    width: 150
  },
  {
    title: '字典类型',
    dataIndex: 'dictType',
    key: 'dictType',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    key: 'sortOrder',
    width: 80
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 字典项表格列配置
const itemColumns = [
  {
    title: '项目标签',
    dataIndex: 'itemLabel',
    key: 'itemLabel'
  },
  {
    title: '项目值',
    dataIndex: 'itemValue',
    key: 'itemValue'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    key: 'sortOrder',
    width: 100
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark'
  },
  {
    title: '操作',
    key: 'action',
    width: 80
  }
]

// 表单数据
const formData = reactive({
  dictName: '',
  dictCode: '',
  dictType: '',
  description: '',
  status: 'active',
  sortOrder: 0
})

// 字典项数据
const dictItems = ref([])

// 表单验证规则
const formRules = {
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictCode: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  dictType: [{ required: true, message: '请选择字典类型', trigger: 'change' }]
}

// 模拟字典数据
const dictionaries = ref([
  {
    id: 4001,
    dictName: '检验结果',
    dictCode: 'inspection_result',
    dictType: 'quality',
    status: 'active',
    description: '来料检验结果分类',
    sortOrder: 1,
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-01-15 14:30:00',
    items: [
      { itemLabel: '合格', itemValue: 'qualified', status: 'active', sortOrder: 1, remark: '检验合格' },
      { itemLabel: '不合格', itemValue: 'unqualified', status: 'active', sortOrder: 2, remark: '检验不合格' },
      { itemLabel: '待定', itemValue: 'pending', status: 'active', sortOrder: 3, remark: '需要进一步确认' }
    ]
  },
  {
    id: 4002,
    dictName: '物料类型',
    dictCode: 'material_type',
    dictType: 'business',
    status: 'active',
    description: '物料分类类型',
    sortOrder: 2,
    createTime: '2024-01-08 14:20:00',
    updateTime: '2024-01-14 09:15:00',
    items: [
      { itemLabel: '原材料', itemValue: 'raw_material', status: 'active', sortOrder: 1, remark: '生产用原材料' },
      { itemLabel: '辅料', itemValue: 'auxiliary_material', status: 'active', sortOrder: 2, remark: '辅助材料' },
      { itemLabel: '包装材料', itemValue: 'packaging_material', status: 'active', sortOrder: 3, remark: '包装用材料' }
    ]
  },
  {
    id: 4003,
    dictName: '用户状态',
    dictCode: 'user_status',
    dictType: 'system',
    status: 'active',
    description: '系统用户状态',
    sortOrder: 3,
    createTime: '2024-01-05 16:45:00',
    updateTime: '2024-01-12 11:20:00',
    items: [
      { itemLabel: '正常', itemValue: 'normal', status: 'active', sortOrder: 1, remark: '用户状态正常' },
      { itemLabel: '禁用', itemValue: 'disabled', status: 'active', sortOrder: 2, remark: '用户被禁用' },
      { itemLabel: '锁定', itemValue: 'locked', status: 'active', sortOrder: 3, remark: '用户被锁定' }
    ]
  },
  {
    id: 4004,
    dictName: '紧急程度',
    dictCode: 'urgency_level',
    dictType: 'quality',
    status: 'inactive',
    description: '检验紧急程度分类',
    sortOrder: 4,
    createTime: '2024-01-03 10:30:00',
    updateTime: '2024-01-10 15:45:00',
    items: [
      { itemLabel: '紧急', itemValue: 'urgent', status: 'active', sortOrder: 1, remark: '紧急处理' },
      { itemLabel: '一般', itemValue: 'normal', status: 'active', sortOrder: 2, remark: '正常处理' },
      { itemLabel: '缓急', itemValue: 'low', status: 'active', sortOrder: 3, remark: '可以延后处理' }
    ]
  }
])

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchDictionaries()
}

const handleReset = () => {
  searchText.value = ''
  dictType.value = undefined
  status.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchDictionaries()
}

const expandedRowRender = (record: any) => {
  const items = record.items || []
  return h('div', [
    h('a-table', {
      columns: [
        { title: '项目标签', dataIndex: 'itemLabel', key: 'itemLabel' },
        { title: '项目值', dataIndex: 'itemValue', key: 'itemValue' },
        { title: '状态', dataIndex: 'status', key: 'status', 
          customRender: ({ text }: { text: string }) => text === 'active' ? '启用' : '禁用' },
        { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
        { title: '备注', dataIndex: 'remark', key: 'remark' }
      ],
      dataSource: items,
      pagination: false,
      size: 'small'
    })
  ])
}

const onExpandedRowsChange = (keys: any[]) => {
  expandedRowKeys.value = keys
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  isEdit.value = true
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleView = (record: any) => {
  viewData.value = { ...record, itemCount: (record.items || []).length }
  viewModalVisible.value = true
}

const handleManageItems = (record: any) => {
  currentDict.value = record
  dictItems.value = [...(record.items || [])]
  itemsModalVisible.value = true
}

const handleDelete = (id: number) => {
  const index = dictionaries.value.findIndex(item => item.id === id)
  if (index > -1) {
    dictionaries.value.splice(index, 1)
    message.success('删除成功')
    fetchDictionaries()
  }
}

const handleStatusChange = (record: any) => {
  const index = dictionaries.value.findIndex(item => item.id === record.id)
  if (index > -1) {
    dictionaries.value[index].status = record.status === 'active' ? 'inactive' : 'active'
    message.success('状态更新成功')
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = dictionaries.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        dictionaries.value[index] = { 
          ...formData, 
          updateTime: new Date().toLocaleString() 
        }
        message.success('更新成功')
      }
    } else {
      const newDict = {
        ...formData,
        id: Date.now(),
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
        items: []
      }
      dictionaries.value.unshift(newDict)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchDictionaries()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

const handleAddItem = () => {
  dictItems.value.push({
    itemLabel: '',
    itemValue: '',
    status: 'active',
    sortOrder: dictItems.value.length + 1,
    remark: ''
  })
}

const handleRemoveItem = (index: number) => {
  dictItems.value.splice(index, 1)
}

const handleItemsSave = () => {
  const dictIndex = dictionaries.value.findIndex(item => item.id === currentDict.value.id)
  if (dictIndex > -1) {
    dictionaries.value[dictIndex].items = [...dictItems.value]
    dictionaries.value[dictIndex].updateTime = new Date().toLocaleString()
    message.success('字典项保存成功')
  }
  itemsModalVisible.value = false
}

const handleItemsCancel = () => {
  itemsModalVisible.value = false
}

const handleExport = () => {
  message.info('导出功能开发中...')
}

const fetchDictionaries = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = dictionaries.value.length
    loading.value = false
  }, 500)
}

const resetForm = () => {
  Object.assign(formData, {
    dictName: '',
    dictCode: '',
    dictType: '',
    description: '',
    status: 'active',
    sortOrder: 0
  })
  formRef.value?.resetFields()
}

// 辅助方法
const getDictTypeColor = (type: string) => {
  const colors = {
    system: 'red',
    business: 'blue',
    quality: 'green',
    user: 'purple'
  }
  return colors[type] || 'default'
}

const getDictTypeText = (type: string) => {
  const texts = {
    system: '系统字典',
    business: '业务字典',
    quality: '质量字典',
    user: '用户字典'
  }
  return texts[type] || type
}

onMounted(() => {
  fetchDictionaries()
})
</script>

<style scoped>
.data-dictionary {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.search-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.items-header h4 {
  margin: 0;
  color: #333;
}
</style>