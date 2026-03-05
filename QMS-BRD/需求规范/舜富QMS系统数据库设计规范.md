# 舜富QMS系统 - 数据库设计规范

## 1. 数据库架构总览

### 1.1 多数据库架构设计

根据QMS系统的业务特点，采用多数据库组合策略：

```
┌─────────────────────────────────────────────────────────────┐
│                     数据库架构层                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (主业务数据)                                       │
│  ├─ 用户权限管理                                               │
│  ├─ 基础主数据 (客户/供应商/物料)                               │
│  ├─ 业务流程数据 (APQP/PPAP/CAPA)                             │
│  ├─ 质量记录 (检验/审核/不合格品)                              │
│  └─ 系统配置与审计                                             │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (文档存储)                                            │
│  ├─ 知识库文档 (经验/案例/标准)                                │
│  ├─ 审核记录与附件                                             │
│  ├─ 8D报告详细内容                                            │
│  └─ 非结构化数据 (图片/视频/图纸)                              │
├─────────────────────────────────────────────────────────────┤
│  InfluxDB (时序数据)                                           │
│  ├─ 生产过程参数 (压力/温度/速度)                              │
│  ├─ SPC控制点数据                                             │
│  ├─ 设备实时监测数据                                           │
│  └─ MSA测量分析数据                                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 数据库命名规范

#### 1.2.1 PostgreSQL表命名
- 格式: `{模块}_{功能}_{实体}`
- 全部小写,使用下划线分隔
- 示例: `apqp_phase`, `ppap_approve_record`, `capa_root_cause`

#### 1.2.2 MongoDB集合命名
- 格式: `{模块}_{实体集合}`
- 驼峰命名法
- 示例: `KnowledgeBaseArticles`, `AuditRecords`, `EightDReports`

#### 1.2.3 InfluxDB命名
- 格式: `{模块}_{指标}`
- 示例: `production_process_params`, `spc_control_points`, `msa_gage_rr_results`

#### 1.2.4 字段命名规范
- PostgreSQL: snake_case
- MongoDB: camelCase
- InfluxDB: snake_case (tag/field区分)

---

## 2. PostgreSQL 数据库设计

### 2.1 核心表结构

#### 2.1.1 用户权限模块

```sql
-- 用户表
CREATE TABLE sys_user (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    department_id BIGINT,
    position VARCHAR(100),
    mobile_phone VARCHAR(20),
    email VARCHAR(100),
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, LOCKED
    last_login_time TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED'))
);

