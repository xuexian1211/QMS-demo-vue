# 舜富QMS系统 - 核心模块详细实现规范

## 1. 变化点管理模块详细实现

### 1.1 模块架构设计

```
┌─────────────────────────────────────────────────────────────┐
│              变化点管理模块 - 微服务架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  API Layer (Controller)                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │变化点   │ │审批     │ │影响分析 │ │实施记录 │    │  │
│  │  │Controller│ Controller│Controller│Controller│   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Service Layer                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │变化点   │ │风险     │ │流程     │ │通知     │    │  │
│  │  │Service  │ │评估     │ │Service  │ │Service  │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Repository Layer                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │变化点   │ │审批     │ │影响分析 │ │实施记录 │    │  │
│  │  │Repository│ Repository│Repository│Repository│  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Database Layer                     │  │
│  │  PostgreSQL: cp_change_point (变化点主表)              │  │
│  │  PostgreSQL: cp_approval_record (审批记录表)           │  │
│  │  PostgreSQL: cp_impact_analysis (影响分析表)           │  │
│  │  PostgreSQL: cp_implementation_record (实施记录表)     │  │
│  │  PostgreSQL: cp_verification_record (验证记录表)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心业务流程

#### 1.2.1 变化点创建与审批流程

```
┌─────────────────────────────────────────────────────────────────┐
│  变化点完整业务流程图                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ 草稿创建  │───▶│ 提交审批  │───▶│ 部门经理  │                   │
│  └──────────┘    └──────────┘    └────┬─────┘                   │
│                                       │                          │
│                          ┌────────────┴────────────┐            │
│                          ▼                         ▼            │
│                   ┌──────────┐              ┌──────────┐          │
│                   │ 审批通过  │              │ 审批拒绝  │          │
│                   └────┬─────┘              └──────────┘          │
│                        │                                          │
│                   ┌────┴────┐                                     │
│                   ▼         ▼                                     │
│            ┌──────────┐ ┌──────────┐                             │
│            │ 风险评估  │ │ 质量经理  │                             │
│            └────┬─────┘ └────┬─────┘                             │
│                 │          │                                     │
│        ┌────────┴──────────┴────────┐                            │
│        ▼                           ▼                            │
│  ┌──────────┐              ┌──────────┐                          │
│  │ 重大/关键 │              │ 质量经理  │                          │
│  │需总监审批 │              │ 审批拒绝  │                          │
│  └────┬─────┘              └──────────┘                          │
│       │                                                        │
│       ▼                                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │ 审批完成  │───▶│ 制定实施  │───▶│ 实施变更  │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                        │                         │
│                                        ▼                         │
│                                  ┌──────────┐                    │
│                                  │ 质量验证  │                    │
│                                  └────┬─────┘                    │
│                                       │                         │
│                            ┌──────────┴──────────┐             │
│                            ▼                     ▼              │
│                     ┌──────────┐          ┌──────────┐          │
│                     │ 验证通过  │          │ 验证失败  │          │
│                     └────┬─────┘          └──────────┘          │
│                          │                                       │
│                          ▼                                       │
│                   ┌──────────┐                                   │
│                   │ 变更关闭  │                                   │
│                   └──────────┘                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2.2 变化点详细流程说明

**步骤1: 变化点草稿创建**
- 申请者填写变化点基本信息
- 系统自动生成变化点编号 (CPYYYYMMNNN)
- 系统根据影响评估初步判断变更类别 (Minor/Moderate/Major/Critical)

**步骤2: 提交审批**
- 提交时系统验证必填字段
- 系统自动判断需要的审批层级
- 根据变化点类别确定审批路径

**步骤3: 部门经理审批**
- 审查变更必要性、技术可行性
- 审批通过→进入风险评估
- 审批拒绝→返回草稿状态,记录拒绝原因

**步骤4: 风险评估**
- 系统根据影响分析自动计算风险评分
- 支持多维度影响评估 (质量、成本、交付、安全、环境)
- 风险评分算法: Risk = Severity × Probability

**步骤5: 质量经理审批**
- 审查风险分析充分性
- 审查质量影响评估
- 重大/关键变更需总监审批

**步骤6: 总监审批 (仅重大/关键变更)**
- 重大变更: 影响范围大、成本高 (>50万)
- 关键变更: 影响安全、法规合规

**步骤7: 制定实施计划**
- 明确实施步骤、责任人、时间节点
- 关联影响分析中的缓解措施
- 制定验证计划和标准

**步骤8: 实施变更**
- 按计划执行变更
- 记录实施过程和遇到的问题
- 实时更新实施进度

**步骤9: 质量验证**
- 执行验证计划
- 收集验证数据
- 判定验证结果 (Pass/Fail/Conditional Pass)

**步骤10: 变更关闭**
- 验证通过→关闭变更,记录生效日期
- 验证失败→启动CAPA流程
- 更新追溯信息

### 1.3 核心类设计

#### 1.3.1 实体类 (Entity)

```java
/**
 * 变化点实体类
 */
@Data
@Entity
@Table(name = "cp_change_point")
@DynamicUpdate
public class ChangePoint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "change_id")
    private Long changeId;
    
    @Column(name = "change_number", unique = true, nullable = false)
    private String changeNumber;
    
    @Column(name = "change_title", nullable = false)
    private String changeTitle;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    private ChangeType changeType; // MAN, MACHINE, MATERIAL, METHOD, ENV
    
    @Column(name = "change_sub_type")
    private String changeSubType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "change_source")
    private ChangeSource changeSource;
    
    @Column(name = "department_id")
    private Long departmentId;
    
    @Column(name = "requester_id", nullable = false)
    private Long requesterId;
    
    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;
    
    @Column(name = "planned_change_date")
    private LocalDate plannedChangeDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "change_category")
    private ChangeCategory changeCategory; // MINOR, MODERATE, MAJOR, CRITICAL
    
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level")
    private RiskLevel riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(name = "business_impact", columnDefinition = "TEXT")
    private String businessImpact;
    
    @Column(name = "quality_impact", columnDefinition = "TEXT")
    private String qualityImpact;
    
    @Column(name = "safety_impact", columnDefinition = "TEXT")
    private String safetyImpact;
    
    @Column(name = "cost_impact")
    private BigDecimal costImpact;
    
    @Type(type = "json")
    @Column(name = "affected_products", columnDefinition = "jsonb")
    private List<AffectedProduct> affectedProducts;
    
    @Type(type = "json")
    @Column(name = "affected_processes", columnDefinition = "jsonb")
    private List<AffectedProcess> affectedProcesses;
    
    @Type(type = "json")
    @Column(name = "affected_customers", columnDefinition = "jsonb")
    private List<AffectedCustomer> affectedCustomers;
    
    @Type(type = "json")
    @Column(name = "affected_suppliers", columnDefinition = "jsonb")
    private List<AffectedSupplier> affectedSuppliers;
    
    @Column(name = "change_description", nullable = false, columnDefinition = "TEXT")
    private String changeDescription;
    
    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;
    
    @Column(name = "change_plan", columnDefinition = "TEXT")
    private String changePlan;
    
    @Column(name = "verification_plan", columnDefinition = "TEXT")
    private String verificationPlan;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "change_status", nullable = false)
    private ChangeStatus changeStatus; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, IMPLEMENTED, CANCELLED
    
    @Column(name = "approval_level")
    private String approvalLevel;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @Column(name = "implemented_date")
    private LocalDateTime implementedDate;
    
    @Column(name = "verified_date")
    private LocalDateTime verifiedDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_result")
    private VerificationResult verificationResult; // PASS, FAIL, CONDITIONAL_PASS
    
    @Column(name = "effectiveness_date")
    private LocalDate effectivenessDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RecordStatus status; // ACTIVE, INACTIVE
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    // 关联关系
    @OneToMany(mappedBy = "changePoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeAttachment> attachments = new ArrayList<>();
    
    @OneToMany(mappedBy = "changePoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImpactAnalysis> impactAnalyses = new ArrayList<>();
    
    @OneToMany(mappedBy = "changePoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApprovalRecord> approvalRecords = new ArrayList<>();
    
    @OneToMany(mappedBy = "changePoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImplementationRecord> implementationRecords = new ArrayList<>();
    
    @OneToMany(mappedBy = "changePoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VerificationRecord> verificationRecords = new ArrayList<>();
    
    @OneToMany(mappedBy = "changePoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Traceability> traceabilities = new ArrayList<>();
}

/**
 * 影响分析实体类
 */
@Data
@Entity
@Table(name = "cp_impact_analysis")
public class ImpactAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analysis_id")
    private Long analysisId;
    
    @Column(name = "change_id", nullable = false)
    private Long changeId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "impact_type", nullable = false)
    private ImpactType impactType; // QUALITY, COST, DELIVERY, SAFETY, ENVIRONMENT
    
    @Column(name = "impact_description", columnDefinition = "TEXT")
    private String impactDescription;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private Severity severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Enumerated(EnumType.STRING)
    @Column(name = "probability")
    private Probability probability; // RARE, OCCASIONAL, FREQUENT, CERTAIN
    
    @Column(name = "risk_score")
    private Integer riskScore;
    
    @Column(name = "mitigation_measures", columnDefinition = "TEXT")
    private String mitigationMeasures;
    
    @Column(name = "responsible_person_id")
    private Long responsiblePersonId;
    
    @Column(name = "target_date")
    private LocalDate targetDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AnalysisStatus status; // OPEN, IN_PROGRESS, CLOSED
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    // 关联关系
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_id", insertable = false, updatable = false)
    private ChangePoint changePoint;
}
```

