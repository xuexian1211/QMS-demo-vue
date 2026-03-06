# 舜富QMS系统 - 文档管理模块详细实现规范

## 1. 模块概述

### 1.1 功能定位
文档管理模块是舜富QMS系统的核心基础模块，负责所有质量相关文档的全生命周期管理，确保文档的规范性、可追溯性和合规性，满足IATF16949:2016标准对文档管理的要求。

### 1.2 业务价值
- **合规保障**: 确保所有质量文档符合IATF16949:2016标准要求
- **版本控制**: 实现文档版本的全生命周期管理
- **高效检索**: 提供智能化的文档搜索和定位功能
- **协作管理**: 支持多部门协作的文档审批和发布流程
- **知识沉淀**: 构建企业质量知识库，促进经验积累和复用

### 1.3 技术架构
- **前端**: Vue.js 3.x + Element Plus + 自定义文档编辑器
- **后端**: Spring Boot 3.x + Spring Security + MinIO/OSS
- **数据库**: PostgreSQL (元数据) + MongoDB (文档内容) + Elasticsearch (全文检索)
- **搜索**: Elasticsearch 8.x + IK分词器
- **存储**: MinIO分布式对象存储或阿里云OSS

## 2. 核心功能详细设计

### 2.1 文档分类管理

#### 2.1.1 多级分类体系
```java
// 文档分类实体
@Entity
@Table(name = "qms_document_category")
@Data
public class DocumentCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private DocumentCategory parent;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<DocumentCategory> children;
    
    @Column(nullable = false)
    private Integer level;
    
    @Column(nullable = false)
    private Integer sortOrder;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(nullable = false)
    private String documentType; // PROCEDURE, WORK_INSTRUCTION, FORM, RECORD, STANDARD
}
```

#### 2.1.2 分类管理API
```java
@RestController
@RequestMapping("/api/document-categories")
@Tag(name = "文档分类管理", description = "文档分类的增删改查管理")
public class DocumentCategoryController {
    
    @PostMapping
    @Operation(summary = "创建文档分类")
    public ResponseEntity<DocumentCategoryDTO> createCategory(
            @Valid @RequestBody DocumentCategoryCreateDTO dto) {
        // 实现分类创建逻辑
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "更新文档分类")
    public ResponseEntity<DocumentCategoryDTO> updateCategory(
            @PathVariable Long id, @Valid @RequestBody DocumentCategoryUpdateDTO dto) {
        // 实现分类更新逻辑
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "删除文档分类")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        // 实现分类删除逻辑（包含子分类检查）
    }
    
    @GetMapping("/tree")
    @Operation(summary = "获取分类树结构")
    public ResponseEntity<List<CategoryTreeNodeDTO>> getCategoryTree() {
        // 返回完整的分类树结构
    }
}
```

### 2.2 文档全生命周期管理

#### 2.2.1 文档生命周期状态机
```java
// 文档状态枚举
public enum DocumentStatus {
    DRAFT("草稿"),
    REVIEW("审核中"),
    APPROVED("已批准"),
    PUBLISHED("已发布"),
    REVOKED("已撤销"),
    OBSOLETE("已过期"),
    ARCHIVED("已归档");

    private final String description;

    DocumentStatus(String description) {
        this.description = description;
    }
}

// 文档实体
@Entity
@Table(name = "qms_document")
@Data
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(length = 1000)
    private String summary;
    
    @Column(nullable = false)
    private String documentCode; // QMS-DOC-2024-001
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private DocumentCategory category;
    
    @Column(nullable = false)
    private String documentType;
    
    @Column(nullable = false)
    private DocumentStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;
    
    @Column(nullable = false)
    private LocalDateTime publishDate;
    
    @Column(nullable = false)
    private LocalDateTime reviewDeadline;
    
    @Column(nullable = false)
    private Integer version;
    
    @Column(nullable = false)
    private String fileUrl;
    
    @Column(nullable = false)
    private Long fileSize;
    
    @Column(nullable = false)
    private String fileType;
    
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL)
    private List<DocumentVersion> versions;
    
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL)
    private List<DocumentAuditLog> auditLogs;
}
```

#### 2.2.2 生命周期管理核心逻辑
```java
@Service
@RequiredArgsConstructor
public class DocumentLifecycleService {
    
    private final DocumentRepository documentRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;
    
    /**
     * 提交文档审核
     */
    @Transactional
    public void submitForReview(Long documentId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // 验证文档状态
        if (document.getStatus() != DocumentStatus.DRAFT) {
            throw new IllegalStateException("Only draft documents can be submitted for review");
        }
        
        // 更新状态
        document.setStatus(DocumentStatus.REVIEW);
        document.setReviewDeadline(LocalDateTime.now().plusDays(3)); // 3天审核期限
        
        // 创建审核流程
        createReviewWorkflow(document);
        
        // 通知审核人员
        notifyReviewers(document);
        
        documentRepository.save(document);
    }
    
    /**
     * 批准文档
     */
    @Transactional
    public void approveDocument(Long documentId, String approverComment) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // 验证审核状态
        if (document.getStatus() != DocumentStatus.REVIEW) {
            throw new IllegalStateException("Only documents in review status can be approved");
        }
        
        // 创建新版本
        DocumentVersion newVersion = createNewVersion(document);
        
        // 更新文档状态
        document.setStatus(DocumentStatus.APPROVED);
        document.setApprover(SecurityUtils.getCurrentUser());
        document.setPublishDate(LocalDateTime.now());
        
        // 记录审核日志
        auditLogRepository.save(DocumentAuditLog.builder()
            .document(document)
            .action("APPROVE")
            .user(SecurityUtils.getCurrentUser())
            .comment(approverComment)
            .timestamp(LocalDateTime.now())
            .build());
        
        // 发布通知
        notificationService.sendDocumentApprovedNotification(document);
        
        documentRepository.save(document);
    }
    
    /**
     * 撤销文档
     */
    @Transactional
    public void revokeDocument(Long documentId, String reason) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        if (document.getStatus() != DocumentStatus.PUBLISHED && 
            document.getStatus() != DocumentStatus.APPROVED) {
            throw new IllegalStateException("Only published or approved documents can be revoked");
        }
        
        // 创建替代文档
        Document replacement = createReplacementDocument(document);
        
        // 更新原文档状态
        document.setStatus(DocumentStatus.REVOKED);
        documentRepository.save(document);
        
        // 启动替代文档流程
        submitDocumentForReview(replacement);
        
        // 发送通知
        notificationService.sendDocumentRevokedNotification(document, replacement, reason);
    }
}
```

