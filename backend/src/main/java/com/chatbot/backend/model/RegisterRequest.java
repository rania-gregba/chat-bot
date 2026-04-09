package com.chatbot.backend.model;

import lombok.Data;

@Data
public class RegisterRequest {
    // Compte
    private String username;
    private String email;
    private String password;

    // Profil personnel
    private String firstName;
    private String lastName;
    private String cin;
    private String birthDate;
    private String birthPlace;
    private String gender;
    private String nationality;
    private String phone;
    private String address;

    // Profil académique
    private String studentId;
    private String fieldOfStudy;
    private String academicLevel;
    private String academicYear;
    private String institution;
    private String faculty;
    private String department;
    private String bacType;
    private String scholarship;

    // Famille
    private String fatherName;
    private String motherName;

    // Infos supplémentaires (JSON sérialisé)
    private String additionalInfo;

    // Rôle demandé (optionnel, par défaut USER)
    private String role;
}