-- 部门表
CREATE TABLE sys_department (
    department_id BIGSERIAL PRIMARY KEY,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    parent_id BIGINT,
    level INTEGER DEFAULT 1,
    path VARCHAR(500),
    leader_id BIGINT,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE sys_role (
    role_id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_type VARCHAR(50), -- SYSTEM, BUSINESS, PROJECT
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE sys_permission (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50), -- MENU, BUTTON, API, DATA
    resource_path VARCHAR(255),
    parent_id BIGINT,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE sys_user_role (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- 角色权限关联表
CREATE TABLE sys_role_permission (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- 数据权限规则表
CREATE TABLE sys_data_permission (
    rule_id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    scope_type VARCHAR(50), -- ALL, DEPT, DEPT_AND_CHILD, SELF, CUSTOM
    scope_config JSONB,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 数据权限分配表
CREATE TABLE sys_role_data_permission (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    rule_id BIGINT NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE sys_user_session (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_ip VARCHAR(50),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expire_time TIMESTAMP NOT NULL
);

-- 操作审计表
CREATE TABLE sys_audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    operation VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    business_key VARCHAR(100),
    request_url TEXT,
    request_method VARCHAR(10),
    request_params JSONB,
    response_data JSONB,
    execute_time INTEGER, -- 执行时长(毫秒)
    client_ip VARCHAR(50),
    status VARCHAR(20), -- SUCCESS, FAILURE
    error_message TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.2 基础主数据模块

```sql
-- 客户主表
CREATE TABLE md_customer (
    customer_id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_type VARCHAR(50), -- AUTOMOTIVE, ELECTRONIC, MECHANICAL
    industry VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    tax_number VARCHAR(50),
    credit_level VARCHAR(20), -- A, B, C, D
    status VARCHAR(20) DEFAULT 'ACTIVE',
    sync_status VARCHAR(20) DEFAULT 'UNSYNCED', -- UNSYNCED, SYNCED, FAILED
    sync_time TIMESTAMP,
    erp_customer_id VARCHAR(50),
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 供应商主表
CREATE TABLE md_supplier (
    supplier_id BIGSERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_type VARCHAR(50), -- MATERIAL, SERVICE, BOTH
    qualification_level VARCHAR(50), -- A, B, C
    region VARCHAR(100),
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    business_license VARCHAR(100),
    quality_system VARCHAR(50), -- ISO9001, IATF16949, ISO14001
    status VARCHAR(20) DEFAULT 'ACTIVE',
    sync_status VARCHAR(20) DEFAULT 'UNSYNCED',
    sync_time TIMESTAMP,
    erp_supplier_id VARCHAR(50),
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 物料分类表
CREATE TABLE md_material_category (
    category_id BIGSERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    parent_id BIGINT,
    level INTEGER DEFAULT 1,
    path VARCHAR(500),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 物料主表
CREATE TABLE md_material (
    material_id BIGSERIAL PRIMARY KEY,
    material_code VARCHAR(50) UNIQUE NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    material_type VARCHAR(50), -- RAW, SEMI, FINISHED, AUXILIARY
    category_id BIGINT,
    specification VARCHAR(500),
    base_unit VARCHAR(20),
    material_group VARCHAR(50), -- ALUMINUM, ZINC, MAGNESIUM, STEEL
    grade VARCHAR(100),
    drawing_number VARCHAR(100),
    safety_stock NUMERIC(15,3),
    min_order_qty NUMERIC(15,3),
    inspection_level VARCHAR(20), -- NORMAL, TIGHTENED, RELAXED
    inspection_method VARCHAR(50), -- FULL, SAMPLING, SKIP
    aql_value VARCHAR(20),
    inspection_standard VARCHAR(100), -- MIL-STD-105E, ISO2859-1, GB/T2828.1
    critical CHARACTER(1), -- Y, N
    status VARCHAR(20) DEFAULT 'ACTIVE',
    sync_status VARCHAR(20) DEFAULT 'UNSYNCED',
    sync_time TIMESTAMP,
    erp_material_id VARCHAR(50),
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 供应商物料关联表
CREATE TABLE md_supplier_material (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    supplier_material_code VARCHAR(100),
    supplier_material_name VARCHAR(200),
    lead_time INTEGER, -- 交货周期(天)
    min_order_qty NUMERIC(15,3),
    quality_rating VARCHAR(20), -- A, B, C, D
    is_primary BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    approval_date TIMESTAMP,
    approval_by BIGINT,
    contract_start_date DATE,
    contract_end_date DATE,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_supplier_material UNIQUE (supplier_id, material_id)
);

-- 客户物料关联表
CREATE TABLE md_customer_material (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    customer_material_code VARCHAR(100),
    customer_material_name VARCHAR(200),
    project_code VARCHAR(50),
    drawing_number VARCHAR(100),
    revision VARCHAR(20),
    delivery_requirement VARCHAR(200),
    packaging_requirement TEXT,
    quality_requirement TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_material UNIQUE (customer_id, material_id)
);
```

#### 2.1.3 变化点管理模块

```sql
-- 变化点主表
CREATE TABLE cp_change_point (
    change_id BIGSERIAL PRIMARY KEY,
    change_number VARCHAR(50) UNIQUE NOT NULL,
    change_title VARCHAR(500) NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- MAN, MACHINE, MATERIAL, METHOD, ENV
    change_sub_type VARCHAR(100), -- 具体的变化子类型
    change_source VARCHAR(50), -- CUSTOMER_REQUEST, INTERNAL_IMPROVEMENT, SUPPLIER_CHANGE, CORRECTIVE_ACTION
    department_id BIGINT,
    requester_id BIGINT NOT NULL,
    request_date TIMESTAMP NOT NULL,
    planned_change_date DATE,
    change_category VARCHAR(50), -- MINOR, MODERATE, MAJOR, CRITICAL
    risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    business_impact TEXT,
    quality_impact TEXT,
    safety_impact TEXT,
    cost_impact NUMERIC(18,2),
    affected_products JSONB, -- 受影响的产品列表
    affected_processes JSONB, -- 受影响的工序列表
    affected_customers JSONB, -- 受影响的客户列表
    affected_suppliers JSONB, -- 受影响的供应商列表
    change_description TEXT NOT NULL,
    change_reason TEXT,
    change_plan TEXT,
    verification_plan TEXT,
    change_status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, IMPLEMENTED, CANCELLED
    approval_level VARCHAR(50), -- DEPT_MANAGER, QUALITY_MANAGER, DIRECTOR
    rejection_reason TEXT,
    implemented_date TIMESTAMP,
    verified_date TIMESTAMP,
    verification_result VARCHAR(20), -- PASS, FAIL, CONDITIONAL_PASS
    effectiveness_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 变化点附件表
CREATE TABLE cp_change_attachment (
    attachment_id BIGSERIAL PRIMARY KEY,
    change_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    upload_by BIGINT,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- 变化点影响分析表
CREATE TABLE cp_impact_analysis (
    analysis_id BIGSERIAL PRIMARY KEY,
    change_id BIGINT NOT NULL,
    impact_type VARCHAR(50) NOT NULL, -- QUALITY, COST, DELIVERY, SAFETY, ENVIRONMENT
    impact_description TEXT,
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    probability VARCHAR(20), -- RARE, OCCASIONAL, FREQUENT, CERTAIN
    risk_score INTEGER, -- 风险评分
    mitigation_measures TEXT,
    responsible_person_id BIGINT,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, CLOSED
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 变化点审批记录表
CREATE TABLE cp_approval_record (
    approval_id BIGSERIAL PRIMARY KEY,
    change_id BIGINT NOT NULL,
    approval_node VARCHAR(50) NOT NULL,
    approval_role VARCHAR(100) NOT NULL,
    approver_id BIGINT,
    approver_name VARCHAR(100),
    approval_decision VARCHAR(20), -- APPROVED, REJECTED, RETURNED
    approval_comment TEXT,
    approval_time TIMESTAMP,
    approval_level INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, SKIPPED
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 变化点实施记录表
CREATE TABLE cp_implementation_record (
    implementation_id BIGSERIAL PRIMARY KEY,
    change_id BIGINT NOT NULL,
    implement_step VARCHAR(200),
    step_description TEXT,
    responsible_id BIGINT,
    planned_date DATE,
    actual_date DATE,
    implementation_result TEXT,
    issues_encountered TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, DELAYED
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 变化点验证记录表
CREATE TABLE cp_verification_record (
    verification_id BIGSERIAL PRIMARY KEY,
    change_id BIGINT NOT NULL,
    verification_type VARCHAR(50), -- FUNCTIONAL_TEST, PERFORMANCE_TEST, QUALITY_INSPECTION
    verification_standard VARCHAR(200),
    verification_method TEXT,
    verification_result VARCHAR(20), -- PASS, FAIL, CONDITIONAL
    verification_data JSONB,
    sample_size INTEGER,
    inspector_id BIGINT,
    verification_date TIMESTAMP,
    findings TEXT,
    corrective_actions TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 变化点追溯表
CREATE TABLE cp_traceability (
    traceability_id BIGSERIAL PRIMARY KEY,
    change_id BIGINT NOT NULL,
    production_order_id VARCHAR(50),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    material_id BIGINT,
    customer_id BIGINT,
    product_serial_number VARCHAR(100),
    trace_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

#### 2.1.4 CAPA管理模块

```sql
-- CAPA主表
CREATE TABLE capa (
    capa_id BIGSERIAL PRIMARY KEY,
    capa_number VARCHAR(50) UNIQUE NOT NULL,
    capa_type VARCHAR(20) NOT NULL, -- CORRECTIVE, PREVENTIVE
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    source_type VARCHAR(50), -- CUSTOMER_COMPLAINT, INTERNAL_AUDIT, NONCONFORMANCE, TREND_ANALYSIS
    source_id BIGINT,
    source_number VARCHAR(50),
    department_id BIGINT,
    requester_id BIGINT NOT NULL,
    request_date TIMESTAMP NOT NULL,
    problem_description TEXT NOT NULL,
    problem_category VARCHAR(100),
    affected_area VARCHAR(200),
    capa_status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, CLOSED, CANCELLED
    priority VARCHAR(20), -- LOW, MEDIUM, HIGH, URGENT
    target_completion_date DATE,
    actual_completion_date DATE,
    effectiveness_verification VARCHAR(20), -- PENDING, PASSED, FAILED
    effectiveness_comment TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-问题分析表
CREATE TABLE capa_problem_analysis (
    analysis_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    analysis_method VARCHAR(50), -- FIVE_WHY, FISHBONE, FTA, 8D
    analysis_date TIMESTAMP,
    analyst_id BIGINT,
    analysis_content TEXT,
    attachments JSONB,
    root_cause_identified BOOLEAN DEFAULT FALSE,
    root_cause_description TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-5Why分析表
CREATE TABLE capa_five_why_analysis (
    five_why_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    analysis_order INTEGER NOT NULL, -- 第几个Why
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    verification_method TEXT,
    is_root_cause BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-鱼骨图分析表
CREATE TABLE capa_fishbone_analysis (
    fishbone_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL, -- MAN, MACHINE, MATERIAL, METHOD, MEASUREMENT, ENVIRONMENT
    factor TEXT NOT NULL,
    sub_factors JSONB,
    is_contributing_factor BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-FTA故障树分析表
CREATE TABLE capa_fta_analysis (
    fta_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    event_id VARCHAR(50),
    event_description TEXT NOT NULL,
    event_type VARCHAR(50), -- TOP_EVENT, INTERMEDIATE_EVENT, BASIC_EVENT
    parent_event_id BIGINT,
    logic_gate VARCHAR(20), -- AND, OR
    probability NUMERIC(10,4),
    consequence VARCHAR(200),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-纠正措施表
CREATE TABLE capa_corrective_action (
    corrective_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    action_number VARCHAR(50),
    action_description TEXT NOT NULL,
    action_type VARCHAR(50), -- IMMEDIATE, INTERMEDIATE, PERMANENT
    objective TEXT,
    target_date DATE NOT NULL,
    responsible_person_id BIGINT NOT NULL,
    department_id BIGINT,
    required_resources TEXT,
    budget NUMERIC(18,2),
    action_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, DELAYED
    completion_date DATE,
    completion_report TEXT,
    verification_status VARCHAR(20), -- PENDING, PASSED, FAILED
    verifier_id BIGINT,
    verification_date TIMESTAMP,
    effectiveness_rating VARCHAR(20), -- EFFECTIVE, PARTIALLY_EFFECTIVE, NOT_EFFECTIVE
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-预防措施表
CREATE TABLE capa_preventive_action (
    preventive_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    action_number VARCHAR(50),
    action_description TEXT NOT NULL,
    risk_description TEXT,
    objective TEXT,
    target_date DATE NOT NULL,
    responsible_person_id BIGINT NOT NULL,
    department_id BIGINT,
    required_resources TEXT,
    budget NUMERIC(18,2),
    action_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, DELAYED
    completion_date DATE,
    completion_report TEXT,
    verification_status VARCHAR(20), -- PENDING, PASSED, FAILED
    verifier_id BIGINT,
    verification_date TIMESTAMP,
    effectiveness_rating VARCHAR(20), -- EFFECTIVE, PARTIALLY_EFFECTIVE, NOT_EFFECTIVE
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-有效性验证表
CREATE TABLE capa_effectiveness_verification (
    verification_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    verification_type VARCHAR(50), -- MONITORING, AUDIT, METRIC_REVIEW
    verification_period_start DATE,
    verification_period_end DATE,
    verification_method TEXT,
    verification_criteria TEXT,
    data_collected JSONB,
    analysis_result TEXT,
    effectiveness_score NUMERIC(5,2), -- 0-100
    effectiveness_level VARCHAR(20), -- EXCELLENT, GOOD, SATISFACTORY, POOR
    verifier_id BIGINT,
    verification_date TIMESTAMP,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_actions TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-任务分配表
CREATE TABLE capa_task (
    task_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    task_number VARCHAR(50),
    task_title VARCHAR(500) NOT NULL,
    task_description TEXT,
    task_type VARCHAR(50), -- INVESTIGATION, IMPLEMENTATION, VERIFICATION, DOCUMENTATION
    priority VARCHAR(20), -- LOW, MEDIUM, HIGH, URGENT
    assignee_id BIGINT NOT NULL,
    department_id BIGINT,
    planned_start_date DATE,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    task_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
    progress NUMERIC(5,2), -- 0-100
    completion_report TEXT,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA-成本记录表
CREATE TABLE capa_cost (
    cost_id BIGSERIAL PRIMARY KEY,
    capa_id BIGINT NOT NULL,
    cost_category VARCHAR(50), -- LABOR, MATERIAL, EQUIPMENT, LOST_PRODUCTIVITY, OPPORTUNITY_COST
    cost_description TEXT,
    estimated_cost NUMERIC(18,2),
    actual_cost NUMERIC(18,2),
    currency VARCHAR(10) DEFAULT 'CNY',
    cost_date DATE,
    recorded_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.5 QRQC快速响应质量控制模块

```sql
-- QRQC事件主表
CREATE TABLE qrqc_event (
    event_id BIGSERIAL PRIMARY KEY,
    event_number VARCHAR(50) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- QUALITY_ISSUE, CUSTOMER_COMPLAINT, PROCESS_DEVIATION
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    detection_time TIMESTAMP NOT NULL,
    detection_location VARCHAR(200),
    detection_person_id BIGINT NOT NULL,
    detection_department_id BIGINT,
    event_description TEXT NOT NULL,
    immediate_impact TEXT,
    affected_product VARCHAR(200),
    affected_batch VARCHAR(100),
    affected_quantity INTEGER,
    customer_id BIGINT,
    work_order_id VARCHAR(50),
    process_step VARCHAR(100),
    event_category VARCHAR(100),
    qrqc_status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CONTAINED, INVESTIGATING, RESOLVED, CLOSED
    response_team_id BIGINT,
    team_leader_id BIGINT,
    response_target_time TIMESTAMP, -- 响应目标时间(24小时内)
    actual_response_time TIMESTAMP,
    containment_target_time TIMESTAMP, -- 围堵目标时间
    actual_containment_time TIMESTAMP,
    investigation_target_time TIMESTAMP,
    actual_investigation_time TIMESTAMP,
    resolution_target_time TIMESTAMP,
    actual_resolution_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC团队组建表
CREATE TABLE qrqc_team (
    team_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    team_name VARCHAR(200),
    team_leader_id BIGINT NOT NULL,
    formation_time TIMESTAMP,
    team_members JSONB, -- 成员列表及角色
    meeting_location VARCHAR(200),
    meeting_time TIMESTAMP,
    meeting_notes TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC团队成员表
CREATE TABLE qrqc_team_member (
    member_id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50), -- LEADER, QUALITY, ENGINEERING, PRODUCTION, MAINTENANCE
    responsibility TEXT,
    contact_phone VARCHAR(20),
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC现场调查记录表
CREATE TABLE qrqc_investigation (
    investigation_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    investigation_date TIMESTAMP,
    investigator_id BIGINT,
    investigation_location VARCHAR(200),
    investigation_type VARCHAR(50), -- ON_SITE, DOCUMENT_REVIEW, INTERVIEW
    findings TEXT NOT NULL,
    evidence_collected JSONB, -- 收集的证据列表
    photos_json JSONB, -- 照片路径
    witnesses JSONB, -- 目击者信息
    preliminary_cause TEXT,
    next_steps TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC围堵措施表
CREATE TABLE qrqc_containment (
    containment_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    containment_number VARCHAR(50),
    containment_description TEXT NOT NULL,
    containment_type VARCHAR(50), -- INSPECTION, SEGREGATION, REWORK, SCRAP
    affected_product VARCHAR(200),
    affected_batch VARCHAR(100),
    affected_quantity INTEGER,
    quarantine_location VARCHAR(200),
    inspection_method TEXT,
    sample_size INTEGER,
    inspected_quantity INTEGER,
    nonconforming_quantity INTEGER,
    responsible_person_id BIGINT NOT NULL,
    planned_date DATE,
    actual_date DATE,
    containment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
    completion_report TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC时间线记录表
CREATE TABLE qrqc_timeline (
    timeline_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    event_time TIMESTAMP NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- DETECTION, REPORTING, TEAM_FORMATION, INVESTIGATION, CONTAINMENT, RESOLUTION
    event_description TEXT,
    actor_id BIGINT,
    action_taken TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC24小时响应跟踪表
CREATE TABLE qrqc_24h_tracking (
    tracking_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    milestone VARCHAR(50) NOT NULL, -- REPORTING_1H, TEAM_ASSEMBLY_4H, INVESTIGATION_12H, CONTAINMENT_24H
    planned_time TIMESTAMP NOT NULL,
    actual_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACHIEVED, DELAYED, MISSED
    delay_reason TEXT,
    responsible_person_id BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QRQC围堵效果跟踪表
CREATE TABLE qrqc_containment_effect (
    effect_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    containment_id BIGINT,
    effect_type VARCHAR(50), -- CUSTOMER_NOTIFIED, PRODUCT_ISOLATED, REWORK_COMPLETED, SCRAP_PROCESSED
    effect_description TEXT,
    affected_quantity INTEGER,
    customer_impact TEXT,
    financial_impact NUMERIC(18,2),
    verification_date TIMESTAMP,
    verified_by BIGINT,
    status VARCHAR(20) DEFAULT 'VERIFIED',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. MongoDB 集合设计

### 3.1 知识库集合 (Knowledge Base)

```javascript
// 知识库文章集合
db.createCollection("KnowledgeBaseArticles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["articleId", "title", "category", "content", "createdBy", "createdTime"],
      properties: {
        articleId: { bsonType: "string" },
        title: { bsonType: "string" },
        summary: { bsonType: "string" },
        category: { bsonType: "string", enum: ["EXPERIENCE", "BEST_PRACTICE", "FAILURE_CASE", "LESSON_LEARNED", "KNOWLEDGE_SHARING"] },
        subCategory: { bsonType: "string" },
        tags: { bsonType: "array", items: { bsonType: "string" } },
        content: { bsonType: "string" },
        attachments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              fileName: { bsonType: "string" },
              filePath: { bsonType: "string" },
              fileType: { bsonType: "string" },
              fileSize: { bsonType: "long" }
            }
          }
        },
        relatedArticles: { bsonType: "array", items: { bsonType: "string" } },
        viewCount: { bsonType: "int", default: 0 },
        rating: { bsonType: "decimal", default: 0.0 },
        ratingCount: { bsonType: "int", default: 0 },
        comments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              commentId: { bsonType: "string" },
              userId: { bsonType: "long" },
              userName: { bsonType: "string" },
              content: { bsonType: "string" },
              commentTime: { bsonType: "date" },
              parentId: { bsonType: "string" }
            }
          }
        },
        approvalStatus: { bsonType: "string", enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"] },
        approverId: { bsonType: "long" },
        approvalTime: { bsonType: "date" },
        createdBy: { bsonType: "long" },
        createdTime: { bsonType: "date" },
        updatedBy: { bsonType: "long" },
        updatedTime: { bsonType: "date" },
        status: { bsonType: "string", enum: ["ACTIVE", "INACTIVE", "ARCHIVED"], default: "ACTIVE" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// 索引创建
db.KnowledgeBaseArticles.createIndex({ articleId: 1 }, { unique: true });
db.KnowledgeBaseArticles.createIndex({ category: 1, subCategory: 1 });
db.KnowledgeBaseArticles.createIndex({ tags: 1 });
db.KnowledgeBaseArticles.createIndex({ title: "text", content: "text", summary: "text" });
db.KnowledgeBaseArticles.createIndex({ createdTime: -1 });
db.KnowledgeBaseArticles.createIndex({ createdBy: 1, createdTime: -1 });
```

### 3.2 8D报告集合 (8D Reports)

```javascript
// 8D报告主集合
db.createCollection("EightDReports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reportId", "reportNumber", "complaintSource", "createdBy", "createdTime"],
      properties: {
        reportId: { bsonType: "string" },
        reportNumber: { bsonType: "string" },
        complaintSource: { bsonType: "string", enum: ["CUSTOMER", "INTERNAL", "SUPPLIER", "REGULATORY"] },
        customerId: { bsonType: "long" },
        supplierId: { bsonType: "long" },
        problemDescription: { bsonType: "string" },
        detectionDate: { bsonType: "date" },
        severity: { bsonType: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
        priority: { bsonType: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
        
        // D1: 成立小组
        teamLeaderId: { bsonType: "long" },
        teamMembers: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              userId: { bsonType: "long" },
              userName: { bsonType: "string" },
              role: { bsonType: "string" },
              responsibility: { bsonType: "string" }
            }
          }
        },
        
        // D2: 问题描述
        problemStatement: { bsonType: "string" },
        what5W2H: {
          bsonType: "object",
          properties: {
            what: { bsonType: "string" },
            who: { bsonType: "string" },
            where: { bsonType: "string" },
            when: { bsonType: "string" },
            why: { bsonType: "string" },
            how: { bsonType: "string" },
            howMany: { bsonType: "string" }
          }
        },
        
        // D3: 临时围堵措施
        containmentActions: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              actionId: { bsonType: "string" },
              actionDescription: { bsonType: "string" },
              responsibleId: { bsonType: "long" },
              targetDate: { bsonType: "date" },
              actualDate: { bsonType: "date" },
              effectiveness: { bsonType: "string" }
            }
          }
        },
        
        // D4: 根本原因分析
        rootCauseAnalysis: {
          bsonType: "object",
          properties: {
            analysisMethod: { bsonType: "string" },
            directCause: { bsonType: "string" },
            rootCause: { bsonType: "string" },
            contributingFactors: { bsonType: "array", items: { bsonType: "string" } },
            fiveWhys: { bsonType: "array", items: { bsonType: "object" } },
            fishbone: { bsonType: "object" }
          }
        },
        
        // D5: 永久纠正措施
        permanentCorrectiveActions: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              actionId: { bsonType: "string" },
              actionDescription: { bsonType: "string" },
              responsibleId: { bsonType: "long" },
              targetDate: { bsonType: "date" },
              actualDate: { bsonType: "date" },
              effectiveness: { bsonType: "string" }
            }
          }
        },
        
        // D6: 实施纠正措施
        implementationStatus: { bsonType: "string" },
        implementationEvidence: { bsonType: "array", items: { bsonType: "string" } },
        
        // D7: 预防再发生措施
        preventiveActions: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              actionId: { bsonType: "string" },
              actionDescription: { bsonType: "string" },
              responsibleId: { bsonType: "long" },
              targetDate: { bsonType: "date" },
              actualDate: { bsonType: "date" },
              type: { bsonType: "string", enum: ["SYSTEM_UPDATE", "TRAINING", "DOCUMENTATION", "PROCESS_CHANGE"] }
            }
          }
        },
        
        // D8: 小组祝贺
        teamRecognition: { bsonType: "string" },
        lessonsLearned: { bsonType: "string" },
        financialImpact: { bsonType: "decimal" },
        customerNotified: { bsonType: "bool" },
        notificationDate: { bsonType: "date" },
        
        reportStatus: { bsonType: "string", enum: ["DRAFT", "IN_PROGRESS", "COMPLETED", "VERIFIED", "CLOSED"] },
        targetCompletionDate: { bsonType: "date" },
        actualCompletionDate: { bsonType: "date" },
        verifierId: { bsonType: "long" },
        verificationDate: { bsonType: "date" },
        
        createdBy: { bsonType: "long" },
        createdTime: { bsonType: "date" },
        updatedBy: { bsonType: "long" },
        updatedTime: { bsonType: "date" },
        
        attachments: { bsonType: "array", items: { bsonType: "string" } },
        status: { bsonType: "string", enum: ["ACTIVE", "INACTIVE", "ARCHIVED"], default: "ACTIVE" }
      }
    }
  }
});

