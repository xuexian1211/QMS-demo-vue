# 舜富QMS系统 - 审核管理模块详细实现

## 1. 审核管理模块总览

### 1.1 审核模块架构设计

```
┌─────────────────────────────────────────────────────────────┐
│               审核管理模块 - 微服务架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                审核业务流程层                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 内部审核     │ │ 外部审核     │ │ 分层审核     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                审核计划管理层                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 审核计划     │ │ 审核执行     │ │ 审核报告     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                审核数据层                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 审核记录     │ │ 审核发现     │ │ 审核整改     │       │  │
│  │  │PostgreSQL  │ │PostgreSQL   │ │MongoDB     │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 审核类型体系

```
┌─────────────────────────────────────────────────────────────────┐
│                       审核类型体系                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                     审核体系                             │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  内部审核    │    │  外部审核    │    │  专项审核    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│       │                │                    │                   │
│  ┌────┴────┐    ┌──────┴──────┐    ┌────────┴────────┐       │
│  ▼         ▼    ▼             ▼    ▼                ▼       │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
││体系审核││过程审核││产品审核││合规审核││客户审核││认证审核││内审员审核││     │
│└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘     │
│       │                │                    │                   │
│  ┌────┴────┐    ┌──────┴──────┐    ┌────────┴────────┐       │
│  │LPA审核  │    │供应商审核  │    │质量体系审核  │       │
│  └─────────┘    └──────────┬──┘    └──────────┬─────┘       │
│                          ↓                  ↓                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    分层审核 (LPA)                        │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │操作员审核  │ │主管审核  │ │经理审核  │ │高层审核  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 内部审核模块详细实现

### 2.1 内部审核流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        内部审核流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ 审核计划  │───▶│ 组建团队  │───▶│ 审核准备  │                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                               │                                │
│                  ┌────────────┴────────────┐                   │
│                  ▼                         ▼                   │
│           ┌──────────┐              ┌──────────┐               │
│           │ 文件审查  │              │ 现场审核  │               │
│           └──────────┘              └──────────┘               │
│                  │                        │                │
│           ┌──────┴──────┐               ┌─┴────┐            │
│           ▼              ▼               ▼      ▼             │
│  ┌──────────┐  ┌──────────┐     ┌──────────┐ ┌──────────┐      │
│  │ 资料验证  │  │ 证据收集  │     │ 发现确认  │ │ 不符合项  │      │
│  └──────────┘  └──────────┘     └──────────┘ └──────────┘      │
│                  │                        │                │
│           ┌──────┴──────┐               ┌─┴────┐            │
│           ▼              ▼               ▼      ▼             │
│  ┌──────────┐  ┌──────────┐     ┌──────────┐ ┌──────────┐      │
│  │ 初次会议  │  │ 现场审核  │     │ 末次会议  │ │ 报告编制  │      │
│  └──────────┘  └──────────┘     └──────────┘ └──────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 内部审核核心类设计

