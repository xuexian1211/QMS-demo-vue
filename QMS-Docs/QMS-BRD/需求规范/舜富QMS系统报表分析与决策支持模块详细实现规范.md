# 舜富QMS系统 - 报表分析与决策支持模块详细实现

## 1. 报表分析模块总览

### 1.1 模块架构设计

```
┌─────────────────────────────────────────────────────────────┐
│               报表分析模块 - 微服务架构                       │
├─────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                业务分析层                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 质量分析     │ │ 过程分析     │ │ 成本分析     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                数据处理层                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 数据聚合     │ │ 统计分析     │ │ 趋势分析     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                报表生成层                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 图表生成     │ │ 报表模板     │ │ 数据导出     │       │  │
│  │  │Service      │ │Service      │ │Service      │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                数据存储层                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│  │  │ 关系型数据   │ │ 时序数据     │ │ 文档存储     │       │  │
│  │  │PostgreSQL  │ │InfluxDB     │ │MongoDB     │       │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 报表分类体系

```
┌─────────────────────────────────────────────────────────────────┐
│                        报表分类体系                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                   报表体系                              │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 质量报表  │ │ 过程报表  │ │ 成本报表  │ │ 管理报表  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│       │                │                    │                   │
│  ┌────┴────┐    ┌──────┴──────┐    ┌────────┴────────┐       │
│  │检验报告  │    │SPC报表     │    │质量成本        │       │
│  │审核报告  │    │过程能力    │    │不良品成本      │       │
│  │客户投诉  │    │设备可用性  │    │质量改进收益    │       │
│  │供应商评价│    │生产效率    │    │管理成本        │       │
│  └─────────┘    └──────────┬──┘    └──────────┬─────┘       │
│                          ↓                  ↓                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                   报表频率                              │     │
│  │ 实时报表: 分钟级响应 日报: 每日生成                     │     │
│  │ 周报: 每周生成 月报: 每月生成 年报: 每年生成             │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ↓                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │实时看板  │ │质量日报   │ │质量周报   │ │质量月报   │           │
│  │异常警报  │ │生产日报   │ │过程分析   │ │成本分析   │           │
│  │设备监控  │ │检验日报   │ │审核报告   │ │管理报告   │           │
│  │工艺参数  │ │成本日报   │ │改进追踪   │ │年度总结   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 质量分析报表详细实现

### 2.1 质量数据分析服务

