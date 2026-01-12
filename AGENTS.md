<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md - 质量管理系统 (QMS)

此文档为 S_QMS（汽车零配件质量管理系统）前端应用提供编码指南、构建命令和开发实践。

## 构建/代码检查/测试命令

### 开发
```bash
npm run dev          # 在 3000 端口启动开发服务器并自动打开浏览器
npm run build        # 使用 vue-tsc 进行类型检查并构建生产版本
npm run preview      # 本地预览生产构建结果
```

### 测试
**注意**：当前未配置测试框架。添加测试时：
- 使用 Vitest（推荐用于 Vite 项目）
- 测试文件应命名为 `*.test.ts` 或 `*.spec.ts`
- 将测试放在 `__tests__/` 目录中或与源文件同级

未来测试命令示例（待添加）：
```bash
npm run test         # 运行所有测试
npm run test:unit    # 仅运行单元测试
npm run test:e2e     # 运行端到端测试
npm run test -- ComponentName.test.ts  # 运行单个测试文件
```

### 代码检查和类型检查
**注意**：当前未配置代码检查工具。添加代码检查时：
- 使用支持 Vue 3 和 TypeScript 的 ESLint
- 使用 Prettier 进行代码格式化

未来代码检查命令示例（待添加）：
```bash
npm run lint         # 运行 ESLint
npm run lint:fix     # 自动修复 ESLint 问题
npm run format       # 使用 Prettier 格式化代码
npm run typecheck    # 运行 TypeScript 类型检查 (vue-tsc)
```

## 代码风格指南

### 语言和框架
- **Vue 3** 使用组合式 API（`<script setup lang="ts">`）
- **TypeScript** 启用严格模式
- **Ant Design Vue 4.2+** 用于 UI 组件
- **Pinia** 用于状态管理
- **Vue Router 4** 用于路由

### 项目结构
```
src/
├── views/           # 页面组件
│   ├── basic-data/  # 基础数据管理页面
│   ├── quality/     # 质量检验页面
│   ├── inspection-model/  # 检验模型页面
│   └── ...
├── stores/          # Pinia 状态存储
├── utils/           # 工具函数
├── router/          # 路由定义
├── layout/          # 布局组件
└── ...
```

### 导入约定
- 使用 `@/` 别名进行绝对导入（配置为指向 `src/`）
- 导入分组：Vue/Vue 生态系统优先，然后是 UI 库，最后是工具函数
- 使用命名导入而不是默认导入，以获得更好的树摇优化

```typescript
// 推荐
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Button, Form } from 'ant-design-vue'
import { formatDate, getStatusColor } from '@/utils'

// 避免
import Vue from 'vue'
import * as Antd from 'ant-design-vue'
```

### TypeScript 指南
- 使用严格 TypeScript（tsconfig.json 中 `"strict": true`）
- 为复杂数据结构定义接口
- 使用联合类型定义状态枚举
- 避免 `any` 类型 - 使用正确的类型定义

```typescript
// 推荐
export interface QualityRecord {
  id: string
  status: 'pending' | 'processing' | 'qualified' | 'unqualified'
  quantity: number
}

// 避免
export interface QualityRecord {
  id: any
  status: string
  quantity: any
}
```

### 组件命名
- 组件名称使用 PascalCase
- 使用描述性、领域特定的名称
- 优先使用英文名称，但中文注释可接受
- 文件名与组件名匹配

```vue
<!-- UnitManagement.vue -->
<template>
  <div class="unit-management">
    <!-- content -->
  </div>
</template>

<script setup lang="ts">
// 计量单位管理组件
</script>
```

### Vue 组合式 API 模式
- 使用 `<script setup lang="ts">` 语法
- 使用 `ref()` 或 `reactive()` 声明响应式变量
- 使用 `computed()` 处理派生状态
- 使用注释对相关逻辑进行分组

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 响应式数据
const searchForm = ref({
  unitCode: '',
  unitName: ''
})

// 计算属性
const filteredUnits = computed(() => {
  return units.value.filter(unit =>
    unit.code.includes(searchForm.value.unitCode)
  )
})

