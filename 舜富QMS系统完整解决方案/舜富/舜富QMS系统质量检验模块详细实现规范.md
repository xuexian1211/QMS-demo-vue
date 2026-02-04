# 舜富QMS系统 - 质量检验模块详细实现

## 1. 质量检验模块总览

### 1.1 检验模块架构设计

```
┌─────────────────────────────────────────────────────────────┐
│               质量检验模块 - 微服务架构                       │
├─────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 检验业务流程层                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ IQC检验      │ │ IPQC检验      │ │ FQC/OQC检验 │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 检验管理服务层                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │检验计划     │ │检验执行     │ │检验判定     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 抽样算法服务层                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │抽样标准     │ │抽样计算     │ │抽样调整     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 数据持久化层                             │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │IQC检验记录   │ │IPQC检验记录   │ │FQC/OQC检验记录│      │  │
│  │  │PostgreSQL  │ │PostgreSQL   │ │PostgreSQL   │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 检验业务流程概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     质量检验业务流程图                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ 检验计划  │───▶│ 检验执行  │───▶│ 结果判定  │                   │
│  └──────────┘    └──────────┘    └────┬─────┘                   │
│                                       │                          │
│                          ┌────────────┴────────────┐            │
│                          ▼                         ▼            │
│                   ┌──────────┐              ┌──────────┐          │
│                   │ 合格接收  │              │ 不合格品  │          │
│                   └────┬─────┘              └────┬─────┘          │
│                        │                        │                │
│                        └──────────┬─────────────┘                │
│                                   ▼                              │
│                            ┌──────────┐                          │
│                            │ 质量追溯  │                          │
│                            └────┬─────┘                          │
│                                   ▼                              │
│                            ┌──────────┐                          │
│                            │ 客户交付  │                          │
│                            └──────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. IQC来料检验模块详细实现

### 2.1 IQC检验流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         IQC检验流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ 来料通知  │───▶│ 检验计划  │───▶│ 现场取样  │                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                               │                                │
│                  ┌────────────┴────────────┐                   │
│                  ▼                         ▼                   │
│           ┌──────────┐              ┌──────────┐               │
│           │ 检验项目  │              │ 样品准备  │               │
│           └────┬─────┘              └──────────┘               │
│                 │                                             │
│           ┌────┴────┐                                          │
│           ▼         ▼                                          │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ 尺寸测量  │  │ 材质分析  │                                    │
│  └──────────┘  └──────────┘                                    │
│                  │                                             │
│           ┌──────┴──────┐                                      │
│           ▼              ▼                                      │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ 功能测试  │  │ 外观检验  │                                    │
│  └──────────┘  └──────────┘                                    │
│                  │                                             │
│           ┌──────┴──────┐                                      │
│           ▼              ▼                                      │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ 记录数据  │  │ 结果判定  │                                    │
│  └────┬─────┘  └──────────┘                                    │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                                │
│  │ 系统记录  │                                                │
│  └──────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 IQC检验核心类设计

```java
/**
 * IQC检验记录实体
 */
@Data
@Entity
@Table(name = "iqc_inspection_record")
@DynamicUpdate
public class IQCInspectionRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspection_id")
    private Long inspectionId;
    
    @Column(name = "inspection_lot_number", unique = true, nullable = false)
    private String inspectionLotNumber;
    
    @Column(name = "material_id", nullable = false)
    private Long materialId;
    
    @Column(name = "material_code", nullable = false)
    private String materialCode;
    
    @Column(name = "material_name", nullable = false)
    private String materialName;
    
    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;
    
    @Column(name = "supplier_name", nullable = false)
    private String supplierName;
    
    @Column(name = "inspection_type", nullable = false)
    private IQCInspectionType inspectionType; // FIRST_INSPECTION, ROUTINE_INSPECTION
    
    @Column(name = "batch_number", nullable = false)
    private String batchNumber;
    
    @Column(name = "arrival_date", nullable = false)
    private LocalDate arrivalDate;
    
    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;
    
    @Column(name = "quantity_received", nullable = false)
    private Integer quantityReceived;
    
    @Column(name = "sample_size", nullable = false)
    private Integer sampleSize;
    
    @Column(name = "inspected_quantity")
    private Integer inspectedQuantity;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_result", nullable = false)
    private InspectionResult inspectionResult; // ACCEPT, REJECT, CONDITIONAL_ACCEPT
    
    @Column(name = "inspector_id", nullable = false)
    private Long inspectorId;
    
    @Column(name = "inspector_name", nullable = false)
    private String inspectorName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sampling_standard")
    private SamplingStandard samplingStandard; // MIL_STD_105E, ISO_2859_1, GB_T_2828_1
    
    @Column(name = "inspection_level", nullable = false)
    private String inspectionLevel; // NORMAL, TIGHTENED, RELAXED
    
    @Column(name = "aql_value", nullable = false)
    private String aqlValue;
    
    @Column(name = "quantity_nonconforming")
    private Integer quantityNonconforming;
    
    @Column(name = "nonconforming_rate")
    private Double nonconformingRate;
    
    @Type(type = "json")
    @Column(name = "defect_details", columnDefinition = "jsonb")
    private List<DefectDetail> defectDetails;
    
    @Type(type = "json")
    @Column(name = "test_results", columnDefinition = "jsonb")
    private List<TestResult> testResults;
    
    @Type(type = "json")
    @Column(name = "attachments", columnDefinition = "jsonb")
    private List<Attachment> attachments;
    
    @Column(name = "inspection_notes", columnDefinition = "TEXT")
    private String inspectionNotes;
    
    @Column(name = "next_inspection_plan", columnDefinition = "TEXT")
    private String nextInspectionPlan;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private IQCRecordStatus status; // PLANNED, IN_PROGRESS, COMPLETED, APPROVED
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    
    // 关联关系
    @OneToMany(mappedBy = "iqcRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IQCInspectionItem> inspectionItems = new ArrayList<>();
    
    @OneToMany(mappedBy = "iqcRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IQCNonconformingRecord> nonconformingRecords = new ArrayList<>();
}

/**
 * IQC检验项目实体
 */
@Data
@Entity
@Table(name = "iqc_inspection_item")
public class IQCInspectionItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;
    
    @Column(name = "inspection_id", nullable = false)
    private Long inspectionId;
    
    @Column(name = "item_code", nullable = false)
    private String itemCode;
    
    @Column(name = "item_name", nullable = false)
    private String itemName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_method", nullable = false)
    private InspectionMethod inspectionMethod; // DIMENSIONAL_CHECK, MATERIAL_ANALYSIS, FUNCTIONAL_TEST
    
    @Column(name = "specification_min")
    private String specificationMin;
    
    @Column(name = "specification_max")
    private String specificationMax;
    
    @Column(name = "specification_unit")
    private String specificationUnit;
    
    @Column(name = "measured_value")
    private String measuredValue;
    
    @Column(name = "deviation")
    private String deviation;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "item_result")
    private ItemResult itemResult; // ACCEPT, REJECT, CONDITIONAL_ACCEPT
    
    @Column(name = "remarks")
    private String remarks;
    
    @Column(name = "instrument_id")
    private String instrumentId;
    
    // 关联关系
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", insertable = false, updatable = false)
    private IQCInspectionRecord iqcRecord;
}
```

### 2.3 IQC检验计划服务

```java
/**
 * IQC检验计划服务
 */
