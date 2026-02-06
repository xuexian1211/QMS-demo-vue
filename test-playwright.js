/**
 * Playwright 浏览器测试脚本
 * 用于验证 Playwright 是否可以正常启动和操作浏览器
 */

import { chromium } from 'playwright';

async function testPlaywright() {
    console.log('🚀 开始测试 Playwright...\n');

    let browser;
    try {
        // 启动浏览器
        console.log('📦 正在启动 Chromium 浏览器...');
        browser = await chromium.launch({
            headless: false, // 显示浏览器窗口
            slowMo: 500 // 减慢操作速度,便于观察
        });
        console.log('✅ 浏览器启动成功!\n');

        // 创建新页面
        console.log('📄 正在创建新页面...');
        const page = await browser.newPage();
        console.log('✅ 页面创建成功!\n');

        // 访问百度
        console.log('🌐 正在访问百度...');
        await page.goto('https://www.baidu.com', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        console.log('✅ 页面加载成功!\n');

        // 获取页面标题
        const title = await page.title();
        console.log(`📋 页面标题: ${title}\n`);

        // 在搜索框中输入文字
        console.log('⌨️  正在搜索框中输入 "Playwright"...');
        await page.fill('#kw', 'Playwright');
        console.log('✅ 输入成功!\n');

        // 点击搜索按钮
        console.log('🖱️  正在点击搜索按钮...');
        await page.click('#su');
        console.log('✅ 点击成功!\n');

        // 等待搜索结果加载
        console.log('⏳ 等待搜索结果加载...');
        await page.waitForSelector('#content_left', { timeout: 10000 });
        console.log('✅ 搜索结果加载成功!\n');

        // 截图
        console.log('📸 正在截图...');
        await page.screenshot({ path: 'playwright-test-screenshot.png', fullPage: true });
        console.log('✅ 截图已保存为 playwright-test-screenshot.png\n');

        // 等待 3 秒让用户观察
        console.log('⏸️  等待 3 秒...');
        await page.waitForTimeout(3000);

        console.log('🎉 所有测试完成!Playwright 工作正常!\n');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error(error);
    } finally {
        // 关闭浏览器
        if (browser) {
            console.log('🔒 正在关闭浏览器...');
            await browser.close();
            console.log('✅ 浏览器已关闭');
        }
    }
}

// 运行测试
testPlaywright();
