<template>
    <div class="compliance-dashboard">
        <!-- 统计卡片区域 -->
        <a-row :gutter="16">
            <a-col :span="6">
                <a-card :bordered="false" class="stat-card">
                    <a-statistic title="生效条款总数" :value="128" :value-style="{ color: '#1890ff' }">
                        <template #prefix>📋</template>
                    </a-statistic>
                </a-card>
            </a-col>
            <a-col :span="6">
                <a-card :bordered="false" class="stat-card">
                    <a-statistic title="条款覆盖率" :value="92.3" suffix="%" :value-style="{ color: '#52c41a' }">
                        <template #prefix>✅</template>
                    </a-statistic>
                </a-card>
            </a-col>
            <a-col :span="6">
                <a-card :bordered="false" class="stat-card">
                    <a-statistic title="任务按时完成率" :value="98.5" suffix="%" :value-style="{ color: '#faad14' }">
                        <template #prefix>⏱️</template>
                    </a-statistic>
                </a-card>
            </a-col>
            <a-col :span="6">
                <a-card :bordered="false" class="stat-card">
                    <a-statistic title="超期/告警风险项" :value="3" :value-style="{ color: '#ff4d4f' }">
                        <template #prefix>🚨</template>
                    </a-statistic>
                </a-card>
            </a-col>
        </a-row>

        <!-- 图表区域 -->
        <a-row :gutter="16" style="margin-top: 16px;">
            <a-col :span="16">
                <a-card title="CSR 达成率监控趋势" :bordered="false">
                    <v-chart class="chart" :option="trendOption" autoresize />
                </a-card>
            </a-col>
            <a-col :span="8">
                <a-card title="条款类型分布" :bordered="false">
                    <v-chart class="chart" :option="pieOption" autoresize />
                </a-card>
            </a-col>
        </a-row>

        <!-- 告警列表 -->
        <a-card title="当前风险告警项" :bordered="false" style="margin-top: 16px;">
            <a-table :columns="alertColumns" :data-source="alertData" :pagination="false" size="small" bordered>
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'level'">
                        <a-tag :color="record.level === '强控' ? 'red' : 'orange'">{{ record.level }}</a-tag>
                    </template>
                    <template v-if="column.dataIndex === 'status'">
                        <a-badge :status="record.status === '超期' ? 'error' : 'warning'" :text="record.status" />
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup lang="ts">
    import { use } from 'echarts/core'
    import { CanvasRenderer } from 'echarts/renderers'
    import { LineChart, PieChart, BarChart } from 'echarts/charts'
    import {
        TitleComponent,
        TooltipComponent,
        LegendComponent,
        GridComponent
    } from 'echarts/components'
    import VChart from 'vue-echarts'
    import { ref } from 'vue'

    // NOTE: 注册 ECharts 所需的组件，避免全量引入
    use([
        CanvasRenderer,
        LineChart,
        PieChart,
        BarChart,
        TitleComponent,
        TooltipComponent,
        LegendComponent,
        GridComponent
    ])

    // --- 折线图：达成率趋势 ---
    const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']

    const trendOption = ref({
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['条款覆盖率', '任务按时完成率', '外审发现点']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: months
        },
        yAxis: [
            {
                type: 'value',
                name: '百分比(%)',
                min: 80,
                max: 100
            },
            {
                type: 'value',
                name: '发现点(个)',
                min: 0,
                max: 10
            }
        ],
        series: [
            {
                name: '条款覆盖率',
                type: 'line',
                smooth: true,
                data: [88.5, 90.1, 91.2, 92.0, 92.3, 92.3],
                itemStyle: { color: '#52c41a' },
                areaStyle: { color: 'rgba(82, 196, 26, 0.15)' }
            },
            {
                name: '任务按时完成率',
                type: 'line',
                smooth: true,
                data: [95.0, 96.5, 97.2, 98.0, 98.5, 98.5],
                itemStyle: { color: '#1890ff' },
                areaStyle: { color: 'rgba(24, 144, 255, 0.15)' }
            },
            {
                name: '外审发现点',
                type: 'bar',
                yAxisIndex: 1,
                data: [5, 3, 4, 2, 1, 3],
                itemStyle: { color: '#faad14' }
            }
        ]
    })

    // --- 饼图：条款类型分布 ---
    const pieOption = ref({
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'middle'
        },
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['60%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}\n{d}%'
                },
                data: [
                    { value: 42, name: '体系要求', itemStyle: { color: '#1890ff' } },
                    { value: 56, name: '过程要求', itemStyle: { color: '#52c41a' } },
                    { value: 30, name: '交付要求', itemStyle: { color: '#faad14' } }
                ]
            }
        ]
    })

    // --- 告警表格 ---
    const alertColumns = [
        { title: '客户', dataIndex: 'customer', width: 120 },
        { title: '条款描述', dataIndex: 'description' },
        { title: '严格度', dataIndex: 'level', width: 80 },
        { title: '触发条件', dataIndex: 'trigger', width: 180 },
        { title: '状态', dataIndex: 'status', width: 100 },
        { title: '剩余时间', dataIndex: 'remaining', width: 100 }
    ]

    const alertData = ref([
        {
            key: '1',
            customer: '宝马(BMW)',
            description: 'A类客诉 24h 内回复 D3 围堵描述',
            level: '强控',
            trigger: '客诉单 #CS-20260225-001',
            status: '超期',
            remaining: '已超 2h'
        },
        {
            key: '2',
            customer: '特斯拉(Tesla)',
            description: '每 500 件可靠性实验',
            level: '强控',
            trigger: '产线A 累积报工 498 件',
            status: '即将触发',
            remaining: '约 2 件'
        },
        {
            key: '3',
            customer: '大众汽车(VW)',
            description: 'VDA 6.3 年度过程审核',
            level: '重要',
            trigger: '年度计划 2026-03-15',
            status: '即将到期',
            remaining: '17 天'
        }
    ])
</script>

<style scoped>
    .compliance-dashboard {
        background-color: #f0f2f5;
        padding: 16px;
    }

    .stat-card {
        text-align: center;
    }

    .chart {
        height: 320px;
    }
</style>