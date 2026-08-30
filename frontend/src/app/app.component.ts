import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BookmarksComponent } from './bookmarks/bookmarks.component';
import { TodosComponent } from './todos/todos.component';
import { DailyActivitiesComponent } from './daily-activities/daily-activities.component';
import { TechnicalLearningComponent } from './technical-learning/technical-learning.component';
import { SetupDialogComponent } from './setup-dialog/setup-dialog.component';

type Tab = 'bookmarks' | 'todos' | 'activities' | 'learning';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BookmarksComponent, TodosComponent, DailyActivitiesComponent, TechnicalLearningComponent, SetupDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  activeTab: Tab = 'todos';
  showSetup = false;
  setupDbPath = '';
  setupFileBrowser = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ firstRun: boolean; dbPath: string; fileBrowser: boolean }>('/api/setup/status').subscribe({
      next: res => {
        if (res.firstRun) {
          this.setupDbPath = res.dbPath;
          this.setupFileBrowser = res.fileBrowser;
          this.showSetup = true;
        }
      },
      error: () => { /* non-critical — proceed normally */ }
    });
  }

  select(tab: Tab): void {
    this.activeTab = tab;
  }

  onSetupComplete(): void {
    this.showSetup = false;
  }

  openSettings(): void {
    this.http.get<{ firstRun: boolean; dbPath: string; fileBrowser: boolean }>('/api/setup/status').subscribe({
      next: res => {
        this.setupDbPath = res.dbPath;
        this.setupFileBrowser = res.fileBrowser;
        this.showSetup = true;
      }
    });
  }
}
