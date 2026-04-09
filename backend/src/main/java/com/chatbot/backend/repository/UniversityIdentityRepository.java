package com.chatbot.backend.repository;

import com.chatbot.backend.model.UniversityIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversityIdentityRepository extends JpaRepository<UniversityIdentity, Long> {
    Optional<UniversityIdentity> findByIdentifierAndCin(String identifier, String cin);
    Optional<UniversityIdentity> findByIdentifier(String identifier);
    boolean existsByIdentifier(String identifier);
}