### 2.3 版本控制管理

#### 2.3.1 版本控制实体
```java
@Entity
@Table(name = "qms_document_version")
@Data
public class DocumentVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
    
    @Column(nullable = false)
    private Integer version;
    
    @Column(nullable = false)
    private String versionDescription;
    
    @Column(nullable = false)
    private LocalDateTime createTime;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;
    
    @Column(nullable = false)
    private String fileUrl;
    
    @Column(nullable = false)
    private Long fileSize;
    
    @Column(nullable = false)
    private String fileType;
    
    @Column
    private String changeLog;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
```

#### 2.3.2 版本控制服务
```java
@Service
@RequiredArgsConstructor
public class DocumentVersionService {
    
    private final DocumentVersionRepository versionRepository;
    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;
    
    /**
     * 创建新版本
     */
    @Transactional
    public DocumentVersion createNewVersion(Document document, MultipartFile file, String changeLog) {
        // 获取最新版本号
        Integer latestVersion = versionRepository.findLatestVersion(document.getId())
            .orElse(0);
        
        Integer newVersion = latestVersion + 1;
        
        // 上传文件
        String fileUrl = fileStorageService.uploadDocument(file, document.getDocumentCode(), newVersion);
        
        // 创建版本记录
        DocumentVersion version = DocumentVersion.builder()
            .document(document)
            .version(newVersion)
            .versionDescription("Version " + newVersion)
            .creator(SecurityUtils.getCurrentUser())
            .fileUrl(fileUrl)
            .fileSize(file.getSize())
            .fileType(file.getContentType())
            .changeLog(changeLog)
            .build();
        
        versionRepository.save(version);
        
        // 更新文档主记录
        document.setVersion(newVersion);
        document.setFileUrl(fileUrl);
        document.setFileSize(file.getSize());
        document.setFileType(file.getContentType());
        documentRepository.save(document);
        
        return version;
    }
    
    /**
     * 比较版本差异
     */
    public VersionDiffResult compareVersions(Long documentId, Integer version1, Integer version2) {
        List<DocumentVersion> versions = versionRepository.findByDocumentIdAndVersionIn(
            documentId, List.of(version1, version2));
        
        if (versions.size() != 2) {
            throw new IllegalArgumentException("Versions not found");
        }
        
        // 实现文件内容比较逻辑
        return fileStorageService.compareDocumentFiles(
            versions.get(0).getFileUrl(), 
            versions.get(1).getFileUrl());
    }
    
    /**
     * 回滚到指定版本
     */
    @Transactional
    public void rollbackToVersion(Long documentId, Integer targetVersion) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        DocumentVersion target = versionRepository.findByDocumentIdAndVersion(documentId, targetVersion)
            .orElseThrow(() -> new EntityNotFoundException("Target version not found"));
        
        // 创建新版本作为回滚版本
        createNewVersion(document, target.getFileUrl(), "Rollback from version " + document.getVersion() + " to " + targetVersion);
        
        // 更新文档状态
        document.setStatus(DocumentStatus.DRAFT);
        documentRepository.save(document);
    }
}
```

### 2.4 文档审批工作流

#### 2.4.1 审批流程配置
```java
@Entity
@Table(name = "qms_workflow_definition")
@Data
public class WorkflowDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String workflowName;
    
    @Column(nullable = false)
    private String workflowCode;
    
    @Column(nullable = false)
    private String description;
    
    @ElementCollection
    @CollectionTable(name = "qms_workflow_steps")
    private List<WorkflowStep> steps = new ArrayList<>();
    
    @Column(nullable = false)
    private Boolean active = true;
}

@Entity
@Table(name = "qms_workflow_steps")
@Data
@Embeddable
public class WorkflowStep {
    @Column(nullable = false)
    private Integer stepOrder;
    
    @Column(nullable = false, length = 100)
    private String stepName;
    
    @Column(nullable = false, length = 20)
    private String stepType; // APPROVAL, REVIEW, NOTIFICATION
    
    @Column(nullable = false)
    private Integer approverRole; // 1-一级审核, 2-二级审核, 3-三级审核
    
    @Column(nullable = false)
    private Boolean required = true;
    
    @Column(nullable = false)
    private Integer maxDuration; // 最大审批时长(小时)
    
    @Column
    private String conditionalLogic;
}
```

#### 2.4.2 审批流程执行
```java
@Service
@RequiredArgsConstructor
public DocumentApprovalService {
    
    private final WorkflowEngine workflowEngine;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;
    
    /**
     * 启动文档审批流程
     */
    @Transactional
    public WorkflowInstance startDocumentApproval(Long documentId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // 获取审批流程定义
        WorkflowDefinition workflow = getWorkflowByDocumentType(document.getDocumentType());
        
        // 启动工作流
        WorkflowInstance instance = workflowEngine.startWorkflow(
            workflow, 
            Map.of("documentId", documentId)
        );
        
        // 发送第一个审批任务
        assignFirstApprovalTask(instance);
        
        return instance;
    }
    
    /**
     * 处理审批任务
     */
    @Transactional
    public void processApprovalTask(Long taskId, ApprovalDecision decision, String comment) {
        WorkflowTask task = workflowEngine.getTask(taskId);
        
        // 记录审批日志
        auditLogRepository.save(DocumentAuditLog.builder()
            .document(documentRepository.findById(task.getVariables().get("documentId"))
                .orElseThrow(() -> new EntityNotFoundException("Document not found")))
            .action("APPROVAL_" + decision)
            .user(SecurityUtils.getCurrentUser())
            .comment(comment)
            .timestamp(LocalDateTime.now())
            .build());
        
        // 处理审批决定
        if (decision == ApprovalDecision.APPROVE) {
            workflowEngine.completeTask(taskId, Map.of("decision", "APPROVE"));
        } else {
            workflowEngine.completeTask(taskId, Map.of("decision", "REJECT", "comment", comment));
            
            // 发送拒绝通知
            notificationService.sendDocumentRejectedNotification(
                task.getVariables().get("documentId"), 
                comment);
        }
        
        // 分配下一个审批任务
        assignNextApprovalTask(task.getInstanceId());
    }
}
```

### 2.5 智能文档管理