```java
/**
 * 审核记录实体
 */
@Data
@Entity
@Table(name = "audit_record")
@DynamicUpdate
public class AuditRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;
    
    @Column(name = "audit_number", unique = true, nullable = false)
    private String auditNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "audit_type", nullable = false)
    private AuditType auditType; // INTERNAL, EXTERNAL, SECOND_PARTY, SUPPLIER, LPA
    
    @Column(name = "audit_sub_type")
    private String auditSubType;
    
    @Column(name = "audit_category", nullable = false)
    private String auditCategory; // SYSTEM, PROCESS, PRODUCT, COMPLIANCE
    
    @Column(name = "audit_name", nullable = false)
    private String auditName;
    
    // 审核计划信息
    @Column(name = "planned_start_date", nullable = false)
    private LocalDate plannedStartDate;
    
    @Column(name = "planned_end_date", nullable = false)
    private LocalDate plannedEndDate;
    
    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;
    
    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;
    
    @Column(name = "audit_location", nullable = false)
    private String auditLocation;
    
    @Column(name = "audit_scope", columnDefinition = "TEXT")
    private String auditScope;
    
    @Column(name = "audit_standard", columnDefinition = "TEXT")
    private String auditStandard;
    
    @Column(name = "audit_method")
    private String auditMethod; // DOCUMENT_REVIEW, INTERVIEW, OBSERVATION
    
    @Column(name = "objective", columnDefinition = "TEXT")
    private String objective;
    
    @Column(name = "key_finding")
    private String keyFinding;
    
    @Column(name = "overall_rating")
    private String overallRating; // EXCELLENT, GOOD, SATISFACTORY, NEEDS_IMPROVEMENT, POOR
    
    @Enumerated(EnumType.STRING)
    @Column(name = "audit_status", nullable = false)
    private AuditStatus auditStatus; // PLANNING, IN_PROGRESS, COMPLETED, CLOSED
    
    @Column(name = "lead_auditor_id", nullable = false)
    private Long leadAuditorId;
    
    @Column(name = "lead_auditor_name", nullable = false)
    private String leadAuditorName;
    
    @Type(type = "json")
    @Column(name = "audit_team", columnDefinition = "jsonb")
    private AuditTeam auditTeam;
    
    @Type(type = "json")
    @Column(name = "standards", columnDefinition = "jsonb")
    private List<StandardReference> standards;
    
    @Type(type = "json")
    @Column(name = "findings", columnDefinition = "jsonb")
    private List<AuditFinding> findings;
    
    @Type(type = "json")
    @Column(name = "attachments", columnDefinition = "jsonb")
    private List<AuditAttachment> attachments;
    
    @Column(name = "report_summary", columnDefinition = "TEXT")
    private String reportSummary;
    
    @Column(name = "auditor_signature", columnDefinition = "TEXT")
    private String auditorSignature;
    
    @Column(name = "auditee_signature", columnDefinition = "TEXT")
    private String auditeeSignature;
    
    @Column(name = "approval_date")
    private LocalDate approvalDate;
    
    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    // LPA特有字段
    @Enumerated(EnumType.STRING)
    @Column(name = "lpa_layer")
    private LPALayer lpaLayer; // OPERATOR, SUPERVISOR, MANAGER, EXECUTIVE
    
    @Column(name = "lpa_frequency")
    private String lpaFrequency; // DAILY, WEEKLY, MONTHLY, QUARTERLY
    
    @Column(name = "lpa_process_area")
    private String lpaProcessArea;
    
    @Column(name = "lpa_score")
    private Double lpaScore;
    
    @Column(name = "lpa_checklist")
    private String lpaChecklist;
}

/**
 * 审核发现实体
 */
@Data
@Entity
@Table(name = "audit_finding")
public class AuditFinding {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "finding_id")
    private Long findingId;
    
    @Column(name = "audit_id", nullable = false)
    private Long auditId;
    
    @Column(name = "finding_number")
    private String findingNumber;
    
    @Column(name = "finding_type")
    private FindingType findingType; // MAJOR_NC, MINOR_NC, OP_IMPROVEMENT, STRENGTH
    
    @Column(name = "reference_standard", nullable = false)
    private String referenceStandard;
    
    @Column(name = "reference_clause", nullable = false)
    private String referenceClause;
    
    @Column(name = "finding_description", columnDefinition = "TEXT", nullable = false)
    private String findingDescription;
    
    @Column(name = "evidence_description", columnDefinition = "TEXT", nullable = false)
    private String evidenceDescription;
    
    @Column(name = "effect_description", columnDefinition = "TEXT")
    private String effectDescription;
    
    @Column(name = "finding_severity", nullable = false)
    private FindingSeverity findingSeverity; // LOW, MEDIUM, HIGH
    
    @Column(name = "root_cause_analysis", columnDefinition = "TEXT")
    private String rootCauseAnalysis;
    
    @Column(name = "corrective_action_plan", columnDefinition = "TEXT")
    private String correctiveActionPlan;
    
    @Column(name = "target_completion_date")
    private LocalDate targetCompletionDate;
    
    @Column(name = "responsible_department")
    private String responsibleDepartment;
    
    @Column(name = "responsible_person_id")
    private Long responsiblePersonId;
    
    @Column(name = "responsible_person_name")
    private String responsiblePersonName;
    
    @Column(name = "verification_method")
    private String verificationMethod;
    
    @Column(name = "verification_date")
    private LocalDate verificationDate;
    
    @Column(name = "verification_result")
    private String verificationResult;
    
    @Column(name = "finding_status", nullable = false)
    private FindingStatus findingStatus; // OPEN, IN_PROGRESS, COMPLETED, VERIFIED
    
    @Column(name = "closure_date")
    private LocalDate closureDate;
    
    @Column(name = "closure_notes", columnDefinition = "TEXT")
    private String closureNotes;
    
    @Type(type = "json")
    @Column(name = "supporting_evidence", columnDefinition = "jsonb")
    private List<SupportingEvidence> supportingEvidence;
    
    @Type(type = "json")
    @Column(name = "verification_notes", columnDefinition = "jsonb")
    private List<VerificationNote> verificationNotes;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
}
```

### 2.3 内部审核计划服务

