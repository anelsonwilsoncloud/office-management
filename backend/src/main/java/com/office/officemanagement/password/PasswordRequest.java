package com.office.officemanagement.password;

import jakarta.validation.constraints.NotBlank;

public class PasswordRequest {

    @NotBlank(message = "Password is required")
    private String password;

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
