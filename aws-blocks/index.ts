/**
 * Backend — aws-blocks/index.ts
 *
 * Student Task Manager - A full-featured real-time todo / task management app.
 * Each user can create, view, edit, complete, and delete their own tasks.
 */
import { ApiNamespace, Scope, AuthBasic, DistributedTable, Realtime } from '@aws-blocks/blocks';
import { z } from 'zod';

const scope = new Scope('student-task-manager');

// ─── Auth ────────────────────────────────────────────────────────────────────
const auth = new AuthBasic(scope, 'auth', {
  passwordPolicy: { minLength: 8 },
  sessionDuration: 86400, // 24 hours in seconds
  crossDomain: process.env.BLOCKS_SANDBOX === 'true',
});
export const authApi = auth.createApi();

// ─── Realtime Pub/Sub ────────────────────────────────────────────────────────
const realtime = new Realtime(scope, 'realtime', {
  namespaces: {
    todos: Realtime.namespace(
      z.object({
        action: z.enum(['created', 'updated', 'toggled', 'deleted']),
        todoId: z.string(),
      })
    ),
  },
});

// ─── Data Model ──────────────────────────────────────────────────────────────
const todoSchema = z.object({
  userId: z.string(),
  todoId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  priority: z.number(),
  version: z.number(),
  createdAt: z.string(),
});

export type Todo = z.infer<typeof todoSchema>;

const todosTable = new DistributedTable(scope, 'todos', {
  schema: todoSchema,
  key: { partitionKey: 'userId', sortKey: 'todoId' },
  indexes: {
    byPriority: { partitionKey: 'userId', sortKey: 'priority' },
    byTitle: { partitionKey: 'userId', sortKey: 'title' },
  },
});

// Helper for broadcasting changes
async function broadcastChange(channel: string, action: 'created' | 'updated' | 'toggled' | 'deleted', todoId: string) {
  try {
    await realtime.publish('todos', channel, { action, todoId });
  } catch (err) {
    // Realtime publish is best effort
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────
export const api = new ApiNamespace(scope, 'api', (context) => ({

  async createTodo(title: string, priority: number = 1): Promise<Todo> {
    const user = await auth.requireAuth(context);

    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }

    const todoId = crypto.randomUUID();
    const todo: Todo = {
      userId: user.username,
      todoId,
      title: title.trim(),
      completed: false,
      priority: typeof priority === 'number' ? priority : 1,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    await todosTable.put(todo, { ifNotExists: true });
    await broadcastChange(user.username, 'created', todoId);

    return todo;
  },

  async listTodos(sortBy?: string): Promise<Todo[]> {
    const user = await auth.requireAuth(context);

    let items: Todo[] = [];
    if (sortBy === 'priority') {
      items = await Array.fromAsync(
        todosTable.query({
          index: 'byPriority',
          where: { userId: { equals: user.username } },
          order: 'asc',
        })
      );
      items.sort((a, b) => a.priority - b.priority);
    } else if (sortBy === 'title') {
      items = await Array.fromAsync(
        todosTable.query({
          index: 'byTitle',
          where: { userId: { equals: user.username } },
          order: 'asc',
        })
      );
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      items = await Array.fromAsync(
        todosTable.query({
          where: { userId: { equals: user.username } },
        })
      );
      items.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return items;
  },

  async toggleTodo(todoId: string): Promise<Todo> {
    const user = await auth.requireAuth(context);
    const key = { userId: user.username, todoId };

    const existing = (await todosTable.get(key)) as Todo | null;
    if (!existing) {
      throw new Error('Task not found');
    }

    const currentVersion = existing.version ?? 1;
    const nextVersion = currentVersion + 1;
    const updated: Todo = {
      ...existing,
      completed: !existing.completed,
      version: nextVersion,
    };

    try {
      await todosTable.put(updated, {
        ifFieldEquals: { version: currentVersion },
      });
    } catch (err: any) {
      // Optimistic locking conflict check & retry
      const fresh = (await todosTable.get(key)) as Todo | null;
      if (!fresh) throw new Error('Task not found');
      const freshVersion = fresh.version ?? 1;
      const retryUpdated: Todo = {
        ...fresh,
        completed: !fresh.completed,
        version: freshVersion + 1,
      };
      await todosTable.put(retryUpdated, {
        ifFieldEquals: { version: freshVersion },
      });
      await broadcastChange(user.username, 'toggled', todoId);
      return retryUpdated;
    }

    await broadcastChange(user.username, 'toggled', todoId);
    return updated;
  },

  async updateTodo(todoId: string, title: string, priority?: number): Promise<Todo> {
    const user = await auth.requireAuth(context);
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }

    const key = { userId: user.username, todoId };
    const existing = (await todosTable.get(key)) as Todo | null;
    if (!existing) {
      throw new Error('Task not found');
    }

    const currentVersion = existing.version ?? 1;
    const nextVersion = currentVersion + 1;
    const updated: Todo = {
      ...existing,
      title: title.trim(),
      priority: priority !== undefined ? priority : (existing.priority ?? 1),
      version: nextVersion,
    };

    await todosTable.put(updated, {
      ifFieldEquals: { version: currentVersion },
    });
    await broadcastChange(user.username, 'updated', todoId);

    return updated;
  },

  async deleteTodo(todoId: string): Promise<{ id: string }> {
    const user = await auth.requireAuth(context);
    const key = { userId: user.username, todoId };

    const existing = await todosTable.get(key);
    if (!existing) {
      throw new Error('Task not found');
    }

    await todosTable.delete(key);
    await broadcastChange(user.username, 'deleted', todoId);

    return { id: todoId };
  },

  // Realtime channel access endpoint
  async getRealtimeChannel() {
    const user = await auth.requireAuth(context);
    return realtime.getChannel('todos', user.username);
  },

  // Alias methods for backward compatibility with task nomenclature
  async createTask(title: string, priority: number = 1): Promise<Todo> {
    return this.createTodo(title, priority);
  },
  async listTasks(sortBy?: string): Promise<Todo[]> {
    return this.listTodos(sortBy);
  },
  async toggleTask(taskId: string): Promise<Todo> {
    return this.toggleTodo(taskId);
  },
  async updateTask(taskId: string, title: string, priority?: number): Promise<Todo> {
    return this.updateTodo(taskId, title, priority);
  },
  async deleteTask(taskId: string): Promise<{ id: string }> {
    return this.deleteTodo(taskId);
  },

}));

export { auth, realtime };
