<template>
  <div class="customer-supplier">
    <div class="page-header">
      <h2>客商资料管理</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增客商
      </a-button>
    </div>

    <div class="search-form">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="客商编码">
          <a-input 
            v-model:value="searchForm.partnerCode" 
            placeholder="请输入客商编码"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="客商名称">
          <a-input 
            v-model:value="searchForm.partnerName" 
            placeholder="请输入客商名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="客商类型">
          <a-select 
            v-model:value="searchForm.partnerType" 
            placeholder="请选择客商类型"
            allow-clear
            style="width: 150px"
          >
            <a-select-option value="customer">客户</a-select-option>
            <a-select-option value="supplier">供应商</a-select-option>
            <a-select-option value="both">客户和供应商</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="联系人">
          <a-input 
            v-model:value="searchForm.contactPerson" 
            placeholder="请输入联系人"
            allow-clear
            style="width: 150px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select 
            v-model:value="searchForm.status" 
            placeholder="请选择状态"
            allow-clear
            style="width: 120px"
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="table-container">
      <a-table 
        :columns="columns" 
        :data-source="dataSource" 
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'partnerType'">
            <a-tag :color="getPartnerTypeColor(record.partnerType)">
              {{ getPartnerTypeText(record.partnerType) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">
              {{ record.status === '1' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'creditLevel'">
            <a-rate :value="record.creditLevel" disabled allow-half />
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-button type="link" size="small" @click="handleView(record)">
                <template #icon><EyeOutlined /></template>
                查看
              </a-button>
              <a-popconfirm
                title="确定要删除这个客商资料吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="link" size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="1000px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客商编码" name="partnerCode">
              <a-input v-model:value="formData.partnerCode" placeholder="请输入客商编码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="客商名称" name="partnerName">
              <a-input v-model:value="formData.partnerName" placeholder="请输入客商名称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="客商类型" name="partnerType">
              <a-select v-model:value="formData.partnerType" placeholder="请选择客商类型">
                <a-select-option value="customer">客户</a-select-option>
                <a-select-option value="supplier">供应商</a-select-option>
                <a-select-option value="both">客户和供应商</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="信用等级" name="creditLevel">
              <a-rate v-model:value="formData.creditLevel" allow-half />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio value="1">启用</a-radio>
                <a-radio value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-divider>基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="统一社会信用代码" name="creditCode">
              <a-input v-model:value="formData.creditCode" placeholder="请输入统一社会信用代码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="法定代表人" name="legalPerson">
              <a-input v-model:value="formData.legalPerson" placeholder="请输入法定代表人" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱地址" name="email">
              <a-input v-model:value="formData.email" placeholder="请输入邮箱地址" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="详细地址" name="address">
          <a-textarea 
            v-model:value="formData.address" 
            placeholder="请输入详细地址"
            :rows="2"
          />
        </a-form-item>
        
        <a-divider>联系人信息</a-divider>
        <a-form-item label="联系人列表">
          <a-table 
            :columns="contactColumns" 
            :data-source="formData.contacts" 
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'name'">
                <a-input v-model:value="record.name" placeholder="姓名" />
              </template>
              <template v-if="column.key === 'position'">
                <a-input v-model:value="record.position" placeholder="职位" />
              </template>
              <template v-if="column.key === 'phone'">
                <a-input v-model:value="record.phone" placeholder="电话" />
              </template>
              <template v-if="column.key === 'email'">
                <a-input v-model:value="record.email" placeholder="邮箱" />
              </template>
              <template v-if="column.key === 'isPrimary'">
                <a-checkbox v-model:checked="record.isPrimary">主要联系人</a-checkbox>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" danger @click="removeContact(index)">
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </template>
            </template>
            <template #footer>
              <a-button type="dashed" @click="addContact" block>
                <template #icon><PlusOutlined /></template>
                添加联系人
              </a-button>
            </template>
          </a-table>
        </a-form-item>
        
        <a-divider>其他信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开户银行" name="bankName">
              <a-input v-model:value="formData.bankName" placeholder="请输入开户银行" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="银行账号" name="bankAccount">
              <a-input v-model:value="formData.bankAccount" placeholder="请输入银行账号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea 
            v-model:value="formData.remark" 
            placeholder="请输入备注信息"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="客商详情"
      width="900px"
      :footer="null"
    >
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="客商编码">{{ viewData.partnerCode }}</a-descriptions-item>
        <a-descriptions-item label="客商名称">{{ viewData.partnerName }}</a-descriptions-item>
        <a-descriptions-item label="客商类型">
          <a-tag :color="getPartnerTypeColor(viewData.partnerType)">
            {{ getPartnerTypeText(viewData.partnerType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="信用等级">
          <a-rate :value="viewData.creditLevel" disabled allow-half />
        </a-descriptions-item>
        <a-descriptions-item label="统一社会信用代码">{{ viewData.creditCode }}</a-descriptions-item>
        <a-descriptions-item label="法定代表人">{{ viewData.legalPerson }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ viewData.phone }}</a-descriptions-item>
        <a-descriptions-item label="邮箱地址">{{ viewData.email }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="viewData.status === '1' ? 'green' : 'red'">
            {{ viewData.status === '1' ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="详细地址" :span="3">{{ viewData.address }}</a-descriptions-item>
        <a-descriptions-item label="开户银行">{{ viewData.bankName }}</a-descriptions-item>
        <a-descriptions-item label="银行账号">{{ viewData.bankAccount }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="3">{{ viewData.remark || '无' }}</a-descriptions-item>
      </a-descriptions>
      
      <a-divider>联系人信息</a-divider>
      <a-table 
        :columns="contactColumns" 
        :data-source="viewData.contacts || []" 
        :pagination="false"
        size="small"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  partnerCode: '',
  partnerName: '',
  partnerType: undefined,
  contactPerson: '',
  status: undefined
})

// 表单数据
const formData = reactive({
  id: '',
  partnerCode: '',
  partnerName: '',
  partnerType: 'customer',
  creditLevel: 3,
  creditCode: '',
  legalPerson: '',
  phone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  remark: '',
  status: '1',
  contacts: []
})

// 联系人列表定义
const contactColumns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100
  },
  {
    title: '职位',
    dataIndex: 'position',
    key: 'position',
    width: 100
  },
  {
    title: '电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 120
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 150
  },
  {
    title: '主要联系人',
    dataIndex: 'isPrimary',
    key: 'isPrimary',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 80
  }
]

// 表格列定义
const columns = [
  {
    title: '客商编码',
    dataIndex: 'partnerCode',
    key: 'partnerCode',
    width: 120,
    fixed: 'left'
  },
  {
    title: '客商名称',
    dataIndex: 'partnerName',
    key: 'partnerName',
    width: 150,
    fixed: 'left'
  },
  {
    title: '客商类型',
    dataIndex: 'partnerType',
    key: 'partnerType',
    width: 120
  },
  {
    title: '信用等级',
    dataIndex: 'creditLevel',
    key: 'creditLevel',
    width: 120
  },
  {
    title: '联系人',
    dataIndex: 'primaryContact',
    key: 'primaryContact',
    width: 100,
    customRender: ({ record }) => {
      const primaryContact = record.contacts?.find(c => c.isPrimary)
      return primaryContact ? primaryContact.name : '未设置'
    }
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 120
  },
  {
    title: '邮箱地址',
    dataIndex: 'email',
    key: 'email',
    width: 180
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 表格数据
const dataSource = ref([
  {
    id: '1',
    partnerCode: 'CUST001',
    partnerName: '华为技术有限公司',
    partnerType: 'customer',
    creditLevel: 5,
    creditCode: '91440300708461136T',
    legalPerson: '任正非',
    phone: '0755-28780808',
    email: 'contact@huawei.com',
    address: '广东省深圳市龙岗区坂田华为基地',
    bankName: '中国工商银行深圳分行',
    bankAccount: '6222024000012345678',
    remark: '重要战略客户',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 10:30:00',
    contacts: [
      { name: '张经理', position: '采购经理', phone: '13800138001', email: 'zhang@huawei.com', isPrimary: true },
      { name: '李工程师', position: '技术总监', phone: '13800138002', email: 'li@huawei.com', isPrimary: false }
    ]
  },
  {
    id: '2',
    partnerCode: 'SUP001',
    partnerName: '富士康科技集团',
    partnerType: 'supplier',
    creditLevel: 4,
    creditCode: '91440300617505445L',
    legalPerson: '郭台铭',
    phone: '0755-28128888',
    email: 'supplier@foxconn.com',
    address: '广东省深圳市宝安区龙华街道富士康科技园',
    bankName: '中国建设银行深圳分行',
    bankAccount: '6227007200012345678',
    remark: '主要供应商',
    status: '1',
    createTime: '2024-01-15 10:35:00',
    updateTime: '2024-01-15 10:35:00',
    contacts: [
      { name: '王总监', position: '销售总监', phone: '13800138003', email: 'wang@foxconn.com', isPrimary: true },
      { name: '陈经理', position: '客户经理', phone: '13800138004', email: 'chen@foxconn.com', isPrimary: false }
    ]
  },
  {
    id: '3',
    partnerCode: 'BOTH001',
    partnerName: '比亚迪股份有限公司',
    partnerType: 'both',
    creditLevel: 4.5,
    creditCode: '914403007175306000',
    legalPerson: '王传福',
    phone: '0755-89888888',
    email: 'info@byd.com',
    address: '广东省深圳市坪山区比亚迪路3009号',
    bankName: '中国银行深圳分行',
    bankAccount: '6217902000012345678',
    remark: '既是客户也是供应商',
    status: '1',
    createTime: '2024-01-15 10:40:00',
    updateTime: '2024-01-15 10:40:00',
    contacts: [
      { name: '赵总', position: '总经理', phone: '13800138005', email: 'zhao@byd.com', isPrimary: true },
      { name: '钱经理', position: '采购经理', phone: '13800138006', email: 'qian@byd.com', isPrimary: false }
    ]
  }
])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 查看数据
const viewData = ref({})

// 表单验证规则
const rules = {
  partnerCode: [
    { required: true, message: '请输入客商编码', trigger: 'blur' }
  ],
  partnerName: [
    { required: true, message: '请输入客商名称', trigger: 'blur' }
  ],
  partnerType: [
    { required: true, message: '请选择客商类型', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 工具方法
const getPartnerTypeText = (type) => {
  const typeMap = {
    'customer': '客户',
    'supplier': '供应商',
    'both': '客户和供应商'
  }
  return typeMap[type] || '未知'
}

const getPartnerTypeColor = (type) => {
  const colorMap = {
    'customer': 'blue',
    'supplier': 'green',
    'both': 'purple'
  }
  return colorMap[type] || 'default'
}

// 计算属性
const modalTitle = computed(() => isEdit.value ? '编辑客商资料' : '新增客商资料')

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    partnerCode: '',
    partnerName: '',
    partnerType: undefined,
    contactPerson: '',
    status: undefined
  })
  handleSearch()
}

const handleTableChange = (pag, filters, sorter) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

const showAddModal = () => {
  isEdit.value = false
  modalVisible.value = true
  resetForm()
}

const handleEdit = (record) => {
  isEdit.value = true
  modalVisible.value = true
  Object.assign(formData, {
    ...record,
    contacts: [...(record.contacts || [])]
  })
}

const handleView = (record) => {
  viewData.value = record
  viewModalVisible.value = true
}

const handleDelete = (id) => {
  // 模拟删除操作
  const index = dataSource.value.findIndex(item => item.id === id)
  if (index > -1) {
    dataSource.value.splice(index, 1)
    message.success('删除成功')
    fetchData()
  }
}

const addContact = () => {
  const newContact = {
    name: '',
    position: '',
    phone: '',
    email: '',
    isPrimary: false
  }
  formData.contacts.push(newContact)
}

const removeContact = (index) => {
  formData.contacts.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      // 编辑操作
      const index = dataSource.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        dataSource.value[index] = {
          ...formData,
          updateTime: new Date().toLocaleString()
        }
        message.success('更新成功')
      }
    } else {
      // 新增操作
      const newId = (Math.max(...dataSource.value.map(item => parseInt(item.id))) + 1).toString()
      const newItem = {
        ...formData,
        id: newId,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
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
    id: '',
    partnerCode: '',
    partnerName: '',
    partnerType: 'customer',
    creditLevel: 3,
    creditCode: '',
    legalPerson: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccount: '',
    remark: '',
    status: '1',
    contacts: []
  })
  formRef.value?.resetFields()
}

const fetchData = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    // 这里可以根据搜索条件过滤数据
    let filteredData = [...dataSource.value]
    
    if (searchForm.partnerCode) {
      filteredData = filteredData.filter(item => 
        item.partnerCode.includes(searchForm.partnerCode)
      )
    }
    
    if (searchForm.partnerName) {
      filteredData = filteredData.filter(item => 
        item.partnerName.includes(searchForm.partnerName)
      )
    }
    
    if (searchForm.partnerType) {
      filteredData = filteredData.filter(item => item.partnerType === searchForm.partnerType)
    }
    
    if (searchForm.contactPerson) {
      filteredData = filteredData.filter(item => {
        const primaryContact = item.contacts?.find(c => c.isPrimary)
        return primaryContact && primaryContact.name.includes(searchForm.contactPerson)
      })
    }
    
    if (searchForm.status !== undefined) {
      filteredData = filteredData.filter(item => item.status === searchForm.status)
    }
    
    pagination.total = filteredData.length
    loading.value = false
  }, 500)
}

// 生命周期
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.customer-supplier {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.search-form {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.table-container {
  margin-top: 16px;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

:deep(.ant-rate) {
  font-size: 14px;
}
</style>