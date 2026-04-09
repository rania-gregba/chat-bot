package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Etudiant
    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    private User etudiant;

    // Matière concernée
    @ManyToOne
    @JoinColumn(name = "matiere_id", nullable = false)
    private Matiere matiere;

    // Type d'évaluation (DS, Examen, TP, Projet, etc.)
    @Column(nullable = false)
    private String typeEvaluation;

    // Note sur 20
    @Column(nullable = false)
    private Double valeur;

    // Professeur qui a saisi la note
    @ManyToOne
    @JoinColumn(name = "professeur_id", nullable = false)
    private User professeur;
    
    // Commentaire éventuel
    private String commentaire;

    @Column(updatable = false)
    private LocalDateTime dateSaisie;

    @PrePersist
    protected void onCreate() {
        this.dateSaisie = LocalDateTime.now();
    }
}