#### 2.5.1 文档标签管理
```java
@Entity
@Table(name = "qms_document_tag")
@Data
public class DocumentTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String tagName;
    
    @Column(nullable = false, length = 200)
    private String tagDescription;
    
    @Column(nullable = false)
    private String tagColor;
    
    @ManyToMany(mappedBy = "tags")
    private Set<Document> documents = new HashSet<>();
}

@Entity
@Table(name = "qms_document_tagging")
@Data
public class DocumentTagging {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private DocumentTag tag;
    
    @Column(nullable = false)
    private LocalDateTime taggedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tagged_by")
    private User taggedBy;
}
```

#### 2.5.2 智能标签推荐
```java
@Service
@RequiredArgsConstructor
public class IntelligentTaggingService {
    
    private final DocumentRepository documentRepository;
    private final TaggingModelService taggingModelService;
    private final ElasticsearchTemplate elasticsearchTemplate;
    
    /**
     * 基于内容的智能标签推荐
     */
    public List<DocumentTag> recommendTags(Long documentId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // 提取文档内容
        String content = extractDocumentContent(document);
        
        // 使用机器学习模型推荐标签
        List<String> recommendedTagNames = taggingModelService.predictTags(content);
        
        // 获取标签实体
        return documentRepository.findTagsByNameIn(recommendedTagNames);
    }
    
    /**
     * 自动标签化
     */
    @Transactional
    public void autoTagDocument(Long documentId) {
        List<DocumentTag> recommendedTags = recommendTags(documentId);
        
        if (!recommendedTags.isEmpty()) {
            Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));
            
            // 自动应用推荐标签
            for (DocumentTag tag : recommendedTags) {
                if (!document.getTags().contains(tag)) {
                    document.getTags().add(tag);
                }
            }
            
            documentRepository.save(document);
        }
    }
    
    /**
     * 文档内容提取
     */
    private String extractDocumentContent(Document document) {
        try {
            // 从文件存储获取文档内容
            String fileUrl = document.getFileUrl();
            byte[] content = fileStorageService.downloadFile(fileUrl);
            
            // 根据文件类型解析内容
            return DocumentContentExtractor.extract(content, document.getFileType());
        } catch (Exception e) {
            log.error("Failed to extract document content", e);
            return "";
        }
    }
}
```

### 2.6 文档检索系统

#### 2.6.1 Elasticsearch索引配置
```java
@Configuration
@EnableElasticsearchRepositories(basePackages = "com.shunfu.qms.repository.search")
public class ElasticsearchConfig {
    
    @Bean
    public RestHighLevelClient elasticsearchClient() {
        RestHighLevelClient client = new RestHighLevelClient(
            RestClient.builder(
                new HttpHost("localhost", 9200, "http"))
        );
        return client;
    }
}

@Document(indexName = "qms_documents")
@Data
public class DocumentSearchDocument {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String title;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String summary;
    
    @Field(type = FieldType.Keyword)
    private String documentCode;
    
    @Field(type = FieldType.Keyword)
    private String documentType;
    
    @Field(type = FieldType.Keyword)
    private String categoryPath;
    
    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private LocalDateTime publishDate;
    
    @Field(type = FieldType.Keyword)
    private String authorName;
    
    @Field(type = FieldType.Keyword)
    private String status;
    
    @Field(type = FieldType.Keyword)
    private List<String> tags;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String content;
    
    @Field(type = FieldType.Keyword)
    private List<String> departments;
}
```

#### 2.6.2 高级检索服务
```java
@Service
@RequiredArgsConstructor
public class DocumentSearchService {
    
    private final DocumentSearchRepository searchRepository;
    private final UserRepository userRepository;
    
    /**
     * 全文检索
     */
    public Page<DocumentSearchResult> fullTextSearch(String keyword, Pageable pageable) {
        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.multiMatchQuery(keyword)
                .field("title", 3.0f)
                .field("summary", 2.0f)
                .field("content", 1.0f)
                .field("documentCode", 2.0f))
            .withPageable(pageable);
        
        SearchHits<DocumentSearchDocument> searchHits = 
            elasticsearchTemplate.search(queryBuilder.build(), DocumentSearchDocument.class);
        
        return convertToSearchResultPage(searchHits, pageable);
    }
    
    /**
     * 高级检索
     */
    public Page<DocumentSearchResult> advancedSearch(DocumentSearchCriteria criteria, Pageable pageable) {
        BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();
        
        // 关键词搜索
        if (StringUtils.hasText(criteria.getKeyword())) {
            boolQuery.must(QueryBuilders.multiMatchQuery(criteria.getKeyword())
                .field("title", 3.0f)
                .field("summary", 2.0f)
                .field("content", 1.0f));
        }
        
        // 文档类型过滤
        if (StringUtils.hasText(criteria.getDocumentType())) {
            boolQuery.filter(QueryBuilders.termQuery("documentType", criteria.getDocumentType()));
        }
        
        // 分类过滤
        if (StringUtils.hasText(criteria.getCategory())) {
            boolQuery.filter(QueryBuilders.termQuery("categoryPath", criteria.getCategory()));
        }
        
        // 状态过滤
        if (criteria.getStatus() != null && !criteria.getStatus().isEmpty()) {
            boolQuery.filter(QueryBuilders.termsQuery("status", criteria.getStatus()));
        }
        
        // 日期范围过滤
        if (criteria.getStartDate() != null && criteria.getEndDate() != null) {
            boolQuery.filter(QueryBuilders.rangeQuery("publishDate")
                .gte(criteria.getStartDate())
                .lte(criteria.getEndDate()));
        }
        
        // 标签过滤
        if (criteria.getTags() != null && !criteria.getTags().isEmpty()) {
            boolQuery.filter(QueryBuilders.termsQuery("tags", criteria.getTags()));
        }
        
        // 部门过滤
        if (criteria.getDepartments() != null && !criteria.getDepartments().isEmpty()) {
            boolQuery.filter(QueryBuilders.termsQuery("departments", criteria.getDepartments()));
        }
        
        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
            .withQuery(boolQuery)
            .withPageable(pageable);
        
        SearchHits<DocumentSearchDocument> searchHits = 
            elasticsearchTemplate.search(queryBuilder.build(), DocumentSearchDocument.class);
        
        return convertToSearchResultPage(searchHits, pageable);
    }
    
    /**
     * 相关文档推荐
     */
    public List<DocumentSearchDocument> findRelatedDocuments(Long documentId, int limit) {
        DocumentSearchDocument sourceDoc = searchRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        // 基于相似度推荐
        MoreLikeThisQueryBuilder queryBuilder = QueryBuilders.moreLikeThisQuery(
            new MoreLikeThisQueryBuilder.Item[] {
                new MoreLikeThisQueryBuilder.Item("qms_documents", documentId.toString())
            })
            .minTermFreq(1)
            .minDocFreq(1)
            .maxQueryTerms(25);
        
        NativeSearchQueryBuilder searchBuilder = new NativeSearchQueryBuilder()
            .withQuery(queryBuilder)
            .withPageable(PageRequest.of(0, limit));
        
        SearchHits<DocumentSearchDocument> searchHits = 
            elasticsearchTemplate.search(searchBuilder.build(), DocumentSearchDocument.class);
        
        return searchHits.getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
}
```

