package com.chatbot.backend.repository;
//on import la classe user
import com.chatbot.backend.model.User;
//JpaRepository C’est une interface fournie par Spring Data JPA il donne des methodes pour lire supp compter et tout dans ecrire un long code sql
import org.springframework.data.jpa.repository.JpaRepository;
//Ce fichier est un composant d'accès à la base de données
import org.springframework.stereotype.Repository;
//Optional Quand tu cherches un utilisateur :peut exister  ou non
import java.util.Optional;

@Repository
//UserRepository reçoit toutes les méthodes de JpaRepository.
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    java.util.List<User> findByRole(com.chatbot.backend.model.User.Role role);
}
//UserRepository = robot automatique base de données
//Sans écrire SQL tu peux : ajouter utilisateur chercher utilisateur  vérifier existence supprimer utilisateur