import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarksComponent } from './bookmarks/bookmarks.component';
import { TodosComponent } from './todos/todos.component';
import { DailyActivitiesComponent } from './daily-activities/daily-activities.component';

type Tab = 'bookmarks' | 'todos' | 'activities';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BookmarksComponent, TodosComponent, DailyActivitiesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  activeTab: Tab = 'bookmarks';

  select(tab: Tab): void {
    this.activeTab = tab;
  }
}
