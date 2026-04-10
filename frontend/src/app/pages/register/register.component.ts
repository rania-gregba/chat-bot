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

  studentUniqueId = '';
  profUniqueId = '';

  firstName = '';
  lastName = '';
  email = '';
  cin = '';
  phone = '';
  address = '';
  gender = '';

  fieldOfStudy = '';
  bacType = '';
  scholarship = '';
  department = '';

  username = '';
  password = '';
  confirmPassword = '';
  isConfirmed = false;

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

  private localized(fr: string, en: string, ar: string): string {
    if (this.currentLang === 'en') return en;
    if (this.currentLang === 'ar') return ar;
    return fr;
  }

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        cs: 'Informatique / Computer Science',
        management: 'Gestion / Management',
        engineering: 'Ingenierie / Engineering',
        law: 'Droit / Law',
        sciences: 'Sciences',
        technical: 'Technique / Technical',
        math: 'Math',
        eco: 'Eco-Gestion / Economics',
        dept_placeholder: 'Ex: Informatique et IA'
      },
      en: {
        cs: 'Computer Science',
        management: 'Management',
        engineering: 'Engineering',
        law: 'Law',
        sciences: 'Science',
        technical: 'Technical',
        math: 'Mathematics',
        eco: 'Economics and Management',
        dept_placeholder: 'Example: Computer Science and AI'
      },
      ar: {
        cs: 'إعلامية',
        management: 'تصرف',
        engineering: 'هندسة',
        law: 'قانون',
        sciences: 'علوم',
        technical: 'تقني',
        math: 'رياضيات',
        eco: 'اقتصاد وتصرف',
        dept_placeholder: 'مثال: إعلامية وذكاء اصطناعي'
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
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

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedRole) {
      this.errorMessage = this.localized(
        'Veuillez choisir un role (Etudiant ou Professeur)',
        'Please choose a role (Student or Professor)',
        'الرجاء اختيار دورك (طالب أو أستاذ)'
      );
      return;
    }

    const studentId = this.studentUniqueId.trim();
    const profId = this.profUniqueId.trim();

    if (this.selectedRole === 'USER' && !studentId) {
      this.errorMessage = this.localized(
        'L\'identifiant etudiant est obligatoire',
        'Student ID is required',
        'معرف الطالب إجباري'
      );
      return;
    }

    if (this.selectedRole === 'PROFESSEUR' && !profId) {
      this.errorMessage = this.localized(
        'L\'identifiant professeur est obligatoire',
        'Professor ID is required',
        'معرف الأستاذ إجباري'
      );
      return;
    }

    if (!this.email || !this.email.trim()) {
      this.errorMessage = this.localized(
        'L\'adresse email est obligatoire',
        'Email address is required',
        'البريد الإلكتروني إجباري'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errorMessage = this.localized(
        'Veuillez entrer une adresse email valide',
        'Please enter a valid email address',
        'الرجاء إدخال بريد إلكتروني صحيح'
      );
      return;
    }

    if (!this.cin || !this.cin.trim()) {
      this.errorMessage = this.localized(
        'Le numero CIN est obligatoire',
        'National ID number is required',
        'رقم بطاقة التعريف إجباري'
      );
      return;
    }

    if (!this.username || !this.username.trim()) {
      this.errorMessage = this.localized(
        'Le nom d\'utilisateur est obligatoire',
        'Username is required',
        'اسم المستخدم إجباري'
      );
      return;
    }

    if (this.username.trim().length < 3) {
      this.errorMessage = this.localized(
        'Le nom d\'utilisateur doit contenir au moins 3 caracteres',
        'Username must contain at least 3 characters',
        'يجب أن يحتوي اسم المستخدم على 3 أحرف على الأقل'
      );
      return;
    }

    if (!this.password) {
      this.errorMessage = this.localized(
        'Le mot de passe est obligatoire',
        'Password is required',
        'كلمة المرور إجبارية'
      );
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = this.localized(
        'Le mot de passe doit contenir au minimum 6 caracteres',
        'Password must contain at least 6 characters',
        'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل'
      );
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = this.localized(
        'Les mots de passe ne correspondent pas',
        'Passwords do not match',
        'كلمتا المرور غير متطابقتين'
      );
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
      identifier: this.selectedRole === 'USER' ? studentId : profId,
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
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          this.localized(
            'Erreur lors de l\'inscription. Verifiez vos informations.',
            'Registration failed. Please check your information.',
            'حدث خطأ أثناء التسجيل. يرجى التأكد من بياناتك.'
          );
      }
    });
  }
}
