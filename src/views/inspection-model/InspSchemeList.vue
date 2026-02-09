<template>
  <div class="insp-scheme-list">
    <a-card :bordered="false">
      <!-- 搜索区域 -->
      <div class="search-area">
        <a-form layout="inline" :model="searchForm">
          <a-form-item label="方案编码">
            <a-input v-model:value="searchForm.schemeCode" placeholder="请输入方案编码" allow-clear />
          </a-form-item>
          <a-form-item label="方案名称">
            <a-input v-model:value="searchForm.schemeName" placeholder="请输入方案名称" allow-clear />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 150px">
              <a-select-option value="DRAFT">草稿</a-select-option>
              <a-select-option value="IN_APPROVAL">审批中</a-select-option>
              <a-select-option value="APPROVED">已批准</a-select-option>
              <a-select-option value="OBSOLETE">已作废</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <template #icon><SearchOutlined /></template>
                查询
              </a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>

      <!-- 操作按钮 -->
      <div class="action-area">
        <a-space>
          <a-button type="primary" @click="handleCreate">
            <template #icon><PlusOutlined /></template>
            新建方案
          </a-button>
          <a-button @click="handleCreateFromTemplate">
            <template #icon><CopyOutlined /></template>
            从模板创建
          </a-button>
        </a-space>
      </div>

      <!-- 表格 -->
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'sourceTemplate'">
            <span v-if="record.sourceTemplateName">
              {{ record.sourceTemplateName }}
              <a-tooltip title="查看模板">
                <LinkOutlined style="margin-left: 8px; cursor: pointer;" />
              </a-tooltip>
            </span>
            <span v-else style="color: #999;">独立创建</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handleViewStrategies(record)">策略绑定</a-button>
              <a-dropdown>
                <template #overlay>
                  <a-menu>
                    <a-menu-item v-if="record.status === 'DRAFT'" @click="handleSubmit(record)">
                      提交审批
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'IN_APPROVAL'" @click="handleApprove(record)">
                      审批通过
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'APPROVED'" @click="handleObsolete(record)">
                      作废
                    </a-menu-item>
                    <a-menu-item @click="handleCopy(record)">复制</a-menu-item>
                    <a-menu-item danger @click="handleDelete(record)">删除</a-menu-item>
                  </a-menu>
                </template>
                <a-button type="link" size="small">
                  更多 <DownOutlined />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 从模板创建弹窗 -->
    <a-modal
      v-model:open="createFromTemplateVisible"
      title="从模板创建检验方案"
      @ok="handleCreateFromTemplateOk"
      @cancel="createFromTemplateVisible = false"
      width="600px"
    >
      <a-form :model="createForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="选择模板" required>
          <a-select v-model:value="createForm.templateId" placeholder="请选择检验模板">
            <a-select-option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
              {{ tpl.templateName }} ({{ tpl.version }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="方案编码" required>
          <a-input v-model:value="createForm.schemeCode" placeholder="请输入方案编码" />
        </a-form-item>
        <a-form-item label="方案名称" required>
          <a-input v-model:value="createForm.schemeName" placeholder="请输入方案名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="createForm.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import {
  SearchOutlined,
  PlusOutlined,
  CopyOutlined,
  LinkOutlined,
  DownOutlined
} from '@ant-design/icons-vue'
import type { InspScheme, InspTemplate } from '@/types'
import {
  getInspSchemeList,
  createSchemeFromTemplate,
  deleteInspScheme,
  submitInspSchemeForApproval,
  approveInspScheme,
  obsoleteInspScheme
} from '@/api/inspScheme'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  schemeCode: '',
  schemeName: '',
  status: undefined
})

