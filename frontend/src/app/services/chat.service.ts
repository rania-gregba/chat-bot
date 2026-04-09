import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatRequest {
  message: string;
  language: string;
  student_context?: Record<string, any> | null;
  username?: string;
}

export interface RagResult {
  answer?: string;
  intention?: string;
  sources?: Array<string | { title?: string; source?: string; url?: string; [key: string]: any }>;
}

export interface ChatResponse {
  answer?: string;
  final_answer?: string;
  response?: string;
  intention?: string;
  intent?: string;
  use_rag?: boolean;
  rag_result?: RagResult;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // URL de base : /api/chat
  private apiUrl = `${environment.apiBaseUrl}/api/chat`;

  constructor(private http: HttpClient) {}

  // envoyer un message au backend → POST /api/chat/send
  sendMessage(payload: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/send`, payload);
  }

  // récupérer l'historique des messages → GET /api/chat/history/{username}
  getHistory(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/history/${username}`);
  }
}