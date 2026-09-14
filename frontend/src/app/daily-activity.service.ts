import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { DailyActivity, DailyActivityRequest, TeamOption } from './models';

@Injectable({ providedIn: 'root' })
export class DailyActivityService {
  private readonly baseUrl = '/api/activities';
  private readonly teamOptionsBaseUrl = '/api/settings/teams';
  private readonly teamOptionsChangedSubject = new Subject<void>();
  readonly teamOptionsChanged$ = this.teamOptionsChangedSubject.asObservable();

  constructor(private http: HttpClient) {}

  list(search?: string, team?: string, fromDate?: string, toDate?: string): Observable<DailyActivity[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (team && team.trim()) {
      params = params.set('team', team.trim());
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
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

  listTeamOptions(): Observable<TeamOption[]> {
    return this.http.get<TeamOption[]>(this.teamOptionsBaseUrl);
  }

  addTeamOption(name: string): Observable<TeamOption[]> {
    return this.http.post<TeamOption[]>(this.teamOptionsBaseUrl, { name });
  }

  removeTeamOption(name: string): Observable<TeamOption[]> {
    return this.http.delete<TeamOption[]>(this.teamOptionsBaseUrl, {
      params: new HttpParams().set('name', name)
    });
  }

  notifyTeamOptionsChanged(): void {
    this.teamOptionsChangedSubject.next();
  }
}
