
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  QrCode, Cpu, Plus, Trash2, LogOut, ShieldCheck, Activity, Zap, 
  MessageCircle, Code, Copy, CheckCircle2, AlertCircle, Play, 
  ChevronRight, User 
} from 'lucide-react';
import QRCode from 'qrcode';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEYS = {
  PROFILES: 'farida_v7_profiles',
  SESSIONS: 'farida_v7_sessions',
};

const NavItem = ({ id, icon, label, active, set }: any) => (
  <button 
    onClick={() => set(id)} 
    className={`w-full flex items-center gap-5 p-6 rounded-[2rem] transition-all duration-500 ${active === id ? 'bg-emerald-600 text-white shadow-2xl scale-105' : 'text-slate-600 hover:bg-slate-900 hover:text-slate-300'}`}
  >
    {icon}
    <span className="hidden lg:block font-black text-sm">{label}</span>
  </button>
);

const SimulationButton = ({ onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className="p-4 bg-slate-900 rounded-2xl text-[10px] font-black text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all uppercase border border-emerald-500/10"
  >
    {label}
  </button>
);

const StatBox = ({ label, value, unit }: any) => (
  <div className="glass p-12 rounded-[4rem] border-white/5 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
     <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest mb-4">{label}</p>
     <div className="flex items-baseline gap-4">
        <span className="text-7xl font-black text-white group-hover:text-emerald-500 transition-colors">{value}</span>
        <span className="text-slate-700 font-bold">{unit}</span>
     </div>
  </div>
);

const QRCodeDisplay = ({ data }: { data: string | null }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { 
    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(data || "WAITING_FOR_BRIDGE", { width: 350, margin: 2, color: { dark: data ? '#000000' : '#00000033' } });
        setSrc(url);
      } catch (err) { console.error(err); }
    };
    generate();
  }, [data]);
  return src ? <img src={src} className={`w-[300px] h-[300px] transition-all ${!data ? 'blur-sm opacity-20' : 'opacity-100'}`} alt="QR" /> : null;
};

