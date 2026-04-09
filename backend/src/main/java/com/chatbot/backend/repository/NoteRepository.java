package com.chatbot.backend.repository;

import com.chatbot.backend.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByEtudiantId(Long etudiantId);
    List<Note> findByMatiereId(Long matiereId);
    List<Note> findByProfesseurId(Long professeurId);
    List<Note> findByEtudiantIdAndMatiereId(Long etudiantId, Long matiereId);
}
