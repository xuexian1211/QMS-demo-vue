<template>
    <div class="page-container">
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
                    <a-tag v-if="formState.version" color="blue">{{ formState.version }}</a-tag>
                    <a-tag :color="getStatusColor(formState.status)">{{ getStatusText(formState.status) }}</a-tag>
                </div>
            </div>
            <div class="header-actions" v-if="!isView">
                <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            </div>
        </div>

        <a-card class="form-card" title="基本信息">
            <a-form ref="formRef" :model="formState" :rules="rules" layout="horizontal" :label-col="{ span: 6 }"
                :wrapper-col="{ span: 16 }">
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="模板编码" name="code">
                            <a-input v-model:value="formState.code" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="模板名称" name="name">
                            <a-input v-model:value="formState.name" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="检验类型" name="inspType">
                            <a-select v-model:value="formState.inspType" :disabled="isView" placeholder="请选择">
                                <a-select-option value="IQC">IQC来料检验</a-select-option>
                                <a-select-option value="IPQC">IPQC过程检验</a-select-option>
                                <a-select-option value="FQC">FQC成品检验</a-select-option>
                                <a-select-option value="OQC">OQC出货检验</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="备注" name="remark" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="formState.remark" :disabled="isView" :rows="2"
                                placeholder="请输入备注" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <a-card class="detail-card" title="模板明细">
            <template #extra v-if="!isView">
                <a-space>
                    <a-button type="primary" size="small" @click="handleAddDetail">
                        <template #icon>
                            <PlusOutlined />
                        </template>新增明细
                    </a-button>
                    <a-button danger size="small" :disabled="selectedDetailKeys.length === 0"
                        @click="handleBatchDeleteDetail">
                        批量删除
                    </a-button>
                </a-space>
            </template>

            <a-table :columns="detailColumns" :data-source="detailData" row-key="id" size="small"
                :row-selection="isView ? undefined : { selectedRowKeys: selectedDetailKeys, onChange: onDetailSelectChange }"
                :pagination="false">
                <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'seq'">{{ index + 1 }}</template>
                    <template v-if="column.key === 'spcEnabled'">
                        <a-switch v-model:checked="record.spcEnabled" :disabled="isView" size="small" />
                    </template>
                    <template v-if="column.key === 'labRequired'">
                        <a-switch v-model:checked="record.labRequired" :disabled="isView" size="small" />
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space v-if="!isView">
                            <a-button type="link" size="small" @click="handleEditDetail(record)">编辑</a-button>
                            <a-button type="link" danger size="small" @click="handleDeleteDetail(record)">删除</a-button>
                            <a-button type="link" size="small" :disabled="index === 0"
                                @click="handleMoveUp(index)">上移</a-button>
                            <a-button type="link" size="small" :disabled="index === detailData.length - 1"
                                @click="handleMoveDown(index)">下移</a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>

        <!-- 明细编辑弹窗 -->
        <a-modal v-model:visible="detailModalVisible" :title="isEditDetail ? '编辑明细' : '新增明细'" width="800px"
            @ok="handleSaveDetail">
            <a-form ref="detailFormRef" :model="detailFormState" :rules="detailRules" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="检验项目" name="inspItemId">
                            <a-select v-model:value="detailFormState.inspItemId" placeholder="请选择" show-search>
                                <a-select-option v-for="item in inspItemOptions" :key="item.id" :value="item.id">{{
                                    item.name }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="抽样规则" name="samplingRuleId">
                            <a-select v-model:value="detailFormState.samplingRuleId" placeholder="请选择">
                                <a-select-option v-for="item in samplingRuleOptions" :key="item.id" :value="item.id">{{
                                    item.name }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="检验方法" name="inspMethodId">
                            <a-select v-model:value="detailFormState.inspMethodId" placeholder="请选择">
                                <a-select-option v-for="item in inspMethodOptions" :key="item.id" :value="item.id">{{
                                    item.name }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="量检具类型" name="gaugeTypeId">
                            <a-select v-model:value="detailFormState.gaugeTypeId" placeholder="请选择">
                                <a-select-option v-for="item in gaugeTypeOptions" :key="item.id" :value="item.id">{{
                                    item.name }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- IPQC频次配置 -->
                <a-divider>IPQC频次配置</a-divider>
                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="频次类型" name="freqType">
                            <a-select v-model:value="detailFormState.freqType" placeholder="请选择">
                                <a-select-option value="PerBatch">每批</a-select-option>
                                <a-select-option value="PerHour">每小时</a-select-option>
                                <a-select-option value="PerShift">每班次</a-select-option>
                                <a-select-option value="PerQuantity">每N件</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="频次值" name="freqValue">
                            <a-input-number v-model:value="detailFormState.freqValue" :min="1" style="width: 100%"
                                placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="单位" name="freqUnit">
                            <a-input v-model:value="detailFormState.freqUnit" placeholder="如：件、小时" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="SPC控制">
                            <a-switch v-model:checked="detailFormState.spcEnabled" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="实验室检验">
                            <a-switch v-model:checked="detailFormState.labRequired" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="detailFormState.remark" :rows="2" placeholder="请输入备注" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'

    const route = useRoute()
    const router = useRouter()

    // --- 状态定义 ---
    const formRef = ref()
    const detailFormRef = ref()
    const saving = ref(false)
    const detailModalVisible = ref(false)
    const isEditDetail = ref(false)
    const selectedDetailKeys = ref < string[] > ([])
    const detailData = ref < any[] > ([])

    // 模式判断
    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => {
        if (isView.value) return '查看检验模板'
        return isEdit.value ? '编辑检验模板' : '新增检验模板'
    })

    // 下拉选项
    const inspItemOptions = ref([
        { id: '1', name: '长度' },
        { id: '2', name: '外观' },
        { id: '3', name: '硬度' },
    ])
    const samplingRuleOptions = ref([
        { id: '1', name: 'AQL 0.65 Level II' },
        { id: '2', name: '全检' },
    ])
    const inspMethodOptions = ref([
        { id: '1', name: '卡尺测量' },
        { id: '2', name: '目视检查' },
    ])
    const gaugeTypeOptions = ref([
        { id: '1', name: '游标卡尺' },
        { id: '2', name: '千分尺' },
    ])

    // 表单状态
    const formState = reactive({
        id: null as string | null,
        code: '',
        name: '',
        version: 'V1.0',
        status: 'Draft',
        inspType: undefined as string | undefined,
        remark: ''
    })

    const rules = {
        code: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
        inspType: [{ required: true, message: '请选择检验类型', trigger: 'change' }]
    }

    // 明细表单状态
    const detailFormState = reactive({
        id: null as string | null,
        inspItemId: undefined as string | undefined,
        inspItemName: '',
        samplingRuleId: undefined as string | undefined,
        samplingRuleName: '',
        inspMethodId: undefined as string | undefined,
        inspMethodName: '',
        gaugeTypeId: undefined as string | undefined,
        gaugeTypeName: '',
        freqType: 'PerBatch',
        freqValue: 1,
        freqUnit: '',
        spcEnabled: false,
        labRequired: false,
        remark: ''
    })

    const detailRules = {
        inspItemId: [{ required: true, message: '请选择检验项目', trigger: 'change' }]
    }

    // 明细表格列
    const detailColumns = computed(() => {
        const cols = [
            { title: '序号', key: 'seq', width: 60 },
            { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 120 },
            { title: '抽样规则', dataIndex: 'samplingRuleName', key: 'samplingRuleName', width: 150 },
            { title: '检验方法', dataIndex: 'inspMethodName', key: 'inspMethodName', width: 120 },
            { title: '量检具类型', dataIndex: 'gaugeTypeName', key: 'gaugeTypeName', width: 100 },
            { title: '频次', dataIndex: 'freqDesc', key: 'freqDesc', width: 100 },
            { title: 'SPC', key: 'spcEnabled', width: 60 },
            { title: '实验室', key: 'labRequired', width: 70 },
        ]
        if (!isView.value) {
            cols.push({ title: '操作', key: 'action', width: 180 })
        }
        return cols
    })

    // 状态显示
    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = { Draft: 'default', Pending: 'processing', Approved: 'success', Obsolete: 'error' }
        return colorMap[status] || 'default'
    }

    const getStatusText = (status: string) => {
        const textMap: Record<string, string> = { Draft: '草稿', Pending: '审批中', Approved: '已批准', Obsolete: '作废' }
        return textMap[status] || status
    }

    // --- 方法 ---
    const handleBack = () => {
        router.push('/inspection-model/insp-templates')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            message.success('保存成功')
            router.push('/inspection-model/insp-templates')
        } catch (e) {
            message.error('请完善必填项')
        } finally {
            saving.value = false
        }
    }

    // 明细相关
    const onDetailSelectChange = (keys: string[]) => {
        selectedDetailKeys.value = keys
    }

    const resetDetailForm = () => {
        Object.assign(detailFormState, {
            id: null,
            inspItemId: undefined,
            inspItemName: '',
            samplingRuleId: undefined,
            samplingRuleName: '',
            inspMethodId: undefined,
            inspMethodName: '',
            gaugeTypeId: undefined,
            gaugeTypeName: '',
            freqType: 'PerBatch',
            freqValue: 1,
            freqUnit: '',
            spcEnabled: false,
            labRequired: false,
            remark: ''
        })
    }

    const handleAddDetail = () => {
        isEditDetail.value = false
        resetDetailForm()
        detailModalVisible.value = true
    }

    const handleEditDetail = (record: any) => {
        isEditDetail.value = true
        Object.assign(detailFormState, { ...record })
        detailModalVisible.value = true
    }

    const handleDeleteDetail = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定删除该明细吗？',
            okType: 'danger',
            onOk() {
                detailData.value = detailData.value.filter(i => i.id !== record.id)
                message.success('删除成功')
            }
        })
    }

    const handleBatchDeleteDetail = () => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除选中的 ${selectedDetailKeys.value.length} 条明细吗？`,
            okType: 'danger',
            onOk() {
                detailData.value = detailData.value.filter(i => !selectedDetailKeys.value.includes(i.id))
                selectedDetailKeys.value = []
                message.success('删除成功')
            }
        })
    }

    const handleSaveDetail = async () => {
        try {
            await detailFormRef.value?.validate()

            // 获取名称
            detailFormState.inspItemName = inspItemOptions.value.find(i => i.id === detailFormState.inspItemId)?.name || ''
            detailFormState.samplingRuleName = samplingRuleOptions.value.find(i => i.id === detailFormState.samplingRuleId)?.name || ''
            detailFormState.inspMethodName = inspMethodOptions.value.find(i => i.id === detailFormState.inspMethodId)?.name || ''
            detailFormState.gaugeTypeName = gaugeTypeOptions.value.find(i => i.id === detailFormState.gaugeTypeId)?.name || ''

            // 频次描述
            const freqDesc = detailFormState.freqValue ? `${detailFormState.freqValue}${detailFormState.freqUnit || ''}` : ''

            if (isEditDetail.value) {
                const idx = detailData.value.findIndex(i => i.id === detailFormState.id)
                if (idx > -1) Object.assign(detailData.value[idx], { ...detailFormState, freqDesc })
            } else {
                detailData.value.push({ ...detailFormState, id: Date.now().toString(), freqDesc })
            }
            message.success('保存成功')
            detailModalVisible.value = false
        } catch (e) {
            message.error('请完善必填项')
        }
    }

    const handleMoveUp = (index: number) => {
        if (index > 0) {
            const temp = detailData.value[index]
            detailData.value[index] = detailData.value[index - 1]
            detailData.value[index - 1] = temp
            detailData.value = [...detailData.value]
        }
    }

    const handleMoveDown = (index: number) => {
        if (index < detailData.value.length - 1) {
            const temp = detailData.value[index]
            detailData.value[index] = detailData.value[index + 1]
            detailData.value[index + 1] = temp
            detailData.value = [...detailData.value]
        }
    }

    // 加载数据
    onMounted(() => {
        const id = route.params.id as string | undefined
        if (id) {
            // 模拟加载数据
            Object.assign(formState, {
                id,
                code: 'TPL-IQC-001',
                name: 'IQC原材料检验模板',
                version: 'V1.0',
                status: 'Draft',
                inspType: 'IQC',
                remark: '用于原材料来料检验'
            })
            detailData.value = [
                { id: 'd1', inspItemId: '1', inspItemName: '长度', samplingRuleId: '1', samplingRuleName: 'AQL 0.65 Level II', inspMethodId: '1', inspMethodName: '卡尺测量', gaugeTypeId: '1', gaugeTypeName: '游标卡尺', freqType: 'PerBatch', freqValue: 1, freqUnit: '批', freqDesc: '1批', spcEnabled: true, labRequired: false },
                { id: 'd2', inspItemId: '2', inspItemName: '外观', samplingRuleId: '2', samplingRuleName: '全检', inspMethodId: '2', inspMethodName: '目视检查', gaugeTypeId: '', gaugeTypeName: '', freqType: 'PerBatch', freqValue: 1, freqUnit: '批', freqDesc: '1批', spcEnabled: false, labRequired: false },
            ]
        }
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

    .detail-card :deep(.ant-card-body) {
        padding: 16px;
    }
</style>