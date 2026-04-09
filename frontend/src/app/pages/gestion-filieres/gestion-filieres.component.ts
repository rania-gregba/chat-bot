import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FiliereService } from '../../services/filiere.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gestion-filieres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-filieres.component.html',
  styleUrl: './gestion-filieres.component.css'
})
export class GestionFilieresComponent implements OnInit {

  filieres: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  // Formulaire
  nom = '';
  code = '';
  niveau = '';
  departement = '';
  capaciteMax: number | null = null;
  description = '';

  errorMessage = '';
  successMessage = '';

  constructor(
    private filiereService: FiliereService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.getRole() !== 'ADMIN') {
      this.router.navigate(['/chat']);
      return;
    }
    this.loadFilieres();
  }

  loadFilieres() {
    this.filiereService.getAll().subscribe({
      next: (data) => this.filieres = data,
      error: () => this.errorMessage = 'Erreur de chargement'
    });
  }

  openAdd() {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEdit(f: any) {
    this.nom = f.nom;
    this.code = f.code;
    this.niveau = f.niveau || '';
    this.departement = f.departement || '';
    this.capaciteMax = f.capaciteMax;
    this.description = f.description || '';
    this.editId = f.id;
    this.showForm = true;
    this.editMode = true;
  }

  save() {
    this.errorMessage = '';
    if (!this.nom || !this.code) {
      this.errorMessage = 'Nom et code sont obligatoires';
      return;
    }

    const data = {
      nom: this.nom, code: this.code, niveau: this.niveau,
      departement: this.departement, capaciteMax: this.capaciteMax,
      description: this.description
    };

    if (this.editMode && this.editId) {
      this.filiereService.update(this.editId, data).subscribe({
        next: () => { this.successMessage = 'Filière mise à jour'; this.loadFilieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || 'Erreur'
      });
    } else {
      this.filiereService.create(data).subscribe({
        next: () => { this.successMessage = 'Filière créée'; this.loadFilieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || 'Erreur'
      });
    }
  }

  deleteFiliere(id: number) {
    if (confirm('Supprimer cette filière ?')) {
      this.filiereService.delete(id).subscribe({
        next: () => this.loadFilieres(),
        error: () => this.errorMessage = 'Erreur suppression'
      });
    }
  }

  resetForm() {
    this.nom = ''; this.code = ''; this.niveau = '';
    this.departement = ''; this.capaciteMax = null;
    this.description = ''; this.editId = null;
    this.errorMessage = ''; this.successMessage = '';
  }

  cancel() { this.showForm = false; this.resetForm(); }
  goBack() { this.router.navigate(['/admin']); }
}
