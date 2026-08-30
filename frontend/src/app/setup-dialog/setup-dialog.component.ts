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
  @Output() setupComplete = new EventEmitter<void>();

  dbPath = '';
  saving = false;
  requiresRestart = false;
  error = '';

  /** null = checking, true = exists, false = new file */
  dbExists: boolean | null = null;
  private pathInput$ = new Subject<string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.dbPath = this.defaultDbPath;
    this.checkPath(this.dbPath);

    this.pathInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(path => this.http.get<{ exists: boolean }>(`/api/setup/check-path?path=${encodeURIComponent(path)}`))
    ).subscribe({
      next: res => { this.dbExists = res.exists; },
      error: ()  => { this.dbExists = null; }
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
