# 舜富QMS系统 - 供应商管理模块详细实现规范

## 1. 模块概述

### 1.1 功能定位
供应商管理模块是舜富QMS系统的关键组成部分，负责供应商全生命周期管理、绩效监控和质量评估，确保供应链质量稳定可靠，满足IATF16949:2016对供应链管理的要求。

### 1.2 业务价值
- **供应链质量管理**: 建立完整的供应商质量管理体系
- **绩效可视化**: 量化供应商绩效，支持持续改进
- **风险防控**: 识别和管控供应链质量风险
- **成本优化**: 基于绩效的供应商分级管理
- **协同管理**: 供需双方的质量协同改进

### 1.3 技术架构
- **前端**: Vue.js 3.x + Element Plus + ECharts可视化
- **后端**: Spring Boot 3.x + Spring Security + Spring Data JPA
- **数据库**: PostgreSQL (主业务) + MongoDB (文档) + InfluxDB (时序)
- **消息队列**: RabbitMQ/Kafka
- **报表**: JasperReports + Apache POI
- **监控**: Prometheus + Grafana

## 2. 核心功能详细设计

### 2.1 供应商分类管理

#### 2.1.1 多维度分类体系
```java
// 供应商分类实体
@Entity
@Table(name = "qms_supplier_category")
@Data
public class SupplierCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String categoryName;
    
    @Column(length = 500)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private SupplierCategory parent;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<SupplierCategory> children;
    
    @Column(nullable = false)
    private Integer level;
    
    @Column(nullable = false)
    private Integer sortOrder;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(nullable = false)
    private String categoryType; // MATERIAL, SERVICE, EQUIPMENT, MISC
    
    @Column(nullable = false)
    private String riskLevel; // HIGH, MEDIUM, LOW
}

// 供应商分类管理服务
@Service
@RequiredArgsConstructor
public class SupplierCategoryService {
    
    private final SupplierCategoryRepository categoryRepository;
    
    /**
     * 创建供应商分类
     */
    @Transactional
    public SupplierCategoryDTO createCategory(SupplierCategoryCreateDTO dto) {
        // 验证同级分类名称唯一性
        validateCategoryName(dto.getCategoryName(), dto.getParentId());
        
        SupplierCategory category = SupplierCategory.builder()
            .categoryName(dto.getCategoryName())
            .description(dto.getDescription())
            .parent(dto.getParentId() != null ? 
                categoryRepository.findById(dto.getParentId()).orElse(null) : null)
            .level(dto.getParentId() != null ? 
                getParentLevel(dto.getParentId()) + 1 : 1)
            .sortOrder(dto.getSortOrder())
            .categoryType(dto.getCategoryType())
            .riskLevel(dto.getRiskLevel())
            .active(true)
            .build();
        
        categoryRepository.save(category);
        
        return convertToDTO(category);
    }
    
    /**
     * 获取分类树结构
     */
    public List<CategoryTreeNodeDTO> getCategoryTree() {
        List<SupplierCategory> categories = categoryRepository.findByActiveTrueOrderBySortOrderAsc();
        return buildCategoryTree(categories);
    }
    
    private Integer getParentLevel(Long parentId) {
        SupplierCategory parent = categoryRepository.findById(parentId)
            .orElseThrow(() -> new EntityNotFoundException("Parent category not found"));
        return parent.getLevel();
    }
}
```

### 2.2 供应商基本信息管理

#### 2.2.1 供应商核心实体
```java
@Entity
@Table(name = "qms_supplier")
@Data
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String supplierName;
    
    @Column(nullable = false, length = 50)
    private String supplierCode;
    
    @Column(length = 20)
    private String supplierType; // MANUFACTURER, DISTRIBUTOR, SERVICE_PROVIDER
    
    @Column(length = 50)
    private String legalRepresentative;
    
    @Column(length = 100)
    private String registrationNumber;
    
    @Column(length = 200)
    private String address;
    
    @Column(length = 20)
    private String postalCode;
    
    @Column(length = 50)
    private String contactPerson;
    
    @Column(length = 20)
    private String contactPhone;
    
    @Column(length = 100)
    private String contactEmail;
    
    @Column(length = 50)
    private String website;
    
    @Column(nullable = false)
    private String businessScope;
    
    @Column(nullable = false)
    private LocalDateTime establishedDate;
    
    @Column(length = 500)
    private String companyProfile;
    
    @Column(nullable = false)
    private SupplierStatus status; // ACTIVE, INACTIVE, SUSPENDED
    
    @Column(nullable = false)
    private LocalDateTime registrationDate;
    
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "qms_supplier_category_relation",
        joinColumns = @JoinColumn(name = "supplier_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<SupplierCategory> categories = new HashSet<>();
    
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<SupplierContact> contacts = new ArrayList<>();
    
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<SupplierCertificate> certificates = new ArrayList<>();
    
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<SupplierQualityAgreement> agreements = new ArrayList<>();
}

@Entity
@Table(name = "qms_supplier_contact")
@Data
public class SupplierContact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false, length = 50)
    private String contactName;
    
    @Column(length = 20)
    private String position;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 100)
    private String email;
    
    @Column(nullable = false)
    private ContactType contactType; // PRIMARY, TECHNICAL, BUSINESS, EMERGENCY
    
    @Column(nullable = false)
    private Boolean active = true;
}

@Entity
@Table(name = "qms_supplier_certificate")
@Data
public class SupplierCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false, length = 100)
    private String certificateName;
    
    @Column(nullable = false, length = 50)
    private String certificateNumber;
    
    @Column(nullable = false)
    private CertificateType certificateType;
    
    @Column(nullable = false)
    private LocalDate issueDate;
    
    @Column(nullable = false)
    private LocalDate expiryDate;
    
    @Column(nullable = false)
    private String issuingAuthority;
    
    @Column(length = 500)
    private String certificateUrl;
    
    @Column(nullable = false)
    private CertificateStatus status; // VALID, EXPIRED, SUSPENDED
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updateCertificateStatus();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateCertificateStatus();
    }
    
    private void updateCertificateStatus() {
        if (expiryDate != null && expiryDate.isBefore(LocalDate.now())) {
            this.status = CertificateStatus.EXPIRED;
        } else {
            this.status = CertificateStatus.VALID;
        }
    }
}
```

#### 2.2.2 供应商管理服务
```java
@Service
@RequiredArgsConstructor
public class SupplierService {
    
    private final SupplierRepository supplierRepository;
    private final SupplierCategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    
    /**
     * 创建供应商
     */
    @Transactional
    public SupplierDTO createSupplier(SupplierCreateDTO dto, MultipartFile[] files) {
        // 验证供应商代码唯一性
        validateSupplierCode(dto.getSupplierCode());
        
        // 创建供应商实体
        Supplier supplier = Supplier.builder()
            .supplierName(dto.getSupplierName())
            .supplierCode(dto.getSupplierCode())
            .supplierType(dto.getSupplierType())
            .legalRepresentative(dto.getLegalRepresentative())
            .registrationNumber(dto.getRegistrationNumber())
            .address(dto.getAddress())
            .postalCode(dto.getPostalCode())
            .contactPerson(dto.getContactPerson())
            .contactPhone(dto.getContactPhone())
            .contactEmail(dto.getContactEmail())
            .website(dto.getWebsite())
            .businessScope(dto.getBusinessScope())
            .establishedDate(dto.getEstablishedDate())
            .companyProfile(dto.getCompanyProfile())
            .status(SupplierStatus.ACTIVE)
            .registrationDate(LocalDateTime.now())
            .lastUpdated(LocalDateTime.now())
            .build();
        
        // 设置分类
        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            Set<SupplierCategory> categories = categoryRepository.findAllById(dto.getCategoryIds());
            supplier.setCategories(categories);
        }
        
        supplierRepository.save(supplier);
        
        // 处理附件上传
        handleSupplierFiles(supplier, files);
        
        // 发送通知
        notificationService.sendSupplierCreatedNotification(supplier);
        
        return convertToDTO(supplier);
    }
    
    /**
     * 更新供应商信息
     */
    @Transactional
    public SupplierDTO updateSupplier(Long supplierId, SupplierUpdateDTO dto) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        // 更新基本信息
        if (StringUtils.hasText(dto.getSupplierName())) {
            supplier.setSupplierName(dto.getSupplierName());
        }
        if (StringUtils.hasText(dto.getLegalRepresentative())) {
            supplier.setLegalRepresentative(dto.getLegalRepresentative());
        }
        if (StringUtils.hasText(dto.getAddress())) {
            supplier.setAddress(dto.getAddress());
        }
        if (StringUtils.hasText(dto.getContactPhone())) {
            supplier.setContactPhone(dto.getContactPhone());
        }
        
        // 更新分类
        if (dto.getCategoryIds() != null) {
            Set<SupplierCategory> categories = categoryRepository.findAllById(dto.getCategoryIds());
            supplier.setCategories(categories);
        }
        
        supplier.setLastUpdated(LocalDateTime.now());
        supplierRepository.save(supplier);
        
        return convertToDTO(supplier);
    }
    
    /**
     * 供应商基本信息查询
     */
    public SupplierDetailDTO getSupplierDetail(Long supplierId) {
        Supplier supplier = supplierRepository.findByIdWithDetails(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        SupplierDetailDTO dto = convertToDetailDTO(supplier);
        
        // 获取绩效统计
        SupplierPerformanceStats stats = getSupplierPerformanceStats(supplierId);
        dto.setPerformanceStats(stats);
        
        // 获取风险评估结果
        SupplierRiskAssessment risk = getSupplierRiskAssessment(supplierId);
        dto.setRiskAssessment(risk);
        
        return dto;
    }
    
    /**
     * 供应商搜索
     */
    public Page<SupplierListDTO> searchSuppliers(SupplierSearchCriteria criteria, Pageable pageable) {
        Specification<Supplier> spec = Specification.where(null);
        
        // 关键词搜索
        if (StringUtils.hasText(criteria.getKeyword())) {
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(root.get("supplierName"), "%" + criteria.getKeyword() + "%"),
                cb.like(root.get("supplierCode"), "%" + criteria.getKeyword() + "%"),
                cb.like(root.get("contactPerson"), "%" + criteria.getKeyword() + "%")
            ));
        }
        
        // 分类过滤
        if (criteria.getCategoryId() != null) {
            spec = spec.and((root, query, cb) -> {
                Join<Supplier, SupplierCategory> categoryJoin = root.join("categories", JoinType.INNER);
                return cb.equal(categoryJoin.get("id"), criteria.getCategoryId());
            });
        }
        
        // 状态过滤
        if (criteria.getStatus() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), criteria.getStatus()));
        }
        
        // 供应商类型过滤
        if (StringUtils.hasText(criteria.getSupplierType())) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("supplierType"), criteria.getSupplierType()));
        }
        
        // 评级过滤
        if (criteria.getRating() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("currentRating"), criteria.getRating()));
        }
        
        Page<Supplier> page = supplierRepository.findAll(spec, pageable);
        return page.map(this::convertToListDTO);
    }
}
```

### 2.3 供应商评估认证管理

#### 2.3.1 供应商评估体系
```java
// 供应商评估实体
@Entity
@Table(name = "qms_supplier_assessment")
@Data
public class SupplierAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false, length = 100)
    private String assessmentName;
    
    @Column(nullable = false)
    private AssessmentType assessmentType; // INITIAL, PERIODIC, SPECIAL
    
    @Column(nullable = false)
    private LocalDate assessmentDate;
    
    @Column(nullable = false)
    private AssessorStatus status; // PLANNED, IN_PROGRESS, COMPLETED, FAILED
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessor_id", nullable = false)
    private User assessor;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL)
    private List<AssessmentCriteria> criteria = new ArrayList<>();
    
    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL)
    private List<AssessmentFinding> findings = new ArrayList<>();
    
    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL)
    private List<AssessmentEvidence> evidence = new ArrayList<>();
    
    @Column(nullable = false)
    private BigDecimal totalScore;
    
    @Column(nullable = false)
    private BigDecimal maxScore;
    
    @Column(nullable = false)
    private BigDecimal percentage;
    
    @Column(nullable = false)
    private SupplierRating rating; // A, B, C, D
    
    @Column(length = 2000)
    private String overallAssessment;
    
    @Column(length = 1000)
    private String improvementPlan;
    
    @Column
    private LocalDate nextAssessmentDate;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = AssessorStatus.PLANNED;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

// 评估标准实体
@Entity
@Table(name = "qms_assessment_criteria")
@Data
public class AssessmentCriteria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SupplierAssessment assessment;
    
    @Column(nullable = false, length = 200)
    private String criteriaName;
    
    @Column(nullable = false, length = 1000)
    private String criteriaDescription;
    
    @Column(nullable = false)
    private Integer weight;
    
    @Column(nullable = false)
    private BigDecimal maxScore;
    
    @Column(nullable = false)
    private BigDecimal actualScore;
    
    @Column(nullable = false)
    private String category; // QUALITY, DELIVERY, COST, SERVICE, TECHNOLOGY, MANAGEMENT
    
    @Column(length = 1000)
    private String evidenceRequired;
    
    @Column(length = 1000)
    private String improvementSuggestions;
    
    @Column(nullable = false)
    private AssessmentCriteriaStatus status; // NOT_STARTED, IN_PROGRESS, COMPLETED, N/A
}

// 评估发现实体
@Entity
@Table(name = "qms_assessment_finding")
@Data
public class AssessmentFinding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SupplierAssessment assessment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criteria_id", nullable = false)
    private AssessmentCriteria criteria;
    
    @Column(nullable = false, length = 500)
    private String findingDescription;
    
    @Column(nullable = false)
    private FindingSeverity severity; // CRITICAL, MAJOR, MINOR, OBSERVATION
    
    @Column(nullable = false, length = 1000)
    private String rootCauseAnalysis;
    
    @Column(nullable = false, length = 1000)
    private String correctiveAction;
    
    @Column(length = 1000)
    private String preventiveAction;
    
    @Column(nullable = false)
    private FindingStatus status; // OPEN, IN_PROGRESS, COMPLETED, VERIFIED
    
    @Column
    private LocalDate dueDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;
    
    @Column(length = 1000)
    private String verificationResults;
    
    @Column
    private LocalDate verificationDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verifier_id")
    private User verifier;
}
```

