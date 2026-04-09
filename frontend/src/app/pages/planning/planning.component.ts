import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanningService } from '../../services/planning.service';
import { FiliereService } from '../../services/filiere.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MatiereService } from '../../services/matiere.service';
import { SalleService } from '../../services/salle.service';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent implements OnInit {

  creneaux: any[] = [];
  filieres: any[] = [];
  professeurs: any[] = [];
  matieres: any[] = [];
  salles: any[] = [];
  
  selectedFiliereId: number | null = null;
  selectedProfesseurId: number | null = null;
  viewMode: 'FILIERE' | 'PROFESSEUR' = 'FILIERE';
  
  username = '';
  role = '';
  isLoading = false;
  isGenerating = false;
  isAddingSlot = false;

  newSlot = {
    jour: 'LUNDI',
    heureDebut: '08:30',
    heureFin: '10:00',
    matiereId: '',
    salleId: '',
    filiereId: '',
    professeurId: '',
    groupe: 'Groupe A',
    semestre: 'S1'
  };

  jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
  heures = ['08:30', '10:15', '12:00', '13:45', '15:30'];

  constructor(
    private planningService: PlanningService,
    private filiereService: FiliereService,
    private authService: AuthService,
    private adminService: AdminService,
    private matiereService: MatiereService,
    private salleService: SalleService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = this.authService.getUsername() || '';
    this.role = this.authService.getRole() || 'USER';

    if (this.role === 'PROFESSEUR') {
      this.loadProfesseurPlanning();
    } else {
      this.loadFilieres();
      if (this.role === 'ADMIN') {
        this.loadProfesseurs();
        this.loadMatieres();
        this.loadSalles();
      }
    }
  }

  loadProfesseurs() {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.professeurs = users.filter((u: any) => u.role === 'PROFESSEUR');
      }
    });
  }

  loadMatieres() {
    this.matiereService.getAll().subscribe(data => this.matieres = data);
  }

  loadSalles() {
    this.salleService.getAll().subscribe(data => this.salles = data);
  }

  setViewMode(mode: 'FILIERE' | 'PROFESSEUR') {
    this.viewMode = mode;
    this.creneaux = [];
    if (mode === 'FILIERE') {
      if (this.selectedFiliereId) this.loadPlanning();
    } else {
      if (this.selectedProfesseurId) this.loadPlanningProf();
    }
  }

  loadPlanningProf() {
    if (!this.selectedProfesseurId) return;
    this.isLoading = true;
    this.planningService.getPlanningByProfesseur(this.selectedProfesseurId).subscribe({
      next: (data) => {
        this.creneaux = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onProfesseurChange() {
    this.loadPlanningProf();
  }

  loadProfesseurPlanning() {
    this.isLoading = true;
    const profile = this.authService.getStoredProfile();
    const userId = profile?.id || 1; // Fallback to 1 if not exists
    this.planningService.getPlanningByProfesseur(userId).subscribe({
      next: (data) => {
        this.creneaux = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement planning professeur');
      }
    });
  }

  loadFilieres() {
    this.filiereService.getAll().subscribe({
      next: (data) => {
        this.filieres = data;
        if (this.filieres.length > 0) {
          if (this.role === 'USER') {
            const profile = this.authService.getStoredProfile();
            const maFiliere = this.filieres.find(f => f.nom === profile?.fieldOfStudy);
            this.selectedFiliereId = maFiliere ? maFiliere.id : this.filieres[0].id;
          } else {
            this.selectedFiliereId = this.filieres[0].id;
          }
          this.loadPlanning();
        }
      },
      error: () => console.error('Erreur chargement filières')
    });
  }

  genererPlanningAuto() {
    if (!this.selectedFiliereId || this.role !== 'ADMIN') return;
    if (confirm('Voulez-vous générer automatiquement le planning pour cette filière ? Cela ajoutera des créneaux aléatoires sans conflits.')) {
      this.isGenerating = true;
      this.planningService.genererPlanning(this.selectedFiliereId, 'S1').subscribe({
        next: () => {
          this.isGenerating = false;
          alert('Planning généré avec succès !');
          this.loadPlanning();
        },
        error: (err) => {
          this.isGenerating = false;
          alert('Erreur lors de la génération. ' + (err.error?.error || ''));
        }
      });
    }
  }

  loadPlanning() {
    if (!this.selectedFiliereId) return;
    this.isLoading = true;
    this.planningService.getPlanningByFiliere(this.selectedFiliereId).subscribe({
      next: (data) => {
        this.creneaux = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement planning');
      }
    });
  }

  getCreneauPourCase(jour: string, heure: string): any {
    return this.creneaux.find(c =>
      c.jour === jour &&
      c.heureDebut && c.heureDebut.substring(0, 5) === heure
    );
  }

  onFiliereChange() {
    this.loadPlanning();
  }

  supprimerCreneau(id: number) {
    if (confirm('Supprimer ce créneau ?')) {
      this.planningService.supprimerCreneau(id).subscribe({
        next: () => this.loadPlanning(),
        error: () => alert('Erreur lors de la suppression')
      });
    }
  }

  goToChat() { this.router.navigate(['/chat']); }
  goToAdmin() { this.router.navigate(['/admin']); }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }

  ajouterCreneauManuel() {
    if (!this.newSlot.matiereId || !this.newSlot.salleId || !this.newSlot.filiereId) {
      alert('Veuillez remplir les informations obligatoires (Matière, Salle, Filière)');
      return;
    }

    this.isLoading = true;
    this.planningService.ajouterCreneau(this.newSlot).subscribe({
      next: () => {
        alert('Créneau ajouté avec succès !');
        if (this.viewMode === 'FILIERE') this.loadPlanning();
        else this.loadPlanningProf();
        this.isAddingSlot = false;
      },
      error: (err) => {
        this.isLoading = false;
        alert('Erreur: ' + (err.error?.error || 'Conflit détecté'));
      }
    });
  }

  getFiliereNom(): string {
    const f = this.filieres.find(f => f.id === this.selectedFiliereId);
    return f ? f.nom : (this.viewMode === 'PROFESSEUR' && this.selectedProfesseurId ? 'Vue Enseignant' : '');
  }
}
