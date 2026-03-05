<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <a-button @click="goBack" class="back-btn">
                <template #icon>
                    <ArrowLeftOutlined />
                </template>
                返回列表
            </a-button>
            <div class="page-header-info">
                <h2 class="page-title">{{ pageTitle }}</h2>
                <a-tag v-if="formData.status" :color="statusConfig[formData.status].color as any" class="status-tag">
                    {{ statusConfig[formData.status].label }}
                </a-tag>
                <a-tag v-if="formData.riskLevel" :color="riskColorMap[formData.riskLevel]">
                    {{ riskLabelMap[formData.riskLevel] }}风险
                </a-tag>
            </div>
            <div class="page-header-actions">
                <a-space>
                    <a-button v-if="!isView" type="primary" @click="handleSubmit" :loading="saving">
                        {{ isEdit ? '保存修改' : '提交申报' }}
                    </a-button>
                    <a-button v-if="!isView" @click="saveDraft" :disabled="saving">暂存草稿</a-button>
                    <a-button v-if="isView && formData.status === 'approving'" type="primary"
                        style="background:#faad14; border-color:#faad14"
                        @click="approveModalVisible = true">审批决策</a-button>
                    <a-button v-if="isView && ['locked', 'verifying'].includes(formData.status)" type="primary"
                        @click="goToVerification">前往验证</a-button>
                    <a-button v-if="isView && formData.status === 'released'" @click="closeLoop">标记闭环</a-button>
                </a-space>
            </div>
        </div>

        <!-- 核心表单 -->
        <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
            <!-- 基本信息 -->
            <a-card title="📋 基本信息" size="small" class="form-card">
                <a-row :gutter="16">
                    <a-col :span="6">
                        <a-form-item label="变化点单号">
                            <a-input :value="formData.recordNo || '（系统自动生成）'" disabled />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="变化点标题" name="title" :rules="[{required: true, message: '请填写标题'}]">
                            <a-input v-model:value="formData.title" placeholder="请简洁描述本次变化（如：机台MC-02大修更换模具）"
                                :disabled="isView" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="提报人">
                            <a-input :value="formData.reporter?.name" disabled />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-card>

            <!-- 4M1E 变化点分类 -->
            <a-card class="form-card" size="small">
                <template #title>
                    <span>🏷️ 4M1E 变化分类</span>
                    <span style="color:#faad14; font-size:12px; margin-left:8px">（选择后，系统将自动评估初始风险等级）</span>
                </template>
                <!-- 大图标分类选择 -->
                <div class="type-selector" v-if="!isView">
                    <div v-for="opt in changeTypeOptions" :key="opt.value"
                        :class="['type-item', { 'type-item--active': formData.changeDetail.changeType === opt.value }]"
                        :style="formData.changeDetail.changeType === opt.value ? { borderColor: opt.color, background: opt.color + '22' } : {}"
                        @click="selectChangeType(opt.value as ChangePointType)">
                        <div class="type-icon">{{ opt.icon }}</div>
                        <div class="type-label">{{ opt.label }}</div>
                        <div class="type-desc">{{ opt.description }}</div>
                    </div>
                </div>
                <div v-else class="type-display">
                    <a-tag :color="typeColorMap[formData.changeDetail.changeType]"
                        style="font-size:14px; padding: 6px 12px;">
                        {{ typeIconMap[formData.changeDetail.changeType] }} {{
                        typeLabelMap[formData.changeDetail.changeType] }}
                    </a-tag>
                </div>

                <a-row :gutter="16" style="margin-top: 16px;">
                    <a-col :span="8">
                        <a-form-item label="变化子类型" name="changeDetail.changeSubType">
                            <a-select v-model:value="formData.changeDetail.changeSubType" placeholder="请选择变化子类型"
                                :options="subTypeOptions" :disabled="isView" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="受影响机台/工序">
                            <a-input v-model:value="formData.changeDetail.affectedMachine" placeholder="如：MC-02 / 压铸工序"
                                :disabled="isView" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="受影响产品/物料">
                            <a-input v-model:value="formData.changeDetail.affectedProduct" placeholder="如：产品型号 / 物料编码"
                                :disabled="isView" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="24">
                        <a-form-item label="变化详细描述" :rules="[{required: true, message: '请详细描述变化内容'}]"
                            name="changeDetail.changeDescription">
                            <a-textarea v-model:value="formData.changeDetail.changeDescription" :rows="3"
                                placeholder="请详细描述变化内容、原因及影响范围..." :disabled="isView" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-card>

            <!-- 风险评估 -->
            <a-card class="form-card" size="small">
                <template #title>
                    <span>⚠️ 风险评估</span>
                </template>
                <a-row :gutter="16">
                    <a-col :span="6">
                        <a-form-item label="风险等级">
                            <div :class="['risk-display', `risk-display--${formData.riskLevel}`]">
                                <span class="risk-icon">{{ riskIconMap[formData.riskLevel] }}</span>
                                <span class="risk-label">{{ riskLabelMap[formData.riskLevel] }}</span>
                                <span class="risk-hint">
                                    （{{ formData.riskLevel === 'low' ? '班长确认即生效' : formData.riskLevel === 'medium' ?
                                    'QE审批 + MES锁机' : '品质总监审批 + MES锁机' }}）
                                </span>
                            </div>
                        </a-form-item>
                    </a-col>
                    <a-col :span="18">
                        <a-form-item label="风险描述">
                            <a-textarea v-model:value="formData.riskDescription" :rows="2" placeholder="描述风险点及潜在影响..."
                                :disabled="isView" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-alert v-if="formData.riskLevel === 'high'" type="error"
                    message="🚨 高风险变化点将触发：① 品质总监审批 ② 审批通过后自动向MES发送锁机指令 ③ 强制首件连续合格验证" banner />
                <a-alert v-else-if="formData.riskLevel === 'medium'" type="warning"
                    message="⚠️ 中风险变化点将触发：① QE/品质经理审批 ② 审批通过后自动向MES发送锁机指令 ③ 试生产验证" banner />
            </a-card>

            <!-- MES 互锁信息（只读，看板展示） -->
            <a-card v-if="formData.mesLockTime" title="🔒 MES 互锁信息" size="small" class="form-card">
                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-descriptions :column="1" size="small">
                            <a-descriptions-item label="锁机状态">
                                <a-badge v-if="!formData.mesUnlockTime" status="error" text="锁定中" />
                                <a-badge v-else status="success" text="已解锁" />
                            </a-descriptions-item>
                            <a-descriptions-item label="锁机时间">{{ formatDate(formData.mesLockTime)
                                }}</a-descriptions-item>
                            <a-descriptions-item v-if="formData.mesUnlockTime" label="解锁时间">{{
                                formatDate(formData.mesUnlockTime) }}</a-descriptions-item>
                        </a-descriptions>
                    </a-col>
                    <a-col :span="16">
                        <div class="mes-log-title">MES 操作日志</div>
                        <a-timeline v-if="formData.mesLockLog && formData.mesLockLog.length">
                            <a-timeline-item v-for="log in formData.mesLockLog" :key="log.id"
                                :color="log.action === 'violation' ? 'red' : log.action === 'lock' ? 'orange' : 'green'">
                                <span class="log-action">
                                    {{ log.action === 'lock' ? '🔒 锁机' : log.action === 'unlock' ? '🔓 解锁' : '🚨 盲动报工'
                                    }}
                                </span>
                                <span class="log-meta">{{ formatDate(log.operatorTime) }}</span>
                                <span v-if="log.note" class="log-note"> - {{ log.note }}</span>
                            </a-timeline-item>
                        </a-timeline>
                        <a-empty v-else description="暂无MES操作记录" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                    </a-col>
                </a-row>
            </a-card>

            <!-- 审批信息 -->
            <a-card v-if="formData.approver" title="✍️ 审批信息" size="small" class="form-card">
                <a-descriptions :column="3" bordered size="small">
                    <a-descriptions-item label="审批人">{{ formData.approver }}</a-descriptions-item>
                    <a-descriptions-item label="审批时间">{{ formatDate(formData.approveTime || '') }}</a-descriptions-item>
                    <a-descriptions-item label="审批结果">
                        <a-tag :color="formData.status === 'rejected' ? 'red' : 'green'">
                            {{ formData.status === 'rejected' ? '驳回' : '批准' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="审批意见" :span="3">{{ formData.approveComment || '无'
                        }}</a-descriptions-item>
                </a-descriptions>
            </a-card>

            <!-- 附件 -->
            <a-card title="📎 附件上传" size="small" class="form-card">
                <a-upload-dragger :disabled="isView" :file-list="[]" :before-upload="() => false">
                    <p class="ant-upload-drag-icon">📁</p>
                    <p class="ant-upload-text">点击或拖拽文件上传（支持图片、文档）</p>
                    <p class="ant-upload-hint">可上传变化现场照片、技术文件等</p>
                </a-upload-dragger>
            </a-card>
        </a-form>

        <!-- 审批弹窗 -->
        <a-modal v-model:visible="approveModalVisible" title="审批决策" width="540px" @ok="submitApproval">
            <a-form :model="approveForm" layout="vertical">
                <a-form-item label="审批决策" required>
                    <a-radio-group v-model:value="approveForm.result">
                        <a-radio value="approved"><span style="color:#52c41a">✅ 批准</span></a-radio>
                        <a-radio value="rejected"><span style="color:#ff4d4f">❌ 驳回</span></a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="审批意见">
                    <a-textarea v-model:value="approveForm.comment" :rows="3" />
                </a-form-item>
                <a-alert v-if="approveForm.result === 'approved' && ['medium', 'high'].includes(formData.riskLevel)"
                    type="warning" message="批准后将自动调用MES接口发送锁机指令，并生成试生产验证任务。" banner />
            </a-form>
        </a-modal>

        <!-- 闭环备注弹窗 -->
        <a-modal v-model:visible="closeLoopModalVisible" title="闭环确认" width="480px" @ok="submitCloseLoop">
            <a-form layout="vertical">
                <a-form-item label="闭环说明">
                    <a-textarea v-model:value="closeLoopComment" :rows="3" placeholder="请说明变化点已稳定生产，可正式闭环..." />
                </a-form-item>
                <a-form-item label="是否触发关联文件升版">
                    <a-switch v-model:checked="triggerDocUpdate" checked-children="是" un-checked-children="否" />
                    <span v-if="triggerDocUpdate" style="color:#faad14; margin-left:8px; font-size:12px">系统将提示并触发
                        SOP/CP/FMEA 文件升版</span>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { ArrowLeftOutlined } from '@ant-design/icons-vue'
    import { message, Empty } from 'ant-design-vue'
    import dayjs from 'dayjs'
    import type { ChangePointRecord, ChangePointType, RiskLevel } from '@/types/change-point'
    import { STATUS_CONFIG, CHANGE_TYPE_OPTIONS } from '@/types/change-point'

    const router = useRouter()
    const route = useRoute()

    const isEdit = computed(() => route.path.includes('/edit/'))
    const isView = computed(() => route.path.includes('/view/'))
    const isCreate = computed(() => route.path.includes('/create'))
    const pageTitle = computed(() => isEdit.value ? '编辑变化点处理单' : isView.value ? '查看变化点处理单' : '新增变化点申报')

    const statusConfig = STATUS_CONFIG
    const changeTypeOptions = CHANGE_TYPE_OPTIONS
    const typeColorMap: Record<ChangePointType, string> = { man: 'blue', machine: 'purple', material: 'orange', method: 'cyan', environment: 'green', measure: 'magenta', other: 'default' }
    const typeLabelMap: Record<ChangePointType, string> = { man: '人', machine: '机', material: '料', method: '法', environment: '环', measure: '测', other: '其他' }
    const typeIconMap: Record<ChangePointType, string> = { man: '👷', machine: '🏭', material: '📦', method: '📋', environment: '🌡️', measure: '📐', other: '📝' }
    const riskColorMap: Record<RiskLevel, string> = { low: 'green', medium: 'orange', high: 'red' }
    const riskLabelMap: Record<RiskLevel, string> = { low: '低', medium: '中', high: '高' }
    const riskIconMap: Record<RiskLevel, string> = { low: '🟢', medium: '🟡', high: '🔴' }

    // 子类型选项（根据主类型动态变化）
    const subTypeMap: Record<ChangePointType, string[]> = {
        man: ['新员工上岗', '岗位调整', '班次变更', '操作技能培训'],
        machine: ['新设备引入', '设备大修', '设备改造', '模具更换', '设备维护后复产'],
        material: ['新材料导入', '材料规格变更', '材料供应商变更', '材料批次切换'],
        method: ['新工艺引入', '工艺参数调整', '流程优化', '新工艺流程'],
        environment: ['温湿度变化', '生产环境改造', '生产线搬迁', '环境条件变化'],
        measure: ['新检具引入', '检具更换', '测量方法变更', '测量标准更新'],
        other: ['客户要求变更', '法规要求变更', '紧急插单', '临时工艺调整'],
    }

    const subTypeOptions = computed(() =>
        (subTypeMap[formData.changeDetail.changeType] || []).map(v => ({ value: v, label: v }))
    )

    // 风险等级智能推算（简化规则，实际应从riskMatrixRules获取）
    const computeRiskLevel = (type: ChangePointType, subType: string): RiskLevel => {
        const highRiskKeywords = ['供应商变更', '大修', '新工艺', '环境改造', '搬迁', '模具更换']
        const lowRiskKeywords = ['内部调岗', '新员工上岗', '批次切换', '参数微调']
        if (highRiskKeywords.some(k => subType.includes(k))) return 'high'
        if (lowRiskKeywords.some(k => subType.includes(k))) return 'low'
        return 'medium'
    }

    // 表单数据
    const formData = reactive < Partial < ChangePointRecord > & {
        changeDetail: { changeType: ChangePointType; changeSubType: string; changeDescription: string; affectedMachine?: string; affectedProduct?: string; affectedProcess?: string }
    } > ({
        recordNo: '',
        title: '',
        reporter: { id: 'current_user', name: '当前用户', department: '品质部' },
        reportTime: new Date().toISOString(),
        changeDetail: { changeType: 'machine', changeSubType: '', changeDescription: '', affectedMachine: '', affectedProduct: '' },
        riskLevel: 'medium',
        riskDescription: '',
        status: 'draft',
        mesLockTime: undefined,
        mesUnlockTime: undefined,
        mesLockLog: [],
    })

    const rules = {}
    const formRef = ref()
    const saving = ref(false)
    const approveModalVisible = ref(false)
    const approveForm = reactive({ result: 'approved', comment: '' })
    const closeLoopModalVisible = ref(false)
    const closeLoopComment = ref('')
    const triggerDocUpdate = ref(false)

    // 方法
    const selectChangeType = (type: ChangePointType) => {
        formData.changeDetail.changeType = type
        formData.changeDetail.changeSubType = ''
    }

    const formatDate = (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''

    const goBack = () => router.push('/production-quality/change-point/list')

    const goToVerification = () =>
        router.push(`/production-quality/change-point/verification?changePointId=${formData.id || 'demo'}`)

    const handleSubmit = async () => {
        saving.value = true
        setTimeout(() => {
            saving.value = false
            message.success('变化点申报提交成功！系统将根据风险等级自动路由审批。')
            goBack()
        }, 800)
    }

    const saveDraft = () => {
        message.success('草稿已保存')
    }

    const submitApproval = () => {
        if (approveForm.result === 'approved') {
            formData.status = ['medium', 'high'].includes(formData.riskLevel || '') ? 'locked' : 'released'
            if (['medium', 'high'].includes(formData.riskLevel || '')) {
                formData.mesLockTime = new Date().toISOString()
                formData.mesLockLog = [{ id: 'log1', action: 'lock', machineNo: formData.changeDetail.affectedMachine || 'N/A', operatorTime: new Date().toISOString(), result: 'success', note: '审批通过，自动锁机' }]
                message.success('审批通过！MES锁机指令已发送，试生产验证任务已生成。')
            } else {
                message.success('审批通过！低风险变化点已记录，生产继续。')
            }
        } else {
            formData.status = 'rejected'
            message.warning('已驳回。')
        }
        formData.approver = '当前审批人'
        formData.approveTime = new Date().toISOString()
        formData.approveComment = approveForm.comment
        approveModalVisible.value = false
    }

    const closeLoop = () => {
        closeLoopComment.value = ''
        triggerDocUpdate.value = false
        closeLoopModalVisible.value = true
    }

    const submitCloseLoop = () => {
        formData.status = 'closed'
        formData.closedBy = '当前用户'
        formData.closeTime = new Date().toISOString()
        formData.closeComment = closeLoopComment.value
        if (triggerDocUpdate.value) message.info('系统已提示技术部触发 SOP/CP/FMEA 文件升版。')
        message.success('变化点已闭环！')
        closeLoopModalVisible.value = false
    }

    onMounted(() => {
        const id = route.params.id as string
        if (id && (isEdit.value || isView.value)) {
            // NOTE: 实际场景下从API加载数据，此处使用模拟数据
            formData.id = id
            formData.recordNo = `CPR-20240305-00${id}`
            formData.title = id === '1' ? '关键机台 #MC-02 大修更换模具' : id === '2' ? '核心原料供应商切换 - 铝锭' : '变化点详情'
            formData.riskLevel = id === '3' ? 'low' : id === '1' || id === '2' ? 'high' : 'medium'
            formData.status = id === '1' ? 'locked' : id === '2' ? 'approving' : id === '3' ? 'released' : id === '4' ? 'verifying' : 'approved'
            formData.changeDetail.changeType = id === '1' ? 'machine' : id === '2' ? 'material' : id === '3' ? 'man' : id === '4' ? 'measure' : 'method'
            formData.changeDetail.changeSubType = id === '1' ? '模具更换' : id === '2' ? '材料供应商变更' : '新员工上岗'
            formData.changeDetail.changeDescription = '（加载的模拟描述内容）'
            if (id === '1') formData.mesLockTime = '2024-03-05T09:00:00'
            if (formData.mesLockTime) {
                formData.mesLockLog = [
                    { id: 'l1', action: 'lock', machineNo: 'MC-02', operatorTime: '2024-03-05T09:00:00', result: 'success', note: '审批通过，自动锁机' },
                    { id: 'l2', action: 'violation', machineNo: 'MC-02', operatorTime: '2024-03-05T11:45:00', result: 'success', note: 'MES检测到异常批量报工，触发红色预警' },
                ]
            }
        }
    })
</script>

<style scoped>
    .page-container {
        padding: 24px;
    }

    .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
    }

    .back-btn {
        flex-shrink: 0;
    }

    .page-header-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .page-title {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
    }

    .page-header-actions {
        flex-shrink: 0;
    }

    .form-card {
        margin-bottom: 16px;
    }

    /* 类型选择器 */
    .type-selector {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .type-item {
        flex: 1;
        min-width: 110px;
        padding: 12px;
        border-radius: 8px;
        border: 2px solid #d9d9d9;
        background: #fafafa;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
    }

    .type-item:hover {
        border-color: #1890ff;
    }

    .type-item--active {
        border-color: #1890ff !important;
        background: #e6f7ff !important;
    }

    .type-icon {
        font-size: 22px;
        margin-bottom: 4px;
    }

    .type-label {
        font-size: 13px;
        font-weight: 600;
    }

    .type-desc {
        font-size: 11px;
        color: #999;
        margin-top: 2px;
    }

    .type-display {
        margin-bottom: 8px;
    }

    /* 风险展示 */
    .risk-display {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 8px;
    }

    .risk-display--low {
        background: #f6ffed;
        border: 1px solid #b7eb8f;
    }

    .risk-display--medium {
        background: #fff7e6;
        border: 1px solid #ffd591;
    }

    .risk-display--high {
        background: #fff1f0;
        border: 1px solid #ffa39e;
    }

    .risk-icon {
        font-size: 18px;
    }

    .risk-label {
        font-size: 14px;
        font-weight: 700;
    }

    .risk-hint {
        font-size: 12px;
        color: #999;
    }

    /* MES 日志 */
    .mes-log-title {
        font-size: 13px;
        color: #666;
        margin-bottom: 8px;
    }

    .log-action {
        font-weight: 600;
    }

    .log-meta {
        color: #999;
        margin-left: 8px;
        font-size: 12px;
    }

    .log-note {
        color: #999;
        font-size: 12px;
    }
</style>