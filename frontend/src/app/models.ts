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
