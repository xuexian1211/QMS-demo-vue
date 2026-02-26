# 设计：检验项目基础标准

## 架构
检验项目在 QMS 层级中属于“基础标准库”(L1)。

### 多组织继承矩阵
| orgId | 作用域 | 编辑权限 |
|-------|-------|----------|
| NULL  | 集团 | 集团管理员 |
| 1     | 工厂 1 | 工厂 1 管理员 |

**逻辑**：
- `GET /api/md/insp-items`: 返回 `orgId IS NULL OR orgId = current_org`。
- `POST /api/md/insp-items`: 将 `orgId` 设置为当前用户的工厂 ID。集团项目只能由集团管理员创建。
- 工厂用户对集团项目具有“只读”权限，但可以在工厂级检验模板中引用它们。

### 数据架构 (QM_MD_InspItem)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| orgId | Long | NULL 为集团，ID 为工厂 |
| code | String | 组织内唯一编码 |
| name | String | 显示名称 |
| category | Enum | 尺寸, 外观, 理化, 功能 |
| dataType | Enum | QUANTITATIVE (计量), QUALITATIVE (计数) |
| defaultMethodId | Long | 外键 -> QM_MD_InspMethod |
| defaultInstTypeId | Long | 外键 -> QM_MD_MeasureType |
| isLabTestDefault | Boolean | 默认是否送检实验室 |
| isSpcDefault | Boolean | 默认是否启用 SPC 监控 |
| status | Enum | ENABLED (启用), DISABLED (禁用) |

### UI/UX 规则
- **列表页**：增加“所属组织”列（显示“集团”或“本地”）。
- **编辑页**：
  - 如果项目属于集团且用户是工厂管理员：字段将设为只读。
  - 如果用户是集团管理员：可以编辑所有字段。
  - 根据 `dataType` 动态显示字段：`unit`（单位）仅在“计量型”时必填。

### 集成：项目-不良映射 (1.7.1)
虽然需求 1.7.1 提到了 `planDetailId`（模板层级），但在 `QM_MD_InspItem` 层级建立“默认不良现象”列表将非常有益。
- `QM_MD_InspItemDefectDefault`: 关联 `item_id` 到 `defect_id` 的中间表。
- 当将项目添加到“检验模板明细”时，这些默认配置将被复制，但允许在模板层级进行覆盖。
