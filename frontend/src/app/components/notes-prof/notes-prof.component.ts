import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { MatiereService } from '../../services/matiere.service';
import { AdminService } from '../../services/admin.service';
import { LanguageService } from '../../services/language.service';

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
  currentLang = 'fr';

  constructor(
    private noteService: NoteService,
    private authService: AuthService,
    private adminService: AdminService, // to get users locally/fast
    private matiereService: MatiereService,
    private languageService: LanguageService
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        title: 'Saisie des notes',
        subtitle: "Ajoutez une nouvelle evaluation pour un etudiant de votre classe.",
        new_evaluation: 'Nouvelle evaluation',
        student: 'Etudiant',
        select_student: 'Selectionner un etudiant',
        subject: 'Matiere',
        select_subject: 'Selectionner la matiere',
        evaluation_type: 'Type evaluation',
        grade20: 'Note /20',
        grade_placeholder: 'Ex: 15.5',
        comment_optional: 'Commentaire (optionnel)',
        comment_placeholder: 'Ex: Excellent travail, bonne progression...',
        save_grade: 'Enregistrer la note',
        saved_grades: 'Notes enregistrees',
        loading: 'Chargement des notes...',
        type: 'Type',
        comment: 'Commentaire',
        date: 'Date',
        action: 'Action',
        empty: "Aucune note saisie pour l'instant.",
        required_error: 'Veuillez remplir tous les champs obligatoires.',
        success_added: 'Note ajoutee avec succes !',
        add_error: "Erreur lors de l'ajout",
        confirm_delete: 'Etes-vous sur de vouloir supprimer cette note ?',
        empty_dash: '-'
      },
      en: {
        title: 'Grade entry',
        subtitle: 'Add a new evaluation for one of your students.',
        new_evaluation: 'New evaluation',
        student: 'Student',
        select_student: 'Select a student',
        subject: 'Subject',
        select_subject: 'Select a subject',
        evaluation_type: 'Evaluation type',
        grade20: 'Grade /20',
        grade_placeholder: 'Example: 15.5',
        comment_optional: 'Comment (optional)',
        comment_placeholder: 'Example: Excellent work, good progress...',
        save_grade: 'Save grade',
        saved_grades: 'Saved grades',
        loading: 'Loading grades...',
        type: 'Type',
        comment: 'Comment',
        date: 'Date',
        action: 'Action',
        empty: 'No grade entered yet.',
        required_error: 'Please fill in all required fields.',
        success_added: 'Grade added successfully!',
        add_error: 'Error while adding the grade',
        confirm_delete: 'Are you sure you want to delete this grade?',
        empty_dash: '-'
      },
      ar: {
        title: 'إدخال الأعداد',
        subtitle: 'أضف تقييما جديدا لأحد طلبتك.',
        new_evaluation: 'تقييم جديد',
        student: 'الطالب',
        select_student: 'اختر طالبا',
        subject: 'المادة',
        select_subject: 'اختر المادة',
        evaluation_type: 'نوع التقييم',
        grade20: 'العدد /20',
        grade_placeholder: 'مثال: 15.5',
        comment_optional: 'ملاحظة (اختياري)',
        comment_placeholder: 'مثال: عمل ممتاز وتقدم جيد...',
        save_grade: 'حفظ العدد',
        saved_grades: 'الأعداد المسجلة',
        loading: 'جار تحميل الأعداد...',
        type: 'النوع',
        comment: 'ملاحظة',
        date: 'التاريخ',
        action: 'إجراء',
        empty: 'لا توجد أعداد مسجلة حاليا.',
        required_error: 'يرجى ملء جميع الحقول المطلوبة.',
        success_added: 'تمت إضافة العدد بنجاح!',
        add_error: 'حدث خطأ أثناء الإضافة',
        confirm_delete: 'هل أنت متأكد من حذف هذا العدد؟',
        empty_dash: '-'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

  getEvaluationTypeLabel(value: string): string {
    const labels: Record<string, Record<string, string>> = {
      DS: { fr: 'DS', en: 'Quiz', ar: 'فرض' },
      Examen: { fr: 'Examen', en: 'Exam', ar: 'امتحان' },
      TP: { fr: 'TP', en: 'Lab', ar: 'تطبيقي' },
      Projet: { fr: 'Projet', en: 'Project', ar: 'مشروع' }
    };

    return labels[value]?.[this.currentLang] || value;
  }

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
      alert(this.text('required_error'));
      return;
    }
    
    const payload = {
      ...this.newNote,
      etudiantId: Number(this.newNote.etudiantId),
      matiereId: Number(this.newNote.matiereId),
      professeurId: this.profId
    };

    this.noteService.ajouterNote(payload).subscribe({
      next: () => {
        this.successMsg = this.text('success_added');
        this.loadNotes();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => alert(this.text('add_error'))
    });
  }

  supprimerNote(id: number) {
    if (confirm(this.text('confirm_delete'))) {
      this.noteService.supprimerNote(id).subscribe(() => this.loadNotes());
    }
  }
}
