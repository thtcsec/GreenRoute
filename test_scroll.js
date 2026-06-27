const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Set viewport to a typical mobile device
  await page.setViewport({ width: 375, height: 812 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click on CoolStop tab to make sure we are there
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('nav button');
    if (buttons.length > 1) buttons[1].click();
  });

  await page.waitForTimeout(1000); // wait for transitions

  const scrollInfo = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 'No main found';
    
    return {
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
      overflowY: window.getComputedStyle(main).overflowY,
      flex: window.getComputedStyle(main).flex,
      height: window.getComputedStyle(main).height,
      minHeight: window.getComputedStyle(main).minHeight,
    };
  });

  console.log(JSON.stringify(scrollInfo, null, 2));

  await browser.close();
})();
