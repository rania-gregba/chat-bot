import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ChatComponent } from './pages/chat/chat.component';
import { AdminComponent } from './pages/admin/admin.component';
import { PlanningComponent } from './pages/planning/planning.component';
import { GestionFilieresComponent } from './pages/gestion-filieres/gestion-filieres.component';
import { GestionSallesComponent } from './pages/gestion-salles/gestion-salles.component';
import { GestionMatieresComponent } from './pages/gestion-matieres/gestion-matieres.component';

import { EtudiantComponent } from './pages/etudiant/etudiant.component';
import { ProfesseurComponent } from './pages/professeur/professeur.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'etudiant', component: EtudiantComponent },
  { path: 'professeur', component: ProfesseurComponent },
  { path: 'chat', redirectTo: '/etudiant' },
  { path: 'admin', component: AdminComponent },
  { path: 'planning', component: PlanningComponent },
  { path: 'gestion/filieres', component: GestionFilieresComponent },
  { path: 'gestion/salles', component: GestionSallesComponent },
  { path: 'gestion/matieres', component: GestionMatieresComponent },
  { path: '**', redirectTo: '/login' }
];