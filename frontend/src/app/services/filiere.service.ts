import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FiliereService {

  private apiUrl = `${environment.apiBaseUrl}/api/admin/filieres`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(filiere: any): Observable<any> {
    return this.http.post(this.apiUrl, filiere).pipe(
      catchError((error) => {
        let errorMsg = 'Erreur lors de la création';
        if (error.status === 404) {
          errorMsg = 'Endpoint non trouvé (404) - Vérifiez le backend';
        } else if (error.status === 400) {
          errorMsg = error.error?.error || 'Données invalides';
        } else if (error.status === 500) {
          errorMsg = 'Erreur serveur interne';
        }
        return throwError(() => ({ error: { error: errorMsg } }));
      })
    );
  }

  update(id: number, filiere: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, filiere).pipe(
      catchError((error) => {
        let errorMsg = 'Erreur lors de la mise à jour';
        if (error.status === 404) {
          errorMsg = 'Filière non trouvée';
        } else if (error.status === 400) {
          errorMsg = error.error?.error || 'Données invalides';
        } else if (error.status === 500) {
          errorMsg = 'Erreur serveur interne';
        }
        return throwError(() => ({ error: { error: errorMsg } }));
      })
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        let errorMsg = 'Erreur lors de la suppression';
        if (error.status === 404) {
          errorMsg = 'Filière non trouvée';
        } else if (error.status === 500) {
          errorMsg = 'Erreur serveur interne';
        }
        return throwError(() => ({ error: { error: errorMsg } }));
      })
    );
  }
}