import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { DailyActivityService } from '../daily-activity.service';
import { TeamOption } from '../models';

@Component({
  selector: 'app-setup-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-dialog.component.html',
  styleUrl: './setup-dialog.component.scss'
})
export class SetupDialogComponent implements OnInit {
  @Input() defaultDbPath = '';
  @Input() initialFileBrowser: boolean | null = null;
  @Input() settingsMode = false;
  @Output() setupComplete = new EventEmitter<void>();

  dbPath = '';
  saving = false;
  requiresRestart = false;
  error = '';

  /** null = checking, true = exists, false = new file */
  dbExists: boolean | null = null;
  browsing = false;
  fileBrowserAvailable = false;
  activeSettingsTab: 'database' | 'teams' = 'database';
  teamOptions: TeamOption[] = [];
  teamName = '';
  teamLoading = false;
  teamSaving = false;
  teamRemoving: string | null = null;
  teamError = '';
  private pathInput$ = new Subject<string>();

  constructor(private http: HttpClient, private activityService: DailyActivityService) {}

  ngOnInit(): void {
    this.dbPath = this.defaultDbPath;
    this.checkPath(this.dbPath);
    this.activeSettingsTab = 'database';

    if (this.initialFileBrowser !== null) {
      // Already known from the status call — no need for a separate HTTP round-trip
      this.fileBrowserAvailable = this.initialFileBrowser;
    } else {
      this.http.get<{ fileBrowser: boolean }>('/api/setup/capabilities').subscribe({
        next: res => { this.fileBrowserAvailable = res.fileBrowser; },
        error: ()  => { this.fileBrowserAvailable = false; }
      });
    }

    this.pathInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(path => this.http.get<{ exists: boolean }>(`/api/setup/check-path?path=${encodeURIComponent(path)}`))
    ).subscribe({
      next: res => { this.dbExists = res.exists; },
      error: ()  => { this.dbExists = null; }
    });

    if (this.settingsMode) {
      this.loadTeams();
    }
  }

  browse(): void {
    this.browsing = true;
    this.http.get<{ success: boolean; path?: string; reason?: string }>('/api/setup/browse').subscribe({
      next: res => {
        this.browsing = false;
        if (res.success && res.path) {
          this.onPathChange(res.path);
        }
      },
      error: () => { this.browsing = false; }
    });
  }

  onPathChange(value: string): void {
    this.dbPath = value;
    this.dbExists = null;
    if (value.trim()) this.pathInput$.next(value.trim());
  }

  private checkPath(path: string): void {
    if (!path.trim()) return;
    this.http.get<{ exists: boolean }>(`/api/setup/check-path?path=${encodeURIComponent(path)}`).subscribe({
      next: res => { this.dbExists = res.exists; },
      error: ()  => { this.dbExists = null; }
    });
  }

  confirm(): void {
    if (!this.dbPath.trim()) return;
    this.saving = true;
    this.error = '';
    this.http.post<{ success: boolean; requiresRestart: boolean }>('/api/setup/complete', { dbPath: this.dbPath.trim() })
      .subscribe({
        next: res => {
          this.saving = false;
          if (res.requiresRestart) {
            this.requiresRestart = true;
          } else {
            this.setupComplete.emit();
          }
        },
        error: () => {
          this.saving = false;
          this.error = 'Could not save configuration. Please try again.';
        }
      });
  }

  restartAcknowledged(): void {
    this.setupComplete.emit();
  }

  closeDialog(): void {
    this.setupComplete.emit();
  }

  selectSettingsTab(tab: 'database' | 'teams'): void {
    this.activeSettingsTab = tab;
  }

  loadTeams(): void {
    this.teamLoading = true;
    this.activityService.listTeamOptions().subscribe({
      next: teams => {
        this.teamOptions = teams;
        this.teamError = '';
        this.teamLoading = false;
      },
      error: () => {
        this.teamOptions = [];
        this.teamLoading = false;
        this.teamError = 'Could not load team settings.';
      }
    });
  }

  addTeam(): void {
    const name = this.teamName.trim();
    if (!name) return;

    this.teamSaving = true;
    this.teamError = '';
    this.activityService.addTeamOption(name).subscribe({
      next: teams => {
        this.teamOptions = teams;
        this.teamName = '';
        this.teamSaving = false;
        this.teamError = '';
        this.activityService.notifyTeamOptionsChanged();
      },
      error: err => {
        this.teamSaving = false;
        this.teamError = err?.error?.message || 'Could not add the team.';
      }
    });
  }

  removeTeam(team: TeamOption): void {
    if (!team.removable || this.teamRemoving) return;

    this.teamRemoving = team.name;
    this.teamError = '';
    this.activityService.removeTeamOption(team.name).subscribe({
      next: teams => {
        this.teamOptions = teams;
        this.teamRemoving = null;
        this.teamError = '';
        this.activityService.notifyTeamOptionsChanged();
      },
      error: err => {
        this.teamRemoving = null;
        this.teamError = err?.error?.message || 'Could not remove the team.';
      }
    });
  }
}
