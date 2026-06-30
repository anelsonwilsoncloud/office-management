import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TechnicalLearning, TechnicalLearningRequest } from './models';

@Injectable({ providedIn: 'root' })
export class TechnicalLearningService {
  private readonly baseUrl = '/api/learning';

  constructor(private http: HttpClient) {}

  list(search?: string): Observable<TechnicalLearning[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<TechnicalLearning[]>(this.baseUrl, { params });
  }

  listArchived(): Observable<TechnicalLearning[]> {
    return this.http.get<TechnicalLearning[]>(`${this.baseUrl}/archived`);
  }

  create(body: TechnicalLearningRequest): Observable<TechnicalLearning> {
    return this.http.post<TechnicalLearning>(this.baseUrl, body);
  }

  update(id: number, body: TechnicalLearningRequest): Observable<TechnicalLearning> {
    return this.http.put<TechnicalLearning>(`${this.baseUrl}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  restore(id: number): Observable<TechnicalLearning> {
    return this.http.put<TechnicalLearning>(`${this.baseUrl}/${id}/restore`, {});
  }

  removePermanent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/permanent`);
  }
}
