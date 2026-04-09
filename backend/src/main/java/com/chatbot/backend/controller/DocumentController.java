package com.chatbot.backend.controller;

import com.chatbot.backend.model.DocumentRequest;
import com.chatbot.backend.repository.DocumentRepository;
import com.chatbot.backend.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;

    // ============================================
    // GÉNÉRER UN DOCUMENT
    // ============================================
    @PostMapping("/generate")
    public ResponseEntity<DocumentRequest> generateDocument(
            @RequestBody Map<String, String> request
    ) throws Exception {

        DocumentRequest doc = documentService.generateDocument(
                request.get("documentType"),
                request.get("fullName"),
                request.get("additionalInfo"),
                request.get("format"),
                request.get("username")
        );

        return ResponseEntity.ok(doc);
    }

    // ============================================
    // TÉLÉCHARGER UN DOCUMENT
    // ============================================
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id
    ) throws Exception {

        // chercher le document directement par ID
        DocumentRequest doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));

        File file = new File(doc.getFilePath());

        if (!file.exists()) {
            throw new RuntimeException("Fichier non trouvé sur le serveur");
        }

        Resource resource = new FileSystemResource(file);

        String contentType = doc.getFormat().equals("PDF") ?
                "application/pdf" :
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getName() + "\"")
                .body(resource);
    }

    // ============================================
    // LISTE DES DOCUMENTS D'UN UTILISATEUR
    // ============================================
    @GetMapping("/list/{username}")
    public ResponseEntity<List<DocumentRequest>> getUserDocuments(
            @PathVariable String username
    ) {
        return ResponseEntity.ok(documentService.getUserDocuments(username));
    }
}