# Project Context

## Purpose
舜富QMS系统是基于JNPF微服务架构框架构建的汽车行业企业级质量管理系统，严格遵循IATF16949:2016标准，旨在为汽车制造业提供全面、合规、智能的质量管理解决方案。

### 核心目标
- **体系合规数字化**：完全符合IATF16949:2016标准要求的数字化质量管理体系
- **全流程质量控制**：从供应商管理、进货检验、过程控制到成品交付的全流程质量管控
- **风险预防为主**：基于风险的思维，建立预防式的质量控制和管理机制
- **数据驱动改进**：通过SPC、MSA等工具实现数据化的质量分析和持续改进
- **供应链协同优化**：与供应商、客户深度协同，构建高质量供应链生态

### 业务价值
- **降低质量成本**：通过有效的预防和控制，减少不合格品和返工成本
- **提升产品质量**：基于IATF16949体系，稳定提升产品可靠性和一致性
- **确保客户满意**：快速响应客户需求，提高交付质量和问题解决效率
- **支持合规认证**：满足IATF16949认证要求，支持法规符合性证明
- **促进持续改进**：建立基于数据的持续改进机制，推动质量文化落地

### 发展愿景
构建智能制造时代的数字化平台，助力企业实现智能化、精细化和服务化。

## Tech Stack

### 前端技术栈
- **核心框架**：Vue 3 + TypeScript + Vite
- **构建工具**：Turbo + pnpm (monorepo架构)
- **UI框架**：Vben Admin企业级管理后台（复用主框架）
- **状态管理**：Pinia (Vue 3推荐的状态管理方案)
- **路由管理**：Vue Router 4
- **HTTP客户端**：Axios
- **组件库**：
  - @vnpf/ui：Vben Admin组件库（表格、表单、弹窗等）
  - Element Plus：基础UI组件
  - 自定义业务组件
- **样式框架**：SCSS + Tailwind CSS
- **代码工具**：ESLint + Prettier + TypeScript
- **QMS开发工具**：
  - 表格组件：@vnpf/ui/vxeTable（标准化数据表格）
  - Hooks：@vnpf/hooks（useVxeTable、useFlowState等）
  - API管理：统一API接口封装
  - 权限控制：基于角色的菜单和按钮权限

### 后端技术栈
- **核心框架**：Spring Cloud 2022 + Spring Boot 3.x
- **微服务架构**：QMS业务集中在sot-qm模块，采用Maven多模块结构
- **微服务框架**：Spring Cloud Alibaba
- **服务注册**：Nacos
- **服务调用**：OpenFeign（FeignClient接口定义）
- **网关**：Spring Cloud Gateway
- **数据库**：MySQL + MyBatis-Plus + Redis
- **安全框架**：Spring Security + OAuth2.0 + JWT（复用主框架）
- **消息队列**：RabbitMQ
- **任务调度**：Spring Task + Quartz
- **缓存**：Redis
- **搜索引擎**：Elasticsearch
- **文档管理**：MinIO
- **监控**：Spring Boot Actuator + Micrometer
- **QMS专用组件**：
  - API层：FeignClient接口定义（如ContractApi）
  - 业务层：标准Service + Mapper架构
  - 实体层：JPA实体映射
  - 控制器层：RESTful API接口

### 开发与部署工具
- **版本控制**：Git
- **项目管理**：Maven
- **容器化**：Docker + Docker Compose
- **CI/CD**：Jenkins/GitLab CI
- **API文档**：Swagger/OpenAPI 3.0
- **日志管理**：Logback + ELK Stack

## Development Guidelines

### 前端开发模式

#### 标准页面开发结构
基于extend/order示例，QMS页面开发应遵循以下标准模式：

```vue
<script lang="ts" setup>
import type { ActionItem, BasicColumn } from '@jnpf/ui/vxeTable';
import { ref } from 'vue';
import { useMessage } from '@jnpf/hooks';
import { usePopup } from '@jnpf/ui/popup';
import { BasicVxeTable, TableAction, useVxeTable } from '@jnpf/ui/vxeTable';
import { useFlowState } from '#/hooks/flow/useFlowStatus';
import { $t } from '#/locales';
import FlowParser from '#/views/workFlow/components/FlowParser.vue';

// 组件定义
defineOptions({ name: 'QmsSupplierManagement' });

// 状态管理
const { createMessage } = useMessage();
const { getFlowStatusContent, getFlowStatusColor } = useFlowState();
const [registerFlowParser, { openPopup: openFlowParser }] = usePopup();

// 表格列定义
const columns: BasicColumn[] = [
  { title: '供应商编码', dataIndex: 'supplierCode', width: 120 },
  { title: '供应商名称', dataIndex: 'supplierName', width: 180 },
  { title: '资质等级', dataIndex: 'qualificationLevel', width: 100 },
  { title: '绩效评分', dataIndex: 'performanceScore', width: 100 },
  { title: '审核状态', dataIndex: 'auditStatus', width: 100, slots: { default: 'auditStatus' } },
  { title: '创建时间', dataIndex: 'createTime', width: 150, format: 'date|YYYY-MM-DD HH:mm:ss' },
];

// 搜索表单配置
const [registerTable, { reload }] = useVxeTable({
  api: getSupplierList,
  columns,
  searchInfo: { flowId: '默认流程ID' },
  useSearchForm: true,
  formConfig: {
    schemas: [
      {
        field: 'keyword',
        label: $t('common.keyword'),
        component: 'Input',
        componentProps: { placeholder: $t('common.enterKeyword') },
      },
      {
        field: 'dateRange',
        label: '创建时间',
        component: 'DateRange',
        componentProps: {
          format: 'YYYY-MM-DD HH:mm:ss',
          placeholder: ['开始时间', '结束时间'],
        },
      },
    ],
    fieldMapToTime: [['dateRange', ['startTime', 'endTime']]],
  },
});

// 操作按钮定义
function getTableActions(record): ActionItem[] {
  return [
    {
      label: $t('common.editText'),
      onClick: handleEdit.bind(null, record),
    },
    {
      label: $t('common.detailText'),
      onClick: handleView.bind(null, record),
    },
    {
      label: '审核',
      onClick: handleAudit.bind(null, record),
    },
  ];
}

// 业务处理函数
function handleAdd() {
  const data = { id: '', flowId: '流程ID', opType: '-1' };
  openFlowParser(true, data);
}

function handleEdit(record) {
  const data = { id: record.id, flowId: '流程ID', opType: '0' };
  openFlowParser(true, data);
}

function handleView(record) {
  const data = { id: record.id, flowId: '流程ID', opType: '1' };
  openFlowParser(true, data);
}
</script>

<template>
  <div class="jnpf-content-wrapper">
    <div class="jnpf-content-wrapper-center">
      <div class="jnpf-content-wrapper-content">
        <BasicVxeTable @register="registerTable">
          <template #tableTitle>
            <a-button type="primary" pre-icon="icon-ym icon-ym-btn-add" @click="handleAdd()">
              {{ $t('common.addText') }}
            </a-button>
          </template>
          <template #auditStatus="{ record }">
            <JnpfTextTag 
              :content="getFlowStatusContent(record.auditStatus)" 
              :color="getFlowStatusColor(record.auditStatus)" 
            />
          </template>
          <template #action="{ record }">
            <TableAction :actions="getTableActions(record)" />
          </template>
        </BasicVxeTable>
      </div>
    </div>
    <FlowParser @register="registerFlowParser" @reload="reload" />
  </div>
</template>
```

