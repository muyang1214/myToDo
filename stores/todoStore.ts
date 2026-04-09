import { create } from 'zustand';
import { Todo } from '@/types';

interface TodoState {
  todos: Todo[];
  addTodo: (content: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setTodos: (todos: Todo[]) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  addTodo: (content: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      userId: '',
      content,
      category: null,
      isCompleted: false,
      createdAt: new Date(),
      completedAt: null,
    };
    set((state) => ({ todos: [...state.todos, newTodo] }));
  },
  toggleTodo: (id: string) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? { ...todo, isCompleted: !todo.isCompleted, completedAt: !todo.isCompleted ? new Date() : null }
          : todo
      ),
    }));
  },
  deleteTodo: (id: string) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  },
  setTodos: (todos: Todo[]) => {
    set({ todos });
  },
}));
