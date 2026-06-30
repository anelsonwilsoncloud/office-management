package com.office.officemanagement.password;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_password")
public class UserPassword {

    @Id
    private String id = "SINGLETON";  // Only one password record

    @Column(nullable = false)
    private String passwordHash;

    public UserPassword() {}

    public UserPassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
