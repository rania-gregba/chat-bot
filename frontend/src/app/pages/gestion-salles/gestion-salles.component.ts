import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalleService } from '../../services/salle.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-gestion-salles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-salles.component.html',
  styleUrl: './gestion-salles.component.css'
})
export class GestionSallesComponent implements OnInit {

  salles: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  nom = '';
  code = '';
  capacite: number | null = null;
  type = 'SALLE_TD';
  disponible = true;
  localisation = '';
  equipements = '';

  errorMessage = '';
  successMessage = '';
  currentLang = 'fr';

  types = ['AMPHI', 'SALLE_TD', 'LABO', 'SALLE_INFO', 'SALLE_REUNION'];

  constructor(
    private salleService: SalleService,
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
        title: 'Gestion des salles',
        count: 'salles repertoriees',
        new_item: 'Nouvelle salle',
        add_item: 'Ajouter une salle',
        edit_item: 'Modifier une salle',
        room_name: 'Nom de la salle',
        code: 'Code / ID',
        room_type: 'Type de salle',
        capacity: 'Capacite',
        actions: 'Actions',
        cancel: 'Annuler',
        save: 'Sauvegarder',
        empty: 'Aucune salle repertoriee',
        load_error: 'Erreur de chargement',
        required_error: 'Le nom est obligatoire',
        updated: 'Salle mise a jour',
        created: 'Salle creee',
        generic_error: 'Erreur',
        delete_confirm: 'Supprimer cette salle ?',
        delete_error: 'Erreur suppression',
        placeholder_name: 'Ex: Amphi A, Salle 101',
        placeholder_code: 'Ex: S-101',
        placeholder_capacity: 'Ex: 50',
        people_suffix: 'pers.',
        empty_dash: '-'
      },
      en: {
        title: 'Room management',
        count: 'rooms listed',
        new_item: 'New room',
        add_item: 'Add a room',
        edit_item: 'Edit a room',
        room_name: 'Room name',
        code: 'Code / ID',
        room_type: 'Room type',
        capacity: 'Capacity',
        actions: 'Actions',
        cancel: 'Cancel',
        save: 'Save',
        empty: 'No room listed',
        load_error: 'Loading error',
        required_error: 'Room name is required',
        updated: 'Room updated',
        created: 'Room created',
        generic_error: 'Error',
        delete_confirm: 'Delete this room?',
        delete_error: 'Delete error',
        placeholder_name: 'Example: Hall A, Room 101',
        placeholder_code: 'Example: S-101',
        placeholder_capacity: 'Example: 50',
        people_suffix: 'people',
        empty_dash: '-'
      },
      ar: {
        title: 'إدارة القاعات',
        count: 'قاعات مدرجة',
        new_item: 'قاعة جديدة',
        add_item: 'إضافة قاعة',
        edit_item: 'تعديل قاعة',
        room_name: 'اسم القاعة',
        code: 'الرمز / المعرف',
        room_type: 'نوع القاعة',
        capacity: 'السعة',
        actions: 'الإجراءات',
        cancel: 'إلغاء',
        save: 'حفظ',
        empty: 'لا توجد قاعات مدرجة',
        load_error: 'خطأ أثناء التحميل',
        required_error: 'اسم القاعة إجباري',
        updated: 'تم تحديث القاعة',
        created: 'تم إنشاء القاعة',
        generic_error: 'خطأ',
        delete_confirm: 'هل تريد حذف هذه القاعة؟',
        delete_error: 'خطأ أثناء الحذف',
        placeholder_name: 'مثال: مدرج أ، قاعة 101',
        placeholder_code: 'مثال: S-101',
        placeholder_capacity: 'مثال: 50',
        people_suffix: 'شخص',
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
    this.loadSalles();
  }

  loadSalles() {
    this.salleService.getAll().subscribe({
      next: (data) => this.salles = data,
      error: () => this.errorMessage = this.text('load_error')
    });
  }

  openAdd() {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEdit(s: any) {
    this.nom = s.nom;
    this.code = s.code || '';
    this.capacite = s.capacite;
    this.type = s.type || 'SALLE_TD';
    this.disponible = s.disponible !== false;
    this.localisation = s.localisation || '';
    this.equipements = s.equipements || '';
    this.editId = s.id;
    this.showForm = true;
    this.editMode = true;
  }

  save() {
    this.errorMessage = '';
    if (!this.nom) { this.errorMessage = this.text('required_error'); return; }

    const data = {
      nom: this.nom, code: this.code, capacite: this.capacite, type: this.type,
      disponible: this.disponible, localisation: this.localisation,
      equipements: this.equipements
    };

    if (this.editMode && this.editId) {
      this.salleService.update(this.editId, data).subscribe({
        next: () => { this.successMessage = this.text('updated'); this.loadSalles(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || this.text('generic_error')
      });
    } else {
      this.salleService.create(data).subscribe({
        next: () => { this.successMessage = this.text('created'); this.loadSalles(); this.showForm = false; },
        error: (e) => this.errorMessage = e.error?.error || this.text('generic_error')
      });
    }
  }

  deleteSalle(id: number) {
    if (confirm(this.text('delete_confirm'))) {
      this.salleService.delete(id).subscribe({
        next: () => this.loadSalles(),
        error: () => this.errorMessage = this.text('delete_error')
      });
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, Record<string, string>> = {
      AMPHI: { fr: 'Amphitheatre', en: 'Lecture hall', ar: 'مدرج' },
      SALLE_TD: { fr: 'Salle TD', en: 'Classroom', ar: 'قاعة دروس' },
      LABO: { fr: 'Laboratoire', en: 'Laboratory', ar: 'مخبر' },
      SALLE_INFO: { fr: 'Salle informatique', en: 'Computer room', ar: 'قاعة إعلامية' },
      SALLE_REUNION: { fr: 'Salle de reunion', en: 'Meeting room', ar: 'قاعة اجتماعات' }
    };
    return labels[type]?.[this.currentLang] || type;
  }

  resetForm() {
    this.nom = ''; this.code = ''; this.capacite = null; this.type = 'SALLE_TD';
    this.disponible = true; this.localisation = ''; this.equipements = '';
    this.editId = null; this.errorMessage = ''; this.successMessage = '';
  }

  cancel() { this.showForm = false; this.resetForm(); }
  goBack() { this.router.navigate(['/admin']); }
}
