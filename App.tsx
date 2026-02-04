
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { METRIC_CATALOG, PERSONAS, ONBOARDING_PRESETS, DOCTOR_VIEW_PRIORITIES } from './constants';
import { MetricState, AppState, MetricCategory, UserPersona, DoctorType, SavedObservation, DoctorNote, ChatMessage, AnalysisTemplate, DiscussionPoint } from './types';
import { generateDataPoints } from './utils/dataGenerator';
import { useLogger } from './hooks/useLogger';
import { GoogleGenAI, Type } from "@google/genai";
import FocusCard from './components/FocusCard';
import NeedsAttention, { Alert } from './components/NeedsAttention';
import Library from './components/Library';
import DoctorVisitSummary from './components/DoctorVisitSummary';
import AnalysisHub from './components/AnalysisHub';
import GlobalChat from './components/GlobalChat';

const PERSONA_DEMOGRAPHICS: Record<string, string> = {
  'p1': '28-year-old female, active lifestyle.',
  'p2': '56-year-old male, managing multiple chronic markers.',
  'p3': '34-year-old male, high-performance fitness goals.'
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('app_state');
    if (saved) return JSON.parse(saved);
    
    const defaultPersona = PERSONAS[0];
    const presetIds = ONBOARDING_PRESETS[defaultPersona.initialPreset] || [];
    
    return {
      view: 'home',
      displayMode: 'personal',
      persona: defaultPersona,
      focusMetricIds: presetIds,
      dismissedAlertIds: [],
      interfaceMode: 'adaptive',
      starredDiscussionIds: [],
      doctorVisitType: 'GP',
      activeSearchQuery: '',
      queriedMetricIds: [],
      savedObservations: [],
      doctorNotes: [],
      focusedAnomalyMetricId: null,
      chatHistory: [],
      investigationState: 'none',
      investigationSummary: null,
      isChatOpen: false,
      customTemplates: []
    };
  });

  const [isSearching, setIsSearching] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  const [metrics] = useState<Record<string, MetricState>>(() => {
    const data: Record<string, MetricState> = {};
    METRIC_CATALOG.forEach(m => {
      const history = generateDataPoints(m.id);
      const last = history[history.length - 1].value;
      const prev = history[history.length - 2].value;
      const avg = history.reduce((a, b) => a + b.value, 0) / history.length;
      data[m.id] = {
        ...m,
        data: history,
        lastValue: last,
        avgValue: avg,
        trend: last > prev ? 'up' : last < prev ? 'down' : 'neutral',
        isUserSelected: false
      };
    });
    return data;
  });

  const { logEvent, exportLogs } = useLogger(appState.interfaceMode, appState.displayMode);

  useEffect(() => {
    localStorage.setItem('app_state', JSON.stringify(appState));
  }, [appState]);

  const handleChat = async (message: string) => {
    if (!message.trim()) return;
    const newUserMsg: ChatMessage = { role: 'user', text: message };
    const updatedHistory = [...appState.chatHistory, newUserMsg];
    setAppState(prev => ({ ...prev, chatHistory: updatedHistory }));
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const demographics = PERSONA_DEMOGRAPHICS[appState.persona?.id || 'p1'];
      const focusedMetric = appState.focusedAnomalyMetricId ? metrics[appState.focusedAnomalyMetricId] : null;
      
      const metricsSummary = (Object.values(metrics) as MetricState[])
        .filter(m => appState.focusMetricIds.includes(m.id))
        .map(m => `${m.name}: ${m.lastValue} ${m.unit} (Typical: ${m.avgValue.toFixed(1)})`)
        .join('; ');

      const systemInstruction = appState.investigationState === 'active' 
        ? `You are helping investigate an anomaly in ${focusedMetric?.name}. The current value is ${focusedMetric?.lastValue} vs an average of ${focusedMetric?.avgValue}. Ask the user questions to find lifestyle causes (sleep, stress, diet). Be brief.`
        : "You are a helpful health assistant. Use simple, everyday language. Be concise. Always end with 'Not medical advice'.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: Demographic: ${demographics}. ${focusedMetric ? `Anomaly: ${focusedMetric.name} is ${focusedMetric.lastValue}.` : `Current Stats: ${metricsSummary}`}\nHistory: ${updatedHistory.map(m => m.text).join('\n')}\nUser: ${message}`,
        config: { systemInstruction }
      });
      const aiMsg: ChatMessage = { role: 'model', text: response.text || "I've checked your data." };
      setAppState(prev => ({ ...prev, chatHistory: [...updatedHistory, aiMsg] }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSummarizeInvestigation = async () => {
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const historyText = appState.chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
      const focusedMetric = appState.focusedAnomalyMetricId ? metrics[appState.focusedAnomalyMetricId] : null;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Conversation History:\n${historyText}\n\nSummarize the lifestyle factors contributing to this ${focusedMetric?.name} reading. Be very brief (1-2 sentences).`,
        config: { systemInstruction: "Summarize the user's input into a professional but simple health observation." }
      });

      setAppState(prev => ({
        ...prev,
        investigationState: 'concluding',
        investigationSummary: response.text || "User noted lifestyle changes potentially impacting readings."
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFinishInvestigation = (decision: 'track' | 'doctor') => {
    if (decision === 'doctor' && appState.investigationSummary && appState.focusedAnomalyMetricId) {
      const metric = metrics[appState.focusedAnomalyMetricId];
      const newObs: SavedObservation = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        metricId: metric.id,
        metricName: metric.name,
        value: metric.lastValue,
        unit: metric.unit,
        interpretation: "Investigated Anomaly",
        clinicalSignificance: "Linked to lifestyle factors.",
        userNote: appState.investigationSummary
      };
      setAppState(prev => ({
        ...prev,
        savedObservations: [newObs, ...prev.savedObservations],
        displayMode: 'doctor' // Direct them to see the prep
      }));
    }
    setAppState(prev => ({
      ...prev,
      investigationState: 'none',
      focusedAnomalyMetricId: null,
      investigationSummary: null,
      isChatOpen: false,
      chatHistory: []
    }));
  };

  const suggestCluster = async (goal: string) => {
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const catalogInfo = METRIC_CATALOG.map(m => `${m.id}: ${m.name} (${m.description})`).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Goal: ${goal}\nAvailable Metrics: ${catalogInfo}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metricIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              narrative: { type: Type.STRING },
              icon: { type: Type.STRING }
            },
            required: ["metricIds", "title", "description", "narrative", "icon"]
          }
        }
      });
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveCustomTemplate = (template: AnalysisTemplate) => {
    setAppState(prev => ({
      ...prev,
      customTemplates: [...prev.customTemplates, template]
    }));
    logEvent('custom_cluster_created', { name: template.name });
  };

  const discussionPoints = useMemo<DiscussionPoint[]>(() => {
    const points: DiscussionPoint[] = [];
    const type = appState.doctorVisitType;
    const all = Object.values(metrics) as MetricState[];

    // Add investigated anomalies first
    appState.savedObservations.forEach(obs => {
      points.push({ id: obs.id, text: `Discuss ${obs.metricName} spike (${obs.value}${obs.unit}): ${obs.userNote}` });
    });

    if (type === 'Endocrinologist') {
      const glucose = all.find(m => m.id === 'blood_glucose');
      if (glucose) {
        if (glucose.lastValue > 140) {
          points.push({ id: 'gluc_high', text: `Your blood sugar was a bit high recently at ${glucose.lastValue}. Discuss if this is linked to meals.` });
        } else {
          points.push({ id: 'gluc_ok', text: "Your sugar levels look stable. Ask your doctor if your current targets are still right for you." });
        }
      }
      points.push({ id: 'endo_diet', text: "Talk about how your daily meals are affecting your energy levels throughout the day." });
    } else if (type === 'Cardiologist') {
      const hrv = all.find(m => m.id === 'hrv');
      if (hrv && hrv.lastValue < hrv.avgValue * 0.85) {
        points.push({ id: 'hrv_low', text: "Your heart variability is lower than your usual average. This might mean your body needs more rest." });
      }
      const bp = all.find(m => m.id === 'blood_pressure');
      if (bp && bp.lastValue > 130) {
        points.push({ id: 'bp_high', text: `Your blood pressure reading of ${bp.lastValue} is higher than normal. Ask about stress management.` });
      }
    } else if (type === 'GP') {
      points.push({ id: 'gp_general', text: "Review your general activity levels and how your sleep has been feeling lately." });
      points.push({ id: 'gp_weight', text: "Discuss any recent changes in your weight and if they match your wellness goals." });
    }

    return points;
  }, [appState.doctorVisitType, appState.savedObservations, metrics]);

  const handleNewChat = () => {
    setIsDemoPlaying(false);
    setAppState(prev => ({ ...prev, chatHistory: [], investigationState: 'none', focusedAnomalyMetricId: null, investigationSummary: null }));
  };

  const playDemoChat = (metricId: string) => {
    const m = metrics[metricId];
    if (!m) return;

    const demoScript: { role: 'model' | 'user'; text: string }[] = [
      { role: 'model', text: `Your blood glucose is at ${m.lastValue} ${m.unit} today — that's noticeably higher than your usual average of ~${Math.round(m.avgValue)}. I've noted this down. Let me ask a few questions to understand what might have caused this. Did anything change recently — a heavy meal, missed medication, or a stressful day?` },
      { role: 'user', text: `I missed my medication yesterday and had a late dinner.` },
      { role: 'model', text: `Got it, I'll note that down. Missed medication and late meals are both common causes of glucose spikes. How has your sleep been the last couple of nights?` },
      { role: 'user', text: `Not great, maybe 5 hours.` },
      { role: 'model', text: `That tracks — poor sleep can reduce insulin sensitivity, which makes glucose harder to regulate. I'm seeing a pattern: missed dose + late meal + short sleep. I'll keep tracking your glucose over the next few days. If it stays elevated, we can flag this for your doctor.` },
    ];

    setIsDemoPlaying(true);
    setAppState(prev => ({
      ...prev,
      focusedAnomalyMetricId: metricId,
      investigationState: 'active',
      isChatOpen: true,
      chatHistory: []
    }));

    let i = 0;
    const playNext = () => {
      if (i >= demoScript.length) {
        setIsDemoPlaying(false);
        setIsSearching(false);
        return;
      }
      const msg = demoScript[i];
      if (msg.role === 'model') {
        setIsSearching(true);
        setTimeout(() => {
          setAppState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, msg] }));
          setIsSearching(false);
          i++;
          setTimeout(playNext, 1200);
        }, 1500);
      } else {
        setTimeout(() => {
          setAppState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, msg] }));
          i++;
          setTimeout(playNext, 800);
        }, 1000);
      }
    };
    setTimeout(playNext, 500);
  };

  const toggleFocus = useCallback((id: string) => {
    setAppState(prev => {
      const isRemoving = prev.focusMetricIds.includes(id);
      return { ...prev, focusMetricIds: isRemoving ? prev.focusMetricIds.filter(fid => fid !== id) : [...prev.focusMetricIds, id] };
    });
  }, []);

  const alerts = useMemo(() => {
    const generatedAlerts: Alert[] = [];
    (Object.values(metrics) as MetricState[]).forEach(m => {
      const alertId = `anomaly_${m.id}`;
      if (appState.dismissedAlertIds.includes(alertId)) return;
      const last = m.data[m.data.length - 1]?.value;
      const avg = m.avgValue;
      if (last > avg * 1.3 || last < avg * 0.7) {
        const direction = last > avg ? 'higher' : 'lower';
        const message = m.id === 'blood_glucose'
          ? `Your blood glucose is ${last} ${m.unit} — higher than your usual average of ~${Math.round(avg)}. This could be worth looking into.`
          : m.id === 'blood_pressure'
          ? `Your blood pressure has been elevated the last few days, reading ${last} ${m.unit} vs your usual ~${Math.round(avg)}.`
          : `Your ${m.name} is ${direction} than expected — ${last} ${m.unit} vs your usual ~${Math.round(avg)}.`;
        generatedAlerts.push({ id: alertId, type: 'anomaly', title: m.name, message, metricId: m.id });
      }
    });
    return generatedAlerts;
  }, [metrics, appState.dismissedAlertIds]);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-[#f2f2f7] relative">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl px-4 pt-4 pb-3 flex flex-col gap-3 shadow-sm border-b border-gray-100">
          <div className="flex bg-gray-100 p-1.5 rounded-[22px] w-full shadow-inner">
            <button onClick={() => setAppState(prev => ({ ...prev, displayMode: 'personal' }))} className={`flex-1 py-2.5 text-[10px] font-black rounded-[18px] transition-all uppercase tracking-[0.15em] ${appState.displayMode === 'personal' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Focus</button>
            <button onClick={() => setAppState(prev => ({ ...prev, displayMode: 'analysis' }))} className={`flex-1 py-2.5 text-[10px] font-black rounded-[18px] transition-all uppercase tracking-[0.15em] ${appState.displayMode === 'analysis' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Analysis</button>
            <button onClick={() => setAppState(prev => ({ ...prev, displayMode: 'doctor' }))} className={`flex-1 py-2.5 text-[10px] font-black rounded-[18px] transition-all uppercase tracking-[0.15em] ${appState.displayMode === 'doctor' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Doctor</button>
          </div>
      </div>

      <main>
        {appState.displayMode === 'personal' && (
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-6 mt-2">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Daily Health</p>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Focus</h1>
              </div>
              <button 
                onClick={() => setAppState(prev => ({ ...prev, view: 'library' }))} 
                className="bg-blue-600 text-white w-12 h-12 rounded-[20px] flex items-center justify-center shadow-xl shadow-blue-100 active:scale-95 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <NeedsAttention 
              alerts={alerts} 
              onDismiss={(id) => setAppState(prev => ({ ...prev, dismissedAlertIds: [...prev.dismissedAlertIds, id] }))} 
              onAction={(alert) => {
                if (alert.type === 'anomaly' && alert.metricId) {
                  if (alert.metricId === 'blood_glucose') {
                    playDemoChat(alert.metricId);
                  } else {
                    setAppState(prev => ({
                      ...prev,
                      focusedAnomalyMetricId: alert.metricId!,
                      investigationState: 'active',
                      isChatOpen: true,
                      chatHistory: [{ role: 'model', text: `I noticed your ${metrics[alert.metricId!].name} is at ${metrics[alert.metricId!].lastValue} ${metrics[alert.metricId!].unit} — that's ${metrics[alert.metricId!].lastValue > metrics[alert.metricId!].avgValue ? 'higher' : 'lower'} than your usual ~${Math.round(metrics[alert.metricId!].avgValue)}. Could you tell me if anything changed recently?` }]
                    }));
                  }
                }
              }} 
            />
            <div className="grid grid-cols-1 gap-5">
              {(Object.values(metrics) as MetricState[]).filter(m => appState.focusMetricIds.includes(m.id)).map(m => (
                <FocusCard key={m.id} metric={m} onRemove={toggleFocus} onLogClick={() => {}} onSaveObservation={(metric, interpretation) => {
                  const newObs: SavedObservation = {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: Date.now(),
                    metricId: metric.id,
                    metricName: metric.name,
                    value: metric.lastValue,
                    unit: metric.unit,
                    interpretation,
                    clinicalSignificance: "Manually flagged.",
                    userNote: ''
                  };
                  setAppState(prev => ({ ...prev, savedObservations: [newObs, ...prev.savedObservations] }));
                }} />
              ))}
            </div>
          </div>
        )}

        {appState.displayMode === 'analysis' && (
          <AnalysisHub 
              isSearching={isSearching}
              allMetrics={metrics}
              onSaveObservation={(metric, interpretation) => {
                const newObs: SavedObservation = {
                  id: Math.random().toString(36).substr(2, 9),
                  timestamp: Date.now(),
                  metricId: metric.id,
                  metricName: metric.name,
                  value: metric.lastValue,
                  unit: metric.unit,
                  interpretation,
                  clinicalSignificance: "Saved from Analysis.",
                  userNote: ''
                };
                setAppState(prev => ({ ...prev, savedObservations: [newObs, ...prev.savedObservations] }));
              }}
              focusedMetricId={appState.focusedAnomalyMetricId}
              investigationState={appState.investigationState}
              customTemplates={appState.customTemplates}
              onSaveCustomTemplate={handleSaveCustomTemplate}
              onSuggestCluster={suggestCluster}
          />
        )}

        {appState.displayMode === 'doctor' && (
          <div className="px-5 pt-4">
            <header className="mb-6 mt-2">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em]">Visit Checklist</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Visit Prep</h1>
            </header>
            <DoctorVisitSummary 
              visitType={appState.doctorVisitType}
              onVisitTypeChange={(type) => setAppState(prev => ({ ...prev, doctorVisitType: type }))}
              metrics={(Object.values(metrics) as MetricState[]).filter(m => DOCTOR_VIEW_PRIORITIES.includes(m.id))}
              discussionPoints={discussionPoints}
              onStarPoint={(id) => setAppState(prev => ({ 
                ...prev, 
                starredDiscussionIds: prev.starredDiscussionIds.includes(id) 
                  ? prev.starredDiscussionIds.filter(sid => sid !== id) 
                  : [...prev.starredDiscussionIds, id] 
              }))}
              starredIds={appState.starredDiscussionIds}
            />
          </div>
        )}
      </main>

      <button onClick={() => setAppState(prev => ({ ...prev, isChatOpen: true }))} className="fixed bottom-28 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white z-40 border-4 border-white active:scale-90 transition-all shadow-indigo-200"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></button>
      <GlobalChat isOpen={appState.isChatOpen} onClose={() => { setIsDemoPlaying(false); setAppState(prev => ({ ...prev, isChatOpen: false })); }} onNewChat={handleNewChat} history={appState.chatHistory} onSend={handleChat} isSearching={isSearching} investigationState={appState.investigationState} investigationSummary={appState.investigationSummary} focusedMetric={appState.focusedAnomalyMetricId ? metrics[appState.focusedAnomalyMetricId] : undefined} onSummarize={handleSummarizeInvestigation} onFinish={handleFinishInvestigation} isDemoPlaying={isDemoPlaying} />

      {appState.view === 'library' && (
        <Library onClose={() => setAppState(prev => ({ ...prev, view: 'home' }))} onToggleFocus={toggleFocus} focusIds={appState.focusMetricIds} />
      )}
    </div>
  );
};

export default App;
