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
                    <a-tag v-if="form.category" :color="getCategoryColor(form.category)">{{
                        getCategoryText(form.category) }}</a-tag>
                    <a-tag color="green">启用</a-tag>
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
                        <a-form-item label="物料编码" name="code">
                            <a-input v-model:value="form.code" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="物料名称" name="name">
                            <a-input v-model:value="form.name" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="规格型号" name="spec">
                            <a-input v-model:value="form.spec" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="物料分类" name="category">
                            <a-select v-model:value="form.category" :disabled="isView" placeholder="请选择">
                                <a-select-option value="Raw">原材料</a-select-option>
                                <a-select-option value="Semi">半成品</a-select-option>
                                <a-select-option value="Finish">成品</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="单位" name="unit">
                            <a-input v-model:value="form.unit" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="来源" name="source">
                            <a-select v-model:value="form.source" :disabled="isView" placeholder="请选择">
                                <a-select-option value="Buy">采购</a-select-option>
                                <a-select-option value="Make">自制</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="状态" name="status">
                            <a-select v-model:value="form.status" :disabled="isView" placeholder="请选择">
                                <a-select-option value="Active">启用</a-select-option>
                                <a-select-option value="Inactive">停用</a-select-option>
                                <a-select-option value="Obsolete">废弃</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="国标码" name="nationalCode">
                            <a-input v-model:value="form.nationalCode" :disabled="isView" placeholder="如: GB/T XXX" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="保质期(天)" name="shelfLifeDays">
                            <a-input-number v-model:value="form.shelfLifeDays" :disabled="isView" :min="0"
                                style="width: 100%" placeholder="输入天数" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="毛重(kg)" name="grossWeight">
                            <a-input-number v-model:value="form.grossWeight" :disabled="isView" :min="0" :precision="3"
                                style="width: 100%" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="净重(kg)" name="netWeight">
                            <a-input-number v-model:value="form.netWeight" :disabled="isView" :min="0" :precision="3"
                                style="width: 100%" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="尺寸(mm)" name="dimensions">
                            <a-input v-model:value="form.dimensions" :disabled="isView" placeholder="如: 100x50x30" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="备注" name="remark" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.remark" :disabled="isView" :rows="2" placeholder="请输入备注" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <!-- Tab页签 -->
        <a-card class="tab-card">
            <a-tabs v-model:activeKey="activeTab">
                <!-- 工艺路线Tab -->
                <a-tab-pane key="routes" tab="工艺路线">
                    <a-table :columns="routeColumns" :data-source="routeData" :loading="routeLoading" row-key="id"
                        size="middle" :pagination="false">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'status'">
                                <a-tag :color="getRouteStatusColor(record.status)">{{ getRouteStatusText(record.status)
                                    }}</a-tag>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-button type="link" size="small"
                                    @click="handleViewRouteDetail(record)">查看详情</a-button>
                            </template>
                        </template>
                        <!-- 展开的工序明细 -->
                        <template #expandedRowRender="{ record }">
                            <a-table :columns="stepColumns" :data-source="record.steps" :pagination="false"
                                size="small">
                                <template #bodyCell="{ column, record: step }">
                                    <template v-if="column.key === 'inspConfig'">
                                        <a-space>
                                            <a-tag v-if="step.hasFirstInsp" color="blue" size="small">首检</a-tag>
                                            <a-tag v-if="step.hasPatrolInsp" color="green" size="small">巡检</a-tag>
                                            <a-tag v-if="step.hasFinalInsp" color="orange" size="small">末检</a-tag>
                                            <a-button type="link" size="small"
                                                @click="handleConfigStepInsp(record, step)" v-if="!isView">配置</a-button>
                                        </a-space>
                                    </template>
                                </template>
                            </a-table>
                        </template>
                    </a-table>
                    <a-empty v-if="routeData.length === 0 && !routeLoading" description="暂无关联的工艺路线" />
                </a-tab-pane>

                <!-- 检验配置Tab -->
                <a-tab-pane key="inspConfig" tab="检验配置">
                    <!-- IQC -->
                    <a-card size="small" title="IQC 来料检验" class="insp-section">
                        <template #extra v-if="!isView">
                            <a-button type="primary" size="small" ghost @click="handleAddInspPlan('IQC')">
                                <PlusOutlined /> 新增绑定
                            </a-button>
                        </template>
                        <a-table :columns="inspPlanColumns" :data-source="iqcPlans" row-key="id" size="small"
                            :pagination="false">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'isDefault'">
                                    <a-tag v-if="record.isDefault" color="gold">默认</a-tag>
                                </template>
                                <template v-if="column.key === 'action'">
                                    <a-space v-if="!isView">
                                        <a-button type="link" size="small"
                                            @click="handleEditInspPlan('IQC', record)">编辑</a-button>
                                        <a-button type="link" danger size="small"
                                            @click="handleDeleteInspPlan('IQC', record)">删除</a-button>
                                    </a-space>
                                </template>
                            </template>
                        </a-table>
                        <a-empty v-if="iqcPlans.length === 0" description="暂无绑定" />
                    </a-card>

                    <!-- FQC -->
                    <a-card size="small" title="FQC 成品检验" class="insp-section">
                        <template #extra v-if="!isView">
                            <a-button type="primary" size="small" ghost @click="handleAddInspPlan('FQC')">
                                <PlusOutlined /> 新增绑定
                            </a-button>
                        </template>
                        <a-table :columns="inspPlanColumns" :data-source="fqcPlans" row-key="id" size="small"
                            :pagination="false">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'isDefault'">
                                    <a-tag v-if="record.isDefault" color="gold">默认</a-tag>
                                </template>
                                <template v-if="column.key === 'action'">
                                    <a-space v-if="!isView">
                                        <a-button type="link" size="small"
                                            @click="handleEditInspPlan('FQC', record)">编辑</a-button>
                                        <a-button type="link" danger size="small"
                                            @click="handleDeleteInspPlan('FQC', record)">删除</a-button>
                                    </a-space>
                                </template>
                            </template>
                        </a-table>
                        <a-empty v-if="fqcPlans.length === 0" description="暂无绑定" />
                    </a-card>

                    <!-- OQC -->
                    <a-card size="small" title="OQC 出货检验" class="insp-section">
                        <template #extra v-if="!isView">
                            <a-button type="primary" size="small" ghost @click="handleAddInspPlan('OQC')">
                                <PlusOutlined /> 新增绑定
                            </a-button>
                        </template>
                        <a-table :columns="inspPlanColumns" :data-source="oqcPlans" row-key="id" size="small"
                            :pagination="false">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'isDefault'">
                                    <a-tag v-if="record.isDefault" color="gold">默认</a-tag>
                                </template>
                                <template v-if="column.key === 'action'">
                                    <a-space v-if="!isView">
                                        <a-button type="link" size="small"
                                            @click="handleEditInspPlan('OQC', record)">编辑</a-button>
                                        <a-button type="link" danger size="small"
                                            @click="handleDeleteInspPlan('OQC', record)">删除</a-button>
                                    </a-space>
                                </template>
                            </template>
                        </a-table>
                        <a-empty v-if="oqcPlans.length === 0" description="暂无绑定" />
                    </a-card>
                </a-tab-pane>

                <!-- 检验规格Tab -->
                <a-tab-pane key="specs" tab="检验规格">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-space>
                            <a-button type="primary" size="small" @click="handleAddSpec">
                                <PlusOutlined /> 新增规格
                            </a-button>
                            <a-button size="small" @click="handleExportSpecs">导出</a-button>
                        </a-space>
                    </div>
                    <a-table :columns="specColumns" :data-source="specData" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'dataType'">
                                <a-tag :color="record.dataType === 'QUANTITATIVE' ? 'blue' : 'purple'">
                                    {{ record.dataType === 'QUANTITATIVE' ? '计量型' : '计数型' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-space v-if="!isView">
                                    <a-button type="link" size="small" @click="handleEditSpec(record)">编辑</a-button>
                                    <a-button type="link" danger size="small"
                                        @click="handleDeleteSpec(record)">删除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="specData.length === 0" description="暂无检验规格" />
                </a-tab-pane>
            </a-tabs>
        </a-card>

        <!-- 工序检验配置弹窗 -->
        <OperationInspConfigModal v-model:visible="stepInspModalVisible" :operationInfo="currentStepInfo"
            @save="handleSaveStepInspConfig" />

        <!-- 检验方案绑定弹窗 -->
        <a-modal v-model:visible="inspPlanModalVisible" :title="inspPlanModalTitle" width="500px"
            @ok="handleSaveInspPlan">
            <a-form ref="inspPlanFormRef" :model="inspPlanForm" :rules="inspPlanRules" layout="vertical">
                <a-form-item label="检验方案" name="planId">
                    <a-select v-model:value="inspPlanForm.planId" placeholder="请选择检验方案" show-search>
                        <a-select-option v-for="p in planOptions" :key="p.id" :value="p.id">
                            {{ p.code }} - {{ p.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="优先级" name="priority">
                    <a-input-number v-model:value="inspPlanForm.priority" :min="1" :max="99" style="width: 100%" />
                </a-form-item>
                <a-form-item label="设为默认">
                    <a-switch v-model:checked="inspPlanForm.isDefault" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 检验规格编辑弹窗 -->
        <a-modal v-model:visible="specModalVisible" :title="isEditSpec ? '编辑检验规格' : '新增检验规格'" width="600px"
            @ok="handleSaveSpec">
            <a-form ref="specFormRef" :model="specForm" :rules="specRules" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="检验项目" name="inspItemName">
                            <a-input v-model:value="specForm.inspItemName" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="数据类型" name="dataType">
                            <a-select v-model:value="specForm.dataType" placeholder="请选择">
                                <a-select-option value="QUANTITATIVE">计量型</a-select-option>
                                <a-select-option value="QUALITATIVE">计数型</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <template v-if="specForm.dataType === 'QUANTITATIVE'">
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="目标值">
                                <a-input-number v-model:value="specForm.targetValue" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="上限">
                                <a-input-number v-model:value="specForm.upperLimit" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="下限">
                                <a-input-number v-model:value="specForm.lowerLimit" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="单位">
                                <a-input v-model:value="specForm.uom" placeholder="如: mm" />
                            </a-form-item>
                        </a-col>
                    </a-row>
                </template>
                <template v-else>
                    <a-form-item label="合格标准">
                        <a-textarea v-model:value="specForm.qualitativeStandard" :rows="2" placeholder="请描述合格标准" />
                    </a-form-item>
                </template>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'
    import OperationInspConfigModal from '@/components/OperationInspConfigModal.vue'

    const router = useRouter()
    const route = useRoute()

    // --- 页面状态 ---
    const formRef = ref()
    const saving = ref(false)
    const activeTab = ref('routes')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => {
        if (isView.value) return '查看物料档案'
        return isEdit.value ? '编辑物料档案' : '新增物料档案'
    })

    // --- 基本信息表单 ---
    const form = reactive({
        id: null as string | null,
        code: '',
        name: '',
        spec: '',
        category: undefined as string | undefined,
        unit: '',
        source: undefined as string | undefined,
        status: 'Active',
        nationalCode: '',
        shelfLifeDays: undefined as number | undefined,
        grossWeight: undefined as number | undefined,
        netWeight: undefined as number | undefined,
        dimensions: '',
        remark: ''
    })

    const rules = {
        code: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
        category: [{ required: true, message: '请选择物料分类', trigger: 'change' }]
    }

    const getCategoryColor = (cat: string) => {
        const map: Record<string, string> = { Raw: 'blue', Semi: 'orange', Finish: 'green' }
        return map[cat] || 'default'
    }
    const getCategoryText = (cat: string) => {
        const map: Record<string, string> = { Raw: '原材料', Semi: '半成品', Finish: '成品' }
        return map[cat] || cat
    }

    // --- 工艺路线Tab ---
    const routeLoading = ref(false)
    const routeData = ref < any[] > ([])

    const routeColumns = [
        { title: '路线编码', dataIndex: 'code', key: 'code', width: 150 },
        { title: '路线名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '工序数', dataIndex: 'stepCount', key: 'stepCount', width: 80 },
        { title: '操作', key: 'action', width: 100 }
    ]

    const stepColumns = [
        { title: '序号', dataIndex: 'opSeq', key: 'opSeq', width: 60 },
        { title: '工序名称', dataIndex: 'opName', key: 'opName', width: 120 },
        { title: '工作中心', dataIndex: 'workCenter', key: 'workCenter', width: 100 },
        { title: '检验配置', key: 'inspConfig', width: 200 },
        { title: '工序描述', dataIndex: 'description', key: 'description' }
    ]

    const getRouteStatusColor = (status: string) => {
        const map: Record<string, string> = { Active: 'success', Draft: 'default', Obsolete: 'error' }
        return map[status] || 'default'
    }
    const getRouteStatusText = (status: string) => {
        const map: Record<string, string> = { Active: '生效', Draft: '草稿', Obsolete: '失效' }
        return map[status] || status
    }

    const handleViewRouteDetail = (record: any) => {
        router.push(`/basic-data/process-routes?code=${record.code}`)
    }

    // 工序检验配置弹窗
    const stepInspModalVisible = ref(false)
    const currentRouteId = ref('')
    const currentStepInfo = reactive({ id: '', opSeq: 0, opName: '', routeId: '' })

    const handleConfigStepInsp = (route: any, step: any) => {
        currentRouteId.value = route.id
        Object.assign(currentStepInfo, {
            id: String(step.id),
            opSeq: step.opSeq,
            opName: step.opName,
            routeId: route.id
        })
        stepInspModalVisible.value = true
    }

    const handleSaveStepInspConfig = (data: any) => {
        // 更新工序的检验配置状态
        const route = routeData.value.find(r => r.id === currentRouteId.value)
        if (route) {
            const step = route.steps.find((s: any) => String(s.id) === data.operationId)
            if (step) {
                step.hasFirstInsp = data.firstInspPlans.length > 0
                step.hasPatrolInsp = data.patrolInspPlans.length > 0
                step.hasFinalInsp = data.finalInspPlans.length > 0
            }
        }
    }

    // --- 检验配置Tab ---
    const iqcPlans = ref < any[] > ([])
    const fqcPlans = ref < any[] > ([])
    const oqcPlans = ref < any[] > ([])

    const inspPlanColumns = [
        { title: '方案编码', dataIndex: 'planCode', key: 'planCode', width: 150 },
        { title: '方案名称', dataIndex: 'planName', key: 'planName' },
        { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
        { title: '默认', key: 'isDefault', width: 80 },
        { title: '操作', key: 'action', width: 120 }
    ]

    const planOptions = ref([
        { id: 'p1', code: 'IQC-001', name: '来料标准检验方案' },
        { id: 'p2', code: 'IQC-002', name: '来料加严检验方案' },
        { id: 'p3', code: 'FQC-001', name: '成品标准检验方案' },
        { id: 'p4', code: 'OQC-001', name: '出货抽样检验方案' },
    ])

    const inspPlanModalVisible = ref(false)
    const inspPlanFormRef = ref()
    const currentInspType = ref < 'IQC' | 'FQC' | 'OQC' > ('IQC')
    const isEditInspPlan = ref(false)

    const inspPlanForm = reactive({
        id: null as string | null,
        planId: undefined as string | undefined,
        priority: 1,
        isDefault: false
    })

    const inspPlanRules = {
        planId: [{ required: true, message: '请选择检验方案', trigger: 'change' }]
    }

    const inspPlanModalTitle = computed(() => {
        const typeNames: Record<string, string> = { IQC: 'IQC来料检验', FQC: 'FQC成品检验', OQC: 'OQC出货检验' }
        return `${isEditInspPlan.value ? '编辑' : '新增'}${typeNames[currentInspType.value]}方案绑定`
    })

    const handleAddInspPlan = (type: 'IQC' | 'FQC' | 'OQC') => {
        currentInspType.value = type
        isEditInspPlan.value = false
        Object.assign(inspPlanForm, { id: null, planId: undefined, priority: 1, isDefault: false })
        inspPlanModalVisible.value = true
    }

    const handleEditInspPlan = (type: 'IQC' | 'FQC' | 'OQC', record: any) => {
        currentInspType.value = type
        isEditInspPlan.value = true
        Object.assign(inspPlanForm, { ...record })
        inspPlanModalVisible.value = true
    }

    const handleDeleteInspPlan = (type: 'IQC' | 'FQC' | 'OQC', record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除与 ${record.planName} 的绑定吗？`,
            okType: 'danger',
            onOk() {
                if (type === 'IQC') iqcPlans.value = iqcPlans.value.filter(i => i.id !== record.id)
                else if (type === 'FQC') fqcPlans.value = fqcPlans.value.filter(i => i.id !== record.id)
                else oqcPlans.value = oqcPlans.value.filter(i => i.id !== record.id)
                message.success('删除成功')
            }
        })
    }

    const handleSaveInspPlan = () => {
        inspPlanFormRef.value?.validate().then(() => {
            const plan = planOptions.value.find(p => p.id === inspPlanForm.planId)
            const binding = {
                ...inspPlanForm,
                id: inspPlanForm.id || Date.now().toString(),
                planCode: plan?.code,
                planName: plan?.name
            }

            const targetList = currentInspType.value === 'IQC' ? iqcPlans : currentInspType.value === 'FQC' ? fqcPlans : oqcPlans
            if (binding.isDefault) {
                targetList.value.forEach((p: any) => { p.isDefault = false })
            }

            if (isEditInspPlan.value) {
                const idx = targetList.value.findIndex((i: any) => i.id === binding.id)
                if (idx > -1) Object.assign(targetList.value[idx], binding)
            } else {
                targetList.value.push(binding)
            }
            message.success('保存成功')
            inspPlanModalVisible.value = false
        })
    }

    // --- 检验规格Tab ---
    const specData = ref < any[] > ([])
    const specModalVisible = ref(false)
    const specFormRef = ref()
    const isEditSpec = ref(false)

    const specColumns = [
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '数据类型', key: 'dataType', width: 100 },
        { title: '目标值', dataIndex: 'targetValue', key: 'targetValue', width: 80 },
        { title: '上限', dataIndex: 'upperLimit', key: 'upperLimit', width: 80 },
        { title: '下限', dataIndex: 'lowerLimit', key: 'lowerLimit', width: 80 },
        { title: '单位', dataIndex: 'uom', key: 'uom', width: 60 },
        { title: '操作', key: 'action', width: 120 }
    ]

    const specForm = reactive({
        id: null as string | null,
        inspItemName: '',
        dataType: 'QUANTITATIVE' as string,
        targetValue: undefined as number | undefined,
        upperLimit: undefined as number | undefined,
        lowerLimit: undefined as number | undefined,
        uom: '',
        qualitativeStandard: ''
    })

    const specRules = {
        inspItemName: [{ required: true, message: '请输入检验项目', trigger: 'blur' }],
        dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
    }

    const handleAddSpec = () => {
        isEditSpec.value = false
        Object.assign(specForm, {
            id: null, inspItemName: '', dataType: 'QUANTITATIVE',
            targetValue: undefined, upperLimit: undefined, lowerLimit: undefined, uom: '', qualitativeStandard: ''
        })
        specModalVisible.value = true
    }

    const handleEditSpec = (record: any) => {
        isEditSpec.value = true
        Object.assign(specForm, { ...record })
        specModalVisible.value = true
    }

    const handleDeleteSpec = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除检验规格 ${record.inspItemName} 吗？`,
            okType: 'danger',
            onOk() {
                specData.value = specData.value.filter(i => i.id !== record.id)
                message.success('删除成功')
            }
        })
    }

    const handleSaveSpec = () => {
        specFormRef.value?.validate().then(() => {
            if (isEditSpec.value) {
                const idx = specData.value.findIndex(i => i.id === specForm.id)
                if (idx > -1) Object.assign(specData.value[idx], { ...specForm })
            } else {
                specData.value.push({ ...specForm, id: Date.now().toString() })
            }
            message.success('保存成功')
            specModalVisible.value = false
        })
    }

    const handleExportSpecs = () => {
        message.success('导出任务已开始')
    }

    // --- 页面操作 ---
    const handleBack = () => {
        router.push('/basic-data/material')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            message.success('保存成功')
            router.push('/basic-data/material')
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
            // 模拟加载物料数据
            const mockMaterials: Record<string, any> = {
                '1': { id: '1', code: 'M001', name: '铝锭', spec: 'ADC12', category: 'Raw', unit: 'kg', source: 'Buy', status: 'Active', nationalCode: 'GB/T 8733', shelfLifeDays: 365, grossWeight: 25.5, netWeight: 25, dimensions: '200x100x50', remark: '' },
                '2': { id: '2', code: 'P001', name: '发动机壳体', spec: 'V1.0', category: 'Semi', unit: 'pcs', source: 'Make', status: 'Active', nationalCode: '', shelfLifeDays: undefined, grossWeight: 3.2, netWeight: 2.8, dimensions: '350x250x150', remark: '' },
                '3': { id: '3', code: 'F001', name: '电动车电机', spec: '500W', category: 'Finish', unit: 'set', source: 'Make', status: 'Active', nationalCode: 'GB/T 18488', shelfLifeDays: 730, grossWeight: 5.5, netWeight: 5.0, dimensions: '180x180x220', remark: '' }
            }
            const data = mockMaterials[id]
            if (data) Object.assign(form, data)

            // 加载工艺路线
            loadRouteData(id)
            // 加载检验方案绑定
            loadInspPlanData(id)
            // 加载检验规格
            loadSpecData(id)
        }
    }

    const loadRouteData = (materialId: string) => {
        routeLoading.value = true
        setTimeout(() => {
            const mockRoutes: Record<string, any[]> = {
                '1': [
                    {
                        id: 'r1', code: 'PR-ALU-001', name: '铝锭标准工艺', version: 'V1.0', status: 'Active', stepCount: 3,
                        steps: [
                            { id: 's1', opSeq: 10, opName: '熔炼', workCenter: 'WC-01', description: '铝液熔炼', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's2', opSeq: 20, opName: '浇铸', workCenter: 'WC-02', description: '连续浇铸', hasFirstInsp: false, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's3', opSeq: 30, opName: '冷却切割', workCenter: 'WC-03', description: '冷却定型切割', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true }
                        ]
                    }
                ],
                '2': [
                    {
                        id: 'r2', code: 'PR-SHELL-001', name: '壳体加工工艺', version: 'V1.0', status: 'Active', stepCount: 4,
                        steps: [
                            { id: 's4', opSeq: 10, opName: '压铸', workCenter: 'WC-10', description: '高压压铸', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's5', opSeq: 20, opName: '去毛刺', workCenter: 'WC-11', description: '人工去毛刺', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: false },
                            { id: 's6', opSeq: 30, opName: '机加工', workCenter: 'WC-12', description: 'CNC加工', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                            { id: 's7', opSeq: 40, opName: '抛光', workCenter: 'WC-13', description: '表面抛光', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true }
                        ]
                    }
                ],
                '3': []
            }
            routeData.value = mockRoutes[materialId] || []
            routeLoading.value = false
        }, 300)
    }

    const loadInspPlanData = (materialId: string) => {
        const mockData: Record<string, any> = {
            '1': {
                iqc: [{ id: 'b1', planId: 'p1', planCode: 'IQC-001', planName: '来料标准检验方案', priority: 1, isDefault: true }],
                fqc: [],
                oqc: []
            },
            '2': {
                iqc: [],
                fqc: [{ id: 'b2', planId: 'p3', planCode: 'FQC-001', planName: '成品标准检验方案', priority: 1, isDefault: true }],
                oqc: []
            },
            '3': {
                iqc: [],
                fqc: [{ id: 'b3', planId: 'p3', planCode: 'FQC-001', planName: '成品标准检验方案', priority: 1, isDefault: true }],
                oqc: [{ id: 'b4', planId: 'p4', planCode: 'OQC-001', planName: '出货抽样检验方案', priority: 1, isDefault: true }]
            }
        }
        const data = mockData[materialId] || { iqc: [], fqc: [], oqc: [] }
        iqcPlans.value = data.iqc
        fqcPlans.value = data.fqc
        oqcPlans.value = data.oqc
    }

    const loadSpecData = (materialId: string) => {
        const mockData: Record<string, any[]> = {
            '1': [
                { id: 'sp1', inspItemName: '化学成分-Si', dataType: 'QUANTITATIVE', targetValue: 11, upperLimit: 13, lowerLimit: 9, uom: '%' },
                { id: 'sp2', inspItemName: '化学成分-Fe', dataType: 'QUANTITATIVE', targetValue: 1.2, upperLimit: 1.5, lowerLimit: 0, uom: '%' }
            ],
            '2': [
                { id: 'sp3', inspItemName: '外观', dataType: 'QUALITATIVE', qualitativeStandard: '无裂纹、无气孔' },
                { id: 'sp4', inspItemName: '尺寸A', dataType: 'QUANTITATIVE', targetValue: 100, upperLimit: 100.5, lowerLimit: 99.5, uom: 'mm' }
            ],
            '3': []
        }
        specData.value = mockData[materialId] || []
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

    .insp-section {
        margin-bottom: 16px;
    }

    .insp-section :deep(.ant-card-body) {
        padding: 12px 16px;
    }
</style>