#### 1.3.2 服务层 (Service)

```java
/**
 * 变化点服务接口
 */
public interface ChangePointService {
    
    /**
     * 创建变化点草稿
     */
    ChangePointDTO createChangePointDraft(ChangePointCreateDTO dto);
    
    /**
     * 提交审批
     */
    ChangePointDTO submitForApproval(Long changeId);
    
    /**
     * 审批变化点
     */
    ChangePointDTO approveChangePoint(Long changeId, ApprovalDTO dto);
    
    /**
     * 创建影响分析
     */
    ImpactAnalysisDTO createImpactAnalysis(Long changeId, ImpactAnalysisCreateDTO dto);
    
    /**
     * 计算风险评分
     */
    RiskAssessmentResult calculateRiskScore(Long changeId);
    
    /**
     * 制定实施计划
     */
    ChangePointDTO createImplementationPlan(Long changeId, ImplementationPlanCreateDTO dto);
    
    /**
     * 实施变更
     */
    ChangePointDTO implementChange(Long changeId, Long implementationId, ImplementationDTO dto);
    
    /**
     * 质量验证
     */
    ChangePointDTO verifyChange(Long changeId, VerificationDTO dto);
    
    /**
     * 关闭变更
     */
    ChangePointDTO closeChange(Long changeId);
    
    /**
     * 查询变化点详情
     */
    ChangePointDetailDTO getChangePointDetail(Long changeId);
    
    /**
     * 查询变化点列表
     */
    PageResult<ChangePointDTO> searchChangePoints(ChangePointQueryDTO queryDTO);
    
    /**
     * 添加追溯信息
     */
    TraceabilityDTO addTraceability(Long changeId, TraceabilityCreateDTO dto);
}

/**
 * 变化点服务实现类
 */
@Service
@Transactional
@Slf4j
public class ChangePointServiceImpl implements ChangePointService {
    
    @Autowired
    private ChangePointRepository changePointRepository;
    
    @Autowired
    private ImpactAnalysisRepository impactAnalysisRepository;
    
    @Autowired
    private ApprovalRecordRepository approvalRecordRepository;
    
    @Autowired
    private ApprovalWorkflowService approvalWorkflowService;
    
    @Autowired
    private RiskAssessmentService riskAssessmentService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private TraceabilityService traceabilityService;
    
    /**
     * 创建变化点草稿
     */
    @Override
    public ChangePointDTO createChangePointDraft(ChangePointCreateDTO dto) {
        log.info("创建变化点草稿,请求人: {}", SecurityUtils.getCurrentUserId());
        
        // 1. 数据验证
        validateChangePointData(dto);
        
        // 2. 生成变化点编号
        String changeNumber = generateChangeNumber();
        
        // 3. 创建变化点实体
        ChangePoint changePoint = new ChangePoint();
        BeanUtils.copyProperties(dto, changePoint);
        changePoint.setChangeNumber(changeNumber);
        changePoint.setRequesterId(SecurityUtils.getCurrentUserId());
        changePoint.setRequestDate(LocalDateTime.now());
        changePoint.setChangeStatus(ChangeStatus.DRAFT);
        changePoint.setStatus(RecordStatus.ACTIVE);
        changePoint.setCreatedBy(SecurityUtils.getCurrentUserId());
        changePoint.setCreatedTime(LocalDateTime.now());
        
        // 4. 初步判断变更类别
        ChangeCategory category = determineInitialCategory(dto);
        changePoint.setChangeCategory(category);
        
        // 5. 保存变化点
        changePoint = changePointRepository.save(changePoint);
        
        log.info("变化点草稿创建成功,变化点编号: {}", changeNumber);
        
        // 6. 创建DTO返回
        return convertToDTO(changePoint);
    }
    
    /**
     * 提交审批
     */
    @Override
    public ChangePointDTO submitForApproval(Long changeId) {
        log.info("提交变化点审批,变化点ID: {}", changeId);
        
        // 1. 查询变化点
        ChangePoint changePoint = getChangePointById(changeId);
        
        // 2. 验证状态
        if (changePoint.getChangeStatus() != ChangeStatus.DRAFT) {
            throw new BusinessException("只有草稿状态的变化点才能提交审批");
        }
        
        // 3. 验证必填字段
        validateRequiredFieldsForApproval(changePoint);
        
        // 4. 更新状态
        changePoint.setChangeStatus(ChangeStatus.PENDING_APPROVAL);
        changePoint.setUpdatedBy(SecurityUtils.getCurrentUserId());
        changePoint.setUpdatedTime(LocalDateTime.now());
        changePointRepository.save(changePoint);
        
        // 5. 启动审批流程
        approvalWorkflowService.startApprovalProcess(changePoint);
        
        // 6. 发送通知
        sendApprovalNotification(changePoint);
        
        log.info("变化点提交审批成功,变化点编号: {}", changePoint.getChangeNumber());
        
        return convertToDTO(changePoint);
    }
    
    /**
     * 审批变化点
     */
    @Override
    public ChangePointDTO approveChangePoint(Long changeId, ApprovalDTO dto) {
        log.info("审批变化点,变化点ID: {}, 审批结果: {}", changeId, dto.getApprovalDecision());
        
        // 1. 查询变化点
        ChangePoint changePoint = getChangePointById(changeId);
        
        // 2. 验证状态
        if (changePoint.getChangeStatus() != ChangeStatus.PENDING_APPROVAL) {
            throw new BusinessException("只有待审批状态的变化点才能审批");
        }
        
        // 3. 验证审批权限
        validateApprovalPermission(changePoint);
        
        // 4. 记录审批记录
        ApprovalRecord approvalRecord = createApprovalRecord(changePoint, dto);
        approvalRecordRepository.save(approvalRecord);
        
        // 5. 根据审批结果处理
        if (ApprovalDecision.APPROVED == dto.getApprovalDecision()) {
            handleApprovalSuccess(changePoint, approvalRecord);
        } else {
            handleApprovalRejection(changePoint, approvalRecord);
        }
        
        changePointRepository.save(changePoint);
        
        log.info("变化点审批完成,变化点编号: {}, 审批结果: {}", 
            changePoint.getChangeNumber(), changePoint.getChangeStatus());
        
        return convertToDTO(changePoint);
    }
    
    /**
     * 处理审批通过
     */
    private void handleApprovalSuccess(ChangePoint changePoint, ApprovalRecord approvalRecord) {
        log.info("变化点审批通过,变化点编号: {}", changePoint.getChangeNumber());
        
        // 检查是否为最后一个审批节点
        boolean isLastNode = approvalWorkflowService.isLastApprovalNode(
            changePoint.getChangeId(), 
            approvalRecord.getApprovalNode()
        );
        
        if (isLastNode) {
            // 所有审批节点都通过,更新状态为已批准
            changePoint.setChangeStatus(ChangeStatus.APPROVED);
            changePoint.setApprovalLevel(approvalRecord.getApprovalNode());
            
            // 发送实施准备通知
            sendImplementationPreparationNotification(changePoint);
            
            // 如果需要追溯,自动创建追溯记录
            if (requiresTraceability(changePoint)) {
                createAutomaticTraceability(changePoint);
            }
        } else {
            // 进入下一个审批节点
            approvalWorkflowService.moveToNextNode(changePoint);
            
            // 发送下一级审批通知
            sendNextApprovalNotification(changePoint);
        }
    }
    
    /**
     * 处理审批拒绝
     */
    private void handleApprovalRejection(ChangePoint changePoint, ApprovalRecord approvalRecord) {
        log.info("变化点审批拒绝,变化点编号: {}, 拒绝原因: {}", 
            changePoint.getChangeNumber(), approvalRecord.getApprovalComment());
        
        // 更新状态
        changePoint.setChangeStatus(ChangeStatus.REJECTED);
        changePoint.setRejectionReason(approvalRecord.getApprovalComment());
        
        // 停止审批流程
        approvalWorkflowService.terminateApprovalProcess(changePoint.getChangeId());
        
        // 发送拒绝通知
        sendRejectionNotification(changePoint, approvalRecord);
    }
    
    /**
     * 创建影响分析
     */
    @Override
    public ImpactAnalysisDTO createImpactAnalysis(Long changeId, ImpactAnalysisCreateDTO dto) {
        log.info("创建影响分析,变化点ID: {}, 影响类型: {}", changeId, dto.getImpactType());
        
        // 1. 查询变化点
        ChangePoint changePoint = getChangePointById(changeId);
        
        // 2. 验证状态
        if (changePoint.getChangeStatus() != ChangeStatus.APPROVED) {
            throw new BusinessException("只有已批准的变化点才能创建影响分析");
        }
        
        // 3. 创建影响分析实体
        ImpactAnalysis analysis = new ImpactAnalysis();
        BeanUtils.copyProperties(dto, analysis);
        analysis.setChangeId(changeId);
        analysis.setStatus(AnalysisStatus.OPEN);
        analysis.setCreatedTime(LocalDateTime.now());
        
        // 4. 计算风险评分
        analysis.setRiskScore(calculateRiskScore(dto.getSeverity(), dto.getProbability()));
        
        // 5. 保存影响分析
        analysis = impactAnalysisRepository.save(analysis);
        
        log.info("影响分析创建成功,分析ID: {}, 风险评分: {}", 
            analysis.getAnalysisId(), analysis.getRiskScore());
        
        // 6. 重新计算整体风险等级
        riskAssessmentService.updateOverallRiskLevel(changeId);
        
        return convertToAnalysisDTO(analysis);
    }
    
    /**
     * 计算风险评分
     */
    private Integer calculateRiskScore(Severity severity, Probability probability) {
        int severityScore = getSeverityScore(severity);
        int probabilityScore = getProbabilityScore(probability);
        return severityScore * probabilityScore;
    }
    
    /**
     * 获取严重性评分
     */
    private int getSeverityScore(Severity severity) {
        switch (severity) {
            case LOW: return 1;
            case MEDIUM: return 2;
            case HIGH: return 3;
            case CRITICAL: return 4;
            default: return 1;
        }
    }
    
    /**
     * 获取概率评分
     */
    private int getProbabilityScore(Probability probability) {
        switch (probability) {
            case RARE: return 1;
            case OCCASIONAL: return 2;
            case FREQUENT: return 3;
            case CERTAIN: return 4;
            default: return 1;
        }
    }
    
    /**
     * 实施变更
     */
    @Override
    public ChangePointDTO implementChange(Long changeId, Long implementationId, ImplementationDTO dto) {
        log.info("实施变更,变化点ID: {}, 实施ID: {}", changeId, implementationId);
        
        // 1. 查询变化点
        ChangePoint changePoint = getChangePointById(changeId);
        
        // 2. 验证状态
        if (changePoint.getChangeStatus() != ChangeStatus.APPROVED) {
            throw new BusinessException("只有已批准的变化点才能实施");
        }
        
        // 3. 查询实施记录
        ImplementationRecord record = getImplementationRecordById(implementationId);
        
        // 4. 更新实施记录
        BeanUtils.copyProperties(dto, record);
        record.setImplementationStatus(ImplementationStatus.COMPLETED);
        record.setActualDate(dto.getActualDate() != null ? dto.getActualDate() : LocalDate.now());
        record.setUpdatedTime(LocalDateTime.now());
        
        // 5. 检查所有实施步骤是否都完成
        List<ImplementationRecord> allRecords = changePoint.getImplementationRecords();
        boolean allCompleted = allRecords.stream()
            .allMatch(r -> r.getImplementationStatus() == ImplementationStatus.COMPLETED);
        
        if (allCompleted) {
            // 所有实施步骤完成,更新变化点状态
            changePoint.setChangeStatus(ChangeStatus.IMPLEMENTED);
            changePoint.setImplementedDate(LocalDateTime.now());
            
            // 发送验证通知
            sendVerificationNotification(changePoint);
        }
        
        changePointRepository.save(changePoint);
        implementationRecordRepository.save(record);
        
        log.info("变更实施完成,变化点编号: {}", changePoint.getChangeNumber());
        
        return convertToDTO(changePoint);
    }
    
    /**
     * 质量验证
     */
    @Override
    public ChangePointDTO verifyChange(Long changeId, VerificationDTO dto) {
        log.info("质量验证,变化点ID: {}, 验证结果: {}", changeId, dto.getVerificationResult());
        
        // 1. 查询变化点
        ChangePoint changePoint = getChangePointById(changeId);
        
        // 2. 验证状态
        if (changePoint.getChangeStatus() != ChangeStatus.IMPLEMENTED) {
            throw new BusinessException("只有已实施的变化点才能验证");
        }
        
        // 3. 创建验证记录
        VerificationRecord record = new VerificationRecord();
        BeanUtils.copyProperties(dto, record);
        record.setChangeId(changeId);
        record.setVerificationDate(LocalDateTime.now());
        record.setInspectorId(SecurityUtils.getCurrentUserId());
        record.setCreatedTime(LocalDateTime.now());
        
        verificationRecordRepository.save(record);
        
        // 4. 根据验证结果处理
        if (VerificationResult.PASS == dto.getVerificationResult()) {
            // 验证通过,关闭变更
            changePoint.setVerificationResult(VerificationResult.PASS);
            changePoint.setVerifiedDate(LocalDateTime.now());
            changePoint.setEffectivenessDate(LocalDate.now());
            
            log.info("变更验证通过,自动关闭变更,变化点编号: {}", changePoint.getChangeNumber());
            
        } else if (VerificationResult.FAIL == dto.getVerificationResult()) {
            // 验证失败,启动CAPA流程
            changePoint.setVerificationResult(VerificationResult.FAIL);
            changePoint.setVerifiedDate(LocalDateTime.now());
            
            log.info("变更验证失败,启动CAPA流程,变化点编号: {}", changePoint.getChangeNumber());
            
            // 创建CAPA
            createCAPAForFailedVerification(changePoint, dto);
            
        } else {
            // 有条件通过
            changePoint.setVerificationResult(VerificationResult.CONDITIONAL_PASS);
            changePoint.setVerifiedDate(LocalDateTime.now());
            changePoint.setEffectivenessDate(LocalDate.now());
            
            log.info("变更有条件通过,需要附加验证,变化点编号: {}", changePoint.getChangeNumber());
        }
        
        changePointRepository.save(changePoint);
        
        return convertToDTO(changePoint);
    }
    
    /**
     * 为验证失败的变化点创建CAPA
     */
    private void createCAPAForFailedVerification(ChangePoint changePoint, VerificationDTO dto) {
        log.info("为验证失败的变化点创建CAPA,变化点编号: {}", changePoint.getChangeNumber());
        
        // 构建CAPA创建DTO
        CAPACreateDTO capaDto = new CAPACreateDTO();
        capaDto.setCapaType(CAPAType.CORRECTIVE);
        capaDto.setSourceType(CAPASourceType.CHANGE_POINT_VERIFICATION);
        capaDto.setSourceId(changePoint.getChangeId());
        capaDto.setSourceNumber(changePoint.getChangeNumber());
        capaDto.setProblemDescription(
            String.format("变化点验证失败: %s, 验证结果: %s", 
                changePoint.getChangeTitle(), dto.getVerificationResult())
        );
        capaDto.setProblemCategory("CHANGE_VERIFICATION");
        capaDto.setSeverity(changePoint.getRiskLevel().name());
        capaDto.setPriority("HIGH");
        
        // 调用CAPA服务创建CAPA
        capaService.createCAPA(capaDto);
        
        // 发送CAPA创建通知
        sendCAPACreatedNotification(changePoint);
    }
    
    // ... 其他方法实现
}
```

