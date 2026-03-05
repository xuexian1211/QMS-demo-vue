<template>
    <div class="page-container">
        <div class="page-header">
            <h1>变化点台账与追溯</h1>
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    新增变化点申报
                </a-button>
                <a-button @click="handleExport">
                    <template #icon>
                        <ExportOutlined />
                    </template>
                    导出台账
                </a-button>
                <a-button @click="handleRefresh">
                    <template #icon>
                        <ReloadOutlined />
                    </template>
                    刷新
                </a-button>
            </a-space>
        </div>

        <!-- 搜索条件 -->
        <a-card title="搜索条件" size="small" class="search-card">
            <a-form layout="inline" :model="searchForm">
                <a-form-item label="单号/标题">
                    <a-input v-model:value="searchForm.keyword" placeholder="请输入单号或标题" style="width:160px" />
                </a-form-item>
                <a-form-item label="变化类型">
                    <a-select v-model:value="searchForm.changeType" placeholder="全部" allow-clear style="width:120px"
                        :options="changeTypeOptions" />
                </a-form-item>
                <a-form-item label="风险等级">
                    <a-select v-model:value="searchForm.riskLevel" placeholder="全部" allow-clear style="width:100px"
                        :options="[{ value: 'low', label: '低风险' }, { value: 'medium', label: '中风险' }, { value: 'high', label: '高风险' }]" />
                </a-form-item>
                <a-form-item label="处理状态">
                    <a-select v-model:value="searchForm.status" placeholder="全部" allow-clear style="width:120px"
                        :options="statusOptions" />
                </a-form-item>
                <a-form-item label="提报时间">
                    <a-range-picker v-model:value="searchForm.dateRange" style="width:220px" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                    <a-button style="margin-left:8px" @click="resetSearch">重置</a-button>
                </a-form-item>
            </a-form>
        </a-card>

        <!-- 数据表格 -->
        <div class="table-container">
            <a-table :columns="columns" :data-source="filteredData" :loading="loading"
                :pagination="{ total: filteredData.length, pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }"
                :scroll="{ x: 1400, y: 'calc(100vh - 300px)' }" row-key="id" size="small">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'recordNo'">
                        <a @click="viewRecord(record)">{{ record.recordNo }}</a>
                    </template>
                    <template v-else-if="column.key === 'changeType'">
                        <a-tag :color="typeColorMap[record.changeDetail.changeType]">
                            {{ typeIconMap[record.changeDetail.changeType] }} {{
                            typeLabelMap[record.changeDetail.changeType] }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'riskLevel'">
                        <a-tag :color="riskColorMap[record.riskLevel]">{{ riskLabelMap[record.riskLevel] }}</a-tag>
                    </template>
                    <template v-else-if="column.key === 'status'">
                        <a-badge :status="statusBadgeMap[record.status]" :text="statusConfig[record.status].label" />
                        <a-tag v-if="record.status === 'locked'" color="red" size="small"
                            style="margin-left:4px">🔒MES锁机</a-tag>
                    </template>
                    <template v-else-if="column.key === 'reportTime'">
                        {{ formatDate(record.reportTime) }}
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
                            <a-button type="link" size="small" @click="editRecord(record)"
                                :disabled="!['draft', 'submitted', 'rejected'].includes(record.status)">编辑</a-button>
                            <a-button v-if="record.status === 'approving'" type="link" size="small"
                                style="color:#faad14" @click="approveRecord(record)">审批</a-button>
                            <a-button v-if="['locked', 'verifying'].includes(record.status)" type="link" size="small"
                                @click="goToVerification(record)">验证</a-button>
                            <a-popconfirm title="确定要删除吗？" @confirm="handleDelete(record.id)" ok-text="确定"
                                cancel-text="取消">
                                <a-button type="link" size="small" danger
                                    :disabled="!['draft', 'rejected'].includes(record.status)">删除</a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- 审批弹窗 -->
        <a-modal v-model:visible="approveModalVisible" title="变化点审批" width="600px" @ok="submitApproval">
            <a-form :model="approveForm" layout="vertical">
                <a-descriptions :column="2" bordered size="small" style="margin-bottom:16px">
                    <a-descriptions-item label="单号">{{ currentRecord?.recordNo }}</a-descriptions-item>
                    <a-descriptions-item label="风险等级">
                        <a-tag :color="currentRecord ? riskColorMap[currentRecord.riskLevel] : ''">
                            {{ currentRecord ? riskLabelMap[currentRecord.riskLevel] : '' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="变化标题" :span="2">{{ currentRecord?.title }}</a-descriptions-item>
                    <a-descriptions-item label="变化说明" :span="2">{{ currentRecord?.changeDetail.changeDescription
                        }}</a-descriptions-item>
                </a-descriptions>
                <a-form-item label="审批结果" required>
                    <a-radio-group v-model:value="approveForm.result">
                        <a-radio value="approved">
                            <span style="color:#52c41a">✅ 批准（对中高风险将自动触发MES锁机）</span>
                        </a-radio>
                        <a-radio value="rejected">
                            <span style="color:#ff4d4f">❌ 驳回</span>
                        </a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="审批意见">
                    <a-textarea v-model:value="approveForm.comment" :rows="3" placeholder="请填写审批意见" />
                </a-form-item>
                <a-alert
                    v-if="approveForm.result === 'approved' && currentRecord && ['medium', 'high'].includes(currentRecord.riskLevel)"
                    type="warning" message="注意：批准后系统将自动向MES发送锁机指令，请确认受影响机台后再提交。" banner style="margin-top:8px" />
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { PlusOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons-vue'
    import { message } from 'ant-design-vue'
    import dayjs from 'dayjs'
    import type { ChangePointRecord, ChangePointStatus, RiskLevel, ChangePointType } from '@/types/change-point'
    import { STATUS_CONFIG, CHANGE_TYPE_OPTIONS } from '@/types/change-point'

    const router = useRouter()
    const route = useRoute()
    const statusConfig = STATUS_CONFIG

    // 映射表
    const typeColorMap: Record<ChangePointType, string> = { man: 'blue', machine: 'purple', material: 'orange', method: 'cyan', environment: 'green', measure: 'magenta', other: 'default' }
    const typeLabelMap: Record<ChangePointType, string> = { man: '人', machine: '机', material: '料', method: '法', environment: '环', measure: '测', other: '其他' }
    const typeIconMap: Record<ChangePointType, string> = { man: '👷', machine: '🏭', material: '📦', method: '📋', environment: '🌡️', measure: '📐', other: '📝' }
    const riskColorMap: Record<RiskLevel, string> = { low: 'green', medium: 'orange', high: 'red' }
    const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }
    const statusBadgeMap: Record<ChangePointStatus, string> = {
        draft: 'default', submitted: 'processing', approving: 'warning',
        approved: 'processing', locked: 'error', verifying: 'warning',
        released: 'success', rejected: 'error', closed: 'default',
    }

    const changeTypeOptions = CHANGE_TYPE_OPTIONS.map(o => ({ value: o.value, label: `${o.icon} ${o.label.split(' ')[0]}` }))
    const statusOptions = Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))

    // 搜索
    const searchForm = reactive({
        keyword: '', changeType: undefined as string | undefined,
        riskLevel: undefined as string | undefined,
        status: (route.query.status as string) || undefined,
        dateRange: null as any
    })

    // 数据
    const loading = ref(false)
    const dataSource = ref < ChangePointRecord[] > ([
        {
            id: '1', recordNo: 'CPR-20240305-001', title: '关键机台 #MC-02 大修更换模具',
            reporter: { id: 'u1', name: '张三', department: '生产部', team: 'A班' },
            reportTime: '2024-03-05T08:30:00',
            changeDetail: { changeType: 'machine', changeSubType: '模具更换', changeDescription: '压铸模具A老化，更换新模具', affectedMachine: 'MC-02' },
            riskLevel: 'high', status: 'locked', mesLockTime: '2024-03-05T09:00:00',
            createTime: '2024-03-05T08:30:00', updateTime: '2024-03-05T09:00:00',
        },
        {
            id: '2', recordNo: 'CPR-20240305-002', title: '核心原料供应商切换 - 铝锭',
            reporter: { id: 'u2', name: '李四', department: '品质部' },
            reportTime: '2024-03-05T09:15:00',
            changeDetail: { changeType: 'material', changeSubType: '材料供应商变更', changeDescription: '原供应商缺货，临时切换备选供应商B' },
            riskLevel: 'high', status: 'approving',
            createTime: '2024-03-05T09:15:00', updateTime: '2024-03-05T09:15:00',
        },
        {
            id: '3', recordNo: 'CPR-20240305-003', title: '新普工上岗 - 压铸工序 2 人',
            reporter: { id: 'u3', name: '王五', department: '生产部', team: 'B班' },
            reportTime: '2024-03-05T10:00:00',
            changeDetail: { changeType: 'man', changeSubType: '新员工上岗', changeDescription: '2名新员工进入压铸工序' },
            riskLevel: 'low', status: 'released',
            createTime: '2024-03-05T10:00:00', updateTime: '2024-03-05T10:05:00',
        },
        {
            id: '4', recordNo: 'CPR-20240305-004', title: 'IPQC 检具更换 - 卡尺校准换新',
            reporter: { id: 'u4', name: '赵六', department: '品质部' },
            reportTime: '2024-03-05T11:00:00',
            changeDetail: { changeType: 'measure', changeSubType: '检具更换', changeDescription: '数显卡尺超校准周期，更换新仪器' },
            riskLevel: 'medium', status: 'verifying',
            createTime: '2024-03-05T11:00:00', updateTime: '2024-03-05T11:30:00',
        },
        {
            id: '5', recordNo: 'CPR-20240305-005', title: '工艺参数调整 - 压铸温度窗口扩宽',
            reporter: { id: 'u5', name: '孙七', department: '技术部' },
            reportTime: '2024-03-05T13:00:00',
            changeDetail: { changeType: 'method', changeSubType: '工艺参数调整', changeDescription: '根据试验结果，将射料温度上限从670℃调整至685℃' },
            riskLevel: 'medium', status: 'approved',
            createTime: '2024-03-05T13:00:00', updateTime: '2024-03-05T14:00:00',
        },
        {
            id: '6', recordNo: 'CPR-20240304-001', title: '生产环境改造 - 厂房东侧扩建完成',
            reporter: { id: 'u6', name: '陈工', department: '工务部' },
            reportTime: '2024-03-04T09:00:00',
            changeDetail: { changeType: 'environment', changeSubType: '生产环境改造', changeDescription: '东侧扩建区域正式投入使用，调整生产线布局' },
            riskLevel: 'medium', status: 'closed',
            createTime: '2024-03-04T09:00:00', updateTime: '2024-03-04T18:00:00',
        },
    ])

    const filteredData = computed(() => {
        return dataSource.value.filter(item => {
            if (searchForm.keyword && !item.recordNo.includes(searchForm.keyword) && !item.title.includes(searchForm.keyword)) return false
            if (searchForm.changeType && item.changeDetail.changeType !== searchForm.changeType) return false
            if (searchForm.riskLevel && item.riskLevel !== searchForm.riskLevel) return false
            if (searchForm.status && item.status !== searchForm.status) return false
            return true
        })
    })

    // 表格列
    const columns = [
        { title: '单据编号', key: 'recordNo', dataIndex: 'recordNo', width: 180, fixed: 'left' as const },
        { title: '变化点标题', key: 'title', dataIndex: 'title', width: 260 },
        { title: '变化类型', key: 'changeType', width: 110 },
        { title: '风险等级', key: 'riskLevel', width: 90 },
        { title: '状态', key: 'status', width: 140 },
        { title: '提报人', dataIndex: ['reporter', 'name'], key: 'reporter', width: 80 },
        { title: '提报部门', dataIndex: ['reporter', 'department'], key: 'department', width: 90 },
        { title: '提报时间', key: 'reportTime', width: 130 },
        { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
    ]

    // 审批弹窗
    const approveModalVisible = ref(false)
    const currentRecord = ref < ChangePointRecord | null > (null)
    const approveForm = reactive({ result: 'approved', comment: '' })

    // 方法
    const handleSearch = () => { loading.value = true; setTimeout(() => { loading.value = false }, 300) }
    const resetSearch = () => { Object.assign(searchForm, { keyword: '', changeType: undefined, riskLevel: undefined, status: undefined, dateRange: null }) }
    const handleRefresh = () => handleSearch()
    const handleExport = () => message.info('导出功能开发中...')
    const handleAdd = () => router.push('/production-quality/change-point/list/create')
    const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

    const viewRecord = (record: ChangePointRecord) => router.push('/production-quality/change-point/list/view/' + record.id)
    const editRecord = (record: ChangePointRecord) => router.push('/production-quality/change-point/list/edit/' + record.id)
    const goToVerification = (record: ChangePointRecord) => router.push('/production-quality/change-point/verification?changePointId=' + record.id)

    const approveRecord = (record: ChangePointRecord) => {
        currentRecord.value = record
        approveForm.result = 'approved'
        approveForm.comment = ''
        approveModalVisible.value = true
    }

    const submitApproval = () => {
        if (!currentRecord.value) return
        const record = dataSource.value.find(r => r.id === currentRecord.value!.id)
        if (record) {
            if (approveForm.result === 'approved') {
                record.status = ['medium', 'high'].includes(record.riskLevel) ? 'locked' : 'released'
                if (['medium', 'high'].includes(record.riskLevel)) {
                    record.mesLockTime = new Date().toISOString()
                    message.success('审批通过！已向MES发送锁机指令。')
                } else {
                    message.success('审批通过！低风险变化点已放行。')
                }
            } else {
                record.status = 'rejected'
                message.warning('已驳回该变化点申报。')
            }
            record.approver = '当前用户'
            record.approveComment = approveForm.comment
        }
        approveModalVisible.value = false
    }

    const handleDelete = (id: string) => {
        const idx = dataSource.value.findIndex(r => r.id === id)
        if (idx >= 0) { dataSource.value.splice(idx, 1); message.success('删除成功') }
    }

    onMounted(() => {
        if (route.query.status) searchForm.status = route.query.status as string
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
        margin-bottom: 24px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }

    .search-card {
        margin-bottom: 16px;
    }
</style>