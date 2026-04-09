package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalTime;

@Entity
@Table(name = "emploi_du_temps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmploiDuTemps {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Jour de la semaine
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Jour jour;

    // Heure de début du créneau
    @Column(nullable = false)
    private LocalTime heureDebut;

    // Heure de fin du créneau
    @Column(nullable = false)
    private LocalTime heureFin;

    // Matière enseignée dans ce créneau
    @ManyToOne
    @JoinColumn(name = "matiere_id", nullable = false)
    private Matiere matiere;

    // Salle assignée
    @ManyToOne
    @JoinColumn(name = "salle_id", nullable = false)
    private Salle salle;

    // Filière concernée
    @ManyToOne
    @JoinColumn(name = "filiere_id", nullable = false)
    private Filiere filiere;

    // Professeur assigné
    @ManyToOne
    @JoinColumn(name = "professeur_id")
    private User professeur;

    // Groupe (ex: Groupe A, Groupe B pour les TD)
    private String groupe;

    // Semestre (S1, S2)
    private String semestre;

    public enum Jour {
        LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI
    }
}
