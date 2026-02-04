
import { MetricState, HealthMetric } from '../types';

export const getAIRecommendations = (
  metrics: Record<string, MetricState>,
  userFocusIds: string[]
): { id: string; reason: string }[] => {
  const recommendations: { id: string; reason: string }[] = [];

  Object.values(metrics).forEach(m => {
    // 1. Skip if already in focus
    if (userFocusIds.includes(m.id)) return;

    // 2. Logic: Anomaly detection
    const last = m.data[m.data.length - 1]?.value;
    const avg = m.data.slice(-7).reduce((a, b) => a + b.value, 0) / 7;
    
    if (last > avg * 1.25 || last < avg * 0.75) {
      recommendations.push({ 
        id: m.id, 
        reason: `AI detected unusual pattern (${m.trend === 'up' ? 'spike' : 'drop'} in ${m.name})` 
      });
      return;
    }

    // 3. Logic: Missing data for regular metrics
    if (m.frequency === 'Daily') {
       // Mock logic: randomly suggest one if it's high priority category
       if (m.category === 'Clinical' && Math.random() > 0.8) {
         recommendations.push({ id: m.id, reason: "You usually track this clinical metric" });
       }
    }
    
    // 4. Logic: Contextual (mocked)
    if (m.id === 'blood_glucose' && !userFocusIds.includes(m.id)) {
        recommendations.push({ id: m.id, reason: "Suggested based on your health goals" });
    }
  });

  return recommendations.slice(0, 2); // Return top 2
};
