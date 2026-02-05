# 技术设计文档

## 1. 架构设计

### 1.1 整体架构扩展

```
┌─────────────────────────────────────────────────────────────────┐
│                    前端 Vue 3 应用（扩展）                         │
├─────────────────────────────────────────────────────────────────┤
│  FMEA 关联     │   升级流程      │   智能推荐     │   5M1E       │
│  - 选择器      │   - 配置        │   - 推荐引擎   │   - 测量类别 │
│  - RPN 显示    │   - 自动触发    │   - 推荐面板   │              │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│              API 服务层（扩展）                                    │
│  - fmeaApi.ts                                                   │
│  - escalateFlowService.ts                                       │
│  - recommendationEngine.ts                                      │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  数据库层（扩展）                                  │
│  - QM_MD_CauseFmeaMapping (新增)                                │
│  - QM_MD_DefectPhenomenon (扩展)                                │
│  - QM_MD_DefectCause (扩展)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 推荐引擎架构

```
┌─────────────────────────────────────────────────┐
│           推荐引擎 (RecommendationEngine)         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 历史关联评分  │  │ 高频原因评分  │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                     │
│         ▼                 ▼                     │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 工序相似评分  │  │ 时间衰减评分  │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                     │
│         └────────┬────────┘                     │
│                  ▼                              │
│         ┌─────────────────┐                     │
│         │   综合评分排序   │                     │
│         └────────┬────────┘                     │
│                  ▼                              │
│         ┌─────────────────┐                     │
│         │  推荐理由生成    │                     │
│         └────────┬────────┘                     │
│                  ▼                              │
│         ┌─────────────────┐                     │
│         │   返回推荐列表   │                     │
│         └─────────────────┘                     │
└─────────────────────────────────────────────────┘
```

## 2. 数据模型设计

### 2.1 FMEA 关联表

```typescript
interface CauseFmeaMapping {
  id: number
  orgId: number
  causeId: number
  fmeaFailureModeId: string  // FMEA 失效模式 ID
  fmeaType?: 'PFMEA' | 'DFMEA'  // FMEA 类型
  rpn?: number  // 风险顺序数
  createTime?: string
  creator?: string
}
```

**数据库表结构**:

```sql
CREATE TABLE QM_MD_CauseFmeaMapping (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  orgId BIGINT NOT NULL,
  causeId BIGINT NOT NULL,
  fmeaFailureModeId VARCHAR(100) NOT NULL,
  fmeaType VARCHAR(20),
  rpn INT,
  createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  creator VARCHAR(50),
  FOREIGN KEY (causeId) REFERENCES QM_MD_DefectCause(id) ON DELETE CASCADE,
  UNIQUE KEY uk_org_cause_fmea (orgId, causeId, fmeaFailureModeId)
);
```

### 2.2 不良现象扩展（升级流程）

```typescript
interface DefectPhenomenon {
  // ... 现有字段（来自提案一）
  autoEscalate?: boolean  // 是否自动升级
  escalateType?: '8D' | 'QRQC' | 'NCR'  // 升级流程类型
  escalateCondition?: string  // 升级条件
}
```

**数据库扩展**:

```sql
ALTER TABLE QM_MD_DefectPhenomenon 
ADD COLUMN autoEscalate BOOLEAN DEFAULT FALSE,
ADD COLUMN escalateType VARCHAR(20),
ADD COLUMN escalateCondition VARCHAR(200);
```

### 2.3 不良原因扩展（5M1E）

```typescript
type CauseCategory = 
  | 'Man' 
  | 'Machine' 
  | 'Material' 
  | 'Method' 
  | 'Environment' 
  | 'Measurement'  // ✨ 新增
```

## 3. 核心算法设计

### 3.1 智能推荐算法

#### 算法流程

```
输入：phenomenonId, context (工序、物料等)
  ↓
1. 获取历史关联数据
  ↓
2. 计算各维度评分
   - 历史关联权重评分
   - 高频原因评分
   - 工序相似度评分
   - 时间衰减评分
  ↓
3. 综合评分 = Σ(维度评分 × 权重)
  ↓
4. 排序并取 Top N
  ↓
5. 生成推荐理由
  ↓
输出：推荐原因列表
```

#### 评分算法实现

```typescript
class RecommendationEngine {
  /**
   * 推荐原因
   */
  async recommend(context: RecommendContext): Promise<RecommendedCause[]> {
    const { phenomenonId, processType, recentDays = 30, limit = 5 } = context

    // 1. 获取各维度评分
    const scores = {
      historical: await this.getHistoricalScores(phenomenonId),
      highFreq: await this.getHighFrequencyScores(),
      process: processType ? await this.getProcessScores(processType) : {},
      recent: await this.getRecentScores(recentDays)
    }

    // 2. 综合评分
    const allCauses = this.mergeScores(scores, {
      historical: 0.4,  // 历史关联权重 40%
      highFreq: 0.3,    // 高频原因权重 30%
      process: 0.2,     // 工序相似权重 20%
      recent: 0.1       // 时间衰减权重 10%
    })

    // 3. 排序并生成推荐理由
    return allCauses
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(cause => ({
        ...cause,
        reason: this.generateReason(cause)
      }))
  }

