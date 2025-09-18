
'use server';

import puppeteer from 'puppeteer';

export async function scrapeUrl(url: string): Promise<string> {
    let browser;
    try {
        // Added the full set of recommended arguments for running in a sandboxed environment
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Increased timeout and changed wait condition for more reliability
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

        await page.waitForSelector('body');

        // Extract link data, which is more structured than raw text
        const linkData = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                        .map(a => `${a.textContent?.trim() || ''} - ${a.href}`)
                        .join('\n');
        });

        if (!linkData) {
            return 'SCRAPE_ERROR: No links found on the page.';
        }
        
        return linkData;
        
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `SCRAPE_ERROR: ${errorMessage}`;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
