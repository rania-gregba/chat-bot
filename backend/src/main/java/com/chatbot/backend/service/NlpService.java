package com.chatbot.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import java.util.Map;
import java.util.HashMap;

@Service
public class NlpService {

    @Value("${nlp.url:http://localhost:8000}")
    private String nlpBaseUrl;

    private final RestTemplate restTemplate;

    public NlpService() {
        // Configure timeouts to avoid long hangs
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);  // 5 seconds connect timeout
        factory.setReadTimeout(30000);    // 30 seconds read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    // ============================================
    // ANALYSER UN MESSAGE AVEC NLP
    // ============================================
    public Map<String, Object> analyzeMessage(String message) {
        return analyzeMessage(message, null);
    }

    public Map<String, Object> analyzeMessage(String message, String language) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("message", message);
            body.put("language", language != null ? language : "fr");

            HttpEntity<Map<String, String>> request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    nlpBaseUrl + "/analyze", request, Map.class
            );

            return response.getBody();

        } catch (Exception e) {
            System.err.println("âš ï¸ NLP service unreachable: " + e.getMessage());
            return buildLocalNlpResponse(message, language);
        }
    }

    // ============================================
    // RÃ‰PONDRE AVEC RAG + GROQ
    // ============================================
    public Map<String, Object> askRag(String question, String language) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("question", question);
            body.put("language", language != null ? language : "fr");

            HttpEntity<Map<String, String>> request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    nlpBaseUrl + "/rag/ask", request, Map.class
            );

            return response.getBody();

        } catch (Exception e) {
            System.err.println("âš ï¸ RAG service unreachable: " + e.getMessage());
            Map<String, Object> defaultResponse = new HashMap<>();
            defaultResponse.put("answer", null); // null instead of error message
            defaultResponse.put("used_rag", false);
            return defaultResponse;
        }
    }

    // ============================================
    // CHAT DIRECT AVEC GROQ
    // ============================================
    public Map<String, Object> chatWithGroq(String message, String language, Map<String, Object> studentContext) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("message", message);
            body.put("language", language != null ? language : "fr");
            if (studentContext != null) {
                body.put("student_context", studentContext);
            }

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    nlpBaseUrl + "/groq/chat", request, Map.class
            );

            Map responseBody = response.getBody();
            if (responseBody != null) {
                String answer = (String) responseBody.get("answer");
                // Check if the answer is actually an error
                if (answer != null && (answer.contains("indisponible") || answer.contains("Erreur"))) {
                    responseBody.put("answer", null);
                    responseBody.put("used_groq", false);
                }
            }

            return responseBody;

        } catch (Exception e) {
            System.err.println("âš ï¸ Groq service unreachable: " + e.getMessage());
            Map<String, Object> defaultResponse = new HashMap<>();
            defaultResponse.put("answer", null); // null instead of error message
            defaultResponse.put("used_groq", false);
            return defaultResponse;
        }
    }

    // ============================================
    // RÃ‰PONSE NLP LOCALE (FALLBACK INTELLIGENT)
    // ============================================
    private Map<String, Object> buildLocalNlpResponse(String message, String language) {
        Map<String, Object> result = new HashMap<>();
        String msgLower = message.toLowerCase();
        String lang = language != null ? language : "fr";

        // Simple keyword-based intent detection as fallback
        String intention = "inconnu";
        String response;

        if ("ar".equals(lang)) {
            if (containsAny(msgLower, "مرحبا", "سلام", "اهلا", "أهلا", "bonjour", "hello", "salut")) {
                intention = "salutation";
                response = "مرحبا! أنا FASTO، مساعدك الإداري الذكي. كيف يمكنني مساعدتك اليوم؟\n\n📄 وثائق إدارية\n📅 جدول الحصص\n🎓 معلومات أكاديمية\n📝 التسجيل والمنح";
            } else if (containsAny(msgLower, "شهادة", "وثيقة", "وثائق", "attestation", "certificat", "document")) {
                intention = "demande_attestation";
                response = "📄 أستطيع مساعدتك في الوثائق الإدارية. اختر نوع الوثيقة التي تحتاجها مثل شهادة الترسيم أو شهادة العمل أو شهادة الإقامة، ثم استعمل زر الوثائق لإرسال الطلب.";
            } else if (containsAny(msgLower, "جدول", "توقيت", "حصة", "emploi du temps", "planning", "timetable")) {
                intention = "demande_emploi_temps";
                response = "📅 جدولك متوفر. افتح صفحة التخطيط في التطبيق لمشاهدة الحصص والقاعات بالتفصيل.";
            } else if (containsAny(msgLower, "عدد", "أعداد", "نتيجة", "نتائج", "note", "notes", "releve", "grades")) {
                intention = "demande_notes";
                response = "📊 يمكنك الاطلاع على أعدادك من تبويب النتائج، كما يمكنك طلب كشف أعداد رسمي عبر زر الوثائق.";
            } else if (containsAny(msgLower, "منحة", "منح", "bourse", "scholarship")) {
                intention = "demande_bourse";
                response = "🏅 توجد منح امتياز ومنح اجتماعية حسب المعدل والوضعية الاجتماعية. يمكنني شرح الشروط أو توجيهك إلى الإدارة المالية.";
            } else if (containsAny(msgLower, "تسجيل", "ترسيم", "inscription", "registration")) {
                intention = "demande_inscription";
                response = "📝 للتسجيل: حضر الوثائق المطلوبة، ثم أكمل الملف الإداري وخلاص المعاليم. إذا أردت، أشرح لك المراحل بالتفصيل.";
            } else if (containsAny(msgLower, "شكرا", "merci", "thanks")) {
                intention = "remerciement";
                response = "على الرحب والسعة. أنا هنا لمساعدتك في أي وقت.";
            } else {
                response = "💡 أنا FASTO، المساعد الذكي للكلية. يمكنني مساعدتك في الوثائق، الجداول، النتائج، التسجيل، المنح، والتربصات. اكتب سؤالك وسأجيبك بالعربية.";
            }

            result.put("message_original", message);
            result.put("language", lang);
            result.put("intention", intention);
            result.put("response", response);
            result.put("confidence", 75.0);
            return result;
        }

        if (containsAny(msgLower, "bonjour", "salut", "hello", "bonsoir", "coucou", "hey", "hi", "good morning", "greetings")) {
            intention = "salutation";
            if ("en".equals(lang)) {
                response = "Hello! ðŸ‘‹ I'm **FASTO**, the AI assistant for FPST Faculty.\n\nHow can I help you today?\nðŸ“„ Administrative documents\nðŸ“… Timetable\nðŸŽ“ Academic information\nðŸ“ Registration & scholarships";
            } else {
                response = "Bonjour ! ðŸ‘‹ Je suis **FASTO**, votre assistant IA de la FacultÃ© FPST.\n\nComment puis-je vous aider aujourd'hui ?\nðŸ“„ Documents administratifs\nðŸ“… Emploi du temps\nðŸŽ“ Informations acadÃ©miques\nðŸ“ Inscriptions & bourses";
            }
        } else if (containsAny(msgLower, "attestation", "certificat", "document", "certificate", "proof")) {
            intention = "demande_attestation";
            if ("en".equals(lang)) {
                response = "ðŸ“„ I can help with documents! What type do you need?\n\nâ€¢ **Enrollment certificate** â€” Proof of registration\nâ€¢ **Work certificate** â€” For staff\nâ€¢ **Residence certificate** â€” Address proof\n\nClick ðŸ“„ below to generate a document directly!";
            } else {
                response = "ðŸ“„ Je peux vous aider avec les documents ! Quel type souhaitez-vous ?\n\nâ€¢ **Attestation de scolaritÃ©** â€” Prouve votre inscription\nâ€¢ **Attestation de travail** â€” Pour le personnel\nâ€¢ **Attestation de rÃ©sidence** â€” Certificat de domicile\n\nCliquez sur ðŸ“„ en bas pour gÃ©nÃ©rer un document directement !";
            }
        } else if (containsAny(msgLower, "emploi du temps", "planning", "horaire", "cours", "timetable", "schedule", "classes")) {
            intention = "demande_emploi_temps";
            if ("en".equals(lang)) {
                response = "ðŸ“… Your timetable is available!\n\nâ–¶ï¸ Check the **Planning** page in this app to see your complete schedule.\n\nðŸ”µ Lecture | ðŸŸ¢ Tutorial | ðŸŸ  Lab\n\nNeed anything else?";
            } else {
                response = "ðŸ“… Votre emploi du temps est disponible !\n\nâ–¶ï¸ Consultez la page **Planning** de cette application pour voir votre programme complet.\n\nðŸ”µ CM | ðŸŸ¢ TD | ðŸŸ  TP\n\nBesoin d'autre chose ?";
            }
        } else if (containsAny(msgLower, "note", "rÃ©sultat", "releve", "relevÃ©", "moyenne", "examen", "grades", "results", "transcript", "exam")) {
            intention = "demande_notes";
            if ("en".equals(lang)) {
                response = "ðŸ“Š To check your **grades and results**:\n\n1. **Online** â†’ Check the Grades tab\n2. **Secretary's office** â†’ Bldg. A, Ground Floor (official transcript)\n\nðŸ“‹ Assessment: CA 40% | Midterm 20% | Final 40%\n\nðŸ“§ examens@fpst.tn | Office 105";
            } else {
                response = "ðŸ“Š Pour consulter vos **rÃ©sultats et notes** :\n\n1. **En ligne** â†’ Consultez l'onglet Notes de votre espace\n2. **Au secrÃ©tariat** â†’ BÃ¢t. A, RDC (relevÃ© officiel)\n\nðŸ“‹ Ã‰valuation : CC 40% | Partiel 20% | Final 40%\n\nðŸ“§ examens@fpst.tn | Bureau 105";
            }
        } else if (containsAny(msgLower, "filiÃ¨re", "filiere", "spÃ©cialitÃ©", "specialite", "dÃ©partement", "informatique", "master", "licence", "program", "major", "degree", "computer science")) {
            intention = "info_filiere";
            if ("en".equals(lang)) {
                response = "ðŸŽ“ Our faculty offers **6 Bachelor's** and **4 Master's** programs!\n\n**BACHELOR'S**: Computer Science, Software Engineering, Networks, Management, Digital Marketing, IS\n**MASTER'S**: AI & Data Science, Cybersecurity, MIS, Finance\n\nWhich program interests you?";
            } else {
                response = "ðŸŽ“ Notre facultÃ© propose **6 Licences** et **4 Masters** !\n\n**LICENCES** : Informatique, GÃ©nie Logiciel, RÃ©seaux, Sciences de Gestion, Marketing Digital, SI\n**MASTERS** : IA & Data Science, CybersÃ©curitÃ©, MSI, Finance\n\nQuelle filiÃ¨re vous intÃ©resse ?";
            }
        } else if (containsAny(msgLower, "inscription", "inscrire", "frais", "dossier", "registration", "register", "enroll", "tuition")) {
            intention = "demande_inscription";
            if ("en".equals(lang)) {
                response = "ðŸ“ **FPST Registration Guide**:\n\n1. ðŸ“‹ Pre-register at inscription.fpst.tn\n2. ðŸ“‚ Prepare your file (ID, diploma, photos, transcripts)\n3. ðŸ’³ Pay fees (Bachelor: 4500 DT/yr | Master: 5500 DT/yr)\n4. ðŸŽ« Collect your student card\n\nðŸ“§ inscription@fpst.tn | Office 101";
            } else {
                response = "ðŸ“ **Guide d'inscription FPST** :\n\n1. ðŸ“‹ PrÃ©-inscription sur inscription.fpst.tn\n2. ðŸ“‚ PrÃ©parer le dossier (CIN, bac, photos, relevÃ©s)\n3. ðŸ’³ Payer les frais (Licence: 4500 DT/an | Master: 5500 DT/an)\n4. ðŸŽ« Retirer carte Ã©tudiante\n\nðŸ“§ inscription@fpst.tn | Bureau 101";
            }
        } else if (containsAny(msgLower, "bourse", "aide financiÃ¨re", "rÃ©duction", "scholarship", "financial aid", "grant")) {
            intention = "demande_bourse";
            if ("en".equals(lang)) {
                response = "ðŸ… **Available Scholarships**:\n\nâ€¢ Top of class â†’ 100% waiver\nâ€¢ GPA â‰¥ 15/20 â†’ 25% discount\nâ€¢ Social scholarship â†’ 20-50% discount\n\nðŸ“§ finance@fpst.tn | Office 103";
            } else {
                response = "ðŸ… **Bourses disponibles** :\n\nâ€¢ Major de promo â†’ ExonÃ©ration 100%\nâ€¢ Moyenne â‰¥ 15/20 â†’ RÃ©duction 25%\nâ€¢ Bourse sociale â†’ RÃ©duction 20-50%\n\nðŸ“§ finance@fpst.tn | Bureau 103";
            }
        } else if (containsAny(msgLower, "merci", "thank", "parfait", "super", "excellent", "thanks", "great", "awesome")) {
            intention = "remerciement";
            if ("en".equals(lang)) {
                response = "You're welcome! ðŸ˜Š I'm available 24/7.\n\nDon't hesitate to come back! ðŸŽ“âœ¨";
            } else {
                response = "Avec plaisir ! ðŸ˜Š Je suis lÃ  24h/24 pour vous aider.\n\nN'hÃ©sitez pas Ã  revenir ! ðŸŽ“âœ¨";
            }
        } else if (containsAny(msgLower, "au revoir", "bye", "bonne", "ciao", "Ã  bientÃ´t", "goodbye", "see you", "take care")) {
            intention = "au_revoir";
            if ("en".equals(lang)) {
                response = "Goodbye! ðŸ‘‹ Good luck with your studies!\n\nðŸ“§ secretariat@fpst.tn | â˜Žï¸ +216 71 000 000\n\nSee you soon on FASTO! ðŸ¤–âœ¨";
            } else {
                response = "Au revoir ! ðŸ‘‹ Bonne continuation !\n\nðŸ“§ secretariat@fpst.tn | â˜Žï¸ +216 71 000 000\n\nÃ€ bientÃ´t sur FASTO ! ðŸ¤–âœ¨";
            }
        } else if (containsAny(msgLower, "stage", "pfe", "soutenance", "convention", "internship", "placement")) {
            intention = "demande_stage";
            if ("en".equals(lang)) {
                response = "ðŸ’¼ **Required internships**:\n\nâ€¢ L2: Observation (1 month)\nâ€¢ L3: Final project (2 months)\nâ€¢ M2: Professional (4-6 months)\n\nðŸ“ Office 203 | stages@fpst.tn\n\nWould you like more details?";
            } else {
                response = "ðŸ’¼ **Stages obligatoires** :\n\nâ€¢ L2 : Stage d'observation (1 mois)\nâ€¢ L3 : PFE (2 mois)\nâ€¢ M2 : Stage pro (4-6 mois)\n\nðŸ“ Bureau des stages : Bureau 203 | stages@fpst.tn\n\nVoulez-vous plus de dÃ©tails ?";
            }
        } else if (containsAny(msgLower, "salle", "amphi", "labo", "laboratoire", "room", "lab", "amphitheater")) {
            intention = "demande_salle";
            if ("en".equals(lang)) {
                response = "ðŸ« For **room availability**:\n\nâ–¶ï¸ Check the Room Management or Planning page.\n\nðŸ“ Main rooms:\nâ€¢ Amphitheater A101-A102\nâ€¢ TD Rooms A103-A106\nâ€¢ Labs A301-A304";
            } else {
                response = "ðŸ« Pour la **disponibilitÃ© des salles** :\n\nâ–¶ï¸ Consultez la page Gestion des salles ou la page Planning.\n\nðŸ“ Salles principales :\nâ€¢ Amphi A101-A102\nâ€¢ Salles TD A103-A106\nâ€¢ Labs A301-A304";
            }
        } else if (containsAny(msgLower, "calendrier", "date", "vacances", "rentrÃ©e", "calendar", "vacation", "semester")) {
            intention = "demande_calendrier";
            if ("en".equals(lang)) {
                response = "ðŸ“… **Academic Calendar**:\n\nðŸ”µ S1: Sept 15 â€” Jan 18\nðŸŸ¢ S2: Feb 10 â€” Jun 14\n\nðŸŽ„ Winter break: Dec 22 â€” Jan 5\nâ˜€ï¸ Summer break: July-August";
            } else {
                response = "ðŸ“… **Calendrier acadÃ©mique** :\n\nðŸ”µ S1 : 15 Sept â€” 18 Janvier\nðŸŸ¢ S2 : 10 FÃ©vrier â€” 14 Juin\n\nðŸŽ„ Vacances hiver : 22 DÃ©c â€” 5 Jan\nâ˜€ï¸ Vacances Ã©tÃ© : Juillet-AoÃ»t";
            }
        } else if (containsAny(msgLower, "rÃ©clamation", "plainte", "problÃ¨me", "signaler", "complaint", "issue", "report")) {
            intention = "demande_reclamation";
            if ("en".equals(lang)) {
                response = "ðŸ“¢ To file a **complaint**:\n\n1. Describe your issue in detail\n2. Acknowledgment within 24h\n3. Processing within 5 days\n\nðŸ“§ reclamation@fpst.tn | Office 110";
            } else {
                response = "ðŸ“¢ Pour faire une **rÃ©clamation** :\n\n1. DÃ©crivez votre problÃ¨me en dÃ©tail\n2. AccusÃ© de rÃ©ception sous 24h\n3. Traitement sous 5 jours\n\nðŸ“§ reclamation@fpst.tn | Bureau 110";
            }
        } else {
            // Generic intelligent fallback
            if ("en".equals(lang)) {
                response = "ðŸ’¡ I'm **FASTO**, your AI assistant! I can help with:\n\nðŸ“„ **Documents** â€” Certificates, transcripts\nðŸ“… **Schedule** â€” Timetable, rooms\nðŸŽ“ **Programs** â€” Courses, subjects\nðŸ“ **Registration** â€” Procedures, fees\nðŸ’° **Scholarships** â€” Criteria, amounts\nðŸ’¼ **Internships** â€” Agreements, offers\nðŸ“œ **Rules** â€” Absences, discipline\n\nAsk your question and I'll do my best! ðŸ˜Š";
            } else {
                response = "ðŸ’¡ Je suis **FASTO**, votre assistant IA ! Je peux vous aider avec :\n\nðŸ“„ **Documents** â€” Attestations, certificats, relevÃ©s\nðŸ“… **Planning** â€” Emploi du temps, salles\nðŸŽ“ **FiliÃ¨res** â€” Programmes, matiÃ¨res\nðŸ“ **Inscription** â€” ProcÃ©dures, frais\nðŸ’° **Bourses** â€” CritÃ¨res, montants\nðŸ’¼ **Stages** â€” Conventions, offres\nðŸ“œ **RÃ¨glement** â€” Absences, discipline\n\nPosez votre question et je ferai de mon mieux pour vous aider ! ðŸ˜Š";
            }
        }

        result.put("message_original", message);
        result.put("language", lang);
        result.put("intention", intention);
        result.put("response", response);
        result.put("confidence", 75.0);

        return result;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }
}