#### 2.3.2 评估流程管理
```java
@Service
@RequiredArgsConstructor
public class SupplierAssessmentService {
    
    private final SupplierAssessmentRepository assessmentRepository;
    private final AssessmentCriteriaRepository criteriaRepository;
    private final FindingRepository findingRepository;
    private final SupplierRepository supplierRepository;
    private final NotificationService notificationService;
    private final WorkflowEngine workflowEngine;
    
    /**
     * 创建供应商评估
     */
    @Transactional
    public SupplierAssessmentDTO createAssessment(SupplierAssessmentCreateDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        // 创建评估记录
        SupplierAssessment assessment = SupplierAssessment.builder()
            .supplier(supplier)
            .assessmentName(dto.getAssessmentName())
            .assessmentType(dto.getAssessmentType())
            .assessmentDate(dto.getAssessmentDate())
            .assessor(SecurityUtils.getCurrentUser())
            .totalScore(BigDecimal.ZERO)
            .maxScore(BigDecimal.ZERO)
            .percentage(BigDecimal.ZERO)
            .rating(SupplierRating.C)
            .status(AssessorStatus.PLANNED)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        assessmentRepository.save(assessment);
        
        // 创建评估标准
        createAssessmentCriteria(assessment, dto.getTemplateId());
        
        // 启动评估工作流
        startAssessmentWorkflow(assessment);
        
        return convertToDTO(assessment);
    }
    
    /**
     * 开始评估
     */
    @Transactional
    public void startAssessment(Long assessmentId) {
        SupplierAssessment assessment = assessmentRepository.findById(assessmentId)
            .orElseThrow(() -> new EntityNotFoundException("Assessment not found"));
        
        assessment.setStatus(AssessorStatus.IN_PROGRESS);
        assessment.setUpdatedAt(LocalDateTime.now());
        assessmentRepository.save(assessment);
        
        // 启动评估任务分配
        assignAssessmentTasks(assessment);
        
        notificationService.sendAssessmentStartedNotification(assessment);
    }
    
    /**
     * 提交评估结果
     */
    @Transactional
    public void submitAssessment(Long assessmentId, AssessmentSubmitDTO dto) {
        SupplierAssessment assessment = assessmentRepository.findById(assessmentId)
            .orElseThrow(() -> new EntityNotFoundException("Assessment not found"));
        
        // 验证评估完成
        validateAssessmentCompletion(assessment);
        
        // 计算总分和评级
        calculateAssessmentScore(assessment, dto.getScores());
        
        // 更新状态
        assessment.setStatus(AssessorStatus.COMPLETED);
        assessment.setOverallAssessment(dto.getOverallAssessment());
        assessment.setImprovementPlan(dto.getImprovementPlan());
        assessment.setNextAssessmentDate(dto.getNextAssessmentDate());
        assessment.setUpdatedAt(LocalDateTime.now());
        
        assessmentRepository.save(assessment);
        
        // 更新供应商评级
        updateSupplierRating(assessment.getSupplier().getId(), assessment.getRating());
        
        // 发送通知
        notificationService.sendAssessmentCompletedNotification(assessment);
    }
    
    /**
     * 创建评估标准
     */
    private void createAssessmentCriteria(SupplierAssessment assessment, Long templateId) {
        AssessmentTemplate template = getAssessmentTemplate(templateId);
        
        for (TemplateCriteria templateCriteria : template.getCriteria()) {
            AssessmentCriteria criteria = AssessmentCriteria.builder()
                .assessment(assessment)
                .criteriaName(templateCriteria.getName())
                .criteriaDescription(templateCriteria.getDescription())
                .weight(templateCriteria.getWeight())
                .maxScore(templateCriteria.getMaxScore())
                .category(templateCriteria.getCategory())
                .evidenceRequired(templateCriteria.getEvidenceRequired())
                .improvementSuggestions(templateCriteria.getImprovementSuggestions())
                .status(AssessmentCriteriaStatus.NOT_STARTED)
                .actualScore(BigDecimal.ZERO)
                .build();
            
            criteriaRepository.save(criteria);
            assessment.getCriteria().add(criteria);
        }
        
        // 计算总分
        BigDecimal maxScore = assessment.getCriteria().stream()
            .map(c -> c.getMaxScore())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assessment.setMaxScore(maxScore);
        
        assessmentRepository.save(assessment);
    }
    
    /**
     * 计算评估分数和评级
     */
    private void calculateAssessmentScore(SupplierAssessment assessment, Map<Long, BigDecimal> scores) {
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal totalMaxScore = assessment.getMaxScore();
        
        // 更新每个标准的分数
        for (Map.Entry<Long, BigDecimal> entry : scores.entrySet()) {
            AssessmentCriteria criteria = criteriaRepository.findById(entry.getKey())
                .orElseThrow(() -> new EntityNotFoundException("Criteria not found"));
            
            criteria.setActualScore(entry.getValue());
            criteria.setStatus(AssessmentCriteriaStatus.COMPLETED);
            criteriaRepository.save(criteria);
            
            totalScore = totalScore.add(entry.getValue().multiply(new BigDecimal(criteria.getWeight())));
        }
        
        // 计算百分比
        BigDecimal percentage = totalScore.divide(totalMaxScore, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        
        // 确定评级
        SupplierRating rating = determineRating(percentage);
        
        // 更新评估结果
        assessment.setTotalScore(totalScore);
        assessment.setPercentage(percentage);
        assessment.setRating(rating);
        
        assessmentRepository.save(assessment);
    }
    
    /**
     * 确定供应商评级
     */
    private SupplierRating determineRating(BigDecimal percentage) {
        if (percentage.compareTo(new BigDecimal("90")) >= 0) {
            return SupplierRating.A;
        } else if (percentage.compareTo(new BigDecimal("80")) >= 0) {
            return SupplierRating.B;
        } else if (percentage.compareTo(new BigDecimal("60")) >= 0) {
            return SupplierRating.C;
        } else {
            return SupplierRating.D;
        }
    }
    
    /**
     * 更新供应商评级
     */
    private void updateSupplierRating(Long supplierId, SupplierRating newRating) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        supplier.setCurrentRating(newRating);
        supplier.setLastRatingUpdate(LocalDateTime.now());
        supplierRepository.save(supplier);
    }
}
```

### 2.4 供应商绩效监控

#### 2.4.1 绩效指标体系
```java
// 供应商绩效实体
@Entity
@Table(name = "qms_supplier_performance")
@Data
public class SupplierPerformance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false)
    private LocalDate performanceMonth;
    
    @Column(nullable = false)
    private BigDecimal qualityScore;
    
    @Column(nullable = false)
    private BigDecimal deliveryScore;
    
    @Column(nullable = false)
    private BigDecimal costScore;
    
    @Column(nullable = false)
    private BigDecimal serviceScore;
    
    @Column(nullable = false)
    private BigDecimal technologyScore;
    
    @Column(nullable = false)
    private BigDecimal managementScore;
    
    @Column(nullable = false)
    private BigDecimal overallScore;
    
    @Column(nullable = false)
    private SupplierRating rating;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(length = 1000)
    private String performanceSummary;
    
    @Column(length = 2000)
    private String improvementAreas;
    
    @OneToMany(mappedBy = "performance", cascade = CascadeType.ALL)
    private List<PerformanceMetric> metrics = new ArrayList<>();
    
    @OneToMany(mappedBy = "performance", cascade = CascadeType.ALL)
    private List<PerformanceIncident> incidents = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

// 绩效指标实体
@Entity
@Table(name = "qms_performance_metric")
@Data
public class PerformanceMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id", nullable = false)
    private SupplierPerformance performance;
    
    @Column(nullable = false, length = 100)
    private String metricName;
    
    @Column(nullable = false)
    private String metricType; // QUANTITY, PERCENTAGE, RATIO, SCORE
    
    @Column(nullable = false)
    private BigDecimal targetValue;
    
    @Column(nullable = false)
    private BigDecimal actualValue;
    
    @Column(nullable = false)
    private BigDecimal score;
    
    @Column(nullable = false)
    private MetricStatus status; // ON_TARGET, BELOW_TARGET, ABOVE_TARGET
    
    @Column(nullable = false)
    private String category; // QUALITY, DELIVERY, COST, SERVICE, TECHNOLOGY, MANAGEMENT
    
    @Column(length = 500)
    private String calculationMethod;
    
    @Column(length = 1000)
    private String comments;
}
```

