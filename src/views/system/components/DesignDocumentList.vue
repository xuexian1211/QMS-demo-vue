<template>
    <div class="design-document-list">
        <a-empty v-if="documents.length === 0" description="暂无设计文档" />

        <div v-else class="document-list">
            <a-collapse v-model:activeKey="activeKeys" accordion>
                <a-collapse-panel v-for="doc in documents" :key="doc.id" :header="doc.title">
                    <template #extra>
                        <a-space>
                            <a-tag :color="getDocumentTypeColor(doc.documentType)">
                                {{ getDocumentTypeText(doc.documentType) }}
                            </a-tag>
                            <a-progress type="circle" :width="40" :percent="calculateProgress(doc)"
                                :stroke-color="getProgressColor(calculateProgress(doc))" />
                        </a-space>
                    </template>

                    <!-- 任务列表 -->
                    <div class="task-list">
                        <a-table :columns="taskColumns" :data-source="doc.tasks" :pagination="false" size="small"
                            row-key="id">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'taskNumber'">
                                    <a-tag>{{ record.taskNumber }}</a-tag>
                                </template>
                                <template v-else-if="column.key === 'title'">
                                    <div class="task-title">
                                        <div class="title-text">{{ record.title }}</div>
                                        <div class="task-description" v-if="record.description">
                                            {{ record.description }}
                                        </div>
                                    </div>
                                </template>
                                <template v-else-if="column.key === 'assigneeRole'">
                                    <a-tag :color="getRoleColor(record.assigneeRole)">
                                        {{ getRoleText(record.assigneeRole) }}
                                    </a-tag>
                                </template>
                                <template v-else-if="column.key === 'status'">
                                    <a-select v-model:value="record.status" size="small" style="width: 100px"
                                        @change="handleStatusChange(doc.id, record)">
                                        <a-select-option value="pending">
                                            <a-tag color="default">待处理</a-tag>
                                        </a-select-option>
                                        <a-select-option value="in-progress">
                                            <a-tag color="processing">进行中</a-tag>
                                        </a-select-option>
                                        <a-select-option value="completed">
                                            <a-tag color="success">已完成</a-tag>
                                        </a-select-option>
                                    </a-select>
                                </template>
                                <template v-else-if="column.key === 'estimatedHours'">
                                    {{ record.estimatedHours }}h
                                </template>
                                <template v-else-if="column.key === 'dependencies'">
                                    <a-space v-if="record.dependencies && record.dependencies.length > 0">
                                        <a-tag v-for="dep in record.dependencies" :key="dep" size="small">
                                            {{ dep }}
                                        </a-tag>
                                    </a-space>
                                    <span v-else style="color: #999">-</span>
                                </template>
                                <template v-else-if="column.key === 'completedAt'">
                                    {{ record.completedAt ? formatDate(record.completedAt) : '-' }}
                                </template>
                            </template>
                        </a-table>
                    </div>

                    <!-- 文档操作 -->
                    <div class="document-actions" style="margin-top: 16px">
                        <a-space>
                            <a-button size="small" @click="handleExportMarkdown(doc)">
                                <template #icon>
                                    <DownloadOutlined />
                                </template>
                                导出 Markdown
                            </a-button>
                            <a-button size="small" @click="handleExportPDF(doc)">
                                <template #icon>
                                    <FilePdfOutlined />
                                </template>
                                导出 PDF
                            </a-button>
                        </a-space>
                    </div>
                </a-collapse-panel>
            </a-collapse>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { message } from 'ant-design-vue'
    import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons-vue'
    import type { DesignDocument, DesignTask } from '@/types'
    import { updateTaskStatus } from '@/api/updateLog'

    interface Props {
        documents: DesignDocument[]
    }

    const props = defineProps < Props > ()
    const emit = defineEmits < {
  (e: 'task-update'): void
}> ()

    // 展开的面板
    const activeKeys = ref < string[] > ([])

    // 任务表格列
    const taskColumns = [
        {
            title: '任务编号',
            dataIndex: 'taskNumber',
            key: 'taskNumber',
            width: 100
        },
        {
            title: '任务标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true
        },
        {
            title: '负责角色',
            dataIndex: 'assigneeRole',
            key: 'assigneeRole',
            width: 100
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120
        },
        {
            title: '预估工时',
            dataIndex: 'estimatedHours',
            key: 'estimatedHours',
            width: 100
        },
        {
            title: '依赖任务',
            dataIndex: 'dependencies',
            key: 'dependencies',
            width: 150
        },
        {
            title: '完成时间',
            dataIndex: 'completedAt',
            key: 'completedAt',
            width: 180
        }
    ]

    // 计算进度
    const calculateProgress = (doc: DesignDocument) => {
        if (!doc.tasks || doc.tasks.length === 0) return 0
        const completedCount = doc.tasks.filter(t => t.status === 'completed').length
        return Math.round((completedCount / doc.tasks.length) * 100)
    }

    // 状态变更
    const handleStatusChange = async (docId: string, task: DesignTask) => {
        try {
            const response = await updateTaskStatus(docId, task.id, {
                status: task.status
            })
            if (response.success) {
                message.success('状态更新成功')
                emit('task-update')
            } else {
                message.error(response.message)
            }
        } catch (error) {
            message.error('状态更新失败')
            console.error(error)
        }
    }

    // 导出 Markdown
    const handleExportMarkdown = (doc: DesignDocument) => {
        // 生成 Markdown 内容
        let markdown = `# ${doc.title}\n\n`
        markdown += `**文档类型**: ${getDocumentTypeText(doc.documentType)}\n\n`
        markdown += `**创建时间**: ${formatDate(doc.createdAt)}\n\n`
        markdown += `**创建人**: ${doc.createdBy}\n\n`
        markdown += `---\n\n`
        markdown += `## 任务列表\n\n`

        doc.tasks.forEach(task => {
            markdown += `### ${task.taskNumber} ${task.title}\n\n`
            if (task.description) {
                markdown += `${task.description}\n\n`
            }
            markdown += `- **负责角色**: ${getRoleText(task.assigneeRole)}\n`
            markdown += `- **状态**: ${getStatusText(task.status)}\n`
            markdown += `- **预估工时**: ${task.estimatedHours}h\n`
            if (task.dependencies && task.dependencies.length > 0) {
                markdown += `- **依赖任务**: ${task.dependencies.join(', ')}\n`
            }
            if (task.completedAt) {
                markdown += `- **完成时间**: ${formatDate(task.completedAt)}\n`
            }
            markdown += `\n`
        })

        // 下载文件
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${doc.title}.md`
        link.click()
        URL.revokeObjectURL(url)

        message.success('导出成功')
    }

    // 导出 PDF
    const handleExportPDF = (doc: DesignDocument) => {
        // TODO: 实现 PDF 导出功能
        // 可以使用 jsPDF 或后端服务
        message.info('PDF 导出功能开发中')
    }

    // 辅助函数
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN')
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

    const getDocumentTypeColor = (type: string) => {
        const colorMap: Record<string, string> = {
            frontend: 'blue',
            backend: 'green',
            test: 'orange',
            general: 'purple'
        }
        return colorMap[type] || 'default'
    }

    const getRoleText = (role: string) => {
        const textMap: Record<string, string> = {
            frontend: '前端',
            backend: '后端',
            test: '测试',
            devops: '运维',
            general: '通用'
        }
        return textMap[role] || role
    }

    const getRoleColor = (role: string) => {
        const colorMap: Record<string, string> = {
            frontend: 'blue',
            backend: 'green',
            test: 'orange',
            devops: 'purple',
            general: 'default'
        }
        return colorMap[role] || 'default'
    }

    const getStatusText = (status: string) => {
        const textMap: Record<string, string> = {
            pending: '待处理',
            'in-progress': '进行中',
            completed: '已完成'
        }
        return textMap[status] || status
    }

    const getProgressColor = (rate: number) => {
        if (rate >= 80) return '#52c41a'
        if (rate >= 50) return '#1890ff'
        if (rate >= 30) return '#faad14'
        return '#ff4d4f'
    }
</script>

<style scoped>
    .design-document-list {
        width: 100%;
    }

    .document-list {
        width: 100%;
    }

    .task-list {
        margin-top: 16px;
    }

    .task-title {
        display: flex;
        flex-direction: column;
    }

    .title-text {
        font-weight: 500;
        margin-bottom: 4px;
    }

    .task-description {
        font-size: 12px;
        color: #999;
        line-height: 1.5;
    }

    .document-actions {
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
    }

    :deep(.ant-collapse-header) {
        font-weight: 500;
    }

    :deep(.ant-table-small) {
        font-size: 13px;
    }
</style>