### 2.7 权限与安全管理

#### 2.7.1 文档权限控制
```java
@Entity
@Table(name = "qms_document_permission")
@Data
public class DocumentPermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
    
    @Column(nullable = false)
    private String permission; // READ, WRITE, APPROVE, ADMIN
    
    @Column(nullable = false)
    private LocalDateTime grantedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by")
    private User grantedBy;
    
    @Column(nullable = false)
    private Boolean active = true;
}

@Service
@RequiredArgsConstructor
public class DocumentPermissionService {
    
    private final DocumentPermissionRepository permissionRepository;
    private final DocumentRepository documentRepository;
    
    /**
     * 检查文档权限
     */
    public boolean checkPermission(Long documentId, String permission) {
        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context.getAuthentication();
        
        // 超级管理员拥有所有权限
        if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
            return true;
        }
        
        // 检查用户直接权限
        boolean userPermission = permissionRepository.existsByDocumentIdAndUserIdAndPermissionAndActive(
            documentId, SecurityUtils.getCurrentUserId(), permission, true);
        
        if (userPermission) {
            return true;
        }
        
        // 检查角色权限
        boolean rolePermission = permissionRepository.existsByDocumentIdAndRoleNameAndPermissionAndActive(
            documentId, SecurityUtils.getCurrentRoleName(), permission, true);
        
        if (rolePermission) {
            return true;
        }
        
        // 检查部门权限
        boolean departmentPermission = permissionRepository.existsByDocumentIdAndDepartmentIdAndPermissionAndActive(
            documentId, SecurityUtils.getCurrentDepartmentId(), permission, true);
        
        return departmentPermission;
    }
    
    /**
     * 授权文档访问
     */
    @Transactional
    public void grantDocumentPermission(Long documentId, DocumentPermissionGrantDTO dto) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        
        DocumentPermission permission = DocumentPermission.builder()
            .document(document)
            .user(dto.getUserId() != null ? userRepository.findById(dto.getUserId()).orElse(null) : null)
            .role(dto.getRoleId() != null ? roleRepository.findById(dto.getRoleId()).orElse(null) : null)
            .department(dto.getDepartmentId() != null ? departmentRepository.findById(dto.getDepartmentId()).orElse(null) : null)
            .permission(dto.getPermission())
            .grantedAt(LocalDateTime.now())
            .grantedBy(SecurityUtils.getCurrentUser())
            .active(true)
            .build();
        
        permissionRepository.save(permission);
    }
}
```

## 3. 技术实现规范

### 3.1 数据库设计

#### 3.1.1 核心表结构
```sql
-- 文档分类表
CREATE TABLE qms_document_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_id BIGINT,
    level INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    document_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES qms_document_category(id)
);

-- 文档主表
CREATE TABLE qms_document (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(1000),
    document_code VARCHAR(50) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    author_id BIGINT NOT NULL,
    approver_id BIGINT,
    publish_date TIMESTAMP,
    review_deadline TIMESTAMP NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES qms_document_category(id),
    FOREIGN KEY (author_id) REFERENCES qms_user(id),
    FOREIGN KEY (approver_id) REFERENCES qms_user(id)
);

-- 文档版本表
CREATE TABLE qms_document_version (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    version INTEGER NOT NULL,
    version_description VARCHAR(500) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creator_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    change_log TEXT,
    FOREIGN KEY (document_id) REFERENCES qms_document(id),
    FOREIGN KEY (creator_id) REFERENCES qms_user(id)
);

-- 文档标签表
CREATE TABLE qms_document_tag (
    id BIGSERIAL PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    tag_description VARCHAR(200) NOT NULL,
    tag_color VARCHAR(20) NOT NULL DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文档标签关联表
CREATE TABLE qms_document_tagging (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    tagged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tagged_by BIGINT,
    FOREIGN KEY (document_id) REFERENCES qms_document(id),
    FOREIGN KEY (tag_id) REFERENCES qms_document_tag(id),
    FOREIGN KEY (tagged_by) REFERENCES qms_user(id),
    UNIQUE(document_id, tag_id)
);

-- 文档权限表
CREATE TABLE qms_document_permission (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT,
    role_id BIGINT,
    department_id BIGINT,
    permission VARCHAR(20) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT,
    active BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY (document_id) REFERENCES qms_document(id),
    FOREIGN KEY (user_id) REFERENCES qms_user(id),
    FOREIGN KEY (role_id) REFERENCES qms_role(id),
    FOREIGN KEY (department_id) REFERENCES qms_department(id),
    FOREIGN KEY (granted_by) REFERENCES qms_user(id),
    UNIQUE(document_id, user_id, permission, active)
);

-- 文档审核日志表
CREATE TABLE qms_document_audit_log (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    comment TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    FOREIGN KEY (document_id) REFERENCES qms_document(id),
    FOREIGN KEY (user_id) REFERENCES qms_user(id)
);
```

### 3.2 API接口规范

