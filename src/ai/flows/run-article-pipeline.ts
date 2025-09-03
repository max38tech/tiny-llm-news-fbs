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
    input: { schema: z.object({ content: z.string(), sourceUrl: z.string().url() }) },
    output: { schema: z.object({ articles: z.array(z.object({ title: z.string(), link: z.string().url()})) }) },
    prompt: `Based on the following content from {{sourceUrl}}, extract up to 5 of the most prominent articles, providing both the title and the full URL.
    
Content:
{{{content}}}
    
CRITICAL: Your response must contain ONLY the raw JSON object, without any markdown, conversational text, or other characters. Do not include 'json' or \`\`\` in your response.`,
});


const articlePipelineFlow = ai.defineFlow(
  {
    name: 'articlePipelineFlow',
    inputSchema: ArticlePipelineInputSchema,
    outputSchema: ArticlePipelineOutputSchema,
  },
  async (input) => {
    // 1. Scrape the source URL to find article links
    const pageContent = await scrapeUrl(input.sourceUrl);
    const { output } = await findArticleLinksPrompt({ content: pageContent, sourceUrl: input.sourceUrl });

    if (!output || !output.articles || output.articles.length === 0) {
        return { message: 'No new articles found.', foundArticles: [] };
    }
    
    return {
        message: `Pipeline completed. Found ${output.articles.length} articles.`,
        foundArticles: output.articles,
    };
  }
);
