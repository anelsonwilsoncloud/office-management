import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Priority, Todo, TodoRequest } from '../models';
import { TodoService } from '../todo.service';

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

  todos: Todo[] = [];
  pastPending: Todo[] = [];
  futurePending: Todo[] = [];
  archivedTodos: Todo[] = [];

  view: 'active' | 'archived' = 'active';

  search = '';
  // null = all, true = accomplished only, false = pending only
  accomplishedFilter: 'all' | 'true' | 'false' = 'false';

  prioritySort: SortDir | null = null;

  form: TodoRequest = this.emptyForm();
  editingId: number | null = null;
  error = '';

  constructor(private service: TodoService) {}

  ngOnInit(): void {
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
    if (view === 'archived') {
      this.resetForm();
    }
    this.loadAll();
  }

  loadMain(): void {
    const accomplished =
      this.accomplishedFilter === 'all' ? null : this.accomplishedFilter === 'true';
    this.service.list(this.search, accomplished).subscribe({
      next: (data) => {
        this.todos = data;
        this.applyPrioritySort();
      },
      error: () => (this.error = 'Failed to load todos')
    });
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
      next: () => {
        this.resetForm();
        this.loadAll();
      },
      error: () => (this.error = 'Failed to save todo')
    });
  }

  edit(todo: Todo): void {
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
        if (this.editingId === todo.id) {
          this.resetForm();
        }
        this.loadAll();
      },
      error: () => (this.error = 'Failed to archive todo')
    });
  }

  restore(todo: Todo): void {
    this.service.restore(todo.id).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Failed to restore todo')
    });
  }

  removePermanent(todo: Todo): void {
    if (!confirm(`Permanently delete "${todo.name}"? This removes it from the database and cannot be undone.`)) {
      return;
    }
    this.service.removePermanent(todo.id).subscribe({
      next: () => this.loadAll(),
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
    this.service.update(todo.id, body).subscribe({ next: () => this.loadAll() });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
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
