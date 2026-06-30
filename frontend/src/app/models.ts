export interface Bookmark {
  id: number;
  name: string;
  url: string;
  additionalInfo?: string | null;
  folder?: string | null;
  archived?: boolean;
}

export interface BookmarkRequest {
  name: string;
  url: string;
  additionalInfo?: string | null;
  folder?: string | null;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Todo {
  id: number;
  name: string;
  date: string;
  priority: Priority;
  description?: string | null;
  accomplished: boolean;
  archived?: boolean;
}

export interface TodoRequest {
  name: string;
  date: string;
  priority: Priority;
  description?: string | null;
  accomplished: boolean;
}

export interface DailyActivity {
  id: number;
  activityName: string;
  storyNumber?: string | null;
  storyLink?: string | null;
  hoursSpend?: number | null;
  highlight?: boolean;
  description?: string | null;
  archived?: boolean;
}

export interface DailyActivityRequest {
  activityName: string;
  storyNumber?: string | null;
  storyLink?: string | null;
  hoursSpend?: number | null;
  highlight?: boolean;
  description?: string | null;
}

export type LearningPriority = 'ok' | 'imp' | 'v.imp';

export interface TechnicalLearning {
  id: number;
  topic: string;
  priority: LearningPriority;
  description?: string | null;
  archived?: boolean;
}

export interface TechnicalLearningRequest {
  topic: string;
  priority: LearningPriority;
  description?: string | null;
}
