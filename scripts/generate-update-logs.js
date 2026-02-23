/**
 * OpenSpec 更新日志自动生成脚本
 * 
 * 功能:
 * 1. 读取 openspec/changes 目录下已归档的变更
 * 2. 解析变更的 proposal.md, tasks.md, design.md
 * 3. 生成更新日志的 HTML 内容
 * 4. 更新 Mock 数据中的更新日志列表
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const OPENSPEC_DIR = path.join(__dirname, '../openspec/changes')
const OUTPUT_FILE = path.join(__dirname, '../src/api/generated-update-logs.ts')

/**
 * 读取目录下的所有变更
 */
function getAllChanges() {
    const changes = []

    if (!fs.existsSync(OPENSPEC_DIR)) {
        console.log(`⚠️  OpenSpec 目录不存在: ${OPENSPEC_DIR}`)
        return changes
    }

    const dirs = fs.readdirSync(OPENSPEC_DIR)

    // 也读取 archive 目录
    const archiveDir = path.join(OPENSPEC_DIR, 'archive')
    let allDirs = dirs.map(dir => ({ baseDir: OPENSPEC_DIR, dir }))
    if (fs.existsSync(archiveDir)) {
        const archivedDirs = fs.readdirSync(archiveDir)
        allDirs = allDirs.concat(archivedDirs.map(dir => ({ baseDir: archiveDir, dir })))
    }

    for (const { baseDir, dir } of allDirs) {
        if (dir === 'archive' && baseDir === OPENSPEC_DIR) continue; // skip the archive folder itself

        const changePath = path.join(baseDir, dir)
        const stat = fs.statSync(changePath)

        if (!stat.isDirectory()) continue

        // 检查是否有 proposal.md
        const proposalPath = path.join(changePath, 'proposal.md')
        if (!fs.existsSync(proposalPath)) continue

        // 检查是否已归档 (status.md 中包含 archived)
        const statusPath = path.join(changePath, 'status.md')
        let isArchived = false
        if (fs.existsSync(statusPath)) {
            const statusContent = fs.readFileSync(statusPath, 'utf-8')
            isArchived = statusContent.includes('archived') || statusContent.includes('deployed')
        }

        changes.push({
            id: dir,
            path: changePath,
            isArchived
        })
    }

    return changes
}

/**
 * 解析 proposal.md
 */
