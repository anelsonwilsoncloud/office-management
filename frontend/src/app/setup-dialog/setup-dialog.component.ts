import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
  @Output() setupComplete = new EventEmitter<void>();

  dbPath = '';
  saving = false;
  requiresRestart = false;
  error = '';

  /** null = checking, true = exists, false = new file */
  dbExists: boolean | null = null;
  browsing = false;
  fileBrowserAvailable = false;
  private pathInput$ = new Subject<string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.dbPath = this.defaultDbPath;
    this.checkPath(this.dbPath);

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
}
