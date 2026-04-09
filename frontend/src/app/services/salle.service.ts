import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalleService {

  private apiUrl = `${environment.apiBaseUrl}/api/admin/salles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getDisponibles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/disponibles`);
  }

  getByType(type: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/type/${type}`);
  }

  create(salle: any): Observable<any> {
    return this.http.post(this.apiUrl, salle);
  }

  update(id: number, salle: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, salle);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
