import { useTodoStore } from '@/stores/todoStore';
import { useAuthStore } from '@/stores/authStore';
import { Todo } from '@/types';

/**
 * Supabase 链式调用 mock
 * 所有方法挂在同一个 query 对象上，from() 每次返回它，
 * 这样就能直接断言 update / insert / eq 收到什么参数。
 */
jest.mock('@/services/supabase', () => {
  const query: any = {};
  query.select = jest.fn(() => query);
  query.order = jest.fn(() => Promise.resolve({ data: [], error: null }));
  query.insert = jest.fn(() => Promise.resolve({ error: null }));
  query.update = jest.fn(() => query);
  query.eq = jest.fn(() => Promise.resolve({ error: null }));
  query.delete = jest.fn(() => query);

  return {
    supabase: {
      from: jest.fn(() => query),
      channel: jest.fn(() => ({ on: jest.fn(), subscribe: jest.fn() })),
      removeChannel: jest.fn(),
    },
    // 仅供测试取句柄
    __query: query,
  };
});

const q = jest.requireMock('@/services/supabase').__query as {
  select: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  delete: jest.Mock;
};

const makeTodo = (over: Partial<Todo> = {}): Todo => ({
  id: '1',
  userId: 'u1',
  content: '写报告',
  category: 'work',
  isCompleted: false,
  createdAt: new Date('2026-09-29T01:00:00Z'),
  completedAt: null,
  ...over,
});

describe('todoStore（Supabase 版）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTodoStore.setState({ todos: [], isLoading: false });
    useAuthStore.setState({ user: { id: 'u1', email: 't@test.com' }, isLoading: false, error: null });
    // 默认：查询无数据、写操作成功
    q.order.mockResolvedValue({ data: [], error: null });
    q.insert.mockResolvedValue({ error: null });
    q.eq.mockResolvedValue({ error: null });
  });

  // ---------- 读取 ----------
  test('loadTodos：snake_case 行映射成 Todo，时间转 Date', async () => {
    q.order.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          user_id: 'u1',
          content: '开会',
          category: 'work',
          is_completed: true,
          created_at: '2026-09-28T02:00:00Z',
          completed_at: '2026-09-29T02:00:00Z',
        },
      ],
      error: null,
    });

    await useTodoStore.getState().loadTodos();

    const todos = useTodoStore.getState().todos;
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ id: '1', userId: 'u1', content: '开会', isCompleted: true });
    expect(todos[0].createdAt).toBeInstanceOf(Date);
    expect(todos[0].completedAt).toBeInstanceOf(Date);
    expect(useTodoStore.getState().isLoading).toBe(false);
  });

  // ---------- 新增 ----------
  test('addTodo：未登录时不写库', async () => {
    useAuthStore.setState({ user: null });

    await useTodoStore.getState().addTodo('开会');

    expect(q.insert).not.toHaveBeenCalled();
  });

  test('addTodo：写入时自动打分类，并从服务端刷新回来', async () => {
    q.order.mockResolvedValueOnce({
      data: [
        {
          id: '9',
          user_id: 'u1',
          content: '工作会议',
          category: 'work',
          is_completed: false,
          created_at: '2026-09-29T01:00:00Z',
          completed_at: null,
        },
      ],
      error: null,
    });

    await useTodoStore.getState().addTodo('工作会议');

    expect(q.insert).toHaveBeenCalledWith({
      user_id: 'u1',
      content: '工作会议',
      category: 'work',
      is_completed: false,
    });
    expect(useTodoStore.getState().todos).toHaveLength(1);
  });

  // ---------- 编辑（v1.5 新增） ----------
  test('updateTodo：改内容后重跑关键词分类，并写回 Supabase', async () => {
    useTodoStore.setState({ todos: [makeTodo({ content: '写报告', category: 'work' })] });

    await useTodoStore.getState().updateTodo('1', '  去健身房跑步  ');

    // 入参已 trim；category 从 work 重算为 sport
    expect(q.update).toHaveBeenCalledWith({ content: '去健身房跑步', category: 'sport' });
    expect(q.eq).toHaveBeenCalledWith('id', '1');

    const todo = useTodoStore.getState().todos[0];
    expect(todo.content).toBe('去健身房跑步');
    expect(todo.category).toBe('sport');
  });

  test('updateTodo：只改 content / category，不碰完成状态', async () => {
    const completedAt = new Date('2026-09-29T02:00:00Z');
    useTodoStore.setState({ todos: [makeTodo({ isCompleted: true, completedAt })] });

    await useTodoStore.getState().updateTodo('1', '新的内容');

    const todo = useTodoStore.getState().todos[0];
    expect(todo.isCompleted).toBe(true);
    expect(todo.completedAt).toEqual(completedAt);
    // 写入 payload 里绝不能出现 is_completed / completed_at
    expect(q.update).toHaveBeenCalledWith({ content: '新的内容', category: null });
  });

  test('updateTodo：空内容视作取消编辑，不写库也不清空原文', async () => {
    useTodoStore.setState({ todos: [makeTodo()] });

    await useTodoStore.getState().updateTodo('1', '   ');

    expect(q.update).not.toHaveBeenCalled();
    expect(useTodoStore.getState().todos[0].content).toBe('写报告');
  });

  test('updateTodo：Supabase 报错时本地状态保持不变', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    useTodoStore.setState({ todos: [makeTodo()] });
    q.eq.mockResolvedValueOnce({ error: { message: 'boom' } });

    await useTodoStore.getState().updateTodo('1', '去健身');

    expect(useTodoStore.getState().todos[0].content).toBe('写报告');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  // ---------- 完成状态 ----------
  test('toggleTodo：完成时写 completed_at，取消时置 null', async () => {
    useTodoStore.setState({ todos: [makeTodo()] });

    await useTodoStore.getState().toggleTodo('1');
    let todo = useTodoStore.getState().todos[0];
    expect(todo.isCompleted).toBe(true);
    expect(todo.completedAt).toBeInstanceOf(Date);
    expect(q.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ is_completed: true }),
    );

    await useTodoStore.getState().toggleTodo('1');
    todo = useTodoStore.getState().todos[0];
    expect(todo.isCompleted).toBe(false);
    expect(todo.completedAt).toBeNull();
    expect(q.update).toHaveBeenLastCalledWith({ is_completed: false, completed_at: null });
  });

  // ---------- 删除 ----------
  test('deleteTodo：删除 Supabase 记录并从本地移除', async () => {
    useTodoStore.setState({ todos: [makeTodo()] });

    await useTodoStore.getState().deleteTodo('1');

    expect(q.delete).toHaveBeenCalled();
    expect(q.eq).toHaveBeenCalledWith('id', '1');
    expect(useTodoStore.getState().todos).toHaveLength(0);
  });
});
