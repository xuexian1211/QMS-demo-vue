import type { InspStrategy, MatchDimension, InspContextType, IpqcType } from '../types'

/**
 * 业务上下文
 */
export interface BusinessContext {
    contextType: InspContextType
    materialId?: string
    materialGroupId?: string
    supplierId?: string
    customerId?: string
    operationNo?: string
    ipqcType?: IpqcType
    batchNumber?: number  // 当前批次号（用于"前N批"判断）
}

/**
 * 策略匹配引擎
 * 根据业务上下文找到最佳匹配的检验策略
 */
export class StrategyMatcher {
    /**
     * 计算策略与上下文的匹配得分
     * @param strategy 检验策略
     * @param context 业务上下文
     * @returns 匹配得分，0表示不匹配，数值越大匹配度越高
     */
    static calculateMatchScore(strategy: InspStrategy, context: BusinessContext): number {
        // 状态检查
        if (strategy.status === 'disabled') {
            return 0
        }

        // 上下文类型必须匹配
        if (strategy.contextType !== context.contextType) {
            return 0
        }

        // 检查触发条件
        if (!this.checkTriggerCondition(strategy, context)) {
            return 0
        }

        const dimension = strategy.matchDimension
        let score = 0
        let matchedFields = 0

        // 物料ID匹配（权重：100）
        if (dimension.materialId) {
            if (dimension.materialId === context.materialId) {
                score += 100
                matchedFields++
            } else {
                return 0  // 如果指定了物料但不匹配，则不符合
            }
        }

        // 物料组ID匹配（权重：50）
        if (dimension.materialGroupId) {
            if (dimension.materialGroupId === context.materialGroupId) {
                score += 50
                matchedFields++
            } else {
                return 0
            }
        }

        // 供应商ID匹配（权重：80）
        if (dimension.supplierId) {
            if (dimension.supplierId === context.supplierId) {
                score += 80
                matchedFields++
            } else {
                return 0
            }
        }

        // 客户ID匹配（权重：80）
        if (dimension.customerId) {
            if (dimension.customerId === context.customerId) {
                score += 80
                matchedFields++
            } else {
                return 0
            }
        }

        // 工序号匹配（权重：70）
        if (dimension.operationNo) {
            if (dimension.operationNo === context.operationNo) {
                score += 70
                matchedFields++
            } else {
                return 0
            }
        }

        // IPQC类型匹配（权重：60）
        if (dimension.ipqcType) {
            if (dimension.ipqcType === context.ipqcType) {
                score += 60
                matchedFields++
            } else {
                return 0
            }
        }

        // 如果没有任何匹配字段，说明是通用策略，给基础分
        if (matchedFields === 0) {
            score = 10
        }

        return score
    }

    /**
     * 检查触发条件
     */
    static checkTriggerCondition(strategy: InspStrategy, context: BusinessContext): boolean {
        switch (strategy.triggerCondition) {
            case 'ALWAYS':
                return true

            case 'ON_NEW_SUPPLIER_FIRST_N_BATCHES':
                // 需要批次号信息
                if (context.batchNumber !== undefined && strategy.triggerValue) {
                    return context.batchNumber <= strategy.triggerValue
                }
                return false

            case 'ON_ECN_FIRST_N_BATCHES':
                // 需要批次号信息
                if (context.batchNumber !== undefined && strategy.triggerValue) {
                    return context.batchNumber <= strategy.triggerValue
                }
                return false

            default:
                return true
        }
    }

    /**
     * 从策略列表中找到最佳匹配
     * @param strategies 策略列表
     * @param context 业务上下文
     * @returns 最佳匹配的策略，如果没有匹配则返回 null
     */
    static findBestMatch(strategies: InspStrategy[], context: BusinessContext): InspStrategy | null {
        if (!strategies || strategies.length === 0) {
            return null
        }

        // 计算所有策略的匹配得分
        const scoredStrategies = strategies
            .map(strategy => ({
                strategy,
                score: this.calculateMatchScore(strategy, context)
            }))
            .filter(item => item.score > 0)  // 过滤掉不匹配的

        if (scoredStrategies.length === 0) {
            return null
        }

        // 按得分降序，优先级升序（数值小的优先）排序
        scoredStrategies.sort((a, b) => {
            if (a.score !== b.score) {
                return b.score - a.score  // 得分高的优先
            }
            return a.strategy.priority - b.strategy.priority  // 优先级数值小的优先
        })

        return scoredStrategies[0].strategy
    }

    /**
     * 调试：显示所有策略的匹配得分
     */
    static debugMatchScores(strategies: InspStrategy[], context: BusinessContext): Array<{ strategy: InspStrategy; score: number }> {
        return strategies.map(strategy => ({
            strategy,
            score: this.calculateMatchScore(strategy, context)
        }))
    }
}
