<template>
  <div class="page-container">
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="showAddModal">
          <template #icon>
            <PlusOutlined />
          </template>新增
        </a-button>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEditSelected">
          <template #icon>
            <EditOutlined />
          </template>编辑
        </a-button>
        <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
          <template #icon>
            <DeleteOutlined />
          </template>删除
        </a-button>
        <a-dropdown :disabled="selectedRowKeys.length === 0">
          <a-button>状态操作
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleBatchStatusChange">
              <a-menu-item key="enable">批量启用</a-menu-item>
              <a-menu-item key="disable">批量禁用</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a-button @click="handleExport">
          <template #icon>
            <ExportOutlined />
          </template>导出
        </a-button>
        <a-button @click="fetchData">
          <template #icon>
            <ReloadOutlined />
          </template>刷新
        </a-button>
      </a-space>
    </div>

    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="分类名称">
          <a-input v-model:value="searchForm.categoryName" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="分类编码">
          <a-input v-model:value="searchForm.categoryCode" placeholder="请输入" allow-clear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" style="width: 120px" placeholder="请选择" allow-clear>
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="table-container">
      <a-table :columns="columns" :data-source="dataSource" :loading="loading" row-key="id" size="middle"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
        @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">
              {{ record.status === '1' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-divider type="vertical" />
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-divider type="vertical" />
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal v-model:visible="modalVisible" :title="modalTitle" width="600px" @ok="handleSubmit" @cancel="handleCancel">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-form-item label="分类名称" name="categoryName">
          <a-input v-model:value="formData.categoryName" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="分类编码" name="categoryCode">
          <a-input v-model:value="formData.categoryCode" placeholder="请输入分类编码" />
        </a-form-item>
        <a-form-item label="上级分类" name="parentId">
          <a-tree-select v-model:value="formData.parentId" :tree-data="categoryTreeData" placeholder="请选择上级分类"
            allow-clear tree-default-expand-all />
        </a-form-item>
        <a-form-item label="排序" name="sortOrder">
          <a-input-number v-model:value="formData.sortOrder" placeholder="请输入排序号" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" placeholder="请输入分类描述" :rows="3" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="1">启用</a-radio>
            <a-radio value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal v-model:visible="viewModalVisible" title="分类详情" width="600px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="分类名称">{{ viewData.categoryName }}</a-descriptions-item>
        <a-descriptions-item label="分类编码">{{ viewData.categoryCode }}</a-descriptions-item>
        <a-descriptions-item label="上级分类">{{ viewData.parentName || '无' }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ viewData.sortOrder }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">{{ viewData.description || '无' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted, computed } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExportOutlined,
    ReloadOutlined,
    DownOutlined
  } from '@ant-design/icons-vue'
  import { useExport } from '@/utils/excel'

  // 响应式数据
  const loading = ref(false)
  const modalVisible = ref(false)
  const viewModalVisible = ref(false)
  const isEdit = ref(false)
  const formRef = ref()
  const selectedRowKeys = ref([])

  // 搜索表单
  const searchForm = reactive({
    categoryName: '',
    categoryCode: '',
    status: undefined
  })

  // 表单数据
  const formData = reactive({
    id: '',
    categoryName: '',
    categoryCode: '',
    parentId: undefined,
    sortOrder: 0,
    description: '',
    status: '1'
  })

  // 表格列定义
  const columns = [
    { title: '分类名称', dataIndex: 'categoryName', key: 'categoryName', width: 150 },
    { title: '分类编码', dataIndex: 'categoryCode', key: 'categoryCode', width: 120 },
    { title: '上级分类', dataIndex: 'parentName', key: 'parentName', width: 120 },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80, sorter: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' }
  ]

  // 表格数据
  const dataSource = ref([
    {
      id: '1', categoryName: '原材料', categoryCode: 'RAW_MATERIAL', parentName: '无', parentId: null,
      sortOrder: 1, description: '生产用原材料分类', status: '1',
      createTime: '2024-01-15 10:30:00', updateTime: '2024-01-15 10:30:00'
    },
    {
      id: '2', categoryName: '金属材料', categoryCode: 'METAL', parentName: '原材料', parentId: '1',
      sortOrder: 1, description: '各类金属材料', status: '1',
      createTime: '2024-01-15 10:35:00', updateTime: '2024-01-15 10:35:00'
    },
    {
      id: '3', categoryName: '非金属材料', categoryCode: 'NON_METAL', parentName: '原材料', parentId: '1',
      sortOrder: 2, description: '各类非金属材料', status: '1',
      createTime: '2024-01-15 10:40:00', updateTime: '2024-01-15 10:40:00'
    },
    {
      id: '4', categoryName: '半成品', categoryCode: 'SEMI_FINISHED', parentName: '无', parentId: null,
      sortOrder: 2, description: '生产过程中的半成品', status: '1',
      createTime: '2024-01-15 10:45:00', updateTime: '2024-01-15 10:45:00'
    },
    {
      id: '5', categoryName: '成品', categoryCode: 'FINISHED', parentName: '无', parentId: null,
      sortOrder: 3, description: '最终产品', status: '1',
      createTime: '2024-01-15 10:50:00', updateTime: '2024-01-15 10:50:00'
    }
  ])

  // 分页配置
  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 5,
    showSizeChanger: true,
    showQuickJumper: true
  })

  // 分类树数据
  const categoryTreeData = ref([
    { title: '无', value: null, key: 'null' },
    {
      title: '原材料', value: '1', key: '1',
      children: [
        { title: '金属材料', value: '2', key: '2' },
        { title: '非金属材料', value: '3', key: '3' }
      ]
    },
    { title: '半成品', value: '4', key: '4' },
    { title: '成品', value: '5', key: '5' }
  ])

  // 查看数据
  const viewData = ref({})

  // 表单验证规则
  const rules = {
    categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
    categoryCode: [
      { required: true, message: '请输入分类编码', trigger: 'blur' },
      { pattern: /^[A-Z_]+$/, message: '分类编码只能包含大写字母和下划线', trigger: 'blur' }
    ],
    sortOrder: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
  }

  // 计算属性
  const modalTitle = computed(() => isEdit.value ? '编辑分类' : '新增分类')

  // 选择变更
  const onSelectChange = (keys) => {
    selectedRowKeys.value = keys
  }

  // 方法
  const handleSearch = () => {
    pagination.current = 1
    fetchData()
  }

  const resetSearch = () => {
    Object.assign(searchForm, { categoryName: '', categoryCode: '', status: undefined })
    handleSearch()
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    fetchData()
  }

  const showAddModal = () => {
    isEdit.value = false
    modalVisible.value = true
    resetForm()
  }

  const handleEditSelected = () => {
    const record = dataSource.value.find(i => i.id === selectedRowKeys.value[0])
    if (record) handleEdit(record)
  }

  const handleEdit = (record) => {
    isEdit.value = true
    modalVisible.value = true
    Object.assign(formData, { ...record, parentId: record.parentId })
  }

  const handleView = (record) => {
    viewData.value = record
    viewModalVisible.value = true
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除分类 ${record.categoryName} 吗？`,
      okType: 'danger',
      onOk() {
        const index = dataSource.value.findIndex(item => item.id === record.id)
        if (index > -1) {
          dataSource.value.splice(index, 1)
          message.success('删除成功')
          fetchData()
        }
      }
    })
  }

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
      okType: 'danger',
      onOk() {
        dataSource.value = dataSource.value.filter(i => !selectedRowKeys.value.includes(i.id))
        selectedRowKeys.value = []
        message.success('删除成功')
      }
    })
  }

  const handleSubmit = async () => {
    try {
      await formRef.value.validate()

      if (isEdit.value) {
        const index = dataSource.value.findIndex(item => item.id === formData.id)
        if (index > -1) {
          const parentName = formData.parentId ?
            categoryTreeData.value.find(item => item.value === formData.parentId)?.title : '无'
          dataSource.value[index] = { ...formData, parentName, updateTime: new Date().toLocaleString() }
          message.success('更新成功')
        }
      } else {
        const newId = (Math.max(...dataSource.value.map(item => parseInt(item.id))) + 1).toString()
        const parentName = formData.parentId ?
          categoryTreeData.value.find(item => item.value === formData.parentId)?.title : '无'
        const newItem = {
          ...formData, id: newId, parentName,
          createTime: new Date().toLocaleString(), updateTime: new Date().toLocaleString()
        }
        dataSource.value.push(newItem)
        message.success('新增成功')
      }

      modalVisible.value = false
      fetchData()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    modalVisible.value = false
    resetForm()
  }

  const resetForm = () => {
    Object.assign(formData, {
      id: '', categoryName: '', categoryCode: '', parentId: undefined,
      sortOrder: 0, description: '', status: '1'
    })
    formRef.value?.resetFields()
  }

  const handleExport = () => {
    if (dataSource.value.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    const exportColumns = [
      { title: '分类名称', dataIndex: 'categoryName' },
      { title: '分类编码', dataIndex: 'categoryCode' },
      { title: '上级分类', dataIndex: 'parentName' },
      { title: '排序', dataIndex: 'sortOrder' },
      { title: '状态', dataIndex: 'status' },
      { title: '描述', dataIndex: 'description' },
      { title: '创建时间', dataIndex: 'createTime' }
    ]
    const { exportToCSV } = useExport()
    exportToCSV(dataSource.value, exportColumns, '物料分类')
    message.success('导出成功')
  }

  const handleBatchStatusChange = ({ key }) => {
    const newStatus = key === 'enable' ? '1' : '0'
    const statusText = key === 'enable' ? '启用' : '禁用'
    Modal.confirm({
      title: `确认批量${statusText}`,
      content: `确定${statusText}选中的 ${selectedRowKeys.value.length} 条记录吗？`,
      onOk() {
        dataSource.value.forEach(item => {
          if (selectedRowKeys.value.includes(item.id)) {
            item.status = newStatus
          }
        })
        selectedRowKeys.value = []
        message.success(`批量${statusText}成功`)
      }
    })
  }

  const fetchData = () => {
    loading.value = true
    setTimeout(() => {
      let filteredData = [...dataSource.value]
      if (searchForm.categoryName) {
        filteredData = filteredData.filter(item => item.categoryName.includes(searchForm.categoryName))
      }
      if (searchForm.categoryCode) {
        filteredData = filteredData.filter(item => item.categoryCode.includes(searchForm.categoryCode))
      }
      if (searchForm.status !== undefined) {
        filteredData = filteredData.filter(item => item.status === searchForm.status)
      }
      pagination.total = filteredData.length
      loading.value = false
    }, 300)
  }

  // 生命周期
  onMounted(() => {
    fetchData()
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