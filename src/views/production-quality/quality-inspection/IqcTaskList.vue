<template>
    <div class="page-container">
        <div class="page-header">
            <h1>IQC 来料检验任务</h1>
            <a-tooltip title="本模块的任务由 WMS/SRM 系统的收货报检信号自动匹配检验计划生成">
                <a-tag color="blue">自动触发</a-tag>
            </a-tooltip>
        </div>

        <!-- 统计看板 -->
        <div class="stats-row">
            <a-row :gutter="16">
                <a-col :span="6">
                    <a-card class="stat-card stat-total" hoverable>
                        <a-statistic title="全部任务" :value="stats.total" :value-style="{ color: '#1890ff' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-pending" hoverable>
                        <a-statistic title="待检验" :value="stats.pending" :value-style="{ color: '#faad14' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-qualified" hoverable>
                        <a-statistic title="合格放行" :value="stats.qualified" :value-style="{ color: '#52c41a' }" />
                    </a-card>
                </a-col>
                <a-col :span="6">
                    <a-card class="stat-card stat-unqualified" hoverable>
                        <a-statistic title="不合格(已转MRB)" :value="stats.unqualified"
                            :value-style="{ color: '#ff4d4f' }" />
                    </a-card>
                </a-col>
            </a-row>
        </div>

        <!-- 搜索表单 -->
        <div class="search-form">
            <a-form layout="inline" :model="searchForm">
                <a-form-item label="任务编号">
                    <a-input v-model:value="searchForm.taskNo" placeholder="请输入任务编号" allow-clear />
                </a-form-item>
                <a-form-item label="物料编码">
                    <a-input v-model:value="searchForm.materialCode" placeholder="请输入物料编码" allow-clear />
                </a-form-item>
                <a-form-item label="来源单号">
                    <a-input v-model:value="searchForm.sourceBillNo" placeholder="请输入来源单号" allow-clear />
                </a-form-item>
                <a-form-item label="供应商">
                    <a-input v-model:value="searchForm.supplierName" placeholder="请输入供应商" allow-clear />
                </a-form-item>
                <a-form-item label="任务状态">
                    <a-select v-model:value="searchForm.status" placeholder="全部状态" style="width: 130px" allow-clear
                        :options="[
            { value: 'PENDING', label: '待检验' },
            { value: 'IN_PROGRESS', label: '检验中' },
            { value: 'COMPLETED', label: '已完成' }
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
                <template v-if="column.key === 'status'">
                    <a-tag :color="getStatusColor(record.status)">
                        {{ getStatusText(record.status) }}
                    </a-tag>
                </template>
                <template v-if="column.key === 'resultStatus'">
                    <a-tag v-if="record.resultStatus" :color="record.resultStatus === 'QUALIFIED' ? 'green' : 'red'">
                        {{ record.resultStatus === 'QUALIFIED' ? '合格放行' : '不合格' }}
                    </a-tag>
                    <span v-else style="color: #999;">—</span>
                </template>
                <template v-if="column.key === 'priority'">
                    <a-tag
                        :color="record.priority === 'HIGH' ? 'red' : record.priority === 'MEDIUM' ? 'orange' : 'blue'">
                        {{ record.priority === 'HIGH' ? '紧急(P5)' : record.priority === 'MEDIUM' ? '中(P10)' : '一般(P20)'
                        }}
                    </a-tag>
                </template>
                <!-- 策略来源标识 -->
                <template v-if="column.key === 'strategyTag'">
                    <a-tooltip :title="`匹配策略: ${record.strategyName}; AQL: ${record.aqlLevel}`">
                        <a-tag :color="record.isOverride ? 'volcano' : 'cyan'">
                            {{ record.isOverride ? '覆盖参数' : '标准方案' }}
                        </a-tag>
                    </a-tooltip>
                </template>
                <!-- AQL 抽样信息 -->
                <template v-if="column.key === 'aqlInfo'">
                    <span>
                        n={{ record.sampleQty }}
                        <a-divider type="vertical" />
                        <span style="color: #52c41a;">Ac={{ record.acceptQty }}</span>
                        <a-divider type="vertical" />
                        <span style="color: #ff4d4f;">Re={{ record.rejectQty }}</span>
                    </span>
                </template>
                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button v-if="record.status === 'PENDING'" type="primary" size="small"
                            @click="startExecution(record)">开始检验</a-button>
                        <a-button v-if="record.status === 'IN_PROGRESS'" type="primary" size="small"
                            @click="continueExecution(record)">继续检验</a-button>
                        <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
                    </a-space>
                </template>
            </template>
        </a-table>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'

    const router = useRouter()

    /** IQC 检验任务数据接口 - 含 AQL 与策略匹配扩展 */
    interface IqcTask {
        id: number
        taskNo: string
        inspType: string
        materialCode: string
        materialName: string
        batchNo: string
        supplierCode: string
        supplierName: string
        sourceBillType: string
        sourceBillNo: string
        schemeId: number
        schemeName: string
        /** 策略匹配来源信息 */
        strategyName: string
        aqlLevel: string
        isOverride: boolean
        /** 总来料数量 */
        quantity: number
        /** 动态计算的 AQL 抽样参数 */
        sampleQty: number
        acceptQty: number
        rejectQty: number
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
        resultStatus?: 'QUALIFIED' | 'UNQUALIFIED'
        priority: 'HIGH' | 'MEDIUM' | 'LOW'
        inspector?: string
        orgId: string
        createTime: string
    }

    // 搜索表单
    const searchForm = reactive({
        taskNo: '',
        materialCode: '',
        sourceBillNo: '',
        supplierName: '',
        status: undefined as string | undefined
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

    // 表格列定义 - 新增策略来源和 AQL 抽样列
    const columns = [
        { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo', width: 180 },
        { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 100 },
        { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 130, ellipsis: true },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 130 },
        { title: '供应商', dataIndex: 'supplierName', key: 'supplierName', width: 120, ellipsis: true },
        { title: '来源单号', dataIndex: 'sourceBillNo', key: 'sourceBillNo', width: 170 },
        { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100 },
        { title: '策略来源', key: 'strategyTag', width: 100 },
        { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 70 },
        { title: 'AQL 抽样 (n/Ac/Re)', key: 'aqlInfo', width: 170 },
        { title: '任务状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '判定结果', dataIndex: 'resultStatus', key: 'resultStatus', width: 100 },
        { title: '检验员', dataIndex: 'inspector', key: 'inspector', width: 80 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 155 },
        { title: '操作', key: 'action', width: 180, fixed: 'right' as const }
    ]

    // 模拟数据 - 新增 AQL 及策略匹配信息
    const dataSource = ref < IqcTask[] > ([
        {
            id: 1, taskNo: 'TSK-IQC-20260302001', inspType: 'IQC', materialCode: 'M001',
            materialName: '铝合金压铸件A', batchNo: 'B20260302-01', supplierCode: 'S01',
            supplierName: '精密铸造有限公司', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260302001',
            schemeId: 1, schemeName: '铝合金件外观尺寸检验方案',
            strategyName: '新供应商前3批加严检验', aqlLevel: 'AQL 0.65 Level-II', isOverride: true,
            quantity: 500, sampleQty: 50, acceptQty: 1, rejectQty: 2,
            status: 'PENDING', priority: 'HIGH', orgId: 'HFC_001', createTime: '2026-03-02 08:30:00'
        },
        {
            id: 2, taskNo: 'TSK-IQC-20260302002', inspType: 'IQC', materialCode: 'M002',
            materialName: '密封垫片B', batchNo: 'B20260302-02', supplierCode: 'S02',
            supplierName: '橡胶密封件厂', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260302002',
            schemeId: 2, schemeName: '密封件硬度检验方案',
            strategyName: '常规抽样检验', aqlLevel: 'AQL 1.0 Level-II', isOverride: false,
            quantity: 1000, sampleQty: 80, acceptQty: 2, rejectQty: 3,
            status: 'IN_PROGRESS', priority: 'MEDIUM', inspector: '张三', orgId: 'HFC_001', createTime: '2026-03-02 09:15:00'
        },
        {
            id: 3, taskNo: 'TSK-IQC-20260301001', inspType: 'IQC', materialCode: 'M003',
            materialName: '不锈钢螺栓C', batchNo: 'B20260301-01', supplierCode: 'S03',
            supplierName: '标准件供应商', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260301005',
            schemeId: 3, schemeName: '螺栓扭矩检验方案',
            strategyName: '常规抽样检验', aqlLevel: 'AQL 2.5 Level-I', isOverride: false,
            quantity: 2000, sampleQty: 50, acceptQty: 3, rejectQty: 4,
            status: 'COMPLETED', resultStatus: 'QUALIFIED', priority: 'LOW', inspector: '李四', orgId: 'HFC_001', createTime: '2026-03-01 14:00:00'
        },
        {
            id: 4, taskNo: 'TSK-IQC-20260301002', inspType: 'IQC', materialCode: 'M004',
            materialName: '塑料壳体D', batchNo: 'B20260301-02', supplierCode: 'S04',
            supplierName: '注塑加工厂', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260301006',
            schemeId: 4, schemeName: '壳体尺寸外观方案',
            strategyName: '常规抽样检验', aqlLevel: 'AQL 0.65 Level-II', isOverride: false,
            quantity: 300, sampleQty: 32, acceptQty: 1, rejectQty: 2,
            status: 'COMPLETED', resultStatus: 'UNQUALIFIED', priority: 'HIGH', inspector: '王五', orgId: 'HFC_001', createTime: '2026-03-01 16:00:00'
        },
        {
            id: 5, taskNo: 'TSK-IQC-20260302003', inspType: 'IQC', materialCode: 'M005',
            materialName: '连接器端子E', batchNo: 'B20260302-03', supplierCode: 'S05',
            supplierName: '电子元器件厂', sourceBillType: 'PUR_RECEIVE', sourceBillNo: 'WMS-REC-20260302003',
            schemeId: 5, schemeName: '端子压接力检验方案',
            strategyName: '新供应商前3批加严检验', aqlLevel: 'AQL 0.25 Level-III', isOverride: true,
            quantity: 5000, sampleQty: 200, acceptQty: 1, rejectQty: 2,
            status: 'PENDING', priority: 'HIGH', orgId: 'HFC_001', createTime: '2026-03-02 10:00:00'
        }
    ])

    // 统计数据
    const stats = computed(() => {
        const data = dataSource.value
        return {
            total: data.length,
            pending: data.filter(d => d.status === 'PENDING').length,
            qualified: data.filter(d => d.resultStatus === 'QUALIFIED').length,
            unqualified: data.filter(d => d.resultStatus === 'UNQUALIFIED').length
        }
    })

    // 筛选后数据
    const filteredData = computed(() => {
        let result = dataSource.value
        if (searchForm.taskNo) result = result.filter(d => d.taskNo.includes(searchForm.taskNo))
        if (searchForm.materialCode) result = result.filter(d => d.materialCode.includes(searchForm.materialCode))
        if (searchForm.sourceBillNo) result = result.filter(d => d.sourceBillNo.includes(searchForm.sourceBillNo))
        if (searchForm.supplierName) result = result.filter(d => d.supplierName.includes(searchForm.supplierName))
        if (searchForm.status) result = result.filter(d => d.status === searchForm.status)
        pagination.total = result.length
        return result
    })

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = { PENDING: 'orange', IN_PROGRESS: 'blue', COMPLETED: 'green' }
        return colors[status] || 'default'
    }
    const getStatusText = (status: string) => {
        const texts: Record<string, string> = { PENDING: '待检验', IN_PROGRESS: '检验中', COMPLETED: '已完成' }
        return texts[status] || status
    }

    const handleSearch = () => { pagination.current = 1 }
    const resetSearch = () => {
        searchForm.taskNo = ''
        searchForm.materialCode = ''
        searchForm.sourceBillNo = ''
        searchForm.supplierName = ''
        searchForm.status = undefined
        handleSearch()
    }
    const handleTableChange = (pag: any) => {
        pagination.current = pag.current
        pagination.pageSize = pag.pageSize
    }

    /** 开始检验：跳转到执行页 */
    const startExecution = (record: IqcTask) => {
        record.status = 'IN_PROGRESS'
        record.inspector = localStorage.getItem('username') || '管理员'
        router.push(`/production-quality/quality-inspection/iqc-task-execution/${record.id}`)
    }

    /** 继续检验 */
    const continueExecution = (record: IqcTask) => {
        router.push(`/production-quality/quality-inspection/iqc-task-execution/${record.id}`)
    }

    /** 查看详情 */
    const viewDetail = (record: IqcTask) => {
        router.push(`/production-quality/quality-inspection/iqc-task-execution/${record.id}?mode=view`)
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

    .stat-pending {
        border-left: 4px solid #faad14;
    }

    .stat-qualified {
        border-left: 4px solid #52c41a;
    }

    .stat-unqualified {
        border-left: 4px solid #ff4d4f;
    }

    .search-form {
        background: #fff;
        padding: 16px;
        border-radius: 6px;
        margin-bottom: 16px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
    }
</style>