@Service
@Slf4j
@Transactional
public class IQCInspectionPlanServiceImpl implements IQCInspectionPlanService {
    
    @Autowired
    private IQCInspectionRecordRepository iqcInspectionRecordRepository;
    
    @Autowired
    private MaterialRepository materialRepository;
    
    @Autowired
    private SamplingService samplingService;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * 创建IQC检验计划
     */
    @Override
    public IQCInspectionPlanDTO createInspectionPlan(IQCCreatePlanDTO dto) {
        log.info("创建IQC检验计划,批次号: {}", dto.getBatchNumber());
        
        // 1. 验证物料信息
        Material material = getMaterialById(dto.getMaterialId());
        
        // 2. 验证供应商信息
        Supplier supplier = getSupplierById(dto.getSupplierId());
        
        // 3. 生成检验批号
        String inspectionLotNumber = generateInspectionLotNumber();
        
        // 4. 计算抽样方案
        SamplingPlan samplingPlan = calculateSamplingPlan(material, dto);
        
        // 5. 创建检验记录
        IQCInspectionRecord record = new IQCInspectionRecord();
        record.setInspectionLotNumber(inspectionLotNumber);
        record.setMaterialId(material.getMaterialId());
        record.setMaterialCode(material.getMaterialCode());
        record.setMaterialName(material.getMaterialName());
        record.setSupplierId(supplier.getSupplierId());
        record.setSupplierName(supplier.getSupplierName());
        record.setInspectionType(dto.getInspectionType());
        record.setBatchNumber(dto.getBatchNumber());
        record.setArrivalDate(dto.getArrivalDate());
        record.setQuantityReceived(dto.getQuantityReceived());
        record.setSampleSize(samplingPlan.getSampleSize());
        record.setInspectedQuantity(0);
        record.setInspectionResult(InspectionResult.PENDING);
        record.setInspectorId(SecurityUtils.getCurrentUserId());
        record.setInspectorName(SecurityUtils.getCurrentUserName());
        record.setSamplingStandard(samplingPlan.getSamplingStandard());
        record.setInspectionLevel(samplingPlan.getInspectionLevel());
        record.setAqlValue(samplingPlan.getAqlValue());
        record.setStatus(IQCRecordStatus.PLANNED);
        record.setCreatedBy(SecurityUtils.getCurrentUserId());
        record.setCreatedTime(LocalDateTime.now());
        
        // 6. 保存检验记录
        record = iqcInspectionRecordRepository.save(record);
        
        // 7. 创建检验项目
        createInspectionItems(record, dto);
        
        log.info("IQC检验计划创建成功,检验批号: {}", inspectionLotNumber);
        
        return convertToDTO(record);
    }
    
    /**
     * 计算抽样方案
     */
    @Override
    public SamplingPlan calculateSamplingPlan(Material material, IQCCreatePlanDTO dto) {
        log.info("计算IQC抽样方案,物料编码: {}", material.getMaterialCode());
        
        SamplingPlan plan = new SamplingPlan();
        
        // 1. 确定检验标准
        if (material.getInspectionStandard() != null) {
            plan.setSamplingStandard(material.getInspectionStandard());
        } else {
            plan.setSamplingStandard(SamplingStandard.MIL_STD_105E); // 默认标准
        }
        
        // 2. 确定检验等级
        if (material.getInspectionLevel() != null) {
            plan.setInspectionLevel(material.getInspectionLevel());
        } else {
            plan.setInspectionLevel("NORMAL");
        }
        
        // 3. 确定AQL值
        if (material.getAqlValue() != null) {
            plan.setAqlValue(material.getAqlValue());
        } else {
            plan.setAqlValue("2.5");
        }
        
        // 4. 计算批量 (到达数量)
        int lotSize = dto.getQuantityReceived();
        
        // 5. 计算样本量
        int sampleSize = samplingService.calculateSampleSize(
            plan.getSamplingStandard(),
            plan.getInspectionLevel(),
            lotSize
        );
        
        // 6. 根据抽样类型调整
        if (IQCInspectionType.FIRST_INSPECTION == dto.getInspectionType()) {
            sampleSize = (int) (sampleSize * 1.5); // 首检增加50%样本量
        }
        
        plan.setSampleSize(sampleSize);
        plan.setLotSize(lotSize);
        
        log.info("抽样方案计算完成,样本量: {}, AQL: {}", sampleSize, plan.getAqlValue());
        
        return plan;
    }
    
    /**
     * 创建检验项目
     */
    private void createInspectionItems(IQCInspectionRecord record, IQCCreatePlanDTO dto) {
        List<IQCInspectionItem> items = new ArrayList<>();
        
        // 1. 基于物料类型确定检验项目
        if ("ALUMINUM".equals(material.getMaterialGroup())) {
            // 铝合金检验项目
            items.addAll(createAluminumInspectionItems(record, material));
        } else if ("ZINC".equals(material.getMaterialGroup())) {
            // 锌合金检验项目
            items.addAll(createZincInspectionItems(record, material));
        } else if ("MAGNESIUM".equals(material.getMaterialGroup())) {
            // 镁合金检验项目
            items.addAll(createMagnesiumInspectionItems(record, material));
        } else {
            // 其他材料检验项目
            items.addAll(createGeneralInspectionItems(record, material));
        }
        
        // 2. 添加用户自定义检验项目
        if (dto.getCustomItems() != null) {
            items.addAll(createCustomInspectionItems(record, dto.getCustomItems()));
        }
        
        // 3. 批量保存
        iqcInspectionItemRepository.saveAll(items);
        
        log.info("创建检验项目完成,数量: {}", items.size());
    }
    
    /**
     * 创建铝合金检验项目
     */
    private List<IQCInspectionItem> createAluminumInspectionItems(IQCInspectionRecord record, Material material) {
        List<IQCInspectionItem> items = new ArrayList<>();
        
        // 1. 化学成分分析
        IQCInspectionItem chemicalAnalysis = createInspectionItem(
            record, "CHEM_ANALYSIS", "化学成分分析", 
            InspectionMethod.MATERIAL_ANALYSIS, null, null, "%"
        );
        items.add(chemicalAnalysis);
        
        // 2. 力学性能测试
        IQCInspectionItem mechanicalTest = createInspectionItem(
            record, "MECH_TEST", "力学性能测试", 
            InspectionMethod.MATERIAL_ANALYSIS, null, null, "MPa"
        );
        items.add(mechanicalTest);
        
        // 3. 尺寸检验
        IQCInspectionItem dimensionalCheck = createInspectionItem(
            record, "DIMENSIONAL", "尺寸检验", 
            InspectionMethod.DIMENSIONAL_CHECK, null, null, "mm"
        );
        items.add(dimensionalCheck);
        
        // 4. 外观检验
        IQCInspectionItem visualInspection = createInspectionItem(
            record, "VISUAL", "外观检验", 
            InspectionMethod.VISUAL_INSPECTION, null, null, null
        );
        items.add(visualInspection);
        
        // 5. 材料密度检验
        IQCInspectionItem densityTest = createInspectionItem(
            record, "DENSITY", "材料密度检验", 
            InspectionMethod.MATERIAL_ANALYSIS, null, null, "g/cm³"
        );
        items.add(densityTest);
        
        return items;
    }
    
