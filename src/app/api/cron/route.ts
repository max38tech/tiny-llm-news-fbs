
import { NextResponse } from 'next/server';
import { runArticlePipeline } from '@/ai/flows/run-article-pipeline';
import { addArticle, addPipelineRunLog } from '@/lib/firebase/service';
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

  const log: string[] = [];
  const addLog = (message: string) => {
      console.log(message);
      log.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  addLog('Cron job started...');
  let articlesAdded = 0;

  try {
    const settings = await getSettings();
    
    if (!settings) {
        addLog('No settings found. Skipping pipeline.');
        await addPipelineRunLog({ log, articlesAdded: 0, status: 'Failure' });
        return NextResponse.json({ success: true, message: 'No settings found.' });
    }

    const sources = settings.sources.split('\n').filter(s => s.trim() !== '');
    const maxPosts = settings.maxPosts;
    const articleTopic = settings.articleTopic;

    for (const sourceUrl of sources) {
        if (articlesAdded >= maxPosts) {
            addLog(`Max posts limit (${maxPosts}) reached.`);
            break;
        }

        addLog(`Processing source: ${sourceUrl}`);
        const pipelineResult = await runArticlePipeline({ sourceUrl, articleTopic });

        if (pipelineResult.message.startsWith('ERROR')) {
            addLog(`Error processing source ${sourceUrl}: ${pipelineResult.message}`);
            continue;
        }

        if (!pipelineResult.processedArticles || pipelineResult.processedArticles.length === 0) {
            addLog(`No articles processed for ${sourceUrl}.`);
            continue;
        }

        for (const processedArticle of pipelineResult.processedArticles) {
            if (articlesAdded >= maxPosts) break;
            
            try {
                addLog(`Saving to database: ${processedArticle.title}`);
                await addArticle({
                    ...processedArticle,
                    featuredImage: processedArticle.featuredImage || '',
                });
                
                articlesAdded++;
                addLog(`Successfully saved: ${processedArticle.title}`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Error processing article ${processedArticle.originalArticleUrl}: ${errorMessage}`);
            }
        }
    }

    addLog(`Cron job finished. Added ${articlesAdded} new articles.`);
    const status = log.some(l => l.includes('Error')) ? (articlesAdded > 0 ? 'Partial Success' : 'Failure') : 'Success';
    await addPipelineRunLog({ log, articlesAdded, status });
    return NextResponse.json({ success: true, articlesAdded });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`Cron job failed: ${errorMessage}`);
    await addPipelineRunLog({ log, articlesAdded: 0, status: 'Failure' });
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
