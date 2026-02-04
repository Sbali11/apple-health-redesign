
import { DataPoint } from '../types';

export const generateDataPoints = (metricId: string, days: number = 30): DataPoint[] => {
  const points: DataPoint[] = [];
  const now = new Date();
  
  // Baseline values
  let baseValue = 70;
  let variance = 5;

  switch(metricId) {
    case 'steps': baseValue = 8000; variance = 2000; break;
    case 'blood_glucose': baseValue = 100; variance = 15; break;
    case 'blood_pressure': baseValue = 120; variance = 10; break;
    case 'sleep_duration': baseValue = 7.5; variance = 1; break;
    case 'weight': baseValue = 75; variance = 0.5; break;
    case 'resting_hr': baseValue = 65; variance = 8; break;
    default: baseValue = 50; variance = 10;
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some random walk + noise
    let val = baseValue + (Math.random() - 0.5) * variance;
    
    // Add intentional anomalies for specific metrics
    if (metricId === 'blood_pressure' && i < 3) val += 20; // Recent spike
    if (metricId === 'sleep_duration' && i > 5 && i < 10) val -= 3; // Poor streak
    if (metricId === 'blood_glucose' && i === 0) val = 165; // Immediate spike
    
    points.push({
      timestamp: date.toISOString(),
      value: Number(val.toFixed(1))
    });
  }
  return points;
};
