package com.chatbot.backend.security;

// Bibliothèque JWT utilisée pour créer et lire les tokens.
import io.jsonwebtoken.*;
// Permet de générer une clé sécurisée pour signer le token.
import io.jsonwebtoken.security.Keys;
// Permet de lire des valeurs depuis application.properties.
import org.springframework.beans.factory.annotation.Value;
// Indique que cette classe est un service Spring.
import org.springframework.stereotype.Service;
// Représente la clé secrète utilisée pour signer JWT.
import java.security.Key;
// Utilisé pour gérer la date de création et expiration du token.
import java.util.Date;
// Spring crée automatiquement un objet JwtService.
@Service
public class JwtService {
    /* ================= CONFIGURATION ================= */
    // Récupère la clé secrète depuis application.yml.
     @Value("${jwt.secret}")
    private String secret;
    // Récupère la durée d'expiration du token.
    @Value("${jwt.expiration}")
    private Long expiration;

    /* ================= CREATION CLE ================= */
    // Convertit la clé secrète (String) en clé sécurisée JWT.
    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /* ================= GENERER TOKEN ================= */
    // Crée un nouveau token JWT contenant les infos utilisateur.
    public String generateToken(String username) {
        return Jwts.builder()
                // Identité utilisateur stockée dans token
                .setSubject(username)
                // Date de création du token
                .setIssuedAt(new Date())
                // Date d'expiration du token
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                // Signature du token avec clé secrète
                .signWith(getKey())
                // Génère le token final sous forme String
                .compact();
    }
    /* ================= EXTRAIRE USERNAME ================= */
    public String extractUsername(String token) {
         // Lit le token JWT et récupère les informations internes.
         return Jwts.parserBuilder()
                 // Vérifie signature avec clé secrète
                 .setSigningKey(getKey())
                 // Construit le parser JWT
                 .build()
                 // Décode le token
                 .parseClaimsJws(token)
                 // Récupère le contenu du token
                 .getBody()
                 // Retourne username stocké dans token
                 .getSubject();
    }
    /* ================= VERIFIER TOKEN ================= */
    public boolean isTokenValid(String token) {
        try {
            // Tente de lire le token
            // Si erreur → token invalide
            Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
            // Token valide
        } catch (Exception e) {
            // Token expiré, modifié ou faux
            return false;
        }
    }
}

//créer token
//lire token
//vérifier token