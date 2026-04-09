export interface Todo {
  id: string;
  userId: string;
  content: string;
  category: 'work' | 'sport' | 'investment' | 'life' | null;
  isCompleted: boolean;
  createdAt: Date;
  completedAt: Date | null;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
