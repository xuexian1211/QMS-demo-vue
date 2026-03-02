<template>
    <div class="doc-management">
        <!-- 左侧分类树 -->
        <div class="doc-management__tree">
            <div class="doc-management__tree-title">文档分类</div>
            <a-tree
                :tree-data="categoryTree"
                :selected-keys="selectedKeys"
                default-expand-all
                @select="handleTreeSelect"
            >
                <template #title="{ title, primaryStorage }">
                    <span>{{ title }}</span>
                    <a-tag v-if="primaryStorage" :color="primaryStorage === 'PLM' ? 'blue' : 'green'" style="margin-left: 6px; font-size: 11px; line-height: 18px; padding: 0 4px;">
                        {{ primaryStorage }}
                    </a-tag>
                </template>
            </a-tree>
        </div>

        <!-- 右侧内容区 -->
        <div class="doc-management__content">
            <!-- 工具栏 -->
            <div class="toolbar">
                <a-space>
                    <a-button type="primary" @click="handleAdd">
                        <template #icon><PlusOutlined /></template>新增
                    </a-button>
                    <a-button :disabled="selectedRowKeys.length !== 1 || !canEditSelected" @click="handleEditSelected">
                        <template #icon><EditOutlined /></template>编辑
                    </a-button>
                    <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
                        <template #icon><DeleteOutlined /></template>删除
                    </a-button>
                    <a-button @click="handleExport">
                        <template #icon><ExportOutlined /></template>导出
                    </a-button>
                    <a-button @click="loadData">
                        <template #icon><ReloadOutlined /></template>刷新
                    </a-button>
                </a-space>
            </div>

            <!-- 搜索区 -->
            <a-card class="search-card" :bordered="false">
                <a-form layout="inline" :model="queryParam">
                    <a-form-item label="文档编号">
                        <a-input v-model:value="queryParam.docNo" placeholder="请输入" allow-clear style="width: 120px" />
                    </a-form-item>
                    <a-form-item label="文档名称">
                        <a-input v-model:value="queryParam.keyword" placeholder="请输入" allow-clear style="width: 150px" />
                    </a-form-item>
                    <a-form-item label="状态">
                        <a-select v-model:value="queryParam.status" style="width: 100px" allow-clear placeholder="请选择">
                            <a-select-option value="DRAFT">草稿</a-select-option>
                            <a-select-option value="IN_APPROVAL">审批中</a-select-option>
                            <a-select-option value="PUBLISHED">已发布</a-select-option>
                            <a-select-option value="OBSOLETE">已作废</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="主存来源">
                        <a-select v-model:value="queryParam.storageSource" style="width: 100px" allow-clear placeholder="请选择">
                            <a-select-option value="QMS">QMS</a-select-option>
                            <a-select-option value="PLM">PLM</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                    </a-form-item>
                </a-form>
            </a-card>

            <!-- 表格 -->
            <div class="table-container">
                <a-table
                    :columns="columns"
                    :data-source="tableData"
                    :loading="loading"
                    row-key="id"
                    size="middle"
                    :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                    :pagination="pagination"
                    @change="handleTableChange"
                >
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'docName'">
                            <a-button type="link" size="small" style="padding: 0;" @click="handlePreview(record)">{{ record.docName }}</a-button>
                        </template>
                        <template v-if="column.key === 'category'">
                            <span>{{ BIZ_SCENE_LABEL[record.bizScene] }}</span>
                            <span style="color: #999;"> / {{ MODULE_LABEL[record.docModule] }}</span>
                        </template>
                        <template v-if="column.key === 'storageSource'">
                            <a-tag :color="record.storageSource === 'PLM' ? 'blue' : 'green'">{{ record.storageSource }}</a-tag>
                        </template>
                        <template v-if="column.key === 'status'">
                            <a-tag :color="getStatusColor(record)">{{ getStatusText(record) }}</a-tag>
                        </template>
                        <template v-if="column.key === 'action'">
                            <a-space>
                                <a-button type="link" size="small" @click="handlePreview(record)">预览</a-button>
                                <a-divider type="vertical" />
                                <a-button type="link" size="small" @click="handleDownload(record)">下载</a-button>
                                <a-divider type="vertical" />
                                <a-dropdown>
                                    <a-button type="link" size="small">更多 <DownOutlined /></a-button>
                                    <template #overlay>
                                        <a-menu @click="(e: { key: string }) => handleMenuClick(record, e.key)">
                                            <a-menu-item key="view">查看详情</a-menu-item>
                                            <a-menu-item key="edit" :disabled="!canEdit(record)">编辑</a-menu-item>
                                            <a-menu-divider />
                                            <a-menu-item key="IN_APPROVAL" :disabled="!isQMS(record) || record.status !== 'DRAFT'">提交审批</a-menu-item>
                                            <a-menu-item key="PUBLISHED" :disabled="!isQMS(record) || record.status !== 'IN_APPROVAL'">审批通过</a-menu-item>
                                            <a-menu-item key="OBSOLETE" :disabled="!isQMS(record) || record.status === 'OBSOLETE'">作废</a-menu-item>
                                            <a-menu-divider />
                                            <a-menu-item key="history">查看历史版本</a-menu-item>
                                            <a-menu-item v-if="record.storageSource === 'PLM'" key="sync">同步版本</a-menu-item>
                                            <a-menu-divider />
                                            <a-menu-item key="delete" danger :disabled="!isQMS(record) || record.status !== 'DRAFT'">删除</a-menu-item>
                                        </a-menu>
                                    </template>
                                </a-dropdown>
                            </a-space>
                        </template>
                    </template>
                </a-table>
            </div>
        </div>

        <!-- 历史版本弹窗 -->
        <a-modal v-model:open="historyModalVisible" title="历史版本" width="850px" :footer="null">
            <a-alert type="info" show-icon style="margin-bottom: 16px">
                <template #message>
                    文档编号：<strong>{{ currentDocForHistory?.docNo }}</strong>
                    &nbsp;|&nbsp;
                    名称：<strong>{{ currentDocForHistory?.docName }}</strong>
                </template>
            </a-alert>
            <a-timeline mode="left">
                <a-timeline-item v-for="item in historyData" :key="item.version" :color="getTimelineColor(item.status)">
                    <template #dot>
                        <div class="history-version-dot">{{ item.version }}</div>
                    </template>
                    <a-card size="small" :bordered="false" class="history-card">
                        <a-row :gutter="16">
                            <a-col :span="6">
                                <span class="history-label">状态</span>
                                <a-tag :color="statusColorMap[item.status]">{{ statusTextMap[item.status] }}</a-tag>
                            </a-col>
                            <a-col :span="8">
                                <span class="history-label">操作时间</span>
                                <span>{{ item.operateTime }}</span>
                            </a-col>
                            <a-col :span="4">
                                <span class="history-label">操作人</span>
                                <span>{{ item.operator }}</span>
                            </a-col>
                            <a-col :span="6">
                                <span class="history-label">备注</span>
                                <span>{{ item.remark || '-' }}</span>
                            </a-col>
                        </a-row>
                        <a-row style="margin-top: 8px">
                            <a-col :span="24" style="text-align: right">
                                <a-button type="link" size="small" @click="handleViewHistoryVersion(item)">查看详情</a-button>
                                <a-button v-if="item.status === 'OBSOLETE'" type="link" size="small" @click="handleRestoreVersion(item)">恢复此版本</a-button>
                            </a-col>
                        </a-row>
                    </a-card>
                </a-timeline-item>
            </a-timeline>
        </a-modal>

        <!-- 文件预览抽屉 -->
        <a-drawer
            v-model:open="previewDrawerVisible"
            :title="previewDoc?.docName"
            width="720"
            placement="right"
        >
            <template #extra>
                <a-space>
                    <a-button size="small" @click="handleDownload(previewDoc!)">下载文件</a-button>
                    <a-button type="primary" size="small" @click="handleView(previewDoc!)">查看详情</a-button>
                </a-space>
            </template>
            <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px;">
                <a-descriptions-item label="文档编号">{{ previewDoc?.docNo }}</a-descriptions-item>
                <a-descriptions-item label="版本">{{ previewDoc?.version }}</a-descriptions-item>
                <a-descriptions-item label="文件格式">{{ previewDoc?.fileFormat || '-' }}</a-descriptions-item>
                <a-descriptions-item label="文件大小">{{ previewDoc?.fileSize || '-' }}</a-descriptions-item>
                <a-descriptions-item label="主存来源">
                    <a-tag :color="previewDoc?.storageSource === 'PLM' ? 'blue' : 'green'">{{ previewDoc?.storageSource }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="状态">
                    <a-tag v-if="previewDoc" :color="getStatusColor(previewDoc)">{{ getStatusText(previewDoc) }}</a-tag>
                </a-descriptions-item>
            </a-descriptions>
            <div class="preview-placeholder">
                <FileOutlined style="font-size: 48px; color: #bfbfbf;" />
                <p style="color: #999; margin-top: 12px;">{{ previewDoc?.docName }}.{{ previewDoc?.fileFormat?.toLowerCase() || 'pdf' }}</p>
                <p style="color: #bfbfbf; font-size: 12px;">文件预览区域（演示占位）</p>
            </div>
        </a-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ExportOutlined, ReloadOutlined, DownOutlined, FileOutlined
} from '@ant-design/icons-vue'
import { DOC_CATEGORY_TREE, getDocumentList, getVersionHistory } from '@/api/document'
import type { ControlledDocument, ControlledDocStatus, DocCategoryNode, DocVersionRecord } from '@/types'

