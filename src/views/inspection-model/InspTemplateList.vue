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
                <a-form-item label="模板编码">
                    <a-input v-model:value="queryParam.code" placeholder="请输入" allow-clear />
                </a-form-item>
                <a-form-item label="模板名称">
                    <a-input v-model:value="queryParam.name" placeholder="请输入" allow-clear />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="queryParam.status" style="width: 120px" allow-clear placeholder="请选择">
                        <a-select-option value="Draft">草稿</a-select-option>
                        <a-select-option value="Pending">审批中</a-select-option>
                        <a-select-option value="Approved">已批准</a-select-option>
                        <a-select-option value="Obsolete">作废</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="版本">
                    <a-input v-model:value="queryParam.version" placeholder="如：V1.0" allow-clear style="width: 100px" />
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
                                :disabled="record.status !== 'Draft'">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-dropdown>
                                <a-button type="link" size="small">
                                    更多
                                    <DownOutlined />
                                </a-button>
                                <template #overlay>
                                    <a-menu @click="(e) => handleStatusChange(record, e.key)">
                                        <a-menu-item key="Pending"
                                            :disabled="record.status !== 'Draft'">提交审批</a-menu-item>
                                        <a-menu-item key="Approved"
                                            :disabled="record.status !== 'Pending'">审批通过</a-menu-item>
                                        <a-menu-item key="Obsolete"
                                            :disabled="record.status === 'Obsolete'">作废</a-menu-item>
                                        <a-menu-divider />
                                        <a-menu-item key="history">查看历史版本</a-menu-item>
                                        <a-menu-item key="copy">复制模板</a-menu-item>
                                        <a-menu-divider />
                                        <a-menu-item key="delete" danger
                                            :disabled="record.status !== 'Draft'">删除</a-menu-item>
                                    </a-menu>
                                </template>
                            </a-dropdown>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- 历史版本弹窗 -->
        <a-modal v-model:visible="historyModalVisible" title="历史版本" width="700px" :footer="null">
            <a-table :columns="historyColumns" :data-source="historyData" :pagination="false" size="small">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-button type="link" size="small" @click="handleViewHistoryVersion(record)">查看</a-button>
                    </template>
                </template>
            </a-table>
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

    const queryParam = reactive({
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
        { title: '模板编码', dataIndex: 'code', key: 'code', width: 150 },
        { title: '模板名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '检验类型', dataIndex: 'inspType', key: 'inspType', width: 100 },
        { title: '明细数', dataIndex: 'detailCount', key: 'detailCount', width: 80 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
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
            Draft: 'default',
            Pending: 'processing',
            Approved: 'success',
            Obsolete: 'error'
        }
        return colorMap[status] || 'default'
    }

    const getStatusText = (status: string) => {
        const textMap: Record<string, string> = {
            Draft: '草稿',
            Pending: '审批中',
            Approved: '已批准',
            Obsolete: '作废'
        }
        return textMap[status] || status
    }

    // --- 数据加载 ---
    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            let data = [
                { id: '1', code: 'TPL-IQC-001', name: 'IQC原材料检验模板', version: 'V1.0', status: 'Approved', inspType: 'IQC', detailCount: 5, updateTime: '2026-01-10 10:00' },
                { id: '2', code: 'TPL-IPQC-001', name: 'IPQC过程检验模板', version: 'V2.0', status: 'Draft', inspType: 'IPQC', detailCount: 8, updateTime: '2026-01-12 14:30' },
                { id: '3', code: 'TPL-FQC-001', name: 'FQC成品检验模板', version: 'V1.0', status: 'Pending', inspType: 'FQC', detailCount: 10, updateTime: '2026-01-11 09:15' },
                { id: '4', code: 'TPL-OQC-001', name: 'OQC出货检验模板', version: 'V1.0', status: 'Obsolete', inspType: 'OQC', detailCount: 6, updateTime: '2025-12-20 16:00' },
            ]

            // 过滤
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
            // 显示历史版本
            historyData.value = [
                { id: 'h1', version: 'V1.0', status: 'Approved', updateTime: '2025-12-01 10:00', updater: '张三' },
                { id: 'h2', version: 'V0.9', status: 'Obsolete', updateTime: '2025-11-15 14:00', updater: '李四' },
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

    const handleViewHistoryVersion = (record: any) => {
        message.info(`查看历史版本: ${record.version}`)
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
</style>