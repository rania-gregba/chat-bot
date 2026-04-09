package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // le message de l'utilisateur
    @Column(nullable = false, length = 1000)
    private String userMessage;

    // la réponse du bot
    @Column(nullable = false, length = 2000)
    private String botResponse;

    // l'intention détectée par le NLP
    private String intention;

    // la langue détectée
    private String language;

    // qui a envoyé ce message
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // date et heure du message
    private LocalDateTime createdAt = LocalDateTime.now();
}