#### 2.4.2 绩效监控服务
```java
@Service
@RequiredArgsConstructor
public class SupplierPerformanceService {
    
    private final SupplierPerformanceRepository performanceRepository;
    private final PerformanceMetricRepository metricRepository;
    private final IncidentRepository incidentRepository;
    private final SupplierRepository supplierRepository;
    private InfluxDBClient influxDBClient;
    
    /**
     * 记录供应商绩效
     */
    @Transactional
    public SupplierPerformanceDTO recordPerformance(SupplierPerformanceDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        // 检查是否已存在该月的绩效记录
        LocalDate performanceMonth = dto.getPerformanceMonth();
        Optional<SupplierPerformance> existing = performanceRepository
            .findBySupplierIdAndPerformanceMonth(supplier.getId(), performanceMonth);
        
        if (existing.isPresent()) {
            throw new IllegalStateException("Performance record already exists for this month");
        }
        
        // 创建绩效记录
        SupplierPerformance performance = SupplierPerformance.builder()
            .supplier(supplier)
            .performanceMonth(performanceMonth)
            .qualityScore(dto.getQualityScore())
            .deliveryScore(dto.getDeliveryScore())
            .costScore(dto.getCostScore())
            .serviceScore(dto.getServiceScore())
            .technologyScore(dto.getTechnologyScore())
            .managementScore(dto.getManagementScore())
            .performanceSummary(dto.getPerformanceSummary())
            .improvementAreas(dto.getImprovementAreas())
            .createdAt(LocalDateTime.now())
            .build();
        
        // 计算总分和评级
        calculateOverallScore(performance);
        
        performanceRepository.save(performance);
        
        // 记录指标
        recordPerformanceMetrics(performance, dto.getMetrics());
        
        // 记录事件
        recordPerformanceIncidents(performance, dto.getIncidents());
        
        // 写入时序数据库
        writePerformanceToTimeSeries(performance);
        
        return convertToDTO(performance);
    }
    
    /**
     * 计算综合绩效分数
     */
    private void calculateOverallScore(SupplierPerformance performance) {
        // 定义权重
        Map<String, BigDecimal> weights = Map.of(
            "quality", new BigDecimal("0.30"),
            "delivery", new BigDecimal("0.25"),
            "cost", new BigDecimal("0.15"),
            "service", new BigDecimal("0.10"),
            "technology", new BigDecimal("0.10"),
            "management", new BigDecimal("0.10")
        );
        
        // 计算加权总分
        BigDecimal totalScore = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : weights.entrySet()) {
            BigDecimal categoryScore = getScoreByCategory(performance, entry.getKey());
            totalScore = totalScore.add(categoryScore.multiply(entry.getValue()));
        }
        
        performance.setOverallScore(totalScore.setScale(2, RoundingMode.HALF_UP));
        
        // 确定评级
        SupplierRating rating = determineRating(totalScore);
        performance.setRating(rating);
    }
    
    /**
     * 获取分类分数
     */
    private BigDecimal getScoreByCategory(SupplierPerformance performance, String category) {
        switch (category) {
            case "quality":
                return performance.getQualityScore();
            case "delivery":
                return performance.getDeliveryScore();
            case "cost":
                return performance.getCostScore();
            case "service":
                return performance.getServiceScore();
            case "technology":
                return performance.getTechnologyScore();
            case "management":
                return performance.getManagementScore();
            default:
                return BigDecimal.ZERO;
        }
    }
    
    /**
     * 生成月度绩效报告
     */
    @Async
    public void generateMonthlyPerformanceReport(LocalDate month) {
        List<Supplier> activeSuppliers = supplierRepository.findByStatus(SupplierStatus.ACTIVE);
        
        for (Supplier supplier : activeSuppliers) {
            generateSupplierPerformanceReport(supplier, month);
        }
    }
    
    /**
     * 生成供应商绩效趋势分析
     */
    public PerformanceTrendDTO getPerformanceTrend(Long supplierId, int months) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(months);
        
        List<SupplierPerformance> performances = performanceRepository
            .findBySupplierIdAndPerformanceMonthBetween(supplierId, startDate, endDate);
        
        PerformanceTrendDTO trend = new PerformanceTrendDTO();
        trend.setSupplierId(supplierId);
        trend.setStartDate(startDate);
        trend.setEndDate(endDate);
        
        // 按月组织数据
        Map<LocalDate, PerformanceMonthData> monthlyData = new HashMap<>();
        
        for (SupplierPerformance performance : performances) {
            PerformanceMonthData monthData = new PerformanceMonthData();
            monthData.setMonth(performance.getPerformanceMonth());
            monthData.setOverallScore(performance.getOverallScore());
            monthData.setQualityScore(performance.getQualityScore());
            monthData.setDeliveryScore(performance.getDeliveryScore());
            monthData.setCostScore(performance.getCostScore());
            monthData.setServiceScore(performance.getServiceScore());
            monthData.setTechnologyScore(performance.getTechnologyScore());
            monthData.setManagementScore(performance.getManagementScore());
            monthData.setRating(performance.getRating());
            
            monthlyData.put(performance.getPerformanceMonth(), monthData);
        }
        
        trend.setMonthlyData(new ArrayList<>(monthlyData.values()));
        
        // 计算趋势指标
        calculateTrendIndicators(trend);
        
        return trend;
    }
    
    /**
     * 计算趋势指标
     */
    private void calculateTrendIndicators(PerformanceTrendDTO trend) {
        List<PerformanceMonthData> monthlyData = trend.getMonthlyData();
        
        if (monthlyData.size() < 2) {
            return;
        }
        
        // 计算总体趋势
        BigDecimal firstScore = monthlyData.get(0).getOverallScore();
        BigDecimal lastScore = monthlyData.get(monthlyData.size() - 1).getOverallScore();
        BigDecimal trendScore = lastScore.subtract(firstScore);
        
        trend.setOverallTrend(trendScore.compareTo(BigDecimal.ZERO) > 0 ? "IMPROVING" : 
                            trendScore.compareTo(BigDecimal.ZERO) < 0 ? "DECLINING" : "STABLE");
        
        // 计算各分类趋势
        Map<String, String> categoryTrends = new HashMap<>();
        categoryTrends.put("quality", calculateCategoryTrend(monthlyData, PerformanceMonthData::getQualityScore));
        categoryTrends.put("delivery", calculateCategoryTrend(monthlyData, PerformanceMonthData::getDeliveryScore));
        categoryTrends.put("cost", calculateCategoryTrend(monthlyData, PerformanceMonthData::getCostScore));
        categoryTrends.put("service", calculateCategoryTrend(monthlyData, PerformanceMonthData::getServiceScore));
        categoryTrends.put("technology", calculateCategoryTrend(monthlyData, PerformanceMonthData::getTechnologyScore));
        categoryTrends.put("management", calculateCategoryTrend(monthlyData, PerformanceMonthData::getManagementScore));
        
        trend.setCategoryTrends(categoryTrends);
    }
    
    private String calculateCategoryTrend(List<PerformanceMonthData> monthlyData, 
                                        Function<PerformanceMonthData, BigDecimal> scoreExtractor) {
        if (monthlyData.size() < 2) {
            return "STABLE";
        }
        
        BigDecimal firstScore = scoreExtractor.apply(monthlyData.get(0));
        BigDecimal lastScore = scoreExtractor.apply(monthlyData.get(monthlyData.size() - 1));
        BigDecimal difference = lastScore.subtract(firstScore);
        
        if (difference.abs().compareTo(new BigDecimal("2")) < 0) {
            return "STABLE";
        }
        
        return difference.compareTo(BigDecimal.ZERO) > 0 ? "IMPROVING" : "DECLINING";
    }
}
```

### 2.5 供应商质量管理

#### 2.5.1 质量问题跟踪
```java
// 供应商质量问题实体
@Entity
@Table(name = "qms_supplier_quality_issue")
@Data
public class SupplierQualityIssue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false, length = 100)
    private String issueCode;
    
    @Column(nullable = false, length = 500)
    private String issueDescription;
    
    @Column(nullable = false)
    private QualityIssueType issueType; // MATERIAL_DEFECT, PROCESS_DEFECT, DOCUMENTATION, OTHER
    
    @Column(nullable = false)
    private IssueSeverity severity; // CRITICAL, MAJOR, MINOR
    
    @Column(nullable = false)
    private IssueStatus status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    
    @Column(nullable = false)
    private LocalDate discoveryDate;
    
    @Column
    private LocalDate targetResolutionDate;
    
    @Column
    private LocalDate actualResolutionDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private User reportedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(length = 2000)
    private String rootCauseAnalysis;
    
    @Column(length = 2000)
    private String correctiveAction;
    
    @Column(length = 2000)
    private String preventiveAction;
    
    @Column(length = 1000)
    private String verificationResults;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;
    
    @Column
    private LocalDateTime verificationDate;
    
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL)
    private List<QualityIssueAttachment> attachments = new ArrayList<>();
    
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL)
    private List<IssueHistory> history = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        discoveryDate = LocalDate.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### 2.5.2 质量问题管理服务
```java
@Service
@RequiredArgsConstructor
public class SupplierQualityIssueService {
    
    private final SupplierQualityIssueRepository issueRepository;
    private final SupplierRepository supplierRepository;
    private final NotificationService notificationService;
    private final WorkflowEngine workflowEngine;
    
    /**
     * 创建供应商质量问题
     */
    @Transactional
    public SupplierQualityIssueDTO createIssue(SupplierQualityIssueCreateDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        // 生成问题编号
        String issueCode = generateIssueCode();
        
        // 创建质量问题记录
        SupplierQualityIssue issue = SupplierQualityIssue.builder()
            .supplier(supplier)
            .issueCode(issueCode)
            .issueDescription(dto.getIssueDescription())
            .issueType(dto.getIssueType())
            .severity(dto.getSeverity())
            .status(IssueStatus.OPEN)
            .reportedBy(SecurityUtils.getCurrentUser())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .targetResolutionDate(dto.getTargetResolutionDate())
            .build();
        
        issueRepository.save(issue);
        
        // 分配处理任务
        assignIssueTask(issue);
        
        // 记录历史
        recordIssueHistory(issue, "ISSUE_CREATED", "质量问题已创建");
        
        // 发送通知
        notificationService.sendSupplierQualityIssueCreatedNotification(issue);
        
        return convertToDTO(issue);
    }
    
    /**
     * 更新问题状态
     */
    @Transactional
    public void updateIssueStatus(Long issueId, IssueStatus newStatus, String comment) {
        SupplierQualityIssue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new EntityNotFoundException("Quality issue not found"));
        
        IssueStatus oldStatus = issue.getStatus();
        issue.setStatus(newStatus);
        issue.setUpdatedAt(LocalDateTime.now());
        
        // 如果问题已解决，记录解决日期
        if (newStatus == IssueStatus.RESOLVED) {
            issue.setActualResolutionDate(LocalDate.now());
        }
        
        issueRepository.save(issue);
        
        // 记录状态变更历史
        recordIssueHistory(issue, "STATUS_CHANGED", 
            String.format("状态从 %s 变更为 %s", oldStatus, newStatus), comment);
        
        // 发送通知
        notificationService.sendSupplierQualityIssueStatusChangedNotification(issue, oldStatus, newStatus);
    }
    
    /**
     * 分配问题处理任务
     */
    @Transactional
    public void assignIssue(Long issueId, Long assigneeId, String comment) {
        SupplierQualityIssue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new EntityNotFoundException("Quality issue not found"));
        
        User assignee = userRepository.findById(assigneeId)
            .orElseThrow(() -> new EntityNotFoundException("Assignee not found"));
        
        User oldAssignee = issue.getAssignedTo();
        issue.setAssignedTo(assignee);
        issue.setUpdatedAt(LocalDateTime.now());
        
        issueRepository.save(issue);
        
        // 记录分配历史
        recordIssueHistory(issue, "ASSIGNED", 
            String.format("从 %s 分配给 %s", 
                oldAssignee != null ? oldAssignee.getName() : "未分配", 
                assignee.getName()), comment);
        
        // 通知新负责人
        notificationService.sendSupplierQualityIssueAssignedNotification(issue, assignee);
    }
    
    /**
     * 关闭质量问题
     */
    @Transactional
    public void closeIssue(Long issueId, String verificationResults, String comment) {
        SupplierQualityIssue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new EntityNotFoundException("Quality issue not found"));
        
        if (issue.getStatus() != IssueStatus.RESOLVED) {
            throw new IllegalStateException("Only resolved issues can be closed");
        }
        
        issue.setStatus(IssueStatus.CLOSED);
        issue.setVerificationResults(verificationResults);
        issue.setVerifiedBy(SecurityUtils.getCurrentUser());
        issue.setVerificationDate(LocalDate.now());
        issue.setUpdatedAt(LocalDateTime.now());
        
        issueRepository.save(issue);
        
        // 记录关闭历史
        recordIssueHistory(issue, "CLOSED", "质量问题已关闭", comment);
        
        // 更新供应商绩效
        updateSupplierQualityPerformance(issue.getSupplier().getId());
        
        // 发送通知
        notificationService.sendSupplierQualityIssueClosedNotification(issue);
    }
    
    /**
     * 获取供应商质量问题统计
     */
    public SupplierQualityStatsDTO getSupplierQualityStats(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        SupplierQualityStatsDTO stats = new SupplierQualityStatsDTO();
        stats.setSupplierId(supplierId);
        stats.setSupplierName(supplier.getSupplierName());
        
        // 获取各类问题统计
        Map<IssueSeverity, Long> severityStats = issueRepository
            .countBySupplierIdAndSeverity(supplierId);
        stats.setSeverityStats(severityStats);
        
        // 获取状态统计
        Map<IssueStatus, Long> statusStats = issueRepository
            .countBySupplierIdAndStatus(supplierId);
        stats.setStatusStats(statusStats);
        
        // 计算质量指数
        BigDecimal qualityIndex = calculateQualityIndex(supplierId);
        stats.setQualityIndex(qualityIndex);
        
        // 获取最近的问题
        List<SupplierQualityIssue> recentIssues = issueRepository
            .findTop10BySupplierIdOrderByCreatedAtDesc(supplierId);
        stats.setRecentIssues(recentIssues.stream().map(this::convertToDTO).collect(Collectors.toList()));
        
        return stats;
    }
    
    /**
     * 计算质量指数
     */
    private BigDecimal calculateQualityIndex(Long supplierId) {
        // 获取过去6个月的问题数据
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        List<SupplierQualityIssue> recentIssues = issueRepository
            .findBySupplierIdAndDiscoveryDateAfter(supplierId, sixMonthsAgo);
        
        if (recentIssues.isEmpty()) {
            return BigDecimal.valueOf(100); // 没有问题得满分
        }
        
        // 计算加权分数
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedScore = BigDecimal.ZERO;
        
        for (SupplierQualityIssue issue : recentIssues) {
            BigDecimal severityWeight = getSeverityWeight(issue.getSeverity());
            totalWeight = totalWeight.add(severityWeight);
            
            // 未解决的问题扣分
            if (issue.getStatus() != IssueStatus.CLOSED) {
                weightedScore = weightedScore.add(severityWeight);
            }
        }
        
        if (totalWeight.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(100);
        }
        
        // 质量指数 = 100 - (加权扣分 / 总权重 * 100)
        BigDecimal deduction = weightedScore.divide(totalWeight, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
        
        return BigDecimal.valueOf(100).subtract(deduction).max(BigDecimal.ZERO);
    }
    
    /**
     * 获取严重性权重
     */
    private BigDecimal getSeverityWeight(IssueSeverity severity) {
        switch (severity) {
            case CRITICAL:
                return new BigDecimal("3.0");
            case MAJOR:
                return new BigDecimal("2.0");
            case MINOR:
                return new BigDecimal("1.0");
            default:
                return BigDecimal.ONE;
        }
    }
    
    /**
     * 更新供应商质量绩效
     */
    private void updateSupplierQualityPerformance(Long supplierId) {
        SupplierQualityStatsDTO stats = getSupplierQualityStats(supplierId);
        BigDecimal qualityIndex = stats.getQualityIndex();
        
        // 根据质量指数调整供应商绩效分数
        SupplierPerformance latestPerformance = performanceRepository
            .findTopBySupplierIdOrderByPerformanceMonthDesc(supplierId)
            .orElse(null);
        
        if (latestPerformance != null) {
            // 质量指数转换为质量分数
            BigDecimal qualityScore = qualityIndex.multiply(new BigDecimal("0.4"))
                .add(new BigDecimal("60")); // 基础分60分
            
            latestPerformance.setQualityScore(qualityScore);
            performanceRepository.save(latestPerformance);
        }
    }
}
```

### 2.6 供应商风险管控

#### 2.6.1 风险评估体系
```java
// 供应商风险评估实体
@Entity
@Table(name = "qms_supplier_risk_assessment")
@Data
public class SupplierRiskAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false, length = 100)
    private String assessmentName;
    
    @Column(nullable = false)
    private LocalDate assessmentDate;
    
    @Column(nullable = false)
    private RiskAssessmentStatus status; // DRAFT, IN_REVIEW, APPROVED, REJECTED
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(nullable = false)
    private BigDecimal overallRiskScore;
    
    @Column(nullable = false)
    private RiskLevel overallRiskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(nullable = false)
    private RiskAssessmentType assessmentType; // INITIAL, PERIODIC, TRIGGERED
    
    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL)
    private List<RiskFactor> riskFactors = new ArrayList<>();
    
    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL)
    private List<RiskMitigation> mitigations = new ArrayList<>();
    
    @Column(length = 2000)
    private String riskSummary;
    
    @Column(length = 2000)
    private String riskMitigationPlan;
    
    @Column
    private LocalDate nextAssessmentDate;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

