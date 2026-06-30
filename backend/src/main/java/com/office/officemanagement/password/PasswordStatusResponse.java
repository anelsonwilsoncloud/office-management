package com.office.officemanagement.password;

public class PasswordStatusResponse {

    private boolean isSet;

    public PasswordStatusResponse(boolean isSet) {
        this.isSet = isSet;
    }

    public boolean isSet() {
        return isSet;
    }

    public void setSet(boolean isSet) {
        this.isSet = isSet;
    }
}
