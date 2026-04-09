package com.chatbot.backend.repository;

import com.chatbot.backend.model.EmploiDuTemps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface EmploiDuTempsRepository extends JpaRepository<EmploiDuTemps, Long> {

    // Planning par filière
    List<EmploiDuTemps> findByFiliereIdOrderByJourAscHeureDebutAsc(Long filiereId);

    // Planning par professeur
    List<EmploiDuTemps> findByProfesseurIdOrderByJourAscHeureDebutAsc(Long professeurId);

    // Planning par salle
    List<EmploiDuTemps> findBySalleIdOrderByJourAscHeureDebutAsc(Long salleId);

    // Planning par jour et filière
    List<EmploiDuTemps> findByJourAndFiliereId(EmploiDuTemps.Jour jour, Long filiereId);

    // Vérifier les conflits de salle (même salle, même jour, horaires chevauchants)
    @Query("SELECT e FROM EmploiDuTemps e WHERE e.salle.id = :salleId AND e.jour = :jour " +
           "AND e.heureDebut < :heureFin AND e.heureFin > :heureDebut")
    List<EmploiDuTemps> findConflitsSalle(
            @Param("salleId") Long salleId,
            @Param("jour") EmploiDuTemps.Jour jour,
            @Param("heureDebut") LocalTime heureDebut,
            @Param("heureFin") LocalTime heureFin
    );

    // Vérifier les conflits de professeur
    @Query("SELECT e FROM EmploiDuTemps e WHERE e.professeur.id = :profId AND e.jour = :jour " +
           "AND e.heureDebut < :heureFin AND e.heureFin > :heureDebut")
    List<EmploiDuTemps> findConflitsProfesseur(
            @Param("profId") Long profId,
            @Param("jour") EmploiDuTemps.Jour jour,
            @Param("heureDebut") LocalTime heureDebut,
            @Param("heureFin") LocalTime heureFin
    );

    // Planning par semestre
    List<EmploiDuTemps> findBySemestreAndFiliereId(String semestre, Long filiereId);
}
