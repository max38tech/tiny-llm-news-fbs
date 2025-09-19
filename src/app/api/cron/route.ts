
import { NextResponse } from 'next/server';
import { runArticlePipeline } from '@/ai/flows/run-article-pipeline';
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
    const articleTopic = settings.articleTopic;

    for (const sourceUrl of sources) {
        if (articlesAdded >= maxPosts) {
            console.log(`Max posts limit (${maxPosts}) reached.`);
            break;
        }

        console.log(`Processing source: ${sourceUrl}`);
        const pipelineResult = await runArticlePipeline({ sourceUrl, articleTopic });

        if (pipelineResult.message.startsWith('ERROR')) {
            console.error(`Error processing source ${sourceUrl}: ${pipelineResult.message}`);
            continue;
        }

        if (!pipelineResult.processedArticles || pipelineResult.processedArticles.length === 0) {
            console.log(`No articles processed for ${sourceUrl}.`);
            continue;
        }

        for (const processedArticle of pipelineResult.processedArticles) {
            if (articlesAdded >= maxPosts) break;
            
            try {
                console.log(`Saving to database: ${processedArticle.title}`);
                await addArticle({
                    ...processedArticle,
                    featuredImage: processedArticle.featuredImage || '',
                });
                
                articlesAdded++;
                console.log(`Successfully saved: ${processedArticle.title}`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Error processing article ${processedArticle.originalArticleUrl}:`, errorMessage);
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
