'use server';

/**
 * @fileOverview Summarizes news articles and blog posts related to running small LLMs on limited resources.
 *
 * - summarizeArticle - A function that handles the article summarization process.
 * - SummarizeArticleInput - The input type for the summarizeArticle function.
 * - SummarizeArticleOutput - The return type for the summarizeArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeArticleInputSchema = z.object({
  articleContent: z.string().describe('The content of the article to summarize.'),
  articleUrl: z.string().url().describe('The URL of the original article.'),
  featuredImage: z.string().optional().describe('URL of the featured image if available.')
});
export type SummarizeArticleInput = z.infer<typeof SummarizeArticleInputSchema>;

const SummarizeArticleOutputSchema = z.object({
  summary: z.string().describe('The summarized content of the article.'),
  originalArticleUrl: z.string().url().describe('The URL of the original article.'),
  featuredImage: z.string().optional().describe('URL of the featured image if available or AI generated.')
});
export type SummarizeArticleOutput = z.infer<typeof SummarizeArticleOutputSchema>;

export async function summarizeArticle(input: SummarizeArticleInput): Promise<SummarizeArticleOutput> {
  return summarizeArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeArticleInputSchema},
  output: {schema: SummarizeArticleOutputSchema},
  prompt: `You are an AI expert in summarizing technical blog posts and news articles related to running small LLMs on limited resources.

  Summarize the following article content, extracting the key information and insights related to small LLMs.  Include the original article URL and a featured image if available, otherwise generate one.

  Article Content: {{{articleContent}}}
  Original Article URL: {{{articleUrl}}}
  Featured Image URL: {{{featuredImage}}}
  `
});

const summarizeArticleFlow = ai.defineFlow(
  {
    name: 'summarizeArticleFlow',
    inputSchema: SummarizeArticleInputSchema,
    outputSchema: SummarizeArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
