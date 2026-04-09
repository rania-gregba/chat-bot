package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "salles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Salle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nom;

    // Capacité en nombre de places
    private Integer capacite;

    // Type de salle
    @Enumerated(EnumType.STRING)
    private TypeSalle type = TypeSalle.SALLE_TD;

    // Si la salle est disponible (peut être mise hors service pour maintenance)
    private Boolean disponible = true;

    // Étage ou bâtiment
    private String localisation;

    // Équipements disponibles (projecteur, tableau interactif, etc.)
    @Column(length = 500)
    private String equipements;

    public enum TypeSalle {
        AMPHI, SALLE_TD, LABO, SALLE_INFO, SALLE_REUNION
    }
}
