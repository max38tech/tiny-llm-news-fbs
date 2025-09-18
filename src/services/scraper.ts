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
            // Prefer innerText as it's closer to what a user sees, but fallback to textContent
            return document.body.innerText || document.body.textContent;
        });

        if (!pageText || pageText.trim() === '') {
            console.error(`No text content found on ${url}`);
            // Return an empty string or some indicator of failure
            return '';
        }
        
        return pageText;
        
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        // Return empty string on failure to allow the pipeline to handle it gracefully.
        return '';
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
