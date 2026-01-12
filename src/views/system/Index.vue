<template>
  <div class="system-management">
    <div class="page-header">
      <h2>系统管理</h2>
      <a-space>
        <a-button @click="handleRefresh">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </a-space>
    </div>

    <!-- 系统概览 -->
    <div class="overview-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="overview-card">
            <a-statistic
              title="系统公告"
              :value="statistics.announcements"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <NotificationOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="overview-card">
            <a-statistic
              title="系统配置"
              :value="statistics.configs"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <SettingOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="overview-card">
            <a-statistic
              title="数据字典"
              :value="statistics.dictionaries"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <DatabaseOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="overview-card">
            <a-statistic
              title="数据应用"
              :value="statistics.applications"
              :value-style="{ color: '#fa8c16' }"
            >
              <template #prefix>
                <CloudServerOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h3>快捷操作</h3>
      <a-row :gutter="16">
        <a-col :span="4" v-for="action in quickActions" :key="action.key">
          <a-card 
            class="action-card" 
            :hoverable="true"
            @click="handleQuickAction(action)"
          >
            <div class="action-content">
              <div class="action-icon">
                <component :is="action.icon" />
              </div>
              <div class="action-title">{{ action.title }}</div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 系统状态 -->
    <div class="system-status">
      <h3>系统状态</h3>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="服务状态" class="status-card">
            <a-list :data-source="systemServices" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <span>{{ item.name }}</span>
                      <a-badge 
                        :status="item.status === 'running' ? 'success' : 'error'" 
                        :text="item.status === 'running' ? '运行中' : '异常'"
                        style="margin-left: 8px;"
                      />
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-button type="link" size="small" @click="handleServiceAction(item)">
                      {{ item.status === 'running' ? '停止' : '启动' }}
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="最近活动" class="activity-card">
            <a-timeline>
              <a-timeline-item v-for="activity in recentActivities" :key="activity.id">
                <template #dot>
                  <component :is="getActivityIcon(activity.type)" />
                </template>
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-time">{{ activity.time }}</div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 系统信息 -->
    <div class="system-info">
      <h3>系统信息</h3>
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="系统版本">{{ systemInfo.version }}</a-descriptions-item>
        <a-descriptions-item label="运行时间">{{ systemInfo.uptime }}</a-descriptions-item>
        <a-descriptions-item label="数据库版本">{{ systemInfo.dbVersion }}</a-descriptions-item>
        <a-descriptions-item label="服务器环境">{{ systemInfo.environment }}</a-descriptions-item>
        <a-descriptions-item label="部署时间">{{ systemInfo.deployTime }}</a-descriptions-item>
        <a-descriptions-item label="最后更新">{{ systemInfo.lastUpdate }}</a-descriptions-item>
      </a-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ReloadOutlined,
  NotificationOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  MenuOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  MonitorOutlined,
  LayoutOutlined,
  MessageOutlined,
  ApiOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 响应式数据
const statistics = ref({
  announcements: 12,
  configs: 8,
  dictionaries: 25,
  applications: 6
})

const quickActions = ref([
  {
    key: 'announcement',
    title: '发布公告',
    icon: 'NotificationOutlined',
    path: '/system/announcement'
  },
  {
    key: 'config',
    title: '系统配置',
    icon: 'SettingOutlined',
    path: '/system/config'
  },
  {
    key: 'menu',
    title: '菜单管理',
    icon: 'MenuOutlined',
    path: '/system/menu'
  },
  {
    key: 'dictionary',
    title: '数据字典',
    icon: 'DatabaseOutlined',
    path: '/system/data-dictionary'
  },
  {
    key: 'template',
    title: '系统模板',
    icon: 'LayoutOutlined',
    path: '/system/template'
  },
  {
    key: 'monitor',
    title: '系统监控',
    icon: 'MonitorOutlined',
    path: '/system/monitor'
  }
])

const systemServices = ref([
  { id: 1, name: 'Web服务', status: 'running' },
  { id: 2, name: '数据库服务', status: 'running' },
  { id: 3, name: '缓存服务', status: 'running' },
  { id: 4, name: '消息队列', status: 'running' },
  { id: 5, name: '文件服务', status: 'running' }
])

const recentActivities = ref([
  {
    id: 1,
    type: 'info',
    title: '系统配置更新',
    time: '2024-01-15 14:30:00'
  },
  {
    id: 2,
    type: 'success',
    title: '数据字典同步完成',
    time: '2024-01-15 13:45:00'
  },
  {
    id: 3,
    type: 'warning',
    title: '系统监控告警',
    time: '2024-01-15 12:20:00'
  },
  {
    id: 4,
    type: 'info',
    title: '新用户注册',
    time: '2024-01-15 11:15:00'
  },
  {
    id: 5,
    type: 'success',
    title: '系统备份完成',
    time: '2024-01-15 10:00:00'
  }
])

const systemInfo = ref({
  version: 'v2.1.0',
  uptime: '15天 8小时 32分钟',
  dbVersion: 'MySQL 8.0.25',
  environment: 'Production',
  deployTime: '2024-01-01 09:00:00',
  lastUpdate: '2024-01-15 14:30:00'
})

// 方法
const handleRefresh = () => {
  message.success('页面刷新成功')
  // 这里可以添加实际的刷新逻辑
}

const handleQuickAction = (action: any) => {
  router.push(action.path)
}

const handleServiceAction = (service: any) => {
  const action = service.status === 'running' ? '停止' : '启动'
  message.success(`${service.name} ${action}操作执行成功`)
  // 更新服务状态
  service.status = service.status === 'running' ? 'stopped' : 'running'
}

const getActivityIcon = (type: string) => {
  const icons = {
    info: InfoCircleOutlined,
    success: CheckCircleOutlined,
    warning: ExclamationCircleOutlined
  }
  return icons[type] || InfoCircleOutlined
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.system-management {
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

.overview-card {
  text-align: center;
}

.quick-actions {
  margin-bottom: 24px;
}

.quick-actions h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-content {
  text-align: center;
  padding: 8px 0;
}

.action-icon {
  font-size: 24px;
  color: #1890ff;
  margin-bottom: 8px;
}

.action-title {
  font-size: 14px;
  color: #333;
}

.system-status {
  margin-bottom: 24px;
}

.system-status h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.status-card,
.activity-card {
  height: 300px;
}

.activity-content {
  padding-left: 8px;
}

.activity-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #999;
}

.system-info h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #666;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.ant-timeline-item-head) {
  border: none;
}

:deep(.ant-timeline-item-content) {
  margin-left: 8px;
}
</style>