#### 3.2.1 文档管理API
```java
@RestController
@RequestMapping("/api/documents")
@Tag(name = "文档管理", description = "文档的增删改查管理")
@RequiredArgsConstructor
public class DocumentController {
    
    private final DocumentService documentService;
    private final DocumentSearchService searchService;
    
    /**
     * 创建文档
     */
    @PostMapping
    @Operation(summary = "创建新文档")
    @PreAuthorize("hasRole('DOCUMENT_CREATE')")
    public ResponseEntity<DocumentDTO> createDocument(
            @Valid @RequestBody DocumentCreateDTO dto,
            @RequestParam("file") MultipartFile file) {
        DocumentDTO result = documentService.createDocument(dto, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * 更新文档
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新文档信息")
    @PreAuthorize("hasRole('DOCUMENT_UPDATE')")
    public ResponseEntity<DocumentDTO> updateDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentUpdateDTO dto) {
        DocumentDTO result = documentService.updateDocument(id, dto);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 删除文档
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除文档")
    @PreAuthorize("hasRole('DOCUMENT_DELETE')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 获取文档详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取文档详情")
    public ResponseEntity<DocumentDetailDTO> getDocument(@PathVariable Long id) {
        DocumentDetailDTO result = documentService.getDocumentDetail(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 文档全文检索
     */
    @GetMapping("/search")
    @Operation(summary = "全文检索文档")
    public ResponseEntity<Page<DocumentSearchResult>> searchDocuments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        DocumentSearchCriteria criteria = DocumentSearchCriteria.builder()
            .keyword(keyword)
            .documentType(documentType)
            .category(category)
            .status(status)
            .startDate(startDate)
            .endDate(endDate)
            .tags(tags)
            .build();
        
        Page<DocumentSearchResult> result = searchService.advancedSearch(criteria, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取文档历史版本
     */
    @GetMapping("/{id}/versions")
    @Operation(summary = "获取文档版本历史")
    public ResponseEntity<List<DocumentVersionDTO>> getDocumentVersions(@PathVariable Long id) {
        List<DocumentVersionDTO> result = documentService.getDocumentVersions(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 上传文档附件
     */
    @PostMapping("/{id}/attachments")
    @Operation(summary = "上传文档附件")
    @PreAuthorize("hasRole('DOCUMENT_UPDATE')")
    public ResponseEntity<DocumentAttachmentDTO> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        DocumentAttachmentDTO result = documentService.uploadAttachment(id, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
```

#### 3.2.2 审批流程API
```java
@RestController
@RequestMapping("/api/document-approvals")
@Tag(name = "文档审批", description = "文档审批流程管理")
@RequiredArgsConstructor
public class DocumentApprovalController {
    
    private final DocumentApprovalService approvalService;
    
    /**
     * 提交文档审核
     */
    @PostMapping("/{documentId}/submit")
    @Operation(summary = "提交文档审核")
    @PreAuthorize("hasRole('DOCUMENT_APPROVE')")
    public ResponseEntity<WorkflowInstanceDTO> submitForReview(@PathVariable Long documentId) {
        WorkflowInstanceDTO result = approvalService.startDocumentApproval(documentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * 获取待处理审批任务
     */
    @GetMapping("/tasks/pending")
    @Operation(summary = "获取待处理审批任务")
    public ResponseEntity<List<ApprovalTaskDTO>> getPendingTasks() {
        List<ApprovalTaskDTO> result = approvalService.getPendingTasks(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(result);
    }
    
    /**
     * 处理审批任务
     */
    @PostMapping("/tasks/{taskId}/process")
    @Operation(summary = "处理审批任务")
    public ResponseEntity<Void> processApprovalTask(
            @PathVariable Long taskId,
            @Valid @RequestBody ApprovalProcessDTO dto) {
        approvalService.processApprovalTask(taskId, dto.getDecision(), dto.getComment());
        return ResponseEntity.ok().build();
    }
    
    /**
     * 获取审批流程详情
     */
    @GetMapping("/instances/{instanceId}")
    @Operation(summary = "获取审批流程详情")
    public ResponseEntity<WorkflowInstanceDTO> getApprovalInstance(@PathVariable String instanceId) {
        WorkflowInstanceDTO result = approvalService.getWorkflowInstance(instanceId);
        return ResponseEntity.ok(result);
    }
}
```

### 3.3 前端界面设计

#### 3.3.1 文档管理界面
```vue
<!-- 文档管理主界面 -->
<template>
  <div class="document-management">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索文档标题、编号、内容..."
        prefix-icon="Search"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="showAdvancedSearch = true">高级搜索</el-button>
    </div>
    
    <!-- 分类导航 -->
    <div class="category-nav">
      <el-tree
        :data="categoryTree"
        :props="categoryProps"
        @node-click="handleCategorySelect"
        :highlight-current="true"
      />
    </div>
    
    <!-- 文档列表 -->
    <div class="document-list">
      <div v-for="doc in documentList" :key="doc.id" class="document-item">
        <div class="document-header">
          <h3>{{ doc.title }}</h3>
          <span :class="['status-badge', doc.status]">{{ doc.statusText }}</span>
        </div>
        <div class="document-info">
          <p>{{ doc.summary }}</p>
          <div class="document-meta">
            <span>编号: {{ doc.documentCode }}</span>
            <span>版本: v{{ doc.version }}</span>
            <span>作者: {{ doc.authorName }}</span>
            <span>发布时间: {{ formatDate(doc.publishDate) }}</span>
          </div>
          <div class="document-tags">
            <el-tag
              v-for="tag in doc.tags"
              :key="tag.id"
              :color="tag.tagColor"
              size="small"
            >
              {{ tag.tagName }}
            </el-tag>
          </div>
        </div>
        <div class="document-actions">
          <el-button size="small" @click="viewDocument(doc)">查看</el-button>
          <el-button 
            v-if="canEdit(doc)" 
            size="small" 
            type="primary" 
            @click="editDocument(doc)"
          >
            编辑
          </el-button>
          <el-button 
            v-if="canApprove(doc)" 
            size="small" 
            type="success" 
            @click="approveDocument(doc)"
          >
            审核
          </el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const searchForm = reactive({
  keyword: '',
  documentType: '',
  category: '',
  status: [],
  tags: []
})

const categoryTree = ref([])
const documentList = ref([])
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const categoryProps = {
  children: 'children',
  label: 'name'
}

// 搜索文档
const handleSearch = async () => {
  try {
    const params = {
      ...searchForm,
      page: pagination.page - 1,
      size: pagination.size
    }
    
    const response = await api.documents.search(params)
    documentList.value = response.data.content
    pagination.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('搜索文档失败')
  }
}

// 查看文档详情
const viewDocument = (doc) => {
  router.push(`/documents/${doc.id}`)
}

// 编辑文档
const editDocument = (doc) => {
  router.push(`/documents/${doc.id}/edit`)
}

// 审核文档
const approveDocument = (doc) => {
  router.push(`/documents/${doc.id}/approval`)
}
</script>
```

