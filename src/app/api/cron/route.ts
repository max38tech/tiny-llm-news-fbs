import { NextResponse } from 'next/server';
import { runArticlePipeline } from '@/ai/flows/run-article-pipeline';
import { summarizeArticle } from '@/ai/flows/summarize-articles';
import { generateArticleImage } from '@/ai/flows/generate-article-image';
import { addArticle } from '@/lib/firebase/service';
import { getSettings } from '@/lib/firebase/service';

// This is the endpoint that will be called by your cron job service.
// It requires a secret in the Authorization header to prevent abuse.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  console.log('Cron job started...');
  let articlesAdded = 0;

  try {
    const settings = await getSettings();
    
    if (!settings) {
        console.log('No settings found. Skipping pipeline.');
        return NextResponse.json({ success: true, message: 'No settings found.' });
    }

    const sources = settings.sources.split('\n').filter(s => s.trim() !== '');
    const maxPosts = settings.maxPosts;

    for (const sourceUrl of sources) {
        if (articlesAdded >= maxPosts) {
            console.log(`Max posts limit (${maxPosts}) reached.`);
            break;
        }

        console.log(`Processing source: ${sourceUrl}`);
        const pipelineResult = await runArticlePipeline({ sourceUrl });

        if (!pipelineResult.foundArticles || pipelineResult.foundArticles.length === 0) {
            console.log(`No articles found for ${sourceUrl}.`);
            continue;
        }

        for (const foundArticle of pipelineResult.foundArticles) {
            if (articlesAdded >= maxPosts) break;
            
            try {
                console.log(`Summarizing: ${foundArticle.title}`);
                const summaryOutput = await summarizeArticle({ articleUrl: foundArticle.link });

                let finalImage = summaryOutput.featuredImage;

                if (!finalImage) {
                    console.log(`Generating image for: ${summaryOutput.title}`);
                    const imageOutput = await generateArticleImage({ articleDescription: `${summaryOutput.title} - ${summaryOutput.summary}` });
                    finalImage = imageOutput.imageUrl;
                }

                console.log(`Saving to database: ${summaryOutput.title}`);
                await addArticle({
                    ...summaryOutput,
                    featuredImage: finalImage,
                });
                
                articlesAdded++;
                console.log(`Successfully saved: ${summaryOutput.title}`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Error processing article ${foundArticle.link}:`, errorMessage);
            }
        }
    }

    console.log(`Cron job finished. Added ${articlesAdded} new articles.`);
    return NextResponse.json({ success: true, articlesAdded });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Cron job failed:', errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
