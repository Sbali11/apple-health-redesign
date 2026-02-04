
import { MetricCategory, HealthMetric, UserPersona } from './types';

export const METRIC_CATALOG: HealthMetric[] = [
  // Activity
  { id: 'steps', name: 'Steps', category: MetricCategory.ACTIVITY, description: 'Total steps taken.', unit: 'steps', icon: '👣', color: 'bg-orange-500', frequency: 'Daily' },
  { id: 'distance', name: 'Distance', category: MetricCategory.ACTIVITY, description: 'Walking and running distance.', unit: 'km', icon: '🏃‍♂️', color: 'bg-orange-400', frequency: 'Daily' },
  { id: 'flights', name: 'Flights Climbed', category: MetricCategory.ACTIVITY, description: 'Elevation gain in flights.', unit: 'flights', icon: '🪜', color: 'bg-orange-300', frequency: 'Daily' },
  { id: 'active_energy', name: 'Active Energy', category: MetricCategory.ACTIVITY, description: 'Calories burned during exercise.', unit: 'kcal', icon: '🔥', color: 'bg-red-500', frequency: 'Daily' },
  { id: 'exercise_mins', name: 'Exercise Minutes', category: MetricCategory.ACTIVITY, description: 'Time spent in moderate-to-vigorous activity.', unit: 'min', icon: '⌚', color: 'bg-lime-500', frequency: 'Daily' },
  
  // Heart
  { id: 'resting_hr', name: 'Resting HR', category: MetricCategory.HEART, description: 'Pulse when still.', unit: 'bpm', icon: '❤️', color: 'bg-red-600', frequency: 'Daily' },
  { id: 'hrv', name: 'HR Variability', category: MetricCategory.HEART, description: 'Variability between heartbeats.', unit: 'ms', icon: '📈', color: 'bg-pink-500', frequency: 'Daily' },
  { id: 'blood_pressure', name: 'Blood Pressure', category: MetricCategory.HEART, description: 'Systolic/Diastolic pressure.', unit: 'mmHg', icon: '🩺', color: 'bg-red-700', frequency: 'Daily' },
  { id: 'vo2_max', name: 'VO2 Max', category: MetricCategory.HEART, description: 'Aerobic fitness level.', unit: 'ml/kg/min', icon: '🫁', color: 'bg-blue-400', frequency: 'Occasional' },

  // Sleep
  { id: 'sleep_duration', name: 'Sleep Duration', category: MetricCategory.SLEEP, description: 'Total time asleep.', unit: 'hr', icon: '🌙', color: 'bg-indigo-600', frequency: 'Daily' },
  { id: 'sleep_quality', name: 'Sleep Quality', category: MetricCategory.SLEEP, description: 'Subjective or calculated restfulness.', unit: '%', icon: '✨', color: 'bg-indigo-400', frequency: 'Daily' },
  { id: 'rem_sleep', name: 'REM Sleep', category: MetricCategory.SLEEP, description: 'Rapid Eye Movement duration.', unit: 'min', icon: '🧠', color: 'bg-purple-500', frequency: 'Daily' },

  // Body
  { id: 'weight', name: 'Weight', category: MetricCategory.BODY, description: 'Current body mass.', unit: 'kg', icon: '⚖️', color: 'bg-teal-500', frequency: 'Daily' },
  { id: 'bmi', name: 'BMI', category: MetricCategory.BODY, description: 'Body Mass Index.', unit: 'idx', icon: '📊', color: 'bg-teal-600', frequency: 'Occasional' },

  // Nutrition
  { id: 'calories', name: 'Calories', category: MetricCategory.NUTRITION, description: 'Total energy intake.', unit: 'kcal', icon: '🍎', color: 'bg-green-500', frequency: 'Daily' },
  { id: 'water', name: 'Water', category: MetricCategory.NUTRITION, description: 'Hydration level.', unit: 'ml', icon: '💧', color: 'bg-blue-500', frequency: 'Daily' },

  // Clinical
  { id: 'blood_glucose', name: 'Blood Glucose', category: MetricCategory.CLINICAL, description: 'Blood sugar levels.', unit: 'mg/dL', icon: '💉', color: 'bg-rose-500', frequency: 'Daily' },
  { id: 'oxygen_sat', name: 'Oxygen Saturation', category: MetricCategory.CLINICAL, description: 'Blood oxygen level (SpO2).', unit: '%', icon: '🫧', color: 'bg-cyan-500', frequency: 'Occasional' },
  { id: 'medications', name: 'Medications', category: MetricCategory.CLINICAL, description: 'Adherence to prescriptions.', unit: '%', icon: '💊', color: 'bg-emerald-500', frequency: 'Daily' },
];

export const PERSONAS: UserPersona[] = [
  { id: 'p1', name: 'Casual Tracker', description: 'Checks steps and sleep occasionally.', initialPreset: 'wellness' },
  { id: 'p2', name: 'Chronic Manager', description: 'Manages diabetes and blood pressure daily.', initialPreset: 'diabetes' },
  { id: 'p3', name: 'Fitness Enthusiast', description: 'Tracks gym metrics and performance.', initialPreset: 'train' },
];

export const ONBOARDING_PRESETS: Record<string, string[]> = {
  'sleep': ['sleep_duration', 'sleep_quality', 'hrv', 'active_energy'],
  'diabetes': ['blood_glucose', 'calories', 'weight', 'blood_pressure', 'medications'],
  'train': ['steps', 'resting_hr', 'exercise_mins', 'sleep_duration', 'weight'],
  'wellness': ['steps', 'sleep_duration', 'weight', 'resting_hr'],
};

export const DOCTOR_VIEW_PRIORITIES = ['blood_pressure', 'blood_glucose', 'weight', 'medications', 'resting_hr'];