    /**
     * 执行IQC检验
     */
    @Override
    public IQCInspectionResultDTO executeInspection(Long inspectionId, IQCExecuteDTO dto) {
        log.info("执行IQC检验,检验ID: {}", inspectionId);
        
        // 1. 查询检验记录
        IQCInspectionRecord record = getInspectionById(inspectionId);
        
        // 2. 验证状态
        if (IQCRecordStatus.IN_PROGRESS != record.getStatus()) {
            throw new BusinessException("只能执行进行中的检验");
        }
        
        // 3. 更新检验状态
        record.setStatus(IQCRecordStatus.COMPLETED);
        record.setInspectedQuantity(dto.getInspectedQuantity());
        record.setUpdatedBy(SecurityUtils.getCurrentUserId());
        record.setUpdatedTime(LocalDateTime.now());
        
        // 4. 检验项目执行
        executeInspectionItems(record, dto.getItems());
        
        // 5. 检验结果判定
        InspectionResult result = determineInspectionResult(record);
        record.setInspectionResult(result);
        
        // 6. 统计不合格品数量
        int nonconformingCount = countNonconformingItems(record);
        record.setQuantityNonconforming(nonconformingCount);
        record.setNonconformingRate(calculateNonconformingRate(record));
        
        // 7. 保存检验记录
        record = iqcInspectionRecordRepository.save(record);
        
        // 8. 记录不合格品信息
        if (nonconformingCount > 0) {
            createNonconformingRecords(record, nonconformingCount);
        }
        
        // 9. 发送检验完成通知
        sendInspectionCompletedNotification(record);
        
        log.info("IQC检验执行完成,检验批号: {}, 结果: {}", 
            record.getInspectionLotNumber(), result);
        
        return convertToResultDTO(record);
    }
    
    /**
     * 检验结果判定
     */
    private InspectionResult determineInspectionResult(IQCInspectionRecord record) {
        // 1. 查询所有检验项目
        List<IQCInspectionItem> items = iqcInspectionItemRepository.findByInspectionId(record.getInspectionId());
        
        // 2. 统计各结果数量
        long acceptCount = items.stream()
            .filter(i -> ItemResult.ACCEPT == i.getItemResult())
            .count();
        
        long rejectCount = items.stream()
            .filter(i -> ItemResult.REJECT == i.getItemResult())
            .count();
        
        long conditionalAcceptCount = items.stream()
            .filter(i -> ItemResult.CONDITIONAL_ACCEPT == i.getItemResult())
            .count();
        
        // 3. 计算抽样判定
        double rejectRate = (double) rejectCount / items.size();
        double conditionalRate = (double) conditionalAcceptCount / items.size();
        
        // 4. 使用抽样标准进行判定
        SamplingStandard standard = record.getSamplingStandard();
        String aqlValue = record.getAqlValue();
        
        if (standard == SamplingStandard.MIL_STD_105E) {
            return determineByMILStd105E(record, rejectCount, conditionalAcceptCount);
        } else if (standard == SamplingStandard.ISO_2859_1) {
            return determineByISO28591(record, rejectCount, conditionalAcceptCount);
        } else {
            return determineByGBT28281(record, rejectCount, conditionalAcceptCount);
        }
    }
    
    /**
     * MIL-STD-105E抽样判定
     */
    private InspectionResult determineByMILStd105E(IQCInspectionRecord record, 
                                                  int rejectCount, int conditionalCount) {
        // 1. 根据样本量和AQL查询抽样表
        SamplingTable samplingTable = samplingService.getSamplingTable(
            SamplingStandard.MIL_STD_105E,
            record.getInspectionLevel(),
            record.getSampleSize(),
            record.getAqlValue()
        );
        
        // 2. 获取判定界限
        int acceptNumber = samplingTable.getAcceptNumber();
        int rejectNumber = samplingTable.getRejectNumber();
        int conditionalNumber = samplingTable.getConditionalNumber();
        
        // 3. 判定规则
        if (rejectCount >= rejectNumber) {
            return InspectionResult.REJECT;
        } else if (rejectCount <= acceptNumber) {
            return InspectionResult.ACCEPT;
        } else if (conditionalCount <= conditionalNumber) {
            return InspectionResult.ACCEPT;
        } else {
            return InspectionResult.REJECT;
        }
    }
    
    /**
     * 计算不合格率
     */
    private Double calculateNonconformingRate(IQCInspectionRecord record) {
        if (record.getInspectedQuantity() == 0) {
            return 0.0;
        }
        return (double) record.getQuantityNonconforming() / record.getInspectedQuantity() * 100;
    }
    
    /**
     * 创建不合格品记录
     */
    private void createNonconformingRecords(IQCInspectionRecord record, int count) {
        List<IQCNonconformingRecord> nonconformingRecords = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            IQCNonconformingRecord nonconforming = new IQCNonconformingRecord();
            nonconforming.setIqcId(record.getInspectionId());
            nonconforming.setLotNumber(record.getInspectionLotNumber());
            nonconforming.setBatchNumber(record.getBatchNumber());
            nonconforming.setMaterialCode(record.getMaterialCode());
            nonconforming.setSupplierName(record.getSupplierName());
            nonconforming.setQuantity(1);
            nonconforming.setNonconformingType("IQC不合格");
            nonconforming.setStatus("待处理");
            nonconforming.setCreatedTime(LocalDateTime.now());
            
            nonconformingRecords.add(nonconforming);
        }
        
        iqcNonconformingRecordRepository.saveAll(nonconformingRecords);
    }
}
```

### 2.4 抽样算法服务

```java
/**
 * 抽样算法服务
 */
@Service
@Slf4j
public class SamplingServiceImpl implements SamplingService {
    
    // MIL-STD-105E抽样表
    private static final Map<String, SamplingTable> MIL_STD_105E_TABLES = Map.of(
        "NORMAL", loadMILStd105ENormalTable(),
        "TIGHTENED", loadMILStd105ETightenedTable(),
        "RELAXED", loadMILStd105ERelaxedTable()
    );
    
    // ISO 2859-1抽样表
    private static final Map<String, SamplingTable> ISO_2859_1_TABLES = Map.of(
        "GENERAL", loadISO28591GeneralTable(),
        "SPECIAL", loadISO28591SpecialTable()
    );
    
