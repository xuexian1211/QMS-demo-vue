# 舜富QMS系统 - 培训管理模块详细实现规范

## 1. 模块概述

### 1.1 功能定位
培训管理模块是舜富QMS系统的人才发展核心，负责质量培训的全生命周期管理，确保员工具备必要的质量知识、技能和资质，满足IATF16949:2016对人员能力的要求。

### 1.2 业务价值
- **能力提升**: 系统化提升员工质量管理能力和专业技能
- **合规保障**: 确保员工资质符合IATF16949:2016标准要求
- **知识传承**: 将质量知识和经验有效传递给员工
- **绩效改进**: 通过培训提升质量意识和操作技能
- **人才培养**: 构建完善的质量人才培养体系

### 1.3 技术架构
- **前端**: Vue.js 3.x + Element Plus + ECharts可视化
- **后端**: Spring Boot 3.x + Spring Security + Spring Data JPA
- **数据库**: PostgreSQL (主业务) + MongoDB (文档) + Redis (缓存)
- **视频服务**: FFmpeg + Nginx-RTMP + HLS
- **在线考试**: Ant Design + Vue.js + WebSocket
- **报表系统**: JasperReports + Apache POI
- **移动端**: Uni-app + 微信小程序

## 2. 核心功能详细设计

### 2.1 培训课程管理

#### 2.1.1 课程体系架构
```java
// 培训课程实体
@Entity
@Table(name = "qms_training_course")
@Data
public class TrainingCourse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String courseName;
    
    @Column(nullable = false, length = 50)
    private String courseCode; // QMS-TRN-2024-001
    
    @Column(length = 1000)
    private String courseDescription;
    
    @Column(nullable = false)
    private CourseType courseType; // MANDATORY, ELECTIVE, CUSTOM
    
    @Column(nullable = false)
    private CourseCategory category; // QUALITY_AWARENESS, TECHNICAL_SKILL, PROCESS_KNOWLEDGE, MANAGEMENT
    
    @Column(nullable = false)
    private TrainingLevel level; // BASIC, INTERMEDIATE, ADVANCED, EXPERT
    
    @Column(nullable = false)
    private Integer durationHours; // 培训时长(小时)
    
    @Column(nullable = false)
    private Integer validPeriod; // 有效期(月)
    
    @Column(nullable = false)
    private String targetAudience; // 目标受众
    
    @Column(nullable = false)
    private String learningObjectives; // 学习目标
    
    @Column(length = 1000)
    private String prerequisites; // 前置要求
    
    @Column(nullable = false)
    private CourseStatus status; // DRAFT, PUBLISHED, ARCHIVED
    
    @Column(nullable = false)
    private LocalDateTime publishDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<CourseModule> modules = new ArrayList<>();
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<CourseSchedule> schedules = new ArrayList<>();
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<CourseRequirement> requirements = new ArrayList<>();
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<CourseMaterial> materials = new ArrayList<>();
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<CourseAssessment> assessments = new ArrayList<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "qms_course_instructor",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "instructor_id")
    )
    private Set<User> instructors = new HashSet<>();
    
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

// 课程模块实体
@Entity
@Table(name = "qms_course_module")
@Data
public class CourseModule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private TrainingCourse course;
    
    @Column(nullable = false)
    private Integer moduleOrder;
    
    @Column(nullable = false, length = 200)
    private String moduleName;
    
    @Column(length = 1000)
    private String moduleDescription;
    
    @Column(nullable = false)
    private Integer estimatedDuration; // 预估时长(分钟)
    
    @Column(nullable = false)
    private ModuleType moduleType; // VIDEO, DOCUMENT, QUIZ, PRACTICE, DISCUSSION
    
    @Column(nullable = false)
    private ModuleStatus status; // DRAFT, PUBLISHED, ARCHIVED
    
    @Column(length = 500)
    private String videoUrl;
    
    @Column(length = 500)
    private String documentUrl;
    
    @Column(length = 1000)
    private String quizQuestions;
    
    @Column(length = 1000)
    private String practiceTasks;
    
    @Column(length = 500)
    private String discussionTopic;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL)
    private List<ModuleResource> resources = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

#### 2.1.2 课程管理服务
```java
@Service
@RequiredArgsConstructor
public class TrainingCourseService {
    
