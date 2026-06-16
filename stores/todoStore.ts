import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Todo } from '@/types';
import { categorizeTodo } from '@/utils/category';
import { useAuthStore } from './authStore';

// Supabase 返回的字段是 snake_case，TS 类型是 camelCase，需要转换
function mapRowToTodo(row: any): Todo {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    category: row.category,
    isCompleted: row.is_completed,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  addTodo: (content: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  loadTodos: () => Promise<void>;
  subscribeToRealtime: () => () => void; // 返回取消订阅的函数
}

export const useTodoStore = create<TodoState>((set, get) => {
  // 内部方法：从 Supabase 拉取全量数据，不触发 loading 状态
  const refreshTodos = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      set({ todos: data.map(mapRowToTodo) });
    }
  };

  return {
    todos: [],
    isLoading: false,

    // ---------- 添加待办 ----------
    addTodo: async (content: string) => {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const category = categorizeTodo(content);

      const { error } = await supabase.from('todos').insert({
        user_id: user.id,
        content,
        category,
        is_completed: false,
      });

      if (error) {
        console.error('Failed to add todo:', error);
        return;
      }

      // 插入成功后重新拉取（获得服务端生成的 UUID 和时间戳）
      await refreshTodos();
    },

    // ---------- 切换完成状态 ----------
    toggleTodo: async (id: string) => {
      const todo = get().todos.find((t) => t.id === id);
      if (!todo) return;

      const newCompleted = !todo.isCompleted;

      const { error } = await supabase
        .from('todos')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) {
        console.error('Failed to toggle todo:', error);
        return;
      }

      // 乐观更新本地状态（不等 refreshTodos，减少延迟）
      set({
        todos: get().todos.map((t) =>
          t.id === id
            ? { ...t, isCompleted: newCompleted, completedAt: newCompleted ? new Date() : null }
            : t,
        ),
      });
    },

    // ---------- 删除待办 ----------
    deleteTodo: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);

      if (error) {
        console.error('Failed to delete todo:', error);
        return;
      }

      set({ todos: get().todos.filter((t) => t.id !== id) });
    },

    // ---------- 加载全量数据 ----------
    loadTodos: async () => {
      set({ isLoading: true });
      try {
        await refreshTodos();
      } catch (error) {
        console.error('Failed to load todos:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    // ---------- 实时订阅（多端同步核心） ----------
    subscribeToRealtime: () => {
      const channel = supabase
        .channel('todos-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'todos' },
          () => {
            // 任何端的数据变更 → 自动刷新本地状态
            refreshTodos();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
});
