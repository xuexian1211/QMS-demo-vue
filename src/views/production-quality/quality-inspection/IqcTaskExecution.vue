<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <div class="page-header-bar">
            <div class="header-left">
                <a-button type="link" @click="goBack">
                    <template #icon>
                        <LeftOutlined />
                    </template>
                    返回列表
                </a-button>
                <a-divider type="vertical" />
                <h2 style="margin: 0;">IQC 检验执行</h2>
                <a-tag :color="getStatusColor(task.status)" style="margin-left: 12px;">
                    {{ getStatusText(task.status) }}
                </a-tag>
            </div>
            <div class="header-right">
                <a-button v-if="!isViewMode && task.status !== 'COMPLETED'" type="primary" @click="handleSubmit"
                    :loading="submitting">
                    提交检验结果
                </a-button>
            </div>
        </div>

        <!-- 任务基本信息 -->
        <a-card title="任务基本信息" class="info-card" :bordered="false">
            <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="任务编号">{{ task.taskNo }}</a-descriptions-item>
                <a-descriptions-item label="检验类型">
                    <a-tag color="processing">IQC 来料检验</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="优先级">
                    <a-tag :color="task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'orange' : 'blue'">
                        {{ task.priority === 'HIGH' ? '紧急(P5)' : task.priority === 'MEDIUM' ? '中(P10)' : '一般(P20)' }}
                    </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="物料编码">{{ task.materialCode }}</a-descriptions-item>
                <a-descriptions-item label="物料名称">{{ task.materialName }}</a-descriptions-item>
                <a-descriptions-item label="批次号">{{ task.batchNo }}</a-descriptions-item>
                <a-descriptions-item label="供应商">{{ task.supplierName }}</a-descriptions-item>
                <a-descriptions-item label="来源单号">{{ task.sourceBillNo }}</a-descriptions-item>
                <a-descriptions-item label="关联检验方案">
                    <a-tooltip :title="task.strategyName">
                        {{ task.schemeName }}
                        <a-tag v-if="task.isOverride" color="volcano" style="margin-left: 4px;">覆盖参数</a-tag>
                    </a-tooltip>
                </a-descriptions-item>
                <a-descriptions-item label="检验员">{{ task.inspector || '—' }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ task.createTime }}</a-descriptions-item>
                <a-descriptions-item label="AQL 水平">{{ task.aqlLevel }}</a-descriptions-item>
            </a-descriptions>
        </a-card>

        <!-- AQL 动态抽样信息卡片 -->
        <a-card class="aql-card" :bordered="false">
            <template #title>
                <span>📊 AQL 动态抽样判定标准</span>
            </template>
            <a-row :gutter="24">
                <a-col :span="6">
                    <a-statistic title="来料总数(N)" :value="task.quantity" suffix="件" />
                </a-col>
                <a-col :span="6">
                    <a-statistic title="抽样数(n)" :value="task.sampleQty" suffix="件"
                        :value-style="{ color: '#1890ff' }" />
                </a-col>
                <a-col :span="6">
                    <a-statistic title="允收数(Ac)" :value="task.acceptQty" :value-style="{ color: '#52c41a' }" />
                </a-col>
                <a-col :span="6">
                    <a-statistic title="拒收数(Re)" :value="task.rejectQty" :value-style="{ color: '#ff4d4f' }" />
                </a-col>
            </a-row>
        </a-card>

        <!-- 检验项目执行表 -->
        <a-card title="检验项目执行" class="inspection-card" :bordered="false">
            <template #extra>
                <a-space>
                    <span>合格项: <a-tag color="green">{{ passCount }}</a-tag></span>
                    <span>不合格项: <a-tag color="red">{{ failCount }}</a-tag></span>
                    <a-divider type="vertical" />
                    <span>实验室送检: <a-tag color="purple">{{ labCount }}</a-tag></span>
                </a-space>
            </template>

            <a-table :columns="inspColumns" :data-source="inspectionItems" :pagination="false" row-key="id" bordered
                size="middle" :row-class-name="getRowClassName">
                <template #bodyCell="{ column, record }">
                    <!-- 特性分类 (Major/CC/SC) -->
                    <template v-if="column.key === 'charClass'">
                        <a-tag v-if="record.charClass === 'CC'" color="red">
                            <strong>CC</strong> 关键
                        </a-tag>
                        <a-tag v-else-if="record.charClass === 'SC'" color="orange">
                            <strong>SC</strong> 重要
                        </a-tag>
                        <a-tag v-else-if="record.charClass === 'MAJOR'" color="volcano">
                            <strong>Major</strong>
                        </a-tag>
                        <a-tag v-else color="default">一般</a-tag>
                    </template>
                    <!-- 送检类型 -->
                    <template v-if="column.key === 'inspMode'">
                        <a-tag v-if="record.inspMode === 'LAB'" color="purple">🔬 实验室</a-tag>
                        <a-tag v-else color="cyan">现场</a-tag>
                    </template>
                    <!-- 数据类型 -->
                    <template v-if="column.key === 'dataType'">
                        <a-tag :color="record.dataType === 'QUANTITATIVE' ? 'geekblue' : 'purple'">
                            {{ record.dataType === 'QUANTITATIVE' ? '计量型' : '计数型' }}
                        </a-tag>
                    </template>
                    <!-- 标准规格 -->
                    <template v-if="column.key === 'spec'">
                        <template v-if="record.dataType === 'QUANTITATIVE'">
                            {{ record.targetValue }} {{ record.unit }}
                            <br />
                            <span style="color: #666; font-size: 12px;">
                                ({{ record.lowerLimit }} ~ {{ record.upperLimit }})
                            </span>
                            <a-tag v-if="record.isOverrideSpec" color="volcano"
                                style="margin-left: 4px; font-size: 10px;">已覆盖</a-tag>
                        </template>
                        <template v-else>
                            {{ record.standardDesc }}
                        </template>
                    </template>
                    <!-- 实测值输入 -->
                    <template v-if="column.key === 'measuredValue'">
                        <!-- 实验室送检项：等待结果 -->
                        <template v-if="record.inspMode === 'LAB' && record.labStatus !== 'COMPLETED'">
                            <a-tag color="processing">{{ record.labStatus === 'WAIT_LAB' ? '⏳ 等待实验室结果' : '已送检'
                                }}</a-tag>
                        </template>
                        <template v-else-if="record.dataType === 'QUANTITATIVE'">
                            <a-input-number v-model:value="record.measuredValue"
                                :disabled="isViewMode || task.status === 'COMPLETED'" placeholder="输入实测值"
                                style="width: 120px" :step="0.01" @change="() => handleMeasuredValueChange(record)" />
                        </template>
                        <template v-else>
                            <a-select v-model:value="record.measuredValue"
                                :disabled="isViewMode || task.status === 'COMPLETED'" placeholder="选择结果"
                                style="width: 120px" @change="() => handleCountResult(record)">
                                <a-select-option value="OK">OK (合格)</a-select-option>
                                <a-select-option value="NG">NG (不合格)</a-select-option>
                            </a-select>
                        </template>
                    </template>
                    <!-- 判定结果 -->
                    <template v-if="column.key === 'judgment'">
                        <a-tag v-if="record.judgment === 'PASS'" color="green">PASS</a-tag>
                        <a-tag v-else-if="record.judgment === 'FAIL'" color="red">FAIL</a-tag>
                        <a-tag v-else-if="record.labStatus === 'WAIT_LAB'" color="default">待定</a-tag>
                        <span v-else style="color: #999;">待判定</span>
                    </template>
                    <!-- 不良现象选择 -->
                    <template v-if="column.key === 'phenomenonCode'">
                        <a-select v-if="record.judgment === 'FAIL'" v-model:value="record.phenomenonCode"
                            :disabled="isViewMode || task.status === 'COMPLETED'" placeholder="请选择不良现象"
                            style="width: 170px" show-search :filter-option="filterPhenomenon">
                            <a-select-option v-for="p in defectPhenomena" :key="p.code" :value="p.code">
                                {{ p.code }} - {{ p.name }}
                                <a-tag v-if="p.isLocked" color="red"
                                    style="margin-left: 4px; font-size: 10px;">锁定</a-tag>
                            </a-select-option>
                        </a-select>
                        <span v-else style="color: #ccc;">—</span>
                    </template>
                </template>
            </a-table>
        </a-card>

        <!-- 整体判定结果面板 -->
        <a-card v-if="task.status === 'COMPLETED' || showResultPanel" title="检验结论" class="result-card"
            :bordered="false">
            <a-result :status="overallResult === 'QUALIFIED' ? 'success' : 'error'"
                :title="overallResult === 'QUALIFIED' ? '检验合格 — 库存已解锁' : '检验不合格 — 已触发 MRB'" :sub-title="overallResult === 'QUALIFIED'
          ? `全部 ${inspectionItems.length} 项通过，WMS 已接收合格放行信号`
          : `共 ${failCount} 项不合格，系统已自动生成 MRB 异常记录并锁定该批次物料`">
                <template #extra>
                    <a-space>
                        <a-button v-if="overallResult === 'UNQUALIFIED' && mrbRecordNo" type="primary" danger
                            @click="goToMrb">
                            查看 MRB 异常记录 ({{ mrbRecordNo }})
                        </a-button>
                        <a-button v-if="overallResult === 'QUALIFIED'" type="primary" disabled>
                            ✅ WMS 库存放行信号已发送
                        </a-button>
                    </a-space>
                </template>
            </a-result>

            <!-- WMS/SRM 联动日志 -->
            <a-card v-if="apiCallbackLogs.length > 0" title="系统联动日志" size="small" style="margin-top: 16px;">
                <a-timeline>
                    <a-timeline-item v-for="(log, idx) in apiCallbackLogs" :key="idx" :color="log.color">
                        <p><strong>{{ log.time }}</strong> — {{ log.message }}</p>
                    </a-timeline-item>
                </a-timeline>
            </a-card>
        </a-card>

        <!-- 提交确认模态 -->
        <a-modal v-model:open="confirmModalVisible" :title="overallResult === 'UNQUALIFIED' ? '⚠️ 检验不合格确认' : '✅ 检验合格确认'"
            @ok="confirmSubmit" @cancel="confirmModalVisible = false"
            :ok-button-props="{ danger: overallResult === 'UNQUALIFIED' }">
            <template v-if="overallResult === 'UNQUALIFIED'">
                <a-alert type="error" show-icon message="当前检验存在不合格项目"
                    :description="`共 ${failCount} 项未通过检验。提交后系统将：\n1. 自动生成 MRB（来料不合格品审理单）\n2. 推送通知到 SQE 待办\n3. 锁定该批次物料并要求贴红色不合格标识`"
                    style="margin-bottom: 16px;" />
                <!-- 锁定现象警告 -->
                <a-alert v-if="hasLockedPhenomenon" type="warning" show-icon message="⚠️ 存在致命缺陷(锁定现象)，系统将强制拦截！"
                    description="当前不合格项中包含已锁定为致命缺陷的不良现象，MRB 评审将自动升级至品质总监审批。" style="margin-bottom: 16px;" />
                <p>不合格项目：</p>
                <ul>
                    <li v-for="item in failItems" :key="item.id" style="color: #ff4d4f;">
                        <strong>[{{ item.charClass || '—' }}]</strong> {{ item.itemName }} — 不良现象: {{
                        getPhenomenonName(item.phenomenonCode) }}
                        <a-tag v-if="isPhenomenonLocked(item.phenomenonCode)" color="red" size="small">锁定</a-tag>
                    </li>
                </ul>
            </template>
            <template v-else>
                <a-alert type="success" show-icon message="全部检验项目合格"
                    description="提交后系统将：1. 标记任务完成 2. 向 WMS 发送库存放行信号 3. 更新供应商绩效合格率" />
            </template>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { LeftOutlined } from '@ant-design/icons-vue'
    import { message } from 'ant-design-vue'
    import dayjs from 'dayjs'

    const router = useRouter()
    const route = useRoute()
    const isViewMode = computed(() => route.query.mode === 'view')

    /** 检验执行明细行（含特性分类与实验室标记扩展） */
    interface InspectionItem {
        id: number
        itemCode: string
        itemName: string
        dataType: 'QUANTITATIVE' | 'COUNTING'
        /** 特性分类标识，用于引导检验员关注重点 */
        charClass?: 'CC' | 'SC' | 'MAJOR' | ''
        /** 检验模式：现场检验或实验室送检 */
        inspMode?: 'ONSITE' | 'LAB'
        labStatus?: 'WAIT_LAB' | 'COMPLETED'
        targetValue?: number
        upperLimit?: number
        lowerLimit?: number
        unit?: string
        /** 是否覆盖参数（来自计划的本地化微调） */
        isOverrideSpec?: boolean
        standardDesc?: string
        measuredValue?: number | string | null
        judgment?: 'PASS' | 'FAIL' | null
        phenomenonCode?: string
    }

    interface ApiCallbackLog {
        time: string
        message: string
        color: string
    }

    // 任务数据（含 AQL 及策略信息）
    const task = reactive({
        id: 0,
        taskNo: 'TSK-IQC-20260302001',
        inspType: 'IQC',
        materialCode: 'M001',
        materialName: '铝合金压铸件A',
        batchNo: 'B20260302-01',
        supplierCode: 'S01',
        supplierName: '精密铸造有限公司',
        sourceBillNo: 'WMS-REC-20260302001',
        schemeName: '铝合金件外观尺寸检验方案',
        strategyName: '新供应商前3批加严检验',
        aqlLevel: 'AQL 0.65 Level-II',
        isOverride: true,
        quantity: 500,
        sampleQty: 50,
        acceptQty: 1,
        rejectQty: 2,
        status: 'PENDING' as string,
        resultStatus: '' as string,
        priority: 'HIGH',
        inspector: '',
        orgId: 'HFC_001',
        createTime: '2026-03-02 08:30:00'
    })

    // 检验方案中锁定的检验项目（含特性分类与实验室标记）
    const inspectionItems = ref < InspectionItem[] > ([
        {
            id: 1, itemCode: 'DIM-001', itemName: '外径尺寸', dataType: 'QUANTITATIVE',
            charClass: 'CC', inspMode: 'ONSITE',
            targetValue: 50.0, upperLimit: 50.1, lowerLimit: 49.9, unit: 'mm', isOverrideSpec: false,
            measuredValue: null, judgment: null, phenomenonCode: undefined
        },
        {
            id: 2, itemCode: 'DIM-002', itemName: '内径尺寸', dataType: 'QUANTITATIVE',
            charClass: 'SC', inspMode: 'ONSITE',
            targetValue: 30.0, upperLimit: 30.05, lowerLimit: 29.95, unit: 'mm', isOverrideSpec: false,
            measuredValue: null, judgment: null, phenomenonCode: undefined
        },
        {
            id: 3, itemCode: 'DIM-003', itemName: '平面度', dataType: 'QUANTITATIVE',
            charClass: 'SC', inspMode: 'ONSITE',
            targetValue: 0.03, upperLimit: 0.03, lowerLimit: 0, unit: 'mm', isOverrideSpec: true,
            measuredValue: null, judgment: null, phenomenonCode: undefined
        },
        {
            id: 4, itemCode: 'SUR-001', itemName: '表面粗糙度 Ra', dataType: 'QUANTITATIVE',
            charClass: '', inspMode: 'ONSITE',
            targetValue: 1.6, upperLimit: 2.0, lowerLimit: 0, unit: 'μm', isOverrideSpec: false,
            measuredValue: null, judgment: null, phenomenonCode: undefined
        },
        {
            id: 5, itemCode: 'MAT-001', itemName: '硬度(HRC)', dataType: 'QUANTITATIVE',
            charClass: 'MAJOR', inspMode: 'LAB', labStatus: 'WAIT_LAB',
            targetValue: 45, upperLimit: 50, lowerLimit: 40, unit: 'HRC', isOverrideSpec: false,
            measuredValue: null, judgment: null, phenomenonCode: undefined
        },
        {
            id: 6, itemCode: 'VIS-001', itemName: '外观检查', dataType: 'COUNTING',
            charClass: 'CC', inspMode: 'ONSITE',
            standardDesc: '表面无裂纹、无缩孔、无毛刺',
            measuredValue: null, judgment: null, phenomenonCode: undefined
        },
        {
            id: 7, itemCode: 'VIS-002', itemName: '标识与包装', dataType: 'COUNTING',
            charClass: '', inspMode: 'ONSITE',
            standardDesc: '产品标识正确、包装完好无损',
            measuredValue: null, judgment: null, phenomenonCode: undefined
        }
    ])

    // 不良现象数据字典（含"锁定"标识：锁定现象将强制拦截全单）
    const defectPhenomena = ref([
        { code: 'DP-001', name: '尺寸超差', isLocked: false },
        { code: 'DP-002', name: '表面裂纹', isLocked: true },
        { code: 'DP-003', name: '缩孔/气孔', isLocked: true },
        { code: 'DP-004', name: '毛刺', isLocked: false },
        { code: 'DP-005', name: '变形', isLocked: false },
        { code: 'DP-006', name: '表面划伤', isLocked: false },
        { code: 'DP-007', name: '表面粗糙度不合格', isLocked: false },
        { code: 'DP-008', name: '标识错误', isLocked: false },
        { code: 'DP-009', name: '包装破损', isLocked: false },
        { code: 'DP-010', name: '硬度不合格', isLocked: true },
        { code: 'DP-011', name: '平面度超差', isLocked: false }
    ])

    const submitting = ref(false)
    const confirmModalVisible = ref(false)
    const showResultPanel = ref(false)
    const mrbRecordNo = ref('')
    const apiCallbackLogs = ref < ApiCallbackLog[] > ([])

    // 检验项目表格列（增加特性分类与送检类型）
    const inspColumns = [
        { title: '#', key: 'index', width: 45, customRender: ({ index }: any) => index + 1 },
        { title: '特性', key: 'charClass', width: 90 },
        { title: '编码', dataIndex: 'itemCode', key: 'itemCode', width: 90 },
        { title: '检验项名称', dataIndex: 'itemName', key: 'itemName', width: 130 },
        { title: '送检', key: 'inspMode', width: 80 },
        { title: '类型', key: 'dataType', width: 80 },
        { title: '标准规格', key: 'spec', width: 190 },
        { title: '实测值/结果', key: 'measuredValue', width: 160 },
        { title: '判定', key: 'judgment', width: 70 },
        { title: '不良现象', key: 'phenomenonCode', width: 200 }
    ]

    // 统计
    const passCount = computed(() => inspectionItems.value.filter(i => i.judgment === 'PASS').length)
    const failCount = computed(() => inspectionItems.value.filter(i => i.judgment === 'FAIL').length)
    const labCount = computed(() => inspectionItems.value.filter(i => i.inspMode === 'LAB').length)
    const failItems = computed(() => inspectionItems.value.filter(i => i.judgment === 'FAIL'))
    const overallResult = computed(() => {
        if (failCount.value > 0) return 'UNQUALIFIED'
        // NOTE: 排除等待实验室结果的项目判定
        const pendingLab = inspectionItems.value.filter(i => i.inspMode === 'LAB' && i.labStatus === 'WAIT_LAB')
        const judgedItems = inspectionItems.value.filter(i => !(i.inspMode === 'LAB' && i.labStatus === 'WAIT_LAB'))
        if (judgedItems.length > 0 && judgedItems.every(i => i.judgment === 'PASS') && pendingLab.length === 0) return 'QUALIFIED'
        if (judgedItems.length > 0 && judgedItems.every(i => i.judgment === 'PASS') && pendingLab.length > 0) return 'PARTIAL'
        return ''
    })

    /** 判断是否存在"锁定"不良现象 */
    const hasLockedPhenomenon = computed(() => {
        return failItems.value.some(item => isPhenomenonLocked(item.phenomenonCode))
    })

    const isPhenomenonLocked = (code: string | undefined) => {
        if (!code) return false
        return defectPhenomena.value.find(p => p.code === code)?.isLocked === true
    }

    /**
     * 自动判定逻辑：计量型数据
     * 比较实测值是否在规格上下限范围内
     */
    const handleMeasuredValueChange = (record: InspectionItem) => {
        if (record.measuredValue === null || record.measuredValue === undefined) {
            record.judgment = null
            record.phenomenonCode = undefined
            return
        }
        const val = Number(record.measuredValue)
        if (val >= (record.lowerLimit ?? -Infinity) && val <= (record.upperLimit ?? Infinity)) {
            record.judgment = 'PASS'
            record.phenomenonCode = undefined
        } else {
            record.judgment = 'FAIL'
        }
    }

    /** 计数型判定 */
    const handleCountResult = (record: InspectionItem) => {
        if (record.measuredValue === 'OK') {
            record.judgment = 'PASS'
            record.phenomenonCode = undefined
        } else if (record.measuredValue === 'NG') {
            record.judgment = 'FAIL'
        } else {
            record.judgment = null
        }
    }

    /** 行样式控制（带特性分类高亮） */
    const getRowClassName = (record: InspectionItem) => {
        if (record.judgment === 'FAIL') return 'row-fail'
        if (record.judgment === 'PASS') return 'row-pass'
        if (record.charClass === 'CC' || record.charClass === 'SC') return 'row-critical'
        return ''
    }

    /** 提交检验结果 */
    const handleSubmit = () => {
        // 排除实验室等待项
        const checkableItems = inspectionItems.value.filter(i => !(i.inspMode === 'LAB' && i.labStatus === 'WAIT_LAB'))
        const unfilled = checkableItems.filter(i => i.judgment === null)
        if (unfilled.length > 0) {
            message.warning(`还有 ${unfilled.length} 项未填写检验结果，请完成后提交。`)
            return
        }
        const missingPhenomenon = checkableItems.filter(i => i.judgment === 'FAIL' && !i.phenomenonCode)
        if (missingPhenomenon.length > 0) {
            message.warning(`有 ${missingPhenomenon.length} 项不合格项目未选择不良现象，请补充后提交。`)
            return
        }
        // NOTE: 对锁定现象进行强制拦截提示
        if (hasLockedPhenomenon.value) {
            message.error('⚠️ 存在致命缺陷(锁定现象)！提交后将强制进入高级别 MRB 审批流程。')
        }
        confirmModalVisible.value = true
    }

    /** 确认提交 */
    const confirmSubmit = () => {
        submitting.value = true
        confirmModalVisible.value = false
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

        setTimeout(() => {
            task.status = 'COMPLETED'
            task.resultStatus = overallResult.value === 'QUALIFIED' ? 'QUALIFIED' : 'UNQUALIFIED'
            showResultPanel.value = true

            if (task.resultStatus === 'UNQUALIFIED') {
                mrbRecordNo.value = `MRB-${task.taskNo.replace('TSK-IQC-', '')}`
                apiCallbackLogs.value = [
                    { time: now, message: `检验结果提交：${failCount.value} 项不合格，整体判定 UNQUALIFIED`, color: 'red' },
                    { time: now, message: `📄 自动生成 MRB 异常审理单 ${mrbRecordNo.value}`, color: 'red' },
                    { time: now, message: `🔔 站内信已推送至 SQE (品质工程师) 待办列表`, color: 'orange' },
                    { time: now, message: `🏷️ 物料标识指令：要求在 ${task.batchNo} 批次实物上粘贴 🔴红色不合格标签`, color: 'red' },
                    { time: now, message: `📊 供应商 ${task.supplierName} 绩效已更新: 本批次记录不合格`, color: 'orange' }
                ]
                message.warning('检验不合格，已自动生成 MRB 异常处理记录')
            } else {
                apiCallbackLogs.value = [
                    { time: now, message: `检验结果提交：全部合格，整体判定 QUALIFIED`, color: 'green' },
                    { time: now, message: `📦 已向 WMS 发送库存放行信号 (WebHook: /api/wms/release-stock)`, color: 'green' },
                    { time: now, message: `✅ WMS 已确认：批次 ${task.batchNo} 上架解锁完成`, color: 'green' },
                    { time: now, message: `📊 供应商 ${task.supplierName} 绩效已更新: 本批次记录合格`, color: 'green' }
                ]
                message.success('检验合格，库存已解锁放行')
            }

            // 模拟实验室送检自动建单
            const labItems = inspectionItems.value.filter(i => i.inspMode === 'LAB')
            if (labItems.length > 0) {
                apiCallbackLogs.value.push({
                    time: now,
                    message: `🔬 已生成 ${labItems.length} 条实验室检测任务 (关联源 IQC 单号: ${task.taskNo})`,
                    color: 'purple'
                })
            }

            submitting.value = false
        }, 800)
    }

    const getPhenomenonName = (code: string | undefined) => {
        if (!code) return '—'
        return defectPhenomena.value.find(p => p.code === code)?.name || code
    }

    const filterPhenomenon = (input: string, option: any) => {
        return option.children?.[0]?.children?.toLowerCase().includes(input.toLowerCase())
    }

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = { PENDING: 'orange', IN_PROGRESS: 'blue', COMPLETED: 'green' }
        return map[status] || 'default'
    }
    const getStatusText = (status: string) => {
        const map: Record<string, string> = { PENDING: '待检验', IN_PROGRESS: '检验中', COMPLETED: '已完成' }
        return map[status] || status
    }

    const goBack = () => router.push('/production-quality/quality-inspection/iqc-task-list')
    const goToMrb = () => router.push('/production-quality/exception-handling/mrb-records')

    onMounted(() => {
        const taskId = route.params.id
        if (taskId) task.id = Number(taskId)
        if (task.status === 'PENDING') {
            task.status = 'IN_PROGRESS'
            task.inspector = localStorage.getItem('username') || '管理员'
        }
    })
</script>

<style scoped>
    .page-container {
        padding: 24px;
    }

    .page-header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        background: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .header-left {
        display: flex;
        align-items: center;
    }

    .info-card {
        margin-bottom: 20px;
        border-radius: 8px;
    }

    .aql-card {
        margin-bottom: 20px;
        border-radius: 8px;
        background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
    }

    .inspection-card {
        margin-bottom: 20px;
        border-radius: 8px;
    }

    .result-card {
        margin-bottom: 20px;
        border-radius: 8px;
    }

    /* 特性行高亮 */
    :deep(.row-critical) {
        background-color: #fffbe6 !important;
    }

    :deep(.row-fail) {
        background-color: #fff2f0 !important;
    }

    :deep(.row-pass) {
        background-color: #f6ffed !important;
    }

    :deep(.row-fail:hover > td) {
        background-color: #ffccc7 !important;
    }

    :deep(.row-pass:hover > td) {
        background-color: #d9f7be !important;
    }

    :deep(.row-critical:hover > td) {
        background-color: #fff1b8 !important;
    }
</style>