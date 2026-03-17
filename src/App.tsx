import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Settings, ShieldCheck, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then(res => {
        if (!res.ok) throw new Error('Failed to connect to the bot API.');
        return res.json();
      })
      .then(data => {
        setStatus(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch status:', err);
        setError('Failed to connect to the bot API.');
      });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Sidad AI <span className="text-emerald-500 text-2xl block md:inline md:ml-2">(Zakho Edition)</span></h1>
              <p className="text-zinc-400">Telegram Bot Dashboard</p>
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard 
              title="Bot Status" 
              value={error || status?.botStatus || 'Checking...'} 
              icon={<MessageSquare className="w-5 h-5" />}
              active={status?.botStatus === 'Running' || status?.botStatus === 'Initialized'}
            />
            <StatusCard 
              title="Gemini AI" 
              value={error ? 'Unavailable' : (status?.geminiStatus || 'Checking...')} 
              icon={<ShieldCheck className="w-5 h-5" />}
              active={status?.geminiStatus === 'Initialized'}
            />
            <StatusCard 
              title="Mode" 
              value={status?.webhookUrl ? 'Webhook' : 'Polling'} 
              icon={<Settings className="w-5 h-5" />}
              active={true}
            />
          </div>

          {/* Setup Instructions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
          >
            <h2 className="text-2xl font-semibold">Setup Instructions</h2>
            
            <div className="space-y-6">
              <Step 
                number="1" 
                title="Create a Telegram Bot" 
                description="Message @BotFather on Telegram and follow the steps to create a new bot. You will receive a Bot Token."
                link="https://t.me/BotFather"
              />
              
              <Step 
                number="2" 
                title="Configure Environment Variables" 
                description="Go to the Secrets panel in AI Studio and add the following variable:"
              >
                <div className="mt-4 bg-black rounded-xl p-4 font-mono text-sm border border-zinc-800 flex items-center justify-between">
                  <span className="text-emerald-400">TELEGRAM_BOT_TOKEN</span>
                  <button 
                    onClick={() => copyToClipboard('TELEGRAM_BOT_TOKEN')}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>
              </Step>

              <Step 
                number="3" 
                title="Restart the Server" 
                description="Once you've added the token, the bot will automatically start responding to messages."
              />
            </div>
          </motion.div>

          {/* Warning if missing token */}
          {status?.botStatus === 'Missing Token' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4 items-start"
            >
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-500">Action Required</h3>
                <p className="text-amber-500/80 text-sm mt-1">
                  The Telegram Bot Token is missing. Please add it to your environment variables to enable the bot.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function StatusCard({ title, value, icon, active }: { title: string, value: string, icon: React.ReactNode, active: boolean }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
          {icon}
        </div>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
      </div>
      <div>
        <p className="text-sm text-zinc-500">{title}</p>
        <p className="text-lg font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description, link, children }: { number: string, title: string, description: string, link?: string, children?: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-sm">
        {number}
      </div>
      <div className="space-y-2 flex-1">
        <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
          {title}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
        {children}
      </div>
    </div>
  );
}