```java
/**
 * 内部审核计划服务
 */
@Service
@Slf4j
@Transactional
public class InternalAuditPlanServiceImpl implements InternalAuditPlanService {
    
    @Autowired
    private AuditRecordRepository auditRecordRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private StandardService standardService;
    
    @Autowired
    private AuditTeamService auditTeamService;
    
    /**
     * 创建内部审核计划
     */
    @Override
    public AuditPlanDTO createAuditPlan(AuditPlanCreateDTO dto) {
        log.info("创建内部审核计划,审核类型: {}, 审核范围: {}", dto.getAuditType(), dto.getAuditScope());
        
        // 1. 验证数据完整性
        validateAuditPlanData(dto);
        
        // 2. 生成审核编号
        String auditNumber = generateAuditNumber(dto.getAuditType());
        
        // 3. 创建审核记录
        AuditRecord auditRecord = createAuditRecord(dto, auditNumber);
        
        // 4. 创建审核团队
        createAuditTeam(auditRecord);
        
        // 5. 创建审核检查清单
        createAuditChecklist(auditRecord);
        
        // 6. 发送通知
        sendAuditPlanNotification(auditRecord);
        
        log.info("内部审核计划创建成功,审核编号: {}", auditNumber);
        
        return convertToDTO(auditRecord);
    }
    
    /**
     * 创建审核记录
     */
    private AuditRecord createAuditRecord(AuditPlanCreateDTO dto, String auditNumber) {
        AuditRecord auditRecord = new AuditRecord();
        auditRecord.setAuditNumber(auditNumber);
        auditRecord.setAuditType(dto.getAuditType());
        auditRecord.setAuditSubType(dto.getAuditSubType());
        auditRecord.setAuditCategory(dto.getAuditCategory());
        auditRecord.setAuditName(dto.getAuditName());
        auditRecord.setPlannedStartDate(dto.getPlannedStartDate());
        auditRecord.setPlannedEndDate(dto.getPlannedEndDate());
        auditRecord.setAuditLocation(dto.getAuditLocation());
        auditRecord.setAuditScope(dto.getAuditScope());
        auditRecord.setAuditStandard(dto.getAuditStandard());
        auditRecord.setAuditMethod(dto.getAuditMethod());
        auditRecord.setObjective(dto.getObjective());
        auditRecord.setOverallRating("待定");
        auditRecord.setAuditStatus(AuditStatus.PLANNING);
        auditRecord.setLeadAuditorId(dto.getLeadAuditorId());
        auditRecord.setLeadAuditorName(dto.getLeadAuditorName());
        auditRecord.setCreatedBy(SecurityUtils.getCurrentUserId());
        auditRecord.setCreatedTime(LocalDateTime.now());
        
        // LPA审核特有字段
        if (dto.getAuditType() == AuditType.LPA) {
            auditRecord.setLpaLayer(dto.getLpaLayer());
            auditRecord.setLpaFrequency(dto.getLpaFrequency());
            auditRecord.setLpaProcessArea(dto.getLpaProcessArea());
            auditRecord.setLpaChecklist(dto.getLpaChecklist());
        }
        
        return auditRecordRepository.save(auditRecord);
    }
    
    /**
     * 创建审核团队
     */
    private void createAuditTeam(AuditRecord auditRecord) {
        // 1. 查询审核团队成员
        List<AuditTeamMember> teamMembers = auditTeamService.getAuditTeamMembers(
            auditRecord.getLeadAuditorId(), 
            auditRecord.getAuditType()
        );
        
        // 2. 设置审核团队信息
        AuditTeam auditTeam = new AuditTeam();
        auditTeam.setLeadAuditorId(auditRecord.getLeadAuditorId());
        auditTeam.setLeadAuditorName(auditRecord.getLeadAuditorName());
        auditTeam.setMembers(teamMembers);
        auditTeam.setTeamSize(teamMembers.size());
        auditRecord.setAuditTeam(auditTeam);
        
        auditRecordRepository.save(auditRecord);
    }
    
    /**
     * 审核计划执行
     */
    @Override
    public AuditExecutionDTO executeAudit(Long auditId, AuditExecuteDTO dto) {
        log.info("执行审核计划,审核ID: {}", auditId);
        
        // 1. 查询审核记录
        AuditRecord auditRecord = getAuditById(auditId);
        
        // 2. 验证审核状态
        if (AuditStatus.IN_PROGRESS != auditRecord.getAuditStatus()) {
            throw new BusinessException("审核计划处于" + auditRecord.getAuditStatus() + "状态,无法执行");
        }
        
        // 3. 更新审核信息
        auditRecord.setActualStartDate(dto.getActualStartDate());
        auditRecord.setActualEndDate(dto.getActualEndDate());
        auditRecord.setAuditStatus(AuditStatus.COMPLETED);
        auditRecord.setUpdatedBy(SecurityUtils.getCurrentUserId());
        auditRecord.setUpdatedTime(LocalDateTime.now());
        
        // 4. 处理审核发现
        processAuditFindings(auditRecord, dto.getFindings());
        
        // 5. 生成审核总结
        generateAuditSummary(auditRecord);
        
        // 6. 计算总体评级
        calculateOverallRating(auditRecord);
        
        auditRecord = auditRecordRepository.save(auditRecord);
        
        log.info("审核执行完成,审核编号: {}, 总体评级: {}", 
            auditRecord.getAuditNumber(), auditRecord.getOverallRating());
        
        return convertToExecutionDTO(auditRecord);
    }
    
    /**
     * 处理审核发现
     */
    private void processAuditFindings(AuditRecord auditRecord, List<AuditFindingCreateDTO> findingDTOs) {
        List<AuditFinding> findings = new ArrayList<>();
        
        for (AuditFindingCreateDTO dto : findingDTOs) {
            AuditFinding finding = new AuditFinding();
            BeanUtils.copyProperties(dto, finding);
            finding.setAuditId(auditRecord.getAuditId());
            finding.setFindingNumber(generateFindingNumber(auditRecord.getAuditId(), findings.size() + 1));
            finding.setFindingStatus(FindingStatus.OPEN);
            finding.setCreatedBy(SecurityUtils.getCurrentUserId());
            finding.setCreatedTime(LocalDateTime.now());
            
            findings.add(finding);
        }
        
        auditFindingRepository.saveAll(findings);
        auditRecord.setFindings(findings);
        
        log.info("审核发现处理完成,发现数量: {}, 不符合项: {}, 改进机会: {}", 
            findings.size(), 
            findings.stream().filter(f -> f.getFindingType() == FindingType.MAJOR_NC || 
                                         f.getFindingType() == FindingType.MINOR_NC).count(),
            findings.stream().filter(f -> f.getFindingType() == FindingType.OP_IMPROVEMENT).count());
    }
    
    /**
     * 计算总体评级
     */
    private void calculateOverallRating(AuditRecord auditRecord) {
        List<AuditFinding> findings = auditRecord.getFindings();
        
        if (findings == null || findings.isEmpty()) {
            auditRecord.setOverallRating("EXCELLENT");
            return;
        }
        
        // 统计发现类型
        long majorNCCount = findings.stream()
            .filter(f -> f.getFindingType() == FindingType.MAJOR_NC)
            .count();
            
        long minorNCCount = findings.stream()
            .filter(f -> f.getFindingType() == FindingType.MINOR_NC)
            .count();
            
        long opImprovementCount = findings.stream()
            .filter(f -> f.getFindingType() == FindingType.OP_IMPROVEMENT)
            .count();
            
        long strengthCount = findings.stream()
            .filter(f -> f.getFindingType() == FindingType.STRENGTH)
            .count();
        
        // 基于IATF16949评级标准
        if (majorNCCount > 0) {
            auditRecord.setOverallRating("NEEDS_IMPROVEMENT");
        } else if (minorNCCount <= 2) {
            if (strengthCount >= findings.size() * 0.5) {
                auditRecord.setOverallRating("EXCELLENT");
            } else {
                auditRecord.setOverallRating("GOOD");
            }
        } else if (minorNCCount <= 5) {
            auditRecord.setOverallRating("SATISFACTORY");
        } else {
            auditRecord.setOverallRating("POOR");
        }
        
        log.info("总体评级计算完成,严重不符合项: {}, 一般不符合项: {}, 改进机会: {}, 优势: {}", 
            majorNCCount, minorNCCount, opImprovementCount, strengthCount);
    }
}
```

