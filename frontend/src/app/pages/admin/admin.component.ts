import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { LanguageService } from '../../services/language.service';
import { NoteService } from '../../services/note.service';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  stats: any = {
    totalUsers: 0,
    totalMessages: 0,
    totalDocuments: 0,
    totalFilieres: 0,
    totalSalles: 0,
    totalMatieres: 0,
    totalCreneaux: 0,
    nbEtudiants: 0,
    nbProfesseurs: 0,
    nbAdmins: 0
  };

  users: any[] = [];
  messages: any[] = [];
  documents: any[] = [];
  notes: any[] = [];
  activeTab = 'stats';
  isLoading = false;

  // 🔥 FIX : role initialisé à 'STUDENT' (pas 'USER')
  identityData = {
    role: 'STUDENT',
    firstName: '',
    lastName: '',
    cin: ''
  };
  generatedId: string = '';
  identityError: string = '';
  currentLang = 'fr';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private languageService: LanguageService,
    private noteService: NoteService
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  ngOnInit() {
    if (this.authService.getRole() !== 'ADMIN') {
      this.router.navigate(['/chat']);
      return;
    }
    this.loadStats();
    this.loadUsers();
    this.loadMessages();
    this.loadDocuments();
    this.loadNotes();
  }

  toggleLanguage() { this.languageService.toggleLanguage(); }
  t(key: string): string { return this.languageService.t(key); }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error(err)
    });
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error(err)
    });
  }

  loadMessages() {
    this.adminService.getMessages().subscribe({
      next: (data) => this.messages = data,
      error: (err) => console.error(err)
    });
  }

  loadDocuments() {
    this.adminService.getDocuments().subscribe({
      next: (data) => this.documents = data,
      error: (err) => console.error(err)
    });
  }

  loadNotes() {
    this.noteService.getAllNotes().subscribe({
      next: (data: any) => this.notes = data,
      error: (err: any) => console.error(err)
    });
  }

  deleteUser(id: number) {
    if (confirm(this.t('admin.confirm_delete'))) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
          this.loadStats();
        },
        error: (err) => console.error(err)
      });
    }
  }

  generateIdentity() {
    this.identityError = '';
    this.generatedId = '';

    if (!this.identityData.firstName || !this.identityData.lastName || !this.identityData.cin) {
      this.identityError = this.t('admin.identity.error_empty');
      return;
    }

    // 🔥 FIX : s'assurer que le rôle est toujours en majuscules
    this.identityData.role = this.identityData.role.toUpperCase();

    this.isLoading = true;
    this.adminService.generateIdentity(this.identityData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.generatedId = res.identifier;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.identityError = err.error?.error || err.error?.message || this.t('admin.identity.error_gen');
      }
    });
  }

  copyId() {
    if (this.generatedId) {
      navigator.clipboard.writeText(this.generatedId);
      alert(this.t('admin.identity.copied'));
    }
  }

  setTab(tab: string) { this.activeTab = tab; }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
  goToChat() { this.router.navigate(['/chat']); }
  goToPlanning() { this.router.navigate(['/planning']); }
  goToFilieres() { this.router.navigate(['/gestion/filieres']); }
  goToSalles() { this.router.navigate(['/gestion/salles']); }
  goToMatieres() { this.router.navigate(['/gestion/matieres']); }
}