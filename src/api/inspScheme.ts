/**
 * 检验方案和检验策略 API 服务
 */

import type { InspScheme, InspSchemeDetail, InspStrategy, MatchDimension } from '@/types'

// ===============================
// Mock 数据
// ===============================

const mockSchemes: InspScheme[] = [
    {
        id: '1',
        orgId: '1',
        schemeCode: 'SCH-IQC-001',
        schemeName: '来料检验方案-电子元器件',
        version: 'V1.0',
        status: 'APPROVED',
        sourceTemplateId: 'TPL-001',
        sourceTemplateName: '电子元器件检验模板',
        description: '用于电子元器件的来料检验',
        createTime: '2024-01-15T08:00:00Z',
        updateTime: '2024-01-20T10:30:00Z',
        creator: 'admin',
        updater: 'admin'
    },
    {
        id: '2',
        orgId: '1',
        schemeCode: 'SCH-IQC-002',
        schemeName: '来料检验方案-机械零件',
        version: 'V2.1',
        status: 'APPROVED',
        description: '用于机械零件的来料检验，包含尺寸和外观检验',
        createTime: '2024-01-10T09:00:00Z',
        updateTime: '2024-02-01T14:20:00Z',
        creator: 'admin',
        updater: 'quality_manager'
    },
    {
        id: '3',
        orgId: '1',
        schemeCode: 'SCH-IPQC-001',
        schemeName: '过程检验方案-压铸工序',
        version: 'V1.0',
        status: 'IN_APPROVAL',
        description: '压铸工序的过程检验方案',
        createTime: '2024-02-05T10:00:00Z',
        updateTime: '2024-02-05T10:00:00Z',
        creator: 'process_engineer',
        updater: 'process_engineer'
    },
    {
        id: '4',
        orgId: '1',
        schemeCode: 'SCH-FQC-001',
        schemeName: '成品检验方案-标准产品',
        version: 'V1.5',
        status: 'DRAFT',
        description: '标准产品的成品检验方案',
        createTime: '2024-02-08T11:00:00Z',
        updateTime: '2024-02-09T16:45:00Z',
        creator: 'qc_inspector',
        updater: 'qc_inspector'
    }
]

const mockSchemeDetails: InspSchemeDetail[] = [
    // 方案1的明细
    {
        id: 'D1-1',
        schemeId: '1',
        sortOrder: 1,
        inspItemId: 'ITEM-001',
        inspItemName: '外观检验',
        inspItemCode: 'INSP-APP-001',
        characteristicClass: 'Major',
        samplingRuleId: 'RULE-001',
        samplingRuleCode: 'AQL-2.5',
        samplingRuleName: 'AQL 2.5 一般检验',
        inspMethodId: 'METHOD-001',
        inspMethodName: '目视检验',
        spcEnabled: false,
        labRequired: false,
        fromTemplate: true,
        createTime: '2024-01-15T08:00:00Z',
        updateTime: '2024-01-15T08:00:00Z',
        creator: 'admin',
        updater: 'admin'
    },
    {
        id: 'D1-2',
        schemeId: '1',
        sortOrder: 2,
        inspItemId: 'ITEM-002',
        inspItemName: '尺寸测量',
        inspItemCode: 'INSP-DIM-001',
        characteristicClass: 'CC',
        samplingRuleId: 'RULE-002',
        samplingRuleCode: 'AQL-1.0',
        samplingRuleName: 'AQL 1.0 加严检验',
        inspMethodId: 'METHOD-002',
        inspMethodName: '卡尺测量',
        gaugeTypeId: 'GAUGE-001',
        gaugeTypeName: '数显卡尺',
        spcEnabled: true,
        labRequired: false,
        fromTemplate: true,
        createTime: '2024-01-15T08:00:00Z',
        updateTime: '2024-01-15T08:00:00Z',
        creator: 'admin',
        updater: 'admin'
    },
    {
        id: 'D1-3',
        schemeId: '1',
        sortOrder: 3,
        inspItemId: 'ITEM-003',
        inspItemName: '电气性能测试',
        inspItemCode: 'INSP-ELEC-001',
        characteristicClass: 'SC',
        samplingRuleId: 'RULE-003',
        samplingRuleCode: 'FULL',
        samplingRuleName: '全检',
        inspMethodId: 'METHOD-003',
        inspMethodName: '万用表测试',
        spcEnabled: false,
        labRequired: true,
        fromTemplate: false,
        createTime: '2024-01-20T10:30:00Z',
        updateTime: '2024-01-20T10:30:00Z',
        creator: 'admin',
        updater: 'admin'
    },
    // 方案2的明细
    {
        id: 'D2-1',
        schemeId: '2',
        sortOrder: 1,
        inspItemId: 'ITEM-004',
        inspItemName: '表面粗糙度',
        inspItemCode: 'INSP-SURF-001',
        characteristicClass: 'Major',
        samplingRuleId: 'RULE-001',
        samplingRuleCode: 'AQL-2.5',
        samplingRuleName: 'AQL 2.5 一般检验',
        inspMethodId: 'METHOD-004',
        inspMethodName: '粗糙度仪',
        spcEnabled: true,
        labRequired: false,
        fromTemplate: false,
        createTime: '2024-01-10T09:00:00Z',
        updateTime: '2024-01-10T09:00:00Z',
        creator: 'admin',
        updater: 'admin'
    }
]

