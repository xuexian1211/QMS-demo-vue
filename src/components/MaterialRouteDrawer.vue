<template>
    <a-drawer :visible="visible" :title="`工艺路线 - ${materialInfo.code} ${materialInfo.name}`" width="900px"
        :destroyOnClose="true" @close="handleClose">
        <div class="route-container">
            <!-- 工具栏 -->
            <div class="route-toolbar">
                <a-space>
                    <a-button @click="loadRouteData">
                        <template #icon>
                            <ReloadOutlined />
                        </template>刷新
                    </a-button>
                </a-space>
                <span class="route-count">共 {{ routeData.length }} 条工艺路线</span>
            </div>

            <!-- 工艺路线表格 -->
            <a-table :columns="routeColumns" :data-source="routeData" :loading="loading" row-key="id" size="middle"
                :pagination="false">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleViewRoute(record)">查看详情</a-button>
                        </a-space>
                    </template>
                </template>
                <!-- 展开的工序明细 -->
                <template #expandedRowRender="{ record }">
                    <a-table :columns="stepColumns" :data-source="record.steps" :pagination="false" size="small"
                        :show-header="true">
                        <template #bodyCell="{ column, record: step }">
                            <template v-if="column.key === 'inspConfig'">
                                <a-space>
                                    <a-tag v-if="step.hasFirstInsp" color="blue" size="small">首检</a-tag>
                                    <a-tag v-if="step.hasPatrolInsp" color="green" size="small">巡检</a-tag>
                                    <a-tag v-if="step.hasFinalInsp" color="orange" size="small">末检</a-tag>
                                    <span v-if="!step.hasFirstInsp && !step.hasPatrolInsp && !step.hasFinalInsp"
                                        class="no-config">-</span>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </template>
            </a-table>
        </div>
    </a-drawer>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { ReloadOutlined } from '@ant-design/icons-vue'

    // Props
    const props = defineProps < {
        visible: boolean
  materialInfo: { id: string; code: string; name: string }
    } > ()

    // Emits
    const emit = defineEmits < {
  (e: 'update:visible', value: boolean): void
}> ()

    const router = useRouter()

    // --- 状态定义 ---
    const loading = ref(false)
    const routeData = ref < any[] > ([])

    // 工艺路线表格列
    const routeColumns = [
        { title: '路线编码', dataIndex: 'code', key: 'code', width: 150 },
        { title: '路线名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '工序数', dataIndex: 'stepCount', key: 'stepCount', width: 80 },
        { title: '操作', key: 'action', width: 100 }
    ]

    // 工序明细表格列
    const stepColumns = [
        { title: '序号', dataIndex: 'opSeq', key: 'opSeq', width: 80 },
        { title: '工序名称', dataIndex: 'opName', key: 'opName', width: 150 },
        { title: '工作中心', dataIndex: 'workCenter', key: 'workCenter', width: 120 },
        { title: '检验配置', key: 'inspConfig', width: 180 },
        { title: '工序描述', dataIndex: 'description', key: 'description' }
    ]

    // --- 监听 ---
    watch(() => props.visible, (val) => {
        if (val && props.materialInfo?.id) {
            loadRouteData()
        }
    })

    // --- 方法 ---
    const handleClose = () => {
        emit('update:visible', false)
    }

    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = {
            Active: 'success',
            Draft: 'default',
            Obsolete: 'error'
        }
        return colorMap[status] || 'default'
    }

    const getStatusText = (status: string) => {
        const textMap: Record<string, string> = {
            Active: '生效',
            Draft: '草稿',
            Obsolete: '失效'
        }
        return textMap[status] || status
    }

    const loadRouteData = () => {
        loading.value = true
        setTimeout(() => {
            // 模拟数据 - 根据物料ID加载工艺路线
            const mockData: Record<string, any[]> = {
                '1': [
                    {
                        id: 'r1',
                        code: 'PR-001',
                        name: '铝锭标准工艺',
                        version: 'V1.0',
                        status: 'Active',
                        stepCount: 3,
                        steps: [
                            { id: 's1', opSeq: 10, opName: '熔炼', workCenter: 'WC-01', description: '铝液熔炼', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's2', opSeq: 20, opName: '浇铸', workCenter: 'WC-02', description: '连续浇铸', hasFirstInsp: false, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's3', opSeq: 30, opName: '冷却切割', workCenter: 'WC-03', description: '冷却定型切割', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true }
                        ]
                    }
                ],
                '2': [
                    {
                        id: 'r2',
                        code: 'PR-002',
                        name: '壳体加工工艺',
                        version: 'V1.0',
                        status: 'Active',
                        stepCount: 4,
                        steps: [
                            { id: 's4', opSeq: 10, opName: '压铸', workCenter: 'WC-10', description: '高压压铸', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's5', opSeq: 20, opName: '去毛刺', workCenter: 'WC-11', description: '人工去毛刺', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: false },
                            { id: 's6', opSeq: 30, opName: '机加工', workCenter: 'WC-12', description: 'CNC加工', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's7', opSeq: 40, opName: '抛光', workCenter: 'WC-13', description: '表面抛光', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true }
                        ]
                    },
                    {
                        id: 'r3',
                        code: 'PR-003',
                        name: '壳体加工工艺V2',
                        version: 'V2.0',
                        status: 'Draft',
                        stepCount: 3,
                        steps: [
                            { id: 's8', opSeq: 10, opName: '压铸', workCenter: 'WC-10', description: '高压压铸', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's9', opSeq: 20, opName: '机加工', workCenter: 'WC-12', description: 'CNC加工', hasFirstInsp: false, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's10', opSeq: 30, opName: '抛光', workCenter: 'WC-13', description: '表面抛光', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true }
                        ]
                    }
                ],
                '3': []
            }
            routeData.value = mockData[props.materialInfo.id] || []
            loading.value = false
        }, 300)
    }

    const handleViewRoute = (record: any) => {
        // 跳转到工艺路线详情页
        router.push(`/basic-data/process-routes?code=${record.code}`)
        handleClose()
    }
</script>

<style scoped>
    .route-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .route-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .route-count {
        color: #666;
        font-size: 14px;
    }

    .no-config {
        color: #ccc;
    }
</style>