### 1.4 风险评估算法

```java
/**
 * 风险评估服务
 */
@Service
@Slf4j
public class RiskAssessmentServiceImpl implements RiskAssessmentService {
    
    /**
     * 计算整体风险等级
     */
    @Override
    public RiskLevel calculateOverallRiskLevel(Long changeId) {
        log.info("计算整体风险等级,变化点ID: {}", changeId);
        
        // 1. 获取所有影响分析
        List<ImpactAnalysis> analyses = impactAnalysisRepository.findByChangeId(changeId);
        
        if (analyses.isEmpty()) {
            return RiskLevel.LOW;
        }
        
        // 2. 计算加权风险评分
        double totalWeightedScore = 0.0;
        double totalWeight = 0.0;
        
        for (ImpactAnalysis analysis : analyses) {
            double weight = getImpactTypeWeight(analysis.getImpactType());
            totalWeightedScore += analysis.getRiskScore() * weight;
            totalWeight += weight;
        }
        
        double averageScore = totalWeight / totalWeight;
        
        // 3. 根据评分确定风险等级
        RiskLevel riskLevel = determineRiskLevel(averageScore);
        
        log.info("整体风险等级计算完成,变化点ID: {}, 风险等级: {}, 平均评分: {}", 
            changeId, riskLevel, averageScore);
        
        return riskLevel;
    }
    
    /**
     * 获取影响类型权重
     */
    private double getImpactTypeWeight(ImpactType impactType) {
        switch (impactType) {
            case QUALITY: return 3.0;      // 质量影响权重最高
            case SAFETY: return 4.0;       // 安全影响权重更高
            case COST: return 2.0;
            case DELIVERY: return 1.5;
            case ENVIRONMENT: return 2.5;
            default: return 1.0;
        }
    }
    
    /**
     * 根据评分确定风险等级
     */
    private RiskLevel determineRiskLevel(double score) {
        if (score >= 16) {
            return RiskLevel.CRITICAL;   // 16分以上 (4×4)
        } else if (score >= 9) {
            return RiskLevel.HIGH;        // 9-15分
        } else if (score >= 4) {
            return RiskLevel.MEDIUM;      // 4-8分
        } else {
            return RiskLevel.LOW;         // 1-3分
        }
    }
    
    /**
     * 风险矩阵可视化
     */
    public RiskMatrixVisualizer createRiskMatrix(Long changeId) {
        List<ImpactAnalysis> analyses = impactAnalysisRepository.findByChangeId(changeId);
        
        RiskMatrixVisualizer matrix = new RiskMatrixVisualizer();
        
        for (ImpactAnalysis analysis : analyses) {
            int severity = getSeverityScore(analysis.getSeverity());
            int probability = getProbabilityScore(analysis.getProbability());
            
            matrix.addPoint(
                analysis.getImpactType(),
                severity,
                probability,
                analysis.getRiskScore()
            );
        }
        
        return matrix;
    }
}
```