#### 3.3.2 文档编辑器界面
```vue
<!-- 文档编辑器 -->
<template>
  <div class="document-editor">
    <!-- 文档信息 -->
    <div class="document-info">
      <el-form :model="documentForm" label-width="120px">
        <el-form-item label="文档标题" required>
          <el-input v-model="documentForm.title" />
        </el-form-item>
        <el-form-item label="文档编号">
          <el-input v-model="documentForm.documentCode" />
        </el-form-item>
        <el-form-item label="文档类型" required>
          <el-select v-model="documentForm.documentType">
            <el-option label="程序文件" value="PROCEDURE" />
            <el-option label="作业指导书" value="WORK_INSTRUCTION" />
            <el-option label="表单记录" value="FORM" />
            <el-option label="标准规范" value="STANDARD" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" required>
          <el-cascader
            v-model="documentForm.category"
            :options="categoryOptions"
            :props="categoryProps"
          />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input
            v-model="documentForm.summary"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="documentForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.tagName"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 富文本编辑器 -->
    <div class="editor-container">
      <div class="editor-toolbar">
        <el-button-group>
          <el-button :icon="Bold" @click="editor.chain().focus().toggleBold().run()" />
          <el-button :icon="Italic" @click="editor.chain().focus().toggleItalic().run()" />
          <el-button :icon="Underline" @click="editor.chain().focus().toggleUnderline().run()" />
        </el-button-group>
        
        <el-button-group>
          <el-button :icon="Heading" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" />
          <el-button :icon="Heading" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" />
          <el-button :icon="Heading" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" />
        </el-button-group>
        
        <el-button-group>
          <el-button :icon="List" @click="editor.chain().focus().toggleBulletList().run()" />
          <el-button :icon="ListOrdered" @click="editor.chain().focus().toggleOrderedList().run()" />
        </el-button-group>
        
        <el-button-group>
          <el-button :icon="Link" @click="showLinkDialog = true" />
          <el-button :icon="Image" @click="showImageDialog = true" />
          <el-button :icon="Table" @click="insertTable" />
        </el-button-group>
        
        <el-button-group>
          <el-button :icon="Undo" @click="editor.chain().focus().undo().run()" />
          <el-button :icon="Redo" @click="editor.chain().focus().redo().run()" />
        </el-button-group>
      </div>
      
      <div class="editor-content">
        <editor-content :editor="editor" />
      </div>
    </div>
    
    <!-- 附件上传 -->
    <div class="attachments">
      <h3>附件</h3>
      <el-upload
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        multiple
        :file-list="attachments"
      >
        <el-button type="primary">上传附件</el-button>
      </el-upload>
    </div>
    
    <!-- 操作按钮 -->
    <div class="editor-actions">
      <el-button @click="saveDraft">保存草稿</el-button>
      <el-button type="primary" @click="submitReview">提交审核</el-button>
      <el-button @click="previewDocument">预览</el-button>
    </div>
    
    <!-- 链接对话框 -->
    <el-dialog v-model="showLinkDialog" title="插入链接">
      <el-form :model="linkForm">
        <el-form-item label="链接文本">
          <el-input v-model="linkForm.text" />
        </el-form-item>
        <el-form-item label="链接地址">
          <el-input v-model="linkForm.url" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="insertLink">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
    }),
    Image,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
  ],
  content: '<p>开始编辑文档内容...</p>',
})

// 文档表单
const documentForm = reactive({
  title: '',
  documentCode: '',
  documentType: '',
  category: [],
  summary: '',
  tags: []
})

// 附件列表
const attachments = ref([])

// 链接对话框
const showLinkDialog = ref(false)
const linkForm = reactive({
  text: '',
  url: ''
})

// 插入链接
const insertLink = () => {
  editor.value.chain().focus().insertContent({
    type: 'link',
    attrs: {
      href: linkForm.url,
    },
    content: linkForm.text,
  }).run()
  
  showLinkDialog.value = false
  linkForm.text = ''
  linkForm.url = ''
}

// 插入表格
const insertTable = () => {
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

// 保存草稿
const saveDraft = async () => {
  try {
    const formData = new FormData()
    formData.append('title', documentForm.title)
    formData.append('documentType', documentForm.documentType)
    formData.append('categoryId', documentForm.category[documentForm.category.length - 1])
    formData.append('summary', documentForm.summary)
    formData.append('tags', JSON.stringify(documentForm.tags))
    formData.append('content', editor.value.getHTML())
    
    // 保存文档
    const response = await api.documents.create(formData)
    ElMessage.success('文档已保存为草稿')
    
    // 跳转到文档详情页
    router.push(`/documents/${response.data.id}`)
  } catch (error) {
    ElMessage.error('保存草稿失败')
  }
}

// 提交审核
const submitReview = async () => {
  try {
    await saveDraft()
    // 提交审核
    await api.documentApprovals.submit(reviewData.documentId)
    ElMessage.success('文档已提交审核')
    router.push('/documents')
  } catch (error) {
    ElMessage.error('提交审核失败')
  }
}
</script>
```

## 4. 性能优化与扩展性

### 4.1 缓存策略
```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .disableCachingNullValues()
            .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(getCacheConfigurations())
            .build();
    }
    
    private Map<String, RedisCacheConfiguration> getCacheConfigurations() {
        Map<String, RedisCacheConfiguration> configMap = new HashMap<>();
        
        // 文档详情缓存
        configMap.put("documentDetails", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .disableCachingNullValues());
        
        // 分类树缓存
        configMap.put("categoryTree", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(6))
            .disableCachingNullValues());
        
        // 标签缓存
        configMap.put("documentTags", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(2))
            .disableCachingNullValues());
        
        return configMap;
    }
}

@Service
@RequiredArgsConstructor
public class CachedDocumentService {
    
    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final CacheManager cacheManager;
    
    @Cacheable(value = "documentDetails", key = "#id")
    public DocumentDTO getDocumentDTO(Long id) {
        Document document = documentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        return convertToDTO(document);
    }
    
    @CacheEvict(value = "documentDetails", key = "#id")
    public void updateDocument(Long id, DocumentDTO dto) {
        // 更新文档逻辑
    }
    
    @Cacheable(value = "categoryTree", key = "'all'")
    public List<CategoryTreeNodeDTO> getCategoryTree() {
        List<DocumentCategory> categories = categoryRepository.findByActiveTrueOrderBySortOrderAsc();
        return buildCategoryTree(categories);
    }
}
```

