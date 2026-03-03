<template>
    <div class="lab-task-board">
        <!-- 统计看板 -->
        <div class="stats-panel">
            <a-row :gutter="16">
                <a-col :span="4">
                    <a-statistic title="待接收" :value="stats.pendingReceiveCount" class="stat-card stat-pending">
                        <template #prefix><span class="stat-icon">📥</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="4">
                    <a-statistic title="检测中" :value="stats.inProgressCount" class="stat-card stat-progress"
                        value-style="color: #1890ff">
                        <template #prefix><span class="stat-icon">🔬</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="4">
                    <a-statistic title="委外中" :value="stats.outsourcingCount" class="stat-card stat-outsource"
                        value-style="color: #722ed1">
                        <template #prefix><span class="stat-icon">🏢</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="4">
                    <a-statistic title="今日完成" :value="stats.completedTodayCount" class="stat-card stat-done"
                        value-style="color: #52c41a">
                        <template #prefix><span class="stat-icon">✅</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="4">
                    <a-statistic title="已超时" :value="stats.overdueCount" class="stat-card stat-overdue"
                        value-style="color: #ff4d4f">
                        <template #prefix><span class="stat-icon">⏰</span></template>
                    </a-statistic>
                </a-col>
                <a-col :span="4">
                    <a-statistic title="本月合格率" :value="stats.monthlyPassRate" suffix="%" class="stat-card stat-rate"
                        value-style="color: #13c2c2">
                        <template #prefix><span class="stat-icon">📊</span></template>
                    </a-statistic>
                </a-col>
            </a-row>
        </div>

        <!-- 工具栏 -->
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="handleManualCreate">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    手动创建任务
                </a-button>
                <a-button @click="loadData">
                    <template #icon>
                        <ReloadOutlined />
                    </template>
                    刷新
                </a-button>
            </a-space>
        </div>

        <!-- 搜索表单 -->
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
                <a-form-item label="来源任务">
                    <a-input v-model:value="queryParams.sourceTaskNo" placeholder="TSK-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="任务状态">
                    <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 140px">
                        <a-select-option value="PENDING_RECEIVE">待接收</a-select-option>
                        <a-select-option value="PENDING_TEST">待检测</a-select-option>
                        <a-select-option value="IN_PROGRESS">检测中</a-select-option>
                        <a-select-option value="OUTSOURCING">委外中</a-select-option>
                        <a-select-option value="COMPLETED">已完成</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="处理类型">
                    <a-select v-model:value="queryParams.processType" placeholder="全部" allow-clear style="width: 120px">
                        <a-select-option value="INTERNAL">内部检测</a-select-option>
                        <a-select-option value="EXTERNAL">委外检测</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="优先级">
                    <a-select v-model:value="queryParams.priority" placeholder="全部" allow-clear style="width: 120px">
                        <a-select-option value="NORMAL">常规</a-select-option>
                        <a-select-option value="URGENT">加急</a-select-option>
                        <a-select-option value="CRITICAL">紧急</a-select-option>
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
        <a-table :columns="columns" :data-source="tableData" :loading="loading" :pagination="pagination" row-key="id"
            :scroll="{ x: 1800 }" @change="handleTableChange" size="small">
            <!-- 任务编号 -->
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'taskNo'">
                    <a @click="handleView(record)">{{ record.taskNo }}</a>
                </template>

                <!-- 优先级 -->
                <template v-if="column.key === 'priority'">
                    <a-tag :color="priorityColorMap[record.priority]">
                        {{ priorityLabelMap[record.priority] }}
                    </a-tag>
                    <a-tag v-if="record.isUrgent" color="red">加急</a-tag>
                </template>

                <!-- 状态 -->
                <template v-if="column.key === 'status'">
                    <a-badge :status="statusBadgeMap[record.status]" :text="statusLabelMap[record.status]" />
                    <a-tag v-if="record.isOverdue" color="red" style="margin-left: 4px">超时</a-tag>
                </template>

                <!-- 来源类型 -->
                <template v-if="column.key === 'sourceType'">
                    <a-tag :color="sourceTypeColorMap[record.sourceType]">{{ sourceTypeLabelMap[record.sourceType]
                        }}</a-tag>
                </template>

                <!-- 处理类型 -->
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
                    <span v-else style="color: #999">未生成</span>
                </template>

                <!-- 操作列 -->
                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button v-if="record.status === 'PENDING_RECEIVE'" type="link" size="small"
                            @click="handleReceive(record)">接样</a-button>
                        <a-button v-if="record.status === 'PENDING_TEST' || record.status === 'IN_PROGRESS'" type="link"
                            size="small" @click="handleExecute(record)">检测</a-button>
                        <a-button v-if="record.status === 'PENDING_TEST'" type="link" size="small"
                            @click="handleOutsource(record)" style="color: #722ed1">委外</a-button>
                        <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                    </a-space>
                </template>
            </template>
        </a-table>

        <!-- 手动创建任务弹窗 -->
        <a-modal v-model:open="createModalVisible" title="手动创建实验室检测任务" :width="680" @ok="handleCreateConfirm"
            @cancel="createModalVisible = false">
            <a-form :model="createForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="来源类型" required>
                    <a-select v-model:value="createForm.sourceType">
                        <a-select-option value="MANUAL_8D">8D 专项委托</a-select-option>
                        <a-select-option value="MANUAL_APQP">APQP 新产品验证</a-select-option>
                        <a-select-option value="MANUAL_OTHER">其他失效分析</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="关联单据号">
                    <a-input v-model:value="createForm.sourceBillNo" placeholder="8D案件ID / APQP编号" />
                </a-form-item>
                <a-form-item label="物料编码" required>
                    <a-input v-model:value="createForm.materialCode" placeholder="请输入物料编码" />
                </a-form-item>
                <a-form-item label="批次号" required>
                    <a-input v-model:value="createForm.batchNo" placeholder="请输入批次号" />
                </a-form-item>
                <a-form-item label="检验项目" required>
                    <a-input v-model:value="createForm.inspItemName" placeholder="如: 材质光谱分析" />
                </a-form-item>
                <a-form-item label="优先级">
                    <a-radio-group v-model:value="createForm.priority">
                        <a-radio value="NORMAL">常规</a-radio>
                        <a-radio value="URGENT">加急</a-radio>
                        <a-radio value="CRITICAL">紧急</a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="备注">
                    <a-textarea v-model:value="createForm.remark" :rows="3" placeholder="请描述检测需求" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 接样弹窗 -->
        <a-modal v-model:open="receiveModalVisible" title="样品接收确认" @ok="handleReceiveConfirm">
            <a-descriptions :column="1" bordered size="small">
                <a-descriptions-item label="任务编号">{{ currentTask?.taskNo }}</a-descriptions-item>
                <a-descriptions-item label="物料">{{ currentTask?.materialCode }} - {{ currentTask?.materialName
                    }}</a-descriptions-item>
                <a-descriptions-item label="批次号">{{ currentTask?.batchNo }}</a-descriptions-item>
                <a-descriptions-item label="检验项目">{{ currentTask?.inspItemName }}</a-descriptions-item>
            </a-descriptions>
            <a-divider />
            <a-alert message="确认接收后系统将自动生成样品唯一标识码，并记录接收时间。" type="info" show-icon />
        </a-modal>

        <!-- 委外弹窗 -->
        <a-modal v-model:open="outsourceModalVisible" title="委外检测申请" @ok="handleOutsourceConfirm">
            <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="委外机构" required>
                    <a-input v-model:value="outsourceForm.externalOrgName" placeholder="如: SGS, TÜV, 17025认证机构" />
                </a-form-item>
                <a-form-item label="联系人">
                    <a-input v-model:value="outsourceForm.externalContact" placeholder="联系人姓名/电话" />
                </a-form-item>
                <a-form-item label="预估报价(元)">
                    <a-input-number v-model:value="outsourceForm.externalQuotation" :min="0" style="width: 100%"
                        placeholder="0.00" />
                </a-form-item>
                <a-form-item label="预期完成日期">
                    <a-date-picker v-model:value="outsourceForm.expectedDate" style="width: 100%" />
                </a-form-item>
            </a-form>
            <a-alert message="提交后系统将通过钉钉通知采购部门启动委外流程。" type="warning" show-icon style="margin-top: 12px" />
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
    import type { LabTask, LabTaskStats, LabTaskQueryParams, LabTaskStatus, LabSourceType, LabTaskPriority } from '@/types'
    import dayjs from 'dayjs'

    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const tableData = ref < LabTask[] > ([])
    const createModalVisible = ref(false)
    const receiveModalVisible = ref(false)
    const outsourceModalVisible = ref(false)
    const currentTask = ref < LabTask | null > (null)

    // 统计看板
    const stats = reactive < LabTaskStats > ({
        pendingReceiveCount: 0,
        inProgressCount: 0,
        outsourcingCount: 0,
        completedTodayCount: 0,
        overdueCount: 0,
        monthlyPassRate: 0
    })

    // 查询参数
    const queryParams = reactive < LabTaskQueryParams > ({
        page: 1,
        pageSize: 20
    })

    // 分页
    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条`
    })

    // 创建表单
    const createForm = reactive({
        sourceType: 'MANUAL_8D' as LabSourceType,
        sourceBillNo: '',
        materialCode: '',
        batchNo: '',
        inspItemName: '',
        priority: 'NORMAL' as LabTaskPriority,
        remark: ''
    })

    // 委外表单
    const outsourceForm = reactive({
        externalOrgName: '',
        externalContact: '',
        externalQuotation: undefined as number | undefined,
        expectedDate: null as any
    })

    // 字段映射
    const priorityColorMap: Record<string, string> = {
        NORMAL: 'default',
        URGENT: 'orange',
        CRITICAL: 'red'
    }
    const priorityLabelMap: Record<string, string> = {
        NORMAL: '常规',
        URGENT: '加急',
        CRITICAL: '紧急'
    }
    const statusBadgeMap: Record<string, string> = {
        PENDING_RECEIVE: 'warning',
        PENDING_TEST: 'default',
        IN_PROGRESS: 'processing',
        OUTSOURCING: 'purple',
        COMPLETED: 'success',
        CANCELLED: 'error'
    }
    const statusLabelMap: Record<string, string> = {
        PENDING_RECEIVE: '待接收',
        PENDING_TEST: '待检测',
        IN_PROGRESS: '检测中',
        OUTSOURCING: '委外中',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
    }
    const sourceTypeLabelMap: Record<string, string> = {
        IQC: 'IQC联动',
        IPQC: 'IPQC联动',
        FQC: 'FQC联动',
        OQC: 'OQC联动',
        MANUAL_8D: '8D委托',
        MANUAL_APQP: 'APQP验证',
        MANUAL_OTHER: '其他'
    }
    const sourceTypeColorMap: Record<string, string> = {
        IQC: 'blue',
        IPQC: 'cyan',
        FQC: 'green',
        OQC: 'orange',
        MANUAL_8D: 'red',
        MANUAL_APQP: 'purple',
        MANUAL_OTHER: 'default'
    }

    // 表格列
    const columns = [
        { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo', width: 170, fixed: 'left' as const },
        { title: '优先级', dataIndex: 'priority', key: 'priority', width: 120 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
        { title: '来源', dataIndex: 'sourceType', key: 'sourceType', width: 100 },
        { title: '处理方式', dataIndex: 'processType', key: 'processType', width: 100 },
        { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 140 },
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '样品码', dataIndex: 'sampleCode', key: 'sampleCode', width: 170 },
        { title: '来源任务', dataIndex: 'sourceTaskNo', key: 'sourceTaskNo', width: 170, ellipsis: true },
        { title: '经办人', dataIndex: 'operatorName', key: 'operatorName', width: 90 },
        { title: '接收时间', dataIndex: 'receivedAt', key: 'receivedAt', width: 160 },
        { title: '操作', key: 'action', width: 200, fixed: 'right' as const }
    ]

    /** 加载数据 */
    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            // NOTE: 模拟数据，后续对接后端 API
            const now = dayjs()
            tableData.value = [
                {
                    id: '1', taskNo: 'LAB-20260303-0001', orgId: 'HFC_001', sourceType: 'IQC', sourceTaskNo: 'TSK-IQC-20260303001',
                    sourceBillNo: 'WMS-REC-20260303', inspItemCode: 'ITEM-G-HARDNESS', inspItemName: '洛氏硬度',
                    materialCode: 'M002', materialName: '压铸壳体A', batchNo: 'B20260303-01',
                    status: 'PENDING_RECEIVE', priority: 'URGENT', isUrgent: true, isOverdue: false,
                    createTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                    creator: 'system', updater: 'system'
                },
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
                }
            ] as LabTask[]

            pagination.total = tableData.value.length

            // 统计数据
            stats.pendingReceiveCount = tableData.value.filter(t => t.status === 'PENDING_RECEIVE').length
            stats.inProgressCount = tableData.value.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING_TEST').length
            stats.outsourcingCount = tableData.value.filter(t => t.status === 'OUTSOURCING').length
            stats.completedTodayCount = tableData.value.filter(t => t.status === 'COMPLETED').length
            stats.overdueCount = tableData.value.filter(t => t.isOverdue).length
            stats.monthlyPassRate = 92.3

            loading.value = false
        }, 500)
    }

    const handleSearch = () => {
        pagination.current = 1
        loadData()
    }

    const handleReset = () => {
        Object.assign(queryParams, {
            taskNo: undefined,
            sampleCode: undefined,
            sourceTaskNo: undefined,
            status: undefined,
            processType: undefined,
            priority: undefined,
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

    /** 手动创建任务 */
    const handleManualCreate = () => {
        Object.assign(createForm, {
            sourceType: 'MANUAL_8D',
            sourceBillNo: '',
            materialCode: '',
            batchNo: '',
            inspItemName: '',
            priority: 'NORMAL',
            remark: ''
        })
        createModalVisible.value = true
    }

    const handleCreateConfirm = () => {
        if (!createForm.materialCode || !createForm.batchNo || !createForm.inspItemName) {
            message.warning('请填写物料编码、批次号和检验项目')
            return
        }
        message.success('实验室检测任务创建成功！')
        createModalVisible.value = false
        loadData()
    }

    /** 接收样品 */
    const handleReceive = (record: LabTask) => {
        currentTask.value = record
        receiveModalVisible.value = true
    }

    const handleReceiveConfirm = () => {
        if (currentTask.value) {
            const now = dayjs()
            const seq = String(Math.floor(Math.random() * 9000) + 1000)
            const sampleCode = `SPL-${now.format('YYYYMMDD')}-${seq}`
            message.success(`样品接收成功！样品码: ${sampleCode}`)
        }
        receiveModalVisible.value = false
        loadData()
    }

    /** 委外检测 */
    const handleOutsource = (record: LabTask) => {
        currentTask.value = record
        Object.assign(outsourceForm, {
            externalOrgName: '',
            externalContact: '',
            externalQuotation: undefined,
            expectedDate: null
        })
        outsourceModalVisible.value = true
    }

    const handleOutsourceConfirm = () => {
        if (!outsourceForm.externalOrgName) {
            message.warning('请填写委外机构名称')
            return
        }
        message.success('委外申请已提交，系统已推送钉钉通知至采购部')
        outsourceModalVisible.value = false
        loadData()
    }

    /** 跳转执行页 */
    const handleExecute = (record: LabTask) => {
        router.push(`/production-quality/laboratory/lab-task-execution/${record.id}`)
    }

    /** 查看详情 */
    const handleView = (record: LabTask) => {
        router.push(`/production-quality/laboratory/lab-task-execution/${record.id}?mode=view`)
    }

    onMounted(() => {
        // 从 URL 查询参数初始化筛选条件（从菜单"实验室检测执行"入口自动带入 status=IN_PROGRESS）
        const urlStatus = route.query.status as string
        if (urlStatus) {
            queryParams.status = urlStatus as LabTaskStatus
        }
        loadData()
    })
</script>

<style scoped>
    .lab-task-board {
        padding: 16px;
        background: #f0f2f5;
        min-height: calc(100vh - 130px);
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