    private final TrainingCourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    
    /**
     * 创建培训课程
     */
    @Transactional
    public TrainingCourseDTO createCourse(TrainingCourseCreateDTO dto) {
        // 验证课程编号唯一性
        validateCourseCode(dto.getCourseCode());
        
        // 创建课程
        TrainingCourse course = TrainingCourse.builder()
            .courseName(dto.getCourseName())
            .courseCode(dto.getCourseCode())
            .courseDescription(dto.getCourseDescription())
            .courseType(dto.getCourseType())
            .category(dto.getCategory())
            .level(dto.getLevel())
            .durationHours(dto.getDurationHours())
            .validPeriod(dto.getValidPeriod())
            .targetAudience(dto.getTargetAudience())
            .learningObjectives(dto.getLearningObjectives())
            .prerequisites(dto.getPrerequisites())
            .status(CourseStatus.DRAFT)
            .author(SecurityUtils.getCurrentUser())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        courseRepository.save(course);
        
        // 创建课程模块
        createCourseModules(course, dto.getModules());
        
        // 设置讲师
        if (dto.getInstructorIds() != null && !dto.getInstructorIds().isEmpty()) {
            Set<User> instructors = userRepository.findAllById(dto.getInstructorIds());
            course.setInstructors(instructors);
        }
        
        courseRepository.save(course);
        
        return convertToDTO(course);
    }
    
    /**
     * 更新课程信息
     */
    @Transactional
    public TrainingCourseDTO updateCourse(Long courseId, TrainingCourseUpdateDTO dto) {
        TrainingCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        
        // 更新基本信息
        if (StringUtils.hasText(dto.getCourseName())) {
            course.setCourseName(dto.getCourseName());
        }
        if (StringUtils.hasText(dto.getCourseDescription())) {
            course.setCourseDescription(dto.getCourseDescription());
        }
        if (dto.getDurationHours() != null) {
            course.setDurationHours(dto.getDurationHours());
        }
        if (dto.getValidPeriod() != null) {
            course.setValidPeriod(dto.getValidPeriod());
        }
        
        // 更新讲师
        if (dto.getInstructorIds() != null) {
            Set<User> instructors = userRepository.findAllById(dto.getInstructorIds());
            course.setInstructors(instructors);
        }
        
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
        
        return convertToDTO(course);
    }
    
    /**
     * 发布课程
     */
    @Transactional
    public void publishCourse(Long courseId) {
        TrainingCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        
        // 验证课程完整性
        validateCourseForPublish(course);
        
        // 发布所有模块
        publishAllModules(course);
        
        // 更新课程状态
        course.setStatus(CourseStatus.PUBLISHED);
        course.setPublishDate(LocalDateTime.now());
        courseRepository.save(course);
        
        // 通知相关人员
        notifyCoursePublished(course);
    }
    
    /**
     * 归档课程
     */
    @Transactional
    public void archiveCourse(Long courseId, String reason) {
        TrainingCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        
        if (course.getStatus() == CourseStatus.ARCHIVED) {
            throw new IllegalStateException("Course is already archived");
        }
        
        course.setStatus(CourseStatus.ARCHIVED);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
        
        // 发送归档通知
        notificationService.sendCourseArchivedNotification(course, reason);
    }
    
    /**
     * 获取课程详情
     */
    public TrainingCourseDetailDTO getCourseDetail(Long courseId) {
        TrainingCourse course = courseRepository.findByIdWithDetails(courseId)
            .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        
        TrainingCourseDetailDTO dto = convertToDetailDTO(course);
        
        // 获取课程统计
        CourseStats stats = getCourseStats(courseId);
        dto.setStats(stats);
        
        return dto;
    }
    
