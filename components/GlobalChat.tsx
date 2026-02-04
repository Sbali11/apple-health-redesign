
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MetricState } from '../types';
import Sparkline from './Sparkline';

const QUICK_EVIDENCE = ["High Stress", "Late Night", "Traveled", "Missed Dose", "Heavy Exercise", "Sick", "Normal Day"];

interface GlobalChatProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  history: ChatMessage[];
  onSend: (msg: string) => void;
  isSearching: boolean;
  investigationState: 'none' | 'active' | 'concluding';
  investigationSummary: string | null;
  focusedMetric?: MetricState;
  onSummarize: () => void;
  onFinish: (decision: 'track' | 'doctor') => void;
  isDemoPlaying?: boolean;
}

const GlobalChat: React.FC<GlobalChatProps> = ({
  isOpen, onClose, onNewChat, history, onSend, isSearching,
  investigationState, investigationSummary, focusedMetric, onSummarize, onFinish,
  isDemoPlaying = false
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, investigationState, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b bg-gray-50/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div>
              <h2 className="text-sm font-black text-gray-900 leading-none">Health AI</h2>
              <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1 tracking-widest leading-none">
                {investigationState === 'active' ? 'Investigation' : 'Assistant'}
              </p>
           </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onNewChat}
            className="p-2 text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          </button>
          <button 
            onClick={onClose} 
            className="text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest bg-white border px-3 py-2 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemoPlaying && (
        <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center gap-3 shrink-0 animate-in slide-in-from-top duration-300">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Demo — Example investigation flow</p>
        </div>
      )}

      {/* Investigation Context Panel */}
      {investigationState === 'active' && focusedMetric && (
        <div className="px-6 py-4 bg-white border-b flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-300">
           <div>
              <div className="flex items-baseline gap-1.5 leading-none mb-1">
                <span className="text-2xl font-black text-gray-900">{focusedMetric.lastValue}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{focusedMetric.unit}</span>
              </div>
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.1em] leading-none">Metric: {focusedMetric.name}</p>
           </div>
           <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
              <Sparkline data={focusedMetric.data.slice(-14)} color="#F43F5E" />
           </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 no-scrollbar bg-gray-50/20">
         {history.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-50 space-y-4">
              <div className="w-16 h-16 bg-white rounded-[28px] border-2 border-dashed border-gray-200 flex items-center justify-center text-3xl">💬</div>
              <div>
                <p className="text-sm font-bold text-gray-900 tracking-tight">How can I assist you?</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Ask about patterns, goals, or your health data summary.</p>
              </div>
           </div>
         )}
         {history.map((m, i) => (
           <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                 {m.text}
              </div>
           </div>
         ))}
         {isSearching && (
           <div className="flex justify-start">
             <div className="bg-white border rounded-2xl px-4 py-2 flex gap-1.5 items-center">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
           </div>
         )}
         <div ref={chatEndRef} />
      </div>

      {/* Footer Controls */}
      <div className="bg-white p-6 border-t shadow-2xl rounded-t-[40px] border-gray-100 shrink-0">
         {investigationState === 'active' ? (
           <>
              {!isDemoPlaying && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-5 -mx-1">
                  {QUICK_EVIDENCE.map(evidence => (
                    <button
                      key={evidence}
                      onClick={() => onSend(`I noticed ${evidence} recently.`)}
                      className="px-3 py-2 bg-gray-50 border border-transparent text-gray-700 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap active:scale-95 transition-all hover:bg-white hover:border-indigo-100 shadow-sm"
                    >
                      {evidence}
                    </button>
                  ))}
                </div>
              )}
              {isDemoPlaying ? (
                <div className="text-center py-3">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Conversation playing...</p>
                </div>
              ) : (
                <>
                  <form onSubmit={(e) => { e.preventDefault(); if (input) { onSend(input); setInput(''); }}} className="relative mb-3">
                    <input
                      type="text" value={input} onChange={(e) => setInput(e.target.value)}
                      placeholder="Share details for the report..."
                      className="w-full bg-gray-100 border-2 border-transparent focus:border-indigo-100 rounded-2xl py-4 pl-5 pr-14 text-sm font-bold outline-none shadow-inner"
                    />
                    <button type="submit" className="absolute right-2 top-2 bg-indigo-600 text-white p-2.5 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg></button>
                  </form>
                  {history.length >= 2 && (
                    <button onClick={onSummarize} disabled={isSearching} className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                      Analyze & Finalize Findings
                    </button>
                  )}
                </>
              )}
           </>
         ) : investigationState === 'concluding' ? (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-indigo-50/50 p-5 rounded-[24px] border border-indigo-100 mb-6 shadow-inner">
                 <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Findings Summary</h4>
                 <p className="text-xs font-bold text-gray-800 leading-relaxed italic">"{investigationSummary}"</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => onFinish('doctor')} className="bg-white border-2 border-indigo-600 text-indigo-600 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest leading-tight active:scale-95 transition-all shadow-sm">Add to Visit Agenda</button>
                 <button onClick={() => onFinish('track')} className="bg-indigo-600 text-white p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest leading-tight active:scale-95 transition-all shadow-lg">Just Keep Logged</button>
              </div>
           </div>
         ) : (
           <form onSubmit={(e) => { e.preventDefault(); if (input) { onSend(input); setInput(''); }}} className="relative">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about trends or log a note..."
                className="w-full bg-gray-100 border-2 border-transparent focus:border-indigo-100 rounded-2xl py-4 pl-5 pr-14 text-sm font-bold outline-none shadow-inner"
              />
              <button type="submit" className="absolute right-2 top-2 bg-indigo-600 text-white p-2.5 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg></button>
           </form>
         )}
      </div>
    </div>
  );
};

export default GlobalChat;
