/**
 * 检验方案优先级匹配引擎
 * 
 * 根据业务上下文（物料、供应商、工序等）自动匹配最优的检验方案
 * 
 * 优先级规则（由高到低）：
 * 1. 物料 + 供应商 + 工序（最高）
 * 2. 物料 + 供应商
 * 3. 物料 + 工序
 * 4. 物料组 + 工序
 * 5. 物料
 * 6. 物料组
 * 7. 工厂通用（最低）
 */

import type { InspPlan, InspContextType } from '@/types'

/**
 * 检验上下文，用于匹配检验方案
 */
export interface InspectionContext {
  /** 业务类型 */
  contextType: InspContextType
  /** 物料ID */
  materialId?: string
  /** 物料组ID */
  materialGroupId?: string
  /** 供应商ID（IQC） */
  supplierId?: string
  /** 客户ID（OQC） */
  customerId?: string
  /** 工序号（IPQC） */
  operationNo?: string
  /** 组织ID */
  orgId: string
}

/**
 * 匹配结果
 */
export interface MatchResult {
  /** 匹配到的方案 */
  plan: InspPlan | null
  /** 匹配类型说明 */
  matchType: string
  /** 是否为精确匹配 */
  isExactMatch: boolean
  /** 所有候选方案 */
  candidates: InspPlan[]
}

/**
 * 计算方案与上下文的匹配分数
 * 分数越高，优先级越高
 * NOTE: 兼容新旧模型 — 新模型使用 inspType/planStatus，旧模型使用 contextType/status
 */
function calculateMatchScore(plan: InspPlan, context: InspectionContext): number {
  let score = 0
  
  // 基础分：业务类型必须匹配（兼容新旧字段）
  const planContextType = plan.contextType ?? plan.inspType
  if (planContextType !== context.contextType) {
    return -1 // 不匹配
  }
  
  // 组织匹配
  if (plan.orgId !== context.orgId) {
    return -1 // 不匹配
  }
  
  // 物料匹配（+100分）
  if (plan.materialId && plan.materialId === context.materialId) {
    score += 100
  }
  
  // 供应商匹配（+80分，仅 IQC）
  if (context.contextType === 'IQC' && plan.supplierId && plan.supplierId === context.supplierId) {
    score += 80
  }
  
  // 客户匹配（+80分，仅 OQC）
  if (context.contextType === 'OQC' && plan.customerId && plan.customerId === context.customerId) {
    score += 80
  }
  
  // 工序匹配（+60分，仅 IPQC）
  if (context.contextType === 'IPQC' && plan.operationNo && plan.operationNo === context.operationNo) {
    score += 60
  }
  
  // 使用方案自身的优先级进行微调（优先级值越小越优先，所以取负）
  const priority = plan.priority ?? 50
  score -= priority * 0.1
  
  return score
}

/**
 * 获取匹配类型描述
 */
function getMatchTypeDescription(plan: InspPlan, context: InspectionContext): string {
  const parts: string[] = []
  
  if (plan.materialId && plan.materialId === context.materialId) {
    parts.push('物料')
  }
  
  if (context.contextType === 'IQC' && plan.supplierId && plan.supplierId === context.supplierId) {
    parts.push('供应商')
  }
  
  if (context.contextType === 'OQC' && plan.customerId && plan.customerId === context.customerId) {
    parts.push('客户')
  }
  
  if (context.contextType === 'IPQC' && plan.operationNo && plan.operationNo === context.operationNo) {
    parts.push('工序')
  }
  
  if (parts.length === 0) {
    return '通用方案'
  }
  
  return parts.join(' + ') + ' 匹配'
}

/**
 * 检验方案优先级匹配引擎
 * 
 * @param plans 所有可用的检验方案
 * @param context 当前业务上下文
 * @returns 匹配结果
 * 
 * @example
 * const result = findBestPlan(allPlans, {
 *   contextType: 'IQC',
 *   materialId: 'MAT001',
 *   supplierId: 'SUP001',
 *   orgId: 'ORG001'
 * })
 * if (result.plan) {
 *   console.log(`匹配到方案: ${result.plan.planName}`)
 *   console.log(`匹配类型: ${result.matchType}`)
 * }
 */
export function findBestPlan(plans: InspPlan[], context: InspectionContext): MatchResult {
  // 过滤出有效的方案（兼容新旧模型状态字段）
  const activePlans = plans.filter(p => {
    const status = p.planStatus ?? p.status
    return status === 'ACTIVE' || status === 'APPROVED'
  })
  
  if (activePlans.length === 0) {
    return {
      plan: null,
      matchType: '无可用方案',
      isExactMatch: false,
      candidates: []
    }
  }
  
  // 计算每个方案的匹配分数
  const scoredPlans = activePlans
    .map(plan => ({
      plan,
      score: calculateMatchScore(plan, context)
    }))
    .filter(item => item.score >= 0) // 排除不匹配的
    .sort((a, b) => b.score - a.score) // 按分数降序排列
  
  if (scoredPlans.length === 0) {
    return {
      plan: null,
      matchType: '无匹配方案',
      isExactMatch: false,
      candidates: []
    }
  }
  
  const bestMatch = scoredPlans[0]
  const matchType = getMatchTypeDescription(bestMatch.plan, context)
  
  // 判断是否为精确匹配（物料 + 供应商/客户/工序 都匹配）
  const isExactMatch = bestMatch.score >= 160
  
  return {
    plan: bestMatch.plan,
    matchType,
    isExactMatch,
    candidates: scoredPlans.map(s => s.plan)
  }
}

/**
 * 批量匹配检验方案
 * 
 * @param plans 所有可用的检验方案
 * @param contexts 多个业务上下文
 * @returns 匹配结果数组
 */
export function findBestPlansForBatch(
  plans: InspPlan[],
  contexts: InspectionContext[]
): MatchResult[] {
  return contexts.map(context => findBestPlan(plans, context))
}

/**
 * 验证方案配置的完整性（兼容新模型）
 * 
 * @param plan 检验方案
 * @returns 验证结果
 */
export function validatePlanConfiguration(plan: InspPlan): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 必填项检查（兼容新旧模型）
  if (!plan.schemeId && !plan.templateCode) {
    errors.push('未关联检验方案或检验模板')
  }
  
  const contextType = plan.contextType ?? plan.inspType
  if (!contextType) {
    errors.push('未指定检验类型')
  }
  
  // 业务逻辑检查
  if (contextType === 'IQC' && !plan.materialId) {
    warnings.push('IQC 计划建议至少指定物料')
  }
  
  if (contextType === 'IPQC' && !plan.operationNo) {
    warnings.push('IPQC 计划建议指定工序号')
  }
  
  // 新模型：触发配置完整性检查
  if (plan.triggerType === 'EVENT' && !plan.eventTrigger?.erpDocType) {
    warnings.push('事件驱动触发器未配置 ERP 单据类型')
  }
  
  if (plan.triggerType === 'TIME' && !plan.timeTrigger?.frequencyType && !plan.timeTrigger?.cronExpression) {
    warnings.push('周期驱动触发器未配置频率或 Cron 表达式')
  }
  
  if (plan.triggerType === 'QUANTITY' && !plan.quantityTrigger?.quantityThreshold) {
    warnings.push('数量驱动触发器未配置阈值')
  }
  
  // 优先级检查
  const priority = plan.priority ?? 50
  if (priority < 0 || priority > 100) {
    warnings.push('优先级建议在 0-100 范围内')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
