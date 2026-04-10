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

  // RÃ´le utilisateur â€” clÃ© pour la sidebar adaptative
  userRole = '';

  // Profil Ã©tudiant
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

  // Suggestions rapides â€” translation keys
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

    // RÃ©cupÃ©rer le rÃ´le et l'adapter
    const role = this.authService.getRole() || 'ETUDIANT';
    this.userRole = role.toUpperCase();
    this.isAdmin = this.userRole === 'ADMIN';

    // Charger le profil Ã©tudiant
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

    // PrÃ©-remplir fullName depuis le profil
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
  // LABEL DU RÃ”LE pour la sidebar
  // ============================================
  getRoleLabel(): string {
    switch (this.userRole) {
      case 'ADMIN': return this.t('role.admin');
      case 'PROFESSEUR': return this.t('role.professor');
      default: return this.studentProfile?.fieldOfStudy || this.t('role.student');
    }
  }

  // ============================================
  // MESSAGE DE BIENVENUE PERSONNALISÃ‰
  // ============================================
  getWelcomeMessage(): string {
    if (this.studentProfile) {
      const firstName = this.studentProfile.firstName || this.username;
      const field = this.studentProfile.fieldOfStudy || '';
      const level = this.studentProfile.academicLevel || '';
      return this.localized(
        `Bonjour ${firstName} ! Je suis votre assistant administratif.\n\nProgramme : ${field}${level ? ' - ' + level : ''}\nID etudiant : ${this.studentProfile.studentId || '-'}\n\nComment puis-je vous aider aujourd'hui ?`,
        `Hello ${firstName}! I am your administrative assistant.\n\nProgram: ${field}${level ? ' - ' + level : ''}\nStudent ID: ${this.studentProfile.studentId || '-'}\n\nHow can I help you today?`,
        `مرحبا ${firstName}! أنا مساعدك الإداري.\n\nالاختصاص: ${field}${level ? ' - ' + level : ''}\nمعرف الطالب: ${this.studentProfile.studentId || '-'}\n\nكيف يمكنني مساعدتك اليوم؟`
      );
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
      createdAt: new Date().toLocaleDateString(this.getCurrentLocale(), {
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
  // RÃ‰PONDRE LOCALEMENT AUX QUESTIONS PROFIL
  // ============================================
  handleProfileQuestion(message: string): string | null {
    if (!this.studentProfile) return null;
    const msg = message.toLowerCase();

    if (msg.includes('emploi du temps') || msg.includes('horaire') || msg.includes('cours') || msg.includes('timetable') || msg.includes('schedule') || msg.includes('classes')) {
      return this.localized(
        `📅 **Emploi du temps** - ${this.studentProfile.fieldOfStudy || ''} ${this.studentProfile.academicLevel || ''}\n\nPour consulter votre emploi du temps complet, ouvrez la page Planning de l'application.`,
        `📅 **Timetable** - ${this.studentProfile.fieldOfStudy || ''} ${this.studentProfile.academicLevel || ''}\n\nOpen the Planning page in the application to view your full timetable.`,
        `📅 **جدول الحصص** - ${this.studentProfile.fieldOfStudy || ''} ${this.studentProfile.academicLevel || ''}\n\nيمكنك فتح صفحة التخطيط في التطبيق لعرض جدولك كاملا.`
      );
    }

    if (msg.includes('releve') || msg.includes('relevé') || msg.includes('notes') || msg.includes('resultat') || msg.includes('résultat') || msg.includes('transcript') || msg.includes('grades') || msg.includes('results')) {
      return this.localized(
        `📊 **Releve de notes**\n\nEtudiant : ${this.studentProfile.firstName} ${this.studentProfile.lastName}\nFiliere : ${this.studentProfile.fieldOfStudy || '-'} - ${this.studentProfile.academicLevel || '-'}\n\nUtilisez le bouton document pour demander un releve officiel.`,
        `📊 **Transcript**\n\nStudent: ${this.studentProfile.firstName} ${this.studentProfile.lastName}\nProgram: ${this.studentProfile.fieldOfStudy || '-'} - ${this.studentProfile.academicLevel || '-'}\n\nUse the document button below to request an official transcript.`,
        `📊 **كشف الأعداد**\n\nالطالب: ${this.studentProfile.firstName} ${this.studentProfile.lastName}\nالاختصاص: ${this.studentProfile.fieldOfStudy || '-'} - ${this.studentProfile.academicLevel || '-'}\n\nاستعمل زر الوثائق لطلب كشف أعداد رسمي.`
      );
    }

    if (msg.includes('attestation') || msg.includes('scolarite') || msg.includes('scolarité') || msg.includes('certificat') || msg.includes('certificate') || msg.includes('enrollment')) {
      return this.localized(
        `📄 **Attestation de scolarite**\n\nJe peux generer votre certificat de scolarite immediatement. Cliquez sur le bouton document pour lancer le formulaire.`,
        `📄 **Enrollment Certificate**\n\nI can generate your enrollment certificate immediately. Click the document button to start the form.`,
        `📄 **شهادة ترسيم**\n\nيمكنني إنشاء شهادة الترسيم مباشرة. اضغط على زر الوثائق لبدء الطلب.`
      );
    }

    if (msg.includes('filiere') || msg.includes('filière') || msg.includes('formation') || msg.includes('niveau') || msg.includes('specialite') || msg.includes('spécialité') || msg.includes('program') || msg.includes('major') || msg.includes('level') || msg.includes('field')) {
      return this.localized(
        `🎓 **Votre formation**\n\n- Filiere : ${this.studentProfile.fieldOfStudy || '-'}\n- Niveau : ${this.studentProfile.academicLevel || '-'}`,
        `🎓 **Your Program**\n\n- Field of study: ${this.studentProfile.fieldOfStudy || '-'}\n- Level: ${this.studentProfile.academicLevel || '-'}`,
        `🎓 **تكوينك**\n\n- الاختصاص: ${this.studentProfile.fieldOfStudy || '-'}\n- المستوى: ${this.studentProfile.academicLevel || '-'}`
      );
    }

    if (msg.includes('profil') || msg.includes('informations') || msg.includes('mon compte') || msg.includes('identifiant') || msg.includes('profile') || msg.includes('my account') || msg.includes('info')) {
      return this.localized(
        `👤 **Votre profil etudiant**\n\n- Nom : ${this.studentProfile.firstName} ${this.studentProfile.lastName}\n- ID etudiant : ${this.studentProfile.studentId || '-'}\n- CIN : ${this.studentProfile.cin || '-'}\n- Email : ${this.studentProfile.email || '-'}\n- Telephone : ${this.studentProfile.phone || '-'}`,
        `👤 **Your Student Profile**\n\n- Name: ${this.studentProfile.firstName} ${this.studentProfile.lastName}\n- Student ID: ${this.studentProfile.studentId || '-'}\n- CIN: ${this.studentProfile.cin || '-'}\n- Email: ${this.studentProfile.email || '-'}\n- Phone: ${this.studentProfile.phone || '-'}`,
        `👤 **ملفك الشخصي**\n\n- الاسم: ${this.studentProfile.firstName} ${this.studentProfile.lastName}\n- معرف الطالب: ${this.studentProfile.studentId || '-'}\n- بطاقة التعريف: ${this.studentProfile.cin || '-'}\n- البريد الإلكتروني: ${this.studentProfile.email || '-'}\n- الهاتف: ${this.studentProfile.phone || '-'}`
      );
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

  private localized(fr: string, en: string, ar: string): string {
    if (this.currentLang === 'en') return en;
    if (this.currentLang === 'ar') return ar;
    return fr;
  }

  private getCurrentLocale(): string {
    if (this.currentLang === 'en') return 'en-US';
    if (this.currentLang === 'ar') return 'ar-TN';
    return 'fr-FR';
  }

  // ============================================
  // EXTRACTION RÃ‰PONSE BOT
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
      alert(this.localized(
        'Service IA temporairement indisponible, reessayez plus tard.',
        'AI service is temporarily unavailable, please try again later.',
        'خدمة الذكاء الاصطناعي غير متوفرة حاليا، يرجى المحاولة لاحقا.'
      ));
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

    // RÃ©ponse locale profil
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

        const fallbackMsg = this.localized(
          "Desole, je n'ai pas pu generer une reponse claire.",
          "Sorry, I couldn't generate a clear response.",
          'عذرا، لم أتمكن من إنشاء إجابة واضحة.'
        );

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
        const fallbackMsg = this.localized(
          "Desole, je n'ai pas pu generer une reponse claire.",
          "Sorry, I couldn't generate a clear response.",
          'عذرا، لم أتمكن من إنشاء إجابة واضحة.'
        );
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
  // GÃ‰NÃ‰RER DOCUMENT
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
        this.jobTitle = `${this.studentProfile.fieldOfStudy} â€” ${this.studentProfile.academicLevel}`;
    }

    if (ctx === 'PRO') {
      if (this.companyName)        richInfo += `Entreprise : ${this.companyName}\n`;
      if (this.jobTitle)           richInfo += `Poste : ${this.jobTitle}\n`;
      if (this.startDate)          richInfo += `Date dÃ©but : ${this.startDate}\n`;
      if (this.salary)             richInfo += `Salaire : ${this.salary} DT\n`;
      if (this.requestedLeaveType) richInfo += `Type congÃ© : ${this.requestedLeaveType}\n`;
      if (this.leaveStartDate)     richInfo += `Du : ${this.leaveStartDate}\n`;
      if (this.leaveEndDate)       richInfo += `Au : ${this.leaveEndDate}\n`;
    } else if (ctx === 'STAGE') {
      if (this.internshipCompany)  richInfo += `Entreprise de stage : ${this.internshipCompany}\n`;
      if (this.internshipDuration) richInfo += `DurÃ©e : ${this.internshipDuration}\n`;
      if (this.jobTitle)           richInfo += `DÃ©partement : ${this.jobTitle}\n`;
      if (this.schoolName)         richInfo += `Ã‰tablissement : ${this.schoolName}\n`;
    } else if (ctx === 'CIVIL') {
      if (this.cin)                richInfo += `CIN : ${this.cin}\n`;
      if (this.address)            richInfo += `Adresse : ${this.address}\n`;
      if (this.birthDate)          richInfo += `Date naissance : ${this.birthDate}\n`;
      if (this.birthPlace)         richInfo += `Lieu naissance : ${this.birthPlace}\n`;
      if (this.fatherName)         richInfo += `PÃ¨re : ${this.fatherName}\n`;
      if (this.motherName)         richInfo += `MÃ¨re : ${this.motherName}\n`;
      if (this.nationality)        richInfo += `NationalitÃ© : ${this.nationality}\n`;
    } else if (ctx === 'COM') {
      if (this.clientName)         richInfo += `Client : ${this.clientName}\n`;
      if (this.amount)             richInfo += `Montant : ${this.amount} DT\n`;
    } else if (ctx === 'SCHOOL') {
      if (this.schoolName)         richInfo += `Ã‰tablissement : ${this.schoolName}\n`;
      if (this.academicYear)       richInfo += `AnnÃ©e universitaire : ${this.academicYear}\n`;
      if (this.jobTitle)           richInfo += `FiliÃ¨re/Niveau : ${this.jobTitle}\n`;
      if (this.studentProfile?.studentId) richInfo += `NÂ° Ã‰tudiant : ${this.studentProfile.studentId}\n`;
    } else if (ctx === 'LETTER') {
      if (this.companyName)        richInfo += `Destinataire : ${this.companyName}\n`;
      if (this.jobTitle)           richInfo += `Objet : ${this.jobTitle}\n`;
      if (this.address)            richInfo += `Adresse : ${this.address}\n`;
      if (this.email)              richInfo += `Email : ${this.email}\n`;
      if (this.phoneNumber)        richInfo += `TÃ©lÃ©phone : ${this.phoneNumber}\n`;
    } else if (ctx === 'CV') {
      if (this.jobTitle)           richInfo += `Poste recherchÃ© : ${this.jobTitle}\n`;
      if (this.email)              richInfo += `Email : ${this.email}\n`;
      if (this.phoneNumber)        richInfo += `TÃ©lÃ©phone : ${this.phoneNumber}\n`;
      if (this.address)            richInfo += `Adresse : ${this.address}\n`;
      if (this.schoolName)         richInfo += `Formation : ${this.schoolName}\n`;
    }

    if (this.additionalInfo.trim()) richInfo += `\nInformations supplÃ©mentaires :\n${this.additionalInfo}`;

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
        const successMsg = this.localized(
          `Votre document "${this.getDocumentLabel()}" a ete genere avec succes. Cliquez sur le bouton de telechargement ci-dessous.`,
          `Your document "${this.getDocumentLabel()}" has been generated successfully. Click the download button below.`,
          `تم إنشاء الوثيقة "${this.getDocumentLabel()}" بنجاح. اضغط على زر التحميل بالأسفل.`
        );
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
    const labels: Record<string, Record<string, string>> = {
      fr: {
        attestation_travail: 'Attestation de travail',
        attestation_salaire: 'Attestation de salaire',
        attestation_stage: 'Attestation de stage',
        attestation_residence: 'Attestation de residence',
        certificat_scolarite: 'Certificat de scolarite',
        copie_conforme: 'Copie conforme',
        lettre_demande: 'Lettre de demande',
        lettre_motivation: 'Lettre de motivation',
        lettre_reclamation: 'Lettre de reclamation',
        lettre_resiliation: 'Lettre de resiliation',
        contrat_travail: 'Contrat de travail',
        demande_stage: 'Demande de stage',
        attestation_presence: 'Attestation de presence',
        fiche_paie: 'Fiche de paie',
        cv: 'CV',
        demande_releve_notes: 'Demande de releve de notes',
        demande_conge_academique: 'Demande de conge academique',
        demande_extrait_naissance: 'Demande d\'extrait de naissance',
        demande_cin: 'Demande de carte d\'identite',
        declaration_honneur: 'Declaration sur l\'honneur'
      },
      en: {
        attestation_travail: 'Work certificate',
        attestation_salaire: 'Salary certificate',
        attestation_stage: 'Internship certificate',
        attestation_residence: 'Residence certificate',
        certificat_scolarite: 'Enrollment certificate',
        copie_conforme: 'Certified copy',
        lettre_demande: 'Request letter',
        lettre_motivation: 'Cover letter',
        lettre_reclamation: 'Complaint letter',
        lettre_resiliation: 'Termination letter',
        contrat_travail: 'Employment contract',
        demande_stage: 'Internship request',
        attestation_presence: 'Attendance certificate',
        fiche_paie: 'Payslip',
        cv: 'Resume',
        demande_releve_notes: 'Transcript request',
        demande_conge_academique: 'Academic leave request',
        demande_extrait_naissance: 'Birth certificate request',
        demande_cin: 'Identity card request',
        declaration_honneur: 'Sworn statement'
      },
      ar: {
        attestation_travail: 'شهادة عمل',
        attestation_salaire: 'شهادة أجر',
        attestation_stage: 'شهادة تربص',
        attestation_residence: 'شهادة إقامة',
        certificat_scolarite: 'شهادة ترسيم',
        copie_conforme: 'نسخة مطابقة للأصل',
        lettre_demande: 'رسالة طلب',
        lettre_motivation: 'رسالة تحفيز',
        lettre_reclamation: 'رسالة تظلم',
        lettre_resiliation: 'رسالة إنهاء',
        contrat_travail: 'عقد عمل',
        demande_stage: 'طلب تربص',
        attestation_presence: 'شهادة حضور',
        fiche_paie: 'كشف خلاص',
        cv: 'سيرة ذاتية',
        demande_releve_notes: 'طلب كشف أعداد',
        demande_conge_academique: 'طلب عطلة أكاديمية',
        demande_extrait_naissance: 'طلب مضمون ولادة',
        demande_cin: 'طلب بطاقة تعريف',
        declaration_honneur: 'تصريح على الشرف'
      }
    };

    return labels[this.currentLang]?.[this.documentType] || labels['fr'][this.documentType] || this.documentType.replace(/_/g, ' ');
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
  // FORMATER MESSAGE (markdown basique â†’ HTML)
  // ============================================
  formatMessage(text: string): string {
    if (!text) return '';
    let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/^â€¢ /gm, '&bull; ');
    html = html.replace(/^- /gm, '&ndash; ');
    html = html.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<a href="mailto:$1" style="color: #818CF8; text-decoration: underline;">$1</a>'
    );
    return html;
  }
}