---

## 3. 分层审核(LPA)模块详细实现

### 3.1 LPA审核体系

```
┌─────────────────────────────────────────────────────────────────┐
│                     分层审核(LPA)体系                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    审核层级                              │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                   4个审核层级                             │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 操作员  │ │ 主管审核  │ │经理审核  │ │高层审核  │           │
│  │ 审核     │ │ (LPA-3)  │ │ (LPA-2)  │ │ (LPA-1)  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│       │                │                    │                   │
│  ┌────┴────┐    ┌──────┴──────┐    ┌────────┴────────┐       │
│  │生产现场  │    │ 质量控制     │    │  质量体系      │       │
│  │质量检查  │    │ 管理审核     │    │ 运行审核      │       │
│  └─────────┘    └──────────┬──┘    └──────────┬─────┘       │
│                          ↓                  ↓                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    LPA审核标准                            │     │
│  │ 1. 操作员关注现场执行和产品质量                            │     │
│  │ 2. 主管关注过程控制和质量控制                            │     │
│  │ 3. 经理关注体系运行和资源保障                            │     │
│  │ 4. 高层关注战略方向和管理绩效                            │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                   LPA频率要求                             │     │
│  │ 1. 操作员级: 每日审核                                    │     │
│  │ 2. 主管级: 每周审核                                      │     │
│  │ 3. 经理级: 每月审核                                      │     │
│  │ 4. 高层级: 每季度审核                                    │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 LPA审核服务

```java
/**
 * LPA审核服务
 */
@Service
@Slf4j
@Transactional
public class LayeredProcessAuditServiceImpl implements LayeredProcessAuditService {
    
    @Autowired
    private AuditRecordRepository auditRecordRepository;
    
    @Autowired
    private LPAChecklistRepository lpaChecklistRepository;
    
    @Autowired
    private LPARepository lpaRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * 创建LPA审核计划
     */
    @Override
    public LPAPlanDTO createLPAPlan(LPAPlanCreateDTO dto) {
        log.info("创建LPA审核计划,审核层级: {}, 审核区域: {}", dto.getLpaLayer(), dto.getLpaProcessArea());
        
        // 1. 验证LPA层级
        validateLPALayer(dto.getLpaLayer());
        
        // 2. 获取LPA检查清单
        LPAChecklist checklist = getLPAChecklist(dto.getLpaLayer(), dto.getLpaProcessArea());
        
        // 3. 创建LPA审核记录
        LPA lpa = new LPA();
        BeanUtils.copyProperties(dto, lpa);
        lpa.setLpaNumber(generateLpaNumber(dto.getLpaLayer()));
        lpa.setStatus(LPAStatus.PLANNED);
        lpa.setChecklistId(checklist.getChecklistId());
        lpa.setCreatedBy(SecurityUtils.getCurrentUserId());
        lpa.setCreatedTime(LocalDateTime.now());
        
        lpa = lpaRepository.save(lpa);
        
        // 4. 生成LPA评分项目
        createLPAScoringItems(lpa, checklist);
        
        // 5. 发送计划通知
        sendLPAPlanNotification(lpa);
        
        log.info("LPA审核计划创建成功,LPA编号: {}", lpa.getLpaNumber());
        
        return convertToDTO(lpa);
    }
    
    /**
     * 执行LPA审核
     */
    @Override
    public LPAResultDTO executeLPA(Long lpaId, LPAExecuteDTO dto) {
        log.info("执行LPA审核,LPA ID: {}", lpaId);
        
        // 1. 查询LPA记录
        LPA lpa = getLPAById(lpaId);
        
        // 2. 验证审核状态
        if (LPAStatus.EXECUTED != lpa.getStatus()) {
            throw new BusinessException("LPA处于" + lpa.getStatus() + "状态,无法执行");
        }
        
        // 3. 更新审核状态
        lpa.setStatus(LPAStatus.COMPLETED);
        lpa.setActualExecutionTime(LocalDateTime.now());
        lpa.setAuditorId(SecurityUtils.getCurrentUserId());
        lpa.setAuditorName(SecurityUtils.getCurrentUserName());
        
        // 4. 处理评分项目
        processScoringItems(lpa, dto.getScoringItems());
        
        // 5. 计算LPA总分
        calculateLPAScore(lpa);
        
        // 6. 确定评级
        determineLPARating(lpa);
        
        lpa = lpaRepository.save(lpa);
        
        // 7. 生成LPA报告
        generateLPAReport(lpa);
        
        log.info("LPA审核执行完成,LPA编号: {}, 总分: {}, 评级: {}", 
            lpa.getLpaNumber(), lpa.getLpaScore(), lpa.getLpaRating());
        
        return convertToResultDTO(lpa);
    }
    
