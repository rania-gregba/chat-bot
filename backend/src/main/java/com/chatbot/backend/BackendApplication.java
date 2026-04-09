package com.chatbot.backend;

// Classe qui permet de démarrer l'application Spring Boot.
import org.springframework.boot.SpringApplication;
// Elle active automatiquement :
// - configuration automatique
// - scan des composants (@Controller, @Service, @Repository)
// - configuration Spring
import org.springframework.boot.autoconfigure.SpringBootApplication;
// Configuration automatique pour MongoDB.
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
// Configuration Spring Data MongoDB.
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.chatbot.backend.model.User;
import com.chatbot.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication(exclude = {
        MongoAutoConfiguration.class,
        MongoDataAutoConfiguration.class
})
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            User admin = userRepository.findByUsername("admin").orElse(new User());
            admin.setUsername("admin");
            admin.setEmail("admin@fpst.tn");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(User.Role.ADMIN);
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            
            userRepository.save(admin);
            System.out.println("✅ Compte Admin vérifié/mis à jour (admin / admin123)");
        };
    }
}