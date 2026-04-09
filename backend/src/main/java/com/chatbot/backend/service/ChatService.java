package com.chatbot.backend.service;

import com.chatbot.backend.model.ChatMessage;
import com.chatbot.backend.model.User;
import com.chatbot.backend.repository.ChatMessageRepository;
import com.chatbot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final NlpService nlpService;

    // intentions qui utilisent réponse fixe NLP
    private static final List<String> FIXED_INTENTIONS = List.of(
            "salutation",
            "au_revoir",
            "remerciement",
            "demande_attestation",
            "demande_attestation_travail",
            "demande_attestation_scolarite",
            "demande_attestation_residence",
            "demande_emploi_temps",
            "demande_salle",
            "demande_notes",
            "demande_releve_notes",
            "demande_conge",
            "demande_salaire",
            "demande_reclamation",
            "demande_formation",
            "demande_remboursement",
            "probleme_technique",
            "demande_rendez_vous",
            "info_filiere",
            "demande_inscription",
            "demande_bourse",
            "demande_stage",
            "question_reglement",
            "demande_calendrier",
            "demande_info"
    );

    public ChatMessage sendMessage(String userMessage, String username) {
        return sendMessage(userMessage, username, null, null);
    }

    public ChatMessage sendMessage(String userMessage, String username, String language, Map<String, Object> studentContext) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Step 1: Analyze with NLP (local fallback built-in)
        Map<String, Object> nlpResult = nlpService.analyzeMessage(userMessage, language);

        String intention = (String) nlpResult.get("intention");
        String detectedLanguage = language != null ? language : (String) nlpResult.get("language");
        String botResponse;

        // Step 2: Handle based on intention
        if (FIXED_INTENTIONS.contains(intention)) {
            // Known intention → use NLP response directly
            botResponse = (String) nlpResult.get("response");

        } else if ("inconnu".equals(intention)) {
            // Unknown question → try AI services, with smart fallback chain
            botResponse = tryAIServices(userMessage, detectedLanguage, studentContext, nlpResult);

        } else {
            // Other intentions → try RAG first, then Groq, then NLP
            botResponse = tryRAGThenGroq(userMessage, detectedLanguage, studentContext, nlpResult);
        }

        // Step 3: Final safety check — NEVER show error messages to user
        botResponse = sanitizeResponse(botResponse, nlpResult);

        // Step 4: Save and return
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setUserMessage(userMessage);
        chatMessage.setBotResponse(botResponse);
        chatMessage.setIntention(intention);
        chatMessage.setLanguage(detectedLanguage);
        chatMessage.setUser(user);

        return chatMessageRepository.save(chatMessage);
    }

    /**
     * Try Groq first, then RAG, then NLP fallback
     */
    private String tryAIServices(String userMessage, String language, Map<String, Object> studentContext, Map<String, Object> nlpResult) {
        // Try 1: Groq direct chat
        String groqAnswer = tryGroq(userMessage, language, studentContext);
        if (isValidAnswer(groqAnswer)) {
            return groqAnswer;
        }

        // Try 2: RAG (knowledge base)
        String ragAnswer = tryRag(userMessage, language);
        if (isValidAnswer(ragAnswer)) {
            return ragAnswer;
        }

        // Try 3: NLP response (always available)
        String nlpResponse = (String) nlpResult.get("response");
        if (isValidAnswer(nlpResponse)) {
            return nlpResponse;
        }

        // Final fallback - should never reach here
        return getGenericFallbackResponse(language);
    }

    /**
     * Try RAG first, then Groq, then NLP fallback
     */
    private String tryRAGThenGroq(String userMessage, String language, Map<String, Object> studentContext, Map<String, Object> nlpResult) {
        // Try 1: RAG (knowledge base)
        String ragAnswer = tryRag(userMessage, language);
        if (isValidAnswer(ragAnswer)) {
            return ragAnswer;
        }

        // Try 2: Groq 
        String groqAnswer = tryGroq(userMessage, language, studentContext);
        if (isValidAnswer(groqAnswer)) {
            return groqAnswer;
        }

        // Try 3: NLP response
        String nlpResponse = (String) nlpResult.get("response");
        if (isValidAnswer(nlpResponse)) {
            return nlpResponse;
        }

        return getGenericFallbackResponse(language);
    }

    private String tryGroq(String message, String language, Map<String, Object> studentContext) {
        try {
            Map<String, Object> groqResult = nlpService.chatWithGroq(message, language, studentContext);
            return (String) groqResult.get("answer");
        } catch (Exception e) {
            System.err.println("Groq call failed: " + e.getMessage());
            return null;
        }
    }

    private String tryRag(String message, String language) {
        try {
            Map<String, Object> ragResult = nlpService.askRag(message, language);
            String answer = (String) ragResult.get("answer");
            if (isValidAnswer(answer)) {
                // Add source info if available
                List<String> sources = (List<String>) ragResult.get("sources");
                if (sources != null && !sources.isEmpty()) {
                    String sourceName = sources.get(0)
                            .replace("knowledge_base/", "")
                            .replace(".txt", "")
                            .replace("_", " ");
                    answer += "\n\n📄 Source: " + sourceName;
                }
            }
            return answer;
        } catch (Exception e) {
            System.err.println("RAG call failed: " + e.getMessage());
            return null;
        }
    }

    /**
     * Check if an answer is valid (not null, not empty, not an error message)
     */
    private boolean isValidAnswer(String answer) {
        if (answer == null || answer.trim().isEmpty()) return false;
        String lower = answer.toLowerCase();
        return !lower.contains("indisponible")
                && !lower.contains("erreur")
                && !lower.contains("error")
                && !lower.contains("aucune base")
                && !lower.contains("non configurée")
                && !lower.contains("service nlp")
                && !lower.contains("service rag")
                && !lower.contains("service ia");
    }

    /**
     * Final safety: ensure the response shown to user is never an error message
     */
    private String sanitizeResponse(String response, Map<String, Object> nlpResult) {
        if (!isValidAnswer(response)) {
            // Try NLP response as last resort
            String nlpResponse = (String) nlpResult.get("response");
            if (isValidAnswer(nlpResponse)) {
                return nlpResponse;
            }
            return getGenericFallbackResponse("fr");
        }
        return response;
    }

    private String getGenericFallbackResponse(String language) {
        if ("ar".equals(language)) {
            return "💡 أنا **فاستو**، المساعد الذكي ! اسألني !\n\n📄 وثائق | 📅 برنامج | 🎓 تخصصات | 📝 تسجيل\n💰 منح | 💼 تربصات | 📜 قانون | 🔧 دعم\n\nقلي شنو تحب ! 😊";
        }
        if ("en".equals(language)) {
            return "💡 I'm **FASTO**, your AI assistant! Ask me anything!\n\nI can help with:\n📄 Documents | 📅 Schedule | 🎓 Programs | 📝 Registration\n💰 Scholarships | 💼 Internships | 📜 Rules | 🔧 Support\n\nWhat do you need? 😊";
        }
        return "💡 Je suis **FASTO**, votre assistant IA ! Posez-moi votre question !\n\nJe peux vous aider avec :\n📄 Documents | 📅 Planning | 🎓 Filières | 📝 Inscription\n💰 Bourses | 💼 Stages | 📜 Règlement | 🔧 Support\n\nDites-moi de quoi avez-vous besoin ! 😊";
    }

    public List<ChatMessage> getHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return chatMessageRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
    }
}