import express from 'express';
import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const appUrl = process.env.APP_URL;

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: geminiApiKey || '' });
  const model = genAI.models.get({ model: 'gemini-2.0-flash' });

  // Initialize Telegram Bot
  let bot: Telegraf | null = null;
  if (botToken) {
    bot = new Telegraf(botToken);

    bot.start((ctx) => ctx.reply('Welcome to Sidad AI! Send me any message and I will reply using Gemini.'));
    bot.help((ctx) => ctx.reply('Just send me a message!'));

    bot.on('text', async (ctx) => {
      try {
        const userMessage = ctx.message.text;
        const result = await genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        });
        
        const responseText = result.text || 'Sorry, I could not generate a response.';
        await ctx.reply(responseText);
      } catch (error) {
        console.error('Error generating response:', error);
        await ctx.reply('Oops! Something went wrong while processing your request.');
      }
    });

    // Set up webhook if APP_URL is provided
    if (appUrl) {
      const webhookPath = `/telegraf/${bot.secretPathComponent()}`;
      app.use(bot.webhookCallback(webhookPath));
      
      try {
        await bot.telegram.setWebhook(`${appUrl}${webhookPath}`);
        console.log(`Webhook set to ${appUrl}${webhookPath}`);
      } catch (e) {
        console.error('Failed to set webhook:', e);
      }
    } else {
      console.log('APP_URL not found, starting polling mode...');
      bot.launch();
    }
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not found. Bot will not start.');
  }

  // API Routes
  app.get('/api/status', (req, res) => {
    res.json({
      botStatus: botToken ? 'Initialized' : 'Missing Token',
      geminiStatus: geminiApiKey ? 'Initialized' : 'Missing API Key',
      webhookUrl: appUrl ? `${appUrl}/telegraf/...` : 'Polling Mode',
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

startServer();