const mockStrategies: InspStrategy[] = [
    {
        id: 'STRAT-001',
        orgId: '1',
        strategyCode: 'STRAT-IQC-001',
        strategyName: '电阻类物料检验策略',
        schemeId: '1',
        schemeCode: 'SCH-IQC-001',
        schemeName: '来料检验方案-电子元器件',
        contextType: 'IQC',
        matchDimension: {
            materialId: 'MAT-R-*',
            materialCategory: '电阻'
        },
        priority: 10,
        triggerCondition: 'ALWAYS',
        description: '所有电阻类物料使用此方案',
        status: 'enabled',
        createTime: '2024-01-15T08:30:00Z',
        updateTime: '2024-01-15T08:30:00Z',
        creator: 'admin',
        updater: 'admin'
    },
    {
        id: 'STRAT-002',
        orgId: '1',
        strategyCode: 'STRAT-IQC-002',
        strategyName: '新供应商加严检验策略',
        schemeId: '1',
        schemeCode: 'SCH-IQC-001',
        schemeName: '来料检验方案-电子元器件',
        contextType: 'IQC',
        matchDimension: {
            materialId: 'MAT-R-*',
            supplierId: 'SUP-NEW-*'
        },
        priority: 5,
        triggerCondition: 'ON_NEW_SUPPLIER_FIRST_N_BATCHES',
        triggerValue: 5,
        description: '新供应商前5批使用加严检验',
        status: 'enabled',
        createTime: '2024-01-16T09:00:00Z',
        updateTime: '2024-01-16T09:00:00Z',
        creator: 'admin',
        updater: 'admin'
    },
    {
        id: 'STRAT-003',
        orgId: '1',
        strategyCode: 'STRAT-IPQC-001',
        strategyName: '压铸工序检验策略',
        schemeId: '3',
        schemeCode: 'SCH-IPQC-001',
        schemeName: '过程检验方案-压铸工序',
        contextType: 'IPQC',
        matchDimension: {
            operationNo: 'OP-010',
            operationName: '压铸'
        },
        priority: 10,
        triggerCondition: 'ALWAYS',
        description: '压铸工序使用此检验方案',
        status: 'enabled',
        createTime: '2024-02-05T10:30:00Z',
        updateTime: '2024-02-05T10:30:00Z',
        creator: 'process_engineer',
        updater: 'process_engineer'
    }
]


// ===============================
// 检验方案 (InspScheme) API
// ===============================

/** 获取检验方案列表 */
export function getInspSchemeList(params?: any) {
    return Promise.resolve({
        data: {
            success: true,
            data: {
                list: mockSchemes,
                total: mockSchemes.length
            }
        }
    })
}

/** 获取检验方案详情 */
export function getInspSchemeDetail(id: string) {
    const scheme = mockSchemes.find(s => s.id === id)
    if (scheme) {
        const details = mockSchemeDetails.filter(d => d.schemeId === id)
        return Promise.resolve({
            data: {
                success: true,
                data: { ...scheme, details }
            }
        })
    }
    return Promise.reject(new Error('方案不存在'))
}

/** 创建检验方案 */
export function createInspScheme(data: Partial<InspScheme>) {
    const newScheme: InspScheme = {
        id: Date.now().toString(),
        orgId: data.orgId || '1',
        schemeCode: data.schemeCode || '',
        schemeName: data.schemeName || '',
        version: data.version || 'V1.0',
        status: 'DRAFT',
        description: data.description,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        creator: 'admin',
        updater: 'admin'
    }
    mockSchemes.push(newScheme)
    return Promise.resolve({
        data: {
            success: true,
            data: newScheme
        }
    })
}

