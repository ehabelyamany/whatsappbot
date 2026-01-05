
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  QrCode, Cpu, Plus, Trash2, LogOut, Activity, Zap, 
  MessageCircle, Code, ChevronRight, User, Loader2,
  Terminal, ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import QRCode from 'qrcode';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEYS = {
  PROFILES: 'farida_v7_profiles',
  SESSIONS: 'farida_v7_sessions',
};

// مكون عرض الـ QR الديناميكي (يتغير كل 15 ثانية لمحاكاة واتساب)
const DynamicQRCode = ({ sessionId }: { sessionId: string }) => {
  const [qrSrc, setQrSrc] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);

  const generateNewQR = async () => {
    try {
      // توليد نص عشوائي يحاكي توكن واتساب
      const randomToken = `2@${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}==`;
      const url = await QRCode.toDataURL(randomToken, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      });
      setQrSrc(url);
      setTimeLeft(15);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    generateNewQR();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewQR();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] border-8 border-white">
        <img src={qrSrc} className="w-64 h-64 block" alt="QR Code" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/80 rounded-2xl">
           <button onClick={generateNewQR} className="bg-emerald-600 text-white p-4 rounded-full shadow-xl">
              <RefreshCw size={24} />
           </button>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">تحديث الكود خلال {timeLeft} ثانية</span>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
    else setProfiles([{ id: 'farida-core', name: 'فريدة الذكية', modelName: 'gemini-3-flash-preview', systemInstruction: 'أنت فريدة، مساعدة إيهاب اليمني الشخصية، ترد بلهجة مصرية راقية وذكاء حاد.', temperature: 0.8 }]);
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [profiles, sessions]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-10));
  };

  const handleAddSession = () => {
    const newId = `BOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSession = {
      id: newId,
      status: 'waiting',
      aiProfileId: profiles[0]?.id || '',
      messages: []
    };
    setSessions([...sessions, newSession]);
    setSelectedSessionId(newId);
    addLog(`تم إنشاء بوت جديد: ${newId}`);
  };

  const askFarida = async (prompt: string, profileId: string, senderName: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return "عذراً يا إيهاب، لم أجد إعدادات عقلي.";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: profile.modelName || 'gemini-3-flash-preview',
        contents: `الرسالة من ${senderName}: ${prompt}`,
        config: { systemInstruction: profile.systemInstruction, temperature: profile.temperature }
      });
      return response.text || "فشلت في صياغة الرد.";
    } catch (e: any) { 
      return `خطأ في الاتصال بالذكاء الاصطناعي.`; 
    }
  };

  const simulateMessage = async (sessionId: string, sender: string, text: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.status !== 'connected') return;

    const inbound = { id: Date.now().toString(), senderName: sender, text, timestamp: new Date(), type: 'inbound' };
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, inbound]} : s));
    addLog(`رسالة واردة من ${sender}: ${text}`);
    
    setIsGenerating(true);
    const replyText = await askFarida(text, session.aiProfileId, sender);
    
    const outbound = { id: 'AI-'+Date.now(), senderName: 'فريدة', text: replyText, timestamp: new Date(), type: 'outbound' };
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, outbound]} : s));
    addLog(`فريدة ردت على ${sender}`);
    setIsGenerating(false);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
        <div className="max-w-md w-full glass p-12 rounded-[4rem] text-center space-y-12 border-white/5 shadow-2xl">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 animate-pulse">
            <Zap size={48} className="text-emerald-500" fill="currentColor" />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-black text-white tracking-tighter italic">FARIDA AI</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">WhatsApp Multi-Agent System</p>
          </div>
          <button onClick={() => setIsLoggedIn(true)} className="w-full py-6 bg-emerald-600 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-xl hover:scale-105 active:scale-95">تشغيل السيرفر</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#030712] text-slate-100 rtl overflow-hidden">
      {/* Sidebar */}
      <aside className="w-24 lg:w-80 bg-slate-950 border-l border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 text-emerald-500 mb-16 lg:px-4">
          <Zap size={28} fill="currentColor" />
          <span className="hidden lg:block text-3xl font-black italic tracking-tighter text-white uppercase">Farida</span>
        </div>
        
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('sessions')} className={`w-full flex items-center gap-5 p-6 rounded-[2rem] transition-all ${activeTab === 'sessions' ? 'bg-emerald-600 text-white shadow-2xl' : 'text-slate-600 hover:bg-slate-900'}`}>
            <MessageCircle size={24} /> <span className="hidden lg:block font-black text-sm">القنوات</span>
          </button>
          <button onClick={() => setActiveTab('models')} className={`w-full flex items-center gap-5 p-6 rounded-[2rem] transition-all ${activeTab === 'models' ? 'bg-emerald-600 text-white shadow-2xl' : 'text-slate-600 hover:bg-slate-900'}`}>
            <Cpu size={24} /> <span className="hidden lg:block font-black text-sm">إعدادات العقل</span>
          </button>
        </nav>

        {/* Console Sim */}
        <div className="hidden lg:block mt-auto glass p-6 rounded-[2rem] border-emerald-500/10">
           <div className="flex items-center gap-2 mb-4">
              <Terminal size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">سجل السيرفر</span>
           </div>
           <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar terminal-text text-[9px] text-emerald-400/70">
              {logs.map((l, i) => <div key={i}>{l}</div>)}
              <div ref={logEndRef}></div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'sessions' && (
          <div className="flex h-full">
            {/* Session List */}
            <div className="w-80 border-l border-white/5 bg-slate-950/20 p-8 flex flex-col">
              <button onClick={handleAddSession} className="w-full py-6 bg-emerald-600 rounded-[2rem] font-black text-sm hover:bg-emerald-500 shadow-xl mb-8 flex items-center justify-center gap-2 transition-all">
                <Plus size={18}/> قناة جديدة
              </button>
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                {sessions.map(s => (
                  <div key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`p-6 rounded-[2rem] cursor-pointer transition-all border-2 flex items-center justify-between ${selectedSessionId === s.id ? 'bg-emerald-600/10 border-emerald-500/40 shadow-lg' : 'bg-slate-900/40 border-transparent hover:border-white/5'}`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${s.status === 'connected' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
                       <span className="font-black text-sm">{s.id}</span>
                    </div>
                    <ChevronRight size={16} className={selectedSessionId === s.id ? 'text-emerald-500' : 'text-slate-700'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Session Workspace */}
            <div className="flex-1 bg-slate-950/10 flex flex-col">
              {!selectedSessionId ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                  <QrCode size={120} strokeWidth={1} />
                  <p className="text-3xl font-black mt-8 uppercase tracking-widest italic">اختر قناة للبدء</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <header className="p-10 border-b border-white/5 flex justify-between items-center glass">
                    <div>
                      <h3 className="text-3xl font-black text-white italic">{selectedSessionId}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <div className={`w-2 h-2 rounded-full ${currentSession?.status === 'connected' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                         <span className="text-[10px] font-black uppercase text-slate-500">{currentSession?.status === 'connected' ? 'Online' : 'Waiting for Connection'}</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                       {currentSession?.status === 'waiting' ? (
                         <button onClick={() => {
                           setSessions(sessions.map(s => s.id === selectedSessionId ? {...s, status: 'connected'} : s));
                           addLog(`تم نجاح الاتصال الوهمي للبوت ${selectedSessionId}`);
                         }} className="px-8 py-3 bg-emerald-600 rounded-2xl font-black text-xs hover:bg-emerald-500 shadow-xl transition-all">تخطي الربط (تجربة السيرفر)</button>
                       ) : (
                         <button onClick={() => setSessions(sessions.map(s => s.id === selectedSessionId ? {...s, status: 'waiting'} : s))} className="px-8 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all">قطع الاتصال</button>
                       )}
                       <button onClick={() => setSessions(sessions.filter(s => s.id !== selectedSessionId))} className="p-3 bg-slate-900 text-slate-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                    </div>
                  </header>

                  <div className="flex-1 flex overflow-hidden">
                    {currentSession?.status === 'waiting' ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12">
                         <DynamicQRCode sessionId={selectedSessionId} />
                         <div className="text-center space-y-6 max-w-lg">
                            <div className="p-8 glass rounded-[3rem] border-white/5 relative">
                               <h4 className="font-black text-2xl text-emerald-500 mb-4">لماذا هذا الكود لا يربط؟</h4>
                               <p className="text-sm font-bold text-slate-400 leading-loose">
                                 هذا التطبيق هو <span className="text-white underline">Frontend Controller</span>. الربط الحقيقي يتطلب سيرفر Node.js يعمل في الخلفية. استخدم زر <b>"تخطي الربط"</b> بالأعلى لتجربة لوحة التحكم وكيف تقوم "فريدة" بالرد الآلي باستخدام الذكاء الاصطناعي.
                               </p>
                               <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3 text-orange-500 text-xs font-black">
                                 <Terminal size={16} /> تنبيه: الكود المعروض يتغير ديناميكياً لمحاكاة واتساب.
                               </div>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                         <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar bg-slate-950/20">
                           {currentSession.messages.map((msg: any) => (
                             <div key={msg.id} className={`flex flex-col ${msg.type === 'inbound' ? 'items-start' : 'items-end'}`}>
                                <div className="flex items-center gap-2 mb-2 px-4">
                                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{msg.senderName}</span>
                                   <div className={`w-1 h-1 rounded-full ${msg.type === 'inbound' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                </div>
                                <div className={`max-w-[80%] p-6 rounded-[2.5rem] font-bold text-lg shadow-2xl ${msg.type === 'inbound' ? 'bg-slate-900 border border-white/5 text-slate-300' : 'bg-emerald-600 text-white'}`}>
                                   {msg.text}
                                </div>
                             </div>
                           ))}
                           {isGenerating && (
                             <div className="flex items-center gap-4 px-6">
                               <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                               </div>
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">فريدة تصيغ الرد الآن...</span>
                             </div>
                           )}
                         </div>
                         
                         {/* Controls */}
                         <div className="p-8 bg-slate-950/60 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={() => simulateMessage(selectedSessionId, 'إيهاب', 'ازيك يا فريدة، أخبارك إيه؟')} className="p-5 bg-slate-900 rounded-[1.5rem] border border-white/5 flex flex-col items-center gap-2 hover:bg-emerald-600/10 hover:border-emerald-500/40 transition-all group">
                               <Send size={18} className="text-slate-500 group-hover:text-emerald-500" />
                               <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-500">تحية الصباح</span>
                            </button>
                            <button onClick={() => simulateMessage(selectedSessionId, 'عميل', 'عايز أحجز موعد للصيانة')} className="p-5 bg-slate-900 rounded-[1.5rem] border border-white/5 flex flex-col items-center gap-2 hover:bg-emerald-600/10 hover:border-emerald-500/40 transition-all group">
                               <Terminal size={18} className="text-slate-500 group-hover:text-emerald-500" />
                               <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-500">طلب خدمة</span>
                            </button>
                            <button onClick={() => simulateMessage(selectedSessionId, 'متطفل', 'أنت مين وبترد كدة ليه؟')} className="p-5 bg-slate-900 rounded-[1.5rem] border border-white/5 flex flex-col items-center gap-2 hover:bg-emerald-600/10 hover:border-emerald-500/40 transition-all group">
                               <ShieldCheck size={18} className="text-slate-500 group-hover:text-emerald-500" />
                               <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-500">رد حاسم</span>
                            </button>
                            <button onClick={() => setSessions(prev => prev.map(s => s.id === selectedSessionId ? {...s, messages: []} : s))} className="p-5 bg-red-600/5 rounded-[1.5rem] border border-red-500/10 flex flex-col items-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                               <Trash2 size={18} />
                               <span className="text-[10px] font-black uppercase">مسح التاريخ</span>
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'models' && (
           <div className="p-16 space-y-16 overflow-y-auto h-full custom-scrollbar">
              <div className="space-y-4">
                <h2 className="text-7xl font-black italic tracking-tighter text-white">BRAIN CONFIG</h2>
                <div className="w-20 h-2 bg-emerald-600 rounded-full"></div>
              </div>
              {profiles.map((p: any) => (
                <div key={p.id} className="glass p-16 rounded-[4rem] border-white/5 space-y-12 shadow-2xl">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      <div className="space-y-6">
                         <label className="text-xs font-black text-slate-600 uppercase tracking-widest px-4 flex items-center gap-2"><User size={14}/> Agent Identity</label>
                         <input value={p.name} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, name: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-8 rounded-[2.5rem] text-3xl font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all" />
                      </div>
                      <div className="space-y-6">
                         <label className="text-xs font-black text-slate-600 uppercase tracking-widest px-4 flex items-center gap-2"><Code size={14}/> Personality Matrix</label>
                         <textarea rows={6} value={p.systemInstruction} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, systemInstruction: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-8 rounded-[3rem] text-xl font-bold text-slate-400 outline-none resize-none focus:border-emerald-500 transition-all" />
                      </div>
                   </div>
                </div>
              ))}
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