### 4.2 文件存储优化
```java
@Service
@RequiredArgsConstructor
public class OptimizedFileStorageService {
    
    private final MinioClient minioClient;
    private final CacheManager cacheManager;
    private final ThreadPoolExecutor executor;
    
    /**
     * 分块上传大文件
     */
    public String uploadDocumentInChunks(MultipartFile file, String documentCode, Integer version) {
        String objectName = buildObjectName(documentCode, version);
        String uploadId = initiateMultipartUpload(objectName);
        
        try {
            // 分块上传
            List<PartETag> partETags = uploadFileInParts(file, uploadId);
            
            // 完成上传
            completeMultipartUpload(objectName, uploadId, partETags);
            
            // 缓存文件信息
            cacheFileInfo(objectName, file);
            
            return getPublicUrl(objectName);
        } catch (Exception e) {
            abortMultipartUpload(objectName, uploadId);
            throw new FileUploadException("文件上传失败", e);
        }
    }
    
    /**
     * CDN加速
     */
    public String getCdnUrl(String fileUrl) {
        // 将MinIO URL转换为CDN URL
        String cdnDomain = "cdn.shunfu-qms.com";
        String originalPath = extractPathFromUrl(fileUrl);
        return "https://" + cdnDomain + originalPath;
    }
    
    /**
     * 文件预览
     */
    public String generatePreviewUrl(String fileUrl, String previewType) {
        // 根据文件类型生成预览URL
        if (isPreviewSupported(fileUrl)) {
            String previewToken = generatePreviewToken(fileUrl);
            return String.format("%s?preview=true&type=%s&token=%s", 
                fileUrl, previewType, previewToken);
        }
        return fileUrl;
    }
    
    private boolean isPreviewSupported(String fileUrl) {
        String extension = getFileExtension(fileUrl);
        return SUPPORTED_PREVIEW_TYPES.contains(extension.toLowerCase());
    }
}
```

### 4.3 搜索性能优化
```java
@Configuration
public class ElasticsearchOptimizationConfig {
    
    @Bean
    public RestHighLevelClient elasticsearchClient() {
        // 连接池配置
        RestClientBuilder builder = RestClient.builder(
            new HttpHost("localhost", 9200, "http"))
            .setHttpClientConfigCallback(httpClientBuilder -> {
                httpClientBuilder.setMaxConnTotal(100);
                httpClientBuilder.setMaxConnPerRoute(50);
                httpClientBuilder.setConnectionTimeToLive(30, TimeUnit.SECONDS);
                return httpClientBuilder;
            });
        
        return new RestHighLevelClient(builder);
    }
}

@Service
@RequiredArgsConstructor
public class OptimizedDocumentSearchService {
    
    private final DocumentSearchRepository searchRepository;
    private final ElasticsearchTemplate elasticsearchTemplate;
    
    /**
     * 批量索引文档
     */
    @Async("documentSearchExecutor")
    public void batchIndexDocuments(List<Document> documents) {
        BulkRequest bulkRequest = new BulkRequest();
        
        for (Document doc : documents) {
            DocumentSearchDocument searchDoc = convertToSearchDocument(doc);
            IndexRequest indexRequest = new IndexRequest("qms_documents")
                .id(doc.getId().toString())
                .source(searchDoc);
            bulkRequest.add(indexRequest);
        }
        
        try {
            BulkResponse response = elasticsearchTemplate.bulk(bulkRequest, DocumentSearchDocument.class);
            if (response.hasFailures()) {
                log.error("批量索引文档失败: {}", response.buildFailureMessage());
            }
        } catch (Exception e) {
            log.error("批量索引文档异常", e);
        }
    }
    
    /**
     * 实时搜索优化
     */
    public Page<DocumentSearchResult> realTimeSearch(String keyword, Pageable pageable) {
        // 使用更快的查询方式
        SearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.boolQuery()
                .must(QueryBuilders.queryStringQuery(keyword)
                    .field("title").boost(3.0f)
                    .field("summary").boost(2.0f)
                    .field("content").boost(1.0f)))
            .withPageable(pageable)
            .withSort(SortBuilders.fieldSort("_score").order(SOrder.DESC))
            .build();
        
        return elasticsearchTemplate.queryForPage(query, DocumentSearchDocument.class, 
            this::convertToSearchResult);
    }
}
```

## 5. 安全与合规

### 5.1 文档访问控制
```java
@Configuration
@EnableWebSecurity
public class DocumentSecurityConfig {
    
    @Bean
    public SecurityFilterChain documentSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/documents/**")
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/documents/search").permitAll()
                .requestMatchers("/api/documents/{id}").hasAnyRole("DOCUMENT_READ", "ADMIN")
                .requestMatchers("/api/documents/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(documentAuthorizationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public DocumentAuthorizationFilter documentAuthorizationFilter() {
        return new DocumentAuthorizationFilter();
    }
}

@Component
public class DocumentAuthorizationFilter extends OncePerRequestFilter {
    
    private final DocumentPermissionService permissionService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                 HttpServletResponse response, 
                                 FilterChain filterChain) throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        Long documentId = extractDocumentIdFromUri(requestURI);
        
        if (documentId != null && requiresDocumentAuthorization(requestURI)) {
            String permission = determineRequiredPermission(requestURI, request.getMethod());
            
            if (!permissionService.checkPermission(documentId, permission)) {
                response.sendError(HttpStatus.FORBIDDEN.value(), "Access denied");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private Long extractDocumentIdFromUri(String uri) {
        try {
            // 从URI中提取文档ID
            Pattern pattern = Pattern.compile("/api/documents/(\\d+)");
            Matcher matcher = pattern.matcher(uri);
            if (matcher.find()) {
                return Long.parseLong(matcher.group(1));
            }
        } catch (Exception e) {
            log.warn("Failed to extract document ID from URI: {}", uri, e);
        }
        return null;
    }
    
    private boolean requiresDocumentAuthorization(String uri) {
        return !uri.contains("/search") && !uri.contains("/public");
    }
    
    private String determineRequiredPermission(String uri, String method) {
        if (uri.contains("/approve") || "POST".equals(method)) {
            return "APPROVE";
        } else if (uri.contains("/edit") || "PUT".equals(method)) {
            return "WRITE";
        } else {
            return "READ";
        }
    }
}
```

