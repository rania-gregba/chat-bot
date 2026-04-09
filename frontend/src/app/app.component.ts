import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { LanguageService } from './services/language.service';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private router = inject(Router);
  public languageService = inject(LanguageService);
  public authService = inject(AuthService);

  pageTitle = 'Portail FASTO';
  currentLang = this.languageService.getLanguage();

  constructor() {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.updatePageTitle();
    });

    // Dynamic page title based on route
    this.router.events.subscribe(() => {
      this.updatePageTitle();
    });
  }

  private updatePageTitle() {
    const url = this.router.url;
    if (url === '/admin') {
      this.pageTitle = this.languageService.t('page.admin');
    } else if (url === '/chat') {
      this.pageTitle = this.languageService.t('page.chat');
    } else if (url === '/login') {
      this.pageTitle = this.languageService.t('page.login');
    } else if (url === '/register') {
      this.pageTitle = this.languageService.t('page.register');
    } else {
      this.pageTitle = this.languageService.t('page.default');
    }
  }


}
