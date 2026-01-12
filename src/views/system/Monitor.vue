<template>
  <div class="system-monitor">
    <div class="page-header">
      <h2>系统监控</h2>
      <a-space>
        <a-button @click="handleRefresh">
          <template #icon><ReloadOutlined /></template>
          刷新数据
        </a-button>
        <a-button type="primary" @click="handleExportReport">
          <template #icon><DownloadOutlined /></template>
          导出报告
        </a-button>
      </a-space>
    </div>

    <!-- 系统概览卡片 -->
    <div class="overview-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="系统运行时间"
              :value="systemInfo.uptime"
              suffix="天"
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <ClockCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="在线用户数"
              :value="systemInfo.onlineUsers"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="今日访问量"
              :value="systemInfo.todayVisits"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <EyeOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="系统健康度"
              :value="systemInfo.healthScore"
              suffix="%"
              :value-style="{ color: systemInfo.healthScore >= 90 ? '#3f8600' : '#cf1322' }"
            >
              <template #prefix>
                <HeartOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 监控图表区域 -->
    <div class="charts-section">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="CPU使用率趋势" :bordered="false">
            <div ref="cpuChartRef" style="height: 300px;"></div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="内存使用率趋势" :bordered="false">
            <div ref="memoryChartRef" style="height: 300px;"></div>
          </a-card>
        </a-col>
      </a-row>
      
      <a-row :gutter="16" style="margin-top: 16px;">
        <a-col :span="12">
          <a-card title="磁盘使用情况" :bordered="false">
            <div ref="diskChartRef" style="height: 300px;"></div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="网络流量监控" :bordered="false">
            <div ref="networkChartRef" style="height: 300px;"></div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 服务状态监控 -->
    <a-card title="服务状态监控" style="margin-top: 16px;">
      <a-table 
        :columns="serviceColumns" 
        :data-source="services" 
        :pagination="false"
        row-key="name"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-badge :status="getServiceStatus(record.status)" :text="record.status" />
          </template>
          <template v-if="column.key === 'cpu'">
            <a-progress :percent="record.cpu" :status="record.cpu > 80 ? 'exception' : 'normal'" size="small" />
          </template>
          <template v-if="column.key === 'memory'">
            <a-progress :percent="record.memory" :status="record.memory > 80 ? 'exception' : 'normal'" size="small" />
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleRestartService(record)">重启</a-button>
              <a-button type="link" size="small" @click="handleViewServiceLogs(record)">查看日志</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 系统告警 -->
    <a-card title="系统告警" style="margin-top: 16px;">
      <template #extra>
        <a-space>
          <a-select v-model:value="alertLevel" placeholder="告警级别" style="width: 120px;" @change="handleAlertFilter" :options="[
            { value: '', label: '全部' },
            { value: 'critical', label: '严重' },
            { value: 'warning', label: '警告' },
            { value: 'info', label: '信息' }
          ]" />
        </a-space>
      </template>
      <a-table 
        :columns="alertColumns" 
        :data-source="filteredAlerts" 
        :pagination="{ pageSize: 5 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'level'">
            <a-tag :color="getAlertColor(record.level)">
              {{ getAlertText(record.level) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleResolveAlert(record)">处理</a-button>
              <a-button type="link" size="small" @click="handleIgnoreAlert(record)">忽略</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 服务日志模态框 -->
    <a-modal
      v-model:open="logsModalVisible"
      title="服务日志"
      width="800px"
      :footer="null"
    >
      <div class="logs-container">
        <div v-for="(log, index) in serviceLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span :class="['log-level', log.level.toLowerCase()]">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { 
  ReloadOutlined, 
  DownloadOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  EyeOutlined, 
  HeartOutlined 
} from '@ant-design/icons-vue'

// 响应式数据
const cpuChartRef = ref()
const memoryChartRef = ref()
const diskChartRef = ref()
const networkChartRef = ref()
const alertLevel = ref('')
const logsModalVisible = ref(false)
const serviceLogs = ref([])
let refreshTimer: any = null

// 系统信息
const systemInfo = reactive({
  uptime: 15,
  onlineUsers: 128,
  todayVisits: 2568,
  healthScore: 95
})

// 服务状态表格列配置
const serviceColumns = [
  {
    title: '服务名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: 'CPU使用率',
    dataIndex: 'cpu',
    key: 'cpu'
  },
  {
    title: '内存使用率',
    dataIndex: 'memory',
    key: 'memory'
  },
  {
    title: '启动时间',
    dataIndex: 'startTime',
    key: 'startTime'
  },
  {
    title: '操作',
    key: 'action'
  }
]

// 服务数据
const services = ref([
  {
    name: 'Web服务器',
    status: '运行中',
    cpu: 45,
    memory: 62,
    startTime: '2024-01-15 08:00:00'
  },
  {
    name: '数据库服务',
    status: '运行中',
    cpu: 28,
    memory: 75,
    startTime: '2024-01-15 08:00:00'
  },
  {
    name: 'Redis缓存',
    status: '运行中',
    cpu: 12,
    memory: 35,
    startTime: '2024-01-15 08:00:00'
  },
  {
    name: '消息队列',
    status: '运行中',
    cpu: 18,
    memory: 42,
    startTime: '2024-01-15 08:00:00'
  },
  {
    name: '文件服务',
    status: '异常',
    cpu: 0,
    memory: 0,
    startTime: '2024-01-15 08:00:00'
  }
])

// 告警表格列配置
const alertColumns = [
  {
    title: '告警时间',
    dataIndex: 'time',
    key: 'time',
    width: 150
  },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level',
    width: 80
  },
  {
    title: '告警内容',
    dataIndex: 'message',
    key: 'message'
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 120
  }
]

