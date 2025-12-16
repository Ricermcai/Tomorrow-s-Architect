export type Priority = 'low' | 'medium' | 'high';

export type Category = 'work' | 'personal' | 'research' | 'entertainment';

export interface Plan {
  id: string;
  content: string;
  isCompleted: boolean;
  targetDate: string; // ISO Date String YYYY-MM-DD
  priority: Priority;
  category: Category;
  createdAt: number;
  estimatedDuration?: number;
  suggestedTime?: string;
}
