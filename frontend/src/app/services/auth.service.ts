import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiBaseUrl}/api/auth`;

  // 🔥 FIX : pointe vers /api/auth/profile (route qui existe)
  private profileUrl = `${environment.apiBaseUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  register(studentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, studentData);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password });
  }

  // 🔥 FIX : appelle /api/auth/profile/{username} qui existe dans AuthController
  getStudentProfile(): Observable<any> {
    const username = this.getUsername();
    if (!username) return of(null);

    return this.http.get(`${this.profileUrl}/profile/${username}`).pipe(
      catchError(() => of(null)) // si erreur → retourne null sans bloquer
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('studentProfile');
  }

  saveUserInfo(username: string, role: string): void {
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
  }

  saveStudentProfile(profile: any): void {
    if (profile) {
      localStorage.setItem('studentProfile', JSON.stringify(profile));
    }
  }

  getStoredProfile(): any {
    const p = localStorage.getItem('studentProfile');
    return p ? JSON.parse(p) : null;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getRole(): string | null {
    const role = localStorage.getItem('role');

    // Normalise le rôle étudiant pour éviter les incohérences
    // backend (STUDENT) vs frontend historique (USER)
    if (role === 'STUDENT') {
      return 'USER';
    }

    return role;
  }
}