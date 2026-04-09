import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService, Lang } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() pageTitle = 'Portail FASTO';
  @Input() notifications = 0;
  @Input() userName = 'Utilisateur';
  @Input() userInitials = 'U';
  @Input() currentLang: string = 'fr';
  @Input() isAdmin = false;

  @Output() languageToggled = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  showProfileMenu = false;
  showLangMenu = false;

  availableLanguages: { code: Lang; label: string; flag: string }[] = [];

  constructor(
    public languageService: LanguageService,
    private authService: AuthService,
    private router: Router
  ) {
    this.availableLanguages = this.languageService.getAvailableLanguages();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getCurrentLangFlag(): string {
    const lang = this.availableLanguages.find(l => l.code === this.currentLang);
    return lang?.flag || '🇫🇷';
  }

  getCurrentLangLabel(): string {
    const lang = this.availableLanguages.find(l => l.code === this.currentLang);
    return lang?.label || 'Français';
  }

  selectLanguage(code: Lang) {
    this.languageService.setLanguage(code);
    this.showLangMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showLangMenu = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.logoutRequested.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-dropdown-wrapper')) {
      this.showLangMenu = false;
    }
    if (!target.closest('.user-profile') && !target.closest('.profile-dropdown')) {
      this.showProfileMenu = false;
    }
  }
}
