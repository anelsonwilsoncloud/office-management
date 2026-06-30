package com.office.officemanagement.learning;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TechnicalLearningRequest {

    @NotBlank(message = "Topic is required")
    private String topic;

    @NotBlank(message = "Priority is required")
    private String priority;

    @Size(max = 3000, message = "Description cannot exceed 3000 characters")
    private String description;

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