```java
/**
 * 质量数据分析服务
 */
@Service
@Slf4j
public class QualityAnalysisServiceImpl implements QualityAnalysisService {
    
    @Autowired
    private IQCInspectionRecordRepository iqcInspectionRecordRepository;
    
    @Autowired
    private FQCInspectionRecordRepository fqcInspectionRecordRepository;
    
    @Autowired
    private CustomerComplaintRepository customerComplaintRepository;
    
    @Autowired
    private CAPARepository capaRepository;
    
    @Autowired
    private AnalysisService analysisService;
    
    /**
     * 生成质量日报
     */
    @Override
    public QualityDailyReportDTO generateDailyReport(LocalDate date) {
        log.info("生成质量日报,日期: {}", date);
        
        QualityDailyReportDTO report = new QualityDailyReportDTO();
        report.setReportDate(date);
        report.setReportType("DAILY");
        
        // 1. IQC数据分析
        IQCDailyStats iqcStats = analyzeIQCDailyStats(date);
        report.setIqcStats(iqcStats);
        
        // 2. FQC数据分析
        FQCDailyStats fqcStats = analyzeFQCDailyStats(date);
        report.setFqcStats(fqcStats);
        
        // 3. 不良品分析
        DefectDailyStats defectStats = analyzeDefectDailyStats(date);
        report.setDefectStats(defectStats);
        
        // 4. 客户投诉分析
        ComplaintDailyStats complaintStats = analyzeComplaintDailyStats(date);
        report.setComplaintStats(complaintStats);
        
        // 5. CAPA分析
        CAPADailyStats capaStats = analyzeCAPADailyStats(date);
        report.setCapaStats(capaStats);
        
        // 6. 质量趋势分析
        QualityTrendDTO trend = analyzeQualityTrend(date);
        report.setQualityTrend(trend);
        
        // 7. 质量预警
        List<QualityAlertDTO> alerts = generateQualityAlerts(date);
        report.setQualityAlerts(alerts);
        
        return report;
    }
    
    /**
     * IQC日统计
     */
    private IQCDailyStats analyzeIQCDailyStats(LocalDate date) {
        log.debug("分析IQC日统计,日期: {}", date);
        
        IQCDailyStats stats = new IQCDailyStats();
        
        // 1. 统计检验批次
        long totalBatches = iqcInspectionRecordRepository
            .countByInspectionDate(date);
        stats.setTotalBatches(totalBatches);
        
        // 2. 统计供应商数量
        long supplierCount = iqcInspectionRecordRepository
            .countDistinctSuppliersByInspectionDate(date);
        stats.setSupplierCount(supplierCount);
        
        // 3. 统计合格率
        double acceptanceRate = calculateIQCAcceptanceRate(date);
        stats.setAcceptanceRate(acceptanceRate);
        
        // 4. 统计批次合格率
        double batchAcceptanceRate = calculateBatchAcceptanceRate(date);
        stats.setBatchAcceptanceRate(batchAcceptanceRate);
        
        // 5. 不合格品统计
        NonconformingStats nonconformingStats = calculateNonconformingStats(date, "IQC");
        stats.setNonconformingStats(nonconformingStats);
        
        // 6. 主要缺陷分析
        List<MainDefectDTO> mainDefects = analyzeMainDefects(date, "IQC");
        stats.setMainDefects(mainDefects);
        
        return stats;
    }
    
    /**
     * IQC合格率计算
     */
    private double calculateIQCAcceptanceRate(LocalDate date) {
        // 查询当天的IQC检验记录
        List<IQCInspectionRecord> records = iqcInspectionRecordRepository
            .findByInspectionDate(date);
        
        if (records.isEmpty()) {
            return 100.0; // 无数据默认100%合格
        }
        
        long acceptedCount = records.stream()
            .filter(r -> InspectionResult.ACCEPT == r.getInspectionResult())
            .count();
        
        return (double) acceptedCount / records.size() * 100;
    }
    
    /**
     * 批次合格率计算
     */
    private double calculateBatchAcceptanceRate(LocalDate date) {
        // 查询当天所有批次
        List<String> batchNumbers = iqcInspectionRecordRepository
            .findDistinctBatchNumbersByInspectionDate(date);
        
        if (batchNumbers.isEmpty()) {
            return 100.0;
        }
        
        long acceptedBatches = batchNumbers.stream()
            .filter(batch -> isBatchAccepted(batch, date))
            .count();
        
        return (double) acceptedBatches / batchNumbers.size() * 100;
    }
    
    /**
     * 判断批次是否合格
     */
    private boolean isBatchAccepted(String batchNumber, LocalDate date) {
        List<IQCInspectionRecord> batchRecords = iqcInspectionRecordRepository
            .findByBatchNumberAndInspectionDate(batchNumber, date);
        
        return batchRecords.stream()
            .allMatch(r -> InspectionResult.ACCEPT == r.getInspectionResult());
    }
    
    /**
     * FQC日统计
     */
    private FQCDailyStats analyzeFQCDailyStats(LocalDate date) {
        log.debug("分析FQC日统计,日期: {}", date);
        
        FQCDailyStats stats = new FQCDailyStats();
        
        // 1. 统计检验批次
        long totalBatches = fqcInspectionRecordRepository
            .countByInspectionDate(date);
        stats.setTotalBatches(totalBatches);
        
        // 2. 统计合格率
        double acceptanceRate = calculateFQCAcceptanceRate(date);
        stats.setAcceptanceRate(acceptanceRate);
        
        // 3. 不良品率分析
        double nonconformingRate = calculateFQCLotAcceptanceRate(date);
        stats.setLotAcceptanceRate(nonconformingRate);
        
        // 4. 产品质量分析
        List<ProductQualityDTO> productQualities = analyzeProductQualities(date);
        stats.setProductQualities(productQualities);
        
        return stats;
    }
    
    /**
     * 质量趋势分析
     */
    private QualityTrendDTO analyzeQualityTrend(LocalDate date) {
        log.debug("分析质量趋势,日期: {}", date);
        
        QualityTrendDTO trend = new QualityTrendDTO();
        trend.setCurrentDate(date);
        
        // 1. 计算7天趋势
        List<QualityMetricDTO> weeklyTrend = calculateWeeklyTrend(date);
        trend.setWeeklyTrend(weeklyTrend);
        
        // 2. 计算30天趋势
        List<QualityMetricDTO> monthlyTrend = calculateMonthlyTrend(date);
        trend.setMonthlyTrend(monthlyTrend);
        
        // 3. 计算年度趋势
        List<QualityMetricDTO> yearlyTrend = calculateYearlyTrend(date);
        trend.setYearlyTrend(yearlyTrend);
        
        // 4. 趋势预警
        List<TrendAlertDTO> trendAlerts = generateTrendAlerts(weeklyTrend, monthlyTrend);
        trend.setTrendAlerts(trendAlerts);
        
        return trend;
    }
    
    /**
     * 周趋势计算
     */
    private List<QualityMetricDTO> calculateWeeklyTrend(LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(6);
        List<QualityMetricDTO> weeklyData = new ArrayList<>();
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            QualityMetricDTO metric = new QualityMetricDTO();
            metric.setDate(date);
            metric.setMetricDate(date);
            
            // 获取当天的质量指标
            double iqcRate = calculateIQCAcceptanceRate(date);
            double fqcRate = calculateFQCAcceptanceRate(date);
            double complaintCount = getComplaintCountByDate(date);
            
            metric.setIqcAcceptanceRate(iqcRate);
            metric.setFqcAcceptanceRate(fqcRate);
            metric.setComplaintCount(complaintCount);
            
            weeklyData.add(metric);
        }
        
        return weeklyData;
    }
    
    /**
     * 生成质量预警
     */
    private List<QualityAlertDTO> generateQualityAlerts(LocalDate date) {
        List<QualityAlertDTO> alerts = new ArrayList<>();
        
        // 1. 合格率预警
        double iqcRate = calculateIQCAcceptanceRate(date);
        if (iqcRate < 95.0) {
            QualityAlertDTO alert = createQualityAlert(
                "IQC合格率过低", 
                "IQC合格率低于95%,当前:" + iqcRate + "%", 
                AlertLevel.WARNING
            );
            alerts.add(alert);
        }
        
        // 2. 不良品率预警
        double defectRate = calculateDefectRate(date);
        if (defectRate > 2.0) {
            QualityAlertDTO alert = createQualityAlert(
                "不良品率过高", 
                "不良品率高于2%,当前:" + defectRate + "%", 
                AlertLevel.CRITICAL
            );
            alerts.add(alert);
        }
        
        // 3. 客户投诉预警
        long complaintCount = getComplaintCountByDate(date);
        if (complaintCount > 5) {
            QualityAlertDTO alert = createQualityAlert(
                "客户投诉过多", 
                "当天客户投诉数量超过5件,当前:" + complaintCount + "件", 
                AlertLevel.WARNING
            );
            alerts.add(alert);
        }
        
        // 4. CAPA超期预警
        List<CAPA> overdueCAPAs = findOverdueCAPAs(date);
        if (!overdueCAPAs.isEmpty()) {
            QualityAlertDTO alert = createQualityAlert(
                "CAPA措施超期", 
                "有" + overdueCAPAs.size() + "项CAPA措施超期未完成", 
                AlertLevel.WARNING
            );
            alerts.add(alert);
        }
        
        return alerts;
    }
    
    /**
     * 生成质量周报
     */
    @Override
    public QualityWeeklyReportDTO generateWeeklyReport(LocalDate weekDate) {
        log.info("生成质量周报,日期: {}", weekDate);
        
        QualityWeeklyReportDTO report = new QualityWeeklyReportDTO();
        report.setReportDate(weekDate);
        report.setReportType("WEEKLY");
        
        // 1. 本周统计汇总
        WeeklyQualitySummary summary = analyzeWeeklySummary(weekDate);
        report.setWeeklySummary(summary);
        
        // 2. 质量趋势分析
        WeeklyTrendAnalysis trendAnalysis = analyzeWeeklyTrend(weekDate);
        report.setTrendAnalysis(trendAnalysis);
        
        // 3. 不良品分析
        WeeklyDefectAnalysis defectAnalysis = analyzeWeeklyDefects(weekDate);
        report.setDefectAnalysis(defectAnalysis);
        
        // 4. 供应商质量分析
        WeeklySupplierAnalysis supplierAnalysis = analyzeWeeklySuppliers(weekDate);
        report.setSupplierAnalysis(supplierAnalysis);
        
        // 5. 改进项目分析
        WeeklyImprovementAnalysis improvementAnalysis = analyzeWeeklyImprovements(weekDate);
        report.setImprovementAnalysis(improvementAnalysis);
        
        return report;
    }
    
    /**
     * 分析周质量总结
     */
    private WeeklyQualitySummary analyzeWeeklySummary(LocalDate weekDate) {
        WeeklyQualitySummary summary = new WeeklyQualitySummary();
        
        // 1. 时间范围
        LocalDate startDate = weekDate.minusDays(6);
        LocalDate endDate = weekDate;
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);
        
        // 2. IQC统计
        WeeklyIQCStats iqcStats = calculateWeeklyIQCStats(startDate, endDate);
        summary.setIqcStats(iqcStats);
        
        // 3. FQC统计
        WeeklyFQCStats fqcStats = calculateWeeklyFQCStats(startDate, endDate);
        summary.setFqcStats(fqcStats);
        
        // 4. 投诉统计
        WeeklyComplaintStats complaintStats = calculateWeeklyComplaintStats(startDate, endDate);
        summary.setComplaintStats(complaintStats);
        
        // 5. CAPA统计
        WeeklyCAPAStats capaStats = calculateWeeklyCAPAStats(startDate, endDate);
        summary.setCapaStats(capaStats);
        
        return summary;
    }
    
    /**
     * 计算周IQC统计
     */
    private WeeklyIQCStats calculateWeeklyIQCStats(LocalDate startDate, LocalDate endDate) {
        WeeklyIQCStats stats = new WeeklyIQCStats();
        
        // 1. 查询本周数据
        List<IQCInspectionRecord> weeklyRecords = iqcInspectionRecordRepository
            .findByInspectionDateBetween(startDate, endDate);
        
        // 2. 计算总数
        stats.setTotalBatches(weeklyRecords.size());
        
        // 3. 计算接受率
        long acceptedCount = weeklyRecords.stream()
            .filter(r -> InspectionResult.ACCEPT == r.getInspectionResult())
            .count();
        stats.setAcceptanceRate((double) acceptedCount / weeklyRecords.size() * 100);
        
        // 4. 计算不合格品率
        long nonconformingCount = weeklyRecords.stream()
            .filter(r -> InspectionResult.REJECT == r.getInspectionResult())
            .count();
        stats.setNonconformingRate((double) nonconformingCount / weeklyRecords.size() * 100);
        
        // 5. 供应商分布
        Map<String, Long> supplierDistribution = weeklyRecords.stream()
            .collect(Collectors.groupingBy(IQCInspectionRecord::getSupplierName, Collectors.counting()));
        stats.setSupplierDistribution(supplierDistribution);
        
        return stats;
    }
}
```

### 2.2 SPC过程能力分析

