
import React, { useState, useMemo } from 'react';
import { MetricState } from '../types';
import Sparkline from './Sparkline';

interface FocusCardProps {
  metric: MetricState;
  onRemove: (id: string) => void;
  onLogClick: (metric: MetricState) => void;
  onSaveObservation: (metric: MetricState, interpretation: string) => void;
}

const FocusCard: React.FC<FocusCardProps> = ({ metric, onRemove, onLogClick, onSaveObservation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const interpretation = useMemo(() => {
    const diff = ((metric.lastValue - metric.avgValue) / metric.avgValue) * 100;
    if (diff > 15) return "Higher than your usual average";
    if (diff < -15) return "Lower than your usual average";
    return "Looking stable and consistent";
  }, [metric]);

  const getTrendColor = () => {
    if (metric.trend === 'up') return 'text-rose-500';
    if (metric.trend === 'down') return 'text-blue-500';
    return 'text-gray-400';
  };

  return (
    <div 
      className={`relative group bg-white rounded-3xl p-5 shadow-sm transition-all duration-300 active:scale-[0.98] border-2 ${metric.isSuggested ? 'border-purple-200 bg-purple-50/30' : 'border-transparent'}`}
      onClick={() => onLogClick(metric)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`${metric.color} w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm shadow-black/5`}>
            {metric.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{metric.name}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{metric.category}</p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onSaveObservation(metric, interpretation);
            }}
            className="text-gray-300 hover:text-blue-500 transition-colors p-1.5 bg-gray-50 rounded-full"
            title="Add to Journal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
            className="text-gray-300 hover:text-gray-600 transition-colors p-1.5 bg-gray-50 rounded-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900 tracking-tight">{metric.lastValue}</span>
            <span className="text-xs font-bold text-gray-400">{metric.unit}</span>
          </div>
          <p className={`text-[11px] font-bold ${getTrendColor()} mt-1 flex items-center gap-1`}>
            {interpretation}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <Sparkline data={metric.data.slice(-14)} color={metric.trend === 'up' ? '#F43F5E' : '#3B82F6'} />
        </div>
      </div>

      {showTooltip && (
        <div className="absolute top-12 right-4 z-20 w-56 bg-gray-900 text-white text-[11px] p-3 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
          <p className="font-bold mb-2 text-blue-400 uppercase tracking-widest text-[9px]">What this means</p>
          <p className="opacity-90 leading-relaxed">
            {metric.suggestionReason || (metric.isUserSelected ? "You pinned this to your daily list to keep a close eye on it." : "We're showing this because your recent readings changed from your usual average.")}
          </p>
          <div className="mt-3 flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(metric.id); }}
              className="flex-1 bg-red-500/20 text-red-400 py-1.5 rounded-lg font-bold border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              Hide
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              className="flex-1 bg-white/10 text-white py-1.5 rounded-lg font-bold hover:bg-white/20 transition-all"
            >
              Okay
            </button>
          </div>
        </div>
      )}
      
      {metric.isSuggested && (
        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-purple-200 border border-white/20">
          AUTO-ADDED
        </div>
      )}
    </div>
  );
};

export default FocusCard;
