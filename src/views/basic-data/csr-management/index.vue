<template>
    <div class="csr-management">
        <a-card title="顾客特殊要求(CSR)与管控引擎">
            <a-tabs v-model:activeKey="activeKey">
                <a-tab-pane key="requirement-repository" tab="CSR 条款维护空间">
                    <RequirementRepository />
                </a-tab-pane>
                <a-tab-pane key="process-mapping-matrix" tab="业务流程映射矩阵">
                    <ProcessMappingMatrix />
                </a-tab-pane>
                <a-tab-pane key="compliance-dashboard" tab="合规性监控看板">
                    <ComplianceDashboard />
                </a-tab-pane>
            </a-tabs>
        </a-card>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import RequirementRepository from './components/RequirementRepository.vue'
    import ProcessMappingMatrix from './components/ProcessMappingMatrix.vue'
    import ComplianceDashboard from './components/ComplianceDashboard.vue'

    const activeKey = ref('requirement-repository')
</script>

<style scoped>
    .csr-management {
        padding: 24px;
    }
</style>