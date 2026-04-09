package com.chatbot.backend.model;

import lombok.Data;

@Data
//classe java on cree  un Objet utilisé pour transporter les données API.
public class LoginRequest {
    //nom utilisateur envoyé depuis Angular.
    private String username;
    private String password;
}

//Ce fichier sert à recevoir les données quand l’utilisateur se connecte.
//
//Quand utilisateur fait :
// Login
//il envoie :
//username
//password
//| Classe            | Rôle                        |
//| ----------------- | --------------------------- |
//| `RegisterRequest` | inscription                 |
//| `LoginRequest`    | connexion                   |
//| `User`            | table database              |
//| `AuthResponse`    | réponse envoyée au frontend |