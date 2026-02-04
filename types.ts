
export enum MetricCategory {
  ACTIVITY = 'Activity',
  HEART = 'Heart',
  SLEEP = 'Sleep',
  BODY = 'Body',
  NUTRITION = 'Nutrition',
  MINDFULNESS = 'Mindfulness',
  CLINICAL = 'Clinical'
}

export type DoctorType = 'GP' | 'Cardiologist' | 'Endocrinologist' | 'Sleep Specialist';
export type DisplayMode = 'personal' | 'analysis' | 'doctor';

export interface DataPoint {
  timestamp: string;
  value: number;
}

export interface HealthMetric {
  id: string;
  name: string;
  category: MetricCategory;
  description: string;
  unit: string;
  icon: string;
  color: string;
  frequency: 'Daily' | 'Often' | 'Occasional';
}

export interface MetricState extends HealthMetric {
  data: DataPoint[];
  lastValue: number;
  avgValue: number;
  trend: 'up' | 'down' | 'neutral';
  isSuggested?: boolean;
  suggestionReason?: string;
  isUserSelected: boolean;
}

export interface AnalysisTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  metricIds: string[];
  narrative: string;
  color: string;
  isCustom?: boolean;
}

export interface SavedObservation {
  id: string;
  timestamp: number;
  metricId: string;
  metricName: string;
  value: number;
  unit: string;
  interpretation: string;
  clinicalSignificance: string;
  userNote: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isQuickReply?: boolean;
}

export interface DoctorNote {
  id: string;
  timestamp: number;
  doctorType: DoctorType;
  content: string;
}

export interface DiscussionPoint {
  id: string;
  text: string;
}

export interface AppState {
  view: 'onboarding' | 'home' | 'library' | 'baseline';
  displayMode: DisplayMode;
  persona: UserPersona | null;
  focusMetricIds: string[];
  dismissedAlertIds: string[];
  interfaceMode: 'adaptive' | 'baseline';
  starredDiscussionIds: string[];
  doctorVisitType: DoctorType;
  activeSearchQuery: string;
  queriedMetricIds: string[];
  savedObservations: SavedObservation[];
  doctorNotes: DoctorNote[];
  focusedAnomalyMetricId: string | null;
  chatHistory: ChatMessage[];
  investigationState: 'none' | 'active' | 'concluding';
  investigationSummary: string | null;
  isChatOpen: boolean;
  customTemplates: AnalysisTemplate[];
}

export interface UserPersona {
  id: string;
  name: string;
  description: string;
  initialPreset: string;
}

export interface ResearchLog {
  timestamp: number;
  event: string;
  payload: any;
  viewMode: string;
  interfaceMode: 'adaptive' | 'baseline';
}