### 1.5 审批工作流引擎

```java
/**
 * 审批工作流服务
 */
@Service
@Slf4j
public class ApprovalWorkflowServiceImpl implements ApprovalWorkflowService {
    
    // 变更类别对应的审批路径
    private static final Map<ChangeCategory, List<String>> APPROVAL_PATHS = Map.of(
        ChangeCategory.MINOR, List.of("DEPT_MANAGER"),
        ChangeCategory.MODERATE, List.of("DEPT_MANAGER", "QUALITY_MANAGER"),
        ChangeCategory.MAJOR, List.of("DEPT_MANAGER", "QUALITY_MANAGER", "DIRECTOR"),
        ChangeCategory.CRITICAL, List.of("DEPT_MANAGER", "QUALITY_MANAGER", "DIRECTOR", "GENERAL_MANAGER")
    );
    
    /**
     * 启动审批流程
     */
    @Override
    public void startApprovalProcess(ChangePoint changePoint) {
        log.info("启动审批流程,变化点编号: {}, 变更类别: {}", 
            changePoint.getChangeNumber(), changePoint.getChangeCategory());
        
        // 1. 获取审批路径
        List<String> approvalPath = APPROVAL_PATHS.get(changePoint.getChangeCategory());
        if (approvalPath == null) {
            approvalPath = APPROVAL_PATHS.get(ChangeCategory.MODERATE);
        }
        
        // 2. 创建第一条审批记录
        ApprovalRecord firstRecord = createFirstApprovalRecord(changePoint, approvalPath.get(0));
        approvalRecordRepository.save(firstRecord);
        
        // 3. 发送审批通知
        sendApprovalNotification(changePoint, firstRecord);
        
        log.info("审批流程启动成功,首节点: {}", firstRecord.getApprovalNode());
    }
    
    /**
     * 创建第一条审批记录
     */
    private ApprovalRecord createFirstApprovalRecord(ChangePoint changePoint, String firstNode) {
        ApprovalRecord record = new ApprovalRecord();
        record.setChangeId(changePoint.getChangeId());
        record.setApprovalNode(firstNode);
        record.setApprovalRole(getRoleForNode(firstNode));
        record.setApprovalStatus(ApprovalStatus.PENDING);
        record.setApprovalLevel(1);
        record.setCreatedTime(LocalDateTime.now());
        return record;
    }
    
    /**
     * 移动到下一个审批节点
     */
    @Override
    public void moveToNextNode(ChangePoint changePoint) {
        log.info("移动到下一个审批节点,变化点编号: {}", changePoint.getChangeNumber());
        
        // 1. 获取审批路径
        List<String> approvalPath = APPROVAL_PATHS.get(changePoint.getChangeCategory());
        
        // 2. 获取当前审批记录
        List<ApprovalRecord> records = approvalRecordRepository
            .findByChangeIdOrderByApprovalLevelAsc(changePoint.getChangeId());
        
        int currentLevel = records.size();
        
        // 3. 检查是否还有下一个节点
        if (currentLevel >= approvalPath.size()) {
            throw new BusinessException("没有更多的审批节点");
        }
        
        // 4. 创建下一节点审批记录
        ApprovalRecord nextRecord = new ApprovalRecord();
        nextRecord.setChangeId(changePoint.getChangeId());
        nextRecord.setApprovalNode(approvalPath.get(currentLevel));
        nextRecord.setApprovalRole(getRoleForNode(approvalPath.get(currentLevel)));
        nextRecord.setApprovalStatus(ApprovalStatus.PENDING);
        nextRecord.setApprovalLevel(currentLevel + 1);
        nextRecord.setCreatedTime(LocalDateTime.now());
        approvalRecordRepository.save(nextRecord);
        
        // 5. 发送审批通知
        sendApprovalNotification(changePoint, nextRecord);
        
        log.info("已移动到下一个审批节点: {}", nextRecord.getApprovalNode());
    }
    
    /**
     * 判断是否为最后一个审批节点
     */
    @Override
    public boolean isLastApprovalNode(Long changeId, String approvalNode) {
        List<String> approvalPath = getApprovalPathForChange(changeId);
        int lastIndex = approvalPath.size() - 1;
        return approvalNode.equals(approvalPath.get(lastIndex));
    }
    
    /**
     * 终止审批流程
     */
    @Override
    public void terminateApprovalProcess(Long changeId) {
        log.info("终止审批流程,变化点ID: {}", changeId);
        
        // 将所有待审批的记录标记为跳过
        List<ApprovalRecord> pendingRecords = approvalRecordRepository
            .findByChangeIdAndApprovalStatus(changeId, ApprovalStatus.PENDING);
        
        for (ApprovalRecord record : pendingRecords) {
            record.setApprovalStatus(ApprovalStatus.SKIPPED);
            record.setApprovalTime(LocalDateTime.now());
            approvalRecordRepository.save(record);
        }
        
        log.info("审批流程已终止,跳过 {} 个待审批节点", pendingRecords.size());
    }
}
```