    /**
     * 课程搜索
     */
    public Page<TrainingCourseDTO> searchCourses(CourseSearchCriteria criteria, Pageable pageable) {
        Specification<TrainingCourse> spec = Specification.where(null);
        
        // 关键词搜索
        if (StringUtils.hasText(criteria.getKeyword())) {
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(root.get("courseName"), "%" + criteria.getKeyword() + "%"),
                cb.like(root.get("courseDescription"), "%" + criteria.getKeyword() + "%"),
                cb.like(root.get("learningObjectives"), "%" + criteria.getKeyword() + "%")
            ));
        }
        
        // 课程类型过滤
        if (criteria.getCourseType() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("courseType"), criteria.getCourseType()));
        }
        
        // 分类过滤
        if (criteria.getCategory() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("category"), criteria.getCategory()));
        }
        
        // 等级过滤
        if (criteria.getLevel() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("level"), criteria.getLevel()));
        }
        
        // 状态过滤
        if (criteria.getStatus() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), criteria.getStatus()));
        }
        
        Page<TrainingCourse> page = courseRepository.findAll(spec, pageable);
        return page.map(this::convertToDTO);
    }
    
    /**
     * 创建课程模块
     */
    private void createCourseModules(TrainingCourse course, List<ModuleCreateDTO> moduleDTOs) {
        if (moduleDTOs == null || moduleDTOs.isEmpty()) {
            return;
        }
        
        for (int i = 0; i < moduleDTOs.size(); i++) {
            ModuleCreateDTO moduleDTO = moduleDTOs.get(i);
            
            CourseModule module = CourseModule.builder()
                .course(course)
                .moduleOrder(i + 1)
                .moduleName(moduleDTO.getModuleName())
                .moduleDescription(moduleDTO.getModuleDescription())
                .estimatedDuration(moduleDTO.getEstimatedDuration())
                .moduleType(moduleDTO.getModuleType())
                .status(ModuleStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .build();
            
            moduleRepository.save(module);
            course.getModules().add(module);
            
            // 处理模块资源
            handleModuleResources(module, moduleDTO);
        }
    }
    
    /**
     * 发布所有模块
     */
    private void publishAllModules(TrainingCourse course) {
        for (CourseModule module : course.getModules()) {
            if (module.getStatus() == ModuleStatus.DRAFT) {
                module.setStatus(ModuleStatus.PUBLISHED);
                moduleRepository.save(module);
            }
        }
    }
    
    /**
     * 验证课程发布完整性
     */
    private void validateCourseForPublish(TrainingCourse course) {
        // 检查是否有模块
        if (course.getModules().isEmpty()) {
            throw new IllegalStateException("课程必须包含至少一个模块");
        }
        
        // 检查所有模块是否已发布
        for (CourseModule module : course.getModules()) {
            if (module.getStatus() != ModuleStatus.PUBLISHED) {
                throw new IllegalStateException("所有模块都必须已发布才能发布课程");
            }
        }
        
        // 检查是否设置了讲师
        if (course.getInstructors().isEmpty()) {
            throw new IllegalStateException("课程必须设置讲师");
        }
        
        // 检查是否有评估
        if (course.getAssessments().isEmpty()) {
            throw new IllegalStateException("课程必须包含评估方式");
        }
    }
    
    /**
     * 获取课程统计
     */
    private CourseStats getCourseStats(Long courseId) {
        CourseStats stats = new CourseStats();
        stats.setCourseId(courseId);
        
        // 注册人数
        Long registrationCount = courseRegistrationRepository.countByCourseId(courseId);
        stats.setRegistrationCount(registrationCount != null ? registrationCount : 0);
        
        // 完成人数
        Long completionCount = courseRegistrationRepository
            .countByCourseIdAndStatus(courseId, RegistrationStatus.COMPLETED);
        stats.setCompletionCount(completionCount != null ? completionCount : 0);
        
        // 平均评分
        Double averageRating = courseRegistrationRepository
            .getAverageRatingByCourseId(courseId);
        stats.setAverageRating(averageRating != null ? averageRating : 0.0);
        
        // 最近学习人数
        Long recentLearners = courseRegistrationRepository
            .countByCourseIdAndLastAccessTimeAfter(courseId, 
                LocalDateTime.now().minusDays(7));
        stats.setRecentLearners(recentLearners != null ? recentLearners : 0);
        
        return stats;
    }
    
    /**
     * 通知课程发布
     */
    private void notifyCoursePublished(TrainingCourse course) {
        // 通知目标受众
        notificationService.sendCoursePublishedNotification(course);
        
        // 通知讲师
        for (User instructor : course.getInstructors()) {
            notificationService.sendInstructorCourseNotification(course, instructor);
        }
    }
}
```

### 2.2 培训计划管理

#### 2.2.1 计划体系实体
```java
// 培训计划实体
@Entity
@Table(name = "qms_training_plan")
@Data
public class TrainingPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String planName;
    
    @Column(nullable = false, length = 50)
    private String planCode; // QMS-PLAN-2024-001
    
    @Column(length = 1000)
    private String planDescription;
    
    @Column(nullable = false)
    private PlanType planType; // DEPARTMENT, POSITION, INDIVIDUAL, COMPANY
    
    @Column(nullable = false)
    private PlanStatus status; // DRAFT, PUBLISHED, ACTIVE, COMPLETED, ARCHIVED
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    @Column(nullable = false)
    private LocalDate endDate;
    
    @Column(nullable = false)
    private Integer totalDuration; // 总时长(小时)
    
    @Column(nullable = false)
    private Integer targetParticipants; // 目标人数
    
    @Column(length = 1000)
    private String planGoals; // 计划目标
    
    @Column(length = 1000)
    private String successCriteria; // 成功标准
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;
    
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL)
    private List<PlanCourse> planCourses = new ArrayList<>();
    
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL)
    private List<PlanSchedule> schedules = new ArrayList<>();
    
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL)
    private List<PlanParticipant> participants = new ArrayList<>();
    
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL)
    private List<PlanRequirement> requirements = new ArrayList<>();
    
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

