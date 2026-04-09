package com.chatbot.backend.repository;

import com.chatbot.backend.model.Salle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalleRepository extends JpaRepository<Salle, Long> {
    Optional<Salle> findByNom(String nom);
    List<Salle> findByDisponible(Boolean disponible);
    List<Salle> findByType(Salle.TypeSalle type);
    Boolean existsByNom(String nom);
}
