
import React from 'react';
import { MetricState, DiscussionPoint, DoctorType } from '../types';

interface DoctorVisitSummaryProps {
  metrics: MetricState[];
  discussionPoints: DiscussionPoint[];
  onStarPoint: (id: string) => void;
  starredIds: string[];
  visitType: DoctorType;
  onVisitTypeChange: (type: DoctorType) => void;
}

const DOCTOR_TIPS: Record<DoctorType, string> = {
  'GP': 'Focus on general wellness trends. Discuss your overall energy levels, weight consistency, and any recent anomalies in basic vitals.',
  'Cardiologist': 'Prioritize Heart Rate Variability and Resting Heart Rate. Be prepared to discuss your aerobic activity levels and any spikes in Blood Pressure.',
  'Endocrinologist': 'Focus heavily on Blood Glucose stability and Nutrition logs. Discuss how your diet correlates with your energy and glucose readings.',
  'Sleep Specialist': 'Provide details on your sleep hygiene. Use the Quality and Duration trends to discuss patterns of wakefulness or restlessness.'
};

const DoctorVisitSummary: React.FC<DoctorVisitSummaryProps> = ({ 
  metrics, 
  discussionPoints, 
  onStarPoint, 
  starredIds,
  visitType,
  onVisitTypeChange
}) => {
  const types: DoctorType[] = ['GP', 'Cardiologist', 'Endocrinologist', 'Sleep Specialist'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <section>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Visit Specialty</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => onVisitTypeChange(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${
                visitType === t ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Priority Discussion Points</h2>
        </div>
        
        <div className="space-y-2">
          {discussionPoints.map(point => (
            <div 
              key={point.id}
              onClick={() => onStarPoint(point.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                starredIds.includes(point.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-white bg-white shadow-sm'
              }`}
            >
              <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${
                starredIds.includes(point.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-snug">{point.text}</p>
            </div>
          ))}
          {discussionPoints.length === 0 && (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 text-sm italic">
              No specific anomalies for a {visitType} visit detected.
            </div>
          )}
        </div>
      </section>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-100">
        <div className="flex items-center gap-2 mb-2">
           <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <h3 className="font-bold tracking-tight">{visitType} Clinical Guidance</h3>
        </div>
        <p className="text-xs opacity-90 leading-relaxed font-medium">
          {DOCTOR_TIPS[visitType]}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Supporting Vitals</h2>
        <div className="bg-white rounded-[32px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
          {metrics.map(m => {
             return (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{m.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{m.name}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">Status: Active</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-gray-900">{m.lastValue}</span>
                  <span className="text-[10px] text-gray-500 ml-1 font-bold">{m.unit}</span>
                  <div className={`text-[10px] font-black ${m.trend === 'up' ? 'text-rose-500' : 'text-blue-500'} mt-1`}>
                    {m.trend === 'up' ? '↑' : '↓'} 30D Trend
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      </section>
    </div>
  );
};

export default DoctorVisitSummary;