/** 从模板创建检验方案 */
export function createSchemeFromTemplate(
    templateId: string,
    data: { schemeCode: string; schemeName: string; description?: string }
) {
    const newScheme: InspScheme = {
        id: Date.now().toString(),
        orgId: '1',
        schemeCode: data.schemeCode,
        schemeName: data.schemeName,
        version: 'V1.0',
        status: 'DRAFT',
        sourceTemplateId: templateId,
        sourceTemplateName: '模板名称',
        description: data.description,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        creator: 'admin',
        updater: 'admin'
    }
    mockSchemes.push(newScheme)
    return Promise.resolve({
        data: {
            success: true,
            data: newScheme
        }
    })
}

/** 更新检验方案 */
export function updateInspScheme(id: string, data: Partial<InspScheme>) {
    const index = mockSchemes.findIndex(s => s.id === id)
    if (index !== -1) {
        mockSchemes[index] = { ...mockSchemes[index], ...data, updateTime: new Date().toISOString() }
        return Promise.resolve({
            data: {
                success: true,
                data: mockSchemes[index]
            }
        })
    }
    return Promise.reject(new Error('方案不存在'))
}

/** 删除检验方案 */
export function deleteInspScheme(id: string) {
    const index = mockSchemes.findIndex(s => s.id === id)
    if (index !== -1) {
        mockSchemes.splice(index, 1)
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('方案不存在'))
}

/** 提交审批 */
export function submitInspSchemeForApproval(id: string) {
    const scheme = mockSchemes.find(s => s.id === id)
    if (scheme) {
        scheme.status = 'IN_APPROVAL'
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('方案不存在'))
}

/** 审批通过 */
export function approveInspScheme(id: string) {
    const scheme = mockSchemes.find(s => s.id === id)
    if (scheme) {
        scheme.status = 'APPROVED'
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('方案不存在'))
}

/** 作废 */
export function obsoleteInspScheme(id: string) {
    const scheme = mockSchemes.find(s => s.id === id)
    if (scheme) {
        scheme.status = 'OBSOLETE'
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('方案不存在'))
}

// ===============================
// 检验方案明细 (InspSchemeDetail) API
// ===============================

/** 获取方案明细列表 */
export function getInspSchemeDetails(schemeId: string) {
    const details = mockSchemeDetails.filter(d => d.schemeId === schemeId)
    return Promise.resolve({
        data: {
            success: true,
            data: details
        }
    })
}

/** 添加方案明细 */
export function addInspSchemeDetail(schemeId: string, data: Partial<InspSchemeDetail>) {
    const newDetail: InspSchemeDetail = {
        id: Date.now().toString(),
        schemeId,
        sortOrder: data.sortOrder || 1,
        inspItemId: data.inspItemId || '',
        inspItemName: data.inspItemName || '',
        inspItemCode: data.inspItemCode,
        characteristicClass: data.characteristicClass || 'Major',
        samplingRuleId: data.samplingRuleId,
        samplingRuleCode: data.samplingRuleCode,
        samplingRuleName: data.samplingRuleName,
        inspMethodId: data.inspMethodId,
        inspMethodName: data.inspMethodName,
        gaugeTypeId: data.gaugeTypeId,
        gaugeTypeName: data.gaugeTypeName,
        spcEnabled: data.spcEnabled || false,
        labRequired: data.labRequired || false,
        frequencyType: data.frequencyType,
        frequencyValue: data.frequencyValue,
        frequencyUnit: data.frequencyUnit,
        attachmentId: data.attachmentId,
        relatedPhenomenonIds: data.relatedPhenomenonIds,
        fromTemplate: data.fromTemplate,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        creator: 'admin',
        updater: 'admin'
    }
    mockSchemeDetails.push(newDetail)
    return Promise.resolve({
        data: {
            success: true,
            data: newDetail
        }
    })
}

/** 更新方案明细 */
export function updateInspSchemeDetail(schemeId: string, detailId: string, data: Partial<InspSchemeDetail>) {
    const index = mockSchemeDetails.findIndex(d => d.id === detailId && d.schemeId === schemeId)
    if (index !== -1) {
        mockSchemeDetails[index] = { ...mockSchemeDetails[index], ...data, updateTime: new Date().toISOString() }
        return Promise.resolve({
            data: {
                success: true,
                data: mockSchemeDetails[index]
            }
        })
    }
    return Promise.reject(new Error('明细不存在'))
}

