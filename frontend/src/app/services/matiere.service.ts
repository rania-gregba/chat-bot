import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatiereService {

  private apiUrl = `${environment.apiBaseUrl}/api/admin/matieres`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getByFiliere(filiereId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/filiere/${filiereId}`);
  }

  create(matiere: any): Observable<any> {
    return this.http.post(this.apiUrl, matiere);
  }

  update(id: number, matiere: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, matiere);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