const App = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
    else setProfiles([{ id: 'farida-main', name: 'فريدة الذكية', modelName: 'gemini-3-flash-preview', systemInstruction: 'أنت فريدة، مساعدة إيهاب اليمني الشخصية.', temperature: 0.8 }]);
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [profiles, sessions]);

  const askFarida = async (prompt: string, profileId: string, senderName: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return "عذراً يا إيهاب، لم أجد إعدادات عقلي.";
    try {
      const apiKey = process.env.API_KEY || "";
      if (!apiKey) return "تنبيه: API KEY غير متوفر.";
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: profile.modelName || 'gemini-3-flash-preview',
        contents: `الرسالة من ${senderName}: ${prompt}`,
        config: { systemInstruction: profile.systemInstruction, temperature: profile.temperature }
      });
      return response.text || "فشلت في صياغة الرد.";
    } catch (e: any) { return `خطأ في الاتصال: ${e.message}`; }
  };

  const handleAddSession = () => {
    const newSession = {
      id: `Bot-${Math.floor(100 + Math.random() * 899)}`,
      status: 'disconnected',
      aiProfileId: profiles[0]?.id || '',
      bridgeKey: 'EHAB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      realQrData: null,
      messages: []
    };
    setSessions([...sessions, newSession]);
    setSelectedSessionId(newSession.id);
  };

  const simulateMessage = async (sessionId: string, sender: string, text: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const inbound = { id: Date.now().toString(), senderName: sender, text, timestamp: new Date(), type: 'inbound' };
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, inbound]} : s));
    setIsGenerating(true);
    const replyText = await askFarida(text, session.aiProfileId, sender);
    const outbound = { id: 'AI-'+Date.now(), senderName: 'فريدة', text: replyText, timestamp: new Date(), type: 'outbound' };
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, outbound]} : s));
    setIsGenerating(false);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
        <div className="max-w-md w-full glass p-12 rounded-[4rem] text-center space-y-10 shadow-2xl">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <Zap size={48} className="text-emerald-500" fill="currentColor" />
          </div>
          <h1 className="text-5xl font-black text-white">فريدة V7</h1>
          <button onClick={() => setIsLoggedIn(true)} className="w-full py-6 bg-emerald-600 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-xl">دخول النظام</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#030712] text-slate-100 rtl overflow-hidden">
      <aside className="w-24 lg:w-80 bg-slate-950 border-l border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 text-emerald-500 mb-16 lg:px-4">
          <Zap size={28} fill="currentColor" />
          <span className="hidden lg:block text-3xl font-black">فريدة</span>
        </div>
        <nav className="flex-1 space-y-4">
          <NavItem id="sessions" icon={<MessageCircle size={24} />} label="البوتات والربط" active={activeTab} set={setActiveTab} />
          <NavItem id="models" icon={<Cpu size={24} />} label="تخصيص الرد" active={activeTab} set={setActiveTab} />
          <NavItem id="dashboard" icon={<Activity size={24} />} label="الأداء" active={activeTab} set={setActiveTab} />
        </nav>
        <button onClick={() => setIsLoggedIn(false)} className="mt-auto flex items-center gap-4 p-5 text-red-500 hover:bg-red-500/10 rounded-2xl font-black">
          <LogOut size={22} /> <span className="hidden lg:block">خروج</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'sessions' && (
          <div className="flex h-full">
            <div className="w-80 border-l border-white/5 bg-slate-950/20 p-8 flex flex-col">
              <button onClick={handleAddSession} className="w-full py-6 bg-emerald-600 rounded-[2rem] font-black text-sm hover:bg-emerald-500 shadow-xl mb-8 flex items-center justify-center gap-2">
                <Plus size={18}/> إضافة قناة
              </button>
              <div className="flex-1 space-y-4 overflow-y-auto">
                {sessions.map(s => (
                  <div key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`p-6 rounded-[2rem] cursor-pointer transition-all border-2 flex items-center justify-between ${selectedSessionId === s.id ? 'bg-emerald-600/10 border-emerald-500/40' : 'bg-slate-900/40 border-transparent'}`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${s.status === 'connected' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                       <span className="font-black text-sm">{s.id}</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-slate-950/10 flex flex-col">
              {!selectedSessionId ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                  <QrCode size={100} className="mb-6" />
                  <p className="text-3xl font-black">اختر قناة للبدء</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <header className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/40 backdrop-blur-xl">
                    <div>
                      <h3 className="text-2xl font-black">{selectedSessionId}</h3>
                      <p className="text-[10px] font-black text-emerald-500 uppercase">Key: {currentSession?.bridgeKey}</p>
                    </div>
                    <div className="flex gap-4">
                       {currentSession?.status === 'disconnected' && (
                         <button onClick={() => setSessions(sessions.map(s => s.id === selectedSessionId ? {...s, status: 'connected'} : s))} className="px-6 py-3 bg-blue-600 rounded-2xl font-black text-xs">تجربة فورية</button>
                       )}
                       <button onClick={() => setSessions(sessions.filter(s => s.id !== selectedSessionId))} className="p-3 bg-red-600/10 text-red-500 rounded-xl"><Trash2 size={20}/></button>
                    </div>
                  </header>

                  <div className="flex-1 flex overflow-hidden">
                    {currentSession?.status !== 'connected' ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12">
                         <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                            <div className="scan-line"></div>
                            <QRCodeDisplay data={currentSession?.realQrData} />
                         </div>
                         <div className="text-center glass p-8 rounded-[2rem] max-w-sm">
                            <p className="text-sm font-bold text-slate-400">اربط موبايلك بالماسح الضوئي بعد تشغيل سيرفر الواتساب.</p>
                         </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                         <div className="flex-1 p-10 overflow-y-auto space-y-6">
                           {currentSession.messages.map((msg: any) => (
                             <div key={msg.id} className={`flex flex-col ${msg.type === 'inbound' ? 'items-start' : 'items-end'}`}>
                                <span className="text-[10px] font-black text-slate-600 mb-1 px-4 uppercase">{msg.senderName}</span>
                                <div className={`max-w-[70%] p-6 rounded-[2.5rem] font-bold text-lg shadow-xl ${msg.type === 'inbound' ? 'bg-slate-900 border border-white/5' : 'bg-emerald-600 text-white'}`}>
                                   {msg.text}
                                </div>
                             </div>
                           ))}
                           {isGenerating && <div className="text-xs font-black text-emerald-500 animate-pulse px-4 uppercase tracking-widest">فريدة تفكر...</div>}
                         </div>
                         <div className="p-8 bg-slate-950/40 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <SimulationButton onClick={() => simulateMessage(selectedSessionId, 'أحمد', 'أهلاً')} label="رسالة أهلاً" />
                            <SimulationButton onClick={() => simulateMessage(selectedSessionId, 'سارة', 'مساعدة')} label="رسالة مساعدة" />
                            <button onClick={() => setSessions(prev => prev.map(s => s.id === selectedSessionId ? {...s, messages: []} : s))} className="p-4 bg-slate-900 rounded-2xl text-[10px] font-black text-slate-500">مسح السجل</button>
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
           <div className="p-16 space-y-12 overflow-y-auto h-full">
              <h2 className="text-6xl font-black tracking-tighter">تخصيص الرد</h2>
              {profiles.map((p: any) => (
                <div key={p.id} className="glass p-12 rounded-[4rem] border-white/5 space-y-10">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-600 uppercase px-4 flex items-center gap-2"><User size={12}/> الاسم</label>
                         <input value={p.name} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, name: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-6 rounded-[2rem] text-2xl font-black text-emerald-400 outline-none" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-600 uppercase px-4 flex items-center gap-2"><Code size={12}/> التعليمات</label>
                         <textarea rows={4} value={p.systemInstruction} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, systemInstruction: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-6 rounded-[2.5rem] text-lg font-bold text-slate-500 outline-none resize-none" />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'dashboard' && (
           <div className="p-16 space-y-12">
              <h2 className="text-6xl font-black tracking-tighter">الإحصائيات</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <StatBox label="القنوات" value={sessions.length} unit="قناة" />
                 <StatBox label="الرسائل" value={sessions.reduce((acc, s) => acc + s.messages.length, 0)} unit="رسالة" />
                 <StatBox label="الحالة" value="100%" unit="نشط" />
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
