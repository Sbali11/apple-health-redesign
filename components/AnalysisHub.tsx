
import React, { useState, useEffect, useMemo } from 'react';
import { MetricState, AnalysisTemplate } from '../types';
import { METRIC_CATALOG } from '../constants';
import FocusCard from './FocusCard';

type InsightGenerator = (metrics: Record<string, MetricState>) => { icon: string; text: string; color: string }[];

const GROUP_INSIGHTS: Record<string, InsightGenerator> = {
  diabetes_mgmt: (m) => {
    const glucose = m['blood_glucose'];
    const meds = m['medications'];
    const weight = m['weight'];
    return [
      { icon: '⚠️', text: `Your blood glucose is at ${glucose?.lastValue} ${glucose?.unit} — that's ${glucose?.lastValue > glucose?.avgValue ? 'above' : 'near'} your usual ~${Math.round(glucose?.avgValue || 0)}. Let's see what else is happening.`, color: 'border-rose-200 bg-rose-50' },
      { icon: '💊', text: `Medication adherence is at ${meds?.lastValue}${meds?.unit}. ${(meds?.lastValue || 0) < 90 ? 'A missed dose could be contributing to that glucose spike.' : 'Adherence looks steady, so the spike may be diet-related.'}`, color: 'border-amber-200 bg-amber-50' },
      { icon: '📊', text: `Weight is ${weight?.lastValue} ${weight?.unit} (avg ~${Math.round(weight?.avgValue || 0)}). ${(weight?.lastValue || 0) > (weight?.avgValue || 0) ? 'Weight trending up alongside glucose — worth reviewing calorie intake with your doctor.' : 'Weight is stable, so this glucose reading is likely a one-off.'}`, color: 'border-emerald-200 bg-emerald-50' },
    ];
  },
  marathon_prep: (m) => {
    const vo2 = m['vo2_max'];
    const rhr = m['resting_hr'];
    const sleep = m['sleep_quality'];
    return [
      { icon: '🫁', text: `VO2 Max is at ${vo2?.lastValue} ${vo2?.unit}. ${(vo2?.lastValue || 0) >= (vo2?.avgValue || 0) ? 'Trending steady or up — your aerobic base is building.' : 'Dipped below your average. Could be fatigue or under-recovery.'}`, color: 'border-blue-200 bg-blue-50' },
      { icon: '❤️', text: `Resting HR is ${rhr?.lastValue} bpm (avg ~${Math.round(rhr?.avgValue || 0)}). ${(rhr?.lastValue || 0) > (rhr?.avgValue || 0) * 1.1 ? 'Elevated — your body may not be recovering between sessions.' : 'Looks normal. Recovery is on track.'}`, color: 'border-rose-200 bg-rose-50' },
      { icon: '😴', text: `Sleep quality at ${sleep?.lastValue}${sleep?.unit}. ${(sleep?.lastValue || 0) < 70 ? 'Low sleep quality will hurt recovery and VO2 gains. Prioritize rest before your next hard session.' : 'Good sleep supports the training load. Keep it up.'}`, color: 'border-indigo-200 bg-indigo-50' },
    ];
  },
  stress_recovery: (m) => {
    const hrv = m['hrv'];
    const rem = m['rem_sleep'];
    const rhr = m['resting_hr'];
    return [
      { icon: '📉', text: `HRV is ${hrv?.lastValue} ${hrv?.unit} (avg ~${Math.round(hrv?.avgValue || 0)}). ${(hrv?.lastValue || 0) < (hrv?.avgValue || 0) * 0.85 ? 'Significantly below average — your nervous system is under strain.' : 'Within normal range. Stress levels appear manageable.'}`, color: 'border-violet-200 bg-violet-50' },
      { icon: '🧠', text: `REM sleep was ${rem?.lastValue} ${rem?.unit} last night. ${(rem?.lastValue || 0) < 60 ? 'Low REM means less mental recovery. Combined with low HRV, this points to accumulated stress.' : 'Healthy REM duration supports cognitive recovery.'}`, color: 'border-purple-200 bg-purple-50' },
      { icon: '💓', text: `Resting HR at ${rhr?.lastValue} bpm. ${(rhr?.lastValue || 0) > (rhr?.avgValue || 0) * 1.05 ? 'Slightly elevated alongside low HRV — classic overtraining or high-stress pattern. Consider a rest day.' : 'Stable. No compounding signals detected.'}`, color: 'border-pink-200 bg-pink-50' },
    ];
  },
  heart_bp: (m) => {
    const bp = m['blood_pressure'];
    const exercise = m['exercise_mins'];
    const water = m['water'];
    return [
      { icon: '🩺', text: `Blood pressure is reading ${bp?.lastValue} ${bp?.unit} (usual ~${Math.round(bp?.avgValue || 0)}). ${(bp?.lastValue || 0) > 130 ? 'Elevated over the last few days. Let\'s check what else changed.' : 'Within a healthy range.'}`, color: 'border-red-200 bg-red-50' },
      { icon: '🏃', text: `Exercise: ${exercise?.lastValue} ${exercise?.unit} today. ${(exercise?.lastValue || 0) < (exercise?.avgValue || 0) * 0.7 ? 'Below your usual level. Reduced activity can contribute to higher BP readings.' : 'Activity looks consistent. BP may be influenced by other factors.'}`, color: 'border-green-200 bg-green-50' },
      { icon: '💧', text: `Water intake is ${water?.lastValue} ${water?.unit} (avg ~${Math.round(water?.avgValue || 0)}). ${(water?.lastValue || 0) < (water?.avgValue || 0) * 0.8 ? 'Dehydration can raise blood pressure. Combined with lower exercise, this is a pattern to flag for your doctor.' : 'Hydration is on track.'}`, color: 'border-cyan-200 bg-cyan-50' },
    ];
  },
};