// 计划课程关联实体
@Entity
@Table(name = "qms_plan_course")
@Data
public class PlanCourse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private TrainingPlan plan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private TrainingCourse course;
    
    @Column(nullable = false)
    private Integer courseOrder;
    
    @Column(nullable = false)
    private LocalDate scheduledDate;
    
    @Column(nullable = false)
    private String sessionTime; // "09:00-12:00"
    
    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false)
    private Integer maxParticipants;
    
    @Column(nullable = false)
    private CourseSessionStatus status; // SCHEDULED, ONGOING, COMPLETED, CANCELLED
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "planCourse", cascade = CascadeType.ALL)
    private List<SessionRegistration> registrations = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

#### 2.2.2 计划管理服务
```java
@Service
@RequiredArgsConstructor
public class TrainingPlanService {
    
    private final TrainingPlanRepository planRepository;
    private final TrainingCourseRepository courseRepository;
    private final PlanCourseRepository planCourseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    /**
     * 创建培训计划
     */
    @Transactional
    public TrainingPlanDTO createPlan(TrainingPlanCreateDTO dto) {
        // 验证计划编号唯一性
        validatePlanCode(dto.getPlanCode());
        
        // 创建培训计划
        TrainingPlan plan = TrainingPlan.builder()
            .planName(dto.getPlanName())
            .planCode(dto.getPlanCode())
            .planDescription(dto.getPlanDescription())
            .planType(dto.getPlanType())
            .status(PlanStatus.DRAFT)
            .startDate(dto.getStartDate())
            .endDate(dto.getEndDate())
            .totalDuration(dto.getTotalDuration())
            .targetParticipants(dto.getTargetParticipants())
            .planGoals(dto.getPlanGoals())
            .successCriteria(dto.getSuccessCriteria())
            .manager(SecurityUtils.getCurrentUser())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        planRepository.save(plan);
        
        // 添加计划课程
        addPlanCourses(plan, dto.getCourseIds());
        
        // 设置参与者
        if (dto.getParticipantIds() != null && !dto.getParticipantIds().isEmpty()) {
            addParticipants(plan, dto.getParticipantIds());
        }
        
        planRepository.save(plan);
        
        return convertToDTO(plan);
    }
    
    /**
     * 发布培训计划
     */
    @Transactional
    public void publishPlan(Long planId) {
        TrainingPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new EntityNotFoundException("Training plan not found"));
        
        // 验证计划完整性
        validatePlanForPublish(plan);
        
        // 更新状态
        plan.setStatus(PlanStatus.PUBLISHED);
        planRepository.save(plan);
        
        // 发送发布通知
        notifyPlanPublished(plan);
    }
    
    /**
     * 激活培训计划
     */
    @Transactional
    public void activatePlan(Long planId) {
        TrainingPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new EntityNotFoundException("Training plan not found"));
        
        if (plan.getStatus() != PlanStatus.PUBLISHED) {
            throw new IllegalStateException("Only published plans can be activated");
        }
        
        // 创建培训安排
        createTrainingSchedules(plan);
        
        // 更新状态
        plan.setStatus(PlanStatus.ACTIVE);
        planRepository.save(plan);
        
        // 通知参与者
        notifyPlanActivated(plan);
    }
    
    /**
     * 完成培训计划
     */
    @Transactional
    public void completePlan(Long planId) {
        TrainingPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new EntityNotFoundException("Training plan not found"));
        
        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new IllegalStateException("Only active plans can be completed");
        }
        
        // 更新状态
        plan.setStatus(PlanStatus.COMPLETED);
        planRepository.save(plan);
        
        // 生成计划报告
        generatePlanReport(plan);
        
        // 发送完成通知
        notificationService.sendPlanCompletedNotification(plan);
    }
    
    /**
     * 获取计划详情
     */
    public TrainingPlanDetailDTO getPlanDetail(Long planId) {
        TrainingPlan plan = planRepository.findByIdWithDetails(planId)
            .orElseThrow(() -> new EntityNotFoundException("Training plan not found"));
        
        TrainingPlanDetailDTO dto = convertToDetailDTO(plan);
        
        // 获取计划统计
        PlanStats stats = getPlanStats(planId);
        dto.setStats(stats);
        
        return dto;
    }
    
    /**
     * 获取用户参与的计划
     */
    public Page<TrainingPlanDTO> getUserPlans(PlanSearchCriteria criteria, Pageable pageable) {
        User user = SecurityUtils.getCurrentUser();
        
        Specification<TrainingPlan> spec = Specification.where(null);
        
        // 根据用户角色过滤
        if (user.getRole().getName().equals("MANAGER")) {
            // 管理员可以看到自己管理的计划
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("manager"), user));
        } else {
            // 普通员工可以看到自己参与的计划
            spec = spec.and((root, query, cb) -> {
                Join<TrainingPlan, PlanParticipant> participantJoin = root.join("participants", JoinType.LEFT);
                return cb.equal(participantJoin.get("user"), user);
            });
        }
        
        // 状态过滤
        if (criteria.getStatus() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), criteria.getStatus()));
        }
        
        // 时间范围过滤
        if (criteria.getStartDate() != null && criteria.getEndDate() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.between(root.get("startDate"), criteria.getStartDate(), criteria.getEndDate()));
        }
        
        Page<TrainingPlan> page = planRepository.findAll(spec, pageable);
        return page.map(this::convertToDTO);
    }
    
    /**
     * 添加计划课程
     */
    private void addPlanCourses(TrainingPlan plan, List<Long> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            return;
        }
        
        List<TrainingCourse> courses = courseRepository.findAllById(courseIds);
        
        for (int i = 0; i < courses.size(); i++) {
            TrainingCourse course = courses.get(i);
            
            PlanCourse planCourse = PlanCourse.builder()
                .plan(plan)
                .course(course)
                .courseOrder(i + 1)
                .status(CourseSessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();
            
            planCourseRepository.save(planCourse);
            plan.getPlanCourses().add(planCourse);
            
            // 计算总时长
            plan.setTotalDuration(plan.getTotalDuration() + course.getDurationHours());
        }
    }
    
    /**
     * 添加参与者
     */
    private void addParticipants(TrainingPlan plan, List<Long> participantIds) {
        List<User> participants = userRepository.findAllById(participantIds);
        
        for (User participant : participants) {
            PlanParticipant planParticipant = PlanParticipant.builder()
                .plan(plan)
                .user(participant)
                .participantRole("PARTICIPANT")
                .enrollmentDate(LocalDate.now())
                .status(RegistrationStatus.REGISTERED)
                .createdAt(LocalDateTime.now())
                .build();
            
            plan.getParticipants().add(planParticipant);
        }
    }
    
    /**
     * 验证计划发布完整性
     */
    private void validatePlanForPublish(TrainingPlan plan) {
        // 检查是否有课程
        if (plan.getPlanCourses().isEmpty()) {
            throw new IllegalStateException("计划必须包含至少一个课程");
        }
        
        // 检查日期逻辑
        if (plan.getStartDate().isAfter(plan.getEndDate())) {
            throw new IllegalStateException("开始日期不能晚于结束日期");
        }
        
        // 检查是否有参与者
        if (plan.getParticipants().isEmpty()) {
            throw new IllegalStateException("计划必须设置参与者");
        }
        
        // 检查成功标准
        if (!StringUtils.hasText(plan.getSuccessCriteria())) {
            throw new IllegalStateException("计划必须设置成功标准");
        }
    }
    
    /**
     * 创建培训安排
     */
    private void createTrainingSchedules(TrainingPlan plan) {
        LocalDate currentDate = plan.getStartDate();
        
        for (PlanCourse planCourse : plan.getPlanCourses()) {
            // 为每个课程创建具体的培训安排
            PlanSchedule schedule = PlanSchedule.builder()
                .plan(plan)
                .planCourse(planCourse)
                .sessionDate(currentDate)
                .sessionTime(planCourse.getSessionTime())
                .location(planCourse.getLocation())
                .maxParticipants(planCourse.getMaxParticipants())
                .status(SessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();
            
            plan.getSchedules().add(schedule);
            
            // 递增日期
            currentDate = currentDate.plusDays(1);
        }
    }
    
    /**
     * 获取计划统计
     */
    private PlanStats getPlanStats(Long planId) {
        PlanStats stats = new PlanStats();
        stats.setPlanId(planId);
        
        // 总参与人数
        Long totalParticipants = planParticipantRepository.countByPlanId(planId);
        stats.setTotalParticipants(totalParticipants != null ? totalParticipants : 0);
        
        // 已完成人数
        Long completedParticipants = planParticipantRepository
            .countByPlanIdAndStatus(planId, RegistrationStatus.COMPLETED);
        stats.setCompletedParticipants(completedParticipants != null ? completedParticipants : 0);
        
        // 完成率
        Double completionRate = totalParticipants > 0 ? 
            new Double(completedParticipants) / totalParticipants * 100 : 0.0;
        stats.setCompletionRate(completionRate);
        
        // 平均评分
        Double averageRating = planParticipantRepository
            .getAverageRatingByPlanId(planId);
        stats.setAverageRating(averageRating != null ? averageRating : 0.0);
        
        // 课程完成情况
        Map<String, Integer> courseCompletion = planCourseRepository
            .getCourseCompletionStats(planId);
        stats.setCourseCompletion(courseCompletion);
        
        return stats;
    }
    
    /**
     * 通知计划发布
     */
    private void notifyPlanPublished(TrainingPlan plan) {
        // 通知计划管理员
        notificationService.sendPlanPublishedNotification(plan, plan.getManager());
        
        // 通知讲师
        for (PlanCourse planCourse : plan.getPlanCourses()) {
            User instructor = planCourse.getCourse().getAuthor();
            notificationService.sendInstructorPlanNotification(plan, planCourse, instructor);
        }
    }
    
    /**
     * 通知计划激活
     */
    private void notifyPlanActivated(TrainingPlan plan) {
        // 通知所有参与者
        for (PlanParticipant participant : plan.getParticipants()) {
            notificationService.sendPlanActivatedNotification(plan, participant.getUser());
        }
    }
    
    /**
     * 生成计划报告
     */
    private void generatePlanReport(TrainingPlan plan) {
        // 收集统计数据
        PlanStats stats = getPlanStats(plan.getId());
        
        // 生成PDF报告
        byte[] reportData = reportGenerator.generateTrainingPlanReport(plan, stats);
        
        // 保存报告
        String reportUrl = fileStorageService.uploadReport(reportData, 
            "training-plan-report-" + plan.getId() + ".pdf");
        
        // 创建报告记录
        TrainingPlanReport report = TrainingPlanReport.builder()
            .plan(plan)
            .reportUrl(reportUrl)
            .reportType("COMPLETION_REPORT")
            .generatedBy(SecurityUtils.getCurrentUser())
            .generatedAt(LocalDateTime.now())
            .build();
        
        planReportRepository.save(report);
    }
}
```