// 方法
const handleSearch = () => {
  // 搜索逻辑
}
</script>
```

### CSS/SCSS 样式
- 使用作用域样式（`<style scoped>`）
- 遵循 BEM 类似的命名约定
- 使用 CSS 变量实现一致的主题
- 优先使用工具类而不是内联样式

```vue
<style scoped>
.unit-management {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
}
</style>
```

### 错误处理
- 对异步操作使用 try-catch
- 提供中文用户友好的错误消息
- 适当记录错误
- 处理加载状态

```typescript
const handleSubmit = async () => {
  try {
    loading.value = true
    await submitForm()
    message.success('保存成功')
  } catch (error) {
    console.error('提交失败:', error)
    message.error('保存失败，请重试')
  } finally {
    loading.value = false
  }
}
```

### 状态管理 (Pinia)
- 在 `src/stores/` 中定义状态存储
- 使用描述性的存储名称
- 保持存储专注于特定领域

```typescript
// stores/quality.ts
import { defineStore } from 'pinia'

export const useQualityStore = defineStore('quality', () => {
  const records = ref<QualityRecord[]>([])

  const addRecord = (record: QualityRecord) => {
    records.value.push(record)
  }

  return {
    records,
    addRecord
  }
})
```

### 工具函数
- 放在 `src/utils/` 中
- 使用适当的 TypeScript 泛型
- 为复杂函数添加 JSDoc 注释

```typescript
// utils/index.ts
import dayjs from 'dayjs'

/**
 * 格式化日期
 * @param date - 日期对象或字符串
 * @param format - 格式化模板
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}
```

### 日期处理
- 使用 dayjs 库（已导入）
- 存储时优先使用 ISO 字符串格式
- UI 中一致地格式化日期

```typescript
// 推荐
const createdAt = formatDate(record.createdAt, 'YYYY-MM-DD')
const fullDateTime = formatDate(record.createdAt) // 默认格式
```

## UI/UX 指南

### 列表页面结构（来自 system_ui_rules.md）
1. **工具栏**：包含操作按钮（新增、编辑、查看、删除、导出、刷新）
2. **搜索表单**：紧凑的搜索条件表单
3. **数据表格**：优化行高以最大化数据可见性

### 表单页面结构
- **主要信息**：突出显示主要信息
- **次要信息**：复杂表单使用选项卡
- **状态显示**：在页面头部显示单据状态
- **导航**：使用"详情页式返回"模式返回

### Ant Design 使用
- 使用一致的组件变体
- 遵循 Ant Design 的设计令牌
- 用户面向内容使用中文文本
- 实现适当的加载和禁用状态

## 性能最佳实践

### Vue 优化
- 当不需要深度响应性时，对大对象使用 `shallowRef`
- 对大型列表实现虚拟滚动
- 对昂贵的计算使用 `computed`
- 使用适当的 key 避免不必要的重新渲染

### 包优化
- 使用动态导入进行基于路由的代码分割
- 延迟加载重量级组件
- 优化资源加载
- 监控包大小分析

## Git 工作流

### 提交消息
- 使用约定式提交格式
- 为技术清晰度使用英文编写
- 相关时包含范围

```
feat: add quality inspection workflow
fix: resolve date formatting issue in reports
docs: update API documentation
```

### 分支命名
- 使用功能分支：`feature/add-inspection-workflow`
- 使用错误修复分支：`fix/date-formatting-bug`
- 使用 kebab-case 以提高可读性

## 开发环境

- **Node.js**：18+（基于 TypeScript ES2020 目标）
- **IDE**：支持 Vue 3 的 VS Code + Volar 扩展
- **浏览器**：支持 ES2020 的现代浏览器
- **操作系统**：跨平台（Windows/Mac/Linux）

## 安全考虑

- 永远不要提交敏感数据（API 密钥、凭据）
- 使用环境变量进行配置
- 实现适当的输入验证
- 遵循 Vue 安全最佳实践
- 对表单中的用户输入进行清理

---

*随着项目的发展，新的工具和模式，此文档应及时更新。*