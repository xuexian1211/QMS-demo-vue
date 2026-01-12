<template>
  <div class="supplier-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索供应商名称、编码"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px; margin-right: 16px;" :options="[
          { value: '', label: '全部' },
          { value: 'active', label: '活跃' },
          { value: 'inactive', label: '停用' }
        ]" />
        <a-select v-model:value="levelFilter" placeholder="等级筛选" style="width: 120px;" :options="[
          { value: '', label: '全部' },
          { value: 'A', label: 'A级' },
          { value: 'B', label: 'B级' },
          { value: 'C', label: 'C级' }
        ]" />
      </div>
      <div>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 新增供应商
        </a-button>
      </div>
    </div>

    <a-table :columns="columns" :data-source="supplierData" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '活跃' : '停用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)">{{ record.level }}级</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
          <a-button type="link" size="small" @click="editSupplier(record)">编辑</a-button>
          <a-button type="link" size="small" @click="auditSupplier(record)">审核</a-button>
        </template>
      </template>
    </a-table>

    <!-- 新增供应商模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新增供应商"
      width="800px"
      @ok="handleCreateSupplier"
    >
      <a-form :model="createForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="供应商名称">
              <a-input v-model:value="createForm.name" placeholder="输入供应商名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="供应商编码">
              <a-input v-model:value="createForm.code" placeholder="输入供应商编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系人">
              <a-input v-model:value="createForm.contact" placeholder="输入联系人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系电话">
              <a-input v-model:value="createForm.phone" placeholder="输入联系电话" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="地址">
          <a-input v-model:value="createForm.address" placeholder="输入详细地址" />
        </a-form-item>
        <a-form-item label="主要产品">
          <a-textarea v-model:value="createForm.products" :rows="2" placeholder="输入主要产品信息" />
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
const levelFilter = ref('')
const showCreateModal = ref(false)

const columns = [
  { title: '供应商编码', dataIndex: 'code', key: 'code' },
  { title: '供应商名称', dataIndex: 'name', key: 'name' },
  { title: '联系人', dataIndex: 'contact', key: 'contact' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
  { title: '主要产品', dataIndex: 'products', key: 'products' },
  { title: '等级', dataIndex: 'level', key: 'level' },
  { title: '合格率', dataIndex: 'qualityRate', key: 'qualityRate' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' }
]

const supplierData = ref([
  {
    key: '1',
    code: 'SUP001',
    name: '一汽铸造有限公司',
    contact: '张经理',
    phone: '0431-12345678',
    products: '发动机缸体、缸盖',
    level: 'A',
    qualityRate: '99.2%',
    status: 'active'
  },
  {
    key: '2',
    code: 'SUP002',
    name: '东风齿轮制造厂',
    contact: '李总',
    phone: '027-87654321',
    products: '变速箱齿轮、传动轴',
    level: 'A',
    qualityRate: '98.8%',
    status: 'active'
  },
  {
    key: '3',
    code: 'SUP003',
    name: '上汽制动系统厂',
    contact: '王主任',
    phone: '021-11223344',
    products: '刹车片、制动盘',
    level: 'B',
    qualityRate: '97.5%',
    status: 'active'
  }
])

const createForm = reactive({
  name: '',
  code: '',
  contact: '',
  phone: '',
  address: '',
  products: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}

const getLevelColor = (level: string) => {
  const colors = {
    A: 'green',
    B: 'orange',
    C: 'red'
  }
  return colors[level] || 'default'
}

const viewDetail = (record: any) => {
  console.log('查看详情:', record)
}

const editSupplier = (record: any) => {
  console.log('编辑供应商:', record)
}

const auditSupplier = (record: any) => {
  console.log('审核供应商:', record)
}

const handleCreateSupplier = () => {
  console.log('创建供应商:', createForm)
  showCreateModal.value = false
}
</script>

<style scoped>
.supplier-management {
  padding: 24px;
  background: #fff;
}
</style>