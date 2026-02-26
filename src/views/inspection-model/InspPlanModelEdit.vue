<template>
    <div class="page-container">
        <div class="page-header">
            <div class="header-left">
                <a-button type="text" @click="handleBack" class="back-button">
                    <template #icon>
                        <ArrowLeftOutlined />
                    </template>返回
                </a-button>
                <div class="title-section">
                    <h2 class="page-title">{{ pageTitle }}</h2>
                    <a-tag v-if="form.version" color="blue">{{ form.version }}</a-tag>
                    <a-tag :color="getStatusColor(form.planStatus)">{{ getStatusText(form.planStatus) }}</a-tag>
                    <a-tag v-if="form.isLatestVersion" color="green">最新版</a-tag>
                    <a-tag v-if="form.copyFromCode" color="cyan">来自: {{ form.copyFromCode }}</a-tag>
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
                        <a-form-item label="计划编码" name="planCode">
                            <a-input v-model:value="form.planCode" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="计划名称" name="planName">
                            <a-input v-model:value="form.planName" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="版本" name="version">
                            <a-input v-model:value="form.version" :disabled="isView" placeholder="如：V1.0" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="检验类型" name="inspType">
                            <a-select v-model:value="form.inspType" :disabled="isView" placeholder="请选择">
                                <a-select-option value="IQC">IQC来料检验</a-select-option>
                                <a-select-option value="IPQC">IPQC过程检验</a-select-option>
                                <a-select-option value="FQC">FQC成品检验</a-select-option>
                                <a-select-option value="OQC">OQC出货检验</a-select-option>
                                <a-select-option value="PATROL">巡检</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="关联方案" name="schemeId">
                            <a-select v-model:value="form.schemeId" :disabled="isView" placeholder="请选择"
                                @change="onSchemeChange">
                                <a-select-option v-for="s in schemeOptions" :key="s.id" :value="s.id">{{ s.name
                                    }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="关联物料">
                            <a-select v-model:value="form.materialId" :disabled="isView" placeholder="请选择" allow-clear>
                                <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">{{ m.code }} -
                                    {{ m.name }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="归属组织">
                            <a-select v-model:value="form.orgId" :disabled="isView" placeholder="请选择">
                                <a-select-option :value="null">集团（通用）</a-select-option>
                                <a-select-option value="ORG001">合肥工厂</a-select-option>
                                <a-select-option value="ORG002">芜湖工厂</a-select-option>
                                <a-select-option value="ORG003">宁波工厂</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="不良处理">
                            <a-select v-model:value="form.defectDisposition" :disabled="isView" placeholder="请选择"
                                allow-clear>
                                <a-select-option value="SCRAP">报废</a-select-option>
                                <a-select-option value="REWORK">返修</a-select-option>
                                <a-select-option value="CONCESSION">特采</a-select-option>
                                <a-select-option value="RETURN_SUPPLIER">退供应商</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="状态">
                            <a-tag :color="getStatusColor(form.planStatus)">{{ getStatusText(form.planStatus) }}</a-tag>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="默认检验员">
                            <a-select v-model:value="form.executorId" :disabled="isView" placeholder="请选择" allow-clear>
                                <a-select-option v-for="u in userOptions" :key="u.id" :value="u.id">{{ u.name
                                    }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="备选检验员">
                            <a-select v-model:value="form.backupExecutorId" :disabled="isView" placeholder="请选择"
                                allow-clear>
                                <a-select-option v-for="u in userOptions" :key="u.id" :value="u.id">{{ u.name
                                    }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="审核人">
                            <a-select v-model:value="form.reviewerId" :disabled="isView" placeholder="请选择" allow-clear>
                                <a-select-option v-for="u in userOptions" :key="u.id" :value="u.id">{{ u.name
                                    }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="备注" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.description" :disabled="isView" :rows="2"
                                placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <!-- Tab 栏 -->
        <a-card class="tab-card">
            <a-tabs v-model:activeKey="activeTab">
                <!-- 触发配置 -->
                <a-tab-pane key="trigger" tab="触发配置">
                    <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }" :disabled="isView">
                        <a-form-item label="触发类型">
                            <a-radio-group v-model:value="form.triggerType">
                                <a-radio-button value="EVENT">事件驱动</a-radio-button>
                                <a-radio-button value="TIME">周期驱动</a-radio-button>
                                <a-radio-button value="QUANTITY">数量/批次</a-radio-button>
                                <a-radio-button value="MANUAL">手动</a-radio-button>
                            </a-radio-group>
                        </a-form-item>
                        <template v-if="form.triggerType === 'EVENT'">
                            <a-divider orientation="left" plain>事件驱动配置</a-divider>
                            <a-form-item label="ERP单据类型">
                                <a-select v-model:value="form.eventTrigger.erpDocType" placeholder="请选择">
                                    <a-select-option value="PURCHASE_RECEIVE">采购收货</a-select-option>
                                    <a-select-option value="PRODUCTION_ORDER">生产工单</a-select-option>
                                    <a-select-option value="SHIPMENT_ORDER">发货单</a-select-option>
                                </a-select>
                            </a-form-item>
                            <a-form-item label="触发状态">
                                <a-select v-model:value="form.eventTrigger.erpDocStatus" placeholder="请选择">
                                    <a-select-option value="SUBMITTED">已提交</a-select-option>
                                    <a-select-option value="APPROVED">已审批</a-select-option>
                                    <a-select-option value="IN_WAREHOUSE">已入库</a-select-option>
                                </a-select>
                            </a-form-item>
                            <a-form-item label="匹配说明">
                                <a-textarea v-model:value="form.eventTrigger.matchDescription" :rows="2"
                                    placeholder="描述触发匹配逻辑" />
                            </a-form-item>
                        </template>
                        <template v-if="form.triggerType === 'TIME'">
                            <a-divider orientation="left" plain>周期驱动配置</a-divider>
                            <a-form-item label="频率类型">
                                <a-select v-model:value="form.timeTrigger.frequencyType" style="width: 200px">
                                    <a-select-option value="HOURLY">每小时</a-select-option>
                                    <a-select-option value="DAILY">每天</a-select-option>
                                    <a-select-option value="WEEKLY">每周</a-select-option>
                                    <a-select-option value="MONTHLY">每月</a-select-option>
                                </a-select>
                            </a-form-item>
                            <a-form-item label="频率值">
                                <a-input-number v-model:value="form.timeTrigger.frequencyValue" :min="1"
                                    style="width: 120px" />
                            </a-form-item>
                            <a-form-item label="Cron 表达式">
                                <a-input v-model:value="form.timeTrigger.cronExpression" placeholder="如: 0 0 8 * * ?" />
                            </a-form-item>
                        </template>
                        <template v-if="form.triggerType === 'QUANTITY'">
                            <a-divider orientation="left" plain>数量/批次驱动</a-divider>
                            <a-form-item label="触发阈值">
                                <a-input-number v-model:value="form.quantityTrigger.quantityThreshold" :min="1"
                                    style="width: 180px" />
                            </a-form-item>
                            <a-form-item label="计量单位">
                                <a-select v-model:value="form.quantityTrigger.quantityUnit" style="width: 200px">
                                    <a-select-option value="PIECES">件</a-select-option>
                                    <a-select-option value="MOLD">模</a-select-option>
                                    <a-select-option value="BATCH">批次</a-select-option>
                                </a-select>
                            </a-form-item>
                        </template>
                        <template v-if="form.triggerType === 'MANUAL'">
                            <a-empty description="手动模式无需配置触发规则" />
                        </template>
                    </a-form>
                </a-tab-pane>

                <!-- 参数覆盖 -->
                <a-tab-pane key="overrides" tab="参数覆盖">
                    <a-alert type="info" style="margin-bottom: 16px">
                        <template #message>对关联方案中特定检验项的公差、量检具等进行本地化微调，不影响原方案。</template>
                    </a-alert>
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="handleAddOverride"><template #icon>
                                <PlusOutlined />
                            </template>新增覆盖</a-button>
                    </div>
                    <a-table :columns="overrideColumns" :data-source="parameterOverrides" row-key="schemeDetailId"
                        size="small" :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'targetValue' && !isView">
                                <a-input-number v-model:value="record.targetValue" size="small" :step="0.01"
                                    style="width: 80px" />
                            </template>
                            <template v-if="column.key === 'upperLimit' && !isView">
                                <a-input-number v-model:value="record.upperLimit" size="small" :step="0.01"
                                    style="width: 80px" />
                            </template>
                            <template v-if="column.key === 'lowerLimit' && !isView">
                                <a-input-number v-model:value="record.lowerLimit" size="small" :step="0.01"
                                    style="width: 80px" />
                            </template>
                            <template v-if="column.key === 'overrideReason' && !isView">
                                <a-input v-model:value="record.overrideReason" size="small" placeholder="原因"
                                    style="width: 120px" />
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-button type="link" danger size="small" @click="parameterOverrides.splice(index, 1)"
                                    v-if="!isView">删除</a-button>
                            </template>
                        </template>
                    </a-table>
                </a-tab-pane>

                <!-- 快速响应 -->
                <a-tab-pane key="quickResponse" tab="快速响应">
                    <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }" :disabled="isView">
                        <a-form-item label="启用快速响应">
                            <a-switch v-model:checked="form.quickResponse.enabled" />
                        </a-form-item>
                        <template v-if="form.quickResponse.enabled">
                            <a-form-item label="响应级别">
                                <a-radio-group v-model:value="form.quickResponse.responseLevel">
                                    <a-radio value="NORMAL">普通</a-radio>
                                    <a-radio value="HIGH">高</a-radio>
                                    <a-radio value="CRITICAL">紧急</a-radio>
                                </a-radio-group>
                            </a-form-item>
                            <a-form-item label="锁定不良现象">
                                <a-select v-model:value="form.quickResponse.lockedPhenomenonIds" mode="multiple"
                                    placeholder="选择触发告警的不良现象" :options="phenomenonOptions" />
                            </a-form-item>
                            <a-divider orientation="left" plain>告警通道</a-divider>
                            <a-form-item label="邮件告警">
                                <a-switch v-model:checked="form.quickResponse.emailAlert" />
                            </a-form-item>
                            <a-form-item label="邮件接收人" v-if="form.quickResponse.emailAlert">
                                <a-select v-model:value="form.quickResponse.emailRecipients" mode="tags"
                                    placeholder="输入邮箱" />
                            </a-form-item>
                            <a-form-item label="钉钉告警">
                                <a-switch v-model:checked="form.quickResponse.dingTalkAlert" />
                            </a-form-item>
                            <a-form-item label="钉钉接收" v-if="form.quickResponse.dingTalkAlert">
                                <a-select v-model:value="form.quickResponse.dingTalkRecipients" mode="tags"
                                    placeholder="输入Webhook" />
                            </a-form-item>
                        </template>
                    </a-form>
                </a-tab-pane>
            </a-tabs>
        </a-card>
    </div>
</template>

<script setup lang="ts">
    import { reactive, ref, computed, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'
    import type { InspPlanModelStatus, PlanTriggerType, EventTriggerConfig, TimeTriggerConfig, QuantityTriggerConfig, QuickResponseConfig, DefectDisposition } from '@/types'

    const router = useRouter()
    const route = useRoute()
    const formRef = ref()
    const saving = ref(false)
    const activeTab = ref('trigger')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => isView.value ? '查看检验计划' : isEdit.value ? '编辑检验计划' : '新增检验计划')

    const schemeOptions = ref([
        { id: 'SCH001', name: '压铸件IQC方案' }, { id: 'SCH002', name: 'IPQC巡检方案' },
        { id: 'SCH003', name: 'FQC成品方案' }, { id: 'SCH004', name: 'OQC标准方案' },
    ])
    const materialOptions = ref([
        { id: 'MAT001', code: 'M001', name: '铝锭' }, { id: 'MAT002', code: 'M002', name: '压铸件壳体' },
    ])
    const userOptions = ref([
        { id: 'U001', name: '张三' }, { id: 'U002', name: '李四' }, { id: 'U003', name: '王五' }, { id: 'U004', name: '赵六' },
    ])
    const phenomenonOptions = ref([
        { value: 'PHE001', label: '尺寸超差' }, { value: 'PHE002', label: '表面划伤' },
        { value: 'PHE003', label: '气孔缺陷' }, { value: 'PHE004', label: '裂纹' },
    ])

    const form = reactive({
        id: null as string | null, planCode: '', planName: '', version: 'V1.0',
        planStatus: 'DRAFT' as InspPlanModelStatus, inspType: undefined as string | undefined,
        schemeId: undefined as string | undefined, materialId: undefined as string | undefined,
        orgId: null as string | null, executorId: undefined as string | undefined,
        backupExecutorId: undefined as string | undefined, reviewerId: undefined as string | undefined,
        description: '', defectDisposition: undefined as DefectDisposition | undefined,
        isLatestVersion: true, copyFromId: null as string | null, copyFromCode: '',
        triggerType: 'MANUAL' as PlanTriggerType,
        eventTrigger: { erpDocType: undefined, erpDocStatus: undefined, matchDescription: '' } as EventTriggerConfig,
        timeTrigger: { cronExpression: '', frequencyType: undefined, frequencyValue: undefined } as TimeTriggerConfig,
        quantityTrigger: { quantityThreshold: undefined, quantityUnit: undefined } as QuantityTriggerConfig,
        quickResponse: { enabled: false, responseLevel: 'NORMAL', lockedPhenomenonIds: [], emailAlert: false, emailRecipients: [], dingTalkAlert: false, dingTalkRecipients: [] } as QuickResponseConfig,
    })
    const rules = {
        planCode: [{ required: true, message: '请输入计划编码', trigger: 'blur' }],
        planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
        inspType: [{ required: true, message: '请选择检验类型', trigger: 'change' }],
    }

    const getStatusColor = (s: string) => ({ DRAFT: 'default', ACTIVE: 'success', SUSPENDED: 'warning', OBSOLETE: 'error' }[s] || 'default')
    const getStatusText = (s: string) => ({ DRAFT: '草稿', ACTIVE: '生效', SUSPENDED: '挂起', OBSOLETE: '已作废' }[s] || s)

    // --- 参数覆盖 ---
    const parameterOverrides = ref < any[] > ([])
    const overrideColumns = [
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '原目标值', dataIndex: 'originalTargetValue', key: 'originalTargetValue', width: 100 },
        { title: '覆盖目标值', dataIndex: 'targetValue', key: 'targetValue', width: 110 },
        { title: '覆盖上限', dataIndex: 'upperLimit', key: 'upperLimit', width: 100 },
        { title: '覆盖下限', dataIndex: 'lowerLimit', key: 'lowerLimit', width: 100 },
        { title: '修改原因', dataIndex: 'overrideReason', key: 'overrideReason', width: 150 },
        { title: '操作', key: 'action', width: 80 },
    ]
    const handleAddOverride = () => {
        parameterOverrides.value.push({ schemeDetailId: `OVR-${Date.now()}`, inspItemName: '壳体A面平面度', originalTargetValue: 0.05, targetValue: 0.03, upperLimit: 0.05, lowerLimit: 0, overrideReason: '' })
        message.success('已添加')
    }

    const onSchemeChange = (_schemeId: string) => { parameterOverrides.value = []; message.info('已加载方案, 参数覆盖已重置') }

    const handleBack = () => router.push('/inspection-model/insp-plan-model')
    const handleSave = async () => {
        try { saving.value = true; await formRef.value?.validate(); message.success('保存成功'); router.push('/inspection-model/insp-plan-model') }
        catch { message.error('请完善必填项') }
        finally { saving.value = false }
    }

    onMounted(() => {
        const id = route.params.id as string | undefined
        if (id) {
            Object.assign(form, {
                id, planCode: 'PLN-HFC-IQC-001', planName: '合肥-压铸件进料检验计划', version: 'V1.0',
                planStatus: 'ACTIVE', inspType: 'IQC', schemeId: 'SCH001', materialId: 'MAT002', orgId: 'ORG001',
                executorId: 'U001', backupExecutorId: 'U002', reviewerId: 'U003',
                description: '压铸件进料年度检验标准计划', defectDisposition: 'REWORK', isLatestVersion: true,
                triggerType: 'EVENT',
                eventTrigger: { erpDocType: 'PURCHASE_RECEIVE', erpDocStatus: 'SUBMITTED', matchDescription: '采购收货单提交后自动生成IQC任务' },
                quickResponse: { enabled: true, responseLevel: 'HIGH', lockedPhenomenonIds: ['PHE003', 'PHE004'], emailAlert: true, emailRecipients: ['quality@company.com'], dingTalkAlert: false, dingTalkRecipients: [] },
            })
            parameterOverrides.value = [
                { schemeDetailId: '701', inspItemName: '壳体A面平面度', originalTargetValue: 0.05, targetValue: 0.03, upperLimit: 0.05, lowerLimit: 0, overrideReason: 'A线精度要求更高' }
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

    .tab-card {
        margin-bottom: 16px;
    }

    .tab-toolbar {
        margin-bottom: 12px;
    }
</style>