  /**
   * 历史关联评分
   */
  private async getHistoricalScores(phenomenonId: number) {
    const mappings = await this.fetchPhenomenonCauseMappings(phenomenonId)
    return mappings.reduce((acc, m) => {
      acc[m.causeId] = {
        causeId: m.causeId,
        score: m.weight * 10,  // 权重 1-10 转换为评分 10-100
        sources: ['历史关联']
      }
      return acc
    }, {} as Record<number, any>)
  }

  /**
   * 高频原因评分
   */
  private async getHighFrequencyScores() {
    const causes = await this.fetchHighFrequencyCauses()
    return causes.reduce((acc, c) => {
      acc[c.id] = {
        causeId: c.id,
        score: 50,  // 高频原因固定加 50 分
        sources: ['高频原因']
      }
      return acc
    }, {} as Record<number, any>)
  }

  /**
   * 工序相似度评分
   */
  private async getProcessScores(processType: string) {
    const causes = await this.fetchCausesByProcess(processType)
    return causes.reduce((acc, c) => {
      acc[c.id] = {
        causeId: c.id,
        score: 30,  // 工序相似加 30 分
        sources: ['工序相似']
      }
      return acc
    }, {} as Record<number, any>)
  }

  /**
   * 时间衰减评分
   */
  private async getRecentScores(recentDays: number) {
    const recentMappings = await this.fetchRecentMappings(recentDays)
    return recentMappings.reduce((acc, m) => {
      // 时间衰减：越近的数据权重越高
      const daysPassed = this.getDaysPassed(m.createTime)
      const decayFactor = Math.max(0, 1 - daysPassed / recentDays)
      acc[m.causeId] = {
        causeId: m.causeId,
        score: 20 * decayFactor,  // 最高 20 分
        sources: ['近期高发']
      }
      return acc
    }, {} as Record<number, any>)
  }

  /**
   * 合并评分
   */
  private mergeScores(
    scores: Record<string, Record<number, any>>,
    weights: Record<string, number>
  ) {
    const merged: Record<number, any> = {}
    
    Object.entries(scores).forEach(([dimension, causeScores]) => {
      Object.entries(causeScores).forEach(([causeId, data]) => {
        if (!merged[causeId]) {
          merged[causeId] = { 
            causeId: Number(causeId), 
            score: 0, 
            sources: [] 
          }
        }
        merged[causeId].score += data.score * weights[dimension]
        merged[causeId].sources.push(...data.sources)
      })
    })

    return Object.values(merged)
  }

  /**
   * 生成推荐理由
   */
  private generateReason(cause: any): string {
    const reasons = []
    
    if (cause.sources.includes('历史关联')) {
      reasons.push('历史数据显示高度相关')
    }
    if (cause.sources.includes('高频原因')) {
      reasons.push('标记为高频原因')
    }
    if (cause.sources.includes('工序相似')) {
      reasons.push('相似工序常见原因')
    }
    if (cause.sources.includes('近期高发')) {
      reasons.push('近期频繁出现')
    }

    return reasons.join('，') || '综合评分推荐'
  }
}
```

**时间复杂度**: O(n log n)（主要是排序）

### 3.2 升级流程触发算法

```typescript
/**
 * 检验结果录入时触发升级流程
 */
function onInspectionResultSubmit(result: InspectionResult) {
  // 1. 检查是否有 CR 级不良
  const crDefects = result.defects.filter(d => d.severity === 'CR')
  
  if (crDefects.length === 0) return
  
  // 2. 检查是否需要自动升级
  for (const defect of crDefects) {
    const phenomenon = getPhenomenon(defect.phenomenonId)
    
    if (phenomenon.autoEscalate) {
      // 3. 检查升级条件
      if (shouldEscalate(phenomenon, defect)) {
        // 4. 创建升级任务
        const task = createEscalateTask({
          type: phenomenon.escalateType,
          phenomenonId: phenomenon.id,
          defectId: defect.id,
          inspectionId: result.id
        })
        
        // 5. 发送通知
        notifyStakeholders(task)
      }
    }
  }
}

/**
 * 判断是否满足升级条件
 */
function shouldEscalate(
  phenomenon: DefectPhenomenon, 
  defect: Defect
): boolean {
  const condition = phenomenon.escalateCondition
  
  if (!condition || condition === '立即升级') {
    return true
  }
  
  // 解析条件（如"连续3次出现"）
  const match = condition.match(/连续(\d+)次/)
  if (match) {
    const requiredCount = parseInt(match[1])
    const recentCount = getRecentDefectCount(phenomenon.id, 7) // 7天内
    return recentCount >= requiredCount
  }
  
  return true
}
```

### 3.3 FMEA 双向追溯

```typescript
/**
 * QMS → FMEA 追溯
 */
async function getFmeaByDefectCause(causeId: number) {
  const mappings = await db.query(`
    SELECT m.*, f.failureMode, f.severity, f.occurrence, f.detection
    FROM QM_MD_CauseFmeaMapping m
    LEFT JOIN FMEA_FailureMode f ON m.fmeaFailureModeId = f.id
    WHERE m.causeId = ?
  `, [causeId])
  
  return mappings
}

