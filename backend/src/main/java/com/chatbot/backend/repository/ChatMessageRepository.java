package com.chatbot.backend.repository;

import com.chatbot.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // récupérer tous les messages d'un utilisateur
    List<ChatMessage> findByUserIdOrderByCreatedAtAsc(Long userId);
}