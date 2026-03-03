<template>
    <div class="page-container">
        <div class="page-header">
            <h1>MRB 来料不合格品审理</h1>
            <a-tooltip title="IQC 不合格自动生单，SQE 评审处理">
                <a-tag color="red">异常闭环管理</a-tag>
            </a-tooltip>
        </div>

        <!-- 统计看板 -->
        <div class="stats-row">
            <a-row :gutter="16">
                <a-col :span="6">
                    <a-card class="stat-card stat-total" hoverable>
                        <a-statistic title="全部记录" :value="stats.total" :value-style="{ color: '#1890ff' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-draft" hoverable>
                        <a-statistic title="待处理(含隔离)" :value="stats.draft" :value-style="{ color: '#faad14' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-review" hoverable>
                        <a-statistic title="评审中(会签)" :value="stats.underReview" :value-style="{ color: '#1890ff' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-closed" hoverable>
                        <a-statistic title="已结案" :value="stats.closed" :value-style="{ color: '#52c41a' }" />
                    </a-card>
                </a-col>
            </a-row>
        </div>

        <!-- 搜索表单 -->
        <div class="search-form">
            <a-form layout="inline" :model="searchForm">
                <a-form-item label="审理单号">
                    <a-input v-model:value="searchForm.recordNo" placeholder="请输入单号" allow-clear />
                </a-form-item>
                <a-form-item label="物料编码">
                    <a-input v-model:value="searchForm.materialCode" placeholder="请输入物料编码" allow-clear />
                </a-form-item>
                <a-form-item label="供应商">
                    <a-input v-model:value="searchForm.supplierName" placeholder="请输入供应商" allow-clear />
                </a-form-item>
                <a-form-item label="评审状态">
                    <a-select v-model:value="searchForm.reviewStatus" placeholder="全部状态" style="width: 130px"
                        allow-clear :options="[
            { value: 'DRAFT', label: '草稿/隔离' },
            { value: 'UNDER_REVIEW', label: '评审中' },
            { value: 'APPROVED', label: '已批准' },
            { value: 'CLOSED', label: '已结案' }
          ]" />
                </a-form-item>
                <a-form-item label="风险等级">
                    <a-select v-model:value="searchForm.riskLevel" placeholder="全部等级" style="width: 120px" allow-clear
                        :options="[
            { value: 'CRITICAL', label: '致命' },
            { value: 'MAJOR', label: '严重' },
            { value: 'MINOR', label: '轻微' }
          ]" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                    <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
                </a-form-item>
            </a-form>
        </div>

        <!-- 数据表格 -->
        <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" :loading="loading" row-key="id"
            :scroll="{ x: 1800 }" @change="handleTableChange">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'reviewStatus'">
                    <a-tag :color="getReviewStatusColor(record.reviewStatus)">
                        {{ getReviewStatusText(record.reviewStatus) }}
                    </a-tag>
                </template>
                <template v-if="column.key === 'riskLevel'">
                    <a-tag
                        :color="record.riskLevel === 'CRITICAL' ? 'red' : record.riskLevel === 'MAJOR' ? 'orange' : 'green'">
                        {{ record.riskLevel === 'CRITICAL' ? '致命' : record.riskLevel === 'MAJOR' ? '严重' : '轻微' }}
                    </a-tag>
                </template>
                <template v-if="column.key === 'disposition'">
                    <a-tag v-if="record.disposition" :color="getDispositionColor(record.disposition)">
                        {{ getDispositionText(record.disposition) }}
                    </a-tag>
                    <span v-else style="color: #999;">待定</span>
                </template>
                <template v-if="column.key === 'isolationTag'">
                    <a-tag v-if="record.isolationTag === 'RED'" color="red">🔴 不合格</a-tag>
                    <a-tag v-else-if="record.isolationTag === 'YELLOW'" color="orange">🟡 可疑品</a-tag>
                    <span v-else>—</span>
                </template>
                <template v-if="column.key === 'has8d'">
                    <a-tag v-if="record.has8d" color="blue">已关联</a-tag>
                    <span v-else style="color: #ccc;">—</span>
                </template>
                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button v-if="record.reviewStatus === 'DRAFT' || record.reviewStatus === 'UNDER_REVIEW'"
                            type="primary" size="small" @click="openProcess(record)">处理</a-button>
                        <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
                    </a-space>
                </template>
            </template>
        </a-table>

        <!-- 处理 Drawer -->
        <a-drawer v-model:open="drawerVisible" title="MRB 来料不合格品审理" width="780">
            <template v-if="currentRecord">
                <!-- 基本信息 -->
                <a-descriptions title="异常信息" :column="2" bordered size="small" style="margin-bottom: 24px;">
                    <a-descriptions-item label="审理单号">{{ currentRecord.recordNo }}</a-descriptions-item>
                    <a-descriptions-item label="关联IQC任务">{{ currentRecord.taskNo }}</a-descriptions-item>
                    <a-descriptions-item label="物料编码">{{ currentRecord.materialCode }}</a-descriptions-item>
                    <a-descriptions-item label="物料名称">{{ currentRecord.materialName }}</a-descriptions-item>
                    <a-descriptions-item label="批次号">{{ currentRecord.batchNo }}</a-descriptions-item>
                    <a-descriptions-item label="供应商">{{ currentRecord.supplierName }}</a-descriptions-item>
                    <a-descriptions-item label="不良数量">
                        <span style="color: #ff4d4f; font-weight: bold;">{{ currentRecord.defectQty }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="风险等级">
                        <a-tag
                            :color="currentRecord.riskLevel === 'CRITICAL' ? 'red' : currentRecord.riskLevel === 'MAJOR' ? 'orange' : 'green'">
                            {{ currentRecord.riskLevel === 'CRITICAL' ? '致命' : currentRecord.riskLevel === 'MAJOR' ?
                            '严重' : '轻微' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="隔离标识">
                        <a-tag v-if="currentRecord.isolationTag === 'RED'" color="red">🔴 红色不合格标签</a-tag>
                        <a-tag v-else-if="currentRecord.isolationTag === 'YELLOW'" color="orange">🟡 黄色可疑品标签</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="当前状态">
                        <a-tag :color="getReviewStatusColor(currentRecord.reviewStatus)">
                            {{ getReviewStatusText(currentRecord.reviewStatus) }}
                        </a-tag>
                    </a-descriptions-item>
                </a-descriptions>

                <!-- 不良项目明细 -->
                <a-card title="不良项目明细" size="small" style="margin-bottom: 24px;">
                    <a-table :columns="defectColumns" :data-source="currentRecord.defectDetails" :pagination="false"
                        size="small" bordered>
                        <template #bodyCell="{ column, record: det }">
                            <template v-if="column.key === 'severity'">
                                <a-tag
                                    :color="det.severity === 'CR' ? 'red' : det.severity === 'MA' ? 'orange' : 'green'">
                                    {{ det.severity }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'isLocked'">
                                <a-tag v-if="det.isLocked" color="red">⛔ 锁定</a-tag>
                                <span v-else>—</span>
                            </template>
                        </template>
                    </a-table>
                </a-card>

                <!-- 会签评审区域 -->
                <a-card v-if="currentRecord.reviewStatus === 'UNDER_REVIEW'" title="📋 多部门会签评审" size="small"
                    style="margin-bottom: 24px;">
                    <a-alert type="info" show-icon message="会签流程进行中" description="系统已通过钉钉接口推送审批任务给以下部门评审人。"
                        style="margin-bottom: 12px;" />
                    <a-table :columns="signoffColumns" :data-source="currentRecord.signoffList" :pagination="false"
                        size="small" bordered>
                        <template #bodyCell="{ column, record: so }">
                            <template v-if="column.key === 'signoffStatus'">
                                <a-tag
                                    :color="so.status === 'APPROVED' ? 'green' : so.status === 'PENDING' ? 'orange' : 'red'">
                                    {{ so.status === 'APPROVED' ? '已同意' : so.status === 'PENDING' ? '待审批' : '已拒绝' }}
                                </a-tag>
                            </template>
                        </template>
                    </a-table>
                </a-card>

                <!-- 处置表单 -->
                <a-card title="处置决定" size="small" style="margin-bottom: 24px;">
                    <a-form :model="processForm" layout="vertical">
                        <a-form-item label="处理对策" required>
                            <a-select v-model:value="processForm.disposition" placeholder="请选择处理对策"
                                :disabled="isFormDisabled">
                                <a-select-option value="RETURN">退货 (RTV)</a-select-option>
                                <a-select-option value="REWORK">挑选/返修 (REWORK)</a-select-option>
                                <a-select-option value="CONCESSION">让步接收-特采 (CONCESSION)</a-select-option>
                                <a-select-option value="DISCARD">报废 (DISCARD)</a-select-option>
                            </a-select>
                        </a-form-item>

                        <!-- 退货 RTV 特有字段 -->
                        <template v-if="processForm.disposition === 'RETURN'">
                            <a-alert type="info" show-icon message="退货将调用 WMS 接口更新不合格数，采购执行退货，信号同步到 ERP 冲抵应付。"
                                style="margin-bottom: 12px;" />
                        </template>

                        <!-- 返修/挑选特有字段 -->
                        <template v-if="processForm.disposition === 'REWORK'">
                            <a-row :gutter="16">
                                <a-col :span="12">
                                    <a-form-item label="挑选工时(h)">
                                        <a-input-number v-model:value="processForm.reworkHours" :min="0"
                                            style="width: 100%;" placeholder="工时" :disabled="isFormDisabled" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="辅料成本(¥)">
                                        <a-input-number v-model:value="processForm.reworkMaterialCost" :min="0"
                                            style="width: 100%;" placeholder="预估辅料成本" :disabled="isFormDisabled" />
                                    </a-form-item>
                                </a-col>
                            </a-row>
                            <a-alert type="warning" show-icon message="挑选/返修产生的工时及辅料成本将自动计入「内部故障成本」(COQ)"
                                style="margin-bottom: 12px;" />
                        </template>

                        <!-- 让步接收/特采特有字段 -->
                        <template v-if="processForm.disposition === 'CONCESSION'">
                            <a-form-item label="偏离申请单编号 (必填)">
                                <a-input v-model:value="processForm.deviationNo" placeholder="请输入关联的偏离申请单编号"
                                    :disabled="isFormDisabled" />
                            </a-form-item>
                            <a-form-item label="降价损失估算(¥)">
                                <a-input-number v-model:value="processForm.concessionCost" :min="0" style="width: 100%;"
                                    placeholder="因让步接收产生的降价损失" :disabled="isFormDisabled" />
                            </a-form-item>
                            <a-alert type="warning" show-icon message="让步接收必须关联《偏离申请单》，实物需加贴让步标识。降价损失将计入「外部故障成本」(COQ)。"
                                style="margin-bottom: 12px;" />
                        </template>

                        <a-form-item label="根本原因分析" required>
                            <a-select v-model:value="processForm.causeCode" placeholder="请选择根本原因分类"
                                :disabled="isFormDisabled">
                                <a-select-option value="CAU-001">来料公差/规格偏差</a-select-option>
                                <a-select-option value="CAU-002">供应商工艺不稳定</a-select-option>
                                <a-select-option value="CAU-003">运输途中损坏</a-select-option>
                                <a-select-option value="CAU-004">原材料批次异常</a-select-option>
                                <a-select-option value="CAU-005">模具/工装问题</a-select-option>
                                <a-select-option value="CAU-006">检测仪器偏差</a-select-option>
                            </a-select>
                        </a-form-item>
                        <a-form-item label="详细原因说明">
                            <a-textarea v-model:value="processForm.rootCauseDesc" :rows="3" placeholder="请详细描述根本原因"
                                :disabled="isFormDisabled" />
                        </a-form-item>
                        <a-form-item label="纠正措施">
                            <a-textarea v-model:value="processForm.correctiveAction" :rows="3" placeholder="请描述后续纠正措施"
                                :disabled="isFormDisabled" />
                        </a-form-item>
                    </a-form>
                </a-card>

                <!-- 8D 触发与知识沉淀 (结案前) -->
                <a-card v-if="currentRecord.reviewStatus === 'APPROVED'" title="🔒 结案前确认" size="small"
                    style="margin-bottom: 24px;">
                    <a-alert v-if="currentRecord.requireForce8d" type="error" show-icon
                        message="⚠️ 系统检测到该供应商连续出现同类不良，强制要求关联 8D 整改报告后方可结案！" style="margin-bottom: 16px;" />
                    <a-form layout="vertical">
                        <a-form-item>
                            <a-checkbox v-model:checked="closeFlags.trigger8d" :disabled="currentRecord.requireForce8d">
                                <strong>触发供应商 8D 整改要求</strong>
                                <span v-if="currentRecord.requireForce8d"
                                    style="color: red; margin-left: 8px;">（强制）</span>
                            </a-checkbox>
                        </a-form-item>
                        <a-form-item v-if="closeFlags.trigger8d || currentRecord.requireForce8d">
                            <a-input v-model:value="closeFlags.reportNo8d" placeholder="请输入 8D 报告编号 (如已有)" />
                        </a-form-item>
                        <a-divider />
                        <a-form-item>
                            <a-checkbox-group v-model:value="closeFlags.knowledgeUpdates">
                                <a-row :gutter="[0, 8]">
                                    <a-col :span="12"><a-checkbox value="UPDATE_FMEA">📝 更新 FMEA
                                            失效模式</a-checkbox></a-col>
                                    <a-col :span="12"><a-checkbox value="UPDATE_SCHEME">📋
                                            更新检验方案/控制计划</a-checkbox></a-col>
                                    <a-col :span="12"><a-checkbox value="UPDATE_EXPERIENCE">📚
                                            录入质量经验库</a-checkbox></a-col>
                                    <a-col :span="12"><a-checkbox value="NOTIFY_SUPPLIER">📧
                                            通知供应商整改</a-checkbox></a-col>
                                </a-row>
                            </a-checkbox-group>
                        </a-form-item>
                    </a-form>
                </a-card>

                <!-- 状态流转按钮 -->
                <div class="status-actions">
                    <a-space>
                        <a-button v-if="currentRecord.reviewStatus === 'DRAFT'" type="primary"
                            @click="submitForReview">提交评审(会签)</a-button>
                        <a-button v-if="currentRecord.reviewStatus === 'UNDER_REVIEW'" type="primary"
                            @click="approveRecord" style="background: #52c41a; border-color: #52c41a;">评审通过</a-button>
                        <a-button v-if="currentRecord.reviewStatus === 'APPROVED'" type="primary"
                            @click="closeRecord">结案归档</a-button>
                    </a-space>
                </div>
            </template>
        </a-drawer>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'

    const router = useRouter()

    interface DefectDetail {
        itemName: string
        phenomenonName: string
        severity: 'CR' | 'MA' | 'MI'
        isLocked?: boolean
    }

    interface SignoffItem {
        dept: string
        reviewer: string
        status: 'PENDING' | 'APPROVED' | 'REJECTED'
        opinion?: string
    }

    interface MrbRecord {
        id: number
        recordNo: string
        taskNo: string
        materialCode: string
        materialName: string
        batchNo: string
        supplierCode: string
        supplierName: string
        defectQty: number
        riskLevel: 'CRITICAL' | 'MAJOR' | 'MINOR'
        isolationTag: 'RED' | 'YELLOW'
        reviewStatus: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'CLOSED'
        disposition?: string
        causeCode?: string
        rootCauseDesc?: string
        correctiveAction?: string
        has8d?: boolean
        requireForce8d?: boolean
        createTime: string
        defectDetails: DefectDetail[]
        signoffList?: SignoffItem[]
    }

    const searchForm = reactive({
        recordNo: '',
        materialCode: '',
        supplierName: '',
        reviewStatus: undefined as string | undefined,
        riskLevel: undefined as string | undefined
    })

    const loading = ref(false)
    const pagination = reactive({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条数据`
    })

    const drawerVisible = ref(false)
    const currentRecord = ref < MrbRecord | null > (null)
    const processForm = reactive({
        disposition: undefined as string | undefined,
        causeCode: undefined as string | undefined,
        rootCauseDesc: '',
        correctiveAction: '',
        reworkHours: undefined as number | undefined,
        reworkMaterialCost: undefined as number | undefined,
        deviationNo: '',
        concessionCost: undefined as number | undefined
    })

    const closeFlags = reactive({
        trigger8d: false,
        reportNo8d: '',
        knowledgeUpdates: [] as string[]
    })

    const isFormDisabled = computed(() => {
        if (!currentRecord.value) return true
        return currentRecord.value.reviewStatus === 'APPROVED' || currentRecord.value.reviewStatus === 'CLOSED'
    })

    const columns = [
        { title: '审理单号', dataIndex: 'recordNo', key: 'recordNo', width: 180 },
        { title: '关联IQC任务', dataIndex: 'taskNo', key: 'taskNo', width: 180 },
        { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 100 },
        { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 130, ellipsis: true },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 130 },
        { title: '供应商', dataIndex: 'supplierName', key: 'supplierName', width: 120 },
        { title: '不良数', dataIndex: 'defectQty', key: 'defectQty', width: 70 },
        { title: '风险等级', key: 'riskLevel', width: 90 },
        { title: '隔离标识', key: 'isolationTag', width: 100 },
        { title: '评审状态', key: 'reviewStatus', width: 100 },
        { title: '处理对策', key: 'disposition', width: 110 },
        { title: '8D', key: 'has8d', width: 80 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 155 },
        { title: '操作', key: 'action', width: 130, fixed: 'right' as const }
    ]

    const defectColumns = [
        { title: '检验项目', dataIndex: 'itemName', key: 'itemName' },
        { title: '不良现象', dataIndex: 'phenomenonName', key: 'phenomenonName' },
        { title: '严重等级', key: 'severity', width: 100 },
        { title: '锁定', key: 'isLocked', width: 80 }
    ]

    const signoffColumns = [
        { title: '部门', dataIndex: 'dept', key: 'dept' },
        { title: '评审人', dataIndex: 'reviewer', key: 'reviewer' },
        { title: '审批状态', key: 'signoffStatus', width: 100 },
        { title: '意见', dataIndex: 'opinion', key: 'opinion' }
    ]

    // 模拟数据（含风险定级、隔离标识、会签记录）
    const dataSource = ref < MrbRecord[] > ([
        {
            id: 1, recordNo: 'MRB-20260302001', taskNo: 'TSK-IQC-20260301002',
            materialCode: 'M004', materialName: '塑料壳体D', batchNo: 'B20260301-02',
            supplierCode: 'S04', supplierName: '注塑加工厂', defectQty: 5,
            riskLevel: 'MAJOR', isolationTag: 'RED',
            reviewStatus: 'DRAFT', createTime: '2026-03-01 16:30:00',
            defectDetails: [
                { itemName: '外径尺寸', phenomenonName: '尺寸超差', severity: 'MA', isLocked: false },
                { itemName: '外观检查', phenomenonName: '表面裂纹', severity: 'CR', isLocked: true }
            ]
        },
        {
            id: 2, recordNo: 'MRB-20260228001', taskNo: 'TSK-IQC-20260228003',
            materialCode: 'M005', materialName: '连接器端子E', batchNo: 'B20260228-03',
            supplierCode: 'S05', supplierName: '电子元器件厂', defectQty: 12,
            riskLevel: 'CRITICAL', isolationTag: 'RED',
            reviewStatus: 'UNDER_REVIEW', disposition: 'RETURN',
            causeCode: 'CAU-002', rootCauseDesc: '供应商注塑工艺参数偏移导致尺寸偏差',
            createTime: '2026-02-28 14:20:00',
            defectDetails: [
                { itemName: '插拔力', phenomenonName: '插拔力不合格', severity: 'CR', isLocked: true },
                { itemName: '绝缘电阻', phenomenonName: '绝缘电阻不达标', severity: 'MA', isLocked: false }
            ],
            signoffList: [
                { dept: '质量部(SQE)', reviewer: '张工', status: 'APPROVED', opinion: '建议退货' },
                { dept: '技术部', reviewer: '李工', status: 'APPROVED', opinion: '同意退货' },
                { dept: '采购部', reviewer: '王经理', status: 'PENDING' },
                { dept: '生产部', reviewer: '赵主管', status: 'PENDING' }
            ]
        },
        {
            id: 3, recordNo: 'MRB-20260225001', taskNo: 'TSK-IQC-20260225001',
            materialCode: 'M006', materialName: '密封圈F', batchNo: 'B20260225-01',
            supplierCode: 'S02', supplierName: '橡胶密封件厂', defectQty: 3,
            riskLevel: 'MINOR', isolationTag: 'YELLOW',
            reviewStatus: 'APPROVED', disposition: 'CONCESSION',
            causeCode: 'CAU-001', rootCauseDesc: '来料公差在可接受工程范围内',
            correctiveAction: '已通知供应商调整模具参数，下一批次加严检验',
            requireForce8d: false,
            createTime: '2026-02-25 10:00:00',
            defectDetails: [
                { itemName: '硬度', phenomenonName: '硬度偏低', severity: 'MI', isLocked: false }
            ]
        },
        {
            id: 4, recordNo: 'MRB-20260220001', taskNo: 'TSK-IQC-20260220001',
            materialCode: 'M007', materialName: '铸铁支架G', batchNo: 'B20260220-01',
            supplierCode: 'S06', supplierName: '铸造厂A', defectQty: 8,
            riskLevel: 'MAJOR', isolationTag: 'RED',
            reviewStatus: 'CLOSED', disposition: 'RETURN', has8d: true,
            causeCode: 'CAU-005', rootCauseDesc: '模具老化导致铸件尺寸漂移',
            correctiveAction: '供应商已更换模具并提供首件确认报告',
            createTime: '2026-02-20 09:00:00',
            defectDetails: [
                { itemName: '孔径', phenomenonName: '尺寸超差', severity: 'MA', isLocked: false },
                { itemName: '表面', phenomenonName: '缩孔/气孔', severity: 'CR', isLocked: true }
            ]
        },
        {
            id: 5, recordNo: 'MRB-20260302002', taskNo: 'TSK-IQC-20260302001',
            materialCode: 'M001', materialName: '铝合金压铸件A', batchNo: 'B20260302-01',
            supplierCode: 'S01', supplierName: '精密铸造有限公司', defectQty: 3,
            riskLevel: 'MAJOR', isolationTag: 'RED',
            reviewStatus: 'DRAFT', requireForce8d: true,
            createTime: '2026-03-02 12:00:00',
            defectDetails: [
                { itemName: '平面度', phenomenonName: '平面度超差', severity: 'MA', isLocked: false },
                { itemName: '外观检查', phenomenonName: '表面裂纹', severity: 'CR', isLocked: true }
            ]
        }
    ])

    const stats = computed(() => ({
        total: dataSource.value.length,
        draft: dataSource.value.filter(d => d.reviewStatus === 'DRAFT').length,
        underReview: dataSource.value.filter(d => d.reviewStatus === 'UNDER_REVIEW').length,
        closed: dataSource.value.filter(d => d.reviewStatus === 'CLOSED').length
    }))

    const filteredData = computed(() => {
        let result = dataSource.value
        if (searchForm.recordNo) result = result.filter(d => d.recordNo.includes(searchForm.recordNo))
        if (searchForm.materialCode) result = result.filter(d => d.materialCode.includes(searchForm.materialCode))
        if (searchForm.supplierName) result = result.filter(d => d.supplierName.includes(searchForm.supplierName))
        if (searchForm.reviewStatus) result = result.filter(d => d.reviewStatus === searchForm.reviewStatus)
        if (searchForm.riskLevel) result = result.filter(d => d.riskLevel === searchForm.riskLevel)
        pagination.total = result.length
        return result
    })

    const getReviewStatusColor = (status: string) => {
        const map: Record<string, string> = { DRAFT: 'orange', UNDER_REVIEW: 'processing', APPROVED: 'green', CLOSED: 'default' }
        return map[status] || 'default'
    }
    const getReviewStatusText = (status: string) => {
        const map: Record<string, string> = { DRAFT: '草稿/隔离', UNDER_REVIEW: '评审中(会签)', APPROVED: '已批准', CLOSED: '已结案' }
        return map[status] || status
    }
    const getDispositionColor = (d: string) => {
        const map: Record<string, string> = { RETURN: 'red', REWORK: 'orange', CONCESSION: 'blue', DISCARD: 'default' }
        return map[d] || 'default'
    }
    const getDispositionText = (d: string) => {
        const map: Record<string, string> = { RETURN: '退货(RTV)', REWORK: '挑选/返修', CONCESSION: '让步(特采)', DISCARD: '报废' }
        return map[d] || d
    }

    const handleSearch = () => { pagination.current = 1 }
    const resetSearch = () => {
        searchForm.recordNo = ''
        searchForm.materialCode = ''
        searchForm.supplierName = ''
        searchForm.reviewStatus = undefined
        searchForm.riskLevel = undefined
        handleSearch()
    }
    const handleTableChange = (pag: any) => {
        pagination.current = pag.current
        pagination.pageSize = pag.pageSize
    }

    const resetProcessForm = () => {
        processForm.disposition = undefined
        processForm.causeCode = undefined
        processForm.rootCauseDesc = ''
        processForm.correctiveAction = ''
        processForm.reworkHours = undefined
        processForm.reworkMaterialCost = undefined
        processForm.deviationNo = ''
        processForm.concessionCost = undefined
        closeFlags.trigger8d = false
        closeFlags.reportNo8d = ''
        closeFlags.knowledgeUpdates = []
    }

    const openProcess = (record: MrbRecord) => {
        currentRecord.value = record
        resetProcessForm()
        processForm.disposition = record.disposition
        processForm.causeCode = record.causeCode
        processForm.rootCauseDesc = record.rootCauseDesc || ''
        processForm.correctiveAction = record.correctiveAction || ''
        if (record.requireForce8d) closeFlags.trigger8d = true
        drawerVisible.value = true
    }

    const viewDetail = (record: MrbRecord) => {
        openProcess(record)
    }

    /** DRAFT -> UNDER_REVIEW：提交评审并打第一批会签 */
    const submitForReview = () => {
        if (!processForm.disposition) {
            message.warning('请先选择处理对策')
            return
        }
        if (currentRecord.value) {
            currentRecord.value.reviewStatus = 'UNDER_REVIEW'
            currentRecord.value.disposition = processForm.disposition
            currentRecord.value.causeCode = processForm.causeCode
            currentRecord.value.rootCauseDesc = processForm.rootCauseDesc
            currentRecord.value.correctiveAction = processForm.correctiveAction
            // 模拟会签列表生成
            currentRecord.value.signoffList = [
                { dept: '质量部(SQE)', reviewer: '张工', status: 'PENDING' },
                { dept: '技术部', reviewer: '李工', status: 'PENDING' },
                { dept: '采购部', reviewer: '王经理', status: 'PENDING' },
                { dept: '生产部', reviewer: '赵主管', status: 'PENDING' }
            ]
            message.success('已提交会签评审，钉钉审批任务已推送')
        }
    }

    /** UNDER_REVIEW -> APPROVED */
    const approveRecord = () => {
        if (!processForm.causeCode) {
            message.warning('批准前必须填写根本原因分析')
            return
        }
        // 检查会签是否全部完成
        const pendingSignoffs = currentRecord.value?.signoffList?.filter(s => s.status === 'PENDING')
        if (pendingSignoffs && pendingSignoffs.length > 0) {
            message.warning(`还有 ${pendingSignoffs.length} 个部门未完成审批，无法终审。`)
            return
        }
        if (currentRecord.value) {
            currentRecord.value.reviewStatus = 'APPROVED'
            currentRecord.value.causeCode = processForm.causeCode
            currentRecord.value.rootCauseDesc = processForm.rootCauseDesc
            currentRecord.value.correctiveAction = processForm.correctiveAction
            message.success('评审已批准')
        }
    }

    /** APPROVED -> CLOSED */
    const closeRecord = () => {
        if (!currentRecord.value) return
        // 检查是否需要强制 8D
        if (currentRecord.value.requireForce8d && !closeFlags.trigger8d) {
            message.error('系统检测到连续不良，必须勾选"触发供应商 8D 整改要求"后才能结案！')
            return
        }
        if (closeFlags.trigger8d && !closeFlags.reportNo8d) {
            message.warning('请输入 8D 报告编号')
            return
        }
        currentRecord.value.reviewStatus = 'CLOSED'
        currentRecord.value.has8d = closeFlags.trigger8d
        message.success('记录已结案归档' + (closeFlags.knowledgeUpdates.length > 0 ? '，知识沉淀已生效' : ''))
        drawerVisible.value = false
    }

    onMounted(() => {
        loading.value = true
        setTimeout(() => { loading.value = false }, 300)
    })
</script>

<style scoped>
    .page-container {
        padding: 24px;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }

    .stats-row {
        margin-bottom: 20px;
    }

    .stat-card {
        border-radius: 8px;
    }

    .stat-total {
        border-left: 4px solid #1890ff;
    }

    .stat-draft {
        border-left: 4px solid #faad14;
    }

    .stat-review {
        border-left: 4px solid #1890ff;
    }

    .stat-closed {
        border-left: 4px solid #52c41a;
    }

    .search-form {
        background: #fff;
        padding: 16px;
        border-radius: 6px;
        margin-bottom: 16px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
    }

    .status-actions {
        margin-top: 16px;
        text-align: right;
    }
</style>