/** 删除方案明细 */
export function deleteInspSchemeDetail(schemeId: string, detailId: string) {
    const index = mockSchemeDetails.findIndex(d => d.id === detailId && d.schemeId === schemeId)
    if (index !== -1) {
        mockSchemeDetails.splice(index, 1)
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('明细不存在'))
}

/** 批量更新方案明细 */
export function batchUpdateInspSchemeDetails(schemeId: string, details: Partial<InspSchemeDetail>[]) {
    // 删除旧明细
    const oldIndices = mockSchemeDetails.map((d, i) => d.schemeId === schemeId ? i : -1).filter(i => i !== -1).reverse()
    oldIndices.forEach(i => mockSchemeDetails.splice(i, 1))

    // 添加新明细
    const newDetails = details.map(d => ({
        ...d,
        id: d.id || Date.now().toString() + Math.random(),
        schemeId,
        updateTime: new Date().toISOString()
    } as InspSchemeDetail))

    mockSchemeDetails.push(...newDetails)

    return Promise.resolve({
        data: {
            success: true,
            data: newDetails
        }
    })
}

// ===============================
// 检验策略 (InspStrategy) API
// ===============================

/** 获取检验策略列表 */
export function getInspStrategyList(params?: any) {
    return Promise.resolve({
        data: {
            success: true,
            data: {
                list: mockStrategies,
                total: mockStrategies.length
            }
        }
    })
}

/** 获取某个方案的所有策略 */
export function getInspStrategiesByScheme(schemeId: string) {
    const strategies = mockStrategies.filter(s => s.schemeId === schemeId)
    return Promise.resolve({
        data: {
            success: true,
            data: strategies
        }
    })
}

/** 获取检验策略详情 */
export function getInspStrategyDetail(id: string) {
    const strategy = mockStrategies.find(s => s.id === id)
    if (strategy) {
        return Promise.resolve({
            data: {
                success: true,
                data: strategy
            }
        })
    }
    return Promise.reject(new Error('策略不存在'))
}

/** 创建检验策略 */
export function createInspStrategy(data: Partial<InspStrategy>) {
    const newStrategy: InspStrategy = {
        id: Date.now().toString(),
        orgId: data.orgId || '1',
        strategyCode: data.strategyCode || `STRAT-${Date.now()}`,
        strategyName: data.strategyName || '',
        schemeId: data.schemeId || '',
        schemeCode: data.schemeCode,
        schemeName: data.schemeName,
        contextType: data.contextType || 'IQC',
        matchDimension: data.matchDimension || {},
        priority: data.priority || 100,
        triggerCondition: data.triggerCondition || 'ALWAYS',
        triggerValue: data.triggerValue,
        description: data.description,
        status: data.status || 'enabled',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        creator: 'admin',
        updater: 'admin'
    }
    mockStrategies.push(newStrategy)
    return Promise.resolve({
        data: {
            success: true,
            data: newStrategy
        }
    })
}

/** 更新检验策略 */
export function updateInspStrategy(id: string, data: Partial<InspStrategy>) {
    const index = mockStrategies.findIndex(s => s.id === id)
    if (index !== -1) {
        mockStrategies[index] = { ...mockStrategies[index], ...data, updateTime: new Date().toISOString() }
        return Promise.resolve({
            data: {
                success: true,
                data: mockStrategies[index]
            }
        })
    }
    return Promise.reject(new Error('策略不存在'))
}

/** 删除检验策略 */
export function deleteInspStrategy(id: string) {
    const index = mockStrategies.findIndex(s => s.id === id)
    if (index !== -1) {
        mockStrategies.splice(index, 1)
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('策略不存在'))
}

/** 启用/禁用策略 */
export function toggleInspStrategyStatus(id: string, status: 'enabled' | 'disabled') {
    const strategy = mockStrategies.find(s => s.id === id)
    if (strategy) {
        strategy.status = status
        return Promise.resolve({
            data: {
                success: true
            }
        })
    }
    return Promise.reject(new Error('策略不存在'))
}

/** 策略匹配测试 */
export function testStrategyMatch(context: {
    contextType: string
    materialId?: string
    supplierId?: string
    operationNo?: string
    ipqcType?: string
}) {
    // 简单的匹配逻辑示例
    const matchedStrategy = mockStrategies.find(s =>
        s.contextType === context.contextType && s.status === 'enabled'
    )

    return Promise.resolve({
        data: {
            success: true,
            data: matchedStrategy || null
        }
    })
}
