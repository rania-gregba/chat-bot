import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // permet à Angular d'envoyer des requêtes HTTP
    // vers ton Backend Spring Boot
    provideHttpClient(),
    // permet les animations Angular Material
    provideAnimations()
  ]
};