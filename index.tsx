
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Zap, MessageCircle, Cpu, Code, Server, Terminal, 
  Settings, Activity, Globe, Check, Copy, AlertCircle,
  Shield, Play, StopCircle, RefreshCw, Smartphone, 
  Database, Wifi, Key
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEYS = {
  SERVER_URL: 'farida_server_url',
  API_KEY: 'farida_api_key'
};

const App = () => {
  const [activeTab, setActiveTab] = useState('server-status');
  const [serverUrl, setServerUrl] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
    if (savedUrl) setServerUrl(savedUrl);
    addLog("تم تحميل مركز التحكم.. بانتظار ربط السيرفر الأساسي.");
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const checkServerStatus = async () => {
    if (!serverUrl) return;
    setIsChecking(true);
    addLog(`جاري محاولة الاتصال بالسيرفر على: ${serverUrl}`);
    
    // محاكاة لعملية الفحص (في الواقع سنستخدم fetch)
    setTimeout(() => {
      const isOnline = Math.random() > 0.3; // محاكاة
      setIsServerOnline(isOnline);
      setIsChecking(false);
      addLog(isOnline ? "✅ السيرفر متصل ويعمل بكفاءة." : "❌ فشل الاتصال بالسيرفر. تأكد من تشغيل كود Node.js.");
    }, 1500);
  };

  const nodeJsServerCode = `
/**
 * Farida AI - WhatsApp Backend v1.0
 * المتطلبات:
 * npm install @whiskeysockets/baileys @google/generative-ai qrcode-terminal
 */

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const qrcode = require("qrcode-terminal");

async function startFaridaServer() {
    const { state, saveCreds } = await useMultiFileAuthState('farida_auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Farida AI", "Chrome", "1.0.0"]
    });

    const ai = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("🚀 سيرفر فريدة بدأ العمل...");

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text) {
            console.log(\`📩 رسالة من \${remoteJid}: \${text}\`);
            
            try {
                // استدعاء عقل فريدة
                const result = await model.generateContent(text);
                const reply = result.response.text();
                
                await sock.sendMessage(remoteJid, { text: reply });
                console.log(\`✅ تم الرد بواسطة فريدة\`);
            } catch (err) {
                console.error("❌ خطأ في معالجة الذكاء الاصطناعي:", err);
            }
        }
    });
}

startFaridaServer();
  `;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 rtl font-['Cairo']">
      {/* Sidebar الإحترافي */}
      <aside className="w-80 bg-slate-950 border-l border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Zap size={28} className="text-emerald-500" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Farida OS</h1>
            <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">System Core v1.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'server-status', icon: Activity, label: 'حالة النظام' },
            { id: 'server-setup', icon: Server, label: 'تجهيز السيرفر' },
            { id: 'ai-config', icon: Cpu, label: 'إعدادات العقل' },
            { id: 'monitor', icon: Globe, label: 'مراقب الحركة' },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-300 ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-900/20 scale-105' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              <tab.icon size={20} />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="bg-slate-900/50 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase">Backend Status</span>
              <div className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
            </div>
            <p className="text-[11px] font-bold text-slate-300 truncate">{serverUrl || 'سيرفر غير مربوط'}</p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#030712]">
        {activeTab === 'server-status' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="space-y-4">
              <h2 className="text-6xl font-black italic text-white tracking-tighter">نظام إدارة السيرفر</h2>
              <p className="text-slate-500 text-xl font-medium">مرحباً يا إيهاب، لنبدأ بتشغيل "قلب" فريدة الحقيقي.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass p-10 rounded-[3rem] space-y-4 border-white/5">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4"><Wifi size={24}/></div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">ارتباط الشبكة</h4>
                <p className="text-4xl font-black text-white italic">{isServerOnline ? 'Connected' : 'Offline'}</p>
              </div>
              <div className="glass p-10 rounded-[3rem] space-y-4 border-white/5">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4"><Database size={24}/></div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">إجمالي الردود</h4>
                <p className="text-4xl font-black text-white italic">0</p>
              </div>
              <div className="glass p-10 rounded-[3rem] space-y-4 border-white/5">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-4"><Smartphone size={24}/></div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">أجهزة نشطة</h4>
                <p className="text-4xl font-black text-white italic">0</p>
              </div>
            </div>

            <div className="glass p-12 rounded-[4rem] border-white/5 space-y-10">
              <div className="space-y-6">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 flex items-center gap-2">
                  <Globe size={14} className="text-emerald-500" /> رابط السيرفر (API Gateway)
                </label>
                <div className="flex gap-4">
                  <input 
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="مثال: http://localhost:3000"
                    className="flex-1 bg-slate-950 border-2 border-white/5 p-8 rounded-[2.5rem] text-2xl font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-800"
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
            </div>

            {/* Terminal Output */}
            <div className="glass rounded-[3rem] overflow-hidden border-white/5">
              <div className="bg-slate-900/80 p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                      <div className="w-3 h-3 rounded-full bg-orange-500/20"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20"></div>
                   </div>
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Live System Logs</span>
                </div>
                <button onClick={() => setLogs([])} className="text-[10px] font-black text-slate-600 hover:text-white transition-all uppercase">Clear</button>
              </div>
              <div className="p-8 h-80 overflow-y-auto custom-scrollbar terminal-text text-sm leading-relaxed text-emerald-500/80 space-y-2 bg-slate-950/50">
                {logs.length === 0 && <div className="opacity-20 italic">No activity detected...</div>}
                {logs.map((log, i) => <div key={i} className="flex gap-4"><span className="opacity-30">[{logs.length - i}]</span> {log}</div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'server-setup' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700">
             <div className="space-y-4">
                <h2 className="text-6xl font-black italic text-white tracking-tighter">تجهيز السيرفر</h2>
                <div className="w-32 h-2 bg-emerald-600 rounded-full shadow-[0_0_20px_#10b981]"></div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                   <div className="glass p-12 rounded-[3.5rem] border-white/5 space-y-6">
                      <h4 className="text-2xl font-black text-white flex items-center gap-4">
                         <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-500"><Terminal size={24}/></div>
                         خطوات التشغيل
                      </h4>
                      <div className="space-y-6">
                         {[
                            "تثبيت Node.js على جهازك الكمبيوتر.",
                            "إنشاء مجلد جديد وفتح Terminal بداخلة.",
                            "تشغيل الأمر: npm init -y",
                            "تثبيت المكتبات اللازمة بالأمر الموضح بالأسفل.",
                            "نسخ كود السيرفر ووضعه في ملف index.js.",
                            "تشغيل السيرفر بالأمر: node index.js"
                         ].map((step, i) => (
                            <div key={i} className="flex gap-6 items-center">
                               <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-500">{i+1}</div>
                               <p className="text-slate-400 font-bold">{step}</p>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="p-10 bg-emerald-500/5 border border-emerald-500/20 rounded-[3rem] space-y-4">
                      <h5 className="font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><Key size={16}/> أمر تثبيت المكتبات</h5>
                      <div className="bg-black/40 p-6 rounded-2xl font-mono text-sm text-emerald-300 flex justify-between items-center border border-white/5">
                         <code>npm i @whiskeysockets/baileys @google/generative-ai qrcode-terminal</code>
                         <button onClick={() => {
                            navigator.clipboard.writeText("npm i @whiskeysockets/baileys @google/generative-ai qrcode-terminal");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                         }} className="hover:text-white transition-all">
                            {copied ? <Check size={18}/> : <Copy size={18}/>}
                         </button>
                      </div>
                   </div>
                </div>

                <div className="glass p-12 rounded-[4rem] border-white/5 relative group overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 flex gap-4">
                      <button onClick={() => {
                        navigator.clipboard.writeText(nodeJsServerCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }} className="p-4 bg-emerald-600 rounded-2xl text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
                        {copied ? <Check size={24}/> : <Copy size={24}/>}
                      </button>
                   </div>
                   <h4 className="text-2xl font-black text-white mb-10">كود السيرفر (index.js)</h4>
                   <pre className="bg-slate-950/80 p-8 rounded-[2rem] text-[10px] text-emerald-400/80 font-mono leading-relaxed overflow-x-auto h-[600px] custom-scrollbar border border-white/5">
                      {nodeJsServerCode}
                   </pre>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ai-config' && (
          <div className="max-w-4xl mx-auto space-y-12 py-20 text-center">
             <div className="w-32 h-32 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mx-auto border border-purple-500/20 animate-pulse">
                <Cpu size={64} />
             </div>
             <div className="space-y-4">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">AI Intelligence Config</h2>
                <p className="text-slate-500 font-bold text-lg">هنا سيتم تخصيص "وعي فريدة" ونبرة صوتها في الردود.</p>
             </div>
             <div className="p-12 glass border-dashed border-2 border-white/5 rounded-[4rem] opacity-30">
                <p className="font-black text-sm uppercase tracking-[0.3em]">Module Locked - Please Connect Server First</p>
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