interface AnalysisHubProps {
  isSearching: boolean;
  allMetrics: Record<string, MetricState>;
  onSaveObservation: (metric: MetricState, interpretation: string) => void;
  focusedMetricId: string | null;
  investigationState: 'none' | 'active' | 'concluding';
  customTemplates: AnalysisTemplate[];
  onSaveCustomTemplate: (template: AnalysisTemplate) => void;
  onSuggestCluster: (goal: string) => Promise<any>;
}

const SYSTEM_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'diabetes_mgmt',
    name: 'Diabetes Management',
    icon: '💉',
    description: 'Blood Sugar Control',
    metricIds: ['blood_glucose', 'medications', 'weight', 'calories', 'water'],
    narrative: 'Watch for glucose spikes after meals — if your weight and glucose are both trending up, review your calorie intake and medication timing with your doctor. Consistent hydration helps stabilize blood sugar throughout the day.',
    color: 'from-rose-500 to-red-700'
  },
  {
    id: 'marathon_prep',
    name: 'Marathon Prep',
    icon: '🏃‍♂️',
    description: 'Endurance Training',
    metricIds: ['vo2_max', 'resting_hr', 'active_energy', 'sleep_quality', 'calories'],
    narrative: 'Your VO2 Max trend shows whether your endurance is improving. If your resting HR is climbing week over week while training load stays the same, you may be under-recovering. Pair this with sleep quality to know when to push and when to rest.',
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'stress_recovery',
    name: 'Stress & Recovery',
    icon: '🧘',
    description: 'Mental Wellbeing',
    metricIds: ['hrv', 'sleep_quality', 'rem_sleep', 'resting_hr'],
    narrative: 'A sustained HRV drop paired with poor REM sleep usually means your body is not recovering. If your resting HR is also elevated, consider reducing training intensity, improving sleep hygiene, or managing stressors before they compound.',
    color: 'from-indigo-500 to-violet-700'
  },
  {
    id: 'heart_bp',
    name: 'Blood Pressure Watch',
    icon: '🩺',
    description: 'Hypertension Tracking',
    metricIds: ['blood_pressure', 'resting_hr', 'weight', 'exercise_mins', 'water'],
    narrative: 'Track how your blood pressure responds to exercise, hydration, and weight changes over time. If your BP is rising while exercise and water intake are dropping, that is a pattern worth discussing with your doctor before your next visit.',
    color: 'from-emerald-500 to-teal-700'
  }
];

