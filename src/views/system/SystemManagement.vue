<template>
  <div class="system-management">
    <a-row :gutter="[16, 16]">
      <a-col :span="6">
        <a-card hoverable @click="navigateTo('config')">
          <template #cover>
            <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: #1890ff; color: white;">
              <SettingOutlined style="font-size: 48px;" />
            </div>
          </template>
          <a-card-meta title="系统配置" description="管理系统参数配置" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card hoverable @click="navigateTo('menu')">
          <template #cover>
            <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: #52c41a; color: white;">
              <MenuOutlined style="font-size: 48px;" />
            </div>
          </template>
          <a-card-meta title="菜单管理" description="配置系统菜单权限" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card hoverable @click="navigateTo('log')">
          <template #cover>
            <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: #faad14; color: white;">
              <FileTextOutlined style="font-size: 48px;" />
            </div>
          </template>
          <a-card-meta title="系统日志" description="查看系统操作日志" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card hoverable @click="navigateTo('backup')">
          <template #cover>
            <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: #722ed1; color: white;">
              <CloudUploadOutlined style="font-size: 48px;" />
            </div>
          </template>
          <a-card-meta title="数据备份" description="管理系统数据备份" />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <a-col :span="24">
        <a-card title="系统信息">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="系统名称">S_QMS 1.0</a-descriptions-item>
            <a-descriptions-item label="系统版本">v1.0.0</a-descriptions-item>
            <a-descriptions-item label="部署环境">生产环境</a-descriptions-item>
            <a-descriptions-item label="数据库版本">MySQL 8.0</a-descriptions-item>
            <a-descriptions-item label="在线用户数">156</a-descriptions-item>
            <a-descriptions-item label="系统运行时间">15天8小时</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { SettingOutlined, MenuOutlined, FileTextOutlined, CloudUploadOutlined } from '@ant-design/icons-vue'

const navigateTo = (module: string) => {
  console.log('导航到:', module)
}
</script>

<style scoped>
.system-management {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.ant-card {
  cursor: pointer;
  transition: all 0.3s;
}

.ant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>