```java
/**
 * SPC过程能力分析服务
 */
@Service
@Slf4j
public class SPCProcessCapabilityServiceImpl implements SPCProcessCapabilityService {
    
    @Autowired
    private SPCControlPointRepository spcControlPointRepository;
    
    @Autowired
    private ProcessCapabilityRepository processCapabilityRepository;
    
    /**
     * 计算过程能力
     */
    @Override
    public ProcessCapabilityDTO calculateProcessCapability(Long characteristicId, LocalDate dateRange) {
        log.info("计算过程能力,特性ID: {}, 日期: {}", characteristicId, dateRange);
        
        // 1. 获取SPC数据
        List<SPCControlPoint> dataPoints = getSPCDataForAnalysis(characteristicId, dateRange);
        
        // 2. 计算过程能力指数
        ProcessCapabilityIndices indices = calculateProcessCapabilityIndices(dataPoints);
        
        // 3. 计算过程性能指数
        ProcessPerformanceIndices performanceIndices = calculateProcessPerformanceIndices(dataPoints);
        
        // 4. 创建过程能力记录
        ProcessCapability capability = createProcessCapabilityRecord(
            characteristicId, indices, performanceIndices
        );
        
        // 5. 分析过程能力等级
        ProcessCapabilityLevel level = determineProcessCapabilityLevel(indices);
        
        // 6. 生成分析报告
        ProcessCapabilityReportDTO report = generateCapabilityReport(
            capability, indices, performanceIndices, level
        );
        
        return report;
    }
    
    /**
     * 计算过程能力指数
     */
    private ProcessCapabilityIndices calculateProcessCapabilityIndices(List<SPCControlPoint> dataPoints) {
        ProcessCapabilityIndices indices = new ProcessCapabilityIndices();
        
        if (dataPoints.isEmpty()) {
            return indices;
        }
        
        // 1. 计算样本均值
        double processMean = calculateProcessMean(dataPoints);
        indices.setProcessMean(processMean);
        
        // 2. 计算样本标准差
        double processStdDev = calculateProcessStandardDeviation(dataPoints);
        indices.setProcessStdDev(processStdDev);
        
        // 3. 获取规格限
        double upperSpecLimit = getUpperSpecificationLimit(dataPoints.get(0));
        double lowerSpecLimit = getLowerSpecificationLimit(dataPoints.get(0));
        
        // 4. 计算Cp
        double cp = calculateCp(upperSpecLimit, lowerSpecLimit, processStdDev);
        indices.setCp(cp);
        
        // 5. 计算Cpk
        double cpk = calculateCpk(upperSpecLimit, lowerSpecLimit, processMean, processStdDev);
        indices.setCpk(cpk);
        
        // 6. 计算Pp
        double pp = calculatePp(upperSpecLimit, lowerSpecLimit, processStdDev);
        indices.setPp(pp);
        
        // 7. 计算Ppk
        double ppk = calculatePpk(upperSpecLimit, lowerSpecLimit, processMean, processStdDev);
        indices.setPpk(ppk);
        
        // 8. 计算过程绩效
        double ppm = calculatePPM(upperSpecLimit, lowerSpecLimit, processMean, processStdDev);
        indices.setPpm(ppm);
        
        return indices;
    }
    
    /**
     * 计算过程均值
     */
    private double calculateProcessMean(List<SPCControlPoint> dataPoints) {
        return dataPoints.stream()
            .mapToDouble(SPCControlPoint::getMeasurementValue)
            .average()
            .orElse(0.0);
    }
    
    /**
     * 计算过程标准差
     */
    private double calculateProcessStandardDeviation(List<SPCControlPoint> dataPoints) {
        double[] values = dataPoints.stream()
            .mapToDouble(SPCControlPoint::getMeasurementValue)
            .toArray();
        
        return calculateSampleStandardDeviation(values);
    }
    
    /**
     * 计算Cp
     */
    private double calculateCp(double usl, double lsl, double sigma) {
        if (sigma == 0) {
            return 0;
        }
        
        double tolerance = usl - lsl;
        return tolerance / (6 * sigma);
    }
    
    /**
     * 计算Cpk
     */
    private double calculateCpk(double usl, double lsl, double mean, double sigma) {
        if (sigma == 0) {
            return 0;
        }
        
        double cpkUpper = (usl - mean) / (3 * sigma);
        double cpkLower = (mean - lsl) / (3 * sigma);
        
        return Math.min(cpkUpper, cpkLower);
    }
    
    /**
     * 确定过程能力等级
     */
    private ProcessCapabilityLevel determineProcessCapabilityLevel(ProcessCapabilityIndices indices) {
        double cpk = indices.getCpk();
        
        if (cpk >= 2.0) {
            return ProcessCapabilityLevel.EXCELLENT;
        } else if (cpk >= 1.67) {
            return ProcessCapabilityLevel.GOOD;
        } else if (cpk >= 1.33) {
            return ProcessCapabilityLevel.ADEQUATE;
        } else if (cpk >= 1.0) {
            return ProcessCapabilityLevel.MARGINAL;
        } else {
            return ProcessCapabilityLevel.INADEQUATE;
        }
    }
    
    /**
     * 生成过程能力报告
     */
    private ProcessCapabilityReportDTO generateCapabilityReport(
        ProcessCapability capability,
        ProcessCapabilityIndices indices,
        ProcessPerformanceIndices performanceIndices,
        ProcessCapabilityLevel level
    ) {
        ProcessCapabilityReportDTO report = new ProcessCapabilityReportDTO();
        
        // 1. 基本信息
        report.setCapabilityId(capability.getCapabilityId());
        report.setCharacteristicId(capability.getCharacteristicId());
        report.setProcessDate(capability.getProcessDate());
        report.setAnalysisDate(LocalDateTime.now());
        
        // 2. 过程能力指标
        report.setCapabilityIndices(indices);
        
        // 3. 过程性能指标
        report.setPerformanceIndices(performanceIndices);
        
        // 4. 能力等级
        report.setCapabilityLevel(level);
        report.setLevelDescription(getCapabilityLevelDescription(level));
        
        // 5. 性能评估
        PerformanceEvaluation evaluation = evaluatePerformance(indices, level);
        report.setPerformanceEvaluation(evaluation);
        
        // 6. 改进建议
        List<ImprovementSuggestionDTO> suggestions = generateCapabilityImprovementSuggestions(
            indices, level
        );
        report.setImprovementSuggestions(suggestions);
        
        // 7. 趋势分析
        CapabilityTrendDTO trend = analyzeCapabilityTrend(capability.getCharacteristicId());
        report.setCapabilityTrend(trend);
        
        return report;
    }
    
    /**
     * 过程能力趋势分析
     */
    private CapabilityTrendDTO analyzeCapabilityTrend(Long characteristicId) {
        CapabilityTrendDTO trend = new CapabilityTrendDTO();
        
        // 1. 获取历史过程能力数据
        List<ProcessCapability> historyCapabilities = processCapabilityRepository
            .findByCharacteristicIdOrderByProcessDateDesc(characteristicId, 12);
        
        // 2. 转换为趋势数据
        List<CapabilityTrendData> trendData = historyCapabilities.stream()
            .map(this::convertToTrendData)
            .sorted(Comparator.comparing(CapabilityTrendData::getDate))
            .collect(Collectors.toList());
        
        trend.setTrendData(trendData);
        
        // 3. 计算趋势指标
        if (trendData.size() >= 3) {
            TrendDirection cpkTrend = calculateTrendDirection(
                trendData.stream()
                    .map(CapabilityTrendData::getCpk)
                    .mapToDouble(Double::doubleValue)
                    .toArray()
            );
            trend.setCpkTrend(cpkTrend);
            
            TrendDirection cpTrend = calculateTrendDirection(
                trendData.stream()
                    .map(CapabilityTrendData::getCp)
                    .mapToDouble(Double::doubleValue)
                    .toArray()
            );
            trend.setCpTrend(cpTrend);
        }
        
        return trend;
    }
    
    /**
     * 过程性能评估
     */
    private PerformanceEvaluation evaluatePerformance(ProcessCapabilityIndices indices, 
                                                    ProcessCapabilityLevel level) {
        PerformanceEvaluation evaluation = new PerformanceEvaluation();
        
        // 1. 评分
        int score = calculatePerformanceScore(indices, level);
        evaluation.setScore(score);
        evaluation.setScoreDescription(getScoreDescription(score));
        
        // 2. 强项分析
        List<PerformanceStrength> strengths = identifyStrengths(indices);
        evaluation.setStrengths(strengths);
        
        // 3. 弱项分析
        List<PerformanceWeakness> weaknesses = identifyWeaknesses(indices);
        evaluation.setWeaknesses(weaknesses);
        
        // 4. 总体评价
        String overallEvaluation = generateOverallEvaluation(indices, level);
        evaluation.setOverallEvaluation(overallEvaluation);
        
        return evaluation;
    }
    
    /**
     * 生成改进建议
     */
    private List<ImprovementSuggestionDTO> generateCapabilityImprovementSuggestions(
        ProcessCapabilityIndices indices, 
        ProcessCapabilityLevel level
    ) {
        List<ImprovementSuggestionDTO> suggestions = new ArrayList<>();
        
        // 1. 基于Cpk的建议
        if (indices.getCpk() < 1.33) {
            suggestions.add(createImprovementSuggestion(
                "提高过程能力",
                "当前Cpk为" + String.format("%.2f", indices.getCpk()) + 
                ",建议通过优化工艺参数来提高过程能力",
                "工艺优化"
            ));
        }
        
        // 2. 基于Cp的建议
        if (indices.getCp() < 1.67) {
            suggestions.add(createImprovementSuggestion(
                "减少过程变异",
                "当前Cp为" + String.format("%.2f", indices.getCp()) + 
                ",建议减少过程变异提高能力",
                "变异减少"
            ));
        }
        
        // 3. 基于PPM的建议
        if (indices.getPpm() > 1000) {
            suggestions.add(createImprovementSuggestion(
                "降低不良品率",
                "当前不良品率为" + String.format("%.2f", indices.getPpm()) + " ppm",
                "质量改进"
            ));
        }
        
        return suggestions;
    }
}
```