// 风险因素实体
@Entity
@Table(name = "qms_risk_factor")
@Data
public class RiskFactor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SupplierRiskAssessment assessment;
    
    @Column(nullable = false, length = 200)
    private String factorName;
    
    @Column(nullable = false)
    private RiskCategory category; // FINANCIAL, OPERATIONAL, QUALITY, COMPLIANCE, REPUTATIONAL
    
    @Column(nullable = false)
    private RiskImpact impact; // HIGH, MEDIUM, LOW
    
    @Column(nullable = false)
    private RiskProbability probability; // HIGH, MEDIUM, LOW
    
    @Column(nullable = false)
    private BigDecimal riskScore;
    
    @Column(nullable = false)
    private RiskLevel riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(nullable = false, length = 1000)
    private String riskDescription;
    
    @Column(nullable = false, length = 1000)
    private String existingControls;
    
    @Column(length = 1000)
    private String additionalControls;
    
    @Column(nullable = false)
    private RiskFactorStatus status; // IDENTIFIED, ANALYZED, MITIGATED, ACCEPTED
}
```

#### 2.6.2 风险管理服务
```java
@Service
@RequiredArgsConstructor
public class SupplierRiskService {
    
    private final SupplierRiskAssessmentRepository riskRepository;
    private final RiskFactorRepository factorRepository;
    private final SupplierRepository supplierRepository;
    private final RiskNotificationService riskNotificationService;
    
    /**
     * 创建风险评估
     */
    @Transactional
    public SupplierRiskAssessmentDTO createRiskAssessment(SupplierRiskAssessmentCreateDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        // 创建风险评估记录
        SupplierRiskAssessment assessment = SupplierRiskAssessment.builder()
            .supplier(supplier)
            .assessmentName(dto.getAssessmentName())
            .assessmentDate(dto.getAssessmentDate())
            .status(RiskAssessmentStatus.DRAFT)
            .assessmentType(dto.getAssessmentType())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        riskRepository.save(assessment);
        
        // 创建初始风险因素
        createInitialRiskFactors(assessment);
        
        return convertToDTO(assessment);
    }
    
    /**
     * 评估风险因素
     */
    @Transactional
    public void assessRiskFactor(Long factorId, RiskAssessmentDTO dto) {
        RiskFactor factor = factorRepository.findById(factorId)
            .orElseThrow(() -> new EntityNotFoundException("Risk factor not found"));
        
        // 更新影响和概率
        factor.setImpact(dto.getImpact());
        factor.setProbability(dto.getProbability());
        
        // 计算风险分数
        BigDecimal riskScore = calculateRiskScore(dto.getImpact(), dto.getProbability());
        factor.setRiskScore(riskScore);
        
        // 确定风险等级
        RiskLevel riskLevel = determineRiskLevel(riskScore);
        factor.setRiskLevel(riskLevel);
        
        factor.setStatus(RiskFactorStatus.ANALYZED);
        factorRepository.save(factor);
        
        // 更新总体风险评估
        updateOverallRiskAssessment(factor.getAssessment().getId());
    }
    
    /**
     * 创建缓解措施
     */
    @Transactional
    public void createRiskMitigation(Long assessmentId, RiskMitigationCreateDTO dto) {
        SupplierRiskAssessment assessment = riskRepository.findById(assessmentId)
            .orElseThrow(() -> new EntityNotFoundException("Risk assessment not found"));
        
        // 验证相关风险因素
        RiskFactor factor = factorRepository.findById(dto.getFactorId())
            .orElseThrow(() -> new EntityNotFoundException("Risk factor not found"));
        
        if (!factor.getAssessment().getId().equals(assessmentId)) {
            throw new IllegalStateException("Risk factor does not belong to this assessment");
        }
        
        // 创建缓解措施
        RiskMitigation mitigation = RiskMitigation.builder()
            .assessment(assessment)
            .factor(factor)
            .mitigationTitle(dto.getMitigationTitle())
            .mitigationDescription(dto.getMitigationDescription())
            .mitigationType(dto.getMitigationType())
            .targetReduction(dto.getTargetReduction())
            .implementationDate(dto.getImplementationDate())
            .responsiblePerson(dto.getResponsiblePerson())
            .status(MitigationStatus.PLANNED)
            .createdAt(LocalDateTime.now())
            .build();
        
        assessment.getMitigations().add(mitigation);
        riskRepository.save(assessment);
        
        // 更新风险因素状态
        factor.setStatus(RiskFactorStatus.MITIGATED);
        factorRepository.save(factor);
        
        // 更新总体风险评估
        updateOverallRiskAssessment(assessmentId);
    }
    
    /**
     * 计算风险分数
     */
    private BigDecimal calculateRiskScore(RiskImpact impact, RiskProbability probability) {
        // 定义分值
        Map<RiskImpact, Integer> impactScores = Map.of(
            RiskImpact.HIGH, 3,
            RiskImpact.MEDIUM, 2,
            RiskImpact.LOW, 1
        );
        
        Map<RiskProbability, Integer> probabilityScores = Map.of(
            RiskProbability.HIGH, 3,
            RiskProbability.MEDIUM, 2,
            RiskProbability.LOW, 1
        );
        
        int impactScore = impactScores.get(impact);
        int probabilityScore = probabilityScores.get(probability);
        
        return new BigDecimal(impactScore * probabilityScore);
    }
    
    /**
     * 确定风险等级
     */
    private RiskLevel determineRiskLevel(BigDecimal riskScore) {
        if (riskScore.compareTo(new BigDecimal("9")) >= 0) {
            return RiskLevel.CRITICAL;
        } else if (riskScore.compareTo(new BigDecimal("6")) >= 0) {
            return RiskLevel.HIGH;
        } else if (riskScore.compareTo(new BigDecimal("3")) >= 0) {
            return RiskLevel.MEDIUM;
        } else {
            return RiskLevel.LOW;
        }
    }
    
