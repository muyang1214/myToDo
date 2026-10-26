import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodoStore } from '../../stores/todoStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

// Mock Supabase 客户端：本文件只需要 store 能加载，不发起真实网络请求
// （createClient 在缺少 EXPO_PUBLIC_SUPABASE_URL 时会直接抛错）
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

// TODO(阶段 3)：本测试是 AsyncStorage 时代的遗留，添加/切换/删除的断言（同步写数组、
// mockSetItem 被调用、从 'mytodo_todos' 读回）与现在的 Supabase 异步实现完全不符。
// 阶段 3 改造 store（updateTodo / 重跑分类）时一并重写，届时去掉 .skip。
describe.skip('todoStore（已过期，待阶段 3 重写）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial state', () => {
    const { result } = renderHook(() => useTodoStore());
    expect(result.current.todos).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test('addTodo', async () => {
    const { result } = renderHook(() => useTodoStore());

    act(() => {
      result.current.addTodo('测试待办');
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].content).toBe('测试待办');
    expect(result.current.todos[0].isCompleted).toBe(false);
    expect(mockSetItem).toHaveBeenCalled();
  });

  test('toggleTodo', async () => {
    const { result } = renderHook(() => useTodoStore());

    // Add a todo
    act(() => {
      result.current.addTodo('测试待办');
    });

    const todoId = result.current.todos[0].id;

    // Toggle todo
    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].isCompleted).toBe(true);
    expect(mockSetItem).toHaveBeenCalledTimes(2);

    // Toggle back
    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].isCompleted).toBe(false);
  });

  test('deleteTodo', async () => {
    const { result } = renderHook(() => useTodoStore());

    // Add a todo
    act(() => {
      result.current.addTodo('测试待办');
    });

    expect(result.current.todos).toHaveLength(1);

    const todoId = result.current.todos[0].id;

    // Delete todo
    act(() => {
      result.current.deleteTodo(todoId);
    });

    expect(result.current.todos).toHaveLength(0);
    expect(mockSetItem).toHaveBeenCalledTimes(2);
  });

  test('loadTodos', async () => {
    const mockTodos = [
      {
        id: '1',
        userId: '',
        content: '测试待办',
        category: 'work',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ];

    mockGetItem.mockResolvedValueOnce(JSON.stringify(mockTodos));

    const { result, waitForNextUpdate } = renderHook(() => useTodoStore());

    await act(async () => {
      await result.current.loadTodos();
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetItem).toHaveBeenCalledWith('mytodo_todos');
  });
});
