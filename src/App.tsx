/**
 * Frontend — src/App.tsx
 *
 * Student Task Manager - React application
 * Type-safe API imports from backend via 'aws-blocks'
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../aws-blocks';
import type { Todo } from '../aws-blocks';
import './App.css';

export function TaskManager() {
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'title'>('default');

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sortArg = sortBy === 'default' ? undefined : sortBy;
      const taskList = await api.listTodos(sortArg);
      setTasks(taskList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  // Load tasks on mount and when sortBy changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Subscribe to Real-Time Updates
  useEffect(() => {
    let sub: any;
    async function setupRealtime() {
      try {
        const channel = await api.getRealtimeChannel();
        sub = channel.subscribe(() => {
          loadTasks();
        });
        await sub.established;
      } catch (err) {
        // Realtime subscription optional fallback
      }
    }
    setupRealtime();
    return () => {
      if (sub?.unsubscribe) {
        sub.unsubscribe();
      }
    };
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setError(null);
      await api.createTodo(newTaskTitle, newTaskPriority);
      setNewTaskTitle('');
      setNewTaskPriority(1);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      setError(null);
      await api.toggleTodo(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      setError(null);
      await api.deleteTodo(taskId);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleUpdateTask = async (taskId: string, newTitle: string, newPriority: number) => {
    try {
      setError(null);
      await api.updateTodo(taskId, newTitle, newPriority);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <h2>My Tasks</h2>
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by: </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="default">Date Created</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Task input */}
      <form onSubmit={handleCreateTask} className="task-input-form">
        <input
          type="text"
          className="task-input"
          placeholder="What needs to be done?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <select
          value={newTaskPriority}
          onChange={(e) => setNewTaskPriority(Number(e.target.value))}
          className="priority-select"
          title="Priority Level"
        >
          <option value={1}>High (P1)</option>
          <option value={2}>Medium (P2)</option>
          <option value={3}>Low (P3)</option>
        </select>
        <button type="submit" className="add-button">
          Add task
        </button>
      </form>

      {/* Task list */}
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">No tasks yet — add one above</div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.todoId}
              task={task}
              onToggle={handleToggleComplete}
              onDelete={handleDelete}
              onUpdate={handleUpdateTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// Task Item Component
interface TaskItemProps {
  task: Todo;
  onToggle: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, newTitle: string, newPriority: number) => Promise<void>;
}

function TaskItem({ task, onToggle, onDelete, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleEditSave = async () => {
    if (!editValue.trim()) {
      setError('Task title cannot be empty');
      return;
    }

    try {
      setError(null);
      await onUpdate(task.todoId, editValue, editPriority);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleEditCancel = () => {
    setEditValue(task.title);
    setEditPriority(task.priority);
    setIsEditing(false);
    setError(null);
  };

  const getPriorityLabel = (p: number) => {
    if (p === 1) return { text: 'P1', class: 'priority-p1' };
    if (p === 2) return { text: 'P2', class: 'priority-p2' };
    return { text: 'P3', class: 'priority-p3' };
  };

  const priorityBadge = getPriorityLabel(task.priority);

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      {!isEditing ? (
        <>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.todoId)}
            className="task-checkbox"
          />
          <div className="task-title" onClick={() => setIsEditing(true)} data-date={formatDate(task.createdAt)}>
            <div className="task-title-row">
              <span>{task.title}</span>
              <span className={`priority-badge ${priorityBadge.class}`}>{priorityBadge.text}</span>
            </div>
          </div>
          <div className="task-actions">
            <button onClick={() => setIsEditing(true)} className="edit-icon" aria-label="Edit task">
              ✎
            </button>
            <button onClick={() => onDelete(task.todoId)} className="delete-button" aria-label="Delete task">
              🗑
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ width: '22px' }}></div>
          <div className="task-edit-container">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="task-edit-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
              }}
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(Number(e.target.value))}
              className="priority-select-edit"
            >
              <option value={1}>P1</option>
              <option value={2}>P2</option>
              <option value={3}>P3</option>
            </select>
            <button onClick={handleEditSave} className="edit-save-button">
              Save
            </button>
            <button onClick={handleEditCancel} className="edit-cancel-button">
              Cancel
            </button>
            {error && <span className="inline-error">{error}</span>}
          </div>
        </>
      )}
    </li>
  );
}

// Error Banner Component
interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <span className="error-message">{message}</span>
      <button onClick={onDismiss} className="error-dismiss" aria-label="Dismiss error">
        ×
      </button>
    </div>
  );
}
