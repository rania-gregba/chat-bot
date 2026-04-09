package com.chatbot.backend.repository;

import com.chatbot.backend.model.DocumentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentRequest, Long> {
    List<DocumentRequest> findByUserId(Long userId);
}