    /**
     * 更新总体风险评估
     */
    private void updateOverallRiskAssessment(Long assessmentId) {
        SupplierRiskAssessment assessment = riskRepository.findById(assessmentId)
            .orElseThrow(() -> new EntityNotFoundException("Risk assessment not found"));
        
        List<RiskFactor> factors = factorRepository.findByAssessmentId(assessmentId);
        
        if (factors.isEmpty()) {
            return;
        }
        
        // 计算加权平均风险分数
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedScore = BigDecimal.ZERO;
        
        for (RiskFactor factor : factors) {
            BigDecimal weight = getRiskFactorWeight(factor.getRiskLevel());
            totalWeight = totalWeight.add(weight);
            
            // 未缓解的风险因素需要额外考虑
            if (factor.getStatus() != RiskFactorStatus.MITIGATED && 
                factor.getStatus() != RiskFactorStatus.ACCEPTED) {
                weightedScore = weightedScore.add(factor.getRiskScore().multiply(weight));
            } else {
                weightedScore = weightedScore.add(factor.getRiskScore().multiply(weight).multiply(new BigDecimal("0.3")));
            }
        }
        
        if (totalWeight.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        
        BigDecimal overallScore = weightedScore.divide(totalWeight, 2, RoundingMode.HALF_UP);
        
        // 确定总体风险等级
        RiskLevel overallLevel = determineRiskLevel(overallScore);
        
        assessment.setOverallRiskScore(overallScore);
        assessment.setOverallRiskLevel(overallLevel);
        riskRepository.save(assessment);
        
        // 检查是否需要触发预警
        if (overallLevel == RiskLevel.CRITICAL || overallLevel == RiskLevel.HIGH) {
            riskNotificationService.sendHighRiskAlert(assessment);
        }
    }
    
    /**
     * 获取风险因素权重
     */
    private BigDecimal getRiskFactorWeight(RiskLevel level) {
        switch (level) {
            case CRITICAL:
                return new BigDecimal("3.0");
            case HIGH:
                return new BigDecimal("2.5");
            case MEDIUM:
                return new BigDecimal("2.0");
            case LOW:
                return new BigDecimal("1.0");
            default:
                return BigDecimal.ONE;
        }
    }
    
    /**
     * 获取供应商风险仪表板数据
     */
    public SupplierRiskDashboardDTO getSupplierRiskDashboard(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        SupplierRiskDashboardDTO dashboard = new SupplierRiskDashboardDTO();
        dashboard.setSupplierId(supplierId);
        dashboard.setSupplierName(supplier.getSupplierName());
        
        // 获取最新的风险评估
        SupplierRiskAssessment latestAssessment = riskRepository
            .findTopBySupplierIdOrderByAssessmentDateDesc(supplierId)
            .orElse(null);
        
        if (latestAssessment != null) {
            dashboard.setLatestAssessment(convertToDTO(latestAssessment));
            
            // 风险分布统计
            Map<RiskLevel, Long> riskDistribution = factorRepository
                .countByAssessmentIdAndRiskLevel(latestAssessment.getId());
            dashboard.setRiskDistribution(riskDistribution);
            
            // 风险趋势
            List<RiskAssessmentTrend> trend = getRiskAssessmentTrend(supplierId, 12);
            dashboard.setRiskTrend(trend);
        }
        
        // 高风险因素列表
        List<RiskFactor> highRiskFactors = factorRepository
            .findByAssessmentIdAndRiskLevelInOrderByRiskScoreDesc(
                latestAssessment != null ? latestAssessment.getId() : -1, 
                List.of(RiskLevel.CRITICAL, RiskLevel.HIGH));
        dashboard.setHighRiskFactors(highRiskFactors.stream().map(this::convertFactorToDTO).collect(Collectors.toList()));
        
        return dashboard;
    }
    
    /**
     * 获取风险评估趋势
     */
    private List<RiskAssessmentTrend> getRiskAssessmentTrend(Long supplierId, int months) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(months);
        
        List<SupplierRiskAssessment> assessments = riskRepository
            .findBySupplierIdAndAssessmentDateBetween(supplierId, startDate, endDate);
        
        return assessments.stream()
            .map(assessment -> {
                RiskAssessmentTrend trend = new RiskAssessmentTrend();
                trend.setAssessmentDate(assessment.getAssessmentDate());
                trend.setOverallRiskScore(assessment.getOverallRiskScore());
                trend.setOverallRiskLevel(assessment.getOverallRiskLevel());
                return trend;
            })
            .sorted(Comparator.comparing(RiskAssessmentTrend::getAssessmentDate))
            .collect(Collectors.toList());
    }
}
```

### 2.7 供应商协同管理

#### 2.7.1 协同工作流
```java
// 供应商协同任务实体
@Entity
@Table(name = "qms_supplier_collaboration_task")
@Data
public class SupplierCollaborationTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
    
    @Column(nullable = false, length = 100)
    private String taskCode;
    
    @Column(nullable = false, length = 200)
    private String taskTitle;
    
    @Column(nullable = false)
    private CollaborationTaskType taskType; // QUALITY_IMPROVEMENT, DELIVERY_COORDINATION, COST_OPTIMIZATION
    
    @Column(nullable = false)
    private TaskStatus status; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    @Column
    private LocalDate targetDate;
    
    @Column
    private LocalDate actualCompletionDate;
    
    @Column(nullable = false)
    private String taskDescription;
    
    @Column(nullable = false, length = 1000)
    private String deliverables;
    
    @Column(length = 2000)
    private String collaborationPlan;
    
    @Column(length = 2000)
    private String progressReport;
    
    @Column(length = 1000)
    private String finalResults;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiator_id", nullable = false)
    private User initiator;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_contact_id")
    private User supplierContact;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskAttachment> attachments = new ArrayList<>();
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskMeeting> meetings = new ArrayList<>();
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<TaskMilestone> milestones = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        startDate = LocalDate.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### 2.7.2 协同管理服务
```java
@Service
@RequiredArgsConstructor
public class SupplierCollaborationService {
    
    private final SupplierCollaborationTaskRepository taskRepository;
    private final SupplierRepository supplierRepository;
    private final NotificationService notificationService;
    private final ExternalApiService externalApiService;
    
    /**
     * 创建协同任务
     */
    @Transactional
    public SupplierCollaborationTaskDTO createCollaborationTask(
            SupplierCollaborationTaskCreateDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        // 生成任务编号
        String taskCode = generateTaskCode();
        
        // 创建协同任务
        SupplierCollaborationTask task = SupplierCollaborationTask.builder()
            .supplier(supplier)
            .taskCode(taskCode)
            .taskTitle(dto.getTaskTitle())
            .taskType(dto.getTaskType())
            .status(TaskStatus.PENDING)
            .taskDescription(dto.getTaskDescription())
            .deliverables(dto.getDeliverables())
            .collaborationPlan(dto.getCollaborationPlan())
            .targetDate(dto.getTargetDate())
            .initiator(SecurityUtils.getCurrentUser())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        taskRepository.save(task);
        
        // 分配供应商联系人
        assignSupplierContact(task, dto.getSupplierContactId());
        
        // 创建里程碑
        createTaskMilestones(task, dto.getMilestones());
        
        // 发送通知
        notifySupplierAboutTask(task);
        
        return convertToDTO(task);
    }
    
    /**
     * 启动协同任务
     */
    @Transactional
    public void startCollaborationTask(Long taskId) {
        SupplierCollaborationTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Collaboration task not found"));
        
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);
        
        // 通知相关人员
        notificationService.sendCollaborationTaskStartedNotification(task);
        
        // 在供应商门户创建对应任务
        externalApiService.createSupplierPortalTask(task);
    }
    
    /**
     * 更新任务进度
     */
    @Transactional
    public void updateTaskProgress(Long taskId, TaskProgressUpdateDTO dto) {
        SupplierCollaborationTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Collaboration task not found"));
        
        task.setProgressReport(dto.getProgressReport());
        task.setUpdatedAt(LocalDateTime.now());
        
        // 更新里程碑状态
        if (dto.getMilestoneUpdates() != null) {
            updateTaskMilestones(task, dto.getMilestoneUpdates());
        }
        
        // 检查是否可以完成任务
        if (canCompleteTask(task)) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setActualCompletionDate(LocalDate.now());
            
            // 记录最终结果
            task.setFinalResults(dto.getFinalResults());
            
            // 发送完成通知
            notificationService.sendCollaborationTaskCompletedNotification(task);
            
            // 更新供应商绩效
            updateSupplierCollaborationScore(task.getSupplier().getId(), task);
        }
        
        taskRepository.save(task);
    }
    
    /**
     * 创建协同会议
     */
    @Transactional
    public TaskMeetingDTO createTaskMeeting(Long taskId, TaskMeetingCreateDTO dto) {
        SupplierCollaborationTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Collaboration task not found"));
        
        // 创建会议记录
        TaskMeeting meeting = TaskMeeting.builder()
            .task(task)
            .meetingTitle(dto.getMeetingTitle())
            .meetingDate(dto.getMeetingDate())
            .meetingTime(dto.getMeetingTime())
            .durationMinutes(dto.getDurationMinutes())
            .meetingLocation(dto.getMeetingLocation())
            .meetingType(dto.getMeetingType())
            .meetingAgenda(dto.getMeetingAgenda())
            .participants(dto.getParticipants())
            .organizer(SecurityUtils.getCurrentUser())
            .status(MeetingStatus.SCHEDULED)
            .createdAt(LocalDateTime.now())
            .build();
        
        task.getMeetings().add(meeting);
        taskRepository.save(task);
        
        // 发送会议邀请
        sendMeetingInvitations(meeting);
        
        return convertMeetingToDTO(meeting);
    }
    
    /**
     * 获取供应商协同仪表板
     */
    public SupplierCollaborationDashboardDTO getCollaborationDashboard(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        
        SupplierCollaborationDashboardDTO dashboard = new SupplierCollaborationDashboardDTO();
        dashboard.setSupplierId(supplierId);
        dashboard.setSupplierName(supplier.getSupplierName());
        
        // 获取进行中的任务
        List<SupplierCollaborationTask> activeTasks = taskRepository
            .findBySupplierIdAndStatusInOrderByCreatedAtDesc(
                supplierId, List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS));
        dashboard.setActiveTasks(activeTasks.stream().map(this::convertToDTO).collect(Collectors.toList()));
        
        // 获取即将到期的任务
        List<SupplierCollaborationTask> upcomingTasks = taskRepository
            .findBySupplierIdAndStatusAndTargetDateBefore(
                supplierId, TaskStatus.IN_PROGRESS, LocalDate.now().plusWeeks(1));
        dashboard.setUpcomingTasks(upcomingTasks.stream().map(this::convertToDTO).collect(Collectors.toList()));
        
        // 协同统计
        CollaborationStats stats = getCollaborationStats(supplierId);
        dashboard.setStats(stats);
        
        // 协同趋势
        CollaborationTrend trend = getCollaborationTrend(supplierId, 6);
        dashboard.setTrend(trend);
        
        return dashboard;
    }
    
    /**
     * 获取协同统计
     */
    private CollaborationStats getCollaborationStats(Long supplierId) {
        CollaborationStats stats = new CollaborationStats();
        
        // 任务统计
        Long totalTasks = taskRepository.countBySupplierId(supplierId);
        Long completedTasks = taskRepository.countBySupplierIdAndStatus(supplierId, TaskStatus.COMPLETED);
        Long overdueTasks = taskRepository.countBySupplierIdAndStatusAndTargetDateBefore(
            supplierId, TaskStatus.IN_PROGRESS, LocalDate.now());
        
        stats.setTotalTasks(totalTasks);
        stats.setCompletedTasks(completedTasks);
        stats.setOverdueTasks(overdueTasks);
        stats.setCompletionRate(totalTasks > 0 ? 
            new BigDecimal(completedTasks).divide(new BigDecimal(totalTasks), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")) : BigDecimal.ZERO);
        
        // 按类型统计
        Map<CollaborationTaskType, Long> taskTypeStats = taskRepository
            .countBySupplierIdAndTaskType(supplierId);
        stats.setTaskTypeStats(taskTypeStats);
        
        return stats;
    }
    
    /**
     * 获取协同趋势
     */
    private CollaborationTrend getCollaborationTrend(Long supplierId, int months) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(months);
        
        // 按月统计任务数据
        Map<LocalDate, MonthlyCollaborationData> monthlyData = new HashMap<>();
        
        for (int i = 0; i < months; i++) {
            LocalDate monthDate = startDate.plusMonths(i);
            LocalDate nextMonth = monthDate.plusMonths(1);
            
            Long taskCount = taskRepository.countBySupplierIdAndCreatedAtBetween(
                supplierId, monthDate, nextMonth);
            
            MonthlyCollaborationData data = new MonthlyCollaborationData();
            data.setMonth(monthDate);
            data.setTaskCount(taskCount.intValue());
            data.setCompletionRate(calculateMonthlyCompletionRate(supplierId, monthDate));
            
            monthlyData.put(monthDate, data);
        }
        
        CollaborationTrend trend = new CollaborationTrend();
        trend.setStartDate(startDate);
        trend.setEndDate(endDate);
        trend.setMonthlyData(new ArrayList<>(monthlyData.values()));
        
        return trend;
    }
    
    /**
     * 计算月度完成率
     */
    private BigDecimal calculateMonthlyCompletionRate(Long supplierId, LocalDate monthDate) {
        LocalDate nextMonth = monthDate.plusMonths(1);
        
        Long totalTasks = taskRepository.countBySupplierIdAndCreatedAtBetween(
            supplierId, monthDate, nextMonth);
        Long completedTasks = taskRepository.countBySupplierIdAndStatusAndCreatedAtBetween(
            supplierId, TaskStatus.COMPLETED, monthDate, nextMonth);
        
        if (totalTasks == 0) {
            return BigDecimal.ZERO;
        }
        
        return new BigDecimal(completedTasks).divide(new BigDecimal(totalTasks), 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }
    
    /**
     * 更新供应商协同分数
     */
    private void updateSupplierCollaborationScore(Long supplierId, SupplierCollaborationTask task) {
        // 根据协同任务完成情况更新供应商绩效
        SupplierPerformance latestPerformance = performanceRepository
            .findTopBySupplierIdOrderByPerformanceMonthDesc(supplierId)
            .orElse(null);
        
        if (latestPerformance != null) {
            // 协同表现转换为服务分数
            BigDecimal collaborationScore = calculateCollaborationScore(task);
            
            // 更新服务分数 (协同表现占服务分数的30%)
            BigDecimal currentServiceScore = latestPerformance.getServiceScore();
            BigDecimal serviceWeight = new BigDecimal("0.3");
            BigDecimal newServiceScore = currentServiceScore.multiply(BigDecimal.ONE.subtract(serviceWeight))
                .add(collaborationScore.multiply(serviceWeight));
            
            latestPerformance.setServiceScore(newServiceScore);
            performanceRepository.save(latestPerformance);
        }
    }
    
    /**
     * 计算协同分数
     */
    private BigDecimal calculateCollaborationScore(SupplierCollaborationTask task) {
        // 根据任务完成质量计算分数
        BigDecimal baseScore = new BigDecimal("80"); // 基础分
        
        // 按时完成加10分
        if (task.getActualCompletionDate() != null && 
            !task.getActualCompletionDate().isAfter(task.getTargetDate())) {
            baseScore = baseScore.add(new BigDecimal("10"));
        }
        
        // 有最终结果加5分
        if (StringUtils.hasText(task.getFinalResults())) {
            baseScore = baseScore.add(new BigDecimal("5"));
        }
        
        // 质量评价
        if (StringUtils.hasText(task.getProgressReport())) {
            String progressReport = task.getProgressReport().toLowerCase();
            if (progressReport.contains("excellent") || progressReport.contains("outstanding")) {
                baseScore = baseScore.add(new BigDecimal("5"));
            } else if (progressReport.contains("good") || progressReport.contains("satisfactory")) {
                baseScore = baseScore.add(new BigDecimal("3"));
            }
        }
        
        return baseScore.min(new BigDecimal("100")); // 最高100分
    }
}
```

## 3. 技术实现规范

### 3.1 数据库设计

