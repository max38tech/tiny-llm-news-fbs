'use server';

import { JSDOM } from 'jsdom';

export async function scrapeUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            return `SCRAPE_ERROR: Failed to fetch ${url}. Status: ${response.status} ${response.statusText}`;
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const { document } = dom.window;

        // Remove script and style elements to clean up the text
        document.querySelectorAll('script, style').forEach(elem => elem.remove());
        
        // Get all links
        const links = Array.from(document.querySelectorAll('a'));
        
        if (links.length === 0) {
            // If no links, return the body text as a fallback
            const bodyText = document.body.textContent || '';
            if (bodyText.trim()) return bodyText;
            return 'SCRAPE_ERROR: No links or text content found on the page.';
        }

        const linkData = links
            .map(a => {
                const text = a.textContent?.trim() || '';
                // Resolve relative URLs to absolute URLs
                const href = new URL(a.href, url).href;
                return `${text} - ${href}`;
            })
            .join('\n');
            
        return linkData;

    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `SCRAPE_ERROR: ${errorMessage}`;
    }
}
