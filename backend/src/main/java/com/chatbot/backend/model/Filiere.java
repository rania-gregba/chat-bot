package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "filieres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Filiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(unique = true, nullable = false)
    private String code;

    // Ex: Licence 1, Licence 2, Master 1...
    private String niveau;

    private String departement;

    // Nombre max d'étudiants dans cette filière
    private Integer capaciteMax;

    // Description de la filière
    @Column(length = 1000)
    private String description;
}
