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

describe('todoStore', () => {
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
