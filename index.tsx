
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Zap, Activity, Server, Terminal, Code, Copy, Check, 
  Play, Wifi, Database, Smartphone, Key, Info, Globe,
  RefreshCw, Cpu, Layers, ShieldCheck
} from 'lucide-react';

const STORAGE_KEYS = {
  SERVER_URL: 'farida_server_url'
};

const App = () => {
  const [activeTab, setActiveTab] = useState('server-setup');
  const [serverUrl, setServerUrl] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
    if (savedUrl) setServerUrl(savedUrl);
    addLog("نظام فريدة جاهز.. بانتظار تشغيل السيرفر المستقل.");
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const checkServerStatus = async () => {
    if (!serverUrl) return;
    setIsChecking(true);
    addLog(`جاري فحص حالة السيرفر على: ${serverUrl}/status`);
    
    try {
      const response = await fetch(`${serverUrl}/status`, { mode: 'cors' });
      if (response.ok) {
        setIsServerOnline(true);
        addLog("✅ السيرفر متصل! فريدة الآن تسمع وتجيب.");
      } else {
        throw new Error();
      }
    } catch (err) {
      setIsServerOnline(false);
      addLog("❌ السيرفر غير مستجيب. تأكد من تشغيل ملف server.js وفتح المنفذ 3000.");
    } finally {
      setIsChecking(false);
    }
  };

  const nodeJsServerCode = `
/**
 * Farida AI - STANDALONE SERVER (server.js)
 * -----------------------------------------
 * هذا هو المحرك الأساسي (Backend). قم بتشغيله على جهازك أو VPS.
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(cors());
const PORT = 3000;

// إعدادات الذكاء الاصطناعي (ضع مفتاحك هنا)
const genAI = new GoogleGenAI({ apiKey: "YOUR_GEMINI_API_KEY" });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('farida_auth_session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Farida OS", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('--- SCAN THIS QR CODE ---');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Farida is now ONLINE on WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text) {
            console.log(\`📩 Message from \${jid}: \${text}\`);
            try {
                // استدعاء Gemini 3 Flash للرد السريع
                const response = await genAI.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: text,
                    config: {
                        systemInstruction: "أنت فريدة، مساعدة إيهاب اليمني الشخصية. ردي بذكاء، خفة دم مصرية، واحترافية عالية."
                    }
                });
                
                await sock.sendMessage(jid, { text: response.text });
                console.log('✅ Replied successfully');
            } catch (e) {
                console.error('❌ AI Error:', e.message);
            }
        }
    });

    // API لربط لوحة التحكم (التطبيق)
    app.get('/status', (req, res) => {
        res.json({ status: 'online', botId: 'Farida-V1', uptime: process.uptime() });
    });

    app.listen(PORT, () => {
        console.log(\`🚀 Bridge API active on http://localhost:\${PORT}\`);
    });
}

startBot().catch(err => console.error("Critical Error:", err));
  `;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 rtl font-['Cairo'] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 border-l border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Zap size={28} className="text-emerald-500" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Farida OS</h1>
            <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Independent Server Node</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'server-setup', icon: Server, label: 'إعداد السيرفر المستقل' },
            { id: 'server-status', icon: Activity, label: 'لوحة المراقبة' },
            { id: 'ai-config', icon: Cpu, label: 'تخصيص الردود' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-300 ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-2xl scale-105' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              <tab.icon size={20} />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase">Live Health</span>
            <div className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
          </div>
          <div className="text-[11px] font-bold text-slate-400 break-all">{serverUrl || 'Waiting for Connection...'}</div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#030712]">
        {activeTab === 'server-setup' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <header className="space-y-4 text-center lg:text-right">
                <h2 className="text-6xl font-black italic text-white tracking-tighter">بناء السيرفر المستقل</h2>
                <p className="text-slate-500 text-xl font-medium max-w-2xl">هذا هو "القلب" الذي سيقوم بالرد على رسائل واتساب. اتبعه بدقة يا إيهاب.</p>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <div className="glass p-10 rounded-[3.5rem] border-white/5 space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><Layers size={24}/></div>
                         <h4 className="text-2xl font-black text-white">تجهيز البيئة</h4>
                      </div>
                      <div className="space-y-6">
                         {[
                            "ثبت Node.js (إصدار 18 فما فوق).",
                            "أنشئ مجلد باسم 'farida-bot'.",
                            "افتح الـ Terminal داخل المجلد واكتب: npm init -y",
                            "ثبت المكتبات: npm i @whiskeysockets/baileys @google/genai express cors qrcode-terminal",
                            "أنشئ ملف باسم server.js وانسخ الكود الموجود هنا بداخلة."
                         ].map((step, i) => (
                            <div key={i} className="flex gap-6">
                               <span className="text-emerald-500 font-black text-lg">{i+1}.</span>
                               <p className="text-slate-400 font-bold leading-relaxed">{step}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="glass p-10 rounded-[3.5rem] border-emerald-500/10 bg-emerald-500/[0.02] space-y-4">
                      <div className="flex items-center gap-3 text-emerald-500">
                        <ShieldCheck size={20}/>
                        <h5 className="font-black uppercase tracking-widest text-xs">نصيحة أمنية</h5>
                      </div>
                      <p className="text-sm text-slate-400 font-bold leading-loose italic">
                        "لا تشارك ملف farida_auth_session مع أي شخص، هذا الملف يحتوي على مفاتيح الدخول لواتساب الخاص بك."
                      </p>
                   </div>
                </div>

                <div className="glass rounded-[4rem] border-white/5 overflow-hidden flex flex-col h-[700px]">
                   <div className="bg-slate-900/80 p-6 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">server.js</span>
                      </div>
                      <button onClick={() => {
                        navigator.clipboard.writeText(nodeJsServerCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }} className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg hover:scale-105 transition-all">
                        {copied ? <Check size={18}/> : <Copy size={18}/>}
                      </button>
                   </div>
                   <pre className="flex-1 p-8 bg-slate-950/50 text-[11px] font-mono text-emerald-400/80 overflow-auto custom-scrollbar leading-relaxed">
                      {nodeJsServerCode}
                   </pre>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'server-status' && (
          <div className="max-w-5xl mx-auto space-y-12">
             <div className="text-center space-y-4">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-1000 ${isServerOnline ? 'bg-emerald-500/10 text-emerald-500 active-glow' : 'bg-red-500/10 text-red-500'}`}>
                   <Activity size={48} />
                </div>
                <h2 className="text-4xl font-black text-white italic">حالة الإتصال بالسيرفر</h2>
             </div>

             <div className="glass p-12 rounded-[4rem] border-white/5 space-y-10">
                <div className="space-y-6">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 flex items-center gap-2">
                     <Globe size={14} className="text-emerald-500" /> عنوان السيرفر (Local or Public IP)
                   </label>
                   <div className="flex gap-4">
                      <input 
                        value={serverUrl}
                        onChange={(e) => {
                          setServerUrl(e.target.value);
                          localStorage.setItem(STORAGE_KEYS.SERVER_URL, e.target.value);
                        }}
                        placeholder="مثال: http://localhost:3000"
                        className="flex-1 bg-slate-950 border-2 border-white/5 p-8 rounded-[2.5rem] text-2xl font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all"
                      />
                      <button 
                        onClick={checkServerStatus}
                        disabled={isChecking}
                        className="px-12 py-6 bg-emerald-600 rounded-[2.5rem] font-black text-lg shadow-2xl hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-3"
                      >
                        {isChecking ? <RefreshCw className="animate-spin" /> : <Play />} فحص السيرفر
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Server Uptime</div>
                      <div className="text-3xl font-black text-white italic">--:--:--</div>
                   </div>
                   <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">WhatsApp Link</div>
                      <div className="text-3xl font-black text-emerald-500 italic">{isServerOnline ? 'CONNECTED' : 'WAITING'}</div>
                   </div>
                </div>
             </div>

             <div className="glass rounded-[3rem] border-white/5 overflow-hidden">
                <div className="bg-slate-900/50 p-6 border-b border-white/5 flex items-center gap-2">
                   <Terminal size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">System Console</span>
                </div>
                <div className="p-8 h-64 overflow-y-auto custom-scrollbar bg-black/20 terminal-text text-sm text-emerald-500/60 space-y-2">
                   {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ai-config' && (
          <div className="max-w-4xl mx-auto py-20 text-center space-y-12">
             <div className="w-32 h-32 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mx-auto border border-purple-500/20">
                <Cpu size={64} />
             </div>
             <div className="space-y-4">
                <h2 className="text-5xl font-black text-white italic">تخصيص وعي فريدة</h2>
                <p className="text-slate-500 font-bold text-lg">بمجرد تشغيل السيرفر، ستتمكن من تعديل "أوامر النظام" لفريدة من هنا لترسلها للسيرفر فوراً.</p>
             </div>
             <div className="p-12 glass border-dashed border-2 border-white/5 rounded-[4rem] opacity-30">
                <p className="font-black text-sm uppercase tracking-[0.2em]">Server Connection Required to Unlock Configuration</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
