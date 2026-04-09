package com.chatbot.backend.service;

import com.chatbot.backend.model.Matiere;
import com.chatbot.backend.model.Note;
import com.chatbot.backend.model.NoteRequest;
import com.chatbot.backend.model.User;
import com.chatbot.backend.repository.MatiereRepository;
import com.chatbot.backend.repository.NoteRepository;
import com.chatbot.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final MatiereRepository matiereRepository;

    public NoteService(NoteRepository noteRepository, UserRepository userRepository, MatiereRepository matiereRepository) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.matiereRepository = matiereRepository;
    }

    public Note ajouterNote(NoteRequest request) {
        User etudiant = userRepository.findById(request.getEtudiantId())
            .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));
            
        User prof = userRepository.findById(request.getProfesseurId())
            .orElseThrow(() -> new RuntimeException("Professeur introuvable"));
            
        Matiere matiere = matiereRepository.findById(request.getMatiereId())
            .orElseThrow(() -> new RuntimeException("Matière introuvable"));

        Note note = new Note();
        note.setEtudiant(etudiant);
        note.setProfesseur(prof);
        note.setMatiere(matiere);
        note.setTypeEvaluation(request.getTypeEvaluation());
        note.setValeur(request.getValeur());
        note.setCommentaire(request.getCommentaire());

        return noteRepository.save(note);
    }

    public List<Note> getNotesByEtudiant(Long etudiantId) {
        return noteRepository.findByEtudiantId(etudiantId);
    }

    public List<Note> getNotesByProfesseur(Long professeurId) {
        return noteRepository.findByProfesseurId(professeurId);
    }
    
    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }
    
    public void supprimerNote(Long id) {
        noteRepository.deleteById(id);
    }
}
