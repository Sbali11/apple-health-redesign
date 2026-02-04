
import React, { useState, useEffect, useMemo } from 'react';
import { MetricState, AnalysisTemplate } from '../types';
import { METRIC_CATALOG } from '../constants';
import FocusCard from './FocusCard';

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
    id: 'heart_health', 
    name: 'Heart Check', 
    icon: '❤️', 
    description: 'Vitality', 
    metricIds: ['resting_hr', 'hrv', 'blood_pressure', 'vo2_max'], 
    narrative: 'This group tracks your heart rhythm and how well your body handles stress. Keep an eye on your Resting HR—it should stay consistent. If your HRV (Heart Variability) drops significantly, it might be a sign that you need more rest or are dealing with high stress.', 
    color: 'from-rose-500 to-pink-600' 
  },
  { 
    id: 'weight_mgmt', 
    name: 'Body Balance', 
    icon: '⚖️', 
    description: 'Physical', 
    metricIds: ['weight', 'calories', 'water', 'bmi'], 
    narrative: 'Use this to see the relationship between what you eat and your body weight. Look for steady trends rather than daily jumps. Drinking enough water and keeping calories consistent helps keep your energy levels even throughout the week.', 
    color: 'from-emerald-500 to-teal-600' 
  },
  { 
    id: 'sleep_recov', 
    name: 'Sleep & Rest', 
    icon: '🌙', 
    description: 'Recovery', 
    metricIds: ['sleep_duration', 'sleep_quality', 'rem_sleep', 'hrv'], 
    narrative: 'This tracks how your body recharges. Look at your Sleep Quality score—if it’s low even when you sleep 8 hours, you might be having restless nights. Consistent REM sleep is key for feeling mentally sharp the next day.', 
    color: 'from-indigo-500 to-blue-600' 
  },
  { 
    id: 'metabolic', 
    name: 'Fuel & Energy', 
    icon: '⚡', 
    description: 'Metabolism', 
    metricIds: ['blood_glucose', 'calories', 'medications', 'active_energy'], 
    narrative: 'This monitors how your body uses fuel. Look for stability in your sugar levels. Large spikes often happen after sugary meals or when you haven’t been active. Stable readings usually lead to better mood and more consistent energy.', 
    color: 'from-orange-500 to-amber-600' 
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
            
            <div className="mb-8">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 leading-none">What to look for</p>
              <p className="text-sm text-gray-700 font-medium leading-relaxed bg-blue-50/50 p-5 rounded-[24px] border border-blue-100/50">
                {activeTemplate.narrative}
              </p>
            </div>

            <div className="space-y-6">
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