#### 关键开发要点
1. **组件导入规范**：
   - 统一使用TypeScript
   - 按功能模块导入，避免重复导入
   - 使用别名导入提高可读性

2. **状态管理**：
   - 使用`useVxeTable`管理表格状态
   - 使用`useFlowState`管理流程状态
   - 使用Pinia管理全局状态

3. **API调用**：
   - 统一API路径管理：`#/api/sot-qm/模块名`
   - 使用统一的错误处理机制
   - 支持分页、排序、筛选功能

4. **权限控制**：
   - 基于角色的按钮权限控制
   - 行级权限控制
   - 数据访问权限控制

### 后端开发模式

#### 标准Controller开发
```java
@RestController
@RequestMapping("/sot-qm/supplier")
@RequiredArgsConstructor
@Slf4j
public class SupplierController {
    
    private final ISupplierService supplierService;
    
    @GetMapping("/list")
    @PreAuthorize("@jnpf.hasPermission('supplier:view')")
    public Result<Page<SupplierVO>> getSupplierList(@RequestParam(defaultValue = "1") Integer current,
                                                   @RequestParam(defaultValue = "10") Integer size,
                                                   SupplierQuery query) {
        Page<SupplierVO> page = supplierService.getSupplierPage(current, size, query);
        return Result.OK(page);
    }
    
    @PostMapping("/save")
    @PreAuthorize("@jnpf.hasPermission('supplier:add')")
    public Result<?> saveSupplier(@RequestBody @Valid SupplierDTO supplier) {
        supplierService.saveSupplier(supplier);
        return Result.OK();
    }
    
    @PostMapping("/update")
    @PreAuthorize("@jnpf.hasPermission('supplier:edit')")
    public Result<?> updateSupplier(@RequestBody @Valid SupplierDTO supplier) {
        supplierService.updateSupplier(supplier);
        return Result.OK();
    }
}
```

