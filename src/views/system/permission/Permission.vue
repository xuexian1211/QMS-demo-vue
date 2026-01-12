<template>
  <div class="permission-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索权限名称、编码"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="typeFilter" placeholder="权限类型" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="menu">菜单</a-select-option>
          <a-select-option value="button">按钮</a-select-option>
          <a-select-option value="api">接口</a-select-option>
        </a-select>
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="active">启用</a-select-option>
          <a-select-option value="inactive">禁用</a-select-option>
        </a-select>
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新增权限
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="data" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.type)">
            {{ getTypeText(record.type) }}
          </a-tag>
        </template>
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
          <a-button type="link" size="small" @click="deleteRecord(record)">删除</a-button>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="editingRecord ? '编辑权限' : '新增权限'"
      width="700px"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="权限名称" required>
              <a-input v-model:value="form.name" placeholder="输入权限名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="权限编码" required>
              <a-input v-model:value="form.code" placeholder="输入权限编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="权限类型" required>
              <a-select v-model:value="form.type" placeholder="选择权限类型">
                <a-select-option value="menu">菜单</a-select-option>
                <a-select-option value="button">按钮</a-select-option>
                <a-select-option value="api">接口</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="上级权限">
              <a-tree-select
                v-model:value="form.parent"
                :tree-data="permissionTreeData"
                placeholder="选择上级权限"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="图标">
              <a-input v-model:value="form.icon" placeholder="输入图标名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="路由路径">
              <a-input v-model:value="form.path" placeholder="输入路由路径" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="组件路径">
              <a-input v-model:value="form.component" placeholder="输入组件路径" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序号">
              <a-input-number v-model:value="form.sortOrder" placeholder="输入排序号" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="是否外链">
              <a-switch v-model:checked="form.isExternal" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="是否缓存">
              <a-switch v-model:checked="form.isCache" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="是否隐藏">
              <a-switch v-model:checked="form.isHidden" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="form.status" placeholder="选择状态">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="权限描述">
          <a-textarea v-model:value="form.description" placeholder="输入权限描述" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" placeholder="输入备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const searchText = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const editingRecord = ref(null)

const columns = [
  { title: '权限名称', dataIndex: 'name', key: 'name' },
  { title: '权限编码', dataIndex: 'code', key: 'code' },
  { title: '权限类型', dataIndex: 'type', key: 'type' },
  { title: '上级权限', dataIndex: 'parent', key: 'parent' },
  { title: '路由路径', dataIndex: 'path', key: 'path' },
  { title: '图标', dataIndex: 'icon', key: 'icon' },
  { title: '排序', dataIndex: 'sort', key: 'sort' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200 }
]

const data = ref([
  {
    key: '1',
    name: '系统管理',
    code: 'system',
    type: 'menu',
    parent: '根目录',
    path: '/system',
    icon: 'SettingOutlined',
    sort: 1,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '2',
    name: '用户管理',
    code: 'system:user',
    type: 'menu',
    parent: '系统管理',
    path: '/system/user',
    icon: 'UserOutlined',
    sort: 1,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '3',
    name: '查看用户',
    code: 'system:user:view',
    type: 'button',
    parent: '用户管理',
    path: '',
    icon: '',
    sort: 1,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '4',
    name: '新增用户',
    code: 'system:user:add',
    type: 'button',
    parent: '用户管理',
    path: '',
    icon: '',
    sort: 2,
    status: 'active',
    createTime: '2023-01-01'
  }
])

const permissionTreeData = ref([
  {
    title: '根目录',
    value: '',
    children: [
      {
        title: '系统管理',
        value: 'system',
        children: [
          { title: '用户管理', value: 'system:user' },
          { title: '角色管理', value: 'system:role' },
          { title: '权限管理', value: 'system:permission' }
        ]
      },
      {
        title: '质量管理',
        value: 'quality',
        children: [
          { title: '进货检验', value: 'quality:incoming' },
          { title: '过程检验', value: 'quality:process' },
          { title: '成品检验', value: 'quality:product' }
        ]
      }
    ]
  }
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 4,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const form = reactive({
  name: '',
  code: '',
  type: 'menu',
  parent: '',
  icon: '',
  path: '',
  component: '',
  sortOrder: 0,
  isExternal: false,
  isCache: true,
  isHidden: false,
  status: 'active',
  level: '1',
  description: '',
  remark: ''
})

const getTypeColor = (type: string) => {
  const colors = {
    menu: 'blue',
    button: 'green',
    api: 'orange'
  }
  return colors[type] || 'default'
}

const getTypeText = (type: string) => {
  const texts = {
    menu: '菜单',
    button: '按钮',
    api: '接口'
  }
  return texts[type] || type
}

const handleSearch = () => {
  console.log('搜索:', searchText.value)
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
    type: 'menu',
    parent: '',
    icon: '',
    path: '',
    component: '',
    sortOrder: 0,
    isExternal: false,
    isCache: true,
    isHidden: false,
    status: 'active',
    level: '1',
    description: '',
    remark: ''
  })
}
</script>

<style scoped>
.permission-management {
  padding: 24px;
  background: #fff;
}
</style>