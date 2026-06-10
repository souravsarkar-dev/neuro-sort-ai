const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://neuro-sort-ai.vercel.app/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:/Users/soura/.gemini/antigravity/brain/e101178a-3a30-48e8-86d3-e6630a051069/reference_screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved!');
})();
