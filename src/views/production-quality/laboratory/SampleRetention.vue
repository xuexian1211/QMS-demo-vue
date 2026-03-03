<template>
    <div class="sample-retention">
        <div class="page-title-bar">
            <h3 style="margin: 0">🏷️ 留样管理台账</h3>
            <span class="subtitle">监控样品库房存放状态，到期预警与处置管理</span>
        </div>

        <!-- 统计面板 -->
        <div class="stats-panel">
            <a-row :gutter="16">
                <a-col :span="6">
                    <a-statistic title="留样中" :value="stats.retainedCount" class="stat-card"
                        value-style="color: #1890ff">
                        <template #prefix><span class="stat-icon">📦</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="6">
                    <a-statistic title="即将到期 (7天内)" :value="stats.expiringSoonCount" class="stat-card"
                        value-style="color: #fa8c16">
                        <template #prefix><span class="stat-icon">⏰</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="6">
                    <a-statistic title="已超期" :value="stats.expiredCount" class="stat-card" value-style="color: #ff4d4f">
                        <template #prefix><span class="stat-icon">🚨</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="6">
                    <a-statistic title="已处置" :value="stats.disposedCount" class="stat-card"
                        value-style="color: #52c41a">
                        <template #prefix><span class="stat-icon">✅</span></template>
                    </a-statistic>
                </a-col>
            </a-row>
        </div>

        <!-- 搜索筛选 -->
        <div class="search-form">
            <a-form layout="inline" :model="queryParams">
                <a-form-item label="样品码">
                    <a-input v-model:value="queryParams.sampleCode" placeholder="SPL-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="物料编码">
                    <a-input v-model:value="queryParams.materialCode" placeholder="物料编码" allow-clear
                        style="width: 130px" />
                </a-form-item>
                <a-form-item label="库位">
                    <a-input v-model:value="queryParams.location" placeholder="库位编号" allow-clear style="width: 120px" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 120px">
                        <a-select-option value="RETAINED">留样中</a-select-option>
                        <a-select-option value="DISPOSED">已销毁</a-select-option>
                        <a-select-option value="RETURNED">已退还</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
            <a-space>
                <a-button type="primary" danger :disabled="selectedRowKeys.length === 0"
                    @click="handleBatchDispose('DISPOSED')">
                    批量销毁
                </a-button>
                <a-button :disabled="selectedRowKeys.length === 0" @click="handleBatchDispose('RETURNED')">
                    批量退还
                </a-button>
                <span v-if="selectedRowKeys.length > 0" style="color: #1890ff; margin-left: 8px">
                    已选 {{ selectedRowKeys.length }} 项
                </span>
            </a-space>
        </div>

        <!-- 数据表格 -->
        <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id"
            :row-selection="{ selectedRowKeys, onChange: onSelectChange }" :scroll="{ x: 1400 }" size="small"
            :pagination="{ showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true }">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'sampleCode'">
                    <span style="font-family: monospace; color: #1890ff; font-weight: bold">{{ record.sampleCode
                        }}</span>
                </template>

                <template v-if="column.key === 'retentionStatus'">
                    <a-tag :color="statusColorMap[record.retentionStatus]">{{ statusLabelMap[record.retentionStatus]
                        }}</a-tag>
                </template>

                <template v-if="column.key === 'retentionDate'">
                    <span
                        :style="{ color: isExpiringSoon(record.retentionDate) ? '#ff4d4f' : '#333', fontWeight: isExpiringSoon(record.retentionDate) ? 'bold' : 'normal' }">
                        {{ record.retentionDate }}
                    </span>
                    <a-tag v-if="isExpired(record.retentionDate) && record.retentionStatus === 'RETAINED'" color="red"
                        style="margin-left: 4px">已超期</a-tag>
                    <a-tag v-else-if="isExpiringSoon(record.retentionDate) && record.retentionStatus === 'RETAINED'"
                        color="orange" style="margin-left: 4px">即将到期</a-tag>
                </template>

                <template v-if="column.key === 'action'">
                    <a-space v-if="record.retentionStatus === 'RETAINED'">
                        <a-button type="link" size="small" @click="handleDispose(record, 'DISPOSED')"
                            style="color: #ff4d4f">销毁</a-button>
                        <a-button type="link" size="small" @click="handleDispose(record, 'RETURNED')">退还</a-button>
                    </a-space>
                    <span v-else style="color: #999">
                        {{ record.retentionStatus === 'DISPOSED' ? '已销毁' : '已退还' }}
                        <span v-if="record.disposedDate"> ({{ record.disposedDate }})</span>
                    </span>
                </template>
            </template>
        </a-table>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import type { LabSample, LabSampleRetentionStatus } from '@/types'
    import dayjs from 'dayjs'

    const loading = ref(false)
    const tableData = ref < LabSample[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const queryParams = reactive({ sampleCode: '', materialCode: '', location: '', status: undefined as string | undefined })

    const stats = reactive({ retainedCount: 0, expiringSoonCount: 0, expiredCount: 0, disposedCount: 0 })

    const statusColorMap: Record<string, string> = { RETAINED: 'blue', DISPOSED: 'default', RETURNED: 'green' }
    const statusLabelMap: Record<string, string> = { RETAINED: '留样中', DISPOSED: '已销毁', RETURNED: '已退还' }

    const columns = [
        { title: '样品码', dataIndex: 'sampleCode', key: 'sampleCode', width: 170, fixed: 'left' as const },
        { title: '关联任务', dataIndex: 'taskNo', key: 'taskNo', width: 170 },
        { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
        { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 130 },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 140 },
        { title: '库位', dataIndex: 'location', key: 'location', width: 100 },
        { title: '状态', key: 'retentionStatus', width: 100 },
        { title: '存入日期', dataIndex: 'depositDate', key: 'depositDate', width: 120 },
        { title: '预定销毁日', key: 'retentionDate', width: 180 },
        { title: '负责人', dataIndex: 'handler', key: 'handler', width: 80 },
        { title: '操作', key: 'action', width: 140, fixed: 'right' as const }
    ]

    const isExpiringSoon = (date: string) => {
        if (!date) return false
        const diff = dayjs(date).diff(dayjs(), 'day')
        return diff <= 7 && diff >= 0
    }
    const isExpired = (date: string) => {
        if (!date) return false
        return dayjs(date).isBefore(dayjs(), 'day')
    }

    const onSelectChange = (keys: string[]) => { selectedRowKeys.value = keys }

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            const now = dayjs()
            tableData.value = [
                {
                    id: 's1', sampleCode: 'SPL-20260302-0001', taskNo: 'LAB-20260303-0002', materialCode: 'M005',
                    materialName: '电镀铝板', batchNo: 'B20260303-02', location: 'A-3-05',
                    retentionStatus: 'RETAINED', depositDate: now.subtract(1, 'day').format('YYYY-MM-DD'),
                    retentionDate: now.add(89, 'day').format('YYYY-MM-DD'), handler: '王实验员',
                    createTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), creator: '101', updater: '101'
                },
                {
                    id: 's2', sampleCode: 'SPL-20260302-0002', taskNo: 'LAB-20260302-0004', materialCode: 'M003',
                    materialName: '合金钢管', batchNo: 'B20260302-05', location: 'B-1-12',
                    retentionStatus: 'RETAINED', depositDate: now.subtract(10, 'day').format('YYYY-MM-DD'),
                    retentionDate: now.add(5, 'day').format('YYYY-MM-DD'), handler: '李实验员',
                    createTime: now.subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'), creator: '102', updater: '102'
                },
                {
                    id: 's3', sampleCode: 'SPL-20260215-0010', taskNo: 'LAB-20260215-0003', materialCode: 'M008',
                    materialName: '橡胶密封圈', batchNo: 'B20260215-01', location: 'C-2-08',
                    retentionStatus: 'RETAINED', depositDate: now.subtract(20, 'day').format('YYYY-MM-DD'),
                    retentionDate: now.subtract(2, 'day').format('YYYY-MM-DD'), handler: '王实验员',
                    createTime: now.subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'), creator: '101', updater: '101'
                },
                {
                    id: 's4', sampleCode: 'SPL-20260110-0005', taskNo: 'LAB-20260110-0001', materialCode: 'M012',
                    materialName: '铝合金壳体', batchNo: 'B20260110-03', location: 'A-1-01',
                    retentionStatus: 'DISPOSED', depositDate: '2026-01-10',
                    retentionDate: '2026-04-10', handler: '李实验员', disposedDate: now.subtract(5, 'day').format('YYYY-MM-DD'),
                    disposer: '李实验员', disposeRemark: '到期正常销毁',
                    createTime: '2026-01-10 10:00:00', updateTime: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    creator: '102', updater: '102'
                }
            ] as LabSample[]

            // 统计
            const retained = tableData.value.filter(t => t.retentionStatus === 'RETAINED')
            stats.retainedCount = retained.length
            stats.expiringSoonCount = retained.filter(t => isExpiringSoon(t.retentionDate)).length
            stats.expiredCount = retained.filter(t => isExpired(t.retentionDate)).length
            stats.disposedCount = tableData.value.filter(t => t.retentionStatus !== 'RETAINED').length
            loading.value = false
        }, 400)
    }

    const handleSearch = () => loadData()
    const handleReset = () => {
        queryParams.sampleCode = ''; queryParams.materialCode = ''; queryParams.location = ''; queryParams.status = undefined
        loadData()
    }

    const handleDispose = (record: LabSample, type: LabSampleRetentionStatus) => {
        const label = type === 'DISPOSED' ? '销毁' : '退还'
        Modal.confirm({
            title: `确认${label}样品`,
            content: `确定要将样品 ${record.sampleCode} 标记为"${label}"吗？此操作不可撤回。`,
            okText: `确认${label}`,
            okType: type === 'DISPOSED' ? 'danger' : 'primary',
            onOk: () => {
                message.success(`样品 ${record.sampleCode} 已标记为"${label}"`)
                loadData()
            }
        })
    }

    const handleBatchDispose = (type: LabSampleRetentionStatus) => {
        const label = type === 'DISPOSED' ? '销毁' : '退还'
        Modal.confirm({
            title: `批量${label}`,
            content: `确定要将选中的 ${selectedRowKeys.value.length} 个样品标记为"${label}"吗？`,
            okText: `确认${label}`,
            okType: type === 'DISPOSED' ? 'danger' : 'primary',
            onOk: () => {
                message.success(`已批量标记 ${selectedRowKeys.value.length} 个样品为"${label}"`)
                selectedRowKeys.value = []
                loadData()
            }
        })
    }

    onMounted(() => loadData())
</script>

<style scoped>
    .sample-retention {
        padding: 16px;
        background: #f0f2f5;
        min-height: calc(100vh - 130px);
    }

    .page-title-bar {
        background: #fff;
        padding: 16px 20px;
        border-radius: 6px;
        margin-bottom: 16px;
        display: flex;
        align-items: baseline;
        gap: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .subtitle {
        color: #999;
        font-size: 13px;
    }

    .stats-panel {
        margin-bottom: 16px;
    }

    .stat-card {
        background: #fff;
        padding: 16px 20px;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
        font-size: 20px;
        margin-right: 4px;
    }

    .toolbar {
        background: #fff;
        padding: 12px 16px;
        border-radius: 6px 6px 0 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .search-form {
        background: #fff;
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;
    }

    .ant-table-wrapper {
        background: #fff;
        border-radius: 0 0 6px 6px;
    }
</style>