---

## 2. CAPA管理模块详细实现

### 2.1 CAPA业务流程设计

```
┌─────────────────────────────────────────────────────────────────┐
│  CAPA完整生命周期管理流程                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ CAPA创建 │───▶│ 问题识别  │───▶│ 根本原因  │                   │
│  └──────────┘    └──────────┘    └────┬─────┘                   │
│                                       │                          │
│                          ┌────────────┴────────────┐            │
│                          ▼                         ▼            │
│                   ┌──────────┐              ┌──────────┐          │
│                   │ 5Why分析 │              │ 鱼骨图分析 │          │
│                   └────┬─────┘              └────┬─────┘          │
│                        │                        │                │
│                        └──────────┬─────────────┘                │
│                                   ▼                              │
│                            ┌──────────┐                          │
│                            │ 制定措施  │                          │
│                            └────┬─────┘                          │
│                   ┌────────────┴────────────┐                    │
│                   ▼                         ▼                    │
│            ┌──────────┐              ┌──────────┐               │
│            │ 纠正措施 │              │ 预防措施 │               │
│            └────┬─────┘              └────┬─────┘               │
│                 │                        │                      │
│                 └──────────┬─────────────┘                      │
│                            ▼                                     │
│                      ┌──────────┐                                │
│                      │ 任务分配  │                                │
│                      └────┬─────┘                                │
│                           ▼                                       │
│                     ┌──────────┐                                 │
│                     │ 措施实施  │                                 │
│                     └────┬─────┘                                 │
│                          │                                        │
│                   ┌──────┴──────┐                               │
│                   ▼             ▼                               │
│            ┌──────────┐   ┌──────────┐                         │
│            │ 实施完成  │   │ 实施失败  │                         │
│            └────┬─────┘   └────┬─────┘                         │
│                 │              │                                 │
│                 ▼              ▼                                 │
│           ┌──────────┐   ┌──────────┐                          │
│           │ 效果验证  │   │ CAPA重启  │                          │
│           └────┬─────┘   └──────────┘                          │
│                │                                                │
│         ┌──────┴──────┐                                          │
│         ▼             ▼                                          │
│  ┌──────────┐  ┌──────────┐                                     │
│  │ 验证通过  │  │ 验证失败  │                                     │
│  └────┬─────┘  └────┬─────┘                                     │
│       │             │                                           │
│       ▼             ▼                                           │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ CAPA关闭  │  │ 再次CAPA │                                    │
│  └──────────┘  └──────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 5Why分析实现

```java
/**
 * 5Why分析服务
 */
@Service
@Slf4j
public class FiveWhyAnalysisServiceImpl implements FiveWhyAnalysisService {
    
    /**
     * 创建5Why分析
     */
    @Override
    public FiveWhyAnalysisDTO createAnalysis(Long capaId, FiveWhyAnalysisCreateDTO dto) {
        log.info("创建5Why分析,CAPA ID: {}", capaId);
        
        // 1. 验证CAPA状态
        CAPA capa = getCAPAById(capaId);
        validateCAPAStatusForAnalysis(capa);
        
        // 2. 验证5Why数据
        validateFiveWhyData(dto);
        
        // 3. 保存5Why分析
        List<FiveWhyAnalysis> analyses = new ArrayList<>();
        for (FiveWhyItemDTO item : dto.getAnalyses()) {
            FiveWhyAnalysis analysis = new FiveWhyAnalysis();
            analysis.setCapaId(capaId);
            analysis.setAnalysisOrder(item.getAnalysisOrder());
            analysis.setQuestion(item.getQuestion());
            analysis.setAnswer(item.getAnswer());
            analysis.setVerificationMethod(item.getVerificationMethod());
            analysis.setIsRootCause(item.getIsRootCause());
            analysis.setCreatedTime(LocalDateTime.now());
            analyses.add(analysis);
        }
        
        fiveWhyAnalysisRepository.saveAll(analyses);
        
        // 4. 检查是否识别出根本原因
        boolean rootCauseIdentified = analyses.stream()
            .anyMatch(FiveWhyAnalysis::getIsRootCause);
        
        if (rootCauseIdentified) {
            // 更新CAPA根本原因
            updateCAPARootCause(capa, analyses);
        }
        
        log.info("5Why分析创建成功,CAPA ID: {}, 是否识别根本原因: {}", 
            capaId, rootCauseIdentified);
        
        return convertToDTO(analyses);
    }
    
    /**
     * 验证5Why数据
     */
    private void validateFiveWhyData(FiveWhyAnalysisCreateDTO dto) {
        List<FiveWhyItemDTO> analyses = dto.getAnalyses();
        
        // 验证至少3个Why
        if (analyses.size() < 3) {
            throw new BusinessException("5Why分析至少需要3个Why");
        }
        
        // 验证顺序
        Set<Integer> orders = analyses.stream()
            .map(FiveWhyItemDTO::getAnalysisOrder)
            .collect(Collectors.toSet());
        
        if (orders.size() != analyses.size()) {
            throw new BusinessException("5Why分析顺序不能重复");
        }
        
        // 验证问题与答案的连贯性
        validateLogicalConnection(analyses);
    }
    
    /**
     * 验证逻辑连贯性
     */
    private void validateLogicalConnection(List<FiveWhyItemDTO> analyses) {
        analyses.sort(Comparator.comparing(FiveWhyItemDTO::getAnalysisOrder));
        
        for (int i = 0; i < analyses.size() - 1; i++) {
            String currentAnswer = analyses.get(i).getAnswer();
            String nextQuestion = analyses.get(i + 1).getQuestion();
            
            // 检查下一个问题是否基于上一个答案
            if (!isQuestionBasedOnAnswer(currentAnswer, nextQuestion)) {
                log.warn("5Why分析逻辑不连贯: Answer[{}]: {}, Question[{}]: {}", 
                    i, currentAnswer, i + 1, nextQuestion);
                // 不强制要求,只是警告
            }
        }
    }
    
    /**
     * 智能根本原因识别助手
     */
    @Override
    public RootCauseSuggestion suggestRootCause(Long capaId) {
        log.info("智能根本原因识别,CAPA ID: {}", capaId);
        
        CAPA capa = getCAPAById(capaId);
        
        RootCauseSuggestion suggestion = new RootCauseSuggestion();
        
        // 1. 基于问题类别推荐
        List<String> categoryBasedSuggestions = suggestByProblemCategory(capa);
        suggestion.setCategoryBasedSuggestions(categoryBasedSuggestions);
        
        // 2. 基于历史数据推荐
        List<String> historyBasedSuggestions = suggestByHistory(capa);
        suggestion.setHistoryBasedSuggestions(historyBasedSuggestions);
        
        // 3. 基于5Why分析生成
        List<FiveWhyAnalysis> analyses = fiveWhyAnalysisRepository.findByCapaId(capaId);
        if (!analyses.isEmpty()) {
            List<String> fiveWhyBasedSuggestions = generateFromFiveWhy(analyses);
            suggestion.setFiveWhyBasedSuggestions(fiveWhyBasedSuggestions);
        }
        
        // 4. 综合推荐
        String comprehensiveSuggestion = generateComprehensiveSuggestion(suggestion);
        suggestion.setComprehensiveSuggestion(comprehensiveSuggestion);
        
        return suggestion;
    }
    
