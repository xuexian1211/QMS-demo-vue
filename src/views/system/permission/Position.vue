<template>
  <div class="position-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索岗位名称、编码"
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
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新增岗位
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
      :title="editingRecord ? '编辑岗位' : '新增岗位'"
      width="700px"
      @ok="handleSave"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="岗位名称" required>
              <a-input v-model:value="form.name" placeholder="输入岗位名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位编码" required>
              <a-input v-model:value="form.code" placeholder="输入岗位编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属部门" required>
              <a-select v-model:value="form.department" placeholder="选择所属部门" :options="[
                { value: '1', label: '质量部' },
                { value: '2', label: '生产部' },
                { value: '3', label: '技术部' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位级别">
              <a-select v-model:value="form.level" placeholder="选择岗位级别" :options="[
                { value: '1', label: '高级' },
                { value: '2', label: '中级' },
                { value: '3', label: '初级' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="岗位序列">
              <a-select v-model:value="form.sequence" placeholder="选择岗位序列" :options="[
                { value: 'management', label: '管理序列' },
                { value: 'technical', label: '技术序列' },
                { value: 'operation', label: '操作序列' },
                { value: 'support', label: '支持序列' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="编制人数">
              <a-input-number v-model:value="form.headcount" placeholder="输入编制人数" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="现任人数">
              <a-input-number v-model:value="form.currentCount" placeholder="输入现任人数" style="width: 100%" />
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
            <a-form-item label="状态">
              <a-select v-model:value="form.status" placeholder="选择状态" :options="[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '禁用' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位类型">
              <a-select v-model:value="form.type" placeholder="选择岗位类型" :options="[
                { value: 'fulltime', label: '全职' },
                { value: 'parttime', label: '兼职' },
                { value: 'contract', label: '合同制' },
                { value: 'intern', label: '实习' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="岗位职责">
          <a-textarea v-model:value="form.responsibilities" placeholder="输入岗位职责描述" :rows="4" />
        </a-form-item>
        <a-form-item label="任职要求">
          <a-textarea v-model:value="form.requirements" placeholder="输入任职要求" :rows="4" />
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
const statusFilter = ref('')
const departmentFilter = ref('')
const showCreateModal = ref(false)
const editingRecord = ref(null)

const columns = [
  { title: '岗位名称', dataIndex: 'name', key: 'name' },
  { title: '岗位编码', dataIndex: 'code', key: 'code' },
  { title: '所属部门', dataIndex: 'department', key: 'department' },
  { title: '岗位级别', dataIndex: 'level', key: 'level' },
  { title: '岗位序列', dataIndex: 'sequence', key: 'sequence' },
  { title: '编制人数', dataIndex: 'headcount', key: 'headcount' },
  { title: '现任人数', dataIndex: 'currentCount', key: 'currentCount' },
  { title: '岗位类型', dataIndex: 'type', key: 'type' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200 }
]

const data = ref([
  {
    key: '1',
    name: '质量经理',
    code: 'QUALITY_MANAGER',
    department: '质量部',
    level: '高级',
    sequence: '管理序列',
    headcount: 1,
    currentCount: 1,
    type: '全职',
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '2',
    name: '质量工程师',
    code: 'QUALITY_ENGINEER',
    department: '质量部',
    level: '中级',
    sequence: '技术序列',
    headcount: 5,
    currentCount: 3,
    type: '全职',
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '3',
    name: '质检员',
    code: 'QUALITY_INSPECTOR',
    department: '质量部',
    level: '初级',
    sequence: '操作序列',
    headcount: 10,
    currentCount: 8,
    type: '全职',
    status: 'active',
    createTime: '2023-01-01'
  },
  {
    key: '4',
    name: '生产主管',
    code: 'PRODUCTION_SUPERVISOR',
    department: '生产部',
    level: '中级',
    sequence: '管理序列',
    headcount: 3,
    currentCount: 2,
    type: '全职',
    status: 'active',
    createTime: '2023-01-01'
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
  department: '',
  level: '',
  sequence: '',
  headcount: 0,
  currentCount: 0,
  sortOrder: 0,
  responsibilities: '',
  requirements: '',
  status: 'active',
  type: 'fulltime',
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
    department: '',
    level: '',
    sequence: '',
    headcount: 0,
    currentCount: 0,
    sortOrder: 0,
    responsibilities: '',
    requirements: '',
    status: 'active',
    type: 'fulltime',
    remark: ''
  })
}
</script>

<style scoped>
.position-management {
  padding: 24px;
  background: #fff;
}
</style>