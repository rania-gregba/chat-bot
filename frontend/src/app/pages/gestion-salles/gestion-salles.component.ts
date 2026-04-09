import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalleService } from '../../services/salle.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gestion-salles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-salles.component.html',
  styleUrl: './gestion-salles.component.css'
})
export class GestionSallesComponent implements OnInit {

  salles: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  nom = '';
  code = '';
  capacite: number | null = null;
  type = 'SALLE_TD';
  disponible = true;
  localisation = '';
  equipements = '';

  errorMessage = '';
  successMessage = '';

  types = ['AMPHI', 'SALLE_TD', 'LABO', 'SALLE_INFO', 'SALLE_REUNION'];

  constructor(
    private salleService: SalleService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.getRole() !== 'ADMIN') {
      this.router.navigate(['/chat']);
      return;
    }
    this.loadSalles();
  }

  loadSalles() {
    this.salleService.getAll().subscribe({
      next: (data) => this.salles = data,
      error: () => this.errorMessage = 'Erreur de chargement'
    });
  }

  openAdd() {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEdit(s: any) {
    this.nom = s.nom;
    this.code = s.code || '';
    this.capacite = s.capacite;
    this.type = s.type || 'SALLE_TD';
    this.disponible = s.disponible !== false;
    this.localisation = s.localisation || '';
    this.equipements = s.equipements || '';
    this.editId = s.id;
    this.showForm = true;
    this.editMode = true;
  }

  save() {
    this.errorMessage = '';
    if (!this.nom) { this.errorMessage = 'Le nom est obligatoire'; return; }

    const data = {
      nom: this.nom, code: this.code, capacite: this.capacite, type: this.type,
      disponible: this.disponible, localisation: this.localisation,
      equipements: this.equipements
    };

    if (this.editMode && this.editId) {
      this.salleService.update(this.editId, data).subscribe({
        next: () => { this.successMessage = 'Salle mise à jour'; this.loadSalles(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || 'Erreur'
      });
    } else {
      this.salleService.create(data).subscribe({
        next: () => { this.successMessage = 'Salle créée'; this.loadSalles(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || 'Erreur'
      });
    }
  }

  deleteSalle(id: number) {
    if (confirm('Supprimer cette salle ?')) {
      this.salleService.delete(id).subscribe({
        next: () => this.loadSalles(),
        error: () => this.errorMessage = 'Erreur suppression'
      });
    }
  }

  getTypeLabel(type: string): string {
    const labels: any = { 'AMPHI': 'Amphithéâtre', 'SALLE_TD': 'Salle TD', 'LABO': 'Laboratoire', 'SALLE_INFO': 'Salle Info', 'SALLE_REUNION': 'Salle Réunion' };
    return labels[type] || type;
  }

  resetForm() {
    this.nom = ''; this.code = ''; this.capacite = null; this.type = 'SALLE_TD';
    this.disponible = true; this.localisation = ''; this.equipements = '';
    this.editId = null; this.errorMessage = ''; this.successMessage = '';
  }

  cancel() { this.showForm = false; this.resetForm(); }
  goBack() { this.router.navigate(['/admin']); }
}
