import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ChatComponent } from '../chat/chat.component';
import { PlanningComponent } from '../planning/planning.component';
import { NotesProfComponent } from '../../components/notes-prof/notes-prof.component';

@Component({
  selector: 'app-professeur',
  standalone: true,
  imports: [CommonModule, ChatComponent, PlanningComponent, NotesProfComponent],
  templateUrl: './professeur.component.html',
  styleUrls: ['./professeur.component.css']
})
export class ProfesseurComponent implements OnInit {

  activeTab = 'accueil';
  profile: any = null;
  currentLang = 'fr';

  constructor(
    private authService: AuthService,
    private router: Router,
    private languageService: LanguageService
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || this.authService.getRole() !== 'PROFESSEUR') {
      this.router.navigate(['/login']);
      return;
    }
    
    this.profile = this.authService.getStoredProfile();
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
