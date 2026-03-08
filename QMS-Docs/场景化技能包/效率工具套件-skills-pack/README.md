# 效率工具套件

本技能包由 FastSkills (https://github.com/PureVibeCoder/fastskills) 聚合提供，共包含 5 个技能。

> [!IMPORTANT]
> **使用前必读**：在导入任何技能到 Claude Code 之前，请务必：
> 1. 下载并阅读每个技能目录下的 `SKILL.md` 文件
> 2. 检查技能的触发词、操作指南和预期行为
> 3. 确保您理解技能将执行的所有操作
> 4. 仅导入来自可信来源的技能


## 安全扫描报告

### 概览
- 总检查技能数: 5
- ✅ 安全 (80-100分): 5
- ⚠️  中等风险 (60-79分): 0
- ❌ 高风险 (40-59分): 0
- 🚨 危险 (<40分): 0

### 发现的问题
- 🔴 高风险问题: 0
- 🟡 中风险问题: 0

### 建议


- 所有技能下载后都应进行人工审查
- 仅导入您信任的技能到您的 Claude Code 环境中


## 包含的技能

- **domain-name-brainstormer** (`domain-name-brainstormer`)
- **file-organizer** (`file-organizer`)
- **invoice-organizer** (`invoice-organizer`)
- **meeting-insights-analyzer** (`meeting-insights-analyzer`)
- **raffle-winner-picker** (`raffle-winner-picker`)

## 集成方法

### 方式一：全局集成 (推荐)

1. 解压本文件
2. 将需要的技能目录（如 `frontend-design/`）复制到您的全局技能目录：
   - macOS/Linux: `~/.claude/skills/`
3. 重新启动 Claude Code

### 方式二：项目局部集成

1. 解压本文件
2. 将技能目录复制到您当前项目的 `.claude/skills/` 目录中
3. 重新启动 Claude Code

## 安全建议

### 下载后检查清单

- [ ] 检查 `SKILL.md` 文件的来源是否可信
- [ ] 确认触发词不会与您的其他技能冲突
- [ ] 验证操作指南中的命令不会执行危险操作
- [ ] 检查是否有网络请求或文件操作
- [ ] 确保理解所有操作的后果

### 危险信号（发现时请谨慎）

- 要求执行未知的 shell 命令
- 尝试访问敏感文件或目录
- 使用 `eval()` 或类似动态代码执行
- 包含硬编码的 API 密钥或密码
- 尝试修改系统配置

## 技能来源

FastSkills - https://github.com/PureVibeCoder/fastskills

## 许可证

MIT License
