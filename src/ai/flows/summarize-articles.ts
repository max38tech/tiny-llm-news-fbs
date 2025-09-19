'use server';

/**
 * @fileOverview Summarizes a news article from a given URL.
 *
 * - summarizeArticle - A function that handles the article summarization process.
 * - SummarizeArticleInput - The input type for the summarizeArticle function.
 * - SummarizeArticleOutput - The return type for the summarizeArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { scrapeUrl } from '@/services/scraper';

const SummarizeArticleInputSchema = z.object({
  articleUrl: z.string().url().describe('The URL of the article to summarize.'),
  articleTopic: z.string().describe('The key topic to focus on when summarizing the article.')
});
export type SummarizeArticleInput = z.infer<typeof SummarizeArticleInputSchema>;

const SummarizeArticleOutputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  summary: z.string().describe('The summarized content of the article.'),
  originalArticleUrl: z.string().url().describe('The URL of the original article.'),
  featuredImage: z.string().optional().describe('URL of the featured image if available.')
});
export type SummarizeArticleOutput = z.infer<typeof SummarizeArticleOutputSchema>;

export async function summarizeArticle(input: SummarizeArticleInput): Promise<SummarizeArticleOutput> {
  return summarizeArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: z.object({ articleContent: z.string(), articleUrl: z.string(), articleTopic: z.string() })},
  output: {schema: SummarizeArticleOutputSchema},
  prompt: `You are an AI expert in summarizing blog posts and news articles with a specific focus.

  Your task is to summarize the following article content, focusing specifically on information related to "{{articleTopic}}".
  The summary should be detailed and take an average reader about 1 minute to read (around 200-250 words). Provide a suitable title for the article that reflects this focus.
  
  From the provided content, identify the most prominent image URL to use as a featured image. The URL must be a direct link to an image file (e.g., .jpg, .png, .webp). Do not select icons or logos. If no suitable image is found, do not include the featuredImage field.

  Return the original article URL.

  Article Content: {{{articleContent}}}
  Original Article URL: {{{articleUrl}}}
  `
});

const summarizeArticleFlow = ai.defineFlow(
  {
    name: 'summarizeArticleFlow',
    inputSchema: SummarizeArticleInputSchema,
    outputSchema: SummarizeArticleOutputSchema,
  },
  async (input) => {
    const articleContent = await scrapeUrl(input.articleUrl);
    
    const {output} = await prompt({
        articleContent,
        articleUrl: input.articleUrl,
        articleTopic: input.articleTopic,
    });
    return output!;
  }
);
