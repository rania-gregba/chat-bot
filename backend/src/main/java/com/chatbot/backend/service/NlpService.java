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
            System.err.println("⚠️ NLP service unreachable: " + e.getMessage());
            return buildLocalNlpResponse(message, language);
        }
    }

    // ============================================
    // RÉPONDRE AVEC RAG + GROQ
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
            System.err.println("⚠️ RAG service unreachable: " + e.getMessage());
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
            System.err.println("⚠️ Groq service unreachable: " + e.getMessage());
            Map<String, Object> defaultResponse = new HashMap<>();
            defaultResponse.put("answer", null); // null instead of error message
            defaultResponse.put("used_groq", false);
            return defaultResponse;
        }
    }

    // ============================================
    // RÉPONSE NLP LOCALE (FALLBACK INTELLIGENT)
    // ============================================
    private Map<String, Object> buildLocalNlpResponse(String message, String language) {
        Map<String, Object> result = new HashMap<>();
        String msgLower = message.toLowerCase();
        String lang = language != null ? language : "fr";

        // Simple keyword-based intent detection as fallback
        String intention = "inconnu";
        String response;

        if (containsAny(msgLower, "bonjour", "salut", "hello", "bonsoir", "coucou", "hey", "hi", "good morning", "greetings")) {
            intention = "salutation";
            if ("en".equals(lang)) {
                response = "Hello! 👋 I'm **FASTO**, the AI assistant for FPST Faculty.\n\nHow can I help you today?\n📄 Administrative documents\n📅 Timetable\n🎓 Academic information\n📝 Registration & scholarships";
            } else {
                response = "Bonjour ! 👋 Je suis **FASTO**, votre assistant IA de la Faculté FPST.\n\nComment puis-je vous aider aujourd'hui ?\n📄 Documents administratifs\n📅 Emploi du temps\n🎓 Informations académiques\n📝 Inscriptions & bourses";
            }
        } else if (containsAny(msgLower, "attestation", "certificat", "document", "certificate", "proof")) {
            intention = "demande_attestation";
            if ("en".equals(lang)) {
                response = "📄 I can help with documents! What type do you need?\n\n• **Enrollment certificate** — Proof of registration\n• **Work certificate** — For staff\n• **Residence certificate** — Address proof\n\nClick 📄 below to generate a document directly!";
            } else {
                response = "📄 Je peux vous aider avec les documents ! Quel type souhaitez-vous ?\n\n• **Attestation de scolarité** — Prouve votre inscription\n• **Attestation de travail** — Pour le personnel\n• **Attestation de résidence** — Certificat de domicile\n\nCliquez sur 📄 en bas pour générer un document directement !";
            }
        } else if (containsAny(msgLower, "emploi du temps", "planning", "horaire", "cours", "timetable", "schedule", "classes")) {
            intention = "demande_emploi_temps";
            if ("en".equals(lang)) {
                response = "📅 Your timetable is available!\n\n▶️ Check the **Planning** page in this app to see your complete schedule.\n\n🔵 Lecture | 🟢 Tutorial | 🟠 Lab\n\nNeed anything else?";
            } else {
                response = "📅 Votre emploi du temps est disponible !\n\n▶️ Consultez la page **Planning** de cette application pour voir votre programme complet.\n\n🔵 CM | 🟢 TD | 🟠 TP\n\nBesoin d'autre chose ?";
            }
        } else if (containsAny(msgLower, "note", "résultat", "releve", "relevé", "moyenne", "examen", "grades", "results", "transcript", "exam")) {
            intention = "demande_notes";
            if ("en".equals(lang)) {
                response = "📊 To check your **grades and results**:\n\n1. **Online** → Check the Grades tab\n2. **Secretary's office** → Bldg. A, Ground Floor (official transcript)\n\n📋 Assessment: CA 40% | Midterm 20% | Final 40%\n\n📧 examens@fpst.tn | Office 105";
            } else {
                response = "📊 Pour consulter vos **résultats et notes** :\n\n1. **En ligne** → Consultez l'onglet Notes de votre espace\n2. **Au secrétariat** → Bât. A, RDC (relevé officiel)\n\n📋 Évaluation : CC 40% | Partiel 20% | Final 40%\n\n📧 examens@fpst.tn | Bureau 105";
            }
        } else if (containsAny(msgLower, "filière", "filiere", "spécialité", "specialite", "département", "informatique", "master", "licence", "program", "major", "degree", "computer science")) {
            intention = "info_filiere";
            if ("en".equals(lang)) {
                response = "🎓 Our faculty offers **6 Bachelor's** and **4 Master's** programs!\n\n**BACHELOR'S**: Computer Science, Software Engineering, Networks, Management, Digital Marketing, IS\n**MASTER'S**: AI & Data Science, Cybersecurity, MIS, Finance\n\nWhich program interests you?";
            } else {
                response = "🎓 Notre faculté propose **6 Licences** et **4 Masters** !\n\n**LICENCES** : Informatique, Génie Logiciel, Réseaux, Sciences de Gestion, Marketing Digital, SI\n**MASTERS** : IA & Data Science, Cybersécurité, MSI, Finance\n\nQuelle filière vous intéresse ?";
            }
        } else if (containsAny(msgLower, "inscription", "inscrire", "frais", "dossier", "registration", "register", "enroll", "tuition")) {
            intention = "demande_inscription";
            if ("en".equals(lang)) {
                response = "📝 **FPST Registration Guide**:\n\n1. 📋 Pre-register at inscription.fpst.tn\n2. 📂 Prepare your file (ID, diploma, photos, transcripts)\n3. 💳 Pay fees (Bachelor: 4500 DT/yr | Master: 5500 DT/yr)\n4. 🎫 Collect your student card\n\n📧 inscription@fpst.tn | Office 101";
            } else {
                response = "📝 **Guide d'inscription FPST** :\n\n1. 📋 Pré-inscription sur inscription.fpst.tn\n2. 📂 Préparer le dossier (CIN, bac, photos, relevés)\n3. 💳 Payer les frais (Licence: 4500 DT/an | Master: 5500 DT/an)\n4. 🎫 Retirer carte étudiante\n\n📧 inscription@fpst.tn | Bureau 101";
            }
        } else if (containsAny(msgLower, "bourse", "aide financière", "réduction", "scholarship", "financial aid", "grant")) {
            intention = "demande_bourse";
            if ("en".equals(lang)) {
                response = "🏅 **Available Scholarships**:\n\n• Top of class → 100% waiver\n• GPA ≥ 15/20 → 25% discount\n• Social scholarship → 20-50% discount\n\n📧 finance@fpst.tn | Office 103";
            } else {
                response = "🏅 **Bourses disponibles** :\n\n• Major de promo → Exonération 100%\n• Moyenne ≥ 15/20 → Réduction 25%\n• Bourse sociale → Réduction 20-50%\n\n📧 finance@fpst.tn | Bureau 103";
            }
        } else if (containsAny(msgLower, "merci", "thank", "parfait", "super", "excellent", "thanks", "great", "awesome")) {
            intention = "remerciement";
            if ("en".equals(lang)) {
                response = "You're welcome! 😊 I'm available 24/7.\n\nDon't hesitate to come back! 🎓✨";
            } else {
                response = "Avec plaisir ! 😊 Je suis là 24h/24 pour vous aider.\n\nN'hésitez pas à revenir ! 🎓✨";
            }
        } else if (containsAny(msgLower, "au revoir", "bye", "bonne", "ciao", "à bientôt", "goodbye", "see you", "take care")) {
            intention = "au_revoir";
            if ("en".equals(lang)) {
                response = "Goodbye! 👋 Good luck with your studies!\n\n📧 secretariat@fpst.tn | ☎️ +216 71 000 000\n\nSee you soon on FASTO! 🤖✨";
            } else {
                response = "Au revoir ! 👋 Bonne continuation !\n\n📧 secretariat@fpst.tn | ☎️ +216 71 000 000\n\nÀ bientôt sur FASTO ! 🤖✨";
            }
        } else if (containsAny(msgLower, "stage", "pfe", "soutenance", "convention", "internship", "placement")) {
            intention = "demande_stage";
            if ("en".equals(lang)) {
                response = "💼 **Required internships**:\n\n• L2: Observation (1 month)\n• L3: Final project (2 months)\n• M2: Professional (4-6 months)\n\n📍 Office 203 | stages@fpst.tn\n\nWould you like more details?";
            } else {
                response = "💼 **Stages obligatoires** :\n\n• L2 : Stage d'observation (1 mois)\n• L3 : PFE (2 mois)\n• M2 : Stage pro (4-6 mois)\n\n📍 Bureau des stages : Bureau 203 | stages@fpst.tn\n\nVoulez-vous plus de détails ?";
            }
        } else if (containsAny(msgLower, "salle", "amphi", "labo", "laboratoire", "room", "lab", "amphitheater")) {
            intention = "demande_salle";
            if ("en".equals(lang)) {
                response = "🏫 For **room availability**:\n\n▶️ Check the Room Management or Planning page.\n\n📍 Main rooms:\n• Amphitheater A101-A102\n• TD Rooms A103-A106\n• Labs A301-A304";
            } else {
                response = "🏫 Pour la **disponibilité des salles** :\n\n▶️ Consultez la page Gestion des salles ou la page Planning.\n\n📍 Salles principales :\n• Amphi A101-A102\n• Salles TD A103-A106\n• Labs A301-A304";
            }
        } else if (containsAny(msgLower, "calendrier", "date", "vacances", "rentrée", "calendar", "vacation", "semester")) {
            intention = "demande_calendrier";
            if ("en".equals(lang)) {
                response = "📅 **Academic Calendar**:\n\n🔵 S1: Sept 15 — Jan 18\n🟢 S2: Feb 10 — Jun 14\n\n🎄 Winter break: Dec 22 — Jan 5\n☀️ Summer break: July-August";
            } else {
                response = "📅 **Calendrier académique** :\n\n🔵 S1 : 15 Sept — 18 Janvier\n🟢 S2 : 10 Février — 14 Juin\n\n🎄 Vacances hiver : 22 Déc — 5 Jan\n☀️ Vacances été : Juillet-Août";
            }
        } else if (containsAny(msgLower, "réclamation", "plainte", "problème", "signaler", "complaint", "issue", "report")) {
            intention = "demande_reclamation";
            if ("en".equals(lang)) {
                response = "📢 To file a **complaint**:\n\n1. Describe your issue in detail\n2. Acknowledgment within 24h\n3. Processing within 5 days\n\n📧 reclamation@fpst.tn | Office 110";
            } else {
                response = "📢 Pour faire une **réclamation** :\n\n1. Décrivez votre problème en détail\n2. Accusé de réception sous 24h\n3. Traitement sous 5 jours\n\n📧 reclamation@fpst.tn | Bureau 110";
            }
        } else {
            // Generic intelligent fallback
            if ("en".equals(lang)) {
                response = "💡 I'm **FASTO**, your AI assistant! I can help with:\n\n📄 **Documents** — Certificates, transcripts\n📅 **Schedule** — Timetable, rooms\n🎓 **Programs** — Courses, subjects\n📝 **Registration** — Procedures, fees\n💰 **Scholarships** — Criteria, amounts\n💼 **Internships** — Agreements, offers\n📜 **Rules** — Absences, discipline\n\nAsk your question and I'll do my best! 😊";
            } else {
                response = "💡 Je suis **FASTO**, votre assistant IA ! Je peux vous aider avec :\n\n📄 **Documents** — Attestations, certificats, relevés\n📅 **Planning** — Emploi du temps, salles\n🎓 **Filières** — Programmes, matières\n📝 **Inscription** — Procédures, frais\n💰 **Bourses** — Critères, montants\n💼 **Stages** — Conventions, offres\n📜 **Règlement** — Absences, discipline\n\nPosez votre question et je ferai de mon mieux pour vous aider ! 😊";
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