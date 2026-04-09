import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatiereService } from '../../services/matiere.service';
import { FiliereService } from '../../services/filiere.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gestion-matieres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-matieres.component.html',
  styleUrl: './gestion-matieres.component.css'
})
export class GestionMatieresComponent implements OnInit {

  matieres: any[] = [];
  filieres: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  nom = '';
  code = '';
  coefficient: number | null = null;
  volumeHoraire: number | null = null;
  type = 'CM';
  filiereId: number | null = null;

  errorMessage = '';
  successMessage = '';

  types = ['CM', 'TD', 'TP'];

  constructor(
    private matiereService: MatiereService,
    private filiereService: FiliereService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.getRole() !== 'ADMIN') {
      this.router.navigate(['/chat']);
      return;
    }
    this.loadMatieres();
    this.loadFilieres();
  }

  loadMatieres() {
    this.matiereService.getAll().subscribe({
      next: (data) => this.matieres = data,
      error: () => this.errorMessage = 'Erreur de chargement'
    });
  }

  loadFilieres() {
    this.filiereService.getAll().subscribe({
      next: (data) => this.filieres = data
    });
  }

  openAdd() {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEdit(m: any) {
    this.nom = m.nom;
    this.code = m.code;
    this.coefficient = m.coefficient;
    this.volumeHoraire = m.volumeHoraire;
    this.type = m.type || 'CM';
    this.filiereId = m.filiere?.id || null;
    this.editId = m.id;
    this.showForm = true;
    this.editMode = true;
  }

  save() {
    this.errorMessage = '';
    if (!this.nom || !this.code) { this.errorMessage = 'Nom et code sont obligatoires'; return; }

    const data: any = {
      nom: this.nom, code: this.code, coefficient: this.coefficient,
      volumeHoraire: this.volumeHoraire, type: this.type, filiereId: this.filiereId
    };

    if (this.editMode && this.editId) {
      this.matiereService.update(this.editId, data).subscribe({
        next: () => { this.successMessage = 'Matière mise à jour'; this.loadMatieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || 'Erreur'
      });
    } else {
      this.matiereService.create(data).subscribe({
        next: () => { this.successMessage = 'Matière créée'; this.loadMatieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || 'Erreur'
      });
    }
  }

  deleteMatiere(id: number) {
    if (confirm('Supprimer cette matière ?')) {
      this.matiereService.delete(id).subscribe({
        next: () => this.loadMatieres(),
        error: () => this.errorMessage = 'Erreur suppression'
      });
    }
  }

  getTypeLabel(t: string): string {
    const labels: any = { 'CM': 'Cours Magistral', 'TD': 'Travaux Dirigés', 'TP': 'Travaux Pratiques' };
    return labels[t] || t;
  }

  resetForm() {
    this.nom = ''; this.code = ''; this.coefficient = null;
    this.volumeHoraire = null; this.type = 'CM'; this.filiereId = null;
    this.editId = null; this.errorMessage = ''; this.successMessage = '';
  }

  cancel() { this.showForm = false; this.resetForm(); }
  goBack() { this.router.navigate(['/admin']); }
}
