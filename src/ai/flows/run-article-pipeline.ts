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
    input: { schema: z.object({ content: z.string(), sourceUrl: z.string().url() }) },
    // We will parse the output manually now, so we expect a string.
    output: { format: 'text' },
    prompt: `Based on the following content from {{sourceUrl}}, extract up to 5 of the most prominent articles, providing both the title and the full URL.
    
Content:
{{{content}}}
    
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
    // 1. Scrape the source URL to find article links
    const pageContent = await scrapeUrl(input.sourceUrl);
    const { output } = await findArticleLinksPrompt({ content: pageContent, sourceUrl: input.sourceUrl });

    if (!output) {
      return { message: 'No new articles found.', foundArticles: [] };
    }
    
    // 2. Find and parse the JSON from the potentially messy output string
    let articles: FoundArticle[] = [];
    try {
      // Find the start and end of the JSON object in the string
      const jsonStart = output.indexOf('{');
      const jsonEnd = output.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON object found in the AI response.');
      }
      
      const jsonString = output.substring(jsonStart, jsonEnd + 1);
      const parsed = ArticleLinksSchema.parse(JSON.parse(jsonString));
      articles = parsed.articles;

    } catch (error) {
      console.error("Failed to parse articles from AI response:", error);
      console.error("Original AI output:", output);
      // We can still continue with an empty list if parsing fails
      articles = [];
    }

    if (articles.length === 0) {
        return { message: 'No new articles found.', foundArticles: [] };
    }
    
    return {
        message: `Pipeline completed. Found ${articles.length} articles.`,
        foundArticles: articles,
    };
  }
);
