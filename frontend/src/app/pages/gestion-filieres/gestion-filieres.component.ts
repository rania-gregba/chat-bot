import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FiliereService } from '../../services/filiere.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-gestion-filieres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-filieres.component.html',
  styleUrl: './gestion-filieres.component.css'
})
export class GestionFilieresComponent implements OnInit {

  filieres: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  // Formulaire
  nom = '';
  code = '';
  niveau = '';
  departement = '';
  capaciteMax: number | null = null;
  description = '';

  errorMessage = '';
  successMessage = '';
  currentLang = 'fr';

  constructor(
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
        title: 'Gestion des filieres',
        count: 'filieres enregistrees',
        new_item: 'Nouvelle filiere',
        add_item: 'Ajouter une filiere',
        edit_item: 'Modifier une filiere',
        name: 'Nom',
        code: 'Code',
        level: 'Niveau',
        select: 'Selectionner',
        department: 'Departement',
        capacity: 'Capacite max',
        description: 'Description',
        cancel: 'Annuler',
        save: 'Sauvegarder',
        actions: 'Actions',
        empty: 'Aucune filiere enregistree',
        load_error: 'Erreur de chargement',
        required_error: 'Nom et code sont obligatoires',
        updated: 'Filiere mise a jour',
        created: 'Filiere creee',
        generic_error: 'Erreur',
        delete_confirm: 'Supprimer cette filiere ?',
        delete_error: 'Erreur suppression',
        placeholder_name: 'Ex: Informatique',
        placeholder_code: 'Ex: INFO-L1',
        placeholder_department: 'Ex: Sciences',
        placeholder_capacity: 'Ex: 40',
        placeholder_description: 'Description de la filiere...',
        empty_dash: '-'
      },
      en: {
        title: 'Program management',
        count: 'saved programs',
        new_item: 'New program',
        add_item: 'Add a program',
        edit_item: 'Edit a program',
        name: 'Name',
        code: 'Code',
        level: 'Level',
        select: 'Select',
        department: 'Department',
        capacity: 'Max capacity',
        description: 'Description',
        cancel: 'Cancel',
        save: 'Save',
        actions: 'Actions',
        empty: 'No program recorded',
        load_error: 'Loading error',
        required_error: 'Name and code are required',
        updated: 'Program updated',
        created: 'Program created',
        generic_error: 'Error',
        delete_confirm: 'Delete this program?',
        delete_error: 'Delete error',
        placeholder_name: 'Example: Computer Science',
        placeholder_code: 'Example: CS-L1',
        placeholder_department: 'Example: Sciences',
        placeholder_capacity: 'Example: 40',
        placeholder_description: 'Program description...',
        empty_dash: '-'
      },
      ar: {
        title: 'إدارة الاختصاصات',
        count: 'اختصاصات مسجلة',
        new_item: 'اختصاص جديد',
        add_item: 'إضافة اختصاص',
        edit_item: 'تعديل اختصاص',
        name: 'الاسم',
        code: 'الرمز',
        level: 'المستوى',
        select: 'اختر',
        department: 'القسم',
        capacity: 'الطاقة القصوى',
        description: 'الوصف',
        cancel: 'إلغاء',
        save: 'حفظ',
        actions: 'الإجراءات',
        empty: 'لا توجد اختصاصات مسجلة',
        load_error: 'خطأ أثناء التحميل',
        required_error: 'الاسم والرمز إجباريان',
        updated: 'تم تحديث الاختصاص',
        created: 'تم إنشاء الاختصاص',
        generic_error: 'خطأ',
        delete_confirm: 'هل تريد حذف هذا الاختصاص؟',
        delete_error: 'خطأ أثناء الحذف',
        placeholder_name: 'مثال: إعلامية',
        placeholder_code: 'مثال: INFO-L1',
        placeholder_department: 'مثال: علوم',
        placeholder_capacity: 'مثال: 40',
        placeholder_description: 'وصف الاختصاص...',
        empty_dash: '-'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

  getLevelLabel(value: string): string {
    const labels: Record<string, Record<string, string>> = {
      'Licence 1': { fr: 'Licence 1', en: 'Bachelor 1', ar: 'إجازة 1' },
      'Licence 2': { fr: 'Licence 2', en: 'Bachelor 2', ar: 'إجازة 2' },
      'Licence 3': { fr: 'Licence 3', en: 'Bachelor 3', ar: 'إجازة 3' },
      'Master 1': { fr: 'Master 1', en: 'Master 1', ar: 'ماجستير 1' },
      'Master 2': { fr: 'Master 2', en: 'Master 2', ar: 'ماجستير 2' }
    };

    return labels[value]?.[this.currentLang] || value || this.text('empty_dash');
  }

  ngOnInit() {
    if (this.authService.getRole() !== 'ADMIN') {
      this.router.navigate(['/chat']);
      return;
    }
    this.loadFilieres();
  }

  loadFilieres() {
    this.filiereService.getAll().subscribe({
      next: (data) => this.filieres = data,
      error: () => this.errorMessage = this.text('load_error')
    });
  }

  openAdd() {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEdit(f: any) {
    this.nom = f.nom;
    this.code = f.code;
    this.niveau = f.niveau || '';
    this.departement = f.departement || '';
    this.capaciteMax = f.capaciteMax;
    this.description = f.description || '';
    this.editId = f.id;
    this.showForm = true;
    this.editMode = true;
  }

  save() {
    this.errorMessage = '';
    if (!this.nom || !this.code) {
      this.errorMessage = this.text('required_error');
      return;
    }

    const data = {
      nom: this.nom, code: this.code, niveau: this.niveau,
      departement: this.departement, capaciteMax: this.capaciteMax,
      description: this.description
    };

    if (this.editMode && this.editId) {
      this.filiereService.update(this.editId, data).subscribe({
        next: () => { this.successMessage = this.text('updated'); this.loadFilieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || this.text('generic_error')
      });
    } else {
      this.filiereService.create(data).subscribe({
        next: () => { this.successMessage = this.text('created'); this.loadFilieres(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || this.text('generic_error')
      });
    }
  }

  deleteFiliere(id: number) {
    if (confirm(this.text('delete_confirm'))) {
      this.filiereService.delete(id).subscribe({
        next: () => this.loadFilieres(),
        error: () => this.errorMessage = this.text('delete_error')
      });
    }
  }

  resetForm() {
    this.nom = ''; this.code = ''; this.niveau = '';
    this.departement = ''; this.capaciteMax = null;
    this.description = ''; this.editId = null;
    this.errorMessage = ''; this.successMessage = '';
  }

  cancel() { this.showForm = false; this.resetForm(); }
  goBack() { this.router.navigate(['/admin']); }
}
