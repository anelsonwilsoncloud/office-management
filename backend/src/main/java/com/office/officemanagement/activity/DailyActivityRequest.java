package com.office.officemanagement.activity;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class DailyActivityRequest {

    @NotBlank(message = "Activity name is required")
    private String activityName;
    private String storyNumber;
    private String team;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double hoursSpend;
    private Boolean highlight;
    private Boolean paused;
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

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
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

    public Boolean getPaused() {
        return paused;
    }

    public void setPaused(Boolean paused) {
        this.paused = paused;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
