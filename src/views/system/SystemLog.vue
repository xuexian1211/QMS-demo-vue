<template>
  <div class="system-log">
    <div class="page-header">
      <h2>系统日志</h2>
      <a-space>
        <a-button @click="handleExport">
          <template #icon><ExportOutlined /></template>
          导出日志
        </a-button>
        <a-button type="primary" danger @click="handleClearLogs">
          <template #icon><DeleteOutlined /></template>
          清空日志
        </a-button>
      </a-space>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="5">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索操作内容/用户"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="logType" placeholder="日志类型" allowClear>
            <a-select-option value="login">登录日志</a-select-option>
            <a-select-option value="operation">操作日志</a-select-option>
            <a-select-option value="system">系统日志</a-select-option>
            <a-select-option value="error">错误日志</a-select-option>
            <a-select-option value="security">安全日志</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="level" placeholder="日志级别" allowClear>
            <a-select-option value="info">信息</a-select-option>
            <a-select-option value="warning">警告</a-select-option>
            <a-select-option value="error">错误</a-select-option>
            <a-select-option value="debug">调试</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-range-picker 
            v-model:value="dateRange" 
            show-time
            @change="handleSearch"
          />
        </a-col>
        <a-col :span="5">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 日志列表 -->
    <a-table 
      :columns="columns" 
      :data-source="logs" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
      :scroll="{ x: 1200 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'logType'">
          <a-tag :color="getLogTypeColor(record.logType)">
            {{ getLogTypeText(record.logType) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)">
            {{ getLevelText(record.level) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'success' ? 'green' : 'red'">
            {{ record.status === 'success' ? '成功' : '失败' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleView(record)">查看详情</a-button>
            <a-popconfirm
              title="确定要删除这条日志吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 日志详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="日志详情"
      width="900px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="日志ID">{{ viewData.id }}</a-descriptions-item>
        <a-descriptions-item label="日志类型">
          <a-tag :color="getLogTypeColor(viewData.logType)">
            {{ getLogTypeText(viewData.logType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="日志级别">
          <a-tag :color="getLevelColor(viewData.level)">
            {{ getLevelText(viewData.level) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="操作状态">
          <a-tag :color="viewData.status === 'success' ? 'green' : 'red'">
            {{ viewData.status === 'success' ? '成功' : '失败' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="操作用户">{{ viewData.username }}</a-descriptions-item>
        <a-descriptions-item label="用户IP">{{ viewData.ip }}</a-descriptions-item>
        <a-descriptions-item label="操作模块">{{ viewData.module }}</a-descriptions-item>
        <a-descriptions-item label="操作方法">{{ viewData.method }}</a-descriptions-item>
        <a-descriptions-item label="请求URL">{{ viewData.url }}</a-descriptions-item>
        <a-descriptions-item label="请求方式">{{ viewData.httpMethod }}</a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="执行时长">{{ viewData.duration }}ms</a-descriptions-item>
        <a-descriptions-item label="操作内容" :span="2">
          <div style="white-space: pre-wrap;">{{ viewData.operation }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="请求参数" :span="2" v-if="viewData.params">
          <a-typography-paragraph copyable>
            <pre>{{ JSON.stringify(JSON.parse(viewData.params), null, 2) }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="响应结果" :span="2" v-if="viewData.result">
          <a-typography-paragraph copyable>
            <pre>{{ JSON.stringify(JSON.parse(viewData.result), null, 2) }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="错误信息" :span="2" v-if="viewData.errorMsg">
          <a-typography-paragraph copyable class="error-text">
            <pre>{{ viewData.errorMsg }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="浏览器信息" :span="2">{{ viewData.userAgent }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const logType = ref()
const level = ref()
const dateRange = ref()
const loading = ref(false)
const detailModalVisible = ref(false)
const viewData = ref({})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列配置
const columns = [
  {
    title: '日志ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '日志类型',
    dataIndex: 'logType',
    key: 'logType',
    width: 100
  },
  {
    title: '日志级别',
    dataIndex: 'level',
    key: 'level',
    width: 80
  },
  {
    title: '操作用户',
    dataIndex: 'username',
    key: 'username',
    width: 100
  },
  {
    title: '操作模块',
    dataIndex: 'module',
    key: 'module',
    width: 120
  },
  {
    title: '操作内容',
    dataIndex: 'operation',
    key: 'operation',
    width: 200,
    ellipsis: true
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '执行时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    render: (text: number) => `${text}ms`
  },
  {
    title: '操作时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
]

// 模拟日志数据
const logs = ref([
  {
    id: 1001,
    logType: 'login',
    level: 'info',
    username: 'admin',
    ip: '192.168.1.100',
    module: '用户认证',
    operation: '用户登录系统',
    method: 'LoginController.login',
    url: '/api/auth/login',
    httpMethod: 'POST',
    status: 'success',
    duration: 120,
    createTime: '2024-01-15 09:30:15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    params: '{"username":"admin","password":"***"}',
    result: '{"code":200,"message":"登录成功","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}',
    errorMsg: null
  },
  {
    id: 1002,
    logType: 'operation',
    level: 'info',
    username: 'admin',
    ip: '192.168.1.100',
    module: '系统管理',
    operation: '新增系统公告',
    method: 'AnnouncementController.create',
    url: '/api/system/announcement',
    httpMethod: 'POST',
    status: 'success',
    duration: 85,
    createTime: '2024-01-15 10:15:30',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    params: '{"title":"系统维护通知","content":"系统将于本周六进行维护"}',
    result: '{"code":200,"message":"创建成功","data":{"id":123}}',
    errorMsg: null
  },
  {
    id: 1003,
    logType: 'error',
    level: 'error',
    username: 'admin',
    ip: '192.168.1.100',
    module: '质量管理',
    operation: '查询检验单列表',
    method: 'IQCController.getList',
    url: '/api/quality/iqc/list',
    httpMethod: 'GET',
    status: 'error',
    duration: 2500,
    createTime: '2024-01-15 11:20:45',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    params: '{"page":1,"size":10}',
    result: null,
    errorMsg: '数据库连接超时: Connection timeout after 2500ms'
  },
  {
    id: 1004,
    logType: 'security',
    level: 'warning',
    username: 'unknown',
    ip: '192.168.1.200',
    module: '用户认证',
    operation: '登录失败',
    method: 'LoginController.login',
    url: '/api/auth/login',
    httpMethod: 'POST',
    status: 'error',
    duration: 50,
    createTime: '2024-01-15 12:05:20',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    params: '{"username":"test","password":"wrong"}',
    result: '{"code":401,"message":"用户名或密码错误"}',
    errorMsg: '用户名或密码错误'
  }
])

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchLogs()
}

const handleReset = () => {
  searchText.value = ''
  logType.value = undefined
  level.value = undefined
  dateRange.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchLogs()
}

const handleView = (record: any) => {
  viewData.value = record
  detailModalVisible.value = true
}

const handleDelete = (id: number) => {
  const index = logs.value.findIndex(item => item.id === id)
  if (index > -1) {
    logs.value.splice(index, 1)
    message.success('删除成功')
    fetchLogs()
  }
}

const handleExport = () => {
  message.info('导出功能开发中...')
}

const handleClearLogs = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有日志记录吗？此操作不可恢复！',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      logs.value = []
      message.success('日志已清空')
      fetchLogs()
    }
  })
}

const fetchLogs = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = logs.value.length
    loading.value = false
  }, 500)
}

// 辅助方法
const getLogTypeColor = (type: string) => {
  const colors = {
    login: 'blue',
    operation: 'green',
    system: 'purple',
    error: 'red',
    security: 'orange'
  }
  return colors[type] || 'default'
}

const getLogTypeText = (type: string) => {
  const texts = {
    login: '登录日志',
    operation: '操作日志',
    system: '系统日志',
    error: '错误日志',
    security: '安全日志'
  }
  return texts[type] || type
}

const getLevelColor = (level: string) => {
  const colors = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
    debug: 'purple'
  }
  return colors[level] || 'default'
}

const getLevelText = (level: string) => {
  const texts = {
    info: '信息',
    warning: '警告',
    error: '错误',
    debug: '调试'
  }
  return texts[level] || level
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.system-log {
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

.error-text {
  color: #ff4d4f;
  background-color: #fff2f0;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ffccc7;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>