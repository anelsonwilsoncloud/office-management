package com.office.officemanagement.password;

import java.util.Optional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {

    private static final String SINGLETON_ID = "SINGLETON";
    private final UserPasswordRepository repository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public PasswordService(UserPasswordRepository repository) {
        this.repository = repository;
    }

    public boolean isPasswordSet() {
        return repository.existsById(SINGLETON_ID);
    }

    public void setPassword(String plainPassword) {
        String hash = encoder.encode(plainPassword);
        UserPassword userPassword = repository.findById(SINGLETON_ID)
                .orElse(new UserPassword());
        userPassword.setPasswordHash(hash);
        repository.save(userPassword);
    }

    public boolean verifyPassword(String plainPassword) {
        Optional<UserPassword> opt = repository.findById(SINGLETON_ID);
        if (opt.isEmpty()) {
            return false;
        }
        return encoder.matches(plainPassword, opt.get().getPasswordHash());
    }

    public void deletePassword() {
        repository.deleteById(SINGLETON_ID);
    }
}
