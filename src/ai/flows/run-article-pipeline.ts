'use server';
/**
 * @fileOverview This flow orchestrates the entire process of finding,
 * summarizing, and generating images for articles, and then storing them.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { summarizeArticle } from './summarize-articles';
import { generateArticleImage } from './generate-article-image';
import { scrapeUrl } from '@/services/scraper';
import { addArticle } from '@/lib/firebase/service';

const ArticlePipelineInputSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the source to find articles from (e.g., a news site or blog).'),
});
export type ArticlePipelineInput = z.infer<typeof ArticlePipelineInputSchema>;

// The pipeline output is now a confirmation message.
const ArticlePipelineOutputSchema = z.object({
    message: z.string(),
    articlesAdded: z.number(),
    foundTitles: z.array(z.string()),
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
    
Your response MUST be only the raw JSON in the specified format. Do not include markdown, any conversational text, or any other explanations.`,
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
        console.log('No article links found.');
        return { message: 'No new articles found.', articlesAdded: 0, foundTitles: [] };
    }
    
    const foundTitles = output.articles.map(a => a.title);
    let articlesAdded = 0;
    // 2. For each link, run the summarization and image generation flows in parallel
    const processingPromises = output.articles.map(async (article) => {
      try {
        // Summarize the article
        const summaryOutput = await summarizeArticle({ articleUrl: article.link });

        let finalImage = summaryOutput.featuredImage;

        // If no featured image, generate one
        if (!finalImage) {
            const imageOutput = await generateArticleImage({ articleDescription: `${summaryOutput.title} - ${summaryOutput.summary}` });
            finalImage = imageOutput.imageUrl;
        }

        // 3. Store the processed article in Firestore
        await addArticle({
          ...summaryOutput,
          featuredImage: finalImage,
        });
        articlesAdded++;

      } catch (error) {
          console.error(`Error processing article ${article.link}:`, error);
      }
    });

    await Promise.all(processingPromises);
    
    return {
        message: `Pipeline completed. Added ${articlesAdded} new articles.`,
        articlesAdded,
        foundTitles,
    };
  }
);
