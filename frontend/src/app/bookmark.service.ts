import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bookmark, BookmarkRequest } from './models';

export interface BookmarkImportResult {
  imported: number;
  skipped: number;
}

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly baseUrl = '/api/bookmarks';

  constructor(private http: HttpClient) {}

  list(search?: string): Observable<Bookmark[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Bookmark[]>(this.baseUrl, { params });
  }

  listArchived(): Observable<Bookmark[]> {
    return this.http.get<Bookmark[]>(`${this.baseUrl}/archived`);
  }

  create(body: BookmarkRequest): Observable<Bookmark> {
    return this.http.post<Bookmark>(this.baseUrl, body);
  }

  update(id: number, body: BookmarkRequest): Observable<Bookmark> {
    return this.http.put<Bookmark>(`${this.baseUrl}/${id}`, body);
  }

  /** Soft delete: moves the bookmark to the archive. */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<Bookmark> {
    return this.http.put<Bookmark>(`${this.baseUrl}/${id}/restore`, {});
  }

  /** Permanent delete: removes the row from the database. */
  removePermanent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/permanent`);
  }

  /** Import bookmarks from a Chrome HTML export file. */
  importFromChrome(file: File): Observable<BookmarkImportResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<BookmarkImportResult>(`${this.baseUrl}/import`, form);
  }
}