/**
 * FMEA → QMS 追溯
 */
async function getDefectCausesByFmea(fmeaId: string) {
  const mappings = await db.query(`
    SELECT m.*, c.code, c.name, c.category
    FROM QM_MD_CauseFmeaMapping m
    LEFT JOIN QM_MD_DefectCause c ON m.causeId = c.id
    WHERE m.fmeaFailureModeId = ?
  `, [fmeaId])
  
  return mappings
}
```

## 4. 前端组件设计

### 4.1 FMEA 选择器组件

```vue
<!-- FmeaSelector.vue -->
<template>
  <a-modal 
    v-model:visible="visible" 
    title="选择 FMEA 失效模式" 
    width="900px"
    @ok="handleConfirm"
  >
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchForm">
      <a-form-item label="FMEA 类型">
        <a-select v-model:value="searchForm.fmeaType" style="width: 120px">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="PFMEA">PFMEA</a-select-option>
          <a-select-option value="DFMEA">DFMEA</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="失效模式">
        <a-input v-model:value="searchForm.keyword" placeholder="搜索" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="handleSearch">查询</a-button>
      </a-form-item>
    </a-form>

    <!-- FMEA 列表 -->
    <a-table
      :columns="columns"
      :data-source="fmeaList"
      :loading="loading"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'rpn'">
          <a-tag :color="getRpnColor(record.rpn)">{{ record.rpn }}</a-tag>
        </template>
      </template>
    </a-table>
  </a-modal>
</template>

<script setup lang="ts">
const getRpnColor = (rpn: number) => {
  if (rpn >= 100) return 'red'
  if (rpn >= 50) return 'orange'
  return 'green'
}
</script>
```

### 4.2 推荐面板组件

```vue
<!-- RecommendationPanel.vue -->
<template>
  <div class="recommendation-panel">
    <div class="panel-header">
      <BulbOutlined class="icon" />
      <span class="title">推荐原因</span>
    </div>

    <div class="recommendation-list">
      <div
        v-for="item in recommendations"
        :key="item.causeId"
        class="recommendation-item"
        @click="handleSelect(item)"
      >
        <div class="item-header">
          <span class="cause-name">{{ item.causeName }}</span>
          <a-tag color="blue">{{ item.score }}分</a-tag>
        </div>
        <div class="item-reason">
          <TagOutlined class="reason-icon" />
          {{ item.reason }}
        </div>
        <div class="item-actions">
          <a-button type="link" size="small" @click.stop="handleAdopt(item)">
            采纳
          </a-button>
          <a-button type="link" size="small" @click.stop="handleIgnore(item)">
            忽略
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 4.3 升级流程配置组件

```vue
<!-- EscalateFlowConfig.vue -->
<template>
  <div class="escalate-config">
    <a-form-item label="自动升级">
      <a-switch v-model:checked="form.autoEscalate" />
      <span class="hint">检测到此不良时自动触发升级流程</span>
    </a-form-item>

    <template v-if="form.autoEscalate">
      <a-form-item label="升级流程">
        <a-select v-model:value="form.escalateType">
          <a-select-option value="8D">8D 问题解决</a-select-option>
          <a-select-option value="QRQC">QRQC 快速响应</a-select-option>
          <a-select-option value="NCR">不合格品评审</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="升级条件">
        <a-input
          v-model:value="form.escalateCondition"
          placeholder="如：立即升级 / 连续3次出现"
        />
      </a-form-item>
    </template>
  </div>
</template>
```

## 5. 性能优化

### 5.1 推荐算法优化

1. **缓存策略** - 缓存推荐结果（5分钟）
2. **防抖处理** - 用户输入时延迟计算
3. **异步计算** - 使用 Web Worker（可选）
4. **分页加载** - 推荐列表分页显示

### 5.2 FMEA 数据优化

1. **懒加载** - 按需加载 FMEA 数据
2. **虚拟滚动** - 大数据量时使用虚拟列表
3. **索引优化** - 数据库添加索引

## 6. 安全性考虑

### 6.1 权限控制

```typescript
// 升级流程权限检查
function canCreateEscalateTask(user: User, type: string): boolean {
  const roleMap = {
    '8D': ['QUALITY_MANAGER', 'ADMIN'],
    'QRQC': ['QUALITY_ENGINEER', 'QUALITY_MANAGER', 'ADMIN'],
    'NCR': ['QUALITY_ENGINEER', 'QUALITY_MANAGER', 'ADMIN']
  }
  
  return user.roles.some(role => roleMap[type].includes(role))
}
```

### 6.2 数据验证

- FMEA ID 格式验证
- RPN 值范围验证（0-1000）
- 升级条件格式验证

## 7. 监控和日志

### 7.1 关键指标

- 推荐算法准确率（用户采纳率）
- 推荐算法响应时间
- 升级流程触发次数
- FMEA 关联使用率

### 7.2 日志记录

- 推荐结果日志（用于算法优化）
- 升级流程触发日志（审计）
- FMEA 关联操作日志
