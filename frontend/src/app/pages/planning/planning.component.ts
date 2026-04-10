import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanningService } from '../../services/planning.service';
import { FiliereService } from '../../services/filiere.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MatiereService } from '../../services/matiere.service';
import { SalleService } from '../../services/salle.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent implements OnInit {

  creneaux: any[] = [];
  filieres: any[] = [];
  professeurs: any[] = [];
  matieres: any[] = [];
  salles: any[] = [];
  
  selectedFiliereId: number | null = null;
  selectedProfesseurId: number | null = null;
  viewMode: 'FILIERE' | 'PROFESSEUR' = 'FILIERE';
  
  username = '';
  role = '';
  currentLang = 'fr';
  isLoading = false;
  isGenerating = false;
  isAddingSlot = false;

  newSlot = {
    jour: 'LUNDI',
    heureDebut: '08:30',
    heureFin: '10:00',
    matiereId: '',
    salleId: '',
    filiereId: '',
    professeurId: '',
    groupe: 'Groupe A',
    semestre: 'S1'
  };

  jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
  heures = ['08:30', '10:15', '12:00', '13:45', '15:30'];

  constructor(
    private planningService: PlanningService,
    private filiereService: FiliereService,
    private authService: AuthService,
    private adminService: AdminService,
    private matiereService: MatiereService,
    private salleService: SalleService,
    private languageService: LanguageService,
    private router: Router
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        title: 'Emploi du temps',
        chat: 'Chat',
        admin: 'Admin',
        logout: 'Deconnexion',
        by_program: 'Par filiere',
        by_professor: 'Par enseignant',
        select_program: 'Selectionner une filiere :',
        select_professor: 'Selectionner un enseignant :',
        my_program: 'Ma filiere :',
        generate_auto: 'Generer auto',
        generating: 'Generation...',
        close: 'Fermer',
        add_manual: 'Ajout manuel',
        add_manual_title: 'Ajouter un creneau manuel',
        day: 'Jour',
        start: 'Debut',
        end: 'Fin',
        subject: 'Matiere',
        room: 'Salle',
        program: 'Filiere',
        professor_optional: 'Enseignant (optionnel)',
        none: 'Aucun',
        group: 'Groupe',
        group_placeholder: 'Ex: Groupe B',
        cancel: 'Annuler',
        save: 'Enregistrer',
        loading: 'Chargement du planning...',
        empty_title: 'Aucun creneau programme',
        empty_desc: "Le planning pour cette filiere est vide. Contactez l'administration.",
        hour: 'Heure',
        teacher_view: 'Vue enseignant',
        confirm_generate: 'Voulez-vous generer automatiquement le planning pour cette filiere ?',
        success_generated: 'Planning genere avec succes !',
        error_generation: 'Erreur lors de la generation.',
        confirm_delete_slot: 'Supprimer ce creneau ?',
        error_delete: 'Erreur lors de la suppression',
        missing_required: 'Veuillez remplir les informations obligatoires (matiere, salle, filiere).',
        success_added: 'Creneau ajoute avec succes !',
        conflict_detected: 'Conflit detecte',
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        teacher_prefix: 'Pr.'
      },
      en: {
        title: 'Timetable',
        chat: 'Chat',
        admin: 'Admin',
        logout: 'Sign out',
        by_program: 'By program',
        by_professor: 'By professor',
        select_program: 'Select a program:',
        select_professor: 'Select a professor:',
        my_program: 'My program:',
        generate_auto: 'Generate automatically',
        generating: 'Generating...',
        close: 'Close',
        add_manual: 'Manual slot',
        add_manual_title: 'Add a manual slot',
        day: 'Day',
        start: 'Start',
        end: 'End',
        subject: 'Subject',
        room: 'Room',
        program: 'Program',
        professor_optional: 'Professor (optional)',
        none: 'None',
        group: 'Group',
        group_placeholder: 'Example: Group B',
        cancel: 'Cancel',
        save: 'Save',
        loading: 'Loading timetable...',
        empty_title: 'No scheduled slot',
        empty_desc: 'The timetable for this program is empty. Please contact the administration.',
        hour: 'Time',
        teacher_view: 'Professor view',
        confirm_generate: 'Generate a timetable automatically for this program?',
        success_generated: 'Timetable generated successfully!',
        error_generation: 'Error while generating.',
        confirm_delete_slot: 'Delete this slot?',
        error_delete: 'Error while deleting',
        missing_required: 'Please fill in the required information (subject, room, program).',
        success_added: 'Slot added successfully!',
        conflict_detected: 'Conflict detected',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        teacher_prefix: 'Prof.'
      },
      ar: {
        title: 'جدول الحصص',
        chat: 'المحادثة',
        admin: 'الإدارة',
        logout: 'تسجيل الخروج',
        by_program: 'حسب الاختصاص',
        by_professor: 'حسب الأستاذ',
        select_program: 'اختر الاختصاص:',
        select_professor: 'اختر الأستاذ:',
        my_program: 'اختصاصي:',
        generate_auto: 'توليد آلي',
        generating: 'جار التوليد...',
        close: 'إغلاق',
        add_manual: 'إضافة يدوية',
        add_manual_title: 'إضافة حصة يدويا',
        day: 'اليوم',
        start: 'البداية',
        end: 'النهاية',
        subject: 'المادة',
        room: 'القاعة',
        program: 'الاختصاص',
        professor_optional: 'الأستاذ (اختياري)',
        none: 'لا أحد',
        group: 'المجموعة',
        group_placeholder: 'مثال: مجموعة ب',
        cancel: 'إلغاء',
        save: 'حفظ',
        loading: 'جار تحميل الجدول...',
        empty_title: 'لا توجد حصص مبرمجة',
        empty_desc: 'هذا الجدول فارغ حاليا. يرجى الاتصال بالإدارة.',
        hour: 'الوقت',
        teacher_view: 'عرض الأستاذ',
        confirm_generate: 'هل تريد توليد الجدول آليا لهذا الاختصاص؟',
        success_generated: 'تم توليد الجدول بنجاح!',
        error_generation: 'حدث خطأ أثناء التوليد.',
        confirm_delete_slot: 'هل تريد حذف هذه الحصة؟',
        error_delete: 'حدث خطأ أثناء الحذف',
        missing_required: 'يرجى ملء المعلومات المطلوبة (المادة، القاعة، الاختصاص).',
        success_added: 'تمت إضافة الحصة بنجاح!',
        conflict_detected: 'تم اكتشاف تعارض',
        monday: 'الاثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
        saturday: 'السبت',
        teacher_prefix: 'أ.'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

  getDayLabel(day: string): string {
    const map: Record<string, string> = {
      LUNDI: 'monday',
      MARDI: 'tuesday',
      MERCREDI: 'wednesday',
      JEUDI: 'thursday',
      VENDREDI: 'friday',
      SAMEDI: 'saturday'
    };

    return this.text(map[day] || day);
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = this.authService.getUsername() || '';
    this.role = this.authService.getRole() || 'USER';

    if (this.role === 'PROFESSEUR') {
      this.loadProfesseurPlanning();
    } else {
      this.loadFilieres();
      if (this.role === 'ADMIN') {
        this.loadProfesseurs();
        this.loadMatieres();
        this.loadSalles();
      }
    }
  }

  loadProfesseurs() {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.professeurs = users.filter((u: any) => u.role === 'PROFESSEUR');
      }
    });
  }

  loadMatieres() {
    this.matiereService.getAll().subscribe(data => this.matieres = data);
  }

  loadSalles() {
    this.salleService.getAll().subscribe(data => this.salles = data);
  }

  setViewMode(mode: 'FILIERE' | 'PROFESSEUR') {
    this.viewMode = mode;
    this.creneaux = [];
    if (mode === 'FILIERE') {
      if (this.selectedFiliereId) this.loadPlanning();
    } else {
      if (this.selectedProfesseurId) this.loadPlanningProf();
    }
  }

  loadPlanningProf() {
    if (!this.selectedProfesseurId) return;
    this.isLoading = true;
    this.planningService.getPlanningByProfesseur(this.selectedProfesseurId).subscribe({
      next: (data) => {
        this.creneaux = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onProfesseurChange() {
    this.loadPlanningProf();
  }

  loadProfesseurPlanning() {
    this.isLoading = true;
    const profile = this.authService.getStoredProfile();
    const userId = profile?.id || 1; // Fallback to 1 if not exists
    this.planningService.getPlanningByProfesseur(userId).subscribe({
      next: (data) => {
        this.creneaux = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement planning professeur');
      }
    });
  }

  loadFilieres() {
    this.filiereService.getAll().subscribe({
      next: (data) => {
        this.filieres = data;
        if (this.filieres.length > 0) {
          if (this.role === 'USER') {
            const profile = this.authService.getStoredProfile();
            const maFiliere = this.filieres.find(f => f.nom === profile?.fieldOfStudy);
            this.selectedFiliereId = maFiliere ? maFiliere.id : this.filieres[0].id;
          } else {
            this.selectedFiliereId = this.filieres[0].id;
          }
          this.loadPlanning();
        }
      },
      error: () => console.error('Erreur chargement filières')
    });
  }

  genererPlanningAuto() {
    if (!this.selectedFiliereId || this.role !== 'ADMIN') return;
    if (confirm(this.text('confirm_generate'))) {
      this.isGenerating = true;
      this.planningService.genererPlanning(this.selectedFiliereId, 'S1').subscribe({
        next: () => {
          this.isGenerating = false;
          alert(this.text('success_generated'));
          this.loadPlanning();
        },
        error: (err) => {
          this.isGenerating = false;
          alert(this.text('error_generation') + ' ' + (err.error?.error || ''));
        }
      });
    }
  }

  loadPlanning() {
    if (!this.selectedFiliereId) return;
    this.isLoading = true;
    this.planningService.getPlanningByFiliere(this.selectedFiliereId).subscribe({
      next: (data) => {
        this.creneaux = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement planning');
      }
    });
  }

  getCreneauPourCase(jour: string, heure: string): any {
    return this.creneaux.find(c =>
      c.jour === jour &&
      c.heureDebut && c.heureDebut.substring(0, 5) === heure
    );
  }

  onFiliereChange() {
    this.loadPlanning();
  }

  supprimerCreneau(id: number) {
    if (confirm(this.text('confirm_delete_slot'))) {
      this.planningService.supprimerCreneau(id).subscribe({
        next: () => this.loadPlanning(),
        error: () => alert(this.text('error_delete'))
      });
    }
  }

  goToChat() { this.router.navigate(['/chat']); }
  goToAdmin() { this.router.navigate(['/admin']); }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }

  ajouterCreneauManuel() {
    if (!this.newSlot.matiereId || !this.newSlot.salleId || !this.newSlot.filiereId) {
      alert(this.text('missing_required'));
      return;
    }

    this.isLoading = true;
    this.planningService.ajouterCreneau(this.newSlot).subscribe({
      next: () => {
        alert(this.text('success_added'));
        if (this.viewMode === 'FILIERE') this.loadPlanning();
        else this.loadPlanningProf();
        this.isAddingSlot = false;
      },
      error: (err) => {
        this.isLoading = false;
        alert(this.text('error_generation') + ' ' + (err.error?.error || this.text('conflict_detected')));
      }
    });
  }

  getFiliereNom(): string {
    const f = this.filieres.find(f => f.id === this.selectedFiliereId);
    return f ? f.nom : (this.viewMode === 'PROFESSEUR' && this.selectedProfesseurId ? this.text('teacher_view') : '');
  }
}
