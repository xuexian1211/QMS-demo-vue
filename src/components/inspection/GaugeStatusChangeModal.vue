<template>
    <a-modal :visible="visible" title="状态变更" @ok="handleOk" @cancel="handleCancel"
        @update:visible="val => emit('update:visible', val)">
        <a-form layout="vertical" :model="form">
            <a-form-item label="当前状态">
                <a-tag :color="getStatusColor(currentStatus)">{{ getStatusText(currentStatus) }}</a-tag>
            </a-form-item>
            <a-form-item label="变更为" required>
                <a-select v-model:value="form.toStatus">
                    <a-select-option v-for="s in availableStatuses" :key="s" :value="s">
                        {{ getStatusText(s) }}
                    </a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="变更原因" required>
                <a-textarea v-model:value="form.reason" :rows="3" placeholder="请输入状态变更原因" />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup lang="ts">
    import { ref, watch, computed } from 'vue'
    import type { GaugeStatus } from '@/types'

    const props = defineProps < {
        visible: boolean
  currentStatus: GaugeStatus
    } > ()

    const emit = defineEmits(['update:visible', 'submit'])

    const form = ref({
        toStatus: '' as GaugeStatus | '',
        reason: ''
    })

    const statusTransitions: Record<GaugeStatus, GaugeStatus[]> = {
        'IN_USE': ['CALIBRATING', 'SEALED', 'SCRAPPED'],
        'CALIBRATING': ['IN_USE', 'SEALED', 'SCRAPPED'],
        'SEALED': ['IN_USE', 'SCRAPPED'],
        'SCRAPPED': []
    }

    const availableStatuses = computed(() => {
        return statusTransitions[props.currentStatus] || []
    })

    watch(() => props.visible, (newVal) => {
        if (newVal) {
            form.value = {
                toStatus: availableStatuses.value[0] || '',
                reason: ''
            }
        }
    })

    const handleOk = () => {
        if (!form.value.toStatus || !form.value.reason) {
            return
        }
        emit('submit', { ...form.value })
    }

    const handleCancel = () => {
        emit('update:visible', false)
    }

    const getStatusColor = (status: GaugeStatus) => {
        switch (status) {
            case 'IN_USE': return 'green'
            case 'CALIBRATING': return 'orange'
            case 'SEALED': return 'gray'
            case 'SCRAPPED': return 'red'
            default: return 'default'
        }
    }

    const getStatusText = (status: GaugeStatus) => {
        switch (status) {
            case 'IN_USE': return '在用'
            case 'CALIBRATING': return '校准中'
            case 'SEALED': return '封存'
            case 'SCRAPPED': return '报废'
            default: return status
        }
    }
</script>