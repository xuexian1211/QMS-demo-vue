<template>
  <div class="page-container">
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon>
            <PlusOutlined />
          </template>新增
        </a-button>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEdit">
          <template #icon>
            <EditOutlined />
          </template>编辑
        </a-button>
        <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
          <template #icon>
            <DeleteOutlined />
          </template>删除
        </a-button>
        <a-button @click="handleExport">
          <template #icon>
            <ExportOutlined />
          </template>导出
        </a-button>
        <a-button @click="loadData">
          <template #icon>
            <ReloadOutlined />
          </template>刷新
        </a-button>
      </a-space>
    </div>

    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="queryParam">
        <a-form-item label="方法名称">
          <a-input v-model:value="queryParam.methodName" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="附件ID">
          <a-input v-model:value="queryParam.attachmentId" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="table-container">
      <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" size="middle"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
        @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-divider type="vertical" />
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Edit Modal -->
    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑检验方法' : '新增检验方法'" width="600px" @ok="handleSave">
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-form-item label="方法名称" name="methodName">
          <a-input v-model:value="formState.methodName" placeholder="请输入方法名称" />
        </a-form-item>
        <a-form-item label="附件ID" name="attachmentId">
          <a-input v-model:value="formState.attachmentId" placeholder="例如：FILE_SOP_001.pdf" />
        </a-form-item>
        <a-form-item label="操作步骤描述" name="operationText">
          <a-textarea v-model:value="formState.operationText" :rows="6" placeholder="请输入操作步骤" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ExportOutlined, ReloadOutlined
  } from '@ant-design/icons-vue'

  // --- Search & Table ---
  const loading = ref(false)
  const tableData = ref < any[] > ([])
  const selectedRowKeys = ref < string[] > ([])
  const queryParam = reactive({
    methodName: '',
    attachmentId: ''
  })

  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
  })

  const columns = [
    { title: '方法名称', dataIndex: 'methodName', key: 'methodName', width: 200 },
    { title: '附件ID', dataIndex: 'attachmentId', key: 'attachmentId', width: 200 },
    { title: '操作步骤', dataIndex: 'operationText', key: 'operationText', ellipsis: true },
    { title: '操作', key: 'action', width: 150, fixed: 'right' }
  ]

  const loadData = () => {
    loading.value = true
    setTimeout(() => {
      // Mock data
      let data = [
        { id: '201', methodName: '通用卡尺测量法', operationText: '1. 校零 2. 清洁工件 3. 测量关键尺寸 4.记录', attachmentId: 'FILE_SOP_001.pdf' },
        { id: '202', methodName: '目视检查', operationText: '1. 明确判定标准 2. 在自然光条件下检查表面 3.记录', attachmentId: '' },
      ]

      // Filter
      if (queryParam.methodName) data = data.filter(i => i.methodName.includes(queryParam.methodName))
      if (queryParam.attachmentId) data = data.filter(i => (i.attachmentId || '').includes(queryParam.attachmentId))

      tableData.value = data
      pagination.total = data.length
      loading.value = false
    }, 300)
  }

  const handleSearch = () => {
    pagination.current = 1
    loadData()
  }

  const handleReset = () => {
    queryParam.methodName = ''
    queryParam.attachmentId = ''
    handleSearch()
  }

  const handleTableChange = (pag: any) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    loadData()
  }

  const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys
  }

  // --- Actions ---
  const modalVisible = ref(false)
  const isEdit = ref(false)
  const formRef = ref()
  const formState = reactive({
    id: null,
    methodName: '',
    attachmentId: '',
    operationText: ''
  })

  const rules = {
    methodName: [{ required: true, message: '请输入方法名称', trigger: 'blur' }]
  }

  const handleAdd = () => {
    isEdit.value = false
    Object.assign(formState, { id: null, methodName: '', attachmentId: '', operationText: '' })
    modalVisible.value = true
  }

  const handleEdit = (record: any) => {
    const item = record.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
    if (!item) return

    isEdit.value = true
    Object.assign(formState, { ...item })
    modalVisible.value = true
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除检验方法 ${record.methodName} 吗？`,
      okType: 'danger',
      onOk() {
        tableData.value = tableData.value.filter(i => i.id !== record.id)
        message.success('删除成功')
      }
    })
  }

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
      okType: 'danger',
      onOk() {
        tableData.value = tableData.value.filter(i => !selectedRowKeys.value.includes(i.id))
        selectedRowKeys.value = []
        message.success('删除成功')
      }
    })
  }

  const handleSave = () => {
    formRef.value.validate().then(() => {
      if (isEdit.value) {
        const idx = tableData.value.findIndex(i => i.id === formState.id)
        if (idx > -1) Object.assign(tableData.value[idx], formState)
      } else {
        tableData.value.push({ ...formState, id: Date.now().toString() })
      }
      message.success('保存成功')
      modalVisible.value = false
      loadData()
    })
  }

  const handleExport = () => {
    message.success('导出任务已开始')
  }

  onMounted(() => {
    loadData()
  })
</script>

<style scoped>
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  .toolbar {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }

  .search-card {
    margin-bottom: 16px;
  }

  .table-container {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
  }
</style>