package com.chatbot.backend.controller;

import com.chatbot.backend.model.User;
import com.chatbot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:61748"})
@RequiredArgsConstructor
public class StudentController {

    private final UserRepository userRepository;

    // ============================================
    // RÉCUPÉRER LE PROFIL ÉTUDIANT
    // ============================================
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Extraire le username du token (simplifié — dans un vrai projet, utiliser le JwtService)
        // Pour l'instant, on accepte un paramètre username
        return ResponseEntity.ok(Map.of("message", "Utilisez /profile/{username}"));
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getProfileByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("cin", user.getCin());
        profile.put("phone", user.getPhone());
        profile.put("address", user.getAddress());
        profile.put("gender", user.getGender());
        profile.put("nationality", user.getNationality());
        profile.put("birthDate", user.getBirthDate());
        profile.put("birthPlace", user.getBirthPlace());
        profile.put("studentId", user.getStudentId());
        profile.put("fieldOfStudy", user.getFieldOfStudy());
        profile.put("academicLevel", user.getAcademicLevel());
        profile.put("academicYear", user.getAcademicYear());
        profile.put("institution", user.getInstitution());
        profile.put("faculty", user.getFaculty());
        profile.put("department", user.getDepartment());
        profile.put("role", user.getRole().name());

        return ResponseEntity.ok(profile);
    }

    // ============================================
    // METTRE À JOUR LE PROFIL
    // ============================================
    @PutMapping("/profile/{username}")
    public ResponseEntity<?> updateProfile(
            @PathVariable String username,
            @RequestBody Map<String, String> updates
    ) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (updates.containsKey("firstName")) user.setFirstName(updates.get("firstName"));
        if (updates.containsKey("lastName")) user.setLastName(updates.get("lastName"));
        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        if (updates.containsKey("address")) user.setAddress(updates.get("address"));
        if (updates.containsKey("email")) user.setEmail(updates.get("email"));
        if (updates.containsKey("fieldOfStudy")) user.setFieldOfStudy(updates.get("fieldOfStudy"));
        if (updates.containsKey("academicLevel")) user.setAcademicLevel(updates.get("academicLevel"));

        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Profil mis à jour avec succès");
        return ResponseEntity.ok(response);
    }
}
