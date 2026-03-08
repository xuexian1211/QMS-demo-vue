---
name: browser-automation
description: |
  浏览器自动化专家。
  使用 Playwright 和 Puppeteer 进行网页自动化。
---

# Browser Automation

浏览器自动化和网页抓取解决方案。

## Tools Overview

### Playwright (Recommended)

```bash
npm install playwright
npx playwright install chromium
```

### Puppeteer

```bash
npm install puppeteer
```

## Playwright Basics

### Launch Browser
```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
```

### Navigation
```typescript
await page.goto('https://example.com');
await page.waitForLoadState('networkidle');

// Click link
await page.click('a[href="/next"]');

// Wait for navigation
await page.goto('https://example.com', { waitUntil: 'networkidle' });
```

### Element Interaction
```typescript
// Fill input
await page.fill('#search-input', 'search query');

// Click button
await page.click('button[type="submit"]');

// Check checkbox
await page.check('#agree');

// Select dropdown
await page.selectOption('select#country', 'US');

// Handle dialog
page.on('dialog', async dialog => {
  await dialog.accept();
});
```

### Extraction
```typescript
// Get text
const title = await page.textContent('h1');

// Get attribute
const link = await page.getAttribute('a', 'href');

// Get multiple elements
const items = await page.$$('.item');
for (const item of items) {
  const text = await item.textContent();
}
```

### Screenshot
```typescript
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ fullPage: true, path: 'full-page.png' });
```

## Puppeteer Basics

### Launch Browser
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
```

### Navigation
```typescript
await page.goto('https://example.com', {
  waitUntil: 'networkidle',
  timeout: 30000
});
```

### Element Interaction
```typescript
// Click
await page.click('#submit');

// Type
await page.type('#email', 'user@example.com');

// Evaluate (run in browser context)
const title = await page.evaluate(() => document.title);
```

## Common Patterns

### Wait for Element
```typescript
// Wait for selector to appear
await page.waitForSelector('#dynamic-content');

// Wait for URL change
await page.waitForURL('**/success');

// Custom wait
await page.waitForFunction(() => document.querySelector('.loaded'));
```

### Handle Iframes
```typescript
const frame = page.frame({ name: 'iframe-name' });
// or
const frame = page.frameLocator('iframe#modal').locator('.content');
```

### Download Handling
```typescript
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('#download-btn')
]);
await download.savePath('/path/to/save');
```

## Best Practices

1. **Use headless mode** for CI/CD pipelines
2. **Set viewport size** for consistent screenshots
3. **Use locators** instead of XPaths when possible
4. **Add explicit waits** instead of sleep
5. **Close browser** in finally block
6. **Handle errors gracefully** with try-catch

### Example: Complete Flow
```typescript
async function scrapeProducts() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('https://shop.example.com');
    
    const products = await page.$$eval('.product', items => 
      items.map(item => ({
        name: item.querySelector('.title')?.textContent,
        price: item.querySelector('.price')?.textContent
      }))
    );
    
    return products;
  } finally {
    await browser.close();
  }
}
```

## Troubleshooting

### Element not found
- Check if element is in iframe
- Wait for element with `waitForSelector`
- Verify selector in browser devtools

### Timeout errors
- Increase timeout: `page.setDefaultTimeout(60000)`
- Check network connectivity
- Verify page is loading correctly

### Memory issues
- Reuse browser instances
- Close pages when done
- Use browser context isolation
