import puppeteer from 'puppeteer';

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER PAGE ERROR:', error.message));
    page.on('requestfailed', request => {
        if (request.failure()) {
            console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
        }
    });

    console.log('Navigating to http://localhost:8080');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' }).catch(e => console.log('Goto error:', e));

    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    console.log('Done.');
})();
