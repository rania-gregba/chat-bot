package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "matieres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Matiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(unique = true, nullable = false)
    private String code;

    // Coefficient de la matière
    private Double coefficient;

    // Volume horaire par semaine (en heures)
    private Integer volumeHoraire;

    // Type : CM (Cours Magistral), TD (Travaux Dirigés), TP (Travaux Pratiques)
    @Enumerated(EnumType.STRING)
    private TypeMatiere type = TypeMatiere.CM;

    // Filière à laquelle appartient cette matière
    @ManyToOne
    @JoinColumn(name = "filiere_id")
    private Filiere filiere;

    public enum TypeMatiere {
        CM, TD, TP
    }
}
