import 'dotenv/config';

import express from 'express';

import cors from 'cors';

import { extractRecipeRouter } from './routes/extract-recipe';

import { getAiProviderName } from './services/ai';



const app = express();

const PORT = process.env.PORT ?? 3001;



// Allow requests from Expo dev server and production app

app.use(

  cors({

    origin: true,

    methods: ['GET', 'POST'],

  })

);

app.use(express.json({ limit: '1mb' }));



app.get('/health', (_req, res) => {

  res.json({

    status: 'ok',

    service: 'recipe-extractor-api',

    aiProvider: getAiProviderName(),

  });

});



app.use('/api/extract-recipe', extractRecipeRouter);



app.listen(PORT, () => {

  console.log(`Recipe Extractor API running on http://localhost:${PORT}`);

  console.log(`AI provider: ${getAiProviderName()}`);

  if (getAiProviderName() === 'ollama-local') {

    console.log(`Ollama: ${process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'} (model: ${process.env.OLLAMA_MODEL ?? 'llama3.2'})`);

  }

});

