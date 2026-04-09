package com.chatbot.backend.repository;

import com.chatbot.backend.model.Filiere;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {
    Optional<Filiere> findByCode(String code);
    Optional<Filiere> findByNom(String nom);
    Boolean existsByCode(String code);
}