const router = useRouter()

// --- 状态定义 ---
const loading = ref(false)
const selectedKeys = ref<string[]>([])
const selectedNode = ref<DocCategoryNode | null>(null)
const selectedRowKeys = ref<string[]>([])
const tableData = ref<ControlledDocument[]>([])
const historyModalVisible = ref(false)
const historyData = ref<DocVersionRecord[]>([])
const currentDocForHistory = ref<ControlledDocument | null>(null)
const previewDrawerVisible = ref(false)
const previewDoc = ref<ControlledDocument | null>(null)
const categoryTree = DOC_CATEGORY_TREE

const queryParam = reactive({
    docNo: '',
    keyword: '',
    status: undefined as ControlledDocStatus | undefined,
    storageSource: undefined as string | undefined
})

const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
})

// --- 标签映射 ---
const statusColorMap: Record<ControlledDocStatus, string> = {
    DRAFT: 'default', IN_APPROVAL: 'processing', PUBLISHED: 'success', OBSOLETE: 'error'
}
const statusTextMap: Record<ControlledDocStatus, string> = {
    DRAFT: '草稿', IN_APPROVAL: '审批中', PUBLISHED: '已发布', OBSOLETE: '已作废'
}

const BIZ_SCENE_LABEL: Record<string, string> = {
    'system-planning': '体系策划', 'product-design': '产品设计',
    'production-process': '生产过程', 'quality-inspection': '质量检验',
    'exception-management': '异常改进'
}
const MODULE_LABEL: Record<string, string> = {
    'system-docs': '体系文件', 'basic-data-docs': '基础数据图档',
    'core-engineering': '核心工程图档', 'five-tools': '五大工具文档',
    'work-instructions': '作业指导书', 'visual-management': '现场目视化',
    'inspection-reports': '检验报告', 'test-reports': '实验/测试报告',
    'ncr-handling': '不合格处理', 'problem-solving': '问题解决', 'audit-management': '审核管理'
}