    /**
     * 基于历史数据推荐
     */
    private List<String> suggestByHistory(CAPA capa) {
        List<String> suggestions = new ArrayList<>();
        
        // 查询相似CAPA
        List<CAPA> similarCAPAs = capaRepository
            .findByProblemCategoryAndCapaStatus(
                capa.getProblemCategory(), 
                CAPAStatus.CLOSED
            );
        
        if (similarCAPAs.isEmpty()) {
            return suggestions;
        }
        
        // 分析相似CAPA的根本原因
        Map<String, Long> rootCauseFrequency = similarCAPAs.stream()
            .flatMap(c -> fiveWhyAnalysisRepository
                .findByCapaId(c.getCapaId()).stream()
                .filter(FiveWhyAnalysis::getIsRootCause))
            .collect(Collectors.groupingBy(
                FiveWhyAnalysis::getAnswer,
                Collectors.counting()
            ));
        
        // 按频率排序
        rootCauseFrequency.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(5)
            .forEach(entry -> {
                suggestions.add(String.format("历史相似案例: %s (出现%d次)", 
                    entry.getKey(), entry.getValue()));
            });
        
        return suggestions;
    }
}
```

### 2.3 鱼骨图分析实现

```java
/**
 * 鱼骨图分析服务
 */
@Service
@Slf4j
public class FishboneAnalysisServiceImpl implements FishboneAnalysisService {
    
    // 鱼骨图6大类
    private static final List<String> FISHBONE_CATEGORIES = List.of(
        "MAN",      // 人
        "MACHINE",  // 机
        "MATERIAL", // 料
        "METHOD",   // 法
        "MEASUREMENT", // 测
        "ENVIRONMENT"  // 环
    );
    
    /**
     * 创建鱼骨图分析
     */
    @Override
    public FishboneAnalysisDTO createAnalysis(Long capaId, FishboneAnalysisCreateDTO dto) {
        log.info("创建鱼骨图分析,CAPA ID: {}", capaId);
        
        // 1. 验证CAPA状态
        CAPA capa = getCAPAById(capaId);
        validateCAPAStatusForAnalysis(capa);
        
        // 2. 验证鱼骨图类别
        validateFishboneCategories(dto.getFactors());
        
        // 3. 保存鱼骨图分析
        List<FishboneAnalysis> analyses = new ArrayList<>();
        for (FishboneFactorDTO factor : dto.getFactors()) {
            FishboneAnalysis analysis = new FishboneAnalysis();
            analysis.setCapaId(capaId);
            analysis.setCategory(factor.getCategory());
            analysis.setFactor(factor.getFactor());
            analysis.setSubFactors(factor.getSubFactors());
            analysis.setIsContributingFactor(factor.getIsContributingFactor());
            analysis.setCreatedTime(LocalDateTime.now());
            analyses.add(analysis);
        }
        
        fishboneAnalysisRepository.saveAll(analyses);
        
        log.info("鱼骨图分析创建成功,CAPA ID: {}, 因素数量: {}", 
            capaId, analyses.size());
        
        return convertToDTO(analyses);
    }
    
    /**
     * 生成鱼骨图可视化数据
     */
    @Override
    public FishboneVisualizationDTO generateVisualization(Long capaId) {
        log.info("生成鱼骨图可视化数据,CAPA ID: {}", capaId);
        
        List<FishboneAnalysis> analyses = fishboneAnalysisRepository.findByCapaId(capaId);
        
        FishboneVisualizationDTO visualization = new FishboneVisualizationDTO();
        
        // 按类别分组
        Map<String, List<FishboneAnalysis>> groupedByCategory = analyses.stream()
            .collect(Collectors.groupingBy(FishboneAnalysis::getCategory));
        
        // 构建可视化数据
        List<FishboneBranchDTO> branches = new ArrayList<>();
        for (String category : FISHBONE_CATEGORIES) {
            List<FishboneAnalysis> categoryAnalyses = groupedByCategory.getOrDefault(category, List.of());
            
            if (!categoryAnalyses.isEmpty()) {
                FishboneBranchDTO branch = new FishboneBranchDTO();
                branch.setCategory(category);
                branch.setCategoryName(getCategoryDisplayName(category));
                branch.setFactorCount(categoryAnalyses.size());
                branch.setContributingFactorCount(
                    (int) categoryAnalyses.stream()
                        .filter(FishboneAnalysis::getIsContributingFactor)
                        .count()
                );
                branch.setFactors(categoryAnalyses.stream()
                    .map(this::convertToFactorDTO)
                    .collect(Collectors.toList())
                );
                branches.add(branch);
            }
        }
        
        visualization.setBranches(branches);
        visualization.setTotalFactorCount(analyses.size());
        visualization.setContributingFactorCount(
            (int) analyses.stream()
                .filter(FishboneAnalysis::getIsContributingFactor)
                .count()
        );
        
        return visualization;
    }
    
    /**
     * 鱼骨图因素自动识别
     */
    @Override
    public List<FishboneFactorSuggestion> autoIdentifyFactors(Long capaId) {
        log.info("鱼骨图因素自动识别,CAPA ID: {}", capaId);
        
        CAPA capa = getCAPAById(capaId);
        List<FishboneFactorSuggestion> suggestions = new ArrayList<>();
        
        // 1. 基于问题描述识别
        List<FishboneFactorSuggestion> fromDescription = 
            identifyFactorsFromDescription(capa.getProblemDescription());
        suggestions.addAll(fromDescription);
        
        // 2. 基于历史案例识别
        List<FishboneFactorSuggestion> fromHistory = 
            identifyFactorsFromHistory(capa.getProblemCategory());
        suggestions.addAll(fromHistory);
        
        // 3. 去重和排序
        suggestions = deduplicateAndSort(suggestions);
        
        return suggestions;
    }
    
    /**
     * 基于问题描述识别因素
     */
    private List<FishboneFactorSuggestion> identifyFactorsFromDescription(String description) {
        List<FishboneFactorSuggestion> suggestions = new ArrayList<>();
        
        // 关键词映射
        Map<String, List<String>> keywordMapping = Map.of(
            "MAN", List.of("操作员", "员工", "培训", "技能", "经验", "疲劳"),
            "MACHINE", List.of("设备", "机器", "故障", "维护", "保养", "老化"),
            "MATERIAL", List.of("材料", "物料", "原料", "质量", "规格", "批次"),
            "METHOD", List.of("工艺", "流程", "方法", "标准", "作业", "程序"),
            "MEASUREMENT", List.of("测量", "检测", "检验", "仪器", "工具", "标准"),
            "ENVIRONMENT", List.of("温度", "湿度", "环境", "照明", "噪音", "清洁")
        );
        
        // 关键词匹配
        for (Map.Entry<String, List<String>> entry : keywordMapping.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();
            
            for (String keyword : keywords) {
                if (description.contains(keyword)) {
                    FishboneFactorSuggestion suggestion = new FishboneFactorSuggestion();
                    suggestion.setCategory(category);
                    suggestion.setFactor(keyword + "相关因素");
                    suggestion.setSource("问题描述识别");
                    suggestion.setConfidence(0.7);
                    suggestions.add(suggestion);
                }
            }
        }
        
        return suggestions;
    }
}
```

---

## 3. QRQC快速响应模块详细实现

### 3.1 QRQC实时监控与告警

```java
/**
 * QRQC监控服务
 */
@Service
@Slf4j
public class QRQCMonitoringServiceImpl implements QRQCMonitoringService {
    
    /**
     * 24小时响应监控
     */
    @Scheduled(fixedDelay = 60000) // 每分钟执行
    public void monitor24HourResponse() {
        log.debug("开始监控24小时响应");
        
        // 1. 查询未完成24小时响应的事件
        List<QRQCEvent> events = qrqcEventRepository
            .findByQrqcStatusAndDetectionTimeAfter(
                QRQCStatus.OPEN, 
                LocalDateTime.now().minusHours(24)
            );
        
        for (QRQCEvent event : events) {
            monitorEvent(event);
        }
        
        log.debug("24小时响应监控完成,监控事件数: {}", events.size());
    }
    
