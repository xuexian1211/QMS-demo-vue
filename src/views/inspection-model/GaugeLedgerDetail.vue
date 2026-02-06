<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <a-button type="text" @click="handleBack" class="back-button">
                    <template #icon>
                        <ArrowLeftOutlined />
                    </template>
                    返回
                </a-button>
                <div class="title-section">
                    <h2 class="page-title">量检具详情: {{ gauge.gaugeNo }}</h2>
                    <a-tag :color="getStatusColor(gauge.status)">{{ getStatusText(gauge.status) }}</a-tag>
                    <a-tag :color="getCalStatusColor(gauge.nextCalDate)">
                        {{ getCalStatusText(gauge.nextCalDate) }}
                    </a-tag>
                </div>
            </div>
            <div class="header-actions">
                <a-button type="primary" @click="handleEdit">编辑</a-button>
                <a-button @click="handleCalibration">校准</a-button>
                <a-button @click="handleStatusChange">状态变更</a-button>
            </div>
        </div>

        <!-- 基本信息 Card -->
        <a-card class="form-card" title="基本信息">
            <a-descriptions :column="3" bordered size="small">
                <!-- 基本信息 -->
                <a-descriptions-item label="量具编号">{{ gauge.gaugeNo }}</a-descriptions-item>
                <a-descriptions-item label="量具名称">{{ gauge.gaugeName }}</a-descriptions-item>
                <a-descriptions-item label="规格型号">{{ gauge.model || '-' }}</a-descriptions-item>

                <a-descriptions-item label="所属类型">{{ gauge.typeName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="制造商">{{ gauge.manufacturer || '-' }}</a-descriptions-item>
                <a-descriptions-item label="出厂序列号">{{ gauge.serialNo || '-' }}</a-descriptions-item>

                <!-- 技术参数 -->
                <a-descriptions-item label="量程范围">{{ gauge.measureRange || '-' }}</a-descriptions-item>
                <a-descriptions-item label="分辨率">{{ gauge.resolution ? `${gauge.resolution}mm` : '-'
                    }}</a-descriptions-item>
                <a-descriptions-item label="精度等级">{{ gauge.accuracy || '-' }}</a-descriptions-item>

                <!-- 校准信息 -->
                <a-descriptions-item label="校准周期">{{ gauge.calibrationCycle ? `${gauge.calibrationCycle} 个月` : '-'
                    }}</a-descriptions-item>
                <a-descriptions-item label="上次校准">{{ gauge.lastCalDate || '-' }}</a-descriptions-item>
                <a-descriptions-item label="下次校准">
                    <span :class="getCalStatusClass(gauge.nextCalDate)">{{ gauge.nextCalDate || '-' }}</span>
                </a-descriptions-item>

                <!-- 管理信息 -->
                <a-descriptions-item label="当前状态">
                    <a-tag :color="getStatusColor(gauge.status)">{{ getStatusText(gauge.status) }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="保管人">{{ gauge.custodian || '-' }}</a-descriptions-item>
                <a-descriptions-item label="存放位置">{{ gauge.location || '-' }}</a-descriptions-item>

                <a-descriptions-item label="购置日期">{{ gauge.purchaseDate || '-' }}</a-descriptions-item>
                <a-descriptions-item label="证书编号">{{ gauge.certificateNo || '-' }}</a-descriptions-item>
                <a-descriptions-item label="描述">{{ gauge.description || '-' }}</a-descriptions-item>
            </a-descriptions>
        </a-card>

        <!-- Tab Card -->
        <a-card class="tab-card">
            <a-tabs v-model:activeKey="activeTab">
                <!-- 校准记录 Tab -->
                <a-tab-pane key="calibration" tab="校准记录">
                    <div class="tab-toolbar">
                        <a-button type="primary" size="small" @click="handleAddCalibration">
                            <template #icon>
                                <PlusOutlined />
                            </template>
                            新增校准
                        </a-button>
                    </div>
                    <a-table :columns="calibrationColumns" :data-source="calibrationRecords" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'calibrationType'">
                                <a-tag :color="record.calibrationType === 'INTERNAL' ? 'blue' : 'purple'">
                                    {{ record.calibrationType === 'INTERNAL' ? '内校' : '外校' }}
                                </a-tag>
                            </template>
                            <template v-else-if="column.key === 'result'">
                                <a-tag :color="getResultColor(record.result)">{{ getResultText(record.result) }}</a-tag>
                            </template>
                        </template>
                    </a-table>
                </a-tab-pane>

                <!-- 状态变更 Tab -->
                <a-tab-pane key="statusLog" tab="状态变更">
                    <a-timeline v-if="statusLogs.length > 0">
                        <a-timeline-item v-for="log in statusLogs" :key="log.id"
                            :color="getTimelineColor(log.toStatus)">
                            <p class="timeline-time">{{ log.operateTime }} - {{ log.operator }}</p>
                            <p class="timeline-change">
                                <a-tag :color="getStatusColor(log.fromStatus)" size="small">{{
                                    getStatusText(log.fromStatus) }}</a-tag>
                                <span style="margin: 0 8px">→</span>
                                <a-tag :color="getStatusColor(log.toStatus)" size="small">{{ getStatusText(log.toStatus)
                                    }}</a-tag>
                            </p>
                            <p class="timeline-reason" v-if="log.reason">原因：{{ log.reason }}</p>
                        </a-timeline-item>
                    </a-timeline>
                    <a-empty v-else description="暂无状态变更记录" />
                </a-tab-pane>

                <!-- 附件 Tab -->
                <a-tab-pane key="attachments" tab="附件">
                    <div class="tab-toolbar">
                        <a-upload>
                            <a-button size="small">
                                <template #icon>
                                    <UploadOutlined />
                                </template>
                                上传附件
                            </a-button>
                        </a-upload>
                    </div>
                    <a-table :columns="attachmentColumns" :data-source="attachments" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small">下载</a-button>
                                    <a-button type="link" danger size="small">删除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </a-tab-pane>
            </a-tabs>
        </a-card>

        <!-- 弹窗组件 -->
        <CalibrationRecordModal v-model:visible="calibrationModalVisible" @submit="saveCalibration" />

        <GaugeStatusChangeModal v-model:visible="statusModalVisible" :current-status="gauge.status as GaugeStatus"
            @submit="saveStatusChange" />
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import dayjs from 'dayjs'
    import {
        ArrowLeftOutlined,
        PlusOutlined,
        UploadOutlined
    } from '@ant-design/icons-vue'
    import type { GaugeStatus, GaugeLedger, CalibrationRecord, GaugeStatusLog, CalibrationResult } from '@/types'
    import CalibrationRecordModal from '@/components/inspection/CalibrationRecordModal.vue'
    import GaugeStatusChangeModal from '@/components/inspection/GaugeStatusChangeModal.vue'

    const route = useRoute()
    const router = useRouter()

    // --- 数据状态 ---
    const activeTab = ref('calibration')
    const gauge = reactive < Partial < GaugeLedger >> ({
        id: '',
        gaugeNo: '',
        gaugeName: '',
        status: 'IN_USE'
    })
    const calibrationRecords = ref < Partial < CalibrationRecord > [] > ([])
    const statusLogs = ref < Partial < GaugeStatusLog > [] > ([])
    const attachments = ref < any[] > ([])

    // 弹窗状态
    const calibrationModalVisible = ref(false)
    const statusModalVisible = ref(false)

    // --- 表格列定义 ---
    const calibrationColumns = [
        { title: '校准日期', dataIndex: 'calibrationDate', key: 'calibrationDate', width: 110 },
        { title: '类型', key: 'calibrationType', width: 80 },
        { title: '结果', key: 'result', width: 100 },
        { title: '校准机构', dataIndex: 'calibrationOrg', key: 'calibrationOrg', width: 150 },
        { title: '校准人员', dataIndex: 'calibrator', key: 'calibrator', width: 100 },
        { title: '证书编号', dataIndex: 'certificateNo', key: 'certificateNo', width: 150 },
        { title: '结论', dataIndex: 'conclusion', key: 'conclusion' }
    ]

    const attachmentColumns = [
        { title: '文件名', dataIndex: 'fileName', key: 'fileName', width: 200 },
        { title: '文件类型', dataIndex: 'fileType', key: 'fileType', width: 100 },
        { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 150 },
        { title: '操作', key: 'action', width: 120 }
    ]

    // --- 操作方法 ---
    const handleBack = () => {
        router.push('/inspection-model/gauge-ledgers')
    }

    const handleEdit = () => {
        message.info('编辑功能待实现')
    }

    const handleCalibration = () => {
        Object.assign(calibrationForm, {
            calibrationType: 'INTERNAL',
            calibrationDate: dayjs(),
            result: 'PASS',
            calibrationOrg: '',
            calibrator: '',
            certificateNo: '',
            conclusion: ''
        })
        calibrationModalVisible.value = true
    }

    const handleAddCalibration = () => {
        handleCalibration()
    }

    const saveCalibration = () => {
        if (!calibrationForm.calibrationDate) {
            message.warn('请选择校准日期')
            return
        }

        const newRecord: Partial<CalibrationRecord> = {
            id: Date.now().toString(),
            gaugeId: gauge.id as string,
            calibrationType: calibrationForm.calibrationType,
            calibrationDate: dayjs(calibrationForm.calibrationDate).format('YYYY-MM-DD'),
            nextCalDate: dayjs(calibrationForm.calibrationDate).add(gauge.calibrationCycle || 12, 'month').format('YYYY-MM-DD'),
            result: calibrationForm.result,
            calibrationOrg: calibrationForm.calibrationOrg,
            calibrator: calibrationForm.calibrator,
            certificateNo: calibrationForm.certificateNo,
            conclusion: calibrationForm.conclusion
        }

        calibrationRecords.value.unshift(newRecord)

        // 更新台账的校准日期
        gauge.lastCalDate = newRecord.calibrationDate
        gauge.nextCalDate = newRecord.nextCalDate
        gauge.certificateNo = newRecord.certificateNo

        message.success('校准记录保存成功')
        calibrationModalVisible.value = false
    }

    const handleStatusChange = () => {
        if (availableStatuses.value.length === 0) {
            message.warn('当前状态无法变更（终态）')
            return
        }
        statusForm.toStatus = availableStatuses.value[0]
        statusForm.reason = ''
        statusModalVisible.value = true
    }

    const saveStatusChange = () => {
        if (!statusForm.toStatus || !statusForm.reason) {
            message.warn('请填写完整信息')
            return
        }

        const newLog: Partial<GaugeStatusLog> = {
            id: Date.now().toString(),
            gaugeId: gauge.id as string,
            fromStatus: gauge.status as GaugeStatus,
            toStatus: statusForm.toStatus,
            reason: statusForm.reason,
            operator: '当前用户',
            operateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }

        statusLogs.value.unshift(newLog)
        gauge.status = statusForm.toStatus

        message.success('状态变更成功')
        statusModalVisible.value = false
    }

    // --- 辅助函数 ---
    const getStatusColor = (status: GaugeStatus | undefined) => {
        switch (status) {
            case 'IN_USE': return 'green'
            case 'CALIBRATING': return 'orange'
            case 'SEALED': return 'gray'
            case 'SCRAPPED': return 'red'
            default: return 'default'
        }
    }

    const getStatusText = (status: GaugeStatus | undefined) => {
        switch (status) {
            case 'IN_USE': return '在用'
            case 'CALIBRATING': return '校准中'
            case 'SEALED': return '封存'
            case 'SCRAPPED': return '报废'
            default: return '-'
        }
    }

    const getCalStatusColor = (nextCalDate: string | undefined) => {
        if (!nextCalDate) return 'default'
        const today = dayjs()
        const nextCal = dayjs(nextCalDate)
        const daysUntil = nextCal.diff(today, 'day')

        if (daysUntil < 0) return 'red'
        if (daysUntil <= 14) return 'orange'
        return 'green'
    }

    const getCalStatusText = (nextCalDate: string | undefined) => {
        if (!nextCalDate) return '-'
        const today = dayjs()
        const nextCal = dayjs(nextCalDate)
        const daysUntil = nextCal.diff(today, 'day')

        if (daysUntil < 0) return '已过期'
        if (daysUntil <= 14) return '即将到期'
        return '正常'
    }

    const getCalStatusClass = (nextCalDate: string | undefined) => {
        const level = getCalStatusColor(nextCalDate)
        return {
            'cal-danger': level === 'red',
            'cal-warning': level === 'orange',
            'cal-normal': level === 'green'
        }
    }

    const getResultColor = (result: CalibrationResult) => {
        switch (result) {
            case 'PASS': return 'green'
            case 'FAIL': return 'red'
            case 'CONDITIONAL': return 'orange'
            default: return 'default'
        }
    }

    const getResultText = (result: CalibrationResult) => {
        switch (result) {
            case 'PASS': return '合格'
            case 'FAIL': return '不合格'
            case 'CONDITIONAL': return '有条件合格'
            default: return result
        }
    }

    const getTimelineColor = (status: GaugeStatus) => {
        switch (status) {
            case 'IN_USE': return 'green'
            case 'CALIBRATING': return 'orange'
            case 'SEALED': return 'gray'
            case 'SCRAPPED': return 'red'
            default: return 'blue'
        }
    }

    // --- 加载数据 ---
    onMounted(() => {
        const id = route.params.id as string
        if (id) {
            // 模拟加载数据
            Object.assign(gauge, {
                id,
                gaugeNo: 'G-001',
                gaugeName: '数显卡尺01',
                typeId: '301',
                typeName: '数显卡尺',
                model: 'M-150',
                manufacturer: '三丰',
                serialNo: 'SN2023001',
                measureRange: '0-150mm',
                resolution: 0.01,
                accuracy: '±0.02mm',
                calibrationCycle: 12,
                lastCalDate: '2023-06-15',
                nextCalDate: '2024-06-15',
                status: 'IN_USE' as GaugeStatus,
                location: '产线A',
                custodian: '张三',
                certificateNo: 'CAL-2023-0001',
                purchaseDate: '2022-01-15',
                description: '产线A使用'
            })

            // 模拟校准记录
            calibrationRecords.value = [
                {
                    id: '1',
                    gaugeId: id,
                    calibrationType: 'EXTERNAL',
                    calibrationDate: '2023-06-15',
                    nextCalDate: '2024-06-15',
                    result: 'PASS',
                    calibrationOrg: '省计量院',
                    calibrator: '张工',
                    certificateNo: 'CAL-2023-0001',
                    conclusion: '各项指标合格'
                },
                {
                    id: '2',
                    gaugeId: id,
                    calibrationType: 'EXTERNAL',
                    calibrationDate: '2022-06-10',
                    nextCalDate: '2023-06-10',
                    result: 'PASS',
                    calibrationOrg: '省计量院',
                    calibrator: '李工',
                    certificateNo: 'CAL-2022-0088',
                    conclusion: '合格'
                }
            ]

            // 模拟状态变更记录
            statusLogs.value = [
                {
                    id: '1',
                    gaugeId: id,
                    fromStatus: 'CALIBRATING',
                    toStatus: 'IN_USE',
                    reason: '校准完成，恢复使用',
                    operator: '张三',
                    operateTime: '2023-06-16 09:30:00'
                },
                {
                    id: '2',
                    gaugeId: id,
                    fromStatus: 'IN_USE',
                    toStatus: 'CALIBRATING',
                    reason: '定期校准',
                    operator: '张三',
                    operateTime: '2023-06-10 14:00:00'
                }
            ]

            // 模拟附件
            attachments.value = [
                { id: '1', fileName: 'CAL-2023-0001.pdf', fileType: 'PDF', uploadTime: '2023-06-16' }
            ]
        }
    })
</script>

<style scoped>
    .page-container {
        padding: 24px;
        background: #f0f2f5;
        min-height: calc(100vh - 64px);
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        background: #fff;
        padding: 16px;
        border-radius: 4px;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .back-button {
        padding: 0;
    }

    .title-section {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .page-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .header-actions {
        display: flex;
        gap: 8px;
    }

    .form-card {
        margin-bottom: 16px;
    }

    .tab-card {
        margin-bottom: 16px;
    }

    .tab-toolbar {
        margin-bottom: 12px;
    }

    .timeline-time {
        color: #666;
        font-size: 12px;
        margin-bottom: 4px;
    }

    .timeline-change {
        margin-bottom: 4px;
    }

    .timeline-reason {
        color: #999;
        font-size: 12px;
    }

    .cal-danger {
        color: #ff4d4f;
        font-weight: 500;
    }

    .cal-warning {
        color: #fa8c16;
        font-weight: 500;
    }

    .cal-normal {
        color: #52c41a;
    }
</style>