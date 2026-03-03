<template>
    <div class="lab-execution-list">
        <!-- 页面标题 -->
        <div class="page-title-bar">
            <h3 style="margin: 0">🔬 实验室检测执行</h3>
            <span class="subtitle">当前待检测及检测中任务列表，点击任务进入检测数据录入页面</span>
        </div>

        <!-- 搜索筛选 -->
        <div class="search-form">
            <a-form layout="inline" :model="queryParams">
                <a-form-item label="任务编号">
                    <a-input v-model:value="queryParams.taskNo" placeholder="LAB-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="样品码">
                    <a-input v-model:value="queryParams.sampleCode" placeholder="SPL-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 140px">
                        <a-select-option value="PENDING_TEST">待检测</a-select-option>
                        <a-select-option value="IN_PROGRESS">检测中</a-select-option>
                        <a-select-option value="OUTSOURCING">委外中</a-select-option>
                        <a-select-option value="COMPLETED">已完成</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="处理方式">
                    <a-select v-model:value="queryParams.processType" placeholder="全部" allow-clear style="width: 120px">
                        <a-select-option value="INTERNAL">内部检测</a-select-option>
                        <a-select-option value="EXTERNAL">委外检测</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="经办人">
                    <a-input v-model:value="queryParams.keyword" placeholder="经办人姓名" allow-clear style="width: 120px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </div>

        <!-- 数据表格 -->
        <a-table :columns="columns" :data-source="tableData" :loading="loading" :pagination="pagination" row-key="id"
            :scroll="{ x: 1600 }" @change="handleTableChange" size="small">
            <template #bodyCell="{ column, record }">
                <!-- 任务编号 -->
                <template v-if="column.key === 'taskNo'">
                    <a @click="handleExecute(record)">{{ record.taskNo }}</a>
                </template>

                <!-- 状态 -->
                <template v-if="column.key === 'status'">
                    <a-badge :status="statusBadgeMap[record.status]" :text="statusLabelMap[record.status]" />
                    <a-tag v-if="record.isOverdue" color="red" style="margin-left: 4px">超时</a-tag>
                </template>

                <!-- 优先级 -->
                <template v-if="column.key === 'priority'">
                    <a-tag :color="priorityColorMap[record.priority]">{{ priorityLabelMap[record.priority] }}</a-tag>
                    <a-tag v-if="record.isUrgent" color="red">加急</a-tag>
                </template>

                <!-- 处理方式 -->
                <template v-if="column.key === 'processType'">
                    <a-tag v-if="record.processType" :color="record.processType === 'INTERNAL' ? 'blue' : 'purple'">
                        {{ record.processType === 'INTERNAL' ? '内部检测' : '委外检测' }}
                    </a-tag>
                    <span v-else style="color: #999">待分配</span>
                </template>

                <!-- 样品码 -->
                <template v-if="column.key === 'sampleCode'">
                    <span v-if="record.sampleCode" style="font-family: monospace; color: #1890ff">{{ record.sampleCode
                        }}</span>
                    <span v-else style="color: #999">-</span>
                </template>

                <!-- 来源 -->
                <template v-if="column.key === 'sourceType'">
                    <a-tag :color="sourceTypeColorMap[record.sourceType]">{{ sourceTypeLabelMap[record.sourceType]
                        }}</a-tag>
                </template>

                <!-- 操作列 -->
                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button v-if="record.status === 'PENDING_TEST' || record.status === 'IN_PROGRESS'"
                            type="primary" size="small" @click="handleExecute(record)">
                            录入检测
                        </a-button>
                        <a-button v-if="record.status === 'OUTSOURCING'" size="small" @click="handleExecute(record)"
                            style="color: #722ed1; border-color: #722ed1">
                            录入报告
                        </a-button>
                        <a-button v-if="record.status === 'COMPLETED'" size="small" @click="handleView(record)">
                            查看报告
                        </a-button>
                        <a-button type="link" size="small" @click="handleView(record)">详情</a-button>
                    </a-space>
                </template>
            </template>
        </a-table>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import type { LabTask, LabTaskQueryParams, LabTaskStatus } from '@/types'
    import dayjs from 'dayjs'

    const router = useRouter()
    const loading = ref(false)
    const tableData = ref < LabTask[] > ([])

    // 查询参数——默认只显示检测相关状态的任务（排除 PENDING_RECEIVE）
    const queryParams = reactive < LabTaskQueryParams > ({
        page: 1,
        pageSize: 20
    })

    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条`
    })

    // 映射
    const statusBadgeMap: Record<string, string> = {
        PENDING_TEST: 'default', IN_PROGRESS: 'processing', OUTSOURCING: 'purple', COMPLETED: 'success', CANCELLED: 'error'
    }
    const statusLabelMap: Record<string, string> = {
        PENDING_TEST: '待检测', IN_PROGRESS: '检测中', OUTSOURCING: '委外中', COMPLETED: '已完成', CANCELLED: '已取消'
    }
    const priorityColorMap: Record<string, string> = { NORMAL: 'default', URGENT: 'orange', CRITICAL: 'red' }
    const priorityLabelMap: Record<string, string> = { NORMAL: '常规', URGENT: '加急', CRITICAL: '紧急' }
    const sourceTypeLabelMap: Record<string, string> = {
        IQC: 'IQC', IPQC: 'IPQC', FQC: 'FQC', OQC: 'OQC',
        MANUAL_8D: '8D委托', MANUAL_APQP: 'APQP', MANUAL_OTHER: '其他'
    }
    const sourceTypeColorMap: Record<string, string> = {
        IQC: 'blue', IPQC: 'cyan', FQC: 'green', OQC: 'orange',
        MANUAL_8D: 'red', MANUAL_APQP: 'purple', MANUAL_OTHER: 'default'
    }

    // 表格列
    const columns = [
        { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo', width: 170, fixed: 'left' as const },
        { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
        { title: '优先级', dataIndex: 'priority', key: 'priority', width: 120 },
        { title: '来源', dataIndex: 'sourceType', key: 'sourceType', width: 90 },
        { title: '处理方式', dataIndex: 'processType', key: 'processType', width: 100 },
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 140 },
        { title: '样品码', dataIndex: 'sampleCode', key: 'sampleCode', width: 170 },
        { title: '经办人', dataIndex: 'operatorName', key: 'operatorName', width: 90 },
        { title: '接收时间', dataIndex: 'receivedAt', key: 'receivedAt', width: 160 },
        { title: '操作', key: 'action', width: 220, fixed: 'right' as const }
    ]

    /** 加载数据（仅显示已接样后的任务，排除 PENDING_RECEIVE） */
    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            const now = dayjs()
            // NOTE: 模拟数据，后续对接后端 API。此列表排除 PENDING_RECEIVE 状态
            const allData: LabTask[] = [
                {
                    id: '2', taskNo: 'LAB-20260303-0002', orgId: 'HFC_001', sourceType: 'IQC', sourceTaskNo: 'TSK-IQC-20260303002',
                    sourceBillNo: 'WMS-REC-20260303', inspItemCode: 'ITEM-HF-SALT', inspItemName: '盐雾测试',
                    materialCode: 'M005', materialName: '电镀铝板', batchNo: 'B20260303-02',
                    status: 'IN_PROGRESS', processType: 'INTERNAL', priority: 'NORMAL', isUrgent: false, isOverdue: false,
                    sampleCode: 'SPL-20260302-0001', receivedAt: now.subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    operatorId: '101', operatorName: '王实验员',
                    createTime: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    creator: 'system', updater: '101'
                },
                {
                    id: '5', taskNo: 'LAB-20260303-0003', orgId: 'HFC_001', sourceType: 'IPQC', sourceTaskNo: 'TSK-IPQC-20260303001',
                    sourceBillNo: 'PROD-ORD-20260303', inspItemCode: 'ITEM-DIM-001', inspItemName: '三坐标尺寸测量',
                    materialCode: 'M001', materialName: '壳体毛坯件', batchNo: 'B20260303-P01',
                    status: 'PENDING_TEST', processType: 'INTERNAL', priority: 'NORMAL', isUrgent: false, isOverdue: false,
                    sampleCode: 'SPL-20260303-0002', receivedAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    operatorId: '101', operatorName: '王实验员',
                    createTime: now.subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    creator: 'system', updater: '101'
                },
                {
                    id: '3', taskNo: 'LAB-20260302-0005', orgId: 'HFC_001', sourceType: 'MANUAL_8D',
                    sourceBillNo: '8D-2026-0042', inspItemCode: 'ITEM-ROHS', inspItemName: 'ROHS有害物质检测',
                    materialCode: 'M010', materialName: '镀镍螺栓', batchNo: 'B20260228-10',
                    status: 'OUTSOURCING', processType: 'EXTERNAL', priority: 'CRITICAL', isUrgent: true, isOverdue: true,
                    sampleCode: 'SPL-20260302-0003', receivedAt: now.subtract(30, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    externalOrgName: 'SGS通标标准技术服务',
                    createTime: now.subtract(32, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(28, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    creator: 'SQE-张', updater: 'SQE-张'
                },
                {
                    id: '4', taskNo: 'LAB-20260302-0004', orgId: 'HFC_001', sourceType: 'IQC', sourceTaskNo: 'TSK-IQC-20260302003',
                    sourceBillNo: 'WMS-REC-20260302', inspItemCode: 'ITEM-G-TENSILE', inspItemName: '拉伸强度测试',
                    materialCode: 'M003', materialName: '合金钢管', batchNo: 'B20260302-05',
                    status: 'COMPLETED', processType: 'INTERNAL', priority: 'NORMAL', isUrgent: false, isOverdue: false,
                    sampleCode: 'SPL-20260302-0002', receivedAt: now.subtract(20, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    completedAt: now.subtract(10, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    operatorId: '102', operatorName: '李实验员',
                    reviewStatus: 'APPROVED', reviewerName: '实验室主任',
                    createTime: now.subtract(22, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(10, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    creator: 'system', updater: '102'
                }
            ]

            // 应用筛选
            let filtered = allData
            if (queryParams.status) {
                filtered = filtered.filter(t => t.status === queryParams.status)
            }
            if (queryParams.processType) {
                filtered = filtered.filter(t => t.processType === queryParams.processType)
            }
            if (queryParams.taskNo) {
                filtered = filtered.filter(t => t.taskNo.includes(queryParams.taskNo!))
            }
            if (queryParams.sampleCode) {
                filtered = filtered.filter(t => t.sampleCode?.includes(queryParams.sampleCode!) ?? false)
            }
            if (queryParams.keyword) {
                filtered = filtered.filter(t => t.operatorName?.includes(queryParams.keyword!) ?? false)
            }

            tableData.value = filtered
            pagination.total = filtered.length
            loading.value = false
        }, 400)
    }

    const handleSearch = () => {
        pagination.current = 1
        loadData()
    }

    const handleReset = () => {
        Object.assign(queryParams, {
            taskNo: undefined,
            sampleCode: undefined,
            status: undefined,
            processType: undefined,
            keyword: undefined,
            page: 1,
            pageSize: 20
        })
        pagination.current = 1
        loadData()
    }

    const handleTableChange = (pag: any) => {
        pagination.current = pag.current
        pagination.pageSize = pag.pageSize
        loadData()
    }

    /** 进入检测执行页 */
    const handleExecute = (record: LabTask) => {
        router.push(`/production-quality/laboratory/lab-task-execution/${record.id}`)
    }

    /** 查看详情（只读模式） */
    const handleView = (record: LabTask) => {
        router.push(`/production-quality/laboratory/lab-task-execution/${record.id}?mode=view`)
    }

    onMounted(() => {
        loadData()
    })
</script>

<style scoped>
    .lab-execution-list {
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

    .search-form {
        background: #fff;
        padding: 16px;
        border-radius: 6px 6px 0 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .ant-table-wrapper {
        background: #fff;
        border-radius: 0 0 6px 6px;
    }
</style>