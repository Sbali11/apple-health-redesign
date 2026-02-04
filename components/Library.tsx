
import React, { useState } from 'react';
import { METRIC_CATALOG } from '../constants';
import { MetricCategory } from '../types';

interface LibraryProps {
  onClose: () => void;
  onToggleFocus: (id: string) => void;
  focusIds: string[];
}

const Library: React.FC<LibraryProps> = ({ onClose, onToggleFocus, focusIds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<MetricCategory | 'All'>('All');

  const filteredMetrics = METRIC_CATALOG.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'All' || m.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="px-6 py-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold">Health Library</h2>
        <button onClick={onClose} className="text-blue-500 font-medium">Done</button>
      </div>

      <div className="px-6 py-3">
        <div className="relative">
          <input 
            type="text"
            placeholder="Search metrics..."
            className="w-full bg-gray-100 rounded-xl py-2 px-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-2 px-6 py-2 overflow-x-auto no-scrollbar mb-2">
        {['All', ...Object.values(MetricCategory)].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
        {filteredMetrics.length > 0 ? filteredMetrics.map(m => (
          <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className={`${m.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>
                {m.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{m.name}</h4>
                <p className="text-xs text-gray-500">{m.category} • {m.frequency}</p>
              </div>
            </div>
            <button 
              onClick={() => onToggleFocus(m.id)}
              className={`p-2 rounded-full transition-colors ${focusIds.includes(m.id) ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50'}`}
            >
              {focusIds.includes(m.id) ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" className="rotate-45" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </div>
        )) : (
          <div className="text-center py-20 text-gray-400">
            No metrics found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
