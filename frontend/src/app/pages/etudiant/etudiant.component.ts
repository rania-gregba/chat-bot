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

  t(key: string): string {
    return this.languageService.t(key);
  }

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        student_space: 'Espace Etudiant',
        dashboard: 'Tableau de bord',
        assistant: 'Assistant FASTO',
        timetable: 'Emploi du temps',
        grades: 'Notes et releves',
        profile: 'Mon profil',
        logout: 'Deconnexion',
        welcome: 'Bienvenue',
        welcome_desc: 'Retrouvez ici toutes vos informations academiques et accedez a l\'assistant FASTO.',
        field: 'Filiere',
        level: 'Niveau academique',
        payment: 'Mode de paiement',
        undefined: 'Non defini',
        notes_title: 'Releve de notes',
        notes_desc: 'Cette section affiche vos notes officielles saisies par vos professeurs.',
        loading: 'Chargement de vos notes...',
        subject: 'Matiere',
        professor: 'Professeur',
        type: 'Type',
        date: 'Date',
        grade: 'Note /20',
        status: 'Statut',
        comment: 'Commentaire',
        no_grades: 'Aucune note n\'a ete saisie pour le moment.',
        validated: 'Valide',
        retake: 'Rattrapage',
        info_title: 'Mes informations',
        full_name: 'Nom complet',
        student_id: 'ID etudiant',
        email: 'Email',
        phone: 'Telephone',
        cin: 'CIN',
        field_level: 'Filiere et niveau'
      },
      en: {
        student_space: 'Student Area',
        dashboard: 'Dashboard',
        assistant: 'FASTO Assistant',
        timetable: 'Timetable',
        grades: 'Grades and transcripts',
        profile: 'My profile',
        logout: 'Sign out',
        welcome: 'Welcome',
        welcome_desc: 'Find your academic information here and access the FASTO assistant.',
        field: 'Program',
        level: 'Academic level',
        payment: 'Payment mode',
        undefined: 'Not set',
        notes_title: 'Transcript',
        notes_desc: 'This section shows your official grades entered by your professors.',
        loading: 'Loading your grades...',
        subject: 'Subject',
        professor: 'Professor',
        type: 'Type',
        date: 'Date',
        grade: 'Grade /20',
        status: 'Status',
        comment: 'Comment',
        no_grades: 'No grades have been entered yet.',
        validated: 'Passed',
        retake: 'Retake',
        info_title: 'My information',
        full_name: 'Full name',
        student_id: 'Student ID',
        email: 'Email',
        phone: 'Phone',
        cin: 'National ID',
        field_level: 'Program and level'
      },
      ar: {
        student_space: 'فضاء الطالب',
        dashboard: 'لوحة التحكم',
        assistant: 'مساعد FASTO',
        timetable: 'جدول الحصص',
        grades: 'النتائج وكشوف الأعداد',
        profile: 'ملفي الشخصي',
        logout: 'تسجيل الخروج',
        welcome: 'مرحبا',
        welcome_desc: 'هنا تجد معلوماتك الأكاديمية وتصل إلى مساعد FASTO.',
        field: 'الاختصاص',
        level: 'المستوى الأكاديمي',
        payment: 'طريقة الدفع',
        undefined: 'غير محدد',
        notes_title: 'كشف الأعداد',
        notes_desc: 'هذا القسم يعرض أعدادك الرسمية التي أدخلها الأساتذة.',
        loading: 'جار تحميل الأعداد...',
        subject: 'المادة',
        professor: 'الأستاذ',
        type: 'النوع',
        date: 'التاريخ',
        grade: 'العدد /20',
        status: 'الحالة',
        comment: 'ملاحظة',
        no_grades: 'لا توجد أعداد مسجلة حاليا.',
        validated: 'ناجح',
        retake: 'تدارك',
        info_title: 'معلوماتي',
        full_name: 'الاسم الكامل',
        student_id: 'معرف الطالب',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        cin: 'بطاقة التعريف',
        field_level: 'الاختصاص والمستوى'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
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

