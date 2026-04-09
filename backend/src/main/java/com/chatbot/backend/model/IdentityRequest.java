package com.chatbot.backend.model;

import lombok.Data;

@Data
public class IdentityRequest {
    private String role;
    private String firstName;
    private String lastName;
    private String cin;
}
