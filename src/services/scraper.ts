'use server';

import puppeteer from 'puppeteer';

export async function scrapeUrl(url: string): Promise<string> {
    let browser;
    try {
        // Launch the browser and open a new blank page
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for a few seconds to ensure all dynamic content is loaded
        await new Promise(r => setTimeout(r, 3000));
        
        // Extract all links and their text content
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(anchor => ({ href: anchor.href, text: anchor.innerText.trim() }))
                .filter(link => link.text && link.href);
        });

        // Format the links as a string for the AI prompt
        return links.map(link => `Link: ${link.href}\nText: ${link.text}`).join('\n\n');
        
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return ''; // Return empty string on failure
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
