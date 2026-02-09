<template>
    <div class="page-container">
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon>
                        <PlusOutlined />
                    </template>新增
                </a-button>
                <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEdit">
                    <template #icon>
                        <EditOutlined />
                    </template>编辑
                </a-button>
                <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
                    <template #icon>
                        <DeleteOutlined />
                    </template>删除
                </a-button>
                <a-button @click="handleExport">
                    <template #icon>
                        <ExportOutlined />
                    </template>导出
                </a-button>
                <a-button @click="loadData">
                    <template #icon>
                        <ReloadOutlined />
                    </template>刷新
                </a-button>
            </a-space>
        </div>

        <a-card class="search-card" :bordered="false">
            <a-form layout="inline" :model="queryParam">
                <a-form-item label="所属组织">
                    <a-select v-model:value="queryParam.orgId" style="width: 150px" allow-clear placeholder="请选择">
                        <a-select-option value="ORG001">集团</a-select-option>
                        <a-select-option value="ORG002">芜湖工厂</a-select-option>
                        <a-select-option value="ORG003">合肥工厂</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="检验类型">
                    <a-select v-model:value="queryParam.inspType" style="width: 120px" allow-clear placeholder="请选择">
                        <a-select-option value="IQC">IQC来料</a-select-option>
                        <a-select-option value="IPQC">IPQC过程</a-select-option>
                        <a-select-option value="FQC">FQC成品</a-select-option>
                        <a-select-option value="OQC">OQC出货</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="模板编码">
                    <a-input v-model:value="queryParam.code" placeholder="请输入" allow-clear style="width: 120px" />
                </a-form-item>
                <a-form-item label="模板名称">
                    <a-input v-model:value="queryParam.name" placeholder="请输入" allow-clear style="width: 150px" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="queryParam.status" style="width: 100px" allow-clear placeholder="请选择">
                        <a-select-option value="DRAFT">草稿</a-select-option>
                        <a-select-option value="IN_APPROVAL">审批中</a-select-option>
                        <a-select-option value="APPROVED">已批准</a-select-option>
                        <a-select-option value="OBSOLETE">已作废</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="版本">
                    <a-input v-model:value="queryParam.version" placeholder="如：V1.0" allow-clear style="width: 80px" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                    <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                </a-form-item>
            </a-form>
        </a-card>

        <div class="table-container">
            <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" size="middle"
                :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" size="small" @click="handleEdit(record)"
                                :disabled="record.status !== 'DRAFT'">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-dropdown>
                                <a-button type="link" size="small">
                                    更多
                                    <DownOutlined />
                                </a-button>
                                <template #overlay>
                                    <a-menu @click="(e) => handleStatusChange(record, e.key)">
                                        <a-menu-item key="IN_APPROVAL"
                                            :disabled="record.status !== 'DRAFT'">提交审批</a-menu-item>
                                        <a-menu-item key="APPROVED"
                                            :disabled="record.status !== 'IN_APPROVAL'">审批通过</a-menu-item>
                                        <a-menu-item key="OBSOLETE"
                                            :disabled="record.status === 'OBSOLETE'">作废</a-menu-item>
                                        <a-menu-divider />
                                        <a-menu-item key="history">查看历史版本</a-menu-item>
                                        <a-menu-item key="copy">复制模板</a-menu-item>
                                        <a-menu-divider />
                                        <a-menu-item key="delete" danger
                                            :disabled="record.status !== 'DRAFT'">删除</a-menu-item>
                                    </a-menu>
                                </template>
                            </a-dropdown>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- 历史版本弹窗 -->
        <a-modal v-model:visible="historyModalVisible" title="历史版本" width="850px" :footer="null">
            <a-alert type="info" show-icon style="margin-bottom: 16px">
                <template #message>
                    模板编码：<strong>{{ currentTemplateForHistory?.code }}</strong>
                    &nbsp;|&nbsp;
                    名称：<strong>{{ currentTemplateForHistory?.name }}</strong>
                </template>
            </a-alert>
            <a-timeline mode="left">
                <a-timeline-item v-for="item in historyData" :key="item.id"
                    :color="getHistoryTimelineColor(item.status)">
                    <template #dot>
                        <div class="history-version-dot">{{ item.version }}</div>
                    </template>
                    <a-card size="small" :bordered="false" class="history-card">
                        <a-row :gutter="16">
                            <a-col :span="6">
                                <span class="history-label">状态</span>
                                <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag>
                            </a-col>
                            <a-col :span="6">
                                <span class="history-label">更新时间</span>
                                <span>{{ item.updateTime }}</span>
                            </a-col>
                            <a-col :span="4">
                                <span class="history-label">操作人</span>
                                <span>{{ item.updater }}</span>
                            </a-col>
                            <a-col :span="8">
                                <span class="history-label">变更摘要</span>
                                <span>{{ item.changeSummary || '-' }}</span>
                            </a-col>
                        </a-row>
                        <a-row style="margin-top: 8px">
                            <a-col :span="24" style="text-align: right">
                                <a-button type="link" size="small"
                                    @click="handleViewHistoryVersion(item)">查看详情</a-button>
                                <a-button v-if="item.status === 'OBSOLETE'" type="link" size="small"
                                    @click="handleRestoreVersion(item)">恢复此版本</a-button>
                            </a-col>
                        </a-row>
                    </a-card>
                </a-timeline-item>
            </a-timeline>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined,
        ExportOutlined, ReloadOutlined, DownOutlined
    } from '@ant-design/icons-vue'

    const router = useRouter()

    // --- 状态定义 ---
    const loading = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const historyModalVisible = ref(false)
    const historyData = ref < any[] > ([])
    const currentTemplateForHistory = ref < any > (null)

    const queryParam = reactive({
        orgId: undefined as string | undefined,
        inspType: undefined as string | undefined,
        code: '',
        name: '',
        status: undefined as string | undefined,
        version: ''
    })

    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    })

    // 列定义
    const columns = [
        { title: '所属组织', dataIndex: 'orgName', key: 'orgName', width: 100 },
        { title: '模板编码', dataIndex: 'code', key: 'code', width: 140 },
        { title: '模板名称', dataIndex: 'name', key: 'name', width: 180 },
        { title: '检验类型', dataIndex: 'inspType', key: 'inspType', width: 90 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 70 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
        { title: '明细数', dataIndex: 'detailCount', key: 'detailCount', width: 80 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
        { title: '操作', key: 'action', width: 200, fixed: 'right' }
    ]

    const historyColumns = [
        { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
        { title: '更新人', dataIndex: 'updater', key: 'updater', width: 100 },
        { title: '操作', key: 'action', width: 80 }
    ]

    // 状态显示
    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = {
            DRAFT: 'default',
            IN_APPROVAL: 'processing',
            APPROVED: 'success',
            OBSOLETE: 'error'
        }
        return colorMap[status] || 'default'
    }

    const getStatusText = (status: string) => {
        const textMap: Record<string, string> = {
            DRAFT: '草稿',
            IN_APPROVAL: '审批中',
            APPROVED: '已批准',
            OBSOLETE: '已作废'
        }
        return textMap[status] || status
    }

    // --- 数据加载 ---
    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            let data = [
                { id: '1', orgId: 'ORG001', orgName: '集团', code: 'TPL-IQC-001', name: 'IQC原材料检验模板', version: 'V1.0', status: 'APPROVED', inspType: 'IQC', detailCount: 5, updateTime: '2026-01-10 10:00' },
                { id: '2', orgId: 'ORG002', orgName: '芜湖工厂', code: 'TPL-IPQC-001', name: 'IPQC过程检验模板', version: 'V2.0', status: 'DRAFT', inspType: 'IPQC', detailCount: 8, updateTime: '2026-01-12 14:30' },
                { id: '3', orgId: 'ORG003', orgName: '合肥工厂', code: 'TPL-FQC-001', name: 'FQC成品检验模板', version: 'V1.0', status: 'IN_APPROVAL', inspType: 'FQC', detailCount: 10, updateTime: '2026-01-11 09:15' },
                { id: '4', orgId: 'ORG002', orgName: '芜湖工厂', code: 'TPL-OQC-001', name: 'OQC出货检验模板', version: 'V1.0', status: 'OBSOLETE', inspType: 'OQC', detailCount: 6, updateTime: '2025-12-20 16:00' },
                { id: '5', orgId: 'ORG001', orgName: '集团', code: 'TPL-IQC-002', name: 'IQC电子元器件检验模板', version: 'V1.0', status: 'APPROVED', inspType: 'IQC', detailCount: 12, updateTime: '2026-01-15 08:00' },
                { id: '6', orgId: 'ORG003', orgName: '合肥工厂', code: 'TPL-IPQC-002', name: 'IPQC焊接工序检验模板', version: 'V1.0', status: 'APPROVED', inspType: 'IPQC', detailCount: 6, updateTime: '2026-01-08 11:00' },
            ]

            // 过滤
            if (queryParam.orgId) data = data.filter(i => i.orgId === queryParam.orgId)
            if (queryParam.inspType) data = data.filter(i => i.inspType === queryParam.inspType)
            if (queryParam.code) data = data.filter(i => i.code.includes(queryParam.code))
            if (queryParam.name) data = data.filter(i => i.name.includes(queryParam.name))
            if (queryParam.status) data = data.filter(i => i.status === queryParam.status)
            if (queryParam.version) data = data.filter(i => i.version.includes(queryParam.version))

            tableData.value = data
            pagination.total = data.length
            loading.value = false
        }, 300)
    }

    const handleSearch = () => {
        pagination.current = 1
        loadData()
    }

    const handleReset = () => {
        queryParam.orgId = undefined
        queryParam.inspType = undefined
        queryParam.code = ''
        queryParam.name = ''
        queryParam.status = undefined
        queryParam.version = ''
        handleSearch()
    }

    const handleTableChange = (pag: any) => {
        pagination.current = pag.current
        pagination.pageSize = pag.pageSize
        loadData()
    }

    const onSelectChange = (keys: string[]) => {
        selectedRowKeys.value = keys
    }

    // --- 操作 ---
    const handleAdd = () => {
        router.push('/inspection-model/insp-templates/create')
    }

    const handleView = (record: any) => {
        router.push(`/inspection-model/insp-templates/view/${record.id}`)
    }

    const handleEdit = (record?: any) => {
        const item = record?.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
        if (!item) return
        if (item.status !== 'Draft') {
            message.warning('只有草稿状态的模板可以编辑')
            return
        }
        router.push(`/inspection-model/insp-templates/edit/${item.id}`)
    }

    const handleBatchDelete = () => {
        const draftItems = tableData.value.filter(i => selectedRowKeys.value.includes(i.id) && i.status === 'Draft')
        if (draftItems.length === 0) {
            message.warning('只有草稿状态的模板可以删除')
            return
        }
        Modal.confirm({
            title: '确认删除',
            content: `确定删除选中的 ${draftItems.length} 条草稿模板吗？`,
            okType: 'danger',
            onOk() {
                tableData.value = tableData.value.filter(i => !draftItems.map(d => d.id).includes(i.id))
                selectedRowKeys.value = []
                message.success('删除成功')
            }
        })
    }

    const handleStatusChange = (record: any, key: string) => {
        if (key === 'history') {
            // 记录当前模板信息用于弹窗展示
            currentTemplateForHistory.value = record
            // 显示历史版本（模拟数据）
            historyData.value = [
                { id: 'h1', version: 'V2.0', status: 'APPROVED', updateTime: '2026-01-10 10:00', updater: '张三', changeSummary: '增加硬度检验项目' },
                { id: 'h2', version: 'V1.1', status: 'OBSOLETE', updateTime: '2025-12-15 14:00', updater: '李四', changeSummary: '调整抽样规则为 AQL 0.65' },
                { id: 'h3', version: 'V1.0', status: 'OBSOLETE', updateTime: '2025-11-01 09:00', updater: '王五', changeSummary: '初始版本创建' },
            ]
            historyModalVisible.value = true
            return
        }

        if (key === 'copy') {
            message.success(`模板 ${record.code} 已复制`)
            return
        }

        if (key === 'delete') {
            Modal.confirm({
                title: '确认删除',
                content: `确定删除模板 ${record.name} 吗？`,
                okType: 'danger',
                onOk() {
                    tableData.value = tableData.value.filter(i => i.id !== record.id)
                    message.success('删除成功')
                }
            })
            return
        }

        // 状态变更
        Modal.confirm({
            title: '确认操作',
            content: `确定将模板 ${record.name} 的状态变更为 ${getStatusText(key)} 吗？`,
            onOk() {
                record.status = key
                message.success('状态变更成功')
            }
        })
    }

    /**
     * 获取历史版本时间线颜色
     */
    const getHistoryTimelineColor = (status: string) => {
        const colorMap: Record<string, string> = {
            DRAFT: 'gray',
            IN_APPROVAL: 'blue',
            APPROVED: 'green',
            OBSOLETE: 'red'
        }
        return colorMap[status] || 'gray'
    }

    const handleViewHistoryVersion = (record: any) => {
        router.push(`/inspection-model/insp-templates/view/${currentTemplateForHistory.value?.id}?version=${record.version}`)
    }

    /**
     * 恢复历史版本（创建新版本）
     */
    const handleRestoreVersion = (record: any) => {
        Modal.confirm({
            title: '恢复版本',
            content: `确定基于 ${record.version} 创建新版本吗？这将创建一个草稿状态的新版本。`,
            onOk() {
                message.success(`已基于 ${record.version} 创建新版本草稿`)
                historyModalVisible.value = false
            }
        })
    }

    const handleExport = () => {
        message.success('导出任务已开始')
    }

    onMounted(() => {
        loadData()
    })
</script>

<style scoped>
    .page-container {
        padding: 24px;
        background: #f0f2f5;
        min-height: calc(100vh - 64px);
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
</style>