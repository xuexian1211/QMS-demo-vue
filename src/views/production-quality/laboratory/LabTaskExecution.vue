<template>
    <div class="lab-task-execution">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <a-button @click="goBack" style="margin-right: 12px">
                    <template #icon>
                        <ArrowLeftOutlined />
                    </template>
                    返回
                </a-button>
                <h3 style="margin: 0">{{ isView ? '查看' : '检测执行' }} - {{ taskDetail.taskNo }}</h3>
                <a-badge :status="statusBadgeMap[taskDetail.status]" :text="statusLabelMap[taskDetail.status]"
                    style="margin-left: 12px" />
                <a-tag v-if="taskDetail.isUrgent" color="red" style="margin-left: 8px">加急</a-tag>
                <a-tag v-if="taskDetail.isOverdue" color="red" style="margin-left: 4px">超时</a-tag>
            </div>
            <div class="header-right">
                <a-space v-if="!isView">
                    <a-button @click="handleSaveDraft">暂存</a-button>
                    <a-button type="primary" @click="handleSubmit"
                        :disabled="taskDetail.status === 'COMPLETED'">提交检测结果</a-button>
                </a-space>
            </div>
        </div>

        <!-- 基本信息 -->
        <a-card title="📋 任务基本信息" size="small" style="margin-bottom: 16px">
            <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="任务编号">{{ taskDetail.taskNo }}</a-descriptions-item>
                <a-descriptions-item label="来源类型">
                    <a-tag :color="sourceTypeColorMap[taskDetail.sourceType]">{{
                        sourceTypeLabelMap[taskDetail.sourceType] }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="优先级">
                    <a-tag :color="priorityColorMap[taskDetail.priority]">{{ priorityLabelMap[taskDetail.priority]
                        }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="来源任务">{{ taskDetail.sourceTaskNo || '-' }}</a-descriptions-item>
                <a-descriptions-item label="来源单据">{{ taskDetail.sourceBillNo || '-' }}</a-descriptions-item>
                <a-descriptions-item label="处理方式">
                    <a-tag v-if="taskDetail.processType"
                        :color="taskDetail.processType === 'INTERNAL' ? 'blue' : 'purple'">
                        {{ taskDetail.processType === 'INTERNAL' ? '内部检测' : '委外检测' }}
                    </a-tag>
                    <span v-else>-</span>
                </a-descriptions-item>
                <a-descriptions-item label="物料编码">{{ taskDetail.materialCode }}</a-descriptions-item>
                <a-descriptions-item label="物料名称">{{ taskDetail.materialName }}</a-descriptions-item>
                <a-descriptions-item label="批次号">{{ taskDetail.batchNo }}</a-descriptions-item>
                <a-descriptions-item label="检验项目">{{ taskDetail.inspItemName }}</a-descriptions-item>
                <a-descriptions-item label="经办人">{{ taskDetail.operatorName || '未分配' }}</a-descriptions-item>
                <a-descriptions-item label="接收时间">{{ taskDetail.receivedAt || '-' }}</a-descriptions-item>
            </a-descriptions>
        </a-card>

        <!-- 样品信息 -->
        <a-card title="🏷️ 样品信息" size="small" style="margin-bottom: 16px">
            <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="样品码">
                    <span style="font-family: monospace; font-size: 16px; color: #1890ff; font-weight: bold">
                        {{ taskDetail.sampleCode || '未生成' }}
                    </span>
                </a-descriptions-item>
                <a-descriptions-item label="样品状态">
                    <a-tag :color="sampleStatusColorMap[taskDetail.sampleStatus || 'RAW_MATERIAL']">
                        {{ sampleStatusLabelMap[taskDetail.sampleStatus || 'RAW_MATERIAL'] }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="留样到期日">
                    {{ taskDetail.retentionDate || '检测完成后自动计算 (3个月)' }}
                </a-descriptions-item>
            </a-descriptions>
        </a-card>

        <!-- 检测结果录入 -->
        <a-card title="🔬 检测数据与判定" size="small" style="margin-bottom: 16px">
            <a-table :columns="resultColumns" :data-source="resultData" :pagination="false" row-key="id" size="small"
                bordered>
                <template #bodyCell="{ column, record }">
                    <!-- 数据类型 -->
                    <template v-if="column.key === 'dataType'">
                        <a-tag :color="record.dataType === 'QUANTITATIVE' ? 'blue' : 'green'">
                            {{ record.dataType === 'QUANTITATIVE' ? '计量型' : '计数型' }}
                        </a-tag>
                    </template>

                    <!-- 规格 -->
                    <template v-if="column.key === 'spec'">
                        <span v-if="record.dataType === 'QUANTITATIVE'">
                            {{ record.targetValue }} ± {{ ((record.upperLimit || 0) - (record.targetValue ||
                            0)).toFixed(2) }} {{ record.unit }}
                            <br />
                            <span style="color: #999; font-size: 12px">[{{ record.lowerLimit }} ~ {{ record.upperLimit
                                }}]</span>
                        </span>
                        <span v-else>{{ record.standardDesc }}</span>
                    </template>

                    <!-- 实测值 -->
                    <template v-if="column.key === 'measuredValue'">
                        <a-input-number v-if="!isView && record.dataType === 'QUANTITATIVE'"
                            v-model:value="record.measuredValue" :step="0.01" style="width: 120px"
                            @change="autoJudge(record)" />
                        <a-select v-else-if="!isView && record.dataType === 'QUALITATIVE'"
                            v-model:value="record.measuredValue" style="width: 120px" @change="autoJudge(record)">
                            <a-select-option value="OK">OK</a-select-option>
                            <a-select-option value="NG">NG</a-select-option>
                        </a-select>
                        <span v-else>{{ record.measuredValue }}</span>
                    </template>

                    <!-- 数据来源 -->
                    <template v-if="column.key === 'dataSource'">
                        <a-tag :color="dataSourceColorMap[record.dataSource]">
                            {{ dataSourceLabelMap[record.dataSource] }}
                        </a-tag>
                    </template>

                    <!-- 判定 -->
                    <template v-if="column.key === 'judgment'">
                        <a-tag v-if="record.judgment === 'PASS'" color="success">✅ PASS</a-tag>
                        <a-tag v-else-if="record.judgment === 'FAIL'" color="error">❌ FAIL</a-tag>
                        <a-tag v-else color="default">待判定</a-tag>
                        <a-tag v-if="record.isCritical" color="red" style="margin-left: 4px">致命</a-tag>
                    </template>

                    <!-- 缺陷现象 -->
                    <template v-if="column.key === 'phenomenon'">
                        <a-select v-if="!isView && record.judgment === 'FAIL'" v-model:value="record.phenomenonCode"
                            placeholder="选择不良现象" style="width: 150px" allow-clear>
                            <a-select-option value="PH-HARDNESS-LOW">硬度偏低</a-select-option>
                            <a-select-option value="PH-HARDNESS-HIGH">硬度超标</a-select-option>
                            <a-select-option value="PH-MATERIAL-MISMATCH">材质不符</a-select-option>
                            <a-select-option value="PH-ROHS-EXCEED">ROHS超标</a-select-option>
                            <a-select-option value="PH-CORROSION">腐蚀/锈蚀</a-select-option>
                        </a-select>
                        <span v-else-if="record.phenomenonCode">{{ record.phenomenonName || record.phenomenonCode
                            }}</span>
                        <span v-else style="color: #999">-</span>
                    </template>
                </template>
            </a-table>
        </a-card>

        <!-- 委外信息（如有） -->
        <a-card v-if="taskDetail.processType === 'EXTERNAL'" title="🏢 委外检测信息" size="small" style="margin-bottom: 16px">
            <a-descriptions :column="2" bordered size="small">
                <a-descriptions-item label="委外机构">{{ taskDetail.externalOrgName }}</a-descriptions-item>
                <a-descriptions-item label="联系人">{{ taskDetail.externalContact || '-' }}</a-descriptions-item>
                <a-descriptions-item label="报价(元)">{{ taskDetail.externalQuotation || '-' }}</a-descriptions-item>
                <a-descriptions-item label="预期完成日期">{{ taskDetail.expectedCompletionDate || '-' }}</a-descriptions-item>
            </a-descriptions>
            <div style="margin-top: 12px">
                <a-upload :max-count="5" :before-upload="() => false">
                    <a-button>
                        <template #icon>
                            <UploadOutlined />
                        </template>
                        上传委外检测报告
                    </a-button>
                </a-upload>
            </div>
        </a-card>

        <!-- 报告生成 -->
        <a-card v-if="taskDetail.status === 'COMPLETED'" title="📄 检测/试验报告" size="small" style="margin-bottom: 16px">
            <a-alert message="检测报告已自动生成" description="系统已根据检测数据自动套用模板生成《实验室检测报告》，您可在线预览或下载 PDF。" type="success"
                show-icon style="margin-bottom: 12px" />
            <a-space>
                <a-button type="primary" ghost>在线预览</a-button>
                <a-button>下载 PDF</a-button>
            </a-space>
        </a-card>

        <!-- 审核区 -->
        <a-card v-if="taskDetail.status === 'COMPLETED' || taskDetail.reviewStatus" title="✅ 审核信息" size="small">
            <a-descriptions :column="2" bordered size="small">
                <a-descriptions-item label="审核状态">
                    <a-tag v-if="taskDetail.reviewStatus === 'APPROVED'" color="success">已审核</a-tag>
                    <a-tag v-else-if="taskDetail.reviewStatus === 'REJECTED'" color="error">已驳回</a-tag>
                    <a-tag v-else color="warning">待审核</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="审核人">{{ taskDetail.reviewerName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="审核意见" :span="2">{{ taskDetail.reviewComment || '-' }}</a-descriptions-item>
            </a-descriptions>
        </a-card>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons-vue'
    import type { LabTask, LabResult } from '@/types'
    import dayjs from 'dayjs'

    const router = useRouter()
    const route = useRoute()

    const isView = computed(() => route.query.mode === 'view')
    const taskId = computed(() => route.params.id as string)

    // 任务详情
    const taskDetail = ref < Partial < LabTask >> ({})

    // 检测结果
    const resultData = ref < Partial < LabResult > [] > ([])

    // 映射
    const statusBadgeMap: Record<string, string> = {
        PENDING_RECEIVE: 'warning', PENDING_TEST: 'default', IN_PROGRESS: 'processing',
        OUTSOURCING: 'purple', COMPLETED: 'success', CANCELLED: 'error'
    }
    const statusLabelMap: Record<string, string> = {
        PENDING_RECEIVE: '待接收', PENDING_TEST: '待检测', IN_PROGRESS: '检测中',
        OUTSOURCING: '委外中', COMPLETED: '已完成', CANCELLED: '已取消'
    }
    const priorityColorMap: Record<string, string> = { NORMAL: 'default', URGENT: 'orange', CRITICAL: 'red' }
    const priorityLabelMap: Record<string, string> = { NORMAL: '常规', URGENT: '加急', CRITICAL: '紧急' }
    const sourceTypeLabelMap: Record<string, string> = {
        IQC: 'IQC联动', IPQC: 'IPQC联动', FQC: 'FQC联动', OQC: 'OQC联动',
        MANUAL_8D: '8D委托', MANUAL_APQP: 'APQP验证', MANUAL_OTHER: '其他'
    }
    const sourceTypeColorMap: Record<string, string> = {
        IQC: 'blue', IPQC: 'cyan', FQC: 'green', OQC: 'orange',
        MANUAL_8D: 'red', MANUAL_APQP: 'purple', MANUAL_OTHER: 'default'
    }
    const sampleStatusColorMap: Record<string, string> = {
        RAW_MATERIAL: 'blue', WIP: 'cyan', FINISHED: 'green', RETAINED: 'orange', DISPOSED: 'default'
    }
    const sampleStatusLabelMap: Record<string, string> = {
        RAW_MATERIAL: '原材料', WIP: '在制品', FINISHED: '成品', RETAINED: '留样中', DISPOSED: '已处置'
    }
    const dataSourceColorMap: Record<string, string> = { MANUAL: 'default', IOT_DEVICE: 'blue', EXTERNAL_REPORT: 'purple' }
    const dataSourceLabelMap: Record<string, string> = { MANUAL: '人工录入', IOT_DEVICE: 'IoT采集', EXTERNAL_REPORT: '委外报告' }

    // 表格列
    const resultColumns = [
        { title: '数据类型', key: 'dataType', width: 90 },
        { title: '规格标准', key: 'spec', width: 200 },
        { title: '实测值', key: 'measuredValue', width: 140 },
        { title: '数据来源', key: 'dataSource', width: 100 },
        { title: '判定', key: 'judgment', width: 140 },
        { title: '不良现象', key: 'phenomenon', width: 180 }
    ]

    /**
     * 自动判定逻辑
     * 根据规格上下限以及实测值进行 Pass/Fail 自动比对
     */
    const autoJudge = (record: Partial<LabResult>) => {
        if (record.dataType === 'QUANTITATIVE') {
            const val = Number(record.measuredValue)
            if (isNaN(val)) {
                record.judgment = undefined as any
                return
            }
            if (record.upperLimit !== undefined && record.lowerLimit !== undefined) {
                record.judgment = (val >= record.lowerLimit && val <= record.upperLimit) ? 'PASS' : 'FAIL'
            }
        } else {
            // 计数型：OK = PASS, NG = FAIL
            record.judgment = record.measuredValue === 'OK' ? 'PASS' : 'FAIL'
        }
    }

    /** 返回列表 */
    const goBack = () => {
        router.push('/production-quality/laboratory/lab-task-board')
    }

    /** 暂存 */
    const handleSaveDraft = () => {
        message.success('检测数据已暂存')
    }

    /** 提交检测结果 */
    const handleSubmit = () => {
        // 校验 FAIL 项是否选择了不良现象
        const failItems = resultData.value.filter(r => r.judgment === 'FAIL')
        const missingPhenomenon = failItems.some(r => !r.phenomenonCode)
        if (missingPhenomenon) {
            message.warning('判定为 FAIL 的项目必须选择不良现象代码')
            return
        }

        // 校验是否有致命缺陷
        const hasCritical = failItems.some(r => r.isCritical)

        if (hasCritical) {
            Modal.confirm({
                title: '⚠️ 致命缺陷预警',
                content: '检测结果包含致命缺陷（如ROHS超标），提交后系统将自动锁定相关物料批次并向品质总监发送报警通知。是否确认提交？',
                okText: '确认提交',
                okType: 'danger',
                onOk: () => doSubmit()
            })
        } else {
            doSubmit()
        }
    }

    const doSubmit = () => {
        message.success('检测结果已提交，报告已自动生成。结果将同步回写源头检验任务。')
        taskDetail.value.status = 'COMPLETED'
        taskDetail.value.reviewStatus = 'PENDING'
    }

    /** 加载任务详情 */
    const loadDetail = () => {
        const now = dayjs()
        // NOTE: 模拟数据，后续对接后端 API
        if (taskId.value === '2') {
            taskDetail.value = {
                id: '2', taskNo: 'LAB-20260303-0002', orgId: 'HFC_001', sourceType: 'IQC', sourceTaskNo: 'TSK-IQC-20260303002',
                sourceBillNo: 'WMS-REC-20260303', inspItemCode: 'ITEM-HF-SALT', inspItemName: '盐雾测试',
                materialCode: 'M005', materialName: '电镀铝板', batchNo: 'B20260303-02',
                status: 'IN_PROGRESS', processType: 'INTERNAL', priority: 'NORMAL', isUrgent: false, isOverdue: false,
                sampleCode: 'SPL-20260302-0001', sampleStatus: 'WIP',
                receivedAt: now.subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                operatorId: '101', operatorName: '王实验员',
                createTime: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                updateTime: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                creator: 'system', updater: '101'
            }
            resultData.value = [
                {
                    id: 'r1', taskNo: 'LAB-20260303-0002', dataType: 'QUANTITATIVE',
                    targetValue: 48, upperLimit: 72, lowerLimit: 48, unit: 'h',
                    measuredValue: undefined as any, judgment: undefined as any,
                    dataSource: 'MANUAL', isCritical: false, testedAt: '',
                    createTime: '', updateTime: '', creator: '', updater: ''
                }
            ]
        } else if (taskId.value === '3') {
            taskDetail.value = {
                id: '3', taskNo: 'LAB-20260302-0005', orgId: 'HFC_001', sourceType: 'MANUAL_8D',
                sourceBillNo: '8D-2026-0042', inspItemCode: 'ITEM-ROHS', inspItemName: 'ROHS有害物质检测',
                materialCode: 'M010', materialName: '镀镍螺栓', batchNo: 'B20260228-10',
                status: 'OUTSOURCING', processType: 'EXTERNAL', priority: 'CRITICAL', isUrgent: true, isOverdue: true,
                sampleCode: 'SPL-20260302-0003', sampleStatus: 'RAW_MATERIAL',
                externalOrgName: 'SGS通标标准技术服务', externalContact: '张工 13800138000',
                externalQuotation: 3500, expectedCompletionDate: '2026-03-05',
                receivedAt: now.subtract(30, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                createTime: now.subtract(32, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                updateTime: now.subtract(28, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                creator: 'SQE-张', updater: 'SQE-张'
            }
            resultData.value = [
                {
                    id: 'r2', taskNo: 'LAB-20260302-0005', dataType: 'QUANTITATIVE',
                    targetValue: 0, upperLimit: 1000, lowerLimit: 0, unit: 'ppm',
                    measuredValue: undefined as any, judgment: undefined as any,
                    dataSource: 'EXTERNAL_REPORT', isCritical: true, testedAt: '',
                    standardDesc: 'Pb铅含量不超过1000ppm (RoHS 2.0)',
                    createTime: '', updateTime: '', creator: '', updater: ''
                }
            ]
        } else {
            // 默认
            taskDetail.value = {
                id: taskId.value, taskNo: 'LAB-20260303-0001', orgId: 'HFC_001', sourceType: 'IQC',
                sourceTaskNo: 'TSK-IQC-20260303001', sourceBillNo: 'WMS-REC-20260303',
                inspItemCode: 'ITEM-G-HARDNESS', inspItemName: '洛氏硬度',
                materialCode: 'M002', materialName: '压铸壳体A', batchNo: 'B20260303-01',
                status: 'IN_PROGRESS', processType: 'INTERNAL', priority: 'URGENT', isUrgent: true, isOverdue: false,
                sampleCode: 'SPL-20260303-0001', sampleStatus: 'RAW_MATERIAL',
                receivedAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                operatorId: '101', operatorName: '王实验员',
                createTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                updateTime: now.format('YYYY-MM-DD HH:mm:ss'),
                creator: 'system', updater: '101'
            }
            resultData.value = [
                {
                    id: 'r3', taskNo: 'LAB-20260303-0001', dataType: 'QUANTITATIVE',
                    targetValue: 45, upperLimit: 55, lowerLimit: 40, unit: 'HRC',
                    measuredValue: undefined as any, judgment: undefined as any,
                    dataSource: 'MANUAL', isCritical: false, testedAt: '',
                    createTime: '', updateTime: '', creator: '', updater: ''
                }
            ]
        }
    }

    onMounted(() => {
        loadDetail()
    })
</script>

<style scoped>
    .lab-task-execution {
        padding: 16px;
        background: #f0f2f5;
        min-height: calc(100vh - 130px);
    }

    .page-header {
        background: #fff;
        padding: 12px 20px;
        border-radius: 6px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .header-left {
        display: flex;
        align-items: center;
    }

    .header-right {
        display: flex;
        align-items: center;
    }
</style>