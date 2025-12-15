export type Priority = 'low' | 'medium' | 'high';

export interface Plan {
  id: string;
  content: string;
  isCompleted: boolean;
  targetDate: string; // ISO Date String YYYY-MM-DD
  priority: Priority;
  createdAt: number;
  estimatedDuration?: number; // in minutes
  suggestedTime?: string; // e.g. "09:00 AM"
}

export interface AiSuggestion {
  text: string;
  type: 'encouragement' | 'correction' | 'tip';
}
