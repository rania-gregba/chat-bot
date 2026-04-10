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

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        professor_space: 'Espace Professeur',
        dashboard: 'Tableau de bord',
        assistant: 'Assistant FASTO',
        timetable: 'Mon emploi du temps',
        grades: 'Saisie des notes',
        profile: 'Mon profil',
        logout: 'Deconnexion',
        welcome: 'Bienvenue, Professeur',
        welcome_desc: 'Retrouvez ici votre espace d\'enseignement et de gestion des notes.',
        department: 'Departement',
        specialty: 'Specialite',
        classes: 'Classes affectees',
        undefined: 'Non defini',
        profile_title: 'Mon profil professionnel',
        full_name: 'Nom complet',
        academic_email: 'Email academique',
        phone: 'Telephone',
        classes_count: '3 groupes'
      },
      en: {
        professor_space: 'Professor Area',
        dashboard: 'Dashboard',
        assistant: 'FASTO Assistant',
        timetable: 'My timetable',
        grades: 'Grade entry',
        profile: 'My profile',
        logout: 'Sign out',
        welcome: 'Welcome, Professor',
        welcome_desc: 'Find your teaching workspace and grade management tools here.',
        department: 'Department',
        specialty: 'Specialty',
        classes: 'Assigned classes',
        undefined: 'Not set',
        profile_title: 'My professional profile',
        full_name: 'Full name',
        academic_email: 'Academic email',
        phone: 'Phone',
        classes_count: '3 groups'
      },
      ar: {
        professor_space: 'فضاء الأستاذ',
        dashboard: 'لوحة التحكم',
        assistant: 'مساعد FASTO',
        timetable: 'جدولي',
        grades: 'إدخال الأعداد',
        profile: 'ملفي الشخصي',
        logout: 'تسجيل الخروج',
        welcome: 'مرحبا أستاذ',
        welcome_desc: 'هنا تجد فضاء التدريس وإدارة الأعداد.',
        department: 'القسم',
        specialty: 'الاختصاص',
        classes: 'الأقسام المسندة',
        undefined: 'غير محدد',
        profile_title: 'ملفي المهني',
        full_name: 'الاسم الكامل',
        academic_email: 'البريد الأكاديمي',
        phone: 'الهاتف',
        classes_count: '3 مجموعات'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