    /**
     * 计算样本量
     */
    @Override
    public int calculateSampleSize(SamplingStandard standard, String inspectionLevel, int lotSize) {
        log.info("计算样本量,标准: {}, 等级: {}, 批量: {}", standard, inspectionLevel, lotSize);
        
        switch (standard) {
            case MIL_STD_105E:
                return calculateMILStd105ESampleSize(inspectionLevel, lotSize);
            case ISO_2859_1:
                return calculateISO28591SampleSize(inspectionLevel, lotSize);
            case GB_T_2828_1:
                return calculateGBT28281SampleSize(inspectionLevel, lotSize);
            default:
                return calculateDefaultSampleSize(lotSize);
        }
    }
    
    /**
     * MIL-STD-105E样本量计算
     */
    private int calculateMILStd105ESampleSize(String inspectionLevel, int lotSize) {
        // 查找样本量码
        String codeLetter = findSampleSizeCode(inspectionLevel, lotSize);
        
        // 根据样本量码查找样本量
        return findSampleSizeByCode(codeLetter);
    }
    
    /**
     * 查找样本量码
     */
    private String findSampleSizeCode(String inspectionLevel, int lotSize) {
        // MIL-STD-105E样本量码表
        Map<Integer, String> codeMap = Map.ofEntries(
            Map.entry(2, "A"), Map.entry(8, "B"), Map.entry(15, "C"),
            Map.entry(25, "D"), Map.entry(50, "E"), Map.entry(90, "F"),
            Map.entry(150, "G"), Map.entry(280, "H"), Map.entry(500, "J"),
            Map.entry(1200, "K"), Map.entry(3200, "L"), Map.entry(10000, "M")
        );
        
        // 找到小于等于批量的最大码
        return codeMap.entrySet().stream()
            .filter(entry -> lotSize <= entry.getKey())
            .findFirst()
            .orElse(Map.entry(Integer.MAX_VALUE, "N"))
            .getValue();
    }
    
    /**
     * 根据样本量码查找样本量
     */
    private int findSampleSizeByCode(String code) {
        // 样本量码对应的样本量
        Map<String, Integer> sampleSizeMap = Map.of(
            "A", 2, "B", 3, "C", 5, "D", 8, "E", 13,
            "F", 20, "G", 32, "H", 50, "J", 80, "K", 125,
            "L", 200, "M", 315, "N", 500
        );
        
        return sampleSizeMap.getOrDefault(code, 2);
    }
    
    /**
     * 抽样方案动态调整
     */
    @Override
    public SamplingPlan adjustSamplingPlan(SamplingPlan currentPlan, SamplingAdjustment adjustment) {
        log.info("调整抽样方案,当前: {}, 调整类型: {}", 
            currentPlan.getInspectionLevel(), adjustment.getType());
        
        SamplingPlan adjustedPlan = new SamplingPlan(currentPlan);
        
        switch (adjustment.getType()) {
            case FROM_NORMAL_TO_TIGHTENED:
                adjustedPlan.setInspectionLevel("TIGHTENED");
                adjustedPlan.setSampleSize((int) (adjustedPlan.getSampleSize() * 1.25));
                break;
                
            case FROM_NORMAL_TO_RELAXED:
                adjustedPlan.setInspectionLevel("RELAXED");
                adjustedPlan.setSampleSize((int) (adjustedPlan.getSampleSize() * 0.8));
                break;
                
            case FROM_TIGHTENED_TO_NORMAL:
                adjustedPlan.setInspectionLevel("NORMAL");
                adjustedPlan.setSampleSize((int) (adjustedPlan.getSampleSize() / 1.25));
                break;
                
            case FROM_RELAXED_TO_NORMAL:
                adjustedPlan.setInspectionLevel("NORMAL");
                adjustedPlan.setSampleSize((int) (adjustedPlan.getSampleSize() / 0.8));
                break;
        }
        
        log.info("抽样方案调整完成,新样本量: {}, 新等级: {}", 
            adjustedPlan.getSampleSize(), adjustedPlan.getInspectionLevel());
        
        return adjustedPlan;
    }
    
    /**
     * 获取抽样表
     */
    @Override
    public SamplingTable getSamplingTable(SamplingStandard standard, String inspectionLevel, 
                                        int sampleSize, String aqlValue) {
        switch (standard) {
            case MIL_STD_105E:
                return MIL_STD_105E_TABLES.get(inspectionLevel)
                    .getBySampleSizeAndAQL(sampleSize, aqlValue);
            case ISO_2859_1:
                return ISO_2859_1_TABLES.get("GENERAL")
                    .getBySampleSizeAndAQL(sampleSize, aqlValue);
            case GB_T_2828_1:
                return getGBT28281Table()
                    .getBySampleSizeAndAQL(sampleSize, aqlValue);
            default:
                return new SamplingTable();
        }
    }
    
    /**
     * 根据历史检验数据自动调整抽样方案
     */
    @Override
    public SamplingPlan autoAdjustBasedOnHistory(Material material, int consecutiveBatches) {
        log.info("基于历史数据自动调整抽样方案,物料: {}, 连续批次: {}", 
            material.getMaterialCode(), consecutiveBatches);
        
        // 1. 查询最近5批次的IQC结果
        List<IQCInspectionRecord> recentRecords = iqcInspectionRecordRepository
            .findByMaterialIdOrderByInspectionDateDesc(
                material.getMaterialId(), 
                LocalDate.now().minusMonths(1)
            )
            .stream()
            .limit(5)
            .collect(Collectors.toList());
        
        if (recentRecords.isEmpty()) {
            return getDefaultSamplingPlan(material);
        }
        
        // 2. 计算最近批次的不合格率
        double avgNonconformingRate = recentRecords.stream()
            .mapToDouble(IQCInspectionRecord::getNonconformingRate)
            .average()
            .orElse(0.0);
        
        // 3. 判断是否需要调整
        SamplingPlan currentPlan = getDefaultSamplingPlan(material);
        SamplingAdjustment adjustment = determineAdjustment(
            currentPlan, avgNonconformingRate, consecutiveBatches
        );
        
        if (adjustment != null) {
            return adjustSamplingPlan(currentPlan, adjustment);
        }
        
        return currentPlan;
    }
    
