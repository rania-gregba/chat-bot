package com.chatbot.backend.service;

import com.chatbot.backend.model.*;
import com.chatbot.backend.repository.UserRepository;
import com.chatbot.backend.repository.UniversityIdentityRepository;
import com.chatbot.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UniversityIdentityRepository universityIdentityRepository;
    private final PasswordEncoder passwordEncoder;

    // ============================================
    // INSCRIPTION AVEC PROFIL COMPLET
    // ============================================
    public AuthResponse register(RegisterRequest request) {
        // Vérifications
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username déjà utilisé");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        // Vérification de l'identifiant fourni (studentId)
        String providedId = request.getStudentId();
        if (providedId == null || providedId.trim().isEmpty()) {
            throw new RuntimeException("Un identifiant généré par l'administration est obligatoire pour s'inscrire.");
        }

        UniversityIdentity identity = universityIdentityRepository.findByIdentifier(providedId)
                .orElseThrow(() -> new RuntimeException("Cet identifiant est introuvable."));

        if (!identity.getCin().trim().equalsIgnoreCase(request.getCin().trim())) {
             throw new RuntimeException("Le CIN ne correspond pas à cet identifiant.");
        }

        if (identity.isUsed()) {
            throw new RuntimeException("Cet identifiant a déjà été utilisé pour une inscription.");
        }

        // On peut s'assurer que le rôle correspond
        String expectedRole = request.getRole() != null ? request.getRole().toUpperCase() : "USER";
        if (!identity.getRole().equals(expectedRole)) {
             throw new RuntimeException("Le rôle choisi ne correspond pas à l'identifiant fourni.");
        }

        // Création utilisateur
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Rôle (par défaut USER = étudiant)
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(User.Role.USER);
            }
        } else {
            user.setRole(User.Role.USER);
        }

        // Profil personnel
        // Utilisation du Nom et Prénom de l'identifiant admin pour l'intégrité
        user.setFirstName(identity.getFirstName());
        user.setLastName(identity.getLastName());
        user.setCin(identity.getCin());
        user.setBirthDate(request.getBirthDate());
        user.setBirthPlace(request.getBirthPlace());
        user.setGender(request.getGender());
        user.setNationality(request.getNationality());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());

        // Profil académique
        user.setStudentId(request.getStudentId());
        user.setFieldOfStudy(request.getFieldOfStudy());
        user.setAcademicLevel(request.getAcademicLevel());
        user.setAcademicYear(request.getAcademicYear());
        user.setInstitution(request.getInstitution());
        user.setFaculty(request.getFaculty());
        user.setDepartment(request.getDepartment());
        user.setBacType(request.getBacType());
        user.setScholarship(request.getScholarship());

        // Famille
        user.setFatherName(request.getFatherName());
        user.setMotherName(request.getMotherName());

        // Infos supp
        user.setAdditionalInfo(request.getAdditionalInfo());

        userRepository.save(user);

        // Marquer l'identifiant comme utilisé
        identity.setUsed(true);
        universityIdentityRepository.save(identity);

        // Générer token
        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }

    // ============================================
    // CONNEXION
    // ============================================
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }
}