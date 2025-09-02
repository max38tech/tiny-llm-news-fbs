'use server';
/**
 * @fileOverview This flow orchestrates the entire process of finding,
 * summarizing, and generating images for articles.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { summarizeArticle, SummarizeArticleOutput } from './summarize-articles';
import { generateArticleImage } from './generate-article-image';
import { scrapeUrl } from '@/services/scraper';

const ArticlePipelineInputSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the source to find articles from (e.g., a news site or blog).'),
});
export type ArticlePipelineInput = z.infer<typeof ArticlePipelineInputSchema>;

const ArticlePipelineOutputSchema = z.array(
    SummarizeArticleOutput.extend({
        title: z.string(),
        summary: z.string(),
        originalArticleUrl: z.string().url(),
        featuredImage: z.string().url().optional(),
    })
);
export type ArticlePipelineOutput = z.infer<typeof ArticlePipelineOutputSchema>;

export async function runArticlePipeline(input: ArticlePipelineInput): Promise<ArticlePipelineOutput> {
  return articlePipelineFlow(input);
}

const findArticleLinksPrompt = ai.definePrompt({
    name: 'findArticleLinksPrompt',
    input: { schema: z.object({ content: z.string(), sourceUrl: z.string().url() }) },
    output: { schema: z.object({ links: z.array(z.string().url()) }) },
    prompt: `Based on the following content from {{sourceUrl}}, extract up to 5 of the most prominent article URLs.
    
    Content:
    {{{content}}}
    
    Return only the URLs in a JSON array.`,
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
    const { output: linkOutput } = await findArticleLinksPrompt({ content: pageContent, sourceUrl: input.sourceUrl });

    if (!linkOutput || !linkOutput.links || linkOutput.links.length === 0) {
        console.log('No article links found.');
        return [];
    }
    
    // 2. For each link, run the summarization and image generation flows in parallel
    const processingPromises = linkOutput.links.map(async (articleUrl) => {
      try {
        // Summarize the article
        const summaryOutput = await summarizeArticle({ articleUrl });

        let finalImage = summaryOutput.featuredImage;

        // If no featured image, generate one
        if (!finalImage) {
            const imageOutput = await generateArticleImage({ articleDescription: `${summaryOutput.title} - ${summaryOutput.summary}` });
            finalImage = imageOutput.imageUrl;
        }

        return {
          ...summaryOutput,
          featuredImage: finalImage,
        };
      } catch (error) {
          console.error(`Error processing article ${articleUrl}:`, error);
          return null; // Return null for failed articles
      }
    });

    const results = await Promise.all(processingPromises);
    
    // Filter out any articles that failed to process
    return results.filter((result): result is NonNullable<typeof result> => result !== null);
  }
);
