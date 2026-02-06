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
                    <a-tag v-if="form.samplingMethod" :color="getMethodColor(form.samplingMethod)">
                        {{ getMethodText(form.samplingMethod) }}
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
                        <a-form-item label="方案代码" name="planCode">
                            <a-input v-model:value="form.planCode" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="方案名称" name="planName">
                            <a-input v-model:value="form.planName" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="抽样方法" name="samplingMethod">
                            <a-select v-model:value="form.samplingMethod" :disabled="isView" placeholder="请选择">
                                <a-select-option value="STANDARD_BASED">国标/标准</a-select-option>
                                <a-select-option value="FIXED_QUANTITY">固定数量</a-select-option>
                                <a-select-option value="PERCENTAGE">百分比</a-select-option>
                                <a-select-option value="FULL_INSPECTION">全检</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="适用标准" name="standard">
                            <a-input v-model:value="form.standard" :disabled="isView" placeholder="如: GB/T 2828.1" />
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
                <!-- 抽样规则Tab -->
                <a-tab-pane key="rules" tab="抽样规则">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="handleAddRule">
                            <PlusOutlined /> 添加规则
                        </a-button>
                    </div>
                    <a-table :columns="ruleColumns" :data-source="form.rules" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'inspectionLevel'">
                                <a-tag color="blue">{{ record.inspectionLevel }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'inspectionType'">
                                <a-tag :color="getInspTypeColor(record.inspectionType)">
                                    {{ getInspTypeText(record.inspectionType) }}
                                </a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleEditRule(record)">编辑</a-button>
                                    <a-button v-if="!isView" type="link" danger size="small"
                                        @click="handleRemoveRule(index)">删除</a-button>
                                </a-space>
                            </template>
                        </template>
                        <!-- 嵌套子表格：抽样明细 -->
                        <template #expandedRowRender="{ record }">
                            <div class="detail-table-wrapper">
                                <div class="detail-header">抽样明细 ({{ record.ruleCode }})</div>
                                <a-table :columns="detailColumns" :data-source="record.details" row-key="id"
                                    size="small" :pagination="false" bordered />
                            </div>
                        </template>
                    </a-table>
                    <a-empty v-if="form.rules.length === 0" description="暂无抽样规则，请添加" />
                </a-tab-pane>
            </a-tabs>
        </a-card>

        <!-- 规则编辑弹窗 -->
        <a-modal v-model:visible="ruleModalVisible" :title="isEditRule ? '编辑规则' : '新增规则'" width="900px" @ok="saveRule">
            <a-form layout="vertical" :model="ruleForm">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="规则代码" required>
                            <a-input v-model:value="ruleForm.ruleCode" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="规则名称" required>
                            <a-input v-model:value="ruleForm.ruleName" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- 动态提示信息 -->
                <a-alert v-if="form.samplingMethod === 'STANDARD_BASED'" message="国标抽样模式"
                    description="需要配置检验水平、AQL值和抽样明细表" type="info" show-icon style="margin-bottom: 16px;" />
                <a-alert v-else-if="form.samplingMethod === 'FIXED_QUANTITY'" message="固定数量抽样模式"
                    description="需要设置固定的样本数量" type="success" show-icon style="margin-bottom: 16px;" />
                <a-alert v-else-if="form.samplingMethod === 'PERCENTAGE'" message="百分比抽样模式"
                    description="需要设置抽样比率（1-100%）" type="warning" show-icon style="margin-bottom: 16px;" />
                <a-alert v-else-if="form.samplingMethod === 'FULL_INSPECTION'" message="全检模式" description="无需配置额外参数"
                    type="default" show-icon style="margin-bottom: 16px;" />

                <!-- 国标抽样：显示检验水平、类型、AQL -->
                <a-row :gutter="16" v-if="form.samplingMethod === 'STANDARD_BASED'">
                    <a-col :span="8">
                        <a-form-item label="检验水平">
                            <a-select v-model:value="ruleForm.inspectionLevel">
                                <a-select-option value="I">I</a-select-option>
                                <a-select-option value="II">II</a-select-option>
                                <a-select-option value="III">III</a-select-option>
                                <a-select-option value="S1">S1</a-select-option>
                                <a-select-option value="S2">S2</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="检验类型">
                            <a-select v-model:value="ruleForm.inspectionType">
                                <a-select-option value="NORMAL">正常检验</a-select-option>
                                <a-select-option value="STRICT">加严检验</a-select-option>
                                <a-select-option value="REDUCED">放宽检验</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="AQL值">
                            <a-input-number v-model:value="ruleForm.aqlValue" :min="0" :step="0.1"
                                style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- 固定数量：显示样本量 -->
                <a-row :gutter="16" v-if="form.samplingMethod === 'FIXED_QUANTITY'">
                    <a-col :span="12">
                        <a-form-item label="样本量" required>
                            <a-input-number v-model:value="ruleForm.sampleSize" :min="1" placeholder="请输入样本数量"
                                style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- 百分比：显示样本量比率 -->
                <a-row :gutter="16" v-if="form.samplingMethod === 'PERCENTAGE'">
                    <a-col :span="12">
                        <a-form-item label="样本量比率 (%)" required>
                            <a-input-number v-model:value="ruleForm.sampleSizeRate" :min="1" :max="100"
                                placeholder="请输入1-100的整数" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- 国标抽样：显示抽样明细表（可编辑） -->
                <template v-if="form.samplingMethod === 'STANDARD_BASED'">
                    <a-divider>抽样明细</a-divider>
                    <div style="margin-bottom: 12px;">
                        <a-button type="dashed" size="small" @click="handleAddDetail">
                            <PlusOutlined /> 添加明细
                        </a-button>
                    </div>
                    <a-table :columns="detailColumnsEditable" :data-source="ruleForm.details" :pagination="false"
                        size="small" bordered>
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'batchSizeMin'">
                                <a-input-number v-model:value="record.batchSizeMin" :min="1" size="small"
                                    style="width: 100%" />
                            </template>
                            <template v-else-if="column.key === 'batchSizeMax'">
                                <a-input-number v-model:value="record.batchSizeMax" :min="1" size="small"
                                    style="width: 100%" />
                            </template>
                            <template v-else-if="column.key === 'sampleSizeCode'">
                                <a-input v-model:value="record.sampleSizeCode" size="small" placeholder="A/B/C..." />
                            </template>
                            <template v-else-if="column.key === 'acceptanceNumber'">
                                <a-input-number v-model:value="record.acceptanceNumber" :min="0" size="small"
                                    style="width: 100%" />
                            </template>
                            <template v-else-if="column.key === 'rejectionNumber'">
                                <a-input-number v-model:value="record.rejectionNumber" :min="1" size="small"
                                    style="width: 100%" />
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-button type="link" danger size="small"
                                    @click="handleRemoveDetail(index)">删除</a-button>
                            </template>
                        </template>
                    </a-table>
                </template>
            </a-form>
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
    const activeTab = ref('rules')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => {
        if (isView.value) return '查看抽样方案'
        return isEdit.value ? '编辑抽样方案' : '新增抽样方案'
    })

    // --- 基本信息表单 ---
    const form = reactive({
        id: null as string | null,
        planCode: '',
        planName: '',
        samplingMethod: 'STANDARD_BASED' as string,
        standard: '',
        description: '',
        rules: [] as any[]
    })

    const rules = {
        planCode: [{ required: true, message: '请输入方案代码', trigger: 'blur' }],
        planName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
        samplingMethod: [{ required: true, message: '请选择抽样方法', trigger: 'change' }]
    }

    const getMethodColor = (method: string) => {
        const map: Record<string, string> = {
            STANDARD_BASED: 'blue', FIXED_QUANTITY: 'cyan',
            PERCENTAGE: 'orange', FULL_INSPECTION: 'green'
        }
        return map[method] || 'default'
    }
    const getMethodText = (method: string) => {
        const map: Record<string, string> = {
            STANDARD_BASED: '国标', FIXED_QUANTITY: '固定数量',
            PERCENTAGE: '百分比', FULL_INSPECTION: '全检'
        }
        return map[method] || method
    }

    // --- 抽样规则Tab ---
    const ruleColumns = [
        { title: '规则代码', dataIndex: 'ruleCode', key: 'ruleCode', width: 150 },
        { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 200 },
        { title: '检验水平', key: 'inspectionLevel', width: 100 },
        { title: '检验类型', key: 'inspectionType', width: 120 },
        { title: 'AQL值', dataIndex: 'aqlValue', key: 'aqlValue', width: 80 },
        { title: '操作', key: 'action', width: 150 }
    ]

    const detailColumns = [
        { title: '批量下限', dataIndex: 'batchSizeMin', key: 'batchSizeMin' },
        { title: '批量上限', dataIndex: 'batchSizeMax', key: 'batchSizeMax' },
        { title: '样本量字码', dataIndex: 'sampleSizeCode', key: 'sampleSizeCode' },
        { title: 'Ac(接收)', dataIndex: 'acceptanceNumber', key: 'acceptanceNumber' },
        { title: 'Re(拒收)', dataIndex: 'rejectionNumber', key: 'rejectionNumber' }
    ]

    const detailColumnsEditable = [
        { title: '批量下限', key: 'batchSizeMin', width: 120 },
        { title: '批量上限', key: 'batchSizeMax', width: 120 },
        { title: '样本量字码', key: 'sampleSizeCode', width: 120 },
        { title: 'Ac(接收)', key: 'acceptanceNumber', width: 100 },
        { title: 'Re(拒收)', key: 'rejectionNumber', width: 100 },
        { title: '操作', key: 'action', width: 80 }
    ]

    const getInspTypeColor = (type: string) => {
        switch (type) {
            case 'NORMAL': return 'green'
            case 'STRICT': return 'red'
            case 'REDUCED': return 'orange'
            default: return 'default'
        }
    }
    const getInspTypeText = (type: string) => {
        const map: Record<string, string> = { NORMAL: '正常', STRICT: '加严', REDUCED: '放宽' }
        return map[type] || type
    }

    // --- 规则编辑弹窗 ---
    const ruleModalVisible = ref(false)
    const isEditRule = ref(false)
    const ruleForm = reactive({
        id: null as string | null,
        ruleCode: '',
        ruleName: '',
        inspectionLevel: 'II',
        inspectionType: 'NORMAL',
        aqlValue: 1.0,
        sampleSize: null as number | null,
        sampleSizeRate: null as number | null,
        details: [] as any[]
    })

    const handleAddRule = () => {
        isEditRule.value = false
        Object.assign(ruleForm, {
            id: null, ruleCode: '', ruleName: '',
            inspectionLevel: 'II', inspectionType: 'NORMAL', aqlValue: 1.0,
            sampleSize: null, sampleSizeRate: null, details: []
        })
        ruleModalVisible.value = true
    }

    const handleEditRule = (record: any) => {
        isEditRule.value = true
        Object.assign(ruleForm, { ...record, details: [...(record.details || [])] })
        ruleModalVisible.value = true
    }

    const handleAddDetail = () => {
        ruleForm.details.push({
            id: Date.now(),
            batchSizeMin: 1,
            batchSizeMax: 10,
            sampleSizeCode: 'A',
            acceptanceNumber: 0,
            rejectionNumber: 1
        })
    }

    const handleRemoveDetail = (index: number) => {
        ruleForm.details.splice(index, 1)
    }

    const saveRule = () => {
        if (!ruleForm.ruleCode || !ruleForm.ruleName) {
            message.error('请填写必填项')
            return
        }

        // 根据抽样方法校验必填字段
        if (form.samplingMethod === 'FIXED_QUANTITY' && !ruleForm.sampleSize) {
            message.error('请输入样本量')
            return
        }
        if (form.samplingMethod === 'PERCENTAGE' && !ruleForm.sampleSizeRate) {
            message.error('请输入样本量比率')
            return
        }

        // 国标抽样：校验批量范围和 Ac/Re
        if (form.samplingMethod === 'STANDARD_BASED' && ruleForm.details.length > 0) {
            // 检查批量范围是否重叠
            const sortedDetails = [...ruleForm.details].sort((a, b) => a.batchSizeMin - b.batchSizeMin)
            for (let i = 0; i < sortedDetails.length - 1; i++) {
                if (sortedDetails[i].batchSizeMax >= sortedDetails[i + 1].batchSizeMin) {
                    message.error(`批量范围存在重叠：[${sortedDetails[i].batchSizeMin}-${sortedDetails[i].batchSizeMax}] 与 [${sortedDetails[i + 1].batchSizeMin}-${sortedDetails[i + 1].batchSizeMax}]`)
                    return
                }
            }

            // 检查 Ac/Re 逻辑
            for (const detail of ruleForm.details) {
                if (detail.rejectionNumber <= detail.acceptanceNumber) {
                    message.error(`拒收数(Re)必须大于接收数(Ac)，当前 Ac=${detail.acceptanceNumber}, Re=${detail.rejectionNumber}`)
                    return
                }
            }
        }

        if (isEditRule.value) {
            const idx = form.rules.findIndex(r => r.id === ruleForm.id)
            if (idx !== -1) Object.assign(form.rules[idx], { ...ruleForm, details: [...ruleForm.details] })
        } else {
            form.rules.push({ ...ruleForm, id: Date.now().toString(), details: [...ruleForm.details] })
        }
        ruleModalVisible.value = false
        message.success(isEditRule.value ? '规则已更新' : '规则已添加')
    }

    const handleRemoveRule = (index: number) => {
        form.rules.splice(index, 1)
    }

    // --- 页面操作 ---
    const handleBack = () => {
        router.push('/inspection-model/sampling-plans')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            message.success('保存成功')
            router.push('/inspection-model/sampling-plans')
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
            const mockItems: Record<string, any> = {
                '1': {
                    id: '1', planCode: 'AQL-GB2828', planName: 'GB/T 2828.1-2012',
                    samplingMethod: 'STANDARD_BASED', standard: 'GB/T 2828.1',
                    description: '基于国标的AQL抽样',
                    rules: [
                        {
                            id: '101', ruleCode: 'GB-L2-N-0.65', ruleName: 'Level II 正常 AQL 0.65',
                            inspectionLevel: 'II', inspectionType: 'NORMAL', aqlValue: 0.65,
                            details: [
                                { id: 1, batchSizeMin: 1, batchSizeMax: 8, sampleSizeCode: 'A', acceptanceNumber: 0, rejectionNumber: 1 },
                                { id: 2, batchSizeMin: 9, batchSizeMax: 15, sampleSizeCode: 'B', acceptanceNumber: 0, rejectionNumber: 1 },
                                { id: 3, batchSizeMin: 16, batchSizeMax: 25, sampleSizeCode: 'C', acceptanceNumber: 0, rejectionNumber: 1 }
                            ]
                        },
                        {
                            id: '102', ruleCode: 'GB-L2-S-0.65', ruleName: 'Level II 加严 AQL 0.65',
                            inspectionLevel: 'II', inspectionType: 'STRICT', aqlValue: 0.65,
                            details: [
                                { id: 4, batchSizeMin: 1, batchSizeMax: 8, sampleSizeCode: 'A', acceptanceNumber: 0, rejectionNumber: 1 }
                            ]
                        }
                    ]
                },
                '2': {
                    id: '2', planCode: 'FIX-QTY', planName: '固定数量抽样',
                    samplingMethod: 'FIXED_QUANTITY', standard: '内部标准',
                    description: '不管多少只抽5个',
                    rules: []
                },
                '3': {
                    id: '3', planCode: 'PERCENT-10', planName: '10%抽样',
                    samplingMethod: 'PERCENTAGE', standard: '内部标准',
                    description: '按数量10%抽',
                    rules: []
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

    .detail-table-wrapper {
        background: #fafafa;
        padding: 12px;
        border-radius: 4px;
    }

    .detail-header {
        margin-bottom: 8px;
        font-weight: 500;
        color: #595959;
        font-size: 13px;
    }
</style>