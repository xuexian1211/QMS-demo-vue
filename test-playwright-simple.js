/**
 * Playwright 浏览器简单测试
 * 验证浏览器启动、页面导航和截图功能
 */

import { chromium } from 'playwright';

async function simpleTest() {
    console.log('🚀 开始 Playwright 简单测试...\n');

    let browser;
    try {
        // 启动浏览器
        console.log('📦 正在启动 Chromium 浏览器...');
        browser = await chromium.launch({
            headless: false, // 显示浏览器窗口
            slowMo: 300 // 减慢操作速度
        });
        console.log('✅ 浏览器启动成功!\n');

        // 创建新页面
        const page = await browser.newPage();
        console.log('✅ 页面创建成功!\n');

        // 设置视口大小
        await page.setViewportSize({ width: 1280, height: 720 });

        // 访问示例网站
        console.log('🌐 正在访问 example.com...');
        await page.goto('https://example.com', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        console.log('✅ 页面加载成功!\n');

        // 获取页面标题
        const title = await page.title();
        console.log(`📋 页面标题: ${title}`);

        // 获取页面内容
        const h1Text = await page.textContent('h1');
        console.log(`📝 H1 内容: ${h1Text}\n`);

        // 截图
        console.log('📸 正在截图...');
        await page.screenshot({
            path: 'playwright-simple-test.png',
            fullPage: true
        });
        console.log('✅ 截图已保存为 playwright-simple-test.png\n');

        // 等待 2 秒让用户观察
        console.log('⏸️  等待 2 秒...');
        await page.waitForTimeout(2000);

        console.log('🎉 测试完成!Playwright 工作完全正常!\n');
        console.log('✅ 验证结果:');
        console.log('   - 浏览器启动: ✓');
        console.log('   - 页面导航: ✓');
        console.log('   - 元素定位: ✓');
        console.log('   - 截图功能: ✓\n');

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
simpleTest();
