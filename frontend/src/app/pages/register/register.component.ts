import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  selectedRole = '';

  // ===== IDENTIFIANTS (fournis par l'admin) =====
  studentUniqueId = '';
  profUniqueId = '';

  // ===== INFOS PERSONNELLES =====
  firstName = '';
  lastName = '';
  email = '';
  cin = '';
  phone = '';
  address = '';
  gender = '';

  // ===== INFOS ACADEMIQUES =====
  fieldOfStudy = '';
  bacType = '';
  scholarship = '';
  department = '';

  // ===== COMPTE =====
  username = '';
  password = '';
  confirmPassword = '';
  isConfirmed = false;

  // ===== UI STATE =====
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
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



  t(key: string): string {
    return this.languageService.t(key);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onIdentifierChange(value: string) {
    if (this.selectedRole === 'USER') {
      this.studentUniqueId = value;
    } else {
      this.profUniqueId = value;
    }
  }

  get isStudentIdValid(): boolean {
    return this.studentUniqueId.trim().length >= 4;
  }

  get isProfIdValid(): boolean {
    return this.profUniqueId.trim().length >= 4;
  }

  // ============================================
  // INSCRIPTION
  // ============================================
  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation du rôle
    if (!this.selectedRole) {
      this.errorMessage = this.currentLang === 'en' ? 'Please choose a role (Student or Professor)' : 'Veuillez choisir un rôle (Étudiant ou Professeur)';
      return;
    }

    // Validation identifiant
    const studentId = this.studentUniqueId.trim();
    const profId = this.profUniqueId.trim();

    if (this.selectedRole === 'USER') {
      if (!studentId) {
        this.errorMessage = this.currentLang === 'en' ? 'Student ID is required' : 'L\'identifiant étudiant est obligatoire';
        return;
      }
    }

    if (this.selectedRole === 'PROFESSEUR') {
      if (!profId) {
        this.errorMessage = this.currentLang === 'en' ? 'Professor ID is required' : 'L\'identifiant professeur est obligatoire';
        return;
      }
    }

    // Validation infos personnelles
    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'L\'adresse email est obligatoire';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errorMessage = 'Veuillez entrer une adresse email valide';
      return;
    }
    if (!this.cin || !this.cin.trim()) {
      this.errorMessage = 'Le numéro CIN est obligatoire';
      return;
    }

    // Validation compte
    if (!this.username || !this.username.trim()) {
      this.errorMessage = 'Le nom d\'utilisateur est obligatoire';
      return;
    }
    if (this.username.trim().length < 3) {
      this.errorMessage = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      return;
    }
    if (!this.password) {
      this.errorMessage = 'Le mot de passe est obligatoire';
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au minimum 6 caractères';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }
    if (!this.isConfirmed) {
      this.errorMessage = this.t('register.accept_terms');
      return;
    }

    this.isLoading = true;

    const userData = {
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password,
      cin: this.cin.trim(),

      // 🔥 FIX 1 : envoyer 'identifier' (pas 'studentId')
      identifier: this.selectedRole === 'USER' ? studentId : profId,

      // 🔥 FIX 2 : convertir 'USER' → 'STUDENT' pour le backend
      role: this.selectedRole === 'USER' ? 'STUDENT' : 'PROFESSEUR',

      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
      gender: this.gender,
      fieldOfStudy: this.fieldOfStudy,
      bacType: this.bacType,
      scholarship: this.scholarship,
      department: this.department
    };

    this.authService.register(userData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = this.t('register.success');
        this.authService.saveToken(res.token);
        this.authService.saveUserInfo(res.username, res.role);
        setTimeout(() => {
          if (res.role === 'PROFESSEUR') {
            this.router.navigate(['/professeur']);
          } else {
            this.router.navigate(['/etudiant']);
          }
        }, 1600);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors de l\'inscription. Vérifiez vos informations.';
      }
    });
  }
}