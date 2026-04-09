import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private apiUrl = 'http://localhost:8080/api/documents';

  constructor(private http: HttpClient) {}

  // générer un document
  generateDocument(
    documentType: string,
    fullName: string,
    additionalInfo: string,
    format: string,
    username: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate`, {
      documentType,
      fullName,
      additionalInfo,
      format,
      username
    });
  }

  // télécharger un document
  downloadDocument(id: number): string {
    return `${this.apiUrl}/download/${id}`;
  }

  // liste des documents
  getUserDocuments(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/list/${username}`);
  }
}