#### 3.1.1 核心表结构
```sql
-- 供应商表
CREATE TABLE qms_supplier (
    id BIGSERIAL PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_type VARCHAR(50),
    legal_representative VARCHAR(50),
    registration_number VARCHAR(100),
    address VARCHAR(200),
    postal_code VARCHAR(20),
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    website VARCHAR(50),
    business_scope TEXT NOT NULL,
    established_date DATE NOT NULL,
    company_profile TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_rating VARCHAR(10),
    last_rating_update TIMESTAMP,
    created_by BIGINT NOT NULL,
    updated_by BIGINT,
    FOREIGN KEY (created_by) REFERENCES qms_user(id),
    FOREIGN KEY (updated_by) REFERENCES qms_user(id)
);

-- 供应商分类表
CREATE TABLE qms_supplier_category (
    id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_id BIGINT,
    level INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    category_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES qms_supplier_category(id)
);

-- 供应商分类关联表
CREATE TABLE qms_supplier_category_relation (
    supplier_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (supplier_id, category_id),
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id),
    FOREIGN KEY (category_id) REFERENCES qms_supplier_category(id)
);

-- 供应商联系人表
CREATE TABLE qms_supplier_contact (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    contact_name VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    contact_type VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id)
);

-- 供应商证书表
CREATE TABLE qms_supplier_certificate (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    certificate_name VARCHAR(100) NOT NULL,
    certificate_number VARCHAR(50) NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issuing_authority VARCHAR(100) NOT NULL,
    certificate_url VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id)
);

-- 供应商评估表
CREATE TABLE qms_supplier_assessment (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    assessment_name VARCHAR(100) NOT NULL,
    assessment_type VARCHAR(20) NOT NULL,
    assessment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    assessor_id BIGINT NOT NULL,
    total_score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    percentage DECIMAL(10,2),
    rating VARCHAR(10),
    overall_assessment TEXT,
    improvement_plan TEXT,
    next_assessment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id),
    FOREIGN KEY (assessor_id) REFERENCES qms_user(id)
);

-- 供应商绩效表
CREATE TABLE qms_supplier_performance (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    performance_month DATE NOT NULL,
    quality_score DECIMAL(10,2) NOT NULL,
    delivery_score DECIMAL(10,2) NOT NULL,
    cost_score DECIMAL(10,2) NOT NULL,
    service_score DECIMAL(10,2) NOT NULL,
    technology_score DECIMAL(10,2) NOT NULL,
    management_score DECIMAL(10,2) NOT NULL,
    overall_score DECIMAL(10,2) NOT NULL,
    rating VARCHAR(10),
    performance_summary TEXT,
    improvement_areas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id),
    UNIQUE(supplier_id, performance_month)
);

-- 供应商质量问题表
CREATE TABLE qms_supplier_quality_issue (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    issue_code VARCHAR(100) NOT NULL UNIQUE,
    issue_description TEXT NOT NULL,
    issue_type VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    discovery_date DATE NOT NULL,
    target_resolution_date DATE,
    actual_resolution_date DATE,
    reported_by BIGINT,
    assigned_to BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    root_cause_analysis TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    verification_results TEXT,
    verified_by BIGINT,
    verification_date DATE,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id),
    FOREIGN KEY (reported_by) REFERENCES qms_user(id),
    FOREIGN KEY (assigned_to) REFERENCES qms_user(id),
    FOREIGN KEY (verified_by) REFERENCES qms_user(id)
);

-- 供应商风险评估表
CREATE TABLE qms_supplier_risk_assessment (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    assessment_name VARCHAR(100) NOT NULL,
    assessment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_risk_score DECIMAL(10,2),
    overall_risk_level VARCHAR(20) NOT NULL,
    assessment_type VARCHAR(20) NOT NULL,
    risk_summary TEXT,
    risk_mitigation_plan TEXT,
    next_assessment_date DATE,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id)
);

-- 供应商协同任务表
CREATE TABLE qms_supplier_collaboration_task (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    task_code VARCHAR(100) NOT NULL UNIQUE,
    task_title VARCHAR(200) NOT NULL,
    task_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    start_date DATE NOT NULL,
    target_date DATE,
    actual_completion_date DATE,
    task_description TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    collaboration_plan TEXT,
    progress_report TEXT,
    final_results TEXT,
    initiator_id BIGINT NOT NULL,
    supplier_contact_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES qms_supplier(id),
    FOREIGN KEY (initiator_id) REFERENCES qms_user(id),
    FOREIGN KEY (supplier_contact_id) REFERENCES qms_user(id)
);

-- 供应商协同会议表
CREATE TABLE qms_supplier_meeting (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    meeting_title VARCHAR(200) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    duration_minutes INTEGER,
    meeting_location VARCHAR(200),
    meeting_type VARCHAR(50),
    meeting_agenda TEXT,
    participants TEXT,
    organizer_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES qms_supplier_collaboration_task(id),
    FOREIGN KEY (organizer_id) REFERENCES qms_user(id)
);
```

### 3.2 API接口规范

#### 3.2.1 供应商管理API
```java
@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "供应商管理", description = "供应商的增删改查管理")
@RequiredArgsConstructor
public class SupplierController {
    
    private final SupplierService supplierService;
    private final SupplierSearchService searchService;
    
    /**
     * 创建供应商
     */
    @PostMapping
    @Operation(summary = "创建新供应商")
    @PreAuthorize("hasRole('SUPPLIER_CREATE')")
    public ResponseEntity<SupplierDTO> createSupplier(
            @Valid @RequestBody SupplierCreateDTO dto,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {
        SupplierDTO result = supplierService.createSupplier(dto, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * 更新供应商信息
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新供应商信息")
    @PreAuthorize("hasRole('SUPPLIER_UPDATE')")
    public ResponseEntity<SupplierDTO> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierUpdateDTO dto) {
        SupplierDTO result = supplierService.updateSupplier(id, dto);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取供应商详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取供应商详情")
    public ResponseEntity<SupplierDetailDTO> getSupplier(@PathVariable Long id) {
        SupplierDetailDTO result = supplierService.getSupplierDetail(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 搜索供应商
     */
    @GetMapping("/search")
    @Operation(summary = "搜索供应商")
    public ResponseEntity<Page<SupplierListDTO>> searchSuppliers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) SupplierStatus status,
            @RequestParam(required = false) String supplierType,
            @RequestParam(required = false) SupplierRating rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        SupplierSearchCriteria criteria = SupplierSearchCriteria.builder()
            .keyword(keyword)
            .categoryId(categoryId)
            .status(status)
            .supplierType(supplierType)
            .rating(rating)
            .build();
        
        Page<SupplierListDTO> result = searchService.searchSuppliers(criteria, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取供应商分类树
     */
    @GetMapping("/categories/tree")
    @Operation(summary = "获取供应商分类树")
    public ResponseEntity<List<CategoryTreeNodeDTO>> getCategoryTree() {
        List<CategoryTreeNodeDTO> result = supplierService.getCategoryTree();
        return ResponseEntity.ok(result);
    }
    
    /**
     * 启用/禁用供应商
     */
    @PatchMapping("/{id}/status")
    @Operation(summary = "启用/禁用供应商")
    @PreAuthorize("hasRole('SUPPLIER_MANAGE')")
    public ResponseEntity<Void> updateSupplierStatus(
            @PathVariable Long id,
            @RequestParam SupplierStatus status) {
        supplierService.updateSupplierStatus(id, status);
        return ResponseEntity.ok().build();
    }
}
```

#### 3.2.2 供应商评估API
```java
@RestController
@RequestMapping("/api/supplier-assessments")
@Tag(name = "供应商评估", description = "供应商评估管理")
@RequiredArgsConstructor
public class SupplierAssessmentController {
    
    private final SupplierAssessmentService assessmentService;
    
    /**
     * 创建供应商评估
     */
    @PostMapping
    @Operation(summary = "创建供应商评估")
    @PreAuthorize("hasRole('ASSESSMENT_CREATE')")
    public ResponseEntity<SupplierAssessmentDTO> createAssessment(
            @Valid @RequestBody SupplierAssessmentCreateDTO dto) {
        SupplierAssessmentDTO result = assessmentService.createAssessment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * 开始评估
     */
    @PostMapping("/{id}/start")
    @Operation(summary = "开始评估")
    @PreAuthorize("hasRole('ASSESSMENT_MANAGE')")
    public ResponseEntity<Void> startAssessment(@PathVariable Long id) {
        assessmentService.startAssessment(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 提交评估结果
     */
    @PostMapping("/{id}/submit")
    @Operation(summary = "提交评估结果")
    @PreAuthorize("hasRole('ASSESSMENT_SUBMIT')")
    public ResponseEntity<Void> submitAssessment(
            @PathVariable Long id,
            @Valid @RequestBody AssessmentSubmitDTO dto) {
        assessmentService.submitAssessment(id, dto);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 获取评估详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取评估详情")
    public ResponseEntity<SupplierAssessmentDetailDTO> getAssessment(@PathVariable Long id) {
        SupplierAssessmentDetailDTO result = assessmentService.getAssessmentDetail(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 更新评估分数
     */
    @PostMapping("/{id}/criteria/{criteriaId}/score")
    @Operation(summary = "更新评估分数")
    @PreAuthorize("hasRole('ASSESSMENT_SCORE')")
    public ResponseEntity<Void> updateCriteriaScore(
            @PathVariable Long id,
            @PathVariable Long criteriaId,
            @Valid @RequestBody CriteriaScoreDTO dto) {
        assessmentService.updateCriteriaScore(id, criteriaId, dto.getScore(), dto.getComments());
        return ResponseEntity.ok().build();
    }
    
    /**
     * 添加评估发现
     */
    @PostMapping("/{id}/findings")
    @Operation(summary = "添加评估发现")
    @PreAuthorize("hasRole('ASSESSMENT_FINDING')")
    public ResponseEntity<FindingDTO> addFinding(
            @PathVariable Long id,
            @Valid @RequestBody FindingCreateDTO dto) {
        FindingDTO result = assessmentService.addFinding(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
```

#### 3.2.3 供应商绩效API
```java
@RestController
@RequestMapping("/api/supplier-performance")
@Tag(name = "供应商绩效", description = "供应商绩效管理")
@RequiredArgsConstructor
public class SupplierPerformanceController {
    
    private final SupplierPerformanceService performanceService;
    
    /**
     * 记录供应商绩效
     */
    @PostMapping
    @Operation(summary = "记录供应商绩效")
    @PreAuthorize("hasRole('PERFORMANCE_RECORD')")
    public ResponseEntity<SupplierPerformanceDTO> recordPerformance(
            @Valid @RequestBody SupplierPerformanceDTO dto) {
        SupplierPerformanceDTO result = performanceService.recordPerformance(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * 获取供应商绩效详情
     */
    @GetMapping("/{supplierId}/monthly/{month}")
    @Operation(summary = "获取供应商月度绩效")
    public ResponseEntity<SupplierPerformanceDTO> getMonthlyPerformance(
            @PathVariable Long supplierId,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM") String month) {
        SupplierPerformanceDTO result = performanceService.getMonthlyPerformance(supplierId, month);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取绩效趋势分析
     */
    @GetMapping("/{supplierId}/trend")
    @Operation(summary = "获取绩效趋势分析")
    public ResponseEntity<PerformanceTrendDTO> getPerformanceTrend(
            @PathVariable Long supplierId,
            @RequestParam(defaultValue = "12") int months) {
        PerformanceTrendDTO result = performanceService.getPerformanceTrend(supplierId, months);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 生成月度绩效报告
     */
    @PostMapping("/monthly-report")
    @Operation(summary = "生成月度绩效报告")
    @PreAuthorize("hasRole('PERFORMANCE_REPORT')")
    public ResponseEntity<Void> generateMonthlyReport(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") String month) {
        LocalDate monthDate = LocalDate.parse(month + "-01");
        performanceService.generateMonthlyPerformanceReport(monthDate);
        return ResponseEntity.accepted().build();
    }
}
```

### 3.3 前端界面设计

