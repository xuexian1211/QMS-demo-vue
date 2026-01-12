<template>
  <div class="organization-management">
    <div class="layout-header">
      <div class="header-left">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索单位名称、编码"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="typeFilter" placeholder="单位类型" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="company">公司</a-select-option>
          <a-select-option value="department">部门</a-select-option>
          <a-select-option value="team">小组</a-select-option>
        </a-select>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新增单位
        </a-button>
      </div>
    </div>

    <div class="layout-content">
      <!-- 左侧树形结构 -->
      <div class="tree-panel">
        <div class="panel-header">
          <span>组织架构</span>
          <a-button type="text" size="small" @click="expandAll">
            <template #icon><DownOutlined /></template>
          </a-button>
          <a-button type="text" size="small" @click="collapseAll">
            <template #icon><UpOutlined /></template>
          </a-button>
        </div>
        <a-tree
          v-model:selectedKeys="selectedTreeKeys"
          v-model:expandedKeys="expandedKeys"
          :tree-data="treeData"
          :field-names="{ title: 'name', key: 'key', children: 'children' }"
          @select="onTreeSelect"
        >
          <template #title="{ name, type, status }">
            <span>
              <a-tag v-if="type === 'company'" color="blue" size="small">公司</a-tag>
              <a-tag v-else-if="type === 'department'" color="green" size="small">部门</a-tag>
              <a-tag v-else-if="type === 'team'" color="orange" size="small">小组</a-tag>
              {{ name }}
              <a-badge v-if="status === 'inactive'" status="error" />
            </span>
          </template>
        </a-tree>
      </div>

      <!-- 右侧列表 -->
      <div class="table-panel">
        <div class="panel-header">
          <span>单位详情</span>
          <span v-if="selectedNode" class="selected-info">
            当前选中: {{ selectedNode.name }}
          </span>
        </div>
        <a-table 
          :columns="columns" 
          :data-source="filteredData" 
          :pagination="pagination"
          :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                {{ record.status === 'active' ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
              <a-button type="link" size="small" @click="toggleStatus(record)">
                {{ record.status === 'active' ? '禁用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" danger @click="deleteRecord(record)">删除</a-button>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="editingRecord ? '编辑单位' : '新增单位'"
      width="700px"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="单位名称" required>
              <a-input v-model:value="form.name" placeholder="输入单位名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="单位编码" required>
              <a-input v-model:value="form.code" placeholder="输入单位编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="单位类型">
              <a-select v-model:value="form.type" placeholder="选择单位类型">
                <a-select-option value="company">公司</a-select-option>
                <a-select-option value="department">部门</a-select-option>
                <a-select-option value="team">小组</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="上级单位">
              <a-select v-model:value="form.parent" placeholder="选择上级单位">
                <a-select-option value="">无</a-select-option>
                <a-select-option value="1">总公司</a-select-option>
                <a-select-option value="2">质量部</a-select-option>
                <a-select-option value="3">技术部</a-select-option>
                <a-select-option value="4">市场部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="负责人">
              <a-input v-model:value="form.manager" placeholder="输入负责人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系电话">
              <a-input v-model:value="form.phone" placeholder="输入联系电话" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="form.status" placeholder="选择状态">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序号">
              <a-input-number v-model:value="form.sortOrder" placeholder="输入排序号" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="地址">
          <a-input v-model:value="form.address" placeholder="输入详细地址" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" placeholder="输入单位描述" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { PlusOutlined, DownOutlined, UpOutlined } from '@ant-design/icons-vue'

const searchText = ref('')
const typeFilter = ref('')
const showCreateModal = ref(false)
const editingRecord = ref(null)
const selectedTreeKeys = ref<string[]>([])
const expandedKeys = ref<string[]>(['1'])
const selectedNode = ref<any>(null)
const selectedRowKeys = ref<string[]>([])

const columns = [
  { title: '单位名称', dataIndex: 'name', key: 'name' },
  { title: '单位编码', dataIndex: 'code', key: 'code' },
  { title: '单位类型', dataIndex: 'type', key: 'type' },
  { title: '上级单位', dataIndex: 'parent', key: 'parent' },
  { title: '负责人', dataIndex: 'manager', key: 'manager' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action' }
]

// 树形数据结构
const treeData = ref([
  {
    key: '1',
    name: '总公司',
    code: 'HQ',
    type: 'company',
    status: 'active',
    children: [
      {
        key: '2',
        name: '质量部',
        code: 'QUALITY',
        type: 'department',
        status: 'active',
        children: [
          {
            key: '5',
            name: '质量管理组',
            code: 'QUALITY_TEAM',
            type: 'team',
            status: 'active'
          }
        ]
      },
      {
        key: '3',
        name: '技术部',
        code: 'TECH',
        type: 'department',
        status: 'active',
        children: [
          {
            key: '6',
            name: '研发组',
            code: 'DEV_TEAM',
            type: 'team',
            status: 'active'
          }
        ]
      },
      {
        key: '4',
        name: '市场部',
        code: 'MARKET',
        type: 'department',
        status: 'inactive',
        children: []
      }
    ]
  }
])

// 平铺的列表数据
const data = ref([
  {
    key: '1',
    name: '总公司',
    code: 'HQ',
    type: 'company',
    parent: '无',
    manager: '张总',
    phone: '021-12345678',
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '2',
    name: '质量部',
    code: 'QUALITY',
    type: 'department',
    parent: '总公司',
    manager: '王经理',
    phone: '021-12345679',
    status: 'active',
    createTime: '2023-01-02'
  },
  {
    key: '3',
    name: '技术部',
    code: 'TECH',
    type: 'department',
    parent: '总公司',
    manager: '李经理',
    phone: '021-12345680',
    status: 'active',
    createTime: '2023-01-03'
  },
  {
    key: '4',
    name: '市场部',
    code: 'MARKET',
    type: 'department',
    parent: '总公司',
    manager: '赵经理',
    phone: '021-12345681',
    status: 'inactive',
    createTime: '2023-01-04'
  },
  {
    key: '5',
    name: '质量管理组',
    code: 'QUALITY_TEAM',
    type: 'team',
    parent: '质量部',
    manager: '孙主管',
    phone: '021-12345682',
    status: 'active',
    createTime: '2023-01-05'
  },
  {
    key: '6',
    name: '研发组',
    code: 'DEV_TEAM',
    type: 'team',
    parent: '技术部',
    manager: '周主管',
    phone: '021-12345683',
    status: 'active',
    createTime: '2023-01-06'
  }
])

// 根据选中的树节点过滤列表数据
const filteredData = computed(() => {
  if (!selectedNode.value) {
    return data.value.filter(item => {
      const matchSearch = !searchText.value || 
        item.name.includes(searchText.value) || 
        item.code.includes(searchText.value)
      const matchType = !typeFilter.value || item.type === typeFilter.value
      return matchSearch && matchType
    })
  }
  
  return data.value.filter(item => {
    const matchSearch = !searchText.value || 
      item.name.includes(searchText.value) || 
      item.code.includes(searchText.value)
    const matchType = !typeFilter.value || item.type === typeFilter.value
    const matchNode = item.key === selectedNode.value.key || 
                     item.parent === selectedNode.value.name ||
                     (selectedNode.value.children && selectedNode.value.children.some((child: any) => child.name === item.name))
    return matchSearch && matchType && matchNode
  })
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 2,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const form = reactive({
  name: '',
  code: '',
  type: '',
  parent: '',
  manager: '',
  phone: '',
  status: 'active',
  sortOrder: 0,
  address: '',
  description: ''
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

// 树形选择事件
const onTreeSelect = (selectedKeys: string[], info: any) => {
  if (selectedKeys.length > 0) {
    selectedNode.value = info.node
  } else {
    selectedNode.value = null
  }
}

// 展开所有节点
const expandAll = () => {
  const getAllKeys = (nodes: any[]): string[] => {
    let keys: string[] = []
    nodes.forEach(node => {
      keys.push(node.key)
      if (node.children && node.children.length > 0) {
        keys = keys.concat(getAllKeys(node.children))
      }
    })
    return keys
  }
  expandedKeys.value = getAllKeys(treeData.value)
}

// 折叠所有节点
const collapseAll = () => {
  expandedKeys.value = []
}

// 表格选择事件
const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys
}

const editRecord = (record: any) => {
  editingRecord.value = record
  Object.assign(form, record)
  showCreateModal.value = true
}

const toggleStatus = (record: any) => {
  record.status = record.status === 'active' ? 'inactive' : 'active'
}

const deleteRecord = (record: any) => {
  console.log('删除记录:', record)
}

const handleSave = () => {
  console.log('保存:', form)
  showCreateModal.value = false
  editingRecord.value = null
  // 重置表单
  Object.assign(form, {
    name: '',
    code: '',
    type: '',
    parent: '',
    manager: '',
    phone: '',
    status: 'active',
    sortOrder: 0,
    address: '',
    description: ''
  })
}
</script>

<style scoped>
.organization-management {
  padding: 24px;
  background: #fff;
  height: 100%;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.layout-content {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
}

.tree-panel {
  width: 300px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.table-panel {
  flex: 1;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.selected-info {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

:deep(.ant-tree) {
  flex: 1;
  padding: 8px;
  overflow: auto;
}

:deep(.ant-table-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.ant-table) {
  flex: 1;
}

:deep(.ant-table-container) {
  height: 100%;
}

:deep(.ant-table-body) {
  height: calc(100% - 55px);
  overflow-y: auto;
}
</style>