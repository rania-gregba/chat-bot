import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {

  private apiUrl = `${environment.apiBaseUrl}/api/admin/planning`;

  constructor(private http: HttpClient) {}

  // Planning par filière
  getPlanningByFiliere(filiereId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/filiere/${filiereId}`);
  }

  // Planning par professeur
  getPlanningByProfesseur(profId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/professeur/${profId}`);
  }

  // Planning par salle
  getPlanningBySalle(salleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/salle/${salleId}`);
  }

  // Tous les créneaux
  getAllCreneaux(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`);
  }

  // Ajouter un créneau
  ajouterCreneau(creneau: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/creneaux`, creneau);
  }

  // Supprimer un créneau
  supprimerCreneau(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/creneaux/${id}`);
  }

  // Générer planning automatique
  genererPlanning(filiereId: number, semestre: string = 'S1'): Observable<any> {
    return this.http.post(`${this.apiUrl}/generer`, { filiereId, semestre });
  }

  // Salles disponibles
  getSallesDisponibles(jour: string, heureDebut: string, heureFin: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/salles-disponibles`, {
      params: { jour, heureDebut, heureFin }
    });
  }
}
