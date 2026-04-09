import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  private apiUrl = `${environment.apiBaseUrl}/api/notes`;

  constructor(private http: HttpClient) {}

  getNotesByEtudiant(etudiantId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/etudiant/${etudiantId}`);
  }

  getNotesByProfesseur(professeurId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/professeur/${professeurId}`);
  }

  ajouterNote(noteData: any): Observable<any> {
    return this.http.post(this.apiUrl, noteData);
  }

  supprimerNote(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAllNotes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
