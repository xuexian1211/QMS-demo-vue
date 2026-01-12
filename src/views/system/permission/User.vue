<template>
  <ConfigProvider :locale="zhCN">
    <div class="user-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索用户名、姓名、工号"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;" :options="[
          { value: '', label: '全部' },
          { value: 'active', label: '启用' },
          { value: 'inactive', label: '禁用' }
        ]" />
        <a-select v-model:value="departmentFilter" placeholder="部门筛选" style="width: 120px;" :options="[
          { value: '', label: '全部' },
          { value: '1', label: '质量部' },
          { value: '2', label: '生产部' },
          { value: '3', label: '技术部' }
        ]" />
      </div>
      <div>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined /> 新增用户
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="data" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'avatar'">
          <a-avatar :src="record.avatar" :alt="record.name">{{ record.name.charAt(0) }}</a-avatar>
        </template>
        <template v-if="column.key === 'gender'">
          <span>{{ record.gender === 'male' ? '男' : '女' }}</span>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : record.status === 'locked' ? 'orange' : 'red'">
            {{ record.status === 'active' ? '启用' : record.status === 'locked' ? '锁定' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'role'">
          <span>{{ getRoleName(record.role) }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="editRecord(record)">编辑</a-button>
          <a-button type="link" size="small" @click="resetPassword(record)">重置密码</a-button>
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
      :title="modalTitle"
      width="700px"
      @ok="handleSave"
      @cancel="handleCancel"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" required>
              <a-input v-model:value="form.username" placeholder="输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工号" required>
              <a-input v-model:value="form.employeeId" placeholder="输入工号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input v-model:value="form.name" placeholder="输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="性别">
              <a-select v-model:value="form.gender" placeholder="选择性别" :options="[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="form.email" placeholder="输入邮箱地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input v-model:value="form.phone" placeholder="输入手机号码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属部门" required>
              <a-select v-model:value="form.department" placeholder="选择所属部门" :options="[
                { value: '1', label: '质量部' },
                { value: '2', label: '生产部' },
                { value: '3', label: '技术部' },
                { value: '4', label: '采购部' },
                { value: '5', label: '财务部' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="职位">
              <a-input v-model:value="form.position" placeholder="输入职位名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="角色" required>
              <a-select v-model:value="form.role" placeholder="选择用户角色" :options="[
                { value: 'admin', label: '系统管理员' },
                { value: 'manager', label: '部门经理' },
                { value: 'supervisor', label: '主管' },
                { value: 'user', label: '普通员工' },
                { value: 'auditor', label: '审核员' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="入职日期">
              <a-date-picker 
                v-model:value="form.joinDate" 
                placeholder="选择入职日期" 
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :locale="{ lang: { locale: 'zh_CN' } }"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="直接上级">
              <a-select v-model:value="form.supervisor" placeholder="选择直接上级" allow-clear :options="[
                { value: '1', label: '张经理' },
                { value: '2', label: '李主管' },
                { value: '3', label: '王总监' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工作地点">
              <a-input v-model:value="form.workLocation" placeholder="输入工作地点" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16" v-if="isCreateMode">
          <a-col :span="12">
            <a-form-item label="密码" required>
              <a-input-password v-model:value="form.password" placeholder="输入登录密码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="确认密码" required>
              <a-input-password v-model:value="form.confirmPassword" placeholder="再次输入密码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="账号状态">
              <a-select v-model:value="form.status" placeholder="选择账号状态" :options="[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '禁用' },
                { value: 'locked', label: '锁定' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序号">
              <a-input-number v-model:value="form.sortOrder" placeholder="输入排序号" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" placeholder="输入备注信息" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from '../utils/dayjs'

const searchText = ref('')
const statusFilter = ref('')
const departmentFilter = ref('')
const showCreateModal = ref(false)
const isEditMode = ref(false)

// 计算属性
const modalTitle = computed(() => isEditMode.value ? '编辑用户' : '新增用户')
const isCreateMode = computed(() => !isEditMode.value)

const columns = [
  { title: '头像', dataIndex: 'avatar', key: 'avatar', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '工号', dataIndex: 'employeeId', key: 'employeeId' },
  { title: '性别', dataIndex: 'gender', key: 'gender', width: 80 },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '职位', dataIndex: 'position', key: 'position' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '入职日期', dataIndex: 'joinDate', key: 'joinDate' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin' },
  { title: '操作', key: 'action', width: 200 }
]

const data = ref([
  {
    key: '1',
    avatar: '',
    username: 'admin',
    name: '管理员',
    gender: 'male',
    employeeId: 'EMP001',
    department: '质量部',
    position: '系统管理员',
    role: 'admin',
    email: 'admin@qms.com',
    phone: '13800138001',
    joinDate: '2023-01-15',
    status: 'active',
    lastLogin: '2023-12-01 10:30:00'
  },
  {
    key: '2',
    avatar: '',
    username: 'zhangsan',
    name: '张三',
    gender: 'male',
    employeeId: 'EMP002',
    department: '质量部',
    position: '质量工程师',
    role: 'user',
    email: 'zhangsan@qms.com',
    phone: '13800138002',
    joinDate: '2023-03-20',
    status: 'active',
    lastLogin: '2023-12-01 09:15:00'
  },
  {
    key: '3',
    avatar: '',
    username: 'lisi',
    name: '李四',
    gender: 'female',
    employeeId: 'EMP003',
    department: '生产部',
    position: '生产主管',
    role: 'manager',
    email: 'lisi@qms.com',
    phone: '13800138003',
    joinDate: '2022-08-10',
    status: 'active',
    lastLogin: '2023-11-30 16:45:00'
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
  username: '',
  employeeId: '',
  name: '',
  gender: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  role: '',
  joinDate: '',
  supervisor: '',
  workLocation: '',
  password: '',
  confirmPassword: '',
  status: 'active',
  sortOrder: 0,
  remark: ''
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

const getRoleName = (role: string) => {
  const roleMap: { [key: string]: string } = {
    'admin': '系统管理员',
    'manager': '部门经理',
    'supervisor': '主管',
    'user': '普通员工',
    'auditor': '审核员'
  }
  return roleMap[role] || role
}

const handleCreate = () => {
  try {
    isEditMode.value = false
    showCreateModal.value = true
    // 重置表单
    Object.assign(form, {
      username: '',
      employeeId: '',
      name: '',
      gender: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      role: '',
      joinDate: '',
      supervisor: '',
      workLocation: '',
      password: '',
      confirmPassword: '',
      status: 'active',
      sortOrder: 0,
      remark: ''
    })
  } catch (error) {
    console.error('创建用户时出错:', error)
  }
}

const handleCancel = () => {
  showCreateModal.value = false
  isEditMode.value = false
  // 重置表单
  Object.assign(form, {
    username: '',
    employeeId: '',
    name: '',
    gender: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: '',
    joinDate: '',
    supervisor: '',
    workLocation: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    sortOrder: 0,
    remark: ''
  })
}

const editRecord = (record: any) => {
  try {
    isEditMode.value = true
    // 复制记录到表单，但不包含密码字段
    Object.assign(form, {
      username: record.username || '',
      employeeId: record.employeeId || '',
      name: record.name || '',
      gender: record.gender || '',
      email: record.email || '',
      phone: record.phone || '',
      department: record.department || '',
      position: record.position || '',
      role: record.role || '',
      joinDate: record.joinDate || '',
      supervisor: record.supervisor || '',
      workLocation: record.workLocation || '',
      password: '',
      confirmPassword: '',
      status: record.status || 'active',
      sortOrder: record.sortOrder || 0,
      remark: record.remark || ''
    })
    showCreateModal.value = true
  } catch (error) {
    console.error('编辑用户时出错:', error)
  }
}

const resetPassword = (record: any) => {
  console.log('重置密码:', record)
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
  isEditMode.value = false
  // 重置表单
  Object.assign(form, {
    username: '',
    employeeId: '',
    name: '',
    gender: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: '',
    joinDate: '',
    supervisor: '',
    workLocation: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    sortOrder: 0,
    remark: ''
  })
}
</script>

<style scoped>
.user-management {
  padding: 24px;
  background: #fff;
}
</style>