// 索引
db.EightDReports.createIndex({ reportId: 1 }, { unique: true });
db.EightDReports.createIndex({ reportNumber: 1 }, { unique: true });
db.EightDReports.createIndex({ customerId: 1 });
db.EightDReports.createIndex({ complaintSource: 1 });
db.EightDReports.createIndex({ reportStatus: 1 });
db.EightDReports.createIndex({ detectionDate: -1 });
```

### 3.3 审核记录集合 (Audit Records)

```javascript
// 审核记录集合
db.createCollection("AuditRecords", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["auditId", "auditType", "auditDate", "createdTime"],
      properties: {
        auditId: { bsonType: "string" },
        auditNumber: { bsonType: "string" },
        auditType: { bsonType: "string", enum: ["INTERNAL", "EXTERNAL", "SUPPLIER", "SECOND_PARTY", "LPA", "PRODUCT"] },
        auditSubType: { bsonType: "string" },
        auditCategory: { bsonType: "string" },
        
        // 审核计划信息
        plannedStartDate: { bsonType: "date" },
        plannedEndDate: { bsonType: "date" },
        actualStartDate: { bsonType: "date" },
        actualEndDate: { bsonType: "date" },
        auditLocation: { bsonType: "string" },
        
        // 审核团队
        auditTeam: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              auditorId: { bsonType: "long" },
              auditorName: { bsonType: "string" },
              role: { bsonType: "string" }, // LEAD_AUDITOR, AUDITOR, OBSERVER
              qualifications: { bsonType: "string" }
            }
          }
        },
        leadAuditorId: { bsonType: "long" },
        
        // 审核范围
        auditScope: { bsonType: "string" },
        departments: { bsonType: "array", items: { bsonType: "string" } },
        processes: { bsonType: "array", items: { bsonType: "string" } },
        standards: { bsonType: "array", items: { bsonType: "string" }, default: ["IATF16949"] },
        
        // 审核发现
        findings: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              findingId: { bsonType: "string" },
              clause: { bsonType: "string" },
              findingType: { bsonType: "string", enum: ["MAJOR_NC", "MINOR_NC", "OPPORTUNITY_IMPROVEMENT", "STRENGTH"] },
              description: { bsonType: "string" },
              evidence: { bsonType: "string" },
              severity: { bsonType: "string" },
              responsibleDepartment: { bsonType: "string" },
              rootCauseAnalysis: { bsonType: "string" },
              correctiveAction: { bsonType: "string" },
              targetDate: { bsonType: "date" },
              verificationDate: { bsonType: "date" },
              status: { bsonType: "string", enum: ["OPEN", "IN_PROGRESS", "CLOSED"] }
            }
          }
        },
        
        // 审核结果
        overallRating: { bsonType: "string", enum: ["EXCELLENT", "GOOD", "SATISFACTORY", "NEEDS_IMPROVEMENT", "POOR"] },
        totalFindings: { bsonType: "int" },
        majorNCCount: { bsonType: "int" },
        minorNCCount: { bsonType: "int" },
        opportunityCount: { bsonType: "int" },
        strengthCount: { bsonType: "int" },
        
        // LPA特有字段
        lpaLayer: { bsonType: "string", enum: ["OPERATOR", "SUPERVISOR", "MANAGER", "EXECUTIVE"] },
        lpaFrequency: { bsonType: "string", enum: ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"] },
        lpaScore: { bsonType: "decimal" },
        lpaProcessArea: { bsonType: "string" },
        
        auditStatus: { bsonType: "string", enum: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CLOSED"] },
        auditorSignature: { bsonType: "string" },
        auditeeSignature: { bsonType: "string" },
        approvalDate: { bsonType: "date" },
        
        createdBy: { bsonType: "long" },
        createdTime: { bsonType: "date" },
        updatedBy: { bsonType: "long" },
        updatedTime: { bsonType: "date" },
        
        attachments: { bsonType: "array", items: { bsonType: "string" } },
        comments: { bsonType: "array", items: { bsonType: "object" } }
      }
    }
  }
});