    /**
     * 处理评分项目
     */
    private void processScoringItems(LPA lpa, List<LPAScoringDTO> scoringDTOs) {
        for (LPAScoringDTO dto : scoringDTOs) {
            LPAScoringItem item = new LPAScoringItem();
            BeanUtils.copyProperties(dto, item);
            item.setLpaId(lpa.getLpaId());
            item.setScoringTime(LocalDateTime.now());
            
            lpaScoringItemRepository.save(item);
        }
        
        log.info("LPA评分项目处理完成,评分数量: {}", scoringDTOs.size());
    }
    
    /**
     * 计算LPA总分
     */
    private void calculateLPAScore(LPA lpa) {
        List<LPAScoringItem> scoringItems = lpaScoringItemRepository.findByLpaId(lpa.getLpaId());
        
        double totalScore = 0;
        double maxPossibleScore = 0;
        
        for (LPAScoringItem item : scoringItems) {
            totalScore += item.getScore() * item.getWeight();
            maxPossibleScore += item.getMaxScore() * item.getWeight();
        }
        
        // 计算标准化分数 (0-100)
        double normalizedScore = (totalScore / maxPossibleScore) * 100;
        
        lpa.setLpaScore(Math.round(normalizedScore * 100.0) / 100.0); // 保留两位小数
        lpa.setMaxScore(maxPossibleScore);
        
        log.info("LPA总分计算完成,原始总分: {}, 标准化分数: {}", totalScore, normalizedScore);
    }
    
    /**
     * 确定LPA评级
     */
    private void determineLPARating(LPA lpa) {
        double score = lpa.getLpaScore();
        
        // LPA评级标准
        if (score >= 90) {
            lpa.setLpaRating("EXEMPLARY");
            lpa.setRatingDescription("卓越表现");
        } else if (score >= 80) {
            lpa.setLpaRating("STRONG");
            lpa.setRatingDescription("表现优秀");
        } else if (score >= 70) {
            lpa.setLpaRating("SATISFACTORY");
            lpa.setRatingDescription("表现满意");
        } else if (score >= 60) {
            lpa.setLpaRating("NEEDS_IMPROVEMENT");
            lpa.setRatingDescription("需要改进");
        } else {
            lpa.setLpaRating("POOR");
            lpa.setRatingDescription("表现较差");
        }
        
        log.info("LPA评级确定完成,分数: {}, 评级: {}", score, lpa.getLpaRating());
    }
    
    /**
     * 生成LPA趋势分析
     */
    @Override
    public LPATrendAnalysisDTO analyzeLPATrend(Long lpaLayer, Long processAreaId, String period) {
        log.info("分析LPA趋势,审核层级: {}, 区域: {}, 周期: {}", lpaLayer, processAreaId, period);
        
        LPATrendAnalysisDTO trendAnalysis = new LPATrendAnalysisDTO();
        
        // 1. 查询历史LPA记录
        List<LPA> historicalLPAs = getHistoricalLPAs(lpaLayer, processAreaId, period);
        
        // 2. 计算趋势指标
        calculateTrendMetrics(trendAnalysis, historicalLPAs);
        
        // 3. 分析质量趋势
        analyzeQualityTrend(trendAnalysis, historicalLPAs);
        
        // 4. 分析改进趋势
        analyzeImprovementTrend(trendAnalysis, historicalLPAs);
        
        // 5. 生成趋势报告
        generateTrendReport(trendAnalysis, historicalLPAs);
        
        log.info("LPA趋势分析完成,审核记录数量: {}", historicalLPAs.size());
        
        return trendAnalysis;
    }
    
    /**
     * 计算趋势指标
     */
    private void calculateTrendMetrics(LPATrendAnalysisDTO trendAnalysis, List<LPA> historicalLPAs) {
        if (historicalLPAs.isEmpty()) {
            return;
        }
        
        // 1. 计算平均分
        double averageScore = historicalLPAs.stream()
            .mapToDouble(LPA::getLpaScore)
            .average()
            .orElse(0.0);
        trendAnalysis.setAverageScore(averageScore);
        
        // 2. 计算最高分和最低分
        OptionalDouble maxScore = historicalLPAs.stream()
            .mapToDouble(LPA::getLpaScore)
            .max();
        trendAnalysis.setMaxScore(maxScore.orElse(0.0));
        
        OptionalDouble minScore = historicalLPAs.stream()
            .mapToDouble(LPA::getLpaScore)
            .min();
        trendAnalysis.setMinScore(minScore.orElse(0.0));
        
        // 3. 计算稳定性指标
        double variance = calculateVariance(
            historicalLPAs.stream()
                .mapToDouble(LPA::getLpaScore)
                .toArray()
        );
        trendAnalysis.setVariance(variance);
        trendAnalysis.setStabilityScore(calculateStabilityScore(variance));
        
        // 4. 计算改进率
        double improvementRate = calculateImprovementRate(historicalLPAs);
        trendAnalysis.setImprovementRate(improvementRate);
    }
    
    /**
     * 分析质量趋势
     */
    private void analyzeQualityTrend(LPATrendAnalysisDTO trendAnalysis, List<LPA> historicalLPAs) {
        // 1. 统计各评级分布
        Map<String, Long> ratingDistribution = historicalLPAs.stream()
            .collect(Collectors.groupingBy(
                LPA::getLpaRating,
                Collectors.counting()
            ));
        trendAnalysis.setRatingDistribution(ratingDistribution);
        
        // 2. 计算质量得分率
        double qualityScoreRate = calculateQualityScoreRate(ratingDistribution);
        trendAnalysis.setQualityScoreRate(qualityScoreRate);
        
        // 3. 判断趋势方向
        TrendDirection direction = determineTrendDirection(historicalLPAs);
        trendAnalysis.setTrendDirection(direction);
        
        // 4. 分析趋势原因
        List<TrendFactor> trendFactors = analyzeTrendFactors(historicalLPAs);
        trendAnalysis.setTrendFactors(trendFactors);
    }
    
