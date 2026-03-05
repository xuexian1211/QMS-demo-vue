<template>
    <div class="page-container">
        <div class="page-header">
            <h1>风险矩阵与规则配置</h1>
            <a-space>
                <a-button type="primary" @click="showAddModal">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    新增规则
                </a-button>
                <a-button @click="handleExport">导出配置</a-button>
            </a-space>
        </div>

        <a-alert type="info" message="风险规则配置说明"
            description="系统在变化点提报时，将根据「变化类型 + 子类型关键词」自动匹配风险等级，并自动决定审批路由（班长/QE/品质总监）和是否触发MES锁机。规则优先级：高风险 > 中风险 > 低风险。"
            show-icon style="margin-bottom: 16px;" />

        <!-- 规则分类展示 -->
        <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane v-for="opt in changeTypeOptions" :key="opt.value"
                :tab="`${opt.icon} ${opt.label.split(' ')[0]}`">
                <a-table :columns="ruleColumns" :data-source="getRulesByType(opt.value as ChangePointType)" size="small"
                    :pagination="false" row-key="id" class="rule-table">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'defaultRiskLevel'">
                            <a-tag :color="riskColorMap[record.defaultRiskLevel]">{{
                                riskLabelMap[record.defaultRiskLevel] }}</a-tag>
                        </template>
                        <template v-else-if="column.key === 'requireMesLock'">
                            <a-badge v-if="record.requireMesLock" status="error" text="自动锁机" />
                            <a-badge v-else status="default" text="无需锁机" />
                        </template>
                        <template v-else-if="column.key === 'approvalRoute'">
                            <span v-if="record.requireDirectorApproval" style="color:#ff4d4f">品质总监审批</span>
                            <span v-else-if="record.requireQEApproval" style="color:#faad14">QE/品质经理审批</span>
                            <span v-else style="color:#52c41a">班长确认即生效</span>
                        </template>
                        <template v-else-if="column.key === 'isActive'">
                            <a-switch v-model:checked="record.isActive" size="small"
                                @change="(v: boolean) => toggleRule(record, v)" />
                        </template>
                        <template v-else-if="column.key === 'action'">
                            <a-space>
                                <a-button type="link" size="small" @click="editRule(record)">编辑</a-button>
                                <a-popconfirm title="确认删除此规则？" @confirm="deleteRule(record.id)">
                                    <a-button type="link" size="small" danger>删除</a-button>
                                </a-popconfirm>
                            </a-space>
                        </template>
                    </template>
                </a-table>
            </a-tab-pane>
        </a-tabs>

        <!-- 新增/编辑弹窗 -->
        <a-modal v-model:visible="modalVisible" :title="editingRule ? '编辑规则' : '新增风险规则'" width="600px" @ok="submitRule">
            <a-form :model="ruleForm" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="变化类型" required>
                            <a-select v-model:value="ruleForm.changeType"
                                :options="changeTypeOptions.map(o => ({ value: o.value, label: `${o.icon} ${o.label}` }))" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="变化子类型" required>
                            <a-input v-model:value="ruleForm.subType" placeholder="如：供应商变更" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-form-item label="匹配关键词">
                    <a-input v-model:value="ruleForm.keyword" placeholder="用逗号分隔多个关键词，如：大修,更换模具" />
                    <div class="hint">系统将在子类型和描述中匹配这些关键词来触发此规则</div>
                </a-form-item>
                <a-form-item label="默认风险等级" required>
                    <a-radio-group v-model:value="ruleForm.defaultRiskLevel" button-style="solid">
                        <a-radio-button value="low" style="color:#52c41a">🟢 低风险</a-radio-button>
                        <a-radio-button value="medium" style="color:#faad14">🟡 中风险</a-radio-button>
                        <a-radio-button value="high" style="color:#ff4d4f">🔴 高风险</a-radio-button>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="触发条件（自动计算）">
                    <a-checkbox v-model:checked="ruleForm.requireQEApproval">需要 QE/品质经理审批</a-checkbox>
                    <a-checkbox v-model:checked="ruleForm.requireDirectorApproval"
                        style="margin-left:16px">需要品质总监审批</a-checkbox>
                    <a-checkbox v-model:checked="ruleForm.requireMesLock" style="margin-left:16px">
                        <span style="color:#ff4d4f">审批通过后自动MES锁机</span>
                    </a-checkbox>
                </a-form-item>
                <a-form-item label="规则说明">
                    <a-textarea v-model:value="ruleForm.description" :rows="2" placeholder="可选：说明此规则的设置原因..." />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed } from 'vue'
    import { PlusOutlined } from '@ant-design/icons-vue'
    import { message } from 'ant-design-vue'
    import type { RiskMatrixRule, ChangePointType, RiskLevel } from '@/types/change-point'
    import { CHANGE_TYPE_OPTIONS } from '@/types/change-point'

    const changeTypeOptions = CHANGE_TYPE_OPTIONS
    const activeTab = ref < ChangePointType > ('man')

    const riskColorMap: Record<RiskLevel, string> = { low: 'green', medium: 'orange', high: 'red' }
    const riskLabelMap: Record<RiskLevel, string> = { low: '低风险', medium: '中风险', high: '高风险' }

    // 模拟规则数据
    const rules = ref < RiskMatrixRule[] > ([
        { id: '1', changeType: 'man', subType: '新员工上岗', keyword: '新员工,新工人', defaultRiskLevel: 'low', requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, description: '新员工上岗视为低风险', isActive: true },
        { id: '2', changeType: 'man', subType: '岗位调整', keyword: '调岗', defaultRiskLevel: 'low', requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, description: '关键岗位调整', isActive: true },
        { id: '3', changeType: 'machine', subType: '模具更换', keyword: '模具,换模', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, description: 'IATF 要求：模具更换属于高影响变化', isActive: true },
        { id: '4', changeType: 'machine', subType: '设备大修', keyword: '大修,维修后', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, description: '设备大修后性能可能发生变化', isActive: true },
        { id: '5', changeType: 'machine', subType: '日常维护保养', keyword: '保养,日常维护', defaultRiskLevel: 'low', requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, isActive: true },
        { id: '6', changeType: 'material', subType: '材料供应商变更', keyword: '供应商切换,供应商变更', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, description: '核心物料供应商变更影响材料性能', isActive: true },
        { id: '7', changeType: 'material', subType: '材料批次切换', keyword: '批次切换', defaultRiskLevel: 'low', requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, isActive: true },
        { id: '8', changeType: 'method', subType: '工艺参数调整', keyword: '参数调整', defaultRiskLevel: 'medium', requireQEApproval: true, requireDirectorApproval: false, requireMesLock: true, isActive: true },
        { id: '9', changeType: 'method', subType: '新工艺引入', keyword: '新工艺', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, isActive: true },
        { id: '10', changeType: 'environment', subType: '生产环境改造', keyword: '改造,搬迁', defaultRiskLevel: 'medium', requireQEApproval: true, requireDirectorApproval: false, requireMesLock: true, isActive: true },
        { id: '11', changeType: 'measure', subType: '检具更换', keyword: '检具更换,仪器更换', defaultRiskLevel: 'medium', requireQEApproval: true, requireDirectorApproval: false, requireMesLock: true, isActive: true },
        { id: '12', changeType: 'measure', subType: '测量方法变更', keyword: '测量方法', defaultRiskLevel: 'high', requireQEApproval: true, requireDirectorApproval: true, requireMesLock: true, isActive: true },
    ])

    const getRulesByType = (type: ChangePointType) => rules.value.filter(r => r.changeType === type)

    const ruleColumns = [
        { title: '子类型', dataIndex: 'subType', key: 'subType', width: 150 },
        { title: '匹配关键词', dataIndex: 'keyword', key: 'keyword', width: 150, ellipsis: true },
        { title: '风险等级', key: 'defaultRiskLevel', width: 90 },
        { title: '审批路由', key: 'approvalRoute', width: 130 },
        { title: 'MES互锁', key: 'requireMesLock', width: 100 },
        { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: '启用', key: 'isActive', width: 70 },
        { title: '操作', key: 'action', width: 100, fixed: 'right' },
    ]

    // 弹窗
    const modalVisible = ref(false)
    const editingRule = ref < RiskMatrixRule | null > (null)
    const ruleForm = reactive < Partial < RiskMatrixRule >> ({
        changeType: 'machine', subType: '', keyword: '',
        defaultRiskLevel: 'medium',
        requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false,
        description: '', isActive: true,
    })

    const showAddModal = () => {
        editingRule.value = null
        Object.assign(ruleForm, { subType: '', keyword: '', defaultRiskLevel: 'medium', requireQEApproval: false, requireDirectorApproval: false, requireMesLock: false, description: '' })
        modalVisible.value = true
    }

    const editRule = (rule: RiskMatrixRule) => {
        editingRule.value = rule
        Object.assign(ruleForm, { ...rule })
        modalVisible.value = true
    }

    const submitRule = () => {
        if (editingRule.value) {
            Object.assign(editingRule.value, { ...ruleForm })
            message.success('规则已更新')
        } else {
            rules.value.push({ ...ruleForm, id: `r${Date.now()}` } as RiskMatrixRule)
            message.success('规则已添加')
        }
        modalVisible.value = false
    }

    const toggleRule = (rule: RiskMatrixRule, active: boolean) => {
        message.success(`规则「${rule.subType}」已${active ? '启用' : '禁用'}`)
    }

    const deleteRule = (id: string) => {
        const idx = rules.value.findIndex(r => r.id === id)
        if (idx >= 0) { rules.value.splice(idx, 1); message.success('规则已删除') }
    }

    const handleExport = () => message.info('导出功能开发中...')
</script>

<style scoped>
    .page-container {
        padding: 24px;
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }

    .rule-table :deep(.ant-table-tbody > tr > td) {
        padding: 7px 12px;
    }

    .hint {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
    }
</style>