// 索引
db.AuditRecords.createIndex({ auditId: 1 }, { unique: true });
db.AuditRecords.createIndex({ auditType: 1, auditDate: -1 });
db.AuditRecords.createIndex({ auditStatus: 1 });
db.AuditRecords.createIndex({ lpaLayer: 1 });
db.AuditRecords.createIndex({ leadAuditorId: 1 });
```

---

## 4. InfluxDB 数据设计

### 4.1 生产过程参数 (Production Process Parameters)

```sql
-- 生产过程参数测量点
CREATE MEASUREMENT production_process_params (
  time TIMESTAMP,
  equipment_id TAG,
  process_step TAG,
  parameter_name TAG,
  parameter_type TAG, -- PRESSURE, TEMPERATURE, SPEED, CYCLE_TIME, VACUUM
  material_type TAG, -- ALUMINUM, ZINC, MAGNESIUM
  batch_number TAG,
  work_order_id TAG,
  
  parameter_value FIELD(REAL),
  min_threshold FIELD(REAL),
  max_threshold FIELD(REAL),
  unit TAG,
  is_abnormal TAG,
  
  operator_id TAG,
  production_line TAG
);

-- 索引策略
CREATE INDEX ON production_process_params(time);
CREATE INDEX ON production_process_params(equipment_id);
CREATE INDEX ON production_process_params(batch_number);
CREATE INDEX ON production_process_params(work_order_id);
```

### 4.2 SPC控制点数据 (SPC Control Points)

```sql
-- SPC控制点数据
CREATE MEASUREMENT spc_control_points (
  time TIMESTAMP,
  control_point_id TAG,
  characteristic_id TAG,
  part_number TAG,
  process_step TAG,
  measurement_type TAG, -- DIMENSION, WEIGHT, HARDNESS, SURFACE_ROUGHNESS
  instrument_id TAG,
  operator_id TAG,
  shift TAG,
  
  sample_number FIELD(INTEGER),
  measurement_value FIELD(REAL),
  subgroup_size FIELD(INTEGER),
  
  -- 控制限
  lsl FIELD(REAL), -- 规格下限
  usl FIELD(REAL), -- 规格上限
  lcl FIELD(REAL), -- 控制下限
  ucl FIELD(REAL), -- 控制上限
  nominal FIELD(REAL), -- 目标值
  
  -- 异常标识
  out_of_control TAG,
  violation_type TAG, -- ONE_POINT_BEYOND_3SIGMA, SIX_POINTS_TREND, FOUR_OUT_OF_FIVE_POINTS, etc.
  
  batch_number TAG,
  work_order_id TAG
);

