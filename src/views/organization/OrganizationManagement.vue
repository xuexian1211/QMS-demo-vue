<template>
  <div class="organization-management">
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="users" tab="用户管理">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <a-input-search
              v-model:value="userSearchText"
              placeholder="搜索用户名、姓名"
              style="width: 300px; margin-right: 16px;"
              @search="handleUserSearch"
            />
            <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="active">启用</a-select-option>
              <a-select-option value="inactive">禁用</a-select-option>
            </a-select>
          </div>
          <div>
            <a-button type="primary" @click="showCreateUserModal = true">
              <PlusOutlined /> 新增用户
            </a-button>
          </div>
        </div>

        <a-table :columns="userColumns" :data-source="userData" :pagination="userPagination">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                {{ record.status === 'active' ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="editUser(record)">编辑</a-button>
              <a-button type="link" size="small" @click="resetPassword(record)">重置密码</a-button>
              <a-button type="link" size="small" @click="toggleUserStatus(record)">
                {{ record.status === 'active' ? '禁用' : '启用' }}
              </a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="roles" tab="角色管理">
        <div style="margin-bottom: 16px;">
          <a-button type="primary" @click="showCreateRoleModal = true">
            <PlusOutlined /> 新增角色
          </a-button>
        </div>

        <a-table :columns="roleColumns" :data-source="roleData" :pagination="rolePagination">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="editRole(record)">编辑</a-button>
              <a-button type="link" size="small" @click="configPermissions(record)">权限配置</a-button>
              <a-button type="link" size="small" @click="deleteRole(record)">删除</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="departments" tab="部门管理">
        <div style="margin-bottom: 16px;">
          <a-button type="primary" @click="showCreateDeptModal = true">
            <PlusOutlined /> 新增部门
          </a-button>
        </div>

        <a-table :columns="deptColumns" :data-source="deptData" :pagination="deptPagination">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="editDept(record)">编辑</a-button>
              <a-button type="link" size="small" @click="deleteDept(record)">删除</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 新增用户模态框 -->
    <a-modal
      v-model:open="showCreateUserModal"
      title="新增用户"
      width="600px"
      @ok="handleCreateUser"
    >
      <a-form :model="createUserForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名">
              <a-input v-model:value="createUserForm.username" placeholder="输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="姓名">
              <a-input v-model:value="createUserForm.realName" placeholder="输入真实姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="createUserForm.email" placeholder="输入邮箱地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input v-model:value="createUserForm.phone" placeholder="输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属部门">
              <a-select v-model:value="createUserForm.department" placeholder="选择部门">
                <a-select-option value="quality">质量部</a-select-option>
                <a-select-option value="production">生产部</a-select-option>
                <a-select-option value="tech">技术部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色">
              <a-select v-model:value="createUserForm.role" placeholder="选择角色">
                <a-select-option value="admin">管理员</a-select-option>
                <a-select-option value="inspector">检验员</a-select-option>
                <a-select-option value="viewer">查看者</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const activeTab = ref('users')
const userSearchText = ref('')
const statusFilter = ref('')
const showCreateUserModal = ref(false)
const showCreateRoleModal = ref(false)
const showCreateDeptModal = ref(false)

const userColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'realName', key: 'realName' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '所属部门', dataIndex: 'department', key: 'department' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' }
]

const userData = ref([
  {
    key: '1',
    username: 'zhangsan',
    realName: '张三',
    email: 'zhangsan@company.com',
    phone: '13800138001',
    department: '质量部',
    role: '检验员',
    status: 'active'
  },
  {
    key: '2',
    username: 'lisi',
    realName: '李四',
    email: 'lisi@company.com',
    phone: '13800138002',
    department: '生产部',
    role: '操作员',
    status: 'active'
  }
])

const roleColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色描述', dataIndex: 'description', key: 'description' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action' }
]

const roleData = ref([
  {
    key: '1',
    roleName: '管理员',
    description: '系统管理员，拥有所有权限',
    createTime: '2023-01-01'
  },
  {
    key: '2',
    roleName: '检验员',
    description: '质量检验人员，负责检验工作',
    createTime: '2023-01-01'
  }
])

const deptColumns = [
  { title: '部门名称', dataIndex: 'deptName', key: 'deptName' },
  { title: '部门编码', dataIndex: 'deptCode', key: 'deptCode' },
  { title: '负责人', dataIndex: 'manager', key: 'manager' },
  { title: '人员数量', dataIndex: 'memberCount', key: 'memberCount' },
  { title: '操作', key: 'action' }
]

const deptData = ref([
  {
    key: '1',
    deptName: '质量部',
    deptCode: 'QLT',
    manager: '王经理',
    memberCount: 25
  },
  {
    key: '2',
    deptName: '生产部',
    deptCode: 'PRD',
    manager: '李经理',
    memberCount: 120
  }
])

const createUserForm = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  department: '',
  role: ''
})

const userPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 2,
  showSizeChanger: true,
  showQuickJumper: true
})

const rolePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 2,
  showSizeChanger: true,
  showQuickJumper: true
})

const deptPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 2,
  showSizeChanger: true,
  showQuickJumper: true
})

const handleUserSearch = () => {
  console.log('搜索用户:', userSearchText.value)
}

const editUser = (record: any) => {
  console.log('编辑用户:', record)
}

const resetPassword = (record: any) => {
  console.log('重置密码:', record)
}

const toggleUserStatus = (record: any) => {
  console.log('切换用户状态:', record)
}

const editRole = (record: any) => {
  console.log('编辑角色:', record)
}

const configPermissions = (record: any) => {
  console.log('配置权限:', record)
}

const deleteRole = (record: any) => {
  console.log('删除角色:', record)
}

const editDept = (record: any) => {
  console.log('编辑部门:', record)
}

const deleteDept = (record: any) => {
  console.log('删除部门:', record)
}

const handleCreateUser = () => {
  console.log('创建用户:', createUserForm)
  showCreateUserModal.value = false
}
</script>

<style scoped>
.organization-management {
  padding: 24px;
  background: #fff;
}
</style>