package com.office.officemanagement.password;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/password")
public class PasswordController {

    private final PasswordService passwordService;

    public PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @GetMapping("/status")
    public PasswordStatusResponse getStatus() {
        return new PasswordStatusResponse(passwordService.isPasswordSet());
    }

    @PostMapping("/set")
    public ResponseEntity<Void> setPassword(@Valid @RequestBody PasswordRequest request) {
        // Prevent overwriting existing password without explicit deletion
        if (passwordService.isPasswordSet()) {
            return ResponseEntity.status(409).build(); // 409 Conflict
        }
        passwordService.setPassword(request.getPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify")
    public PasswordVerifyResponse verifyPassword(@Valid @RequestBody PasswordRequest request) {
        boolean valid = passwordService.verifyPassword(request.getPassword());
        return new PasswordVerifyResponse(valid);
    }

    @DeleteMapping
    public ResponseEntity<Void> deletePassword() {
        passwordService.deletePassword();
        return ResponseEntity.noContent().build();
    }
}