-- 索引
CREATE INDEX ON spc_control_points(time);
CREATE INDEX ON spc_control_points(control_point_id);
CREATE INDEX ON spc_control_points(characteristic_id);
CREATE INDEX ON spc_control_points(batch_number);
```

### 4.3 MSA测量分析数据 (MSA Measurement Analysis)

```sql
-- MSA测量数据
CREATE MEASUREMENT msa_measurement_data (
  time TIMESTAMP,
  msa_study_id TAG,
  study_type TAG, -- GR_R, BIAS, LINEARITY, STABILITY
  gage_id TAG,
  operator_id TAG,
  part_id TAG,
  measurement_trial TAG, -- 试验次数
  trial_number FIELD(INTEGER),
  
  measurement_value FIELD(REAL),
  true_value FIELD(REAL), -- 用于偏倚和线性研究
  deviation FIELD(REAL),
  
  sample_number FIELD(INTEGER),
  characteristic_name TAG,
  
  -- Gage R&R计算结果
  total_variance FIELD(REAL),
  equipment_variance FIELD(REAL),
  appraiser_variance FIELD(REAL),
  part_to_part_variance FIELD(REAL),
  
  -- MSA指标
  ev FIELD(REAL), -- Equipment Variation (repeatability)
  av FIELD(REAL), -- Appraiser Variation (reproducibility)
  grr FIELD(REAL), -- Gage R&R
  ndc FIELD(INTEGER), -- Number of Distinct Categories
  pv FIELD(REAL), -- Part Variation
  tv FIELD(REAL), -- Total Variation
  
  study_status TAG, -- IN_PROGRESS, COMPLETED
  analyst_id TAG
);

