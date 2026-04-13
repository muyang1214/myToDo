import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '@/types';
import { categorizeTodo } from '@/utils/category';
import { useAuthStore } from './authStore';

const STORAGE_KEY = 'mytodo_todos';

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  addTodo: (content: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setTodos: (todos: Todo[]) => void;
  loadTodos: () => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,
  addTodo: (content: string) => {
    const { user } = useAuthStore.getState();
    const category = categorizeTodo(content);
    const newTodo: Todo = {
      id: Date.now().toString(),
      userId: user?.id || '',
      content,
      category,
      isCompleted: false,
      createdAt: new Date(),
      completedAt: null,
    };
    const updatedTodos = [...get().todos, newTodo];
    set({ todos: updatedTodos });
    // 保存到本地存储
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodos));
  },
  toggleTodo: (id: string) => {
    const updatedTodos = get().todos.map((todo) => {
      if (todo.id === id) {
        const isCompleted = !todo.isCompleted;
        return {
          ...todo,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        };
      }
      return todo;
    });
    set({ todos: updatedTodos });
    // 保存到本地存储
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodos));
  },
  deleteTodo: (id: string) => {
    const updatedTodos = get().todos.filter((todo) => todo.id !== id);
    set({ todos: updatedTodos });
    // 保存到本地存储
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodos));
  },
  setTodos: (todos: Todo[]) => {
    set({ todos });
    // 保存到本地存储
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  },
  loadTodos: async () => {
    set({ isLoading: true });
    try {
      const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos, (key, value) => {
          if (key === 'createdAt' || key === 'completedAt') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        set({ todos: parsedTodos });
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
