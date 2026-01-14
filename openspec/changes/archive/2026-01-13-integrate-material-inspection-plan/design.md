# 设计文档: 物料-工艺路线-检验方案集成

## 架构概述

本设计采用前端抽屉/弹窗组件模式，从物料档案作为统一入口，提供完整的检验配置能力。

## 组件架构

```
MaterialProduct.vue (物料档案页面)
    │
    ├── MaterialRouteDrawer.vue        [新增] 工艺路线关联抽屉
    │       └── 展示关联的工艺路线列表
    │
    ├── MaterialInspPlanDrawer.vue     [新增] 检验方案配置抽屉
    │       ├── props.inspType = 'IQC' | 'FQC' | 'OQC'
    │       └── 管理物料级检验方案绑定
    │
    └── MaterialSpecDrawer.vue         [已有] 检验规格抽屉
            └── 管理物料检验规格

ProcessRoute.vue (工艺路线页面)
    │
    └── OperationInspConfigModal.vue   [新增] 工序检验配置弹窗
            └── 管理工序级检验方案绑定
```

## 界面设计

### 1. 物料档案表格列

| 列名 | 说明 |
|------|------|
| 物料编码 | - |
| 物料名称 | - |
| 规格型号 | - |
| 分类 | - |
| 单位 | - |
| 工艺路线数 | **新增** 显示数量，可点击 |
| 操作 | 检验配置(下拉)、编辑、删除 |

### 2. 检验配置下拉菜单

```
┌──────────────┐
│ 检验配置  ▼  │
├──────────────┤
│ 📋 IQC方案   │  → 打开IQC配置抽屉
│ 📋 FQC方案   │  → 打开FQC配置抽屉
│ 📋 OQC方案   │  → 打开OQC配置抽屉
│ ─────────── │
│ 📏 检验规格  │  → 打开检验规格抽屉
└──────────────┘
```

### 3. 物料检验方案配置抽屉

```
┌─────────────────────────────────────────────┐
│ IQC检验方案 - M001 铝锭                    X │
├─────────────────────────────────────────────┤
│ [+ 新增绑定]                                │
├─────────────────────────────────────────────┤
│ 方案编码   方案名称           优先级  默认  │
│ IQC-001   来料检验方案V1.0    1      ★     │
│ IQC-002   来料加严检验方案    2      　    │
├─────────────────────────────────────────────┤
│                                    [关闭]   │
└─────────────────────────────────────────────┘
```

### 4. 工序检验配置弹窗

```
┌─────────────────────────────────────────────────────────┐
│ 工序检验配置 - 工序10: 压铸                            X │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 首检方案                              [+ 新增]     │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ IPQC-首检-001  压铸首件检验方案      [编辑][删除]│ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 巡检方案                              [+ 新增]     │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ IPQC-巡检-001  压铸巡检方案  每2小时  [编辑][删除]│ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 末检方案                              [+ 新增]     │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ (暂无配置)                                      │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                          [确定] [取消]  │
└─────────────────────────────────────────────────────────┘
```

### 5. 工艺路线工序表格

| 序号 | 工序名称 | 工作中心 | 检验配置 | 工序描述 |
|------|----------|----------|----------|----------|
| 10 | 压铸 | WC-01 | 🔵首检 🟢巡检 | 高压压铸 |
| 20 | 去毛刺 | WC-02 | - | 人工去毛刺 |
| 30 | 抛光 | WC-03 | 🟢巡检 🟡末检 | 表面抛光 |

## 数据流设计

### 物料-工艺路线关联查询

```
MaterialProduct.vue
    │ props: materialId
    ▼
MaterialRouteDrawer.vue
    │ 查询条件: where material = :materialId
    ▼
ProcessRoute[] (工艺路线列表)
```

### 物料-检验方案绑定

```
MaterialProduct.vue
    │ props: { materialId, inspType }
    ▼
MaterialInspPlanDrawer.vue
    │ 查询条件: where materialId = :materialId AND inspType = :inspType
    ▼
MaterialInspPlanBinding[] (绑定列表)
    │ 关联查询
    ▼
InspPlan[] (检验方案详情)
```

### 工序-检验方案绑定

```
ProcessRoute.vue
    │ props: { routeId, operationId }
    ▼
OperationInspConfigModal.vue
    │ 查询条件: where routeId = :routeId AND operationId = :operationId
    ▼
OperationInspPlanBinding[] (绑定列表，按inspType分组)
```

## 关键实现点

### 1. 物料下拉选择器

工艺路线中物料字段改为Select组件：

```vue
<a-select
  v-model:value="formState.materialId"
  show-search
  :filter-option="false"
  @search="handleMaterialSearch"
  placeholder="输入物料编码或名称搜索"
>
  <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">
    {{ m.code }} - {{ m.name }}
  </a-select-option>
</a-select>
```

### 2. 检验配置下拉菜单

```vue
<a-dropdown>
  <a-button type="link" size="small">检验配置 <DownOutlined /></a-button>
  <template #overlay>
    <a-menu @click="handleInspConfigClick">
      <a-menu-item key="IQC">IQC方案</a-menu-item>
      <a-menu-item key="FQC">FQC方案</a-menu-item>
      <a-menu-item key="OQC">OQC方案</a-menu-item>
      <a-menu-divider />
      <a-menu-item key="spec">检验规格</a-menu-item>
    </a-menu>
  </template>
</a-dropdown>
```

### 3. 工序检验状态图标

```vue
<template v-if="column.key === 'inspConfig'">
  <a-space>
    <a-tag v-if="hasFirstInsp(record)" color="blue">首检</a-tag>
    <a-tag v-if="hasPatrolInsp(record)" color="green">巡检</a-tag>
    <a-tag v-if="hasFinalInsp(record)" color="orange">末检</a-tag>
    <a-button type="link" size="small" @click="openInspConfig(record)">配置</a-button>
  </a-space>
</template>
```

## 依赖关系

```
阶段1 (物料-工艺路线)
    │
    ├── 任务1.1 物料表格增强
    │
    ├── 任务1.2 工艺路线抽屉 ──依赖──> 任务1.1
    │
    └── 任务1.3 物料选择器

阶段2 (物料级检验)        阶段3 (工序级检验)
    │                          │
    └──> 可并行实施 <──────────┘
                │
                ▼
           阶段4 联调
```

## 测试要点

1. **物料关联**
   - 新建工艺路线选择物料
   - 物料档案显示正确的工艺路线数
   - 工艺路线抽屉内容正确

2. **检验方案配置**
   - 各类型检验方案抽屉独立工作
   - 绑定关系CRUD正常
   - 优先级和默认方案逻辑正确

3. **工序检验配置**
   - 三种检验类型独立配置
   - 频次配置保存正确
   - 工序表格图标显示正确
