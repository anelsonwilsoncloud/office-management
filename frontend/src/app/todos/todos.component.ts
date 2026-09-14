import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Priority, Todo, TodoReminder, TodoRequest } from '../models';
import { TodoService } from '../todo.service';
import { TodoReminderService } from '../todo-reminder.service';

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todos.component.html',
  styleUrl: './todos.component.scss'
})
export class TodosComponent implements OnInit {
  readonly priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
  private readonly priorityRank: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  readonly reminderHourOptions = [1, 2, 3, 4, 6, 8, 12, 24, 48];

  todos: Todo[] = [];
  pastPending: Todo[] = [];
  futurePending: Todo[] = [];
  archivedTodos: Todo[] = [];

  view: 'active' | 'archived' = 'active';

  search = '';
  // null = all, true = accomplished only, false = pending only
  accomplishedFilter: 'all' | 'true' | 'false' = 'false';
  dateFrom = '';
  dateTo = '';

  prioritySort: SortDir | null = null;
  reminderMenuTodoId: number | null = null;
  reminderHours = 1;

  form: TodoRequest = this.emptyForm();
  editingId: number | null = null;
  error = '';

  constructor(private service: TodoService, private reminderService: TodoReminderService) {}

  ngOnInit(): void {
    this.reminderService.init();
    this.loadAll();
  }

  loadAll(): void {
    if (this.view === 'archived') {
      this.service.listArchived().subscribe({ next: (d) => (this.archivedTodos = d) });
      return;
    }
    this.loadMain();
    this.service.pastPending().subscribe({ next: (d) => (this.pastPending = d) });
    this.service.futurePending().subscribe({ next: (d) => (this.futurePending = d) });
  }

  setView(view: 'active' | 'archived'): void {
    this.view = view;
    this.closeReminderMenu();
    if (view === 'archived') {
      this.resetForm();
    }
    this.loadAll();
  }

  loadMain(): void {
    const accomplished =
      this.accomplishedFilter === 'all' ? null : this.accomplishedFilter === 'true';
    this.service.list(this.search, accomplished, this.dateFrom, this.dateTo).subscribe({
      next: (data) => {
        this.todos = data;
        this.applyPrioritySort();
        this.todos.forEach(todo => this.reminderService.syncTodo(todo));
      },
      error: () => (this.error = 'Failed to load todos')
    });
  }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.loadMain();
  }

  togglePrioritySort(): void {
    this.prioritySort = this.prioritySort === 'asc' ? 'desc' : 'asc';
    this.applyPrioritySort();
  }

  private applyPrioritySort(): void {
    if (!this.prioritySort) {
      return;
    }
    const dir = this.prioritySort === 'asc' ? 1 : -1;
    this.todos = [...this.todos].sort(
      (a, b) => (this.priorityRank[a.priority] - this.priorityRank[b.priority]) * dir
    );
  }

  save(): void {
    this.error = '';
    if (!this.form.name?.trim() || !this.form.date) {
      this.error = 'Name and date are required';
      return;
    }
    const request$ =
      this.editingId === null
        ? this.service.create(this.form)
        : this.service.update(this.editingId, this.form);

    request$.subscribe({
      next: (todo) => {
        this.reminderService.syncTodo(todo);
        this.resetForm();
        this.loadAll();
      },
      error: () => (this.error = 'Failed to save todo')
    });
  }

  edit(todo: Todo): void {
    this.closeReminderMenu();
    this.editingId = todo.id;
    this.form = {
      name: todo.name,
      date: todo.date,
      priority: todo.priority,
      description: todo.description ?? '',
      accomplished: todo.accomplished
    };
  }

  remove(todo: Todo): void {
    if (!confirm(`Archive todo "${todo.name}"? You can restore it later.`)) {
      return;
    }
    this.service.remove(todo.id).subscribe({
      next: () => {
        this.reminderService.cancel(todo.id);
        if (this.editingId === todo.id) {
          this.resetForm();
        }
        this.closeReminderMenu();
        this.loadAll();
      },
      error: () => (this.error = 'Failed to archive todo')
    });
  }

  restore(todo: Todo): void {
    this.service.restore(todo.id).subscribe({
      next: (restored) => {
        this.reminderService.syncTodo(restored);
        this.loadAll();
      },
      error: () => (this.error = 'Failed to restore todo')
    });
  }

  removePermanent(todo: Todo): void {
    if (!confirm(`Permanently delete "${todo.name}"? This removes it from the database and cannot be undone.`)) {
      return;
    }
    this.service.removePermanent(todo.id).subscribe({
      next: () => {
        this.reminderService.cancel(todo.id);
        this.closeReminderMenu();
        this.loadAll();
      },
      error: () => (this.error = 'Failed to delete todo')
    });
  }

  toggleAccomplished(todo: Todo): void {
    const body: TodoRequest = {
      name: todo.name,
      date: todo.date,
      priority: todo.priority,
      description: todo.description ?? '',
      accomplished: !todo.accomplished
    };
    this.service.update(todo.id, body).subscribe({
      next: (updated) => {
        if (updated.accomplished) {
          this.reminderService.cancel(updated.id);
        } else {
          this.reminderService.syncTodo(updated);
        }
        this.loadAll();
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  toggleReminderMenu(todo: Todo): void {
    if (this.reminderMenuTodoId === todo.id) {
      this.closeReminderMenu();
      return;
    }
    const reminder = this.reminderService.get(todo.id);
    this.reminderMenuTodoId = todo.id;
    this.reminderHours = reminder ? this.hoursUntil(reminder.dueAt) : 1;
    if (this.reminderHours < 1) {
      this.reminderHours = 1;
    }
  }

  closeReminderMenu(): void {
    this.reminderMenuTodoId = null;
  }

  reminderFor(todoId: number): TodoReminder | null {
    return this.reminderService.get(todoId);
  }

  reminderLabel(todoId: number): string {
    const reminder = this.reminderService.get(todoId);
    if (!reminder) {
      return '';
    }
    const remainingMs = new Date(reminder.dueAt).getTime() - Date.now();
    if (remainingMs <= 0) {
      return 'due now';
    }
    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  }

  async setReminder(todo: Todo): Promise<void> {
    this.error = '';
    try {
      await this.reminderService.schedule(todo, this.reminderHours);
      this.closeReminderMenu();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Could not set reminder';
    }
  }

  clearReminder(todo: Todo): void {
    this.reminderService.cancel(todo.id);
    this.closeReminderMenu();
  }

  private hoursUntil(dueAt: string): number {
    const diff = new Date(dueAt).getTime() - Date.now();
    return Math.max(1, Math.round(diff / 3600000));
  }

  private emptyForm(): TodoRequest {
    return {
      name: '',
      date: this.today(),
      priority: 'MEDIUM',
      description: '',
      accomplished: false
    };
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