    /**
     * 自动LPA审核提醒
     */
    @Scheduled(cron = "0 0 9 * * ?") // 每天9点执行
    public void autoLPAReminder() {
        log.info("执行LPA审核自动提醒");
        
        // 1. 查询需要执行的LPA
        List<LPA> pendingLPAs = lpaRepository
            .findPendingLPAs(LocalDate.now());
        
        for (LPA lpa : pendingLPAs) {
            // 2. 生成提醒通知
            sendLPAReminderNotification(lpa);
            
            // 3. 更新提醒状态
            lpa.setReminderSent(true);
            lpaRepository.save(lpa);
        }
        
        log.info("LPA提醒完成,提醒数量: {}", pendingLPAs.size());
    }
}
```

---

## 4. 外部审核模块详细实现

### 4.1 外部审核流程管理

```java
/**
 * 外部审核管理服务
 */
@Service
@Slf4j
@Transactional
public class ExternalAuditManagementServiceImpl implements ExternalAuditManagementService {
    
    @Autowired
    private ExternalAuditRepository externalAuditRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private CertificationRepository certificationRepository;
    
    @Autowired
    private AuditPreparationService auditPreparationService;
    
    /**
     * 创建外部审核计划
     */
    @Override
    public ExternalAuditDTO createExternalAudit(ExternalAuditCreateDTO dto) {
        log.info("创建外部审核计划,审核类型: {}, 审核机构: {}", dto.getAuditType(), dto.getAuditorName());
        
        // 1. 验证审核类型
        validateExternalAuditType(dto.getAuditType());
        
        // 2. 创建外部审核记录
        ExternalAudit externalAudit = new ExternalAudit();
        BeanUtils.copyProperties(dto, externalAudit);
        externalAudit.setAuditNumber(generateExternalAuditNumber(dto.getAuditType()));
        externalAudit.setAuditStatus(ExternalAuditStatus.PLANNED);
        externalAudit.setCreatedBy(SecurityUtils.getCurrentUserId());
        externalAudit.setCreatedTime(LocalDateTime.now());
        
        // 3. 处理客户审核
        if (dto.getAuditType() == ExternalAuditType.CUSTOMER) {
            Customer customer = customerRepository.findById(dto.getRelatedEntityId()).orElse(null);
            if (customer != null) {
                externalAudit.setCustomerName(customer.getCustomerName());
            }
        }
        
        // 4. 处理认证审核
        if (dto.getAuditType() == ExternalAuditType.CERTIFICATION) {
            Certification certification = certificationRepository.findById(dto.getRelatedEntityId()).orElse(null);
            if (certification != null) {
                externalAudit.setCertificationName(certification.getCertificationName());
            }
        }
        
        externalAudit = externalAuditRepository.save(externalAudit);
        
        // 5. 创建审核准备工作
        auditPreparationService.createAuditPreparation(externalAudit);
        
        // 6. 发送通知
        sendExternalAuditNotification(externalAudit);
        
        log.info("外部审核计划创建成功,审核编号: {}", externalAudit.getAuditNumber());
        
        return convertToDTO(externalAudit);
    }
    
    /**
     * 审核前准备管理
     */
    @Override
    public AuditPreparationResultDTO prepareForAudit(Long auditId, AuditPreparationDTO dto) {
        log.info("准备外部审核,审核ID: {}", auditId);
        
        // 1. 查询外部审核记录
        ExternalAudit externalAudit = getExternalAuditById(auditId);
        
        // 2. 更新审核准备状态
        externalAudit.setPreparationStatus(PreparationStatus.IN_PROGRESS);
        externalAuditRepository.save(externalAudit);
        
        // 3. 准备审核文档
        prepareAuditDocuments(externalAudit, dto.getDocumentChecklist());
        
        // 4. 准备审核人员
        prepareAuditPersonnel(externalAudit, dto.getPersonnelList());
        
        // 5. 准备审核现场
        prepareAuditSite(externalAudit, dto.getSitePreparation());
        
        // 6. 模拟审核
        if (dto.isConductMockAudit()) {
            conductMockAudit(externalAudit);
        }
        
        // 7. 完成准备
        externalAudit.setPreparationStatus(PreparationStatus.COMPLETED);
        externalAudit.setPreparationCompletedTime(LocalDateTime.now());
        externalAuditRepository.save(externalAudit);
        
        // 8. 发送准备完成通知
        sendAuditPreparationCompletedNotification(externalAudit);
        
        log.info("审核准备完成,审核编号: {}", externalAudit.getAuditNumber());
        
        return convertToPreparationResultDTO(externalAudit);
    }
    
    /**
     * 审核过程跟踪
     */
    @Override
    public AuditTrackingDTO trackAuditProgress(Long auditId) {
        log.info("跟踪审核进度,审核ID: {}", auditId);
        
        // 1. 查询审核信息
        ExternalAudit externalAudit = getExternalAuditById(auditId);
        
        // 2. 构建跟踪信息
        AuditTrackingDTO tracking = new AuditTrackingDTO();
        tracking.setAuditId(auditId);
        tracking.setAuditNumber(externalAudit.getAuditNumber());
        tracking.setAuditType(externalAudit.getAuditType());
        tracking.setAuditStatus(externalAudit.getAuditStatus());
        
        // 3. 获取审核进度
        List<AuditMilestone> milestones = getAuditMilestones(auditId);
        tracking.setMilestones(milestones);
        
        // 4. 计算完成进度
        double progress = calculateAuditProgress(milestones);
        tracking.setProgress(progress);
        
        // 5. 获取当前阶段
        AuditPhase currentPhase = getCurrentAuditPhase(milestones);
        tracking.setCurrentPhase(currentPhase);
        
        // 6. 获取待办事项
        List<AuditTask> pendingTasks = getPendingAuditTasks(auditId);
        tracking.setPendingTasks(pendingTasks);
        
        return tracking;
    }
    
