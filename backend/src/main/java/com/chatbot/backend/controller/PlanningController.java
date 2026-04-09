package com.chatbot.backend.controller;

import com.chatbot.backend.model.EmploiDuTemps;
import com.chatbot.backend.model.Salle;
import com.chatbot.backend.service.PlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/planning")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748"})
@RequiredArgsConstructor
public class PlanningController {

    private final PlanningService planningService;

    // ============================================
    // PLANNING PAR FILIÈRE
    // ============================================
    @GetMapping("/filiere/{id}")
    public ResponseEntity<List<EmploiDuTemps>> getPlanningByFiliere(@PathVariable Long id) {
        return ResponseEntity.ok(planningService.getPlanningByFiliere(id));
    }

    // ============================================
    // PLANNING PAR PROFESSEUR
    // ============================================
    @GetMapping("/professeur/{id}")
    public ResponseEntity<List<EmploiDuTemps>> getPlanningByProfesseur(@PathVariable Long id) {
        return ResponseEntity.ok(planningService.getPlanningByProfesseur(id));
    }

    // ============================================
    // PLANNING PAR SALLE
    // ============================================
    @GetMapping("/salle/{id}")
    public ResponseEntity<List<EmploiDuTemps>> getPlanningBySalle(@PathVariable Long id) {
        return ResponseEntity.ok(planningService.getPlanningBySalle(id));
    }

    // ============================================
    // TOUS LES CRÉNEAUX
    // ============================================
    @GetMapping("/all")
    public ResponseEntity<List<EmploiDuTemps>> getAllCreneaux() {
        return ResponseEntity.ok(planningService.getAllCreneaux());
    }

    // ============================================
    // AJOUTER UN CRÉNEAU
    // ============================================
    @PostMapping("/creneaux")
    public ResponseEntity<?> ajouterCreneau(@RequestBody Map<String, Object> request) {
        try {
            EmploiDuTemps.Jour jour = EmploiDuTemps.Jour.valueOf((String) request.get("jour"));
            LocalTime heureDebut = LocalTime.parse((String) request.get("heureDebut"));
            LocalTime heureFin = LocalTime.parse((String) request.get("heureFin"));
            Long matiereId = Long.valueOf(request.get("matiereId").toString());
            Long salleId = Long.valueOf(request.get("salleId").toString());
            Long filiereId = Long.valueOf(request.get("filiereId").toString());
            Long professeurId = request.get("professeurId") != null ?
                    Long.valueOf(request.get("professeurId").toString()) : null;
            String groupe = (String) request.get("groupe");
            String semestre = (String) request.get("semestre");

            EmploiDuTemps creneau = planningService.creerCreneau(
                    jour, heureDebut, heureFin, matiereId, salleId, filiereId,
                    professeurId, groupe, semestre
            );
            return ResponseEntity.ok(creneau);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ============================================
    // SUPPRIMER UN CRÉNEAU
    // ============================================
    @DeleteMapping("/creneaux/{id}")
    public ResponseEntity<Map<String, String>> supprimerCreneau(@PathVariable Long id) {
        planningService.supprimerCreneau(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Créneau supprimé avec succès");
        return ResponseEntity.ok(response);
    }

    // ============================================
    // GÉNÉRATION AUTOMATIQUE
    // ============================================
    @PostMapping("/generer")
    public ResponseEntity<?> genererPlanning(@RequestBody Map<String, Object> request) {
        try {
            Long filiereId = Long.valueOf(request.get("filiereId").toString());
            String semestre = (String) request.getOrDefault("semestre", "S1");

            List<EmploiDuTemps> planning = planningService.genererPlanningAutomatique(filiereId, semestre);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Planning généré avec succès");
            response.put("nbCreneaux", planning.size());
            response.put("planning", planning);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ============================================
    // SALLES DISPONIBLES POUR UN CRÉNEAU
    // ============================================
    @GetMapping("/salles-disponibles")
    public ResponseEntity<List<Salle>> getSallesDisponibles(
            @RequestParam String jour,
            @RequestParam String heureDebut,
            @RequestParam String heureFin
    ) {
        EmploiDuTemps.Jour jourEnum = EmploiDuTemps.Jour.valueOf(jour);
        LocalTime debut = LocalTime.parse(heureDebut);
        LocalTime fin = LocalTime.parse(heureFin);
        return ResponseEntity.ok(planningService.getSallesDisponibles(jourEnum, debut, fin));
    }
}