#### 3.3.1 供应商管理界面
```vue
<!-- 供应商管理主界面 -->
<template>
  <div class="supplier-management">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索供应商名称、编号、联系人..."
        prefix-icon="Search"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="showAdvancedSearch = true">高级搜索</el-button>
      <el-button type="success" @click="showCreateDialog = true">新增供应商</el-button>
    </div>
    
    <!-- 分类筛选 -->
    <div class="category-filter">
      <el-radio-group v-model="selectedCategory" @change="handleCategoryChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button 
          v-for="category in categories" 
          :key="category.id" 
          :label="category.id"
        >
          {{ category.categoryName }}
        </el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 状态筛选 -->
    <div class="status-filter">
      <el-select v-model="searchForm.status" placeholder="选择状态" clearable @change="handleSearch">
        <el-option label="活跃" value="ACTIVE" />
        <el-option label="非活跃" value="INACTIVE" />
        <el-option label="暂停" value="SUSPENDED" />
      </el-select>
      <el-select v-model="searchForm.supplierType" placeholder="供应商类型" clearable @change="handleSearch">
        <el-option label="制造商" value="MANUFACTURER" />
        <el-option label="经销商" value="DISTRIBUTOR" />
        <el-option label="服务商" value="SERVICE_PROVIDER" />
      </el-select>
      <el-select v-model="searchForm.rating" placeholder="评级" clearable @change="handleSearch">
        <el-option label="A级" value="A" />
        <el-option label="B级" value="B" />
        <el-option label="C级" value="C" />
        <el-option label="D级" value="D" />
      </el-select>
    </div>
    
    <!-- 供应商列表 -->
    <div class="supplier-list">
      <div v-for="supplier in supplierList" :key="supplier.id" class="supplier-card">
        <div class="supplier-header">
          <div class="supplier-info">
            <h3>{{ supplier.supplierName }}</h3>
            <span class="supplier-code">{{ supplier.supplierCode }}</span>
            <span :class="['status-badge', supplier.status.toLowerCase()]">
              {{ getStatusText(supplier.status) }}
            </span>
            <span :class="['rating-badge', supplier.currentRating?.toLowerCase()]">
              {{ getRatingText(supplier.currentRating) }}
            </span>
          </div>
          <div class="supplier-type">
            <el-tag size="small">{{ getSupplierTypeText(supplier.supplierType) }}</el-tag>
          </div>
        </div>
        
        <div class="supplier-content">
          <div class="supplier-meta">
            <p><strong>联系人:</strong> {{ supplier.contactPerson }}</p>
            <p><strong>电话:</strong> {{ supplier.contactPhone }}</p>
            <p><strong>邮箱:</strong> {{ supplier.contactEmail }}</p>
            <p><strong>业务范围:</strong> {{ supplier.businessScope }}</p>
          </div>
          
          <div class="supplier-stats">
            <div class="stat-item">
              <span class="stat-label">绩效分数</span>
              <span class="stat-value">{{ supplier.performanceStats?.overallScore || '-' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">质量指数</span>
              <span class="stat-value">{{ supplier.performanceStats?.qualityIndex || '-' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">风险等级</span>
              <span :class="['risk-level', supplier.riskAssessment?.overallRiskLevel?.toLowerCase()]">
                {{ getRiskLevelText(supplier.riskAssessment?.overallRiskLevel) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="supplier-actions">
          <el-button size="small" @click="viewSupplier(supplier)">查看详情</el-button>
          <el-button 
            v-if="canEdit(supplier)" 
            size="small" 
            type="primary" 
            @click="editSupplier(supplier)"
          >
            编辑
          </el-button>
          <el-button 
            v-if="canAssess(supplier)" 
            size="small" 
            type="success" 
            @click="assessSupplier(supplier)"
          >
            评估
          </el-button>
          <el-dropdown @command="(command) => handleMoreAction(command, supplier)">
            <el-button size="small">
              更多<el-icon><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="performance">绩效分析</el-dropdown-item>
                <el-dropdown-item command="risk">风险评估</el-dropdown-item>
                <el-dropdown-item command="collaboration">协同管理</el-dropdown-item>
                <el-dropdown-item command="issues">质量问题</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
    
    <!-- 创建供应商对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建供应商" width="80%">
      <SupplierCreateForm @submit="handleCreateSubmit" @cancel="showCreateDialog = false" />
    </el-dialog>
    
    <!-- 高级搜索对话框 -->
    <el-dialog v-model="showAdvancedSearch" title="高级搜索" width="60%">
      <SupplierAdvancedSearch 
        :model="searchForm" 
        @search="handleAdvancedSearch"
        @reset="handleAdvancedReset"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import SupplierCreateForm from './components/SupplierCreateForm.vue'
import SupplierAdvancedSearch from './components/SupplierAdvancedSearch.vue'

const searchForm = reactive({
  keyword: '',
  status: '',
  supplierType: '',
  rating: '',
  categoryId: ''
})

const selectedCategory = ref('')
const categories = ref([])
const supplierList = ref([])
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const showCreateDialog = ref(false)
const showAdvancedSearch = ref(false)

// 搜索供应商
const handleSearch = async () => {
  try {
    const params = {
      ...searchForm,
      categoryId: selectedCategory.value,
      page: pagination.page - 1,
      size: pagination.size
    }
    
    const response = await api.suppliers.search(params)
    supplierList.value = response.data.content
    pagination.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('搜索供应商失败')
  }
}

// 查看供应商详情
const viewSupplier = (supplier) => {
  router.push(`/suppliers/${supplier.id}`)
}

// 编辑供应商
const editSupplier = (supplier) => {
  router.push(`/suppliers/${supplier.id}/edit`)
}

// 评估供应商
const assessSupplier = (supplier) => {
  router.push(`/suppliers/${supplier.id}/assessment`)
}

// 处理更多操作
const handleMoreAction = (command, supplier) => {
  switch (command) {
    case 'performance':
      router.push(`/suppliers/${supplier.id}/performance`)
      break
    case 'risk':
      router.push(`/suppliers/${supplier.id}/risk`)
      break
    case 'collaboration':
      router.push(`/suppliers/${supplier.id}/collaboration`)
      break
    case 'issues':
      router.push(`/suppliers/${supplier.id}/issues`)
      break
  }
}

// 创建供应商提交
const handleCreateSubmit = async (formData) => {
  try {
    await api.suppliers.create(formData)
    ElMessage.success('供应商创建成功')
    showCreateDialog.value = false
    handleSearch()
  } catch (error) {
    ElMessage.error('创建供应商失败')
  }
}

// 高级搜索
const handleAdvancedSearch = (searchParams) => {
  Object.assign(searchForm, searchParams)
  handleSearch()
}

// 高级搜索重置
const handleAdvancedReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  selectedCategory.value = ''
  handleSearch()
}
</script>
```

#### 3.3.2 供应商评估界面
```vue
<!-- 供应商评估界面 -->
<template>
  <div class="supplier-assessment">
    <!-- 评估概览 -->
    <div class="assessment-overview">
      <div class="overview-header">
        <h2>{{ assessment.assessmentName }}</h2>
        <div class="assessment-meta">
          <span :class="['status-badge', assessment.status.toLowerCase()]">
            {{ getStatusText(assessment.status) }}
          </span>
          <span class="assessment-date">
            评估日期: {{ formatDate(assessment.assessmentDate) }}
          </span>
          <span class="assessment-type">
            类型: {{ getAssessmentTypeText(assessment.assessmentType) }}
          </span>
        </div>
      </div>
      
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-value">{{ assessment.percentage }}%</div>
          <div class="stat-label">完成度</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ assessment.totalScore }}/{{ assessment.maxScore }}</div>
          <div class="stat-label">总分</div>
        </div>
        <div class="stat-card">
          <div :class="['stat-value', `rating-${assessment.rating?.toLowerCase()}`]">
            {{ getRatingText(assessment.rating) }}
          </div>
          <div class="stat-label">评级</div>
        </div>
      </div>
    </div>
    
    <!-- 评估标准 -->
    <div class="assessment-criteria">
      <h3>评估标准</h3>
      <el-table :data="assessment.criteria" style="width: 100%">
        <el-table-column prop="criteriaName" label="标准名称" width="200" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="80" />
        <el-table-column prop="maxScore" label="满分" width="80" />
        <el-table-column prop="actualScore" label="得分" width="80">
          <template #default="{ row }">
            <el-input-number 
              v-if="canEditScore(row)" 
              v-model="row.actualScore" 
              :min="0" 
              :max="row.maxScore"
              @change="updateScore(row)"
            />
            <span v-else>{{ row.actualScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'NOT_STARTED'" 
              size="small" 
              @click="startCriteria(row)"
            >
              开始
            </el-button>
            <el-button 
              v-if="row.status === 'IN_PROGRESS'" 
              size="small" 
              type="primary" 
              @click="completeCriteria(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 评估发现 -->
    <div class="assessment-findings">
      <div class="findings-header">
        <h3>评估发现</h3>
        <el-button 
          v-if="canAddFinding" 
          type="primary" 
          size="small" 
          @click="showAddFindingDialog = true"
        >
          添加发现
        </el-button>
      </div>
      
      <div v-for="finding in assessment.findings" :key="finding.id" class="finding-item">
        <div class="finding-header">
          <span :class="['severity-badge', finding.severity.toLowerCase()]">
            {{ getSeverityText(finding.severity) }}
          </span>
          <span class="finding-status">
            {{ getStatusText(finding.status) }}
          </span>
        </div>
        <div class="finding-content">
          <p>{{ finding.findingDescription }}</p>
          <div v-if="finding.rootCauseAnalysis" class="finding-details">
            <h4>根本原因分析:</h4>
            <p>{{ finding.rootCauseAnalysis }}</p>
          </div>
          <div v-if="finding.correctiveAction" class="finding-details">
            <h4>纠正措施:</h4>
            <p>{{ finding.correctiveAction }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 总体评估 -->
    <div class="overall-assessment">
      <h3>总体评估</h3>
      <el-form :model="assessment" label-width="120px">
        <el-form-item label="总体评价">
          <el-input
            v-model="assessment.overallAssessment"
            type="textarea"
            :rows="4"
            placeholder="请输入总体评价..."
          />
        </el-form-item>
        <el-form-item label="改进计划">
          <el-input
            v-model="assessment.improvementPlan"
            type="textarea"
            :rows="4"
            placeholder="请输入改进计划..."
          />
        </el-form-item>
        <el-form-item label="下次评估日期">
          <el-date-picker
            v-model="assessment.nextAssessmentDate"
            type="date"
            placeholder="选择下次评估日期"
          />
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 操作按钮 -->
    <div class="assessment-actions">
      <el-button @click="saveDraft">保存草稿</el-button>
      <el-button 
        v-if="canSubmit" 
        type="primary" 
        @click="submitAssessment"
      >
        提交评估
      </el-button>
    </div>
    
    <!-- 添加发现对话框 -->
    <el-dialog v-model="showAddFindingDialog" title="添加评估发现" width="60%">
      <FindingCreateForm @submit="handleAddFinding" @cancel="showAddFindingDialog = false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const assessment = ref({})
const showAddFindingDialog = ref(false)

// 权限检查
const canEditScore = (criteria) => {
  return assessment.value.status === 'IN_PROGRESS' && 
         criteria.status === 'IN_PROGRESS'
}

const canAddFinding = computed(() => {
  return assessment.value.status === 'IN_PROGRESS'
})

const canSubmit = computed(() => {
  return assessment.value.status === 'IN_PROGRESS' &&
         assessment.value.criteria.every(c => c.status === 'COMPLETED')
})

// 更新评估分数
const updateScore = async (criteria) => {
  try {
    await api.assessment.updateCriteriaScore(
      assessment.value.id, 
      criteria.id, 
      criteria.actualScore
    )
    ElMessage.success('分数更新成功')
  } catch (error) {
    ElMessage.error('分数更新失败')
  }
}

// 开始评估标准
const startCriteria = async (criteria) => {
  try {
    await api.assessment.startCriteria(assessment.value.id, criteria.id)
    criteria.status = 'IN_PROGRESS'
    ElMessage.success('标准评估已开始')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 完成评估标准
const completeCriteria = async (criteria) => {
  try {
    await api.assessment.completeCriteria(assessment.value.id, criteria.id)
    criteria.status = 'COMPLETED'
    ElMessage.success('标准评估已完成')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 添加评估发现
const handleAddFinding = async (findingData) => {
  try {
    await api.assessment.addFinding(assessment.value.id, findingData)
    showAddFindingDialog.value = false
    loadAssessmentDetail()
    ElMessage.success('评估发现已添加')
  } catch (error) {
    ElMessage.error('添加发现失败')
  }
}

// 保存草稿
const saveDraft = async () => {
  try {
    await api.assessment.saveDraft(assessment.value.id)
    ElMessage.success('草稿已保存')
  } catch (error) {
    ElMessage.error('保存草稿失败')
  }
}

// 提交评估
const submitAssessment = async () => {
  try {
    await api.assessment.submitAssessment(assessment.value.id, {
      overallAssessment: assessment.value.overallAssessment,
      improvementPlan: assessment.value.improvementPlan,
      nextAssessmentDate: assessment.value.nextAssessmentDate
    })
    ElMessage.success('评估已提交')
    router.push('/supplier-assessments')
  } catch (error) {
    ElMessage.error('提交评估失败')
  }
}
</script>
```

## 4. 性能优化与扩展性

### 4.1 缓存策略
```java
@Configuration
@EnableCaching
public class SupplierCacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .disableCachingNullValues()
            .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(getCacheConfigurations())
            .build();
    }
    
    private Map<String, RedisCacheConfiguration> getCacheConfigurations() {
        Map<String, RedisCacheConfiguration> configMap = new HashMap<>();
        
        // 供应商详情缓存
        configMap.put("supplierDetails", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(2))
            .disableCachingNullValues());
        
        // 供应商分类树缓存
        configMap.put("supplierCategoryTree", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(6))
            .disableCachingNullValues());
        
        // 供应商绩效缓存
        configMap.put("supplierPerformance", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(12))
            .disableCachingNullValues());
        
        // 供应商风险缓存
        configMap.put("supplierRisk", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .disableCachingNullValues());
        
        return configMap;
    }
}

@Service
@RequiredArgsConstructor
public class CachedSupplierService {
    
    private final SupplierRepository supplierRepository;
    private final CacheManager cacheManager;
    
    @Cacheable(value = "supplierDetails", key = "#id")
    public SupplierDTO getSupplierDTO(Long id) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));
        return convertToDTO(supplier);
    }
    
    @CacheEvict(value = "supplierDetails", key = "#id")
    public void updateSupplier(Long id, SupplierDTO dto) {
        // 更新供应商逻辑
    }
    
    @Cacheable(value = "supplierCategoryTree", key = "'all'")
    public List<CategoryTreeNodeDTO> getCategoryTree() {
        List<SupplierCategory> categories = categoryRepository.findByActiveTrueOrderBySortOrderAsc();
        return buildCategoryTree(categories);
    }
}
```

