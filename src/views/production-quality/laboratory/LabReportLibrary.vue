<template>
    <div class="lab-report-library">
        <div class="page-title-bar">
            <h3 style="margin: 0">📄 检测/试验报告库</h3>
            <span class="subtitle">所有历史报告的集中查询、在线预览与打印中心</span>
        </div>

        <!-- 搜索筛选 -->
        <div class="search-form">
            <a-form layout="inline" :model="queryParams">
                <a-form-item label="报告编号">
                    <a-input v-model:value="queryParams.reportNo" placeholder="RPT-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="任务编号">
                    <a-input v-model:value="queryParams.taskNo" placeholder="LAB-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="物料编码">
                    <a-input v-model:value="queryParams.materialCode" placeholder="物料编码" allow-clear
                        style="width: 130px" />
                </a-form-item>
                <a-form-item label="判定结果">
                    <a-select v-model:value="queryParams.judgment" placeholder="全部" allow-clear style="width: 120px">
                        <a-select-option value="PASS">合格</a-select-option>
                        <a-select-option value="FAIL">不合格</a-select-option>
                        <a-select-option value="CONDITIONAL">有条件接受</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="审核状态">
                    <a-select v-model:value="queryParams.reviewStatus" placeholder="全部" allow-clear
                        style="width: 120px">
                        <a-select-option value="DRAFT">草稿</a-select-option>
                        <a-select-option value="PENDING_REVIEW">待审核</a-select-option>
                        <a-select-option value="APPROVED">已审核</a-select-option>
                        <a-select-option value="REJECTED">已驳回</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="生成方式">
                    <a-select v-model:value="queryParams.generatedBy" placeholder="全部" allow-clear style="width: 120px">
                        <a-select-option value="AUTO">自动生成</a-select-option>
                        <a-select-option value="MANUAL">人工编制</a-select-option>
                        <a-select-option value="EXTERNAL">委外回传</a-select-option>
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

        <!-- 数据表格 -->
        <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" :scroll="{ x: 1600 }"
            size="small" :pagination="{ showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true }">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'reportNo'">
                    <a @click="handlePreview(record)">{{ record.reportNo }}</a>
                </template>

                <template v-if="column.key === 'judgment'">
                    <a-tag v-if="record.judgment === 'PASS'" color="success">✅ 合格</a-tag>
                    <a-tag v-else-if="record.judgment === 'FAIL'" color="error">❌ 不合格</a-tag>
                    <a-tag v-else color="warning">⚠️ 有条件</a-tag>
                </template>

                <template v-if="column.key === 'reviewStatus'">
                    <a-badge :status="reviewStatusBadge[record.reviewStatus]"
                        :text="reviewStatusLabel[record.reviewStatus]" />
                </template>

                <template v-if="column.key === 'generatedBy'">
                    <a-tag :color="generatedByColor[record.generatedBy]">{{ generatedByLabel[record.generatedBy]
                        }}</a-tag>
                </template>

                <template v-if="column.key === 'sourceType'">
                    <a-tag v-if="record.sourceType" :color="sourceTypeColor[record.sourceType]">{{ record.sourceType
                        }}</a-tag>
                    <span v-else style="color: #999">-</span>
                </template>

                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button type="link" size="small" @click="handlePreview(record)">预览</a-button>
                        <a-button type="link" size="small" @click="handleDownload(record)">下载PDF</a-button>
                        <a-button v-if="record.reviewStatus === 'PENDING_REVIEW'" type="link" size="small"
                            style="color: #52c41a" @click="handleApprove(record)">审核</a-button>
                    </a-space>
                </template>
            </template>
        </a-table>

        <!-- 报告预览弹窗 -->
        <a-modal v-model:open="previewVisible" :title="`报告预览 - ${currentReport?.reportNo}`" :width="800" :footer="null">
            <a-descriptions :column="2" bordered size="small">
                <a-descriptions-item label="报告编号">{{ currentReport?.reportNo }}</a-descriptions-item>
                <a-descriptions-item label="关联任务">{{ currentReport?.taskNo }}</a-descriptions-item>
                <a-descriptions-item label="物料">{{ currentReport?.materialCode }} - {{ currentReport?.materialName
                    }}</a-descriptions-item>
                <a-descriptions-item label="批次号">{{ currentReport?.batchNo }}</a-descriptions-item>
                <a-descriptions-item label="检验项目">{{ currentReport?.inspItemName }}</a-descriptions-item>
                <a-descriptions-item label="来源">
                    <a-tag v-if="currentReport?.sourceType">{{ currentReport?.sourceType }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="综合判定">
                    <a-tag v-if="currentReport?.judgment === 'PASS'" color="success">合格</a-tag>
                    <a-tag v-else-if="currentReport?.judgment === 'FAIL'" color="error">不合格</a-tag>
                    <a-tag v-else color="warning">有条件接受</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="生成方式">
                    <a-tag :color="generatedByColor[currentReport?.generatedBy || 'AUTO']">
                        {{ generatedByLabel[currentReport?.generatedBy || 'AUTO'] }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="审核状态">
                    <a-badge :status="reviewStatusBadge[currentReport?.reviewStatus || 'DRAFT']"
                        :text="reviewStatusLabel[currentReport?.reviewStatus || 'DRAFT']" />
                </a-descriptions-item>
                <a-descriptions-item label="审核人">{{ currentReport?.reviewerName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="检测完成时间" :span="2">{{ currentReport?.completedAt || '-'
                    }}</a-descriptions-item>
            </a-descriptions>
            <a-divider />
            <div style="text-align: center; padding: 40px; background: #fafafa; border-radius: 6px; color: #999">
                📄 报告内容预览区域 (实际项目中嵌入 PDF 预览组件)
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import type { LabReport } from '@/types'
    import dayjs from 'dayjs'

    const loading = ref(false)
    const tableData = ref < LabReport[] > ([])
    const previewVisible = ref(false)
    const currentReport = ref < LabReport | null > (null)

    const queryParams = reactive({
        reportNo: '', taskNo: '', materialCode: '',
        judgment: undefined as string | undefined,
        reviewStatus: undefined as string | undefined,
        generatedBy: undefined as string | undefined
    })

    const reviewStatusBadge: Record<string, string> = {
        DRAFT: 'default', PENDING_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'error'
    }
    const reviewStatusLabel: Record<string, string> = {
        DRAFT: '草稿', PENDING_REVIEW: '待审核', APPROVED: '已审核', REJECTED: '已驳回'
    }
    const generatedByColor: Record<string, string> = { AUTO: 'blue', MANUAL: 'green', EXTERNAL: 'purple' }
    const generatedByLabel: Record<string, string> = { AUTO: '自动生成', MANUAL: '人工编制', EXTERNAL: '委外回传' }
    const sourceTypeColor: Record<string, string> = {
        IQC: 'blue', IPQC: 'cyan', FQC: 'green', OQC: 'orange',
        MANUAL_8D: 'red', MANUAL_APQP: 'purple', MANUAL_OTHER: 'default'
    }

    const columns = [
        { title: '报告编号', dataIndex: 'reportNo', key: 'reportNo', width: 170, fixed: 'left' as const },
        { title: '关联任务', dataIndex: 'taskNo', key: 'taskNo', width: 170 },
        { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 110 },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 140 },
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '来源', key: 'sourceType', width: 80 },
        { title: '判定', key: 'judgment', width: 100 },
        { title: '审核状态', key: 'reviewStatus', width: 100 },
        { title: '生成方式', key: 'generatedBy', width: 100 },
        { title: '完成时间', dataIndex: 'completedAt', key: 'completedAt', width: 160 },
        { title: '操作', key: 'action', width: 200, fixed: 'right' as const }
    ]

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            const now = dayjs()
            tableData.value = [
                {
                    id: 'rpt1', reportNo: 'RPT-20260302-0001', taskNo: 'LAB-20260302-0004',
                    materialCode: 'M003', materialName: '合金钢管', batchNo: 'B20260302-05',
                    inspItemName: '拉伸强度测试', judgment: 'PASS', reviewStatus: 'APPROVED',
                    generatedBy: 'AUTO', sourceType: 'IQC', reviewerName: '实验室主任',
                    reviewedAt: now.subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    completedAt: now.subtract(10, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    createTime: now.subtract(10, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss'), creator: 'system', updater: '实验室主任'
                },
                {
                    id: 'rpt2', reportNo: 'RPT-20260303-0002', taskNo: 'LAB-20260303-0002',
                    materialCode: 'M005', materialName: '电镀铝板', batchNo: 'B20260303-02',
                    inspItemName: '盐雾测试', judgment: 'PASS', reviewStatus: 'PENDING_REVIEW',
                    generatedBy: 'AUTO', sourceType: 'IQC',
                    completedAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    createTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), creator: 'system', updater: 'system'
                },
                {
                    id: 'rpt3', reportNo: 'RPT-20260301-0005', taskNo: 'LAB-20260301-0008',
                    materialCode: 'M015', materialName: '电镀紧固件', batchNo: 'B20260225-03',
                    inspItemName: '镀层厚度测量', judgment: 'PASS', reviewStatus: 'APPROVED',
                    generatedBy: 'EXTERNAL', sourceType: 'IQC', reviewerName: 'AQE-王',
                    reviewedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    completedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    createTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), creator: 'AQE-王', updater: 'AQE-王'
                },
                {
                    id: 'rpt4', reportNo: 'RPT-20260228-0010', taskNo: 'LAB-20260228-0006',
                    materialCode: 'M010', materialName: '镀镍螺栓', batchNo: 'B20260228-10',
                    inspItemName: 'ROHS有害物质检测', judgment: 'FAIL', reviewStatus: 'APPROVED',
                    generatedBy: 'EXTERNAL', sourceType: 'MANUAL_8D', reviewerName: '品质总监',
                    reviewedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    completedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    createTime: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'), creator: 'SQE-张', updater: '品质总监'
                }
            ] as LabReport[]
            loading.value = false
        }, 400)
    }

    const handleSearch = () => loadData()
    const handleReset = () => {
        queryParams.reportNo = ''; queryParams.taskNo = ''; queryParams.materialCode = ''
        queryParams.judgment = undefined; queryParams.reviewStatus = undefined; queryParams.generatedBy = undefined
        loadData()
    }

    const handlePreview = (record: LabReport) => {
        currentReport.value = record
        previewVisible.value = true
    }

    const handleDownload = (record: LabReport) => {
        message.success(`报告 ${record.reportNo} 正在生成 PDF，请稍候...`)
    }

    const handleApprove = (record: LabReport) => {
        Modal.confirm({
            title: '审核报告',
            content: `确定审核通过报告 ${record.reportNo} 吗？`,
            okText: '通过',
            onOk: () => {
                message.success(`报告 ${record.reportNo} 审核通过`)
                loadData()
            }
        })
    }

    onMounted(() => loadData())
</script>

<style scoped>
    .lab-report-library {
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