'use server';

import { JSDOM } from 'jsdom';

// A simple (and naive) scraper. In a real-world scenario,
// you would want to use a more robust solution.
export async function scrapeUrl(url: string): Promise<string> {
    try {
        const response = await fetch(`https://r.jina.ai/${url}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        
        const text = await response.text();
        return text;

    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return ''; // Return empty string on failure
    }
}
