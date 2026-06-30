package com.office.officemanagement.activity;

import jakarta.validation.constraints.NotBlank;

public class DailyActivityRequest {

    @NotBlank(message = "Activity name is required")
    private String activityName;
    private String storyNumber;
    private String storyLink;
    private Double hoursSpend;
    private Boolean highlight;
    private String description;

    public String getActivityName() {
        return activityName;
    }

    public void setActivityName(String activityName) {
        this.activityName = activityName;
    }

    public String getStoryNumber() {
        return storyNumber;
    }

    public void setStoryNumber(String storyNumber) {
        this.storyNumber = storyNumber;
    }

    public String getStoryLink() {
        return storyLink;
    }

    public void setStoryLink(String storyLink) {
        this.storyLink = storyLink;
    }

    public Double getHoursSpend() {
        return hoursSpend;
    }

    public void setHoursSpend(Double hoursSpend) {
        this.hoursSpend = hoursSpend;
    }

    public Boolean getHighlight() {
        return highlight;
    }

    public void setHighlight(Boolean highlight) {
        this.highlight = highlight;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
