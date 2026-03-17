import express from 'express';
import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const botToken = '8753625924:AAG8Xbm9KkMr-zO7LVH_FpRSPUvgKAoS6_I';
  const geminiApiKey = 'AIzaSyBGKVCmpMuELfmWs72_cvgjyTKHqZdeTP8';
  const appUrl = 'https://ais-dev-5iodngtzcdu3rfwersxshs-210108824477.europe-west1.run.app';

  const SYSTEM_PROMPT = "تۆ Sidad AI یی، خەلکێ زاخۆیی و ب زمانێ بادینی (زاخۆیی) باخڤە.";

  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
  
  // Initialize Telegram Bot
  let bot: Telegraf | null = null;
  if (botToken) {
    bot = new Telegraf(botToken);

    bot.on('text', async (ctx) => {
      try {
        await ctx.sendChatAction('typing');
        // ل ڤێرە SYSTEM_PROMPT دهێتە تێکەڵکرن دا کو بەرسڤ ب زارۆکێ زاخۆیی بیت
        const result = await genAI.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\nUser: ${ctx.message.text}` }] }],
        });
        
        const responseText = result.text || 'ببوورە، من نەشیا بەرسڤێ چێکەم.';
        await ctx.reply(responseText);
      } catch (e) {
        console.error("Error in Gemini 3:", e);
        await ctx.reply("ببوورە برا، نوکە کێشەیەک دگەل مۆدێلێ Gemini 3 هەیە.");
      }
    });

    // Polling setup (Webhook disabled)
    // app.use(bot.webhookCallback(`/bot${botToken}`));
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not found. Bot will not start.');
  }

  let botRunning = false;

  // Root route
  app.get('/', (req, res) => res.send('Sidad AI is ONLINE (Flash Edition)! ✅'));

  // Status API
  app.get('/api/status', (req, res) => {
    res.json({
      botStatus: botToken ? (botRunning ? 'Running' : 'Initialized') : 'Missing Token',
      geminiStatus: geminiApiKey ? 'Initialized' : 'Missing Key',
      webhookUrl: null, // Polling mode
      mode: 'Polling'
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

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ Server is running on port ${PORT}`);
    if (bot && botToken) {
      try {
        console.log("🔄 Stopping potential webhooks and starting Polling...");
        await bot.telegram.deleteWebhook();
        bot.launch();
        botRunning = true;
        console.log("✅ Sidad AI is now ONLINE (Polling Mode)!");
      } catch (err) {
        console.error("Failed to start polling:", err);
      }
    }
  });

  // Graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

startServer();
