import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-articles.ts';
import '@/ai/flows/generate-article-image.ts';
import '@/ai/flows/run-article-pipeline.ts';
