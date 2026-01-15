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
                    <h2 class="page-title">{{ pageTitle }}</h2>
                    <a-tag v-if="form.causeType" :color="getCauseTypeColor(form.causeType)">
                        {{ getCauseTypeText(form.causeType) }}
                    </a-tag>
                </div>
            </div>
            <div class="header-actions" v-if="!isView">
                <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            </div>
        </div>

        <!-- 基本信息 -->
        <a-card class="form-card" title="基本信息">
            <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{ span: 6 }"
                :wrapper-col="{ span: 16 }">
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="原因代码" name="causeCode">
                            <a-input v-model:value="form.causeCode" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="原因名称" name="causeName">
                            <a-input v-model:value="form.causeName" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="原因类别" name="causeType">
                            <a-select v-model:value="form.causeType" :disabled="isView" placeholder="请选择">
                                <a-select-option value="Man">人 (Man)</a-select-option>
                                <a-select-option value="Machine">机 (Machine)</a-select-option>
                                <a-select-option value="Material">料 (Material)</a-select-option>
                                <a-select-option value="Method">法 (Method)</a-select-option>
                                <a-select-option value="Environment">环 (Environment)</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="描述" name="description" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.description" :disabled="isView" :rows="2"
                                placeholder="请输入描述" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <!-- Tab页签 -->
        <a-card class="tab-card">
            <a-tabs v-model:activeKey="activeTab">
                <!-- FMEA关联Tab -->
                <a-tab-pane key="fmea" tab="FMEA关联">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="handleAddFMEA">
                            <PlusOutlined /> 添加关联
                        </a-button>
                    </div>
                    <a-table :columns="fmeaColumns" :data-source="form.relatedFMEA" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'severity'">
                                <a-tag :color="getSeverityTagColor(record.severity)">S:{{ record.severity }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'occurrence'">
                                <a-tag color="blue">O:{{ record.occurrence }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'detection'">
                                <a-tag color="purple">D:{{ record.detection }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'rpn'">
                                <a-tag :color="getRPNColor(record.rpn)">{{ record.rpn }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleViewFMEA(record)">查看</a-button>
                                    <a-button v-if="!isView" type="link" danger size="small"
                                        @click="handleRemoveFMEA(index)">移除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="form.relatedFMEA.length === 0" description="暂无关联FMEA记录" />
                </a-tab-pane>

                <!-- 关联不良现象Tab -->
                <a-tab-pane key="phenomena" tab="关联不良现象">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="handleAddPhenomenon">
                            <PlusOutlined /> 添加关联
                        </a-button>
                    </div>
                    <a-table :columns="phenomenonColumns" :data-source="form.relatedPhenomena" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'severity'">
                                <a-tag :color="getPhenomenonSeverityColor(record.severity)">{{ record.severity
                                    }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-button v-if="!isView" type="link" danger size="small"
                                    @click="handleRemovePhenomenon(index)">移除</a-button>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="form.relatedPhenomena.length === 0" description="暂无关联不良现象" />
                </a-tab-pane>
            </a-tabs>
        </a-card>

        <!-- 不良现象选择器弹窗 -->
        <a-modal v-model:visible="phenomenonSelectorVisible" title="选择不良现象" width="800px"
            @ok="confirmPhenomenonSelection">
            <a-table :columns="selectorPhenomenonColumns" :data-source="availablePhenomena" :loading="phenomenonLoading"
                row-key="id" size="small"
                :row-selection="{ selectedRowKeys: selectedPhenomenonKeys, onChange: onPhenomenonSelectChange }">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'severity'">
                        <a-tag :color="getPhenomenonSeverityColor(record.severity)">{{ record.severity }}</a-tag>
                    </template>
                </template>
            </a-table>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'

    const router = useRouter()
    const route = useRoute()

    // --- 页面状态 ---
    const formRef = ref()
    const saving = ref(false)
    const activeTab = ref('fmea')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => {
        if (isView.value) return '查看不良原因'
        return isEdit.value ? '编辑不良原因' : '新增不良原因'
    })

    // --- 基本信息表单 ---
    const form = reactive({
        id: null as string | null,
        causeCode: '',
        causeName: '',
        causeType: 'Man' as string,
        description: '',
        relatedFMEA: [] as any[],
        relatedPhenomena: [] as any[]
    })

    const rules = {
        causeCode: [{ required: true, message: '请输入原因代码', trigger: 'blur' }],
        causeName: [{ required: true, message: '请输入原因名称', trigger: 'blur' }],
        causeType: [{ required: true, message: '请选择原因类别', trigger: 'change' }]
    }

    const getCauseTypeColor = (type: string) => {
        const map: Record<string, string> = {
            Man: 'blue', Machine: 'cyan', Material: 'orange',
            Method: 'purple', Environment: 'green'
        }
        return map[type] || 'default'
    }
    const getCauseTypeText = (type: string) => {
        const map: Record<string, string> = {
            Man: '人', Machine: '机', Material: '料',
            Method: '法', Environment: '环'
        }
        return map[type] || type
    }

    // --- FMEA Tab ---
    const fmeaColumns = [
        { title: 'FMEA编号', dataIndex: 'fmeaCode', key: 'fmeaCode', width: 120 },
        { title: '失效模式', dataIndex: 'failureMode', key: 'failureMode', width: 150 },
        { title: '严重度(S)', key: 'severity', width: 90 },
        { title: '发生度(O)', key: 'occurrence', width: 90 },
        { title: '探测度(D)', key: 'detection', width: 90 },
        { title: 'RPN', key: 'rpn', width: 80 },
        { title: '操作', key: 'action', width: 120 }
    ]

    const getSeverityTagColor = (val: number) => val >= 8 ? 'red' : val >= 5 ? 'orange' : 'green'
    const getRPNColor = (rpn: number) => rpn >= 200 ? 'red' : rpn >= 100 ? 'orange' : 'green'

    const handleAddFMEA = () => {
        message.info('FMEA选择器功能将在后续实现')
    }
    const handleViewFMEA = (record: any) => {
        router.push(`/tools/fmea?id=${record.id}`)
    }
    const handleRemoveFMEA = (index: number) => {
        form.relatedFMEA.splice(index, 1)
    }

    // --- 关联不良现象 Tab ---
    const phenomenonColumns = [
        { title: '现象代码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '现象名称', dataIndex: 'name', key: 'name', width: 180 },
        { title: '严重等级', key: 'severity', width: 100 },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 80 }
    ]

    const getPhenomenonSeverityColor = (level: string) => {
        switch (level) {
            case 'CR': return 'red'
            case 'MA': return 'orange'
            case 'MI': return 'blue'
            default: return 'default'
        }
    }

    // 不良现象选择器
    const phenomenonSelectorVisible = ref(false)
    const phenomenonLoading = ref(false)
    const availablePhenomena = ref < any[] > ([])
    const selectedPhenomenonKeys = ref < string[] > ([])
    const allPhenomena = ref < any[] > ([])

    const selectorPhenomenonColumns = [
        { title: '现象代码', dataIndex: 'code', key: 'code', width: 100 },
        { title: '现象名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '严重等级', key: 'severity', width: 80 },
        { title: '描述', dataIndex: 'description', key: 'description' }
    ]

    const handleAddPhenomenon = () => {
        phenomenonLoading.value = true
        setTimeout(() => {
            // 过滤已关联的
            const existingIds = form.relatedPhenomena.map(p => p.id)
            availablePhenomena.value = allPhenomena.value.filter(p => !existingIds.includes(p.id))
            selectedPhenomenonKeys.value = []
            phenomenonLoading.value = false
        }, 200)
        phenomenonSelectorVisible.value = true
    }

    const onPhenomenonSelectChange = (keys: string[]) => {
        selectedPhenomenonKeys.value = keys
    }

    const confirmPhenomenonSelection = () => {
        const newPhenomena = allPhenomena.value.filter(p => selectedPhenomenonKeys.value.includes(p.id))
        form.relatedPhenomena.push(...newPhenomena)
        phenomenonSelectorVisible.value = false
        message.success(`已添加 ${newPhenomena.length} 个不良现象`)
    }

    const handleRemovePhenomenon = (index: number) => {
        form.relatedPhenomena.splice(index, 1)
    }

    // --- 页面操作 ---
    const handleBack = () => {
        router.push('/inspection-model/defect-causes')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            message.success('保存成功')
            router.push('/inspection-model/defect-causes')
        } catch (e) {
            message.error('请完善必填项')
        } finally {
            saving.value = false
        }
    }

    // --- 数据加载 ---
    const loadData = () => {
        const id = route.params.id as string | undefined
        if (id) {
            // 模拟加载数据
            const mockItems: Record<string, any> = {
                '1': {
                    id: '1', causeCode: 'C-MAN-001', causeName: '操作不当', causeType: 'Man',
                    description: '员工未按SOP操作',
                    relatedFMEA: [
                        { id: 'f1', fmeaCode: 'FMEA-001', failureMode: '装配错误', severity: 7, occurrence: 4, detection: 5, rpn: 140 }
                    ],
                    relatedPhenomena: [
                        { id: '101', code: 'DEF-001', name: '表面划伤', severity: 'MI', description: '可见划痕' }
                    ]
                },
                '2': {
                    id: '2', causeCode: 'C-MAC-001', causeName: '设备故障', causeType: 'Machine',
                    description: '主轴跳动过大',
                    relatedFMEA: [],
                    relatedPhenomena: []
                },
                '3': {
                    id: '3', causeCode: 'C-MAT-001', causeName: '原料杂质', causeType: 'Material',
                    description: '供应商来料含杂质',
                    relatedFMEA: [],
                    relatedPhenomena: []
                }
            }
            const data = mockItems[id]
            if (data) {
                Object.assign(form, data)
            }
        }
    }

    onMounted(() => {
        loadData()
        // 加载所有可用的不良现象
        allPhenomena.value = [
            { id: '101', code: 'DEF-001', name: '表面划伤', severity: 'MI', description: '可见划痕' },
            { id: '102', code: 'DEF-002', name: '气孔', severity: 'MA', description: '表面密集气孔' },
            { id: '103', code: 'DEF-003', name: '裂纹', severity: 'CR', description: '产品裂纹' },
            { id: '104', code: 'DEF-004', name: '变形', severity: 'MA', description: '产品变形' },
            { id: '105', code: 'DEF-005', name: '色差', severity: 'MI', description: '颜色不均匀' },
            { id: '106', code: 'DEF-006', name: '尺寸偏差', severity: 'MA', description: '超出公差范围' }
        ]
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

    .form-card {
        margin-bottom: 16px;
    }

    .tab-card {
        margin-bottom: 16px;
    }

    .tab-toolbar {
        margin-bottom: 12px;
    }
</style>