
'use server';
/**
 * @fileOverview This flow orchestrates finding articles from a source URL.
 * It no longer processes them, returning the found links to the client.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { scrapeUrl } from '@/services/scraper';

const ArticlePipelineInputSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the source to find articles from (e.g., a news site or blog).'),
});
export type ArticlePipelineInput = z.infer<typeof ArticlePipelineInputSchema>;

const FoundArticleSchema = z.object({
    title: z.string(),
    link: z.string().url(),
});
export type FoundArticle = z.infer<typeof FoundArticleSchema>;


const ArticlePipelineOutputSchema = z.object({
    message: z.string(),
    foundArticles: z.array(FoundArticleSchema),
});
export type ArticlePipelineOutput = z.infer<typeof ArticlePipelineOutputSchema>;

export async function runArticlePipeline(input: ArticlePipelineInput): Promise<ArticlePipelineOutput> {
  return articlePipelineFlow(input);
}

const findArticleLinksPrompt = ai.definePrompt({
    name: 'findArticleLinksPrompt',
    input: { schema: z.object({ linkData: z.string(), sourceUrl: z.string().url() }) },
    output: { format: 'json', schema: z.object({ articles: z.array(FoundArticleSchema) }) },
    prompt: `You are an expert at identifying primary news articles from a raw list of hyperlinks. 
Based on the following hyperlink data from {{sourceUrl}}, extract up to 5 of the most prominent articles.
A prominent article will have a descriptive title and a URL that looks like a direct link to a story, not a category or author page.

Link Data:
{{{linkData}}}
    
CRITICAL: Your response must contain ONLY the raw JSON object, without any markdown, conversational text, or other characters. Do not include 'json' or \`\`\` in your response.`,
});

const ArticleLinksSchema = z.object({ articles: z.array(FoundArticleSchema) });

const articlePipelineFlow = ai.defineFlow(
  {
    name: 'articlePipelineFlow',
    inputSchema: ArticlePipelineInputSchema,
    outputSchema: ArticlePipelineOutputSchema,
  },
  async (input) => {
    // 1. Scrape the source URL to get its content (either links or body text)
    const scrapedContent = await scrapeUrl(input.sourceUrl);
    
    if (scrapedContent.startsWith('SCRAPE_ERROR:')) {
        return { message: scrapedContent, foundArticles: [] };
    }

    if (!scrapedContent) {
        return { message: 'Could not retrieve content from the source URL.', foundArticles: [] };
    }
    
    // The scrape might return links or just text. The prompt can handle either.
    const { output } = await findArticleLinksPrompt({ linkData: scrapedContent, sourceUrl: input.sourceUrl });
    
    let articlesOutput;
     if (typeof output === 'string') {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                articlesOutput = ArticleLinksSchema.parse(JSON.parse(jsonMatch[0]));
            } catch (e) {
                 const errorMessage = e instanceof Error ? e.message : String(e);
                return { message: `ERROR: Failed to parse JSON from AI response. Details: ${errorMessage}`, foundArticles: [] };
            }
        }
    } else {
        articlesOutput = ArticleLinksSchema.parse(output);
    }
    

    if (!articlesOutput || !articlesOutput.articles || articlesOutput.articles.length === 0) {
        return { message: 'No new articles found.', foundArticles: [] };
    }
    
    return {
        message: `Pipeline completed. Found ${articlesOutput.articles.length} articles.`,
        foundArticles: articlesOutput.articles,
    };
  }
);