// 表格数据
const dataSource = ref<InspScheme[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

// 表格列定义
const columns = [
  { title: '方案编码', dataIndex: 'schemeCode', key: 'schemeCode', width: 150 },
  { title: '方案名称', dataIndex: 'schemeName', key: 'schemeName', width: 200 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '状态', key: 'status', width: 120 },
  { title: '源模板', key: 'sourceTemplate', width: 200 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 250 }
]

// 从模板创建相关
const createFromTemplateVisible = ref(false)
const templates = ref<InspTemplate[]>([])
const createForm = reactive({
  templateId: '',
  schemeCode: '',
  schemeName: '',
  description: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.current,
      pageSize: pagination.pageSize
    }
    const res = await getInspSchemeList(params)
    if (res.data.success) {
      dataSource.value = res.data.data.list
      pagination.total = res.data.data.total
    }
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    schemeCode: '',
    schemeName: '',
    status: undefined
  })
  handleSearch()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 新建方案
const handleCreate = () => {
  router.push('/inspection-model/insp-plans/create')
}

// 从模板创建
const handleCreateFromTemplate = () => {
  createFromTemplateVisible.value = true
  // TODO: 加载模板列表
}

// 确认从模板创建
const handleCreateFromTemplateOk = async () => {
  if (!createForm.templateId || !createForm.schemeCode || !createForm.schemeName) {
    message.warning('请填写必填项')
    return
  }
  
  try {
    const res = await createSchemeFromTemplate(createForm.templateId, {
      schemeCode: createForm.schemeCode,
      schemeName: createForm.schemeName,
      description: createForm.description
    })
    if (res.data.success) {
      message.success('创建成功')
      createFromTemplateVisible.value = false
      router.push(`/inspection-model/insp-plans/edit/${res.data.data.id}`)
    }
  } catch (error) {
    message.error('创建失败')
  }
}

// 编辑
const handleEdit = (record: InspScheme) => {
  router.push(`/inspection-model/insp-plans/edit/${record.id}`)
}

// 查看策略绑定
const handleViewStrategies = (record: InspScheme) => {
  router.push(`/inspection-model/insp-plans/${record.id}/strategies`)
}

// 提交审批
const handleSubmit = async (record: InspScheme) => {
  Modal.confirm({
    title: '确认提交审批？',
    content: '提交后将无法编辑，请确认',
    onOk: async () => {
      try {
        await submitInspSchemeForApproval(record.id)
        message.success('提交成功')
        loadData()
      } catch (error) {
        message.error('提交失败')
      }
    }
  })
}

// 审批通过
const handleApprove = async (record: InspScheme) => {
  Modal.confirm({
    title: '确认审批通过？',
    onOk: async () => {
      try {
        await approveInspScheme(record.id)
        message.success('审批成功')
        loadData()
      } catch (error) {
        message.error('审批失败')
      }
    }
  })
}

// 作废
const handleObsolete = async (record: InspScheme) => {
  Modal.confirm({
    title: '确认作废？',
    content: '作废后将无法使用',
    onOk: async () => {
      try {
        await obsoleteInspScheme(record.id)
        message.success('作废成功')
        loadData()
      } catch (error) {
        message.error('作废失败')
      }
    }
  })
}

// 复制
const handleCopy = (record: InspScheme) => {
  router.push(`/inspection-model/insp-plans/copy/${record.id}`)
}

// 删除
const handleDelete = async (record: InspScheme) => {
  Modal.confirm({
    title: '确认删除？',
    content: '删除后无法恢复',
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteInspScheme(record.id)
        message.success('删除成功')
        loadData()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

// 状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    DRAFT: 'default',
    IN_APPROVAL: 'processing',
    APPROVED: 'success',
    OBSOLETE: 'error'
  }
  return colorMap[status] || 'default'
}

// 状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    DRAFT: '草稿',
    IN_APPROVAL: '审批中',
    APPROVED: '已批准',
    OBSOLETE: '已作废'
  }
  return textMap[status] || status
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.insp-scheme-list .search-area {
  margin-bottom: 16px;
}

.insp-scheme-list .action-area {
  margin-bottom: 16px;
}
</style>

