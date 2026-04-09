import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService, ChatRequest, ChatResponse } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { LanguageService } from '../../services/language.service';

interface Message {
  text: string;
  isUser: boolean;
  time: string;
  intention?: string;
  showDocumentForm?: boolean;
  docId?: number;
  sources?: string[];
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  userMessage = '';
  messages: Message[] = [];
  username = '';
  isTyping = false;
  isAdmin = false;
  currentLang = 'fr';

  // Rôle utilisateur — clé pour la sidebar adaptative
  userRole = '';

  // Profil étudiant
  studentProfile: any = null;
  showProfilePanel = false;

  // Historique des conversations
  chats: ChatSession[] = [];
  activeChatId: number | null = null;
  nextChatId = 1;
  isSidebarOpen = true;

  // Formulaire document
  showForm = false;
  documentType = 'certificat_scolarite';
  fullName = '';
  additionalInfo = '';
  documentFormat = 'PDF';
  isGenerating = false;
  generatedDocId: number | null = null;

  // Champs dynamiques du formulaire
  companyName = '';
  jobTitle = '';
  startDate = '';
  salary = '';
  address = '';
  cin = '';
  clientName = '';
  amount = '';
  schoolName = '';
  birthDate = '';
  birthPlace = '';
  nationality = '';
  academicYear = '';
  internshipCompany = '';
  internshipDuration = '';
  requestedLeaveType = '';
  leaveStartDate = '';
  leaveEndDate = '';
  phoneNumber = '';
  email = '';
  fatherName = '';
  motherName = '';

