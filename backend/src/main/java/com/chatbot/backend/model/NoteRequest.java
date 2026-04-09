package com.chatbot.backend.model;

import lombok.Data;

@Data
public class NoteRequest {
    private Long etudiantId;
    private Long matiereId;
    private Long professeurId;
    private String typeEvaluation;
    private Double valeur;
    private String commentaire;
}
