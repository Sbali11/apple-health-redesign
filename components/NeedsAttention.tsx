
import React from 'react';
import { DoctorType } from '../types';

export interface Alert {
  id: string;
  type: 'anomaly' | 'visit_suggestion' | 'metric_suggestion';
  message: string;
  title: string;
  doctorType?: DoctorType;
  metricId?: string;
}

interface NeedsAttentionProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onAction: (alert: Alert) => void;
}

const NeedsAttention: React.FC<NeedsAttentionProps> = ({ alerts, onDismiss, onAction }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="mt-2 mb-8 px-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
          Prioritized Alerts
          <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center justify-center min-w-[18px]">
            {alerts.length}
          </span>
        </h2>
      </div>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className="bg-white rounded-[28px] p-5 shadow-xl shadow-rose-900/5 border border-rose-50 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  alert.type === 'anomaly' ? 'bg-rose-100 text-rose-600' : 
                  alert.type === 'visit_suggestion' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {alert.type === 'anomaly' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  {alert.type === 'visit_suggestion' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  {alert.type === 'metric_suggestion' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">{alert.title}</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{alert.message}</p>
                </div>
              </div>
              <button 
                onClick={() => onDismiss(alert.id)}
                className="text-gray-300 hover:text-gray-500 p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onAction(alert)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/5 ${
                  alert.type === 'anomaly' ? 'bg-rose-600 text-white shadow-rose-200' : 
                  alert.type === 'visit_suggestion' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-emerald-600 text-white shadow-emerald-200'
                }`}
              >
                {alert.type === 'anomaly' ? 'Analyze Pattern' : 
                 alert.type === 'visit_suggestion' ? 'Prep Visit' : 'Add to Focus'}
              </button>
              <button 
                onClick={() => onDismiss(alert.id)}
                className="px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Later
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeedsAttention;