  // Suggestions rapides — translation keys
  quickSuggestionKeys = [
    'suggestion.timetable',
    'suggestion.certificate',
    'suggestion.grades',
    'suggestion.scholarships',
    'suggestion.programs',
    'suggestion.registration',
    'suggestion.calendar',
    'suggestion.rules'
  ];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private documentService: DocumentService,
    public router: Router,
    public languageService: LanguageService
  ) {
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.username = this.authService.getUsername() || 'Utilisateur';

    // Récupérer le rôle et l'adapter
    const role = this.authService.getRole() || 'ETUDIANT';
    this.userRole = role.toUpperCase();
    this.isAdmin = this.userRole === 'ADMIN';

    // Charger le profil étudiant
    this.studentProfile = this.authService.getStoredProfile();
    if (!this.studentProfile) {
      this.authService.getStudentProfile().subscribe({
        next: (profile) => {
          this.studentProfile = profile;
          this.authService.saveStudentProfile(profile);
        },
        error: () => {
          console.log('Profil non disponible');
        }
      });
    }

    // Pré-remplir fullName depuis le profil
    if (this.studentProfile) {
      this.fullName = `${this.studentProfile.firstName || ''} ${this.studentProfile.lastName || ''}`.trim();
    }

    this.loadChatsFromStorage();
    if (this.chats.length === 0) {
      this.createNewChat();
    } else {
      this.selectChat(this.chats[0].id);
    }
  }

  // ============================================
  // LABEL DU RÔLE pour la sidebar
  // ============================================
  getRoleLabel(): string {
    switch (this.userRole) {
      case 'ADMIN': return this.t('role.admin');
      case 'PROFESSEUR': return this.t('role.professor');
      default: return this.studentProfile?.fieldOfStudy || this.t('role.student');
    }
  }

  // ============================================
  // MESSAGE DE BIENVENUE PERSONNALISÉ
  // ============================================
  getWelcomeMessage(): string {
    if (this.studentProfile) {
      const firstName = this.studentProfile.firstName || this.username;
      const field = this.studentProfile.fieldOfStudy || '';
      const level = this.studentProfile.academicLevel || '';
      if (this.currentLang === 'en') {
        return `Hello ${firstName}! 👋 I am your administrative assistant.\n\n` +
               `📚 Program: ${field}${level ? ' — ' + level : ''}\n` +
               `🆔 Student ID: ${this.studentProfile.studentId || '—'}\n\n` +
               `How can I help you today?`;
      }
      if (this.currentLang === 'ar') {
        return `مرحبا ${firstName}! 👋 أنا مساعدك الإداري.\n\n` +
               `📚 التخصص: ${field}${level ? ' — ' + level : ''}\n` +
               `🆔 رقم الطالب: ${this.studentProfile.studentId || '—'}\n\n` +
               `كيف يمكنني مساعدتك اليوم؟`;
      }
      return `Bonjour ${firstName} ! 👋 Je suis votre assistant administratif.\n\n` +
             `📚 Filière : ${field}${level ? ' — ' + level : ''}\n` +
             `🆔 N° Étudiant : ${this.studentProfile.studentId || '—'}\n\n` +
             `Comment puis-je vous aider aujourd'hui ?`;
    }
    return this.t('chat.welcome');
  }

  // ============================================
  // GESTION DES CONVERSATIONS
  // ============================================
  saveChatsToStorage() {
    localStorage.setItem(`chats_${this.username}`, JSON.stringify(this.chats));
    localStorage.setItem(`nextChatId_${this.username}`, String(this.nextChatId));
  }

  loadChatsFromStorage() {
    const saved = localStorage.getItem(`chats_${this.username}`);
    const savedId = localStorage.getItem(`nextChatId_${this.username}`);
    if (saved) this.chats = JSON.parse(saved);
    if (savedId) this.nextChatId = parseInt(savedId, 10);
  }

  createNewChat() {
    const newChat: ChatSession = {
      id: this.nextChatId++,
      title: `Conversation ${this.chats.length + 1}`,
      messages: [],
      createdAt: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      })
    };
    this.chats.unshift(newChat);
    this.activeChatId = newChat.id;
    this.messages = newChat.messages;
    this.showForm = false;
    this.generatedDocId = null;
    this.resetFormFields();
    this.saveChatsToStorage();
  }

  selectChat(chatId: number) {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) return;
    this.activeChatId = chatId;
    this.messages = chat.messages;
    this.showForm = false;
    this.generatedDocId = null;
    this.resetFormFields();
    setTimeout(() => this.scrollToBottom(), 100);
  }

  deleteChat(chatId: number, event: Event) {
    event.stopPropagation();
    this.chats = this.chats.filter(c => c.id !== chatId);
    if (this.activeChatId === chatId) {
      if (this.chats.length > 0) this.selectChat(this.chats[0].id);
      else this.createNewChat();
    }
    this.saveChatsToStorage();
  }

  updateChatTitle(firstMsg: string) {
    const chat = this.chats.find(c => c.id === this.activeChatId);
    if (chat && chat.title.startsWith('Conversation')) {
      chat.title = firstMsg.length > 35 ? firstMsg.substring(0, 35) + '...' : firstMsg;
      this.saveChatsToStorage();
    }
  }

  resetFormFields() {
    this.additionalInfo = '';
    this.companyName = '';
    this.jobTitle = '';
    this.startDate = '';
    this.salary = '';
    this.address = '';
    this.cin = '';
    this.clientName = '';
    this.amount = '';
    this.schoolName = '';
    this.birthDate = '';
    this.birthPlace = '';
    this.nationality = '';
    this.academicYear = '';
    this.internshipCompany = '';
    this.internshipDuration = '';
    this.requestedLeaveType = '';
    this.leaveStartDate = '';
    this.leaveEndDate = '';
    this.phoneNumber = '';
    this.email = '';
    this.fatherName = '';
    this.motherName = '';

    if (this.studentProfile) {
      this.fullName = `${this.studentProfile.firstName || ''} ${this.studentProfile.lastName || ''}`.trim();
    } else {
      this.fullName = '';
    }
  }

  // ============================================
  // ENVOYER SUGGESTION RAPIDE
  // ============================================
  sendQuickSuggestion(suggestionKey: string) {
    const fullText = this.t(suggestionKey);
    const cleanText = fullText.replace(/^[\p{Emoji}\s]+/u, '').trim();
    this.userMessage = cleanText;
    this.sendMessage();
  }

  // ============================================
  // RÉPONDRE LOCALEMENT AUX QUESTIONS PROFIL
  // ============================================
  handleProfileQuestion(message: string): string | null {
    if (!this.studentProfile) return null;
    const msg = message.toLowerCase();

    if (msg.includes('emploi du temps') || msg.includes('horaire') || msg.includes('cours') ||
        msg.includes('timetable') || msg.includes('schedule') || msg.includes('classes')) {
      if (this.currentLang === 'en') {
        return `📅 **Timetable** — ${this.studentProfile.fieldOfStudy || ''} ${this.studentProfile.academicLevel || ''}\n\nTo view your complete timetable, please check the Planning page in the application.`;
      }
      return `📅 **Emploi du temps** — ${this.studentProfile.fieldOfStudy || ''} ${this.studentProfile.academicLevel || ''}\n\nPour consulter votre emploi du temps complet, veuillez vous rapprocher du secrétariat ou consulter l'espace ENT de votre faculté.`;
    }
    if (msg.includes('relevé') || msg.includes('notes') || msg.includes('résultat') ||
        msg.includes('transcript') || msg.includes('grades') || msg.includes('results')) {
      if (this.currentLang === 'en') {
        return `📊 **Transcript**\n\nStudent: ${this.studentProfile.firstName} ${this.studentProfile.lastName}\nProgram: ${this.studentProfile.fieldOfStudy || '—'} — ${this.studentProfile.academicLevel || '—'}\n\nTo get your official transcript, use the 📄 button below to generate a request.`;
      }
      return `📊 **Relevé de notes**\n\nEtudiant : ${this.studentProfile.firstName} ${this.studentProfile.lastName}\nFilière : ${this.studentProfile.fieldOfStudy || '—'} — ${this.studentProfile.academicLevel || '—'}\n\nPour obtenir votre relevé officiel, utilisez le bouton 📄 ci-dessous pour générer une demande.`;
    }
    if (msg.includes('attestation') || msg.includes('scolarité') || msg.includes('certificat') ||
        msg.includes('certificate') || msg.includes('enrollment')) {
      if (this.currentLang === 'en') {
        return `📄 **School Certificate**\n\nI can generate your enrollment certificate immediately.\nClick on 📄 or type "generate" to start the form.`;
      }
      return `📄 **Attestation de scolarité**\n\nJe peux générer votre certificat de scolarité immédiatement.\nCliquez sur 📄 ou tapez "générer" pour lancer le formulaire.`;
    }
    if (msg.includes('filière') || msg.includes('formation') || msg.includes('niveau') || msg.includes('spécialité') ||
        msg.includes('program') || msg.includes('major') || msg.includes('level') || msg.includes('field')) {
      if (this.currentLang === 'en') {
        return `🎓 **Your Program**\n\n• Field of Study: ${this.studentProfile.fieldOfStudy || '—'}\n• Level: ${this.studentProfile.academicLevel || '—'}`;
      }
      return `🎓 **Votre formation**\n\n• Filière : ${this.studentProfile.fieldOfStudy || '—'}\n• Niveau : ${this.studentProfile.academicLevel || '—'}`;
    }
    if (msg.includes('profil') || msg.includes('informations') || msg.includes('mon compte') || msg.includes('identifiant') ||
        msg.includes('profile') || msg.includes('my account') || msg.includes('info')) {
      if (this.currentLang === 'en') {
        return `👤 **Your Student Profile**\n\n• Name: ${this.studentProfile.firstName} ${this.studentProfile.lastName}\n• Student ID: ${this.studentProfile.studentId || '—'}\n• CIN: ${this.studentProfile.cin || '—'}\n• Email: ${this.studentProfile.email || '—'}\n• Phone: ${this.studentProfile.phone || '—'}`;
      }
      return `👤 **Votre profil étudiant**\n\n• Nom : ${this.studentProfile.firstName} ${this.studentProfile.lastName}\n• N° Étudiant : ${this.studentProfile.studentId || '—'}\n• CIN : ${this.studentProfile.cin || '—'}\n• Email : ${this.studentProfile.email || '—'}\n• Téléphone : ${this.studentProfile.phone || '—'}`;
    }
    return null;
  }

  // ============================================
  // CONTEXTE FORMULAIRE DOCUMENT
  // ============================================
  getFormContext(): string {
    const proDocs = ['attestation_travail', 'attestation_salaire', 'contrat_travail', 'fiche_paie', 'demande_conge', 'demande_mutation', 'note_service'];
    const stageDocs = ['attestation_stage', 'demande_stage'];
    const civilDocs = ['attestation_residence', 'demande_extrait_naissance', 'demande_cin', 'demande_passeport', 'declaration_honneur', 'copie_conforme'];
    const comDocs = ['facture', 'devis', 'bon_commande'];
    const schoolDocs = ['certificat_scolarite', 'attestation_presence', 'demande_releve_notes', 'demande_conge_academique'];
    const letterDocs = ['lettre_motivation', 'lettre_demande', 'lettre_reclamation', 'lettre_resiliation'];

    if (this.documentType === 'cv') return 'CV';
    if (proDocs.includes(this.documentType)) return 'PRO';
    if (stageDocs.includes(this.documentType)) return 'STAGE';
    if (civilDocs.includes(this.documentType)) return 'CIVIL';
    if (comDocs.includes(this.documentType)) return 'COM';
    if (schoolDocs.includes(this.documentType)) return 'SCHOOL';
    if (letterDocs.includes(this.documentType)) return 'LETTER';
    return 'GENERAL';
  }

  // ============================================
  // LANGUE
  // ============================================
  toggleLanguage() { this.languageService.toggleLanguage(); }
  t(key: string): string { return this.languageService.t(key); }

  // ============================================
  // EXTRACTION RÉPONSE BOT
  // ============================================
  private extractBotText(payload: any): string | null {
    if (!payload) return null;
    const text =
      payload?.answer ??
      payload?.final_answer ??
      payload?.rag_result?.answer ??
      payload?.response ??
      payload?.message;
    return typeof text === 'string' && text.trim() ? text : null;
  }

  private notifyIfQuotaReached(text: string | null) {
    if (!text) return;
    if (text.toLowerCase().includes('quota api atteint')) {
      alert('Service IA temporairement indisponible, réessayez plus tard');
    }
  }

  // ============================================
  // ENVOYER MESSAGE
  // ============================================
  sendMessage() {
    if (!this.userMessage.trim()) return;
    const message = this.userMessage;
    const isFirst = !this.messages.some(m => m.isUser);
    this.addUserMessage(message);
    if (isFirst) this.updateChatTitle(message);
    this.userMessage = '';

    // Réponse locale profil
    const localAnswer = this.handleProfileQuestion(message);
    if (localAnswer) {
      setTimeout(() => {
        this.addBotMessage(localAnswer);
        this.scrollToBottom();
      }, 500);
      return;
    }

    this.isTyping = true;
    const payload: ChatRequest = {
      message,
      language: this.currentLang,
      student_context: this.studentProfile || null,
      username: this.username
    };

    this.chatService.sendMessage(payload).subscribe({
      next: (response: ChatResponse) => {
        this.isTyping = false;

        const fallbackMsg = this.currentLang === 'en'
          ? "Sorry, I couldn't generate a clear response."
          : this.currentLang === 'ar'
            ? 'عذراً، لم أتمكن من إنشاء إجابة واضحة.'
            : "Désolé, je n'ai pas pu générer une réponse claire.";

        const botText = this.extractBotText(response) ?? fallbackMsg;

        this.notifyIfQuotaReached(botText);

        const intention =
          response?.intention ??
          response?.intent ??
          response?.rag_result?.intention;

        const sources = (response?.rag_result?.sources ?? [])
          .map((source: string | { title?: string; source?: string; url?: string }) => {
            if (typeof source === 'string') return source;
            if (source?.title) return source.title;
            if (source?.source) return source.source;
            if (source?.url) return source.url;
            return null;
          })
          .filter((s: string | null): s is string => !!s);

        const showForm = ['demande_attestation', 'demande_document', 'generation_document']
          .includes(String(intention || '').toLowerCase());

        this.addBotMessage(botText, intention, showForm, undefined, sources);
        this.scrollToBottom();
      },
      error: (error) => {
        this.isTyping = false;
        const fallbackMsg = this.currentLang === 'en'
          ? 'Sorry, an error occurred. Please try again.'
          : this.currentLang === 'ar'
            ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
            : 'Désolé, une erreur est survenue. Veuillez réessayer.';
        const botText =
          this.extractBotText(error?.error) ??
          this.extractBotText(error) ??
          fallbackMsg;
        this.notifyIfQuotaReached(botText);
        this.addBotMessage(botText);
        this.scrollToBottom();
      }
    });
    this.scrollToBottom();
  }

  // ============================================
  // GÉNÉRER DOCUMENT
  // ============================================
  generateDocument() {
    if (!this.fullName.trim()) {
      alert(this.t('doc.name_required'));
      return;
    }
    this.isGenerating = true;
    let richInfo = '';
    const ctx = this.getFormContext();

    // Auto-remplir depuis le profil
    if (this.studentProfile) {
      if (!this.cin && this.studentProfile.cin) this.cin = this.studentProfile.cin;
      if (!this.birthDate && this.studentProfile.birthDate) this.birthDate = this.studentProfile.birthDate;
      if (!this.birthPlace && this.studentProfile.birthPlace) this.birthPlace = this.studentProfile.birthPlace;
      if (!this.nationality && this.studentProfile.nationality) this.nationality = this.studentProfile.nationality;
      if (!this.address && this.studentProfile.address) this.address = this.studentProfile.address;
      if (!this.email && this.studentProfile.email) this.email = this.studentProfile.email;
      if (!this.phoneNumber && this.studentProfile.phone) this.phoneNumber = this.studentProfile.phone;
      if (!this.schoolName && this.studentProfile.previousSchool) this.schoolName = this.studentProfile.previousSchool;
      if (!this.academicYear) this.academicYear = '2024/2025';
      if (!this.jobTitle && this.studentProfile.fieldOfStudy)
        this.jobTitle = `${this.studentProfile.fieldOfStudy} — ${this.studentProfile.academicLevel}`;
    }

    if (ctx === 'PRO') {
      if (this.companyName)        richInfo += `Entreprise : ${this.companyName}\n`;
      if (this.jobTitle)           richInfo += `Poste : ${this.jobTitle}\n`;
      if (this.startDate)          richInfo += `Date début : ${this.startDate}\n`;
      if (this.salary)             richInfo += `Salaire : ${this.salary} DT\n`;
      if (this.requestedLeaveType) richInfo += `Type congé : ${this.requestedLeaveType}\n`;
      if (this.leaveStartDate)     richInfo += `Du : ${this.leaveStartDate}\n`;
      if (this.leaveEndDate)       richInfo += `Au : ${this.leaveEndDate}\n`;
    } else if (ctx === 'STAGE') {
      if (this.internshipCompany)  richInfo += `Entreprise de stage : ${this.internshipCompany}\n`;
      if (this.internshipDuration) richInfo += `Durée : ${this.internshipDuration}\n`;
      if (this.jobTitle)           richInfo += `Département : ${this.jobTitle}\n`;
      if (this.schoolName)         richInfo += `Établissement : ${this.schoolName}\n`;
    } else if (ctx === 'CIVIL') {
      if (this.cin)                richInfo += `CIN : ${this.cin}\n`;
      if (this.address)            richInfo += `Adresse : ${this.address}\n`;
      if (this.birthDate)          richInfo += `Date naissance : ${this.birthDate}\n`;
      if (this.birthPlace)         richInfo += `Lieu naissance : ${this.birthPlace}\n`;
      if (this.fatherName)         richInfo += `Père : ${this.fatherName}\n`;
      if (this.motherName)         richInfo += `Mère : ${this.motherName}\n`;
      if (this.nationality)        richInfo += `Nationalité : ${this.nationality}\n`;
    } else if (ctx === 'COM') {
      if (this.clientName)         richInfo += `Client : ${this.clientName}\n`;
      if (this.amount)             richInfo += `Montant : ${this.amount} DT\n`;
    } else if (ctx === 'SCHOOL') {
      if (this.schoolName)         richInfo += `Établissement : ${this.schoolName}\n`;
      if (this.academicYear)       richInfo += `Année universitaire : ${this.academicYear}\n`;
      if (this.jobTitle)           richInfo += `Filière/Niveau : ${this.jobTitle}\n`;
      if (this.studentProfile?.studentId) richInfo += `N° Étudiant : ${this.studentProfile.studentId}\n`;
    } else if (ctx === 'LETTER') {
      if (this.companyName)        richInfo += `Destinataire : ${this.companyName}\n`;
      if (this.jobTitle)           richInfo += `Objet : ${this.jobTitle}\n`;
      if (this.address)            richInfo += `Adresse : ${this.address}\n`;
      if (this.email)              richInfo += `Email : ${this.email}\n`;
      if (this.phoneNumber)        richInfo += `Téléphone : ${this.phoneNumber}\n`;
    } else if (ctx === 'CV') {
      if (this.jobTitle)           richInfo += `Poste recherché : ${this.jobTitle}\n`;
      if (this.email)              richInfo += `Email : ${this.email}\n`;
      if (this.phoneNumber)        richInfo += `Téléphone : ${this.phoneNumber}\n`;
      if (this.address)            richInfo += `Adresse : ${this.address}\n`;
      if (this.schoolName)         richInfo += `Formation : ${this.schoolName}\n`;
    }

    if (this.additionalInfo.trim()) richInfo += `\nInformations supplémentaires :\n${this.additionalInfo}`;

    this.documentService.generateDocument(
      this.documentType,
      this.fullName,
      richInfo,
      this.documentFormat,
      this.username
    ).subscribe({
      next: (response: any) => {
        this.isGenerating = false;
        this.generatedDocId = response.id;
        this.showForm = false;
        const successMsg = this.currentLang === 'en'
          ? `✅ Your document "${this.getDocumentLabel()}" has been generated successfully!\nClick the download button below.`
          : this.currentLang === 'ar'
            ? `✅ تم إنشاء الوثيقة "${this.getDocumentLabel()}" بنجاح!\nانقر على زر التحميل أدناه.`
            : `✅ Votre document "${this.getDocumentLabel()}" a été généré avec succès !\nCliquez sur le bouton télécharger ci-dessous.`;
        this.addBotMessage(successMsg, 'document_genere', false, response.id);
        this.scrollToBottom();
      },
      error: () => {
        this.isGenerating = false;
        this.addBotMessage(this.t('doc.error'));
      }
    });
  }

  // ============================================
  // LABEL DOCUMENT
  // ============================================
  getDocumentLabel(): string {
    const labels: { [key: string]: string } = {
      'attestation_travail': 'Attestation de travail',
      'attestation_salaire': 'Attestation de salaire',
      'attestation_stage': 'Attestation de stage',
      'attestation_residence': 'Attestation de résidence',
      'certificat_scolarite': 'Certificat de scolarité',
      'copie_conforme': 'Copie conforme',
      'lettre_demande': 'Lettre de demande',
      'lettre_motivation': 'Lettre de motivation',
      'lettre_reclamation': 'Lettre de réclamation',
      'lettre_resiliation': 'Lettre de résiliation',
      'contrat_travail': 'Contrat de travail',
      'demande_stage': 'Demande de stage',
      'attestation_presence': 'Attestation de présence',
      'fiche_paie': 'Fiche de paie',
      'cv': 'CV',
      'demande_releve_notes': 'Demande de relevé de notes',
      'demande_conge_academique': 'Demande de congé académique',
      'demande_extrait_naissance': "Demande d'extrait de naissance",
      'demande_cin': "Demande de carte d'identité",
      'declaration_honneur': "Déclaration sur l'honneur",
    };
    return labels[this.documentType] || this.documentType.replace(/_/g, ' ');
  }

  // ============================================
  // HELPERS
  // ============================================
  downloadDocument(id: number) {
    window.open(`http://localhost:8080/api/documents/download/${id}`, '_blank');
  }

  addUserMessage(text: string) {
    this.messages.push({ text, isUser: true, time: this.getCurrentTime() });
    this.saveChatsToStorage();
  }

  addBotMessage(
    text: string,
    intention?: string,
    showDocumentForm?: boolean,
    docId?: number,
    sources?: string[]
  ) {
    this.messages.push({
      text,
      isUser: false,
      time: this.getCurrentTime(),
      intention,
      showDocumentForm,
      docId,
      sources
    });
    if (showDocumentForm) this.showForm = true;
    if (docId) this.generatedDocId = docId;
    this.saveChatsToStorage();
  }

  getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  goToAdmin() { this.router.navigate(['/admin']); }
  goToPlanning() { this.router.navigate(['/planning']); }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
  onKeyPress(event: KeyboardEvent) { if (event.key === 'Enter') this.sendMessage(); }

  // ============================================
  // FORMATER MESSAGE (markdown basique → HTML)
  // ============================================
  formatMessage(text: string): string {
    if (!text) return '';
    let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/^• /gm, '&bull; ');
    html = html.replace(/^- /gm, '&ndash; ');
    html = html.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<a href="mailto:$1" style="color: #818CF8; text-decoration: underline;">$1</a>'
    );
    return html;
  }
}