### 5.2 审计日志
```java
@Aspect
@Component
public class DocumentAuditAspect {
    
    private final AuditLogRepository auditLogRepository;
    
    @AfterReturning("execution(* com.shunfu.qms.service.*.*Document(..)) && args(documentId,..)")
    public void auditDocumentOperation(JoinPoint joinPoint, Long documentId) {
        String operation = joinPoint.getSignature().getName();
        String action = convertOperationToAction(operation);
        
        auditLogRepository.save(DocumentAuditLog.builder()
            .documentId(documentId)
            .action(action)
            .userId(SecurityUtils.getCurrentUserId())
            .timestamp(LocalDateTime.now())
            .details(Map.of(
                "operation", operation,
                "method", joinPoint.getSignature().toShortString(),
                "args", joinPoint.getArgs()
            ))
            .build());
    }
    
    private String convertOperationToAction(String operation) {
        switch (operation) {
            case "createDocument":
                return "CREATE";
            case "updateDocument":
                return "UPDATE";
            case "deleteDocument":
                return "DELETE";
            case "approveDocument":
                return "APPROVE";
            case "rejectDocument":
                return "REJECT";
            default:
                return "OTHER";
        }
    }
}

@Entity
@Table(name = "qms_system_audit_log")
@Data
public class SystemAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String module;
    
    @Column(nullable = false)
    private String action;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String userName;
    
    @Column(nullable = false)
    private String userEmail;
    
    @Column(nullable = false)
    private String ipAddress;
    
    @Column(nullable = false)
    private String userAgent;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Column
    private String details;
    
    @Column(nullable = false)
    private String sessionId;
}
```

## 6. 部署与运维

### 6.1 Docker部署配置
```dockerfile
# Dockerfile for Document Service
FROM openjdk:17-jre-slim

WORKDIR /app

COPY target/qms-document-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xmx2g -Xms1g"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  document-service:
    build: ./document-service
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/qms_document
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
    depends_on:
      - postgres
      - minio
      - elasticsearch
  
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
  
  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=qms_document
      - POSTGRES_USER=qms
      - POSTGRES_PASSWORD=qms123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  es_data:
  postgres_data:
```

### 6.2 监控与告警
```yaml
# prometheus-document-service.yml
groups:
  - name: document_service
    interval: 15s
    rules:
      - alert: DocumentServiceHighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Document Service high error rate"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: DocumentStorageLowDiskSpace
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Document storage low disk space"
          description: "Disk usage is at {{ $value }}%"
      
      - alert: DocumentSearchSlowQuery
        expr: rate(elasticsearch_query_time_seconds_sum[5m]) / rate(elasticsearch_query_time_seconds_count[5m]) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Document search slow query"
          description: "Average query time is {{ $value }} seconds"
```

## 7. 测试策略

### 7.1 单元测试
```java
@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {
    
    @Mock
    private DocumentRepository documentRepository;
    
    @Mock
    private CategoryRepository categoryRepository;
    
    @Mock
    private FileStorageService fileStorageService;
    
    @InjectMocks
    private DocumentService documentService;
    
    @Test
    void createDocument_shouldCreateDocumentSuccessfully() {
        // Arrange
        DocumentCreateDTO dto = new DocumentCreateDTO();
        dto.setTitle("Test Document");
        dto.setDocumentType("PROCEDURE");
        dto.setCategoryId(1L);
        
        MultipartFile file = new MockMultipartFile("test.pdf", "test.pdf", "application/pdf", "test content".getBytes());
        
        DocumentCategory category = new DocumentCategory();
        category.setId(1L);
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(fileStorageService.uploadDocument(any(), any(), any())).thenReturn("http://test.com/test.pdf");
        
        // Act
        DocumentDTO result = documentService.createDocument(dto, file);
        
        // Assert
        assertNotNull(result);
        assertEquals("Test Document", result.getTitle());
        assertEquals("PROCEDURE", result.getDocumentType());
    }
    
    @Test
    void createDocument_shouldThrowExceptionWhenCategoryNotFound() {
        // Arrange
        DocumentCreateDTO dto = new DocumentCreateDTO();
        dto.setCategoryId(1L);
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> {
            documentService.createDocument(dto, null);
        });
    }
}
```

### 7.2 集成测试
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DocumentControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Test
    void searchDocuments_shouldReturnDocuments() {
        // Arrange
        Document doc = new Document();
        doc.setTitle("Test Document");
        doc.setDocumentCode("QMS-DOC-001");
        doc.setStatus("PUBLISHED");
        documentRepository.save(doc);
        
        // Act
        ResponseEntity<Page<DocumentSearchResult>> response = restTemplate.getForEntity(
            "/api/documents/search?keyword=Test", 
            new ParameterizedTypeReference<Page<DocumentSearchResult>>() {}
        );
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getContent().size() > 0);
    }
    
    @Test
    void createDocument_shouldCreateDocument() {
        // Arrange
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("title", "Integration Test Document");
        body.add("documentType", "PROCEDURE");
        body.add("categoryId", "1");
        
        MockMultipartFile file = new MockMultipartFile(
            "file", 
            "test.pdf", 
            "application/pdf", 
            "test content".getBytes()
        );
        body.add("file", file);
        
        // Act
        ResponseEntity<DocumentDTO> response = restTemplate.postForEntity(
            "/api/documents", 
            body, 
            DocumentDTO.class
        );
        
        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Integration Test Document", response.getBody().getTitle());
    }
}
```

## 8. 项目总结

### 8.1 实现要点总结
1. **完整的文档生命周期管理**: 从草稿到发布、撤销的全流程管理
2. **智能文档检索**: 基于Elasticsearch的高效全文检索
3. **版本控制机制**: 支持文档版本比较和回滚
4. **权限细粒度控制**: 基于角色、部门、用户的权限管理
5. **工作流集成**: 可配置的多级审批流程
6. **智能化特性**: 自动标签推荐、相关文档推荐
7. **高性能优化**: 缓存、分块上传、CDN加速
8. **安全性保障**: 完善的审计日志和访问控制

### 8.2 技术特色
- **微服务架构**: 独立部署的文档管理服务
- **多存储方案**: 支持MinIO、阿里云OSS等多种存储
- **搜索优化**: Elasticsearch全文检索与智能推荐
- **容器化部署**: Docker + Kubernetes支持
- **监控告警**: Prometheus + Grafana监控体系

### 8.3 业务价值
为舜富精密压铸提供:
1. 完全合规的文档管理体系
2. 高效的文档检索和协作工具
3. 智能化的文档管理体验
4. 完善的版本控制和审计功能
5. 与QMS其他系统的无缝集成

---

**文档管理模块详细实现规范完成。接下来继续实现供应商管理模块详细规范。**