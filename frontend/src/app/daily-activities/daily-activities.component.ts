import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyActivity, DailyActivityRequest } from '../models';
import { DailyActivityService } from '../daily-activity.service';
import * as XLSX from 'xlsx';

export type TeamOption = 'FUX' | 'TCP' | 'IRAM' | 'AI' | 'OTHER';

@Component({
  selector: 'app-daily-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-activities.component.html',
  styleUrl: './daily-activities.component.scss'
})
export class DailyActivitiesComponent implements OnInit {
  readonly teams: TeamOption[] = ['FUX', 'TCP', 'IRAM', 'AI', 'OTHER'];
  readonly jiraBaseUrl = 'https://atc.bmwgroup.net/jira/browse/';

  activities: DailyActivity[] = [];
  search = '';
  teamFilter = '';
  dateFrom = '';
  dateTo = '';
  pausedFilter = false;
  highlightedFilter = false;
  completedFilter = false;
  view: 'active' | 'archived' = 'active';

  form: DailyActivityRequest = this.emptyForm();
  editingId: number | null = null;
  error = '';
  copySuccess: number | null = null;
  selectedActivity: DailyActivity | null = null;

  constructor(private activityService: DailyActivityService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const source$ =
      this.view === 'archived'
        ? this.activityService.listArchived()
        : this.activityService.list(this.search, this.teamFilter, this.dateFrom, this.dateTo);
    source$.subscribe({
      next: (data) => {
        let result = data;
        if (this.completedFilter) result = result.filter(a => a.highlight);
        if (this.pausedFilter) result = result.filter(a => a.paused);
        if (this.highlightedFilter) result = result.filter(a => a.highlighted);
        this.activities = result;
      },
      error: () => (this.error = 'Failed to load activities')
    });
  }

  onSearchChange(): void {
    this.load();
  }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.load();
  }

  shiftDateFrom(days: number): void {
    if (!this.dateFrom) return;
    const d = new Date(this.dateFrom);
    d.setDate(d.getDate() + days);
    this.dateFrom = d.toISOString().slice(0, 10);
    this.load();
  }

  shiftDateTo(days: number): void {
    if (!this.dateTo) return;
    const d = new Date(this.dateTo);
    d.setDate(d.getDate() + days);
    this.dateTo = d.toISOString().slice(0, 10);
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
      team: activity.team || '',
      startDate: activity.startDate || '',
      endDate: activity.endDate || '',
      hoursSpend: activity.hoursSpend || null,
      highlight: activity.highlight || false,
      highlighted: activity.highlighted || false,
      paused: activity.paused || false,
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

  exportToExcel(): void {
    const rows = this.activities.map(a => ({
      'Activity Name': a.activityName,
      'Story Number': a.storyNumber || '',
      'Team': a.team || '',
      'Start Date': a.startDate || '',
      'End Date': a.endDate || '',
      'Description': a.description || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activities');
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `activities-${date}.xlsx`);
  }

  selectActivity(activity: DailyActivity): void {
    this.selectedActivity = this.selectedActivity?.id === activity.id ? null : activity;
  }

  storyUrl(storyNumber: string): string {
    return this.jiraBaseUrl + storyNumber;
  }

  copyToClipboard(text: string, id: number): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess = id;
      setTimeout(() => (this.copySuccess = null), 1500);
    });
  }

  get totalHours(): number {
    return this.activities.reduce((sum, a) => sum + (a.hoursSpend || 0), 0);
  }

  onPauseChange(): void {
    if (this.form.paused) {
      this.form.storyNumber = '';
    }
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private emptyForm(): DailyActivityRequest {
    return {
      activityName: '',
      storyNumber: '',
      team: '',
      startDate: '',
      endDate: '',
      hoursSpend: null,
      highlight: false,
      highlighted: false,
      paused: false,
      description: ''
    };
  }
}
