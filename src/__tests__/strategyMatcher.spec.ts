import { describe, it, expect } from 'vitest'
import { StrategyMatcher, type BusinessContext } from '../utils/strategyMatcher'
import type { InspStrategy, MatchDimension } from '../types'

describe('StrategyMatcher', () => {
    // 创建测试策略
    const createStrategy = (
        id: string,
        matchDimension: MatchDimension,
        priority: number,
        triggerCondition: 'ALWAYS' | 'ON_NEW_SUPPLIER_FIRST_N_BATCHES' | 'ON_ECN_FIRST_N_BATCHES' = 'ALWAYS',
        triggerValue?: number
    ): InspStrategy => ({
        id,
        orgId: '1',
        strategyCode: `STRAT-${id}`,
        strategyName: `策略${id}`,
        schemeId: 'scheme-1',
        contextType: 'IQC',
        matchDimension,
        priority,
        triggerCondition,
        triggerValue,
        status: 'enabled',
        createTime: '',
        updateTime: '',
        creator: '',
        updater: ''
    })

    describe('calculateMatchScore', () => {
        it('应该对禁用的策略返回0分', () => {
            const strategy = createStrategy('1', {}, 100)
            strategy.status = 'disabled'
            const context: BusinessContext = { contextType: 'IQC' }

            const score = StrategyMatcher.calculateMatchScore(strategy, context)
            expect(score).toBe(0)
        })

        it('应该对上下文类型不匹配返回0分', () => {
            const strategy = createStrategy('1', {}, 100)
            strategy.contextType = 'IQC'
            const context: BusinessContext = { contextType: 'IPQC' }

            const score = StrategyMatcher.calculateMatchScore(strategy, context)
            expect(score).toBe(0)
        })

        it('应该对物料ID精确匹配给予高分', () => {
            const strategy = createStrategy('1', { materialId: 'M001' }, 100)
            const context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M001'
            }

            const score = StrategyMatcher.calculateMatchScore(strategy, context)
            expect(score).toBeGreaterThan(0)
            expect(score).toContain(100) // 物料匹配权重为100
        })

        it('应该对物料ID不匹配返回0分', () => {
            const strategy = createStrategy('1', { materialId: 'M001' }, 100)
            const context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M002'
            }

            const score = StrategyMatcher.calculateMatchScore(strategy, context)
            expect(score).toBe(0)
        })

        it('应该对多维度匹配累加得分', () => {
            const strategy = createStrategy('1', {
                materialId: 'M001',
                supplierId: 'S001'
            }, 100)
            const context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M001',
                supplierId: 'S001'
            }

            const score = StrategyMatcher.calculateMatchScore(strategy, context)
            expect(score).toBe(180) // 100(物料) + 80(供应商)
        })

        it('应该对通用策略（无匹配维度）给予基础分', () => {
            const strategy = createStrategy('1', {}, 100)
            const context: BusinessContext = { contextType: 'IQC' }

            const score = StrategyMatcher.calculateMatchScore(strategy, context)
            expect(score).toBe(10) // 基础分
        })
    })

    describe('checkTriggerCondition', () => {
        it('ALWAYS条件应该总是返回true', () => {
            const strategy = createStrategy('1', {}, 100, 'ALWAYS')
            const context: BusinessContext = { contextType: 'IQC' }

            const result = StrategyMatcher.checkTriggerCondition(strategy, context)
            expect(result).toBe(true)
        })

        it('新供应商前N批条件应该正确判断', () => {
            const strategy = createStrategy('1', {}, 100, 'ON_NEW_SUPPLIER_FIRST_N_BATCHES', 3)

            // 第1批，应该触发
            let context: BusinessContext = { contextType: 'IQC', batchNumber: 1 }
            expect(StrategyMatcher.checkTriggerCondition(strategy, context)).toBe(true)

            // 第3批，应该触发
            context = { contextType: 'IQC', batchNumber: 3 }
            expect(StrategyMatcher.checkTriggerCondition(strategy, context)).toBe(true)

            // 第4批，不应该触发
            context = { contextType: 'IQC', batchNumber: 4 }
            expect(StrategyMatcher.checkTriggerCondition(strategy, context)).toBe(false)
        })

        it('缺少批次号时应该返回false', () => {
            const strategy = createStrategy('1', {}, 100, 'ON_NEW_SUPPLIER_FIRST_N_BATCHES', 3)
            const context: BusinessContext = { contextType: 'IQC' }

            const result = StrategyMatcher.checkTriggerCondition(strategy, context)
            expect(result).toBe(false)
        })
    })

    describe('findBestMatch', () => {
        it('应该返回得分最高的策略', () => {
            const strategies = [
                createStrategy('1', {}, 100), // 通用策略，得分10
                createStrategy('2', { materialId: 'M001' }, 50), // 物料匹配，得分100
                createStrategy('3', { materialId: 'M001', supplierId: 'S001' }, 20) // 物料+供应商，得分180
            ]

            const context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M001',
                supplierId: 'S001'
            }

            const best = StrategyMatcher.findBestMatch(strategies, context)
            expect(best?.id).toBe('3')
        })

        it('相同得分时应该选择优先级更高的（数值更小）', () => {
            const strategies = [
                createStrategy('1', { materialId: 'M001' }, 100), // 得分100，优先级100
                createStrategy('2', { materialId: 'M001' }, 50)   // 得分100，优先级50（更高）
            ]

            const context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M001'
            }

            const best = StrategyMatcher.findBestMatch(strategies, context)
            expect(best?.id).toBe('2')
        })

        it('没有匹配策略时应该返回null', () => {
            const strategies = [
                createStrategy('1', { materialId: 'M002' }, 100)
            ]

            const context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M001'
            }

            const best = StrategyMatcher.findBestMatch(strategies, context)
            expect(best).toBeNull()
        })

        it('空策略列表应该返回null', () => {
            const context: BusinessContext = { contextType: 'IQC' }
            const best = StrategyMatcher.findBestMatch([], context)
            expect(best).toBeNull()
        })

        it('应该正确处理触发条件', () => {
            const strategies = [
                createStrategy('1', { materialId: 'M001' }, 100, 'ALWAYS'), // 通用策略
                createStrategy('2', { materialId: 'M001' }, 10, 'ON_NEW_SUPPLIER_FIRST_N_BATCHES', 3) // 前3批加严
            ]

            // 第2批，应该匹配加严策略
            let context: BusinessContext = {
                contextType: 'IQC',
                materialId: 'M001',
                batchNumber: 2
            }
            let best = StrategyMatcher.findBestMatch(strategies, context)
            expect(best?.id).toBe('2')

            // 第5批，加严策略失效，应该匹配通用策略
            context = {
                contextType: 'IQC',
                materialId: 'M001',
                batchNumber: 5
            }
            best = StrategyMatcher.findBestMatch(strategies, context)
            expect(best?.id).toBe('1')
        })
    })

    describe('复杂场景测试', () => {
        it('应该正确处理IPQC多维度匹配', () => {
            const strategies = [
                createStrategy('1', { materialId: 'M001' }, 100),
                createStrategy('2', { materialId: 'M001', operationNo: 'OP10' }, 50),
                createStrategy('3', { materialId: 'M001', operationNo: 'OP10', ipqcType: 'FAI' }, 10)
            ]

            strategies.forEach(s => s.contextType = 'IPQC')

            const context: BusinessContext = {
                contextType: 'IPQC',
                materialId: 'M001',
                operationNo: 'OP10',
                ipqcType: 'FAI'
            }

            const best = StrategyMatcher.findBestMatch(strategies, context)
            expect(best?.id).toBe('3') // 最精确的匹配
        })
    })
})
