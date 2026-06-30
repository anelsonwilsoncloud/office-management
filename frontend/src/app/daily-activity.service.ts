import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DailyActivity, DailyActivityRequest } from './models';

@Injectable({ providedIn: 'root' })
export class DailyActivityService {
  private readonly baseUrl = '/api/activities';

  constructor(private http: HttpClient) {}

  list(search?: string): Observable<DailyActivity[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<DailyActivity[]>(this.baseUrl, { params });
  }

  listArchived(): Observable<DailyActivity[]> {
    return this.http.get<DailyActivity[]>(`${this.baseUrl}/archived`);
  }

  create(body: DailyActivityRequest): Observable<DailyActivity> {
    return this.http.post<DailyActivity>(this.baseUrl, body);
  }

  update(id: number, body: DailyActivityRequest): Observable<DailyActivity> {
    return this.http.put<DailyActivity>(`${this.baseUrl}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<DailyActivity> {
    return this.http.put<DailyActivity>(`${this.baseUrl}/${id}/restore`, {});
  }

  removePermanent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/permanent`);
  }
}