#### 标准Service开发
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierServiceImpl implements ISupplierService {
    
    private final ISupplierMapper supplierMapper;
    
    @Override
    public Page<SupplierVO> getSupplierPage(Integer current, Integer size, SupplierQuery query) {
        LambdaQueryWrapper<Supplier> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(Supplier::getSupplierName, query.getKeyword())
                    .or().like(Supplier::getSupplierCode, query.getKeyword()));
        }
        if (query.getCreateTimeStart() != null) {
            wrapper.ge(Supplier::getCreateTime, query.getCreateTimeStart());
        }
        if (query.getCreateTimeEnd() != null) {
            wrapper.le(Supplier::getCreateTime, query.getCreateTimeEnd());
        }
        
        Page<Supplier> page = supplierMapper.selectPage(new Page<>(current, size), wrapper);
        return page.convert(this::convertToVO);
    }
    
    private SupplierVO convertToVO(Supplier supplier) {
        SupplierVO vo = new SupplierVO();
        BeanUtils.copyProperties(supplier, vo);
        return vo;
    }
}
```

#### 实体类开发规范
```java
@Data
@Entity
@Table(name = "sot_qm_supplier")
@Schema(description = "供应商信息")
public class Supplier {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "主键ID")
    private Long id;
    
    @Column(length = 50, nullable = false)
    @Schema(description = "供应商编码")
    private String supplierCode;
    
    @Column(length = 200, nullable = false)
    @Schema(description = "供应商名称")
    private String supplierName;
    
    @Column(name = "qualification_level")
    @Schema(description = "资质等级")
    private Integer qualificationLevel;
    
    @Column(name = "performance_score")
    @Schema(description = "绩效评分")
    private BigDecimal performanceScore;
    
    @Column(name = "audit_status")
    @Schema(description = = "审核状态")
    private String auditStatus;
    
    @Column(name = "create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
```

### 开发工作流

#### 前端开发流程
1. **需求分析**：理解业务需求和技术要求
2. **页面设计**：设计UI界面和交互流程
3. **组件开发**：按照标准结构开发页面组件
4. **API对接**：对接后端API，完成数据交互
5. **功能测试**：进行功能测试和用户验收
6. **代码审查**：代码质量检查和优化

#### 后端开发流程
1. **接口设计**：设计RESTful API接口规范
2. **数据库设计**：设计数据库表结构
3. **实体开发**：开发JPA实体类
4. **服务层开发**：开发业务逻辑和数据处理
5. **接口开发**：开发Controller接口
6. **测试验证**：单元测试和集成测试

## Environment Configuration

### 开发环境搭建

#### 前端开发环境
```bash
# 安装Node.js (v16+)
# 安装pnpm
npm install -g pnpm

# 进入前端项目目录
cd E:\SOT\code\cloud_frontend\sot-web

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

#### 后端开发环境
```bash
# 安装JDK 17+
# 安装Maven 3.6+

# 进入后端项目目录
cd E:\SOT\code\cloud_backend\jnpf-java-cloud-v6x

# 编译项目
mvn clean compile

# 启动开发服务器
mvn spring-boot:run -pl jnpf-app/jnpf-app-server
```

### 数据库配置

#### MySQL配置
```sql
-- 创建QMS数据库
CREATE DATABASE sot_qm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 授权
GRANT ALL PRIVILEGES ON sot_qm.* TO 'sot_user'@'%' IDENTIFIED BY 'sot_password';
FLUSH PRIVILEGES;
```

#### Redis配置
```properties
# application.yml
spring:
  redis:
    host: localhost
    port: 6379
    password: 
    database: 0
    timeout: 3000ms
    lettuce:
      pool:
        max-active: 8
        max-wait: -1ms
        max-idle: 8
        min-idle: 0
```

### 测试环境配置

#### 前端测试配置
```json
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

#### 后端测试配置
```properties
# application-test.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/sot_qm_test
    username: test_user
    password: test_password
```

## Deployment Configuration

### 生产环境部署

#### Docker容器化部署
```dockerfile
# Dockerfile
FROM openjdk:17-jre-slim
COPY target/sot-qm-server.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  qms-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - qms-mysql
      - qms-redis
  
  qms-mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: sot_qm
      MYSQL_USER: sot_user
      MYSQL_PASSWORD: sot_password
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
  
  qms-redis:
    image: redis:7.0
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mysql-data:
  redis-data:
```

#### Nginx配置
```nginx
server {
    listen 80;
    server_name qms.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 监控与日志

#### 应用监控
```yaml
# application-prod.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

#### 日志配置
```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/sot-qm.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/sot-qm.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>50MB</maxFileSize>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
</configuration>
```

## Project Conventions

### Code Style

#### TypeScript/Vue 代码规范
```typescript
// 导入规范
import { ref, computed } from 'vue';
import { $t } from '#/locales';
import { useLoginState } from '@/hooks/useLogin';

// 工具函数导入
import { isObject } from '@vben-core/shared/utils';
import { formatDate } from '@vben-core/shared/date';

// 第三方库导入
import axios from 'axios';
import dayjs from 'dayjs';

// 样式导入
import './styles/index.scss';
```

**命名规范**：
- 组件名使用大驼峰命名：`QmsSupplierManagement`
- 常量名使用全大写：`MAX_LOGIN_ATTEMPTS = 3`
- 变量名使用驼峰命名：`currentSupplier`
- 私有变量使用下划线前缀：`_internalCache`
- 接口名使用 I 前缀：`ISupplierForm`

**类型规范**：
```typescript
// 基础类型
const count: number = 0;
const isValid: boolean = true;
const message: string = '';

// 对象类型
interface SupplierProfile {
  id: string;
  name: string;
  rating?: number; // 可选属性
  isActive: boolean;
}

// 联合类型
type Status = 'pending' | 'approved' | 'rejected';

// 函数类型
type Callback = (data: unknown) => void;

// 泛型
function useState<T>(initialValue: T): [T, (value: T) => void] {
  // 实现
}
```

#### Java 代码规范
```java
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

// 静态导入
import static com.jnpf.util.StringUtils.isEmpty;
```

**命名规范**：
- 类名使用大驼峰：`SupplierServiceImpl`
- 方法名使用小驼峰：`findSupplierById`
- 常量名使用全大写：`private static final int MAX_AGE = 100;`
- 私有变量使用下划线前缀：`private final Map<String, Supplier> _supplierCache = new HashMap<>();`
- 接口名使用 I 前缀：`public interface ISupplierService`

**注释规范**：
```java
/**
 * 供应商服务实现类
 * 提供供应商相关的业务逻辑处理
 * 
 * @author JNPF开发平台组
 * @version V6.0.0
 * @copyright 引迈信息技术有限公司
 * @date 2024/1/16
 */
@Service
@Slf4j
public class SupplierServiceImpl implements ISupplierService {

    /**
     * 根据供应商ID查询供应商信息
     * 
     * @param supplierId 供应商ID
     * @return 供应商信息
     * @throws SupplierNotFoundException 供应商不存在时抛出
     */
    @Override
    public Supplier getSupplierById(String supplierId) {
        // 实现
    }
}
```

### Architecture Patterns

#### 前端架构模式
- **模块化架构**：采用 monorepo 架构，基于Vben Admin框架构建
- **主框架复用**：用户权限、菜单管理等基础功能使用主框架内容，为未来SRM系统通用化做准备
- **组件化设计**：UI 组件可复用，遵循单一职责原则
- **状态管理**：使用 Pinia 进行状态管理，遵循 Flux 模式
- **路由管理**：使用 Vue Router 实现模块化路由
- **API 层**：统一的 API 接口封装，支持请求拦截、响应处理、错误处理
- **工具函数库**：@vnpf/ui 和 @vnpf/hooks 提供通用工具函数

**QMS前端页面开发结构**：
```
cloud_frontend/sot-web/apps/web/src/views/
├── sotQm/                    # QMS业务页面主目录
│   ├── sysData/              # 系统数据管理
│   │   ├── index.vue         # 页面主组件
│   │   ├── data.ts          # 数据定义
│   │   └── [其他组件...]
│   ├── supplier/             # 供应商质量管理
│   │   ├── index.vue         # 供应商列表页
│   │   ├── detail.vue        # 供应商详情页
│   │   └── [其他组件...]
│   ├── inspection/           # 质量检验（IQC/IPQC/FQC/OQC）
│   │   ├── iqc/             # IQC检验模块
│   │   ├── ipqc/            # IPQC检验模块
│   │   ├── fqc/             # FQC检验模块
│   │   └── oqc/             # OQC检验模块
│   ├── measurement/          # 量检具管理
│   ├── nonconforming/       # 不合格品管理
│   ├── complaint/           # 客诉客退管理
│   ├── changepoint/         # 变化点管理
│   ├── capa/                # 纠正预防措施
│   ├── audit/               # 审核管理
│   ├── training/            # 培训管理
│   ├── knowledge/           # 知识库管理
│   ├── spc/                # 统计过程控制
│   └── report/             # 报表分析
├── extend/                  # 扩展模块示例
│   ├── order/              # 订单管理示例
│   │   └── index.vue       # 参考：表格+搜索+状态管理+流程集成
│   └── [其他扩展示例...]
└── [其他系统页面...]
```

**页面开发规范**（参考extend/order示例）：
- **表格组件**：使用@vnpf/ui/vxeTable实现标准化表格
- **搜索功能**：集成表单搜索、日期范围筛选、关键字搜索
- **状态管理**：使用useVxeTable统一管理表格状态
- **流程集成**：集成工作流状态（useFlowState）
- **API调用**：统一API管理，支持分页、排序、筛选
- **权限控制**：基于角色的按钮权限和行权限控制

**核心模块结构**：
```
cloud_frontend/sot-web/
├── packages/
│   ├── @jnpf/web/              # 主应用（包含用户权限等基础服务）
│   ├── @jnpf/components/       # 通用组件库
│   ├── @jnpf/utils/           # 工具函数库
│   └── @jnpf/hooks/           # 自定义 Hooks
├── apps/
│   ├── web/                   # 主应用（QMS页面在此开发）
│   │   └── src/views/
│   │       ├── sotQm/         # QMS业务页面
│   │       │   ├── sysData/   # 系统数据管理
│   │       │   ├── supplier/  # 供应商质量管理
│   │       │   ├── inspection/ # 质量检验（IQC/IPQC/FQC/OQC）
│   │       │   ├── measurement/ # 量检具管理
│   │       │   ├── nonconforming/ # 不合格品管理
│   │       │   ├── complaint/ # 客诉客退管理
│   │       │   ├── changepoint/ # 变化点管理
│   │       │   ├── capa/      # 纠正预防措施
│   │       │   ├── audit/     # 审核管理
│   │       │   ├── training/  # 培训管理
│   │       │   ├── knowledge/ # 知识库管理
│   │       │   ├── spc/      # 统计过程控制
│   │       │   └── report/    # 报表分析
│   │       └── extend/        # 扩展模块示例（参考结构）
│   └── [其他未来扩展模块...]
```

#### 后端架构模式
- **微服务架构**：基于 Spring Cloud 微服务架构，QMS业务集中在sot-qm模块开发
- **模块化设计**：sot-qm采用标准Maven多模块结构，包含API、业务逻辑、实体、控制器等分层
- **服务治理**：使用 Nacos 作为注册中心，支持服务发现和配置管理
- **网关模式**：使用 Spring Cloud Gateway 统一入口，处理路由、认证、限流等
- **认证授权**：基于 OAuth2.0 和 JWT 的统一认证授权机制（使用主框架服务）
- **事件驱动**：使用 Spring Cloud Stream 实现事件驱动架构
- **CQRS模式**：在查询和命令分离的场景下使用 CQRS 模式

**QMS后端架构**（基于sot-qm项目）：
```
sot-qm/ (QMS质量管理系统微服务)
├── sot-qm-api/              # API接口层 (Feign客户端定义)
│   ├── ContractApi.java     # 合同管理API示例
│   └── [其他QMS业务API...]
├── sot-qm-controller/       # 控制器层 (REST接口)
│   ├── ContractController.java
│   └── [其他QMS业务控制器...]
├── sot-qm-biz/              # 业务逻辑层
│   ├── service/             # 业务服务接口和实现
│   │   ├── ContractService.java
│   │   └── [其他QMS业务服务...]
│   └── mapper/              # 数据访问层
│       ├── ContractMapper.java
│       └── [其他QMS数据访问...]
├── sot-qm-entity/           # 实体层
│   ├── Contract.java
│   └── [其他QMS实体...]
├── sot-qm-server/           # 启动模块
│   └── QmApplication.java   # QMS服务启动类
├── sot-qm-dubboservice/     # Dubbo服务层（可选）
└── sot-qm-consumers/        # 消费者模块（可选）
```

**完整微服务架构**：
```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway层                            │
├─────────────────────────────────────────────────────────────────┤
│  - 统一入口  - 认证授权  - 限流熔断  - 日志审计  - 协议转换       │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      微服务层 (JNPF框架)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │  用户权限    │ │   系统管理   │ │   工作流    │ │   审计日志  │  │
│  │   Service   │ │   Service   │ │   Service   │ │  Service  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    QMS业务层                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │  │
│  │  │   sot-qm    │ │   [其他QMS  │ │   [未来扩展  │        │  │
│  │  │   Service   │ │   服务...]  │ │   服务...]  │        │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Testing Strategy

#### 前端测试策略
- **单元测试**：使用 Vitest 进行组件和工具函数的单元测试
- **端到端测试**：使用 Playwright 进行用户交互流程的端到端测试
- **组件测试**：使用 @vue/test-utils 进行组件渲染和交互测试
- **API测试**：使用 Jest + MSW 进行 API 模拟测试
- **性能测试**：使用 Lighthouse 进行前端性能检测

**测试覆盖要求**：
- 核心业务逻辑测试覆盖率达到 80% 以上
- 关键组件必须有端到端测试
- API 接口必须有完整的单元测试
- 性能指标：首屏加载时间 < 3s，页面切换 < 1s

#### 后端测试策略
- **单元测试**：使用 JUnit 5 + Mockito 进行业务逻辑单元测试
- **集成测试**：使用 Spring Boot Test 进行依赖注入和数据库集成测试
- **API测试**：使用 REST Assured 进行 REST API 接口测试
- **性能测试**：使用 JMeter 进行接口性能测试
- **安全测试**：使用 OWASP ZAP 进行安全漏洞扫描

**测试环境配置**：
- 开发环境：本地开发环境，快速反馈
- 测试环境：独立的测试数据库，完整的测试配置
- 预发布环境：与生产环境配置一致，用于最终验证
- 生产环境：只读测试，用于监控和告警

### Git Workflow

#### 分支策略
- **main/master**：主分支，始终保持可部署状态
- **develop**：开发分支，集成分支，用于日常开发
- **feature/***：功能分支，开发新功能
- **hotfix/***：热修复分支，紧急修复问题
- **release/***：发布分支，准备版本发布

**分支命名规范**：
```bash
# 功能分支
feature/qms-supplier-management
feature/qms-inspection-module
feature/qms-audit-workflow

# 热修复分支
hotfix/fix-supplier-validation-error
hotfix/resolve-inspection-calculation-bug

# 发布分支
release/v6.0.0
release/v6.1.0
```

#### 提交信息规范
使用 Angular 提交信息规范：
```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- **feat**：新功能
- **fix**：修复bug
- **docs**：文档更新
- **style**：代码格式修改
- **refactor**：重构
- **perf**：性能优化
- **test**：测试相关
- **chore**：构建工具或依赖管理

**示例**：
```bash
feat(qms-supplier): add supplier qualification management feature

- Add supplier qualification management module
- Implement qualification verification workflow
- Add qualification expiration reminder system

Closes #123
```

## Domain Context

### 质量管理体系标准
舜富QMS系统严格遵循 **IATF16949:2016** 汽车行业质量管理体系标准，同时兼容ISO9001:2015标准。系统设计完全符合IATF16949的核心要求，包括：

#### IATF16949:2016 要求覆盖
- **第4章 组织环境**：理解组织及其环境、相关方需求和期望
- **第5章 领导作用**：承诺、方针、组织角色与职责
- **第6章 策划**：风险与机遇应对、质量目标、变更管理
- **第7章 支持**：资源、能力、意识、沟通、文档化信息
- **第8章 运行**：产品和服务的设计开发、生产和服务提供、产品放行
- **第9章 绩效评价**：监视、测量、分析和评价
- **第10章 改进**：不符合与纠正措施、持续改进

### 核心业务模块

#### 1. **基础数据管理（Master Data Management）**
- **物料主数据**：物料编码、规格型号、技术参数、BOM结构
- **客户主数据**：客户信息、等级分类、特殊要求、质量协议
- **供应商主数据**：供应商档案、资质认证、绩效评级、协议管理
- **质量标准主数据**：检验标准、抽样标准、技术规范、法规标准
- **工艺主数据**：工艺路线、作业指导、控制点设置、参数标准

#### 2. **供应商质量管理（Supplier Quality Management）**
- **供应商准入管理**：供应商注册、资质审核、现场评估
- **供应商绩效管理**：质量评分、交付绩效、服务评价
- **供应商分级管理**：战略级、重点级、一般级、淘汰级
- **供应商改进**：改进计划、辅导实施、效果验证
- **供应商协同**：信息共享、协同平台、接口集成

#### 3. **进货质量控制（IQC - Incoming Quality Control）**
- **来料检验计划**：检验策略、抽样方案、检验项目设定
- **IQC检验执行**：来料通知、检验任务、现场检验、结果录入
- **检验数据处理**：数据统计分析、趋势分析、能力分析
- **不合格品处理**：标识隔离、评审处置、供应商反馈
- **供应商质量反馈**：质量报告、改进要求、问题跟踪

#### 4. **过程质量控制（IPQC - In-process Quality Control）**
- **过程检验计划**：关键控制点、检验频率、检验标准
- **首件检验**：首件确认、参数验证、符合性检查
- **巡回检验**：定时巡检、参数监控、过程监控
- **SPC统计过程控制**：控制图、过程能力分析、异常预警
- **防错管理**：防错装置、防错验证、防错效果评估

#### 5. **成品质量控制（FQC/OQC - Final/Outgoing Quality Control）**
- **FQC成品检验**：成品全检、抽样检验、外观检查、功能测试
- **OQC出货检验**：出货前检验、包装检查、标识验证
- **检验记录管理**：检验报告、质量证明、追溯信息
- **质量追溯**：批次追溯、过程追溯、责任追溯
- **客户交付质量**：交付质量统计、客户反馈跟踪

#### 6. **量检具管理（Measurement Equipment Management）**
- **量检具台账**：设备档案、量程精度、校准周期
- **量检具校准**：内部校准、外部校准、校准计划、校准记录
- **MSA测量系统分析**：GR&R分析、偏倚分析、线性分析、稳定性分析
- **量检具维护**：日常维护、故障维修、报废管理
- **量检具追溯**：溯源管理、不确定度评估、使用规范

#### 7. **不合格品管理（Nonconforming Product Management）**
- **不合格品标识**：标识方法、区域隔离、状态管理
- **不合格品评审**：评审流程、责任判定、处置方案
- **不合格品处置**：返工方案、返修方案、报废审批、让步接收
- **返工返修管理**：工艺制定、过程控制、效果验证
- **报废管理**：报废申请、价值评估、报废处理

#### 8. **客诉客退管理（Customer Complaint/Return Management）**
- **客诉接收**：投诉登记、分类处理、紧急程度评估
- **客诉调查**：原因分析、责任确认、影响范围评估
- **8D报告**：问题描述、临时对策、根本原因分析、长期预防
- **客诉处理**：处理方案、客户沟通、效果确认
- **客退管理**：退货申请、检验确认、价值评估、再处理

#### 9. **变化点管理（Change Point Management）**
- **变化点创建**：变化点草稿创建、基本信息录入、编号自动生成（CPYYYYMMNNN）
- **变化点分类**：按类型分类（人机料法环）、按来源分类、按影响程度分类（Minor/Moderate/Major/Critical）
- **审批流程管理**：多级审批流程（部门经理→质量经理→总监→实施准备）
- **影响分析管理**：多维度影响评估（质量、成本、交付、安全、环境）、风险评分计算（Severity×Probability）
- **实施计划管理**：实施步骤制定、责任人分配、时间节点规划、验证计划制定
- **实施过程跟踪**：变更实施记录、进度跟踪、问题记录、实施状态管理
- **质量验证管理**：验证执行、验证数据收集、验证结果判定（Pass/Fail/Conditional Pass）
- **追溯信息管理**：自动追溯创建、追溯记录更新、影响链路追踪

#### 10. **纠正预防措施管理（CAPA - Corrective and Preventive Action）**
- **问题识别**：质量问题收集、数据分析、趋势识别
- **根本原因分析**：鱼骨图、5Why分析、失效树分析
- **措施制定**：纠正措施、预防措施、责任分配、时间计划
- **措施实施**：实施跟踪、效果验证、文档记录
- **效果评估**：有效性评估、标准化推广、经验总结

#### 11. **审核管理（Audit Management）**
- **内部审核**：审核计划、现场审核、不符合项跟踪、改进验证
- **第二方审核**：供应商审核、过程审核、体系审核
- **第三方审核**：认证审核、监督审核、再认证审核
- **审核准备**：审核策划、检查表编制、资源准备
- **改进跟踪**：不符合项整改、预防措施制定、效果验证

#### 12. **培训管理（Training Management）**
- **培训需求分析**：能力差距、岗位要求、法规要求
- **培训计划制定**：年度计划、专项计划、新员工培训
- **培训实施管理**：培训执行、效果评估、记录管理
- **培训档案管理**：培训记录、证书管理、能力矩阵
- **讲师管理**：内部讲师、外部讲师、讲师评估

#### 13. **知识库管理（Knowledge Base Management）**
- **质量文档管理**：体系文件、程序文件、作业指导书
- **技术标准库**：国家标准、行业标准、企业标准、客户标准
- **案例库管理**：质量案例、经验教训、最佳实践
- **问题库管理**：常见问题、解决方案、知识共享
- **文档版本管理**：版本控制、变更历史、废止管理

### 关键业务概念

#### IATF16949核心概念
- **APQP**：先期产品质量策划（Advanced Product Quality Planning）
- **PPAP**：生产件批准程序（Production Part Approval Process）
- **FMEA**：失效模式与影响分析（Failure Mode and Effects Analysis）
- **SPC**：统计过程控制（Statistical Process Control）
- **MSA**：测量系统分析（Measurement System Analysis）
- ** control plan**：控制计划
- ** DFMEA/PFMEA**：设计/过程失效模式分析
- ** special characteristics**：特殊特性

#### 质量管理工具
- **8D报告**：8 Disciplines Problem Solving
- **5Why分析**：5个为什么分析法
- **鱼骨图**：因果图分析
- **帕累托图**：关键少数分析
- **控制图**：过程变异监控
- **能力指数**：Cp/Cpk/Pp/Ppk
- **GR&R**：量具重复性与再现性

#### 业务状态管理
- **质量状态**：待检验、检验中、合格、不合格、待评审、已处理
- **审批状态**：草稿、审核中、已批准、已驳回、已撤销
- **变化点状态**：DRAFT（草稿）、PENDING_APPROVAL（待审批）、APPROVED（已批准）、REJECTED（已驳回）、IMPLEMENTED（已实施）、CANCELLED（已取消）
- **不合格品状态**：待处理、评审中、返工中、返修中、报废中、已结案

### 业务流程规范

#### 核心业务流程
1. **产品实现流程**：设计开发 → 供应商选择 → 生产准备 → 批量生产 → 交付客户
2. **质量控制流程**：检验计划 → 检验执行 → 结果判定 → 不合格处理 → 质量反馈
3. **问题处理流程**：问题识别 → 原因分析 → 措施制定 → 实施跟踪 → 效果验证
4. **变化点管理流程**：变化点创建 → 提交审批 → 多级审批 → 影响分析 → 实施准备 → 变更实施 → 质量验证 → 变更关闭
5. **持续改进流程**：绩效监控 → 问题识别 → 改进机会 → 改进实施 → 标准化推广

#### 关键控制点
- **特殊特性控制**：关键参数、特殊工艺、安全特性的控制
- **变化点控制**：基于风险的变化点管理、影响评估、多级审批、实施验证
- **供应商控制**：供应商选择、绩效监控、改进提升的闭环管理
- **追溯性要求**：原材料追溯、过程追溯、产品追溯的完整链路
- **记录保存**：质量记录保存期限、格式要求、检索便利性

#### 数据管理要求
- **数据完整性**：确保数据真实性、准确性、完整性
- **数据安全性**：访问控制、权限管理、操作审计
- **数据追溯性**：操作日志、修改记录、版本控制
- **数据标准化**：数据字典、编码规范、格式统一
- **数据生命周期**：创建、使用、归档、销毁的完整管理

## Important Constraints

### 技术约束
- **性能要求**：系统响应时间 < 2秒，并发用户数 > 1000
- **数据一致性**：采用分布式事务解决方案，确保数据一致性
- **高可用性**：系统可用性 > 99.9%，支持故障自动转移
- **安全性**：符合等保2.0三级要求，数据加密传输和存储

### 业务约束
- **IATF16949合规**：完全符合IATF16949:2016标准所有条款要求
- **VDA标准支持**：支持VDA6.1、VDA6.3、VDA6.5等德国汽车工业标准
- **AIAG工具标准**：符合APQP、PPAP、FMEA、SPC、MSA等AIAG标准要求
- **法规符合性**：满足RoHS、REACH、ELV等汽车行业法规要求
- **汽车行业特定**：支持IATF认证审核、主机厂特定要求、供应链协同
- **审计追踪**：完整的质量记录、操作日志、变更历史，支持内外部审计
- **数据保留**：质量记录保留期不少于产品生命周期+1年（通常10-15年）
- **特殊特性管理**：关键特性、特殊特性的识别、控制和验证
- **追溯性要求**：原材料-过程-产品的完整追溯链路，批次级追溯
- **多客户支持**：支持多汽车主机厂的不同质量标准和要求

### 法规约束
- **数据保护**：符合《网络安全法》、《数据安全法》要求
- **隐私保护**：用户个人信息保护符合相关法规要求
- **知识产权**：系统设计和技术实现符合知识产权保护要求

### 安全约束
- **权限控制**：基于角色的细粒度权限控制（RBAC）
- **访问控制**：多因素认证、单点登录、会话管理
- **数据安全**：敏感数据加密、脱敏处理、访问审计
- **网络安全**：防火墙、入侵检测、DDoS防护

## External Dependencies

### 内部系统集成
- **ERP系统**：企业资源计划系统，集成物料管理、采购管理、财务管理
- **MES系统**：制造执行系统，集成生产过程管理、设备管理、工艺管理
- **SRM系统**：供应商关系管理系统，集成供应商协同、采购管理、质量管理
- **WMS系统**：仓库管理系统，集成库存管理、出入库管理、批次管理
- **CRM系统**：客户关系管理系统，集成客户管理、销售管理、服务管理
- **PLM系统**：产品生命周期管理，集成产品设计、BOM管理、变更管理
- **SCM系统**：供应链管理系统，集成供应链协同、物流管理
- **EMS系统**：设备管理系统，集成设备维护、校准管理、预防性维护
- **QMS集成接口**：与其他QMS系统的数据交换和标准对接

### 汽车行业特定集成
- **VDA标准对接**：VDA6.3过程审核、VDA6.5产品审核标准支持
- **OEM客户要求**：满足各汽车主机厂的特定质量要求和质量协议
- **PPAP电子提交**：支持电子化PPAP文档提交和状态跟踪
- **AIAG标准支持**：AIAG APQP、PPAP、FMEA、SPC、MSA等工具标准
- **供应链质量协同**：Tier1、Tier2等多级供应商质量数据集成

### 外部API服务
- **地图服务**：高德地图/百度地图，用于供应商地理位置展示
- **短信服务**：阿里云短信服务，用于系统通知和提醒
- **邮件服务**：企业邮箱服务，用于系统邮件通知
- **文件存储**：阿里云OSS，用于附件和文档存储
- **消息推送**：企业微信/钉钉，用于移动端消息推送

### 第三方工具集成
- **Office套件**：Word、Excel、PowerPoint文档处理
- **PDF处理**：PDF文档生成、转换、编辑
- **图表工具**：ECharts/Chart.js，数据可视化展示
- **条码扫描**：二维码/条码扫描和识别
- **电子签名**：电子签名和签章服务

### 开发工具链
- **版本控制**：GitLab/GitHub，代码托管和协作
- **持续集成**：Jenkins/GitLab CI，自动化构建部署
- **容器编排**：Kubernetes，容器编排和管理
- **监控告警**：Prometheus + Grafana，系统监控和告警
- **日志分析**：ELK Stack，日志收集和分析

## SRM Integration Strategy

### SRM系统架构规划

#### 当前架构复用
舜富QMS系统基于JNPF微服务架构，当前的用户权限、菜单管理等基础功能使用主框架服务，为未来SRM（供应商关系管理）系统通用化做准备：

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway层                            │
├─────────────────────────────────────────────────────────────────┤
│  - 统一入口  - 认证授权  - 限流熔断  - 日志审计  - 协议转换       │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      微服务层 (JNPF框架)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │  用户权限    │ │   系统管理   │ │   工作流    │ │   审计日志  │  │
│  │   Service   │ │   Service   │ │   Service   │ │  Service  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│                      ↓                      ↓                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │    QMS      │ │    SRM     │ │   其他业务   │                │
│  │   Service   │ │   Service  │ │   Service   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

#### SRM系统核心功能模块
1. **供应商主数据管理**
   - 供应商档案信息管理
   - 供应商分类和等级管理
   - 供应商资质证书管理
   - 供应商联络信息管理

2. **供应商准入管理**
   - 供应商注册和申请流程
   - 供应商现场评估管理
   - 供应商资质审核流程
   - 准入决策和通知管理

3. **供应商绩效管理**
   - 供应商KPI指标定义
   - 绩效数据采集和分析
   - 绩效评级和排名
   - 绩效反馈和改进计划

4. **供应商协同平台**
   - 供应商门户系统
   - 协同订单管理
   - 协同质量管理
   - 供应商自助服务

5. **供应商风险管控**
   - 供应商风险评估
   - 风险预警和管控
   - 供应商淘汰管理
   - 供应商备选库管理

### QMS与SRM集成策略

#### 数据集成架构
```typescript
// 统一数据接口规范
interface SRMQMSIntegrationService {
  // 供应商基础数据同步
  syncSupplierMasterData(supplierData: SupplierMasterData): Promise<void>;
  
  // 质量绩效数据共享
  getSupplierQualityPerformance(supplierId: string): Promise<QualityPerformance>;
  
  // 供应商协同数据
  sendSupplierCollaborationData(data: CollaborationData): Promise<void>;
  
  // 风险评估数据共享
  getSupplierRiskAssessment(supplierId: string): Promise<RiskAssessment>;
}
```

#### 业务流程集成
1. **供应商准入流程**
   - SRM：供应商申请 → 资质审核 → 现场评估
   - QMS：质量评估 → 质量协议签署 → 正式合作

2. **供应商绩效评估**
   - SRM：交付绩效 → 成本绩效 → 服务绩效
   - QMS：质量绩效 → 质量改进 → 质量认证

3. **供应商改进协同**
   - QMS：质量问题识别 → 改进要求制定 → 改进效果验证
   - SRM：改进计划制定 → 资源协调 → 进度跟踪

#### 技术集成方案
```java
// 集成服务接口
public interface SRMQMSIntegrationService {
    
    // 供应商数据同步
    @PostMapping("/api/srm-qm/sync/supplier")
    Result<?> syncSupplierData(@RequestBody SupplierSyncRequest request);
    
    // 质量绩效数据推送
    @PostMapping("/api/srm-qm/quality/performance")
    Result<?> pushQualityPerformance(@RequestBody QualityPerformanceData data);
    
    // 协同工作流集成
    @PostMapping("/api/srm-qm/workflow/trigger")
    Result<?> triggerIntegratedWorkflow(@RequestBody WorkflowTriggerRequest request);
}
```

### 未来发展展望

#### 短期目标（6-12个月）
1. **QMS系统上线**
   - 完成所有QMS核心模块开发
   - 系统部署和试运行
   - 用户培训和推广
   - 性能优化和稳定运行

2. **基础集成准备**
   - 建立QMS与ERP/MES的数据接口
   - 完成主数据标准化
   - 制定集成规范和标准
   - 集成测试和验证

#### 中期目标（1-2年）
1. **SRM系统启动**
   - 基于现有框架开发SRM系统
   - 复用用户权限和系统管理功能
   - 建立QMS-SRM集成平台
   - 实现供应商全生命周期管理

2. **智能质量提升**
   - 引入AI/ML技术进行质量预测
   - 实现智能检验和异常检测
   - 构建质量知识图谱
   - 推进质量数字化决策

#### 长期目标（2-5年）
1. **智能制造生态**
   - 构建完整的智能制造质量生态
   - 实现供应链全链路质量协同
   - 建立智能质量预警系统
   - 推进质量持续改进自动化

2. **行业生态扩展**
   - 扩展到更多汽车主机厂客户
   - 支持新能源汽车质量管理
   - 国际标准认证和扩展
   - 行业解决方案标准化

### 技术演进规划

#### 技术升级路线
1. **微服务架构优化**
   - 服务网格（Service Mesh）应用
   - 分布式事务治理
   - 微服务监控和治理
   - 容器化编排升级

2. **前端技术升级**
   - Vue 4升级规划
   - 微前端架构实践
   - 组件库标准化和复用
   - 前端性能监控体系

3. **数据能力建设**
   - 数据仓库和数仓建设
   - 实时数据处理能力
   - 数据挖掘和分析能力
   - 可视化报表体系

#### 创新技术应用
1. **人工智能应用**
   - AI质检和自动化检测
   - 智能质量分析和预测
   - 自然语言处理（NLP）应用
   - 计算机视觉应用

2. **区块链技术**
   - 产品溯源和质量证明
   - 供应商数据可信记录
   - 质量合约智能执行
   - 审计数据不可篡改

3. **IoT和边缘计算**
   - 设备数据实时采集
   - 边缘智能检测
   - 实时质量监控
   - 预测性质量预警

### 总结

舜富QMS系统基于JNPF微服务架构，严格遵循IATF16949:2016标准，为汽车制造业提供全面的质量管理解决方案。系统采用Vue 3 + Spring Cloud技术栈，前后端分离，模块化设计，具备高可用、高性能的特点。

通过良好的架构设计和开发规范，系统不仅满足了当前QMS业务需求，还为未来SRM系统扩展和智能制造生态建设奠定了坚实基础。持续的技术创新和业务优化将使舜富QMS系统成为汽车行业质量管理的标杆解决方案。

**文档版本**：v1.0  
**最后更新**：2026年1月16日  
**维护部门**：技术架构部
