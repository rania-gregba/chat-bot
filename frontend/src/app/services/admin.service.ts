import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  // statistiques
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  // liste utilisateurs
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  // supprimer utilisateur
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // liste conversations
  getMessages(): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages`);
  }

  // liste documents
  getDocuments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents`);
  }

  // générer un identifiant
  generateIdentity(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/identities/generate`, data);
  }
}