---

## 3. 质量成本分析详细实现

### 3.1 质量成本核算体系

```java
/**
 * 质量成本服务
 */
@Service
@Slf4j
public class QualityCostServiceImpl implements QualityCostService {
    
    @Autowired
    private QualityCostRepository qualityCostRepository;
    
    @Autowired
    private DefectRepository defectRepository;
    
    @Autowired
    private CAPARepository capaRepository;
    
    @Autowired
    private TrainingRepository trainingRepository;
    
    /**
     * 质量成本分类
     */
    public enum QualityCostCategory {
        PREVENTION_COSTS,    // 预防成本
        APPRAISAL_COSTS,     // 鉴定成本
        FAILURE_COSTS,       // 失败成本
        EXTERNAL_FAILURE_COSTS  // 外部失败成本
    }
    
    /**
     * 计算月度质量成本
     */
    @Override
    public QualityCostReportDTO calculateMonthlyQualityCosts(LocalDate month) {
        log.info("计算月度质量成本,月份: {}", month);
        
        QualityCostReportDTO report = new QualityCostReportDTO();
        report.setReportDate(month);
        report.setReportType("MONTHLY");
        
        // 1. 计算预防成本
        QualityCostCategoryDTO preventionCosts = calculatePreventionCosts(month);
        report.setPreventionCosts(preventionCosts);
        
        // 2. 计算鉴定成本
        QualityCostCategoryDTO appraisalCosts = calculateAppraisalCosts(month);
        report.setAppraisalCosts(appraisalCosts);
        
        // 3. 计算失败成本
        QualityCostCategoryDTO failureCosts = calculateFailureCosts(month);
        report.setFailureCosts(failureCosts);
        
        // 4. 计算外部失败成本
        QualityCostCategoryDTO externalFailureCosts = calculateExternalFailureCosts(month);
        report.setExternalFailureCosts(externalFailureCosts);
        
        // 5. 总计
        QualityCostSummaryDTO summary = calculateTotalCosts(report);
        report.setSummary(summary);
        
        // 6. 质量成本分析
        QualityCostAnalysisDTO analysis = analyzeQualityCosts(report);
        report.setAnalysis(analysis);
        
        // 7. 成本趋势
        QualityCostTrendDTO trend = analyzeCostTrend(month);
        report.setCostTrend(trend);
        
        return report;
    }
    
    /**
     * 计算预防成本
     */
    private QualityCostCategoryDTO calculatePreventionCosts(LocalDate month) {
        QualityCostCategoryDTO costs = new QualityCostCategoryDTO();
        costs.setCategory(QualityCostCategory.PREVENTION_COSTS);
        costs.setCategoryName("预防成本");
        
        List<QualityCostItemDTO> costItems = new ArrayList<>();
        
        // 1. 质量规划成本
        double planningCost = calculateQualityPlanningCost(month);
        costItems.add(createCostItem(
            "质量规划", planningCost, "质量体系设计和维护费用"
        ));
        
        // 2. 质量培训成本
        double trainingCost = calculateQualityTrainingCost(month);
        costItems.add(createCostItem(
            "质量培训", trainingCost, "员工质量意识和技能培训费用"
        ));
        
        // 3. 过程控制成本
        double processControlCost = calculateProcessControlCost(month);
        costItems.add(createCostItem(
            "过程控制", processControlCost, "SPC控制图和统计过程控制费用"
        ));
        
        // 4. 供应商质量保证成本
        double supplierCost = calculateSupplierQualityCost(month);
        costItems.add(createCostItem(
            "供应商质量保证", supplierCost, "供应商审核和质量保证费用"
        ));
        
        costs.setCostItems(costItems);
        costs.setTotalCost(costItems.stream()
            .mapToDouble(QualityCostItemDTO::getCost)
            .sum());
        
        return costs;
    }
    
    /**
     * 计算质量培训成本
     */
    private double calculateQualityTrainingCost(LocalDate month) {
        // 1. 培训讲师费用
        double trainerCost = trainingRepository
            .calculateTrainerCost(month);
        
        // 2. 培训材料费用
        double materialCost = trainingRepository
            .calculateTrainingMaterialCost(month);
        
        // 3. 设施和设备费用
        double facilityCost = trainingRepository
            .calculateFacilityCost(month);
        
        // 4. 参训人员时间成本
        double timeCost = trainingRepository
            .calculateTrainingTimeCost(month);
        
        return trainerCost + materialCost + facilityCost + timeCost;
    }
    
    /**
     * 计算失败成本
     */
    private QualityCostCategoryDTO calculateFailureCosts(LocalDate month) {
        QualityCostCategoryDTO costs = new QualityCostCategoryDTO();
        costs.setCategory(QualityCostCategory.FAILURE_COSTS);
        costs.setCategoryName("失败成本");
        
        List<QualityCostItemDTO> costItems = new ArrayList<>();
        
        // 1. 内部失败成本
        double internalFailureCost = calculateInternalFailureCost(month);
        costItems.add(createCostItem(
            "内部失败成本", internalFailureCost, "内部发现的质量问题处理费用"
        ));
        
        // 2. 外部失败成本
        double externalFailureCost = calculateExternalFailureCost(month);
        costItems.add(createCostItem(
            "外部失败成本", externalFailureCost, "外部发现的质量问题处理费用"
        ));
        
        costs.setCostItems(costItems);
        costs.setTotalCost(costItems.stream()
            .mapToDouble(QualityCostItemDTO::getCost)
            .sum());
        
        return costs;
    }
    
    /**
     * 计算内部失败成本
     */
    private double calculateInternalFailureCost(LocalDate month) {
        double totalCost = 0;
        
        // 1. 废品成本
        double scrapCost = defectRepository
            .calculateScrapCost(month);
        totalCost += scrapCost;
        
        // 2. 返工成本
        double reworkCost = defectRepository
            .calculateReworkCost(month);
        totalCost += reworkCost;
        
        // 3. 降级处理成本
        double downgradeCost = defectRepository
            .calculateDowngradeCost(month);
        totalCost += downgradeCost;
        
        // 4. CAPA实施成本
        double capaCost = capaRepository
            .calculateCAPACost(month);
        totalCost += capaCost;
        
        return totalCost;
    }
    
    /**
     * 计算不良品成本
     */
    private double calculateDefectCost(LocalDate month, Defect defect) {
        double totalCost = 0;
        
        // 1. 材料成本
        double materialCost = defect.getQuantity() * getMaterialCostPerUnit(defect);
        
        // 2. 加工成本
        double processingCost = defect.getQuantity() * getProcessingCostPerUnit(defect);
        
        // 3. 设备使用成本
        double equipmentCost = defect.getQuantity() * getEquipmentCostPerUnit(defect);
        
        // 4. 人工成本
        double laborCost = defect.getQuantity() * getLaborCostPerUnit(defect);
        
        // 5. 管理成本分摊
        double overheadCost = (materialCost + processingCost + equipmentCost + laborCost) * 
                              getOverheadRate(defect);
        
        totalCost = materialCost + processingCost + equipmentCost + laborCost + overheadCost;
        
        // 6. 返工/修复成本
        if (defect.isReworkable()) {
            totalCost += calculateReworkCost(defect);
        }
        
        return totalCost;
    }
    
    /**
     * 质量成本分析
     */
    private QualityCostAnalysisDTO analyzeQualityCosts(QualityCostReportDTO report) {
        QualityCostAnalysisDTO analysis = new QualityCostAnalysisDTO();
        
        // 1. 计算各成本类别占比
        Map<QualityCostCategory, Double> costRatios = calculateCostRatios(report);
        analysis.setCostRatios(costRatios);
        
        // 2. 计算质量成本率
        double qualityCostRate = calculateQualityCostRate(report);
        analysis.setQualityCostRate(qualityCostRate);
        
        // 3. 计算预防成本占比
        double preventionRatio = calculatePreventionRatio(report);
        analysis.setPreventionRatio(preventionRatio);
        
        // 4. 计算鉴定成本占比
        double appraisalRatio = calculateAppraisalRatio(report);
        analysis.setAppraisalRatio(appraisalRatio);
        
        // 5. 计算失败成本占比
        double failureRatio = calculateFailureRatio(report);
        analysis.setFailureRatio(failureRatio);
        
        // 6. 质量成本优化建议
        List<CostOptimizationDTO> optimizationSuggestions = 
            generateCostOptimizationSuggestions(analysis);
        analysis.setOptimizationSuggestions(optimizationSuggestions);
        
        return analysis;
    }
    
    /**
     * 计算质量成本率
     */
    private double calculateQualityCostRate(QualityCostReportDTO report) {
        // 获取月度总收入
        double totalRevenue = getMonthlyRevenue(report.getReportDate());
        
        if (totalRevenue == 0) {
            return 0;
        }
        
        double totalCost = report.getSummary().getTotalCost();
        return totalCost / totalRevenue * 100;
    }
    
    /**
     * 生成成本优化建议
     */
    private List<CostOptimizationDTO> generateCostOptimizationSuggestions(
        QualityCostAnalysisDTO analysis
    ) {
        List<CostOptimizationDTO> suggestions = new ArrayList<>();
        
        // 1. 失败成本过高建议
        if (analysis.getFailureRatio() > 30) {
            suggestions.add(createCostOptimization(
                "减少失败成本",
                "失败成本占比过高(" + String.format("%.1f", analysis.getFailureRatio()) + 
                "%),建议加强过程控制和预防措施",
                "PROCESS_IMPROVEMENT"
            ));
        }
        
        // 2. 预防成本过低建议
        if (analysis.getPreventionRatio() < 5) {
            suggestions.add(createCostOptimization(
                "增加预防投入",
                "预防成本占比过低(" + String.format("%.1f", analysis.getPreventionRatio()) + 
                "%),建议增加质量培训和技术改进投入",
                "PREVENTION_INVESTMENT"
            ));
        }
        
        // 3. 鉴定成本优化建议
        if (analysis.getAppraisalRatio() > 25) {
            suggestions.add(createCostOptimization(
                "优化鉴定成本",
                "鉴定成本占比较高(" + String.format("%.1f", analysis.getAppraisalRatio()) + 
                "%),建议自动化检测和抽样优化",
                "APPRAISAL_OPTIMIZATION"
            ));
        }
        
        return suggestions;
    }
    
    /**
     * 质量成本趋势分析
     */
    private QualityCostTrendDTO analyzeCostTrend(LocalDate endDate) {
        QualityCostTrendDTO trend = new QualityCostTrendDTO();
        trend.setCurrentMonth(endDate);
        
        // 1. 计算12个月趋势数据
        List<MonthlyCostTrend> monthlyData = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = endDate.minusMonths(i);
            MonthlyCostTrend monthlyCost = calculateMonthlyCostTrend(month);
            monthlyData.add(monthlyCost);
        }
        trend.setMonthlyTrend(monthlyData);
        
        // 2. 计算趋势指标
        CostTrendMetrics metrics = calculateTrendMetrics(monthlyData);
        trend.setTrendMetrics(metrics);
        
        // 3. 成本预警
        List<CostAlertDTO> alerts = generateCostAlerts(monthlyData);
        trend.setCostAlerts(alerts);
        
        return trend;
    }
    
    /**
     * 计算月度成本趋势
     */
    private MonthlyCostTrend calculateMonthlyCostTrend(LocalDate month) {
        MonthlyCostTrend trend = new MonthlyCostTrend();
        trend.setMonth(month);
        
        // 1. 计算各类成本
        QualityCostReportDTO report = calculateMonthlyQualityCosts(month);
        
        trend.setTotalCost(report.getSummary().getTotalCost());
        trend.setPreventionCost(report.getPreventionCosts().getTotalCost());
        trend.setAppraisalCost(report.getAppraisalCosts().getTotalCost());
        trend.setFailureCost(report.getFailureCosts().getTotalCost());
        trend.setExternalFailureCost(report.getExternalFailureCosts().getTotalCost());
        
        // 2. 计算质量成本率
        double revenue = getMonthlyRevenue(month);
        trend.setCostRate(revenue > 0 ? trend.getTotalCost() / revenue * 100 : 0);
        
        return trend;
    }
    
    /**
     * 计算成本趋势指标
     */
    private CostTrendMetrics calculateTrendMetrics(List<MonthlyCostTrend> monthlyData) {
        CostTrendMetrics metrics = new CostTrendMetrics();
        
        if (monthlyData.size() < 3) {
            return metrics;
        }
        
        // 1. 成本总额趋势
        double[] totalCosts = monthlyData.stream()
            .mapToDouble(MonthlyCostTrend::getTotalCost)
            .toArray();
        
        metrics.setTotalCostTrend(calculateTrendDirection(totalCosts));
        metrics.setTotalCostSlope(calculateTrendSlope(totalCosts));
        
        // 2. 失败成本趋势
        double[] failureCosts = monthlyData.stream()
            .mapToDouble(MonthlyCostTrend::getFailureCost)
            .toArray();
        
        metrics.setFailureCostTrend(calculateTrendDirection(failureCosts));
        metrics.setFailureCostSlope(calculateTrendSlope(failureCosts));
        
        // 3. 成本率趋势
        double[] costRates = monthlyData.stream()
            .mapToDouble(MonthlyCostTrend::getCostRate)
            .toArray();
        
        metrics.setCostRateTrend(calculateTrendDirection(costRates));
        metrics.setCostRateSlope(calculateTrendSlope(costRates));
        
        return metrics;
    }
    
    /**
     * 生成成本预警
     */
    private List<CostAlertDTO> generateCostAlerts(List<MonthlyCostTrend> monthlyData) {
        List<CostAlertDTO> alerts = new ArrayList<>();
        
        // 1. 成本增长预警
        if (monthlyData.size() >= 3) {
            double recentGrowth = calculateRecentCostGrowth(monthlyData);
            if (recentGrowth > 10) {
                CostAlertDTO alert = createCostAlert(
                    "成本快速增长",
                    "最近3个月成本增长" + String.format("%.1f", recentGrowth) + "%",
                    AlertLevel.WARNING
                );
                alerts.add(alert);
            }
        }
        
        // 2. 失败成本预警
        double failureRatio = calculateCurrentFailureRatio(monthlyData);
        if (failureRatio > 40) {
            CostAlertDTO alert = createCostAlert(
                "失败成本过高",
                "失败成本占比" + String.format("%.1f", failureRatio) + "%",
                AlertLevel.CRITICAL
            );
            alerts.add(alert);
        }
        
        return alerts;
    }
}
```

