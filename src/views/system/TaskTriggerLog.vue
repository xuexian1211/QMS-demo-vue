<template>
    <div class="task-trigger-log">
        <!-- 工具栏 -->
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="handleRefresh" :loading="loading">
                    🔄 刷新
                </a-button>
                <a-button @click="navigateTo('/system/task-trigger-simulator')">
                    🚀 触发模拟器
                </a-button>
                <a-button @click="handleExport">📥 导出日志</a-button>
            </a-space>
        </div>

        <!-- 搜索表单 -->
        <div class="search-form">
            <a-form layout="inline" :model="searchParams">
                <a-form-item label="来源系统">
                    <a-select v-model:value="searchParams.sourceSystem" placeholder="全部" allow-clear
                        style="width: 150px;">
                        <a-select-option value="WMS">WMS 仓储</a-select-option>
                        <a-select-option value="MES">MES 制造</a-select-option>
                        <a-select-option value="ERP">金蝶 ERP</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="检验类型">
                    <a-select v-model:value="searchParams.inspectType" placeholder="全部" allow-clear
                        style="width: 140px;">
                        <a-select-option value="IQC">IQC</a-select-option>
                        <a-select-option value="IPQC">IPQC</a-select-option>
                        <a-select-option value="FQC">FQC</a-select-option>
                        <a-select-option value="OQC">OQC</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="判定状态">
                    <a-select v-model:value="searchParams.judgmentStatus" placeholder="全部" allow-clear
                        style="width: 130px;">
                        <a-select-option value="SUCCESS">成功</a-select-option>
                        <a-select-option value="IGNORED">忽略</a-select-option>
                        <a-select-option value="FAILED">失败</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="时间范围">
                    <a-range-picker v-model:value="searchParams.dateRange" style="width: 260px;" />
                </a-form-item>
                <a-form-item label="关键词">
                    <a-input v-model:value="searchParams.keyword" placeholder="单据号/物料/批次" allow-clear
                        style="width: 180px;" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">搜索</a-button>
                        <a-button @click="handleResetSearch">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-cards">
            <a-row :gutter="16">
                <a-col :span="6">
                    <a-card class="stat-card stat-total" size="small">
                        <a-statistic title="📊 总请求数" :value="stats.total" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-success" size="small">
                        <a-statistic title="✅ 成功生成" :value="stats.success" :value-style="{ color: '#52c41a' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-ignored" size="small">
                        <a-statistic title="⚠️ 已忽略" :value="stats.ignored" :value-style="{ color: '#faad14' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-failed" size="small">
                        <a-statistic title="❌ 匹配失败" :value="stats.failed" :value-style="{ color: '#ff4d4f' }" />
                    </a-card>
                </a-col>
            </a-row>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
            <a-table :columns="columns" :data-source="filteredData" :loading="loading" :pagination="pagination"
                row-key="id" :scroll="{ x: 1600 }" @change="handleTableChange" size="middle">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'requestTime'">
                        <span>{{ formatTime(record.requestTime) }}</span>
                    </template>
                    <template v-else-if="column.key === 'sourceSystem'">
                        <a-tag :color="sourceSystemColors[record.sourceSystem]">
                            {{ sourceSystemLabels[record.sourceSystem] }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'inspectType'">
                        <a-tag :color="inspTypeColors[record.inspectType]">
                            {{ record.inspectType }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'judgmentStatus'">
                        <a-badge :status="statusBadge[record.judgmentStatus]"
                            :text="statusLabels[record.judgmentStatus]" />
                    </template>
                    <template v-else-if="column.key === 'matchedPlanCode'">
                        <a-tag v-if="record.matchedPlanCode" color="blue">{{ record.matchedPlanCode }}</a-tag>
                        <span v-else class="empty-value">-</span>
                    </template>
                    <template v-else-if="column.key === 'generatedTaskNo'">
                        <a-tag v-if="record.generatedTaskNo" color="green">{{ record.generatedTaskNo }}</a-tag>
                        <span v-else class="empty-value">-</span>
                    </template>
                    <template v-else-if="column.key === 'detailReason'">
                        <a-tooltip :title="record.detailReason" placement="topLeft">
                            <span class="truncate-text">{{ record.detailReason }}</span>
                        </a-tooltip>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
                            <a-button type="link" size="small" @click="replayTrigger(record)">重放</a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- 详情抽屉 -->
        <a-drawer v-model:open="detailDrawerVisible" title="触发日志详情" :width="640">
            <template v-if="selectedLog">
                <a-descriptions :column="2" bordered size="small">
                    <a-descriptions-item label="请求 ID" :span="2">
                        <code>{{ selectedLog.requestId }}</code>
                    </a-descriptions-item>
                    <a-descriptions-item label="请求时间">{{ formatTime(selectedLog.requestTime) }}</a-descriptions-item>
                    <a-descriptions-item label="来源系统">
                        <a-tag :color="sourceSystemColors[selectedLog.sourceSystem]">{{
                            sourceSystemLabels[selectedLog.sourceSystem] }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="来源单据号">{{ selectedLog.sourceBillNo }}</a-descriptions-item>
                    <a-descriptions-item label="单据类型">{{ selectedLog.sourceBillType }}</a-descriptions-item>
                    <a-descriptions-item label="检验类型">
                        <a-tag :color="inspTypeColors[selectedLog.inspectType]">{{ selectedLog.inspectType }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="物料编码">{{ selectedLog.materialCode }}</a-descriptions-item>
                    <a-descriptions-item label="批次号">{{ selectedLog.batchNo }}</a-descriptions-item>
                    <a-descriptions-item label="组织 ID">{{ selectedLog.orgId }}</a-descriptions-item>
                    <a-descriptions-item label="判定状态" :span="2">
                        <a-badge :status="statusBadge[selectedLog.judgmentStatus]"
                            :text="statusLabels[selectedLog.judgmentStatus]" />
                    </a-descriptions-item>
                    <a-descriptions-item v-if="selectedLog.matchedPlanCode" label="匹配计划" :span="2">
                        <a-tag color="blue">{{ selectedLog.matchedPlanCode }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item v-if="selectedLog.generatedTaskNo" label="生成任务" :span="2">
                        <a-tag color="green">{{ selectedLog.generatedTaskNo }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="详细原因" :span="2">
                        <a-alert
                            :type="selectedLog.judgmentStatus === 'SUCCESS' ? 'success' : selectedLog.judgmentStatus === 'IGNORED' ? 'warning' : 'error'"
                            :message="selectedLog.detailReason" show-icon />
                    </a-descriptions-item>
                </a-descriptions>
                <a-divider>原始请求报文</a-divider>
                <div class="raw-payload">
                    <pre>{{ selectedLog.rawPayload }}</pre>
                </div>
            </template>
        </a-drawer>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import type { TriggerLogRecord, TriggerJudgmentStatus, InspContextType } from '@/types'
    import dayjs from 'dayjs'

    const router = useRouter()

    const navigateTo = (path: string) => {
        router.push(path)
    }

    // 搜索参数
    const searchParams = reactive({
        sourceSystem: undefined as string | undefined,
        inspectType: undefined as string | undefined,
        judgmentStatus: undefined as string | undefined,
        dateRange: null as any,
        keyword: '',
    })

    // 加载状态
    const loading = ref(false)

    // 分页
    const pagination = reactive({
        current: 1,
        pageSize: 15,
        total: 0,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 条`,
    })

    // 统计
    const stats = reactive({
        total: 0,
        success: 0,
        ignored: 0,
        failed: 0,
    })

    // 详情面板
    const detailDrawerVisible = ref(false)
    const selectedLog = ref < TriggerLogRecord | null > (null)

    // 颜色与标签映射
    const sourceSystemColors: Record<string, string> = {
        WMS: 'cyan',
        MES: 'orange',
        ERP: 'purple',
    }

    const sourceSystemLabels: Record<string, string> = {
        WMS: 'WMS 仓储',
        MES: 'MES 制造',
        ERP: '金蝶 ERP',
    }

    const inspTypeColors: Record<string, string> = {
        IQC: 'blue',
        IPQC: 'orange',
        FQC: 'green',
        OQC: 'purple',
    }

    const statusLabels: Record<string, string> = {
        SUCCESS: '成功生成',
        IGNORED: '已忽略',
        FAILED: '匹配失败',
    }

    const statusBadge: Record<string, 'success' | 'warning' | 'error'> = {
        SUCCESS: 'success',
        IGNORED: 'warning',
        FAILED: 'error',
    }

    // 表格列定义
    const columns = [
        { title: '请求时间', key: 'requestTime', dataIndex: 'requestTime', width: 170, sorter: true },
        { title: '来源系统', key: 'sourceSystem', dataIndex: 'sourceSystem', width: 120 },
        { title: '单据号', key: 'sourceBillNo', dataIndex: 'sourceBillNo', width: 180 },
        { title: '检验类型', key: 'inspectType', dataIndex: 'inspectType', width: 100 },
        { title: '物料编码', key: 'materialCode', dataIndex: 'materialCode', width: 100 },
        { title: '批次号', key: 'batchNo', dataIndex: 'batchNo', width: 140 },
        { title: '判定状态', key: 'judgmentStatus', dataIndex: 'judgmentStatus', width: 120 },
        { title: '匹配计划', key: 'matchedPlanCode', dataIndex: 'matchedPlanCode', width: 160 },
        { title: '生成任务', key: 'generatedTaskNo', dataIndex: 'generatedTaskNo', width: 160 },
        { title: '详细原因', key: 'detailReason', dataIndex: 'detailReason', ellipsis: true },
        { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
    ]

    // 模拟日志数据
    const mockLogs: TriggerLogRecord[] = [
        {
            id: 'log-001', createTime: '2026-03-02T09:15:00', updateTime: '2026-03-02T09:15:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260302-001', requestTime: '2026-03-02T09:15:00', sourceSystem: 'WMS', sourceBillNo: 'WMS-REC-20260302-001',
            sourceBillType: 'PUR_RECEIVE', inspectType: 'IQC' as InspContextType, materialCode: 'M002', batchNo: 'B20260302-01', orgId: 'HFC_001',
            judgmentStatus: 'SUCCESS' as TriggerJudgmentStatus, matchedPlanCode: 'PLN-HFC-IQC-001', generatedTaskNo: 'TSK-IQC-20260302-001',
            detailReason: '成功匹配计划 PLN-HFC-IQC-001，已生成 IQC 检验任务 TSK-IQC-20260302-001，分配给检验员张工。',
            rawPayload: JSON.stringify({ orgId: 'HFC_001', inspectType: 'IQC', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260302-001', materialCode: 'M002', batchNo: 'B20260302-01', extContext: { supplier: 'S01' } }, null, 2),
        },
        {
            id: 'log-002', createTime: '2026-03-02T09:30:00', updateTime: '2026-03-02T09:30:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260302-002', requestTime: '2026-03-02T09:30:00', sourceSystem: 'MES', sourceBillNo: 'MES-ORD-20260302-001',
            sourceBillType: 'PROD_ORDER', inspectType: 'IPQC' as InspContextType, materialCode: 'M003', batchNo: 'B20260302-02', orgId: 'HFC_001',
            judgmentStatus: 'SUCCESS' as TriggerJudgmentStatus, matchedPlanCode: 'PLN-HFC-IPQC-001', generatedTaskNo: 'TSK-IPQC-20260302-001',
            detailReason: '成功匹配计划 PLN-HFC-IPQC-001，已生成 IPQC 首件检验任务，分配给检验员李工。',
            rawPayload: JSON.stringify({ orgId: 'HFC_001', inspectType: 'IPQC', sourceBillType: 'PROD_ORDER', sourceBillNo: 'MES-ORD-20260302-001', materialCode: 'M003', batchNo: 'B20260302-02', extContext: { line: 'A01' } }, null, 2),
        },
        {
            id: 'log-003', createTime: '2026-03-02T10:00:00', updateTime: '2026-03-02T10:00:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260302-003', requestTime: '2026-03-02T10:00:00', sourceSystem: 'WMS', sourceBillNo: 'WMS-REC-20260302-002',
            sourceBillType: 'PUR_RECEIVE', inspectType: 'IQC' as InspContextType, materialCode: 'M099', batchNo: 'B20260302-03', orgId: 'HFC_001',
            judgmentStatus: 'IGNORED' as TriggerJudgmentStatus,
            detailReason: '物料 M099 未在任何检验计划中配置，判定为免检物料，无需生成检验任务。',
            rawPayload: JSON.stringify({ orgId: 'HFC_001', inspectType: 'IQC', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260302-002', materialCode: 'M099', batchNo: 'B20260302-03' }, null, 2),
        },
        {
            id: 'log-004', createTime: '2026-03-02T10:15:00', updateTime: '2026-03-02T10:15:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260302-004', requestTime: '2026-03-02T10:15:00', sourceSystem: 'ERP', sourceBillNo: 'ERP-DEL-20260302-001',
            sourceBillType: 'SALES_DELIVER', inspectType: 'OQC' as InspContextType, materialCode: 'M005', batchNo: 'B20260302-04', orgId: 'SH_002',
            judgmentStatus: 'IGNORED' as TriggerJudgmentStatus,
            detailReason: '当前批次为第 4 批，不满足计划 PLN-SH-OQC-001 中"前 3 批必须检验"的触发策略，判定为 Ignored。',
            rawPayload: JSON.stringify({ orgId: 'SH_002', inspectType: 'OQC', sourceBillType: 'SALES_DELIVER', sourceBillNo: 'ERP-DEL-20260302-001', materialCode: 'M005', batchNo: 'B20260302-04', extContext: { customer: 'C01' } }, null, 2),
        },
        {
            id: 'log-005', createTime: '2026-03-02T10:30:00', updateTime: '2026-03-02T10:30:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260302-005', requestTime: '2026-03-02T10:30:00', sourceSystem: 'WMS', sourceBillNo: 'WMS-INB-20260302-001',
            sourceBillType: 'PROD_INBOUND', inspectType: 'FQC' as InspContextType, materialCode: 'M004', batchNo: 'B20260302-05', orgId: 'HFC_001',
            judgmentStatus: 'SUCCESS' as TriggerJudgmentStatus, matchedPlanCode: 'PLN-HFC-FQC-001', generatedTaskNo: 'TSK-FQC-20260302-001',
            detailReason: '成功匹配计划 PLN-HFC-FQC-001，已生成 FQC 成品检验任务 TSK-FQC-20260302-001。',
            rawPayload: JSON.stringify({ orgId: 'HFC_001', inspectType: 'FQC', sourceBillType: 'PROD_INBOUND', sourceBillNo: 'WMS-INB-20260302-001', materialCode: 'M004', batchNo: 'B20260302-05' }, null, 2),
        },
        {
            id: 'log-006', createTime: '2026-03-02T10:45:00', updateTime: '2026-03-02T10:45:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260302-006', requestTime: '2026-03-02T10:45:00', sourceSystem: 'MES', sourceBillNo: 'MES-ORD-20260302-002',
            sourceBillType: 'PROD_ORDER', inspectType: 'IPQC' as InspContextType, materialCode: 'M008', batchNo: 'B20260302-06', orgId: 'GZ_003',
            judgmentStatus: 'FAILED' as TriggerJudgmentStatus,
            detailReason: '在组织 GZ_003 下找到匹配计划，但物料 M008 的检验规格（平面度公差）未配置，无法生成检验标准。请联系质量工程师补充物料检验规格。',
            rawPayload: JSON.stringify({ orgId: 'GZ_003', inspectType: 'IPQC', sourceBillType: 'PROD_ORDER', sourceBillNo: 'MES-ORD-20260302-002', materialCode: 'M008', batchNo: 'B20260302-06', extContext: { line: 'B02' } }, null, 2),
        },
        {
            id: 'log-007', createTime: '2026-03-01T14:00:00', updateTime: '2026-03-01T14:00:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260301-001', requestTime: '2026-03-01T14:00:00', sourceSystem: 'WMS', sourceBillNo: 'WMS-REC-20260301-001',
            sourceBillType: 'PUR_RECEIVE', inspectType: 'IQC' as InspContextType, materialCode: 'M002', batchNo: 'B20260301-01', orgId: 'HFC_001',
            judgmentStatus: 'SUCCESS' as TriggerJudgmentStatus, matchedPlanCode: 'PLN-HFC-IQC-002', generatedTaskNo: 'TSK-IQC-20260301-001',
            detailReason: '新供应商 S02 第 1 批来料，触发全检计划 PLN-HFC-IQC-002（前3批全检策略），已生成全检任务。',
            rawPayload: JSON.stringify({ orgId: 'HFC_001', inspectType: 'IQC', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260301-001', materialCode: 'M002', batchNo: 'B20260301-01', extContext: { supplier: 'S02' } }, null, 2),
        },
        {
            id: 'log-008', createTime: '2026-03-01T16:00:00', updateTime: '2026-03-01T16:00:00', creator: 'system', updater: 'system',
            requestId: 'REQ-20260301-002', requestTime: '2026-03-01T16:00:00', sourceSystem: 'ERP', sourceBillNo: 'ERP-DEL-20260301-001',
            sourceBillType: 'SALES_DELIVER', inspectType: 'OQC' as InspContextType, materialCode: 'M005', batchNo: 'B20260301-02', orgId: 'SH_002',
            judgmentStatus: 'SUCCESS' as TriggerJudgmentStatus, matchedPlanCode: 'PLN-SH-OQC-001', generatedTaskNo: 'TSK-OQC-20260301-001',
            detailReason: '上海工厂出货检验，第 2 批（满足前3批策略），已生成 OQC 检验任务。',
            rawPayload: JSON.stringify({ orgId: 'SH_002', inspectType: 'OQC', sourceBillType: 'SALES_DELIVER', sourceBillNo: 'ERP-DEL-20260301-001', materialCode: 'M005', batchNo: 'B20260301-02', extContext: { customer: 'C01' } }, null, 2),
        },
    ]

    const logData = ref < TriggerLogRecord[] > ([])

    // 过滤后数据
    const filteredData = computed(() => {
        let data = [...logData.value]
        if (searchParams.sourceSystem) {
            data = data.filter(d => d.sourceSystem === searchParams.sourceSystem)
        }
        if (searchParams.inspectType) {
            data = data.filter(d => d.inspectType === searchParams.inspectType)
        }
        if (searchParams.judgmentStatus) {
            data = data.filter(d => d.judgmentStatus === searchParams.judgmentStatus)
        }
        if (searchParams.keyword) {
            const kw = searchParams.keyword.toLowerCase()
            data = data.filter(d =>
                d.sourceBillNo.toLowerCase().includes(kw) ||
                d.materialCode.toLowerCase().includes(kw) ||
                d.batchNo.toLowerCase().includes(kw)
            )
        }
        return data
    })

    /**
     * 格式化时间
     */
    const formatTime = (time: string) => {
        return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }

    /**
     * 加载数据
     */
    const loadData = async () => {
        loading.value = true
        // 模拟接口延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        logData.value = [...mockLogs].sort((a, b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime())
        // 统计
        stats.total = logData.value.length
        stats.success = logData.value.filter(d => d.judgmentStatus === 'SUCCESS').length
        stats.ignored = logData.value.filter(d => d.judgmentStatus === 'IGNORED').length
        stats.failed = logData.value.filter(d => d.judgmentStatus === 'FAILED').length
        pagination.total = logData.value.length
        loading.value = false
    }

    const handleRefresh = () => {
        loadData()
    }

    const handleSearch = () => {
        pagination.current = 1
    }

    const handleResetSearch = () => {
        searchParams.sourceSystem = undefined
        searchParams.inspectType = undefined
        searchParams.judgmentStatus = undefined
        searchParams.dateRange = null
        searchParams.keyword = ''
        pagination.current = 1
    }

    const handleTableChange = (pag: any) => {
        pagination.current = pag.current
        pagination.pageSize = pag.pageSize
    }

    const handleExport = () => {
        message.info('日志导出功能正在开发中...')
    }

    const showDetail = (record: TriggerLogRecord) => {
        selectedLog.value = record
        detailDrawerVisible.value = true
    }

    const replayTrigger = (record: TriggerLogRecord) => {
        // 跳转到模拟器并带上报文
        router.push({
            path: '/system/task-trigger-simulator',
            query: { payload: record.rawPayload },
        })
    }

    onMounted(() => {
        loadData()
    })
</script>

<style scoped>
    .task-trigger-log {
        padding: 16px;
        background: #f0f2f5;
        min-height: calc(100vh - 140px);
    }

    .toolbar {
        margin-bottom: 16px;
        padding: 12px 16px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .search-form {
        margin-bottom: 16px;
        padding: 16px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .stats-cards {
        margin-bottom: 16px;
    }

    .stat-card {
        border-radius: 4px;
        text-align: center;
    }

    .stat-total {
        border-top: 3px solid #1890ff;
    }

    .stat-success {
        border-top: 3px solid #52c41a;
    }

    .stat-ignored {
        border-top: 3px solid #faad14;
    }

    .stat-failed {
        border-top: 3px solid #ff4d4f;
    }

    .table-container {
        padding: 16px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .empty-value {
        color: #d9d9d9;
    }

    .truncate-text {
        display: inline-block;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .raw-payload {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 16px;
        border-radius: 4px;
        overflow: auto;
        max-height: 300px;
    }

    .raw-payload pre {
        margin: 0;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 13px;
        white-space: pre-wrap;
        word-break: break-all;
    }
</style>