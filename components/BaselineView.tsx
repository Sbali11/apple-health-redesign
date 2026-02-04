
import React, { useState } from 'react';
import { METRIC_CATALOG } from '../constants';
import { MetricState } from '../types';

interface BaselineViewProps {
  metrics: Record<string, MetricState>;
  onLogClick: (m: MetricState) => void;
}

const BaselineView: React.FC<BaselineViewProps> = ({ metrics, onLogClick }) => {
  const [search, setSearch] = useState('');

  // Explicitly cast Object.values to MetricState[] to fix property access errors on unknown type
  const list: MetricState[] = (Object.values(metrics) as MetricState[]).filter((m: MetricState) => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Health Data</h1>
        <p className="text-gray-500 mt-1">Full alphabetical list of metrics.</p>
      </header>

      <div className="relative mb-6">
        <input 
          type="text"
          placeholder="Search all metrics..."
          className="w-full bg-gray-100 border border-transparent focus:border-blue-500 rounded-xl py-3 px-12 transition-all outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <svg className="w-6 h-6 absolute left-4 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Iterate over list where elements are guaranteed to be MetricState */}
        {list.map((m: MetricState) => (
          <div 
            key={m.id} 
            className="flex items-center justify-between py-4 hover:bg-gray-50 cursor-pointer px-2 rounded-lg transition-colors"
            onClick={() => onLogClick(m)}
          >
            <div className="flex items-center gap-4">
              <div className={`${m.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>
                {m.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{m.name}</h4>
                <p className="text-xs text-gray-500">{m.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800">{m.lastValue} {m.unit}</p>
              <p className="text-[10px] text-gray-400">Last updated: Today</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BaselineView;