-- 索引
CREATE INDEX ON msa_measurement_data(time);
CREATE INDEX ON msa_measurement_data(msa_study_id);
CREATE INDEX ON msa_measurement_data(study_type);
CREATE INDEX ON msa_measurement_data(gage_id);
```

### 4.4 设备实时监测数据 (Equipment Monitoring)

```sql
-- 设备实时监测
CREATE MEASUREMENT equipment_monitoring (
  time TIMESTAMP,
  equipment_id TAG,
  equipment_type TAG, -- DIE_CASTING_MACHINE, ROBOT, CONVEYOR, FURNACE
  equipment_status TAG, -- RUNNING, STOPPED, IDLE, ERROR, MAINTENANCE
  
  -- 运行参数
  temperature FIELD(REAL),
  pressure FIELD(REAL),
  vibration FIELD(REAL),
  current FIELD(REAL),
  voltage FIELD(REAL),
  speed FIELD(REAL),
  
  -- 生产数据
  cycle_time FIELD(REAL),
  shot_count FIELD(INTEGER),
  cavity_count FIELD(INTEGER),
  
  -- 维护信息
  last_maintenance_time TIMESTAMP,
  next_maintenance_time TIMESTAMP,
  maintenance_type TAG,
  
  -- 报警
  alarm_code TAG,
  alarm_level TAG, -- INFO, WARNING, ERROR, CRITICAL
  alarm_message TAG,
  
  operator_id TAG,
  production_line TAG,
  work_order_id TAG
);

