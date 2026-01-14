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
                    <a-tag v-if="form.version" color="blue">{{ form.version }}</a-tag>
                    <a-tag :color="getStatusColor(form.status)">{{ getStatusText(form.status) }}</a-tag>
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
                        <a-form-item label="路线编码" name="code">
                            <a-input v-model:value="form.code" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="路线名称" name="name">
                            <a-input v-model:value="form.name" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="版本" name="version">
                            <a-input v-model:value="form.version" :disabled="isView" placeholder="如: V1.0" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="状态" name="status">
                            <a-select v-model:value="form.status" :disabled="isView" placeholder="请选择">
                                <a-select-option value="Draft">草稿</a-select-option>
                                <a-select-option value="Active">生效</a-select-option>
                                <a-select-option value="Obsolete">失效</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="生效日期" name="effectiveDate">
                            <a-date-picker v-model:value="form.effectiveDate" :disabled="isView" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="备注" name="description" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.description" :disabled="isView" :rows="2"
                                placeholder="请输入备注" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <!-- Tab页签 -->
        <a-card class="tab-card">
            <a-tabs v-model:activeKey="activeTab">
                <!-- 工序明细Tab -->
                <a-tab-pane key="steps" tab="工序明细">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="handleAddStep">
                            <PlusOutlined /> 添加工序
                        </a-button>
                    </div>
                    <a-table :columns="stepColumns" :data-source="form.steps" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'opSeq'">
                                <a-input-number v-if="!isView" v-model:value="record.opSeq" :min="1"
                                    style="width: 60px" />
                                <span v-else>{{ record.opSeq }}</span>
                            </template>
                            <template v-else-if="column.key === 'opName'">
                                <a-input v-if="!isView" v-model:value="record.opName" style="width: 100%" />
                                <span v-else>{{ record.opName }}</span>
                            </template>
                            <template v-else-if="column.key === 'workCenter'">
                                <a-input v-if="!isView" v-model:value="record.workCenter" style="width: 100%" />
                                <span v-else>{{ record.workCenter }}</span>
                            </template>
                            <template v-else-if="column.key === 'stdTime'">
                                <a-input-number v-if="!isView" v-model:value="record.stdTime" :min="0"
                                    style="width: 80px" />
                                <span v-else>{{ record.stdTime }}</span>
                            </template>
                            <template v-else-if="column.key === 'inspConfig'">
                                <a-space>
                                    <a-tag v-if="record.hasFirstInsp" color="blue" size="small">首检</a-tag>
                                    <a-tag v-if="record.hasPatrolInsp" color="green" size="small">巡检</a-tag>
                                    <a-tag v-if="record.hasFinalInsp" color="orange" size="small">末检</a-tag>
                                    <span v-if="!record.hasFirstInsp && !record.hasPatrolInsp && !record.hasFinalInsp"
                                        style="color: #999">未配置</span>
                                    <a-button type="link" size="small"
                                        @click.stop="openInspConfigModal(record)">配置</a-button>
                                </a-space>
                            </template>
                            <template v-else-if="column.key === 'description'">
                                <a-input v-if="!isView" v-model:value="record.description" style="width: 100%" />
                                <span v-else>{{ record.description }}</span>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-button v-if="!isView" type="link" danger size="small"
                                    @click="handleRemoveStep(index)">删除</a-button>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="form.steps.length === 0" description="暂无工序，请添加" />
                </a-tab-pane>

                <!-- 关联物料Tab -->
                <a-tab-pane key="materials" tab="关联物料">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="handleAddMaterial">
                            <PlusOutlined /> 添加物料
                        </a-button>
                    </div>
                    <a-table :columns="materialColumns" :data-source="form.materials" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'category'">
                                <a-tag :color="getCategoryColor(record.category)">{{ getCategoryText(record.category)
                                    }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'source'">
                                {{ record.source === 'Buy' ? '采购' : '自制' }}
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleViewMaterial(record)">查看</a-button>
                                    <a-button v-if="!isView" type="link" danger size="small"
                                        @click="handleRemoveMaterial(index)">移除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="form.materials.length === 0" description="暂无关联物料" />
                </a-tab-pane>
            </a-tabs>
        </a-card>

        <!-- 工序检验配置弹窗 -->
        <OperationInspConfigModal v-model:visible="stepInspModalVisible" :operationInfo="currentStepInfo"
            @save="handleSaveStepInspConfig" />

        <!-- 添加物料弹窗 -->
        <a-modal v-model:visible="addMaterialModalVisible" title="添加关联物料" width="600px" @ok="handleConfirmAddMaterial">
            <a-form layout="vertical">
                <a-form-item label="选择物料">
                    <a-select v-model:value="selectedMaterialIds" mode="multiple" show-search placeholder="请选择物料（支持多选）"
                        :filter-option="filterMaterialOption" style="width: 100%">
                        <a-select-option v-for="m in availableMaterials" :key="m.id" :value="m.id">
                            {{ m.code }} - {{ m.name }} ({{ m.spec }})
                        </a-select-option>
                    </a-select>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'
    import OperationInspConfigModal from '@/components/OperationInspConfigModal.vue'

    const router = useRouter()
    const route = useRoute()

    // --- 页面状态 ---
    const formRef = ref()
    const saving = ref(false)
    const activeTab = ref('steps')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => {
        if (isView.value) return '查看工艺路线'
        return isEdit.value ? '编辑工艺路线' : '新增工艺路线'
    })

    // --- 基本信息表单 ---
    const form = reactive({
        id: null as string | null,
        code: '',
        name: '',
        version: 'V1.0',
        status: 'Draft',
        effectiveDate: undefined as any,
        description: '',
        steps: [] as any[],
        materials: [] as any[]
    })

    const rules = {
        code: [{ required: true, message: '请输入路线编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入路线名称', trigger: 'blur' }]
    }

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = { Active: 'success', Draft: 'default', Obsolete: 'error' }
        return map[status] || 'default'
    }
    const getStatusText = (status: string) => {
        const map: Record<string, string> = { Active: '生效', Draft: '草稿', Obsolete: '失效' }
        return map[status] || status
    }
    const getCategoryColor = (cat: string) => {
        const map: Record<string, string> = { Raw: 'blue', Semi: 'orange', Finish: 'green' }
        return map[cat] || 'default'
    }
    const getCategoryText = (cat: string) => {
        const map: Record<string, string> = { Raw: '原材料', Semi: '半成品', Finish: '成品' }
        return map[cat] || cat
    }

    // --- 物料选项 ---
    const allMaterialOptions = ref([
        { id: '1', code: 'M001', name: '铝锭', spec: 'ADC12', category: 'Raw', unit: 'kg', source: 'Buy' },
        { id: '2', code: 'P001', name: '发动机壳体', spec: 'V1.0', category: 'Semi', unit: 'pcs', source: 'Make' },
        { id: '3', code: 'F001', name: '电动车电机', spec: '500W', category: 'Finish', unit: 'set', source: 'Make' },
        { id: '4', code: 'M002', name: '铜线', spec: '0.5mm', category: 'Raw', unit: 'kg', source: 'Buy' },
        { id: '5', code: 'M003', name: '硅钢片', spec: 'B35A250', category: 'Raw', unit: 'kg', source: 'Buy' },
    ])

    const filterMaterialOption = (input: string, option: any) => {
        const m = allMaterialOptions.value.find(p => p.id === option.value)
        if (!m) return false
        return m.code.toLowerCase().includes(input.toLowerCase()) ||
            m.name.toLowerCase().includes(input.toLowerCase())
    }

    // 可用的物料（排除已添加的）
    const availableMaterials = computed(() => {
        const existingIds = form.materials.map(m => m.id)
        return allMaterialOptions.value.filter(m => !existingIds.includes(m.id))
    })

    // --- 关联物料Tab ---
    const materialColumns = [
        { title: '物料编码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '物料名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '规格型号', dataIndex: 'spec', key: 'spec', width: 120 },
        { title: '分类', key: 'category', width: 100 },
        { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: '来源', key: 'source', width: 80 },
        { title: '操作', key: 'action', width: 120 }
    ]

    const addMaterialModalVisible = ref(false)
    const selectedMaterialIds = ref < string[] > ([])

    const handleAddMaterial = () => {
        selectedMaterialIds.value = []
        addMaterialModalVisible.value = true
    }

    const handleConfirmAddMaterial = () => {
        const newMaterials = allMaterialOptions.value.filter(m => selectedMaterialIds.value.includes(m.id))
        form.materials.push(...newMaterials)
        addMaterialModalVisible.value = false
        message.success(`已添加 ${newMaterials.length} 个物料`)
    }

    const handleRemoveMaterial = (index: number) => {
        form.materials.splice(index, 1)
    }

    const handleViewMaterial = (record: any) => {
        router.push(`/basic-data/material/view/${record.id}`)
    }

    // --- 工序明细Tab ---
    const stepColumns = [
        { title: '序号', key: 'opSeq', width: 80 },
        { title: '工序名称', key: 'opName', width: 150 },
        { title: '工作中心', key: 'workCenter', width: 120 },
        { title: '标准工时(分)', key: 'stdTime', width: 100 },
        { title: '检验配置', key: 'inspConfig', width: 220 },
        { title: '工序描述', key: 'description' },
        { title: '操作', key: 'action', width: 80 }
    ]

    const handleAddStep = () => {
        form.steps.push({
            id: Date.now().toString(),
            opSeq: (form.steps.length + 1) * 10,
            opName: '',
            workCenter: '',
            stdTime: 0,
            description: '',
            hasFirstInsp: false,
            hasPatrolInsp: false,
            hasFinalInsp: false
        })
    }

    const handleRemoveStep = (index: number) => {
        form.steps.splice(index, 1)
    }

    // --- 工序检验配置 ---
    const stepInspModalVisible = ref(false)
    const currentStepInfo = reactive({ id: '', opSeq: 0, opName: '', routeId: '' })

    const openInspConfigModal = (record: any) => {
        console.log('Opening insp config modal for:', record)
        Object.assign(currentStepInfo, {
            id: String(record.id),
            opSeq: record.opSeq,
            opName: record.opName,
            routeId: form.id || ''
        })
        stepInspModalVisible.value = true
    }

    const handleSaveStepInspConfig = (data: any) => {
        console.log('Saving insp config:', data)
        const step = form.steps.find(s => String(s.id) === data.operationId)
        if (step) {
            step.hasFirstInsp = data.firstInspPlans.length > 0
            step.hasPatrolInsp = data.patrolInspPlans.length > 0
            step.hasFinalInsp = data.finalInspPlans.length > 0
        }
        message.success('检验配置已更新')
    }

    // --- 页面操作 ---
    const handleBack = () => {
        router.push('/basic-data/process-route')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            message.success('保存成功')
            router.push('/basic-data/process-route')
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
            // 模拟加载工艺路线数据
            const mockRoutes: Record<string, any> = {
                '1': {
                    id: '1', code: 'PR-001', name: '壳体加工工艺', version: 'V1.0', status: 'Active', description: '压铸机加工',
                    steps: [
                        { id: '101', opSeq: 10, opName: '熔炼', workCenter: 'WC-01', stdTime: 30, description: '铝液熔炼', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                        { id: '102', opSeq: 20, opName: '压铸', workCenter: 'WC-02', stdTime: 15, description: '高压压铸', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                        { id: '103', opSeq: 30, opName: '去毛刺', workCenter: 'WC-03', stdTime: 10, description: '人工去毛刺', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true },
                    ],
                    materials: [
                        { id: '1', code: 'M001', name: '铝锭', spec: 'ADC12', category: 'Raw', unit: 'kg', source: 'Buy' },
                        { id: '2', code: 'P001', name: '发动机壳体', spec: 'V1.0', category: 'Semi', unit: 'pcs', source: 'Make' }
                    ]
                },
                '2': {
                    id: '2', code: 'PR-002', name: '电机组装工艺', version: 'V1.0', status: 'Draft', description: '电机装配流程',
                    steps: [
                        { id: '201', opSeq: 10, opName: '绕线', workCenter: 'WC-10', stdTime: 45, description: '定子绕线', hasFirstInsp: true, hasPatrolInsp: false, hasFinalInsp: false },
                        { id: '202', opSeq: 20, opName: '总装', workCenter: 'WC-11', stdTime: 20, description: '电机组装', hasFirstInsp: false, hasPatrolInsp: true, hasFinalInsp: true },
                    ],
                    materials: [
                        { id: '3', code: 'F001', name: '电动车电机', spec: '500W', category: 'Finish', unit: 'set', source: 'Make' },
                        { id: '4', code: 'M002', name: '铜线', spec: '0.5mm', category: 'Raw', unit: 'kg', source: 'Buy' },
                        { id: '5', code: 'M003', name: '硅钢片', spec: 'B35A250', category: 'Raw', unit: 'kg', source: 'Buy' }
                    ]
                }
            }
            const data = mockRoutes[id]
            if (data) {
                Object.assign(form, data)
            }
        }
    }

    onMounted(() => {
        loadData()
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