<template>
    <div class="process-mapping-matrix">
        <div class="header-actions">
            <a-input-search v-model:value="searchKeyword" placeholder="搜索物料/工厂/客户/条款" style="width: 300px"
                @search="handleSearch" />
            <a-button type="primary" @click="handleConfig">配置映射</a-button>
        </div>

        <!-- 映射展示矩阵 -->
        <a-table :columns="columns" :data-source="mappings" :pagination="{ pageSize: 10 }" bordered>
            <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'trigger_condition'">
                    <a-tag color="purple">{{ record.trigger_condition }}</a-tag>
                </template>
                <template v-if="column.dataIndex === 'action_type'">
                    <a-tag :color="getActionColor(record.action_type)">
                        {{ record.action_type }}
                    </a-tag>
                </template>
            </template>
        </a-table>

        <!-- 配置业务映射弹窗 -->
        <a-modal v-model:visible="visibleConfig" title="配置业务映射流程" @ok="submitConfig" width="700px">
            <a-form :model="configForm" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="选择客户" required>
                            <a-select v-model:value="configForm.customerId" placeholder="选择客户实体">
                                <a-select-option value="1">特斯拉(Tesla)</a-select-option>
                                <a-select-option value="2">大众汽车(VW)</a-select-option>
                                <a-select-option value="3">宝马(BMW)</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="引用条款协议" required>
                            <a-select v-model:value="configForm.requirementId" placeholder="选择适用的规定(输入层)" disabled
                                v-if="!configForm.customerId">
                                <a-select-option value="">请先选择客户</a-select-option>
                            </a-select>
                            <a-select v-model:value="configForm.requirementId" placeholder="选择适用的规定" v-else>
                                <a-select-option value="1">每生产 500 件全尺寸检验</a-select-option>
                                <a-select-option value="2">PPAP相关文件保留 15年</a-select-option>
                                <a-select-option value="3">发生A类客诉，24h D3 / 48h D8</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="干预的业务单据/流程" required>
                    <a-select v-model:value="configForm.businessNode" placeholder="选择 QMS 中的触发点">
                        <a-select-option value="incoming">IQC / 来料检验单</a-select-option>
                        <a-select-option value="process_reporting">车间报工 / 过程检验</a-select-option>
                        <a-select-option value="abnormal_handling">不合格品处置 / 客诉</a-select-option>
                        <a-select-option value="shipping">OQC / 出货</a-select-option>
                        <a-select-option value="doc_control">APQP / FMEA 文档管理</a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="关联物料/产品族 (留空即适用全部)">
                    <a-select mode="multiple" v-model:value="configForm.materialId" placeholder="限制范围">
                        <a-select-option value="M1">电机壳体体组件</a-select-option>
                        <a-select-option value="M2">方向盘转角支架</a-select-option>
                    </a-select>
                </a-form-item>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="引擎动作触发条件" required>
                            <a-input v-model:value="configForm.triggerCondition" placeholder="如：报工等于 500，产生客诉" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="执行动作结果" required>
                            <a-select v-model:value="configForm.actionType">
                                <a-select-option value="警告拦截">警告并拦截流程</a-select-option>
                                <a-select-option value="切换模板">自动切换报告模板</a-select-option>
                                <a-select-option value="超期预警">后台计时及超期预警</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive } from 'vue'
    import { message } from 'ant-design-vue'

    const searchKeyword = ref('')
    const visibleConfig = ref(false)

    const handleSearch = () => {
        message.info('过滤映射矩阵内容')
    }

    const handleConfig = () => {
        visibleConfig.value = true
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case '警告拦截': return 'red'
            case '切换模板': return 'cyan'
            case '超期预警': return 'orange'
            default: return 'blue'
        }
    }

    // 表格配置
    const columns = [
        { title: '业务线/工厂', dataIndex: 'factory', key: 'factory', width: 120 },
        { title: '客户代码', dataIndex: 'customer', key: 'customer', width: 120 },
        { title: '适用范围', dataIndex: 'scope', key: 'scope', width: 150 },
        { title: '引用条款协议', dataIndex: 'requirement', key: 'requirement', ellipsis: true },
        { title: '干预流程节点', dataIndex: 'business_node', key: 'business_node', width: 140 },
        { title: '触发条件 (Trigger)', dataIndex: 'trigger_condition', key: 'trigger_condition', width: 160 },
        { title: '执行动作', dataIndex: 'action_type', key: 'action_type', width: 120 }
    ]

    // 模拟已配置的矩阵数据
    const mappings = ref([
        {
            key: '1',
            factory: '芜湖一厂',
            customer: '特斯拉(Tesla)',
            scope: '电机壳体组件 / 全部',
            requirement: '每生产 500 件必须做一次全尺寸和可靠性实验',
            business_node: '车间报工 / OQC',
            trigger_condition: '报工数量达到 500 件',
            action_type: '警告拦截'
        },
        {
            key: '2',
            factory: '合肥工厂',
            customer: '大众汽车(VW)',
            scope: '通用约束',
            requirement: '质量记录（PPAP, FMEA，控制计划）需保存至少 15 年',
            business_node: 'APQP / 文档控制',
            trigger_condition: '系统新建质量记录建档',
            action_type: '超期预警'
        },
        {
            key: '3',
            factory: '全资子公司',
            customer: '宝马(BMW)',
            scope: '涉及所有代工件',
            requirement: '发生A类客诉时，24小时内提供D3(围堵措施)，48小时内提供D8(长期措施)',
            business_node: '不合格品处置 / 客诉',
            trigger_condition: '客诉单创建 (Level = A)',
            action_type: '超期预警'
        }
    ])

    const configForm = reactive({
        customerId: undefined,
        requirementId: undefined,
        businessNode: undefined,
        materialId: [],
        triggerCondition: '',
        actionType: undefined
    })

    const submitConfig = () => {
        message.success('映射保存成功，规则已注入 Action Engine')
        visibleConfig.value = false
    }
</script>

<style scoped>
    .process-mapping-matrix {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .header-actions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
    }
</style>