    /**
     * 审核后改进管理
     */
    @Override
    public AuditImprovementDTO manageAuditImprovements(Long auditId) {
        log.info("管理审核后改进,审核ID: {}", auditId);
        
        // 1. 查询外部审核记录
        ExternalAudit externalAudit = getExternalAuditById(auditId);
        
        // 2. 处理审核发现
        processAuditFindings(externalAudit);
        
        // 3. 制定改进计划
        createImprovementPlan(externalAudit);
        
        // 4. 跟踪改进进度
        trackImprovementProgress(externalAudit);
        
        // 5. 验证改进效果
        verifyImprovements(externalAudit);
        
        // 6. 生成审核报告
        generateAuditReport(externalAudit);
        
        // 7. 关闭审核
        closeAudit(externalAudit);
        
        log.info("审核后改进管理完成,审核编号: {}", externalAudit.getAuditNumber());
        
        return convertToImprovementDTO(externalAudit);
    }
}
```

---

## 5. 审核管理模块集成与扩展

### 5.1 审核文档管理系统

```java
/**
 * 审核文档管理服务
 */
@Service
@Slf4j
public class AuditDocumentManagementServiceImpl implements AuditDocumentManagementService {
    
    @Autowired
    private AuditDocumentRepository auditDocumentRepository;
    
    @Autowired
    private DocumentStorageService documentStorageService;
    
    /**
     * 上传审核文档
     */
    @Override
    public AuditDocumentDTO uploadAuditDocument(Long auditId, AuditDocumentUploadDTO dto) {
        log.info("上传审核文档,审核ID: {}, 文档类型: {}", auditId, dto.getDocumentType());
        
        // 1. 验证审核状态
        validateAuditDocumentUpload(auditId);
        
        // 2. 处理文档上传
        String documentUrl = processDocumentUpload(dto);
        
        // 3. 创建审核文档记录
        AuditDocument auditDocument = new AuditDocument();
        auditDocument.setAuditId(auditId);
        auditDocument.setDocumentName(dto.getDocumentName());
        auditDocument.setDocumentType(dto.getDocumentType());
        auditDocument.setDocumentUrl(documentUrl);
        auditDocument.setFileSize(dto.getFileSize());
        auditDocument.setContentType(dto.getContentType());
        auditDocument.setUploadedBy(SecurityUtils.getCurrentUserId());
        auditDocument.setUploadTime(LocalDateTime.now());
        
        auditDocument = auditDocumentRepository.save(auditDocument);
        
        // 4. 记录审核文档变更
        logDocumentUpload(auditDocument);
        
        log.info("审核文档上传成功,文档ID: {}", auditDocument.getDocumentId());
        
        return convertToDTO(auditDocument);
    }
    
    /**
     * 审核文档版本管理
     */
    @Override
    public AuditDocumentVersionDTO manageDocumentVersion(Long documentId, DocumentVersionDTO dto) {
        log.info("管理文档版本,文档ID: {}", documentId);
        
        // 1. 创建新版本
        AuditDocumentVersion newVersion = createNewVersion(documentId, dto);
        
        // 2. 标记旧版本为历史版本
        markOldVersionsAsHistorical(documentId);
        
        // 3. 记录版本变更
        logVersionChange(newVersion);
        
        log.info("文档版本管理完成,文档ID: {}, 版本号: {}", documentId, newVersion.getVersionNumber());
        
        return convertToVersionDTO(newVersion);
    }
    
    /**
     * 审核文档智能检索
 */
    @Override
    public List<AuditDocumentDTO> searchAuditDocuments(AuditDocumentSearchDTO dto) {
        log.info("搜索审核文档,审核ID: {}, 关键词: {}", dto.getAuditId(), dto.getSearchKeyword());
        
        // 1. 构建查询条件
        Example<AuditDocument> example = buildSearchExample(dto);
        
        // 2. 执行文档检索
        List<AuditDocument> documents = auditDocumentRepository.findAll(example);
        
        // 3. 对文档进行相关性评分
        List<AuditDocumentScored> scoredDocuments = scoreDocuments(documents, dto);
        
        // 4. 按相关性排序
        scoredDocuments.sort(Comparator.comparing(AuditDocumentScored::getRelevanceScore).reversed());
        
        // 5. 转换为DTO并返回
        return convertToDTOList(scoredDocuments.stream()
            .map(AuditDocumentScored::getDocument)
            .collect(Collectors.toList()));
    }
    
    /**
     * 审核文档分析
     */
    @Override
    public AuditDocumentAnalysisDTO analyzeAuditDocuments(Long auditId) {
        log.info("分析审核文档,审核ID: {}", auditId);
        
        AuditDocumentAnalysisDTO analysis = new AuditDocumentAnalysisDTO();
        
        // 1. 统计文档分布
        Map<String, Long> documentTypeDistribution = auditDocumentRepository
            .countDocumentsByType(auditId);
        analysis.setDocumentTypeDistribution(documentTypeDistribution);
        
        // 2. 分析文档质量
        List<DocumentQualityIssue> qualityIssues = analyzeDocumentQuality(auditId);
        analysis.setQualityIssues(qualityIssues);
        
        // 3. 生成文档完整性报告
        DocumentCompletenessReport completenessReport = generateCompletenessReport(auditId);
        analysis.setCompletenessReport(completenessReport);
        
        // 4. 提供改进建议
        List<Recommendation> recommendations = generateDocumentRecommendations(analysis);
        analysis.setRecommendations(recommendations);
        
        return analysis;
    }
}
```

### 5.2 审核培训与知识管理

```java
/**
 * 审核培训服务
 */
