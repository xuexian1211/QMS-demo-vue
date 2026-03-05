<template>
    <div class="page-container">
        <div class="page-header">
            <h1>试生产验证任务中心</h1>
            <a-space>
                <a-input-search v-model:value="searchKeyword" placeholder="搜索单号/产品" style="width:200px" />
                <a-select v-model:value="filterStatus" placeholder="按状态筛选" allow-clear style="width:130px"
                    :options="[{value:'pending', label:'待验证'},{value:'running', label:'进行中'},{value:'passed', label:'已通过'},{value:'failed', label:'不合格'}]" />
            </a-space>
        </div>

        <a-row :gutter="16">
            <!-- 左侧：任务列表 -->
            <a-col :span="8">
                <a-card title="验证任务列表" size="small">
                    <template #extra>
                        <a-badge :count="filteredTasks.length" :number-style="{ backgroundColor: '#1890ff' }" />
                    </template>
                    <div class="task-list">
                        <div v-for="task in filteredTasks" :key="task.id"
                            :class="['task-item', { 'task-item--active': selectedTask?.id === task.id }]"
                            @click="selectTask(task)">
                            <div class="task-item-header">
                                <span style="font-family:monospace;font-size:11px;color:#999">{{ task.changePointNo
                                    }}</span>
                                <a-tag :color="verificationStatusColorMap[task.status]" size="small">
                                    {{ verificationStatusLabelMap[task.status] }}
                                </a-tag>
                            </div>
                            <div style="font-size:13px;margin-bottom:6px">{{ task.planTitle }}</div>
                            <a-progress :percent="Math.round(task.completedCount / task.requiredCount * 100)"
                                size="small"
                                :status="task.status === 'passed' ? 'success' : task.status === 'failed' ? 'exception' : 'active'"
                                :format="() => `${task.passedCount}/${task.requiredCount}`" />
                            <div
                                style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-top:4px">
                                <span>{{ task.verifier }}</span>
                                <span
                                    :style="isOverdue(task.deadline) && task.status === 'running' ? 'color:#ff4d4f' : ''">
                                    截止: {{ formatDate(task.deadline) }}
                                    <span v-if="isOverdue(task.deadline) && task.status === 'running'"> ⏰超时</span>
                                </span>
                            </div>
                        </div>
                        <a-empty v-if="filteredTasks.length === 0" />
                    </div>
                </a-card>
            </a-col>

            <!-- 右侧：任务详情与录入 -->
            <a-col :span="16">
                <template v-if="selectedTask">
                    <a-card size="small">
                        <template #title>
                            <span>{{ selectedTask.planTitle }}</span>
                            <a-tag :color="verificationStatusColorMap[selectedTask.status]" style="margin-left:8px">
                                {{ verificationStatusLabelMap[selectedTask.status] }}
                            </a-tag>
                        </template>
                        <template #extra>
                            <a-button v-if="selectedTask.status === 'running' || selectedTask.status === 'pending'"
                                type="primary" size="small" @click="addTaskItem">
                                + 录入验证件
                            </a-button>
                        </template>

                        <!-- 任务概况 -->
                        <a-row :gutter="16" style="margin-bottom:16px">
                            <a-col :span="6">
                                <a-statistic title="要求合格件数" :value="selectedTask.requiredCount"
                                    :value-style="{ color: '#1890ff' }" />
                            </a-col>
                            <a-col :span="6">
                                <a-statistic title="已检验件数" :value="selectedTask.completedCount"
                                    :value-style="{ color: '#fa8c16' }" />
                            </a-col>
                            <a-col :span="6">
                                <a-statistic title="连续合格件" :value="selectedTask.passedCount"
                                    :value-style="{ color: '#52c41a' }" />
                            </a-col>
                            <a-col :span="6">
                                <a-statistic :title="isOverdue(selectedTask.deadline) ? '已超时(h)' : '剩余时间(h)'"
                                    :value="getRemainingHours(selectedTask.deadline)"
                                    :value-style="{ color: isOverdue(selectedTask.deadline) ? '#ff4d4f' : '#666' }" />
                            </a-col>
                        </a-row>

                        <!-- 验证记录表 -->
                        <a-table :columns="itemColumns" :data-source="selectedTask.taskItems" size="small"
                            :pagination="false" row-key="id">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'result'">
                                    <a-tag
                                        :color="record.result === 'pass' ? 'green' : record.result === 'fail' ? 'red' : 'default'">{{
                                        record.result === 'pass' ? '✅ 合格' : record.result === 'fail' ? '❌ 不合格' : '⏳ 待检'
                                        }}</a-tag>
                                </template>
                                <template v-else-if="column.key === 'inspectTime'">
                                    {{ record.inspectTime ? formatDate(record.inspectTime) : '-' }}
                                </template>
                                <template v-else-if="column.key === 'action'">
                                    <a-button v-if="record.result === 'pending'" type="link" size="small"
                                        @click="fillItemResult(record)">填写结果</a-button>
                                </template>
                            </template>
                        </a-table>

                        <!-- 放行操作区 -->
                        <div style="margin-top:16px"
                            v-if="selectedTask.passedCount >= selectedTask.requiredCount && selectedTask.status === 'running'">
                            <a-alert type="success" message="🎉 验证达标！所有要求连续合格件均已通过检验。"
                                :description="'点击【确认放行】后，系统将自动向 MES 发送解锁指令，恢复正常生产。'" show-icon />
                            <a-button type="primary" block @click="handleRelease" style="margin-top:12px">
                                ✅ 确认放行（自动发送 MES 解锁指令）
                            </a-button>
                        </div>

                        <!-- 不合格处理 -->
                        <div style="margin-top:16px"
                            v-else-if="selectedTask.status === 'running' && selectedTask.taskItems.some((i: any) => i.result === 'fail')">
                            <a-alert type="error" message="存在不合格验证件，验证计数重置。请生产部门调整后重新提交。" />
                            <a-button danger style="margin-top:8px" @click="resetCount">重置计数，重新开始验证</a-button>
                        </div>
                    </a-card>
                </template>
                <a-empty v-else description="请从左侧选择验证任务" style="margin-top: 80px;" />
            </a-col>
        </a-row>

        <!-- 录入结果弹窗 -->
        <a-modal v-model:visible="fillModalVisible" title="录入验证结果" width="480px" @ok="submitItemResult">
            <a-form :model="fillForm" layout="vertical">
                <a-form-item label="检验结果" required>
                    <a-radio-group v-model:value="fillForm.result" button-style="solid">
                        <a-radio-button value="pass"><span style="color:#52c41a">✅ 合格</span></a-radio-button>
                        <a-radio-button value="fail"><span style="color:#ff4d4f">❌ 不合格</span></a-radio-button>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="检验备注">
                    <a-textarea v-model:value="fillForm.note" :rows="2" placeholder="如有异常请填写说明..." />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useRoute } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import dayjs from 'dayjs'
    import type { VerificationPlan, VerificationTaskItem } from '@/types/change-point'

    const route = useRoute()
    const searchKeyword = ref('')
    const filterStatus = ref < string | undefined > (undefined)
    const selectedTask = ref < (VerificationPlan & { changePointNo: string }) | null > (null)

    const verificationStatusColorMap: Record<string, string> = { pending: 'default', running: 'blue', passed: 'green', failed: 'red' }
    const verificationStatusLabelMap: Record<string, string> = { pending: '待开始', running: '验证中', passed: '已通过', failed: '不合格' }

    // 模拟数据
    const tasks = ref < (VerificationPlan & { changePointNo: string })[] > ([
        {
            id: 'vt1', changePointId: '1', changePointNo: 'CPR-20240305-001',
            planTitle: '机台MC-02换模具后首件验证（3件连续合格）',
            requiredCount: 3, completedCount: 2, passedCount: 2,
            verifier: '赵IPQC', qeApprover: '王QE',
            deadline: dayjs().add(1, 'hour').toISOString(),
            status: 'running',
            taskItems: [
                { id: 'ti1', sequence: 1, inspector: '赵IPQC', inspectTime: dayjs().subtract(30, 'minute').toISOString(), result: 'pass', note: '' },
                { id: 'ti2', sequence: 2, inspector: '赵IPQC', inspectTime: dayjs().subtract(15, 'minute').toISOString(), result: 'pass', note: '' },
                { id: 'ti3', sequence: 3, inspector: '', inspectTime: '', result: 'pending', note: '' },
            ],
            createTime: dayjs().subtract(2, 'hour').toISOString(),
            updateTime: dayjs().subtract(15, 'minute').toISOString(),
        },
        {
            id: 'vt2', changePointId: '4', changePointNo: 'CPR-20240305-004',
            planTitle: '检具更换后MSA验证（5件连续合格）',
            requiredCount: 5, completedCount: 1, passedCount: 1,
            verifier: '钱IPQC', qeApprover: '李QE',
            deadline: dayjs().subtract(1, 'hour').toISOString(),
            status: 'running',
            taskItems: [
                { id: 'ti4', sequence: 1, inspector: '钱IPQC', inspectTime: dayjs().subtract(90, 'minute').toISOString(), result: 'pass', note: '' },
                { id: 'ti5', sequence: 2, inspector: '', inspectTime: '', result: 'pending', note: '' },
                { id: 'ti6', sequence: 3, inspector: '', inspectTime: '', result: 'pending', note: '' },
                { id: 'ti7', sequence: 4, inspector: '', inspectTime: '', result: 'pending', note: '' },
                { id: 'ti8', sequence: 5, inspector: '', inspectTime: '', result: 'pending', note: '' },
            ],
            createTime: dayjs().subtract(5, 'hour').toISOString(),
            updateTime: dayjs().subtract(90, 'minute').toISOString(),
        },
        {
            id: 'vt3', changePointId: '6', changePointNo: 'CPR-20240304-001',
            planTitle: '新供应商铝锭试产首件验证（3件）',
            requiredCount: 3, completedCount: 3, passedCount: 3,
            verifier: '孙IPQC', qeApprover: '周QE',
            deadline: dayjs().subtract(1, 'day').toISOString(),
            status: 'passed',
            taskItems: [
                { id: 'ti9', sequence: 1, inspector: '孙IPQC', inspectTime: dayjs().subtract(1, 'day').toISOString(), result: 'pass' },
                { id: 'ti10', sequence: 2, inspector: '孙IPQC', inspectTime: dayjs().subtract(1, 'day').add(30, 'minute').toISOString(), result: 'pass' },
                { id: 'ti11', sequence: 3, inspector: '孙IPQC', inspectTime: dayjs().subtract(1, 'day').add(60, 'minute').toISOString(), result: 'pass' },
            ],
            createTime: dayjs().subtract(2, 'day').toISOString(),
            updateTime: dayjs().subtract(1, 'day').add(90, 'minute').toISOString(),
        },
    ])

    const filteredTasks = computed(() =>
        tasks.value.filter(t => {
            if (filterStatus.value && t.status !== filterStatus.value) return false
            if (searchKeyword.value && !t.changePointNo.includes(searchKeyword.value) && !t.planTitle.includes(searchKeyword.value)) return false
            return true
        })
    )

    const itemColumns = [
        { title: '序号', dataIndex: 'sequence', key: 'sequence', width: 50 },
        { title: '检验结果', key: 'result', width: 100 },
        { title: '检验人', dataIndex: 'inspector', key: 'inspector', width: 80 },
        { title: '检验时间', key: 'inspectTime', width: 130 },
        { title: '备注', dataIndex: 'note', key: 'note' },
        { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
    ]

    const fillModalVisible = ref(false)
    const currentItem = ref < VerificationTaskItem | null > (null)
    const fillForm = ref({ result: 'pass', note: '' })

    const selectTask = (task: VerificationPlan & { changePointNo: string }) => {
        selectedTask.value = task
    }

    const formatDate = (d: string) => d ? dayjs(d).format('MM-DD HH:mm') : '-'
    const isOverdue = (deadline: string) => dayjs().isAfter(dayjs(deadline))
    const getRemainingHours = (deadline: string) => {
        const diff = dayjs(deadline).diff(dayjs(), 'hour')
        return Math.abs(diff)
    }

    const addTaskItem = () => {
        if (!selectedTask.value) return
        const nextPending = selectedTask.value.taskItems.find(i => i.result === 'pending')
        if (nextPending) {
            fillItemResult(nextPending)
        } else {
            message.info('所有验证件已录入完成')
        }
    }

    const fillItemResult = (item: VerificationTaskItem) => {
        currentItem.value = item
        fillForm.value = { result: 'pass', note: '' }
        fillModalVisible.value = true
    }

    const submitItemResult = () => {
        if (!currentItem.value || !selectedTask.value) return
        const item = selectedTask.value.taskItems.find(i => i.id === currentItem.value!.id)
        if (!item) return
        item.result = fillForm.value.result as 'pass' | 'fail'
        item.note = fillForm.value.note
        item.inspector = '当前检验员'
        item.inspectTime = new Date().toISOString()
        selectedTask.value.completedCount++
        if (item.result === 'pass') {
            selectedTask.value.passedCount++
        } else {
            selectedTask.value.passedCount = 0
            message.warning('当前件不合格，连续合格计数已重置')
        }
        if (selectedTask.value.status === 'pending') selectedTask.value.status = 'running'
        fillModalVisible.value = false
        message.success('验证结果已记录')
    }

    const handleRelease = () => {
        Modal.confirm({
            title: '确认放行',
            content: '所有验证件均合格，确认放行并向MES发送解锁指令？',
            okText: '确认放行',
            okType: 'primary',
            onOk: () => {
                if (!selectedTask.value) return
                selectedTask.value.status = 'passed'
                message.success('🎉 放行成功！MES解锁指令已发送，生产已恢复正常。')
            }
        })
    }

    const resetCount = () => {
        if (!selectedTask.value) return
        selectedTask.value.passedCount = 0
        selectedTask.value.taskItems.forEach(i => { if (i.result === 'fail') i.result = 'pending' })
        message.info('计数已重置，请重新开始验证')
    }

    onMounted(() => {
        const cpId = route.query.changePointId as string
        if (cpId) {
            const task = tasks.value.find(t => t.changePointId === cpId)
            if (task) selectTask(task)
        }
    })
</script>

<style scoped>
    .page-container {
        padding: 24px;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }

    .task-list {
        max-height: calc(100vh - 220px);
        overflow-y: auto;
    }

    .task-item {
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.2s;
    }

    .task-item:hover {
        background: #fafafa;
    }

    .task-item--active {
        background: #e6f7ff;
        border-left: 3px solid #1890ff;
    }

    .task-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }
</style>