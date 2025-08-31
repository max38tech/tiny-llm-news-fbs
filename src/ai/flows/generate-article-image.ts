'use server';

/**
 * @fileOverview This flow generates an image for an article if one is not already available.
 *
 * - generateArticleImage - A function that generates an image for the given article description.
 * - GenerateArticleImageInput - The input type for the generateArticleImage function.
 * - GenerateArticleImageOutput - The return type for the generateArticleImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleImageInputSchema = z.object({
  articleDescription: z.string().describe('The content of the article to generate an image for.'),
});
export type GenerateArticleImageInput = z.infer<typeof GenerateArticleImageInputSchema>;

const GenerateArticleImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateArticleImageOutput = z.infer<typeof GenerateArticleImageOutputSchema>;

export async function generateArticleImage(input: GenerateArticleImageInput): Promise<GenerateArticleImageOutput> {
  return generateArticleImageFlow(input);
}

const generateArticleImageFlow = ai.defineFlow(
  {
    name: 'generateArticleImageFlow',
    inputSchema: GenerateArticleImageInputSchema,
    outputSchema: GenerateArticleImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate an image that visually represents the following article content: ${input.articleDescription}`,
    });

    if (!media) {
      throw new Error('Failed to generate image.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