// --- 列定义 ---
const columns = computed(() => {
    const base: any[] = [
        { title: '文档编号', dataIndex: 'docNo', key: 'docNo', width: 140 },
        { title: '文档名称', dataIndex: 'docName', key: 'docName', width: 200 },
        { title: '分类', key: 'category', width: 180 },
        { title: '文档类型', dataIndex: 'docType', key: 'docType', width: 100 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 70 },
        { title: '主存', key: 'storageSource', width: 70 },
        { title: '状态', key: 'status', width: 90 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
        { title: '操作', key: 'action', width: 200, fixed: 'right' }
    ]
    return base
})

// --- 辅助方法 ---
function isQMS(record: ControlledDocument): boolean {
    return record.storageSource === 'QMS'
}

function canEdit(record: ControlledDocument): boolean {
    return isQMS(record) && record.status === 'DRAFT'
}

const canEditSelected = computed(() => {
    if (selectedRowKeys.value.length !== 1) return false
    const item = tableData.value.find(d => d.id === selectedRowKeys.value[0])
    return item ? canEdit(item) : false
})

function getStatusColor(record: ControlledDocument): string {
    if (record.storageSource === 'PLM') return 'success'
    return statusColorMap[record.status] || 'default'
}

function getStatusText(record: ControlledDocument): string {
    if (record.storageSource === 'PLM') return '已发布'
    return statusTextMap[record.status] || record.status
}

function getTimelineColor(status: ControlledDocStatus): string {
    const map: Record<string, string> = { DRAFT: 'gray', IN_APPROVAL: 'blue', PUBLISHED: 'green', OBSOLETE: 'red' }
    return map[status] || 'gray'
}

function findNode(tree: DocCategoryNode[], key: string): DocCategoryNode | null {
    for (const node of tree) {
        if (node.key === key) return node
        if (node.children) {
            const found = findNode(node.children, key)
            if (found) return found
        }
    }
    return null
}

// --- 数据加载 ---
function loadData() {
    loading.value = true
    setTimeout(() => {
        const node = selectedNode.value
        let result = getDocumentList({
            bizScene: node?.bizScene,
            docModule: node?.isLeaf ? node.docModule : undefined,
            keyword: queryParam.keyword || undefined,
            status: queryParam.status || undefined,
            storageSource: queryParam.storageSource as any || undefined
        })
        if (queryParam.docNo) {
            result = result.filter(d => d.docNo.toLowerCase().includes(queryParam.docNo.toLowerCase()))
        }
        tableData.value = result
        pagination.total = result.length
        loading.value = false
    }, 300)
}

// --- 事件处理 ---
function handleTreeSelect(keys: string[]) {
    selectedKeys.value = keys
    selectedNode.value = keys[0] ? findNode(categoryTree, keys[0]) : null
    pagination.current = 1
    loadData()
}

function handleSearch() {
    pagination.current = 1
    loadData()
}

function handleReset() {
    queryParam.docNo = ''
    queryParam.keyword = ''
    queryParam.status = undefined
    queryParam.storageSource = undefined
    handleSearch()
}

function handleTableChange(pag: any) {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    loadData()
}

function onSelectChange(keys: string[]) {
    selectedRowKeys.value = keys
}

function handleAdd() {
    router.push('/quality-system/document-management/create')
}

function handleView(record: ControlledDocument) {
    router.push(`/quality-system/document-management/view/${record.id}`)
}

function handlePreview(record: ControlledDocument) {
    previewDoc.value = record
    previewDrawerVisible.value = true
}

function handleDownload(record: ControlledDocument) {
    // TODO: Connect to Real API
    message.success(`开始下载: ${record.docName}.${record.fileFormat?.toLowerCase() || 'pdf'}`)
}

function handleEditRow(record: ControlledDocument) {
    if (!canEdit(record)) {
        message.warning('只有QMS草稿状态的文档可以编辑')
        return
    }
    router.push(`/quality-system/document-management/edit/${record.id}`)
}

function handleEditSelected() {
    const item = tableData.value.find(d => d.id === selectedRowKeys.value[0])
    if (item) handleEditRow(item)
}

function handleBatchDelete() {
    const draftItems = tableData.value.filter(
        d => selectedRowKeys.value.includes(d.id) && isQMS(d) && d.status === 'DRAFT'
    )
    if (draftItems.length === 0) {
        message.warning('只有QMS草稿状态的文档可以删除')
        return
    }
    Modal.confirm({
        title: '确认删除',
        content: `确定删除选中的 ${draftItems.length} 条草稿文档吗？`,
        okType: 'danger',
        onOk() {
            tableData.value = tableData.value.filter(d => !draftItems.map(i => i.id).includes(d.id))
            selectedRowKeys.value = []
            message.success('删除成功')
        }
    })
}

function handleMenuClick(record: ControlledDocument, key: string) {
    if (key === 'view') {
        handleView(record)
        return
    }
    if (key === 'edit') {
        handleEditRow(record)
        return
    }
    if (key === 'history') {
        currentDocForHistory.value = record
        historyData.value = getVersionHistory(record.id)
        historyModalVisible.value = true
        return
    }
    if (key === 'sync') {
        message.success(`文档 ${record.docNo} 已发起PLM同步`)
        return
    }
    if (key === 'delete') {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除文档 ${record.docName} 吗？`,
            okType: 'danger',
            onOk() {
                tableData.value = tableData.value.filter(d => d.id !== record.id)
                message.success('删除成功')
            }
        })
        return
    }
    // 状态流转
    const statusLabel = statusTextMap[key as ControlledDocStatus] || key
    Modal.confirm({
        title: '确认操作',
        content: `确定将文档 ${record.docName} 的状态变更为 ${statusLabel} 吗？`,
        onOk() {
            record.status = key as ControlledDocStatus
            message.success('状态变更成功')
        }
    })
}

function handleViewHistoryVersion(item: DocVersionRecord) {
    if (currentDocForHistory.value) {
        router.push(`/quality-system/document-management/view/${currentDocForHistory.value.id}?version=${item.version}`)
    }
}

function handleRestoreVersion(item: DocVersionRecord) {
    Modal.confirm({
        title: '恢复版本',
        content: `确定基于 ${item.version} 创建新版本吗？这将创建一个草稿状态的新版本。`,
        onOk() {
            message.success(`已基于 ${item.version} 创建新版本草稿`)
            historyModalVisible.value = false
        }
    })
}

function handleExport() {
    message.success('导出任务已开始')
}

onMounted(loadData)
</script>

<style scoped>
.doc-management {
    display: flex;
    height: 100%;
}

.doc-management__tree {
    width: 240px;
    min-width: 240px;
    border-right: 1px solid #f0f0f0;
    padding: 16px 8px;
    overflow-y: auto;
    background: #fff;
}

.doc-management__tree-title {
    font-weight: 600;
    font-size: 14px;
    color: #262626;
    padding: 0 8px 12px;
}

.doc-management__content {
    flex: 1;
    padding: 16px;
    overflow: auto;
    background: #f0f2f5;
}

.toolbar {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
}

.search-card {
    margin-bottom: 16px;
}

.table-container {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
}

.history-version-dot {
    background: #1890ff;
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
}

.history-card {
    background: #fafafa;
    margin-bottom: 8px;
}

.history-label {
    display: block;
    color: #999;
    font-size: 12px;
    margin-bottom: 4px;
}

.preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
}
</style>
