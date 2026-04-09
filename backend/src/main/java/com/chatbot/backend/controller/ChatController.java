package com.chatbot.backend.controller;

import com.chatbot.backend.model.ChatMessage;
import com.chatbot.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748", "*"})
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ============================================
    // ENVOYER UN MESSAGE — retourne un JSON propre
    // ============================================
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, Object> request
    ) {
        String message = (String) request.get("message");
        String username = (String) request.get("username");
        String language = (String) request.get("language");
        Map<String, Object> studentContext = (Map<String, Object>) request.get("student_context");

        ChatMessage chatMsg = chatService.sendMessage(message, username, language, studentContext);

        // Construire la réponse avec les clés attendues par le frontend
        Map<String, Object> response = new HashMap<>();
        response.put("answer", chatMsg.getBotResponse());
        response.put("response", chatMsg.getBotResponse());
        response.put("intention", chatMsg.getIntention());
        response.put("language", chatMsg.getLanguage());
        response.put("id", chatMsg.getId());

        return ResponseEntity.ok(response);
    }

    // ============================================
    // RÉCUPÉRER L'HISTORIQUE
    // ============================================
    @GetMapping("/history/{username}")
    public ResponseEntity<List<ChatMessage>> getHistory(
            @PathVariable String username
    ) {
        List<ChatMessage> history = chatService.getHistory(username);
        return ResponseEntity.ok(history);
    }
}