    /**
     * 判断抽样调整
     */
    private SamplingAdjustment determineAdjustment(SamplingPlan currentPlan, 
                                                  double nonconformingRate, 
                                                  int consecutiveBatches) {
        // 连续5批次不合格率低于0.65%,考虑放宽
        if (nonconformingRate < 0.65 && 
            consecutiveBatches >= 5 && 
            "NORMAL".equals(currentPlan.getInspectionLevel())) {
            return SamplingAdjustment.fromNormalToRelaxed();
        }
        
        // 连续5批次不合格率超过2.5%,考虑加严
        if (nonconformingRate > 2.5 && 
            consecutiveBatches >= 5 && 
            "NORMAL".equals(currentPlan.getInspectionLevel())) {
            return SamplingAdjustment.fromNormalToTightened();
        }
        
        // 连续20批次不合格率低于0.1%,放宽到严格
        if (nonconformingRate < 0.1 && 
            consecutiveBatches >= 20 && 
            "TIGHTENED".equals(currentPlan.getInspectionLevel())) {
            return SamplingAdjustment.fromTightenedToNormal();
        }
        
        // 连续10批次不合格率超过4%,放宽到严格
        if (nonconformingRate > 4 && 
            consecutiveBatches >= 10 && 
            "RELAXED".equals(currentPlan.getInspectionLevel())) {
            return SamplingAdjustment.fromRelaxedToNormal();
        }
        
        return null;
    }
}
```

---

## 3. IPQC制程检验模块详细实现

### 3.1 IPQC检验流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         IPQC检验流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ 工单创建  │───▶│ SPC监控  │───▶│ 参数监控  │                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                  │          │                                 │
│                  ▼          ▼                                 │
│           ┌──────────┐ ┌──────────┐                            │
│           │ 首件检验  │ │ 过程检验  │                            │
│           └─────────┘ └─────────┘                            │
│                  │          │                                 │
│                  ▼          ▼                                 │
│           ┌──────────┐ ┌──────────┐                            │
│           │ 过程参数  │ │ 质量参数  │                            │
│           │ 控制     │ │ 监控     │                            │
│           └─────────┘ └─────────┘                            │
│                  │          │                                 │
│                  └──────────┼───────────┐                      │
│                           ▼            ▼                      │
│                    ┌──────────┐ ┌──────────┐                  │
│                    │ 数据收集  │ │ 结果判定  │                  │
│                    └──────────┘ └──────────┘                  │
│                                │                              │
│                                ▼                              │
│                         ┌──────────┐                          │
│                         │ 过程改进  │                          │
│                         └──────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 IPQC SPC监控服务

```java
/**
 * IPQC SPC监控服务
 */
@Service
@Slf4j
public class IPCSPCMonitoringServiceImpl implements IPCSPCMonitoringService {
    
    @Autowired
    private spcControlPointRepository spcControlPointRepository;
    
    @Autowired
    private SPCAlertService spcAlertService;
    
    @Autowired
    private ProductionProductionMonitoringService productionMonitoringService;
    
    /**
     * 实时SPC监控
     */
    @Scheduled(fixedDelay = 5000) // 5秒监控一次
    public void monitorSPCPoints() {
        log.debug("开始IPQC SPC实时监控");
        
        // 1. 查询当前生产中的SPC控制点
        List<SPCControlPoint> activePoints = spcControlPointRepository
            .findActiveProductionSPCPoints();
        
        // 2. 监控每个控制点
        for (SPCControlPoint point : activePoints) {
            monitorSPCPoint(point);
        }
        
        log.debug("IPQC SPC监控完成,监控点数量: {}", activePoints.size());
    }
    
    /**
     * 监控单个SPC控制点
     */
    private void monitorSPCPoint(SPCControlPoint point) {
        try {
            // 1. 获取最新测量值
            Double latestValue = getLatestSPCValue(point);
            
            if (latestValue == null) {
                return; // 暂无数据
            }
            
            // 2. 存储SPC数据
            storeSPCData(point, latestValue);
            
            // 3. 检测异常
            if (detectSPCAnomaly(point, latestValue)) {
                // 触发SPC异常告警
                spcAlertService.triggerSPCAnomalyAlert(point, latestValue);
            }
            
            // 4. 更新控制图
            updateControlChart(point, latestValue);
            
        } catch (Exception e) {
            log.error("SPC监控异常,控制点ID: {}", point.getControlPointId(), e);
        }
    }
    
