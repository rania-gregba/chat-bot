package com.chatbot.backend.controller;

import com.chatbot.backend.model.Matiere;
import com.chatbot.backend.model.Filiere;
import com.chatbot.backend.repository.MatiereRepository;
import com.chatbot.backend.repository.FiliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matieres")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748"})
@RequiredArgsConstructor
public class MatiereController {

    private final MatiereRepository matiereRepository;
    private final FiliereRepository filiereRepository;

    @GetMapping
    public ResponseEntity<List<Matiere>> getAll() {
        return ResponseEntity.ok(matiereRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Matiere> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                matiereRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Matière non trouvée"))
        );
    }

    @GetMapping("/filiere/{filiereId}")
    public ResponseEntity<List<Matiere>> getByFiliere(@PathVariable Long filiereId) {
        return ResponseEntity.ok(matiereRepository.findByFiliereId(filiereId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        if (matiereRepository.existsByCode(code)) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Le code matière existe déjà");
            return ResponseEntity.badRequest().body(error);
        }

        Matiere matiere = new Matiere();
        matiere.setNom((String) request.get("nom"));
        matiere.setCode(code);
        matiere.setCoefficient(request.get("coefficient") != null ?
                Double.valueOf(request.get("coefficient").toString()) : null);
        matiere.setVolumeHoraire(request.get("volumeHoraire") != null ?
                Integer.valueOf(request.get("volumeHoraire").toString()) : null);
        if (request.get("type") != null) {
            matiere.setType(Matiere.TypeMatiere.valueOf((String) request.get("type")));
        }
        if (request.get("filiereId") != null) {
            Long filiereId = Long.valueOf(request.get("filiereId").toString());
            Filiere filiere = filiereRepository.findById(filiereId)
                    .orElseThrow(() -> new RuntimeException("Filière non trouvée"));
            matiere.setFiliere(filiere);
        }

        return ResponseEntity.ok(matiereRepository.save(matiere));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Matiere> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Matiere existing = matiereRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matière non trouvée"));

        if (request.containsKey("nom")) existing.setNom((String) request.get("nom"));
        if (request.containsKey("code")) existing.setCode((String) request.get("code"));
        if (request.containsKey("coefficient"))
            existing.setCoefficient(Double.valueOf(request.get("coefficient").toString()));
        if (request.containsKey("volumeHoraire"))
            existing.setVolumeHoraire(Integer.valueOf(request.get("volumeHoraire").toString()));
        if (request.containsKey("type"))
            existing.setType(Matiere.TypeMatiere.valueOf((String) request.get("type")));
        if (request.containsKey("filiereId")) {
            Long filiereId = Long.valueOf(request.get("filiereId").toString());
            Filiere filiere = filiereRepository.findById(filiereId)
                    .orElseThrow(() -> new RuntimeException("Filière non trouvée"));
            existing.setFiliere(filiere);
        }

        return ResponseEntity.ok(matiereRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        matiereRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Matière supprimée avec succès");
        return ResponseEntity.ok(response);
    }
}