---

## 4. 决策支持模块详细实现

### 4.1 智能决策支持系统

```java
/**
 * 智能决策支持服务
 */
@Service
@Slf4j
public class IntelligentDecisionSupportServiceImpl implements IntelligentDecisionSupportService {
    
    @Autowired
    private MachineLearningService mlService;
    
    @Autowired
    private AnalysisService analysisService;
    
    @Autowired
    private RiskAssessmentService riskAssessmentService;
    
    /**
     * 质量决策建议生成
     */
    @Override
    public QualityDecisionAdviceDTO generateQualityDecisionAdvice(QualityDecisionInputDTO input) {
        log.info("生成质量决策建议,输入: {}", input.getInputContext());
        
        QualityDecisionAdviceDTO advice = new QualityDecisionAdviceDTO();
        
        // 1. 情境分析
        DecisionContext context = analyzeDecisionContext(input);
        advice.setDecisionContext(context);
        
        // 2. 问题识别
        DecisionIssue issue = identifyDecisionIssue(input, context);
        advice.setDecisionIssue(issue);
        
        // 3. 方案生成
        List<DecisionOption> options = generateDecisionOptions(issue);
        advice.setDecisionOptions(options);
        
        // 4. 方案评估
        DecisionEvaluation evaluation = evaluateDecisionOptions(options);
        advice.setEvaluation(evaluation);
        
        // 5. 推荐方案
        DecisionRecommendation recommendation = generateRecommendation(evaluation);
        advice.setRecommendation(recommendation);
        
        // 6. 风险评估
        DecisionRiskAssessment riskAssessment = assessDecisionRisks(recommendation);
        advice.setRiskAssessment(riskAssessment);
        
        // 7. 实施计划
        DecisionImplementationPlan implementationPlan = createImplementationPlan(recommendation);
        advice.setImplementationPlan(implementationPlan);
        
        // 8. 监控指标
        List<DecisionMonitorMetric> monitorMetrics = generateMonitorMetrics(recommendation);
        advice.setMonitorMetrics(monitorMetrics);
        
        return advice;
    }
    
    /**
     * 分析决策情境
     */
    private DecisionContext analyzeDecisionContext(QualityDecisionInputDTO input) {
        DecisionContext context = new DecisionContext();
        
        // 1. 当前质量状况
        QualityStatusDTO qualityStatus = analyzeCurrentQualityStatus();
        context.setQualityStatus(qualityStatus);
        
        // 2. 历史趋势分析
        QualityTrendDTO historicalTrend = analyzeHistoricalTrend();
        context.setHistoricalTrend(historicalTrend);
        
        // 3. 环境因素
        EnvironmentalFactorsDTO environmentalFactors = analyzeEnvironmentalFactors(input);
        context.setEnvironmentalFactors(environmentalFactors);
        
        // 4. 约束条件
        DecisionConstraints constraints = identifyConstraints(input);
        context.setConstraints(constraints);
        
        // 5. 利益相关方
        List<Stakeholder> stakeholders = identifyStakeholders(input);
        context.setStakeholders(stakeholders);
        
        return context;
    }
    
    /**
     * 识别决策问题
     */
    private DecisionIssue identifyDecisionIssue(QualityDecisionInputDTO input, DecisionContext context) {
        DecisionIssue issue = new DecisionIssue();
        
        // 1. 问题类型识别
        DecisionIssueType issueType = determineIssueType(input);
        issue.setIssueType(issueType);
        
        // 2. 问题严重程度
        DecisionPriority priority = determineIssuePriority(issueType, context);
        issue.setPriority(priority);
        
        // 3. 问题根因分析
        DecisionRootCause rootCause = analyzeRootCause(input, context);
        issue.setRootCause(rootCause);
        
        // 4. 影响范围评估
        DecisionImpact impact = assessImpact(issueType, context);
        issue.setImpact(impact);
        
        // 5. 紧急程度
        UrgencyLevel urgency = determineUrgency(issueType, priority, context);
        issue.setUrgency(urgency);
        
        return issue;
    }
    
    /**
     * 生成决策选项
     */
    private List<DecisionOption> generateDecisionOptions(DecisionIssue issue) {
        List<DecisionOption> options = new ArrayList<>();
        
        // 1. 基于问题类型生成方案
        switch (issue.getIssueType()) {
            case QUALITY_DEGRADATION:
                options.addAll(generateQualityDegradationOptions(issue));
                break;
            case PROCESS_INSTABILITY:
                options.addAll(generateProcessInstabilityOptions(issue));
                break;
            case SUPPLIER_ISSUES:
                options.addAll(generateSupplierIssueOptions(issue));
                break;
            case CUSTOMER_COMPLAINTS:
                options.addAll(generateCustomerComplaintOptions(issue));
                break;
            case REGULATORY_COMPLIANCE:
                options.addAll(generateComplianceOptions(issue));
                break;
        }
        
        // 2. 基于机器学习推荐
        List<DecisionOption> mlRecommendations = 
            generateMLRecommendations(issue);
        options.addAll(mlRecommendations);
        
        // 3. 历史经验建议
        List<DecisionOption> historicalOptions = 
            generateHistoricalOptions(issue);
        options.addAll(historicalOptions);
        
        // 4. 去重和排序
        options = deduplicateAndRankOptions(options);
        
        return options;
    }
    
    /**
     * 质量退化决策选项
     */
    private List<DecisionOption> generateQualityDegradationOptions(DecisionIssue issue) {
        List<DecisionOption> options = new ArrayList<>();
        
        // 1. 工艺参数优化
        DecisionOption processOptimization = new DecisionOption();
        processOptimization.setOptionId("PROCESS_OPTIMIZATION");
        processOptimization.setOptionName("工艺参数优化");
        processOptimization.setOptionDescription("优化压铸工艺参数以提高产品质量");
        processOptimization.setEstimatedCost(calculateOptimizationCost());
        processOptimization.setImplementationTime("2-4周");
        processOptimization.setEffectivenessScore(85);
        processOptimization.setRiskLevel(RiskLevel.LOW);
        processOptimization.setResourcesRequired("工艺工程师,设备调试");
        options.add(processOptimization);
        
        // 2. 设备升级
        DecisionOption equipmentUpgrade = new DecisionOption();
        equipmentUpgrade.setOptionId("EQUIPMENT_UPGRADE");
        equipmentUpgrade.setOptionName("设备升级");
        equipmentUpgrade.setOptionDescription("升级老化设备以提高产品质量稳定性");
        equipmentUpgrade.setEstimatedCost(calculateUpgradeCost());
        equipmentUpgrade.setImplementationTime("3-6个月");
        equipmentUpgrade.setEffectivenessScore(95);
        equipmentUpgrade.setRiskLevel(RiskLevel.HIGH);
        equipmentUpgrade.setResourcesRequired("投资预算,设备供应商");
        options.add(equipmentUpgrade);
        
        // 3. 员工培训
        DecisionOption staffTraining = new DecisionOption();
        staffTraining.setOptionId("STAFF_TRAINING");
        staffTraining.setOptionName("员工技能培训");
        staffTraining.setOptionDescription("加强员工质量意识和操作技能培训");
        staffTraining.setEstimatedCost(calculateTrainingCost());
        staffTraining.setImplementationTime("1-2周");
        staffTraining.setEffectivenessScore(70);
        staffTraining.setRiskLevel(RiskLevel.LOW);
        staffTraining.setResourcesRequired("培训讲师,培训材料");
        options.add(staffTraining);
        
        return options;
    }
    
    /**
     * 评估决策选项
     */
    private DecisionEvaluation evaluateDecisionOptions(List<DecisionOption> options) {
        DecisionEvaluation evaluation = new DecisionEvaluation();
        
        // 1. 多维度评估
        List<OptionEvaluation> evaluations = new ArrayList<>();
        for (DecisionOption option : options) {
            OptionEvaluation optionEval = new OptionEvaluation();
            optionEval.setOptionId(option.getOptionId());
            optionEval.setOptionName(option.getOptionName());
            
            // 1.1 成本效益分析
            double costBenefitRatio = calculateCostBenefitRatio(option);
            optionEval.setCostBenefitRatio(costBenefitRatio);
            
            // 1.2 实施难度评估
            double implementationDifficulty = calculateImplementationDifficulty(option);
            optionEval.setImplementationDifficulty(implementationDifficulty);
            
            // 1.3 风险评估
            double riskScore = calculateRiskScore(option);
            optionEval.setRiskScore(riskScore);
            
            // 1.4 时间价值评估
            double timeValue = calculateTimeValue(option);
            optionEval.setTimeValue(timeValue);
            
            // 1.5 综合评分
            double overallScore = calculateOverallScore(optionEval);
            optionEval.setOverallScore(overallScore);
            
            evaluations.add(optionEval);
        }
        evaluation.setOptionEvaluations(evaluations);
        
        // 2. 最佳选项推荐
        EvaluationResult result = determineBestOption(evaluations);
        evaluation.setRecommendedOption(result);
        
        return evaluation;
    }
    
    /**
     * 生成推荐方案
     */
    private DecisionRecommendation generateRecommendation(DecisionEvaluation evaluation) {
        DecisionRecommendation recommendation = new DecisionRecommendation();
        
        // 1. 推荐方案
        OptionEvaluation bestOption = evaluation.getRecommendedOption();
        recommendation.setRecommendedOption(bestOption);
        
        // 2. 推荐理由
        String recommendationReason = generateRecommendationReason(bestOption);
        recommendation.setRecommendationReason(recommendationReason);
        
        // 3. 备选方案
        List<OptionEvaluation> alternatives = generateAlternatives(bestOption, evaluation);
        recommendation.setAlternativeOptions(alternatives);
        
        // 4. 实施优先级
        ImplementationPriority priority = determineImplementationPriority(bestOption);
        recommendation.setImplementationPriority(priority);
        
        // 5. 关键成功因素
        List<String> successFactors = identifySuccessFactors(bestOption);
        recommendation.setSuccessFactors(successFactors);
        
        return recommendation;
    }
    
    /**
     * 风险评估
     */
    private DecisionRiskAssessment assessDecisionRisks(DecisionRecommendation recommendation) {
        DecisionRiskAssessment assessment = new DecisionRiskAssessment();
        
        // 1. 识别风险
        List<DecisionRisk> risks = identifyDecisionRisks(recommendation);
        assessment.setRisks(risks);
        
        // 2. 风险评估
        List<RiskAssessmentDetail> assessments = assessRiskLevels(risks);
        assessment.setRiskAssessments(assessments);
        
        // 3. 缓解措施
        List<RiskMitigation> mitigations = generateRiskMitigations(risks);
        assessment.setRiskMitigations(mitigations);
        
        // 4. 风险监控计划
        RiskMonitoringPlan monitoringPlan = createRiskMonitoringPlan(risks);
        assessment.setMonitoringPlan(monitoringPlan);
        
        return assessment;
    }
    
    /**
     * 创建实施计划
     */
    private DecisionImplementationPlan createImplementationPlan(DecisionRecommendation recommendation) {
        DecisionImplementationPlan plan = new DecisionImplementationPlan();
        
        // 1. 阶段划分
        List<ImplementationPhase> phases = divideIntoPhases(recommendation);
        plan.setPhases(phases);
        
        // 2. 任务分解
        List<ImplementationTask> tasks = createTasks(phases);
        plan.setTasks(tasks);
        
        // 3. 资源分配
        ResourceAllocation allocation = allocateResources(tasks);
        plan.setResourceAllocation(allocation);
        
        // 4. 时间计划
        Timeline timeline = createTimeline(tasks);
        plan.setTimeline(timeline);
        
        // 5. 责任分配
        ResponsibilityMatrix responsibility = createResponsibilityMatrix(tasks);
        plan.setResponsibilityMatrix(responsibility);
        
        return plan;
    }
    
    /**
     * 决策执行跟踪
     */
    @Override
    public DecisionExecutionDTO trackDecisionExecution(Long decisionId) {
        log.info("跟踪决策执行,决策ID: {}", decisionId);
        
        DecisionExecutionDTO execution = new DecisionExecutionDTO();
        
        // 1. 决策基本信息
        DecisionBasicInfo basicInfo = getDecisionBasicInfo(decisionId);
        execution.setBasicInfo(basicInfo);
        
        // 2. 执行进度
        ExecutionProgress progress = calculateExecutionProgress(decisionId);
        execution.setProgress(progress);
        
        // 3. 任务状态
        List<TaskStatus> taskStatuses = getTaskStatuses(decisionId);
        execution.setTaskStatuses(taskStatuses);
        
        // 4. 偏差分析
        List<ExecutionDeviation> deviations = analyzeDeviations(decisionId);
        execution.setDeviations(deviations);
        
        // 5. 成果评估
        ExecutionAssessment assessment = assessExecutionResults(decisionId);
        execution.setAssessment(assessment);
        
        return execution;
    }
    
    /**
     * 决策效果评估
     */
    @Override
    public DecisionEffectivenessDTO evaluateDecisionEffectiveness(Long decisionId) {
        log.info("评估决策效果,决策ID: {}", decisionId);
        
        DecisionEffectivenessDTO effectiveness = new DecisionEffectivenessDTO();
        
        // 1. 目标达成度
        GoalAchievement achievement = evaluateGoalAchievement(decisionId);
        effectiveness.setGoalAchievement(achievement);
        
        // 2. 成本效益分析
        CostBenefitAnalysis costBenefit = analyzeCostBenefit(decisionId);
        effectiveness.setCostBenefitAnalysis(costBenefit);
        
        // 3. 质量影响评估
        QualityImpact impact = assessQualityImpact(decisionId);
        effectiveness.setQualityImpact(impact);
        
        // 4. 长期效果预测
        LongTermEffectiveness longTerm = predictLongTermEffectiveness(decisionId);
        effectiveness.setLongTermEffectiveness(longTerm);
        
        // 5. 经验总结
        DecisionExperience experience = summarizeDecisionExperience(decisionId);
        effectiveness.setDecisionExperience(experience);
        
        return effectiveness;
    }
}
```

