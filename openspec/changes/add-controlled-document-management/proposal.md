# Change: 受控文档管理模块 (对接 PLM)

## Why
目前系统缺乏对质量管理相关文档的统一管理。根据业务要求，质量文档分布在 PLM 和 QMS 两个系统中。需要建立一个受控文档管理模块，不仅提供结构化的 5 大一级分类存储，还需具备“主存系统”标识功能，实现对 PLM 文档的读取引用以及对 QMS 本地文档的全生命周期管理，满足 IATF 16949 的体系受控要求。

## What Changes
- **业务场景分类**：实现 5 大业务场景导向的分级分类（体系策划、产品设计 APQP、生产过程执行、质量检验监控、异常持续改进）。
- **复合存储模型**：引入“主存标识”（PLM/QMS），区分外部引用与本地管理。
- **UI 结构优化**：左侧树状结构展示业务场景，右侧列表根据主存属性动态切换操作权限（如 PLM 文档仅限查看/同步，QMS 文档支持新增/审批/作废）。
- **具体文档映射**：覆盖从图纸、3D模型、FMEA、控制计划到检验报告、不合格记录等 20+ 种核心文档。

## Impact
- Affected specs: controlled-document, plm-integration
- Affected code:
  - `src/views/quality-system/document/`：新增多功能分栏查询界面
  - `src/api/document.ts`：新增支持双模式（QMS本地/PLM同步）的数据接口
  - `src/types/index.ts`：扩展文档实体模型，增加 `storageSource` 和 `categoryPath` 字段