const AnalysisHub: React.FC<AnalysisHubProps> = ({ 
  allMetrics,
  onSaveObservation,
  focusedMetricId,
  customTemplates,
  onSaveCustomTemplate,
  onSuggestCluster
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [visibleInsightCount, setVisibleInsightCount] = useState(0);
  const [insightsDone, setInsightsDone] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildMode, setBuildMode] = useState<'ai' | 'manual'>('ai');
  
  const [builderGoal, setBuilderGoal] = useState('');
  const [suggestedMetrics, setSuggestedMetrics] = useState<any>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [manualName, setManualName] = useState('');
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);

  const allTemplates = useMemo(() => [...SYSTEM_TEMPLATES, ...customTemplates], [customTemplates]);

  useEffect(() => {
    if (focusedMetricId) {
      const template = allTemplates.find(t => t.metricIds.includes(focusedMetricId));
      if (template) setActiveTemplateId(template.id);
    }
  }, [focusedMetricId]);

  const activeTemplate = allTemplates.find(t => t.id === activeTemplateId);

  const activeInsights = useMemo(() => {
    if (!activeTemplateId || !GROUP_INSIGHTS[activeTemplateId]) return [];
    return GROUP_INSIGHTS[activeTemplateId](allMetrics);
  }, [activeTemplateId, allMetrics]);

  useEffect(() => {
    if (!activeTemplateId || activeInsights.length === 0) {
      setVisibleInsightCount(0);
      setInsightsDone(false);
      return;
    }
    setVisibleInsightCount(0);
    setInsightsDone(false);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleInsightCount(count);
      if (count >= activeInsights.length) {
        clearInterval(interval);
        setTimeout(() => setInsightsDone(true), 600);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [activeTemplateId]);

  const handleAISuggest = async () => {
    if (!builderGoal.trim()) return;
    setIsAIProcessing(true);
    const suggestion = await onSuggestCluster(builderGoal);
    if (suggestion) {
      setSuggestedMetrics(suggestion);
    }
    setIsAIProcessing(false);
  };

  const handleSaveAICluster = () => {
    if (!suggestedMetrics) return;
    const newTemplate: AnalysisTemplate = {
      id: `custom_${Date.now()}`,
      name: suggestedMetrics.title,
      icon: suggestedMetrics.icon || '✨',
      description: suggestedMetrics.description,
      metricIds: suggestedMetrics.metricIds,
      narrative: suggestedMetrics.narrative,
      color: 'from-violet-500 to-indigo-600',
      isCustom: true
    };
    onSaveCustomTemplate(newTemplate);
    closeBuilder();
  };

  const handleSaveManualCluster = () => {
    if (!manualName.trim() || selectedMetricIds.length === 0) return;
    const newTemplate: AnalysisTemplate = {
      id: `custom_${Date.now()}`,
      name: manualName,
      icon: '🛠️',
      description: 'Hand-picked Group',
      metricIds: selectedMetricIds,
      narrative: 'This is a group of statistics you chose to track together based on your own personal health goals.',
      color: 'from-gray-700 to-gray-900',
      isCustom: true
    };
    onSaveCustomTemplate(newTemplate);
    closeBuilder();
  };

  const closeBuilder = () => {
    setIsBuilding(false);
    setSuggestedMetrics(null);
    setBuilderGoal('');
    setManualName('');
    setSelectedMetricIds([]);
    setBuildMode('ai');
  };

  const toggleMetric = (id: string) => {
    setSelectedMetricIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-end mb-8 mt-2">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] leading-none mb-1">Deep Dive</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analysis</h1>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1 leading-none">Smart Groups</h2>
        <div className="grid grid-cols-2 gap-4">
          {allTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTemplateId(activeTemplateId === t.id ? null : t.id)}
              className={`p-5 rounded-[32px] text-left transition-all border-2 relative overflow-hidden ${
                activeTemplateId === t.id 
                  ? `border-blue-500 bg-gradient-to-br ${t.color} text-white shadow-xl scale-95` 
                  : 'border-white bg-white text-gray-900 shadow-sm hover:border-blue-100 hover:shadow-md'
              }`}
            >
              {t.isCustom && <div className="absolute top-3 right-3 text-[8px] font-black uppercase text-white/60">Saved</div>}
              <div className="text-3xl mb-3">{t.icon}</div>
              <h3 className="text-sm font-black mb-1 leading-tight">{t.name}</h3>
              <p className={`text-[10px] font-bold uppercase tracking-wider leading-none ${activeTemplateId === t.id ? 'text-white/80' : 'text-gray-400'}`}>
                {t.description}
              </p>
            </button>
          ))}
          <button 
            onClick={() => setIsBuilding(true)}
            className="p-5 rounded-[32px] text-left border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">New Group</span>
          </button>
        </div>
      </section>

      {activeTemplate && (
        <section className="mb-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] p-6 shadow-2xl shadow-black/5 border border-blue-50">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {activeTemplate.icon} {activeTemplate.name}
              </h2>
              <button onClick={() => setActiveTemplateId(null)} className="text-gray-300 p-1"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            {activeInsights.length > 0 && (
              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Live Analysis</p>
                </div>
                {activeInsights.slice(0, visibleInsightCount).map((insight, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-4 rounded-[20px] border ${insight.color} animate-in slide-in-from-bottom-2 fade-in duration-500`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{insight.icon}</span>
                    <p className="text-xs font-semibold text-gray-700 leading-relaxed">{insight.text}</p>
                  </div>
                ))}
                {!insightsDone && visibleInsightCount < activeInsights.length && (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-1">Analyzing connections...</span>
                  </div>
                )}
              </div>
            )}

            {activeInsights.length === 0 && (
              <div className="mb-8">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 leading-none">What to look for</p>
                <p className="text-sm text-gray-700 font-medium leading-relaxed bg-blue-50/50 p-5 rounded-[24px] border border-blue-100/50">
                  {activeTemplate.narrative}
                </p>
              </div>
            )}

            {(insightsDone || activeInsights.length === 0) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Current Values</p>
                {activeTemplate.metricIds.map(mid => {
                  const m = allMetrics[mid];
                  if (!m) return null;
                  return (
                    <FocusCard
                      key={mid}
                      metric={m}
                      onRemove={() => {}}
                      onLogClick={() => {}}
                      onSaveObservation={onSaveObservation}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {isBuilding && (
        <div className="fixed inset-0 z-[110] bg-white p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Group</h2>
                <button onClick={closeBuilder} className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-gray-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
              <button onClick={() => setBuildMode('ai')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${buildMode === 'ai' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>AI Assistant</button>
              <button onClick={() => setBuildMode('manual')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${buildMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Manual Choice</button>
            </div>

            {buildMode === 'ai' ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">✨</div>
                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest leading-none">AI Assistant</h3>
                    </div>
                    <p className="text-xs text-indigo-700 font-medium mb-4 leading-relaxed">"Describe a health goal (like 'I want to feel more energetic' or 'I am preparing for a race') and I'll build the best group for you."</p>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={builderGoal}
                            onChange={(e) => setBuilderGoal(e.target.value)}
                            placeholder="e.g. Optimize marathon recovery..."
                            className="w-full bg-white py-4 pl-5 pr-12 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                        />
                        <button 
                            onClick={handleAISuggest}
                            disabled={isAIProcessing || !builderGoal}
                            className="absolute right-2 top-2 bg-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-50"
                        >
                            {isAIProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"/> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
                        </button>
                    </div>
                </div>

                {suggestedMetrics && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="text-4xl">{suggestedMetrics.icon}</div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 leading-tight">{suggestedMetrics.title}</h4>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{suggestedMetrics.description}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">"{suggestedMetrics.narrative}"</p>
                        
                        <div className="space-y-3 mb-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Included Items</p>
                            {suggestedMetrics.metricIds.map((mid: string) => {
                                const m = METRIC_CATALOG.find(x => x.id === mid);
                                return m ? (
                                    <div key={mid} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <span className="text-xl">{m.icon}</span>
                                        <span className="text-sm font-bold text-gray-800">{m.name}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <button onClick={handleSaveAICluster} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                            Save AI Group
                        </button>
                    </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Group Name</label>
                   <input 
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. My Weekend Focus"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-blue-200 transition-all"
                   />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Pick Statistics</label>
                  <div className="grid grid-cols-1 gap-2">
                    {METRIC_CATALOG.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => toggleMetric(m.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          selectedMetricIds.includes(m.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{m.icon}</span>
                          <span className="text-sm font-bold text-gray-800">{m.name}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedMetricIds.includes(m.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'
                        }`}>
                          {selectedMetricIds.includes(m.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSaveManualCluster} 
                  disabled={!manualName.trim() || selectedMetricIds.length === 0}
                  className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Create Custom Group
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AnalysisHub;
