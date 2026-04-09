package com.chatbot.backend.controller;

import com.chatbot.backend.model.User;
import com.chatbot.backend.model.ChatMessage;
import com.chatbot.backend.model.DocumentRequest;
import com.chatbot.backend.model.UniversityIdentity;
import com.chatbot.backend.model.IdentityRequest;
import com.chatbot.backend.repository.*;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748"})
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentRepository documentRepository;
    private final FiliereRepository filiereRepository;
    private final SalleRepository salleRepository;
    private final MatiereRepository matiereRepository;
    private final EmploiDuTempsRepository emploiDuTempsRepository;
    private final UniversityIdentityRepository universityIdentityRepository;

    // ============================================
    // STATISTIQUES GÉNÉRALES
    // ============================================
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers", userRepository.count());
        stats.put("totalMessages", chatMessageRepository.count());
        stats.put("totalDocuments", documentRepository.count());
        stats.put("totalFilieres", filiereRepository.count());
        stats.put("totalSalles", salleRepository.count());
        stats.put("totalMatieres", matiereRepository.count());
        stats.put("totalCreneaux", emploiDuTempsRepository.count());

        // Nombre par rôle
        List<User> allUsers = userRepository.findAll();
        long nbEtudiants = allUsers.stream().filter(u -> u.getRole() == User.Role.USER).count();
        long nbProfesseurs = allUsers.stream().filter(u -> u.getRole() == User.Role.PROFESSEUR).count();
        long nbAdmins = allUsers.stream().filter(u -> u.getRole() == User.Role.ADMIN).count();
        stats.put("nbEtudiants", nbEtudiants);
        stats.put("nbProfesseurs", nbProfesseurs);
        stats.put("nbAdmins", nbAdmins);

        return ResponseEntity.ok(stats);
    }

    // ============================================
    // LISTE DES UTILISATEURS
    // ============================================
    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // ============================================
    // SUPPRIMER UN UTILISATEUR
    // ============================================
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Utilisateur supprimé avec succès");
        return ResponseEntity.ok(response);
    }

    // ============================================
    // CHANGER LE RÔLE D'UN UTILISATEUR
    // ============================================
    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String, String>> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String newRole = request.get("role");
        try {
            user.setRole(User.Role.valueOf(newRole.toUpperCase()));
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Rôle invalide. Utilisez: USER, ADMIN, PROFESSEUR");
            return ResponseEntity.badRequest().body(error);
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Rôle mis à jour : " + newRole);
        return ResponseEntity.ok(response);
    }

    // ============================================
    // LISTE DES CONVERSATIONS
    // ============================================
    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> getMessages() {
        return ResponseEntity.ok(chatMessageRepository.findAll());
    }

    // ============================================
    // LISTE DES DOCUMENTS
    // ============================================
    @GetMapping("/documents")
    public ResponseEntity<List<DocumentRequest>> getDocuments() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    // ============================================
    // LISTE DES PROFESSEURS
    // ============================================
    @GetMapping("/professeurs")
    public ResponseEntity<List<User>> getProfesseurs() {
        List<User> profs = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.PROFESSEUR)
                .toList();
        return ResponseEntity.ok(profs);
    }

    // ============================================
    // GENERER UN IDENTIFIANT UNIQUE
    // ============================================
    @PostMapping("/identities/generate")
    public ResponseEntity<Map<String, String>> generateIdentity(@RequestBody IdentityRequest request) {
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "USER";
        if (!role.equals("USER") && !role.equals("PROFESSEUR")) {
            throw new RuntimeException("Rôle invalide. Utilisez USER ou PROFESSEUR");
        }

        String cin = request.getCin();
        if (cin == null || cin.trim().isEmpty()) {
            throw new RuntimeException("Le CIN est obligatoire.");
        }

        // Génération d'un identifiant unique (12 pour USER, 8 pour PROFESSEUR)
        int length = role.equals("USER") ? 12 : 8;
        String identifier = generateRandomNumericString(length);

        // Vérifier unicité
        while (universityIdentityRepository.existsByIdentifier(identifier)) {
            identifier = generateRandomNumericString(length);
        }

        UniversityIdentity identity = UniversityIdentity.builder()
                .identifier(identifier)
                .role(role)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .cin(cin)
                .isUsed(false)
                .build();

        universityIdentityRepository.save(identity);

        Map<String, String> response = new HashMap<>();
        response.put("identifier", identifier);
        response.put("message", "Identifiant généré avec succès");
        return ResponseEntity.ok(response);
    }

    private String generateRandomNumericString(int length) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}