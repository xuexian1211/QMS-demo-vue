<template>
  <div class="update-log-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="handleCreate">
          <template #icon><PlusOutlined /></template>
          新增更新日志
        </a-button>
        <a-button @click="handleRefresh">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </a-space>
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="版本号">
          <a-input v-model:value="searchForm.version" placeholder="请输入版本号" style="width: 150px" />
        </a-form-item>
        <a-form-item label="更新类型">
          <a-select v-model:value="searchForm.updateType" placeholder="请选择" style="width: 120px" allow-clear>
            <a-select-option value="feature">新功能</a-select-option>
            <a-select-option value="fix">修复</a-select-option>
            <a-select-option value="optimize">优化</a-select-option>
            <a-select-option value="breaking">重大变更</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择" style="width: 120px" allow-clear>
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="archived">已归档</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关键词">
          <a-input v-model:value="searchForm.keyword" placeholder="标题或内容" style="width: 200px" />
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

    <!-- 数据表格 -->
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'version'">
            <a-tag color="blue">{{ record.version }}</a-tag>
          </template>
          <template v-else-if="column.key === 'updateType'">
            <a-tag :color="getUpdateTypeColor(record.updateType)">
              {{ getUpdateTypeText(record.updateType) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'affectedModules'">
            <a-space>
              <a-tag v-for="module in record.affectedModules.slice(0, 2)" :key="module">
                {{ module }}
              </a-tag>
              <a-tag v-if="record.affectedModules.length > 2">
                +{{ record.affectedModules.length - 2 }}
              </a-tag>
            </a-space>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)" v-if="record.status === 'draft'">
                编辑
              </a-button>
              <a-button type="link" size="small" @click="handlePublish(record)" v-if="record.status === 'draft'">
                发布
              </a-button>
              <a-button type="link" size="small" @click="handleArchive(record)" v-if="record.status === 'published'">
                归档
              </a-button>
              <a-popconfirm
                title="确定要删除这条更新日志吗？"
                @confirm="handleDelete(record)"
                v-if="record.status === 'draft'"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import type { UpdateLog, UpdateLogQueryParams } from '@/types'
import {
  getUpdateLogs,
  deleteUpdateLog,
  publishUpdateLog,
  archiveUpdateLog
} from '@/api/updateLog'

const router = useRouter()

// 搜索表单
const searchForm = reactive<UpdateLogQueryParams>({
  page: 1,
  pageSize: 20,
  version: '',
  updateType: undefined,
  status: undefined,
  keyword: ''
})

// 表格数据
const dataSource = ref<UpdateLog[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列定义
const columns = [
  {
    title: '版本号',
    dataIndex: 'version',
    key: 'version',
    width: 120
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true
  },
  {
    title: '更新类型',
    dataIndex: 'updateType',
    key: 'updateType',
    width: 100
  },
  {
    title: '影响模块',
    dataIndex: 'affectedModules',
    key: 'affectedModules',
    width: 200
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '发布时间',
    dataIndex: 'publishedAt',
    key: 'publishedAt',
    width: 180,
    customRender: ({ text }: any) => text ? new Date(text).toLocaleString('zh-CN') : '-'
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
    fixed: 'right'
  }
]

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: UpdateLogQueryParams = {
      ...searchForm,
      page: pagination.current,
      pageSize: pagination.pageSize
    }
    
    const response = await getUpdateLogs(params)
    if (response.success) {
      dataSource.value = response.data.list
      pagination.total = response.data.total
    } else {
      message.error(response.message)
    }
  } catch (error) {
    message.error('加载数据失败')
    console.error(error)
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
  searchForm.version = ''
  searchForm.updateType = undefined
  searchForm.status = undefined
  searchForm.keyword = ''
  pagination.current = 1
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 新增
const handleCreate = () => {
  router.push('/system/update-log/create')
}

// 查看
const handleView = (record: UpdateLog) => {
  router.push(`/system/update-log/detail/${record.id}`)
}

// 编辑
const handleEdit = (record: UpdateLog) => {
  router.push(`/system/update-log/edit/${record.id}`)
}

// 发布
const handlePublish = async (record: UpdateLog) => {
  try {
    const response = await publishUpdateLog(record.id)
    if (response.success) {
      message.success('发布成功')
      loadData()
    } else {
      message.error(response.message)
    }
  } catch (error) {
    message.error('发布失败')
    console.error(error)
  }
}

// 归档
const handleArchive = async (record: UpdateLog) => {
  try {
    const response = await archiveUpdateLog(record.id)
    if (response.success) {
      message.success('归档成功')
      loadData()
    } else {
      message.error(response.message)
    }
  } catch (error) {
    message.error('归档失败')
    console.error(error)
  }
}

// 删除
const handleDelete = async (record: UpdateLog) => {
  try {
    const response = await deleteUpdateLog(record.id)
    if (response.success) {
      message.success('删除成功')
      loadData()
    } else {
      message.error(response.message)
    }
  } catch (error) {
    message.error('删除失败')
    console.error(error)
  }
}

// 辅助函数
const getUpdateTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    feature: 'green',
    fix: 'orange',
    optimize: 'blue',
    breaking: 'red'
  }
  return colorMap[type] || 'default'
}

const getUpdateTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    feature: '新功能',
    fix: '修复',
    optimize: '优化',
    breaking: '重大变更'
  }
  return textMap[type] || type
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    draft: 'default',
    published: 'success',
    archived: 'warning'
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return textMap[status] || status
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.update-log-container {
  padding: 24px;
  background: #fff;
  min-height: calc(100vh - 104px);
}

.toolbar {
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.table-container {
  margin-top: 16px;
}
</style>
