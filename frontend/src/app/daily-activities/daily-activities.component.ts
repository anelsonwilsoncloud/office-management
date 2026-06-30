import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyActivity, DailyActivityRequest } from '../models';
import { DailyActivityService } from '../daily-activity.service';

@Component({
  selector: 'app-daily-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-activities.component.html',
  styleUrl: './daily-activities.component.scss'
})
export class DailyActivitiesComponent implements OnInit {
  activities: DailyActivity[] = [];
  search = '';
  view: 'active' | 'archived' = 'active';

  form: DailyActivityRequest = this.emptyForm();
  editingId: number | null = null;
  error = '';

  constructor(private activityService: DailyActivityService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const source$ =
      this.view === 'archived' ? this.activityService.listArchived() : this.activityService.list(this.search);
    source$.subscribe({
      next: (data) => (this.activities = data),
      error: () => (this.error = 'Failed to load activities')
    });
  }

  onSearchChange(): void {
    this.load();
  }

  setView(v: 'active' | 'archived'): void {
    this.view = v;
    this.resetForm();
    this.load();
  }

  save(): void {
    const action$ =
      this.editingId === null
        ? this.activityService.create(this.form)
        : this.activityService.update(this.editingId, this.form);

    action$.subscribe({
      next: () => {
        this.resetForm();
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to save activity')
    });
  }

  edit(activity: DailyActivity): void {
    this.editingId = activity.id;
    this.form = {
      activityName: activity.activityName,
      storyNumber: activity.storyNumber || '',
      storyLink: activity.storyLink || '',
      hoursSpend: activity.hoursSpend || null,
      highlight: activity.highlight || false,
      description: activity.description || ''
    };
  }

  remove(id: number): void {
    this.activityService.remove(id).subscribe({
      next: () => {
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to archive activity')
    });
  }

  restore(id: number): void {
    this.activityService.restore(id).subscribe({
      next: () => {
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to restore activity')
    });
  }

  removePermanent(id: number): void {
    if (!confirm('Permanently delete this activity? This cannot be undone.')) {
      return;
    }
    this.activityService.removePermanent(id).subscribe({
      next: () => {
        this.load();
        this.error = '';
      },
      error: () => (this.error = 'Failed to delete activity')
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private emptyForm(): DailyActivityRequest {
    return {
      activityName: '',
      storyNumber: '',
      storyLink: '',
      hoursSpend: null,
      highlight: false,
      description: ''
    };
  }
}
