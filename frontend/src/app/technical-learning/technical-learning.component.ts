import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LearningPriority, TechnicalLearning, TechnicalLearningRequest } from '../models';
import { TechnicalLearningService } from '../technical-learning.service';

@Component({
  selector: 'app-technical-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './technical-learning.component.html',
  styleUrl: './technical-learning.component.scss'
})
export class TechnicalLearningComponent implements OnInit {
  readonly priorities: LearningPriority[] = ['ok', 'imp', 'v.imp'];

  learnings: TechnicalLearning[] = [];
  search = '';
  view: 'active' | 'archived' = 'active';

  form: TechnicalLearningRequest = this.emptyForm();
  editingId: number | null = null;
  error = '';

  // Detail view
  selectedLearning: TechnicalLearning | null = null;

  constructor(private service: TechnicalLearningService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const source$ =
      this.view === 'archived' ? this.service.listArchived() : this.service.list(this.search);
    source$.subscribe({
      next: (data) => (this.learnings = data),
      error: () => (this.error = 'Failed to load learning topics')
    });
  }

  onSearchChange(): void {
    this.load();
  }

  setView(v: 'active' | 'archived'): void {
    this.view = v;
    this.resetForm();
    this.selectedLearning = null;
    this.load();
  }

  save(): void {
    const action$ =
      this.editingId === null
        ? this.service.create(this.form)
        : this.service.update(this.editingId, this.form);

    action$.subscribe({
      next: () => {
        this.resetForm();
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to save learning topic')
    });
  }

  edit(learning: TechnicalLearning): void {
    this.editingId = learning.id;
    this.form = {
      topic: learning.topic,
      priority: learning.priority,
      description: learning.description || ''
    };
    this.selectedLearning = null;
  }

  remove(id: number): void {
    this.service.remove(id).subscribe({
      next: () => {
        if (this.selectedLearning?.id === id) {
          this.selectedLearning = null;
        }
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to archive learning topic')
    });
  }

  restore(id: number): void {
    this.service.restore(id).subscribe({
      next: () => {
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to restore learning topic')
    });
  }

  removePermanent(id: number): void {
    if (!confirm('Permanently delete this learning topic? This cannot be undone.')) {
      return;
    }
    this.service.removePermanent(id).subscribe({
      next: () => {
        if (this.selectedLearning?.id === id) {
          this.selectedLearning = null;
        }
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to delete learning topic')
    });
  }

  selectForDetail(learning: TechnicalLearning): void {
    this.selectedLearning = learning;
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private emptyForm(): TechnicalLearningRequest {
    return {
      topic: '',
      priority: 'imp',
      description: ''
    };
  }
}