---

## 5. 实时监控与预警系统

### 5.1 实时质量监控

```java
/**
 * 实时质量监控服务
 */
@Service
@Slf4j
public class RealTimeQualityMonitoringServiceImpl implements RealTimeQualityMonitoringService {
    
    @Autowired
    private RealTimeQualityEventRepository eventRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private AlertRuleService alertRuleService;
    
    /**
     * 实时质量事件处理
     */
    @Scheduled(fixedDelay = 1000) // 每秒执行
    public void processRealTimeQualityEvents() {
        log.debug("开始处理实时质量事件");
        
        // 1. 获取新事件
        List<RawQualityEvent> newEvents = getNewRawEvents();
        
        for (RawQualityEvent rawEvent : newEvents) {
            try {
                // 2. 处理事件
                QualityEvent processedEvent = processRawEvent(rawEvent);
                
                // 3. 验证事件
                if (validateEvent(processedEvent)) {
                    // 4. 检查预警规则
                    checkAlertRules(processedEvent);
                    
                    // 5. 保存事件
                    eventRepository.save(processedEvent);
                    
                    // 6. 更新实时看板
                    updateRealTimeDashboard(processedEvent);
                }
                
            } catch (Exception e) {
                log.error("处理实时质量事件异常,事件ID: {}", rawEvent.getEventId(), e);
                markEventAsFailed(rawEvent);
            }
        }
        
        // 7. 清理过期事件
        cleanupExpiredEvents();
        
        log.debug("实时质量事件处理完成,处理数量: {}", newEvents.size());
    }
    
    /**
     * 处理原始事件
     */
    private QualityEvent processRawEvent(RawQualityEvent rawEvent) {
        QualityEvent event = new QualityEvent();
        
        // 1. 基础信息
        event.setEventId(rawEvent.getEventId());
        event.setEventType(rawEvent.getEventType());
        event.setEventTime(rawEvent.getEventTime());
        event.setSeverity(rawEvent.getSeverity());
        
        // 2. 相关信息
        event.setProductId(rawEvent.getProductId());
        event.setBatchNumber(rawEvent.getBatchNumber());
        event.setWorkOrderId(rawEvent.getWorkOrderId());
        event.setProcessStep(rawEvent.getProcessStep());
        
        // 3. 事件详情
        event.setEventDescription(rawEvent.getEventDescription());
        event.setEventData(rawEvent.getEventData());
        
        // 4. 位置信息
        event.setProductionLine(rawEvent.getProductionLine());
        event.setWorkstation(rawEvent.getWorkstation());
        
        // 5. 责任人
        event.setOperatorId(rawEvent.getOperatorId());
        event.setSupervisorId(rawEvent.getSupervisorId());
        
        // 6. 事件状态
        event.setEventStatus(EventStatus.PROCESSED);
        event.setProcessedTime(LocalDateTime.now());
        event.setProcessor(SecurityUtils.getCurrentUserId());
        
        return event;
    }
    
    /**
     * 检查预警规则
     */
    private void checkAlertRules(QualityEvent event) {
        // 1. 获取相关的预警规则
        List<AlertRule> rules = alertRuleService.getRelevantRules(event);
        
        for (AlertRule rule : rules) {
            // 2. 检查规则条件
            if (rule.evaluate(event)) {
                // 3. 触发预警
                triggerAlert(rule, event);
            }
        }
    }
    
    /**
     * 触发预警
     */
    private void triggerAlert(AlertRule rule, QualityEvent event) {
        log.info("触发质量预警,规则ID: {}, 事件ID: {}", rule.getRuleId(), event.getEventId());
        
        // 1. 创建预警记录
        QualityAlert alert = new QualityAlert();
        alert.setAlertId(generateAlertId());
        alert.setRuleId(rule.getRuleId());
        alert.setRuleName(rule.getRuleName());
        alert.setEventId(event.getEventId());
        alert.setAlertLevel(rule.getAlertLevel());
        alert.setAlertMessage(generateAlertMessage(rule, event));
        alert.setAlertTime(LocalDateTime.now());
        alert.setStatus(AlertStatus.ACTIVE);
        
        // 2. 保存预警
        alertRepository.save(alert);
        
        // 3. 发送通知
        sendAlertNotification(alert, rule);
        
        // 4. 记录预警历史
        logAlertHistory(alert, rule, event);
    }
    
    /**
     * 实时质量看板更新
     */
    @Override
    public RealTimeQualityDashboardDTO getRealTimeDashboard() {
        RealTimeQualityDashboardDTO dashboard = new RealTimeQualityDashboardDTO();
        
        // 1. 关键指标
        List<CoreMetricDTO> coreMetrics = calculateCoreMetrics();
        dashboard.setCoreMetrics(coreMetrics);
        
        // 2. 实时事件
        List<LiveQualityEvent> liveEvents = getLiveQualityEvents();
        dashboard.setLiveEvents(liveEvents);
        
        // 3. 质量趋势
        RealTimeTrendDTO trend = calculateRealTimeTrend();
        dashboard.setTrend(trend);
        
        // 4. 异常分布
        AnomalyDistributionDTO distribution = calculateAnomalyDistribution();
        dashboard.setAnomalyDistribution(distribution);
        
        // 5. 生产线状态
        LineStatusDTO lineStatus = getLineStatus();
        dashboard.setLineStatus(lineStatus);
        
        return dashboard;
    }
    
    /**
     * 关键指标计算
     */
    private List<CoreMetricDTO> calculateCoreMetrics() {
        List<CoreMetricDTO> metrics = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        
        // 1. 今日合格率
        double dailyAcceptanceRate = calculateTodayAcceptanceRate();
        metrics.add(createCoreMetric("今日合格率", dailyAcceptanceRate, "%"));
        
        // 2. 不良品率
        double defectRate = calculateDefectRate();
        metrics.add(createCoreMetric("不良品率", defectRate, "%"));
        
        // 3. 客户投诉数
        long complaintCount = getTodayComplaintCount();
        metrics.add(createCoreMetric("客户投诉", complaintCount, "件"));
        
        // 4. 审核发现数
        long findingCount = getTodayFindingCount();
        metrics.add(createCoreMetric("审核发现", findingCount, "项"));
        
        // 5. CAPA完成率
        double capaCompletionRate = calculateCAPACompletionRate();
        metrics.add(createCoreMetric("CAPA完成率", capaCompletionRate, "%"));
        
        return metrics;
    }
    
    /**
     * 获取实时事件
     */
    private List<LiveQualityEvent> getLiveQualityEvents() {
        List<LiveQualityEvent> events = new ArrayList<>();
        
        // 1. 获取最近5分钟的事件
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        List<QualityEvent> recentEvents = eventRepository
            .findByEventTimeAfterOrderByEventTimeDesc(fiveMinutesAgo);
        
        for (QualityEvent event : recentEvents) {
            LiveQualityEvent liveEvent = new LiveQualityEvent();
            BeanUtils.copyProperties(event, liveEvent);
            events.add(liveEvent);
        }
        
        // 2. 按严重程度排序
        events.sort((e1, e2) -> {
            int severity1 = getSeverityScore(e1.getSeverity());
            int severity2 = getSeverityScore(e2.getSeverity());
            return Integer.compare(severity2, severity1);
        });
        
        return events;
    }
    
    /**
     * 实时趋势计算
     */
    private RealTimeTrendDTO calculateRealTimeTrend() {
        RealTimeTrendDTO trend = new RealTimeTrendDTO();
        
        // 1. 获取过去24小时的数据
        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        List<QualityEvent> events = eventRepository
            .findByEventTimeAfter(startTime);
        
        // 2. 按小时聚合
        Map<Integer, HourlyStats> hourlyStats = aggregateByHour(events);
        
        // 3. 计算趋势
        List<TrendPointDTO> trendPoints = calculateTrendPoints(hourlyStats);
        trend.setTrendPoints(trendPoints);
        
        // 4. 计算趋势方向
        TrendDirection direction = calculateTrendDirection(trendPoints);
        trend.setTrendDirection(direction);
        
        return trend;
    }
    
    /**
     * 异常分布计算
     */
    private AnomalyDistributionDTO calculateAnomalyDistribution() {
        AnomalyDistributionDTO distribution = new AnomalyDistributionDTO();
        
        // 1. 按生产线条目分布
        Map<String, Long> lineDistribution = getLineDistribution();
        distribution.setLineDistribution(lineDistribution);
        
        // 2. 按工序分布
        Map<String, Long> processDistribution = getProcessDistribution();
        distribution.setProcessDistribution(processDistribution);
        
        // 3. 按缺陷类型分布
        Map<String, Long> defectDistribution = getDefectDistribution();
        distribution.setDefectDistribution(defectDistribution);
        
        // 4. 按严重程度分布
        Map<String, Long> severityDistribution = getSeverityDistribution();
        distribution.setSeverityDistribution(severityDistribution);
        
        return distribution;
    }
}
```

---

## 总结

本详细实现规范为舜富QMS系统的报表分析与决策支持模块提供了:

1. **质量分析报表**: 质量日报/周报/月报、SPC过程能力分析、不良品分析
2. **质量成本分析**: 预防成本、鉴定成本、失败成本、外部失败成本核算与分析
3. **智能决策支持**: 智能问题识别、方案生成、风险评估、实施计划
4. **实时监控预警**: 实时质量事件处理、智能预警、实时看板
5. **趋势预测分析**: 历史趋势分析、未来预测、异常检测

所有实现采用微服务架构,支持大数据处理、机器学习、实时监控,为舜富压铸行业提供全方位的决策支持解决方案。
