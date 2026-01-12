<template>
  <div class="role-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索角色名称、编码"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;" :options="[
          { value: '', label: '全部' },
          { value: 'active', label: '启用' },
          { value: 'inactive', label: '禁用' }
        ]" />
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新增角色
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="data" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
          <a-button type="link" size="small" @click="editPermissions(record)">权限配置</a-button>
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
      :title="editingRecord ? '编辑角色' : '新增角色'"
      width="700px"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="角色名称" required>
              <a-input v-model:value="form.name" placeholder="输入角色名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色编码" required>
              <a-input v-model:value="form.code" placeholder="输入角色编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="数据权限">
              <a-select v-model:value="form.dataScope" placeholder="选择数据权限范围" :options="[
                { value: 'all', label: '全部数据' },
                { value: 'dept', label: '部门数据' },
                { value: 'self', label: '个人数据' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="form.status" placeholder="选择状态" :options="[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '禁用' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="排序号">
              <a-input-number v-model:value="form.sortOrder" placeholder="输入排序号" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="用户数量限制">
              <a-input-number v-model:value="form.userLimit" placeholder="输入用户数量限制" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="角色描述">
          <a-textarea v-model:value="form.description" placeholder="输入角色描述" :rows="3" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" placeholder="输入备注信息" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限配置模态框 -->
    <a-modal
      v-model:open="showPermissionModal"
      title="权限配置"
      width="800px"
      @ok="handleSavePermissions"
    >
      <a-tree
        v-model:checkedKeys="selectedPermissions"
        :tree-data="permissionTree"
        :checkable="true"
        :default-expand-all="true"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const searchText = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const showPermissionModal = ref(false)
const editingRecord = ref(null)
const selectedPermissions = ref([])

const columns = [
  { title: '角色名称', dataIndex: 'name', key: 'name' },
  { title: '角色编码', dataIndex: 'code', key: 'code' },
  { title: '角色描述', dataIndex: 'description', key: 'description' },
  { title: '用户数量', dataIndex: 'userCount', key: 'userCount' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 250 }
]

const data = ref([
  {
    key: '1',
    name: '系统管理员',
    code: 'ADMIN',
    description: '系统管理员，拥有所有权限',
    userCount: 1,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '2',
    name: '质量管理员',
    code: 'QUALITY_ADMIN',
    description: '质量管理员，负责质量检验相关操作',
    userCount: 3,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '3',
    name: '普通用户',
    code: 'USER',
    description: '普通用户，基础操作权限',
    userCount: 25,
    status: 'active',
    createTime: '2023-01-01'
  }
])

const permissionTree = ref([
  {
    title: '系统管理',
    key: 'system',
    children: [
      {
        title: '用户管理',
        key: 'system:user',
        children: [
          { title: '查看用户', key: 'system:user:view' },
          { title: '新增用户', key: 'system:user:add' },
          { title: '编辑用户', key: 'system:user:edit' },
          { title: '删除用户', key: 'system:user:delete' }
        ]
      },
      {
        title: '角色管理',
        key: 'system:role',
        children: [
          { title: '查看角色', key: 'system:role:view' },
          { title: '新增角色', key: 'system:role:add' },
          { title: '编辑角色', key: 'system:role:edit' },
          { title: '删除角色', key: 'system:role:delete' }
        ]
      }
    ]
  },
  {
    title: '质量管理',
    key: 'quality',
    children: [
      {
        title: '进货检验',
        key: 'quality:incoming',
        children: [
          { title: '查看检验单', key: 'quality:incoming:view' },
          { title: '创建检验单', key: 'quality:incoming:add' },
          { title: '审核检验单', key: 'quality:incoming:approve' }
        ]
      }
    ]
  }
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

const form = reactive({
  name: '',
  code: '',
  description: '',
  dataScope: 'dept',
  status: 'active',
  sortOrder: 0,
  userLimit: 0,
  remark: ''
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

const editRecord = (record: any) => {
  editingRecord.value = record
  Object.assign(form, record)
  showCreateModal.value = true
}

const editPermissions = (record: any) => {
  editingRecord.value = record
  selectedPermissions.value = ['system:user:view', 'system:role:view'] // 模拟已有权限
  showPermissionModal.value = true
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
    description: '',
    dataScope: 'dept',
    status: 'active',
    sortOrder: 0,
    userLimit: 0,
    remark: ''
  })
}

const handleSavePermissions = () => {
  console.log('保存权限:', selectedPermissions.value)
  showPermissionModal.value = false
  editingRecord.value = null
}
</script>

<style scoped>
.role-management {
  padding: 24px;
  background: #fff;
}
</style>