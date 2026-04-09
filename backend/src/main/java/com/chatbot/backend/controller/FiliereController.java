package com.chatbot.backend.controller;

import com.chatbot.backend.model.Filiere;
import com.chatbot.backend.repository.FiliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/filieres")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748"})
@RequiredArgsConstructor
public class FiliereController {

    private final FiliereRepository filiereRepository;

    @GetMapping
    public ResponseEntity<List<Filiere>> getAll() {
        return ResponseEntity.ok(filiereRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Filiere> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                filiereRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Filière non trouvée"))
        );
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Filiere filiere) {
        if (filiereRepository.existsByCode(filiere.getCode())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Le code filière existe déjà");
            return ResponseEntity.badRequest().body(error);
        }
        return ResponseEntity.ok(filiereRepository.save(filiere));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Filiere> update(@PathVariable Long id, @RequestBody Filiere filiere) {
        Filiere existing = filiereRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filière non trouvée"));
        existing.setNom(filiere.getNom());
        existing.setCode(filiere.getCode());
        existing.setNiveau(filiere.getNiveau());
        existing.setDepartement(filiere.getDepartement());
        existing.setCapaciteMax(filiere.getCapaciteMax());
        existing.setDescription(filiere.getDescription());
        return ResponseEntity.ok(filiereRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        filiereRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Filière supprimée avec succès");
        return ResponseEntity.ok(response);
    }
}
