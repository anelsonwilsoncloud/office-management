import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Todo, TodoRequest } from './models';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly baseUrl = '/api/todos';

  constructor(private http: HttpClient) {}

  list(search?: string, accomplished?: boolean | null): Observable<Todo[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (accomplished !== null && accomplished !== undefined) {
      params = params.set('accomplished', String(accomplished));
    }
    return this.http.get<Todo[]>(this.baseUrl, { params });
  }

  pastPending(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.baseUrl}/past-pending`);
  }

  futurePending(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.baseUrl}/future-pending`);
  }

  listArchived(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.baseUrl}/archived`);
  }

  create(body: TodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.baseUrl, body);
  }

  update(id: number, body: TodoRequest): Observable<Todo> {
    return this.http.put<Todo>(`${this.baseUrl}/${id}`, body);
  }

  /** Soft delete: moves the todo to the archive. */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<Todo> {
    return this.http.put<Todo>(`${this.baseUrl}/${id}/restore`, {});
  }

  /** Permanent delete: removes the row from the database. */
  removePermanent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/permanent`);
  }
}
