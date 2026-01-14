<template>
  <div class="page-container">
    <div class="split-layout">
      <!-- 左侧：不良现象分类树 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">缺陷分类</span>
          <a-space>
            <a-tooltip title="新增缺陷分类">
              <a-button type="primary" size="small" shape="circle" @click="handleAddRootCategory">
                <template #icon>
                  <PlusOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="刷新">
              <a-button size="small" shape="circle" @click="loadCategories">
                <template #icon>
                  <ReloadOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </div>

        <div class="search-box">
          <a-input v-model:value="categorySearch" placeholder="搜索缺陷分类" allow-clear size="small">
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </div>

        <div class="tree-container">
          <a-spin :spinning="categoryLoading">
            <a-tree v-if="treeData.length > 0" v-model:selectedKeys="selectedCategoryKeys"
              v-model:expandedKeys="expandedKeys" :tree-data="filteredTreeData"
              :field-names="{ children: 'children', title: 'categoryName', key: 'id' }" block-node
              @select="onCategorySelect">
              <template #title="{ categoryName, data }">
                <div class="tree-node-content">
                  <span class="node-title">{{ categoryName }}</span>
                  <div class="node-actions">
                    <PlusOutlined class="action-icon" title="添加子类" @click.stop="handleAddSubCategory(data)" />
                    <EditOutlined class="action-icon" title="编辑" @click.stop="handleEditCategory(data)" />
                    <DeleteOutlined class="action-icon" title="删除" @click.stop="handleDeleteCategory(data)" />
                  </div>
                </div>
              </template>
            </a-tree>
            <a-empty v-else description="暂无缺陷分类数据" class="empty-state" />
          </a-spin>
        </div>
      </div>

      <!-- 右侧：不良现象列表 -->
      <div class="right-panel">
        <div v-if="!selectedCategory" class="empty-selection">
          <a-empty description="请选择左侧分类查看不良现象" />
        </div>

        <div v-else class="content-wrapper">
          <div class="right-header">
            <div class="header-info">
              <div class="category-title">{{ selectedCategory.categoryName }}</div>
              <div class="category-meta">
                <a-tag color="blue">{{ selectedCategory.categoryCode }}</a-tag>
                <span class="desc">{{ selectedCategory.description || '暂无描述' }}</span>
              </div>
            </div>
            <div class="header-actions">
              <a-button type="primary" @click="handleAddPhenomenon">
                <template #icon>
                  <PlusOutlined />
                </template>
                新增现象
              </a-button>
              <a-button danger :disabled="selectedPhenomenonKeys.length === 0" @click="handleBatchDeletePhenomena">
                批量删除
              </a-button>
              <a-button @click="handleExport">导出</a-button>
            </div>
          </div>

          <div class="table-container">
            <a-table :columns="phenomenonColumns" :data-source="phenomenaData" :loading="phenomenaLoading" row-key="id"
              size="middle"
              :row-selection="{ selectedRowKeys: selectedPhenomenonKeys, onChange: onPhenomenonSelectChange }"
              :pagination="{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'severity'">
                  <a-tag :color="getSeverityColor(record.severity)">{{ record.severity }}</a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="handleEditPhenomenon(record)">编辑</a-button>
                    <a-button type="link" danger size="small" @click="handleDeletePhenomenon(record)">删除</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类编辑弹窗 -->
    <a-modal v-model:visible="categoryModalVisible" :title="categoryModalTitle" @ok="saveCategory">
      <a-form layout="vertical" :model="categoryForm">
        <a-form-item label="父级分类">
          <a-input :value="parentCategoryName" disabled />
        </a-form-item>
        <a-form-item label="分类代码" required><a-input v-model:value="categoryForm.categoryCode" /></a-form-item>
        <a-form-item label="分类名称" required><a-input v-model:value="categoryForm.categoryName" /></a-form-item>
        <a-form-item label="描述"><a-textarea v-model:value="categoryForm.description" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 现象编辑弹窗 -->
    <a-modal v-model:visible="phenomenonModalVisible" :title="isEditPhenomenon ? '编辑不良现象' : '新增不良现象'"
      @ok="savePhenomenon">
      <a-form layout="vertical" :model="phenomenonForm">
        <a-form-item label="所属分类">
          <a-input :value="selectedCategory?.categoryName" disabled />
        </a-form-item>
        <a-form-item label="现象代码" required><a-input v-model:value="phenomenonForm.code" /></a-form-item>
        <a-form-item label="现象名称" required><a-input v-model:value="phenomenonForm.name" /></a-form-item>
        <a-form-item label="严重等级" required>
          <a-select v-model:value="phenomenonForm.severity">
            <a-select-option value="CR">致命 (CR)</a-select-option>
            <a-select-option value="MA">主要 (MA)</a-select-option>
            <a-select-option value="MI">次要 (MI)</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="适用工序"><a-input v-model:value="phenomenonForm.processType"
            placeholder="如：压铸, 机加工" /></a-form-item>
        <a-form-item label="描述"><a-textarea v-model:value="phenomenonForm.description" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined
  } from '@ant-design/icons-vue'
  import { useExport } from '@/utils/excel'

  // --- 状态定义 ---
  const categoryLoading = ref(false)
  const rawTreeData = ref < any[] > ([]) // 原始扁平数据或树形数据
  const categorySearch = ref('')
  const selectedCategoryKeys = ref < number[] > ([])
  const expandedKeys = ref < number[] > ([])

  const phenomenaLoading = ref(false)
  const phenomenaData = ref < any[] > ([])
  const selectedPhenomenonKeys = ref < number[] > ([])

  // 弹窗状态
  const categoryModalVisible = ref(false)
  const isEditCategory = ref(false)
  const categoryForm = reactive({ id: null, parentId: null, categoryCode: '', categoryName: '', description: '' })
  const parentCategoryName = ref('根节点')

  const phenomenonModalVisible = ref(false)
  const isEditPhenomenon = ref(false)
  const phenomenonForm = reactive({ id: null, code: '', name: '', severity: 'MI', processType: '', description: '' })


  // --- 左侧：分类树逻辑 ---

  // 树数据处理
  const treeData = computed(() => rawTreeData.value) // 假设后端直接返回树或已处理

  // 搜索过滤
  const filteredTreeData = computed(() => {
    if (!categorySearch.value) return treeData.value
    // 简单搜索逻辑：如果节点匹配或子节点匹配，则保留
    // 这里简化处理，实际可以使用更复杂的递归过滤
    return treeData.value // 暂时返回全量，配合展开高亮更佳，此处暂略
  })

  const selectedCategory = computed(() => {
    if (selectedCategoryKeys.value.length === 0) return null
    const findNode = (nodes: any[], key: number): any => {
      for (const node of nodes) {
        if (node.id === key) return node
        if (node.children) {
          const found = findNode(node.children, key)
          if (found) return found
        }
      }
      return null
    }
    return findNode(treeData.value, selectedCategoryKeys.value[0])
  })


  const loadCategories = () => {
    categoryLoading.value = true
    setTimeout(() => {
      rawTreeData.value = [
        {
          id: 1, categoryCode: 'DCAT-APP', categoryName: '外观缺陷', parentId: null, description: '产品表面相关缺陷',
          children: [
            { id: 11, categoryCode: 'DCAT-APP-CAST', categoryName: '铸造外观', parentId: 1, description: '铸造特有' },
            { id: 12, categoryCode: 'DCAT-APP-MACH', categoryName: '机加外观', parentId: 1, description: '机加特有' }
          ]
        },
        {
          id: 2, categoryCode: 'DCAT-DIM', categoryName: '尺寸缺陷', parentId: null, description: '尺寸公差超差',
          children: []
        },
        {
          id: 3, categoryCode: 'DCAT-FUNC', categoryName: '性能缺陷', parentId: null, description: '功能测试失效',
          children: []
        }
      ]
      expandedKeys.value = [1] // 默认展开第一个
      categoryLoading.value = false
    }, 500)
  }

  const onCategorySelect = (keys: number[]) => {
    if (keys.length > 0) {
      loadPhenomena(keys[0])
    } else {
      phenomenaData.value = []
    }
  }

  // 分类操作
  const handleAddRootCategory = () => {
    isEditCategory.value = false
    parentCategoryName.value = '根分类'
    Object.assign(categoryForm, { id: null, parentId: null, categoryCode: '', categoryName: '', description: '' })
    categoryModalTitle.value = '新增缺陷分类'
    categoryModalVisible.value = true
  }

  const handleAddSubCategory = (parent: any) => {
    isEditCategory.value = false
    parentCategoryName.value = parent.categoryName
    Object.assign(categoryForm, { id: null, parentId: parent.id, categoryCode: '', categoryName: '', description: '' })
    categoryModalTitle.value = '新增子缺陷分类'
    categoryModalVisible.value = true
  }

  const handleEditCategory = (node: any) => {
    isEditCategory.value = true
    parentCategoryName.value = node.parentId ? '上级分类ID:' + node.parentId : '根分类'
    Object.assign(categoryForm, { ...node })
    categoryModalTitle.value = '编辑缺陷分类'
    categoryModalVisible.value = true
  }

  const handleDeleteCategory = (node: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除分类 ${node.categoryName} 及其所有子类吗？`,
      okType: 'danger',
      onOk() {
        // 模拟删除
        message.success('分类已删除')
        loadCategories() // 刷新
        selectedCategoryKeys.value = []
        phenomenaData.value = []
      }
    })
  }

  const categoryModalTitle = ref('')

  const saveCategory = () => {
    // Mock save
    message.success('分类保存成功')
    categoryModalVisible.value = false
    loadCategories()
  }

  // --- 右侧：不良现象逻辑 ---

  const phenomenonColumns = [
    { title: '现象代码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '现象名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '严重等级', dataIndex: 'severity', key: 'severity', width: 100 },
    { title: '适用工序', dataIndex: 'processType', key: 'processType', width: 150 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '操作', key: 'action', width: 150 }
  ]

  const loadPhenomena = (categoryId: number) => {
    phenomenaLoading.value = true
    // Mock data based on category
    setTimeout(() => {
      if (categoryId === 1 || categoryId === 11) {
        phenomenaData.value = [
          { id: 101, code: 'DEF-001', name: '表面划伤', severity: 'MI', processType: '全工序', description: '可见划痕' },
          { id: 102, code: 'DEF-002', name: '气孔', severity: 'MA', processType: '压铸', description: '表面密集气孔' }
        ]
      } else if (categoryId === 2) {
        phenomenaData.value = [
          { id: 201, code: 'DIM-001', name: '长度超差', severity: 'MA', processType: '机加', description: '' }
        ]
      } else {
        phenomenaData.value = []
      }
      phenomenaLoading.value = false
    }, 300)
  }

  const onPhenomenonSelectChange = (keys: number[]) => {
    selectedPhenomenonKeys.value = keys
  }

  const handleAddPhenomenon = () => {
    isEditPhenomenon.value = false
    Object.assign(phenomenonForm, { id: null, code: '', name: '', severity: 'MI', processType: '', description: '' })
    phenomenonModalVisible.value = true
  }

  const handleEditPhenomenon = (record: any) => {
    isEditPhenomenon.value = true
    Object.assign(phenomenonForm, { ...record })
    phenomenonModalVisible.value = true
  }

  const handleDeletePhenomenon = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除不良现象 ${record.name} 吗？`,
      okType: 'danger',
      onOk() {
        phenomenaData.value = phenomenaData.value.filter(p => p.id !== record.id)
        message.success('删除成功')
      }
    })
  }

  const handleBatchDeletePhenomena = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定删除选中的 ${selectedPhenomenonKeys.value.length} 条记录吗？`,
      okType: 'danger',
      onOk() {
        phenomenaData.value = phenomenaData.value.filter(p => !selectedPhenomenonKeys.value.includes(p.id))
        selectedPhenomenonKeys.value = []
        message.success('批量删除成功')
      }
    })
  }

  const savePhenomenon = () => {
    if (!phenomenonForm.code || !phenomenonForm.name) {
      message.warn('请填写必填项')
      return
    }

    if (isEditPhenomenon.value) {
      const idx = phenomenaData.value.findIndex(p => p.id === phenomenonForm.id)
      if (idx !== -1) Object.assign(phenomenaData.value[idx], { ...phenomenonForm })
    } else {
      phenomenaData.value.push({ ...phenomenonForm, id: Date.now() })
    }

    message.success('保存成功')
    phenomenonModalVisible.value = false
  }

  const handleExport = () => {
    if (phenomenaData.value.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    // 使用导出工具
    const columns = [
      { title: '现象代码', dataIndex: 'code' },
      { title: '现象名称', dataIndex: 'name' },
      { title: '严重等级', dataIndex: 'severity' },
      { title: '适用工序', dataIndex: 'processType' },
      { title: '描述', dataIndex: 'description' }
    ]
    const { exportToCSV } = useExport()
    exportToCSV(phenomenaData.value, columns, `不良现象_${selectedCategory.value?.categoryName || '导出'}`)
    message.success('导出成功')
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'CR': return 'red'
      case 'MA': return 'orange'
      case 'MI': return 'blue'
      default: return 'default'
    }
  }

  onMounted(() => {
    loadCategories()
  })
</script>

<style scoped>
  .page-container {
    height: calc(100vh - 64px);
    background-color: #f0f2f5;
    padding: 16px;
    overflow: hidden;
  }

  .split-layout {
    display: flex;
    height: 100%;
    gap: 16px;
  }

  /* 左侧面板 */
  .left-panel {
    width: 300px;
    min-width: 300px;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-title {
    font-weight: 600;
    font-size: 16px;
    color: #1f1f1f;
  }

  .search-box {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .tree-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  /* 树节点样式微调 */
  :deep(.ant-tree-node-content-wrapper) {
    width: 100%;
  }

  .tree-node-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 8px;
    width: 100%;
  }

  .node-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-actions {
    display: none;
    /* 默认隐藏 */
    gap: 8px;
  }

  /* 悬浮显示操作按钮 */
  :deep(.ant-tree-treenode:hover) .node-actions {
    display: flex;
  }

  .action-icon {
    font-size: 12px;
    color: #8c8c8c;
    transition: color 0.2s;
  }

  .action-icon:hover {
    color: #1890ff;
  }

  /* 右侧面板 */
  .right-panel {
    flex: 1;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .empty-selection {
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .right-header {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .category-title {
    font-size: 20px;
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 8px;
  }

  .category-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .desc {
    color: #8c8c8c;
    font-size: 12px;
  }

  .table-container {
    flex: 1;
    overflow: hidden;
    /* 表格自带滚动 */
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
</style>