// 告警数据
const alerts = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    level: 'critical',
    message: '文件服务连接超时，无法正常提供服务',
    source: '文件服务'
  },
  {
    id: 2,
    time: '2024-01-15 14:25:18',
    level: 'warning',
    message: '数据库连接池使用率达到85%，建议增加连接数',
    source: '数据库服务'
  },
  {
    id: 3,
    time: '2024-01-15 14:20:12',
    level: 'info',
    message: '系统自动清理临时文件完成，释放空间2.3GB',
    source: '系统任务'
  },
  {
    id: 4,
    time: '2024-01-15 14:15:08',
    level: 'warning',
    message: 'CPU使用率持续超过80%已超过5分钟',
    source: 'Web服务器'
  }
])

// 过滤后的告警
const filteredAlerts = computed(() => {
  if (!alertLevel.value) return alerts.value
  return alerts.value.filter(alert => alert.level === alertLevel.value)
})

// 方法
const handleRefresh = () => {
  message.success('数据已刷新')
  updateSystemInfo()
}

const handleExportReport = () => {
  message.info('导出功能开发中...')
}

const handleRestartService = (service: any) => {
  message.success(`正在重启 ${service.name}...`)
  setTimeout(() => {
    const index = services.value.findIndex(s => s.name === service.name)
    if (index > -1) {
      services.value[index].status = '运行中'
      services.value[index].cpu = Math.floor(Math.random() * 50)
      services.value[index].memory = Math.floor(Math.random() * 70) + 20
    }
    message.success(`${service.name} 重启成功`)
  }, 2000)
}

const handleViewServiceLogs = (service: any) => {
  serviceLogs.value = [
    { time: '2024-01-15 14:30:25', level: 'INFO', message: `${service.name} 服务启动成功` },
    { time: '2024-01-15 14:25:18', level: 'WARN', message: `连接池使用率较高: 85%` },
    { time: '2024-01-15 14:20:12', level: 'INFO', message: '定时任务执行完成' },
    { time: '2024-01-15 14:15:08', level: 'ERROR', message: '数据库连接异常，正在重试' },
    { time: '2024-01-15 14:10:05', level: 'INFO', message: '服务健康检查通过' }
  ]
  logsModalVisible.value = true
}

const handleAlertFilter = () => {
  // 过滤逻辑已在computed中实现
}

const handleResolveAlert = (alert: any) => {
  const index = alerts.value.findIndex(a => a.id === alert.id)
  if (index > -1) {
    alerts.value.splice(index, 1)
    message.success('告警已处理')
  }
}

const handleIgnoreAlert = (alert: any) => {
  const index = alerts.value.findIndex(a => a.id === alert.id)
  if (index > -1) {
    alerts.value.splice(index, 1)
    message.success('告警已忽略')
  }
}

const updateSystemInfo = () => {
  // 模拟数据更新
  systemInfo.onlineUsers = Math.floor(Math.random() * 50) + 100
  systemInfo.todayVisits = Math.floor(Math.random() * 1000) + 2000
  systemInfo.healthScore = Math.floor(Math.random() * 10) + 90
  
  // 更新服务状态
  services.value.forEach(service => {
    if (service.status === '运行中') {
      service.cpu = Math.floor(Math.random() * 60) + 10
      service.memory = Math.floor(Math.random() * 50) + 30
    }
  })
}

// 辅助方法
const getServiceStatus = (status: string) => {
  const statusMap = {
    '运行中': 'processing',
    '异常': 'error',
    '停止': 'default'
  }
  return statusMap[status] || 'default'
}

const getAlertColor = (level: string) => {
  const colorMap = {
    'critical': 'red',
    'warning': 'orange',
    'info': 'blue'
  }
  return colorMap[level] || 'default'
}

const getAlertText = (level: string) => {
  const textMap = {
    'critical': '严重',
    'warning': '警告',
    'info': '信息'
  }
  return textMap[level] || level
}

const initCharts = () => {
  // 这里应该初始化图表，由于没有图表库，暂时用占位符
  console.log('初始化图表')
}

onMounted(() => {
  updateSystemInfo()
  initCharts()
  
  // 设置定时刷新
  refreshTimer = setInterval(() => {
    updateSystemInfo()
  }, 30000) // 30秒刷新一次
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.system-monitor {
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

.overview-section {
  margin-bottom: 24px;
}

.charts-section {
  margin-bottom: 24px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #e8e8e8;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  font-size: 12px;
  width: 150px;
  flex-shrink: 0;
}

.log-level {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
  margin: 0 8px;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.log-level.info {
  background: #e6f7ff;
  color: #1890ff;
}

.log-level.warn {
  background: #fffbe6;
  color: #faad14;
}

.log-level.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.log-message {
  flex: 1;
  font-size: 12px;
  color: #333;
}
</style>