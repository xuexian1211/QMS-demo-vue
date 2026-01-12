<template>
  <div class="menu-management">
    <div class="page-header">
      <h2>菜单管理</h2>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><PlusOutlined /></template>
        新增菜单
      </a-button>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索菜单名称"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="menuType" placeholder="菜单类型" allowClear>
            <a-select-option value="menu">菜单</a-select-option>
            <a-select-option value="button">按钮</a-select-option>
            <a-select-option value="directory">目录</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="状态" allowClear>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 菜单树形表格 -->
    <a-table 
      :columns="columns" 
      :data-source="menuTree" 
      :pagination="false"
      :loading="loading"
      row-key="id"
      :default-expand-all="true"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'menuName'">
          <span>
            <component :is="getMenuIcon(record.icon)" v-if="record.icon" style="margin-right: 8px;" />
            {{ record.menuName }}
          </span>
        </template>
        <template v-if="column.key === 'menuType'">
          <a-tag :color="getMenuTypeColor(record.menuType)">
            {{ getMenuTypeText(record.menuType) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'visible'">
          <a-tag :color="record.visible ? 'green' : 'red'">
            {{ record.visible ? '显示' : '隐藏' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-switch 
            :checked="record.status === 'active'"
            @change="handleStatusChange(record)"
          />
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleAddChild(record)">新增子菜单</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除这个菜单吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑菜单模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="800px"
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
            <a-form-item label="上级菜单" name="parentId">
              <a-tree-select
                v-model:value="formData.parentId"
                :tree-data="parentMenuOptions"
                placeholder="请选择上级菜单"
                allow-clear
                :field-names="{ children: 'children', label: 'menuName', value: 'id' }"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="菜单类型" name="menuType">
              <a-select v-model:value="formData.menuType" placeholder="请选择菜单类型">
                <a-select-option value="directory">目录</a-select-option>
                <a-select-option value="menu">菜单</a-select-option>
                <a-select-option value="button">按钮</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="菜单名称" name="menuName">
              <a-input v-model:value="formData.menuName" placeholder="请输入菜单名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="权限标识" name="permission">
              <a-input v-model:value="formData.permission" placeholder="请输入权限标识" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-if="formData.menuType !== 'button'">
          <a-col :span="12">
            <a-form-item label="路由地址" name="path">
              <a-input v-model:value="formData.path" placeholder="请输入路由地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="组件路径" name="component">
              <a-input v-model:value="formData.component" placeholder="请输入组件路径" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="显示排序" name="orderNum">
              <a-input-number v-model:value="formData.orderNum" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="菜单图标" name="icon">
              <a-input v-model:value="formData.icon" placeholder="请输入图标名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否外链" name="isFrame">
              <a-switch v-model:checked="formData.isFrame" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="是否缓存" name="isCache">
              <a-switch v-model:checked="formData.isCache" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否显示" name="visible">
              <a-switch v-model:checked="formData.visible" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status">
                <a-switch 
                  :checked="formData.status === 'active'"
                  @change="checked => formData.status = checked ? 'active' : 'inactive'"
                />
              </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="备注" name="remark">
          <a-textarea 
            v-model:value="formData.remark" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, 
         HomeOutlined, UserOutlined, SettingOutlined, 
         FileTextOutlined, BarChartOutlined, SafetyOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const menuType = ref()
const status = ref()
const loading = ref(false)
const modalVisible = ref(false)
const modalTitle = ref('新增菜单')
const formRef = ref()

// 表格列配置
const columns = [
  {
    title: '菜单名称',
    dataIndex: 'menuName',
    key: 'menuName',
    width: 200
  },
  {
    title: '菜单类型',
    dataIndex: 'menuType',
    key: 'menuType',
    width: 100
  },
  {
    title: '权限标识',
    dataIndex: 'permission',
    key: 'permission',
    width: 150
  },
  {
    title: '路由地址',
    dataIndex: 'path',
    key: 'path',
    width: 200
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    key: 'component',
    width: 200
  },
  {
    title: '排序',
    dataIndex: 'orderNum',
    key: 'orderNum',
    width: 80
  },
  {
    title: '显示',
    dataIndex: 'visible',
    key: 'visible',
    width: 80
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 表单数据
const formData = reactive({
  parentId: null,
  menuType: 'menu',
  menuName: '',
  permission: '',
  path: '',
  component: '',
  orderNum: 0,
  icon: '',
  isFrame: false,
  isCache: true,
  visible: true,
  status: 'active',
  remark: ''
})

// 表单验证规则
const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }]
}

// 模拟菜单数据
const menus = ref([
  {
    id: 1,
    parentId: null,
    menuName: '首页',
    menuType: 'menu',
    permission: 'dashboard:view',
    path: '/dashboard',
    component: '@/views/Dashboard.vue',
    orderNum: 1,
    icon: 'HomeOutlined',
    isFrame: false,
    isCache: true,
    visible: true,
    status: 'active',
    remark: '系统首页',
    children: []
  },
  {
    id: 2,
    parentId: null,
    menuName: '质量管理',
    menuType: 'directory',
    permission: '',
    path: '/quality',
    component: '',
    orderNum: 2,
    icon: 'FileTextOutlined',
    isFrame: false,
    isCache: true,
    visible: true,
    status: 'active',
    remark: '质量管理模块',
    children: [
      {
        id: 21,
        parentId: 2,
        menuName: '来料检验',
        menuType: 'menu',
        permission: 'quality:iqc:view',
        path: '/quality/iqc',
        component: '@/views/quality/IQC.vue',
        orderNum: 1,
        icon: '',
        isFrame: false,
        isCache: true,
        visible: true,
        status: 'active',
        remark: '来料检验管理',
        children: []
      },
      {
        id: 22,
        parentId: 2,
        menuName: '新增检验单',
        menuType: 'button',
        permission: 'quality:iqc:add',
        path: '',
        component: '',
        orderNum: 2,
        icon: '',
        isFrame: false,
        isCache: true,
        visible: false,
        status: 'active',
        remark: '新增检验单按钮',
        children: []
      }
    ]
  },
  {
    id: 3,
    parentId: null,
    menuName: '系统管理',
    menuType: 'directory',
    permission: '',
    path: '/system',
    component: '',
    orderNum: 3,
    icon: 'SettingOutlined',
    isFrame: false,
    isCache: true,
    visible: true,
    status: 'active',
    remark: '系统管理模块',
    children: [
      {
        id: 31,
        parentId: 3,
        menuName: '系统公告',
        menuType: 'menu',
        permission: 'system:announcement:view',
        path: '/system/announcement',
        component: '@/views/system/Announcement.vue',
        orderNum: 1,
        icon: '',
        isFrame: false,
        isCache: true,
        visible: true,
        status: 'active',
        remark: '系统公告管理',
        children: []
      }
    ]
  }
])

// 构建菜单树
const menuTree = computed(() => {
  return buildTree(menus.value, null)
})

// 父级菜单选项
const parentMenuOptions = computed(() => {
  return buildTreeOptions(menus.value, null)
})

// 构建树形结构
const buildTree = (array: any[], parentId: any) => {
  const tree: any[] = []
  array.forEach(item => {
    if (item.parentId === parentId) {
      const children = buildTree(array, item.id)
      if (children.length > 0) {
        item.children = children
      }
      tree.push(item)
    }
  })
  return tree
}

// 构建树形选择器选项
const buildTreeOptions = (array: any[], parentId: any) => {
  const options: any[] = []
  array.forEach(item => {
    if (item.parentId === parentId) {
      const option: any = {
        id: item.id,
        menuName: item.menuName,
        value: item.id
      }
      const children = buildTreeOptions(array, item.id)
      if (children.length > 0) {
        option.children = children
      }
      options.push(option)
    }
  })
  return options
}

// 方法
const handleSearch = () => {
  fetchMenus()
}

const handleReset = () => {
  searchText.value = ''
  menuType.value = undefined
  status.value = undefined
  handleSearch()
}

const showCreateModal = () => {
  modalTitle.value = '新增菜单'
  resetForm()
  modalVisible.value = true
}

const handleAddChild = (record: any) => {
  modalTitle.value = '新增子菜单'
  resetForm()
  formData.parentId = record.id
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  modalTitle.value = '编辑菜单'
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleDelete = (id: number) => {
  const deleteMenu = (menus: any[], id: number): boolean => {
    for (let i = 0; i < menus.length; i++) {
      if (menus[i].id === id) {
        menus.splice(i, 1)
        return true
      }
      if (menus[i].children && deleteMenu(menus[i].children, id)) {
        return true
      }
    }
    return false
  }
  
  if (deleteMenu(menus.value, id)) {
    message.success('删除成功')
    fetchMenus()
  }
}

const handleStatusChange = (record: any) => {
  record.status = record.status === 'active' ? 'inactive' : 'active'
  message.success(`菜单已${record.status === 'active' ? '启用' : '禁用'}`)
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    message.success(modalTitle.value === '新增菜单' ? '创建成功' : '更新成功')
    modalVisible.value = false
    fetchMenus()
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
    parentId: null,
    menuType: 'menu',
    menuName: '',
    permission: '',
    path: '',
    component: '',
    orderNum: 0,
    icon: '',
    isFrame: false,
    isCache: true,
    visible: true,
    status: 'active',
    remark: ''
  })
  formRef.value?.resetFields()
}

const fetchMenus = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// 辅助方法
const getMenuIcon = (iconName: string) => {
  const icons: any = {
    HomeOutlined,
    UserOutlined,
    SettingOutlined,
    FileTextOutlined,
    BarChartOutlined,
    SafetyOutlined
  }
  return icons[iconName] || null
}

const getMenuTypeColor = (type: string) => {
  const colors = {
    directory: 'blue',
    menu: 'green',
    button: 'orange'
  }
  return colors[type] || 'default'
}

const getMenuTypeText = (type: string) => {
  const texts = {
    directory: '目录',
    menu: '菜单',
    button: '按钮'
  }
  return texts[type] || type
}

onMounted(() => {
  fetchMenus()
})
</script>

<style scoped>
.menu-management {
  padding: 24px;
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
}

.search-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}
</style>