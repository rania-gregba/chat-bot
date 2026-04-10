import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  currentLang = 'fr';

  rememberMe = false;

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

  text(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        password_placeholder: 'Mot de passe',
      },
      en: {
        password_placeholder: 'Password',
      },
      ar: {
        password_placeholder: 'كلمة المرور',
      }
    };

    return translations[this.currentLang]?.[key] || translations['fr'][key] || key;
  }

  onLogin() {
    const username = this.username?.trim();
    const password = this.password?.trim();

    if (!username || !password) {
      this.errorMessage = this.t('login.empty_fields') || 'Veuillez remplir tous les champs';
      return;
    }

    localStorage.setItem('rememberMe', this.rememberMe.toString());

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(username, password).subscribe({
      next: (response: any) => {
        console.log('Login successful', response);
        this.authService.saveToken(response.token);
        this.authService.saveUserInfo(response.username, response.role);

        this.authService.getStudentProfile().subscribe({
          next: (profile: any) => {
            this.authService.saveStudentProfile(profile);
            this.isLoading = false;
            
            if (response.role === 'ADMIN') {
              this.router.navigate(['/admin']);
            } else if (response.role === 'PROFESSEUR') {
              this.router.navigate(['/professeur']);
            } else {
              this.router.navigate(['/etudiant']);
            }
          },
          error: (errProfile: any) => {
            console.error('Profile fetch failed, navigating anyway', errProfile);
            this.isLoading = false;
            if (response.role === 'ADMIN') {
              this.router.navigate(['/admin']);
            } else if (response.role === 'PROFESSEUR') {
              this.router.navigate(['/professeur']);
            } else {
              this.router.navigate(['/etudiant']);
            }
          }
        });
      },
      error: (err: any) => {
        console.error('Login Error: ', err);
        this.isLoading = false;
        this.errorMessage = this.t('login.error') || "Nom d'utilisateur ou mot de passe incorrect. Vérifiez vos informations.";
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}


