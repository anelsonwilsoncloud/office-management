import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarksComponent } from './bookmarks/bookmarks.component';
import { TodosComponent } from './todos/todos.component';
import { DailyActivitiesComponent } from './daily-activities/daily-activities.component';
import { TechnicalLearningComponent } from './technical-learning/technical-learning.component';

type Tab = 'bookmarks' | 'todos' | 'activities' | 'learning';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BookmarksComponent, TodosComponent, DailyActivitiesComponent, TechnicalLearningComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  activeTab: Tab = 'bookmarks';

  select(tab: Tab): void {
    this.activeTab = tab;
  }
}
