
import { useState, useCallback, useEffect } from 'react';
import { ResearchLog } from '../types';

export const useLogger = (interfaceMode: 'adaptive' | 'baseline', displayMode: string) => {
  const [logs, setLogs] = useState<ResearchLog[]>(() => {
    const saved = localStorage.getItem('research_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const logEvent = useCallback((event: string, payload: any = {}) => {
    const newLog: ResearchLog = {
      timestamp: Date.now(),
      event,
      payload,
      viewMode: displayMode,
      interfaceMode
    };
    
    setLogs(prev => {
      const updated = [...prev, newLog];
      localStorage.setItem('research_logs', JSON.stringify(updated));
      return updated;
    });
    
    console.debug(`[LOG]: ${event}`, payload);
  }, [interfaceMode, displayMode]);

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('research_logs');
  };

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `research_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return { logs, logEvent, clearLogs, exportLogs };
};
