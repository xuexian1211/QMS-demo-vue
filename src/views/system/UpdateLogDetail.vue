<template>
    <div class="update-log-detail-container">
        <a-spin :spinning="loading">
            <!-- 页面头部 -->
            <a-page-header :title="updateLog?.title" @back="handleBack">
                <template #tags>
                    <a-tag :color="getStatusColor(updateLog?.status)">
                        {{ getStatusText(updateLog?.status) }}
                    </a-tag>
                    <a-tag :color="getUpdateTypeColor(updateLog?.updateType)">
                        {{ getUpdateTypeText(updateLog?.updateType) }}
                    </a-tag>
                </template>
                <template #extra>
                    <a-space>
                        <a-button @click="handleEdit" v-if="updateLog?.status === 'draft'">
                            <template #icon>
                                <EditOutlined />
                            </template>
                            编辑
                        </a-button>
                        <a-button type="primary" @click="handlePublish" v-if="updateLog?.status === 'draft'">
                            <template #icon>
                                <CheckOutlined />
                            </template>
                            发布
                        </a-button>
                        <a-button @click="handleArchive" v-if="updateLog?.status === 'published'">
                            <template #icon>
                                <InboxOutlined />
                            </template>
                            归档
                        </a-button>
                    </a-space>
                </template>

                <a-descriptions :column="3" size="small">
                    <a-descriptions-item label="版本号">
                        <a-tag color="blue">{{ updateLog?.version }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="发布时间">
                        {{ updateLog?.publishedAt ? formatDate(updateLog.publishedAt) : '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="发布人">
                        {{ updateLog?.publishedBy || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="影响模块" :span="3">
                        <a-space>
                            <a-tag v-for="module in updateLog?.affectedModules" :key="module">
                                {{ module }}
                            </a-tag>
                        </a-space>
                    </a-descriptions-item>
                    <a-descriptions-item label="关联变更" :span="3" v-if="updateLog?.relatedChangeId">
                        <a-tag color="purple">{{ updateLog.relatedChangeId }}</a-tag>
                    </a-descriptions-item>
                </a-descriptions>
            </a-page-header>

            <!-- 内容区域 -->
            <div class="detail-content">
                <a-tabs v-model:activeKey="activeTab">
                    <!-- 更新内容 -->
                    <a-tab-pane key="content" tab="更新内容">
                        <div class="content-section">
                            <div v-if="updateLog?.contentType === 'html'" class="html-content"
                                v-html="updateLog?.content"></div>
                            <div v-else class="markdown-content" v-html="renderMarkdown(updateLog?.content || '')">
                            </div>
                        </div>
                    </a-tab-pane>

                    <!-- 功能设计文档 -->
                    <a-tab-pane key="design" tab="功能设计文档">
                        <div class="design-section">
                            <!-- 进度统计 -->
                            <a-row :gutter="16" style="margin-bottom: 24px">
                                <a-col :span="6" v-for="progress in designProgress" :key="progress.documentType">
                                    <a-card size="small">
                                        <a-statistic :title="getDocumentTypeText(progress.documentType)"
                                            :value="progress.completionRate" suffix="%"
                                            :value-style="{ color: getProgressColor(progress.completionRate) }">
                                            <template #prefix>
                                                <component :is="getDocumentTypeIcon(progress.documentType)" />
                                            </template>
                                        </a-statistic>
                                        <div style="margin-top: 8px; font-size: 12px; color: #999">
                                            {{ progress.completedTasks }} / {{ progress.totalTasks }} 任务完成
                                        </div>
                                    </a-card>
                                </a-col>
                            </a-row>

                            <!-- 设计文档列表 -->
                            <a-tabs v-model:activeKey="designDocTab" type="card">
                                <a-tab-pane key="all" tab="全部">
                                    <design-document-list :documents="designDocuments"
                                        @task-update="handleTaskUpdate" />
                                </a-tab-pane>
                                <a-tab-pane key="frontend" tab="前端任务">
                                    <design-document-list
                                        :documents="designDocuments.filter(d => d.documentType === 'frontend')"
                                        @task-update="handleTaskUpdate" />
                                </a-tab-pane>
                                <a-tab-pane key="backend" tab="后端任务">
                                    <design-document-list
                                        :documents="designDocuments.filter(d => d.documentType === 'backend')"
                                        @task-update="handleTaskUpdate" />
                                </a-tab-pane>
                                <a-tab-pane key="test" tab="测试任务">
                                    <design-document-list
                                        :documents="designDocuments.filter(d => d.documentType === 'test')"
                                        @task-update="handleTaskUpdate" />
                                </a-tab-pane>
                            </a-tabs>
                        </div>
                    </a-tab-pane>

                    <!-- 变更历史 -->
                    <a-tab-pane key="history" tab="变更历史">
                        <a-timeline>
                            <a-timeline-item v-if="updateLog?.publishedAt" color="green">
                                <template #dot>
                                    <CheckCircleOutlined />
                                </template>
                                <p>{{ formatDate(updateLog.publishedAt) }}</p>
                                <p>{{ updateLog.publishedBy }} 发布了此更新日志</p>
                            </a-timeline-item>
                            <a-timeline-item v-if="updateLog?.updateTime">
                                <template #dot>
                                    <EditOutlined />
                                </template>
                                <p>{{ formatDate(updateLog.updateTime) }}</p>
                                <p>{{ updateLog.updater }} 更新了内容</p>
                            </a-timeline-item>
                            <a-timeline-item v-if="updateLog?.createTime">
                                <template #dot>
                                    <PlusCircleOutlined />
                                </template>
                                <p>{{ formatDate(updateLog.createTime) }}</p>
                                <p>{{ updateLog.creator }} 创建了此更新日志</p>
                            </a-timeline-item>
                        </a-timeline>
                    </a-tab-pane>
                </a-tabs>
            </div>
        </a-spin>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, computed } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { message } from 'ant-design-vue'
    import {
        EditOutlined,
        CheckOutlined,
        InboxOutlined,
        CheckCircleOutlined,
        PlusCircleOutlined,
        CodeOutlined,
        DatabaseOutlined,
        BugOutlined,
        FileTextOutlined
    } from '@ant-design/icons-vue'
    import type { UpdateLog, DesignDocument, DesignDocumentProgress } from '@/types'
    import {
        getUpdateLogById,
        publishUpdateLog,
        archiveUpdateLog,
        getDesignDocuments,
        getDesignDocumentProgress
    } from '@/api/updateLog'
    import DesignDocumentList from './components/DesignDocumentList.vue'

    const router = useRouter()
    const route = useRoute()

    const logId = computed(() => route.params.id as string)

    // 状态
    const loading = ref(false)
    const activeTab = ref('content')
    const designDocTab = ref('all')

    // 数据
    const updateLog = ref < UpdateLog > ()
    const designDocuments = ref < DesignDocument[] > ([])
    const designProgress = ref < DesignDocumentProgress[] > ([])

    // 加载更新日志
    const loadUpdateLog = async () => {
        loading.value = true
        try {
            const response = await getUpdateLogById(logId.value)
            if (response.success) {
                updateLog.value = response.data
            } else {
                message.error(response.message)
                router.back()
            }
        } catch (error) {
            message.error('加载失败')
            console.error(error)
            router.back()
        } finally {
            loading.value = false
        }
    }

    // 加载设计文档
    const loadDesignDocuments = async () => {
        try {
            const response = await getDesignDocuments({ updateLogId: logId.value })
            if (response.success) {
                designDocuments.value = response.data
            }
        } catch (error) {
            console.error('加载设计文档失败', error)
        }
    }

    // 加载进度统计
    const loadProgress = async () => {
        try {
            const response = await getDesignDocumentProgress(logId.value)
            if (response.success) {
                designProgress.value = response.data
            }
        } catch (error) {
            console.error('加载进度失败', error)
        }
    }

    // 编辑
    const handleEdit = () => {
        router.push(`/system/update-log/edit/${logId.value}`)
    }

    // 发布
    const handlePublish = async () => {
        try {
            const response = await publishUpdateLog(logId.value)
            if (response.success) {
                message.success('发布成功')
                loadUpdateLog()
            } else {
                message.error(response.message)
            }
        } catch (error) {
            message.error('发布失败')
            console.error(error)
        }
    }

    // 归档
    const handleArchive = async () => {
        try {
            const response = await archiveUpdateLog(logId.value)
            if (response.success) {
                message.success('归档成功')
                loadUpdateLog()
            } else {
                message.error(response.message)
            }
        } catch (error) {
            message.error('归档失败')
            console.error(error)
        }
    }

    // 任务更新
    const handleTaskUpdate = () => {
        loadDesignDocuments()
        loadProgress()
    }

    // 返回
    const handleBack = () => {
        router.push('/system/update-log')
    }

    // 辅助函数
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN')
    }

    const renderMarkdown = (content: string) => {
        // TODO: 使用 marked 或 markdown-it 库
        return content.replace(/\n/g, '<br>')
    }

    const getStatusColor = (status?: string) => {
        const colorMap: Record<string, string> = {
            draft: 'default',
            published: 'success',
            archived: 'warning'
        }
        return colorMap[status || ''] || 'default'
    }

    const getStatusText = (status?: string) => {
        const textMap: Record<string, string> = {
            draft: '草稿',
            published: '已发布',
            archived: '已归档'
        }
        return textMap[status || ''] || status
    }

    const getUpdateTypeColor = (type?: string) => {
        const colorMap: Record<string, string> = {
            feature: 'green',
            fix: 'orange',
            optimize: 'blue',
            breaking: 'red'
        }
        return colorMap[type || ''] || 'default'
    }

    const getUpdateTypeText = (type?: string) => {
        const textMap: Record<string, string> = {
            feature: '新功能',
            fix: '修复',
            optimize: '优化',
            breaking: '重大变更'
        }
        return textMap[type || ''] || type
    }

    const getDocumentTypeText = (type: string) => {
        const textMap: Record<string, string> = {
            frontend: '前端',
            backend: '后端',
            test: '测试',
            general: '通用'
        }
        return textMap[type] || type
    }

    const getDocumentTypeIcon = (type: string) => {
        const iconMap: Record<string, any> = {
            frontend: CodeOutlined,
            backend: DatabaseOutlined,
            test: BugOutlined,
            general: FileTextOutlined
        }
        return iconMap[type] || FileTextOutlined
    }

    const getProgressColor = (rate: number) => {
        if (rate >= 80) return '#52c41a'
        if (rate >= 50) return '#1890ff'
        if (rate >= 30) return '#faad14'
        return '#ff4d4f'
    }

    // 初始化
    onMounted(() => {
        loadUpdateLog()
        loadDesignDocuments()
        loadProgress()
    })
</script>

<style scoped>
    .update-log-detail-container {
        background: #fff;
        min-height: calc(100vh - 104px);
    }

    .detail-content {
        padding: 24px;
    }

    .content-section {
        padding: 24px;
        background: #fafafa;
        border-radius: 4px;
        min-height: 400px;
    }

    .html-content,
    .markdown-content {
        line-height: 1.8;
        font-size: 14px;
    }

    .html-content :deep(h1),
    .markdown-content :deep(h1) {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 16px;
        border-bottom: 1px solid #e8e8e8;
        padding-bottom: 8px;
    }

    .html-content :deep(h2),
    .markdown-content :deep(h2) {
        font-size: 20px;
        font-weight: 600;
        margin: 24px 0 12px;
    }

    .html-content :deep(h3),
    .markdown-content :deep(h3) {
        font-size: 16px;
        font-weight: 600;
        margin: 16px 0 8px;
    }

    .html-content :deep(ul),
    .markdown-content :deep(ul) {
        padding-left: 24px;
        margin: 12px 0;
    }

    .html-content :deep(li),
    .markdown-content :deep(li) {
        margin: 8px 0;
    }

    .design-section {
        padding: 16px;
    }

    :deep(.ant-page-header) {
        border-bottom: 1px solid #f0f0f0;
        padding: 16px 24px;
    }
</style>