    /**
     * 监控单个事件
     */
    private void monitorEvent(QRQCEvent event) {
        LocalDateTime detectionTime = event.getDetectionTime();
        long hoursElapsed = ChronoUnit.HOURS.between(detectionTime, LocalDateTime.now());
        
        // 检查各里程碑
        QRQC24hTracking tracking = get24hTracking(event.getEventId());
        
        // 1小时报告检查
        if (hoursElapsed >= 1 && !isMilestoneAchieved(tracking, "REPORTING_1H")) {
            sendWarningNotification(event, "1小时内未报告");
        }
        
        // 4小时团队组建检查
        if (hoursElapsed >= 4 && !isMilestoneAchieved(tracking, "TEAM_ASSEMBLY_4H")) {
            sendUrgentNotification(event, "4小时内未组建团队");
        }
        
        // 12小时调查检查
        if (hoursElapsed >= 12 && !isMilestoneAchieved(tracking, "INVESTIGATION_12H")) {
            sendUrgentNotification(event, "12小时内未完成调查");
        }
        
        // 24小时围堵检查
        if (hoursElapsed >= 24 && !isMilestoneAchieved(tracking, "CONTAINMENT_24H")) {
            sendCriticalNotification(event, "24小时内未完成围堵");
        }
    }
    
    /**
     * 质量异常自动识别
     */
    @Override
    public void detectQualityAnomalies() {
        log.debug("开始质量异常自动识别");
        
        // 1. 从InfluxDB查询SPC数据
        List<SPCControlPoint> recentPoints = queryRecentSPCPoints();
        
        // 2. 检测异常点
        for (SPCControlPoint point : recentPoints) {
            if (isAnomaly(point)) {
                // 创建QRQC事件
                createAutoQRQCEvent(point);
            }
        }
        
        log.debug("质量异常自动识别完成");
    }
    
