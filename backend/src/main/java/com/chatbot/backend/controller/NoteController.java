package com.chatbot.backend.controller;

import com.chatbot.backend.model.Note;
import com.chatbot.backend.model.NoteRequest;
import com.chatbot.backend.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:4200")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public ResponseEntity<Note> ajouterNote(@RequestBody NoteRequest request) {
        return ResponseEntity.ok(noteService.ajouterNote(request));
    }

    @GetMapping("/etudiant/{id}")
    public ResponseEntity<List<Note>> getNotesEtudiant(@PathVariable Long id) {
        return ResponseEntity.ok(noteService.getNotesByEtudiant(id));
    }

    @GetMapping("/professeur/{id}")
    public ResponseEntity<List<Note>> getNotesProfesseur(@PathVariable Long id) {
        return ResponseEntity.ok(noteService.getNotesByProfesseur(id));
    }

    @GetMapping
    public ResponseEntity<List<Note>> getAllNotes() {
        return ResponseEntity.ok(noteService.getAllNotes());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerNote(@PathVariable Long id) {
        noteService.supprimerNote(id);
        return ResponseEntity.ok().build();
    }
}