    /**
     * SPC异常检测
     */
    private boolean detectSPCAnomaly(SPCControlPoint point, Double value) {
        List<SPCControlPoint> recentPoints = spcControlPointRepository
            .findRecentSPCPoints(point.getCharacteristicId(), 20);
        
        if (recentPoints.size() < 10) {
            return false; // 数据不足
        }
        
        // 1. 超出控制限
        if (isBeyondControlLimits(point, value)) {
            return true;
        }
        
        // 2. 连续异常模式
        if (hasPatternViolation(recentPoints, value)) {
            return true;
        }
        
        // 3. 趋势检测
        if (hasTrendViolation(recentPoints)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 趋势检测
     */
    private boolean hasTrendViolation(List<SPCControlPoint> points) {
        if (points.size() < 8) {
            return false;
        }
        
        // 1. 连续6点递增或递减
        if (hasConsecutiveTrend(points, 6)) {
            return true;
        }
        
        // 2. 14点交替上下
        if (hasAlternatingPattern(points, 14)) {
            return true;
        }
        
        // 3. 连续7点在中心线同一侧
        if (hasConsecutiveSide(points, 7)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 趋势分析
     */
    private TrendAnalysis analyzeTrend(List<SPCControlPoint> points) {
        TrendAnalysis analysis = new TrendAnalysis();
        
        if (points.size() < 10) {
            return analysis;
        }
        
        // 1. 计算线性趋势
        LinearTrend linearTrend = calculateLinearTrend(points);
        analysis.setLinearTrend(linearTrend);
        
        // 2. 计算CUSUM累积和控制
        CUSUMAnalysis cusum = calculateCUSUM(points);
        analysis.setCusumAnalysis(cusum);
        
        // 3. 计算移动极差
        MovingRangeAnalysis mrAnalysis = calculateMovingRange(points);
        analysis.setMovingRangeAnalysis(mrAnalysis);
        
        return analysis;
    }
    
    /**
     * 线性趋势分析
     */
    private LinearTrend calculateLinearTrend(List<SPCControlPoint> points) {
        double n = points.size();
        double sumX = 0;
        double sumY = 0;
        double sumXY = 0;
        double sumXX = 0;
        
        for (int i = 0; i < n; i++) {
            double x = i + 1;
            double y = points.get(i).getMeasurementValue();
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        
        // 计算斜率
        double slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        // 计算截距
        double intercept = (sumY - slope * sumX) / n;
        
        // 计算相关系数
        double correlation = calculateCorrelation(points, slope, intercept);
        
        LinearTrend trend = new LinearTrend();
        trend.setSlope(slope);
        trend.setIntercept(intercept);
        trend.setCorrelation(correlation);
        trend.setTrendType(determineTrendType(slope));
        
        return trend;
    }
    
    /**
     * CUSUM累积和控制图分析
     */
    private CUSUMAnalysis calculateCUSUM(List<SPCControlPoint> points) {
        CUSUMAnalysis cusum = new CUSUMAnalysis();
        
        // 计算样本均值
        double targetMean = calculateSampleMean(points);
        
        // 计算过程标准差
        double processStdDev = calculateProcessStdDev(points);
        
        // 计算CUSUM值
        List<Double> cusumValues = new ArrayList<>();
        double sum = 0;
        
        for (int i = 0; i < points.size(); i++) {
            double value = points.get(i).getMeasurementValue();
            sum += (value - targetMean);
            cusumValues.add(sum);
        }
        
        cusum.setTargetMean(targetMean);
        cusum.setProcessStdDev(processStdDev);
        cusum.setCusumValues(cusumValues);
        
        // 检测CUSUM报警
        cusum.setAlarmDetected(hasCUSUMAlarm(cusumValues, processStdDev));
        
        return cusum;
    }
    
    /**
     * 移动极差分析
     */
    private MovingRangeAnalysis calculateMovingRange(List<SPCControlPoint> points) {
        MovingRangeAnalysis mrAnalysis = new MovingRangeAnalysis();
        
        List<Double> movingRanges = new ArrayList<>();
        
        for (int i = 1; i < points.size(); i++) {
            double range = Math.abs(points.get(i).getMeasurementValue() - 
                                   points.get(i - 1).getMeasurementValue());
            movingRanges.add(range);
        }
        
        mrAnalysis.setMovingRanges(movingRanges);
        mrAnalysis.setAverageRange(calculateAverage(movingRanges));
        mrAnalysis.setRangeStdDev(calculateMovingRangeStdDev(movingRanges));
        
        return mrAnalysis;
    }
    
    /**
     * Xbar-R控制图分析
     */
    @Override
    public XbarRControlChart analyzeXbarRControlChart(List<SPCControlPoint> points) {
        XbarRControlChart chart = new XbarRControlChart();
        
        if (points.isEmpty()) {
            return chart;
        }
        
        // 1. 分组数据 (假设样本数为4)
        int subgroupSize = 4;
        List<Double> subgroupAverages = new ArrayList<>();
        List<Double> subgroupRanges = new ArrayList<>();
        
        for (int i = 0; i < points.size(); i += subgroupSize) {
            List<SPCControlPoint> subgroup = points.subList(
                i, Math.min(i + subgroupSize, points.size())
            );
            
            double subgroupAverage = subgroup.stream()
                .mapToDouble(SPCControlPoint::getMeasurementValue)
                .average()
                .orElse(0.0);
            
            double subgroupRange = calculateSubgroupRange(subgroup);
            
            subgroupAverages.add(subgroupAverage);
            subgroupRanges.add(subgroupRange);
        }
        
        // 2. 计算控制限
        double grandAverage = calculateAverage(subgroupAverages);
        double averageRange = calculateAverage(subgroupRanges);
        
        double a2 = getA2Factor(subgroupSize);
        double d3 = getD3Factor(subgroupSize);
        double d4 = getD4Factor(subgroupSize);
        
        // Xbar控制限
        chart.setXbarGrandAverage(grandAverage);
        chart.setXbarUcl(grandAverage + a2 * averageRange);
        chart.setXbarLcl(grandAverage - a2 * averageRange);
        
        // R控制限
        chart.setRangeAverage(averageRange);
        chart.setRangeUcl(d4 * averageRange);
        chart.setRangeLcl(d3 * averageRange);
        
        // 3. 分析数据点
        analyzeControlChartData(chart, subgroupAverages, subgroupRanges);
        
        return chart;
    }
    
    /**
     * 控制数据点分析
     */
    private void analyzeControlChartData(XbarRControlChart chart, 
                                        List<Double> xbarValues, 
                                        List<Double> rValues) {
        List<ControlPointAnalysis> xbarAnalyses = new ArrayList<>();
        List<ControlPointAnalysis> rAnalyses = new ArrayList<>();
        
        // 分析Xbar数据点
        for (int i = 0; i < xbarValues.size(); i++) {
            ControlPointAnalysis analysis = analyzeControlPoint(
                xbarValues.get(i), 
                chart.getXbarLcl(), 
                chart.getXbarUcl()
            );
            analysis.setDataPointIndex(i);
            analysis.setChartType("XBAR");
            xbarAnalyses.add(analysis);
        }
        
        // 分析R数据点
        for (int i = 0; i < rValues.size(); i++) {
            ControlPointAnalysis analysis = analyzeControlPoint(
                rValues.get(i), 
                chart.getRangeLcl(), 
                chart.getRangeUcl()
            );
            analysis.setDataPointIndex(i);
            analysis.setChartType("R");
            rAnalyses.add(analysis);
        }
        
        chart.setXbarPointAnalyses(xbarAnalyses);
        chart.setRangePointAnalyses(rAnalyses);
        
        // 总结分析
        chart.setOverallAnalysis(generateOverallAnalysis(xbarAnalyses, rAnalyses));
    }
    
    /**
     * 生成总体分析
     */
    private ControlChartOverallAnalysis generateOverallAnalysis(
        List<ControlPointAnalysis> xbarAnalyses, 
        List<ControlPointAnalysis> rAnalyses) {
        
        ControlChartOverallAnalysis analysis = new ControlChartOverallAnalysis();
        
        // 统计异常点
        long xbarAbnormalCount = xbarAnalyses.stream()
            .filter(ControlPointAnalysis::isAbnormal)
            .count();
        
        long rAbnormalCount = rAnalyses.stream()
            .filter(ControlPointAnalysis::isAbnormal)
            .count();
        
        analysis.setTotalPoints(xbarAnalyses.size());
        analysis.setXbarAbnormalCount(xbarAbnormalCount);
        analysis.setRangeAbnormalCount(rAbnormalCount);
        analysis.setTotalAbnormalCount(xbarAbnormalCount + rAbnormalCount);
        
        // 判断过程能力
        analysis.setProcessCapability(determineProcessCapability(
            xbarAbnormalCount + rAbnormalCount, 
            xbarAnalyses.size() + rAnalyses.size()
        ));
        
        return analysis;
    }
    
    /**
     * 判断过程能力
     */
    private ProcessCapability determineProcessCapability(long abnormalCount, long totalPoints) {
        if (totalPoints == 0) {
            return ProcessCapability.INSUFFICIENT_DATA;
        }
        
        double abnormalRate = (double) abnormalCount / totalPoints;
        
        if (abnormalRate == 0) {
            return ProcessCapability.EXCELLENT;
        } else if (abnormalRate <= 0.01) {
            return ProcessCapability.GOOD;
        } else if (abnormalRate <= 0.05) {
            return ProcessCapability.ADEQUATE;
        } else {
            return ProcessCapability.POOR;
        }
    }
}
```

---

## 4. FQC/OQC出厂检验模块详细实现

### 4.1 FQC/OQC检验流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      FQC/OQC检验流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ 生产完成  │───▶│ 检验准备  │───▶│ 成品抽样  │                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                               │                                │
│                  ┌────────────┴────────────┐                   │
│                  ▼                         ▼                   │
│           ┌──────────┐              ┌──────────┐               │
│           │ 外观检验  │              │ 功能测试  │               │
│           └──────────┘              └──────────┘               │
│                  │                        │                │
│           ┌──────┴──────┐               ┌─┴────┐            │
│           ▼              ▼               ▼      ▼             │
│  ┌──────────┐  ┌──────────┐     ┌──────────┐ ┌──────────┐      │
│  │ 性能测试  │  │ 包装检验  │     │ 安全测试  │ │ 认证检查  │      │
│  └──────────┘  └──────────┘     └──────────┘ └──────────┘      │
│                  │                        │                │
│           ┌──────┴──────┐               ┌─┴────┐            │
│           ▼              ▼               ▼      ▼             │
│  ┌──────────┐  ┌──────────┐     ┌──────────┐ ┌──────────┐      │
│  │ 记录数据  │  │ 结果判定  │     │ 出厂批准  │ │ 质量追溯  │      │
│  └──────────┘  └──────────┘     └──────────┘ └──────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 FQC/OQC检验服务

```java
/**
 * FQC/OQC检验服务
 */
@Service
@Slf4j
public class FQCInspectionServiceImpl implements FQCInspectionService {
    
    @Autowired
    private FQCInspectionRecordRepository fqcInspectionRecordRepository;
    
    @Autowired
    private FinishedGoodsRepository finishedGoodsRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private SamplingService samplingService;
    
    /**
     * 创建FQC检验计划
     */
    @Override
    public FQCInspectionDTO createInspection(FQCCreateDTO dto) {
        log.info("创建FQC检验,产品: {}, 批次: {}", dto.getProductId(), dto.getBatchNumber());
        
        // 1. 验证生产信息
        FinishedGoods finishedGoods = getFinishedGoodsByBatch(dto.getBatchNumber());
        
        // 2. 确定检验标准
        InspectionStandard standard = determineInspectionStandard(finishedGoods, dto);
        
        // 3. 计算抽样方案
        SamplingPlan samplingPlan = calculateSamplingPlan(finishedGoods, standard);
        
        // 4. 创建检验记录
        FQCInspectionRecord record = createInspectionRecord(
            finishedGoods, dto, standard, samplingPlan
        );
        
        // 5. 创建检验项目
        createInspectionItems(record, finishedGoods);
        
        // 6. 保存记录
        record = fqcInspectionRecordRepository.save(record);
        
        log.info("FQC检验计划创建成功,检验ID: {}", record.getInspectionId());
        
        return convertToDTO(record);
    }
    
    /**
     * 确定检验标准
     */
    private InspectionStandard determineInspectionStandard(FinishedGoods finishedGoods, FQCCreateDTO dto) {
        // 1. 优先使用物料指定的检验标准
        if (finishedGoods.getInspectionStandard() != null) {
            return finishedGoods.getInspectionStandard();
        }
        
        // 2. 根据客户要求确定
        Customer customer = customerRepository.findById(finishedGoods.getCustomerId()).orElse(null);
        if (customer != null && customer.getInspectionStandard() != null) {
            return customer.getInspectionStandard();
        }
        
        // 3. 默认标准
        return InspectionStandard.MIL_STD_105E;
    }
    
    /**
     * 计算FQC抽样方案
     */
    private SamplingPlan calculateSamplingPlan(FinishedGoods finishedGoods, InspectionStandard standard) {
        SamplingPlan plan = new SamplingPlan();
        plan.setSamplingStandard(standard);
        
        // FQC通常使用常规检验等级
        plan.setInspectionLevel("NORMAL");
        
        // 根据产品类型确定AQL
        if ("CRITICAL".equals(finishedGoods.getQualityLevel())) {
            plan.setAqlValue("0.65"); // 关键件0.65
        } else if ("IMPORTANT".equals(finishedGoods.getQualityLevel())) {
            plan.setAqlValue("1.5"); // 重要件1.5
        } else {
            plan.setAqlValue("2.5"); // 一般件2.5
        }
        
        // 批量为生产数量
        int lotSize = finishedGoods.getProductionQuantity();
        plan.setLotSize(lotSize);
        
        // 计算样本量
        int sampleSize = samplingService.calculateSampleSize(
            standard, plan.getInspectionLevel(), lotSize
        );
        plan.setSampleSize(sampleSize);
        
        return plan;
    }
    
    /**
     * 执行FQC检验
     */
    @Override
    public FQCInspectionResultDTO executeInspection(Long inspectionId, FQCExecuteDTO dto) {
        log.info("执行FQC检验,检验ID: {}", inspectionId);
        
        // 1. 查询检验记录
        FQCInspectionRecord record = getInspectionById(inspectionId);
        
        // 2. 执行检验
        executeFQCInspection(record, dto);
        
        // 3. 检验结果判定
        InspectionResult result = determineFQCResult(record);
        record.setInspectionResult(result);
        
        // 4. 更新记录
        record = fqcInspectionRecordRepository.save(record);
        
        // 5. 处理检验结果
        handleInspectionResult(record);
        
        log.info("FQC检验执行完成,检验ID: {}, 结果: {}", 
            inspectionId, result);
        
        return convertToResultDTO(record);
    }
    
    /**
     * FQC检验判定
     */
    private InspectionResult determineFQCResult(FQCInspectionRecord record) {
        List<FQCInspectionItem> items = fqcInspectionItemRepository.findByInspectionId(record.getInspectionId());
        
        // 统计检验结果
        long acceptCount = items.stream()
            .filter(i -> ItemResult.ACCEPT == i.getItemResult())
            .count();
        
        long rejectCount = items.stream()
            .filter(i -> ItemResult.REJECT == i.getItemResult())
            .count();
        
        long conditionalAcceptCount = items.stream()
            .filter(i -> ItemResult.CONDITIONAL_ACCEPT == i.getItemResult())
            .count();
        
        // 根据抽样标准判定
        return determineBySamplingStandard(record, rejectCount, conditionalAcceptCount);
    }
    
    /**
     * OQC出厂检验
     */
    @Override
    public OQCInspectionResultDTO performOQCInspection(Long productId, OQCExecuteDTO dto) {
        log.info("执行OQC出厂检验,产品ID: {}", productId);
        
        // 1. 验证产品信息
        Product product = getProductById(productId);
        
        // 2. 创建OQC检验记录
        OQCInspectionRecord record = createOQCRecord(product, dto);
        
        // 3. 执行OQC检验项目
        executeOQCInspectionItems(record, dto.getItems());
        
        // 4. OQC结果判定
        InspectionResult result = determineOQCResult(record);
        record.setInspectionResult(result);
        
        // 5. 出厂批准
        if (InspectionResult.ACCEPT == result) {
            approveForShipping(record);
        }
        
        // 6. 保存记录
        oqcInspectionRecordRepository.save(record);
        
        log.info("OQC出厂检验完成,产品ID: {}, 结果: {}", productId, result);
        
        return convertOQCToResultDTO(record);
    }
    
    /**
     * 出厂批准
     */
    private void approveForShipping(OQCInspectionRecord record) {
        log.info("产品出厂批准,批号: {}", record.getBatchNumber());
        
        // 1. 生成产品证书
        generateProductCertificate(record);
        
        // 2. 更新产品状态
        updateProductStatus(record);
        
        // 3. 记录追溯信息
        recordTraceabilityInformation(record);
        
        // 4. 发送通知
        sendOQCApprovedNotification(record);
    }
    
    /**
     * 生成产品证书
     */
    private void generateProductCertificate(OQCInspectionRecord record) {
        ProductCertificate certificate = new ProductCertificate();
        certificate.setCertificateId(generateCertificateNumber());
        certificate.setBatchNumber(record.getBatchNumber());
        certificate.setProductId(record.getProductId());
        certificate.setProductName(record.getProductName());
        certificate.setInspectionDate(record.getInspectionDate());
        certificate.setInspectorId(record.getInspectorId());
        certificate.setCertificateType("CONFORMANCE_CERTIFICATE");
        certificate.setIssueDate(LocalDate.now());
        certificate.setValidUntil(LocalDate.now().plusYears(1));
        certificate.setStatus("VALID");
        
        productCertificateRepository.save(certificate);
        
        record.setCertificateId(certificate.getCertificateId());
    }
}
```

---

## 5. 质量检验模块集成与扩展

### 5.1 自动化检测设备集成

```java
/**
 * 自动化检测设备集成服务
 */
@Service
@Slf4j
public class AutoInspectionDeviceIntegrationServiceImpl implements AutoInspectionDeviceIntegrationService {
    
    @Autowired
    private EquipmentManagementService equipmentService;
    
    @Autowired
    private InspectionResultService inspectionResultService;
    
    /**
     * 集成自动检测设备
     */
    @Override
    public void integrateWithDevice(String deviceType, String deviceId, AutoInspectionDTO dto) {
        log.info("集成自动检测设备,设备类型: {}, 设备ID: {}", deviceType, deviceId);
        
        try {
            // 1. 验证设备连接
            validateDeviceConnection(deviceId);
            
            // 2. 处理检测数据
            processInspectionData(deviceId, dto);
            
            // 3. 更新检验记录
            updateInspectionRecord(dto);
            
            // 4. 发送通知
            sendAutoInspectionNotification(dto);
            
        } catch (Exception e) {
            log.error("自动检测设备集成异常,设备ID: {}", deviceId, e);
            sendDeviceErrorAlert(deviceId, e.getMessage());
        }
    }
    
    /**
     * 自动视觉检测数据处理
     */
    private void processVisualInspectionData(String deviceId, AutoInspectionDTO dto) {
        // 1. 解析图像数据
        BufferedImage image = parseImageData(dto.getImageData());
        
        // 2. 图像预处理
        BufferedImage processedImage = preprocessImage(image);
        
        // 3. 缺陷检测
        List<DefectDetection> defects = detectDefects(processedImage);
        
        // 4. 缺陷分类
        classifyDefects(defects);
        
        // 5. 生成检验结果
        generateAutoInspectionResults(deviceId, dto, defects);
    }
    
    /**
     * 自动测量数据处理
     */
    private void processMeasurementData(String deviceId, AutoInspectionDTO dto) {
        // 1. 解析测量数据
        MeasurementData measurementData = parseMeasurementData(dto.getMeasurementData());
        
        // 2. 数据处理
        MeasurementResult result = processMeasurement(measurementData);
        
        // 3. 结果判定
        MeasurementDecision decision = judgeMeasurementResult(result);
        
        // 4. 记录检验结果
        recordAutoMeasurementResult(deviceId, dto, decision);
    }
}
```

### 5.2 智能质量预测

```java
/**
 * 智能质量预测服务
 */
@Service
@Slf4j
public class IntelligentQualityPredictionServiceImpl implements IntelligentQualityPredictionService {
    
    @Autowired
    private MachineLearningService mlService;
    
    @Autowired
    private QualityRiskService qualityRiskService;
    
    /**
     * 质量风险预测
     */
    @Override
    public QualityRiskPrediction predictQualityRisk(QualityPredictionInputDTO input) {
        log.info("预测质量风险,产品: {}, 批次: {}", input.getProductId(), input.getBatchNumber());
        
        QualityRiskPrediction prediction = new QualityRiskPrediction();
        
        // 1. 基于历史数据预测
        double historicalRisk = predictByHistoricalData(input);
        prediction.setHistoricalRisk(historicalRisk);
        
        // 2. 基于工艺参数预测
        double processRisk = predictByProcessParameters(input);
        prediction.setProcessRisk(processRisk);
        
        // 3. 基于设备状态预测
        double equipmentRisk = predictByEquipmentCondition(input);
        prediction.setEquipmentRisk(equipmentRisk);
        
        // 4. 基于原材料预测
        double materialRisk = predictByMaterialQuality(input);
        prediction.setMaterialRisk(materialRisk);
        
        // 5. 综合风险计算
        double overallRisk = calculateOverallRisk(prediction);
        prediction.setOverallRisk(overallRisk);
        
        // 6. 风险等级判定
        prediction.setRiskLevel(determineRiskLevel(overallRisk));
        
        // 7. 生成建议措施
        prediction.setRecommendations(generateRecommendations(prediction));
        
        return prediction;
    }
    
    /**
     * 基于机器学习的质量预测
     */
    private double predictByMachineLearning(QualityPredictionInputDTO input) {
        // 1. 特征工程
        List<Double> features = extractFeatures(input);
        
        // 2. 模型预测
        double prediction = mlService.predictQualityRisk(features);
        
        return prediction;
    }
    
    /**
     * 特征提取
     */
    private List<Double> extractFeatures(QualityPredictionInputDTO input) {
        List<Double> features = new ArrayList<>();
        
        // 1. 历史特征
        features.add(input.getHistoricalDefectRate());
        features.add(input.getHistoricalComplaintRate());
        
        // 2. 工艺特征
        features.add(input.getProcessTemperature());
        features.add(input.getProcessPressure());
        features.add(input.getProcessSpeed());
        
        // 3. 设备特征
        features.add(input.getEquipmentAge());
        features.add(input.getMaintenanceScore());
        
        // 4. 材料特征
        features.add(input.getMaterialQualityScore());
        features.add(input.getSupplierScore());
        
        // 5. 人员特征
        features.add(input.getOperatorExperience());
        features.add(input.getTrainingScore());
        
        return features;
    }
    
    /**
     * 生成建议措施
     */
    private List<QualityRecommendation> generateRecommendations(QualityRiskPrediction prediction) {
        List<QualityRecommendation> recommendations = new ArrayList<>();
        
        // 1. 高风险预警
        if (prediction.getOverallRisk() > 70) {
            recommendations.add(createHighRiskRecommendation(prediction));
        }
        
        // 2. 中等风险建议
        if (prediction.getOverallRisk() > 40) {
            recommendations.add(createMediumRiskRecommendation(prediction));
        }
        
        // 3. 低风险提醒
        if (prediction.getOverallRisk() > 20) {
            recommendations.add(createLowRiskRecommendation(prediction));
        }
        
        return recommendations;
    }
}
```

---

## 总结

本详细实现规范为舜富QMS系统的质量检验模块提供了:

1. **IQC来料检验**: 完整的来料检验流程、抽样算法、检验判定机制
2. **IPQC制程检验**: 实时SPC监控、多种控制图分析、趋势检测、CUSUM控制
3. **FQC/OQC出厂检验**: 成品检验流程、出厂批准、产品证书生成、质量追溯
4. **自动化集成**: 自动检测设备集成、视觉检测、自动测量数据处理
5. **智能预测**: 基于机器学习的质量风险预测、历史数据分析、智能建议

所有实现采用微服务架构,支持实时监控、智能分析、自动化处理,为舜富压铸行业提供完整的质量管理解决方案。