@Service
@Slf4j
public class AuditTrainingServiceImpl implements AuditTrainingService {
    
    @Autowired
    private AuditTrainingRepository auditTrainingRepository;
    
    @Autowired
    private TrainingMaterialRepository trainingMaterialRepository;
    
    /**
     * 创建审核培训计划
     */
    @Override
    public AuditTrainingDTO createAuditTraining(AuditTrainingCreateDTO dto) {
        log.info("创建审核培训计划,培训类型: {}, 目标群体: {}", dto.getTrainingType(), dto.getTargetAudience());
        
        // 1. 创建培训记录
        AuditTraining training = new AuditTraining();
        BeanUtils.copyProperties(dto, training);
        training.setTrainingStatus(TrainingStatus.PLANNED);
        training.setTrainingNumber(generateTrainingNumber());
        training.setCreatedBy(SecurityUtils.getCurrentUserId());
        training.setCreatedTime(LocalDateTime.now());
        
        training = auditTrainingRepository.save(training);
        
        // 2. 分配培训讲师
        assignTrainingInstructors(training);
        
        // 3. 生成培训材料
        generateTrainingMaterials(training);
        
        // 4. 通知参训人员
        notifyTrainees(training);
        
        log.info("审核培训计划创建成功,培训编号: {}", training.getTrainingNumber());
        
        return convertToDTO(training);
    }
    
    /**
     * 审核知识库管理
     */
    @Override
    public AuditKnowledgeDTO manageAuditKnowledge(AuditKnowledgeCreateDTO dto) {
        log.info("管理审核知识,知识类型: {}, 标题: {}", dto.getKnowledgeType(), dto.getTitle());
        
        // 1. 创建知识条目
        AuditKnowledge knowledge = new AuditKnowledge();
        BeanUtils.copyProperties(dto, knowledge);
        knowledge.setKnowledgeStatus(KnowledgeStatus.ACTIVE);
        knowledge.setViewCount(0);
        knowledge.setRating(0.0);
        knowledge.setRatingCount(0);
        
        knowledge = auditKnowledgeRepository.save(knowledge);
        
        // 2. 关联相关审核
        associateWithAudits(knowledge);
        
        // 3. 索引知识内容
        indexKnowledgeContent(knowledge);
        
        log.info("审核知识创建成功,知识ID: {}", knowledge.getKnowledgeId());
        
        return convertToKnowledgeDTO(knowledge);
    }
    
    /**
     * 内部知识推荐
     */
    @Override
    public List<AuditKnowledgeDTO> recommendAuditKnowledge(Long userId, String context) {
        log.info("推荐审核知识,用户ID: {}, 上下文: {}", userId, context);
        
        List<AuditKnowledgeDTO> recommendations = new ArrayList<>();
        
        // 1. 基于用户历史推荐
        List<AuditKnowledge> userHistoryBased = recommendByUserHistory(userId);
        recommendations.addAll(convertToKnowledgeDTOList(userHistoryBased));
        
        // 2. 基于当前审核场景推荐
        List<AuditKnowledge> auditContextBased = recommendByAuditContext(context);
        recommendations.addAll(convertToKnowledgeDTOList(auditContextBased));
        
        // 3. 基于热门内容推荐
        List<AuditKnowledge> popularBased = recommendByPopularity();
        recommendations.addAll(convertToKnowledgeDTOList(popularBased));
        
        // 4. 去重并按相关性排序
        return deduplicateAndSort(recommendations);
    }
    
    /**
     * 审核技能评估
     */
    @Override
    public AuditSkillAssessmentDTO assessAuditSkills(Long auditorId) {
        log.info("评估审核技能,审核员ID: {}", auditorId);
        
        AuditSkillAssessmentDTO assessment = new AuditSkillAssessmentDTO();
        
        // 1. 收集审核员参与记录
        List<AuditRecord> auditorAudits = auditRecordRepository.findByLeadAuditorId(auditorId);
        
        // 2. 评估审核技能
        List<SkillScore> skillScores = assessSkills(auditorAudits);
        assessment.setSkillScores(skillScores);
        
        // 3. 计算综合评分
        double overallScore = calculateOverallSkillScore(skillScores);
        assessment.setOverallScore(overallScore);
        
        // 4. 确定技能等级
        SkillLevel skillLevel = determineSkillLevel(overallScore);
        assessment.setSkillLevel(skillLevel);
        
        // 5. 生成改进建议
        List<ImprovementSuggestion> suggestions = generateSkillImprovementSuggestions(skillScores);
        assessment.setImprovementSuggestions(suggestions);
        
        return assessment;
    }
}
```

---

## 总结

本详细实现规范为舜富QMS系统的审核管理模块提供了:

1. **内部审核**: 完整的审核计划、执行、发现处理、报告生成流程
2. **分层审核(LPA)**: 四层审核体系、智能评分、趋势分析、自动提醒
3. **外部审核**: 客户审核、认证审核、审核准备、过程跟踪、改进管理
4. **文档管理**: 文档上传、版本控制、智能检索、质量分析
5. **培训知识**: 审核培训计划、知识库管理、智能推荐、技能评估

所有实现遵循IATF16949审核要求,支持压铸行业特殊审核需求,提供智能化的审核管理解决方案。
