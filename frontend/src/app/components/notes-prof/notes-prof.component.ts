import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { MatiereService } from '../../services/matiere.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-notes-prof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-prof.component.html',
  styleUrl: './notes-prof.component.css'
})
export class NotesProfComponent implements OnInit {

  notes: any[] = [];
  etudiants: any[] = [];
  matieres: any[] = [];
  
  newNote = {
    etudiantId: '',
    matiereId: '',
    typeEvaluation: 'Examen',
    valeur: 0,
    commentaire: ''
  };

  profId: number = 0;
  isLoading = false;
  successMsg = '';

  constructor(
    private noteService: NoteService,
    private authService: AuthService,
    private adminService: AdminService, // to get users locally/fast
    private matiereService: MatiereService
  ) {}

  ngOnInit() {
    const profile = this.authService.getStoredProfile();
    this.profId = profile?.id || Number(localStorage.getItem('userId')) || 0;
    
    this.loadData();
    this.loadNotes();
  }

  loadData() {
    this.matiereService.getAll().subscribe({
      next: (m) => this.matieres = m,
      error: (err) => console.error(err)
    });

    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.etudiants = users.filter((u: any) => u.role === 'USER');
      },
      error: (err) => console.error(err)
    });
  }

  loadNotes() {
    if (!this.profId) return;
    this.isLoading = true;
    this.noteService.getNotesByProfesseur(this.profId).subscribe({
      next: (data) => {
        this.notes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  ajouterNote() {
    if (!this.newNote.etudiantId || !this.newNote.matiereId || this.newNote.valeur === null) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    const payload = {
      ...this.newNote,
      etudiantId: Number(this.newNote.etudiantId),
      matiereId: Number(this.newNote.matiereId),
      professeurId: this.profId
    };

    this.noteService.ajouterNote(payload).subscribe({
      next: (res) => {
        this.successMsg = 'Note ajoutée avec succès !';
        this.loadNotes();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => alert('Erreur lors de l\'ajout')
    });
  }

  supprimerNote(id: number) {
    if(confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
      this.noteService.supprimerNote(id).subscribe(() => this.loadNotes());
    }
  }
}