    /**
     * 检测是否为异常点
     */
    private boolean isAnomaly(SPCControlPoint point) {
        // 1. 超出控制限
        if (isBeyondControlLimits(point)) {
            return true;
        }
        
        // 2. 连续异常模式检测
        if (hasPatternViolation(point)) {
            return true;
        }
        
        // 3. 趋势检测
        if (hasTrendViolation(point)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 超出控制限检测
     */
    private boolean isBeyondControlLimits(SPCControlPoint point) {
        double value = point.getMeasurementValue();
        double ucl = point.getUcl();
        double lcl = point.getLcl();
        
        if (point.getOutOfControl()) {
            return true; // 已标记为超控
        }
        
        // 检查是否超出3σ控制限
        return value > ucl || value < lcl;
    }
    
    /**
     * 连续异常模式检测
     */
    private boolean hasPatternViolation(SPCControlPoint point) {
        // 1. 连续6点递增或递减
        if (hasConsecutiveTrend(point, 6)) {
            return true;
        }
        
        // 2. 连续9点在中心线同一侧
        if (hasConsecutiveSide(point, 9)) {
            return true;
        }
        
        // 3. 14点交替上下
        if (hasAlternatingPattern(point, 14)) {
            return true;
        }
        
        // 4. 3点中有2点在A区
        if (hasTwoOfThreeInZoneA(point)) {
            return true;
        }
        
        // 5. 5点中有4点在B区
        if (hasFourOfFiveInZoneB(point)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 连续趋势检测
     */
    private boolean hasConsecutiveTrend(SPCControlPoint point, int count) {
        // 查询最近的控制点
        List<SPCControlPoint> recentPoints = spcControlPointRepository
            .findByCharacteristicIdAndTimestampBeforeOrderByTimestampDesc(
                point.getCharacteristicId(),
                point.getTimestamp()
            )
            .stream()
            .limit(count)
            .collect(Collectors.toList());
        
        if (recentPoints.size() < count) {
            return false;
        }
        
        // 检查是否全部递增或递减
        boolean increasing = true;
        boolean decreasing = true;
        
        for (int i = 0; i < count - 1; i++) {
            double current = recentPoints.get(i).getMeasurementValue();
            double next = recentPoints.get(i + 1).getMeasurementValue();
            
            if (current <= next) {
                decreasing = false;
            }
            if (current >= next) {
                increasing = false;
            }
        }
        
        return increasing || decreasing;
    }
    
    /**
     * 创建自动QRQC事件
     */
    private void createAutoQRQCEvent(SPCControlPoint point) {
        log.info("创建自动QRQC事件,控制点ID: {}", point.getControlPointId());
        
        QRQCCreateDTO dto = new QRQCCreateDTO();
        dto.setEventType("QUALITY_ANOMALY");
        dto.setSeverity(determineSeverity(point));
        dto.setDetectionTime(LocalDateTime.now());
        dto.setDetectionLocation(point.getProcessStep());
        dto.setDetectionPersonId(getAutoDetectionUserId());
        dto.setEventDescription(buildAutoDetectionDescription(point));
        dto.setAffectedProduct(point.getPartNumber());
        dto.setWorkOrderId(point.getWorkOrderId());
        dto.setProcessStep(point.getProcessStep());
        
        // 创建事件
        qrqcService.createEvent(dto);
        
        log.info("自动QRQC事件创建成功");
    }
}
```

### 3.2 QRQC团队智能组建

```java
/**
 * QRQC团队组建智能推荐服务
 */
@Service
@Slf4j
public class QRQCTeamRecommendationServiceImpl implements QRQCTeamRecommendationService {
    
    /**
     * 推荐QRQC团队成员
     */
    @Override
    public TeamRecommendation recommendTeam(Long eventId) {
        log.info("推荐QRQC团队成员,事件ID: {}", eventId);
        
        QRQCEvent event = getEventById(eventId);
        TeamRecommendation recommendation = new TeamRecommendation();
        
        // 1. 推荐团队负责人
        User leader = recommendLeader(event);
        recommendation.setLeader(convertToMemberDTO(leader, "LEADER", "团队负责人"));
        
        // 2. 推荐质量工程师
        List<User> qualityEngineers = recommendQualityEngineers(event);
        recommendation.setQualityMembers(
            qualityEngineers.stream()
                .limit(2)
                .map(u -> convertToMemberDTO(u, "QUALITY", "质量分析"))
                .collect(Collectors.toList())
        );
        
        // 3. 推荐工艺工程师
        List<User> processEngineers = recommendProcessEngineers(event);
        recommendation.setEngineeringMembers(
            processEngineers.stream()
                .limit(2)
                .map(u -> convertToMemberDTO(u, "ENGINEERING", "工艺支持"))
                .collect(Collectors.toList())
        );
        
        // 4. 推荐生产代表
        List<User> productionRepresentatives = recommendProductionRepresentatives(event);
        recommendation.setProductionMembers(
            productionRepresentatives.stream()
                .limit(2)
                .map(u -> convertToMemberDTO(u, "PRODUCTION", "生产协调"))
                .collect(Collectors.toList())
        );
        
        // 5. 推荐设备工程师 (如需要)
        if (requiresMaintenanceEngineer(event)) {
            User maintenanceEngineer = recommendMaintenanceEngineer(event);
            recommendation.setMaintenanceMember(
                convertToMemberDTO(maintenanceEngineer, "MAINTENANCE", "设备支持")
            );
        }
        
        return recommendation;
    }
    
    /**
     * 推荐团队负责人
     */
    private User recommendLeader(QRQCEvent event) {
        // 1. 优先选择质量经理
        User qualityManager = findUserByRoleAndDepartment(
            "QUALITY_MANAGER", 
            event.getDetectionDepartmentId()
        );
        if (qualityManager != null) {
            return qualityManager;
        }
        
        // 2. 选择质量工程师
        User qualityEngineer = findUserByRoleAndDepartment(
            "QUALITY_ENGINEER", 
            event.getDetectionDepartmentId()
        );
        if (qualityEngineer != null) {
            return qualityEngineer;
        }
        
        // 3. 选择部门负责人
        return findDepartmentHead(event.getDetectionDepartmentId());
    }
    
    /**
     * 推荐质量工程师
     */
    private List<User> recommendQualityEngineers(QRQCEvent event) {
        List<User> engineers = new ArrayList<>();
        
        // 1. 基于问题类型推荐
        engineers.addAll(findEngineersByProblemType(event.getEventType()));
        
        // 2. 基于历史经验推荐
        engineers.addAll(findEngineersBySimilarHistory(event));
        
        // 3. 基于当前工作负荷推荐
        engineers = sortByWorkload(engineers);
        
        return engineers;
    }
    
    /**
     * 基于历史相似案例推荐
     */
    private List<User> findEngineersBySimilarHistory(QRQCEvent event) {
        List<User> engineers = new ArrayList<>();
        
        // 查询相似QRQC事件
        List<QRQCEvent> similarEvents = qrqcEventRepository
            .findByEventTypeAndProcessStep(
                event.getEventType(),
                event.getProcessStep()
            );
        
        // 统计参与过的工程师
        Map<Long, Long> engineerFrequency = similarEvents.stream()
            .flatMap(e -> qrqcTeamMemberRepository.findByTeamId(e.getTeamId()).stream())
            .filter(m -> "QUALITY".equals(m.getRole()))
            .collect(Collectors.groupingBy(
                QRQCTeamMember::getUserId,
                Collectors.counting()
            ));
        
        // 按参与频率排序
        engineerFrequency.entrySet().stream()
            .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
            .limit(3)
            .forEach(entry -> {
                User engineer = userRepository.findById(entry.getKey()).orElse(null);
                if (engineer != null) {
                    engineers.add(engineer);
                }
            });
        
        return engineers;
    }
    
    /**
     * 按工作负荷排序
     */
    private List<User> sortByWorkload(List<User> users) {
        // 获取每个用户的当前待处理任务数
        Map<Long, Integer> taskCountMap = getCurrentTaskCounts(users);
        
        return users.stream()
            .sorted(Comparator.comparing(u -> taskCountMap.getOrDefault(u.getUserId(), 0)))
            .collect(Collectors.toList());
    }
    
    /**
     * 获取当前任务数
     */
    private Map<Long, Integer> getCurrentTaskCounts(List<User> users) {
        Map<Long, Integer> taskCountMap = new HashMap<>();
        
        for (User user : users) {
            // 查询用户当前活跃的QRQC任务
            long activeTaskCount = qrqcEventRepository
                .findByTeamLeaderIdAndQrqcStatusIn(
                    user.getUserId(),
                    List.of(QRQCStatus.OPEN, QRQCStatus.CONTAINED, QRQCStatus.INVESTIGATING)
                )
                .size();
            
            taskCountMap.put(user.getUserId(), (int) activeTaskCount);
        }
        
        return taskCountMap;
    }
}
```

---

## 4. 集成与同步机制

### 4.1 变化点与MES系统集成

```java
/**
 * 变化点-MES集成服务
 */
@Service
@Slf4j
public class ChangePointMESIntegrationServiceImpl implements ChangePointMESIntegrationService {
    
    @Autowired
    private MesClient mesClient;
    
    /**
     * 变更实施时通知MES
     */
    @EventListener
    public void onChangeImplemented(ChangeImplementedEvent event) {
        log.info("收到变更实施事件,变化点ID: {}", event.getChangeId());
        
        try {
            ChangePoint changePoint = getChangePointById(event.getChangeId());
            
            // 1. 构建MES通知数据
            MESChangeNotificationDTO mesDto = new MESChangeNotificationDTO();
            mesDto.setChangeType(changePoint.getChangeType().name());
            mesDto.setChangeNumber(changePoint.getChangeNumber());
            mesDto.setChangeDescription(changePoint.getChangeDescription());
            mesDto.setImplementedDate(changePoint.getImplementedDate());
            
            // 2. 关联影响的生产线
            List<String> affectedProductionLines = extractProductionLines(changePoint);
            mesDto.setAffectedProductionLines(affectedProductionLines);
            
            // 3. 关联影响的工序列表
            List<String> affectedProcesses = extractProcesses(changePoint);
            mesDto.setAffectedProcesses(affectedProcesses);
            
            // 4. 调用MES接口
            MesResponse response = mesClient.notifyChange(mesDto);
            
            if (response.isSuccess()) {
                log.info("MES通知成功,变化点编号: {}", changePoint.getChangeNumber());
                
                // 5. 记录集成日志
                saveIntegrationLog(changePoint, mesDto, response, true);
            } else {
                log.error("MES通知失败,变化点编号: {}, 错误: {}", 
                    changePoint.getChangeNumber(), response.getErrorMessage());
                
                // 6. 记录失败日志
                saveIntegrationLog(changePoint, mesDto, response, false);
                
                // 7. 重试机制
                retryMESNotification(changePoint, mesDto);
            }
            
        } catch (Exception e) {
            log.error("MES集成异常,变化点ID: {}", event.getChangeId(), e);
            throw new MESIntegrationException("MES集成失败", e);
        }
    }
    
    /**
     * MES重试通知
     */
    private void retryMESNotification(ChangePoint changePoint, MESChangeNotificationDTO mesDto) {
        log.info("MES通知重试,变化点编号: {}", changePoint.getChangeNumber());
        
        int maxRetries = 3;
        int retryInterval = 5000; // 5秒
        
        for (int i = 1; i <= maxRetries; i++) {
            try {
                Thread.sleep(retryInterval);
                
                MesResponse response = mesClient.notifyChange(mesDto);
                
                if (response.isSuccess()) {
                    log.info("MES通知重试成功,变化点编号: {}, 重试次数: {}", 
                        changePoint.getChangeNumber(), i);
                    return;
                }
                
                log.warn("MES通知重试失败,变化点编号: {}, 重试次数: {}", 
                    changePoint.getChangeNumber(), i);
                
            } catch (Exception e) {
                log.error("MES通知重试异常,变化点编号: {}, 重试次数: {}", 
                    changePoint.getChangeNumber(), i, e);
            }
        }
        
        // 重试全部失败,发送告警
        sendMESIntegrationFailureAlert(changePoint);
    }
    
    /**
     * 从MES接收生产数据
     */
    @Override
    public void receiveProductionData(MESProductionDataDTO mesDto) {
        log.info("从MES接收生产数据,工单ID: {}", mesDto.getWorkOrderId());
        
        try {
            // 1. 验证数据
            validateMESProductionData(mesDto);
            
            // 2. 存储到InfluxDB
            storeProductionDataToInfluxDB(mesDto);
            
            // 3. 关联变化点追溯信息
            if (mesDto.getChangePointId() != null) {
                updateChangePointTraceability(mesDto);
            }
            
            // 4. 实时质量分析
            analyzeProductionQuality(mesDto);
            
            log.info("MES生产数据接收成功");
            
        } catch (Exception e) {
            log.error("MES生产数据接收失败,工单ID: {}", mesDto.getWorkOrderId(), e);
            throw new MESIntegrationException("MES生产数据接收失败", e);
        }
    }
    
    /**
     * 实时质量分析
     */
    private void analyzeProductionQuality(MESProductionDataDTO mesDto) {
        // 1. 获取SPC控制点配置
        List<SPCControlPointConfig> configs = spcControlPointConfigRepository
            .findByProcessStep(mesDto.getProcessStep());
        
        // 2. 分析每个控制点
        for (SPCControlPointConfig config : configs) {
            Double measurementValue = mesDto.getParameters().get(config.getParameterName());
            
            if (measurementValue != null) {
                // 存储SPC数据
                storeSPCData(config, measurementValue, mesDto);
                
                // 检测异常
                if (detectSPCAnomaly(config, measurementValue)) {
                    // 触发质量告警
                    triggerQualityAnomalyAlert(config, measurementValue, mesDto);
                }
            }
        }
    }
}
```

---

## 总结

本详细实现规范为舜富QMS系统的核心模块提供了:

1. **变化点管理**: 完整的创建、审批、风险评估、实施、验证流程,包含风险评估算法和审批工作流引擎
2. **CAPA管理**: 5Why分析、鱼骨图分析、措施制定、任务分配、效果验证的完整生命周期
3. **QRQC快速响应**: 24小时响应监控、自动质量异常识别、智能团队组建
4. **系统集成**: 与MES/ERP等外部系统的数据同步和事件通知机制

所有实现遵循Spring Boot微服务架构,采用领域驱动设计(DDD)思想,确保代码的可维护性和可扩展性。
