
'use server';

import puppeteer from 'puppeteer';

export async function scrapeUrl(url: string): Promise<string> {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for the body element to be present
        await page.waitForSelector('body');

        const pageText = await page.evaluate(() => {
            return document.body.innerText || document.body.textContent;
        });

        if (!pageText || pageText.trim() === '') {
             const fallbackContent = await page.content();
             if (fallbackContent) return fallbackContent;
             return '';
        }
        
        return pageText;
        
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Return a formatted error string to be caught by the caller
        return `SCRAPE_ERROR: ${errorMessage}`;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
