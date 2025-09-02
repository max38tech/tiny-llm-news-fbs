import { JSDOM } from 'jsdom';

// A simple (and naive) scraper. In a real-world scenario,
// you would want to use a more robust solution.
export async function scrapeUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const html = await response.text();
        const dom = new JSDOM(html, { url });
        
        // Remove script and style elements
        dom.window.document.querySelectorAll('script, style').forEach(el => el.remove());
        
        // In a real app, you'd use a more sophisticated library like Readability.js
        // to extract the main content. For this demo, we'll just get the body text.
        const body = dom.window.document.querySelector('body');
        return body ? body.textContent || '' : '';
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return ''; // Return empty string on failure
    }
}
