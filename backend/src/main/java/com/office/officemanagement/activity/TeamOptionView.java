package com.office.officemanagement.activity;

public record TeamOptionView(
        String name,
        boolean isDefault,
        int inUseCount,
        boolean removable
) {}
