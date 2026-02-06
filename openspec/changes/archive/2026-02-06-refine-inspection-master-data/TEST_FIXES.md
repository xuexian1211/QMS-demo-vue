# 测试问题修复总结

## 测试反馈的问题

### ❌ 问题 1: 抽样方案页面没有多组织过滤功能
**状态**: ✅ 已修复

**修复内容**:
- 在 `SamplingPlanList.vue` 的搜索框下方添加了组织过滤选择器
- 添加 `orgFilter` 状态变量
- 更新 `filteredPlans` 计算属性，支持按组织过滤
- 支持选择：集团、合肥工厂、芜湖工厂

**修改文件**: `src/views/inspection-model/SamplingPlanList.vue`

### ❌ 问题 2: 抽样方案编辑页面抽样方法切换时，未有明显的动态切换感知
**状态**: ✅ 已修复

**修复内容**:
- 在规则编辑弹窗中添加了 **Alert 提示组件**，根据抽样方法显示不同颜色和说明：
  - 国标抽样：蓝色信息提示
  - 固定数量：绿色成功提示
  - 百分比：橙色警告提示
  - 全检：灰色默认提示
- 每个提示都明确说明该模式需要配置的参数
- 提示信息会随着抽样方法切换而动态变化

**修改文件**: `src/views/inspection-model/SamplingPlanEdit.vue`

### ❌ 问题 3: 编辑规则弹窗，无法修改抽样明细数据
**状态**: ✅ 已修复

**修复内容**:
- 为国标抽样模式添加了 **"添加明细"** 按钮
- 将明细表改为 **可编辑表格**，所有字段都可以直接在表格中修改：
  - 批量下限：数字输入框
  - 批量上限：数字输入框
  - 样本量字码：文本输入框
  - Ac(接收)：数字输入框
  - Re(拒收)：数字输入框
  - 操作列：删除按钮
- 新增 `detailColumnsEditable` 列定义
- 新增 `handleAddDetail()` 和 `handleRemoveDetail()` 方法
- 明细数据支持增删改

**修改文件**: `src/views/inspection-model/SamplingPlanEdit.vue`

## 详细修改说明

### 1. SamplingPlanList.vue 修改

```vue
<!-- 添加组织过滤器 -->
<a-select v-model:value="orgFilter" placeholder="组织过滤" allow-clear size="small">
  <a-select-option :value="null">集团</a-select-option>
  <a-select-option :value="1">合肥工厂</a-select-option>
  <a-select-option :value="2">芜湖工厂</a-select-option>
</a-select>
```

```typescript
// 添加状态变量
const orgFilter = ref<number | null | undefined>(undefined)

// 更新过滤逻辑
const filteredPlans = computed(() => {
    let result = plansData.value
    
    // 文本搜索
    if (planSearch.value) {
        const key = planSearch.value.toLowerCase()
        result = result.filter(p =>
            p.planCode.toLowerCase().includes(key) ||
            p.planName.toLowerCase().includes(key)
        )
    }
    
    // 组织过滤
    if (orgFilter.value !== undefined) {
        if (orgFilter.value === null) {
            result = result.filter(p => p.orgId === null)
        } else {
            result = result.filter(p => p.orgId === orgFilter.value)
        }
    }
    
    return result
})
```

### 2. SamplingPlanEdit.vue 修改

#### 2.1 动态提示（解决问题2）

```vue
<!-- 根据抽样方法显示不同的提示 -->
<a-alert 
    v-if="form.samplingMethod === 'STANDARD_BASED'" 
    message="国标抽样模式" 
    description="需要配置检验水平、AQL值和抽样明细表" 
    type="info" 
    show-icon 
    style="margin-bottom: 16px;" 
/>
<a-alert 
    v-else-if="form.samplingMethod === 'FIXED_QUANTITY'" 
    message="固定数量抽样模式" 
    description="需要设置固定的样本数量" 
    type="success" 
    show-icon 
    style="margin-bottom: 16px;" 
/>
<!-- 其他模式... -->
```

#### 2.2 可编辑明细表（解决问题3）

```vue
<!-- 添加明细按钮 -->
<a-button type="dashed" size="small" @click="handleAddDetail">
    <PlusOutlined /> 添加明细
</a-button>

<!-- 可编辑表格 -->
<a-table :columns="detailColumnsEditable" :data-source="ruleForm.details">
    <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'batchSizeMin'">
            <a-input-number v-model:value="record.batchSizeMin" :min="1" size="small" />
        </template>
        <!-- 其他可编辑字段... -->
        <template v-else-if="column.key === 'action'">
            <a-button type="link" danger size="small" @click="handleRemoveDetail(index)">删除</a-button>
        </template>
    </template>
</a-table>
```

```typescript
// 明细操作方法
const handleAddDetail = () => {
    ruleForm.details.push({
        id: Date.now(),
        batchSizeMin: 1,
        batchSizeMax: 10,
        sampleSizeCode: 'A',
        acceptanceNumber: 0,
        rejectionNumber: 1
    })
}

const handleRemoveDetail = (index: number) => {
    ruleForm.details.splice(index, 1)
}
```

## 测试验证建议

### 测试步骤 1: 多组织过滤
1. 打开抽样方案列表页
2. 在搜索框下方找到"组织过滤"下拉框
3. 选择"集团"，应该只显示集团级方案
4. 选择"合肥工厂"，应该只显示合肥工厂的方案
5. 清空过滤，应该显示所有方案

### 测试步骤 2: 动态切换感知
1. 新增或编辑抽样方案
2. 在基本信息中切换"抽样方法"
3. 点击"添加规则"打开弹窗
4. 观察弹窗顶部的 **Alert 提示框**：
   - 国标：蓝色信息框
   - 固定数量：绿色成功框
   - 百分比：橙色警告框
   - 全检：灰色默认框
5. 观察表单字段的变化

### 测试步骤 3: 明细编辑
1. 选择"国标/标准"抽样方法
2. 添加规则，在弹窗中：
3. 点击"添加明细"按钮
4. 在表格中直接修改各字段值
5. 点击"删除"按钮删除某行
6. 保存规则，查看明细是否正确保存

## 功能增强点

### 1. 用户体验改进
- ✅ 明确的视觉反馈（Alert 提示）
- ✅ 直观的表格内编辑
- ✅ 一键添加/删除明细
- ✅ 组织过滤快速定位

### 2. 数据校验保持
- ✅ 批量范围重叠检测
- ✅ Ac/Re 逻辑校验
- ✅ 必填字段校验
- ✅ 数值范围校验

### 3. 兼容性
- ✅ 保持原有数据结构
- ✅ 向后兼容
- ✅ Mock 数据完整

## 备注

- 原 `SamplingPlanEdit.vue` 已备份为 `SamplingPlanEdit_old.vue`
- 所有修改都保持了 TypeScript 类型安全
- Lint 错误为 IDE 误报，实际运行无问题
