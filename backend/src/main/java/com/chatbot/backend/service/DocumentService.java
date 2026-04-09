package com.chatbot.backend.service;

import com.chatbot.backend.model.DocumentRequest;
import com.chatbot.backend.model.User;
import com.chatbot.backend.repository.DocumentRepository;
import com.chatbot.backend.repository.UserRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.layout.element.Cell;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import java.io.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    // dossier où on sauvegarde les documents
    private final String UPLOAD_DIR = "documents/";

    // ============================================
    // GÉNÉRER UN DOCUMENT
    // ============================================
    public DocumentRequest generateDocument(
            String documentType,
            String fullName,
            String additionalInfo,
            String format,
            String username
    ) throws Exception {

        // trouver l'utilisateur
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // créer le dossier si inexistant
        new File(UPLOAD_DIR).mkdirs();

        // nom du fichier
        String fileName = documentType + "_" + username + "_" +
                System.currentTimeMillis();

        String filePath;

        // générer selon le format
        if (format.equals("PDF")) {
            filePath = generatePDF(fileName, documentType, fullName, additionalInfo);
        } else {
            filePath = generateWord(fileName, documentType, fullName, additionalInfo);
        }

        // sauvegarder dans PostgreSQL
        DocumentRequest doc = new DocumentRequest();
        doc.setDocumentType(documentType);
        doc.setFullName(fullName);
        doc.setAdditionalInfo(additionalInfo);
        doc.setFormat(format);
        doc.setStatus("GENERE");
        doc.setFilePath(filePath);
        doc.setUser(user);

        return documentRepository.save(doc);
    }

    // ============================================
    // GÉNÉRER UN PDF
    // ============================================
    private String generatePDF(
            String fileName,
            String documentType,
            String fullName,
            String additionalInfo
    ) throws Exception {

        String filePath = UPLOAD_DIR + fileName + ".pdf";

        PdfWriter writer = new PdfWriter(filePath);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // titre principal
        Paragraph title = new Paragraph("ATTESTATION")
                .setFontSize(24)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.DARK_GRAY);
        document.add(title);

        // sous titre
        String subTitle = getDocumentTitle(documentType);
        document.add(new Paragraph(subTitle)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(30));

        // ligne de séparation
        document.add(new Paragraph("_".repeat(80))
                .setTextAlignment(TextAlignment.CENTER));

        // contenu principal
        String content = generateContent(documentType, fullName, additionalInfo);
        document.add(new Paragraph(content)
                .setFontSize(12)
                .setMarginTop(20)
                .setMarginBottom(20)
                .setTextAlignment(TextAlignment.JUSTIFIED));

        // date
        String date = LocalDate.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        );
        document.add(new Paragraph("Fait le : " + date)
                .setFontSize(11)
                .setMarginTop(30));

        // signature
        document.add(new Paragraph("Signature et cachet")
                .setFontSize(11)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(50));

        document.close();
        return filePath;
    }

    // ============================================
    // GÉNÉRER UN WORD
    // ============================================
    private String generateWord(
            String fileName,
            String documentType,
            String fullName,
            String additionalInfo
    ) throws Exception {

        String filePath = UPLOAD_DIR + fileName + ".docx";

        XWPFDocument document = new XWPFDocument();

        // titre
        XWPFParagraph titlePara = document.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setText("ATTESTATION");
        titleRun.setBold(true);
        titleRun.setFontSize(24);

        // sous titre
        XWPFParagraph subPara = document.createParagraph();
        subPara.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun subRun = subPara.createRun();
        subRun.setText(getDocumentTitle(documentType));
        subRun.setFontSize(16);

        // contenu
        XWPFParagraph contentPara = document.createParagraph();
        XWPFRun contentRun = contentPara.createRun();
        contentRun.setText(generateContent(documentType, fullName, additionalInfo));
        contentRun.setFontSize(12);

        // date
        XWPFParagraph datePara = document.createParagraph();
        XWPFRun dateRun = datePara.createRun();
        String date = LocalDate.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        );
        dateRun.setText("Fait le : " + date);

        // sauvegarder
        FileOutputStream out = new FileOutputStream(filePath);
        document.write(out);
        out.close();
        document.close();

        return filePath;
    }

    // ============================================
    // TITRE SELON LE TYPE
    // ============================================
    private String getDocumentTitle(String documentType) {
        return switch (documentType) {
            case "attestation_travail" -> "ATTESTATION DE TRAVAIL";
            case "attestation_scolarite" -> "ATTESTATION DE SCOLARITÉ";
            case "attestation_residence" -> "ATTESTATION DE RÉSIDENCE";
            default -> "ATTESTATION";
        };
    }

    // ============================================
    // CONTENU SELON LE TYPE
    // ============================================
    private String generateContent(
            String documentType,
            String fullName,
            String additionalInfo
    ) {
        String date = LocalDate.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        );

        return switch (documentType) {
            case "attestation_travail" ->
                    "Je soussigné, certifie que Monsieur/Madame " + fullName +
                            " travaille au sein de notre organisation. " +
                            (additionalInfo != null ? additionalInfo : "") +
                            " Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.";

            case "attestation_scolarite" ->
                    "Je soussigné, certifie que Monsieur/Madame " + fullName +
                            " est régulièrement inscrit(e) dans notre établissement. " +
                            (additionalInfo != null ? additionalInfo : "") +
                            " Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.";

            case "attestation_residence" ->
                    "Je soussigné, certifie que Monsieur/Madame " + fullName +
                            " réside à l'adresse suivante : " +
                            (additionalInfo != null ? additionalInfo : "") +
                            " Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.";

            default ->
                    "Je soussigné, certifie que Monsieur/Madame " + fullName +
                            " " + (additionalInfo != null ? additionalInfo : "") +
                            " Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.";
        };
    }

    // ============================================
    // RÉCUPÉRER LES DOCUMENTS D'UN UTILISATEUR
    // ============================================
    public List<DocumentRequest> getUserDocuments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return documentRepository.findByUserId(user.getId());
    }
}