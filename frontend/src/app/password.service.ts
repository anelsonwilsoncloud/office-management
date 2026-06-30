import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PasswordStatus {
  isSet: boolean;
}

export interface PasswordVerifyResponse {
  valid: boolean;
}

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly baseUrl = '/api/password';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<PasswordStatus> {
    return this.http.get<PasswordStatus>(`${this.baseUrl}/status`);
  }

  setPassword(password: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/set`, { password });
  }

  verifyPassword(password: string): Observable<PasswordVerifyResponse> {
    return this.http.post<PasswordVerifyResponse>(`${this.baseUrl}/verify`, { password });
  }

  deletePassword(): Observable<void> {
    return this.http.delete<void>(this.baseUrl);
  }
}
