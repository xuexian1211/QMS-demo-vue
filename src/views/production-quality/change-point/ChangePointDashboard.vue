<template>
    <div class="page-container">
        <div class="page-header">
            <h1>变化点中央看板</h1>
            <a-space>
                <a-date-picker v-model:value="selectedDate" :allow-clear="false" />
                <a-button type="primary" @click="goToList">
                    <template #icon>
                        <UnorderedListOutlined />
                    </template>
                    全部台账
                </a-button>
                <a-button @click="goToCreate">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    新增变化点
                </a-button>
            </a-space>
        </div>

        <!-- 统计卡片 -->
        <a-row :gutter="16" style="margin-bottom: 16px;">
            <a-col :span="4" v-for="stat in statsCards" :key="stat.key">
                <a-card size="small" hoverable @click="filterByStatus(stat.status)" class="stat-card">
                    <a-statistic :title="stat.label" :value="stat.value"
                        :value-style="{ color: stat.valueColor, fontSize: '28px', fontWeight: 700 }">
                        <template #prefix><span>{{ stat.icon }}</span></template>
                        <template #suffix v-if="stat.trend !== undefined">
                            <span :style="{ fontSize: '12px', color: stat.trend >= 0 ? '#cf1322' : '#3f8600' }">
                                {{ stat.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(stat.trend) }}
                            </span>
                        </template>
                    </a-statistic>
                </a-card>
            </a-col>
        </a-row>

        <a-row :gutter="16" style="margin-bottom: 16px;">
            <!-- 当日活跃变化点列表 -->
            <a-col :span="14">
                <a-card title="当日活跃变化点" size="small">
                    <template #extra>
                        <a-badge :count="activeChangePoints.length" :number-style="{ backgroundColor: '#1890ff' }" />
                    </template>
                    <a-table :columns="activeColumns" :data-source="activeChangePoints" :pagination="false" size="small"
                        row-key="id" :scroll="{ y: 320 }">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'recordNo'">
                                <a @click="goToDetail(record.id)">{{ record.recordNo }}</a>
                            </template>
                            <template v-else-if="column.key === 'riskLevel'">
                                <a-tag :color="riskColorMap[record.riskLevel]">{{ riskLabelMap[record.riskLevel]
                                    }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'status'">
                                <a-badge :status="statusBadgeMap[record.status]"
                                    :text="statusLabelMap[record.status]" />
                                <a-tag v-if="record.status === 'locked'" color="red"
                                    style="margin-left:4px">🔒MES锁机</a-tag>
                            </template>
                            <template v-else-if="column.key === 'changeType'">
                                {{ typeLabelMap[record.changeDetail.changeType] }}
                            </template>
                            <template v-else-if="column.key === 'reportTime'">
                                {{ formatTime(record.reportTime) }}
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="goToDetail(record.id)">查看</a-button>
                                    <a-button v-if="record.status === 'approving'" type="link" size="small"
                                        style="color:#faad14" @click="handleApprove(record)">审批</a-button>
                                    <a-button v-if="record.status === 'locked' || record.status === 'verifying'"
                                        type="link" size="small" @click="goToVerification(record.id)">验证</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </a-card>
            </a-col>

            <!-- 图表 -->
            <a-col :span="10">
                <a-card title="变化点类型分布（本月）" size="small" style="margin-bottom: 16px;">
                    <v-chart class="chart" :option="typeChartOption" autoresize />
                </a-card>
                <a-card title="风险等级趋势（近7天）" size="small">
                    <v-chart class="chart" :option="riskTrendOption" autoresize />
                </a-card>
            </a-col>
        </a-row>

        <a-row :gutter="16">
            <!-- 预警通知 -->
            <a-col :span="12">
                <a-card size="small">
                    <template #title>
                        ⚠️ 实时预警
                        <a-badge :count="unreadAlerts" style="margin-left: 8px;" />
                    </template>
                    <a-list :data-source="alerts" size="small">
                        <template #renderItem="{ item }">
                            <a-list-item @click="markAlertRead(item)" style="cursor:pointer">
                                <a-list-item-meta>
                                    <template #title>
                                        <a-tag :color="item.severity === 'red' ? 'red' : 'orange'" size="small">
                                            {{ item.severity === 'red' ? '🔴 紧急' : '🟠 提醒' }}
                                        </a-tag>
                                        <span>{{ item.recordNo }}</span>
                                        <a-badge v-if="!item.isRead" dot style="margin-left:4px" />
                                    </template>
                                    <template #description>{{ item.message }}</template>
                                </a-list-item-meta>
                                <template #extra>
                                    <span style="font-size:12px;color:#999">{{ formatTime(item.triggerTime) }}</span>
                                </template>
                            </a-list-item>
                        </template>
                    </a-list>
                </a-card>
            </a-col>

            <!-- 快速操作 + 月度汇总 -->
            <a-col :span="12">
                <a-card title="🚀 快速操作" size="small">
                    <a-row :gutter="[12, 12]">
                        <a-col :span="8" v-for="action in quickActions" :key="action.key">
                            <a-button block @click="action.handler" style="height:60px">
                                <div>{{ action.icon }}</div>
                                <div style="font-size:12px">{{ action.label }}</div>
                            </a-button>
                        </a-col>
                    </a-row>
                    <a-divider style="margin: 12px 0" />
                    <a-descriptions title="本月汇总" :column="3" size="small" bordered>
                        <a-descriptions-item label="总提报">42</a-descriptions-item>
                        <a-descriptions-item label="高风险"><span
                                style="color:#ff4d4f;font-weight:700">6</span></a-descriptions-item>
                        <a-descriptions-item label="已闭环"><span
                                style="color:#52c41a;font-weight:700">35</span></a-descriptions-item>
                    </a-descriptions>
                </a-card>
            </a-col>
        </a-row>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons-vue'
    import { message, Modal } from 'ant-design-vue'
    import { use } from 'echarts/core'
    import { CanvasRenderer } from 'echarts/renderers'
    import { PieChart, BarChart } from 'echarts/charts'
    import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
    import VChart from 'vue-echarts'
    import dayjs from 'dayjs'
    import type { ChangePointRecord, AlertRecord, ChangePointStatus, RiskLevel, ChangePointType } from '@/types/change-point'
    import { STATUS_CONFIG } from '@/types/change-point'

    use([CanvasRenderer, PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent])

    const router = useRouter()
    const selectedDate = ref(dayjs())

    // 映射表
    const riskColorMap: Record<RiskLevel, string> = { low: 'green', medium: 'orange', high: 'red' }
    const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }
    const typeLabelMap: Record<ChangePointType, string> = {
        man: '人(Man)', machine: '机(Machine)', material: '料(Material)', method: '法(Method)',
        environment: '环(Env)', measure: '测(Measure)', other: '其他'
    }
    const statusBadgeMap: Record<ChangePointStatus, string> = {
        draft: 'default', submitted: 'processing', approving: 'warning',
        approved: 'processing', locked: 'error', verifying: 'warning',
        released: 'success', rejected: 'error', closed: 'default',
    }
    const statusLabelMap: Record<ChangePointStatus, string> = Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
    ) as Record<ChangePointStatus, string>

    // 模拟数据
    const activeChangePoints = ref < ChangePointRecord[] > ([
        {
            id: '1', recordNo: 'CPR-20240305-001', title: '关键机台 #MC-02 大修更换模具',
            reporter: { id: 'u1', name: '张三', department: '生产部', team: 'A班' },
            reportTime: '2024-03-05T08:30:00',
            changeDetail: { changeType: 'machine', changeSubType: '模具更换', changeDescription: '压铸模具A老化，更换新模具', affectedMachine: 'MC-02' },
            riskLevel: 'high', status: 'locked',
            mesLockTime: '2024-03-05T09:00:00',
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
    ])

    const alerts = ref < AlertRecord[] > ([
        {
            id: 'a1', changePointId: '1', recordNo: 'CPR-20240305-001',
            alertType: 'blind_move', severity: 'red',
            message: 'MC-02 已锁定，但MES检测到批量报工数据！请立即核查。',
            triggerTime: '2024-03-05T11:45:00',
            notifiedUsers: ['生产总监', '品质总监'], isRead: false,
        },
        {
            id: 'a2', changePointId: '4', recordNo: 'CPR-20240305-004',
            alertType: 'verification_timeout', severity: 'orange',
            message: '已锁机超过4小时，试生产验证尚未完成，请及时推进。',
            triggerTime: '2024-03-05T15:00:00',
            notifiedUsers: ['QE王强', '生产主管'], isRead: false,
        },
    ])

    const unreadAlerts = computed(() => alerts.value.filter(a => !a.isRead).length)

    // 统计卡片
    const statsCards = computed(() => [
        { key: 'total', label: '今日变化点', value: 8, icon: '📋', valueColor: '#1890ff', status: undefined, trend: 2 },
        { key: 'locked', label: '当前锁机', value: 2, icon: '🔒', valueColor: '#ff4d4f', status: 'locked', trend: 1 },
        { key: 'verifying', label: '验证中', value: 3, icon: '🔬', valueColor: '#faad14', status: 'verifying', trend: undefined },
        { key: 'approving', label: '待审批', value: 1, icon: '⏳', valueColor: '#fa8c16', status: 'approving', trend: undefined },
        { key: 'released', label: '今日放行', value: 5, icon: '✅', valueColor: '#52c41a', status: 'released', trend: 3 },
        { key: 'alert', label: '未读预警', value: 2, icon: '⚠️', valueColor: '#722ed1', status: undefined, trend: undefined },
    ])

    // 列定义
    const activeColumns = [
        { title: '单号', key: 'recordNo', dataIndex: 'recordNo', width: 160 },
        { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
        { title: '类型', key: 'changeType', width: 90 },
        { title: '风险', key: 'riskLevel', width: 80 },
        { title: '状态', key: 'status', width: 140 },
        { title: '提报人', dataIndex: ['reporter', 'name'], key: 'reporter', width: 70 },
        { title: '时间', key: 'reportTime', width: 100 },
        { title: '操作', key: 'action', width: 130, fixed: 'right' as const },
    ]

    // 图表
    const typeChartOption = computed(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', right: 0, top: 'middle', textStyle: { fontSize: 11 } },
        color: ['#1890ff', '#722ed1', '#fa8c16', '#13c2c2', '#52c41a', '#eb2f96'],
        series: [{
            name: '类型', type: 'pie', radius: ['40%', '65%'], center: ['38%', '50%'],
            label: { show: false },
            data: [
                { name: '人', value: 8 }, { name: '机', value: 12 }, { name: '料', value: 7 },
                { name: '法', value: 6 }, { name: '环', value: 3 }, { name: '测', value: 4 },
            ],
        }],
    }))

    const riskTrendOption = computed(() => ({
        tooltip: { trigger: 'axis' },
        legend: { data: ['高', '中', '低'], top: 0 },
        grid: { left: 30, right: 10, bottom: 20, top: 30, containLabel: true },
        xAxis: { type: 'category', data: ['02-27', '02-28', '03-01', '03-02', '03-03', '03-04', '03-05'] },
        yAxis: { type: 'value', minInterval: 1 },
        series: [
            { name: '高', type: 'bar', stack: 'risk', color: '#ff4d4f', data: [1, 0, 2, 1, 0, 1, 2] },
            { name: '中', type: 'bar', stack: 'risk', color: '#faad14', data: [2, 3, 1, 2, 4, 2, 3] },
            { name: '低', type: 'bar', stack: 'risk', color: '#52c41a', data: [3, 2, 4, 3, 2, 3, 3] },
        ],
    }))

    // 快速操作
    const quickActions = [
        { key: 'new', icon: '➕', label: '新增变化点', handler: () => router.push('/production-quality/change-point/list/create') },
        { key: 'approval', icon: '✍️', label: '待我审批', handler: () => router.push('/production-quality/change-point/list?status=approving') },
        { key: 'verification', icon: '🔬', label: '验证任务', handler: () => router.push('/production-quality/change-point/verification') },
        { key: 'ledger', icon: '📚', label: '台账追溯', handler: () => router.push('/production-quality/change-point/list') },
        { key: 'rule', icon: '⚙️', label: '规则配置', handler: () => router.push('/production-quality/change-point/risk-matrix') },
        { key: 'alert', icon: '⚠️', label: '预警记录', handler: () => message.info('预警记录页面开发中') },
    ]

    // 方法
    const formatTime = (time: string) => dayjs(time).format('MM-DD HH:mm')
    const goToList = () => router.push('/production-quality/change-point/list')
    const goToCreate = () => router.push('/production-quality/change-point/list/create')
    const goToDetail = (id: string) => router.push('/production-quality/change-point/list/view/' + id)
    const goToVerification = (id: string) => router.push('/production-quality/change-point/verification?changePointId=' + id)
    const filterByStatus = (status?: string) => {
        if (status) router.push('/production-quality/change-point/list?status=' + status)
    }
    const handleApprove = (item: ChangePointRecord) => {
        Modal.confirm({
            title: '审批确认 - ' + item.recordNo,
            content: item.title + '（' + riskLabelMap[item.riskLevel] + '）。请前往详情页进行审批。',
            okText: '前往审批', cancelText: '取消',
            onOk: () => goToDetail(item.id),
        })
    }
    const markAlertRead = (alert: AlertRecord) => {
        alert.isRead = true
        message.info('已标记为已读')
    }

    onMounted(() => {
        // NOTE: 实际环境调用后端API获取数据
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

    .stat-card {
        cursor: pointer;
    }

    .chart {
        height: 160px;
    }
</style>