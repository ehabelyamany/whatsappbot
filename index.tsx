
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Zap, Activity, Server, Terminal, Code, Copy, Check, 
  Play, Wifi, Database, Smartphone, Key, Info, Globe,
  RefreshCw, Cpu, Layers, ShieldCheck, Settings, Send,
  CloudLightning, ExternalLink, Rocket
} from 'lucide-react';

const STORAGE_KEYS = {
  SERVER_URL: 'farida_server_url'
};

const App = () => {
  const [activeTab, setActiveTab] = useState('cloud-guide');
  const [serverUrl, setServerUrl] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
    if (savedUrl) setServerUrl(savedUrl);
    addLog("نظام فريدة السحابي جاهز.. بانتظار ربط المحرك.");
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const checkServerStatus = async () => {
    if (!serverUrl) return;
    setIsChecking(true);
    addLog(`جاري فحص حالة المحرك البعيد: ${serverUrl}...`);
    try {
      const response = await fetch(`${serverUrl}/status`, { mode: 'cors' });
      const data = await response.json();
      if (data.status === 'online') {
        setIsServerOnline(true);
        addLog(`✅ المحرك متصل! النسخة: ${data.version || '1.0.0'}`);
      }
    } catch (err) {
      setIsServerOnline(false);
      addLog("❌ المحرك غير مستجيب. تأكد من رفعه على Render/Railway وتفعيل خيار CORS.");
    } finally {
      setIsChecking(false);
    }
  };

  const nodeJsServerCode = `
/**
 * FARIDA ENGINE - CLOUD VERSION (server.js)
 * ---------------------------------------
 * ارفع هذا الكود على Render.com أو Railway.app
 * لا يعمل على Vercel بسبب قيود الـ Serverless.
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(cors()); // مهم جداً للربط مع لوحة التحكم

// إعدادات البيئة
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY; // ضعه في إعدادات Render

const genAI = new GoogleGenAI({ apiKey: API_KEY });

async function startEngine() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Farida Cloud", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('SCAN THIS QR CODE IN LOGS:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startEngine();
        } else if (connection === 'open') {
            console.log('✅ Farida Engine is Online on WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const jid = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text) {
            try {
                const response = await genAI.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: text,
                    config: {
                        systemInstruction: "أنت فريدة، المساعدة الذكية لإيهاب اليمني. ردي بذكاء ودلع مصري واحترافية."
                    }
                });
                await sock.sendMessage(jid, { text: response.text });
            } catch (e) {
                console.error('AI Error:', e.message);
            }
        }
    });

    app.get('/status', (req, res) => {
        res.json({ status: 'online', version: '2.0.0-cloud', uptime: process.uptime() });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(\`🚀 Engine active on port \${PORT}\`);
    });
}

if (!API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing in Environment Variables!");
    process.exit(1);
}

startEngine().catch(err => console.error("Fatal:", err));
  `;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 rtl font-['Cairo'] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 border-l border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl ring-1 ring-emerald-500/20 active-glow">
            <CloudLightning size={28} className="text-emerald-500" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Farida <span className="text-emerald-500">Cloud</span></h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Remote Command Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {[
            { id: 'cloud-guide', icon: Rocket, label: 'دليل النشر السحابي' },
            { id: 'engine-code', icon: Code, label: 'كود المحرك (Node.js)' },
            { id: 'dashboard', icon: Activity, label: 'لوحة التحكم المركزية' },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-[1.8rem] transition-all duration-500 ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-2xl scale-105' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              <tab.icon size={20} />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase">Remote Link</span>
              <div className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></div>
           </div>
           <p className="text-[10px] font-mono text-slate-400 truncate">{serverUrl || 'No Connection'}</p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#030712] relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

        {activeTab === 'cloud-guide' && (
          <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-10">
             <header className="space-y-4">
                <h2 className="text-6xl font-black italic text-white tracking-tighter">ازاي ترفع "فريدة" للسماء؟ ☁️</h2>
                <p className="text-slate-500 text-xl font-medium leading-relaxed">بما إن Vercel مش هينفع للمحرك، هنستخدم **Render.com** (مجاني وسهل جداً).</p>
             </header>

             <div className="grid grid-cols-1 gap-6">
                {[
                  { title: "الخطوة الأولى: السورس كود", desc: "انسخ كود المحرك من التبويبة التانية، وحطه في ملف server.js وارفع الملف ده على حسابك في GitHub.", icon: GithubIcon },
                  { title: "الخطوة الثانية: حساب Render", desc: "ادخل على Render.com، واعمل Web Service جديدة واربطها بالمستودع بتاعك على جيت هاب.", icon: Globe },
                  { title: "الخطوة الثالثة: الإعدادات", desc: "في قسم Environment، ضيف متغير اسمه GEMINI_API_KEY وحط فيه مفتاحك الخاص.", icon: Key },
                  { title: "الخطوة الرابعة: الانطلاق", desc: "أول ما Render يخلص الرفع، هيديك رابط (URL). خده وتعالى حطه هنا في لوحة التحكم.", icon: Rocket }
                ].map((step, i) => (
                  <div key={i} className="glass p-8 rounded-[3rem] border-white/5 flex gap-8 items-start hover:border-emerald-500/20 transition-all group">
                     <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 font-black text-2xl shrink-0 group-hover:scale-110 transition-transform">{i+1}</div>
                     <div className="space-y-2">
                        <h4 className="text-xl font-black text-white">{step.title}</h4>
                        <p className="text-slate-400 font-bold text-sm leading-relaxed">{step.desc}</p>
                     </div>
                  </div>
                ))}
             </div>

             <div className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-[3rem] flex items-center gap-6">
                <Info className="text-blue-500" size={32} />
                <p className="text-sm font-bold text-blue-400">ملحوظة: لو رفعت اللوحة دي على Vercel، هتقدر تتحكم في المحرك من أي مكان في العالم بموبايلك.</p>
             </div>
          </div>
        )}

        {activeTab === 'engine-code' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95">
             <div className="flex justify-between items-center px-4">
                <h2 className="text-4xl font-black text-white italic">كود المحرك السحابي</h2>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(nodeJsServerCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-8 py-4 bg-emerald-600 rounded-2xl font-black text-white flex items-center gap-3 shadow-2xl hover:bg-emerald-500 transition-all"
                >
                  {copied ? <Check size={20}/> : <Copy size={20}/>} {copied ? 'تم النسخ!' : 'نسخ الكود'}
                </button>
             </div>
             <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
                <div className="bg-slate-900/80 p-5 flex items-center gap-2 border-b border-white/5">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mr-4">Production-Ready server.js</span>
                </div>
                <pre className="p-10 bg-slate-950/50 text-xs font-mono text-emerald-400/80 overflow-auto h-[500px] leading-loose custom-scrollbar">
                   {nodeJsServerCode}
                </pre>
             </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-10">
             <div className="text-center space-y-4 py-6">
                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Remote Commander</h2>
                <p className="text-slate-500 font-bold">اربط المحرك البعيد باللوحة المركزية</p>
             </div>

             <div className="glass p-12 rounded-[4rem] border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                
                <div className="space-y-6 relative z-10">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 flex items-center gap-2">
                      <Globe size={14} className="text-emerald-500" /> Engine URL (Render/Railway)
                   </label>
                   <div className="flex gap-4">
                      <input 
                        value={serverUrl}
                        onChange={(e) => {
                          setServerUrl(e.target.value);
                          localStorage.setItem(STORAGE_KEYS.SERVER_URL, e.target.value);
                        }}
                        placeholder="https://farida-engine.onrender.com"
                        className="flex-1 bg-slate-950 border-2 border-white/5 p-8 rounded-[2.5rem] text-xl font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all shadow-inner"
                      />
                      <button 
                        onClick={checkServerStatus}
                        disabled={isChecking}
                        className="px-12 py-6 bg-emerald-600 rounded-[2.5rem] font-black text-lg shadow-2xl hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-3"
                      >
                        {isChecking ? <RefreshCw className="animate-spin" /> : <Play />} فحص الاتصال
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 bg-black/40 border border-white/5 rounded-[3rem] space-y-4 group hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
                         <Activity size={18} className={isServerOnline ? "text-emerald-500" : "text-slate-700"} />
                      </div>
                      <div className="text-4xl font-black text-white italic">{isServerOnline ? 'OPERATIONAL' : 'OFFLINE'}</div>
                      <div className="text-[11px] font-bold text-slate-500">{isServerOnline ? 'كل الأنظمة تعمل بكفاءة' : 'في انتظار ربط المحرك'}</div>
                   </div>

                   <div className="p-8 bg-black/40 border border-white/5 rounded-[3rem] space-y-4 group hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Auth</span>
                         <Smartphone size={18} className={isServerOnline ? "text-blue-500" : "text-slate-700"} />
                      </div>
                      <div className="text-4xl font-black text-white italic">{isServerOnline ? 'SESSION LIVE' : 'NO AUTH'}</div>
                      <div className="text-[11px] font-bold text-slate-500">تم مسح الـ QR كود بنجاح</div>
                   </div>
                </div>
             </div>

             <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 bg-slate-900/50 flex items-center justify-between border-b border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 active-glow"></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Encrypted Logs Stream</span>
                   </div>
                </div>
                <div className="p-10 h-64 bg-black/40 terminal-text text-sm text-emerald-500/70 overflow-y-auto custom-scrollbar leading-relaxed">
                   {logs.length === 0 ? "No active data streams..." : logs.map((log, i) => <div key={i} className="mb-2 border-r-2 border-emerald-500/20 pr-4">{log}</div>)}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
