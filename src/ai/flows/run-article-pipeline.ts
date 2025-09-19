
'use server';
/**
 * @fileOverview This flow orchestrates finding and summarizing articles from a source URL.
 * It identifies relevant article links, scrapes their content, and returns summaries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ArticlePipelineInputSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the source to find articles from (e.g., a news site or blog).'),
  articleTopic: z.string().describe('The key topic to focus on when selecting and summarizing articles.')
});
export type ArticlePipelineInput = z.infer<typeof ArticlePipelineInputSchema>;

const ProcessedArticleSchema = z.object({
  title: z.string().describe('The title of the article.'),
  summary: z.string().describe('The summarized content of the article.'),
  originalArticleUrl: z.string().url().describe('The URL of the original article.'),
  featuredImage: z.string().optional().describe('URL of the featured image if available.')
});
export type ProcessedArticle = z.infer<typeof ProcessedArticleSchema>;


const ArticlePipelineOutputSchema = z.object({
  message: z.string(),
  processedArticles: z.array(ProcessedArticleSchema),
});
export type ArticlePipelineOutput = z.infer<typeof ArticlePipelineOutputSchema>;

export async function runArticlePipeline(input: ArticlePipelineInput): Promise<ArticlePipelineOutput> {
  return articlePipelineFlow(input);
}

const processArticlesPrompt = ai.definePrompt({
    name: 'processArticlesPrompt',
    input: { schema: ArticlePipelineInputSchema },
    output: { schema: z.object({ articles: z.array(ProcessedArticleSchema) }) },
    prompt: `You are an AI expert tasked with building a news digest about "{{articleTopic}}".

Your job is to perform the following steps:
1.  **Analyze the source URL**: Visit the provided source URL: {{sourceUrl}}.
2.  **Identify Relevant Articles**: From the source, identify up to 3 of the most prominent and relevant articles related to the topic of "{{articleTopic}}".
3.  **Scrape and Summarize**: For each identified article, navigate to its URL, scrape its content, and write a detailed summary (around 200-250 words) that focuses on information relevant to "{{articleTopic}}".
4.  **Extract Details**: For each article, extract the title and the original URL. Attempt to find a featured image URL if one is available and prominent (do not select logos or icons).
5.  **Return JSON**: Return a JSON object containing a list of the processed articles.

CRITICAL: Your response must contain ONLY the raw JSON object, without any markdown, conversational text, or other characters. Do not include 'json' or \`\`\` in your response.`,
});

const articlePipelineFlow = ai.defineFlow(
  {
    name: 'articlePipelineFlow',
    inputSchema: ArticlePipelineInputSchema,
    outputSchema: ArticlePipelineOutputSchema,
  },
  async (input) => {
    const { output } = await processArticlesPrompt(input);

    if (!output || !output.articles || output.articles.length === 0) {
        return { message: 'No new articles were processed.', processedArticles: [] };
    }
    
    return {
        message: `Pipeline completed. Processed ${output.articles.length} articles.`,
        processedArticles: output.articles,
    };
  }
);
