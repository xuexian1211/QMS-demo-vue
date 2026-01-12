<template>
  <div class="api-log">
    <div class="page-header">
      <h2>接口日志</h2>
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
            placeholder="搜索接口名称/URL"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="method" placeholder="请求方式" allowClear
            :options="[
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' }
            ]"
          />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="响应状态" allowClear
            :options="[
              { value: '200', label: '200 成功' },
              { value: '201', label: '201 创建' },
              { value: '400', label: '400 请求错误' },
              { value: '401', label: '401 未授权' },
              { value: '403', label: '403 禁止访问' },
              { value: '404', label: '404 未找到' },
              { value: '500', label: '500 服务器错误' }
            ]"
          />
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

    <!-- 统计卡片 -->
    <div class="stats-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="总请求量"
              :value="stats.totalRequests"
              :value-style="{ color: '#3f8600' }"
            />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="成功率"
              :value="stats.successRate"
              suffix="%"
              :value-style="{ color: '#3f8600' }"
            />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="平均响应时间"
              :value="stats.avgResponseTime"
              suffix="ms"
              :value-style="{ color: '#1890ff' }"
            />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="错误请求"
              :value="stats.errorRequests"
              :value-style="{ color: '#cf1322' }"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 接口日志列表 -->
    <a-table 
      :columns="columns" 
      :data-source="apiLogs" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
      :scroll="{ x: 1400 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'method'">
          <a-tag :color="getMethodColor(record.method)">
            {{ record.method }}
          </a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ record.status }}
          </a-tag>
        </template>
        <template v-if="column.key === 'responseTime'">
          <span :class="getResponseTimeClass(record.responseTime)">
            {{ record.responseTime }}ms
          </span>
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

    <!-- 接口详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="接口调用详情"
      width="1000px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="请求ID">{{ viewData.id }}</a-descriptions-item>
        <a-descriptions-item label="接口名称">{{ viewData.apiName }}</a-descriptions-item>
        <a-descriptions-item label="请求方式">
          <a-tag :color="getMethodColor(viewData.method)">
            {{ viewData.method }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="请求URL">{{ viewData.url }}</a-descriptions-item>
        <a-descriptions-item label="响应状态">
          <a-tag :color="getStatusColor(viewData.status)">
            {{ viewData.status }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="响应时间">{{ viewData.responseTime }}ms</a-descriptions-item>
        <a-descriptions-item label="客户端IP">{{ viewData.clientIp }}</a-descriptions-item>
        <a-descriptions-item label="用户代理">{{ viewData.userAgent }}</a-descriptions-item>
        <a-descriptions-item label="请求时间">{{ viewData.requestTime }}</a-descriptions-item>
        <a-descriptions-item label="响应时间">{{ viewData.responseTimeFull }}</a-descriptions-item>
        <a-descriptions-item label="请求头" :span="2">
          <a-typography-paragraph copyable>
            <pre>{{ JSON.stringify(JSON.parse(viewData.requestHeaders), null, 2) }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="请求参数" :span="2" v-if="viewData.requestParams">
          <a-typography-paragraph copyable>
            <pre>{{ JSON.stringify(JSON.parse(viewData.requestParams), null, 2) }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="请求体" :span="2" v-if="viewData.requestBody">
          <a-typography-paragraph copyable>
            <pre>{{ viewData.requestBody }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="响应头" :span="2">
          <a-typography-paragraph copyable>
            <pre>{{ JSON.stringify(JSON.parse(viewData.responseHeaders), null, 2) }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="响应体" :span="2" v-if="viewData.responseBody">
          <a-typography-paragraph copyable>
            <pre>{{ JSON.stringify(JSON.parse(viewData.responseBody), null, 2) }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
        <a-descriptions-item label="错误信息" :span="2" v-if="viewData.errorMsg">
          <a-typography-paragraph copyable class="error-text">
            <pre>{{ viewData.errorMsg }}</pre>
          </a-typography-paragraph>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const method = ref()
const status = ref()
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
    title: '请求ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '接口名称',
    dataIndex: 'apiName',
    key: 'apiName',
    width: 150
  },
  {
    title: '请求方式',
    dataIndex: 'method',
    key: 'method',
    width: 80
  },
  {
    title: '请求URL',
    dataIndex: 'url',
    key: 'url',
    width: 250,
    ellipsis: true
  },
  {
    title: '状态码',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '响应时间',
    dataIndex: 'responseTime',
    key: 'responseTime',
    width: 100
  },
  {
    title: '客户端IP',
    dataIndex: 'clientIp',
    key: 'clientIp',
    width: 120
  },
  {
    title: '请求时间',
    dataIndex: 'requestTime',
    key: 'requestTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
]

// 模拟接口日志数据
const apiLogs = ref([
  {
    id: 2001,
    apiName: '用户登录接口',
    method: 'POST',
    url: '/api/auth/login',
    status: 200,
    responseTime: 120,
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestTime: '2024-01-15 09:30:15',
    responseTimeFull: '2024-01-15 09:30:15',
    requestHeaders: '{"Content-Type":"application/json","User-Agent":"Mozilla/5.0"}',
    requestParams: null,
    requestBody: '{"username":"admin","password":"***"}',
    responseHeaders: '{"Content-Type":"application/json","Content-Length":156}',
    responseBody: '{"code":200,"message":"登录成功","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}',
    errorMsg: null
  },
  {
    id: 2002,
    apiName: '获取检验单列表',
    method: 'GET',
    url: '/api/quality/iqc/list?page=1&size=10',
    status: 200,
    responseTime: 85,
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestTime: '2024-01-15 10:15:30',
    responseTimeFull: '2024-01-15 10:15:30',
    requestHeaders: '{"Authorization":"Bearer ***","User-Agent":"Mozilla/5.0"}',
    requestParams: '{"page":1,"size":10}',
    requestBody: null,
    responseHeaders: '{"Content-Type":"application/json","Content-Length":1234}',
    responseBody: '{"code":200,"data":{"total":50,"list":[...]}}',
    errorMsg: null
  },
  {
    id: 2003,
    apiName: '创建检验单',
    method: 'POST',
    url: '/api/quality/iqc/create',
    status: 400,
    responseTime: 2500,
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestTime: '2024-01-15 11:20:45',
    responseTimeFull: '2024-01-15 11:20:48',
    requestHeaders: '{"Content-Type":"application/json","Authorization":"Bearer ***"}',
    requestParams: null,
    requestBody: '{"materialName":"测试物料","supplierId":123}',
    responseHeaders: '{"Content-Type":"application/json","Content-Length":89}',
    responseBody: '{"code":400,"message":"参数验证失败","errors":["supplierId不能为空"]}',
    errorMsg: '参数验证失败: supplierId不能为空'
  },
  {
    id: 2004,
    apiName: '获取系统配置',
    method: 'GET',
    url: '/api/system/config',
    status: 500,
    responseTime: 3200,
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestTime: '2024-01-15 12:05:20',
    responseTimeFull: '2024-01-15 12:05:23',
    requestHeaders: '{"Authorization":"Bearer ***","User-Agent":"Mozilla/5.0"}',
    requestParams: null,
    requestBody: null,
    responseHeaders: '{"Content-Type":"application/json","Content-Length":156}',
    responseBody: '{"code":500,"message":"服务器内部错误"}',
    errorMsg: '数据库连接异常: Connection refused'
  }
])

// 统计数据
const stats = computed(() => {
  const total = apiLogs.value.length
  const success = apiLogs.value.filter(log => log.status >= 200 && log.status < 300).length
  const error = total - success
  const avgTime = Math.round(apiLogs.value.reduce((sum, log) => sum + log.responseTime, 0) / total)
  
  return {
    totalRequests: total,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    avgResponseTime: avgTime,
    errorRequests: error
  }
})

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchApiLogs()
}

const handleReset = () => {
  searchText.value = ''
  method.value = undefined
  status.value = undefined
  dateRange.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchApiLogs()
}

const handleView = (record: any) => {
  viewData.value = record
  detailModalVisible.value = true
}

const handleDelete = (id: number) => {
  const index = apiLogs.value.findIndex(item => item.id === id)
  if (index > -1) {
    apiLogs.value.splice(index, 1)
    message.success('删除成功')
    fetchApiLogs()
  }
}

const handleExport = () => {
  message.info('导出功能开发中...')
}

const handleClearLogs = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有接口日志吗？此操作不可恢复！',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      apiLogs.value = []
      message.success('日志已清空')
      fetchApiLogs()
    }
  })
}

const fetchApiLogs = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = apiLogs.value.length
    loading.value = false
  }, 500)
}

// 辅助方法
const getMethodColor = (method: string) => {
  const colors = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  }
  return colors[method] || 'default'
}

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'green'
  if (status >= 300 && status < 400) return 'blue'
  if (status >= 400 && status < 500) return 'orange'
  if (status >= 500) return 'red'
  return 'default'
}

const getResponseTimeClass = (time: number) => {
  if (time < 100) return 'response-time-fast'
  if (time < 500) return 'response-time-normal'
  if (time < 2000) return 'response-time-slow'
  return 'response-time-very-slow'
}

onMounted(() => {
  fetchApiLogs()
})
</script>

<style scoped>
.api-log {
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

.stats-section {
  margin-bottom: 16px;
}

.response-time-fast {
  color: #52c41a;
  font-weight: 600;
}

.response-time-normal {
  color: #1890ff;
}

.response-time-slow {
  color: #fa8c16;
}

.response-time-very-slow {
  color: #ff4d4f;
  font-weight: 600;
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
  max-height: 300px;
  overflow-y: auto;
}
</style>