### 2.3 培训实施管理

#### 2.3.1 实施过程管理
```java
// 培训会话实体
@Entity
@Table(name = "qms_training_session")
@Data
public class TrainingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_course_id", nullable = false)
    private PlanCourse planCourse;
    
    @Column(nullable = false)
    private LocalDate sessionDate;
    
    @Column(nullable = false)
    private String sessionTime; // "09:00-12:00"
    
    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false)
    private SessionStatus status; // SCHEDULED, ONGOING, COMPLETED, CANCELLED
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    @Column
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private Integer actualDuration; // 实际时长(分钟)
    
    @Column(nullable = false)
    private String sessionMode; // ONLINE, OFFLINE, HYBRID
    
    @Column(nullable = false)
    private String platform; // ZOOM, TEAMS, CLASSROOM
    
    @Column(length = 1000)
    private String sessionNotes;
    
    @Column(length = 500)
    private String recordingUrl;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<SessionAttendance> attendance = new ArrayList<>();
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<SessionFeedback> feedback = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        startTime = LocalDateTime.now();
        actualDuration = 0;
    }
}

// 培训报名实体
@Entity
@Table(name = "qms_training_registration")
@Data
public class TrainingRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_course_id", nullable = false)
    private PlanCourse planCourse;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private RegistrationStatus status; // REGISTERED, COMPLETED, CANCELLED, FAILED
    
    @Column(nullable = false)
    private LocalDateTime registrationDate;
    
    @Column
    private LocalDateTime completionDate;
    
    @Column(nullable = false)
    private Integer progressPercentage; // 进度百分比
    
    @Column(nullable = false)
    private Long totalTimeSpent; // 总学习时间(分钟)
    
    @Column
    private BigDecimal finalScore; // 最终成绩
   