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

  identityData = {
    role: 'STUDENT',
    firstName: '',
    lastName: '',
    cin: ''
  };
  generatedId = '';
  identityError = '';
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

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        next_lang: 'العربية',
        admin_badge: 'Admin',
        title: 'Espace admin',
        dashboard: 'Tableau de bord',
        identities: 'Identifiants',
        users: 'Utilisateurs',
        faculty: 'Gestion faculte',
        grades: 'Notes',
        messages: 'Messages',
        documents: 'Documents',
        bot: 'Chatbot',
        timetable: 'Planning',
        key_badge: 'Cle',
        users_breakdown: 'Repartition des utilisateurs',
        identity_title: 'Generation d identifiant',
        identity_how: 'Fonctionnement',
        identity_note: 'Conservez les identifiants en securite.',
        identity_step1: 'Choisir le role.',
        identity_step2: 'Saisir le prenom.',
        identity_step3: 'Saisir le nom.',
        identity_step4: 'Saisir le CIN.',
        identity_step5: 'Cliquer sur Generer.',
        identity_role: 'Role',
        identity_generate_title: 'Generer un identifiant',
        identity_generate_btn: 'Generer',
        identity_success: 'Identifiant genere',
        copied: 'Identifiant copie',
        confirm_delete: 'Supprimer cet utilisateur ?',
        identity_error_empty: 'Veuillez remplir les champs obligatoires.',
        identity_error_gen: 'Generation impossible.',
        students: 'Etudiants',
        professors: 'Professeurs',
        admins: 'Admins',
        manage_programs: 'Filieres',
        manage_rooms: 'Salles',
        manage_subjects: 'Matieres',
        copy: 'Copier',
        delete: 'Supprimer',
        date: 'Date',
        action: 'Action',
        user: 'Utilisateur',
        message: 'Message',
        response: 'Reponse',
        intent: 'Intention',
        lang: 'Langue',
        type: 'Type',
        name: 'Nom',
        format: 'Format',
        no_users: 'Aucun utilisateur trouve',
        manage_programs_desc: 'Gerer les filieres de la faculte',
        manage_rooms_desc: 'Gerer les salles et laboratoires',
        manage_subjects_desc: 'Gerer les matieres et les classes',
        manage_timetable_desc: 'Gerer les emplois du temps',
        evaluation: 'Evaluation',
        note20: 'Note / 20',
        status: 'Statut',
        passed: 'Valide',
        retake: 'Rattrapage',
        no_grades: 'Aucune note trouvee',
        no_messages: 'Aucun message trouve',
        no_documents: 'Aucune demande de document'
      },
      en: {
        next_lang: 'Francais',
        admin_badge: 'Admin',
        title: 'Admin dashboard',
        dashboard: 'Dashboard',
        identities: 'Identifiers',
        users: 'Users',
        faculty: 'Faculty management',
        grades: 'Grades',
        messages: 'Messages',
        documents: 'Documents',
        bot: 'Chatbot',
        timetable: 'Timetable',
        key_badge: 'Key',
        users_breakdown: 'Users breakdown',
        identity_title: 'Identifier generation',
        identity_how: 'How it works',
        identity_note: 'Keep identifiers secure.',
        identity_step1: 'Choose a role.',
        identity_step2: 'Enter first name.',
        identity_step3: 'Enter last name.',
        identity_step4: 'Enter national ID.',
        identity_step5: 'Click Generate.',
        identity_role: 'Role',
        identity_generate_title: 'Generate identifier',
        identity_generate_btn: 'Generate',
        identity_success: 'Identifier generated',
        copied: 'Identifier copied',
        confirm_delete: 'Delete this user?',
        identity_error_empty: 'Please fill in required fields.',
        identity_error_gen: 'Unable to generate identifier.',
        students: 'Students',
        professors: 'Professors',
        admins: 'Admins',
        manage_programs: 'Programs',
        manage_rooms: 'Rooms',
        manage_subjects: 'Subjects',
        copy: 'Copy',
        delete: 'Delete',
        date: 'Date',
        action: 'Action',
        user: 'User',
        message: 'Message',
        response: 'Response',
        intent: 'Intent',
        lang: 'Language',
        type: 'Type',
        name: 'Name',
        format: 'Format',
        no_users: 'No users found',
        manage_programs_desc: 'Manage faculty programs',
        manage_rooms_desc: 'Manage rooms and labs',
        manage_subjects_desc: 'Manage subjects and classes',
        manage_timetable_desc: 'Manage timetables',
        evaluation: 'Evaluation',
        note20: 'Grade / 20',
        status: 'Status',
        passed: 'Passed',
        retake: 'Retake',
        no_grades: 'No grades found',
        no_messages: 'No messages found',
        no_documents: 'No document requests'
      },
      ar: {
        next_lang: 'English',
        admin_badge: 'مدير',
        title: 'فضاء المدير',
        dashboard: 'لوحة التحكم',
        identities: 'المعرفات',
        users: 'المستخدمون',
        faculty: 'إدارة الكلية',
        grades: 'النتائج',
        messages: 'الرسائل',
        documents: 'الوثائق',
        bot: 'الشات بوت',
        timetable: 'الجدول',
        key_badge: 'مفتاح',
        users_breakdown: 'توزيع المستخدمين',
        identity_title: 'توليد معرف',
        identity_how: 'طريقة العمل',
        identity_note: 'احفظ المعرفات في مكان آمن.',
        identity_step1: 'اختر الدور.',
        identity_step2: 'ادخل الاسم.',
        identity_step3: 'ادخل اللقب.',
        identity_step4: 'ادخل رقم البطاقة.',
        identity_step5: 'اضغط على توليد.',
        identity_role: 'الدور',
        identity_generate_title: 'توليد معرف جديد',
        identity_generate_btn: 'توليد',
        identity_success: 'تم توليد المعرف',
        copied: 'تم نسخ المعرف',
        confirm_delete: 'هل تريد حذف هذا المستخدم؟',
        identity_error_empty: 'يرجى تعبئة كل الحقول المطلوبة.',
        identity_error_gen: 'تعذر توليد المعرف.',
        students: 'الطلبة',
        professors: 'الاساتذة',
        admins: 'المدراء',
        manage_programs: 'الاختصاصات',
        manage_rooms: 'القاعات',
        manage_subjects: 'المواد',
        copy: 'نسخ',
        delete: 'حذف',
        date: 'التاريخ',
        action: 'إجراء',
        user: 'المستخدم',
        message: 'الرسالة',
        response: 'الرد',
        intent: 'النية',
        lang: 'اللغة',
        type: 'النوع',
        name: 'الاسم',
        format: 'الصيغة',
        no_users: 'لا يوجد مستخدمون',
        manage_programs_desc: 'إدارة اختصاصات الكلية',
        manage_rooms_desc: 'إدارة القاعات والمخابر',
        manage_subjects_desc: 'إدارة المواد والأقسام',
        manage_timetable_desc: 'إدارة الجداول',
        evaluation: 'التقييم',
        note20: 'العدد / 20',
        status: 'الحالة',
        passed: 'ناجح',
        retake: 'تدارك',
        no_grades: 'لا توجد أعداد',
        no_messages: 'لا توجد رسائل',
        no_documents: 'لا توجد طلبات وثائق'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

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
    if (confirm(this.text('confirm_delete'))) {
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
      this.identityError = this.text('identity_error_empty');
      return;
    }

    this.identityData.role = this.identityData.role.toUpperCase();

    this.isLoading = true;
    this.adminService.generateIdentity(this.identityData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.generatedId = res.identifier;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.identityError = err.error?.error || err.error?.message || this.text('identity_error_gen');
      }
    });
  }

  copyId() {
    if (this.generatedId) {
      navigator.clipboard.writeText(this.generatedId);
      alert(this.text('copied'));
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


