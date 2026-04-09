package com.chatbot.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // type de document : attestation_travail, attestation_scolarite, etc.
    private String documentType;

    // nom complet de la personne
    private String fullName;

    // informations supplémentaires
    private String additionalInfo;

    // format : PDF ou WORD
    private String format;

    // statut : EN_ATTENTE, GENERE
    private String status = "EN_ATTENTE";

    // chemin du fichier généré
    private String filePath;

    // qui a demandé ce document
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime createdAt = LocalDateTime.now();
}