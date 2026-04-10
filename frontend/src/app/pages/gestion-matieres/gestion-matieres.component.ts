import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatiereService } from '../../services/matiere.service';
import { FiliereService } from '../../services/filiere.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-gestion-matieres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-matieres.component.html',
  styleUrl: './gestion-matieres.component.css'
})
export class GestionMatieresComponent implements OnInit {

  matieres: any[] = [];
  filieres: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  nom = '';
  code = '';
  coefficient: number | null = null;
  volumeHoraire: number | null = null;
  type = 'CM';
  filiereId: number | null = null;

  errorMessage = '';
  successMessage = '';
  currentLang = 'fr';

  types = ['CM', 'TD', 'TP'];

  constructor(
    private matiereService: MatiereService,
    private filiereService: FiliereService,
    private authService: AuthService,
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
        title: 'Gestion des matieres',
        count: 'matieres enregistrees',
        new_item: 'Nouvelle matiere',
        add_item: 'Ajouter une matiere',
        edit_item: 'Modifier une matiere',
        subject_name: 'Nom de la matiere',
        code: 'Code',
        teaching_type: "Type d'enseignement",
        coefficient: 'Coefficient',
        volume: 'Volume',
        actions: 'Actions',
        cancel: 'Annuler',
        save: 'Sauvegarder',
        empty: 'Aucune matiere enregistree',
        load_error: 'Erreur de chargement',
        required_error: 'Nom et code sont obligatoires',
        updated: 'Matiere mise a jour',
        created: 'Matiere creee',
        generic_error: 'Erreur',
        delete_confirm: 'Supprimer cette matiere ?',
        delete_error: 'Erreur suppression',
        placeholder_name: 'Ex: Algorithmique',
        placeholder_code: 'Ex: ALGO-101',
        placeholder_coefficient: 'Ex: 3',
        empty_dash: '-'
      },
      en: {
        title: 'Subject management',
        count: 'subjects recorded',
        new_item: 'New subject',
        add_item: 'Add a subject',
        edit_item: 'Edit a subject',
        subject_name: 'Subject name',
        code: 'Code',
        teaching_type: 'Teaching type',
        coefficient: 'Coefficient',
        volume: 'Hours',
        actions: 'Actions',
        cancel: 'Cancel',
        save: 'Save',
        empty: 'No subject recorded',
        load_error: 'Loading error',
        required_error: 'Name and code are required',
        updated: 'Subject updated',
        created: 'Subject created',
        generic_error: 'Error',
        delete_confirm: 'Delete this subject?',
        delete_error: 'Delete error',
        placeholder_name: 'Example: Algorithms',
        placeholder_code: 'Example: ALGO-101',
        placeholder_coefficient: 'Example: 3',
        empty_dash: '-'
      },
      ar: {
        title: 'إدارة المواد',
        count: 'مواد مسجلة',
        new_item: 'مادة جديدة',
        add_item: 'إضافة مادة',
        edit_item: 'تعديل مادة',
        subject_name: 'اسم المادة',
        code: 'الرمز',
        teaching_type: 'نوع التدريس',
        coefficient: 'المعامل',
        volume: 'الحجم الساعي',
        actions: 'الإجراءات',
        cancel: 'إلغاء',
        save: 'حفظ',
        empty: 'لا توجد مواد مسجلة',
        load_error: 'خطأ أثناء التحميل',
        required_error: 'الاسم والرمز إجباريان',
        updated: 'تم تحديث المادة',
        created: 'تم إنشاء المادة',
        generic_error: 'خطأ',
        delete_confirm: 'هل تريد حذف هذه المادة؟',
        delete_error: 'خطأ أثناء الحذف',
        placeholder_name: 'مثال: الخوارزميات',
        placeholder_code: 'مثال: ALGO-101',
        placeholder_coefficient: 'مثال: 3',
        empty_dash: '-'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

  ngOnInit() {
    if (this.authService.getRole() !== 'ADMIN') {
      this.router.navigate(['/chat']);
      return;
    }
    this.loadMatieres();
    this.loadFilieres();
  }

  loadMatieres() {
    this.matiereService.getAll().subscribe({
      next: (data) => this.matieres = data,
      error: () => this.errorMessage = this.text('load_error')
    });
  }

  loadFilieres() {
    this.filiereService.getAll().subscribe({
      next: (data) => this.filieres = data
    });
  }

  openAdd() {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEdit(m: any) {
    this.nom = m.nom;
    this.code = m.code;
    this.coefficient = m.coefficient;
    this.volumeHoraire = m.volumeHoraire;
    this.type = m.type || 'CM';
    this.filiereId = m.filiere?.id || null;
    this.editId = m.id;
    this.showForm = true;
    this.editMode = true;
  }

  save() {
    this.errorMessage = '';
    if (!this.nom || !this.code) { this.errorMessage = this.text('required_error'); return; }

    const data: any = {
      nom: this.nom, code: this.code, coefficient: this.coefficient,
      volumeHoraire: this.volumeHoraire, type: this.type, filiereId: this.filiereId
    };

    if (this.editMode && this.editId) {
      this.matiereService.update(this.editId, data).subscribe({
        next: () => { this.successMessage = this.text('updated'); this.loadMatieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || this.text('generic_error')
      });
    } else {
      this.matiereService.create(data).subscribe({
        next: () => { this.successMessage = this.text('created'); this.loadMatieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || this.text('generic_error')
      });
    }
  }

  deleteMatiere(id: number) {
    if (confirm(this.text('delete_confirm'))) {
      this.matiereService.delete(id).subscribe({
        next: () => this.loadMatieres(),
        error: () => this.errorMessage = this.text('delete_error')
      });
    }
  }

  getTypeLabel(t: string): string {
    const labels: Record<string, Record<string, string>> = {
      CM: { fr: 'Cours magistral', en: 'Lecture', ar: 'محاضرة' },
      TD: { fr: 'Travaux diriges', en: 'Tutorial', ar: 'أعمال موجهة' },
      TP: { fr: 'Travaux pratiques', en: 'Lab work', ar: 'أعمال تطبيقية' }
    };
    return labels[t]?.[this.currentLang] || t;
  }

  resetForm() {
    this.nom = ''; this.code = ''; this.coefficient = null;
    this.volumeHoraire = null; this.type = 'CM'; this.filiereId = null;
    this.editId = null; this.errorMessage = ''; this.successMessage = '';
  }

  cancel() { this.showForm = false; this.resetForm(); }
  goBack() { this.router.navigate(['/admin']); }
}
