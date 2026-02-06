<template>
    <a-modal :visible="visible" title="新增校准记录" width="600px" @ok="handleOk" @cancel="handleCancel"
        @update:visible="val => emit('update:visible', val)">
        <a-form layout="vertical" :model="form">
            <a-row :gutter="16">
                <a-col :span="12">
                    <a-form-item label="校准类型" required>
                        <a-radio-group v-model:value="form.calibrationType">
                            <a-radio value="INTERNAL">内部校准</a-radio>
                            <a-radio value="EXTERNAL">外部校准</a-radio>
                        </a-radio-group>
                    </a-form-item>
                </a-col>
                <a-col :span="12">
                    <a-form-item label="校准日期" required>
                        <a-date-picker v-model:value="form.calibrationDate" style="width: 100%" />
                    </a-form-item>
                </a-col>
            </a-row>
            <a-row :gutter="16">
                <a-col :span="12">
                    <a-form-item label="校准结果" required>
                        <a-select v-model:value="form.result">
                            <a-select-option value="PASS">合格</a-select-option>
                            <a-select-option value="FAIL">不合格</a-select-option>
                            <a-select-option value="CONDITIONAL">有条件合格</a-select-option>
                        </a-select>
                    </a-form-item>
                </a-col>
                <a-col :span="12">
                    <a-form-item label="校准机构">
                        <a-input v-model:value="form.calibrationOrg" placeholder="请输入校准机构" />
                    </a-form-item>
                </a-col>
            </a-row>
            <a-row :gutter="16">
                <a-col :span="12">
                    <a-form-item label="校准人员">
                        <a-input v-model:value="form.calibrator" placeholder="请输入校准人员" />
                    </a-form-item>
                </a-col>
                <a-col :span="12">
                    <a-form-item label="证书编号">
                        <a-input v-model:value="form.certificateNo" placeholder="请输入证书编号" />
                    </a-form-item>
                </a-col>
            </a-row>
            <a-form-item label="结论/备注">
                <a-textarea v-model:value="form.conclusion" :rows="2" placeholder="请输入校准结论或备注" />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue'
    import dayjs from 'dayjs'
    import type { CalibrationType, CalibrationResult } from '@/types'

    const props = defineProps < {
        visible: boolean
    } > ()

    const emit = defineEmits(['update:visible', 'submit'])

    const form = ref({
        calibrationType: 'INTERNAL' as CalibrationType,
        calibrationDate: dayjs() as any,
        result: 'PASS' as CalibrationResult,
        calibrationOrg: '',
        calibrator: '',
        certificateNo: '',
        conclusion: ''
    })

    watch(() => props.visible, (newVal) => {
        if (newVal) {
            // Reset form when opening
            form.value = {
                calibrationType: 'INTERNAL',
                calibrationDate: dayjs(),
                result: 'PASS',
                calibrationOrg: '',
                calibrator: '',
                certificateNo: '',
                conclusion: ''
            }
        }
    })

    const handleOk = () => {
        if (!form.value.calibrationDate) {
            return
        }
        emit('submit', { ...form.value })
    }

    const handleCancel = () => {
        emit('update:visible', false)
    }
</script>