-- 索引
CREATE INDEX ON equipment_monitoring(time);
CREATE INDEX ON equipment_monitoring(equipment_id);
CREATE INDEX ON equipment_monitoring(equipment_status);
CREATE INDEX ON equipment_monitoring(alarm_level);
```

---

## 5. 数据迁移策略

### 5.1 数据迁移原则

1. **数据完整性**: 确保迁移过程中数据不丢失、不损坏
2. **业务连续性**: 采用渐进式迁移,确保业务不中断
3. **回滚机制**: 每个阶段都有明确的回滚方案
4. **数据验证**: 迁移后进行全面的数据质量检查

### 5.2 数据迁移步骤

```sql
-- 1. 现有系统数据评估
-- 2. 数据映射和转换规则定义
-- 3. 测试环境迁移验证
-- 4. 生产环境分批迁移
-- 5. 数据校验和一致性检查
-- 6. 切换和性能监控
```

### 5.3 与现有系统集成

```sql
-- ERP系统集成视图
CREATE VIEW v_erp_integration_material AS
SELECT 
    m.material_id,
    m.material_code,
    m.material_name,
    m.category_id,
    mc.category_name,
    m.base_unit,
    m.material_group,
    m.status,
    m.sync_status,
    m.erp_material_id,
    m.sync_time