### 4.2 数据分片优化
```java
@Configuration
@EnableJpaRepositories(repositoryBaseClass = BaseRepositoryImpl.class)
public class SupplierDatabaseConfig {
    
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    public JpaTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);
        return transactionManager;
    }
    
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.shunfu.qms.entity.supplier");
        em.setPersistenceUnitName("supplierPersistenceUnit");
        
        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);
        
        Properties properties = new Properties();
        properties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        properties.put("hibernate.format_sql", true);
        properties.put("hibernate.use_sql_comments", true);
        properties.put("hibernate.jdbc.batch_size", 50);
        properties.put("hibernate.order_inserts", true);
        properties.put("hibernate.order_updates", true);
        properties.put("hibernate.jdbc.fetch_size", 100);
        
        em.setJpaProperties(properties);
        
        return em;
    }
}

@Repository
public interface SupplierRepository extends BaseRepository<Supplier, Long> {
    
    @Query("SELECT s FROM Supplier s WHERE s.status = :status")
    Page<Supplier> findByStatus(@Param("status") SupplierStatus status, Pageable pageable);
    
    @Query(value = "SELECT * FROM qms_supplier ORDER BY id %s", nativeQuery = true)
    Page<Supplier> findAllWithSharding(@Param("shardingKey") String shardingKey, Pageable pageable);
}
```

### 4.3 消息队列处理
```java
@Configuration
@EnableRabbit
public class SupplierRabbitConfig {
    
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(new Jackson2JsonMessageConverter());
        template.setMandatory(true);
        return template;
    }
    
    @Bean
    public SupplierEventQueue supplierEventQueue() {
        return new SupplierEventQueue();
    }
}

@Component
public class SupplierEventQueue {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void sendSupplierCreatedEvent(Supplier supplier) {
        SupplierCreatedEvent event = new SupplierCreatedEvent(supplier);
        rabbitTemplate.convertAndSend("supplier.events", "supplier.created", event);
    }
    
    public void sendSupplierUpdatedEvent(Supplier supplier) {
        SupplierUpdatedEvent event = new SupplierUpdatedEvent(supplier);
        rabbitTemplate.convertAndSend("supplier.events", "supplier.updated", event);
    }
    
    public void sendAssessmentCompletedEvent(SupplierAssessment assessment) {
        AssessmentCompletedEvent event = new AssessmentCompletedEvent(assessment);
        rabbitTemplate.convertAndSend("supplier.events", "assessment.completed", event);
    }
    
    public void sendPerformanceRecordedEvent(SupplierPerformance performance) {
        PerformanceRecordedEvent event = new PerformanceRecordedEvent(performance);
        rabbitTemplate.convertAndSend("supplier.events", "performance.recorded", event);
    }
}

@Component
@RabbitListener(queues = "supplier.events")
public class SupplierEventConsumer {
    
    private final SupplierNotificationService notificationService;
    private final SupplierRiskService riskService;
    private final SupplierPerformanceService performanceService;
    
    @RabbitHandler
    public void handleSupplierCreated(SupplierCreatedEvent event) {
        // 发送创建通知
        notificationService.sendSupplierCreatedNotification(event.getSupplier());
        
        // 触发风险评估
        riskService.triggerInitialRiskAssessment(event.getSupplier().getId());
    }
    
    @RabbitHandler
    public void handleSupplierUpdated(SupplierUpdatedEvent event) {
        // 更新相关缓存
        performanceService.updateSupplierPerformanceCache(event.getSupplier().getId());
    }
    
    @RabbitHandler
    public void handleAssessmentCompleted(AssessmentCompletedEvent event) {
        // 更新供应商评级
        performanceService.updateSupplierRating(event.getAssessment().getSupplier().getId(), 
            event.getAssessment().getRating());
    }
    
    @RabbitHandler
    public void handlePerformanceRecorded(PerformanceRecordedEvent event) {
        // 触发绩效分析
        performanceService.analyzePerformanceTrends(event.getPerformance().getSupplier().getId());
    }
}
```

## 5. 安全与合规

### 5.1 数据安全
```java
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SupplierSecurityConfig {
    
    @Bean
    public SecurityFilterChain supplierSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/suppliers/**")
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/suppliers/search").permitAll()
                .requestMatchers("/api/suppliers/{id}").hasAnyRole("SUPPLIER_READ", "ADMIN")
                .requestMatchers("/api/suppliers/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(supplierAuthorizationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public SupplierAuthorizationFilter supplierAuthorizationFilter() {
        return new SupplierAuthorizationFilter();
    }
}

@Component
public class SupplierAuthorizationFilter extends OncePerRequestFilter {
    
    private final SupplierPermissionService permissionService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                 HttpServletResponse response, 
                                 FilterChain filterChain) throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        Long supplierId = extractSupplierIdFromUri(requestURI);
        
        if (supplierId != null && requiresSupplierAuthorization(requestURI)) {
            String permission = determineRequiredPermission(requestURI, request.getMethod());
            
            if (!permissionService.checkSupplierPermission(supplierId, permission)) {
                response.sendError(HttpStatus.FORBIDDEN.value(), "Access denied");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private Long extractSupplierIdFromUri(String uri) {
        try {
            Pattern pattern = Pattern.compile("/api/suppliers/(\\d+)");
            Matcher matcher = pattern.matcher(uri);
            if (matcher.find()) {
                return Long.parseLong(matcher.group(1));
            }
        } catch (Exception e) {
            log.warn("Failed to extract supplier ID from URI: {}", uri, e);
        }
        return null;
    }
}
```

### 5.2 审计日志
```java
@Aspect
@Component
public class SupplierAuditAspect {
    
    private final AuditLogRepository auditLogRepository;
    
    @AfterReturning("execution(* com.shunfu.qms.service.*.*Supplier(..)) && args(supplierId,..)")
    public void auditSupplierOperation(JoinPoint joinPoint, Long supplierId) {
        String operation = joinPoint.getSignature().getName();
        String action = convertOperationToAction(operation);
        
        auditLogRepository.save(SystemAuditLog.builder()
            .module("SUPPLIER")
            .action(action)
            .userId(SecurityUtils.getCurrentUserId())
            .userName(SecurityUtils.getCurrentUserName())
            .userEmail(SecurityUtils.getCurrentUserEmail())
            .ipAddress(getClientIpAddress())
            .userAgent(getUserAgent())
            .timestamp(LocalDateTime.now())
            .details(Map.of(
                "operation", operation,
                "supplierId", supplierId,
                "method", joinPoint.getSignature().toShortString(),
                "args", joinPoint.getArgs()
            ))
            .sessionId(getSessionId())
            .build());
    }
    
    private String convertOperationToAction(String operation) {
        switch (operation) {
            case "createSupplier":
                return "CREATE";
            case "updateSupplier":
                return "UPDATE";
            case "deleteSupplier":
                return "DELETE";
            case "approveSupplier":
                return "APPROVE";
            case "suspendSupplier":
                return "SUSPEND";
            default:
                return "OTHER";
        }
    }
}
```

## 6. 部署与运维

### 6.1 Docker部署配置
```dockerfile
# Dockerfile for Supplier Service
FROM openjdk:17-jre-slim

WORKDIR /app

COPY target/qms-supplier-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8082

ENV JAVA_OPTS="-Xmx2g -Xms1g"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

```yaml
# docker-compose.yml for Supplier Service
version: '3.8'

services:
  supplier-service:
    build: ./supplier-service
    ports:
      - "8082:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/qms_supplier
      - SPRING_REDIS_HOST=redis
      - RABBITMQ_HOST=rabbitmq
    depends_on:
      - postgres
      - redis
      - rabbitmq
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=qms_supplier
      - POSTGRES_USER=qms
      - POSTGRES_PASSWORD=qms123
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=guest
      - RABBITMQ_DEFAULT_PASS=guest

volumes:
  postgres_data:
```

### 6.2 监控与告警
```yaml
# prometheus-supplier-service.yml
groups:
  - name: supplier_service
    interval: 15s
    rules:
      - alert: SupplierServiceHighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Supplier Service high error rate"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: SupplierAssessmentPendingTooLong
        expr: time() - qms_supplier_assessment_created_timestamp > 86400 * 7
        for: 1d
        labels:
          severity: warning
        annotations:
          summary: "Supplier assessment pending too long"
          description: "Assessment {{ $labels.assessment_id }} has been pending for {{ $value }} seconds"
      
      - alert: SupplierCertificateExpiringSoon
        expr: qms_supplier_certificate_expiry_date - time() < 86400 * 30
        for: 1d
        labels:
          severity: warning
        annotations:
          summary: "Supplier certificate expiring soon"
          description: "Certificate {{ $labels.certificate_id }} expires in {{ $value }} seconds"
```

## 7. 测试策略

### 7.1 单元测试
```java
@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {
    
    @Mock
    private SupplierRepository supplierRepository;
    
    @Mock
    private SupplierCategoryRepository categoryRepository;
    
    @Mock
    private FileStorageService fileStorageService;
    
    @InjectMocks
    private SupplierService supplierService;
    
    @Test
    void createSupplier_shouldCreateSupplierSuccessfully() {
        // Arrange
        SupplierCreateDTO dto = new SupplierCreateDTO();
        dto.setSupplierName("Test Supplier");
        dto.setSupplierCode("TEST-001");
        dto.setSupplierType("MANUFACTURER");
        
        SupplierCategory category = new SupplierCategory();
        category.setId(1L);
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(fileStorageService.uploadDocument(any(), any(), any())).thenReturn("http://test.com/test.pdf");
        
        // Act
        SupplierDTO result = supplierService.createSupplier(dto, null);
        
        // Assert
        assertNotNull(result);
        assertEquals("Test Supplier", result.getSupplierName());
        assertEquals("MANUFACTURER", result.getSupplierType());
    }
    
    @Test
    void createSupplier_shouldThrowExceptionWhenCategoryNotFound() {
        // Arrange
        SupplierCreateDTO dto = new SupplierCreateDTO();
        dto.setCategoryId(1L);
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> {
            supplierService.createSupplier(dto, null);
        });
    }
}
```

### 7.2 集成测试
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SupplierControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Test
    void createSupplier_shouldCreateSupplier() {
        // Arrange
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("supplierName", "Integration Test Supplier");
        body.add("supplierCode", "IT-001");
        body.add("supplierType", "MANUFACTURER");
        body.add("categoryId", "1");
        
        // Act
        ResponseEntity<SupplierDTO> response = restTemplate.postForEntity(
            "/api/suppliers", 
            body, 
            SupplierDTO.class
        );
        
        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Integration Test Supplier", response.getBody().getSupplierName());
    }
    
    @Test
    void searchSuppliers_shouldReturnSuppliers() {
        // Arrange
        Supplier supplier = new Supplier();
        supplier.setSupplierName("Test Supplier");
        supplier.setSupplierCode("TEST-001");
        supplier.setStatus(SupplierStatus.ACTIVE);
        supplierRepository.save(supplier);
        
        // Act
        ResponseEntity<Page<SupplierListDTO>> response = restTemplate.getForEntity(
            "/api/suppliers/search?keyword=Test", 
            new ParameterizedTypeReference<Page<SupplierListDTO>>() {}
        );
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getContent().size() > 0);
    }
}
```

## 8. 项目总结

### 8.1 实现要点总结
1. **完整的供应商生命周期管理**: 从注册、评估、绩效监控到风险管控的全流程
2. **多维度评估体系**: 质量、交付、成本、服务、技术、管理的综合评估
3. **智能绩效监控**: 实时绩效跟踪和趋势分析
4. **风险管控机制**: 多层次风险评估和缓解措施管理
5. **协同工作管理**: 供需双方的协作改进平台
6. **数据可视化**: 丰富的图表和报表展示
7. **权限安全控制**: 细粒度的权限管理和数据安全
8. **高性能优化**: 缓存、分片、异步处理等性能优化

### 8.2 技术特色
- **微服务架构**: 独立的供应商管理服务
- **多数据库架构**: PostgreSQL + MongoDB + InfluxDB
- **消息驱动架构**: RabbitMQ事件驱动机制
- **实时监控**: Prometheus + Grafana监控体系
- **容器化部署**: Docker + Kubernetes支持
- **智能分析**: 基于历史数据的趋势分析和预测

### 8.3 业务价值
为舜富精密压铸提供:
1. 完整的供应商质量管理体系
2. 量化的供应商绩效评估工具
3. 智能化的风险预警机制
4. 高效的供需协同平台
5. 数据驱动的供应商决策支持

---

**供应商管理模块详细实现规范完成。接下来继续实现知识库管理模块详细规范。**