function parseProposal(changePath) {
    const proposalPath = path.join(changePath, 'proposal.md')
    const content = fs.readFileSync(proposalPath, 'utf-8')

    // 提取标题
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : '未命名变更'

    // 提取为什么 (Why)
    const whyMatch = content.match(/##\s+为什么.*?\n\n([\s\S]*?)(?=\n##|$)/i)
    const why = whyMatch ? whyMatch[1].trim() : ''

    // 提取变更内容 (What Changes)
    const whatMatch = content.match(/##\s+变更内容.*?\n\n([\s\S]*?)(?=\n##|$)/i)
    const what = whatMatch ? whatMatch[1].trim() : ''

    // 提取影响 (Impact)
    const impactMatch = content.match(/##\s+影响.*?\n\n([\s\S]*?)(?=\n##|$)/i)
    const impact = impactMatch ? impactMatch[1].trim() : ''

    return { title, why, what, impact }
}

/**
 * 解析 tasks.md 获取任务列表
 */
function parseTasks(changePath) {
    const tasksPath = path.join(changePath, 'tasks.md')
    if (!fs.existsSync(tasksPath)) return []

    const content = fs.readFileSync(tasksPath, 'utf-8')
    const tasks = []

    // 匹配任务项 (- [ ] 或 - [x])
    const taskRegex = /^-\s+\[([ x])\]\s+(.+)$/gm
    let match

    while ((match = taskRegex.exec(content)) !== null) {
        const isCompleted = match[1] === 'x'
        const taskText = match[2].trim()

        // 判断角色
        let role = 'general'
        if (taskText.includes('前端') || taskText.includes('Vue') || taskText.includes('组件')) {
            role = 'frontend'
        } else if (taskText.includes('后端') || taskText.includes('API') || taskText.includes('数据库')) {
            role = 'backend'
        } else if (taskText.includes('测试')) {
            role = 'test'
        }

        tasks.push({
            text: taskText,
            completed: isCompleted,
            role
        })
    }

    return tasks
}

/**
 * 生成更新日志 HTML 内容
 */
function generateUpdateLogHTML(proposal, tasks) {
    let html = '<div class="update-log-content">\n'

    // 为什么
    if (proposal.why) {
        html += '<h2>📋 变更背景</h2>\n'
        html += `<div class="section">${markdownToHTML(proposal.why)}</div>\n\n`
    }

    // 变更内容
    if (proposal.what) {
        html += '<h2>✨ 主要变更</h2>\n'
        html += `<div class="section">${markdownToHTML(proposal.what)}</div>\n\n`
    }

    // 任务完成情况
    if (tasks.length > 0) {
        html += '<h2>📊 实现内容</h2>\n'
        html += '<div class="section">\n'

        const frontendTasks = tasks.filter(t => t.role === 'frontend')
        const backendTasks = tasks.filter(t => t.role === 'backend')
        const testTasks = tasks.filter(t => t.role === 'test')
        const generalTasks = tasks.filter(t => t.role === 'general')

        if (frontendTasks.length > 0) {
            html += '<h3>前端开发</h3>\n<ul>\n'
            frontendTasks.forEach(task => {
                html += `<li>${task.text}</li>\n`
            })
            html += '</ul>\n'
        }

        if (backendTasks.length > 0) {
            html += '<h3>后端开发</h3>\n<ul>\n'
            backendTasks.forEach(task => {
                html += `<li>${task.text}</li>\n`
            })
            html += '</ul>\n'
        }

        if (testTasks.length > 0) {
            html += '<h3>测试</h3>\n<ul>\n'
            testTasks.forEach(task => {
                html += `<li>${task.text}</li>\n`
            })
            html += '</ul>\n'
        }

        if (generalTasks.length > 0) {
            html += '<h3>其他</h3>\n<ul>\n'
            generalTasks.forEach(task => {
                html += `<li>${task.text}</li>\n`
            })
            html += '</ul>\n'
        }

        html += '</div>\n\n'
    }

    // 影响
    if (proposal.impact) {
        html += '<h2>⚠️ 影响范围</h2>\n'
        html += `<div class="section">${markdownToHTML(proposal.impact)}</div>\n\n`
    }

    html += '</div>'

    return html
}

/**
 * 简单的 Markdown 转 HTML
 */
function markdownToHTML(markdown) {
    return markdown
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
}

/**
 * 生成版本号
 */
function generateVersion(index) {
    const major = 1
    const minor = Math.floor(index / 10)
    const patch = index % 10
    return `v${major}.${minor}.${patch}`
}

/**
 * 判断更新类型
 */
function detectUpdateType(title, proposal) {
    const text = (title + proposal.what + proposal.why).toLowerCase()

    if (text.includes('breaking') || text.includes('重大变更') || text.includes('不兼容')) {
        return 'breaking'
    }
    if (text.includes('fix') || text.includes('修复') || text.includes('bug')) {
        return 'fix'
    }
    if (text.includes('优化') || text.includes('improve') || text.includes('性能')) {
        return 'optimize'
    }
    return 'feature'
}

/**
 * 提取影响模块
 */
function extractAffectedModules(proposal) {
    const modules = new Set()
    const text = proposal.title + proposal.what + proposal.impact

    const moduleMap = {
        '检验': '质量检验',
        '抽样': '质量检验',
        'IQC': '质量检验',
        'OQC': '质量检验',
        'IPQC': '质量检验',
        'FQC': '质量检验',
        '量检具': '质量工具',
        '系统': '系统管理',
        '日志': '系统管理',
        '字典': '系统管理',
        '供方': '供方管理',
        '供应商': '供方管理',
        '数据': '数据应用',
        '流程': '流程管理',
        '客诉': '客诉管理',
        '权限': '权限管理'
    }

    Object.entries(moduleMap).forEach(([keyword, module]) => {
        if (text.includes(keyword)) {
            modules.add(module)
        }
    })

    if (modules.size === 0) {
        modules.add('通用模块')
    }

    return Array.from(modules)
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始生成更新日志...\n')

    // 获取所有变更
    const changes = getAllChanges()
    console.log(`📁 找到 ${changes.length} 个变更\n`)

    // 只处理已归档的变更
    const archivedChanges = changes.filter(c => c.isArchived)
    console.log(`✅ 其中 ${archivedChanges.length} 个已归档\n`)

    // 生成更新日志
    const updateLogs = []

    archivedChanges.forEach((change, index) => {
        console.log(`📝 处理: ${change.id}`)

        try {
            const proposal = parseProposal(change.path)
            const tasks = parseTasks(change.path)
            const html = generateUpdateLogHTML(proposal, tasks)

            const updateLog = {
                id: `log-${change.id}`,
                version: generateVersion(index),
                title: proposal.title,
                content: html,
                contentType: 'html',
                updateType: detectUpdateType(proposal.title, proposal),
                affectedModules: extractAffectedModules(proposal),
                relatedChangeId: change.id,
                status: 'published',
                publishedAt: new Date().toISOString(),
                publishedBy: 'system',
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
                creator: 'system',
                updater: 'system',
                orgId: 'org-001'
            }

            updateLogs.push(updateLog)
            console.log(`   ✓ 生成成功: ${updateLog.version} - ${updateLog.title}`)
        } catch (error) {
            console.error(`   ✗ 生成失败: ${error.message}`)
        }
    })

    // 生成 TypeScript 文件
    const tsContent = `/**
 * 自动生成的更新日志数据
 * 生成时间: ${new Date().toLocaleString('zh-CN')}
 * 
 * 此文件由 scripts/generate-update-logs.js 自动生成
 * 请勿手动修改
 */

import type { UpdateLog } from '@/types'

export const generatedUpdateLogs: UpdateLog[] = ${JSON.stringify(updateLogs, null, 2)}
`

    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8')

    console.log(`\n✨ 生成完成!`)
    console.log(`📄 输出文件: ${OUTPUT_FILE}`)
    console.log(`📊 共生成 ${updateLogs.length} 条更新日志\n`)
}

// 运行
main()
