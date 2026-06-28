import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bookmark, BookmarkRequest } from '../models';
import { BookmarkService } from '../bookmark.service';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.scss'
})
export class BookmarksComponent implements OnInit {
  bookmarks: Bookmark[] = [];
  search = '';
  view: 'active' | 'archived' = 'active';

  form: BookmarkRequest = this.emptyForm();
  editingId: number | null = null;

  error = '';
  importMessage = '';
  importing = false;
  copiedId: number | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private service: BookmarkService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const source$ =
      this.view === 'archived' ? this.service.listArchived() : this.service.list(this.search);
    source$.subscribe({
      next: (data) => (this.bookmarks = data),
      error: () => (this.error = 'Failed to load bookmarks')
    });
  }

  setView(view: 'active' | 'archived'): void {
    this.view = view;
    if (view === 'archived') {
      this.resetForm();
    }
    this.load();
  }

  onSearchChange(): void {
    this.load();
  }

  save(): void {
    this.error = '';
    if (!this.form.name?.trim() || !this.form.url?.trim()) {
      this.error = 'Name and URL are required';
      return;
    }
    const request$ =
      this.editingId === null
        ? this.service.create(this.form)
        : this.service.update(this.editingId, this.form);

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.load();
      },
      error: () => (this.error = 'Failed to save bookmark')
    });
  }

  edit(bookmark: Bookmark): void {
    this.editingId = bookmark.id;
    this.form = {
      name: bookmark.name,
      url: bookmark.url,
      additionalInfo: bookmark.additionalInfo ?? ''
    };
  }

  remove(bookmark: Bookmark): void {
    if (!confirm(`Archive bookmark "${bookmark.name}"? You can restore it later.`)) {
      return;
    }
    this.service.remove(bookmark.id).subscribe({
      next: () => {
        if (this.editingId === bookmark.id) {
          this.resetForm();
        }
        this.load();
      },
      error: () => (this.error = 'Failed to archive bookmark')
    });
  }

  restore(bookmark: Bookmark): void {
    this.service.restore(bookmark.id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Failed to restore bookmark')
    });
  }

  removePermanent(bookmark: Bookmark): void {
    if (!confirm(`Permanently delete "${bookmark.name}"? This removes it from the database and cannot be undone.`)) {
      return;
    }
    this.service.removePermanent(bookmark.id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Failed to delete bookmark')
    });
  }

  triggerImport(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importing = true;
    this.importMessage = '';
    this.error = '';

    this.service.importFromChrome(file).subscribe({
      next: (result) => {
        this.importing = false;
        this.importMessage =
          `Import complete: ${result.imported} bookmark${result.imported !== 1 ? 's' : ''} added` +
          (result.skipped > 0 ? `, ${result.skipped} skipped (duplicates or invalid).` : '.');
        this.load();
        setTimeout(() => (this.importMessage = ''), 6000);
      },
      error: () => {
        this.importing = false;
        this.error = 'Failed to import bookmarks. Make sure the file is a valid Chrome bookmark export.';
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  copyUrl(bookmark: Bookmark): void {
    navigator.clipboard?.writeText(bookmark.url).then(() => {
      this.copiedId = bookmark.id;
      setTimeout(() => {
        if (this.copiedId === bookmark.id) {
          this.copiedId = null;
        }
      }, 1500);
    });
  }

  private emptyForm(): BookmarkRequest {
    return { name: '', url: '', additionalInfo: '' };
  }
}