FROM md_material m
LEFT JOIN md_material_category mc ON m.category_id = mc.category_id
WHERE m.sync_status = 'UNSYNCED';

-- MES集成视图
CREATE VIEW v_mes_integration_production AS
SELECT 
    p.production_order_id,
    p.work_order_id,
    p.material_id,
    m.material_name,
    p.plan_quantity,
    p.actual_quantity,
    p.status,
    p.start_time,
    p.end_time
FROM production_order p
LEFT JOIN md_material m ON p.material_id = m.material_id
WHERE p.status IN ('IN_PROGRESS', 'COMPLETED');
```

---

## 6. 数据备份与恢复策略

### 6.1 备份策略

| 数据库 | 备份类型 | 频率 | 保留期 |
|--------|---------|------|--------|
| PostgreSQL | 全量 + 增量 | 全量:每天, 增量:每小时 | 全量:30天, 增量:7天 |
| MongoDB | 副本集 + 全量 | 全量:每天 | 30天 |
| InfluxDB | 持续备份 + 快照 | 持续备份, 快照:每天 | 快照:7天 |

### 6.2 灾难恢复方案

```
主数据中心 (上海)
  ↓ 实时同步
备数据中心 (苏州)
  ↓ 定期备份
异地容灾中心 (北京)
```

---

## 7. 数据安全与访问控制

### 7.1 数据加密

- **传输加密**: TLS 1.3
- **存储加密**: AES-256
- **字段加密**: 敏感字段 (密码、身份证等) 使用字段级加密

### 7.2 访问审计

所有数据访问操作记录到 `sys_audit_log` 表,包括:
- 数据查询
- 数据修改
- 数据删除
- 导出操作

### 7.3 数据脱敏

敏感数据在查询时自动脱敏:
- 手机号: 138****5678
- 身份证: 330***********1234
- 邮箱: user***@domain.com

---

## 8. 性能优化建议

### 8.1 索引策略

1. **PostgreSQL**:
   - 主键索引: 所有表都有主键
   - 外键索引: 所有外键字段
   - 查询索引: 根据高频查询创建复合索引
   - 全文检索: 文本字段创建GIN索引

2. **MongoDB**:
   - 单字段索引: 常用查询字段
   - 复合索引: 多条件查询
   - 全文索引: 标题、内容等文本字段
   - 地理索引: 如有地理位置需求

3. **InfluxDB**:
   - Tag索引: 自动创建
   - 时间索引: 自动创建
   - 复合Tag索引: 根据查询模式优化

### 8.2 分库分表策略

对于大数据量表,采用分库分表策略:

| 表名 | 分表策略 | 分表字段 |
|------|---------|---------|
| sys_audit_log | 按月分表 | created_time |
| production_process_params | 按月分表 | time |
| spc_control_points | 按季度分表 | time |

### 8.3 数据归档策略

历史数据定期归档:
- 超过1年的生产数据 → 归档库
- 超过2年的审计日志 → 冷存储
- 超过3年的SPC数据 → 压缩存储

---

## 9. 数据字典

### 9.1 通用状态值

| 类别 | 值 | 说明 |
|------|-----|------|
| 用户状态 | ACTIVE, INACTIVE, LOCKED | 用户账户状态 |
| 流程状态 | DRAFT, PENDING, APPROVED, REJECTED, CANCELLED | 通用流程状态 |
| 优先级 | LOW, MEDIUM, HIGH, URGENT | 任务优先级 |
| 严重性 | LOW, MEDIUM, HIGH, CRITICAL | 问题严重性 |
| 数据状态 | ACTIVE, INACTIVE, ARCHIVED | 数据记录状态 |

### 9.2 质量相关状态

| 类别 | 值 | 说明 |
|------|-----|------|
| 检验结果 | ACCEPT, REJECT, CONDITIONAL_ACCEPT | 检验判定 |
| 风险等级 | LOW, MEDIUM, HIGH, CRITICAL | 风险等级 |
| 质量等级 | A, B, C, D | 质量/供应商等级 |
| 抽样标准 | NORMAL, TIGHTENED, RELAXED | 抽样严格程度 |

---

## 10. 数据库维护计划

### 10.1 定期维护任务

| 任务 | 频率 | 责任人 |
|------|------|--------|
| 数据库性能监控 | 每日 | DBA |
| 索引优化 | 每周 | DBA |
| 统计信息更新 | 每周 | DBA |
| 空间清理 | 每月 | DBA |
| 备份验证 | 每月 | DBA |
| 容灾演练 | 每季度 | DBA + IT |

### 10.2 容量规划

| 数据库 | 当前容量 | 年增长率 | 3年后预估 |
|--------|---------|---------|-----------|
| PostgreSQL | 500GB | 50% | 1.7TB |
| MongoDB | 200GB | 80% | 1.5TB |
| InfluxDB | 300GB | 100% | 2.4TB |

---

## 总结

本数据库设计规范为舜富QMS系统提供了完整的数据架构设计,包括:

1. **PostgreSQL**: 50+张核心业务表,覆盖所有功能模块
2. **MongoDB**: 3个核心集合,用于文档型数据存储
3. **InfluxDB**: 4个核心measurement,用于时序数据存储
4. **数据安全**: 加密、脱敏、审计、备份恢复机制
5. **性能优化**: 索引、分库分表、归档策略
6. **运维保障**: 维护计划、容量规划

数据库设计遵循IATF16949质量管理体系要求,充分考虑压铸行业的特点,支持从原材料到成品的全流程质量追溯。
