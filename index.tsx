
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  QrCode, 
  Cpu, 
  Plus, 
  Trash2, 
  Power, 
  LogOut, 
  Terminal as TerminalIcon, 
  ShieldCheck, 
  Activity, 
  Zap,
  MessageCircle,
  Code,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Play,
  ChevronRight,
  User
} from 'lucide-react';
import QRCode from 'qrcode';
import { GoogleGenAI } from "@google/genai";

// --- Interfaces ---
interface AIProfile {
  id: string;
  name: string;
  modelName: string;
  systemInstruction: string;
  temperature: number;
}

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: Date;
  type: 'inbound' | 'outbound';
}

interface WASession {
  id: string;
  status: 'connected' | 'disconnected' | 'connecting';
  aiProfileId: string;
  bridgeKey: string;
  realQrData: string | null; // هنا هيتحط الكود الحقيقي اللي جاي من السيرفر
  messages: ChatMessage[];
}

const STORAGE_KEYS = {
  PROFILES: 'farida_v7_profiles',
  SESSIONS: 'farida_v7_sessions',
};

const App = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDemoTip, setShowDemoTip] = useState(true);

  useEffect(() => {
    const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    } else {
      // ملف تعريف افتراضي لفريدة
      setProfiles([{
        id: 'farida-main',
        name: 'فريدة الذكية',
        modelName: 'gemini-3-flash-preview',
        systemInstruction: 'أنت فريدة، مساعدة إيهاب اليمني الشخصية. ردي بذكاء، ثقة، وبلهجة مصرية خفيفة ومحترمة.',
        temperature: 0.8
      }]);
    }
    
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [profiles, sessions]);

  // --- AI Brain ---
  const askFarida = async (prompt: string, profileId: string, senderName: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return "عذراً يا إيهاب، لم أجد إعدادات عقلي.";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: profile.modelName || 'gemini-3-flash-preview',
        contents: `الرسالة من ${senderName}: ${prompt}`,
        config: { systemInstruction: profile.systemInstruction, temperature: profile.temperature }
      });
      return response.text || "فشلت في صياغة الرد.";
    } catch (e: any) { return `خطأ في الاتصال بفريدة: ${e.message}`; }
  };

  const handleAddSession = () => {
    const newSession: WASession = {
      id: `Farida-Bot-${Math.floor(100 + Math.random() * 899)}`,
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
    
    const inbound: ChatMessage = { id: Date.now().toString(), senderName: sender, text, timestamp: new Date(), type: 'inbound' };
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, inbound]} : s));

    setIsGenerating(true);
    const replyText = await askFarida(text, session.aiProfileId, sender);
    const outbound: ChatMessage = { id: 'AI-'+Date.now(), senderName: 'فريدة', text: replyText, timestamp: new Date(), type: 'outbound' };
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, outbound]} : s));
    setIsGenerating(false);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
        <div className="max-w-md w-full glass p-12 rounded-[4rem] text-center space-y-10 border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.05)]">
          <div className="relative inline-block group">
             <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
             <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center relative border border-emerald-500/20">
               <Zap size={56} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" fill="currentColor" />
             </div>
          </div>
          <div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4">فريدة <span className="text-emerald-500">V7</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">AI WhatsApp Autopilot</p>
          </div>
          <button onClick={() => setIsLoggedIn(true)} className="w-full py-6 bg-emerald-600 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 transform hover:scale-105 active:scale-95">دخول لوحة التحكم</button>
          <p className="text-[10px] text-slate-700 font-bold tracking-widest">مخصصة للمستخدم: إيهاب اليمني</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#030712] text-slate-100 font-sans rtl overflow-hidden">
      {/* Sidebar */}
      <aside className="w-24 lg:w-80 bg-slate-950 border-l border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 text-emerald-500 mb-16 lg:px-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <Zap size={28} fill="currentColor" />
          </div>
          <span className="hidden lg:block text-3xl font-black tracking-tighter">فريدة</span>
        </div>
        
        <nav className="flex-1 space-y-4">
          <NavItem id="sessions" icon={<MessageCircle />} label="البوتات والربط" active={activeTab} set={setActiveTab} />
          <NavItem id="models" icon={<Cpu />} label="تخصيص الردود" active={activeTab} set={setActiveTab} />
          <NavItem id="dashboard" icon={<Activity />} label="الأداء" active={activeTab} set={setActiveTab} />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="hidden lg:block p-6 bg-slate-900/50 rounded-3xl border border-white/5 text-[10px] font-bold text-slate-500">
             <div className="flex items-center gap-2 mb-2 text-emerald-500">
                <CheckCircle2 size={12} /> نظام فريدة نشط
             </div>
             Server: v7.0.2 Stable
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center justify-center lg:justify-start gap-4 p-5 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-black">
            <LogOut size={22} /> <span className="hidden lg:block">تسجيل خروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {activeTab === 'sessions' && (
          <div className="flex h-full overflow-hidden animate-in">
            {/* القائمة الجانبية للبوتات */}
            <div className="w-80 border-l border-white/5 bg-slate-950/20 p-8 flex flex-col">
              <button onClick={handleAddSession} className="w-full flex items-center justify-center gap-3 py-6 bg-emerald-600 rounded-[2rem] font-black text-sm hover:bg-emerald-500 transition-all shadow-xl mb-8 group">
                <Plus size={20} className="group-hover:rotate-90 transition-transform" /> إضافة قناة جديدة
              </button>
              
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">القنوات النشطة</p>
                {sessions.length === 0 && <div className="text-center py-10 text-slate-700 italic text-sm">لا توجد قنوات بعد..</div>}
                {sessions.map(s => (
                  <div key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`p-6 rounded-[2rem] cursor-pointer transition-all border-2 flex items-center justify-between ${selectedSessionId === s.id ? 'bg-emerald-600/10 border-emerald-500/40 shadow-2xl' : 'bg-slate-900/40 border-transparent hover:border-white/10'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`w-3 h-3 rounded-full ${s.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
                       <span className="font-black text-sm">{s.id}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* شاشة التحكم */}
            <div className="flex-1 bg-slate-950/10 flex flex-col">
              {!selectedSessionId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-20">
                  <QrCode size={120} />
                  <p className="text-4xl font-black">اختر قناة لبدء الربط يا إيهاب</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <header className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/40 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center border border-white/5"><ShieldCheck className="text-emerald-500" size={32} /></div>
                       <div>
                          <h3 className="text-2xl font-black">{selectedSessionId}</h3>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Bridge Key: {currentSession?.bridgeKey}</span>
                             <button onClick={() => navigator.clipboard.writeText(currentSession?.bridgeKey || '')} className="text-slate-600 hover:text-white transition-colors"><Copy size={12} /></button>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       {currentSession?.status === 'disconnected' && (
                         <button onClick={() => setSessions(sessions.map(s => s.id === selectedSessionId ? {...s, status: 'connected'} : s))} className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-xs hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center gap-2"><Play size={16}/> وضع التجربة الفوري</button>
                       )}
                       <button onClick={() => setSessions(sessions.filter(s => s.id !== selectedSessionId))} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                    </div>
                  </header>

                  <div className="flex-1 flex overflow-hidden">
                    {currentSession?.status !== 'connected' ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12">
                        {/* منطقة الـ QR */}
                        <div className="relative group">
                           <div className="absolute -inset-10 bg-emerald-500/5 blur-3xl rounded-full"></div>
                           <div className="bg-white p-8 rounded-[3.5rem] shadow-[0_0_80px_rgba(255,255,255,0.05)] relative z-10 overflow-hidden border-8 border-slate-900">
                              <div className="scan-line !h-1 !bg-emerald-500"></div>
                              <QRCodeDisplay data={currentSession?.realQrData} />
                              {!currentSession?.realQrData && (
                                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-spin border-4 border-t-emerald-500 border-slate-100"></div>
                                   <p className="text-slate-900 font-black text-sm">بانتظار السيرفر...</p>
                                </div>
                              )}
                           </div>
                        </div>

                        {/* تعليمات الربط */}
                        <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4">
                              <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                 <AlertCircle size={20} />
                                 <h4 className="font-black text-sm uppercase tracking-widest">تنبيه الربط الحقيقي</h4>
                              </div>
                              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                يا إيهاب، عشان الكود ده يشتغل على موبايلك بجد، لازم تشغل ملف الـ <span className="text-white">Node.js</span> اللي معاك. 
                                السيرفر هو اللي بيبعت كود واتساب الحقيقي هنا.
                              </p>
                           </div>
                           <div className="glass p-8 rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/5 space-y-4">
                              <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                 <Play size={20} />
                                 <h4 className="font-black text-sm uppercase tracking-widest">تجربة فورية (بدون واتساب)</h4>
                              </div>
                              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                لو عايز تشوف فريدة بترد إزاي دلوقتي حالا من غير ما تربط موبايلك، اضغط على زرار <span className="text-emerald-400">"وضع التجربة الفوري"</span> فوق.
                              </p>
                           </div>
                        </div>
                      </div>
                    ) : (
                      /* شاشة الدردشة والمراقبة */
                      <div className="flex-1 flex flex-col bg-black/20">
                         <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                           {currentSession.messages.length === 0 && (
                             <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                                <MessageCircle size={64} className="opacity-10" />
                                <p className="font-black text-xl italic opacity-10">فريدة بانتظار أول رسالة..</p>
                             </div>
                           )}
                           {currentSession.messages.map(msg => (
                             <div key={msg.id} className={`flex flex-col ${msg.type === 'inbound' ? 'items-start' : 'items-end'} animate-in`}>
                                <div className="flex items-center gap-3 mb-2 px-4">
                                   {msg.type === 'inbound' && <div className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-black">{msg.senderName[0]}</div>}
                                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{msg.senderName}</span>
                                </div>
                                <div className={`max-w-[70%] p-6 rounded-[2.5rem] font-bold text-lg shadow-2xl transition-all hover:scale-[1.02] ${msg.type === 'inbound' ? 'bg-slate-900 border border-white/5 text-slate-100 rounded-bl-none' : 'bg-emerald-600 text-white rounded-br-none shadow-emerald-900/40'}`}>
                                   {msg.text}
                                   <div className={`text-[9px] mt-2 opacity-30 ${msg.type === 'inbound' ? 'text-left' : 'text-right'}`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                </div>
                             </div>
                           ))}
                           {isGenerating && (
                             <div className="flex items-center gap-4 animate-pulse">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center"><Cpu size={16} className="text-emerald-500" /></div>
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">فريدة تفكر في الرد...</span>
                             </div>
                           )}
                         </div>

                         {/* أدوات المحاكاة السفلية */}
                         <div className="p-8 bg-slate-950/40 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SimulationButton onClick={() => simulateMessage(selectedSessionId, 'أحمد', 'يا فريدة، إيه الأخبار؟')} label="رسالة من أحمد" />
                            <SimulationButton onClick={() => simulateMessage(selectedSessionId, 'سارة', 'فريدة، ممكن مساعدة؟')} label="رسالة من سارة" />
                            <SimulationButton onClick={() => simulateMessage(selectedSessionId, 'عميل', 'بكم سعر الخدمة؟')} label="رسالة من عميل" />
                            <button onClick={() => setSessions(prev => prev.map(s => s.id === selectedSessionId ? {...s, messages: []} : s))} className="p-4 bg-slate-900 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest border border-white/5">مسح السجل</button>
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
           <div className="p-16 space-y-12 animate-in overflow-y-auto h-full">
              <header>
                 <h2 className="text-6xl font-black mb-4 tracking-tighter">تخصيص الردود</h2>
                 <p className="text-slate-500 font-bold max-w-2xl">هنا يمكنك تشكيل شخصية فريدة وتحديد كيف ستتعامل مع الناس على واتساب.</p>
              </header>

              <div className="grid grid-cols-1 gap-8">
                 {profiles.map(p => (
                   <div key={p.id} className="glass p-12 rounded-[4rem] border-white/5 space-y-10 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all"></div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 flex items-center gap-2"><User size={12}/> اسم الشخصية</label>
                            <input value={p.name} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, name: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-7 rounded-[2.5rem] text-3xl font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all shadow-inner" />
                            
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 flex items-center gap-2"><Cpu size={12}/> المحرك العصبي</label>
                            <select value={p.modelName} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, modelName: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-7 rounded-[2.5rem] font-black text-slate-400 outline-none">
                               <option value="gemini-3-flash-preview">Gemini 3 Flash (فائق السرعة)</option>
                               <option value="gemini-3-pro-preview">Gemini 3 Pro (فائق الذكاء)</option>
                            </select>
                         </div>
                         <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 flex items-center gap-2"><Code size={12}/> التعليمات البرمجية للهوية</label>
                            <textarea rows={6} value={p.systemInstruction} onChange={(e) => setProfiles(profiles.map(item => item.id === p.id ? {...item, systemInstruction: e.target.value} : item))} className="w-full bg-slate-950 border-2 border-white/5 p-8 rounded-[3rem] text-lg font-bold text-slate-500 outline-none resize-none focus:border-emerald-500/50 transition-all shadow-inner leading-relaxed" />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'dashboard' && (
           <div className="p-16 space-y-12 animate-in">
              <h2 className="text-6xl font-black tracking-tighter">إحصائيات النظام</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <StatBox label="القنوات النشطة" value={sessions.filter(s => s.status === 'connected').length} total={sessions.length} unit="قناة" />
                 <StatBox label="إجمالي الرسائل" value={sessions.reduce((acc, s) => acc + s.messages.length, 0)} total={1000} unit="رسالة" />
                 <StatBox label="استهلاك الـ AI" value="98%" total="100%" unit="كفاءة" />
              </div>

              <div className="glass p-12 rounded-[4rem] border-white/5 bg-slate-900/10">
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-4"><Activity className="text-emerald-500" /> سجل العمليات</h3>
                 <div className="space-y-4 font-mono text-xs text-slate-500">
                    <div className="flex gap-4 p-4 bg-black/20 rounded-2xl">
                       <span className="text-emerald-500">[OK]</span>
                       <span>Farida Neural Engine connected via Gemini 3</span>
                    </div>
                    <div className="flex gap-4 p-4 bg-black/20 rounded-2xl">
                       <span className="text-blue-500">[INFO]</span>
                       <span>Bridge protocol waiting for EHAB session</span>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 40px; }
        .scan-line { position: absolute; width: 100%; height: 6px; background: #10b981; box-shadow: 0 0 20px #10b981; animation: scan 3s linear infinite; z-index: 20; left: 0; }
        @keyframes scan { 0% { top: 0%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-in { animation: animateIn 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        @keyframes animateIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const NavItem = ({ id, icon, label, active, set }: any) => (
  <button onClick={() => set(id)} className={`w-full flex items-center gap-5 p-6 rounded-[2rem] transition-all duration-500 ${active === id ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-900/40 scale-105' : 'text-slate-600 hover:bg-slate-900 hover:text-slate-300'}`}>
    {icon}
    <span className="hidden lg:block font-black text-sm tracking-tight">{label}</span>
  </button>
);

const SimulationButton = ({ onClick, label }: any) => (
  <button onClick={onClick} className="p-4 bg-slate-900 rounded-2xl text-[10px] font-black text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest border border-emerald-500/10 shadow-lg">
    {label}
  </button>
);

const StatBox = ({ label, value, total, unit }: any) => (
  <div className="glass p-12 rounded-[4rem] border-white/5 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
     <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] mb-4">{label}</p>
     <div className="flex items-baseline gap-4">
        <span className="text-7xl font-black text-white group-hover:text-emerald-500 transition-colors">{value}</span>
        <span className="text-slate-700 font-bold">{unit}</span>
     </div>
  </div>
);

const QRCodeDisplay = ({ data }: { data: string | null }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { 
    if (data) {
      QRCode.toDataURL(data, { width: 350, margin: 2 }).then(setSrc); 
    } else {
      // كود QR وهمي فقط للشكل الجمالي قبل وصول البيانات الحقيقية
      QRCode.toDataURL("FARIDA_WAITING_FOR_BRIDGE_SERVER", { width: 350, margin: 2, color: { dark: '#00000033' } }).then(setSrc); 
    }
  }, [data]);
  return src ? <img src={src} className={`w-[300px] h-[300px] transition-all ${!data ? 'blur-sm opacity-20' : 'opacity-100'}`} alt="QR" /> : null;
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
