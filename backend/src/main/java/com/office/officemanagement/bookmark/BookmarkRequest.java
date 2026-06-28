package com.office.officemanagement.bookmark;

import jakarta.validation.constraints.NotBlank;

public class BookmarkRequest {

    @NotBlank(message = "Bookmark name is required")
    private String name;

    @NotBlank(message = "URL is required")
    private String url;

    private String additionalInfo;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getAdditionalInfo() {
        return additionalInfo;
    }

    public void setAdditionalInfo(String additionalInfo) {
        this.additionalInfo = additionalInfo;
    }
}
