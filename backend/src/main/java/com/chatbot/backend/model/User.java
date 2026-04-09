package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    // ===== PROFIL ÉTENDU =====
    private String firstName;
    private String lastName;
    private String cin;
    private String phone;
    private String address;
    private String gender;
    private String nationality;
    private String birthDate;
    private String birthPlace;

    // ===== INFOS ACADÉMIQUES =====
    @Column(unique = true)
    private String studentId;
    private String fieldOfStudy;
    private String academicLevel;
    private String academicYear;
    private String institution;
    private String faculty;
    private String department;

    // ===== INFOS SUPPLÉMENTAIRES =====
    private String fatherName;
    private String motherName;
    private String bacType;
    private String scholarship;

    @Column(length = 2000)
    private String additionalInfo;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // 3 types de rôles : étudiant (USER), professeur, administrateur
    public enum Role {
        USER, ADMIN, PROFESSEUR
    }
}
