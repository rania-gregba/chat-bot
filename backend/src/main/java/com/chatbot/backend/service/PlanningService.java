package com.chatbot.backend.service;

import com.chatbot.backend.model.*;
import com.chatbot.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanningService {

    private final EmploiDuTempsRepository emploiDuTempsRepository;
    private final SalleRepository salleRepository;
    private final MatiereRepository matiereRepository;
    private final FiliereRepository filiereRepository;
    private final UserRepository userRepository;

    // ============================================
    // RÉCUPÉRER LE PLANNING PAR FILIÈRE
    // ============================================
    public List<EmploiDuTemps> getPlanningByFiliere(Long filiereId) {
        return emploiDuTempsRepository.findByFiliereIdOrderByJourAscHeureDebutAsc(filiereId);
    }

    // ============================================
    // RÉCUPÉRER LE PLANNING PAR PROFESSEUR
    // ============================================
    public List<EmploiDuTemps> getPlanningByProfesseur(Long professeurId) {
        return emploiDuTempsRepository.findByProfesseurIdOrderByJourAscHeureDebutAsc(professeurId);
    }

    // ============================================
    // RÉCUPÉRER LE PLANNING PAR SALLE
    // ============================================
    public List<EmploiDuTemps> getPlanningBySalle(Long salleId) {
        return emploiDuTempsRepository.findBySalleIdOrderByJourAscHeureDebutAsc(salleId);
    }

    // ============================================
    // RÉCUPÉRER LE PLANNING PAR JOUR ET FILIÈRE
    // ============================================
    public List<EmploiDuTemps> getPlanningByJourAndFiliere(EmploiDuTemps.Jour jour, Long filiereId) {
        return emploiDuTempsRepository.findByJourAndFiliereId(jour, filiereId);
    }

    // ============================================
    // AJOUTER UN CRÉNEAU (AVEC VÉRIFICATION CONFLITS)
    // ============================================
    public EmploiDuTemps ajouterCreneau(EmploiDuTemps creneau) {
        // Vérifier conflit de salle
        List<EmploiDuTemps> conflitsSalle = emploiDuTempsRepository.findConflitsSalle(
                creneau.getSalle().getId(),
                creneau.getJour(),
                creneau.getHeureDebut(),
                creneau.getHeureFin()
        );
        if (!conflitsSalle.isEmpty()) {
            throw new RuntimeException("Conflit : la salle " + creneau.getSalle().getNom() +
                    " est déjà occupée à cet horaire le " + creneau.getJour());
        }

        // Vérifier conflit de professeur
        if (creneau.getProfesseur() != null) {
            List<EmploiDuTemps> conflitsProf = emploiDuTempsRepository.findConflitsProfesseur(
                    creneau.getProfesseur().getId(),
                    creneau.getJour(),
                    creneau.getHeureDebut(),
                    creneau.getHeureFin()
            );
            if (!conflitsProf.isEmpty()) {
                throw new RuntimeException("Conflit : le professeur est déjà affecté à un autre cours à cet horaire");
            }
        }

        return emploiDuTempsRepository.save(creneau);
    }

    // ============================================
    // CRÉER UN CRÉNEAU À PARTIR DES IDs
    // ============================================
    public EmploiDuTemps creerCreneau(
            EmploiDuTemps.Jour jour,
            LocalTime heureDebut,
            LocalTime heureFin,
            Long matiereId,
            Long salleId,
            Long filiereId,
            Long professeurId,
            String groupe,
            String semestre
    ) {
        Matiere matiere = matiereRepository.findById(matiereId)
                .orElseThrow(() -> new RuntimeException("Matière non trouvée"));
        Salle salle = salleRepository.findById(salleId)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée"));
        Filiere filiere = filiereRepository.findById(filiereId)
                .orElseThrow(() -> new RuntimeException("Filière non trouvée"));

        User professeur = null;
        if (professeurId != null) {
            professeur = userRepository.findById(professeurId)
                    .orElseThrow(() -> new RuntimeException("Professeur non trouvé"));
        }

        EmploiDuTemps creneau = new EmploiDuTemps();
        creneau.setJour(jour);
        creneau.setHeureDebut(heureDebut);
        creneau.setHeureFin(heureFin);
        creneau.setMatiere(matiere);
        creneau.setSalle(salle);
        creneau.setFiliere(filiere);
        creneau.setProfesseur(professeur);
        creneau.setGroupe(groupe);
        creneau.setSemestre(semestre);

        return ajouterCreneau(creneau);
    }

    // ============================================
    // SUPPRIMER UN CRÉNEAU
    // ============================================
    public void supprimerCreneau(Long id) {
        if (!emploiDuTempsRepository.existsById(id)) {
            throw new RuntimeException("Créneau non trouvé");
        }
        emploiDuTempsRepository.deleteById(id);
    }

    // ============================================
    // GÉNÉRATION AUTOMATIQUE DES PLANNINGS
    // ============================================
    public List<EmploiDuTemps> genererPlanningAutomatique(Long filiereId, String semestre) {
        filiereRepository.findById(filiereId)
                .orElseThrow(() -> new RuntimeException("Filière non trouvée"));

        List<Matiere> matieres = matiereRepository.findByFiliereId(filiereId);
        List<Salle> sallesDisponibles = salleRepository.findByDisponible(true);

        if (matieres.isEmpty()) {
            throw new RuntimeException("Aucune matière pour cette filière");
        }
        if (sallesDisponibles.isEmpty()) {
            throw new RuntimeException("Aucune salle disponible");
        }

        List<EmploiDuTemps> planning = new ArrayList<>();
        EmploiDuTemps.Jour[] jours = {
                EmploiDuTemps.Jour.LUNDI,
                EmploiDuTemps.Jour.MARDI,
                EmploiDuTemps.Jour.MERCREDI,
                EmploiDuTemps.Jour.JEUDI,
                EmploiDuTemps.Jour.VENDREDI,
                EmploiDuTemps.Jour.SAMEDI
        };

        // Créneaux possibles (8h30-17h, par blocs de 1h30)
        LocalTime[] heuresDebut = {
                LocalTime.of(8, 30),
                LocalTime.of(10, 15),
                LocalTime.of(12, 0),
                LocalTime.of(13, 45),
                LocalTime.of(15, 30)
        };

        List<User> professeurs = userRepository.findByRole(User.Role.PROFESSEUR);
        int profIdx = 0;
        int jourIdx = 0;
        int creneauIdx = 0;
        int salleIdx = 0;

        for (Matiere matiere : matieres) {
            int nbCreneaux = matiere.getVolumeHoraire() != null ? (int) Math.ceil(matiere.getVolumeHoraire() / 1.5) : 1;

            // Assigner un prof à cette matière (round robin)
            Long assignProfId = null;
            if (!professeurs.isEmpty()) {
                assignProfId = professeurs.get(profIdx % professeurs.size()).getId();
                profIdx++;
            }

            for (int i = 0; i < nbCreneaux && jourIdx < jours.length; i++) {
                try {
                    Salle salle = sallesDisponibles.get(salleIdx % sallesDisponibles.size());
                    LocalTime debut = heuresDebut[creneauIdx];
                    LocalTime fin = debut.plusMinutes(90);

                    EmploiDuTemps creneau = creerCreneau(
                            jours[jourIdx],
                            debut,
                            fin,
                            matiere.getId(),
                            salle.getId(),
                            filiereId,
                            assignProfId,
                            "Groupe A", // Random
                            semestre
                    );
                    planning.add(creneau);

                    salleIdx++;
                    creneauIdx++;
                    if (creneauIdx >= heuresDebut.length) {
                        creneauIdx = 0;
                        jourIdx++;
                    }
                } catch (RuntimeException e) {
                    // Conflit détecté, essayer le créneau suivant
                    salleIdx++;
                    creneauIdx++;
                    if (creneauIdx >= heuresDebut.length) {
                        creneauIdx = 0;
                        jourIdx++;
                    }
                    i--; // Réessayer cette matière
                }
            }
        }

        return planning;
    }

    // ============================================
    // OBTENIR TOUS LES CRÉNEAUX
    // ============================================
    public List<EmploiDuTemps> getAllCreneaux() {
        return emploiDuTempsRepository.findAll();
    }

    // ============================================
    // SALLES DISPONIBLES POUR UN CRÉNEAU
    // ============================================
    public List<Salle> getSallesDisponibles(EmploiDuTemps.Jour jour, LocalTime heureDebut, LocalTime heureFin) {
        List<Salle> toutesLesSalles = salleRepository.findByDisponible(true);
        return toutesLesSalles.stream()
                .filter(salle -> {
                    List<EmploiDuTemps> conflits = emploiDuTempsRepository.findConflitsSalle(
                            salle.getId(), jour, heureDebut, heureFin
                    );
                    return conflits.isEmpty();
                })
                .collect(Collectors.toList());
    }
}
