<template>
  <div class="department-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索部门名称、编码"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="active">启用</a-select-option>
          <a-select-option value="inactive">禁用</a-select-option>
        </a-select>
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新增部门
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
      :title="editingRecord ? '编辑部门' : '新增部门'"
      width="700px"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="部门名称" required>
              <a-input v-model:value="form.name" placeholder="输入部门名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门编码" required>
              <a-input v-model:value="form.code" placeholder="输入部门编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="上级部门">
              <a-select v-model:value="form.parent" placeholder="选择上级部门">
                <a-select-option value="">无</a-select-option>
                <a-select-option value="1">总公司</a-select-option>
                <a-select-option value="2">质量部</a-select-option>
                <a-select-option value="3">生产部</a-select-option>
                <a-select-option value="4">技术部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门负责人">
              <a-input v-model:value="form.manager" placeholder="输入部门负责人" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话">
              <a-input v-model:value="form.phone" placeholder="输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="人员数量">
              <a-input-number v-model:value="form.memberCount" placeholder="输入人员数量" style="width: 100%" />
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
        <a-form-item label="部门职能">
          <a-textarea v-model:value="form.function" placeholder="输入部门职能描述" :rows="3" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" placeholder="输入备注信息" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const searchText = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const editingRecord = ref(null)

const columns = [
  { title: '部门名称', dataIndex: 'name', key: 'name' },
  { title: '部门编码', dataIndex: 'code', key: 'code' },
  { title: '上级部门', dataIndex: 'parent', key: 'parent' },
  { title: '部门负责人', dataIndex: 'manager', key: 'manager' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
  { title: '人员数量', dataIndex: 'memberCount', key: 'memberCount' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action' }
]

const data = ref([
  {
    key: '1',
    name: '质量部',
    code: 'QUALITY',
    parent: '总公司',
    manager: '王经理',
    phone: '021-12345679',
    memberCount: 25,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '2',
    name: '生产部',
    code: 'PRODUCTION',
    parent: '总公司',
    manager: '李经理',
    phone: '021-12345680',
    memberCount: 120,
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '3',
    name: '技术部',
    code: 'TECH',
    parent: '总公司',
    manager: '张经理',
    phone: '021-12345681',
    memberCount: 35,
    status: 'active',
    createTime: '2023-01-01'
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
  parent: '',
  manager: '',
  phone: '',
  memberCount: 0,
  status: 'active',
  sortOrder: 0,
  function: '',
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
    parent: '',
    manager: '',
    phone: '',
    memberCount: 0,
    status: 'active',
    sortOrder: 0,
    function: '',
    remark: ''
  })
}
</script>

<style scoped>
.department-management {
  padding: 24px;
  background: #fff;
}
</style>