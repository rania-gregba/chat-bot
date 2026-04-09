import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ChatComponent } from '../chat/chat.component';
import { PlanningComponent } from '../planning/planning.component';
import { NoteService } from '../../services/note.service';

@Component({
  selector: 'app-etudiant',
  standalone: true,
  imports: [CommonModule, ChatComponent, PlanningComponent],
  templateUrl: './etudiant.component.html',
  styleUrls: ['./etudiant.component.css']
})
export class EtudiantComponent implements OnInit {

  activeTab = 'accueil';
  profile: any = null;
  currentLang = 'fr';
  mesNotes: any[] = [];
  isLoadingNotes = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private languageService: LanguageService,
    private noteService: NoteService
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || this.authService.getRole() !== 'USER') {
      this.router.navigate(['/login']);
      return;
    }
    
    this.profile = this.authService.getStoredProfile();
    this.loadNotes();
  }

  loadNotes() {
    this.isLoadingNotes = true;
    const userId = this.profile?.id || Number(localStorage.getItem('userId')) || 0;
    if (!userId) {
      this.isLoadingNotes = false;
      return;
    }
    this.noteService.getNotesByEtudiant(userId).subscribe({
      next: (data) => {
        this.mesNotes = data;
        this.isLoadingNotes = false;
      },
      error: () => this.isLoadingNotes = false
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
