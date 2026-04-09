package com.chatbot.backend.model;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
//Crée automatiquement un constructeur
@AllArgsConstructor
//classejava: Objet simple pour envoyer des données au frontend(dto)
public class AuthResponse {
    //le token sécurisé généré après login. Frontend va sauvegarder ce token et Puis l’envoyer dans chaque requête API.
    private String token;
    //pour savoir quel utilisateur est connecté.
    private String username;
    //permet de gérer les permissions soit user soit admin
    private String role;
}
//Ce fichier sert à envoyer la réponse après login ou register.
//Quand utilisateur se connecte ✅
//le backend répond avec :
//token JWT
//username
//role

//| Classe            | Rôle                   |
//| ----------------- | ---------------------- |
//| `RegisterRequest` | données inscription    |
//| `LoginRequest`    | données login          |
//| `User`            | table database         |
//| `AuthResponse`    | réponse login/register |
//| `JwtService`      | crée token             |
//| `AuthService`     | logique authentication |