package com.office.officemanagement.password;

public class PasswordVerifyResponse {

    private boolean valid;

    public PasswordVerifyResponse(boolean valid) {
        this.valid = valid;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }
}
