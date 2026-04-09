package com.chatbot.backend.controller;

import com.chatbot.backend.model.Salle;
import com.chatbot.backend.repository.SalleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salles")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748"})
@RequiredArgsConstructor
public class SalleController {

    private final SalleRepository salleRepository;

    @GetMapping
    public ResponseEntity<List<Salle>> getAll() {
        return ResponseEntity.ok(salleRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Salle> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                salleRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Salle non trouvée"))
        );
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Salle>> getDisponibles() {
        return ResponseEntity.ok(salleRepository.findByDisponible(true));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Salle>> getByType(@PathVariable Salle.TypeSalle type) {
        return ResponseEntity.ok(salleRepository.findByType(type));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Salle salle) {
        if (salleRepository.existsByNom(salle.getNom())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Le nom de salle existe déjà");
            return ResponseEntity.badRequest().body(error);
        }
        return ResponseEntity.ok(salleRepository.save(salle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Salle> update(@PathVariable Long id, @RequestBody Salle salle) {
        Salle existing = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée"));
        existing.setNom(salle.getNom());
        existing.setCapacite(salle.getCapacite());
        existing.setType(salle.getType());
        existing.setDisponible(salle.getDisponible());
        existing.setLocalisation(salle.getLocalisation());
        existing.setEquipements(salle.getEquipements());
        return ResponseEntity.ok(salleRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        salleRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Salle supprimée avec succès");
        return ResponseEntity.ok(response);
    }
}
