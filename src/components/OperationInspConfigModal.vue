<template>
    <a-modal v-model:visible="localVisible" :title="`工序检验配置 - ${operationInfo.opName}`" width="800px"
        :destroyOnClose="true" @cancel="handleClose" @ok="handleSave">
        <div class="config-container">
            <!-- 首检方案 -->
            <a-card size="small" :title="'首检方案'" class="config-section">
                <template #extra>
                    <a-button type="primary" size="small" ghost @click="handleAddPlan('first')">
                        <PlusOutlined /> 新增
                    </a-button>
                </template>
                <a-table :columns="planColumns" :data-source="firstInspPlans" row-key="id" size="small"
                    :pagination="false">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'action'">
                            <a-button type="link" danger size="small"
                                @click="handleRemovePlan('first', record)">删除</a-button>
                        </template>
                    </template>
                </a-table>
                <a-empty v-if="firstInspPlans.length === 0" description="暂无配置" />
            </a-card>

            <!-- 巡检方案 -->
            <a-card size="small" :title="'巡检方案'" class="config-section">
                <template #extra>
                    <a-button type="primary" size="small" ghost @click="handleAddPlan('patrol')">
                        <PlusOutlined /> 新增
                    </a-button>
                </template>
                <a-table :columns="patrolPlanColumns" :data-source="patrolInspPlans" row-key="id" size="small"
                    :pagination="false">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'frequency'">
                            每 {{ record.freqValue }} {{ record.freqUnit }}
                        </template>
                        <template v-if="column.key === 'action'">
                            <a-space>
                                <a-button type="link" size="small" @click="handleEditFrequency(record)">编辑频次</a-button>
                                <a-button type="link" danger size="small"
                                    @click="handleRemovePlan('patrol', record)">删除</a-button>
                            </a-space>
                        </template>
                    </template>
                </a-table>
                <a-empty v-if="patrolInspPlans.length === 0" description="暂无配置" />
            </a-card>

            <!-- 末检方案 -->
            <a-card size="small" :title="'末检方案'" class="config-section">
                <template #extra>
                    <a-button type="primary" size="small" ghost @click="handleAddPlan('final')">
                        <PlusOutlined /> 新增
                    </a-button>
                </template>
                <a-table :columns="planColumns" :data-source="finalInspPlans" row-key="id" size="small"
                    :pagination="false">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'action'">
                            <a-button type="link" danger size="small"
                                @click="handleRemovePlan('final', record)">删除</a-button>
                        </template>
                    </template>
                </a-table>
                <a-empty v-if="finalInspPlans.length === 0" description="暂无配置" />
            </a-card>
        </div>

        <!-- 新增方案弹窗 -->
        <a-modal v-model:visible="addModalVisible" :title="addModalTitle" width="500px" @ok="handleSaveAdd">
            <a-form ref="addFormRef" :model="addFormState" :rules="addFormRules" layout="vertical">
                <a-form-item label="检验方案" name="planId">
                    <a-select v-model:value="addFormState.planId" placeholder="请选择检验方案" show-search
                        :filter-option="filterPlanOption">
                        <a-select-option v-for="plan in planOptions" :key="plan.id" :value="plan.id">
                            {{ plan.code }} - {{ plan.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <template v-if="currentAddType === 'patrol'">
                    <a-form-item label="频次值" name="freqValue">
                        <a-input-number v-model:value="addFormState.freqValue" :min="1" style="width: 100%"
                            placeholder="请输入频次" />
                    </a-form-item>
                    <a-form-item label="频次单位" name="freqUnit">
                        <a-select v-model:value="addFormState.freqUnit" placeholder="请选择单位">
                            <a-select-option value="件">件</a-select-option>
                            <a-select-option value="小时">小时</a-select-option>
                            <a-select-option value="班次">班次</a-select-option>
                            <a-select-option value="批次">批次</a-select-option>
                        </a-select>
                    </a-form-item>
                </template>
            </a-form>
        </a-modal>

        <!-- 编辑频次弹窗 -->
        <a-modal v-model:visible="editFreqModalVisible" title="编辑巡检频次" width="400px" @ok="handleSaveFrequency">
            <a-form layout="vertical">
                <a-form-item label="频次值">
                    <a-input-number v-model:value="editFreqState.freqValue" :min="1" style="width: 100%" />
                </a-form-item>
                <a-form-item label="频次单位">
                    <a-select v-model:value="editFreqState.freqUnit">
                        <a-select-option value="件">件</a-select-option>
                        <a-select-option value="小时">小时</a-select-option>
                        <a-select-option value="班次">班次</a-select-option>
                        <a-select-option value="批次">批次</a-select-option>
                    </a-select>
                </a-form-item>
            </a-form>
        </a-modal>
    </a-modal>
</template>

<script setup>
    import { ref, reactive, watch, computed } from 'vue'
    import { message } from 'ant-design-vue'
    import { PlusOutlined } from '@ant-design/icons-vue'

    // Props
    const props = defineProps({
        visible: {
            type: Boolean,
            default: false
        },
        operationInfo: {
            type: Object,
            default: () => ({ id: '', opSeq: 0, opName: '', routeId: '' })
        }
    })

    // Emits
    const emit = defineEmits(['update:visible', 'save'])

    // 双向绑定 visible
    const localVisible = computed({
        get: () => props.visible,
        set: (val) => emit('update:visible', val)
    })

    // --- 状态定义 ---
    const firstInspPlans = ref([])
    const patrolInspPlans = ref([])
    const finalInspPlans = ref([])

    const addModalVisible = ref(false)
    const editFreqModalVisible = ref(false)
    const currentAddType = ref('first')
    const addFormRef = ref()

    // 可选择的检验方案（模拟数据）
    const planOptions = ref([
        { id: 'ip1', code: 'IPQC-FIRST-001', name: '首件检验方案' },
        { id: 'ip2', code: 'IPQC-PATROL-001', name: '巡检方案-标准' },
        { id: 'ip3', code: 'IPQC-PATROL-002', name: '巡检方案-加严' },
        { id: 'ip4', code: 'IPQC-FINAL-001', name: '末件检验方案' },
    ])

    // 表格列
    const planColumns = [
        { title: '方案编码', dataIndex: 'planCode', key: 'planCode', width: 180 },
        { title: '方案名称', dataIndex: 'planName', key: 'planName' },
        { title: '操作', key: 'action', width: 80 }
    ]

    const patrolPlanColumns = [
        { title: '方案编码', dataIndex: 'planCode', key: 'planCode', width: 180 },
        { title: '方案名称', dataIndex: 'planName', key: 'planName' },
        { title: '频次', key: 'frequency', width: 120 },
        { title: '操作', key: 'action', width: 140 }
    ]

    // 新增表单
    const addFormState = reactive({
        planId: undefined,
        freqValue: 1,
        freqUnit: '小时'
    })

    const addFormRules = {
        planId: [{ required: true, message: '请选择检验方案', trigger: 'change' }]
    }

    const addModalTitle = computed(() => {
        const titles = { first: '新增首检方案', patrol: '新增巡检方案', final: '新增末检方案' }
        return titles[currentAddType.value]
    })

    // 编辑频次表单
    const editFreqState = reactive({
        id: '',
        freqValue: 1,
        freqUnit: '小时'
    })

    // --- 监听 ---
    watch(() => props.visible, (val) => {
        if (val && props.operationInfo?.id) {
            loadConfigData()
        }
    })

    // --- 方法 ---
    const handleClose = () => {
        emit('update:visible', false)
    }

    const handleSave = () => {
        emit('save', {
            operationId: props.operationInfo.id,
            firstInspPlans: firstInspPlans.value,
            patrolInspPlans: patrolInspPlans.value,
            finalInspPlans: finalInspPlans.value
        })
        message.success('配置已保存')
        handleClose()
    }

    const filterPlanOption = (input, option) => {
        const plan = planOptions.value.find(p => p.id === option.value)
        if (!plan) return false
        return plan.code.toLowerCase().includes(input.toLowerCase()) ||
            plan.name.toLowerCase().includes(input.toLowerCase())
    }

    const loadConfigData = () => {
        // 模拟加载工序检验配置
        const mockData = {
            '101': {
                first: [{ id: 'c1', planId: 'ip1', planCode: 'IPQC-FIRST-001', planName: '首件检验方案' }],
                patrol: [{ id: 'c2', planId: 'ip2', planCode: 'IPQC-PATROL-001', planName: '巡检方案-标准', freqValue: 2, freqUnit: '小时' }],
                final: []
            },
            '102': {
                first: [{ id: 'c3', planId: 'ip1', planCode: 'IPQC-FIRST-001', planName: '首件检验方案' }],
                patrol: [{ id: 'c4', planId: 'ip2', planCode: 'IPQC-PATROL-001', planName: '巡检方案-标准', freqValue: 50, freqUnit: '件' }],
                final: []
            }
        }
        const data = mockData[props.operationInfo.id] || { first: [], patrol: [], final: [] }
        firstInspPlans.value = data.first
        patrolInspPlans.value = data.patrol
        finalInspPlans.value = data.final
    }

    const handleAddPlan = (type) => {
        currentAddType.value = type
        Object.assign(addFormState, { planId: undefined, freqValue: 1, freqUnit: '小时' })
        addModalVisible.value = true
    }

    const handleSaveAdd = () => {
        addFormRef.value?.validate().then(() => {
            const plan = planOptions.value.find(p => p.id === addFormState.planId)
            const newBinding = {
                id: Date.now().toString(),
                planId: addFormState.planId,
                planCode: plan?.code,
                planName: plan?.name,
                freqValue: addFormState.freqValue,
                freqUnit: addFormState.freqUnit
            }

            if (currentAddType.value === 'first') {
                firstInspPlans.value.push(newBinding)
            } else if (currentAddType.value === 'patrol') {
                patrolInspPlans.value.push(newBinding)
            } else {
                finalInspPlans.value.push(newBinding)
            }

            message.success('添加成功')
            addModalVisible.value = false
        }).catch(() => {
            message.error('请选择检验方案')
        })
    }

    const handleRemovePlan = (type, record) => {
        if (type === 'first') {
            firstInspPlans.value = firstInspPlans.value.filter(i => i.id !== record.id)
        } else if (type === 'patrol') {
            patrolInspPlans.value = patrolInspPlans.value.filter(i => i.id !== record.id)
        } else {
            finalInspPlans.value = finalInspPlans.value.filter(i => i.id !== record.id)
        }
        message.success('删除成功')
    }

    const handleEditFrequency = (record) => {
        Object.assign(editFreqState, { id: record.id, freqValue: record.freqValue, freqUnit: record.freqUnit })
        editFreqModalVisible.value = true
    }

    const handleSaveFrequency = () => {
        const idx = patrolInspPlans.value.findIndex(i => i.id === editFreqState.id)
        if (idx > -1) {
            patrolInspPlans.value[idx].freqValue = editFreqState.freqValue
            patrolInspPlans.value[idx].freqUnit = editFreqState.freqUnit
        }
        message.success('频次已更新')
        editFreqModalVisible.value = false
    }
</script>

<style scoped>
    .config-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .config-section :deep(.ant-card-body) {
        padding: 8px 16px;
    }

    .config-section :deep(.ant-empty) {
        margin: 8px 0;
    }
</style>